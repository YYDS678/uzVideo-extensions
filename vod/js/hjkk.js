// ignore
//@name:「直」 韩剧看看
//@version:2
//@webSite:https://www.hanjukankan.com
//@remark:
//@type:100
//@instance:hjkk20240624
//@order: C
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

class hjkkClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://www.hanjukankan.com'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
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
        let backData = new RepVideoClassList()
        try {
            backData.error = null
            backData.data = [
                {
                    type_id: '1',
                    type_name: '韓劇',
                    hasSubclass: true,
                },
                {
                    type_id: '2',
                    type_name: '韓影',
                    hasSubclass: true,
                },
                {
                    type_id: '3',
                    type_name: '韓綜',
                    hasSubclass: true,
                },
            ]
        } catch (error) {
            backData.error = '获取分类失败～' + error.message
        }

        return JSON.stringify(backData)
    }

    async getSubclassList(args) {
        let backData = new RepVideoSubclassList()
        backData.data = new VideoSubclass()
        const id = args.url
        try {
            backData.error = null
            let filter = []
            switch (id) {
                case '1':
                    filter = [
                        {
                            name: '分類',
                            list: [
                                { name: '全部', id: '' },
                                { name: '喜剧', id: '喜剧' },
                                { name: '爱情', id: '爱情' },
                                { name: '恐怖', id: '恐怖' },
                                { name: '动作', id: '动作' },
                                { name: '科幻', id: '科幻' },
                                { name: '剧情', id: '剧情' },
                                { name: '战争', id: '战争' },
                                { name: '警匪', id: '警匪' },
                                { name: '犯罪', id: '犯罪' },
                                { name: '动画', id: '动画' },
                                { name: '奇幻', id: '奇幻' },
                                { name: '武侠', id: '武侠' },
                                { name: '冒险', id: '冒险' },
                                { name: '枪战', id: '枪战' },
                                { name: '恐怖', id: '恐怖' },
                                { name: '悬疑', id: '悬疑' },
                                { name: '惊悚', id: '惊悚' },
                                { name: '经典', id: '经典' },
                                { name: '青春', id: '青春' },
                                { name: '文艺', id: '文艺' },
                                { name: '微电影', id: '微电影' },
                                { name: '古装', id: '古装' },
                                { name: '历史', id: '历史' },
                                { name: '运动', id: '运动' },
                                { name: '农村', id: '农村' },
                                { name: '儿童', id: '儿童' },
                                { name: '网络电影', id: '网络电影' },
                            ],
                        },
                        {
                            name: '年份',
                            list: [
                                { name: '全部', id: '' },
                                { name: '2024', id: '2024' },
                                { name: '2023', id: '2023' },
                                { name: '2022', id: '2022' },
                                { name: '2021', id: '2021' },
                                { name: '2020', id: '2020' },
                                { name: '2019', id: '2019' },
                                { name: '2018', id: '2018' },
                                { name: '2017', id: '2017' },
                                { name: '2016', id: '2016' },
                                { name: '2015', id: '2015' },
                                { name: '2014', id: '2014' },
                                { name: '2013', id: '2013' },
                                { name: '2012', id: '2012' },
                                { name: '2011', id: '2011' },
                                { name: '2010', id: '2010' },
                                { name: '2009', id: '2009' },
                                { name: '2008', id: '2008' },
                                { name: '2007', id: '2007' },
                                { name: '2006', id: '2006' },
                                { name: '2005', id: '2005' },
                                { name: '2004', id: '2004' },
                                { name: '2003', id: '2003' },
                                { name: '2002', id: '2002' },
                                { name: '2001', id: '2001' },
                                { name: '2000', id: '2000' },
                            ],
                        },
                        {
                            name: '排序',
                            list: [
                                { name: '最新', id: 'time' },
                                { name: '人气', id: 'hits' },
                                { name: '评分', id: 'score' },
                            ],
                        },
                    ]
                    break
                case '2':
                    filter = [
                        {
                            name: '分類',
                            list: [
                                { name: '全部', id: '' },
                                { name: '古装', id: '古装' },
                                { name: '战争', id: '战争' },
                                { name: '青春偶像', id: '青春偶像' },
                                { name: '喜剧', id: '喜剧' },
                                { name: '家庭', id: '家庭' },
                                { name: '犯罪', id: '犯罪' },
                                { name: '动作', id: '动作' },
                                { name: '奇幻', id: '奇幻' },
                                { name: '剧情', id: '剧情' },
                                { name: '历史', id: '历史' },
                                { name: '经典', id: '经典' },
                                { name: '乡村', id: '乡村' },
                                { name: '情景', id: '情景' },
                                { name: '商战', id: '商战' },
                                { name: '网剧', id: '网剧' },
                                { name: '其他', id: '其他' },
                            ],
                        },
                        {
                            name: '年份',
                            list: [
                                { name: '全部', id: '' },
                                { name: '2024', id: '2024' },
                                { name: '2023', id: '2023' },
                                { name: '2022', id: '2022' },
                                { name: '2021', id: '2021' },
                                { name: '2020', id: '2020' },
                                { name: '2019', id: '2019' },
                                { name: '2018', id: '2018' },
                                { name: '2017', id: '2017' },
                                { name: '2016', id: '2016' },
                                { name: '2015', id: '2015' },
                                { name: '2014', id: '2014' },
                                { name: '2013', id: '2013' },
                                { name: '2012', id: '2012' },
                                { name: '2011', id: '2011' },
                                { name: '2010', id: '2010' },
                                { name: '2009', id: '2009' },
                                { name: '2008', id: '2008' },
                                { name: '2007', id: '2007' },
                                { name: '2006', id: '2006' },
                                { name: '2005', id: '2005' },
                                { name: '2004', id: '2004' },
                                { name: '2003', id: '2003' },
                                { name: '2002', id: '2002' },
                                { name: '2001', id: '2001' },
                                { name: '2000', id: '2000' },
                            ],
                        },
                        {
                            name: '排序',
                            list: [
                                { name: '最新', id: 'time' },
                                { name: '人气', id: 'hits' },
                                { name: '评分', id: 'score' },
                            ],
                        },
                    ]
                    break
                case '3':
                    filter = [
                        {
                            name: '分類',
                            list: [
                                { name: '全部', id: '' },
                                { name: '喜剧', id: '喜剧' },
                                { name: '爱情', id: '爱情' },
                                { name: '恐怖', id: '恐怖' },
                                { name: '动作', id: '动作' },
                                { name: '科幻', id: '科幻' },
                                { name: '剧情', id: '剧情' },
                                { name: '战争', id: '战争' },
                                { name: '警匪', id: '警匪' },
                                { name: '犯罪', id: '犯罪' },
                                { name: '动画', id: '动画' },
                                { name: '奇幻', id: '奇幻' },
                                { name: '武侠', id: '武侠' },
                                { name: '冒险', id: '冒险' },
                                { name: '枪战', id: '枪战' },
                                { name: '恐怖', id: '恐怖' },
                                { name: '悬疑', id: '悬疑' },
                                { name: '惊悚', id: '惊悚' },
                                { name: '经典', id: '经典' },
                                { name: '青春', id: '青春' },
                                { name: '文艺', id: '文艺' },
                                { name: '微电影', id: '微电影' },
                                { name: '古装', id: '古装' },
                                { name: '历史', id: '历史' },
                                { name: '运动', id: '运动' },
                                { name: '农村', id: '农村' },
                                { name: '儿童', id: '儿童' },
                                { name: '网络电影', id: '网络电影' },
                            ],
                        },
                        {
                            name: '年份',
                            list: [
                                { name: '全部', id: '' },
                                { name: '2024', id: '2024' },
                                { name: '2023', id: '2023' },
                                { name: '2022', id: '2022' },
                                { name: '2021', id: '2021' },
                                { name: '2020', id: '2020' },
                                { name: '2019', id: '2019' },
                                { name: '2018', id: '2018' },
                                { name: '2017', id: '2017' },
                                { name: '2016', id: '2016' },
                                { name: '2015', id: '2015' },
                                { name: '2014', id: '2014' },
                                { name: '2013', id: '2013' },
                                { name: '2012', id: '2012' },
                                { name: '2011', id: '2011' },
                                { name: '2010', id: '2010' },
                                { name: '2009', id: '2009' },
                                { name: '2008', id: '2008' },
                                { name: '2007', id: '2007' },
                                { name: '2006', id: '2006' },
                                { name: '2005', id: '2005' },
                                { name: '2004', id: '2004' },
                                { name: '2003', id: '2003' },
                                { name: '2002', id: '2002' },
                                { name: '2001', id: '2001' },
                                { name: '2000', id: '2000' },
                            ],
                        },
                        {
                            name: '排序',
                            list: [
                                { name: '最新', id: 'time' },
                                { name: '人气', id: 'hits' },
                                { name: '评分', id: 'score' },
                            ],
                        },
                    ]
                    break
            }
            backData.data.filter = filter
        } catch (error) {
            backData.error = '获取分类失败～ ' + error
        }
        return JSON.stringify(backData)
    }

    async getSubclassVideoList(args) {
        let backData = new RepVideoList()
        backData.data = []
        try {
            const [{ id: type }, { id: year }, { id: sort }] = args.filter
            const url =
                UZUtils.removeTrailingSlash(this.webSite) + `/xvs${args.mainClassId}xatxbt${sort}xct${type}xdtxetxftxgtxht${args.page}atbtct${year}.html`

            const pro = await req(url, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let videos = []
                let cards = $('.module-poster-item')
                cards.each((_, e) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = $(e).attr('href')
                    videoDet.vod_name = $(e).attr('title')
                    videoDet.vod_pic = $(e).find('.module-item-pic img').attr('data-original')
                    videoDet.vod_remarks = $(e).find('.module-item-note').text()
                    videos.push(videoDet)
                })
                backData.data = videos
            }
        } catch (error) {
            backData.error = '获取视频列表失败～ ' + error
        }

        return JSON.stringify(backData)
    }

    /**
     * 获取分类视频列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    // async getVideoList(args) {
    //     let listUrl = this.removeTrailingSlash(args.url) + '-' + args.page + '.html'
    //     let backData = new RepVideoList()
    //     try {
    //         let pro = await req(listUrl, { headers: this.headers })
    //         backData.error = pro.error
    //         let proData = pro.data
    //         if (proData) {
    //             let document = parse(proData)
    //             let allVideo = document.querySelectorAll('ul.myui-vodlist li')
    //             let videos = []
    //             for (let index = 0; index < allVideo.length; index++) {
    //                 const element = allVideo[index]
    //                 let vodUrl = element.querySelector('a.myui-vodlist__thumb')?.attributes['href'] ?? ''
    //                 let vodPic = element.querySelector('a.myui-vodlist__thumb')?.attributes['data-original'] ?? ''
    //                 let vodName = element.querySelector('a.myui-vodlist__thumb')?.attributes['title'] ?? ''
    //                 let vodDiJiJi = element.querySelector('span.pic-tag')?.text

    //                 vodUrl = this.combineUrl(vodUrl)

    //                 let videoDet = new VideoDetail()
    //                 videoDet.vod_id = vodUrl
    //                 videoDet.vod_pic = vodPic
    //                 videoDet.vod_name = vodName
    //                 videoDet.vod_remarks = vodDiJiJi.trim()
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
            let webUrl = this.webSite + args.url
            let pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let document = parse(proData)
                let vod_content = $('.module-info-introduction-content p').text() ?? ''
                let vod_pic = $('.module-item-pic img').attr('data-original') ?? ''
                let vod_name = $('h1.title').text() ?? ''
                let detList = $('.module-info-item')
                let vod_year = ''
                let vod_director = ''
                let vod_actor = ''
                let vod_area = ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                detList.each((_, e) => {
                    let text = $(e).text()
                    if (text.includes('分类')) {
                        type_name = text.replace('分类：', '').trim()
                    } else if (text.includes('导演')) {
                        vod_director = text.replace('导演：', '').trim()
                    } else if (text.includes('主演')) {
                        vod_actor = text.replace('主演：', '').trim()
                    } else if (text.includes('地区')) {
                        vod_area = text.replace('地区：', '').trim()
                    } else if (text.includes('语言')) {
                        vod_lang = text.replace('语言：', '').trim()
                    } else if (text.includes('年份')) {
                        vod_year = text.replace('年份：', '').trim()
                    }
                })

                let playlist = $('.module-play-list-link')
                let vod_play_url = ''
                playlist.each((_, e) => {
                    let name = $(e).find('span').text()
                    let href = $(e).attr('href')
                    vod_play_url += name
                    vod_play_url += '$'
                    vod_play_url += href
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
        let backData = {}
        let reqUrl = this.combineUrl(args.url)
        try {
            const pro = await req(reqUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data

            if (proData) {
                const player = proData.match(/r player_.*?=(.*?)</)[1]
                const json = JSON.parse(player)
                const playUrl = json.url

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
        let url = this.removeTrailingSlash(this.webSite) + `/xvse${args.searchWord}abcdefghig${args.page}klm.html`

        try {
            let resp = await req(url, { headers: this.headers })
            backData.error = resp.error
            let respData = resp.data

            if (respData) {
                const $ = cheerio.load(respData)
                let videos = []
                let cards = $('.module-card-item')
                cards.each((_, e) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = $(e).find('.module-card-item-poster').attr('href')
                    videoDet.vod_name = $(e).find('.module-card-item-title strong').text()
                    videoDet.vod_pic = $(e).find('.module-item-pic img').attr('data-original')
                    videoDet.vod_remarks = $(e).find('.module-item-note').text()
                    videos.push(videoDet)
                })
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }

        return JSON.stringify(backData)
    }

    ignoreClassName = ['首页', '泰剧', 'APP']

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
var hjkk20240624 = new hjkkClass()
