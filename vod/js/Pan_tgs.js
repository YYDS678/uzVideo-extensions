//@name:[盘] TG搜
//@version:10
//@webSite:123资源@zyfb123&天翼日更@tianyirigeng&天翼臻影@tyysypzypd&夸克UC@ucquark&夸克电影@Q_dianying&夸克剧集@Q_dianshiju&夸克动漫@Q_dongman&百度¹@bdwpzhpd&百度²@BaiduCloudDisk&移动@ydypzyfx
//@env:TG搜代理地址##默认直接访问 https://t.me/s/ 有自己的代理服务填入即可，没有不用改动。
//@remark:格式 频道名称1@频道id1&频道名称2@频道id2
//@order: A17

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
    _webSite: '123资源@zyfb123&天翼日更@tianyirigeng&天翼臻影@tyysypzypd&夸克UC@ucquark&夸克电影@Q_dianying&夸克剧集@Q_dianshiju&夸克动漫@Q_dongman&百度¹@bdwpzhpd&百度²@BaiduCloudDisk&移动@ydypzyfx',
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
    _tgsInitialized: false, // 标记是否已初始化代理地址

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

// --- 全局常量/配置 ---
// 统一的网盘配置 - 单一数据源
const CLOUD_PROVIDERS = {
    tianyi: {
        name: '天翼',
        domains: ['189.cn']
    },
    quark: {
        name: '夸克',
        domains: ['pan.quark.cn']
    },
    uc: {
        name: 'UC',
        domains: ['drive.uc.cn']
    },
    baidu: {
        name: '百度',
        domains: ['pan.baidu.com', 'yun.baidu.com']
    },
    pan123: {
        name: '123',
        domains: ['123684.com', '123865.com', '123912.com', '123pan.com', '123pan.cn']
    },
    yidong: {
        name: '移动',
        domains: ['caiyun.139.com', 'yun.139.com']
    }
};

// 从统一配置自动生成所需数组
const panUrlsExt = Object.values(CLOUD_PROVIDERS).flatMap(provider => provider.domains);

// 预编译网盘提供商正则表达式，提高匹配性能
const providerRegexMap = Object.values(CLOUD_PROVIDERS).map(provider => ({
    name: provider.name,
    // 将多个域名组合成一个正则，用 | 分隔，转义点号
    regex: new RegExp(provider.domains.map(domain =>
        domain.replace(/\./g, '\\.')
    ).join('|'), 'i')
}));

// 预编译剧集信息提取正则表达式，一次匹配解决所有情况
const EPISODE_COMBINED_REGEX = /((?:更新至|全|第)\s*\d+\s*集)|((?:更新至|全|第)\s*[一二三四五六七八九十百千万亿]+\s*集)|((?:更至|更)\s*(?:EP)?\s*\d+)/;

// 预编译图片URL提取正则表达式
const IMAGE_URL_REGEX = /url\(['"]?(https?:\/\/[^'")]+)['"]?\)/;
// --- 全局常量结束 ---

/**
 * 初始化代理地址（仅在首次调用时执行）
 */
async function initTgsProxy() {
    if (!appConfig._tgsInitialized) {
        try {
            const tgs = await getEnv(appConfig.uzTag, "TG搜代理地址")
            if (tgs && tgs.length > 0) {
                appConfig.tgs = tgs
            }
            appConfig._tgsInitialized = true
        } catch (error) {
            console.error('初始化代理地址失败:', error)
            // 即使失败也标记为已初始化，避免重复尝试
            appConfig._tgsInitialized = true
        }
    }
}

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        // 初始化代理地址（仅首次执行）
        await initTgsProxy()

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
        // 初始化代理地址（仅首次执行）
        await initTgsProxy()

        let endUrl = appConfig.tgs + args.url
        if(args.page == 1) {
            _videoListPageMap[args.url] = ""
        }else {
            const nextPage = _videoListPageMap[args.url] ?? ""
            if(nextPage.length == 0 || nextPage == "0") {
                return JSON.stringify(backData)
            }
            endUrl += nextPage
        }
        const res = await getTGList(endUrl, false)
        // 返回前对结果进行去重
        backData.data = deduplicateVideoListByLinks(res.videoList);
        _videoListPageMap[args.url] = res.nextPage
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}


async function getTGList(url, isSearchContext = false){
    let videoList = []
    let nextPage = ""

    // --- 提取频道ID和名称 ---
    let currentChannelId = null;
    const urlMatch = url.match(/\/s\/([^/?]+)/);
    if (urlMatch && urlMatch[1]) {
        currentChannelId = urlMatch[1];
    }

    const channelMap = new Map();
    appConfig.webSite.split('&').forEach(item => {
        const parts = item.split('@');
        if (parts.length === 2) {
            channelMap.set(parts[1], parts[0]); // 键: id, 值: name
        }
    });

    const currentChannelName = currentChannelId ? (channelMap.get(currentChannelId) || '未知频道') : '未知频道';
    // --- 提取结束 ---

    try {
        const res = await req(url)
        const $ = cheerio.load(res.data)
          nextPage = $('link[rel="prev"]').attr('href')?.split('?')?.[1]

        const messageList = $('.tgme_widget_message_bubble')
        for (let i = 0; i < messageList.length; i++) {
            const message = messageList[i]
	            const messageContainer = $(message).closest('.tgme_widget_message')
            const aList = messageContainer.find('a')
            const video = new VideoDetail()

            // --- 提取消息ID ---
            const postIdStr = messageContainer.attr('data-post')?.split('/')?.[1];
            video.message_id = parseInt(postIdStr || '0') || 0; // 存储消息ID
            // --- 提取消息ID结束 ---

            for (let j = 0; j < aList.length; j++) {
                const a = aList[j]
                const style = $(a).attr('style')

                if (style && style.includes('image')) {
                    const match = style.match(IMAGE_URL_REGEX)
                    if (match) {
                        const imageUrl = match[1]
                        video.vod_pic = imageUrl
                        break
                    }
                }
            }
            const time = $(message).find('time').attr('datetime')

            // 安全的时间格式化处理，防止无效日期导致的错误
            let formattedDate = '未知时间';
            if (time) {
                const date = new Date(time);
                if (!isNaN(date.getTime())) {
                    formattedDate = date
                        .toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                        })
                        .replace(/\//g, '-');
                }
            }

            const htmlContent = $(message).find('div.tgme_widget_message_text').html()
            // 取到第一个 <br> 之前的内容
            let cleanedTitle = '';
            if (htmlContent) {
                cleanedTitle = htmlContent
                    .split('<br>')[0]
                    .replace(/<[^>]+>/g, "")
                    .trim()
                    .replace(/^(名称[：:])/, '')
                    .trim();
            }
	                // 标题清理 v2：
	                // 1) 去掉开头连续的 emoji/标点/空白，但保留各种左括号（避免残留“】”）
	                cleanedTitle = cleanedTitle
	                    .replace(/^[^\u4e00-\u9fa5A-Za-z0-9\(\[\{（【《「『〔〖〈﹝［]+/, '')
	                    .trim();

            // 首先分配初始清理后的标题
            video.vod_name = cleanedTitle;
            const ids = _getAllPanUrls(messageContainer.html() || "")
            video.vod_id = JSON.stringify(ids)

            // --- 新的备注逻辑：从URL确定提供商 ---
            let providers = new Set();

            if (ids && ids.length > 0) {
                for (const url of ids) {
                    for (const provider of providerRegexMap) {
                        if (provider.regex.test(url)) {
                            providers.add(provider.name);
                            // 找到匹配的提供商后跳出，提高性能
                            break;
                        }
                    }
                }
            }

            // --- 尝试从标题中提取剧集/季度信息 --- (移到这里)
            // 使用合并的正则表达式，一次匹配解决所有情况
            const episodeMatch = cleanedTitle.match(EPISODE_COMBINED_REGEX);
            const extractedEpisodeInfo = episodeMatch ? episodeMatch[0] : null;
            // --- 提取结束 ---

            // --- 如果提取了剧集信息，调整vod_name ---
            if (extractedEpisodeInfo) {
                video.vod_name = cleanedTitle.replace(extractedEpisodeInfo, '').trim();
            }
            // --- 调整结束 ---

            // --- 根据可用信息动态构建备注 ---
            const remarkParts = [];
            if (providers.size > 0) {
                remarkParts.push(Array.from(providers).join('/'));
            }
            // 只有在搜索上下文中且不是默认的'未知频道'时才添加频道名称
            if (isSearchContext && currentChannelName !== '未知频道') {
                remarkParts.push(currentChannelName);
            }
            if (extractedEpisodeInfo) {
                remarkParts.push(extractedEpisodeInfo);
            }

            if (remarkParts.length > 0) {
                video.vod_remarks = remarkParts.join('|');
            } else {
                // 如果没有其他信息可用，则回退到仅时间戳
                video.vod_remarks = formattedDate;
            }
            // --- 构建备注结束 ---

            // --- 只有包含有效网盘URL时才推送视频 ---
            if (ids && ids.length > 0) { // 检查ids数组是否不为空
                videoList.push(video);
            }
            // --- 检查结束 ---
        }
    } catch (error) {
        console.error('getTGList解析错误:', {
            url: url,
            error: error.message,
            stack: error.stack
        });
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
    const resultSet = new Set()  // 使用Set进行O(1)去重

    for (let i = 0; i < aList.length; i++) {
        const element = aList[i]
        const href = $(element)?.attr('href') ?? ''

        if (href && !resultSet.has(href)) {  // O(1)查找
            // 检查是否为网盘链接
            for (let j = 0; j < panUrlsExt.length; j++) {
                const domain = panUrlsExt[j]
                if (href.includes(domain)) {
                    resultSet.add(href);  // O(1)添加
                    break;  // 找到匹配就跳出
                }
            }
        }
    }

    return Array.from(resultSet);  // 转换回数组
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
        // 初始化代理地址（仅首次执行）
        await initTgsProxy()

        const channels = appConfig.webSite.split('&').map((item) => {
            return item.split('@')[1]
        })

        // 🚀 核心优化：并发请求所有频道
        const searchPromises = channels.map(async (element) => {
            let endUrl = appConfig.tgs + element + "?q=" + args.searchWord

            if(args.page == 1) {
                _searchListPageMap[element] = ""
            } else {
                const nextPage = _searchListPageMap[element] ?? ""
                if(nextPage.length == 0 || nextPage == "0") {
                    return { videoList: [], nextPage: "0", channel: element }
                }
                endUrl += nextPage
            }

            try {
                const res = await getTGList(endUrl, true)
                _searchListPageMap[element] = res.nextPage
                return {
                    videoList: res.videoList,
                    nextPage: res.nextPage,
                    channel: element
                }
            } catch (error) {
                console.error(`频道 ${element} 搜索失败:`, error)
                return { videoList: [], nextPage: "0", channel: element }
            }
        })

        // 🚀 并发执行所有请求，设置8秒超时防止慢请求拖累整体性能
        const results = await Promise.allSettled(
            searchPromises.map(promise =>
                Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('请求超时')), 8000)
                    )
                ])
            )
        )

        // 处理并发结果
        const allVideos = []
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.videoList) {
                // 为当前频道的结果去重
                const deduplicatedPageVideos = deduplicateVideoListByLinks(result.value.videoList);
                allVideos.push(...deduplicatedPageVideos)
            } else if (result.status === 'rejected') {
                console.error(`频道 ${channels[index]} 请求失败:`, result.reason)
            }
        })

        // 🚀 最终跨频道去重
        backData.data = deduplicateVideoListByLinks(allVideos)

    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

// --- 去重函数 ---
function deduplicateVideoListByLinks(videoList) {
    const map = new Map();
    for (const video of videoList) {
        let ids;
        try {
            // video.vod_id 是一个字符串化的数组，将其解析回来
            ids = JSON.parse(video.vod_id || '[]');
            if (!Array.isArray(ids)) {
                ids = []; // 确保它是一个数组
            }
        } catch (e) {
            ids = []; // 处理解析错误
        }

        // 通过在字符串化之前对ID进行排序来创建稳定的键
        const key = JSON.stringify(ids.sort());

        // 如果键不存在，或者当前视频的message_id更大
        if (!map.has(key) || (video.message_id > (map.get(key)?.message_id || 0))) {
            map.set(key, video);
        }
    }
    return Array.from(map.values());
}
// --- 去重函数结束 ---
