// ignore
//@name:扩展名称
// 版本号纯数字
//@version:1
// 备注，没有的话就不填
//@remark:这是备注
// 加密 id，没有的话就不填
//@codeID:
// 使用的环境变量，没有的话就不填
//@env:
// 是否是AV 1是  0否
//@isAV:0
//是否弃用 1是  0否
//@deprecated:0
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

const appConfig = {
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

class DanMu {
    constructor() {
        /**
         * 弹幕内容
         * @type {string}
         */
        this.content = ''

        /**
         * 弹幕出现时间 单位秒
         * @type {number}
         */
        this.time = 0
    }
}

class BackData {
    constructor() {
        /**
         * 弹幕数据
         * @type {DanMu[]}
         */
        this.data = []
        /**
         * 错误信息
         * @type {string}
         */
        this.error = ''
    }
}

class SearchParameters {
    constructor() {
        /**
         * 动画或影片名称
         */
        this.name = ''
        /**
         * 动画或影片集数
         */
        this.episode = ''

        /**
         * 所在平台剧集链接
         * v1.6.60 及以上版本可用
         */
        this.videoUrl = ''

        /**
         * 弹幕线路
         * v1.6.60 及以上版本可用
         */
        this.line = ''

        /**
         * 搜索视频平台名称(getVideoPlatformList 返回的数据，调用 getVideoList 时传入)
         * v1.6.66 及以上版本可用
         */
        this.videoPlatformName = ''

        /**
         * 弹幕视频信息 调用 getVideoEpisodes 时传入
         * @type {DanVideo}
         * v1.6.66 及以上版本可用
         */
        this.danVideo = null

        /**
         * 不为空时，表示用户手动选择匹配 的视频信息 搜索弹幕时传入，getVideoEpisodes 返回的数据
         * @type {DanVideo}
         * v1.6.66 及以上版本可用
         */
        this.danEpisode = null
    }
}

class DanEpisode {
    constructor() {
        this.vod_name = ''
        this.vod_remarks = ''
        this.extData = {}
    }
}

/**
 * 弹幕视频信息
 */
class DanVideo extends DanEpisode {
    constructor() {
        super()
        this.vod_pic = ''
    }
}

/**
 * 获取所有弹幕线路 (可选)
 * v1.6.60 及以上版本可用
 * @returns {Promise<{lines: string[],error: string}>} result - 返回一个包含弹幕线路列表的 Promise 对象
 */

async function getLines() {
    return formatBackData({
        lines: [],
        error: '',
    })
}

/**
 * 获取搜索资源平台名称列表 (可选)
 * @returns {Promise<{data: string[], error: string}>} result - 返回一个包含平台信息列表的 Promise 对象
 */
async function getVideoPlatformList() {
    return formatBackData({
        data: [],
        error: '',
    })
}

/**
 * 获取视频列表 (可选，getVideoPlatformList 返回数据时，会调用该方法)
 * 根据搜索参数获取匹配的视频列表
 * @param {SearchParameters} args - 获取视频列表的参数
 * @returns {Promise<{data: DanVideo [], error: string}>} result - 包含视频列表和错误信息的Promise对象
 */
async function getVideoList(args) {
    return formatBackData({
        data: [],
        error: '',
    })
}

/**
 * 获取剧集列表 (可选)
 * @param {SearchParameters} args
 * @returns {Promise<{data: DanEpisode[], error: string}>} result - 获取剧集列表的返回结果
 */
async function getVideoEpisodes(args) {
    return formatBackData({
        data: [],
        error: '',
    })
}

/**
 * 搜索弹幕
 * @param {SearchParameters} item - 包含搜索参数的对象
 * @returns {Promise<BackData>} backData - 返回一个 Promise 对象
 */
async function searchDanMu(item) {
    let backData = new BackData()

    // item.danEpisode 不为空时，表示用户手动搜索匹配的视频
    try {
        let all = []
        //MARK: - 实现你的弹幕搜索逻辑

        backData.data = all
    } catch (error) {
        backData.error = error.toString()
    }
    if (backData.data.length == 0) {
        backData.error = '未找到弹幕'
    }
    return formatBackData(backData)
}
