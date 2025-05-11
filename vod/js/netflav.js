//@name:「禁」 netflav
//@version:2
//@webSite:https://www.netflav.com
//@remark:
//@type:100
//@instance:netflav20240905
//@isAV:1
//@order: E
class netflavClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://www.netflav.com'
        this.UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }

    async getClassList(args) {
        const webUrl = args.url
        this.webSite = UZUtils.removeTrailingSlash(webUrl)
        let backData = new RepVideoClassList()
        try {
            backData.error = null
            backData.data = [
                { type_id: '/censored', type_name: '有碼影片' },
                { type_id: '/uncensored', type_name: '無碼影片' },
            ]
        } catch (e) {
            backData.error = e.message
        }

        return JSON.stringify(backData)
    }

    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            const type = args.url === '/censored' ? 'censored' : 'uncensored'
            const url = this.webSite + args.url + `?page=${args.page}`
            const pro = await req(url, { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            const $ = cheerio.load(pro.data)
            const script = $('#__NEXT_DATA__').text()
            const json = JSON.parse(script)
            const allvideos = json.props.initialState[type].docs
            let videos = []
            allvideos.forEach((e) => {
                let videoDet = new VideoDetail()
                videoDet.vod_id = e.videoId
                videoDet.vod_pic = e.preview
                videoDet.vod_name = e.title
                videoDet.vod_remarks = e.sourceDate.split('T')[0]
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
        const webUrl = this.webSite + `/video?id=${args.url}`
        try {
            const pro = await req(webUrl, { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                const script = $('#__NEXT_DATA__').text()
                const json = JSON.parse(script)
                const data = json.props.initialState.video.data
                let vod_content = data.description
                let vod_pic = data.preview
                let vod_name = data.title
                let vod_year = data.videoDate.split('T')[0]
                let vod_director = data.director || ''
                let vod_actor = data.actors.join(',')
                let vod_area = ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                let playlist = data.srcs
                let vod_play_url = ''
                playlist.forEach((e) => {
                    vod_play_url += `播放$${encodeURIComponent(e)}$$$`
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
                detModel.vod_play_url = vod_play_url
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
        let url = decodeURIComponent(args.url)
        try {
            if (url.includes('embedrise')) {
                const pro = await req(url, { headers: { 'User-Agent': this.UA } })
                const $ = cheerio.load(pro.data)
                const playUrl = $('#player source').attr('src')
                backData.data = playUrl
                backData.headers = { 'User-Agent': this.UA }
            } else if (url.includes('mmvh01') || url.includes('mmsi01') || url.includes('netflavns')) {
                const pro = await req(url, {
                    headers: {
                        'User-Agent': this.UA,
                        Referer: `${this.webSite}/`,
                        'Sec-Ch-Ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
                        'Sec-Fetch-Dest': 'iframe',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'cross-site',
                    },
                })
                const $ = cheerio.load(pro.data)
                $('body > script').each((_, e) => {
                    if ($(e).text().includes('eval')) {
                        let decodeStr = eval($(e).text().replace('eval', ''))
                        // UZUtils.debugLog(decodeStr)
                        let m3u8 = decodeStr.split('sources:[{file:"')[1].split('"}]')[0]
                        backData.data = m3u8
                        backData.headers = { 'User-Agent': this.UA }
                    }
                })
            } else if (url.includes('7mmtv.upns.live')) {
                let api = 'https://7mmtv.upns.live/api/v1/video?id=' + url.split('#')[1]
                let pro = await req(api, { headers: { 'User-Agent': this.UA } })
                let data = pro.data.trim()
                function decrypt(data) {
                    let str = Crypto.enc.Base64.stringify(Crypto.enc.Hex.parse(data))
                    let key = Crypto.enc.Utf8.parse('kiemtienmua911ca')
                    let iv = Crypto.enc.Utf8.parse('1234567890oiuytr')
                    return Crypto.AES.decrypt(str, key, {
                        iv: iv,
                        mode: Crypto.mode.CBC,
                        padding: Crypto.pad.Pkcs7,
                    }).toString(Crypto.enc.Utf8)
                }
                let decrypted = decrypt(data)
                let json = JSON.parse(decrypted)
                backData.data = json.cf
                backData.headers = { 'User-Agent': this.UA, Referer: 'https://7mmtv.upns.live/' }
            } else if (url.includes('d0000d') || url.includes('dooood')) {
                url = url.replace('dooood', 'd0000d')
                const pro = await req(url, {
                    headers: {
                        Host: UZUtils.getHostFromURL(url).split('/')[2],
                        'Accept-Language': 'zh-TW,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,en-XA;q=0.6,en;q=0.5',
                        'Cache-Control': 'no-cache',
                        Cookie: 'lang=1',
                        'Sec-Ch-Ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
                        'Sec-Ch-Ua-Mobile': '?0',
                        'Sec-Ch-Ua-Platform': 'Windows',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': 1,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    },
                })
                const html = pro.data
                let pass = html.substring(html.indexOf('/pass_md5'), html.length)
                pass = pass.substring(0, pass.indexOf("'"))
                pass = UZUtils.getHostFromURL(url) + pass
                let token = html.substring(html.indexOf('token=') + 6, html.length)
                token = token.substring(0, token.indexOf('&'))
                const res = await req(pass, {
                    headers: {
                        Accept: '*/*',
                        'User-Agent': this.UA,
                        Referer: url,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                function makePlay(token) {
                    const t = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
                    const n = t.length
                    let a = ''
                    for (let o = 0; 10 > o; o++) {
                        const index = Math.floor(Math.random() * n)
                        a += t.charAt(index)
                    }
                    return a + '?token=' + token + '&expiry=' + Date.now()
                }
                let realUrl = res.data + makePlay(token)
                backData.data = realUrl
                backData.headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    Referer: 'https://d0000d.com/',
                    'Sec-Ch-Ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': 'Windows',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                }
            } else if (url.includes('njavplayer.me')) {
                let id = url.split('vv/')[1].split('?')[0]
                let reqUrl = `https://www.njavplayer.me/v/${id}.json`
                let pro = await req(reqUrl, { headers: { 'user-agent': this.UA }, responseType: 'plain' })
                let execute = new Function(pro.data + ' return jsonData')
                let jsonData = execute()
                backData.data = jsonData.file
            } else {
                backData.error = '@ykusu叫他寫'
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            const url = `${this.webSite}/search?keyword=${args.searchWord}&page=${args.page}&type=title`

            const pro = await req(url, { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                const script = $('#__NEXT_DATA__').text()
                const json = JSON.parse(script)
                const allvideos = json.props.initialState.search.docs
                let videos = []
                allvideos.forEach((e) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = e.videoId
                    videoDet.vod_pic = e.preview
                    videoDet.vod_name = e.title
                    videoDet.vod_remarks = e.sourceDate.split('T')[0]

                    videos.push(videoDet)
                })

                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }
}
let netflav20240905 = new netflavClass()
