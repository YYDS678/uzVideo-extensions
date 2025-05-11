// ignore
//@name:「直」 蛋蛋剧
//@version:2
//@webSite:https://www.dandanju.tv
//@remark:
//@order: C
import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'
// ignore


const appConfig = {
    _webSite: 'https://www.dandanju.tv',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    ignoreClassName: ['发布页面'],

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
            let allClass = document.querySelectorAll('.ewave-header__menu > ul a')
            let list = []
            for (let index = 0; index < allClass.length; index++) {
                const element = allClass[index]
                let isIgnore = isIgnoreClassName(element.text)
                if (isIgnore) {
                    continue
                }
                let type_name = element.text
                let url
                if (type_name === '首页') {
                    url = 'home'
                } else {
                    url = element.attributes['href']

                    url = combineUrl(url)
                    url = url.slice(0, -5)
                }

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
async function getVideoList(args) {
    if (args.url === 'home') return getHomeContent()
    let listUrl = removeTrailingSlash(args.url) + '-' + args.page + '.html'
    let backData = new RepVideoList()
    try {
        let pro = await req(listUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            let document = parse(proData)
            let allVideo = document.querySelectorAll('ul.ewave-vodlist li')
            let videos = []
            for (let index = 0; index < allVideo.length; index++) {
                const element = allVideo[index]
                let vodUrl = element.querySelector('a.thumb-link')?.attributes['href'] ?? ''
                let vodPic = element.querySelector('div.ewave-vodlist__thumb')?.attributes['data-original'] ?? ''
                let vodName = element.querySelector('div.ewave-vodlist__thumb')?.attributes['title'] ?? ''
                let vodDiJiJi = element.querySelector('.pic-text')?.text ?? ''
                let score = element.querySelector('.pic-tag').text ?? ''

                vodUrl = combineUrl(vodUrl)

                let videoDet = new VideoDetail()
                videoDet.vod_id = vodUrl
                videoDet.vod_pic = vodPic
                videoDet.vod_name = vodName.replace(/amp;/g, '')
                videoDet.vod_remarks = vodDiJiJi
                videoDet.vod_douban_score = score
                videos.push(videoDet)
            }
            backData.data = videos
        }
    } catch (error) {
        backData.error = '获取列表失败～' + error.message
    }
    return JSON.stringify(backData)
}

async function getHomeContent() {
    let listUrl = appConfig.webSite
    let backData = new RepVideoList()
    try {
        let pro = await req(listUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            let document = parse(proData)
            let allVideo = document.querySelectorAll('.tab-content li')
            let videos = []
            for (let index = 0; index < allVideo.length; index++) {
                const element = allVideo[index]
                let vodUrl = element.querySelector('a.thumb-link')?.attributes['href'] ?? ''
                let vodPic = element.querySelector('div.ewave-vodlist__thumb')?.attributes['data-original'] ?? ''
                let vodName = element.querySelector('div.ewave-vodlist__thumb')?.attributes['title'] ?? ''
                let vodDiJiJi = element.querySelector('.pic-text')?.text ?? ''
                let score = element.querySelector('.pic-tag').text ?? ''

                vodUrl = combineUrl(vodUrl)

                let videoDet = new VideoDetail()
                videoDet.vod_id = vodUrl
                videoDet.vod_pic = vodPic
                videoDet.vod_name = vodName.replace(/amp;/g, '')
                videoDet.vod_remarks = vodDiJiJi
                videoDet.vod_douban_score = score
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
async function getVideoDetail(args) {
    let backData = new RepVideoDetail()
    try {
        let webUrl = args.url
        let pro = await req(webUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let document = parse(proData)
            let vod_content = $('#desc p').html().split('<br>')[2].split('：')[1].replace('</b>', '').trim() || ''
            let vod_pic = document.querySelector('.ewave-content__thumb img').getAttribute('data-original') ?? ''
            let vod_name = document.querySelector('h1.title')?.text ?? ''
            let detList = document.querySelectorAll('.ewave-content__detail p.data')
            let vod_year = ''
            let vod_director = $('.ewave-content__detail p.data').eq(2).text().replace('导演：', '')
            let vod_actor = $('.ewave-content__detail p.data').eq(1).text().replace('主演：', '')
            let vod_area = ''
            let vod_lang = ''
            let vod_douban_score = ''
            let type_name = ''

            let newDetList = []
            detList.forEach((e) => {
                if (e.text.includes('/')) {
                    let temp = e.text.split('/')
                    newDetList = newDetList.concat(temp)
                } else newDetList.push(e.text)
            })

            // for (let index = 0; index < newDetList.length; index++) {
            //     const element = newDetList[index].trim()
            //     if (element.includes('年份')) {
            //         vod_year = element.replace('年份：', '')
            //     } else if (element.includes('导演')) {
            //         vod_director = element.replace('导演：', '')
            //     } else if (element.includes('主演')) {
            //         vod_actor = element.replace('主演：', '')
            //     } else if (element.includes('地区')) {
            //         vod_area = element.replace('地区：', '')
            //     } else if (element.includes('语言')) {
            //         vod_lang = element.replace('语言：', '')
            //     } else if (element.includes('类型')) {
            //         type_name = element.replace('类型：', '')
            //     } else if (element.includes('豆瓣')) {
            //         vod_douban_score = element.replace('豆瓣：', '')
            //     }
            // }

            let vod_play_from = []
            document.querySelectorAll('.ewave-pannel__head .playlist-slide ul li a').forEach((e) => {
                let from = e.text || ''
                // UZUtils.debugLog('from:' + from)
                vod_play_from.push(from)
            })

            let vod_play_url = []
            document.querySelectorAll('.tab-content > div').forEach((e) => {
                let eps = e.querySelectorAll('li')
                let playUrl = ''
                eps.forEach((e) => {
                    let ep = e.querySelector('a')
                    playUrl += ep.text
                    playUrl += '$'
                    playUrl += ep.getAttribute('href')
                    playUrl += '#'
                })
                // UZUtils.debugLog('playurl:' + playUrl)
                vod_play_url.push(playUrl)
            })
            // UZUtils.debugLog(vod_play_from)
            // UZUtils.debugLog(vod_play_url)

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
            detModel.vod_name = vod_name.replace(/amp;/g, '')
            detModel.vod_play_url = vod_play_url.join('$$$')
            detModel.vod_id = webUrl
            detModel.vod_play_from = vod_play_from.join('$$$')

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
async function getVideoPlayUrl(args) {
    let backData = new RepVideoPlayUrl()
    let reqUrl = combineUrl(args.url)
    // let reqUrl = 'https://www.dandanju.tv/player/68893-1-28.html'

    try {
        const pro = await req(reqUrl, { headers: appConfig.headers })
        backData.error = pro.error
        let proData = pro.data

        if (proData) {
            let obj = JSON.parse(proData.match(/r player_.*?=(.*?)</)[1])
            let url = obj.url
            let from = obj.from
            if (obj.encrypt === 1) {
                url = decodeURIComponent(url)
            } else if (obj.encrypt === 2) {
                url = decodeURIComponent(atob(url))
            }

            if (/m3u8|mp4/.test(url)) {
                backData.data = url
            } else {
                let MacPlayerConfig = {}
                let data = (await req(appConfig.webSite + '/static/js/playerconfig.js')).data.replace('var Mac', 'Mac')
                eval(data)
                let jx = MacPlayerConfig.player_list[from].parse
                if (jx === '') jx = MacPlayerConfig.parse
                if (jx.startsWith('/')) jx = appConfig.webSite + jx

                if (jx.includes('mgplayer')) {
                    let jxres = (await req('https://www.mgplayer.cc/parse/config.php?vid=' + url)).data
                    let first = jxres.data.urls[0].list[0].playlink
                    let parse = (await req('https://www.mgplayer.cc/parse/parse.php?vid=' + first, { headers: appConfig.headers })).data
                    backData.data = parse.data.url
                } else {
                    let jxres = (await req(jx + url, { headers: appConfig.headers })).data
                    if (jxres) {
                        let api = appConfig.webSite + '/webplayer/api.php'
                        let apiRes = (
                            await req(api, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'X-Request-With': 'XMLHttpRequest',
                                    'User-Agent': appConfig.headers['User-Agent'],
                                },
                                data: 'vid=' + decodeURIComponent(url),
                            })
                        ).data
                        // UZUtils.debugLog(_0x45893a(JSON.parse(apiRes).data.url))
                        backData.data = _0x45893a(JSON.parse(apiRes).data.url)
                    }
                    function _0x23e231() {
                        this._keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
                        this.encode = function (_0x53bdd1) {
                            var _0x4def44 = ''
                            var _0x256094, _0x2c8e63, _0x1870f9, _0x180168, _0x10912d, _0x334431, _0x133a8c
                            var _0x5a3b7e = 0
                            _0x53bdd1 = this._utf8_encode(_0x53bdd1)
                            while (_0x5a3b7e < _0x53bdd1.length) {
                                _0x256094 = _0x53bdd1.charCodeAt(_0x5a3b7e++)
                                _0x2c8e63 = _0x53bdd1.charCodeAt(_0x5a3b7e++)
                                _0x1870f9 = _0x53bdd1.charCodeAt(_0x5a3b7e++)
                                _0x180168 = _0x256094 >> 2
                                _0x10912d = ((_0x256094 & 3) << 4) | (_0x2c8e63 >> 4)
                                _0x334431 = ((_0x2c8e63 & 15) << 2) | (_0x1870f9 >> 6)
                                _0x133a8c = _0x1870f9 & 63
                                if (isNaN(_0x2c8e63)) {
                                    _0x334431 = _0x133a8c = 64
                                } else {
                                    if (isNaN(_0x1870f9)) {
                                        _0x133a8c = 64
                                    }
                                }
                                _0x4def44 =
                                    _0x4def44 +
                                    this._keyStr.charAt(_0x180168) +
                                    this._keyStr.charAt(_0x10912d) +
                                    this._keyStr.charAt(_0x334431) +
                                    this._keyStr.charAt(_0x133a8c)
                            }
                            return _0x4def44
                        }
                        this.decode = function (_0x10ac7a) {
                            var _0x11a4e4 = ''
                            var _0x238b4f, _0x1cdc90, _0x33dfd0
                            var _0x17a111, _0x23e04b, _0x5ae908, _0x1bbdcf
                            var _0x1b3294 = 0
                            _0x10ac7a = _0x10ac7a.replace(/[^A-Za-z0-9\+\/\=]/g, '')
                            while (_0x1b3294 < _0x10ac7a.length) {
                                _0x17a111 = this._keyStr.indexOf(_0x10ac7a.charAt(_0x1b3294++))
                                _0x23e04b = this._keyStr.indexOf(_0x10ac7a.charAt(_0x1b3294++))
                                _0x5ae908 = this._keyStr.indexOf(_0x10ac7a.charAt(_0x1b3294++))
                                _0x1bbdcf = this._keyStr.indexOf(_0x10ac7a.charAt(_0x1b3294++))
                                _0x238b4f = (_0x17a111 << 2) | (_0x23e04b >> 4)
                                _0x1cdc90 = ((_0x23e04b & 15) << 4) | (_0x5ae908 >> 2)
                                _0x33dfd0 = ((_0x5ae908 & 3) << 6) | _0x1bbdcf
                                _0x11a4e4 = _0x11a4e4 + String.fromCharCode(_0x238b4f)
                                _0x5ae908 != 64 && (_0x11a4e4 = _0x11a4e4 + String.fromCharCode(_0x1cdc90))
                                _0x1bbdcf != 64 && (_0x11a4e4 = _0x11a4e4 + String.fromCharCode(_0x33dfd0))
                            }
                            _0x11a4e4 = this._utf8_decode(_0x11a4e4)
                            return _0x11a4e4
                        }
                        this._utf8_encode = function (_0x189009) {
                            _0x189009 = _0x189009.replace(/\r\n/g, '\n')
                            var _0x5ae804 = ''
                            for (var _0x576a5a = 0; _0x576a5a < _0x189009.length; _0x576a5a++) {
                                var _0x39e19c = _0x189009.charCodeAt(_0x576a5a)
                                if (_0x39e19c < 128) _0x5ae804 += String.fromCharCode(_0x39e19c)
                                else {
                                    if (_0x39e19c > 127 && _0x39e19c < 2048)
                                        (_0x5ae804 += String.fromCharCode((_0x39e19c >> 6) | 192)),
                                            (_0x5ae804 += String.fromCharCode((_0x39e19c & 63) | 128))
                                    else {
                                        _0x5ae804 += String.fromCharCode((_0x39e19c >> 12) | 224)
                                        _0x5ae804 += String.fromCharCode(((_0x39e19c >> 6) & 63) | 128)
                                        _0x5ae804 += String.fromCharCode((_0x39e19c & 63) | 128)
                                    }
                                }
                            }
                            return _0x5ae804
                        }
                        this._utf8_decode = function (_0x5c4c02) {
                            var _0x5b1fc3 = ''
                            var _0x2fc8f9 = 0
                            var _0x8d257d = 0
                            var c2 = 0
                            while (_0x2fc8f9 < _0x5c4c02.length) {
                                _0x8d257d = _0x5c4c02.charCodeAt(_0x2fc8f9)
                                if (_0x8d257d < 128) (_0x5b1fc3 += String.fromCharCode(_0x8d257d)), _0x2fc8f9++
                                else
                                    _0x8d257d > 191 && _0x8d257d < 224
                                        ? ((c2 = _0x5c4c02.charCodeAt(_0x2fc8f9 + 1)),
                                            (_0x5b1fc3 += String.fromCharCode(((_0x8d257d & 31) << 6) | (c2 & 63))),
                                            (_0x2fc8f9 += 2))
                                        : ((c2 = _0x5c4c02.charCodeAt(_0x2fc8f9 + 1)),
                                            (c3 = _0x5c4c02.charCodeAt(_0x2fc8f9 + 2)),
                                            (_0x5b1fc3 += String.fromCharCode(((_0x8d257d & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))),
                                            (_0x2fc8f9 += 3))
                            }
                            return _0x5b1fc3
                        }
                    }
                    function _0x45893a(_0x1f9239) {
                        var _0x5a670a = new _0x23e231()
                        var _0x1f9239 = _0x57bd6f(_0x1f9239)
                        var _0x477fb0 = _0x1f9239.split('/')
                        var _0x32fed5 = ''
                        for (var _0x5bd392 = 0; _0x5bd392 < _0x477fb0.length; _0x5bd392++) {
                            var _0x8660f2 = _0x5bd392 + 1 == _0x477fb0.length ? '' : '/'
                            if (_0x5bd392 == 0 || _0x5bd392 == 1) {
                            } else _0x32fed5 += _0x477fb0[_0x5bd392] + _0x8660f2
                        }
                        var _0xb9d4c2 = _0x5a670a.decode(_0x32fed5)
                        var _0x5efa1c = _0x48763b(JSON.parse(_0x5a670a.decode(_0x477fb0[1])), JSON.parse(_0x5a670a.decode(_0x477fb0[0])), _0xb9d4c2)
                        return _0x5efa1c
                    }
                    function _0x57bd6f(_0x5cfc18) {
                        var _0x37ada0 = new _0x23e231()
                        // key = md5('test')
                        let key = Crypto.MD5('test').toString()
                        _0x5cfc18 = _0x37ada0.decode(_0x5cfc18)
                        let len = key.length
                        let code = ''
                        for (let i = 0; i < _0x5cfc18.length; i++) {
                            let k = i % len
                            code += String.fromCharCode(_0x5cfc18.charCodeAt(i) ^ key.charCodeAt(k))
                        }
                        return _0x37ada0.decode(code)
                    }
                    function _0x48763b(_0xb0fa99, _0x40e89b, _0x4e6c62) {
                        var _0x2eb71d = '',
                            _0x1748c3 = _0xb0fa99,
                            _0x393e8 = _0x40e89b,
                            _0x14c36e = _0x4e6c62.split('')
                        for (var _0xb8969c = 0; _0xb8969c < _0x14c36e.length; _0xb8969c++) {
                            var _0xb2d1d4 = _0x14c36e[_0xb8969c],
                                _0x165ee7 = /^[a-zA-Z]+$/.test(_0xb2d1d4)
                            if (_0x165ee7 && _0x5628fd(_0x393e8, _0xb2d1d4)) {
                                _0x2eb71d += _0x393e8[_0x1748c3.indexOf(_0xb2d1d4)]
                            } else _0x2eb71d += _0xb2d1d4
                        }
                        return _0x2eb71d
                    }

                    function _0x5628fd(_0x39cc58, _0x574adf) {
                        for (var _0x26d409 = 0; _0x26d409 < _0x39cc58.length; _0x26d409++) {
                            if (_0x574adf === _0x39cc58[_0x26d409]) {
                                return true
                            }
                        }
                        return false
                    }
                }
            }
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
async function searchVideo(args) {
    let backData = new RepVideoList()
    let ocrApi = 'https://api.nn.ci/ocr/b64/json'
    let url = `${appConfig.webSite}/search/-------------.html`
    let validate = `${appConfig.webSite}/index.php/verify/index.html?`
    let checkUrl = `${appConfig.webSite}/index.php/ajax/verify_check?type=search&verify=`
    try {
        function arrayBufferToBase64(arrayBuffer) {
            let uint8Array = new Uint8Array(arrayBuffer)
            let wordArray = Crypto.lib.WordArray.create(uint8Array)
            let base64String = Crypto.enc.Base64.stringify(wordArray)

            return base64String
        }
        function sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms))
        }
        // get cookie
        let cookieRequest = await req(url, {
            method: 'POST',
            headers: {
                'User-Agent': appConfig.headers['User-Agent'],
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: `wd=${encodeURIComponent(args.searchWord)}`,
        })
        let cookie = cookieRequest.headers['set-cookie'][0].match(/(PHPSESSID=.*;)/)[0]
        // get img
        let imgRes = await req(validate, {
            headers: {
                'User-Agent': appConfig.headers['User-Agent'],
                Cookie: cookie,
            },
            responseType: 'arraybuffer',
        })
        let b64 = arrayBufferToBase64(imgRes.data)
        // ocr
        let ocrRes = await req(ocrApi, {
            method: 'POST',
            headers: appConfig.headers,
            data: b64,
        })
        let vd = JSON.parse(ocrRes.data).result
        // check
        let checkRes = await req(checkUrl + vd, {
            headers: {
                'User-Agent': appConfig.headers['User-Agent'],
                Cookie: cookie,
            },
        })
        if (checkRes.data.msg === 'ok') {
            // 等兩秒再搜，太快會觸發風控
            await sleep(2000)
            let searchRequest = await req(url, {
                method: 'POST',
                headers: {
                    'User-Agent': appConfig.headers['User-Agent'],
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Cookie: cookie,
                },
                data: `wd=${encodeURIComponent(args.searchWord)}`,
            })
            let $ = cheerio.load(searchRequest.data)
            let allVideo = $('.ewave-vodlist__media > li')
            let videos = []
            allVideo.each((_, index) => {
                let videoDet = new VideoDetail()
                videoDet.vod_id = appConfig.webSite + $(index).find('a.ewave-vodlist__thumb').attr('href')
                videoDet.vod_pic = $(index).find('a.ewave-vodlist__thumb').attr('data-original')
                videoDet.vod_name = $(index).find('h3.title a').text()
                videoDet.vod_remarks = $(index).find('span.pic-text.text-right').text()
                videos.push(videoDet)
            })
            backData.data = videos
        }
    } catch (e) {
        backData.error = e
    }
    return JSON.stringify(backData)
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
