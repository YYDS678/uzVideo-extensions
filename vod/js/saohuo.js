// ignore
//@name:「直」 烧火
//@version:2
//@webSite:https://saohuo.tv
//@remark:
//@type:100
//@instance:saohuo20240623
//@order: C
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

class saohuoClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://saohuo.tv'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
            Cookie: 'PHPSESSID=oe6prf46idn97gmd7j5gffka39',
        }
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
        var backData = new RepVideoClassList()
        try {
            const pro = await req(webUrl, { headers: this.headers })
            // let cookie = pro.headers['set-cookie']
            // this.headers.cookie = cookie
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allClass = document.querySelectorAll('nav.top_bar > a')
                let list = []
                for (let index = 0; index < allClass.length; index++) {
                    const element = allClass[index]
                    let isIgnore = this.isIgnoreClassName(element.text)
                    if (isIgnore) {
                        continue
                    }
                    let type_name = element.text
                    let url
                    if (type_name === '动漫') {
                        url = '/list/4.html'
                    } else url = element.attributes['href']

                    url = this.combineUrl(url)
                    // url = url.slice(0, -5)

                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = new VideoClass()
                        videoClass.hasSubclass = true
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

    async getSubclassList(args) {
        let backData = new RepVideoSubclassList()
        backData.data = new VideoSubclass()
        const url = args.url
        try {
            const pro = await req(url, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let filter = $('.mini_type a')
                let filterTitle = new FilterTitle()
                filterTitle.name = '類型'
                filterTitle.list = []
                filter.each((index, element) => {
                    let name = $(element).text()
                    let id = $(element)
                        .attr('href')
                        .match(/list\/(.*)\.html/)[1]
                    let filterLab = new FilterLabel()
                    filterLab.name = name
                    filterLab.id = id
                    filterTitle.list.push(filterLab)
                })
                backData.data.filter.push(filterTitle)
            }
        } catch (error) {
            backData.error = '获取分类失败～ ' + error
        }
        return JSON.stringify(backData)
    }

    async getSubclassVideoList(args) {
        let backData = new RepVideoList()
        // UZUtils.debugLog(args)
        backData.data = []
        try {
            const listUrl = this.removeTrailingSlash(this.webSite) + '/list/' + args.filter[0].id + '-' + args.page + '.html'

            let pro = await req(listUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelectorAll('ul.v_list div.v_img')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('a')?.attributes['href'] ?? ''
                    let vodPic = element.querySelector('img')?.attributes['data-original'] ?? ''
                    let vodName = element.querySelector('a')?.attributes['title'] ?? ''
                    let vodDiJiJi = element.querySelector('.v_note')?.text

                    vodUrl = this.combineUrl(vodUrl)

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
            backData.error = '获取视频列表失败～ ' + error
        }

        return JSON.stringify(backData)
    }

    // /**
    //  * 获取分类视频列表
    //  * @param {UZArgs} args
    //  * @returns {Promise<RepVideoList>}
    //  */
    // async getVideoList(args) {
    //     let listUrl = this.removeTrailingSlash(args.url) + '-' + args.page + '.html'
    //     let backData = new RepVideoList()
    //     try {
    //         let pro = await req(listUrl, { headers: this.headers })
    //         backData.error = pro.error
    //         let proData = pro.data
    //         if (proData) {
    //             let document = parse(proData)
    //             let allVideo = document.querySelectorAll('ul.v_list div.v_img')
    //             let videos = []
    //             for (let index = 0; index < allVideo.length; index++) {
    //                 const element = allVideo[index]
    //                 let vodUrl = element.querySelector('a')?.attributes['href'] ?? ''
    //                 let vodPic = element.querySelector('img')?.attributes['data-original'] ?? ''
    //                 let vodName = element.querySelector('a')?.attributes['title'] ?? ''
    //                 let vodDiJiJi = element.querySelector('.v_note')?.text

    //                 vodUrl = this.combineUrl(vodUrl)

    //                 let videoDet = new VideoDetail()
    //                 videoDet.vod_id = vodUrl
    //                 videoDet.vod_pic = vodPic
    //                 videoDet.vod_name = vodName
    //                 videoDet.vod_remarks = vodDiJiJi
    //                 videos.push(videoDet)
    //             }
    //             backData.data = videos
    //         }
    //     } catch (error) {
    //         backData.error = '获取列表失败～' + error.message
    //     }
    //     return JSON.stringify(backData)
    // }

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
                let vod_content = document.querySelector('.p_txt')?.innerHTML.split('<br')[0] ?? ''
                let vod_pic =
                    document
                        .querySelector('.m_background')
                        .getAttribute('style')
                        .match(/url\((.+)\)/)[1] || ''
                let vod_name = document.querySelector('.v_title')?.text ?? ''
                let detList = document.querySelector('.v_info_box p')?.text ?? ''
                let vod_year = ''
                let vod_director = ''
                let vod_actor = ''
                let vod_area = ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                let newDetList = detList.split('/')

                for (let index = 0; index < newDetList.length; index++) {
                    const element = newDetList[index].trim()
                    if (/^\d{4}$/.test(element)) {
                        vod_year = element
                    } else if (element.includes('导演')) {
                        vod_director = element.replace('导演：', '')
                    } else if (element.includes('主演')) {
                        vod_actor = element.replace('主演：', '')
                    } else if (element.endsWith('分')) {
                        vod_douban_score = element
                    } else {
                        vod_area = element
                    }
                }

                let play_from = []
                document
                    .querySelector('ul.from_list')
                    ?.querySelectorAll('li')
                    .forEach((e) => {
                        play_from.push(e.text)
                    })

                let juJiDocment = document.querySelector('#play_link')?.querySelectorAll('li') ?? []
                let vod_play_from = ''
                let vod_play_url = ''
                for (let i = 0; i < juJiDocment.length; i++) {
                    let playLinkList = juJiDocment[i]
                    let playLinks = playLinkList.querySelectorAll('a')
                    let from = play_from[i]

                    for (let j = playLinks.length - 1; j >= 0; j--) {
                        const element = playLinks[j]
                        vod_play_url += element.text
                        vod_play_url += '$'
                        vod_play_url += element.attributes['href']
                        vod_play_url += '#'
                    }
                    vod_play_from += from.trim() + '$$$'
                    vod_play_url += '$$$'
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
                detModel.vod_play_url = vod_play_url
                detModel.vod_id = webUrl
                detModel.vod_play_from = vod_play_from

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
        let reqUrl = this.combineUrl(args.url)

        try {
            const pro = await req(reqUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data

            if (proData) {
                let document = parse(proData)
                let iframeUrl = document.querySelector('iframe')?.attributes['src'] ?? ''
                let apiurl = iframeUrl ? UZUtils.getHostFromURL(iframeUrl) + '/api.php' : ''

                let resp = await req(iframeUrl, {
                    headers: this.headers,
                })
                backData.error = resp.error
                if (resp.data) {
                    let respScript = parse(resp.data).querySelector('body script').text
                    let url = respScript.match(/var url = "(.*)"/)[1]
                    let t = respScript.match(/var t = "(.*)"/)[1]
                    let key = respScript.match(/var key = "(.*)"/)[1]

                    let presp = await req(apiurl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': this.headers['User-Agent'],
                            Referer: iframeUrl,
                        },
                        data: {
                            url: url,
                            t: t,
                            key: key,
                            act: 0,
                            play: 1,
                        },
                    })
                    let purl = presp.data.url
                    backData.data = /http/.test(purl) ? purl : UZUtils.getHostFromURL(iframeUrl) + purl
                } else backData.error = 'resp is empty'
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
        let ocrApi = 'https://api.nn.ci/ocr/b64/json'
        let validate = this.webSite + '/include/vdimgck.php'
        let search = `${this.webSite}/search.php?searchword=${encodeURIComponent(args.searchWord)}`
        try {
            function arrayBufferToBase64(arrayBuffer) {
                let uint8Array = new Uint8Array(arrayBuffer)
                let wordArray = Crypto.lib.WordArray.create(uint8Array)
                let base64String = Crypto.enc.Base64.stringify(wordArray)

                return base64String
            }
            // let init = await req(search, { headers: this.headers })
            let img = await req(validate, {
                headers: this.headers,
                responseType: 'arraybuffer',
            })

            let b64 = arrayBufferToBase64(img.data)
            let ocrRes = await req(ocrApi, {
                method: 'POST',
                headers: this.headers,
                data: b64,
            })
            let vd = JSON.parse(ocrRes.data).result
            let searchUrl = this.webSite + '/search.php?scheckAC=check&page=&searchtype=&order=&tid=&area=&year=&letter=&yuyan=&state=&money=&ver=&jq='
            let searchRes = await req(searchUrl, {
                method: 'POST',
                headers: {
                    'user-agent': this.headers['User-Agent'],
                    cookie: this.headers.Cookie,
                    // referer: search,
                    'content-type': 'application/x-www-form-urlencoded',
                },
                data: `validate=${vd.toUpperCase()}&searchword=${encodeURIComponent(args.searchWord)}`,
            })
            let _$ = cheerio.load(searchRes.data)
            let videos = []
            let allVideo = _$('ul.v_list div.v_img')
            allVideo.each((index, element) => {
                let vodUrl = _$(element).find('a').attr('href') || ''
                let vodPic = _$(element).find('img').attr('data-original') || ''
                let vodName = _$(element).find('a').attr('title') || ''
                let vodDiJiJi = _$(element).find('.v_note').text() || ''

                let videoDet = {}
                videoDet.vod_id = this.webSite + vodUrl
                videoDet.vod_pic = vodPic
                videoDet.vod_name = vodName
                videoDet.vod_remarks = vodDiJiJi.trim()
                videos.push(videoDet)
            })
            backData.data = videos
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    ignoreClassName = ['最近更新', '排行榜']

    base64Encode(text) {
        return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))
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
var saohuo20240623 = new saohuoClass()
