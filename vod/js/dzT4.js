//@name:光速[优]-开发测试中
//@version:1
//@webSite:https://drpy-node-mauve.vercel.app/api/光速[优]
//@remark:开发测试中

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

import { cheerio, Crypto, Encrypt, JSONbig } from '../core/uz3lib.js'
// ignore

const appConfig = {
    _webSite: 'https://drpy-node-mauve.vercel.app/api/优酷[官]',
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

const fetch = async (params) => {
    // let p = ''
    // if (params) {
    //     const tmp = []
    //     for (let key in params) {
    //         tmp.push(`${key}=${encodeURIComponent(params[key])}`)
    //     }
    //     p = `&${tmp.join('&')}`
    // }
    const res = await req(`${appConfig.webSite}`, { queryParameters: params })
    return res.data ?? null
}

function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))
}

function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))
}

function dlog(...args) {
    UZUtils.debugLog('======> ', ...args)
}

let _filter = {}

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        const ret = await fetch()
        backData.data = ret.class
        _filter = ret.filters

        for (let index = 0; index < backData.data.length; index++) {
            const element = backData.data[index]
            element.hasSubclass = ret.filters[element.type_id]?.length > 0
        }
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
        let filterList = _filter[args.url] ?? []

        let filterTitles = []
        for (let i = 0; i < filterList.length; i++) {
            const elementT = filterList[i]

            let title = new FilterTitle()
            title.name = elementT.name
            dlog(elementT.name)
            title.list = []

            for (let j = 0; j < elementT.value.length; j++) {
                const elementL = elementT.value[j]
                var filterLab = new FilterLabel()
                filterLab.name = elementL.n
                filterLab.id = elementL.v
                filterLab.key = elementT.key
                title.list.push(filterLab)
            }
            filterTitles.push(title)
        }

        backData.data = { filter: filterTitles }
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
        const ret = await fetch({
            ac: 'list',
            t: args.url,
            pg: args.page,
        })
        backData.data = ret.list
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
        let filterMap = args.filter.reduce((acc, curr) => {
            acc[curr.key] = curr.id
            return acc
        }, {})
        filterMap['type_id'] = args.mainClassId
        filterMap = JSON.stringify(filterMap)
        dlog('   filterMap   ', filterMap)
        filterMap = base64Encode(filterMap)

        const ret = await fetch({
            ac: 'list',
            t: args.url,
            pg: args.page,
            ext: filterMap,
        })
        backData.data = ret.list
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
        const ret = await fetch({
            ac: 'detail',
            ids: args.url,
        })
        if (ret.list && ret.list.length > 0) {
            backData.data = ret.list[0]
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
        const ret = await fetch({
            flag: args.flag,
            play: args.url,
        })
        dlog('   getVideoPlayUrl   ', ret)
        const flag = args.flag

        if (ret.jx === 1 || ret.parse === 1) {
            backData.error = ret.msg || ret.message || JSON.stringify(ret)
        } else {
            if (Array.isArray(ret.url)) {
                const nameMap = {
                    RAW: {
                        name: '原画',
                        priority: flag == 'quark' ? 0 : 9999,
                    },
                    '4k': {
                        name: '4k',
                        priority: 3000,
                    },
                    super: {
                        name: '超清',
                        priority: 2000,
                    },
                    high: {
                        name: '高清',
                        priority: 1000,
                    },
                    low: {
                        name: '流畅',
                        priority: 100,
                    },
                    //
                    QHD: { name: '超清', priority: 4000 },
                    FHD: { name: '高清', priority: 3000 },
                    HD: { name: '标清', priority: 2000 },
                    SD: { name: '普画', priority: 1000 },
                    LD: { name: '极速', priority: 100 },
                    //
                    FOUR_K: { name: '4K', priority: 4000 },
                    SUPER: { name: '超清', priority: 3000 },
                    HIGH: { name: '高清', priority: 2000 },
                    NORMAL: { name: '流畅', priority: 1000 },
                }
                let urls = ret.url.reduce((acc, curr, index, array) => {
                    if (index % 2 === 0) {
                        if (curr.startsWith('代理')) {
                            return acc
                        }
                        acc.push({
                            name: nameMap[curr]?.name ?? curr,
                            url: array[index + 1],
                            header: ret.header,
                            priority: nameMap[curr]?.priority ?? 0,
                        })
                    }
                    return acc
                }, [])
                backData.urls = urls
                backData.data = urls[0]
            } else {
                backData.data = ret.url
            }
            if (ret.header) backData.headers = ret.header
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
        const ret = await fetch({
            wd: args.searchWord,
            pg: args.page,
        })
        backData.data = ret.list
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}
