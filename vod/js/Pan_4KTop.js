//@name:[盘] 4KTop
//@version:1.0.0
//@webSite:https://4ktop.com
//@remark:TG频道：https://t.me/Lsp115
//@author:白猫
//@order: A02
const appConfig = {
    _webSite: 'https://4ktop.com',
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
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
}

/**
 * 异步获取分类列表的方法
 * 根据MacCMS常用结构设定，ID需根据网站实际调整，这里预设了常见ID
 * @param {UZArgs} args
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    backData.data = [
        {
            type_id: '1',
            type_name: '电影',
            hasSubclass: false,
        },
        {
            type_id: '2',
            type_name: '电视剧',
            hasSubclass: false,
        },
        {
            type_id: '3',
            type_name: '综艺',
            hasSubclass: false,
        },
        {
            type_id: '4',
            type_name: '动漫',
            hasSubclass: false,
        },
        {
            type_id: '72',
            type_name: '短剧',
            hasSubclass: false,
        },
        {
            type_id: '5',
            type_name: '演唱会',
            hasSubclass: false,
        },
        {
            type_id: '53',
            type_name: '短剧',
            hasSubclass: false,
        }
    ]
    return JSON.stringify(backData)
}


async function getSubclassList(args) {
    let backData = new RepVideoSubclassList()
    return JSON.stringify(backData)
}


/**
 * 获取分类视频列表
 * URL格式参考: /vodshow/1--------2---/ (ID--------页码---)
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    // 构造URL: /vodshow/{id}--------{page}---/
    let url = UZUtils.removeTrailingSlash(appConfig.webSite) + `/vodshow/${args.url}--------${args.page}---/`
    try {
        const pro = await req(url)
        backData.error = pro.error
        let videos = []
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodItems = $('.module .module-item')

            vodItems.each((_, e) => {
                let videoDet = new VideoDetail()
                // 获取链接
                videoDet.vod_id = $(e).attr('href')

                // 获取图片
                let imgElem = $(e).find('.module-item-pic img').first()
                videoDet.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) +
                    imgElem.attr('data-original')
                videoDet.vod_name = imgElem.attr('alt')

                // 获取备注
                videoDet.vod_remarks = $(e).find('.module-item-note').text()

                videos.push(videoDet)
            })
        }
        backData.data = videos
    } catch (error) {
        backData.error = '获取列表失败: ' + error
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
        let webUrl = combineUrl(args.url)
        let pro = await req(webUrl)

        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = args.url

            // 1. 获取标题和图片
            let imgInfo = $('.module-info-poster .module-item-pic img')
            vodDetail.vod_name = imgInfo.attr('alt')

            vodDetail.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + imgInfo.attr('data-original')


            // 2. 获取简介
            vodDetail.vod_content = $('.module-info-introduction-content p').text().trim()

            // 3. 获取 导演/编剧/主演
            let infoItems = $('.module-info-item')
            infoItems.each((_, item) => {
                let title = $(item).find('.module-info-item-title').text()
                let content = $(item).find('.module-info-item-content a').map((i, el) => $(el).text()).get().join(',')

                if (title.includes('导演')) {
                    vodDetail.vod_director = content
                } else if (title.includes('主演')) {
                    vodDetail.vod_actor = content
                }
            })

            // 4. 获取网盘链接
            const panUrls = []
            // 定位到下载模块的行
            let downloadRows = $('#download-list .module-row-info')

            downloadRows.each((_, row) => {
                // 获取包含注释的 HTML 原始内容
                let shortcutHtml = $(row).find('.module-row-shortcuts').html()

                if (shortcutHtml) {
                    // 使用正则提取注释中的 data-clipboard-text
                    let match = shortcutHtml.match(/data-clipboard-text="([^"]+)"/)

                    if (match && match[1]) {
                        panUrls.push(match[1])
                    }
                }
            })

            vodDetail.panUrls = panUrls
            
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
 * URL格式参考: /vodsearch/关键字----------页码---/
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        // 构造搜索URL
        let searchUrl = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/vodsearch/${args.searchWord}----------${args.page}---/`

        let repData = await req(searchUrl)
        const $ = cheerio.load(repData.data)

        // 定位搜索结果
        let items = $('.module-card-item')

        items.each((_, item) => {
            let video = new VideoDetail()

            // 获取链接和标题
            let linkTag = $(item).find('.module-card-item-poster')
            video.vod_id = linkTag.attr('href')

            let imgTag = linkTag.find('img').first()
            video.vod_name = imgTag.attr('alt')
            video.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + imgTag.attr('data-original')

            // 获取备注
            video.vod_remarks = $(item).find('.module-item-note').text()

            backData.data.push(video)
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
    if (url.startsWith('http')) {
        return url
    }
    if (url.startsWith('/')) {
        return appConfig.webSite + url
    }
    return appConfig.webSite + '/' + url
}