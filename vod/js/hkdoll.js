// ignore
//@name:「禁」 玩偶姐姐
//@version:2
//@webSite:https://hongkongdollvideo.com
//@remark:
//@type:100
//@instance:hkdoll20240705
//@isAV:1
//@order: E
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

class hkdollClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://hongkongdollvideo.com'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        }
        this.ignoreClassName = ['亚洲成人视频']
    }

    /**
     * 异步获取分类列表的方法。
     * @param {UZArgs} args
     * @returns {Promise<RepVideoClassList>}
     */
    async getClassList(args) {
        let webUrl = args.url
        // 如果通过首页获取分类的话，可以将对象内部的首页更新
        this.webSite = this.removeTrailingSlash(webUrl)
        let backData = new RepVideoClassList()
        try {
            const pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allClass = document.querySelector('.scrollbar').querySelectorAll('a')
                let list = []
                for (let index = 0; index < allClass.length; index++) {
                    const element = allClass[index]
                    let isIgnore = this.isIgnoreClassName(element.text)
                    if (isIgnore) {
                        continue
                    }
                    let type_name = element.text
                    let url = element.attributes['href']

                    // url = this.combineUrl(url)
                    // url = url.slice(0, -5)

                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = new VideoClass()
                        videoClass.type_id = url
                        videoClass.type_name = type_name
                        list.push(videoClass)
                    }
                }
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
    async getVideoList(args) {
        let listUrl = this.removeTrailingSlash(args.url) + '/' + args.page + '.html'
        let backData = new RepVideoList()
        try {
            let pro = await req(listUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelectorAll('.video-item')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('.thumb a')?.attributes['href'] ?? ''
                    let vodPic = element.querySelector('.thumb img')?.attributes['data-src'] ?? ''
                    let vodName = element.querySelector('.thumb a')?.attributes['title'] ?? ''
                    let vodDiJiJi = element.querySelector('.duration')?.text ?? ''

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi

                    videos.push(videoDet)
                }
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
    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let webUrl = args.url
            let pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let vod_content = ''
                let vod_pic = document.querySelector('meta[property="og:image"]').getAttribute('content') ?? ''
                let vod_name = document.querySelector('h1.page-title')?.text ?? ''
                // let detList = document.querySelectorAll('ewave-content__detail p.data')
                let vod_year = ''
                let vod_director = ''
                let vod_actor = ''
                let vod_area = ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

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
                detModel.vod_play_url = '播放$' + webUrl + '#'
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
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        let reqUrl = args.url

        try {
            const pro = await req(reqUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data

            if (proData) {
                // let obj = proData.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]
                // let eurl = JSON.parse(obj).embedUrl

                // let video_id = reqUrl.match(/video\/([a-f0-9]{16}).html/)[1]
                // let video_arg = eurl.match(/embed\/([a-f0-9]{20,})/)[1]
                // let timestamp = video_arg.substr(-10)

                // let eres = await req(eurl, { headers: this.headers })
                // let userInteraction = JSON.parse(eres.data.match(/r userInteraction=(.*);/)[1])
                // let key = base64Encode((video_id + '-' + timestamp.toString()).split('').reverse().join('')).replaceAll(
                //     '=',
                //     ''
                // )
                // let videoSrc = strDecode(userInteraction.sb, key)
                const $ = cheerio.load(proData)
                const script = $('.video-player-container script').text()
                const playConfig = JSON.parse(script.match(/CONFIG__=(.*?);/)[1])
                let video_id = reqUrl.match(/\/video\/([0-9a-f]+)\.html/)[1]
                let embedUrl = playConfig.embedURL
                let video_arg = embedUrl.match(/.*?\/([a-f0-9]{20,})$/)[1]
                let timestamp = video_arg.substr(-10)
                let key = base64Encode((video_id + '-' + timestamp.toString()).split('').reverse().join('')).replaceAll('=', '')

                let videoSrc = strDecode(playConfig.arg, key)

                function strDecode(string, key) {
                    string = base64Decode(string)
                    let len = key.length
                    let code = ''
                    for (let i = 0; i < string.length; i++) {
                        let k = i % len
                        code += String.fromCharCode(string.charCodeAt(i) ^ key.charCodeAt(k))
                    }
                    return decodeURIComponent(base64Decode(code))
                }
                function base64Encode(text) {
                    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))
                }
                function base64Decode(text) {
                    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))
                }

                backData.data = videoSrc
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
    async searchVideo(args) {
        let backData = new RepVideoList()
        let url = `https://hongkongdollvideo.com/search/${args.searchWord}/${args.page}.html`
        try {
            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelectorAll('.video-item')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('.thumb a')?.attributes['href'] ?? ''
                    let vodPic = element.querySelector('.thumb img')?.attributes['data-src'] ?? ''
                    let vodName = element.querySelector('.thumb a')?.attributes['title'] ?? ''
                    let vodDiJiJi = element.querySelector('.duration')?.text ?? ''

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi

                    videos.push(videoDet)
                }
                backData.data = videos
            }
        } catch (error) {
            backData.error = error.message
        }
        return JSON.stringify(backData)
    }

    combineUrl(url) {
        if (url === undefined) {
            return ''
        }
        if (url.indexOf(this.webSite) !== -1) {
            return url
        }
        if (url.startsWith('/')) {
            return this.webSite + url
        }
        return this.webSite + '/' + url
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

    removeTrailingSlash(str) {
        if (str.endsWith('/')) {
            return str.slice(0, -1)
        }
        return str
    }
}
let hkdoll20240705 = new hkdollClass()
