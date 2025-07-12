// ignore
//@name:可选线路弹幕扩展
//@version:2
//@remark:v1.6.60 及以上版本可用
//@env:弹幕线路##格式 线路名称1@地址1;线路名称2@地址2
//@order: A01
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

import { cheerio } from '../../core/core/uz3lib.js'
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
    }
}

// 内置的弹幕解析线路
var danmuLines = [
    {
        name: '智能',
        url: '',
    },
    {
        name: '虾米',
        url: 'https://dmku.hls.one/?ac=dm&url=',
    },
    {
        name: '牛牛',
        url: 'http://dm.apptotv.top/?ac=dm&url=',
    },
    {
        name: 'DouFun',
        url: 'https://danmu.56uxi.com/?ac=dm&url=',
    },
    {
        name: '弹幕库',
        url: 'https://api.danmu.icu/?ac=dm&url=',
    },
    {
        name: '墨白',
        url: 'http://124.223.12.23:5566/dmku/?ac=dm&url=',
    },
    {
        name: 'vidz',
        url: 'https://dm.vidz.asia/?ac=dm&url=',
    },
]

/**
 * 获取所有弹幕线路，可选
 * v1.6.60 及以上版本可用
 * @returns {Promise<{lines: string[],error: string}>} result - 返回一个包含弹幕线路列表的 Promise 对象
 */

async function getLines() {
    let error = ''
    let allLines = await getEnv(appConfig.uzTag, '弹幕线路')
    let names = []
    if (allLines.length > 0) {
        var userLines = allLines.split(';').map((item) => {
            var arr = item.split('@')
            if (arr.length == 2) {
                return {
                    name: arr[0],
                    url: arr[1],
                }
            }
        })
        danmuLines = danmuLines.concat(userLines)
        // 去重，保留位置靠后的数据
        danmuLines = danmuLines.filter(
            (item, index, self) =>
                index === self.findLastIndex((t) => t.url === item.url)
        )
        // 检查是否存在 重名，并将重名的后面加上索引
        danmuLines.forEach((item) => {
            if (names.includes(item.name)) {
                item.name += '-' + danmuLines.indexOf(item)
            }
            names.push(item.name)
        })
    }
    return formatBackData({
        lines: danmuLines.map((item) => item.name),
        error: error,
    })
}

/**
 * 搜索弹幕
 * @param {SearchParameters} args - 包含搜索参数的对象
 * @returns {Promise<BackData>} backData - 返回一个 Promise 对象
 */
async function searchDanMu(args) {
    let backData = new BackData()
    try {
        // 首先获取视频播放地址
        const videoUrl = await getVideoUrl(args)

        if (!videoUrl || videoUrl.length === 0) {
            backData.error = '未找到视频播放地址'
            return formatBackData(backData)
        }

        // 获取弹幕线路链接
        let lines = danmuLines.map((item) => item.url)

        if (args.line && args.line !== '智能') {
            const matchedLine = danmuLines.find(
                (line) => line.name === args.line
            )
            if (matchedLine) {
                lines = [matchedLine.url]
            }
        }
        // 移除无效的线路
        lines = lines.filter((item) => item.length > 0)
        // 并发请求所有弹幕线路
        const promises = lines.map(async (line) => {
            try {
                let reqUrl = line + videoUrl
                const response = await req(reqUrl, {
                    responseType: ReqResponseType.plain,
                })
                if (response.data) {
                    const danmuList = parseDanmuData(response.data)
                    if (danmuList.length > 0) {
                        return danmuList
                    }
                }
            } catch (error) {}
            return null
        })

        // 使用 Promise.race 获取第一个不为空的结果
        const firstValidResult = await Promise.race([
            ...promises.map(async (promise) => {
                const result = await promise
                if (result && result.length > 0) return result
                return new Promise(() => {}) // 如果结果为空，永远不会resolve
            }),
            Promise.all(promises).then(
                (results) => results.find((r) => r && r.length > 0) || []
            ), // 如果没有提前返回，则等待所有请求完成后返回第一个不为空的
        ])

        backData.data = firstValidResult
    } catch (error) {
        backData.error = error.toString()
    }

    if (backData.data.length == 0) {
        backData.error = backData.error || '未找到弹幕'
    }
    return formatBackData(backData)
}

// 内置的采集线路
var caiJi = [
    'https://zy.xmm.hk/api.php/provide/vod',
    'https://www.69mu.cn/api.php/provide/vod',
]

/**
 * 解析弹幕数据
 * @param {string} data - 弹幕数据
 * @returns {DanMu[]} - 解析后的弹幕数组
 */
function parseDanmuData(data) {
    let danmuList = []
    try {
        data = data.trim()
        // 尝试解析 XML 格式弹幕
        if (data.includes('<d p=')) {
            const $ = cheerio.load(data, { xmlMode: true })
            $('d').each((_, element) => {
                const p = $(element).attr('p')
                if (p) {
                    const parts = p.split(',')
                    if (parts.length >= 1) {
                        const danmu = new DanMu()
                        danmu.time = parseFloat(parts[0]) || 0
                        danmu.content = $(element).text().trim()
                        if (danmu.content) {
                            danmuList.push(danmu)
                        }
                    }
                }
            })
        }
        // 尝试解析 JSON 格式弹幕
        else {
            const jsonData = JSON.parse(data)
            let single = (jsonData?.danmuku ?? []).slice(2)
            single = single
                .map((item) => {
                    let danMu = new DanMu()
                    danMu.content = item[4]
                    danMu.time = item[0]
                    return danMu
                })
                .filter(
                    (danMu) =>
                        danMu.content.indexOf('http') === -1 ||
                        danMu.content.indexOf('com') === -1 ||
                        danMu.content.indexOf('xyz') === -1
                )
            danmuList = danmuList.concat(single)
        }
    } catch (error) {
        console.log('解析弹幕数据失败:', error.toString())
    }
    return danmuList
}

/**
 * 获取视频的播放地址
 * @param {SearchParameters} args
 * @returns {Promise<string>}
 */
async function getVideoUrl(args) {
    if (args.videoUrl && args.videoUrl.startsWith('http')) {
        return args.videoUrl.trim()
    }

    let videoName = args.name
    let episode = args.episode

    // 并发请求所有采集站，返回第一个有效结果
    const promises = caiJi.map(async (site) => {
        try {
            var searchUrl = `${site}/?ac=detail&wd=${videoName}&pg=1`
            console.log('搜索视频地址:', searchUrl)
            const response = await req(searchUrl)
            if (response.data) {
                const data = JSON.parse(response.data)
                if (data.list && data.list.length > 0) {
                    const video = data.list[0]
                    if (video.vod_name == videoName) {
                        var lines = video.vod_play_url.split('$$$')
                        for (let index = 0; index < lines.length; index++) {
                            const element = lines[index]
                            var eps = element.split('#')
                            for (let index = 0; index < eps.length; index++) {
                                const ep = eps[index]
                                var epArr = ep.split('$')
                                if (epArr.length == 2) {
                                    var epName = epArr[0]
                                    var epUrl = epArr[1]
                                    if (index == parseInt(episode) - 1) {
                                        return epUrl
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log('请求失败:', error.toString())
        }
        return ''
    })

    // 使用 Promise.race 获取第一个成功的结果
    const results = await Promise.race([
        ...promises.map(async (promise) => {
            const result = await promise
            if (result) return result
            return new Promise(() => {}) // 如果结果为空，永远不会resolve
        }),
        new Promise((resolve) => setTimeout(() => resolve(''), 20000)), // 20秒超时
    ])

    return results
}
