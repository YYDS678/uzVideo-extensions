//@name:「盘」 清影
//@version:1
//@webSite:https://revohd.com
//@remark:
//@order: B
const appConfig = {
    _webSite: 'https://revohd.com',
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
            type_name: '电影',
            hasSubclass: false,
        },
        {
            type_id: '2',
            type_name: '剧集',
            hasSubclass: false,
        },
        {
            type_id: '5',
            type_name: '动漫',
            hasSubclass: false,
        },
        {
            type_id: '3',
            type_name: '娱乐',
            hasSubclass: false,
        }
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
        `/index.php/vod/show/id/${args.url}/page/${args.page}.html`
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
                videoDet.vod_pic = combineUrl($(e)
                    .find('.module-item-pic img')
                    .attr('data-src'))
                videoDet.vod_remarks = $(e).find('.module-item-text').text()
                videoDet.vod_year = $(e)
                    .find('.module-item-caption span')
                    .first()
                    .text()
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
            // 标题
            vodDetail.vod_name = $('.video-info-header h1.page-title a').text().trim() || $('.video-info-header h1.page-title').text().trim()
            // 封面
            vodDetail.vod_pic = combineUrl($('.module-item-pic img').attr('data-src'))
            // 导演
            vodDetail.vod_director = ''
            // 主演
            vodDetail.vod_actor = ''
            // 简介
            vodDetail.vod_content = $('.video-info-content.vod_content').text().trim() || $('.video-info-itemtitle:contains("剧情")').nextAll('.video-info-item').first().text().trim()
            // 年份
            vodDetail.vod_year = $('.video-info-aux .tag-link').filter((_,el)=>/\d{4}/.test($(el).text())).text().trim()
            // 地区
            vodDetail.vod_area = $('.video-info-aux .tag-link').filter((_,el)=>/大陆|香港|台湾|美国|英国|日本|韩国|法国/.test($(el).text())).text().trim()
            // 类型
            vodDetail.vod_type = $('.video-info-aux .tag-link').not(function(){return $(this).text().match(/\d{4}|大陆|香港|台湾|美国|英国|日本|韩国|法国/) }).text().trim()
            // 评分
            vodDetail.vod_douban_score = $('.video-info-itemtitle:contains("评分")').next('.video-info-item').text().replace('分','').trim() || $('.module-item-caption span').first().text().replace('豆瓣','').trim()
            // panUrls
            vodDetail.panUrls = []
            $('.module-row-info .module-row-title p').each((_, el) => {
              let url = $(el).text().trim()
              if (url.startsWith('http')) vodDetail.panUrls.push(url)
            })
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
        let searchWord = encodeURIComponent(args.searchWord)
        let searchUrl
        if (args.page == 1) {
            searchUrl = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/vodsearch/-------------.html?wd=${searchWord}`
        } else {
            searchUrl = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/vodsearch/${searchWord}----------${args.page}---.html`
        }
        let repData = await req(searchUrl)
        const $ = cheerio.load(repData.data)
        let items = $('.module-search-item')
        if (items.length === 0) {
            items = $('.module-item')
        }
        items.each((_, e) => {
            let video = new VideoDetail()
            video.vod_id = $(e).find('.module-item-pic a').attr('href')
            video.vod_name = $(e).find('.module-item-pic img').attr('alt')
            video.vod_pic = combineUrl($(e).find('.module-item-pic img').attr('data-src'))
            video.vod_remarks = $(e).find('.module-item-text').text()
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