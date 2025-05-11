// ignore
//@name:「禁」 jable
//@version:3
//@webSite:https://jable.tv
//@remark:
//@type:100
//@instance:jable20240831
//@isAV:1
//@order: E
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

class jableClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://jable.tv'
        this.headers = {
            'User-Agent': 'PostmanRuntime/7.39.1',
            'Accept-language': 'zh-TW,zh-Hant;q=0.9',
        }
        this.cookie = ''
    }

    async getClassList(args) {
        const webUrl = args.url
        this.webSite = UZUtils.removeTrailingSlash(webUrl)
        let backData = new RepVideoClassList()
        try {
            const pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            let cookie = pro.headers['set-cookie']
            this.cookie = cookie
            const proData = pro.data
            // UZUtils.debugLog(proData)
            if (proData) {
                const $ = cheerio.load(proData)
                let section = $('div.container > section:not(.d-flex)')
                let list = []
                section.each((_, element) => {
                    let name = $(element).find('.title-box h2').text()
                    let url = $(element).find('.more a').attr('href')
                    if (url == null) url = this.webSite
                    if (url.length > 0 && name.length > 0) {
                        let videoClass = new VideoClass()
                        videoClass.type_id = url
                        videoClass.type_name = name.substring(0, 4)
                        if (/categories|hot/.test(url)) {
                            videoClass.hasSubclass = true
                        }
                        list.push(videoClass)
                    }
                })
                backData.data = list
            }
        } catch (e) {
            backData.error = e.message
        }

        return JSON.stringify(backData)
    }

    async getSubclassList(args) {
        let backData = new RepVideoSubclassList()
        backData.data = new VideoSubclass()
        const url = args.url
        try {
            let headers = this.headers
            headers.cookie = this.cookie
            let filter = []
            if (url.includes('categories')) {
                const pro = await req(url, { headers: headers })
                backData.error = pro.error
                const $ = cheerio.load(pro.data)
                let list = []
                let cat = $('#list_categories_video_categories_list .container .row > div')
                cat.each((_, e) => {
                    let name = $(e).find('h4').text()
                    let id = $(e).find('a').attr('href')
                    list.push({ name: name, id: id })
                })
                filter.push({ name: '類型', list: list })
            } else {
                const pro = await req(url, { headers: this.headers })
                backData.error = pro.error
                const $ = cheerio.load(pro.data)
                let list = []
                let sort = $('.sorting-nav li')
                sort.each((_, e) => {
                    let name = $(e).find('a').text()
                    let id = $(e).find('a').attr('data-parameters').replace('sort_by:', '')
                    let url = `${this.webSite}/hot/?mode=async&function=get_block&block_id=list_videos_common_videos_list&sort_by=${id}`
                    list.push({ name: name, id: url })
                })
                filter.push({ name: '排序', list: list })
            }
            backData.data.filter = filter
        } catch (error) {
            backData.error = '获取分类失败～ ' + error
        }
        return JSON.stringify(backData)
    }

    async getSubclassVideoList(args) {
        let backData = new RepVideoList()
        backData.data = []
        try {
            let headers = this.headers
            headers.cookie = this.cookie
            let [{ id }] = args.filter
            let url = ''
            if (id.includes('categories')) {
                url = id + `?mode=async&function=get_block&block_id=list_videos_common_videos_list&sort_by=post_date&from=${args.page}&_=${Date.now()}`
            } else {
                url = id + `&from=${args.page}&_=${Date.now()}`
            }

            const pro = await req(url, { headers: headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                const allvideos = $('#list_videos_common_videos_list .container .row > div')
                let videos = []
                allvideos.each((_, e) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = $(e).find('.title a').attr('href')
                    videoDet.vod_name = $(e).find('.title a').text()
                    videoDet.vod_pic = $(e).find('.img-box img').attr('data-src')
                    videoDet.vod_remarks = $(e).find('.label').text()
                    videos.push(videoDet)
                })

                backData.data = videos
            }
        } catch (error) {
            backData.error = '获取视频列表失败～ ' + error
        }

        return JSON.stringify(backData)
    }

    /**
     * 获取分类视频列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            let headers = this.headers
            headers.cookie = this.cookie
            let videos = []
            if (args.url === this.webSite) {
                const pro = await req(args.url, { headers: headers })
                backData.error = pro.error
                const $ = cheerio.load(pro.data)
                const lastSection = $('#site-content .container section:last')
                const allvideos = lastSection.find('.row > div')
                allvideos.each((_, e) => {
                    let name = $(e).find('.title a').text()
                    let url = $(e).find('.title a').attr('href')
                    if (!/jable\.tv/.test(url)) return
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = url
                    videoDet.vod_pic = $(e).find('.img-box img').attr('data-src')
                    videoDet.vod_name = name
                    videoDet.vod_remarks = $(e).find('.label').text()
                    videos.push(videoDet)
                })
            } else {
                let url = /new-release/.test(args.url)
                    ? args.url + `?mode=async&function=get_block&block_id=list_videos_common_videos_list&sort_by=release_year&from=${args.page}&_=${Date.now()}`
                    : args.url + `?mode=async&function=get_block&block_id=list_videos_latest_videos_list&sort_by=post_date&from=${args.page}&_=${Date.now()}`
                const pro = await req(url, { headers: this.headers })
                backData.error = pro.error
                const $ = cheerio.load(pro.data)
                const allvideos = $('.container .row > div')
                allvideos.each((_, e) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = $(e).find('.title a').attr('href')
                    videoDet.vod_name = $(e).find('.title a').text()
                    videoDet.vod_pic = $(e).find('.img-box img').attr('data-src')
                    videoDet.vod_remarks = $(e).find('.label').text()
                    videos.push(videoDet)
                })
            }
            backData.data = videos
        } catch (error) {
            backData.error = error.message
        }
        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        const webUrl = args.url
        try {
            let headers = this.headers
            headers.cookie = this.cookie
            const pro = await req(webUrl, { headers: headers })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let script = $('#site-content .container .col').eq(0).find('section').eq(0).find('script:last').text()
                let hlsUrl = script.match(/var hlsUrl = '(.*)';/)[1]

                let detModel = new VideoDetail()
                detModel.vod_year = $('span.inactive-color').eq(0).text().replace('上市於', '')
                detModel.vod_pic = $('meta[property=og:image]').attr('content')
                detModel.vod_name = $('meta[property=og:title]').attr('content')
                detModel.vod_play_url = `播放$${hlsUrl}`
                detModel.vod_id = args.url

                backData.data = detModel
            }
        } catch (e) {
            backData.error = '获取视频详情失败' + e.message
        }

        return JSON.stringify(backData)
    }

    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            backData.data = args.url
            backData.headers = this.headers
        } catch (e) {
            UZUtils.debugLog(e)
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            let headers = this.headers
            headers.cookie = this.cookie
            let url = `${this.webSite}/search/${args.searchWord}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${
                args.searchWord
            }&sort_by=&from=${args.page}&_=${Date.now()}`
            const pro = await req(url, { headers: headers })
            backData.error = pro.error
            const $ = cheerio.load(pro.data)
            let videos = []
            const allvideos = $('#list_videos_videos_list_search_result .container .row > div')
            allvideos.each((_, e) => {
                let videoDet = new VideoDetail()
                videoDet.vod_id = $(e).find('.title a').attr('href')
                videoDet.vod_name = $(e).find('.title a').text()
                videoDet.vod_pic = $(e).find('.img-box img').attr('data-src')
                videoDet.vod_remarks = $(e).find('.label').text()
                videos.push(videoDet)
            })
            backData.data = videos
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }
}
let jable20240831 = new jableClass()
