class qiyouClass extends WebApiBase {
    constructor() {
        super()
        // www.qiyoudy.info
        this.webSite = 'http://www.qiyoudy4.com'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        }
        this.ignoreClassName = ['首页', '妹子']
    }

    async getClassList(args) {
        const webUrl = args.url
        this.webSite = UZUtils.removeTrailingSlash(webUrl)
        let backData = new RepVideoClassList()
        try {
            const pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let allClass = $('.stui-header__menu li a')
                let list = []
                allClass.each((index, element) => {
                    const cat = $(element)
                    if (this.isIgnoreClassName(cat.text())) return

                    let name = cat.text()
                    let url = cat.attr('href')
                    if (url.length > 0 && name.length > 0) {
                        let videoClass = new VideoClass()
                        // videoClass.hasSubclass = true
                        videoClass.type_id = url.match(/list\/(\d+)\.html/)[1]
                        videoClass.type_name = name
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

    async getVideoList(args) {
        let listUrl = this.webSite + `/list/${args.url}_${args.page}.html`
        let backData = new RepVideoList()
        try {
            let pro = await req(listUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let allVideo = $('.stui-vodlist__box')
                let videos = []
                allVideo.each((_, e) => {
                    let url = $(e).find('a').attr('href')
                    let name = $(e).find('a').attr('title')
                    let pic = $(e).find('a').attr('data-original')
                    let remarks = $(e).find('span.pic-text').text()
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = url
                    videoDet.vod_pic = pic
                    videoDet.vod_name = name
                    videoDet.vod_remarks = remarks
                    videos.push(videoDet)
                })
                backData.data = videos
            }
        } catch (e) {
            backData.error = '获取列表失败～' + e.message
        }
        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        const webUrl = this.webSite + args.url
        try {
            const pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let vod_content = $('meta[property=og:description]').attr('content')
                let vod_pic = $('.stui-vodlist__thumb img').attr('data-original')
                let vod_name = $('.stui-vodlist__thumb').attr('title')
                // let detList = $('stui-content__detail span')
                let vod_year = ''
                let vod_director = $('meta[property=og:video:director]').attr('content')
                let vod_actor = $('meta[property=og:video:actor]').attr('content')
                let vod_area = $('meta[property=og:area]').attr('content')
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                let playlist = $('.stui-content__playlist')
                let vod_play_url = []
                playlist.each((index, element) => {
                    let eps = $(element).find('li a')
                    let temp = ''
                    eps.each((_, e) => {
                        let name = $(e).text()
                        let url = $(e).attr('href')
                        temp += `${name}$${url}#`
                    })
                    vod_play_url.push(temp)
                })

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
                // detModel.vod_play_from = from.join('$$$')
                detModel.vod_play_url = vod_play_url.join('$$$')
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
        let reqUrl = this.webSite + args.url

        try {
            const pro = await req(reqUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let iframe = $('iframe').attr('src')
                let player = await req(iframe, { headers: this.headers })
                // UZUtils.debugLog(player.data)
                if (player.data) {
                    const $ = cheerio.load(player.data)
                    $('script').each((_, e) => {
                        if ($(e).text().includes('DPlayer')) {
                            let playUrl = $(e)
                                .text()
                                .match(/vid="(.*?)";/)[1]
                            backData.data = playUrl
                            backData.headers = this.headers
                        }
                    })
                }
            }
        } catch (e) {
            UZUtils.debugLog(e)
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            let searchUrl = `${this.webSite}/search.php`
            let pro = await req(searchUrl, {
                method: 'post',
                headers: { 'user-agent': this.headers['User-Agent'], 'content-type': 'application/x-www-form-urlencoded' },
                data: `searchword=${encodeURIComponent(args.searchWord)}`,
            })
            backData.error = pro.error
            let body = pro.data
            if (body) {
                let $ = cheerio.load(body)
                let allVideo = $('.stui-vodlist__media > li')
                let videos = []
                allVideo.each((_, e) => {
                    let url = $(e).find('a').attr('href')
                    let name = $(e).find('a').attr('title')
                    let pic = $(e).find('a').attr('data-original')
                    let remarks = $(e).find('span.pic-text').text()
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = url
                    videoDet.vod_pic = pic
                    videoDet.vod_name = name
                    videoDet.vod_remarks = remarks
                    videos.push(videoDet)
                })
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    isIgnoreClassName(className) {
        for (let index = 0; index < this.ignoreClassName.length; index++) {
            const element = this.ignoreClassName[index]
            if (className.indexOf(element) !== -1) {
                return true
            }
        }
        return false
    }
}
let qiyou20240904 = new qiyouClass()
