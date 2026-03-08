//@name:[盘] 奕搜
//@version:3
//@webSite:https://ysso.cc
//@remark: 🙀是白猫呀！！！
//@order:A20
//@codeID:
//@env:
//@isAV:0
//@deprecated:0

const appConfig = {
  _webSite: 'https://ysso.cc',
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
   * 用于读取环境变量
   */
  get uzTag() {
    return this._uzTag
  },
  set uzTag(value) {
    this._uzTag = value
  },
}

/**
 * 从标题文本中提取备注信息
 * 优先级: 更新集数 > 评分 > 年份
 * @param {string} titleText
 * @returns {string}
 */
function extractRemarkFromTitle(titleText) {
  if (!titleText) return ''

  const bracketContents = []
  const regex = /\[(.*?)\]/g
  let match

  while ((match = regex.exec(titleText)) !== null) {
    if (match[1]) bracketContents.push(match[1].trim())
  }

  // 1) 更新集数
  for (const content of bracketContents) {
    if (content.startsWith('更')) {
      const episodeMatch = content.match(/更\s*([0-9]+)/)
      if (episodeMatch && episodeMatch[1]) {
        return `更新至${episodeMatch[1]}集`
      }
      return content
    }
  }

  // 2) 评分
  for (const content of bracketContents) {
    if (content.endsWith('分')) {
      const score = content.replace('分', '').trim()
      if (score) return `评分:${score}`
    }
  }

  // 3) 年份
  for (const content of bracketContents) {
    if (/^\d{4}$/.test(content)) {
      return `首播:${content}`
    }
  }

  return ''
}

/**
 * 清理标题中的[]标签信息
 * @param {string} title
 * @returns {string}
 */
function cleanTitleText(title) {
  if (!title) return ''
  return title.replace(/\s*\[.*?\]/g, '').trim()
}

/**
 * 统一解析列表项
 * @param {*} $
 * @returns {VideoDetail[]}
 */
function parseListBoxes($) {
  const videos = []
  const items = $('.list-boxes')

  items.each((_, e) => {
    const video = new VideoDetail()

    const $titleLink = $(e).find('a.text_title_p').first()
    const link1 = $titleLink.attr('href') || ''
    const link2 = $(e).find('.left_ly a').first().attr('href') || ''
    video.vod_id = link1 || link2

    const originalTitle = ($titleLink.text() || '').trim()
    video.vod_name = cleanTitleText(originalTitle)

    const pic = $(e).find('img.image_left').first().attr('src') || ''
    video.vod_pic = pic ? combineUrl(pic) : ''

    video.vod_remarks = extractRemarkFromTitle(originalTitle)
    if (!video.vod_remarks) {
      video.vod_remarks = ($(e).find('.list-actions span').first().text() || '').trim()
    }

    videos.push(video)
  })

  return videos
}


// 全局变量
let hasShownWelcome = false

/**
 * 异步获取分类列表
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
  const backData = new RepVideoClassList()
  try {

    if (!hasShownWelcome) {
      hasShownWelcome = true
      toast('🙀白猫出品,三无产品！！！', 3)
    }

    backData.data = [
      { type_id: 'dy', type_name: '电影', hasSubclass: false },
      { type_id: 'dsj', type_name: '电视剧', hasSubclass: false },
      { type_id: 'zy', type_name: '综艺', hasSubclass: false },
      { type_id: 'dm', type_name: '动漫', hasSubclass: false },
      { type_id: 'jlp', type_name: '纪录片', hasSubclass: false },
      { type_id: 'dj', type_name: '短剧', hasSubclass: false },
    ]
  } catch (error) {
    backData.error = error.toString()
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
    const classId = args.url || 'dy'
    const page = args.page || 1
    const url = combineUrl(`/${classId}.html?page=${page}`)

    const repData = await req(url)
    backData.error = repData.error

    const $ = cheerio.load(repData.data || '')
    backData.data = parseListBoxes($)
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
    const webUrl = combineUrl(args.url)
    const pro = await req(webUrl)

    backData.error = pro.error
    const proData = pro.data

    if (proData) {
      const $ = cheerio.load(proData)
      const vodDetail = new VideoDetail()
      vodDetail.vod_id = args.url

      // 标题 + 图片
      const originalTitle = $('h1.articl_title').text().trim()
      vodDetail.vod_name = cleanTitleText(originalTitle)
      vodDetail.vod_remarks = extractRemarkFromTitle(originalTitle)

      const detailPic = $('.tc-box.article-box img').first().attr('src') || ''
      vodDetail.vod_pic = detailPic ? combineUrl(detailPic) : ''

      // 导演/编剧/主演
      const directorItems = []
      const actorItems = []

      $('#info > span').each((_, span) => {
        const $span = $(span)
        const key = $span.find('.pl').text().replace(/[：:]/g, '').trim()

        if (key.includes('导演') || key.includes('编剧')) {
          $span.find('.attrs a').each((_, a) => {
            const name = $(a).text().trim()
            if (name && !directorItems.includes(name)) directorItems.push(name)
          })
        } else if (key.includes('主演') || key.includes('演员')) {
          $span.find('.attrs a').each((_, a) => {
            const name = $(a).text().trim()
            if (name && !actorItems.includes(name)) actorItems.push(name)
          })
        }
      })

      vodDetail.vod_director = directorItems.join(', ')
      vodDetail.vod_actor = actorItems.join(', ')

      // 简介
      let plotText = ''
      $('p[style*="color: rgb(51, 51, 51)"]').each((_, p) => {
        const text = $(p).text().trim()
        if (text && text.length > 20) {
          plotText = text.replace(/\s+/g, ' ').trim()
          return false
        }
      })
      vodDetail.vod_content = plotText

      // 网盘链接
      const panUrls = []
      $('a[target="_blank"]').each((_, el) => {
        const href = $(el).attr('href')
        if (href && /^https?:\/\//.test(href)) {
          panUrls.push(href)
        }
      })

      // 提取码
      const bodyText = $('body').text() || ''
      const pwdMatch = bodyText.match(/提取码[：:]\s*([a-zA-Z0-9]{4})/)
      if (pwdMatch && pwdMatch[1]) {
        vodDetail.vod_remarks = (vodDetail.vod_remarks || '') + ` 提取码: ${pwdMatch[1]}`
      }

      vodDetail.panUrls = [...new Set(panUrls)]
      backData.data = vodDetail
    }
  } catch (error) {
    backData.error = '获取视频详情失败: ' + error
  }

  return JSON.stringify(backData)
}

/**
 * 获取视频播放地址
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
  const backData = new RepVideoPlayUrl()
  return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
  const backData = new RepVideoList()
  try {
    const page = args.page || 1
    const keyword = encodeURIComponent(args.searchWord || '')
    const searchUrl = combineUrl(`/search.html?keyword=${keyword}&page=${page}`)

    const repData = await req(searchUrl)
    backData.error = repData.error

    const $ = cheerio.load(repData.data || '')
    backData.data = parseListBoxes($)
  } catch (error) {
    backData.error = '搜索失败: ' + error
  }

  return JSON.stringify(backData)
}

function combineUrl(url) {
  if (url === undefined || url === null) return ''
  if (url.indexOf(appConfig.webSite) !== -1) return url
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return appConfig.webSite + url
  return appConfig.webSite + '/' + url
}