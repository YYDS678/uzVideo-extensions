// ignore
//@name:「直」 瓜子web
//@version:2
//@webSite:https://api.zaqohu.com
//@remark:
//@type:100
//@instance:gzys20240822
//@order: C

import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

class gzysClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://api.zaqohu.com'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Content-Type': 'application/json',
        }
        this.ignoreClassName = ['首页']
    }

    async getClassList(args) {
        const webUrl = args.url
        this.webSite = UZUtils.removeTrailingSlash(webUrl)
        let backData = new RepVideoClassList()
        try {
            // let ping = await req(webUrl, { headers: { 'User-Agent': this.headers['User-Agent'] } })
            backData.error = 'null'
            let list = []
            let allClass = [
                {
                    type_id: 3,
                    type_name: '电影',
                    hasSubclass: true,
                },
                {
                    type_id: 4,
                    type_name: '电视剧',
                    hasSubclass: true,
                },
                {
                    type_id: 5,
                    type_name: '动漫',
                    hasSubclass: true,
                },
                {
                    type_id: 6,
                    type_name: '综艺',
                    hasSubclass: true,
                },
            ]
            allClass.forEach((e) => {
                let videoClass = new VideoClass()
                videoClass.hasSubclass = true
                videoClass.type_id = e.type_id
                videoClass.type_name = e.type_name
                list.push(videoClass)
            })

            backData.data = list
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
            // let ping = await req(this.webSite, { headers: { 'User-Agent': this.headers['User-Agent'] } })
            backData.error = 'null'
            let filter = [
                {
                    name: '分類',
                    list: [
                        { name: '热播电影', id: 3 },
                        { name: 'TC搶先看', id: 19260 },
                        { name: '院線大片', id: 15649 },
                        { name: '網路新片速遞', id: 12814 },
                        { name: 'Netflix最新', id: 15510 },
                        { name: '動作片', id: 9153 },
                        { name: '悬疑犯罪片', id: 12558 },
                        { name: '喜剧片', id: 14 },
                        { name: '惊悚恐怖片', id: 15511 },
                        { name: '科幻魔幻片', id: 11517 },
                        { name: '情感剧情片', id: 466 },
                        { name: '战争片', id: 18046 },
                        { name: '豆瓣电影TOP250', id: 17613 },
                        { name: '抖音“毒舌电影”解说原片', id: 16215 },
                        { name: '入围奥斯卡的LGBT电影经典', id: 17054 },
                        { name: '冷门悬疑佳片Top20', id: 8 },
                        { name: '历届金马奖最佳影片', id: 16308 },
                        { name: '历届金像奖最佳影片', id: 16506 },
                        { name: '历届奥斯卡最佳影片', id: 16560 },
                    ],
                },
                {
                    name: '分類',
                    list: [
                        { name: '热播电视剧', id: 4 },
                        { name: '爱优腾芒最新', id: 16768 },
                        { name: 'Netflix', id: 16540 },
                        { name: '最新日韩剧', id: 16692 },
                        { name: '港剧TVB', id: 17473 },
                        { name: '最新美剧', id: 16941 },
                        { name: '最新泰剧', id: 18598 },
                        { name: '高分悬疑犯罪剧', id: 6611 },
                        { name: '高分经典大陆剧', id: 15386 },
                        { name: '近年来高分台剧', id: 17084 },
                        { name: '《9号秘事》系列', id: 18319 },
                        { name: 'Netflix获奖影片', id: 18371 },
                    ],
                },
                {
                    name: '分類',
                    list: [
                        { name: '热播动漫', id: 5 },
                        { name: '今日上新', id: 6175 },
                        { name: '番剧新热推荐', id: 10679 },
                        { name: '国产动漫', id: 127 },
                        { name: '日本动漫', id: 446 },
                        { name: '欧美动漫', id: 128 },
                        { name: '动漫电影', id: 14182 },
                        { name: '入站必追✦累计2亿追番', id: 10772 },
                        { name: '热血番剧榜', id: 8101 },
                        { name: '奇幻番剧榜', id: 12655 },
                        { name: '《恶搞之家》系列', id: 20215 },
                        { name: '球类运动系列', id: 9282 },
                        { name: '火影忍者剧场版系列', id: 13300 },
                        { name: '《间谍亚契》系列', id: 129 },
                        { name: '热血机战系列', id: 6163 },
                    ],
                },
                {
                    name: '分類',
                    list: [
                        { name: '热播综艺', id: 6 },
                        { name: '近期热门综艺', id: 6663 },
                        { name: 'NetFlix最新综艺', id: 14244 },
                        { name: '日韩最新综艺', id: 7017 },
                        { name: '恋爱甜综', id: 8249 },
                        { name: '推理逻辑整蛊', id: 8063 },
                        { name: '生活职场', id: 8321 },
                        { name: '爆笑语言综艺', id: 10119 },
                        { name: '明星大集合', id: 6757 },
                        { name: '音乐有嘻哈', id: 156 },
                        { name: '圆桌派', id: 158 },
                        { name: '卫视热播综艺', id: 9384 },
                    ],
                },
            ]
            let temp
            switch (id) {
                case '3':
                    temp = filter[0]
                    break
                case '4':
                    temp = filter[1]
                    break
                case '5':
                    temp = filter[2]
                    break
                case '6':
                    temp = filter[3]
                    break
            }
            let filterTitle = new FilterTitle()
            filterTitle.name = temp.name
            filterTitle.list = []
            temp.list.forEach((e) => {
                let filterLab = new FilterLabel()
                filterLab.name = e.name
                filterLab.id = String(e.id) // id must be string
                filterTitle.list.push(filterLab)
            })
            backData.data.filter.push(filterTitle)
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
            let listUrl = UZUtils.removeTrailingSlash(this.webSite)
            let params
            if (args.filter[0].id <= 6) {
                listUrl = listUrl + '/H5/Category/GetChoiceList'
                params = { pid: args.filter[0].id, pageSize: 24, page: args.page }
            } else {
                listUrl = listUrl + '/H5/Category/GetModuleList'
                params = { show_id: args.filter[0].id, show_pid: args.mainClassId, pageSize: 24, page: args.page }
            }
            let pro = await req(listUrl, {
                method: 'POST',
                headers: this.headers,
                data: { params: this.aesEncode(JSON.stringify(params)) },
            })
            let proData = pro.data
            backData.error = pro.error

            let decryptBody = this.aesDecode(proData.data)
            let obj = JSON.parse(decryptBody)
            let allVideo = obj.list
            let videos = []
            allVideo.forEach((e) => {
                let vodUrl = e.vod_id || ''
                let vodPic = e.c_pic || e.vod_pic
                let vodName = e.c_name || e.vod_name
                let vodDiJiJi = e.vod_continu || ''
                let videoDet = new VideoDetail()
                videoDet.vod_id = +vodUrl
                videoDet.vod_pic = vodPic
                videoDet.vod_name = vodName.trim()
                videoDet.vod_remarks = vodDiJiJi.trim()
                videos.push(videoDet)
            })
            backData.data = videos
        } catch (error) {
            backData.error = '获取视频列表失败～ ' + error
        }

        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        const webUrl = `${this.webSite}/H5/Resource/GetVodInfo`
        try {
            let params = { vod_id: args.url }
            const pro = await req(webUrl, {
                method: 'POST',
                headers: this.headers,
                data: { params: this.aesEncode(JSON.stringify(params)) },
            })
            backData.error = pro.error
            const proData = pro.data
            if (proData) {
                let obj = JSON.parse(this.aesDecode(proData.data)).vodInfo
                UZUtils.debugLog(obj)
                let vod_content = obj.vod_use_content
                let vod_pic = obj.pic
                let vod_name = obj.vod_name
                let vod_year = obj.vod_year || ''
                let vod_director = obj.vod_director || ''
                let vod_actor = obj.vod_actor || ''
                let vod_area = obj.vod_area || ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                // get playlist
                let playlistUrl = `${this.webSite}/H5/Resource/GetOnePlayList`
                let params2 = { vod_id: args.url, pageSize: 10000, page: 1 }
                let res = await req(playlistUrl, {
                    method: 'POST',
                    headers: this.headers,
                    data: { params: this.aesEncode(JSON.stringify(params2)) },
                })
                let playData = JSON.parse(this.aesDecode(res.data.data))
                let vod_play_url = playData.urls.map((item) => item.name + '$' + item.url).join('#')

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

        try {
            backData.headers = {
                'User-Agent': this.headers['User-Agent'],
            }
            backData.data = args.url
        } catch (e) {
            UZUtils.debugLog(e)
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    async searchVideo(args) {
        let backData = new RepVideoList()
        // 不支持搜尋
        try {
            backData.data = ''
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    aesEncode(str) {
        const key = Crypto.enc.Utf8.parse('181cc88340ae5b2b')
        const iv = Crypto.enc.Utf8.parse('4423d1e2773476ce')

        let encData = Crypto.AES.encrypt(str, key, {
            iv: iv,
            mode: Crypto.mode.CBC,
            padding: Crypto.pad.Pkcs7,
        })
        return encData.ciphertext.toString(Crypto.enc.Hex)
    }

    aesDecode(str) {
        const key = Crypto.enc.Utf8.parse('181cc88340ae5b2b')
        const iv = Crypto.enc.Utf8.parse('4423d1e2773476ce')

        str = Crypto.enc.Hex.parse(str)
        return Crypto.AES.decrypt({ ciphertext: str }, key, {
            iv: iv,
            mode: Crypto.mode.CBC,
            padding: Crypto.pad.Pkcs7,
        }).toString(Crypto.enc.Utf8)
    }
}
let gzys20240822 = new gzysClass()
