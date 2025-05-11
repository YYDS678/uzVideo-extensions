// ignore
//@name:「禁」 91jav
//@version:3
//@webSite:https://041.bndmpsjx.com
//@remark:
//@isAV:1
//@order: E
// ignore
const appConfig = {
    headers: {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    ignoreClassName: ['首页'],

    _webSite: 'https://041.bndmpsjx.com',
    /**
     * 网站主页，uz 调用每个函数前都会进行赋值操作
     * 如果不想被改变 请自定义一个变量
     */
    get webSite() {
        return this._webSite
    },
    set webSite(value) {
        this._webSite = value
    },

    _uzTag: '',
    /**
     * 扩展标识，初次加载时，uz 会自动赋值，请勿修改
     * 用于读取环境变量
     */
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
}

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
    let webUrl = args.url
    // 如果通过首页获取分类的话，可以将对象内部的首页更新
    appConfig.webSite = UZUtils.removeTrailingSlash(webUrl)
    let backData = new RepVideoClassList()
    try {
        const pro = await req(webUrl + '/index/getMvStyle/order/count', {
            headers: appConfig.headers,
        })
        backData.error = pro.error
        const proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let allClass = $('.pb-3.pb-e-lg-40 .col-6.col-sm-4.col-lg-3')
            let list = []
            allClass.each((index, e) => {
                const name = $(e).find('h4').text()
                const url = $(e).find('a').attr('href')
                const isIgnore = isIgnoreClassName(name)
                if (isIgnore) return
                if (url.length > 0 && name.length > 0) {
                    let videoClass = new VideoClass()
                    videoClass.type_id = url
                    videoClass.type_name = name
                    list.push(videoClass)
                }
            })

            backData.data = list
        }
    } catch (error) {
        backData.error = '获取分类失败～' + error.message
    }

    return JSON.stringify(backData)
}

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
    var backData = new RepVideoSubclassList()
    try {
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
    let backData = new RepVideoList()
    try {
        let listUrl =
            appConfig.webSite + args.url + `/sort/update/page/${args.page}`

        let pro = await req(listUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let list = $('.pb-3.pb-e-lg-40 .col-6.col-sm-4.col-lg-3')
            let videoPromises = list
                .map(async (_, element) => {
                    const href = $(element).find('.title a').attr('href')
                    const title = $(element).find('.title a').text()
                    const cover = $(element)
                        .find('.zximg')
                        .attr('z-image-loader-url')
                    const adLabel = $(element)
                        .find('.absolute-bottom-right .label')
                        .text()

                    if (adLabel === '广告') {
                        return null
                    }
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = href
                    videoDet.vod_pic = await getImg(cover)
                    videoDet.vod_name = title

                    return videoDet
                })
                .get()

            let videos = await Promise.all(videoPromises)
            videos = videos.filter((item) => item !== null)

            backData.data = videos
        }
    } catch (error) {
        backData.error = '获取列表失败～' + error.message
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类视频列表 或 筛选视频列表
 * @param {UZSubclassVideoListArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    try {
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoDetail())>}
 */
async function getVideoDetail(args) {
    let backData = new RepVideoDetail()
    try {
        let webUrl = UZUtils.removeTrailingSlash(appConfig.webSite) + args.url
        let pro = await req(webUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vod_content = ''
            let vod_pic = ''
            let vod_name = ''
            // let detList = document.querySelectorAll('ewave-content__detail p.data')
            let vod_year = ''
            let vod_director = ''
            let vod_actor = ''
            let vod_area = ''
            let vod_lang = ''
            let vod_douban_score = ''
            let type_name = ''

            let playUrl = proData.match(/var hlsUrl = "(.*?)";/)[1]
            let vod_play_url = `播放$${playUrl}`

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
 * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
    let backData = new RepVideoPlayUrl()
    try {
        backData.data = args.url
    } catch (error) {
        backData.error = error.message
    }
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
    let backData = new RepVideoList()
    try {
        let listUrl =
            appConfig.webSite +
            `/search/index/keyword/${args.searchWord}/page/${args.page}`

        let pro = await req(listUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let list = $('.pb-3.pb-e-lg-40 .col-6.col-sm-4.col-lg-3')
            let videoPromises = list
                .map(async (_, element) => {
                    const href = $(element).find('.title a').attr('href')
                    const title = $(element).find('.title a').text()
                    const cover = $(element)
                        .find('.zximg')
                        .attr('z-image-loader-url')
                    const adLabel = $(element)
                        .find('.absolute-bottom-right .label')
                        .text()

                    if (adLabel === '广告') {
                        return null
                    }

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = href
                    videoDet.vod_pic = await getImg(cover)
                    videoDet.vod_name = title

                    return videoDet
                })
                .get()

            let videos = await Promise.all(videoPromises)
            videos = videos.filter((item) => item !== null)

            backData.data = videos
        }
    } catch (error) {
        backData.error = '获取列表失败～' + error.message
    }
    return JSON.stringify(backData)
}

async function getImg(cover) {
    let imgData = await req(cover, { responseType: 'arraybuffer' })
    let base64Data = arrayBufferToBase64(imgData.data)
    let decryptData = aesDecrypt(base64Data)
    let base64img = 'data:image/png;base64,' + decryptData

    return base64img
}
function arrayBufferToBase64(arrayBuffer) {
    let uint8Array = new Uint8Array(arrayBuffer)
    let wordArray = Crypto.lib.WordArray.create(uint8Array)
    let base64String = Crypto.enc.Base64.stringify(wordArray)

    return base64String
}
function aesDecrypt(word) {
    let key = Crypto.enc.Utf8.parse('f5d965df75336270')
    let iv = Crypto.enc.Utf8.parse('97b60394abc2fbe1')
    let decrypted = Crypto.AES.decrypt(word, key, {
        iv: iv,
        mode: Crypto.mode.CBC,
        padding: Crypto.pad.NoPadding,
    })
    return Crypto.enc.Base64.stringify(decrypted)
}

function isIgnoreClassName(className) {
    for (let index = 0; index < appConfig.ignoreClassName.length; index++) {
        const element = appConfig.ignoreClassName[index]
        if (className.indexOf(element) !== -1) {
            return true
        }
    }
    return false
}
