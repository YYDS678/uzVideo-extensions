// ignore
//@name:「嗅」 E-ACG
//@version:1
//@webSite:https://eacg1.com
//@remark:
//@order: D
// ignore

// ignore
// 不支持导入，这里只是本地开发用于代码提示
// 如需添加通用依赖，请联系 https://t.me/uzVideoAppbot
import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'

// ignore

//MARK: 注意
// 直接复制该文件进行扩展开发
// 请保持以下 变量 及 函数 名称不变
// 请勿删减，可以新增

const appConfig = {
  // MARK: 0. 这个是请求头 一般不用改动
  get headers() {
    return {
      // 使用那种模式模拟访问 默认为使用 电脑 模式
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
      // 这个是手机模式
      // 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    }
  },
  // MARK: 0.1 这个是播放请求头 一般不用改变
  get playHeaders() {
    return {
      // 有些网站可能需要把这个取消注释
      // Referer: this.webSite,
    }
  },

  // MARK: 1. 这个是网站主页
  _webSite: 'https://eacg1.com',

  // MARK: 2. 这个是含有筛选条件的页面
  // 我这里 先选了一个 一级分类 国语动漫
  // https://eacg1.com/vodshow/20-----------.html
  // 在国语动漫的基础上我又选了 科幻 并且翻到了第二页
  // https://eacg1.com/vodshow/20---科幻-----2---.html
  // 现在来写出对应的筛选列表解析式
  // @{webSite} 就是 上面 第一步的 网站主页，这里是动态的方便在 app 里更换主页
  // @{mainId} 就是 一级分类的 id 对应上面的 20       国语动漫
  // @{filterId0} 就是 筛选条件的 id 对应上面的 科幻     类型
  // 如果有多个筛选类别 那么依次递增 @{filterId1} @{filterId2}  @{filterId3}
  // @{page} 就是 页码 对应上面的 2               页码
  // 那么可以看出 我们现在写的是存在一个 一级分类
  // 一级分类 只有一个筛选条件 类型
  //================
  // 这里的关键就是看 增加了一个筛选条件后链接增加了哪些内容
  // 增加的内容就是我们需要的关键数据
  // 有的网站可能增加一个筛选条件后 链接增加了 /class/123
  // 那么这个 /class/123 就是我们需要的
  // ================
  filterListUrl: '@{webSite}/vodshow/@{mainId}---@{filterId0}-----@{page}---@{filterId1}.html',

  // MARK: 2.1 不带筛选的
  // 如果不写筛选那么只需要 @{webSite}  @{mainId}  @{page} 这三个参数
  // 我们这个例子里剧场版的链接 https://eacg1.com/vodshow/24--------2---.html
  mainListUrl: '@{webSite}/vodshow/@{mainId}--------@{page}---.html',

  firstClass: [
    {
      // MARK: 3. 分类列表 筛选列表
      //  一级分类的名称 如果不想写筛选 那么往下看剧场版分类 或者搜索 3.5
      // 这个就是我们在网站上看到的一级分类的名称
      // 也是在 app 里展示的名称
      name: '日漫',
      // 这个就是我们在网站上看到的一级分类的 id 对应上面的 @{mainId} 即21
      id: '21',
      // 这个是这个大分类的所有筛选类别  类型、地区、年份 这种 都是写在这个 [] 里的
      filter: [
        // MARK: 3.1 这个是单个筛选类别
        {
          // 这个是筛选标题
          name: '类型',
          // 这里面就是 类型 的筛选列表，可以在网站上依次选中看看变化
          // 同一个类型的 key 是一致的！
          // 这个 key 就是上面链接里要被替换的内容，这里对应 @{filterId0}
          list: [
            {
              // 这个就是筛选标签的名称
              name: '全部',
              // 这个就是筛选标签的 id 对应上面的 @{filterId0}
              // 可以看到我们选了全部之后链接没有增加东西
              // 所以这里的 id 是 空
              id: '',
              key: '@{filterId0}',
            },
            {
              // 这个就是筛选标签的名称
              name: '科幻',
              // 这个就是筛选标签的 id 对应上面的 @{filterId0} 即科幻
              //  我们选中科幻后 链接只增加了 科幻 两个字，所有 id 是 科幻
              id: '科幻',
              key: '@{filterId0}',
            },
            {
              name: '热血',
              id: '热血',
              key: '@{filterId0}',
            },
            {
              name: '推理',
              id: '推理',
              key: '@{filterId0}',
            },
          ],
        },
        // MARK: 3.2 一个大分类 多个筛选条件
        // 现在是第二个筛选条件 年份 对应 @{filterId1}
        {
          name: '年份',
          list: [
            {
              name: '全部',
              id: '',
              key: '@{filterId1}',
            },
            {
              name: '2025',
              id: '2025',
              key: '@{filterId1}',
            },
            {
              name: '2024',
              id: '2024',
              key: '@{filterId1}',
            },
            {
              name: '2023',
              id: '2023',
              key: '@{filterId1}',
            },
            {
              name: '2022',
              id: '2022',
              key: '@{filterId1}',
            },
          ],
        },
      ],
    },
    {
      // 3.3 一级分类的名称
      // 第二个大分类
      name: '国语动漫',
      // 这个就是我们在网站上看到的一级分类的 id 对应上面的 @{mainId} 即20
      id: '20',
      filter: [
        // 4.这个是筛选类别，我们只写了一个类型。如果有多个筛选类别那么就照着这个大括号的格式写多个
        {
          // 这个是筛选标题
          name: '类型',
          // 这里面就是 类型 的筛选列表，可以在网站上依次选中看看变化
          list: [
            {
              // 这个就是筛选标签的名称
              name: '全部',
              // 这个就是筛选标签的 id 对应上面的 @{filterId0}
              // 可以看到我们选了全部之后链接没有增加东西
              // 所以这里的 id 是 空
              id: '',
              key: '@{filterId0}',
            },
            {
              // 这个就是筛选标签的名称
              name: '科幻',
              // 这个就是筛选标签的 id 对应上面的 @{filterId0} 即科幻
              id: '科幻',
              key: '@{filterId0}',
            },
            {
              name: '热血',
              id: '热血',
              key: '@{filterId0}',
            },
            {
              name: '推理',
              id: '推理',
              key: '@{filterId0}',
            },
          ],
        },
        // MARK: 3.4 这里我不想写 年份了
        // 如果要写就是照着上面的写
      ],
    },
    {
      // MARK: 3.5 一级分类 没有筛选
      // 这个就是我们在网站上看到的一级分类的名称
      // 也是在 app 里展示的名称
      name: '剧场版',
      // 这个就是我们在网站上看到的一级分类的 id 对应上面的 @{mainId} 即24
      id: '24',
      // 这个是没有筛选条件的 所以 filter 里面是空的
      filter: [],
    },
    // 如果有多个一级分类就照着上面这个大括号的格式写多个
  ],
  // MARK: 4. 分类筛选列表元素
  // 在视频封面上 鼠标右键 检查元素 (macOS 上是这样，Windows 大概差不多也有这个叫法吧)
  // 上面不行的话，需要打开浏览器的 控制台 点击元素。不会的 百度 Google 怎么打开 (windows 好像是 F12) (macOS  opt + comm + i)
  videoListLiTag: {
    // 这里不好讲明白 就 先打开这个 https://eacg1.com/vodshow/33-----------.html 网页，然后 打开控制台
    // 去搜素 class 的值 fed-list-item fed-padding fed-col-xs4 fed-col-sm3 fed-col-md2
    // 会发现有很多都是连续的 鼠标放上去刚好网页里显示的就是 一个视频小卡片。
    // name 就是 < 符号后面的 字母
    // class 就是 class="xxxx" 引号里面的
    name: 'li',
    class: 'fed-list-item fed-padding fed-col-xs4 fed-col-sm3 fed-col-md2',
  },

  // MARK: 5. 单个视频的图片元素
  vImageTag: {
    name: 'a',
    class: 'fed-list-pics fed-lazy fed-part-2by3',
  },
  // MARK: 6. 单个视频的名称元素
  vNameTag: {
    name: 'a',
    class: 'fed-list-title fed-font-xiv fed-text-center fed-text-sm-left fed-visible fed-part-eone',
  },
  // MARK: 7. 选集线路列表 注意这个是指 这个线路所有剧集父元素 不是单个剧集
  // 一般是 ul 这种，点开后里面里面就是单个剧集
  playFromTag: {
    name: 'ul',
    class: 'fed-part-rows',
  },
  // MARK: 8. 单个剧集的元素
  // 一般是 a 这种，点开后里面就是单个剧集的名称
  episodeItemTag: {
    name: 'a',
    class: 'fed-btns-info fed-rims-info fed-part-eone',
  },
  // MARK: 9. 搜索链接
  // https://eacg1.com/vodsearch/海贼王----------2---.html
  // @{searchWord} 就是搜索的关键字
  searchUrl: '@{webSite}/vodsearch/@{searchWord}----------@{page}---.html',
  // MARK: 10. 搜索结果列表元素
  searchListTag: {
    name: 'dl',
    class: 'fed-deta-info fed-deta-padding fed-line-top fed-margin fed-part-rows fed-part-over',
  },
  // MARK: 11. 搜索结果图片元素
  searchImageTag: {
    name: 'a',
    class: 'fed-list-pics fed-lazy fed-part-2by3',
  },
  // MARK: 12. 搜索结果名称元素
  searchNameTag: {
    name: 'h1',
    class: 'fed-part-eone fed-font-xvi',
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
    const respData = await req(filterListUrl, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const videoListLiTag = appConfig.videoListLiTag
    const videoItems = $(`${videoListLiTag.name}.${videoListLiTag.class.replaceAll(' ', '.')}`)
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

    const respData = await req(filterListUrl, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const videoListLiTag = appConfig.videoListLiTag
    const videoItems = $(`${videoListLiTag.name}.${videoListLiTag.class.replaceAll(' ', '.')}`)

    const list = parseVideoList({ videoItems: videoItems })
    backData.data = list
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
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

      const imageHtml = $(element).find(`${vImageTag.name}.${vImageTag.class.replaceAll(' ', '.')}`)
      var imageUrl = parseImage(imageHtml)

      const nameHtml = $(element).find(`${vNameTag.name}.${vNameTag.class.replaceAll(' ', '.')}`)

      const name = nameHtml.text()

      const href = findHref($, imageHtml, nameHtml)

      backDatalist.push({
        vod_pic: imageUrl,
        vod_name: name,
        vod_id: removeDomain(href),
      })
    }
  } catch (error) { }
  return backDatalist
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
    const respData = await req(url, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const playFromTag = appConfig.playFromTag

    const episodeItemTag = appConfig.episodeItemTag
    const playFromHtmlList = $(`${playFromTag.name}.${playFromTag.class.replaceAll(' ', '.')}`)
    var playFrom = []
    var eps = []

    for (let index = 0; index < playFromHtmlList.length; index++) {
      const element = playFromHtmlList[index]
      const episodeItem = $(element).find(`${episodeItemTag.name}.${episodeItemTag.class.replaceAll(' ', '.')}`)
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

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
  var backData = new RepVideoPlayUrl()
  try {
    var url = combineUrl(args.url)
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
    const respData = await req(url, {
      headers: appConfig.headers,
    })
    const htmlStr = respData.data ?? ''
    const $ = cheerio.load(htmlStr)
    const searchListTag = appConfig.searchListTag
    const searchImageTag = appConfig.searchImageTag
    const searchNameTag = appConfig.searchNameTag
    const videoItems = $(`${searchListTag.name}.${searchListTag.class.replaceAll(' ', '.')}`)
    var list = []
    for (let index = 0; index < videoItems.length; index++) {
      const element = videoItems[index]
      const imageHtml = $(element).find(`${searchImageTag.name}.${searchImageTag.class.replaceAll(' ', '.')}`)
      const nameHtml = $(element).find(`${searchNameTag.name}.${searchNameTag.class.replaceAll(' ', '.')}`)
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
