//@name:[盘] 4KTop
//@version:3
//@webSite:https://4ktop.com
//@remark: 🙀是白猫呀！！！
//@order:A04
//@codeID:
//@env:
//@isAV:0
//@deprecated:0


const appConfig = {
  _webSite: 'https://4ktop.com',
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
 * 拼接绝对地址
 * @param {string} path
 * @returns {string}
 */
function toAbsoluteUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const site = UZUtils.removeTrailingSlash(appConfig.webSite)
  return path.startsWith('/') ? `${site}${path}` : `${site}/${path}`
}

/**
 * 解析公共视频卡片列表（分类页/筛选页）
 * @param {*} $
 * @param {*} elements
 * @returns {VideoDetail[]}
 */
function parseModuleItems($, elements) {
  return elements
    .toArray()
    .map((e) => {
      const node = $(e)
      const aTag = node.find('a').first()
      const img = node.find('.module-item-pic img').first()


      const v = new VideoDetail()
      v.vod_id = aTag.attr('href') || ''
      v.vod_name = img.attr('alt') || ''
      v.topRightRemarks = node.find(".module-item-douban").text().trim()
      v.vod_pic = toAbsoluteUrl(img.attr('data-original') || img.attr('src') || '')
      v.vod_remarks = node.find('.module-item-note').text().trim()
      return v
    })
}

/**
 * 生成年份列表
 * @param {number} start
 * @param {number} end
 * @returns {{name:string,id:string}[]}
 */
function makeYearList(start, end) {
  const years = [{ name: '全部', id: '' }]
  for (let y = start; y >= end; y--) {
    years.push({ name: String(y), id: String(y) })
  }
  return years
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
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
  var backData = new RepVideoSubclassList()
  backData.data = new VideoSubclass()

  try {
    const id = String(args.url || '')

    const commonArea = [
      { name: '全部', id: '' },
      { name: '中国大陆', id: '中国大陆' },
      { name: '中国香港', id: '中国香港' },
      { name: '中国台湾', id: '中国台湾' },
      { name: '美国', id: '美国' },
      { name: '法国', id: '法国' },
      { name: '英国', id: '英国' },
      { name: '日本', id: '日本' },
      { name: '韩国', id: '韩国' },
      { name: '德国', id: '德国' },
      { name: '泰国', id: '泰国' },
      { name: '印度', id: '印度' },
      { name: '意大利', id: '意大利' },
      { name: '西班牙', id: '西班牙' },
      { name: '加拿大', id: '加拿大' },
      { name: '其他', id: '其他' },
    ]

    const commonSort = [
      { name: '时间排序', id: 'time' },
      { name: '人气排序', id: 'hits' },
      { name: '评分排序', id: 'score' },
    ]

    let filter = []

    switch (id) {
      case '1':
        filter = [
          {
            name: '剧情',
            list: [
              { name: '全部', id: '' }, { name: '喜剧', id: '喜剧' }, { name: '爱情', id: '爱情' }, { name: '动作', id: '动作' },
              { name: '科幻', id: '科幻' }, { name: '动画', id: '动画' }, { name: '悬疑', id: '悬疑' }, { name: '犯罪', id: '犯罪' },
              { name: '惊悚', id: '惊悚' }, { name: '冒险', id: '冒险' }, { name: '音乐', id: '音乐' }, { name: '历史', id: '历史' },
              { name: '奇幻', id: '奇幻' }, { name: '恐怖', id: '恐怖' }, { name: '战争', id: '战争' }, { name: '传记', id: '传记' },
              { name: '歌舞', id: '歌舞' }, { name: '武侠', id: '武侠' }, { name: '情色', id: '情色' }, { name: '灾难', id: '灾难' },
              { name: '西部', id: '西部' }, { name: '纪录片', id: '纪录片' }, { name: '短片', id: '短片' },
            ],
          },
          { name: '地区', list: commonArea },
          { name: '年份', list: makeYearList(2026, 1990) },
          {
            name: '版本',
            list: [
              { name: '全部', id: '' }, { name: '蓝光原盘', id: '蓝光原盘' }, { name: '4KRemux', id: '4KRemux' },
              { name: '4KDVRemux', id: '4KDVRemux' }, { name: '4KDV', id: '4KDV' }, { name: '4K', id: '4K' },
              { name: '1080PRemux', id: '1080PRemux' }, { name: '1080P蓝光', id: '1080P蓝光' }, { name: '1080P', id: '1080P' },
              { name: '720P', id: '720P' },
            ],
          },
          { name: '排序', list: commonSort },
        ]
        break

      case '2':
        filter = [
          {
            name: '剧情',
            list: [
              { name: '全部', id: '' }, { name: '喜剧', id: '喜剧' }, { name: '爱情', id: '爱情' }, { name: '悬疑', id: '悬疑' },
              { name: '动画', id: '动画' }, { name: '武侠', id: '武侠' }, { name: '古装', id: '古装' }, { name: '家庭', id: '家庭' },
              { name: '犯罪', id: '犯罪' }, { name: '科幻', id: '科幻' }, { name: '恐怖', id: '恐怖' }, { name: '历史', id: '历史' },
              { name: '战争', id: '战争' }, { name: '动作', id: '动作' }, { name: '冒险', id: '冒险' }, { name: '传记', id: '传记' },
              { name: '剧情', id: '剧情' }, { name: '奇幻', id: '奇幻' }, { name: '惊悚', id: '惊悚' }, { name: '歌舞', id: '歌舞' },
              { name: '短片', id: '短片' },
            ],
          },
          { name: '地区', list: commonArea },
          { name: '年份', list: makeYearList(2026, 2000) },
          {
            name: '版本',
            list: [
              { name: '全部', id: '' }, { name: '4K完结', id: '4K完结' }, { name: '1080P完结', id: '1080P完结' },
              { name: '4K', id: '4K' }, { name: '1080P', id: '1080P' },
            ],
          },
          { name: '排序', list: commonSort },
        ]
        break

      case '3':
        filter = [
          {
            name: '剧情',
            list: [
              { name: '全部', id: '' }, { name: '选秀', id: '选秀' }, { name: '情感', id: '情感' }, { name: '访谈', id: '访谈' },
              { name: '播报', id: '播报' }, { name: '旅游', id: '旅游' }, { name: '音乐', id: '音乐' }, { name: '美食', id: '美食' },
              { name: '纪实', id: '纪实' }, { name: '曲艺', id: '曲艺' }, { name: '生活', id: '生活' }, { name: '游戏互动', id: '游戏互动' },
              { name: '财经', id: '财经' }, { name: '求职', id: '求职' },
            ],
          },
          { name: '地区', list: commonArea },
          { name: '年份', list: makeYearList(2026, 2010) },
          {
            name: '版本',
            list: [
              { name: '全部', id: '' }, { name: '4K完结', id: '4K完结' }, { name: '1080P完结', id: '1080P完结' },
              { name: '4KDV', id: '4KDV' }, { name: '4K', id: '4K' }, { name: '1080P原盘ISO', id: '1080P原盘ISO' },
              { name: '1080PRemux', id: '1080PRemux' }, { name: '1080P蓝光', id: '1080P蓝光' }, { name: '1080P', id: '1080P' },
              { name: '720P', id: '720P' },
            ],
          },
          { name: '排序', list: commonSort },
        ]
        break

      case '4':
        filter = [
          {
            name: '剧情',
            list: [
              { name: '全部', id: '' }, { name: '爱情', id: '爱情' }, { name: '悬疑', id: '悬疑' }, { name: '动画', id: '动画' },
              { name: '武侠', id: '武侠' }, { name: '古装', id: '古装' }, { name: '家庭', id: '家庭' }, { name: '犯罪', id: '犯罪' },
              { name: '科幻', id: '科幻' }, { name: '恐怖', id: '恐怖' }, { name: '历史', id: '历史' }, { name: '战争', id: '战争' },
              { name: '动作', id: '动作' }, { name: '冒险', id: '冒险' }, { name: '传记', id: '传记' }, { name: '剧情', id: '剧情' },
              { name: '奇幻', id: '奇幻' }, { name: '惊悚', id: '惊悚' }, { name: '灾难', id: '灾难' }, { name: '歌舞', id: '歌舞' },
              { name: '音乐', id: '音乐' },
            ],
          },
          {
            name: '地区',
            list: [
              { name: '全部', id: '' }, { name: '中国大陆', id: '中国大陆' }, { name: '香港', id: '香港' }, { name: '台湾', id: '台湾' },
              { name: '美国', id: '美国' }, { name: '日本', id: '日本' }, { name: '英国', id: '英国' }, { name: '加拿大', id: '加拿大' },
              { name: '法国', id: '法国' }, { name: '印度', id: '印度' }, { name: '意大利', id: '意大利' }, { name: '德国', id: '德国' },
              { name: '韩国', id: '韩国' }, { name: '泰国', id: '泰国' }, { name: '俄罗斯', id: '俄罗斯' }, { name: '苏联', id: '苏联' },
            ],
          },
          { name: '年份', list: makeYearList(2026, 1999) },
          {
            name: '版本',
            list: [
              { name: '全部', id: '' }, { name: '蓝光原盘', id: '蓝光原盘' }, { name: '4KRemux', id: '4KRemux' },
              { name: '4KDVRemux', id: '4KDVRemux' }, { name: '4KDV', id: '4KDV' }, { name: '4K', id: '4K' },
              { name: '1080PRemux', id: '1080PRemux' }, { name: '1080P蓝光', id: '1080P蓝光' }, { name: '1080P', id: '1080P' },
              { name: '720P', id: '720P' }, { name: '4K完结', id: '4K完结' }, { name: '1080P完结', id: '1080P完结' },
            ],
          },
          { name: '排序', list: commonSort },
        ]
        break

      case '72':
        filter = [
          {
            name: '剧情',
            list: [
              { name: '全部', id: '' }, { name: '爱情', id: '爱情' }, { name: '悬疑', id: '悬疑' }, { name: '古装', id: '古装' },
              { name: '奇幻', id: '奇幻' }, { name: '剧情', id: '剧情' }, { name: '喜剧', id: '喜剧' }, { name: '动作', id: '动作' },
              { name: '恐怖', id: '恐怖' }, { name: '惊悚', id: '惊悚' }, { name: '科幻', id: '科幻' },
            ],
          },
          { name: '年份', list: makeYearList(2026, 2023) },
          {
            name: '版本',
            list: [
              { name: '全部', id: '' }, { name: '4K完结', id: '4K完结' }, { name: '1080P完结', id: '1080P完结' },
            ],
          },
          { name: '排序', list: commonSort },
        ]
        break

      case '5':
        filter = [
          {
            name: '剧情',
            list: [
              { name: '全部', id: '' }, { name: '流行演唱会', id: '流行演唱会' }, { name: '摇滚演唱会', id: '摇滚演唱会' },
              { name: '古典音乐会', id: '古典音乐会' }, { name: '说唱演唱会', id: '说唱演唱会' },
              { name: '民谣演唱会', id: '民谣演唱会' }, { name: '群星演唱会', id: '群星演唱会' },
            ],
          },
          { name: '地区', list: commonArea },
          { name: '年份', list: makeYearList(2026, 2011) },
          {
            name: '版本',
            list: [
              { name: '全部', id: '' }, { name: '蓝光原盘', id: '蓝光原盘' }, { name: '4KRemux', id: '4KRemux' },
              { name: '4KDVRemux', id: '4KDVRemux' }, { name: '4KDV', id: '4KDV' }, { name: '4K', id: '4K' },
              { name: '1080PRemux', id: '1080PRemux' }, { name: '1080P蓝光', id: '1080P蓝光' }, { name: '1080P', id: '1080P' },
              { name: '720P', id: '720P' },
            ],
          },
          { name: '排序', list: commonSort },
        ]
        break

      case '53':
        filter = [
          {
            name: '剧情',
            list: [
              { name: '全部', id: '' }, { name: '自然', id: '自然' }, { name: '历史', id: '历史' }, { name: '动物', id: '动物' },
              { name: '社会', id: '社会' }, { name: '文化', id: '文化' }, { name: '探险', id: '探险' }, { name: '天文', id: '天文' },
              { name: '科技', id: '科技' }, { name: '政治', id: '政治' }, { name: '音乐', id: '音乐' }, { name: '旅行', id: '旅行' },
              { name: '美食', id: '美食' }, { name: '人物传记', id: '人物传记' }, { name: '心理', id: '心理' },
              { name: '艺术', id: '艺术' }, { name: '犯罪', id: '犯罪' }, { name: '环保', id: '环保' }, { name: '体育', id: '体育' },
            ],
          },
          { name: '地区', list: commonArea },
          { name: '年份', list: makeYearList(2025, 1999) },
          {
            name: '版本',
            list: [
              { name: '全部', id: '' }, { name: '蓝光原盘', id: '蓝光原盘' }, { name: '4KRemux', id: '4KRemux' },
              { name: '4KDVRemux', id: '4KDVRemux' }, { name: '4KDV', id: '4KDV' }, { name: '4K', id: '4K' },
              { name: '1080PRemux', id: '1080PRemux' }, { name: '1080P蓝光', id: '1080P蓝光' }, { name: '1080P', id: '1080P' },
              { name: '720P', id: '720P' },
            ],
          },
          { name: '排序', list: commonSort },
        ]
        break

      default:
        filter = []
    }

    backData.data.filter = filter
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
    const classId = String(args.url || '')
    const page = String(args.page || 1)
    const site = UZUtils.removeTrailingSlash(appConfig.webSite)
    const searchUrl = `${site}/vodshow/${classId}--time------${page}---/`

    const repData = await req(searchUrl)
    const $ = cheerio.load(repData.data || '')
    backData.data = parseModuleItems($, $('.module .module-item'))
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
    let genre = ''
    let area = ''
    let year = ''
    let version = ''
    let sort = 'time'

    if (args.filter && args.filter.length === 5) {
      genre = args.filter[0]?.id || ''
      area = args.filter[1]?.id || ''
      year = args.filter[2]?.id || ''
      version = args.filter[3]?.id || ''
      sort = args.filter[4]?.id || 'time'
    } else if (args.filter && args.filter.length === 4) {
      genre = args.filter[0]?.id || ''
      year = args.filter[1]?.id || ''
      version = args.filter[2]?.id || ''
      sort = args.filter[3]?.id || 'time'
    }

    const site = UZUtils.removeTrailingSlash(appConfig.webSite)
    let searchUrl = `${site}/vodshow/${args.mainClassId}-${area}-${sort}-${genre}-----${args.page}---${year}`
    if (version) searchUrl += `/version/${version}`

    const repData = await req(searchUrl)
    const $ = cheerio.load(repData.data || '')
    backData.data = parseModuleItems($, $('.module .module-item'))
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
    const webUrl = toAbsoluteUrl(String(args.url || ''))
    const rep = await req(webUrl)
    const $ = cheerio.load(rep.data || '')

    const vodDetail = new VideoDetail()
    vodDetail.vod_id = String(args.url || '')

    const imgInfo = $('.module-info-poster .module-item-pic img').first()
    vodDetail.vod_name = imgInfo.attr('alt') || ''
    vodDetail.vod_pic = toAbsoluteUrl(imgInfo.attr('data-original') || imgInfo.attr('src') || '')
    vodDetail.vod_content = $('.module-info-introduction-content p').text().trim()

    $('.module-info-item').each((_, item) => {
      const title = $(item).find('.module-info-item-title').text() || ''
      const content = $(item)
        .find('.module-info-item-content a')
        .map((__, el) => $(el).text())
        .get()
        .join(',')

      if (title.includes('导演')) vodDetail.vod_director = content
      if (title.includes('主演')) vodDetail.vod_actor = content
    })

    const panUrls = []
    $('#download-list .module-row-info').each((_, row) => {
      const shortcutHtml = $(row).find('.module-row-shortcuts').html()
      if (!shortcutHtml) return
      const reg = /data-clipboard-text="([^"]+)"/g
      let match
      while ((match = reg.exec(shortcutHtml)) !== null) {
        if (match[1]) panUrls.push(match[1])
      }
    })

    vodDetail.panUrls = [...new Set(panUrls)]
    backData.data = vodDetail
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
    const keyword = String(args.searchWord || '').trim()
    const page = String(args.page || 1)
    if (!keyword) {
      backData.data = []
      return JSON.stringify(backData)
    }

    const site = UZUtils.removeTrailingSlash(appConfig.webSite)
    const searchUrl = `${site}/vodsearch/${encodeURIComponent(keyword)}----------${page}---/`
    const repData = await req(searchUrl)
    const $ = cheerio.load(repData.data || '')

    backData.data = $('.module-card-item')
      .toArray()
      .map((item) => {
        const node = $(item)
        const linkTag = node.find('.module-card-item-poster').first()
        const imgTag = linkTag.find('img').first()

        const v = new VideoDetail()
        v.vod_id = linkTag.attr('href') || ''
        v.vod_name = imgTag.attr('alt') || ''
        v.vod_pic = toAbsoluteUrl(imgTag.attr('data-original') || imgTag.attr('src') || '')
        v.vod_remarks = node.find('.module-item-note').text().trim()
        return v
      })
  } catch (error) {
    backData.error = '搜索失败: ' + error
  }
  return JSON.stringify(backData)
}