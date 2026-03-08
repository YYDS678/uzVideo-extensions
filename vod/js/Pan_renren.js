//@name:[盘] 人人电影网
//@version:3
//@webSite:https://www.rrdynb.com
//@remark: 🙀是白猫呀！！！
//@order:A24
//@codeID:
//@env:
//@isAV:0
//@deprecated:0

const appConfig = {
  _webSite: 'https://www.rrdynb.com',
  /**
   * 网站主页,uz 调用每个函数前都会进行赋值操作
   * 如果不想被改变 请自定义一个变量
   */
  get webSite() {
    return this._webSite
  },
  set webSite(value) {
    this._webSite = value
  },

  _uzTag: '',
  /**
   * 扩展标识,初次加载时,uz 会自动赋值,请勿修改
   */
  get uzTag() {
    return this._uzTag
  },
  set uzTag(value) {
    this._uzTag = value
  },
}

// 全局变量
let hasShownWelcome = false

/**
 * 清理搜索高亮标签
 * 例如：<font color='red'>剑来</font> 第二季 => 剑来 第二季
 */
function cleanSearchTitle(text) {
  return (text || '')
    .replace(/<font color='red'>/g, '')
    .replace(/<\/font>/g, '')
    .trim()
}

/**
 * 标题清洗（兼容《》/「」）
 */
function normalizeTitle(rawTitle) {
  const cleaned = cleanSearchTitle(rawTitle || '')
  const match = cleaned.match(/《(.*?)》|「(.*?)」/)
  return (match ? (match[1] || match[2]) : cleaned).trim()
}

/**
 * 获取分类列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
  var backData = new RepVideoClassList()
  try {
    if (!hasShownWelcome) {
      hasShownWelcome = true
      toast('🙀白猫出品,三无产品！！！', 3)
    }

    // 保持原始分类数据，不新增
    backData.data = [
      {
        type_id: 'movie/list_2',
        type_name: '电影',
        hasSubclass: false,
      },
      {
        type_id: 'dianshiju/list_6',
        type_name: '电视剧',
        hasSubclass: false,
      },
      {
        type_id: 'dongman/list_13',
        type_name: '动漫',
        hasSubclass: false,
      },
      {
        type_id: '/zongyi/list_10',
        type_name: '老电影',
        hasSubclass: false,
      },
    ]
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * 翻页格式: /movie/list_2_2.html
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
  var backData = new RepVideoList()
  try {
    const page = args.page || 1
    const classPath = (args.url || '').replace(/^\/+/, '') // 避免双斜杠
    const url = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/${classPath}_${page}.html`

    const pro = await req(url)
    backData.error = pro.error

    const $ = cheerio.load(pro.data || '')
    const vodItems = $('#movielist li')

    vodItems.each((_, e) => {
      let videoDet = new VideoDetail()
      const $intro = $(e).find('.intro')
      const $link = $intro.find('h2 a').first()

      // 链接
      videoDet.vod_id = $link.attr('href') || ''

      // 标题
      const rawTitle = $link.attr('title') || $link.text() || ''
      videoDet.vod_name = normalizeTitle(rawTitle)

      // 图片
      videoDet.vod_pic =
        $(e).find('.pure-img').attr('data-original') ||
        $(e).find('.pure-img').attr('src') ||
        ''

      // 备注/评分
      videoDet.vod_remarks = ($(e).find('.dou b').text() || '').trim()

      if (videoDet.vod_id && videoDet.vod_name) {
        backData.data.push(videoDet)
      }
    })
  } catch (error) {
    backData.error = '获取列表失败: ' + error
  }
  return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoDetail())>}
 */
async function getVideoDetail(args) {
  var backData = new RepVideoDetail()
  try {
    let webUrl = combineUrl(args.url)
    let pro = await req(webUrl)

    backData.error = pro.error
    let proData = pro.data
    if (proData) {
      const $ = cheerio.load(proData)
      let vodDetail = new VideoDetail()
      vodDetail.vod_id = args.url

      // 标题
      vodDetail.vod_name = $('.movie-des h1').text().trim() || ''

      // 图片
      vodDetail.vod_pic = $('.movie-img img').attr('src') || ''

      // 详情
      let $txtDiv = $('.movie-txt')
      vodDetail.vod_content = $txtDiv.text().trim() || ''

      // 网盘链接（保留原逻辑）
      const panUrls = []
      let links = $txtDiv.find('a')
      links.each((_, el) => {
        let href = $(el).attr('href')
        if (href && !href.includes('xunlei') && !href.includes('aliyun')) {
          panUrls.push(href)
        }
      })

      vodDetail.panUrls = panUrls
      backData.data = vodDetail
    }
  } catch (error) {
    backData.error = '获取视频详情失败: ' + error
  }

  return JSON.stringify(backData)
}

/**
 * 获取视频播放地址 (网盘类通常不需要此步骤)
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
  var backData = new RepVideoPlayUrl()
  return JSON.stringify(backData)
}

/**
 * 搜索视频
 * URL: /plus/search.php?q=xx&pagesize=10&submit=
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
  var backData = new RepVideoList()
  try {
    let searchUrl = combineUrl(
      `/plus/search.php?q=${encodeURIComponent(args.searchWord || '')}&pagesize=10&submit=`
    )

    // 原站点翻页参数尝试
    if ((args.page || 1) > 1) {
      searchUrl += `&PageNo=${args.page}`
    }

    let repData = await req(searchUrl)
    backData.error = repData.error

    const $ = cheerio.load(repData.data || '')

    // 搜索结构优先 + 兜底
    let items = $('#movielist li.pure-g.shadow')
    if (items.length === 0) {
      items = $('#movielist li')
    }

    items.each((_, item) => {
      let video = new VideoDetail()
      let $intro = $(item).find('.intro')
      let $link = $intro.find('h2 a').first()

      // 链接
      video.vod_id = $link.attr('href') || ''

      // 标题（重点：replace 去除 <font color='red'> 和 </font>）
      let rawTitle = $link.attr('title') || $link.html() || $link.text() || ''
      rawTitle = rawTitle
        .replace(/<font color='red'>/g, '')
        .replace(/<\/font>/g, '')
      video.vod_name = normalizeTitle(rawTitle)

      // 图片
      video.vod_pic =
        $(item).find('.pure-u-5-24 img').attr('data-original') ||
        $(item).find('.pure-u-5-24 img').attr('src') ||
        ''

      // 备注/评分
      let score = $(item).find('.dou b').text()
      video.vod_remarks = (score || '').trim()

      if (video.vod_id && video.vod_name) {
        backData.data.push(video)
      }
    })
  } catch (error) {
    backData.error = '搜索失败: ' + error
  }
  return JSON.stringify(backData)
}

function combineUrl(url) {
  if (url === undefined || url === null) {
    return ''
  }
  if (url.indexOf(appConfig.webSite) !== -1) {
    return url
  }
  if (url.startsWith('http')) {
    return url
  }
  if (url.startsWith('/')) {
    return appConfig.webSite + url
  }
  return appConfig.webSite + '/' + url
}