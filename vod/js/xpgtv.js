class xpgClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'http://item.xpgtv.xyz'
        this.UA = 'okhttp/3.12.11'
        this.ignoreClassName = ['直播']
    }

    async getClassList(args) {
        const webUrl = args.url
        this.webSite = UZUtils.removeTrailingSlash(webUrl)
        let backData = new RepVideoClassList()
        try {
            const pro = await req(webUrl + '/api.php/v2.vod/androidtypes', { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                let data = JSON.parse(proData).data
                let list = []
                data.forEach((e) => {
                    let name = e.type_name
                    if (this.isIgnoreClassName(name)) return

                    let videoClass = new VideoClass()
                    videoClass.hasSubclass = true
                    videoClass.type_id = e.type_id
                    videoClass.type_name = name
                    list.push(videoClass)
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
            let url = UZUtils.removeTrailingSlash(this.webSite) + `/api.php/v2.vod/androidtypes`
            const pro = await req(url, { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let data = JSON.parse(proData).data
                data.forEach((e) => {
                    if (e.type_id == id) {
                        let classesFilter = new FilterTitle()
                        classesFilter.name = '類型'
                        classesFilter.list = []
                        classesFilter.list.push({ name: '不限', id: '' })
                        e.classes.forEach((e) => {
                            let filterLab = new FilterLabel()
                            filterLab.name = e
                            filterLab.id = e
                            classesFilter.list.push(filterLab)
                        })

                        let areasFilter = new FilterTitle()
                        areasFilter.name = '地區'
                        areasFilter.list = []
                        areasFilter.list.push({ name: '不限', id: '' })
                        e.areas.forEach((e) => {
                            let filterLab = new FilterLabel()
                            filterLab.name = e
                            filterLab.id = e
                            areasFilter.list.push(filterLab)
                        })

                        let yearsFilter = new FilterTitle()
                        yearsFilter.name = '年份'
                        yearsFilter.list = []
                        yearsFilter.list.push({ name: '不限', id: '' })
                        e.years.forEach((e) => {
                            let filterLab = new FilterLabel()
                            filterLab.name = e
                            filterLab.id = e
                            yearsFilter.list.push(filterLab)
                        })
                        backData.data.filter.push(classesFilter, areasFilter, yearsFilter)
                    }
                })
            }
        } catch (error) {
            backData.error = '获取分类失败～ ' + error
        }
        return JSON.stringify(backData)
    }

    async getSubclassVideoList(args) {
        let backData = new RepVideoList()
        backData.data = []
        try {
            let [{ id: classes }, { id: areas }, { id: years }] = args.filter
            const url =
                UZUtils.removeTrailingSlash(this.webSite) +
                `/api.php/v2.vod/androidfilter10086?page=${args.page}&type=${args.mainClassId}&area=${areas}&year=${years}&class=${classes}`

            const pro = await req(url, { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let data = JSON.parse(proData).data
                let videos = []
                data.forEach((element) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = element.id
                    videoDet.vod_pic = element.pic
                    videoDet.vod_name = element.name
                    videoDet.vod_remarks = element.state

                    videos.push(videoDet)
                })

                backData.data = videos
            }
        } catch (error) {
            backData.error = '获取视频列表失败～ ' + error
        }

        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        const webUrl = this.webSite + '/api.php/v3.vod/androiddetail2?vod_id=' + args.url
        try {
            const pro = await req(webUrl, { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                let data = JSON.parse(proData).data
                let vod_content = data.content
                let vod_pic = data.pic
                let vod_name = data.name
                let vod_year = data.year
                let vod_director = data.director || ''
                let vod_actor = data.actor
                let vod_area = data.area
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                let playlist = data.urls
                let vod_play_url = ''
                playlist.forEach((element) => {
                    let name = element.key
                    let url = element.url
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
        let url = `http://c.xpgtv.net/m3u8/${args.url}.m3u8`
        try {
            let headers = {
                token2: 'enxerhSl0jk2TGhbZCygMdwoKqOmyxsk/Kw8tVy4dsRBE1o1xBhWhoFbh98=',
                token: 'RXQbgQKl3QkFZkIPGwGvH5kofvCokkkn/a893wC2IId7HQFmy0Eh24osz555X12xGVFxQLTaGuBqU/Y7KU4lStp4UjR7giPxdwoTOsU6R3oc4yZZTQc/yTKh1mH3ckZhx6VsQCEoFf6q',
                version: 'XPGBOX com.phoenix.tv1.3.3',
                user_id: 'XPGBOX',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                screenx: '1280',
                screeny: '720',
            }
            headers['timestamp'] = Math.floor(Date.now() / 1e3)
            headers['hash'] = Crypto.MD5(
                '||||DC6FFCB55FA||861824127032820||12702720||Asus/Asus/ASUS_I003DD:7.1.2/20171130.376229:user/release-keysXPGBOX com.phoenix.tv1.3.3' +
                    headers['timestamp']
            )
                .toString()
                .toLowerCase()
                .substring(8, 12)

            backData.data = url
            backData.headers = headers
        } catch (e) {
            UZUtils.debugLog(e)
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            const url = UZUtils.removeTrailingSlash(this.webSite) + `/api.php/v2.vod/androidsearch10086?page=${args.page}&wd=${args.searchWord}`

            const pro = await req(url, { headers: { 'User-Agent': this.UA } })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let data = JSON.parse(proData).data
                let videos = []
                data.forEach((element) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = element.id
                    videoDet.vod_pic = element.pic
                    videoDet.vod_name = element.name
                    videoDet.vod_remarks = element.state

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
let xpg20240824 = new xpgClass()
