//@name:[盘] 人人电影
//@version:1
//@webSite:https://www.rrdynb.com
//@remark: 
//@author:白猫
//@order:A01
const appConfig = {
    _webSite: 'https://www.rrdynb.com',
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
 * 获取分类列表
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    backData.data = [
        {
            type_id: 'movie/list_2',
            type_name: '电影',
            hasSubclass: false,
        },
        {
            type_id: 'dianshiju/list_6',
            type_name: '电视剧',
            hasSubclass: false,
        },
        {
            type_id: 'dongman/list_13',
            type_name: '动漫',
            hasSubclass: false,
        },
        {
            type_id: '/zongyi/list_10',
            type_name: '综艺',
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
 * 翻页格式: /movie/list_2_2.html
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    let url = UZUtils.removeTrailingSlash(appConfig.webSite) +
        `/${args.url}_${args.page}.html`

    try {
        const pro = await req(url)
        backData.error = pro.error

        let videos = []
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            // 定位一级标签: ul#movielist 下的 li
            let vodItems = $('#movielist li')

            vodItems.each((_, e) => {
                let videoDet = new VideoDetail()
                let $intro = $(e).find('.intro')

                // 链接和标题
                let $link = $intro.find('h2 a')
                videoDet.vod_id = $link.attr('href')

                // 标题清洗：取《》内的内容，如果没《》，则直接取完整title
                let rawTitle = $link.attr('title') || $link.text()
                let titleMatch = rawTitle.match(/《(.*?)》/)
                if (titleMatch) {
                    videoDet.vod_name = titleMatch[1]
                }

                // 图片: 在 .pure-u-5-24 下的 img
                videoDet.vod_pic = $(e).find('.pure-img').attr('data-original')

                // 备注/评分: 定位 .dou b
                let score = $(e).find('.dou b').text()
                videoDet.vod_remarks = score

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

            // 标题定位: .movie-des h1
            vodDetail.vod_name = $('.movie-des h1').text().trim()

            // 图片: 尝试从详情页获取，如果获取不到可以使用列表页的逻辑
            vodDetail.vod_pic = $('.movie-img img').attr('src')

            // 详情定位: .movie-txt
            let $txtDiv = $('.movie-txt')
            vodDetail.vod_content = $txtDiv.text().trim()

            // 提取网盘链接
            const panUrls = []
            let links = $txtDiv.find('a')

            links.each((_, el) => {
                let href = $(el).attr('href')
                let text = $(el).text()

                // 简单过滤
                if (href && !href.includes('xunlei') && !href.includes('aliyun')) {
                    panUrls.push(href)
                }
            })
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
 * 获取视频播放地址 (网盘类通常不需要此步骤，直接返回详情即可)
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * URL: /plus/search.php?q=xx&pagesize=10&submit=
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        // 构造搜索URL
        let searchUrl = combineUrl(
            `/plus/search.php?q=${encodeURIComponent(args.searchWord)}&pagesize=10&submit=`
        )
        // 注意：该站点搜索翻页参数未知，暂时只抓取第一页，或者尝试加 &PageNo=
        if (args.page > 1) {
            searchUrl += `&PageNo=${args.page}`
        }

        let repData = await req(searchUrl)
        const $ = cheerio.load(repData.data)

        // 搜索结果的DOM结构与分类列表完全一致
        let items = $('#movielist li.pure-g.shadow')

        items.each((_, item) => {
            let video = new VideoDetail()
            let $intro = $(item).find('.intro')
            let $link = $intro.find('h2 a')

            video.vod_id = $link.attr('href')

            // 标题清洗
            let rawTitle = $link.attr('title') || $link.text()
            let titleMatch = rawTitle.match(/《(.*?)》/)
            if (titleMatch) {
                video.vod_name = titleMatch[1].replace(/[<font color='red'>,</font>]/g, '')
            } else {
                video.vod_name = rawTitle.split('百度云')[0].trim()
            }

            video.vod_pic = $(item).find('.pure-u-5-24 img').attr('data-original')

            let score = $(item).find('.dou b').text()
            video.vod_remarks = score ? score : ''

            backData.data.push(video)
        })
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