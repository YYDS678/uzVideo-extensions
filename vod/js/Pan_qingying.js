//@name:[盘] 清影
//@version:3
//@webSite:http://www.revohd.com
//@remark:🙀是白猫呀！！！
//@order: A20
const appConfig = {
    _webSite: 'http://www.revohd.com',
    /**
     * 网站主页
     */
    get webSite() {
        return this._webSite
    },
    set webSite(value) {
        this._webSite = value
    },

    _uzTag: '',
    /**
     * 扩展标识
     */
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
}

// 全局变量
let hasShownWelcome = false  // 标记是否已显示欢迎提示

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    // 首次加载时显示欢迎提示
    if (!hasShownWelcome) {
        hasShownWelcome = true
        toast("🙀白猫出品，三无产品！！！", 3)  // 显示3秒
    }
    backData.data = [
        {
            type_id: '1',
            type_name: '电影',
            hasSubclass: false,
        },
        {
            type_id: '2',
            type_name: '剧集',
            hasSubclass: false,
        },
        {
            type_id: '3',
            type_name: '娱乐',
            hasSubclass: false,
        },
        {
            type_id: '5',
            type_name: '动漫',
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
    let url = ''

    if (args.url) {
        // 分类页面，如：/vod/show/id/1/page/2.html
        url = UZUtils.removeTrailingSlash(appConfig.webSite) +
            `/vod/show/id/${args.url}/page/${args.page}.html`
    }

    try {
        const pro = await req(url)
        backData.error = pro.error

        let videos = []
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodItems = $('.module-items .module-item')

            vodItems.each((_, e) => {
                let videoDet = new VideoDetail()

                // 获取链接
                const link = $(e).find('.module-item-pic a').attr('href')
                videoDet.vod_id = link

                // 获取剧名
                videoDet.vod_name = $(e).find('.module-item-pic img').attr('alt') ||
                    $(e).find('.module-item-titlebox a').attr('title') ||
                    $(e).find('.module-item-pic a').attr('title')

                // 获取图片
                videoDet.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + $(e).find('.module-item-pic img').attr('data-src')

                // 获取豆瓣评分/备注
                videoDet.vod_remarks = $(e).find('.module-item-caption span').first().text()

                videos.push(videoDet)
            })
        }
        backData.data = videos
    } catch (error) {
        backData.error = '获取视频列表失败: ' + error
    }
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

            // 获取剧名
            vodDetail.vod_name = $('.page-title a').text()

            // 获取图片
            vodDetail.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + $('.module-item-pic img').attr('data-src')

            // 获取详细信息
            $('.video-info-items').each((_, item) => {
                const title = $(item).find('.video-info-itemtitle').text() ||
                    $(item).find('.video-info-item[title]').text()
                const value = $(item).find('.video-info-item').last().text().trim()

                if (title.includes('导演')) {
                    vodDetail.vod_director = $(item).find('a').map((i, el) => $(el).text().trim()).get().join(', ')
                } else if (title.includes('主演')) {
                    vodDetail.vod_actor = $(item).find('a').map((i, el) => $(el).text().trim()).get().join(', ')
                } else if (title.includes('年代') || title.includes('上映')) {
                    const yearMatch = value.match(/\d{4}/)
                    if (yearMatch) vodDetail.vod_year = yearMatch[0]
                } else if (title.includes('评分')) {
                    vodDetail.vod_remarks = $(item).find('font').text() || value
                }
            })

            // 获取剧情简介
            vodDetail.vod_content = $('.video-info-content span').text()

            // 获取网盘链接
            const panUrls = []

            $('.module-row-title p').each((_, el) => {
                const url = $(el).text().trim()
                if (url) {
                    panUrls.push(url)
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
        let searchUrl = UZUtils.removeTrailingSlash(appConfig.webSite) +
            `/vodsearch/-------------.html?wd=${encodeURIComponent(args.searchWord)}`

        if (args.page && args.page > 1) {
            searchUrl += `&page=${args.page}`
        }

        let repData = await req(searchUrl)

        const $ = cheerio.load(repData.data)

        // 尝试多种选择器来获取搜索结果
        let items = $('.module-search-item, .module-item')

        if (items.length === 0) {
            // 如果没有特定class，尝试通用的项目选择器
            items = $('.module-items .module-item, .vod-item, .video-item')
        }

        items.each((_, item) => {
            let video = new VideoDetail()

            // 获取链接
            const link = $(item).find('a').first().attr('href')
            if (link) video.vod_id = link

            // 获取剧名
            video.vod_name = $(item).find('.video-info h3 a').attr('title')

            // 获取图片
            video.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + $('.module-item-pic img').attr('data-src')

            // 获取备注/评分
            video.vod_remarks = $('.module-item-caption span').first().text()

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