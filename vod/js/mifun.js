// ignore
//@name:「嗅」 mifun
//@version:1
//@webSite:http://www.mifun.tw
//@remark:
//@order: D
import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'
// ignore

const appConfig = {
  get headers() {
    return {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
    }
  },

  get playHeaders() {
    return {
      Referer: this.webSite,
    }
  },

  _webSite: 'http://www.mifun.tw',

  filterListUrl: '@{webSite}/vodshow/@{mainId}/page/@{page}/',

  mainListUrl: '@{webSite}/vodshow/@{mainId}/page/@{page}/',

  firstClass: [
    {
      name: '番剧',
      id: '1',
      filter: [

      ],
    },
    {
      name: '国创',
      id: '2',
      filter: [

      ],
    },
    {
      name: '剧场',
      id: '3',
      filter: [

      ],
    },
    {
      name: '美漫',
      id: '4',
      filter: [

      ],
    },
    {
      name: '特摄',
      id: '5',
      filter: [

      ],
    },
  ],
  // MARK: 4. 分类筛选列表元素
  videoListLiTag: {
    name: 'li',
    class: 'hl-list-item hl-col-xs-4 hl-col-sm-3 hl-col-md-20w hl-col-lg-2',
            
  },
  // MARK: 5. 单个视频的图片元素
  vImageTag: {
    name: 'a',
    class: 'hl-item-thumb hl-lazy',
  },
  // MARK: 6. 单个视频的名称元素
  vNameTag: {
    name: 'div',
    class: 'hl-item-title hl-text-site hl-lc-1',
  },
  // MARK: 7. 选集线路列表
  playFromTag: {
    name: 'ul',
    class: 'hl-plays-list hl-sort-list hl-list-hide-xs clearfix',
  },
  // MARK: 8. 单个剧集的元素
  episodeItemTag: {
    name: 'a',
    class: '',
  },
  // MARK: 9. 搜索链接
  searchUrl: '@{webSite}/vodsearch/?wd=@{searchWord}',
  // MARK: 10. 搜索结果列表元素
  searchListTag: {
    name: 'li',
    class: 'hl-list-item hl-col-xs-12',
  },
  // MARK: 11. 搜索结果图片元素
  searchImageTag: {
    name: 'a',
    class: 'hl-item-thumb hl-lazy',
  },
  // MARK: 12. 搜索结果名称元素
  searchNameTag: {
    name: 'div',
    class: 'hl-item-title hl-text-site hl-lc-2',
  },

  /**
   * 网站主页，uz 调用每个函数前都会进行赋值操作
   * 如果不想被改变 请自定义一个变量
   */
  get webSite() {
    if (this._webSite.endsWith('/')) {
      this._webSite = this._webSite.substring(0, this._webSite.length - 1)
    }
    return this._webSite
  },
  set webSite(value) {
    this._webSite = value
  },

  _uzTag: '',
  /**
   * 扩展标识，初次加载时，uz 会自动赋值，请勿修改
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
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
  var backData = new RepVideoClassList()
  var firstClass = []
  try {
    for (let index = 0; index < appConfig.firstClass.length; index++) {
      const element = appConfig.firstClass[index]
      firstClass.push({
        type_name: element.name,
        type_id: element.id,
        hasSubclass: element.filter.length > 0,
      })
    }
    backData.data = firstClass
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
    for (let index = 0; index < appConfig.firstClass.length; index++) {
      const element = appConfig.firstClass[index]
      if (element.id == args.url) {
        backData.data = { filter: element.filter }
        break
      }
    }
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
    var url = args.url
    var page = args.page
    var filterListUrl = appConfig.mainListUrl
    var filterListUrl = filterListUrl.replace('@{webSite}', appConfig.webSite)
    filterListUrl = filterListUrl.replace('@{mainId}', url)
    filterListUrl = filterListUrl.replace('@{page}', page)
    dlog("一级分类 组合链接", filterListUrl)
    const respData = await req(filterListUrl, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const videoListLiTag = appConfig.videoListLiTag

    const videoItems = $(buildFindStr(videoListLiTag))
    backData.data = parseVideoList({ videoItems: videoItems })
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
    var filterListUrl = appConfig.filterListUrl
    filterListUrl = filterListUrl.replace('@{webSite}', appConfig.webSite)
    filterListUrl = filterListUrl.replace('@{mainId}', args.mainClassId)
    for (let index = 0; index < args.filter.length; index++) {
      const element = args.filter[index]
      filterListUrl = filterListUrl.replace(element.key, element.id)
    }
    filterListUrl = filterListUrl.replace('@{page}', args.page)
    filterListUrl = filterListUrl.replace(/@{.*?}/g, '')
    dlog("筛选列表 组合链接", filterListUrl)
    const respData = await req(filterListUrl, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const videoListLiTag = appConfig.videoListLiTag
    const videoItems = $(buildFindStr(videoListLiTag))
    const list = parseVideoList({ videoItems: videoItems })
    backData.data = list
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
    var url = combineUrl(args.url)
    dlog("视频详情 组合链接", url)
    const respData = await req(url, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const playFromTag = appConfig.playFromTag

    const episodeItemTag = appConfig.episodeItemTag
    const playFromHtmlList = $(buildFindStr(playFromTag))
    var playFrom = []
    var eps = []

    for (let index = 0; index < playFromHtmlList.length; index++) {
      const element = playFromHtmlList[index]
      const episodeItem = $(element).find(buildFindStr(episodeItemTag))
      eps = []

      for (let index = 0; index < episodeItem.length; index++) {
        const ep = episodeItem[index]
        const href = $(ep).attr('href') ?? ''
        const title = $(ep).text() ?? ''
        if (href.includes('http') || href.startsWith('/')) {
          eps.push({
            url: removeDomain(href),
            name: title,
          })
        }
      }
      if (eps.length > 0) {
        playFrom.push(eps)
      }
    }

    // 第一集$第一集的视频详情链接#第二集$第二集的视频详情链接$$$第一集$第一集的视频详情链接#第二集$第二集的视频详情链接
    var playUrl = ''
    for (let index = 0; index < playFrom.length; index++) {
      const from = playFrom[index]
      for (let index = 0; index < from.length; index++) {
        const element = from[index]
        playUrl += `${element.name}$${element.url}#`
      }
      playUrl += '$$$'
    }
    backData.data = {
      vod_play_url: playUrl,
    }
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
    var url = combineUrl(args.url)
    dlog("视频播放 组合链接", url)
    backData.sniffer = {
      url: url,
      ua: appConfig.headers['User-Agent'],
    }
    backData.headers = appConfig.playHeaders
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
    var url = appConfig.searchUrl
    url = url.replace('@{webSite}', appConfig.webSite)
    url = url.replace('@{searchWord}', args.searchWord)
    url = url.replace('@{page}', args.page)
    dlog("搜索 组合链接", url)
    const respData = await req(url, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const searchListTag = appConfig.searchListTag
    const searchImageTag = appConfig.searchImageTag
    const searchNameTag = appConfig.searchNameTag
    const videoItems = $(buildFindStr(searchListTag))
    var list = []
    for (let index = 0; index < videoItems.length; index++) {
      const element = videoItems[index]
      const findImgStr = buildFindStr(searchImageTag)
      var imageHtml = $(element).find(findImgStr) ?? []
      if (imageHtml.length < 1 && findImgStr.includes("lazyloaded")) {
        imageHtml = $(element).find(findImgStr.replace("lazyloaded", "lazyload"))
      }

      const nameHtml = $(element).find(buildFindStr(searchNameTag)) ?? []
      if (imageHtml.length < 1 || nameHtml.length < 1) {
        continue
      }
      const imageUrl = parseImage(imageHtml)
      const name = nameHtml.text()
      const href = findHref($, imageHtml, nameHtml)
      list.push({
        vod_pic: imageUrl,
        vod_name: name,
        vod_id: removeDomain(href),
      })
    }
    backData.data = list
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}


function combineUrl(url) {
  if (url.includes('http')) {
    return url
  } else if (url.startsWith('/')) {
    return appConfig.webSite + url
  } else {
    return appConfig.webSite + '/' + url
  }
}

function removeDomain(url) {
  if (url.includes(appConfig.webSite)) {
    return url.replace(appConfig.webSite, '')
  } else {
    return url
  }
}

function buildFindStr(tag) {
  var findStr = `${tag.name}`
  var className = tag.class ?? ''
  if (className.length > 0) {
    findStr += `.${className.replaceAll(' ', '.')}`
    findStr = findStr.replaceAll('..', '.')
  }
  return findStr
}

function findHref($, imageHtml, nameHtml) {
  const maxDeep = 10
  var href = ''

  var href = $(imageHtml).attr('href') ?? ''
  if (href.length > 0) {
    return href
  }

  href = $(nameHtml).attr('href') ?? ''
  if (href.length > 0) {
    return href
  }
  var parentEle = $(imageHtml).parent()

  var deep = 0

  while (href.length < 1) {
    href = $(parentEle).attr('href') ?? ''
    parentEle = $(parentEle).parent()
    deep += 1

    if (deep > maxDeep) {
      break
    }
  }
  if (href.length > 0) {
    return href
  }
  if (href.length < 1) {
    parentEle = $(nameHtml).parent()
    deep = 0

    while (href.length < 1) {
      href = $(parentEle).attr('href') ?? ''
      parentEle = $(parentEle).parent()
      deep += 1
      if (deep > maxDeep) {
        break
      }
    }
  }
  return href
}

function parseImage(imageHtml) {
  const imageAttr = imageHtml[0]?.attribs
  const imageAttrValue = Object.values(imageAttr)
  for (let index = 0; index < imageAttrValue.length; index++) {
    const imgUrl = imageAttrValue[index]
    if (imgUrl.startsWith('http') && (imgUrl.includes('pic') || imgUrl.includes('.jpg') || imgUrl.includes('.png') || imgUrl.includes('.jpeg'))) {
      return imgUrl
    }
  }
  return ''
}

function parseVideoList({ videoItems }) {
  var backDatalist = []
  try {
    const vImageTag = appConfig.vImageTag
    const vNameTag = appConfig.vNameTag

    for (let index = 0; index < videoItems.length; index++) {
      const element = videoItems[index]
      const $ = cheerio.load(element)

      var findImgStr = buildFindStr(vImageTag)
      var findImgStr2 = ""
      if (findImgStr.includes("lazyloaded")) {
        findImgStr2 = findImgStr.replace("lazyloaded", "lazyload")
      }

      var findNameStr = buildFindStr(vNameTag)

      var imageHtml = $(element).find(findImgStr) ?? []
      if (findImgStr2.length > 0 && imageHtml.length < 1) {
        imageHtml = $(element).find(findImgStr2) ?? []
      }
      var nameHtml = $(element).find(findNameStr) ?? []
      if (imageHtml.length < 1 || nameHtml.length < 1) {
        continue
      }

      const imageUrl = parseImage(imageHtml)
      const name = nameHtml.text()
      const href = findHref($, imageHtml, nameHtml)

      backDatalist.push({
        vod_pic: imageUrl,
        vod_name: name,
        vod_id: removeDomain(href),
      })
    }
  } catch (error) {
    dlog("解析视频列表出错", error)
  }
  return backDatalist
}


function dlog() {
  UZUtils.debugLog("---", ...arguments)
}

