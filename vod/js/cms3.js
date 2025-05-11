//@name:「解」 小猫咪
//@version:1
//@webSite:https://zy.xiaomaomi.cc/api.php/provide/vod
//@remark:通用官采解析2，需配合网盘解析工具使用。在环境变量配置 采集解析地址。
//@env:采集解析地址##内置两个，失效不要反馈。格式：名称1@地址1;名称2@地址2
// @order: A

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

const appConfig = {
    _webSite: 'https://zy.xiaomaomi.cc/api.php/provide/vod',
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

    ignoreClassName: ['短剧', '资讯', '明星资讯', '影视资讯', '演员', '内地', '港台', '欧美', '日韩'],


    jiexiMap:{}
}

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        let response = await req(appConfig.webSite)
        let data = JSON.parse(response.data)
        backData.data = data.class.filter((item) => {
            const typeName = item.type_name.toLowerCase()
            return !appConfig.ignoreClassName.some((keyword) =>
                typeName.includes(keyword.toLowerCase())
            )
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

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        let response = await req(
            `${appConfig.webSite}?ac=detail&t=${args.url}&pg=${args.page}`
        )
        let data = JSON.parse(response.data)
        backData.data = data.list
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




/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoDetail())>}
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let response = await req(
            `${appConfig.webSite}?ac=detail&ids=${args.url}`
        )
        let data = JSON.parse(response.data)
        let video = data.list[0]
        let allUrls = await getEnv(appConfig.uzTag, '采集解析地址')
        if (allUrls.length < 1) {
            allUrls =
                '钓鱼@http://8.129.30.117:8117/diaoyu.php?url=;乌贼@http://jx.dedyn.io/?url='
            await setEnv(appConfig.uzTag, '采集解析地址', allUrls)
        }
        const jxLinks = allUrls.split(';')

        const singleFrom = video.vod_play_url.replace(/\${3}/g, '#')
        let allFrom = ""
        let fromNames = ""
        for (let i = 0; i < jxLinks.length; i++) {
            allFrom += singleFrom + "$$$"
            const fromName = jxLinks[i].split('@')[0]
            const fromUrl = jxLinks[i].split('@')[1]
            fromNames += fromName + "$$$"
            appConfig.jiexiMap[fromName] = fromUrl
        }
        if (allFrom.endsWith('$$$')) {
            allFrom = allFrom.slice(0, -3)
        }
        if (fromNames.endsWith('$$$')) {
            fromNames = fromNames.slice(0, -3)
        }

        video.vod_play_url = allFrom
        video.vod_play_from = fromNames
        backData.data = video
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
        const api = appConfig.jiexiMap[args.flag]
        const response = await req(api + args.url)

            if (response.code === 200) {
                let item
                try {
                    item = JSON.parse(response.data)
                } catch (error) {
                    item = response.data
                }
                if (item) {
                    for (let key in item) {
                        if (item.hasOwnProperty(key)) {
                            let value = item[key]
                            if (value && typeof value === 'string') {
                                if (
                                    value.includes('http') &&
                                    (value.includes('m3u8') ||
                                        value.includes('mp4'))
                                ) {
                                    backData.data = value
                                    break
                                }
                            }
                        }
                    }
                }
            }


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
        const response = await req(
            `${appConfig.webSite}?ac=detail&wd=${args.searchWord}&pg=${args.page}`
        )
        const data = JSON.parse(response.data)
        backData.data = data.list
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}