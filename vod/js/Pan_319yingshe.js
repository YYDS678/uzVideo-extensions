//@name:319影社
//@version:1.1
//@webSite:https://www.319312.com
//@remark:
//@author:白猫
//@order: A01
const appConfig = {
    _webSite: 'https://www.319312.com',
    /**
     * 网站主页，uz 调用每个函数前都会进行赋值操作
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
 * 获取分类列表
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    backData.data = [
        {
            type_id: 'zuixin',
            type_name: '最新',
            hasSubclass: false,
        },
        {
            type_id: 'hwjuji/meiju',
            type_name: '欧美剧',
            hasSubclass: false,
        },
        {
            type_id: 'hwjuji/hanju',
            type_name: '韩剧',
            hasSubclass: false,
        },
        {
            type_id: 'hwjuji/riju',
            type_name: '日剧',
            hasSubclass: false,
        },
        {
            type_id: 'hwjuji/taiju',
            type_name: '泰剧',
            hasSubclass: false,
        },
        {
            type_id: 'hwjuji',
            type_name: '海外剧集',
            hasSubclass: false,
        },
        {
            type_id: 'juqing',
            type_name: '剧情爱情',
            hasSubclass: false,
        },
        {
            type_id: 'xuanyi',
            type_name: '动作悬疑',
            hasSubclass: false,
        },
        {
            type_id: 'jingsong',
            type_name: '惊悚恐怖',
            hasSubclass: false,
        },
        {
            type_id: 'dongman',
            type_name: '动漫动画',
            hasSubclass: false,
        },
        {
            type_id: 'jingdian',
            type_name: '豆瓣高分影片',
            hasSubclass: false,
        },
        {
            type_id: 'lishi',
            type_name: '历史传记',
            hasSubclass: false,
        },
        {
            type_id: 'khzn',
            type_name: '科幻灾难',
            hasSubclass: false,
        },
        {
            type_id: 'zongyi',
            type_name: '综艺',
            hasSubclass: false,
        },
        {
            type_id: 'jilupian',
            type_name: '纪录片',
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
 */
async function getVideoList(args) {
    var backData = new RepVideoList()

    // 拼接URL，适配 https://www.319312.com/juqing/page/2 的格式
    let url = combineUrl(args.url)
    if (args.page > 1) {
        url += `/page/${args.page}`
    }

    try {
        const pro = await req(url)
        backData.error = pro.error

        let videos = []
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodItems = $('.container .list-item')
            
            vodItems.each((_, e) => {
                let videoDet = new VideoDetail()
                
                // 1. 获取链接和原始标题
                let linkTag = $(e).find('a.list-goto')
                let rawTitle = linkTag.attr('title') || ''
                videoDet.vod_id = linkTag.attr('href')
                
                // 2. 标题清洗：[剧情电影]《暮色围城》(2025)... -> 提取《》内的内容
                let titleMatch = rawTitle.match(/《(.*?)》/)
                if (titleMatch && titleMatch[1]) {
                    videoDet.vod_name = titleMatch[1]
                } else {
                    videoDet.vod_name = rawTitle // 匹配失败则保留原标题
                }

                // 3. 图片提取
                let styleContent = $(e).find('.media-content').attr('style')
                if (styleContent) {
                    let urlMatch = styleContent.match(/url\(['"]?(.*?)['"]?\)/)
                    if (urlMatch && urlMatch[1]) {
                        videoDet.vod_pic = urlMatch[1]
                    }
                }
                
                // 取消备注功能，不设置 vod_remarks
                // videoDet.vod_remarks = rawTitle

                videos.push(videoDet)
            })
        }
        backData.data = videos
    } catch (error) {
        backData.error = '获取列表失败: ' + error
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        // args.url 已经是完整的链接 (从列表页获取的 href)
        let webUrl = args.url
        if (!webUrl.startsWith('http')) {
             webUrl = combineUrl(webUrl)
        }
        
        let pro = await req(webUrl)
        backData.error = pro.error
        
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = webUrl
            
            // 标题清洗逻辑同列表页
            let pageTitle = $('head title').text()
            let titleMatch = pageTitle.match(/《(.*?)》/)
            vodDetail.vod_name = titleMatch ? titleMatch[1] : pageTitle

            // 图片
            vodDetail.vod_pic = $('.post-content img:eq(-1)').attr('src')

            // 基本信息
            let infoItems = $('.post-content ul li')
            infoItems.each((_, item) => {
                let text = $(item).text()
                if (text.includes('年代')) {
                    vodDetail.vod_year = text.replace('年代', '').replace(/[:：]/, '').trim()
                } else if (text.includes('导演')) {
                    vodDetail.vod_director = text.replace('导演', '').replace(/[:：]/, '').trim()
                } else if (text.includes('主演')) {
                    vodDetail.vod_actor = text.replace('主演', '').replace(/[:：]/, '').trim()
                } else if (text.includes('类型')) {
                     vodDetail.type_name = text.replace('类型', '').replace(/[:：]/, '').trim()
                }
            })

            // 优化核心剧情提取 - 获取两个段落的内容
            let plotHeader = $('.post-content h2').filter((i, el) => $(el).text().includes('核心剧情'))
            if (plotHeader.length > 0) {
                // 获取核心剧情h2后面的所有p标签，直到下一个h2
                let nextH2 = plotHeader.nextAll('h2').first()
                let paragraphs = plotHeader.nextUntil(nextH2, 'p')
                
                // 提取前两个段落的内容
                let plotContent = []
                paragraphs.each((index, el) => {
                    if (index < 2) { 
                        let text = $(el).text().trim()
                        if (text) {
                            plotContent.push(text)
                        }
                    }
                })
                
                // 将两个段落合并，用换行符分隔
                vodDetail.vod_content = plotContent.join('\n')
                
                // 如果没有获取到内容，使用备选方案
                if (!vodDetail.vod_content) {
                    vodDetail.vod_content = $('.post-content').text().substring(0, 200) + '...'
                }
            } else {
                 // 备选方案：直接取post-content下的纯文本
                 vodDetail.vod_content = $('.post-content').text().substring(0, 200) + '...'
            }

            // 播放链接
            const panUrls = []
            let links = $('.post-content a')
            links.each((_, el) => {
                let href = $(el).attr('href')
                let text = $(el).text()
                // 匹配夸克链接
                if (href && href.includes('pan.quark.cn')) {
                    panUrls.push(href)
                }
            })
            
            vodDetail.panUrls = panUrls
            backData.data = vodDetail
        }
    } catch (error) {
        backData.error = '获取视频详情失败' + error
    }

    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    // 此处直接返回网盘链接，由播放器/UZ解析
    if (args.url) {
         backData.data = args.url
    }
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * 搜索URL格式: https://www.319312.com/?s=关键词
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        // 构建搜索URL，支持分页
        let searchUrl = appConfig.webSite + `/?s=${args.searchWord}`
        if (args.page > 1) {
            searchUrl = appConfig.webSite + `/page/${args.page}/?s=${args.searchWord}`
        }
        
        let repData = await req(searchUrl)

        const $ = cheerio.load(repData.data)
        // 搜索结果
        let vodItems = $('.container .list-item')
        
        vodItems.each((_, e) => {
            let videoDet = new VideoDetail()
            
            let linkTag = $(e).find('a.list-title')
            let rawTitle = linkTag.text() || ''
            videoDet.vod_id = linkTag.attr('href')
            
            // 标题清洗
            let titleMatch = rawTitle.match(/《(.*?)》/)
            videoDet.vod_name = titleMatch ? titleMatch[1] : rawTitle

            // 图片提取
            let styleContent = $(e).find('.media-content').attr('style')
            if (styleContent) {
                let urlMatch = styleContent.match(/url\(['"]?(.*?)['"]?\)/)
                if (urlMatch && urlMatch[1]) {
                    videoDet.vod_pic = urlMatch[1]
                }
            }
            
            // 不设置 vod_remarks
            // videoDet.vod_remarks = rawTitle
            
            backData.data.push(videoDet)
        })
    } catch (error) {
        backData.error = error
    }
    return JSON.stringify(backData)
}

/**
 * URL组合函数
 */
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