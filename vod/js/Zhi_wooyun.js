//@name:乌云影视
//@version:3
//@webSite:https://wooyun.tv
//@remark: 🙀是白猫呀！！！
//@order:A06
//@codeID:
//@env:
//@isAV:0
//@deprecated:0

const appConfig = {
  _webSite: 'https://wooyun.tv',
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

/** 全局请求头（统一复用） */
function getHeaders() {
  return {
    Referer: appConfig.webSite,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  }
}

function parseJson(data) {
  if (!data) return {}
  if (typeof data === 'object') return data
  return JSON.parse(data)
}

function mapTopCode(classId) {
  const id = String(classId || '1')
  if (id === '1') return 'movie'
  if (id === '2') return 'tv_series'
  if (id === '3') return 'variety'
  if (id === '4') return 'animation'
  if (id === '72') return 'short_drama'
  if (id === '5') return 'concert'
  if (id === '53') return 'documentary'
  return 'movie'
}

async function postMediaSearch(payload) {
  const url = `${appConfig.webSite}/api/proxy?url=%2Fmovie%2Fmedia%2Fsearch`
  const body = JSON.stringify(payload)
  return await req(url, {
    method: 'POST',
    headers: getHeaders(),
    data: body,
    body: body,
  })
}

async function getMediaVideoList(mediaId) {
  const path = `/movie/media/video/list?mediaId=${encodeURIComponent(mediaId)}&lineName=&resolutionCode=`
  const url = `${appConfig.webSite}/api/proxy?url=${encodeURIComponent(path)}`
  return await req(url, { headers: getHeaders() })
}

// 全局变量
let hasShownWelcome = false

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoClassList())}
 */
async function getClassList(args) {
  var backData = new RepVideoClassList()
  try {

    if (!hasShownWelcome) {
      hasShownWelcome = true
      toast('🙀白猫出品,三无产品!!!', 3)
    }

    backData.data = [
      { type_id: '1', type_name: '电影', hasSubclass: true },
      { type_id: '2', type_name: '电视剧', hasSubclass: true },
      { type_id: '3', type_name: '综艺', hasSubclass: true },
      { type_id: '4', type_name: '动漫', hasSubclass: true },
      { type_id: '72', type_name: '短剧', hasSubclass: true },
      { type_id: '5', type_name: '演唱会', hasSubclass: true },
      { type_id: '53', type_name: '纪录片', hasSubclass: true },
    ]
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoSubclassList())}
 */
async function getSubclassList(args) {
  var backData = new RepVideoSubclassList()
  backData.data = new VideoSubclass()
  try {
    backData.data.filter = [
      {
        name: '类型',
        list: [
          { name: '全部', id: '' },
          { name: '动作', id: 'action' },
          { name: '喜剧', id: 'comedy' },
          { name: '剧情', id: 'drama' },
          { name: '爱情', id: 'romance' },
          { name: '惊悚', id: 'thriller' },
          { name: '恐怖', id: 'horror' },
          { name: '科幻', id: 'sci_fi' },
          { name: '奇幻', id: 'fantasy' },
          { name: '战争', id: 'war' },
          { name: '历史', id: 'history' },
          { name: '冒险', id: 'adventure' },
          { name: '犯罪', id: 'crime' },
        ],
      },
      {
        name: '地区',
        list: [
          { name: '全部', id: '' },
          { name: '大陆', id: 'china' },
          { name: '香港', id: 'hongkong' },
          { name: '台湾', id: 'taiwan' },
          { name: '美国', id: 'usa' },
          { name: '英国', id: 'uk' },
          { name: '日本', id: 'japan' },
          { name: '韩国', id: 'korea' },
        ],
      },
      {
        name: '语言',
        list: [
          { name: '全部', id: '' },
          { name: '中文', id: 'chinese' },
          { name: '英语', id: 'english' },
          { name: '日语', id: 'japanese' },
          { name: '韩语', id: 'korean' },
          { name: '法语', id: 'french' },
          { name: '德语', id: 'german' },
          { name: '泰语', id: 'thai' },
          { name: '俄语', id: 'russian' },
        ],
      },
      {
        name: '年份',
        list: [
          { name: '全部', id: '' },
          { name: '今年', id: 'THIS_YEAR' },
          { name: '去年', id: 'LAST_YEAR' },
          { name: '更早', id: 'EARLIER' },
          { name: '2026', id: '2026' },
          { name: '2025', id: '2025' },
          { name: '2024', id: '2024' },
        ],
      },
      {
        name: '排序',
        list: [
          { name: '最新排序', id: 'newest' },
          { name: '默认排序', id: 'default' },
          { name: '人气排序', id: 'hits' },
          { name: '评分排序', id: 'score' },
        ],
      },
    ]
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoList())}
 */
async function getVideoList(args) {
  var backData = new RepVideoList()
  try {
    const topCode = mapTopCode(args.url || '1')
    const pageIndex = String(args.page || 1)

    const resp = await postMediaSearch({
      menuCodeList: [],
      pageIndex: pageIndex,
      pageSize: 24,
      searchKey: '',
      sortCode: 'default',
      topCode: topCode,
    })

    backData.error = resp.error || ''
    const json = parseJson(resp.data || '{}')
    const records = json?.data?.records || []
    backData.total = json?.data?.total || 0

    for (let i = 0; i < records.length; i++) {
      const item = records[i]
      const v = new VideoDetail()
      v.vod_id = `${topCode}|${item.id}`
      v.vod_name = item.title || ''
      v.vod_pic = item.posterUrlS3 || item.posterUrl || ''
      v.vod_remarks = item.episodeStatus || ''
      backData.data.push(v)
    }
  } catch (error) {
    backData.error = '获取分类视频列表失败: ' + error
  }
  return JSON.stringify(backData)
}

/**
 * 获取二级分类视频列表 或 筛选视频列表
 * @param {UZSubclassVideoListArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoList())}
 */
async function getSubclassVideoList(args) {
  var backData = new RepVideoList()
  try {
    const topCode = mapTopCode(args.mainClassId || args.url || '1')
    const pageIndex = String(args.page || 1)

    // 固定5项：类型/地区/语言/年份/排序
    const genre = args.filter[0].id || ''
    const region = args.filter[1].id || ''
    const language = args.filter[2].id || ''
    const year = args.filter[3].id || ''
    const sortCode = args.filter[4].id || 'newest'

    const menuCodeList = []
    if (genre) menuCodeList.push(genre)
    if (region) menuCodeList.push(region)
    if (language) menuCodeList.push(language)
    if (year) menuCodeList.push(year)

    const resp = await postMediaSearch({
      menuCodeList: menuCodeList,
      pageIndex: pageIndex,
      pageSize: 24,
      searchKey: '',
      sortCode: sortCode,
      topCode: topCode,
    })

    backData.error = resp.error || ''
    const json = parseJson(resp.data || '{}')
    const records = json?.data?.records || []
    backData.total = json?.data?.total || 0

    for (let i = 0; i < records.length; i++) {
      const item = records[i]
      const v = new VideoDetail()
      v.vod_id = `${topCode}|${item.id}`
      v.vod_name = item.title || ''
      v.vod_pic = item.posterUrlS3 || item.posterUrl || ''
      v.vod_remarks = item.episodeStatus || ''
      backData.data.push(v)
    }
  } catch (error) {
    backData.error = '获取筛选视频列表失败: ' + error
  }
  return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoDetail())}
 */
async function getVideoDetail(args) {
  var backData = new RepVideoDetail()
  try {
    const raw = String(args.url || '')
    const parts = raw.split('|')
    const topCode = parts[0] || 'movie'
    const mediaId = parts[1] || ''
    const vod = new VideoDetail()

    vod.vod_id = `${topCode}|${mediaId}`
    vod.vod_play_from = '线路1'

    // 详情页基础信息
    const detailUrl = `${appConfig.webSite}/${topCode}/${mediaId}`
    const detailResp = await req(detailUrl, { headers: getHeaders() })
    const html = detailResp.data || ''
    const $ = cheerio.load(html)

    vod.vod_name =
      ($('h4.text-fs-xl').first().text() || '').trim() ||
      ($('h1').first().text() || '').trim() ||
      ''
    vod.vod_pic =
      $('div.w-54 img').first().attr('src') ||
      $('img').first().attr('src') ||
      ''
    vod.vod_content = ($('div.mt-5.pr-1').first().text() || '').trim()

    // 剧集列表（详情仅给 token）
    const listResp = await getMediaVideoList(mediaId)
    const listJson = parseJson(listResp.data || '{}')
    const seasons = listJson.data || []

    const epArr = []
    for (let i = 0; i < seasons.length; i++) {
      const videoList = seasons[i].videoList || []
      for (let j = 0; j < videoList.length; j++) {
        const ep = videoList[j]
        const epName = ep.remark || `第${ep.epNo || 1}集`
        const token = `wooyun://play?mediaId=${encodeURIComponent(mediaId)}&videoId=${encodeURIComponent(ep.id)}`
        epArr.push(`${epName}$${token}`)
      }
    }
    vod.vod_play_url = epArr.join('#')

    backData.data = vod
  } catch (error) {
    backData.error = '获取视频详情失败: ' + error
  }
  return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoPlayUrl())}
 */
async function getVideoPlayUrl(args) {
  var backData = new RepVideoPlayUrl()
  try {
    const input = String(args.url || '')

    if (!input.startsWith('wooyun://play?')) {
      backData.url = input
      backData.headers = getHeaders()
      return JSON.stringify(backData)
    }

    // token 解析
    let mediaId = ''
    let videoId = ''
    const query = input.split('?')[1] || ''
    const pairs = query.split('&')
    for (let i = 0; i < pairs.length; i++) {
      const kv = pairs[i]
      const idx = kv.indexOf('=')
      if (idx > -1) {
        const k = kv.substring(0, idx)
        const v = decodeURIComponent(kv.substring(idx + 1) || '')
        if (k === 'mediaId') mediaId = v
        if (k === 'videoId') videoId = v
      }
    }

    // 找到真实播放链接
    const listResp = await getMediaVideoList(mediaId)
    const listJson = parseJson(listResp.data || '{}')
    const seasons = listJson.data || []

    let rawPlayUrl = ''
    for (let i = 0; i < seasons.length; i++) {
      const videoList = seasons[i].videoList || []
      for (let j = 0; j < videoList.length; j++) {
        const ep = videoList[j]
        if (String(ep.id) === String(videoId)) {
          rawPlayUrl = ep.playUrl || ''
          break
        }
      }
      if (rawPlayUrl) break
    }

    // 仅 302 且有 Location 时拼接
    let finalUrl = rawPlayUrl
    if (rawPlayUrl) {
      const originMatch = rawPlayUrl.match(/^https?:\/\/[^/]+/i)
      const origin = originMatch ? originMatch[0] : ''

      const jumpResp = await req(rawPlayUrl, { headers: getHeaders() })
      const statusCode = Number(
        jumpResp.statusCode || jumpResp.status || jumpResp.code || jumpResp.response?.status || 0
      )
      const hs = jumpResp.headers || jumpResp.header || {}
      const location = hs.location || hs.Location || hs.LOCATION || ''

      if (statusCode === 302 && location) {
        if (/^https?:\/\//i.test(location)) finalUrl = location
        else if (location.startsWith('/')) finalUrl = origin + location
        else finalUrl = origin + '/' + location
      } else if (jumpResp.url && /^https?:\/\//i.test(jumpResp.url)) {
        finalUrl = jumpResp.url
      }
    }

    backData.url = finalUrl
    backData.headers = getHeaders()
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {Promise<JSON.stringify(new RepVideoList())}
 */
async function searchVideo(args) {
  var backData = new RepVideoList()
  try {
    const keyword = String(args.searchWord || '').trim()
    const pageIndex = String(args.page || 1)

    if (!keyword) {
      backData.data = []
      return JSON.stringify(backData)
    }

    // 搜索载荷：menuCodeList/pageIndex/pageSize/searchKey/topCode
    const resp = await postMediaSearch({
      menuCodeList: [],
      pageIndex: pageIndex,
      pageSize: 10,
      searchKey: keyword,
      topCode: '',
    })

    backData.error = resp.error || ''
    const json = parseJson(resp.data || '{}')
    const records = json?.data?.records || []
    backData.total = json?.data?.total || 0

    for (let i = 0; i < records.length; i++) {
      const item = records[i]
      const mediaTypeCode = item.mediaType.code || 'movie'
      const v = new VideoDetail()
      v.vod_id = `${mediaTypeCode}|${item.id}`
      v.vod_name = item.title || ''
      v.vod_pic = item.posterUrlS3 || item.posterUrl || ''
      v.vod_remarks = item.episodeStatus || ''
      backData.data.push(v)
    }
  } catch (error) {
    backData.error = '搜索失败: ' + error
  }
  return JSON.stringify(backData)
}