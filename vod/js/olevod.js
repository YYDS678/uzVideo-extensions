// ignore
//@name:「直」 欧乐影视
//@version:2
//@webSite:https://www.olevod.tv
//@remark:
//@type:100
//@instance:olevod20240620
//@order: C
import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'
// ignore

class olevodClass extends WebApiBase {
    /**
     *
     */
    constructor() {
        super();
        this.webSite = 'https://www.olevod.tv'
    }
    /**
     * 异步获取分类列表的方法。
     * @param {UZArgs} args
     * @returns {Promise<RepVideoClassList>}
     */
    async getClassList(args) {
        let backData = new RepVideoClassList()
        let url = `https://api.olelive.com/v1/pub/vod/list/type?_vv=${this.signature()}`

        try {
            let pro = await req(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                },
            })
            backData.error = pro.error
            let proData = pro.data
            if (proData.data) {
                let category = proData.data
                let list = []
                category.forEach((e) => {
                    let videoClass = new VideoClass()
                    videoClass.type_id = e.typeId
                    videoClass.type_name = e.typeName
                    list.push(videoClass)
                })
                list = list.filter((e) => !this.isIgnoreClassName(e.type_name))
                backData.data = list
            }
        } catch (e) {
            backData.error = e.message
        }

        return JSON.stringify(backData)
    }

    /**
     * 获取分类视频列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    async getVideoList(args) {
        let listUrl = `https://api.olelive.com/v1/pub/vod/list/true/3/0/0/${args.url}/0/0/update/${args.page}/48?_vv=` + this.signature()
        let backData = new RepVideoList()
        try {
            let pro = await req(listUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                },
            })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let obj = proData.data.list
                var list = []
                obj.forEach((e) => {
                    let img = `https://static.olelive.com/${e.pic}`
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = e.id
                    videoDet.vod_pic = img
                    videoDet.vod_name = e.name
                    videoDet.vod_remarks = e.remarks
                    videoDet.vod_douban_score = e.score
                    videoDet.vod_year = e.year
                    list.push(videoDet)
                })
                backData.data = list
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
            let url = `https://api.olelive.com/v1/pub/vod/detail/${args.url}/true?_vv=${this.signature()}`
            let pro = await req(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                },
            })
            backData.error = pro.error
            let obj = pro.data.data
            if (obj) {
                let detModel = new VideoDetail()
                let urls = obj.urls
                let vod_play_url = ''
                urls.forEach((e) => {
                    vod_play_url += e.title
                    vod_play_url += '$'
                    vod_play_url += e.url
                    vod_play_url += '#'
                })

                detModel.vod_year = obj.year
                detModel.type_name = obj.typeIdName
                detModel.vod_director = obj.director
                detModel.vod_actor = obj.actor
                detModel.vod_area = obj.area
                detModel.vod_lang = obj.lang
                detModel.vod_douban_score = obj.score
                detModel.vod_content = obj.content
                detModel.vod_pic = `https://static.olelive.com/${obj.pic}`
                detModel.vod_name = obj.name
                detModel.vod_play_url = vod_play_url
                detModel.vod_id = obj.id

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

        backData.data = args.url
        backData.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
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
        let url = `https://api.olelive.com/v1/pub/index/search/${args.searchWord}/vod/0/${args.page}/48?_vv=${this.signature()}`
        try {
            let pro = await req(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                },
            })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let obj = proData.data.data
                let vod = obj.find((item) => item.type === 'vod')
                var list = []
                vod.list.forEach((e) => {
                    if (e.vip === true) return
                    let img = `https://static.olelive.com/${e.pic}`
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = e.id
                    videoDet.vod_pic = img
                    videoDet.vod_name = e.name
                    videoDet.vod_remarks = e.remarks
                    videoDet.vod_douban_score = e.score
                    videoDet.vod_year = e.year
                    list.push(videoDet)
                })
                backData.data = list
            }
        } catch (error) {
            backData.error = '获取列表失败～' + error.message
        }
        return JSON.stringify(backData)
    }

    signature() {
        return this.t(Date.parse(new Date()) / 1000)
    }

    t(e) {
        let t = e.toString(),
            r = [[], [], [], []]
        for (var i = 0; i < t.length; i++) {
            let e = this.he(t[i])
                ; (r[0] += e.slice(2, 3)), (r[1] += e.slice(3, 4)), (r[2] += e.slice(4, 5)), (r[3] += e.slice(5))
        }
        let a = []
        for (i = 0; i < r.length; i++) {
            let e = parseInt(r[i], 2).toString(16)
            2 == e.length && (e = '0' + e), 1 == e.length && (e = '00' + e), 0 == e.length && (e = '000'), (a[i] = e)
        }
        let n = Crypto.MD5(t).toString()
        return n.slice(0, 3) + a[0] + n.slice(6, 11) + a[1] + n.slice(14, 19) + a[2] + n.slice(22, 27) + a[3] + n.slice(30)
    }

    he(e) {
        let t = [],
            r = e.split('')
        for (var i = 0; i < r.length; i++) {
            0 != i && t.push(' ')
            let e = r[i].charCodeAt().toString(2)
            t.push(e)
        }
        return t.join('')
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

    ignoreClassName = ['VIP']
}
var olevod20240620 = new olevodClass()
