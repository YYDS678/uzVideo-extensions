//@name:[盘]tg搜
//@version:1
//@webSite:123云盘@zyfb123&豆儿盘@douerpan
//@remark:格式 频道名称1@频道id1&频道名称2@频道id2

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
} from '../../core/core/uzVideo.js'

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
} from '../../core/core/uzUtils.js'

import { cheerio, Crypto, Encrypt, JSONbig } from '../../core/core/uz3lib.js'
// ignore

//MARK: 注意
// 直接复制该文件进行扩展开发
// 请保持以下 变量 及 函数 名称不变
// 请勿删减，可以新增

const appConfig = {
    _webSite: '123云盘@zyfb123&豆儿盘@douerpan',
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

    tgs: 'https://t.me/s/',

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
    try {
        appConfig.webSite.split('&').forEach((item) => {
            let name = item.split('@')[0]
            let id = item.split('@')[1]
            backData.data.push({
                type_id: id,
                type_name: name,
            })
        })
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
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}


const _videoListPageMap = {}
/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        let endUrl = appConfig.tgs + args.url
        if(args.page == 1) {
            _videoListPageMap[args.url] = ""
        }else {
            const nextPage = _videoListPageMap[element] ?? ""
            if(nextPage.length == 0 || nextPage == "0") {
                return JSON.stringify(backData)
            }
            endUrl += nextPage
        }
        const res = await getTGList(endUrl)
        backData.data = res.videoList
        _videoListPageMap[args.url] = res.nextPage
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}


async function getTGList(url){
    let videoList = []
    let nextPage = ""
    try {
        const res = await req(url)
        const $ = cheerio.load(res.data)
          nextPage = $('link[rel="prev"]').attr('href')?.split('?')?.[1]

        const messageList = $('.tgme_widget_message_bubble')
        for (let i = 0; i < messageList.length; i++) {
            const message = messageList[i]
            const aList = $(message).find('a')
            const video = new VideoDetail()

            for (let j = 0; j < aList.length; j++) {
                const a = aList[j]
                const style = $(a).attr('style')

                if (style && style.includes('image')) {
                    const regex = /url\(['"]?(https?:\/\/[^'")]+)['"]?\)/
                    const match = style.match(regex)
                    if (match) {
                        const imageUrl = match[1]
                        video.vod_pic = imageUrl
                        break
                    }
                }
            }
            const time = $(message).find('time').attr('datetime')

            const date = new Date(time)
            const formattedDate = date
                .toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                })
                .replace(/\//g, '-')
            video.vod_remarks = formattedDate
            const htmlContent = $('div.tgme_widget_message_text').html()
            // 取到第一个 <br> 之前的内容
            const titles = htmlContent
                .split('<br>')[0]
                ?.replace(/<[^>]+>/g, "")
                ?.trim()
                ?.substring(3)
                ?.trim()
                ?.split(' ')
            video.vod_name = titles[0]
            if (titles.length > 1) {
                // 最后一项为备注
                video.vod_remarks = titles[titles.length - 1]
            }
            const ids = _getAllPanUrls(message)
            video.vod_id = JSON.stringify(ids)
            videoList.push(video)
        }
    } catch (error) {
        
    }
    videoList.reverse()
    if(nextPage?.length > 0) {
     nextPage = `?${nextPage}`
    }else{
        nextPage = "0"
    }
    return {videoList, nextPage}
}

function _getAllPanUrls(html) {
    const $ = cheerio.load(html)
    const aList = $('a')
    let results = []
    const panUrlsExt = [
        '189.cn', //天翼
        '123684.com', // 123
        '123865.com',
        '123912.com',
        '123pan.com',
        '123pan.cn',
        '123592.com',
        'pan.quark.cn', // 夸克
        'drive.uc.cn', // uc
        'alipan.com', // 阿里
    ]

    for (let i = 0; i < aList.length; i++) {
        const element = aList[i]
        const href = $(element)?.attr('href') ?? ''
        if (results.includes(href)) {
            continue
        }
        // 如果 href 包含 panUrlsExt 中的某一个
        for (let j = 0; j < panUrlsExt.length; j++) {
            const element = panUrlsExt[j]
            if (href.includes(element)) {
                results.push(href)
            }
        }
    }

    return results
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
    var backData = new RepVideoDetail()
    try {
        backData.data = {
            panUrls: JSON.parse(args.url),
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
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

const _searchListPageMap = {}
/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        const channels = appConfig.webSite.split('&').map((item) => {
            return item.split('@')[1]
        })
        for (let index = 0; index < channels.length; index++) {
            const element = channels[index];
            let endUrl = appConfig.tgs + element + "?q=" + args.searchWord
        if(args.page == 1) {
            _searchListPageMap[args.element] = ""
        }else {
            const nextPage = _searchListPageMap[element] ?? ""
            if(nextPage.length == 0 || nextPage == "0") {
                return JSON.stringify(backData)
            }
            endUrl += nextPage
        }
        const res = await getTGList(endUrl)
        backData.data.push(...res.videoList)
        _searchListPageMap[element] = res.nextPage
        }
        
        
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}