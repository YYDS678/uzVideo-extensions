// ignore
//@name:「直」 两个BT
//@version:2
//@webSite:https://www.bttwoo.com
//@remark:
//@order: C
import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'
// ignore



const appConfig = {
    _webSite: 'https://www.bttwoo.com',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    },
    ignoreClassName: ['首页', '热门下载', '公告求片'],

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
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    let webUrl = args.url
    // 如果通过首页获取分类的话，可以将对象内部的首页更新
    appConfig.webSite = removeTrailingSlash(webUrl)
    let backData = new RepVideoClassList()
    try {
        const pro = await req(webUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            let document = parse(proData)
            let allClass = document.querySelectorAll('.navlist a')
            let list = []
            for (let index = 0; index < allClass.length; index++) {
                const element = allClass[index]
                let isIgnore = isIgnoreClassName(element.text)
                if (isIgnore) {
                    continue
                }
                let type_name = element.text
                let url = element.getAttribute('href') ?? ''

                url = combineUrl(url)

                if (url.length > 0 && type_name.length > 0) {
                    let videoClass = new VideoClass()
                    videoClass.type_id = url
                    videoClass.type_name = type_name.trim()
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
async function getVideoList(args) {
    let listUrl = removeTrailingSlash(args.url) + '/page/' + args.page
    let backData = new RepVideoList()
    try {
        let pro = await req(listUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            let document = parse(proData)
            let allVideo = document.querySelector('div.bt_img > ul').querySelectorAll('li')
            let videos = []
            for (let index = 0; index < allVideo.length; index++) {
                const element = allVideo[index]
                let vodUrl = element.querySelector('.dytit a')?.attributes['href'] ?? ''
                let vodPic = element.querySelector('.thumb')?.attributes['data-original'] ?? ''
                let vodName = element.querySelector('.dytit')?.text ?? ''
                let vodDiJiJi = element.querySelector('.jidi span')?.text ?? ''

                let videoDet = {}
                videoDet.vod_id = vodUrl
                videoDet.vod_pic = vodPic
                videoDet.vod_name = vodName
                videoDet.vod_remarks = vodDiJiJi.trim()
                videos.push(videoDet)
            }
            backData.data = videos
        }
    } catch (e) {
        backData.error = '获取列表失败～' + e.message
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<RepVideoDetail>}
 */
async function getVideoDetail(args) {
    let backData = new RepVideoDetail()
    try {
        let webUrl = args.url
        let pro = await req(webUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            let document = parse(proData)
            let vod_content = document.querySelector('.yp_context')?.text ?? ''
            let vod_pic = document.querySelector('.dyimg img')?.getAttribute('src') ?? ''
            let vod_name = document.querySelector('.moviedteail_tt h1')?.text ?? ''
            let detList = document.querySelector('.moviedteail_list')?.querySelectorAll('li') ?? []
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
    } catch (e) {
        backData.error = '获取视频详情失败' + e.message
    }

    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {Promise<RepVideoPlayUrl>}
 */
async function getVideoPlayUrl(args) {
    let backData = new RepVideoPlayUrl()
    let url = args.url
    try {
        let html = await req(url, { headers: appConfig.headers })
        backData.error = html.error

        let data = html.data
        if (data) {
            let isPlayable = data.split('window.wp_nonce=')[1]
            if (isPlayable) {
                let text = isPlayable.split('eval')[0]
                let code = text.match(/var .*?=.*?"(.*?)"/)[1]
                let key = text.match(/var .*?=md5.enc.Utf8.parse\("(.*?)"/)[1]
                let iv = text.match(/var iv=.*?\((\d+)/)[1]

                text = aesCbcDecode(code, key, iv)
                let playurl = text.match(/url: "(.*?)"/)[1]

                backData.data = playurl
                // } else backData.error = '該片需兩個BT的VIP會員才能收看'
            } else backData.data = 'https://bit.ly/3BlS71b'
        } else backData.data = 'https://bit.ly/3BlS71b'
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
async function searchVideo(args) {
    let backData = new RepVideoList()
    let url = removeTrailingSlash(appConfig.webSite) + `/xssssearch?q=${args.searchWord}$f=_all&p=${args.page}`

    try {
        let pro = await req(url, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            let document = parse(proData)
            let allVideo = document.querySelector('div.bt_img > ul').querySelectorAll('li')
            let videos = []
            for (let index = 0; index < allVideo.length; index++) {
                const element = allVideo[index]
                let vodUrl = element.querySelector('.dytit a')?.attributes['href'] ?? ''
                let vodPic = element.querySelector('.thumb')?.attributes['data-original'] ?? ''
                let vodName = element.querySelector('.dytit')?.text ?? ''
                let vodDiJiJi = element.querySelector('.jidi span')?.text ?? ''

                let videoDet = {}
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



function aesCbcDecode(ciphertext, key, iv) {
    const encryptedHexStr = Crypto.enc.Base64.parse(ciphertext)
    const encryptedBase64Str = Crypto.enc.Base64.stringify(encryptedHexStr)

    const keyHex = Crypto.enc.Utf8.parse(key)
    const ivHex = Crypto.enc.Utf8.parse(iv)

    const decrypted = Crypto.AES.decrypt(encryptedBase64Str, keyHex, {
        iv: ivHex,
        mode: Crypto.mode.CBC,
        padding: Crypto.pad.Pkcs7,
    })

    const plaintext = decrypted.toString(Crypto.enc.Utf8)
    return plaintext
}

function combineUrl(url) {
    if (url === undefined) {
        return ''
    }
    if (url.indexOf(appConfig.webSite) !== -1) {
        return url
    }
    if (url.startsWith('/')) {
        return appConfig.webSite + url
    }
    return appConfig.webSite + '/' + url
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

function removeTrailingSlash(str) {
    if (str.endsWith('/')) {
        return str.slice(0, -1)
    }
    return str
}
