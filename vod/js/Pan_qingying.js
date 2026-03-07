//@name:[盘] 清影
//@version:3
//@webSite:http://www.revohd.com
//@remark: 🙀是白猫呀！！！
//@order:A03
//@codeID:
//@env:
//@isAV:0
//@deprecated:0

const appConfig = {
  _webSite: 'http://www.revohd.com',
  /**
   * 网站主页, uz 调用每个函数前都会进行赋值操作
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
 * 异步获取分类列表的方法。
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

    // 保持原始数据，不新增分类
    backData.data = [
      { type_id: '1', type_name: '电影', hasSubclass: false },
      { type_id: '2', type_name: '剧集', hasSubclass: false },
      { type_id: '3', type_name: '娱乐', hasSubclass: false },
      { type_id: '5', type_name: '动漫', hasSubclass: false },
    ]
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}


/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
  var backData = new RepVideoList()
  try {
    const classId = args.url || ''
    const page = args.page || 1
    const searchUrl = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/vod/show/id/${classId}/page/${page}.html`

    let repData = await req(searchUrl)
    backData.error = repData.error

    const $ = cheerio.load(repData.data || '')
    let vodItems = $('.module-items .module-item')

    vodItems.each((_, e) => {
      let videoDet = new VideoDetail()

      // 链接
      const link = $(e).find('.module-item-pic a').attr('href') || ''
      videoDet.vod_id = link

      // 名称
      videoDet.vod_name =
        $(e).find('.module-item-pic img').attr('alt') ||
        $(e).find('.module-item-titlebox a').attr('title') ||
        $(e).find('.module-item-pic a').attr('title') ||
        ''

      // 图片
      const pic =
        $(e).find('.module-item-pic img').attr('data-src') ||
        $(e).find('.module-item-pic img').attr('src') ||
        ''
      videoDet.vod_pic = pic ? UZUtils.removeTrailingSlash(appConfig.webSite) + pic : ''

      // 备注/评分
      videoDet.vod_remarks = ($(e).find('.module-item-caption span').first().text() || '').trim()

      backData.data.push(videoDet)
    })
  } catch (error) {
    backData.error = '获取视频列表失败: ' + error
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

      // 名称
      vodDetail.vod_name = $('.page-title a').text().trim() || ''

      // 图片
      const detailPic =
        $('.module-item-pic img').attr('data-src') ||
        $('.module-item-pic img').attr('src') ||
        ''
      vodDetail.vod_pic = detailPic ? UZUtils.removeTrailingSlash(appConfig.webSite) + detailPic : ''

      // 详情字段
      $('.video-info-items').each((_, item) => {
        const title =
          $(item).find('.video-info-itemtitle').text().trim() ||
          $(item).find('.video-info-item[title]').text().trim()
        const value = $(item).find('.video-info-item').last().text().trim()

        if (title.includes('导演')) {
          vodDetail.vod_director = $(item)
            .find('a')
            .map((i, el) => $(el).text().trim())
            .get()
            .join(', ')
        } else if (title.includes('主演')) {
          vodDetail.vod_actor = $(item)
            .find('a')
            .map((i, el) => $(el).text().trim())
            .get()
            .join(', ')
        } else if (title.includes('年代') || title.includes('上映')) {
          const yearMatch = value.match(/\d{4}/)
          if (yearMatch) vodDetail.vod_year = yearMatch[0]
        } else if (title.includes('评分')) {
          vodDetail.vod_remarks = $(item).find('font').text().trim() || value
        }
      })

      // 简介
      vodDetail.vod_content = $('.video-info-content span').text().trim() || ''

      // 网盘链接（保持原逻辑）
      const panUrls = []
      $('.module-row-title p').each((_, el) => {
        const url = $(el).text().trim()
        if (url) panUrls.push(url)
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
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
  var backData = new RepVideoPlayUrl()
  return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
  var backData = new RepVideoList()
  try {
    const page = args.page || 1
    let searchUrl = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/vodsearch/-------------.html?wd=${encodeURIComponent(args.searchWord)}`
    if (page > 1) {
      searchUrl += `&page=${page}`
    }

    let repData = await req(searchUrl)
    backData.error = repData.error

    const $ = cheerio.load(repData.data || '')

    // 保持原策略：多选择器兜底
    let items = $('.module-search-item, .module-item')
    if (items.length === 0) {
      items = $('.module-items .module-item, .vod-item, .video-item')
    }

    items.each((_, item) => {
      let video = new VideoDetail()

      // 链接
      const link = $(item).find('a').first().attr('href') || ''
      video.vod_id = link

      // 名称
      video.vod_name =
        $(item).find('.video-info h3 a').attr('title') ||
        $(item).find('.module-item-pic img').attr('alt') ||
        $(item).find('a[title]').first().attr('title') ||
        ''

      // 图片（修复为 item 作用域）
      const pic =
        $(item).find('.module-item-pic img').attr('data-src') ||
        $(item).find('.module-item-pic img').attr('data-original') ||
        $(item).find('.module-item-pic img').attr('src') ||
        ''
      video.vod_pic = pic ? UZUtils.removeTrailingSlash(appConfig.webSite) + pic : ''

      // 备注
      video.vod_remarks =
        ($(item).find('.module-item-caption span').first().text() ||
          $(item).find('.module-item-note').text() ||
          '').trim()

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