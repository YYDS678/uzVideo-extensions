//@name:[直] LibVio
//@version:3
//@webSite:https://libvio.mov/
//@remark: 🙀是白猫呀！！！
//@order:B
//@codeID:
//@env:
//@isAV:0
//@deprecated:0

const appConfig = {
  _webSite: 'https://libvio.mov/',
  get webSite() {
    return this._webSite
  },
  set webSite(value) {
    this._webSite = value
  },

  _uzTag: '',
  get uzTag() {
    return this._uzTag
  },
  set uzTag(value) {
    this._uzTag = value
  },
}

/** 通用：去掉末尾斜杠（高复用） */
function removeTrailingSlash(url) {
  return (url || '').replace(/\/+$/, '')
}

/** 通用：列表卡片解析（分类列表/搜索复用） */
function parseVideoCard($, element) {
  const $item = $(element)
  const $detailLink = $item.find('a[href*="/detail/"]').first()
  if ($detailLink.length === 0) return null

  const href = $detailLink.attr('href') || ''
  const idMatch = href.match(/\/detail\/(\d+)\.html/i)
  if (!idMatch || !idMatch[1]) return null

  const vodName = ($item.find('h4.title a').first().text() || '').trim()
  if (!vodName) return null

  const video = new VideoDetail()
  video.vod_id = idMatch[1]
  video.vod_name = vodName

  const pic = $item.find('a.stui-vodlist__thumb').first().attr('data-original') || ''
  video.vod_pic = pic.startsWith('//') ? `https:${pic}` : pic

  const remark = ($item.find('.pic-text').first().text() || '').trim()
  const score = ($item.find('.pic-tag').first().text() || '').trim()
  video.vod_remarks = score && score !== '0.0' ? `${remark} ${score}`.trim() : remark

  return video
}

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
  var backData = new RepVideoClassList()
  try {
    backData.data = [
      { type_id: '1', type_name: '电影', hasSubclass: false },
      { type_id: '2', type_name: '剧集', hasSubclass: false },
      { type_id: '3', type_name: '综艺', hasSubclass: false },
      { type_id: '4', type_name: '动漫', hasSubclass: false },
    ]
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
  var backData = new RepVideoSubclassList()
  try {
    // 站点无二级筛选
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
    const categoryId = args.url || ''
    const page = args.page || 1
    const url = `${removeTrailingSlash(appConfig.webSite)}/type/${categoryId}-${page}.html`

    const response = await req(url)
    backData.error = response.error

    const $ = cheerio.load(response.data || '')
    $('ul li').each((_, element) => {
      const video = parseVideoCard($, element)
      if (video) backData.data.push(video)
    })
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
 * 获取二级分类视频列表 或 筛选视频列表
 * @param {UZSubclassVideoListArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getSubclassVideoList(args) {
  var backData = new RepVideoList()
  try {
    // 站点无二级筛选
  } catch (error) {
    backData.error = error.toString()
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
    const videoId = args.url || ''
    const url = `${removeTrailingSlash(appConfig.webSite)}/detail/${videoId}.html`
    const response = await req(url)
    backData.error = response.error

    const $ = cheerio.load(response.data || '')
    const video = new VideoDetail()
    video.vod_id = videoId
    video.vod_name = ($('h1.title').text() || '').trim()

    const $mainImg = $('.stui-content__thumb img').first()
    const pic = $mainImg.attr('data-original') || $mainImg.attr('src') || ''
    if (pic && !pic.includes('load.png')) {
      if (pic.startsWith('//')) video.vod_pic = `https:${pic}`
      else if (pic.startsWith('/')) video.vod_pic = `${removeTrailingSlash(appConfig.webSite)}${pic}`
      else video.vod_pic = pic
    }

    $('p.data').each((_, element) => {
      const text = $(element).text() || ''
      if (text.includes('主演:')) {
        const match = text.match(/主演:([^\/]+).*导演:(.+)/)
        if (match) {
          video.vod_actor = (match[1] || '').trim()
          video.vod_director = (match[2] || '').trim()
        }
      }
    })

    const content = ($('.desc.detail .detail-content').first().text() || '').trim()
    const sketch = ($('.desc.detail .detail-sketch').first().text() || '').trim()
    video.vod_content = content || sketch

    const playFromList = []
    const playUrlList = []

    $('.stui-vodlist__head').each((_, element) => {
      const $head = $(element)
      const rawName = ($head.find('h3').first().text() || '').trim()
      if (!rawName) return

      const upper = rawName.toUpperCase()
      const isBlocked =
        upper.includes('下载'.toUpperCase()) ||
        upper.includes('UC') ||
        upper.includes('夸克'.toUpperCase()) ||
        upper.includes('网盘'.toUpperCase()) ||
        upper.includes('百度'.toUpperCase()) ||
        upper.includes('115')

      const fromName = isBlocked ? `❌ ${rawName}` : rawName
      const episodes = []

      $head.find('.stui-content__playlist li a[href*="/play/"]').each((__, a) => {
        const $a = $(a)
        const epName = ($a.text() || '').trim()
        const href = $a.attr('href') || ''
        if (epName && href) episodes.push(`${epName}$${href}`)
      })

      if (episodes.length > 0) {
        playFromList.push(fromName)
        playUrlList.push(episodes.join('#'))
      }
    })

    video.vod_play_from = playFromList.join('$$$')
    video.vod_play_url = playUrlList.join('$$$')
    backData.data = video
  } catch (error) {
    backData.error = error.toString()
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
  try {
    // 内联：构建播放页绝对地址
    const inputUrl = (args.url || '').trim()
    let fullUrl = ''
    if (inputUrl.startsWith('http')) fullUrl = inputUrl
    else if (inputUrl.startsWith('/')) fullUrl = removeTrailingSlash(appConfig.webSite) + inputUrl
    else fullUrl = `${removeTrailingSlash(appConfig.webSite)}/${inputUrl}`

    const fromName = ((args.from || args.flag || '') + '').toUpperCase()

    // 内联：请求头
    const headers = {
      Referer: fullUrl || appConfig.webSite,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    }

    // 1) 取播放页并解析 player_aaaa
    const playResp = await req(fullUrl, { headers })
    const html = playResp.data || ''

    const match =
      html.match(/var\s+player_aaaa\s*=\s*(\{[\s\S]*?\})\s*;/i) ||
      html.match(/var\s+player_aaaa\s*=\s*(\{[\s\S]*?\})\s*<\/script>/i) ||
      html.match(/player_aaaa\s*=\s*(\{[\s\S]*?\})\s*;/i)

    if (!match || !match[1]) {
      backData.error = 'player_aaaa 解析失败'
      return JSON.stringify(backData)
    }

    let player = null
    const raw = match[1].trim()

    // 优先标准 JSON，失败后做轻量规范化（不使用 Function/eval）
    try {
      player = JSON.parse(raw)
    } catch (_) {
      const normalized = raw
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, (m, p1) => `:"${p1.replace(/"/g, '\\"')}"`)
        .replace(/,\s*}/g, '}')
      player = JSON.parse(normalized)
    }

    let finalUrl = player.url || ''

    // 2) 按线路走代理解析
    if (fromName.includes('BD5') || fromName.includes('BD') || fromName.includes('HD5')) {
      let proxyPath = ''
      let varNames = []

      if (fromName.includes('BD5')) {
        proxyPath = '/vid/plyr/vr2.php'
        varNames = ['urls', 'url', 'vid']
      } else if (fromName.includes('BD')) {
        proxyPath = '/vid/ty4.php'
        varNames = ['vid', 'url', 'urls']
      } else {
        proxyPath = '/vid/yd.php'
        varNames = ['vid', 'url', 'urls']
      }

      const proxyUrl =
        `${removeTrailingSlash(appConfig.webSite)}${proxyPath}` +
        `?url=${encodeURIComponent(player.url || '')}` +
        `&next=${encodeURIComponent(player.link_next || '')}` +
        `&id=${encodeURIComponent(player.id || '')}` +
        `&nid=${encodeURIComponent(player.nid || '')}`

      const proxyResp = await req(proxyUrl, { headers })
      const jsText = proxyResp.data || ''

      // 内联：从 js 变量中提取直链
      for (const name of varNames) {
        const reg = new RegExp(`(?:var|let|const)\\s+${name}\\s*=\\s*["']([^"']+)["']`, 'i')
        const m = jsText.match(reg)
        if (m && m[1]) {
          finalUrl = m[1].replace(/\\\//g, '/').replace(/\\\\/g, '\\')
          break
        }
      }
    }

    backData.url = finalUrl
    backData.headers = headers
  } catch (error) {
    backData.error = error.toString()
  }
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
    const searchKey = encodeURIComponent(args.searchWord || '')
    const page = args.page || 1
    const url = `${removeTrailingSlash(appConfig.webSite)}/search/${searchKey}----------${page}---.html`

    const response = await req(url)
    backData.error = response.error

    const $ = cheerio.load(response.data || '')
    $('ul li').each((_, element) => {
      const video = parseVideoCard($, element)
      if (video) backData.data.push(video)
    })
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}