// ignore
//@name:「直」 短剧天堂
//@version:2
//@webSite:https://duanjutt.tv
//@remark:
//@type:100
//@instance:duanjutt20240922
//@order: C

import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

class duanjuttClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://duanjutt.tv'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        }
        this.ignoreClassName = ['首页', '明星']
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
                let section = $('.dropdown-box ul li a')
                let list = []
                section.each((_, element) => {
                    if (this.isIgnoreClassName($(element).text())) return
                    let name = $(element).text()
                    let url = $(element).attr('href')
                    if (url.length > 0 && name.length > 0) {
                        let videoClass = new VideoClass()
                        videoClass.type_id = url
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
        let backData = new RepVideoList()
        const url = this.webSite + args.url.replace('.html', `-${args.page}.html`)
        try {
            let headers = this.headers
            let videos = []

            const pro = await req(url, { headers: headers })
            backData.error = pro.error
            const $ = cheerio.load(pro.data)
            const allvideos = $('.myui-vodlist li')
            allvideos.each((_, e) => {
                let pic = $(e).find('a.myui-vodlist__thumb').attr('data-original')
                if (!pic.startsWith('http')) pic = this.webSite + pic
                let videoDet = new VideoDetail()
                videoDet.vod_id = $(e).find('a.myui-vodlist__thumb').attr('href')
                videoDet.vod_pic = pic
                videoDet.vod_name = $(e).find('a.myui-vodlist__thumb').attr('title')
                videoDet.vod_remarks = $(e).find('.pic-text').text().trim()
                videos.push(videoDet)
            })

            backData.data = videos
        } catch (error) {
            backData.error = error.message
        }
        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        const webUrl = this.webSite + args.url
        try {
            let headers = this.headers
            headers.cookie = this.cookie
            const pro = await req(webUrl, { headers: headers })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                const playlist = $('#playlist1 a')
                let playUrls = []
                playlist.each((_, e) => {
                    const name = $(e).text().trim()
                    const url = $(e).attr('href')
                    playUrls.push(`${name}$${url}`)
                })

                let detModel = new VideoDetail()
                detModel.vod_play_url = playUrls.join('#')
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
        let url = this.webSite + args.url
        try {
            const { data } = await req(url, {
                headers: this.headers,
            })
            let player = data.match(/r player.*=\{(.*)\}/)[1]
            let config = JSON.parse(`{${player}}`)
            if (config.encrypt === 0) {
                let purl = config.url
                backData.data = purl
                backData.headers = {
                    'User-Agent': this.headers['User-Agent'],
                    Referer: `${this.webSite}/`,
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
        const ocrApi = 'https://api.nn.ci/ocr/b64/json'
        const checkUrl = this.webSite + '/index.php/ajax/verify_check?type=search&verify='
        const validate = this.webSite + '/index.php/verify/index.html?'
        const searchUrl = this.webSite + `/vodsearch/-------------.html?wd=${args.searchWord}&submit=`
        try {
            let headers = this.headers
            headers.cookie = 'PHPSESSID=' + generatePHPSESSID()

            let img = await req(validate, {
                headers: headers,
                responseType: 'arraybuffer',
            })

            let b64 = arrayBufferToBase64(img.data)
            let ocrRes = await req(ocrApi, {
                method: 'POST',
                headers: this.headers,
                data: b64,
            })
            let vd = JSON.parse(ocrRes.data).result
            let check = await req(checkUrl + vd, {
                headers: headers,
            })
            let result = check.data
            if (result.msg === 'ok') {
                let pro = await req(searchUrl, {
                    headers: headers,
                })
                backData.error = pro.error
                const $ = cheerio.load(pro.data)
                let videos = []
                $('#searchList > li').each((_, element) => {
                    const href = $(element).find('a.myui-vodlist__thumb').attr('href')
                    const title = $(element).find('h4.title').text()
                    let cover = $(element).find('a.myui-vodlist__thumb').attr('data-original')
                    if (!cover.startsWith('http')) cover = this.webSite + cover
                    const subTitle = $(element).find('.pic-text').text()
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = href
                    videoDet.vod_pic = cover
                    videoDet.vod_name = title
                    videoDet.vod_remarks = subTitle
                    videos.push(videoDet)
                })
                backData.data = videos
            }

            function arrayBufferToBase64(arrayBuffer) {
                let uint8Array = new Uint8Array(arrayBuffer)
                let wordArray = Crypto.lib.WordArray.create(uint8Array)
                let base64String = Crypto.enc.Base64.stringify(wordArray)

                return base64String
            }
            function generatePHPSESSID() {
                const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                const length = 26
                let sessionId = ''

                for (let i = 0; i < length; i++) {
                    const randomIndex = Math.floor(Math.random() * characters.length)
                    sessionId += characters[randomIndex]
                }

                return sessionId
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
let duanjutt20240922 = new duanjuttClass()
