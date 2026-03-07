//@name:[盘] 319影社
//@version:3
//@webSite:https://www.319312.com
//@remark: 🙀是白猫呀！！！
//@order:A05
//@codeID:
//@env:
//@isAV:0
//@deprecated:0

const appConfig = {
  _webSite: 'https://www.319312.com',
  /**
   * 网站主页,uz 调用每个函数前都会进行赋值操作
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
   * 用于读取环境变量
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

function showWelcomeOnce() {
  if (!hasShownWelcome) {
    hasShownWelcome = true
    toast('🙀白猫出品,三无产品！！！', 3)
  }
}

function parseListItems($) {
  const videos = []
  const vodItems = $('.container .list-item')

  vodItems.each((_, e) => {
    const videoDet = new VideoDetail()

    const linkTag = $(e).find('a.list-goto')
    const rawTitle = linkTag.attr('title') || ''
    videoDet.vod_id = linkTag.attr('href') || ''

    const titleMatch = rawTitle.match(/《(.*?)》/)
    videoDet.vod_name = titleMatch && titleMatch[1] ? titleMatch[1] : rawTitle

    const styleContent = $(e).find('.media-content').attr('style') || ''
    const urlMatch = styleContent.match(/url\(['"]?(.*?)['"]?\)/)
    if (urlMatch && urlMatch[1]) {
      videoDet.vod_pic = urlMatch[1]
    }

    videos.push(videoDet)
  })

  return videos
}

/**
 * 获取分类列表
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
  const backData = new RepVideoClassList()
  try {
    showWelcomeOnce()
    backData.data = [
      { type_id: 'zuixin', type_name: '最新', hasSubclass: false },
      { type_id: 'hwjuji/meiju', type_name: '欧美剧', hasSubclass: false },
      { type_id: 'hwjuji/hanju', type_name: '韩剧', hasSubclass: false },
      { type_id: 'hwjuji/riju', type_name: '日剧', hasSubclass: false },
      { type_id: 'hwjuji/taiju', type_name: '泰剧', hasSubclass: false },
      { type_id: 'hwjuji', type_name: '海外剧集', hasSubclass: false },
      { type_id: 'juqing', type_name: '剧情爱情', hasSubclass: false },
      { type_id: 'xuanyi', type_name: '动作悬疑', hasSubclass: false },
      { type_id: 'jingsong', type_name: '惊悚恐怖', hasSubclass: false },
      { type_id: 'dongman', type_name: '动漫动画', hasSubclass: false },
      { type_id: 'jingdian', type_name: '豆瓣高分影片', hasSubclass: false },
      { type_id: 'lishi', type_name: '历史传记', hasSubclass: false },
      { type_id: 'khzn', type_name: '科幻灾难', hasSubclass: false },
      { type_id: 'zongyi', type_name: '综艺', hasSubclass: false },
      { type_id: 'jilupian', type_name: '纪录片', hasSubclass: false },
    ]
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
 * 获取子分类列表（无二级筛选数据）
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
  const backData = new RepVideoSubclassList()
  backData.data = new VideoSubclass()
  try {
    backData.data.filter = []
  } catch (error) {
    backData.error = '获取分类失败~ ' + error
  }
  return JSON.stringify(backData)
}

/**
 * 获取子分类视频列表（按主分类返回）
 * @param {UZSubclassVideoListArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoList())>}
 */
async function getSubclassVideoList(args) {
  const backData = new RepVideoList()
  try {
    const classPath = args.mainClassId || args.url || 'zuixin'
    const page = args.page || 1

    let url = combineUrl(classPath)
    if (page > 1) {
      url += `/page/${page}`
    }

    const pro = await req(url)
    backData.error = pro.error

    if (pro.data) {
      const $ = cheerio.load(pro.data)
      backData.data = parseListItems($)
    }
  } catch (error) {
    backData.error = '获取筛选视频列表失败: ' + error
  }
  return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
  const backData = new RepVideoList()
  try {
    const classPath = args.url || 'zuixin'
    const page = args.page || 1

    let url = combineUrl(classPath)
    if (page > 1) {
      url += `/page/${page}`
    }

    const pro = await req(url)
    backData.error = pro.error

    if (pro.data) {
      const $ = cheerio.load(pro.data)
      backData.data = parseListItems($)
    }
  } catch (error) {
    backData.error = '获取分类视频列表失败: ' + error
  }
  return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoDetail())>}
 */
async function getVideoDetail(args) {
  const backData = new RepVideoDetail()
  try {
    let webUrl = args.url || ''
    if (!webUrl.startsWith('http')) {
      webUrl = combineUrl(webUrl)
    }

    const pro = await req(webUrl)
    backData.error = pro.error

    if (pro.data) {
      const $ = cheerio.load(pro.data)
      const vodDetail = new VideoDetail()
      vodDetail.vod_id = webUrl

      const pageTitle = $('head title').text() || ''
      const titleMatch = pageTitle.match(/《(.*?)》/)
      vodDetail.vod_name = titleMatch && titleMatch[1] ? titleMatch[1] : pageTitle

      vodDetail.vod_pic = $('.post-content img:eq(-1)').attr('src') || ''

      const infoItems = $('.post-content ul li')
      infoItems.each((_, item) => {
        const text = $(item).text() || ''
        if (text.includes('年代')) {
          vodDetail.vod_year = text.replace('年代', '').replace(/[：:]/, '').trim()
        } else if (text.includes('导演')) {
          vodDetail.vod_director = text.replace('导演', '').replace(/[：:]/, '').trim()
        } else if (text.includes('主演')) {
          vodDetail.vod_actor = text.replace('主演', '').replace(/[：:]/, '').trim()
        } else if (text.includes('类型')) {
          vodDetail.type_name = text.replace('类型', '').replace(/[：:]/, '').trim()
        }
      })

      const plotHeader = $('.post-content h2').filter((i, el) => $(el).text().includes('核心剧情'))
      if (plotHeader.length > 0) {
        const nextH2 = plotHeader.nextAll('h2').first()
        const paragraphs = plotHeader.nextUntil(nextH2, 'p')

        const plotContent = []
        paragraphs.each((index, el) => {
          if (index < 2) {
            const text = $(el).text().trim()
            if (text) {
              plotContent.push(text)
            }
          }
        })

        vodDetail.vod_content = plotContent.join('\n')
        if (!vodDetail.vod_content) {
          vodDetail.vod_content = ($('.post-content').text() || '').substring(0, 200) + '...'
        }
      } else {
        vodDetail.vod_content = ($('.post-content').text() || '').substring(0, 200) + '...'
      }

      const panUrls = []
      $('.post-content a').each((_, el) => {
        const href = $(el).attr('href')
        if (href && href.includes('pan.quark.cn')) {
          panUrls.push(href)
        }
      })

      vodDetail.panUrls = [...new Set(panUrls)]
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
 * @returns {Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
  const backData = new RepVideoPlayUrl()
  if (args.url) {
    backData.data = args.url
  }
  return JSON.stringify(backData)
}

/**
 * 搜索视频
 * 搜索URL格式: https://www.319312.com/?s=关键词
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
  const backData = new RepVideoList()
  try {
    const keyword = args.searchWord || ''
    const page = args.page || 1

    let searchUrl = appConfig.webSite + `/?s=${encodeURIComponent(keyword)}`
    if (page > 1) {
      searchUrl = appConfig.webSite + `/page/${page}/?s=${encodeURIComponent(keyword)}`
    }

    const repData = await req(searchUrl)
    backData.error = repData.error

    const $ = cheerio.load(repData.data || '')
    const vodItems = $('.container .list-item')

    vodItems.each((_, e) => {
      const videoDet = new VideoDetail()

      const linkTag = $(e).find('a.list-title')
      const rawTitle = (linkTag.text() || '').trim()
      videoDet.vod_id = linkTag.attr('href') || ''

      const titleMatch = rawTitle.match(/《(.*?)》/)
      videoDet.vod_name = titleMatch && titleMatch[1] ? titleMatch[1] : rawTitle

      const styleContent = $(e).find('.media-content').attr('style') || ''
      const urlMatch = styleContent.match(/url\(['"]?(.*?)['"]?\)/)
      if (urlMatch && urlMatch[1]) {
        videoDet.vod_pic = urlMatch[1]
      }

      backData.data.push(videoDet)
    })
  } catch (error) {
    backData.error = '搜索失败: ' + error
  }

  return JSON.stringify(backData)
}

/**
 * URL组合函数
 */
function combineUrl(url) {
  if (url === undefined || url === null) return ''
  if (url.indexOf(appConfig.webSite) !== -1) return url
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return appConfig.webSite + url
  return appConfig.webSite + '/' + url
}