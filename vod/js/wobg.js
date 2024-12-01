const appConfig = {
    _webSite: 'http://wogg.xxooo.cf',
    /**
     * 网站主页，uz 调用每个函数前都会进行赋值操作
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
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    backData.data = [
        {
            type_id: '1',
            type_name: '玩偶电影',
            hasSubclass: false,
        },
        {
            type_id: '2',
            type_name: '玩偶剧集',
            hasSubclass: false,
        },
        {
            type_id: '3',
            type_name: '玩偶动漫',
            hasSubclass: false,
        },
        {
            type_id: '4',
            type_name: '玩偶综艺',
            hasSubclass: false,
        },
        {
            type_id: '44',
            type_name: '臻彩视界',
            hasSubclass: false,
        },
        {
            type_id: '6',
            type_name: '玩偶短剧',
            hasSubclass: false,
        },
        {
            type_id: '5',
            type_name: '玩偶音乐',
            hasSubclass: false,
        },
    ]
    return JSON.stringify(backData)
}
async function getSubclassList(args) {
    let backData = new RepVideoSubclassList()
    return JSON.stringify(backData)
}
async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    return JSON.stringify(backData)
}
/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    let url =
        UZUtils.removeTrailingSlash(appConfig.webSite) +
        `/vodshow/${args.url}--------${args.page}---.html`
    try {
        const pro = await req(url)
        backData.error = pro.error

        let videos = []
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodItems = $('#main .module-item')
            vodItems.each((_, e) => {
                let videoDet = new VideoDetail()
                videoDet.vod_id = $(e).find('.module-item-pic a').attr('href')
                videoDet.vod_name = $(e)
                    .find('.module-item-pic img')
                    .attr('alt')
                videoDet.vod_pic = $(e)
                    .find('.module-item-pic img')
                    .attr('data-src')
                videoDet.vod_remarks = $(e).find('.module-item-text').text()
                videos.push(videoDet)
            })
        }
        backData.data = videos
    } catch (error) {}
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<RepVideoDetail>}
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let webUrl = UZUtils.removeTrailingSlash(appConfig.webSite) + args.url
        let pro = await req(webUrl)

        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = args.url
            vodDetail.vod_name = $('.page-title')[0].children[0].data
            vodDetail.vod_pic = $($('.mobile-play')).find(
                '.lazyload'
            )[0].attribs['data-src']

            let video_items = $('.video-info-itemtitle')

            for (const item of video_items) {
                let key = $(item).text()

                let vItems = $(item).next().find('a')
                let value = vItems
                    .map((i, el) => {
                        let text = $(el).text().trim() // 获取并去除空白字符
                        return text ? text : null // 只有非空的文本才返回
                    })
                    .get() // 将 jQuery 对象转换为普通数组
                    .filter(Boolean) // 过滤掉 null 和空字符串
                    .join(', ') // 用逗号和空格分割

                if (key.includes('年代')) {
                    vodDetail.vod_year = value.trim()
                } else if (key.includes('导演')) {
                    vodDetail.vod_director = value.trim()
                } else if (key.includes('主演')) {
                    vodDetail.vod_actor = value.trim()
                }
            }

            const panUrls = []
            let items = $('.module-row-info')
            for (const item of items) {
                let shareUrl = $(item).find('p')[0].children[0].data
                panUrls.push(shareUrl)
            }
            vodDetail.panUrls = panUrls
            console.log(panUrls)

            backData.data = vodDetail
        }
    } catch (error) {
        backData.error = '获取视频详情失败' + error
    }

    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {Promise<RepVideoPlayUrl>}
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        let searchUrl = combineUrl(
            'vodsearch/' +
                args.searchWord +
                '----------' +
                args.page +
                '---.html'
        )
        let repData = await req(searchUrl)

        const $ = cheerio.load(repData.data)
        let items = $('.module-search-item')

        for (const item of items) {
            let video = new VideoDetail()
            video.vod_id = $(item).find('.video-serial')[0].attribs.href
            video.vod_name = $(item).find('.video-serial')[0].attribs.title
            video.vod_pic = $(item).find('.module-item-pic > img')[0].attribs[
                'data-src'
            ]
            video.vod_remarks = $($(item).find('.video-serial')[0]).text()
            backData.data.push(video)
        }
    } catch (error) {
        backData.error = error
    }
    return JSON.stringify(backData)
}

function combineUrl(url) {
    if (url === undefined) {
        return ''
    }
    if (url.indexOf(appConfig.webSite) !== -1) {
        return url
    }
    if (url.startsWith('/')) {
        return appConfig.webSite + url
    }
    return appConfig.webSite + '/' + url
}
