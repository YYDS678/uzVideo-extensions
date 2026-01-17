// ignore

//@name:[直] 奇优
//@webSite:http://www.qiyoudy4.com
//@version:2
//@remark:
//@order: B

// ignore



// ignore
// 不支持导入，这里只是本地开发用于代码提示
// 如需添加通用依赖，请联系 https://t.me/uzVideoAppbot
import {
    FilterLabel,
    FilterTitle,
    VideoClass,
    VideoSubclass,
    VideoDetail,
    RepVideoClassList,
    RepVideoSubclassList,
    RepVideoList,
    RepVideoDetail,
    RepVideoPlayUrl,
    UZArgs,
    UZSubclassVideoListArgs,
} from '../core/uzVideo.js'

import {
    UZUtils,
    ProData,
    ReqResponseType,
    ReqAddressType,
    req,
    getEnv,
    setEnv,
    goToVerify,
    openWebToBindEnv,
    toast,
    kIsDesktop,
    kIsAndroid,
    kIsIOS,
    kIsWindows,
    kIsMacOS,
    kIsTV,
    kLocale,
    kAppVersion,
    formatBackData,
} from '../core/uzUtils.js'

import { cheerio, Crypto, Encrypt, JSONbig } from '../core/uz3lib.js'
// ignore


//MARK: 注意
// 直接复制该文件进行扩展开发
// 请保持以下 变量 及 函数 名称不变
// 请勿删减，可以新增

const appConfig = {
    _webSite: 'http://www.qiyoudy4.com',
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

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

const ignoreClassName = ['首页', '妹子', '伦理']

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        const webUrl = args.url || appConfig.webSite
        appConfig.webSite = UZUtils.removeTrailingSlash(webUrl)
        const pro = await req(appConfig.webSite, { headers: headers })
        backData.error = pro.error
        const proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let allClass = $('.stui-header__menu li a')
            let list = []
            allClass.each((index, element) => {
                const cat = $(element)
                const className = cat.text()
                if (isIgnoreClassName(className)) return

                let name = className
                let url = cat.attr('href')
                if (url && url.length > 0 && name.length > 0) {
                    let videoClass = new VideoClass()
                    const matches = url.match(/list\/(\d+)\.html/)
                    if (matches) {
                        videoClass.type_id = matches[1]
                        videoClass.type_name = name
                        list.push(videoClass)
                    }
                }
            })
            backData.data = list
        }
    } catch (e) {
        backData.error = e.message
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
    let listUrl = appConfig.webSite + `/list/${args.url}_${args.page}.html`
    let backData = new RepVideoList()
    try {
        let pro = await req(listUrl, { headers: headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let allVideo = $('.stui-vodlist__box')
            let videos = []
            allVideo.each((_, e) => {
                let url = $(e).find('a').attr('href')
                let name = $(e).find('a').attr('title')
                let pic = $(e).find('a').attr('data-original')
                let remarks = $(e).find('span.pic-text').text()
                let videoDet = new VideoDetail()
                videoDet.vod_id = url
                videoDet.vod_pic = pic
                videoDet.vod_name = name
                videoDet.vod_remarks = remarks
                videos.push(videoDet)
            })
            backData.data = videos
        }
    } catch (e) {
        backData.error = '获取列表失败～' + e.message
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

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoDetail())>}
 */
async function getVideoDetail(args) {
    let backData = new RepVideoDetail()
    const webUrl = appConfig.webSite + args.url
    try {
        const pro = await req(webUrl, { headers: headers })
        backData.error = pro.error
        const proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vod_content = $('meta[property=og:description]').attr('content')
            let vod_pic = $('.stui-vodlist__thumb img').attr('data-original')
            let vod_name = $('.stui-vodlist__thumb').attr('title')
            let vod_year = ''
            let vod_director = $('meta[property=og:video:director]').attr('content')
            let vod_actor = $('meta[property=og:video:actor]').attr('content')
            let vod_area = $('meta[property=og:area]').attr('content')
            let vod_lang = ''
            let vod_douban_score = ''
            let type_name = ''

            let playlist = $('.stui-content__playlist')
            let vod_play_url = []
            playlist.each((index, element) => {
                if (index === 0) return // 屏蔽第一条播放线路
                let eps = $(element).find('li a')
                let temp = ''
                eps.each((_, e) => {
                    let name = $(e).text()
                    let url = $(e).attr('href')
                    temp += `${name}$${url}#`
                })
                vod_play_url.push(temp)
            })

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
            detModel.vod_play_url = vod_play_url.join('$$$')
            detModel.vod_id = args.url

            backData.data = detModel
        }
    } catch (e) {
        backData.error = '获取视频详情失败' + e.message
    }

    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
    let backData = new RepVideoPlayUrl()
    let reqUrl = appConfig.webSite + args.url

    try {
        const pro = await req(reqUrl, { headers: headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let iframe = $('iframe').attr('src')
            let player = await req(iframe, { headers: headers })
            if (player.data) {
                const $ = cheerio.load(player.data)
                $('script').each((_, e) => {
                    if ($(e).text().includes('DPlayer')) {
                        let playUrlMatch = $(e).text().match(/vid="(.*?)";/)
                        if (playUrlMatch) {
                            let playUrl = playUrlMatch[1]
                            backData.data = playUrl
                            backData.headers = headers
                        }
                    }
                })
            }
        }
    } catch (e) {
        UZUtils.debugLog(e)
        backData.error = e.message
    }
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
    let backData = new RepVideoList()
    try {
        let searchUrl = `${appConfig.webSite}/search.php`
        let pro = await req(searchUrl, {
            method: 'post',
            headers: { 'user-agent': headers['User-Agent'], 'content-type': 'application/x-www-form-urlencoded' },
            data: `searchword=${encodeURIComponent(args.searchWord)}`,
        })
        backData.error = pro.error
        let body = pro.data
        if (body) {
            let $ = cheerio.load(body)
            let allVideo = $('.stui-vodlist__media > li')
            let videos = []
            allVideo.each((_, e) => {
                let url = $(e).find('a').attr('href')
                let name = $(e).find('a').attr('title')
                let pic = $(e).find('a').attr('data-original')
                let remarks = $(e).find('span.pic-text').text()
                let videoDet = new VideoDetail()
                videoDet.vod_id = url
                videoDet.vod_pic = pic
                videoDet.vod_name = name
                videoDet.vod_remarks = remarks
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
    for (let index = 0; index < ignoreClassName.length; index++) {
        const element = ignoreClassName[index]
        if (className.indexOf(element) !== -1) {
            return true
        }
    }
    return false
}
