// ignore
//@name:「盘」 南风短剧
//@version:1
//@webSite:https://www.nanf.cc
//@remark:
//@order: B
// 不支持导入，这里只是本地开发用于代码提示
// 如需添加通用依赖，请联系 https://t.me/uzVideoAppbot
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzUtils.js'
import {} from '../../core/uz3lib.js'
// ignore

const appConfig = {
    _webSite: 'https://www.nanf.cc',
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

    UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ignoreClassName: ['首页', '热播榜', 'APP下载'],
}

async function getClassList(args) {
    const webUrl = args.url
    appConfig.webSite = UZUtils.removeTrailingSlash(webUrl)
    let backData = new RepVideoClassList()
    try {
        const pro = await req(webUrl, {
            headers: { 'User-Agent': appConfig.UA },
        })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            let document = parse(proData)
            let allClass = document.querySelectorAll('#DialogMenu ul.menu a')
            let list = []
            for (let index = 0; index < allClass.length; index++) {
                const element = allClass[index]
                let isIgnore = isIgnoreClassName(element.text)
                if (isIgnore) {
                    continue
                }
                let type_name = element.text
                let url = element.attributes['href']

                if (url.length > 0 && type_name.length > 0) {
                    let videoClass = new VideoClass()
                    videoClass.type_id = url
                    videoClass.type_name = type_name
                    list.push(videoClass)
                }
            }
            // UZUtils.debugLog(list)
            backData.data = list
        }
    } catch (e) {
        backData.error = e.message
    }

    return JSON.stringify(backData)
}

async function getVideoList(args) {
    let backData = new RepVideoList()
    try {
        const type = args.url.match(/djtype\/(\d+)\.html/)[1]
        const url =
            appConfig.webSite + `/djshow/${type}--------${args.page}---.html`
        const pro = await req(url, { headers: { 'User-Agent': appConfig.UA } })
        backData.error = pro.error
        const $ = cheerio.load(pro.data)
        const allvideos = $('.shoutu-vodlist > li')
        let videos = []
        allvideos.each((_, e) => {
            let videoDet = new VideoDetail()
            videoDet.vod_id = $(e).find('a.cover-img').attr('href')
            videoDet.vod_pic = $(e)
                .find('a.cover-img img')
                .attr('data-original')
            videoDet.vod_name = $(e).find('a.cover-img').attr('title')
            videos.push(videoDet)
        })
        backData.data = videos
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

async function getVideoDetail(args) {
    let backData = new RepVideoDetail()
    const webUrl = appConfig.webSite + args.url
    try {
        const pro = await req(webUrl, {
            headers: { 'User-Agent': appConfig.UA },
        })
        backData.error = pro.error
        const proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vod_content = $('p.desc').text().replace('简介：', '')
            let vod_pic = $('.cover-img img').attr('data-original')
            let vod_name = $('.shoutu-media-bd h1').text()
            let vod_year = ''
            let vod_director = ''
            let vod_actor = ''
            let vod_area = ''
            let vod_lang = ''
            let vod_douban_score = ''
            let type_name = ''

            let vod_play_url =
                $('.wp_play > a').text() + '$' + $('.wp_play > a').attr('href')

            let detModel = new VideoDetail()
            detModel.vod_year = vod_year
            detModel.type_name = type_name
            detModel.vod_director = vod_director
            detModel.vod_actor = vod_actor
            detModel.vod_area = vod_area
            detModel.vod_lang = vod_lang
            detModel.vod_douban_score = vod_douban_score
            detModel.vod_content = vod_content
            detModel.vod_pic = vod_pic
            detModel.vod_name = vod_name
            // detModel.vod_play_url = '$#'
            detModel.vod_id = args.url
            detModel.panUrls = [$('.wp_play > a').attr('href')]

            backData.data = detModel
        }
    } catch (e) {
        backData.error = '获取视频详情失败' + e.message
    }

    return JSON.stringify(backData)
}

async function getVideoPlayUrl(args) {
    let backData = new RepVideoPlayUrl()
    try {
    } catch (e) {
        backData.error = e.message
    }
    return JSON.stringify(backData)
}

async function searchVideo(args) {
    let backData = new RepVideoList()
    try {
        const url = `${appConfig.webSite}/djsearch/${args.searchWord}----------${args.page}---.html`

        const pro = await req(url, { headers: { 'User-Agent': appConfig.UA } })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            const allvideos = $('.shoutu-vodlist > li')
            let videos = []
            allvideos.each((_, e) => {
                let videoDet = new VideoDetail()
                videoDet.vod_id = $(e).find('a.cover-img').attr('href')
                videoDet.vod_pic = $(e)
                    .find('a.cover-img img')
                    .attr('data-original')
                videoDet.vod_name = $(e).find('a.cover-img').attr('title')

                videos.push(videoDet)
            })

            backData.data = videos
        }
    } catch (e) {
        backData.error = e.message
    }
    return JSON.stringify(backData)
}

function isIgnoreClassName(className) {
    for (let index = 0; index < appConfig.ignoreClassName.length; index++) {
        const element = appConfig.ignoreClassName[index]
        if (className.indexOf(element) !== -1) {
            return true
        }
    }
    return false
}

//MARK: 注意
// 直接复制该文件进行扩展开发
// 请保持以下 变量 及 函数 名称不变
// 请勿删减，可以新增

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
    var backData = new RepVideoSubclassList()
    try {
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
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}
