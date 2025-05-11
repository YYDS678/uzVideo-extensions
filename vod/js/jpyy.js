//@name:「直」 金牌影视
//@version:2
//@webSite:https://www.ghw9zwp5.com
//@remark:
//@type:100
//@instance:jpyy20240716
//@order: C
class jpyyClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://www.ghw9zwp5.com'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Referer: this.webSite,
        }
        this.ignoreClassName = ['首页']
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
                let allClass = $('header > div > div[class^="header__HeaderLeftBox"] a')
                let list = []
                allClass.each((index, element) => {
                    const cat = $(element)
                    if (this.isIgnoreClassName(cat.text())) return

                    let name = cat.text()
                    let url = cat.attr('href')
                    if (url.length > 0 && name.length > 0) {
                        let videoClass = new VideoClass()
                        videoClass.hasSubclass = true
                        videoClass.type_id = url.match(/type\/(\d+)/)[1]
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

    async getSubclassList(args) {
        let backData = new RepVideoSubclassList()
        backData.data = new VideoSubclass()
        const id = args.url
        try {
            let url = UZUtils.removeTrailingSlash(this.webSite) + `/vod/show/id/${id}`
            const pro = await req(url, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let allFilterBox = $('.filter-box')
                allFilterBox.each((index, element) => {
                    let name = $(element).find('.filter-title').text()
                    let items = $(element).find('.filter-li')

                    let filterTitle = new FilterTitle()
                    filterTitle.name = name
                    filterTitle.list = []
                    filterTitle.list.push({ name: '全部', id: '' })
                    items.each((index, element) => {
                        const name = $(element).text()
                        const path = $(element).attr('href')
                        const regex = new RegExp(`vod/show/id/${id}(.*)`)
                        const match = path.match(regex)
                        const parsStr = match ? match[1] : null
                        if (parsStr) {
                            let filterLab = new FilterLabel()
                            filterLab.name = name
                            filterLab.id = parsStr
                            filterTitle.list.push(filterLab)
                        }
                    })
                    backData.data.filter.push(filterTitle)
                })
            }
        } catch (error) {
            backData.error = '获取分类失败～ ' + error
        }
        return JSON.stringify(backData)
    }

    async getSubclassVideoList(args) {
        var backData = new RepVideoList()
        backData.data = []
        try {
            let pList = [args.mainClassId]
            if (args.filter.length > 0) {
                // 筛选
                for (let index = 0; index < args.filter.length; index++) {
                    const element = args.filter[index]
                    pList.push(element.id)
                }
            } else {
                pList.push(args.subclassId)
                for (let index = 0; index < 4; index++) {
                    pList.push('')
                }
            }

            let path = pList.join('')
            const url = UZUtils.removeTrailingSlash(this.webSite) + '/vod/show/id/' + path + '/page/' + args.page

            const pro = await req(url)
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let videos = []
                for (const script of $('script')) {
                    if ($(script).text().indexOf('操作成功') > -1) {
                        let json = JSON.parse(eval($(script).text().replaceAll('self.__next_f.push(', '').replaceAll(')', ''))[1].replaceAll('6:', ''))
                        let vodJson = json[3]['videoList'].data
                        for (const vod_element of vodJson.list) {
                            let video = new VideoDetail()
                            video.vod_id = vod_element.vodId
                            video.vod_name = vod_element.vodName
                            video.vod_pic = vod_element.vodPic
                            video.vod_remarks = vod_element.vodRemarks || vod_element.vodVersion
                            videos.push(video)
                        }
                    }
                }

                backData.data = videos
            }
        } catch (error) {
            backData.error = '获取视频列表失败～ ' + error
        }

        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        const webUrl = UZUtils.removeTrailingSlash(this.webSite) + `/detail/${args.url}`
        try {
            const pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let json = {}
                for (const script of $('script')) {
                    if ($(script).text().indexOf('操作成功') > -1) {
                        json = JSON.parse(eval($(script).text().replaceAll('self.__next_f.push(', '').replaceAll(')', ''))[1].replaceAll('6:', ''))
                    }
                }
                let vodJson = json[3].data.data
                let vod_content = vodJson.vodBlurb || ''
                let vod_pic = vodJson.vodPic
                let vod_name = vodJson.vodName
                // let detList = document.querySelectorAll('ewave-content__detail p.data')
                let vod_year = vodJson.vodYear
                let vod_director = vodJson.vodDirector
                let vod_actor = vodJson.vodActor
                let vod_area = vodJson.vodArea
                let vod_lang = vodJson.vodLang
                let vod_douban_score = vodJson.vodScore
                let type_name = ''

                let juJiDocment = $('div[class^="detail__PlayListBox"]').find('div.listitem')

                let vod_play_url = ''
                juJiDocment.each((index, element) => {
                    let name = $(element).find('a').text()
                    let url = $(element).find('a').attr('href')
                    vod_play_url += name
                    vod_play_url += '$'
                    vod_play_url += url
                    vod_play_url += '#'
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
        const parts = args.url.match(/vod\/play\/(.*)\/sid\/(.*)/)
        const id = parts[1]
        const sid = parts[2]
        let reqUrl = `${UZUtils.removeTrailingSlash(this.webSite)}/api/mw-movie/anonymous/v1/video/episode/url?id=${id}&nid=${sid}`

        try {
            const signKey = this.base64Decode('Y2I4MDg1MjliYWU2YjZiZTQ1ZWNmYWIyOWE0ODg5YmM=')
            const dataStr = reqUrl.split('?')[1]
            const t = Date.now()
            const signStr = dataStr + `&key=${signKey}` + `&t=${t}`
            const headers = {
                'User-Agent': this.headers['User-Agent'],
                deviceId: getUUID(),
                t: t,
                sign: Crypto.SHA1(Crypto.MD5(signStr).toString()).toString(),
            }

            function getUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (e) => ('x' === e ? (16 * Math.random()) | 0 : 'r&0x3' | '0x8').toString(16))
            }

            const pro = await req(reqUrl, { headers: headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let playUrl = proData.data.playUrl
                backData.data = playUrl
                backData.headers = this.headers
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
            let searchUrl = `${UZUtils.removeTrailingSlash(this.webSite)}/vod/search/${args.searchWord}`
            let pro = await req(searchUrl, { headers: this.headers })
            backData.error = pro.error
            let body = pro.data
            if (body) {
                let $ = cheerio.load(body)
                let videos = []
                let data = ''
                $('script').each((index, element) => {
                    if ($(element).text().indexOf('操作成功') > -1) {
                        data = $(element)
                            .text()
                            .replace(/self\.__next_f\.push\(|\)|\\/g, '')
                    }
                })
                let ids = data.match(/"vodId":\d+/gm)
                let name = data.match(/"vodName":"([^"]*)/gm)
                let pics = data.match(/"vodPic":"([^"]*)/gm)
                let remarks = data.match(/"vodRemarks":"([^"]*)/gm)

                ids.forEach((item, index) => {
                    let video = {}
                    video.vod_id = item.replace('"vodId":', '')
                    video.vod_name = name[index].replace('"vodName":', '').replace('"', '')
                    video.vod_pic = pics[index].replace('"vodPic":', '').replace('"', '')
                    video.vod_remarks = remarks[index].replace('"vodRemarks":', '').replace('"', '')
                    videos.push(video)
                })
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    base64Decode(text) {
        return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))
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
let jpyy20240716 = new jpyyClass()
