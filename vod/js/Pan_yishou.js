//@name:[盘] 奕搜
//@version:2
//@webSite:https://ysso.cc
//@remark: 🙀是白猫呀！！！
//@order: A02
const appConfig = {
    _webSite: 'https://ysso.cc',
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

// 全局变量
let hasShownWelcome = false  // 标记是否已显示欢迎提示


/**
 * 从标题文本中提取备注信息
 * 优先级：更新集数 > 评分 > 年份
 * @param {string} titleText - 原始标题文本
 * @returns {string} - 备注信息
 */
function extractRemarkFromTitle(titleText) {
    // 首次加载时显示欢迎提示
    if (!hasShownWelcome) {
        hasShownWelcome = true
        toast("🙀白猫出品，三无产品！！！", 3)  // 显示3秒
    }
    // 提取所有方括号内的内容
    const bracketContents = []
    const regex = /\[(.*?)\]/g
    let match

    while ((match = regex.exec(titleText)) !== null) {
        bracketContents.push(match[1])
    }

    // 按优先级查找：更新集数 > 评分 > 年份
    for (const content of bracketContents) {
        // 1. 更新集数信息
        if (content.startsWith('更')) {
            const episodeMatch = content.match(/更(\d+)/)
            if (episodeMatch) {
                const episodeNum = episodeMatch[1] || episodeMatch[2] || episodeMatch[3]
                if (episodeNum) {
                    return '更新至' + episodeNum + '集'
                }
            }
            return content // 如果没有匹配到数字，返回原始内容
        }
    }

    for (const content of bracketContents) {
        // 2. 评分信息
        if (content.endsWith('分')) {
            const score = content.replace('分', '')
            return '评分：' + score
        }
    }

    for (const content of bracketContents) {
        // 3. 年份信息
        if (/^\d{4}$/.test(content)) {
            return '首播：' + content
        }
    }

    // 4. 如果都没有，返回空字符串
    return ''
}

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    backData.data = [
        {
            type_id: 'dy',
            type_name: '电影',
            hasSubclass: false,
        },
        {
            type_id: 'dsj',
            type_name: '电视剧',
            hasSubclass: false,
        },
        {
            type_id: 'zy',
            type_name: '综艺',
            hasSubclass: false,
        },
        {
            type_id: 'dm',
            type_name: '动漫',
            hasSubclass: false,
        },
        {
            type_id: 'jlp',
            type_name: '纪录片',
            hasSubclass: false,
        },
        {
            type_id: 'dj',
            type_name: '短剧',
            hasSubclass: false,
        }
    ]
    return JSON.stringify(backData)
}

/**
 * 获取子分类列表
 * @param {UZArgs} args
 * @returns {Promise<RepVideoSubclassList>}
 */
async function getSubclassList(args) {
    let backData = new RepVideoSubclassList()
    return JSON.stringify(backData)
}

/**
 * 获取子分类视频列表
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    // 适配翻页链接: https://ysso.cc/dsj.html?page=2
    let url = combineUrl(`/${args.url}.html?page=${args.page}`)

    try {
        const pro = await req(url)
        backData.error = pro.error

        let videos = []
        if (pro.data) {
            const $ = cheerio.load(pro.data)
            let vodItems = $('.list-boxes')
            vodItems.each((_, e) => {
                let videoDet = new VideoDetail()
                let $link = $(e).find('a.text_title_p')

                videoDet.vod_id = $link.attr('href')
                // 提取纯标题，去除年份和评分
                let titleText = $link.text().trim()
                let cleanTitle = titleText.replace(/\s*\[.*?\]/g, '').trim()
                videoDet.vod_name = cleanTitle
                videoDet.vod_pic = $(e).find('img.image_left').attr('src')

                // 使用新的提取备注函数
                videoDet.vod_remarks = extractRemarkFromTitle(titleText)

                // 如果没有提取到任何备注信息，使用原来的默认备注
                if (!videoDet.vod_remarks) {
                    videoDet.vod_remarks = $(e).find('.list-actions span').first().text().trim()
                }

                videos.push(videoDet)
            })
        }
        backData.data = videos
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<RepVideoDetail>}
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let webUrl = combineUrl(args.url)
        let pro = await req(webUrl)

        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = args.url

            // 标题与图片
            let originalTitle = $('h1.articl_title').text().trim()
            // 提取纯标题，去除年份和评分
            let cleanTitle = originalTitle.replace(/\s*\[.*?\]/g, '').trim()
            vodDetail.vod_name = cleanTitle

            // 使用新的提取备注函数（只从标题中提取）
            vodDetail.vod_remarks = extractRemarkFromTitle(originalTitle)

            vodDetail.vod_pic = $('.tc-box.article-box img').first().attr('src')

            // 基本信息解析
            let directorItems = []
            let actorItems = []

            // 解析导演信息
            $('#info > span').each((_, span) => {
                let $span = $(span)
                let key = $span.find('.pl').text().replace(/[:：]/g, '').trim()

                if (key.includes('导演') || key.includes('编剧')) {
                    // 提取导演和编剧信息，融合到一个标签
                    $span.find('.attrs a').each((_, a) => {
                        let name = $(a).text().trim()
                        if (name && !directorItems.includes(name)) {
                            directorItems.push(name)
                        }
                    })
                } else if (key.includes('主演') || key.includes('演员')) {
                    // 提取演员信息
                    $span.find('.attrs a').each((_, a) => {
                        let name = $(a).text().trim()
                        if (name && !actorItems.includes(name)) {
                            actorItems.push(name)
                        }
                    })
                }
            })

            // 设置导演和演员
            vodDetail.vod_director = directorItems.join(', ')
            vodDetail.vod_actor = actorItems.join(', ')

            // 提取剧情简介
            let plotText = ''

            // 方法2: 查找带有特定样式的p标签（颜色为rgb(51, 51, 51)）
            $('p[style*="color: rgb(51, 51, 51)"]').each((_, p) => {
                let text = $(p).text().trim()
                if (text && text.length > 20) {
                    plotText = text.replace(/\s+/g, ' ').trim()
                    return false
                }
            })

            vodDetail.vod_content = plotText

            // 网盘链接提取 - 根据图片中的结构直接定位
            const panUrls = []
            // 查找所有带有 target="_blank" 的 <a> 标签
            $('a[target="_blank"]').each((_, el) => {
                let href = $(el).attr('href')
                if (href) {
                    panUrls.push(`${href}`)
                }
            }
            )

            // 如果网站有提取码，尝试从文本中捕获
            let bodyText = $('body').text()
            let pwdMatch = bodyText.match(/提取码[:：]\s*([a-zA-Z0-9]{4})/)
            if (pwdMatch) {
                // 将提取码信息添加到备注
                vodDetail.vod_remarks = (vodDetail.vod_remarks || '') + " 提取码: " + pwdMatch[1]
            }

            vodDetail.panUrls = panUrls
            backData.data = vodDetail
        }
    } catch (error) {
        backData.error = '获取视频详情失败: ' + error.message
    }

    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {Promise<RepVideoPlayUrl>}
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        // 根据图片中的搜索URL格式：https://ysso.cc/search.html?keyword=国宝
        let searchUrl = combineUrl(`/search.html?keyword=${encodeURIComponent(args.searchWord)}&page=${args.page}`)
        let repData = await req(searchUrl)

        backData.error = repData.error
        const $ = cheerio.load(repData.data)
        let items = $('.list-boxes')

        for (const item of items) {
            let video = new VideoDetail()

            // 获取链接
            let link = $(item).find('.left_ly a').attr('href') || $(item).find('.text_title_p a').attr('href')
            video.vod_id = link

            // 获取标题
            let titleElement = $(item).find('.text_title_p')
            // 移除mark标签并获取文本
            titleElement.find('mark').each((_, mark) => {
                $(mark).replaceWith($(mark).text())
            })
            let originalTitle = titleElement.text().trim()
            // 去除年份和评分
            let cleanTitle = originalTitle.replace(/\s*\[.*?\]/g, '').trim()
            video.vod_name = cleanTitle

            // 获取图片
            video.vod_pic = $(item).find('img.image_left').attr('src')

            // 使用新的提取备注函数（只从标题中提取）
            video.vod_remarks = extractRemarkFromTitle(originalTitle)

            backData.data.push(video)
        }
    } catch (error) {
        backData.error = '搜索失败: ' + error.message
    }
    return JSON.stringify(backData)
}

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