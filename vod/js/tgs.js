//@name:「盘」 TG搜
//@version:1
//@webSite:123资源@zyfb123&天翼日更@tianyirigeng&木偶UC@ucpanpan&夸克电影@alyp_4K_Movies&夸克剧集@alyp_TV&夸克动漫@alyp_Animation
//@remark:格式 频道名称1@频道id1&频道名称2@频道id2
//@order: B

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
    _webSite: '123资源@zyfb123&天翼日更@tianyirigeng&木偶UC@ucpanpan&夸克电影@alyp_4K_Movies&夸克剧集@alyp_TV&夸克动漫@alyp_Animation',
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

// --- Global Constants/Configuration ---
const providerMap = [
    { name: '天翼', keywords: ['189.cn'] },
    { name: '夸克', keywords: ['pan.quark.cn'] },
    { name: 'UC', keywords: ['drive.uc.cn'] },
    { name: '阿里', keywords: ['alipan.com'] },
    { name: '123', keywords: ['123684.com', '123865.com', '123912.com', '123pan.com', '123pan.cn'] }
];

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
];
// --- End Global Constants ---

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
            const nextPage = _videoListPageMap[args.url] ?? ""
            if(nextPage.length == 0 || nextPage == "0") {
                return JSON.stringify(backData)
            }
            endUrl += nextPage
        }
        const res = await getTGList(endUrl, false)
        // Deduplicate results before returning
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

    // --- Extract Channel ID and Name ---
    let currentChannelId = null;
    const urlMatch = url.match(/\/s\/([^/?]+)/);
    if (urlMatch && urlMatch[1]) {
        currentChannelId = urlMatch[1];
    }

    const channelMap = new Map();
    appConfig.webSite.split('&').forEach(item => {
        const parts = item.split('@');
        if (parts.length === 2) {
            channelMap.set(parts[1], parts[0]); // key: id, value: name
        }
    });

    const currentChannelName = currentChannelId ? (channelMap.get(currentChannelId) || '未知频道') : '未知频道';
    // --- End Extract ---

    try {
        const res = await req(url)
        const $ = cheerio.load(res.data)
          nextPage = $('link[rel="prev"]').attr('href')?.split('?')?.[1]

        const messageList = $('.tgme_widget_message_bubble')
        for (let i = 0; i < messageList.length; i++) {
            const message = messageList[i]
            const aList = $(message).find('a')
            const video = new VideoDetail()

            // --- Extract Message ID ---
            const postIdStr = $(message).attr('data-post')?.split('/')?.[1];
            video.message_id = parseInt(postIdStr) || 0; // Store message ID
            // --- End Extract Message ID ---

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
                    month: '2-digit',
                    day: '2-digit',
                })
                .replace(/\//g, '-')

            const htmlContent = $('div.tgme_widget_message_text').html()
            // 取到第一个 <br> 之前的内容
            const cleanedTitle = htmlContent
                .split('<br>')[0]
                ?.replace(/<[^>]+>/g, "")
                ?.trim()
                ?.replace(/^(名称[：:])/, '')
                ?.trim()

            // Assign initial cleaned title first
            video.vod_name = cleanedTitle ?? '';
            const ids = _getAllPanUrls(message)
            video.vod_id = JSON.stringify(ids)

            // --- New Remark Logic: Determine provider from URLs --- 
            let providers = new Set();

            if (ids && ids.length > 0) {
                for (const url of ids) {
                    for (const provider of providerMap) {
                        for (const keyword of provider.keywords) {
                            if (url.includes(keyword)) {
                                providers.add(provider.name);
                                // Optional: break inner loop if one keyword match is enough per provider
                                break; 
                            }
                        }
                        // Optional: if providers set already contains this provider, maybe break outer loop too?
                        // Depends on whether we need to check all URLs even if provider is known.
                        // Let's keep checking all URLs for now.
                    }
                }
            }

            // --- Try to extract episode/season info from title --- (Moved here)
            // Define separate regex for Arabic and Chinese numerals
            const regexArabicEpisodes = /((?:更新至|全|第)\s*\d+\s*集)/; // Must end in 集
            const regexChineseEpisodes = /((?:更新至|全|第)\s*[一二三四五六七八九十百千万亿]+\s*集)/; // Must end in 集
            const regexEpNumbers = /((?:更至|更)\s*(?:EP)?\s*\d+)/; // EP numbering, no suffix needed

            let episodeMatch = cleanedTitle.match(regexArabicEpisodes); // Try Arabic Episodes first
            if (!episodeMatch) { // If Arabic Episodes fails, try Chinese Episodes
                episodeMatch = cleanedTitle.match(regexChineseEpisodes);
            }
            if (!episodeMatch) { // If Chinese Episodes also fails, try EP Numbers
                episodeMatch = cleanedTitle.match(regexEpNumbers);
            }
            const extractedEpisodeInfo = episodeMatch ? episodeMatch[0] : null;
            // --- End extraction ---

            // --- Adjust vod_name if episode info was extracted ---
            if (extractedEpisodeInfo) {
                video.vod_name = cleanedTitle.replace(extractedEpisodeInfo, '').trim();
            }
            // --- End Adjustment ---

            // --- Build remark dynamically based on available info ---
            const remarkParts = [];
            if (providers.size > 0) {
                remarkParts.push(Array.from(providers).join('/'));
            }
            // Only add channel name if in search context and it's not the default '未知频道'
            if (isSearchContext && currentChannelName !== '未知频道') {
                remarkParts.push(currentChannelName);
            }
            if (extractedEpisodeInfo) {
                remarkParts.push(extractedEpisodeInfo);
            }

            if (remarkParts.length > 0) {
                video.vod_remarks = remarkParts.join('|');
            } else {
                // Fallback to timestamp only if NO other info was available
                video.vod_remarks = formattedDate;
            }
            // --- End building remark ---

            // --- Only push video if it contains valid pan URLs ---
            if (ids && ids.length > 0) { // Check if ids array is not empty
                videoList.push(video);
            }
            // --- End check ---
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
        const res = await getTGList(endUrl, true)
        // Deduplicate the results for the current page of this channel
        const deduplicatedPageVideos = deduplicateVideoListByLinks(res.videoList);
        backData.data.push(...deduplicatedPageVideos); // Add deduplicated results
        _searchListPageMap[element] = res.nextPage
        }
        
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

// --- Deduplication Function ---
function deduplicateVideoListByLinks(videoList) {
    const map = new Map();
    for (const video of videoList) {
        let ids;
        try {
            // video.vod_id is a stringified array, parse it back
            ids = JSON.parse(video.vod_id || '[]');
            if (!Array.isArray(ids)) {
                ids = []; // Ensure it's an array
            }
        } catch (e) {
            ids = []; // Handle parsing errors
        }

        // Create a stable key by sorting the IDs before stringifying
        const key = JSON.stringify(ids.sort());

        // If the key doesn't exist, or if the current video's message_id is greater
        if (!map.has(key) || (video.message_id > (map.get(key)?.message_id || 0))) {
            map.set(key, video);
        }
    }
    return Array.from(map.values());
}
// --- End Deduplication Function ---
