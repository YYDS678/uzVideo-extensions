// ignore
//@name:4k-av
//@version:11
//@webSite:https://4k-av.com
//@remark:

import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'
// ignore

const appConfig = {



    _webSite: 'https://4k-av.com',

    headers: {
        'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        referer: appConfig.webSite,
    },
    ignoreClassName: ['首页', 'AV'],
    lastPage: {
        home: 1,
        tv: 1,
        movie: 1,
    },

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


/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    let webUrl = args.url
    // 如果通过首页获取分类的话，可以将对象内部的首页更新
    appConfig.webSite = UZUtils.removeTrailingSlash(webUrl)
    let backData = new RepVideoClassList()
    try {
        const pro = await req(webUrl, { headers: appConfig.headers })
        backData.error = pro.error
        const proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let allClass = $('#cate_list li a')
            let list = [
                {
                    type_name: '最新',
                    type_id: 'https://4k-av.com/',
                },
            ]
            allClass.each((index, element) => {
                const cat = $(element)
                if (isIgnoreClassName(cat.text())) return

                let name = cat.text()
                let url = cat.attr('href')
                url = appConfig.webSite + url
                if (url.length > 0 && name.length > 0) {
                    let videoClass = new VideoClass()
                    videoClass.type_id = url
                    videoClass.type_name = name
                    list.push(videoClass)
                }
            })
            backData.data = list
        }
    } catch (error) {
        backData.error = '获取分类失败～' + error.message
    }

    return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function getVideoList(args) {
    let backData = new RepVideoList()
    try {
        if (args.page === 1) {
            // get lastPage
            let res = await req(args.url, { headers: appConfig.headers })
            const $ = cheerio.load(res.data)
            let pageNumber = $('#MainContent_header_nav .page-number').text()
            let lastPage = pageNumber.split('/')[1]
            if (args.url.includes('/tv')) {
                appConfig.lastPage.tv = parseInt(lastPage)
            } else if (args.url.includes('/movie')) {
                appConfig.lastPage.movie = parseInt(lastPage)
            } else appConfig.lastPage.home = parseInt(lastPage)
        }

        let page
        if (args.url.includes('/tv')) {
            page = appConfig.lastPage.tv - args.page + 1
        } else if (args.url.includes('/movie')) {
            page = appConfig.lastPage.movie - args.page + 1
        } else page = appConfig.lastPage.home - args.page + 1

        let listUrl = args.url + `page-${page}.html`

        let pro = await req(listUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let virow = $('#MainContent_newestlist .virow')
            let videos = []
            virow.each((index, element) => {
                let item = $(element).find('.NTMitem')
                item.each((index, element) => {
                    let vodName = $(element).find('.title h2').text()
                    let vodPic = $(element).find('.poster img').attr('src')
                    let vodUrl = $(element).find('.title a').attr('href')

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videos.push(videoDet)
                })
            })

            backData.data = videos
        }
    } catch (error) {
        backData.error = '获取列表失败～' + error.message
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<RepVideoDetail>}
 */
async function getVideoDetail(args) {
    let backData = new RepVideoDetail()
    try {
        let webUrl = UZUtils.removeTrailingSlash(appConfig.webSite) + args.url
        let pro = await req(webUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vod_content = $('.cnline').text() ?? ''
            let vod_pic = $('#MainContent_poster img').attr('src') ?? ''
            let vod_name =
                $('#MainContent_titleh12 div')
                    .text()
                    .split('/')[0]
                    .replace(/第.*集/, '') ?? ''
            // let detList = document.querySelectorAll('ewave-content__detail p.data')
            let vod_year = ''
            let vod_director = ''
            let vod_actor = ''
            let vod_area = ''
            let vod_lang = ''
            let vod_douban_score = ''
            let type_name = ''

            let vod_play_url = []
            // 檢查是不是多集
            let isTV = $('#rtlist li').length > 0
            if (isTV) {
                let playlist = $('#rtlist li')
                playlist.each((index, element) => {
                    let name = $(element).find('span').text()
                    let url = $(element).find('img').attr('src').replace('screenshot.jpg', '')
                    let ep = `${name}$${url}`
                    vod_play_url.push(ep)
                })
            } else {
                vod_play_url = `播放$${webUrl}`
            }

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
            detModel.vod_play_url = Array.isArray(vod_play_url) ? vod_play_url.join('#') : vod_play_url
            detModel.vod_id = webUrl

            backData.data = detModel
        }
    } catch (error) {
        backData.error = '获取视频详情失败' + error.message
    }

    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {Promise<RepVideoPlayUrl>}
 */
async function getVideoPlayUrl(args) {
    let backData = new RepVideoPlayUrl()
    let reqUrl = args.url.replace('www.', '')

    try {
        const pro = await req(reqUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data

        if (proData) {
            const $ = cheerio.load(proData)
            let playUrl = $('#MainContent_videowindow video source').attr('src')
            UZUtils.debugLog(playUrl)
            backData.data = playUrl
        }
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function searchVideo(args) {
    let backData = new RepVideoList()
    try {
        let listUrl = appConfig.webSite + `/s?q=${args.searchWord}`

        let pro = await req(listUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let virow = $('#MainContent_newestlist .virow')
            let videos = []
            virow.each((index, element) => {
                let item = $(element).find('.NTMitem')
                item.each((index, element) => {
                    let vodName = $(element).find('.title h2').text()
                    let vodPic = $(element).find('.poster img').attr('src')
                    let vodUrl = $(element).find('.title a').attr('href')

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videos.push(videoDet)
                })
            })

            backData.data = videos
        }
    } catch (error) {
        backData.error = '获取列表失败～' + error.message
    }
    return JSON.stringify(backData)
}


function isIgnoreClassName(className) {
    for (let index = 0; index < appConfig.ignoreClassName.length; index++) {
        const element = appConfig.ignoreClassName[index]
        if (className.indexOf(element) !== -1) {
            return true
        }
    }
    return false
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


