// ignore
import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'
// ignore

class sbbClass extends WebApiBase {
    /**
     *
     */
    constructor() {
        super();
        this.key = '素白白'
        this.url = 'https://www.subaibaiys.com'
        this.siteKey = ''
        this.siteType = 0
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        }
        this.cookie = {}
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
                let allClass = document.querySelectorAll('ul.navlist a')
                let list = []
                for (let index = 0; index < allClass.length; index++) {
                    const element = allClass[index]
                    let isIgnore = this.isIgnoreClassName(element.text)
                    if (isIgnore) {
                        continue
                    }
                    let type_name = element.text
                    let url = element.attributes['href']

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
        let listUrl = this.removeTrailingSlash(args.url) + '/page/' + args.page
        let backData = new RepVideoList()
        try {
            let pro = await req(listUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelectorAll('.bt_img.mi_ne_kd.mrb li')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('a')?.attributes['href'] ?? ''
                    let vodPic = element.querySelector('img.thumb')?.attributes['data-original'] ?? ''
                    let vodName = element.querySelector('img.thumb')?.attributes['alt'] ?? ''
                    let vodDiJiJi = element.querySelector('.jidi span')?.text
                        ? element.querySelector('.jidi span')?.text
                        : element.querySelector('.hdinfo')?.text

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
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
                let vod_content = document.querySelector('.yp_context')?.text ?? ''
                let vod_pic = document.querySelector('.dyimg img')?.attributes['src'] ?? ''
                let vod_name = document.querySelector('.moviedteail_tt h1')?.text ?? ''
                let detList = document.querySelectorAll('ul.moviedteail_list li') ?? []
                let vod_year = ''
                let vod_director = ''
                let vod_actor = ''
                let vod_area = ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                for (let index = 0; index < detList.length; index++) {
                    const element = detList[index]
                    if (element.text.includes('年份')) {
                        vod_year = element.text.replace('年份：', '')
                    } else if (element.text.includes('导演')) {
                        vod_director = element.text.replace('导演：', '')
                    } else if (element.text.includes('主演')) {
                        vod_actor = element.text.replace('主演：', '')
                    } else if (element.text.includes('地区')) {
                        vod_area = element.text.replace('地区：', '')
                    } else if (element.text.includes('语言')) {
                        vod_lang = element.text.replace('语言：', '')
                    } else if (element.text.includes('类型')) {
                        type_name = element.text.replace('类型：', '')
                    } else if (element.text.includes('豆瓣')) {
                        vod_douban_score = element.text.replace('豆瓣：', '')
                    }
                }

                let juJiDocment = document.querySelector('.paly_list_btn')?.querySelectorAll('a') ?? []
                let vod_play_url = ''
                for (let index = 0; index < juJiDocment.length; index++) {
                    const element = juJiDocment[index]

                    vod_play_url += element.text
                    vod_play_url += '$'
                    vod_play_url += element.attributes['href']
                    vod_play_url += '#'
                }

                let detModel = new VideoDetail()
                detModel.vod_year = vod_year
                detModel.type_name = type_name
                detModel.vod_director = vod_director
                detModel.vod_actor = vod_actor
                detModel.vod_area = vod_area
                detModel.vod_lang = vod_lang
                detModel.vod_douban_score = vod_douban_score
                detModel.vod_content = vod_content.trim()
                detModel.vod_pic = vod_pic
                detModel.vod_name = vod_name
                detModel.vod_play_url = vod_play_url
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
        // let url = 'https://www.subaibaiys.com/v_play/bXZfNTUxNDQtbm1fMQ==.html'
        let url = args.url
        try {
            let html = await req(url, { headers: this.headers })
            let document = parse(html.data)
            let iframe = document.querySelectorAll('iframe').filter((iframe) => iframe.getAttribute('src').includes('Cloud'))

            if (0 < iframe.length) {
                const iframeHtml = (
                    await req(iframe[0].getAttribute('src'), {
                        headers: {
                            Referer: url,
                            'User-Agent':
                                'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
                        },
                    })
                ).data
                let code = iframeHtml
                    .match(/var url = '(.*?)'/)[1]
                    .split('')
                    .reverse()
                    .join(''),
                    temp = ''
                for (let i = 0; i < code.length; i += 2) temp += String.fromCharCode(parseInt(code[i] + code[i + 1], 16))
                const playUrl = temp.substring(0, (temp.length - 7) / 2) + temp.substring((temp.length - 7) / 2 + 7)

                backData.data = playUrl
            } else {
                let playUrl = 'error'

                const script = document.querySelectorAll('script')
                const js = script.find((script) => script.text.includes('window.wp_nonce')).text ?? ''
                const group = js.match(/(var.*)eval\((\w*\(\w*\))\)/)
                const md5 = Crypto
                const result = eval(group[1] + group[2])
                playUrl = result.match(/url:.*?['"](.*?)['"]/)[1]

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
    async searchVideo(args) {
        let backData = new RepVideoList()
        let url = this.removeTrailingSlash(this.webSite) + `/page/${args.page}?s=${args.searchWord}`
        try {
            let resp = await req(url, { headers: this.headers })
            backData.error = resp.error
            let respData = resp.data

            if (respData) {
                let document = parse(respData)
                let allVideo = document.querySelector('.search_list').querySelectorAll('li')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('a')?.attributes['href'] ?? ''
                    let vodPic = element.querySelector('img.thumb')?.attributes['data-original'] ?? ''
                    let vodName = element.querySelector('img.thumb')?.attributes['alt'] ?? ''
                    let vodDiJiJi = element.querySelector('.jidi')?.text ?? ''

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                }
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }

        return JSON.stringify(backData)
    }

    async request(reqUrl, referer, mth, data, hd) {
        let headers = {
            'User-Agent': this.headers['User-Agent'],
            Cookie: Object.keys(this.cookie)
                .map((key) => key + '=' + cookie[key])
                .join(';'),
        }

        if (referer) {
            headers.referer = encodeURIComponent(referer)
        }

        referer = await req(reqUrl, {
            method: mth || 'get',
            headers: headers,
            data: data,
            postType: mth === 'post' ? 'form' : '',
        })

        if (referer.headers['set-cookie']) {
            const cookies = Array.isArray(referer.headers['set-cookie']) ? referer.headers['set-cookie'].join(';') : referer.headers['set-cookie']

            for (const c of cookies.split(';')) {
                var tmp = c.trim()
                if (tmp.startsWith('result=')) {
                    cookie.result = tmp.substring(7)
                    return request(reqUrl, reqUrl, 'post', { result: cookie.result })
                }
                if (tmp.startsWith('esc_search_captcha=1')) {
                    cookie.esc_search_captcha = 1
                    delete cookie.result
                    return request(reqUrl)
                }
            }
        }

        return referer.data
    }

    ignoreClassName = ['首页', '公告留言']

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
var sbb20240624 = new sbbClass()
