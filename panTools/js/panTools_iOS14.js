//@name:夸克|123|189|UC|解析 网盘解析工具
//@version:1
//@remark:iOS15 以下版本使用
//@env:UCCookie##用于播放UC网盘视频&&UC_UT##播放视频自动获取，不可用时点击删除重新获取 cookie ，再重启app&&夸克Cookie##用于播放Quark网盘视频&&阿里Token##用于播放阿里网盘视频&&转存文件夹名称##在各网盘转存文件时使用的文件夹名称&&123网盘账号##用于播放123网盘视频&&123网盘密码##用于播放123网盘视频&&天翼网盘账号##用于播放天翼网盘视频&&天翼网盘密码##用于播放天翼网盘视频&&采集解析地址##内置两个，失效不要反馈。格式：名称1@地址1;名称2@地址2
// ignore
import {
    FilterLabel,
    FilterTitle,
    VideoClass,
    VideoSubclass,
    VideoDetail,
    RepVideoClassList,
    RepVideoSubclassList,
    RepVideoList,
    RepVideoDetail,
    RepVideoPlayUrl,
    UZArgs,
    UZSubclassVideoListArgs,
} from '../../core/core/uzVideo.js'

import {
    UZUtils,
    ProData,
    ReqResponseType,
    ReqAddressType,
    req,
    getEnv,
    setEnv,
    goToVerify,
    openWebToBindEnv,
    toast,
    kIsDesktop,
    kIsAndroid,
    kIsIOS,
    kIsWindows,
    kIsMacOS,
    kIsTV,
    kLocale,
    kAppVersion,
    formatBackData,
} from '../../core/core/uzUtils.js'

import { cheerio, Crypto, Encrypt, JSONbig } from '../../core/core/uz3lib.js'
// ignore

/**
 * 网盘类型
 * 环境变量 key 为 PanType.xx + "Cookie",请在 json 文件中添加
 */
var PanType = {
    /**
     * 夸克
     **/
    Quark: '夸克',

    /**
     * UC
     **/
    UC: 'UC',

    /**
     * 阿里
     **/
    Ali: '阿里',

    /**
     * 123网盘
     **/
    Pan123: '123网盘',

    /**
     * 天翼网盘
     */
    Pan189: '天翼网盘',

    /**
     * 解析
     */
    JieXi: '采集解析',
}

/**
 * 播放信息
 **/
function PanPlayInfo(url, error, playHeaders, urls) {
    /**
     * 播放地址，优先取 urls, 如果 urls 为空，取该值
     * @type {string}
     */
    this.url = url || ''
    this.error = error || ''
    this.playHeaders = playHeaders || {}

    /**
     * 多个播放地址，优先取该值 如果为空取 url
     * @type {{name:string,url:string,headers:object,priority:number,isSniffer:boolean,snifferUA:string, timeOut:number, retry:number}[]}
     * @property {string} name 名称 4k 高清 之类
     * @property {string} url 播放地址
     * @property {object} headers 播放头
     * @property {number} priority 优先级
     * @property {boolean} isSniffer 是否是嗅探 默认 false, app v1.6.55 及以上版本可用
     * @property {string} snifferUA 嗅探UA, app v1.6.55 及以上版本可用
     * @property {number} timeOut 单次嗅探超时时间 单位秒 默认 12s, app v1.6.55 及以上版本可用
     * @property {number} retry 嗅探重试次数 默认 1 次 ,app v1.6.55 及以上版本可用
     */
    this.urls = urls || []
}

/**
 * 网盘视频项
 */
function PanVideoItem() {
    /**
     * 展示名称 例如 老友记
     */
    this.name = ''

    /**
     * 备注信息，如 文件大小
     */
    this.remark = ''

    /**
     * 分组名称 例如 原画 、 普画  非必须
     */
    this.fromName = ''

    /**
     * 网盘类型 用于获取播放信息时
     * @type {PanType}
     **/
    this.panType = PanType.UC

    /**
     * 关键数据 用于获取播放信息时
     * @type {Object}
     */
    this.data
}

/**
 * 网盘播放列表
 */
function PanListDetail() {
    /**
     * @type {PanVideoItem[]}
     * 视频列表
     */
    this.videos = []
    /**
     * 最外层文件夹名称
     */
    this.fileName = ''
    this.error = ''
}

/**
 * 网盘挂载 类型
 */
function PanMount(name, panType, isLogin) {
    /**
     * 网盘展示名称
     */
    this.name = name || ''

    /**
     * 网盘类型
     * @type {PanType}
     */
    this.panType = panType || PanType.UC

    /**
     * 是否已登录
     * @type {boolean}
     */
    this.isLogin = isLogin || false
}

/**
 * 网盘数据类型，目前只支持视频和目录
 * @type {{Video: string, Dir: string}}
 **/
var PanDataType = {
    /**
     * 未知，其他
     */
    Unknown: 0,

    /**
     * 视频
     */
    Video: 10,

    /**
     * 目录
     */
    Dir: 20,
}

/**
 * 网盘挂载列表
 */
function PanMountListData(
    name,
    panType,
    dataType,
    data,
    remark
) {
    /**
     * 列表展示名称
     */
    this.name = name || ''
    /**
     * 网盘类型
     * @type {PanDataType}
     */
    this.panType = panType || PanType.UC

    /**
     * 备注信息，如 文件大小
     */
    this.remark = ''
    /**
     * 数据类型
     * @type {PanDataType}
     */
    this.dataType = dataType || PanDataType.Dir
    /**
     * 关键数据
     * @type {Object}
     */
    this.data = data || {}
}

//MARK: - 夸克 UC 相关实现
// 抄自 https://github.com/jadehh/TVSpider

function QuarkClient() {}
QuarkClient.apiUrl = 'https://drive-pc.quark.cn/1/clouddrive/'
QuarkClient.pr = 'pr=ucpro&fr=pc'
QuarkClient.httpHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
    Referer: 'https://pan.quark.cn/',
    'Content-Type': 'application/json',
}

var kUC_UTKeyWord = 'kUC_UTKeyWord'
function UCClient() {}
UCClient.apiUrl = 'https://pc-api.uc.cn/1/clouddrive/'

UCClient.pr = 'pr=UCBrowser&fr=pc&sys=darwin&ve=1.8.6&ut=' + kUC_UTKeyWord
UCClient.httpHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
    Referer: 'https://drive.uc.cn',
    'Content-Type': 'application/json',
}

function QuarkUC(isQuark) {
    this.isQuark = isQuark || false
    this.cookie = ''
    this.shareTokenCache = {}
    this.saveFileIdCaches = {}
    this.saveDirId = null
    this.saveDirName = 'uz影视'
    this.isVip = false
    this.updateCookie = function () {}
}
QuarkUC.prototype.uzTag = ''
QuarkUC.prototype.ut = ''
Object.defineProperty(QuarkUC.prototype, 'panName', {
    get: function () {
        if (this.isQuark) {
            return PanType.Quark
        } else {
            return PanType.UC
        }
    },
})
Object.defineProperty(QuarkUC.prototype, 'apiUrl', {
    get: function () {
        if (this.isQuark) {
            return QuarkClient.apiUrl
        } else {
            return UCClient.apiUrl
        }
    },
})

Object.defineProperty(QuarkUC.prototype, 'pr', {
    get: function () {
        if (this.isQuark) {
            return QuarkClient.pr
        } else {
            return UCClient.pr
        }
    },
})
Object.defineProperty(QuarkUC.prototype, 'headers', {
    get: function () {
        var headers = this.isQuark
            ? QuarkClient.httpHeaders
            : UCClient.httpHeaders
        headers['Cookie'] = this.cookie
        return headers
    },
})
Object.defineProperty(QuarkUC.prototype, 'playHeaders', {
    get: function () {
        var cookie = this.cookie
        if (this.isQuark == false) {
            var list = this.cookie.split(';')
            var newList = []
            for (var i = 0; i < list.length; i++) {
                var item = list[i]
                if (
                    item.includes('_UP_A4A_11_') ||
                    item.includes('tfstk') ||
                    item.includes('__uid') ||
                    item.includes('__pus') ||
                    item.includes('__kp') ||
                    item.includes('__puus')
                ) {
                    newList.push(item)
                }
            }

            cookie = newList.join(';')
        }

        return {
            cookie: cookie,
            Referer: this.isQuark
                ? 'https://pan.quark.cn/'
                : 'https://drive.uc.cn/',
            'User-Agent': this.isQuark
                ? ''
                : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/1.8.6 Chrome/100.0.4896.160 Electron/18.3.5.16-b62cf9c50d Safari/537.36 Channel/ucpan_other_ch',
        }
    },
})
QuarkUC.prototype.fileName = ''
/**
 * 获取文件列表
 * @param {string} shareUrl
 * @returns {Promise<PanListDetail>}
 **/
QuarkUC.prototype.getFilesByShareUrl = function (shareUrl) {
    var self = this
    return new Promise(function (resolve) {
        var data = new PanListDetail()
        self.fileName = ''
        var shareData = self.getShareData(shareUrl)
        if (shareData == null) {
            data.error = ''
            resolve(data)
            return
        }

        self.getShareToken(shareData).then(function () {
            var videos = []
            var subtitles = []
            if (!self.shareTokenCache.hasOwnProperty(shareData.shareId)) {
                data.error = ''
                resolve(data)
                return
            }

            self.listFile(
                shareData,
                videos,
                subtitles,
                shareData.shareId,
                shareData.folderId
            ).then(function () {
                // if (subtitles.length > 0) {
                //     for (var i = 0; i < videos.length; i++) {
                //         var item = videos[i]
                //         var matchSubtitle = self.findBestLCS(item, subtitles)
                //         if (matchSubtitle.bestMatch != null) {
                //             item.subtitle = matchSubtitle.bestMatch.target
                //         }
                //     }
                // }
                for (var index = 0; index < videos.length; index++) {
                    var item = videos[index]
                    // 复制 item
                    var element = JSON.parse(JSON.stringify(item))
                    var size = (element.size != null ? element.size : 0) / 1024 / 1024
                    var unit = 'MB'
                    if (size >= 1000) {
                        size = size / 1024
                        unit = 'GB'
                    }
                    size = size.toFixed(1)
                    var remark = '[' + size + unit + ']'
                    var videoItem = new PanVideoItem()
                    videoItem.data = element
                    videoItem.panType = self.panName
                    videoItem.name = element.name
                    if (kAppVersion > 1650) {
                        videoItem.remark = remark
                    } else {
                        videoItem.name = element.name + ' ' + remark
                    }
                    data.videos.push(videoItem)
                }
                data.fileName = self.fileName
                resolve(data)
            })
        })
    })
}

/**
 * 获取播放信息
 * @param {{flag:string,shareId:string,shareToken:string,fileId:string,shareFileToken:string }} arg
 * @returns {Promise<PanPlayInfo>}
 */
QuarkUC.prototype.getPlayUrl = function (arg) {
    var self = this
    return new Promise(function (resolve) {
        if (self.cookie.length === 0) {
            var info = new PanPlayInfo()
            info.error =
                '请在 设置 -> 数据管理 -> 环境变量 中为' +
                self.panName +
                'Cookie 添加值'
            resolve(info)
            return
        }

        var playData = new PanPlayInfo()

        try {
            var shareId = arg.shareId
            var shareToken = arg.shareToken
            var fileId = arg.fileId
            var shareFileToken = arg.shareFileToken

            self.save({
                shareId: shareId,
                stoken: shareToken,
                fileId: fileId,
                fileToken: shareFileToken,
                clean: true,
            }).then(function (saveFileId) {
                if (saveFileId == null) {
                    var info = new PanPlayInfo()
                    info.error = '转存失败，可能空间不足 或 cookie 错误～'
                    resolve(info)
                    return
                }
                self.saveFileIdCaches[fileId] = saveFileId

                self.getVideoPlayUrl({ fileId: fileId }).then(function (urls) {
                    playData.urls = urls
                    playData.urls.sort(function (a, b) {
                        return b.priority - a.priority
                    })
                    playData.url = playData.urls[0].url
                    playData.playHeaders = self.playHeaders
                    self.clearSaveDir()
                    resolve(playData)
                })
            })
        } catch (error) {
            playData.error = error.toString()
            self.clearSaveDir()
            resolve(playData)
        }
    })
}

QuarkUC.prototype.getVideoPlayUrl = function (param) {
    var self = this
    return new Promise(function (resolve) {
        var fileId = param.fileId
        var isMount = param.isMount
        self.getDownload({
            fileId: fileId,
            isMount: isMount,
        }).then(function (rawUrls) {
            self.getLiveTranscoding({
                fileId: fileId,
                isMount: isMount,
            }).then(function (transcodingUrls) {
                if (transcodingUrls.length < 2 && rawUrls.length > 0) {
                    rawUrls[0].priority = 9999
                }
                resolve([].concat(rawUrls, transcodingUrls))
            })
        })
    })
}

QuarkUC.prototype.api = function (url, data, retry, method) {
    var self = this
    return new Promise(function (resolve) {
        retry = retry || 3
        var leftRetry = retry
        method = method || 'post'

        var process = function () {
            if (url.includes(kUC_UTKeyWord)) {
                if (self.ut.length < 1) {
                    getEnv(self.uzTag, 'UC_UT').then(function (ut) {
                        if (ut.length < 1) {
                            req(UCClient.apiUrl + 'file', {
                                responseType: ReqResponseType.plain,
                            }).then(function (data) {
                                if (data.data && data.data.length > 0) {
                                    self.ut = data.data
                                    setEnv(self.uzTag, 'UC_UT', self.ut)
                                }
                                next()
                            })
                        } else {
                            self.ut = ut
                            next()
                        }
                    })
                } else {
                    next()
                }
            } else {
                next()
            }
        }

        var next = function () {
            if (url.includes(kUC_UTKeyWord) && self.ut.length > 0) {
                url = url.replace(kUC_UTKeyWord, self.ut)
            }
            if (leftRetry > 0) {
                req(self.apiUrl + url, {
                    method: method,
                    headers: self.headers,
                    data: JSON.stringify(data),
                })
                    .then(function (response) {
                        if (response.code === 401) {
                            self.cookie = ''
                            resolve({})
                            return
                        }
                        var resp = response.data
                        if (response.headers['set-cookie']) {
                            var puus = [response.headers['set-cookie']]
                                .join(';;;')
                                .match(/__puus=([^;]+)/)
                            if (puus) {
                                if (
                                    self.cookie.match(/__puus=([^;]+)/)[1] !=
                                    puus[1]
                                ) {
                                    self.cookie = self.cookie.replace(
                                        /__puus=[^;]+/,
                                        '__puus=' + puus[1]
                                    )
                                    self.updateCookie()
                                }
                            }
                        }
                        resolve(resp)
                    })
                    .catch(function (e) {
                        leftRetry--
                        setTimeout(process, 1000)
                    })
            } else {
                resolve({})
            }
        }

        process()
    })
}

/**
 * 根据链接获取分享ID和文件夹ID
 * @param {string} url
 * @returns {null|{shareId: string, folderId: string}}
 **/
QuarkUC.prototype.getShareData = function (url) {
    var regex = /https:\/\/pan\.quark\.cn\/s\/([^\/|#]+)/
    if (!this.isQuark) {
        regex = /https:\/\/drive\.uc\.cn\/s\/([^\/|#]+)/
    }
    var matches = regex.exec(url)
    if (matches != null) {
        return { shareId: matches[1], folderId: '0' }
    }
    return null
}
/**
 * 获取分享token
 * @param {{shareId: string, sharePwd: string}} shareData
 **/
QuarkUC.prototype.getShareToken = function (shareData) {
    var self = this
    return new Promise(function (resolve) {
        if (!self.shareTokenCache.hasOwnProperty(shareData.shareId)) {
            delete self.shareTokenCache[shareData.shareId]
            self.api('share/sharepage/token?' + self.pr, {
                pwd_id: shareData.shareId,
                passcode: shareData.sharePwd || '',
            }).then(function (shareToken) {
                if (self.fileName.length < 1 && shareToken && shareToken.data) {
                    self.fileName = shareToken.data.title
                }
                if (shareToken && shareToken.data && shareToken.data.stoken) {
                    self.shareTokenCache[shareData.shareId] = shareToken.data
                }
                resolve()
            })
        } else {
            resolve()
        }
    })
}
QuarkUC.prototype.getVip = function () {
    var self = this
    return new Promise(function (resolve) {
        if (self.cookie == '') {
            self.isVip = false
            resolve()
            return
        }
        self.api(
            'member?' +
                self.pr +
                '&uc_param_str=&fetch_subscribe=true&_ch=home&fetch_identity=true',
            null,
            3,
            'get'
        ).then(function (listData) {
            self.isVip =
                listData.data &&
                (listData.data.member_type === 'EXP_SVIP' ||
                    listData.data.member_type === 'SUPER_VIP')
            resolve()
        })
    })
}

QuarkUC.prototype.listFile = function (
    shareData,
    videos,
    subtitles,
    shareId,
    folderId,
    page
) {
    var self = this
    return new Promise(function (resolve) {
        if (page == null) page = 1
        var pageSize = 100
        self.api(
            'share/sharepage/detail?' +
                self.pr +
                '&pwd_id=' +
                shareId +
                '&stoken=' +
                encodeURIComponent(self.shareTokenCache[shareId].stoken) +
                '&pdir_fid=' +
                folderId +
                '&force=0&_page=' +
                page +
                '&_size=' +
                pageSize +
                '&_sort=file_type:asc,file_name:asc',
            null,
            3,
            'get'
        ).then(function (listData) {
            if (listData.data == null) {
                resolve([])
                return
            }
            var items = (listData.data && listData.data.list) || []
            if (items.length === 0) {
                resolve([])
                return
            }
            var subDir = []
            for (var i = 0; i < items.length; i++) {
                var item = items[i]
                if (item.dir === true) {
                    subDir.push(item)
                } else if (
                    item.file === true &&
                    item.obj_category === 'video'
                ) {
                    if (parseInt(item.size.toString()) < 1024 * 1024 * 5)
                        continue
                    item.stoken = self.shareTokenCache[shareData.shareId].stoken
                    videos.push({
                        fileId: item.fid || '',
                        shareId: shareData.shareId,
                        shareToken: item.stoken || '',
                        shareFileToken: item.share_fid_token || '',
                        seriesId: item.series_id || '',
                        name: item.file_name || '',
                        type: item.obj_category || '',
                        formatType: item.format_type || '',
                        size: (item.size || '').toString(),
                        parent: item.pdir_fid || '',
                        lastUpdateAt: item.last_update_at || 0,
                    })
                } else if (
                    item.type === 'file' &&
                    self.subtitleExts.some(function (x) {
                        return item.file_name.endsWith(x)
                    })
                ) {
                    subtitles.push({
                        fileId: item.fid || '',
                        shareId: shareData.shareId,
                        shareToken: item.stoken || '',
                        shareFileToken: item.share_fid_token || '',
                        seriesId: item.series_id || '',
                        name: item.file_name || '',
                        type: item.obj_category || '',
                        formatType: item.format_type || '',
                        size: (item.size || '').toString(),
                        parent: item.pdir_fid || '',
                        lastUpdateAt: item.last_update_at || 0,
                    })
                }
            }

            if (page < Math.ceil((listData.metadata && listData.metadata._total) / pageSize)) {
                self.listFile(
                    shareData,
                    videos,
                    subtitles,
                    shareId,
                    folderId,
                    page + 1
                ).then(function (nextItems) {
                    items.push.apply(items, nextItems)
                    processSubDirs()
                })
            } else {
                processSubDirs()
            }

            function processSubDirs() {
                var subDirPromises = []
                for (var i = 0; i < subDir.length; i++) {
                    var dir = subDir[i]
                    subDirPromises.push(
                        self.listFile(shareData, videos, subtitles, shareId, dir.fid)
                    )
                }
                Promise.all(subDirPromises).then(function (results) {
                    for (var i = 0; i < results.length; i++) {
                        items.push.apply(items, results[i])
                    }
                    resolve(items)
                })
            }
        })
    })
}
QuarkUC.prototype.findBestLCS = function (mainItem, targetItems) {
    var results = []
    var bestMatchIndex = 0
    for (var i = 0; i < targetItems.length; i++) {
        var currentLCS = UZUtils.lcs(mainItem.name, targetItems[i].name)
        results.push({ target: targetItems[i], lcs: currentLCS })
        if (currentLCS.length > results[bestMatchIndex].lcs.length) {
            bestMatchIndex = i
        }
    }
    var bestMatch = results[bestMatchIndex]
    return {
        allLCS: results,
        bestMatch: bestMatch,
        bestMatchIndex: bestMatchIndex,
    }
}
/**
 * 清空保存目录
 */
QuarkUC.prototype.clearSaveDir = function () {
    var self = this
    return new Promise(function (resolve) {
        if (self.saveDirId == null) {
            resolve()
            return
        }
        self.api(
            'file/sort?' +
                self.pr +
                '&pdir_fid=' +
                self.saveDirId +
                '&_page=1&_size=200&_sort=file_type:asc,name:desc',
            null,
            3,
            'get'
        ).then(function (listData) {
            if (
                listData.data != null &&
                listData.data.list != null &&
                listData.data.list.length > 0
            ) {
                self.api('file/delete?' + self.pr, {
                    action_type: 2,
                    filelist: listData.data.list.map(function (v) {
                        return v.fid
                    }),
                    exclude_fids: [],
                }).then(function () {
                    self.saveFileIdCaches = {}
                    resolve()
                })
            } else {
                self.saveFileIdCaches = {}
                resolve()
            }
        })
    })
}

/**
 * 创建保存目录
 */
QuarkUC.prototype.createSaveDir = function () {
    var self = this
    return new Promise(function (resolve) {
        if (self.saveDirId != null) {
            resolve()
            return
        }
        self.getVip().then(function () {
            self.api(
                'file/sort?' +
                    self.pr +
                    '&pdir_fid=0&_page=1&_size=200&_sort=file_type:asc,name:desc',
                null,
                3,
                'get'
            ).then(function (listData) {
                if (listData.data != null && listData.data.list != null) {
                    for (var i = 0; i < listData.data.list.length; i++) {
                        var item = listData.data.list[i]
                        if (item.file_name === self.saveDirName) {
                            self.saveDirId = item.fid
                            self.clearSaveDir().then(resolve)
                            return
                        }
                    }
                }
                if (self.saveDirId == null) {
                    self.api('file?' + self.pr, {
                        pdir_fid: '0',
                        file_name: self.saveDirName,
                        dir_path: '',
                        dir_init_lock: false,
                    }).then(function (create) {
                        if (create.data != null && create.data.fid != null) {
                            self.saveDirId = create.data.fid
                        }
                        resolve()
                    })
                } else {
                    resolve()
                }
            })
        })
    })
}
/**
 * 保存分享的文件到个人网盘
 * @param {Object} args 保存参数
 * @param {string} args.shareId 分享ID
 * @param {string} [args.stoken] 分享token，如果未提供会尝试从缓存获取
 * @param {string} args.fileId 文件ID
 * @param {string} args.fileToken 文件token
 * @param {boolean} [args.clean=false] 是否清理已存在的保存目录
 * @returns {Promise<string|null>} 返回保存成功的文件ID，失败返回null
 */
QuarkUC.prototype.save = function (param) {
    var self = this
    return new Promise(function (resolve) {
        var shareId = param.shareId,
            stoken = param.stoken,
            fileId = param.fileId,
            fileToken = param.fileToken,
            clean = param.clean || false

        self.createSaveDir().then(function () {
            if (self.saveDirId == null) {
                resolve(null)
                return
            }
            if (stoken == null) {
                self.getShareToken({ shareId: shareId }).then(function () {
                    if (!self.shareTokenCache.hasOwnProperty(shareId)) {
                        resolve(null)
                        return
                    }
                    saveFile()
                })
            } else {
                saveFile()
            }

            function saveFile() {
                self.api('share/sharepage/save?' + self.pr, {
                    fid_list: [fileId],
                    fid_token_list: [fileToken],
                    to_pdir_fid: self.saveDirId,
                    pwd_id: shareId,
                    stoken: stoken || self.shareTokenCache[shareId].stoken,
                    pdir_fid: '0',
                    scene: 'link',
                }).then(function (saveResult) {
                    if (
                        saveResult.data != null &&
                        saveResult.data.task_id != null
                    ) {
                        var retry = 0
                        var checkTask = function () {
                            self.api(
                                'task?' +
                                    self.pr +
                                    '&task_id=' +
                                    saveResult.data.task_id +
                                    '&retry_index=' +
                                    retry,
                                null,
                                3,
                                'get'
                            ).then(function (taskResult) {
                                if (
                                    taskResult.data != null &&
                                    taskResult.data.save_as != null &&
                                    taskResult.data.save_as
                                        .save_as_top_fids != null &&
                                    taskResult.data.save_as.save_as_top_fids
                                        .length > 0
                                ) {
                                    resolve(
                                        taskResult.data.save_as
                                            .save_as_top_fids[0]
                                    )
                                } else {
                                    retry++
                                    if (retry > 2) {
                                        resolve(null)
                                    } else {
                                        setTimeout(checkTask, 1000)
                                    }
                                }
                            })
                        }
                        checkTask()
                    } else {
                        resolve(null)
                    }
                })
            }
        })
    })
}

/**
 * 获取指定目录下的文件列表
 * @param {Object} param0
 * @param {string} param0.pdir_fid - 目录ID
 * @param {number} param0.page - 页码
 * @returns {Promise<[PanMountListData]>}
 */
QuarkUC.prototype.getFileList = function (param) {
    var self = this
    return new Promise(function (resolve) {
        try {
            var pdir_fid = param.pdir_fid || '0'
            var page = param.page || 1
            self.api(
                'file/sort?' +
                    self.pr +
                    '&uc_param_str=&pdir_fid=' +
                    pdir_fid +
                    '&_page=' +
                    page +
                    '&_size=200&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,file_name:asc',
                null,
                3,
                'get'
            ).then(function (resData) {
                var list = (resData.data && resData.data.list) || []
                var mountList = []
                for (var index = 0; index < list.length; index++) {
                    var element = list[index]

                    var remark = ''
                    var size = (element.size || 0) / 1024 / 1024
                    var unit = 'MB'
                    if (size != 0) {
                        if (size >= 1000) {
                            size = size / 1024
                            unit = 'GB'
                        }
                        size = size.toFixed(1)
                        remark = '[' + size + unit + ']'
                    }

                    var dataType = PanDataType.Unknown
                    if (element.category == 1) {
                        dataType = PanDataType.Video
                    } else if (element.file_type == 0) {
                        dataType = PanDataType.Dir
                    }
                    mountList.push({
                        name: element.file_name,
                        panType: self.panName,
                        dataType: dataType,
                        data: {
                            fid: element.fid,
                        },
                        remark: remark,
                    })
                }
                resolve(mountList)
            })
        } catch (e) {
            resolve([])
        }
    })
}

/**
 * 获取转码后的播放地址
 * @param {Object} args - 参数对象
 * @param {string} args.fileId - 文件ID,用于从缓存中获取已保存的文件ID
 * @param {boolean} args.isMount - 是否挂载
 * @returns {Promise<[{url: string, name: string, headers: Object, priority: number}]>} 返回包含不同清晰度播放地址的数组
 * 数组元素格式:{url: string, name: string, headers: Object, priority: number}
 * url: 视频播放地址
 * name: 显示的名称
 * headers: 请求头
 * priority: 优先级
 */
QuarkUC.prototype.getLiveTranscoding = function (args) {
    var self = this
    return new Promise(function (resolve) {
        var isMount = args.isMount || false
        self.api('file/v2/play?' + self.pr, {
            fid: isMount ? args.fileId : self.saveFileIdCaches[args.fileId],
            resolutions: 'normal,low,high,super,2k,4k',
            supports: 'fmp4',
        }).then(function (transcoding) {
            var urls = []
            var nameMap = {
                FOUR_K: '4K',
                SUPER: '超清',
                HIGH: '高清',
                NORMAL: '流畅',
            }
            if (
                transcoding.data != null &&
                transcoding.data.video_list != null
            ) {
                for (var i = 0; i < transcoding.data.video_list.length; i++) {
                    var video = transcoding.data.video_list[i]
                    var resoultion =
                        video.video_info && video.video_info.resoultion
                    var priority = video.video_info && video.video_info.width
                    var url = video.video_info && video.video_info.url
                    if (resoultion && url) {
                        urls.push({
                            url: url,
                            name: nameMap[resoultion] || resoultion,
                            headers: self.playHeaders,
                            priority: priority,
                        })
                    }
                }
            }
            resolve(urls)
        })
    })
}

/**
 * 获取下载地址
 * @param {Object} args - 参数对象
 * @param {string} args.fileId - 文件ID,用于从缓存中获取已保存的文件ID
 * @param {bool} args.isMount - 是否是挂载
 * @returns {Promise<[{url: string, name: string, headers: Object, priority: number}]>} 返回包含不同清晰度播放地址的数组
 * 数组元素格式:{url: string, name: string, headers: Object, priority: number}
 * url: 下载地址
 * name: 显示的名称
 * headers: 请求头
 * priority: 优先级
 */
QuarkUC.prototype.getDownload = function (args) {
    var self = this
    return new Promise(function (resolve) {
        var isMount = args.isMount || false
        try {
            self.api('file/download?' + self.pr + '&uc_param_str=', {
                fids: isMount
                    ? [args.fileId]
                    : [self.saveFileIdCaches[args.fileId]],
            }).then(function (down) {
                if (
                    down.data != null &&
                    down.data.length > 0 &&
                    down.data[0].download_url != null
                ) {
                    var priority = 9999
                    if (self.isQuark && down.data[0].video_width > 2000) {
                        priority = 0
                    }
                    resolve([
                        {
                            name: '原画',
                            url: down.data[0].download_url,
                            headers: self.playHeaders,
                            priority: priority,
                        },
                    ])
                } else {
                    resolve([])
                }
            })
        } catch (error) {
            resolve([])
        }
    })
}

//MARK: - 阿里 相关实现
function Ali() {
    this.shareTokenCache = {}
    this.saveFileIdCaches = {}
    this.saveDirId = null
    this.userDriveId = null
    this.saveDirName = 'uz影视'
    this.user = {}
    this.oauth = {}
    this.isSVip = true
    this.token = ''
    this.apiUrl = 'https://api.aliyundrive.com/'
    this.openApiUrl = 'https://open.aliyundrive.com/adrive/v1.0/'
    this.updateToken = function () {}
    this.baseHeaders = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
        referer: 'https://www.aliyundrive.com',
        'Content-Type': 'application/json',
    }
}
Ali.prototype.uzTag = ''

Object.defineProperty(Ali.prototype, 'panName', {
    get: function () {
        return PanType.Ali
    },
})

Ali.prototype.delay = function (ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms)
    })
}

//验证时间戳
Ali.prototype.verifyTimestamp = function (timestamp) {
    // 时间为了保证任意时区都一致 所以使用格林威治时间
    var currentTimeString = new Date().toISOString()
    var currentTime = new Date(currentTimeString).getTime()
    var requestTime = new Date(timestamp).getTime()
    var timeDifference = Math.abs(currentTime - requestTime)
    // 检查时间差是否小于2分钟（120000毫秒）
    return timeDifference < 120000
}

Ali.prototype.api = function (url, data, headers, retry) {
    var self = this
    return new Promise(function (resolve) {
        headers = headers || {}
        var auth = url.startsWith('adrive/')
        Object.assign(headers, self.baseHeaders)
        if (auth) {
            Object.assign(headers, {
                Authorization: self.user.auth,
            })
        }

        var leftRetry = retry || 3
        var process = function () {
            if (leftRetry > 0) {
                req(self.apiUrl + url, {
                    method: 'post',
                    headers: headers,
                    data: JSON.stringify(data),
                })
                    .then(function (response) {
                        if (response.code === 401) {
                            self.token = ''
                            resolve({})
                            return
                        }
                        var resp = response.data
                        resolve(resp)
                    })
                    .catch(function (e) {
                        leftRetry--
                        self.delay(1000).then(process)
                    })
            } else {
                resolve({})
            }
        }
        process()
    })
}

Ali.prototype.openApi = function (url, data, headers, retry) {
    var self = this
    return new Promise(function (resolve) {
        headers = headers || {}
        Object.assign(headers, {
            Authorization: self.oauth.auth,
        })

        var leftRetry = retry || 3
        var process = function () {
            if (leftRetry > 0) {
                req(self.openApiUrl + url, {
                    method: 'post',
                    headers: headers,
                    data: JSON.stringify(data),
                })
                    .then(function (response) {
                        if (response.code === 401) {
                            self.token = ''
                            resolve({})
                            return
                        }
                        var resp = response.data
                        resolve(resp)
                    })
                    .catch(function (e) {
                        leftRetry--
                        self.delay(1000).then(process)
                    })
            } else {
                resolve({})
            }
        }
        process()
    })
}

// 一键就绪
Ali.prototype.oneKeyReady = function () {
    var self = this
    return new Promise(function (resolve) {
        self.login().then(function () {
            self.openAuth().then(function () {
                if (self.userDriveId == null) {
                    self.openApi('user/getDriveInfo', {}).then(
                        function (driveInfo) {
                            self.userDriveId = driveInfo.resource_drive_id
                            resolve()
                        }
                    )
                } else {
                    resolve()
                }
            })
        })
    })
}

//用户登陆
Ali.prototype.login = function () {
    var self = this
    return new Promise(function (resolve) {
        if (
            !self.user.user_id ||
            !self.verifyTimestamp(self.user.expire_time)
        ) {
            try {
                req('https://auth.aliyundrive.com/v2/account/token', {
                    method: 'post',
                    headers: self.baseHeaders,
                    data: {
                        refresh_token: self.token,
                        grant_type: 'refresh_token',
                    },
                }).then(function (loginResp) {
                    if (loginResp.code == 200) {
                        self.user = loginResp.data
                        self.user.expire_time = new Date().toISOString()
                        self.user.auth =
                            loginResp.data.token_type +
                            ' ' +
                            loginResp.data.access_token
                        self.user.token = loginResp.data.refresh_token

                        self.updateToken()
                    }
                    resolve()
                })
            } catch (e) {
                resolve()
            }
        } else {
            resolve()
        }
    })
}

//授权第三方Alist
Ali.prototype.openAuth = function () {
    var self = this
    return new Promise(function (resolve) {
        if (
            !self.oauth.access_token ||
            !self.verifyTimestamp(self.oauth.expire_time)
        ) {
            try {
                var getOpenTokenPromise = self.oauth.token
                    ? Promise.resolve(self.oauth.token)
                    : self.getOpenToken()
                getOpenTokenPromise.then(function (openToken) {
                    req('https://api.nn.ci/alist/ali_open/token', {
                        method: 'post',
                        headers: self.baseHeaders,
                        data: {
                            refresh_token: openToken,
                            grant_type: 'refresh_token',
                        },
                    }).then(function (openResp) {
                        if (openResp.code == 200) {
                            self.oauth = openResp.data
                            self.oauth.expire_time = new Date().toISOString()
                            self.oauth.auth =
                                openResp.data.token_type +
                                ' ' +
                                openResp.data.access_token
                            self.oauth.token = openResp.data.refresh_token
                        }
                        resolve()
                    })
                })
            } catch (e) {
                resolve()
            }
        } else {
            resolve()
        }
    })
}

//根据授权码获取token
Ali.prototype.getOpenToken = function () {
    var self = this
    return new Promise(function (resolve) {
        try {
            self.getOpenCode().then(function (code) {
                req('https://api.nn.ci/alist/ali_open/code', {
                    method: 'post',
                    headers: self.baseHeaders,
                    data: {
                        code: code,
                        grant_type: 'authorization_code',
                    },
                }).then(function (openResp) {
                    var openToken = openResp.data.refresh_token
                    resolve(openToken)
                })
            })
        } catch (e) {
            resolve()
        }
    })
}

//用户授权，获取授权码code
Ali.prototype.getOpenCode = function () {
    var self = this
    return new Promise(function (resolve) {
        var url =
            'https://open.aliyundrive.com/oauth/users/authorize?client_id=76917ccccd4441c39457a04f6084fb2f&redirect_uri=https://alist.nn.ci/tool/aliyundrive/callback&scope=user:base,file:all:read,file:all:write&state='
        var headers = self.baseHeaders
        Object.assign(headers, {
            Authorization: self.user.auth,
        })

        try {
            req(url, {
                method: 'post',
                headers: headers,
                data: {
                    authorize: 1,
                    scope: 'user:base,file:all:read,file:all:write',
                },
            }).then(function (openResp) {
                var uri = openResp.data.redirectUri
                var regex = /http.*code=(.*)/
                var matches = regex.exec(uri)
                var code = matches[1]
                resolve(code)
            })
        } catch (e) {
            resolve()
        }
    })
}

/**
 * 根据链接获取分享ID和文件夹ID
 * @param {string} url
 * @returns {null|{shareId: string, folderId: string}}
 **/
Ali.prototype.getShareData = function (url) {
    var regex =
        /https:\/\/www\.alipan\.com\/s\/([^\/]+)(\/folder\/([^\/]+))?|https:\/\/www\.aliyundrive\.com\/s\/([^\/]+)(\/folder\/([^\/]+))?/
    var matches = regex.exec(url)
    if (matches) {
        return {
            shareId: matches[1] || matches[4],
            folderId: matches[3] || matches[6] || 'root',
        }
    }
    return null
}

/**
 * 获取分享token
 * @param {{shareId: string, sharePwd: string}} shareData
 **/
Ali.prototype.getShareToken = function (shareData) {
    var self = this
    return new Promise(function (resolve) {
        if (!self.shareTokenCache.hasOwnProperty(shareData.shareId)) {
            delete self.shareTokenCache[shareData.shareId]
            self.api('v2/share_link/get_share_token', {
                share_id: shareData.shareId,
                share_pwd: shareData.sharePwd || '',
            }).then(function (shareToken) {
                if (shareToken.expire_time) {
                    self.shareTokenCache[shareData.shareId] = shareToken
                }
                resolve()
            })
        } else {
            resolve()
        }
    })
}

Ali.prototype.clearSaveDir = function () {
    var self = this
    return new Promise(function (resolve) {
        if (self.saveDirId == null) {
            resolve()
            return
        }
        self.openApi('openFile/list', {
            drive_id: self.userDriveId,
            parent_file_id: self.saveDirId,
            limit: 100,
            order_by: 'name',
            order_direction: 'DESC',
        }).then(function (listData) {
            if (listData.items) {
                var deletePromises = []
                for (var i = 0; i < listData.items.length; i++) {
                    var item = listData.items[i]
                    deletePromises.push(
                        self.openApi('openFile/delete', {
                            drive_id: self.userDriveId,
                            file_id: item.file_id,
                        })
                    )
                }
                Promise.all(deletePromises).then(function () {
                    self.saveFileIdCaches = {}
                    resolve()
                })
            } else {
                self.saveFileIdCaches = {}
                resolve()
            }
        })
    })
}

Ali.prototype.createSaveDir = function (clean) {
    var self = this
    return new Promise(function (resolve) {
        if (!self.user.device_id) {
            resolve()
            return
        }
        if (self.saveDirId) {
            // 删除所有子文件
            // if (clean) await this.clearSaveDir()
            // await this.clearSaveDir()
            resolve()
            return
        }

        if (self.userDriveId) {
            self.openApi('openFile/list', {
                drive_id: self.userDriveId,
                parent_file_id: 'root',
                limit: 100,
                order_by: 'name',
                order_direction: 'DESC',
            }).then(function (listData) {
                if (listData.items) {
                    for (var i = 0; i < listData.items.length; i++) {
                        var item = listData.items[i]
                        if (item.name === self.saveDirName) {
                            self.saveDirId = item.file_id
                            // await this.clearSaveDir()
                            break
                        }
                    }
                    if (!self.saveDirId) {
                        self.openApi('openFile/create', {
                            check_name_mode: 'refuse',
                            drive_id: self.userDriveId,
                            name: self.saveDirName,
                            parent_file_id: 'root',
                            type: 'folder',
                        }).then(function (create) {
                            if (create.file_id) {
                                self.saveDirId = create.file_id
                            }
                            resolve()
                        })
                    } else {
                        resolve()
                    }
                } else {
                    resolve()
                }
            })
        } else {
            resolve()
        }
    })
}

/**
 * 保存分享的文件到个人网盘
 * @param {Object} params 保存参数
 * @param {string} params.shareId 分享ID
 * @param {string} params.fileId 文件ID
 * @param {boolean} [params.clean=false] 是否清理已存在的保存目录
 * @returns {Promise<string|null>} 返回保存成功的文件ID，失败返回null
 */
Ali.prototype.save = function (params) {
    var self = this
    return new Promise(function (resolve) {
        var shareId = params.shareId,
            fileId = params.fileId,
            clean = params.clean || false

        self.oneKeyReady().then(function () {
            self.createSaveDir(clean).then(function () {
                if (self.saveDirId == null) {
                    resolve(null)
                    return
                }
                self.getShareToken({ shareId: shareId }).then(function () {
                    if (!self.shareTokenCache.hasOwnProperty(shareId)) {
                        resolve(null)
                        return
                    }
                    self.api(
                        'adrive/v2/file/copy',
                        {
                            file_id: fileId,
                            share_id: shareId,
                            auto_rename: true,
                            to_parent_file_id: self.saveDirId,
                            to_drive_id: self.userDriveId,
                        },
                        {
                            'X-Share-Token': self.shareTokenCache[shareId]
                                .share_token,
                        }
                    ).then(function (saveResult) {
                        if (saveResult.file_id) {
                            resolve(saveResult.file_id)
                        } else {
                            resolve(false)
                        }
                    })
                })
            })
        })
    })
}

Ali.prototype.getLiveTranscoding = function (param) {
    var self = this
    return new Promise(function (resolve) {
        var fileId = param.fileId
        var isMount = param.isMount || false

        self.openApi('openFile/getVideoPreviewPlayInfo', {
            file_id: isMount ? fileId : self.saveFileIdCaches[fileId],
            drive_id: self.userDriveId,
            category: 'live_transcoding',
            url_expire_sec: '14400',
        }).then(function (transcoding) {
            if (
                transcoding.video_preview_play_info &&
                transcoding.video_preview_play_info
                    .live_transcoding_task_list
            ) {
                var liveList =
                    transcoding.video_preview_play_info
                        .live_transcoding_task_list
                liveList.sort(function (a, b) {
                    return b.template_width - a.template_width
                })
                var nameMap = {
                    QHD: '超清',
                    FHD: '高清',
                    HD: '标清',
                    SD: '普画',
                    LD: '极速',
                }

                var urls = []
                for (var i = 0; i < liveList.length; i++) {
                    var video = liveList[i]
                    var url = (video.url) || ''
                    var priority = video.template_width
                    var name = nameMap[video.template_id] || video.template_id

                    if (url.length > 0) {
                        urls.push({
                            url: url,
                            name: name,
                            priority: priority,
                            headers: {},
                        })
                    }
                }
                resolve(urls)
            } else {
                resolve([])
            }
        })
    })
}

Ali.prototype.getDownload = function (param) {
    var self = this
    return new Promise(function (resolve) {
        var fileId = param.fileId
        var isMount = param.isMount || false
        self.openApi('openFile/getDownloadUrl', {
            file_id: isMount ? fileId : self.saveFileIdCaches[fileId],
            drive_id: self.userDriveId,
        }).then(function (down) {
            if (down.url) {
                resolve([
                    {
                        url: down.url,
                        name: '原画',
                        priority: 9999,
                        headers: {},
                    },
                ])
            } else {
                resolve([])
            }
        })
    })
}

Ali.prototype.findBestLCS = function (mainItem, targetItems) {
    var results = []
    var bestMatchIndex = 0
    for (var i = 0; i < targetItems.length; i++) {
        var currentLCS = UZUtils.lcs(mainItem.name, targetItems[i].name)
        results.push({ target: targetItems[i], lcs: currentLCS })
        if (currentLCS.length > results[bestMatchIndex].lcs.length) {
            bestMatchIndex = i
        }
    }
    var bestMatch = results[bestMatchIndex]
    return {
        allLCS: results,
        bestMatch: bestMatch,
        bestMatchIndex: bestMatchIndex,
    }
}

Ali.prototype.listFile = function (
    shareId,
    folderId,
    videos,
    subtitles,
    nextMarker
) {
    var self = this
    return new Promise(function (resolve) {
        var subtitleExts = ['srt', 'ass', 'scc', 'stl', 'ttml']
        self.api(
            'adrive/v2/file/list_by_share',
            {
                share_id: shareId,
                parent_file_id: folderId,
                limit: 200,
                order_by: 'name',
                order_direction: 'ASC',
                marker: nextMarker || '',
            },
            {
                'X-Share-Token': self.shareTokenCache[shareId].share_token,
            }
        ).then(function (listData) {
            var items = listData.items
            if (!items) {
                resolve([])
                return
            }

            if (listData.next_marker) {
                self.listFile(
                    shareId,
                    folderId,
                    videos,
                    subtitles,
                    listData.next_marker
                ).then(function (nextItems) {
                    for (var i = 0; i < nextItems.length; i++) {
                        items.push(nextItems[i])
                    }
                    processItems()
                })
            } else {
                processItems()
            }

            function processItems() {
                var subDir = []

                for (var i = 0; i < items.length; i++) {
                    var item = items[i]
                    if (item.type === 'folder') {
                        subDir.push(item)
                    } else if (
                        item.type === 'file' &&
                        item.category === 'video'
                    ) {
                        if (item.size < 1024 * 1024 * 5) continue
                        item.name = item.name.replace(
                            /玩偶哥.*【神秘的哥哥们】/g,
                            ''
                        )
                        videos.push(item)
                    } else if (
                        item.type === 'file' &&
                        subtitleExts.some(function (x) {
                            return item.file_extension.endsWith(x)
                        })
                    ) {
                        subtitles.push(item)
                    }
                }

                var subDirPromises = []
                for (var i = 0; i < subDir.length; i++) {
                    var dir = subDir[i]
                    subDirPromises.push(
                        self.listFile(
                            dir.share_id,
                            dir.file_id,
                            videos,
                            subtitles
                        )
                    )
                }
                Promise.all(subDirPromises).then(function (results) {
                    for (var i = 0; i < results.length; i++) {
                        for (var j = 0; j < results[i].length; j++) {
                            items.push(results[i][j])
                        }
                    }
                    resolve(items)
                })
            }
        })
    })
}

Ali.prototype.fileName = ''
/**
 * 获取文件列表
 * @param {string} shareUrl
 * @returns {Promise<PanListDetail>}
 **/
Ali.prototype.getFilesByShareUrl = function (shareUrl) {
    var self = this
    return new Promise(function (resolve) {
        var data = new PanListDetail()
        self.fileName = ''
        var shareData =
            typeof shareUrl === 'string'
                ? self.getShareData(shareUrl)
                : shareUrl
        if (!shareData) {
            data.error = '分享链接无效'
            resolve(data)
            return
        }
        self.getShareToken(shareData).then(function () {
            if (!self.shareTokenCache[shareData.shareId]) {
                data.error = '分享失效'
                resolve(data)
                return
            }

            var videos = []
            var subtitles = []

            self.listFile(
                shareData.shareId,
                shareData.folderId,
                videos,
                subtitles
            ).then(function () {
                videos.forEach(function (item) {
                    // 复制 item
                    var element = JSON.parse(JSON.stringify(item))
                    var size = element.size / 1024 / 1024
                    var unit = 'MB'
                    if (size >= 1000) {
                        size = size / 1024
                        unit = 'GB'
                    }
                    size = size.toFixed(1)
                    var remark = '[' + size + unit + ']'

                    var videoItem = new PanVideoItem()
                    videoItem.data = element
                    videoItem.panType = self.panName
                    videoItem.name = element.name
                    if (kAppVersion > 1650) {
                        videoItem.remark = remark
                    } else {
                        videoItem.name = element.name + ' ' + remark
                    }
                    data.videos.push(videoItem)
                })

                if (subtitles.length > 0) {
                    videos.forEach(function (item) {
                        var matchSubtitle = self.findBestLCS(item, subtitles)
                        if (matchSubtitle.bestMatch) {
                            item.subtitle = matchSubtitle.bestMatch.target
                        }
                    })
                }

                resolve(data)
            })
        })
    })
}

/**
 * 获取播放信息
 * @param {{flag:string,share_id:string,shareToken:string,file_id:string,shareFileToken:string }} data
 * @returns {Promise<PanPlayInfo>}
 */
Ali.prototype.getPlayUrl = function (data) {
    var self = this
    return new Promise(function (resolve) {
        var playData = new PanPlayInfo()
        playData.urls = []
        if (self.token.length < 1) {
            playData.error = '请先在环境变量中添加 阿里Token'
            resolve(playData)
            return
        }
        try {
            var shareId = data.share_id
            var fileId = data.file_id
            var process = function (saveFileId) {
                if (!saveFileId) {
                    resolve(new PanPlayInfo('', '转存失败～'))
                    return
                }
                self.saveFileIdCaches[fileId] = saveFileId

                self.getDownload({ fileId: fileId }).then(function (rawUrls) {
                    self.getLiveTranscoding({
                        fileId: fileId,
                    }).then(function (transcodingUrls) {
                        playData.urls = [].concat(rawUrls, transcodingUrls)
                        playData.urls.sort(function (a, b) {
                            return b.priority - a.priority
                        })
                        playData.url = playData.urls[0].url
                        self.clearSaveDir().then(function () {
                            resolve(playData)
                        })
                    })
                })
            }
            if (!self.saveFileIdCaches[fileId]) {
                self.save({
                    shareId: shareId,
                    fileId: fileId,
                    clean: false,
                }).then(process)
            } else {
                process(self.saveFileIdCaches[fileId])
            }
        } catch (error) {
            playData = new PanPlayInfo()
            playData.error = error.toString()
            self.clearSaveDir().then(function () {
                resolve(playData)
            })
        }
    })
}

/**
 * 下一次获取文件列表时使用的marker
 * key: file_id
 * value: marker
 */
Ali.prototype.nextMap = new Map()

/**
 * 获取文件列表
 * @param {PanMountListData?} args
 * @param {boolean} isRoot
 * @param {number} page
 */
Ali.prototype.getFileList = function (param) {
    var self = this
    return new Promise(function (resolve) {
        var args = param.args,
            isRoot = param.isRoot,
            page = param.page
        var list = []
        var fid = isRoot ? 'root' : args && args.data.file_id
        var marker = (self.nextMap.get(fid)) || ''
        if (page == 1) {
            marker = ''
        } else if (marker === '') {
            resolve(list)
            return
        }

        self.openApi('openFile/list', {
            drive_id: self.userDriveId,
            parent_file_id: fid,
            limit: 200,
            order_by: 'name',
            order_direction: 'DESC',
            marker: marker,
        }).then(function (listData) {
            var items = listData.items
            self.nextMap.set(fid, listData.next_marker)

            for (var index = 0; index < items.length; index++) {
                var element = items[index]

                var size = (element && element.size || 0) / 1024 / 1024
                var remark = ''
                if (size > 0) {
                    var unit = 'MB'
                    if (size >= 1000) {
                        size = size / 1024
                        unit = 'GB'
                    }
                    size = size.toFixed(1)
                    remark = '[' + size + unit + ']'
                }

                var dataType = PanDataType.Dir
                if (element.category == 'video') {
                    dataType = PanDataType.Video
                } else if (element.category) {
                    dataType = PanDataType.Unknown
                }
                list.push({
                    name: element.name,
                    panType: PanType.Ali,
                    dataType: dataType,
                    data: {
                        file_id: element.file_id,
                    },
                    remark: remark,
                })
            }
            resolve(list)
        })
    })
}

function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))
}
function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))
}
function axios() {}
/**
 * 发送请求
 * @param {object} config 请求配置
 * @returns {Promise<ProData>}
 */
axios.request = function (config) {
    return new Promise(function (resolve) {
        var url = config.url,
            method = config.method || 'GET',
            headers = config.headers || {},
            data = config.data,
            params = config.params,
            responseType = config.responseType,
            addressType = config.addressType,
            maxRedirects = config.maxRedirects

        var options = {
            method: method,
            headers: headers,
            data: data,
            queryParameters: params,
            responseType: responseType,
            addressType: addressType,
            maxRedirects: maxRedirects,
        }

        req(url, options).then(function (response) {
            response.status = response.code
            resolve(response)
        })
    })
}

/**
 * GET 请求
 * @param {string} url 请求的URL
 * @param {object} [config] 可选的请求配置
 * @returns {Promise<ProData>}
 */
axios.get = function (url, config) {
    config = config || {}
    return axios.request(
        Object.assign({}, config, { url: url, method: 'GET' })
    )
}
/**
 * POST 请求
 * @param {string} url 请求的URL
 * @param {object} [data] 可选的请求数据
 * @param {object} [config] 可选的请求配置
 * @returns {Promise<ProData>}
 */
axios.post = function (url, data, config) {
    config = config || {}
    return axios.request(
        Object.assign({}, config, { url: url, method: 'POST', data: data })
    )
}

function qs() {}
qs.stringify = function (obj, prefix) {
    prefix = prefix || ''
    var pairs = []

    for (var key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

        var value = obj[key]
        var fullKey = prefix ? prefix + '[' + key + ']' : key

        if (value === null || value === undefined) {
            pairs.push(encodeURIComponent(fullKey) + '=')
        } else if (typeof value === 'object') {
            pairs.push(stringify(value, fullKey))
        } else {
            pairs.push(
                encodeURIComponent(fullKey) +
                    '=' +
                    encodeURIComponent(value)
            )
        }
    }

    return pairs.join('&')
}

qs.toObject = function (str) {
    if (typeof str !== 'string' || str.length === 0) {
        return {}
    }
    str = str.replace(/&/g, ',').replace(/=/g, ':')
    var obj = {}
    var pairs = str.split(',')
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split(':')
        obj[pair[0]] = pair[1]
    }
    return obj
}

//123盘
// 抄自 https://github.com/hjdhnx/drpy-node/
function Pan123() {
    this.regex =
        /https:\/\/(www.123684.com|www.123865.com|www.123912.com|www.123pan.com|www.123pan.cn|www.123592.com)\/s\/([^\/]+)/
    this.api = 'https://www.123684.com/b/api/share/'
    this.loginUrl = 'https://login.123pan.com/api/user/sign_in'
    this.cate = ''
}
Pan123.prototype.uzTag = ''
Pan123.prototype.password = ''
Pan123.prototype.passport = ''
Pan123.prototype.authKey = '123panAuth'
Pan123.prototype.auth = ''

Pan123.prototype.init = function () {
    var self = this
    return new Promise(function (resolve) {
        try {
            if (self.passport.length > 0) {
            }
            if (self.password.length > 0) {
            }
            UZUtils.getStorage({
                key: self.authKey,
                uzTag: self.uzTag,
            }).then(function (auth) {
                if (auth && auth.length > 0) {
                    self.auth = auth
                    var CryptoJS = Crypto
                    var info = JSON.parse(
                        CryptoJS.enc.Base64.parse(
                            self.auth.split('.')[1]
                        ).toString(CryptoJS.enc.Utf8)
                    )
                    if (info.exp <= Math.floor(Date.now() / 1000)) {
                        self.loin().then(resolve)
                    } else {
                        resolve()
                    }
                } else {
                    self.loin().then(resolve)
                }
            })
        } catch (error) {
            resolve()
        }
    })
}

Pan123.prototype.loin = function () {
    var self = this
    return new Promise(function (resolve) {
        var data = JSON.stringify({
            passport: self.passport,
            password: self.password,
            remember: true,
        })
        var config = {
            method: 'POST',
            url: self.loginUrl,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'App-Version': '43',
                Referer:
                    'https://login.123pan.com/centerlogin?redirect_url=https%3A%2F%2Fwww.123684.com&source_page=website',
            },
            data: data,
        }

        axios.request(config).then(function (auth) {
            if (auth.data && auth.data.data && auth.data.data.token) {
                self.auth = auth.data.data.token

                UZUtils.setStorage({
                    key: self.authKey,
                    value: self.auth,
                    uzTag: self.uzTag,
                }).then(resolve)
            } else {
                resolve()
            }
        })
    })
}

Pan123.prototype.getShareData = function (url) {
    var panUrl = decodeURIComponent(url.trim())
    this.SharePwd = ''
    // 支持 ;、,、，、空格后跟提取码
    var pwdMatch = panUrl.match(
        /[;，,\s]+[\u63d0\u53d6\u7801:：\s]*([a-zA-Z0-9]{4})/
    )
    if (pwdMatch) {
        this.SharePwd = pwdMatch[1]
        panUrl = panUrl.substring(0, pwdMatch.index)
    } else if (panUrl.indexOf('?') > 0) {
        this.SharePwd = panUrl.slice(-4)
        panUrl = panUrl.split('?')[0]
    } else if (panUrl.indexOf('码') > 0) {
        this.SharePwd = panUrl.slice(-4)
        var firstChinese = panUrl.match(/[\u4e00-\u9fa5]/)
        if (firstChinese) {
            panUrl = panUrl.slice(0, firstChinese.index)
        }
    }
    panUrl = panUrl.replace(/[.,，/]$/, '')
    panUrl = panUrl.trim()
    var matches = this.regex.exec(panUrl)
    if (!matches) {
        return null
    }
    var shareKey = panUrl.split('/').pop()
    if (!shareKey) {
        return null
    }
    return shareKey
}

Pan123.prototype.fileName = ''
Pan123.prototype.getFilesByShareUrl = function (shareUrl) {
    var self = this
    return new Promise(function (resolve) {
        try {
            var shareKey = self.getShareData(shareUrl)

            if (shareKey === null) {
                resolve({
                    videos: [],
                    fileName: '',
                    error: '无法解析分享链接',
                })
                return
            }
            self.fileName = ''
            var file = {}
            self.getShareInfo(shareKey, self.SharePwd, 0, 0).then(
                function (cate) {
                    if (cate && Array.isArray(cate)) {
                        var promises = cate.map(function (item) {
                            return new Promise(function (res) {
                                if (!(item.filename in file)) {
                                    file[item.filename] = []
                                }

                                self.getShareList(
                                    item.shareKey,
                                    item.SharePwd,
                                    item.next,
                                    item.fileId
                                ).then(function (fileData) {
                                    if (fileData && fileData.length > 0) {
                                        file[item.filename].push.apply(
                                            file[item.filename],
                                            fileData
                                        )
                                    }
                                    res()
                                })
                            })
                        })
                        Promise.all(promises).then(function () {
                            processVideos()
                        })
                    } else {
                        processVideos()
                    }

                    function processVideos() {
                        var videos = []

                        // 过滤掉空数组
                        for (var key in file) {
                            if (file[key].length > 0) {
                                for (
                                    var i = 0;
                                    i < file[key].length;
                                    i++
                                ) {
                                    var element = file[key][i]
                                    var size = element.Size / 1024 / 1024
                                    var unit = 'MB'
                                    if (size >= 1000) {
                                        size = size / 1024
                                        unit = 'GB'
                                    }
                                    size = size.toFixed(1)
                                    videos.push({
                                        name: element.FileName,
                                        remark: '[' + size + unit + ']',
                                        panType: PanType.Pan123,
                                        data: element,
                                        fromName: key,
                                    })
                                }
                            }
                        }

                        resolve({
                            videos: videos,
                            fileName: self.fileName,
                            error: '',
                        })
                    }
                }
            )
        } catch (error) {
            resolve({
                videos: [],
                fileName: '',
                error: error.toString(),
            })
        }
    })
}

Pan123.prototype.getShareInfo = function (
    shareKey,
    SharePwd,
    next,
    ParentFileId
) {
    var self = this
    return new Promise(function (resolve) {
        var cate = []
        axios
            .get(self.api + 'get', {
                headers: {},
                params: {
                    limit: '100',
                    next: next,
                    orderBy: 'file_name',
                    orderDirection: 'asc',
                    shareKey: shareKey,
                    SharePwd: SharePwd || '',
                    ParentFileId: ParentFileId,
                    Page: '1',
                },
            })
            .then(function (list) {
                if (list.status === 200) {
                    if (list.data.code === 5103) {
                        resolve([])
                    } else {
                        var info = list.data.data
                        if (info == null) {
                            resolve([])
                            return
                        }
                        var next = info.Next
                        var infoList = info.InfoList

                        infoList.forEach(function (item) {
                            if (self.fileName.length < 1) {
                                self.fileName = item.FileName
                            }
                            if (item.Category === 0) {
                                cate.push({
                                    filename: item.FileName,
                                    shareKey: shareKey,
                                    SharePwd: SharePwd,
                                    next: next,
                                    fileId: item.FileId,
                                })
                            }
                        })
                        var promises = cate.map(function (it) {
                            return self.getShareInfo(
                                shareKey,
                                SharePwd,
                                next,
                                it.fileId
                            )
                        })
                        Promise.all(promises).then(function (result) {
                            result = result.filter(function (item) {
                                return item !== undefined && item !== null
                            })
                            var finalResult = [].concat.apply(cate, result)
                            resolve(finalResult)
                        })
                    }
                } else {
                    resolve([])
                }
            })
    })
}

Pan123.prototype.getShareList = function (
    shareKey,
    SharePwd,
    next,
    ParentFileId
) {
    var self = this
    return new Promise(function (resolve) {
        try {
            var video = []
            axios
                .get(self.api + 'get', {
                    headers: {},
                    params: {
                        limit: '100',
                        next: next,
                        orderBy: 'file_name',
                        orderDirection: 'asc',
                        shareKey: shareKey,
                        SharePwd: SharePwd || '',
                        ParentFileId: ParentFileId,
                        Page: '1',
                    },
                })
                .then(function (list) {
                    var infoList =
                        list.data && list.data.data && list.data.data.InfoList
                    if (infoList) {
                        infoList.forEach(function (it) {
                            if (it.Category === 2) {
                                video.push({
                                    ShareKey: shareKey,
                                    FileId: it.FileId,
                                    S3KeyFlag: it.S3KeyFlag,
                                    Size: it.Size,
                                    Etag: it.Etag,
                                    FileName: it.FileName,
                                })
                            }
                        })
                    }
                    resolve(video)
                })
        } catch (error) {
            resolve([])
        }
    })
}

Pan123.prototype.getDownload = function (
    shareKey,
    FileId,
    S3KeyFlag,
    Size,
    Etag
) {
    var self = this
    return new Promise(function (resolve) {
        try {
            self.init().then(function () {
                var data = JSON.stringify({
                    ShareKey: shareKey,
                    FileID: FileId,
                    S3KeyFlag: S3KeyFlag,
                    Size: Size,
                    Etag: Etag,
                })

                var config = {
                    method: 'POST',
                    url: self.api + 'download/info',
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                        Authorization: 'Bearer ' + self.auth,
                        'Content-Type': 'application/json;charset=UTF-8',
                        platform: 'android',
                    },
                    data: data,
                }
                axios.request(config).then(function (resp) {
                    var down = resp && resp.data && resp.data.data
                    var url = down && down.DownloadURL

                    if (!url || url.length < 1) {
                        resolve([])
                        return
                    }

                    var query = qs.toObject(url.split('?')[1])

                    url = base64Decode(query.params)
                    resolve([
                        {
                            url: url,
                            name: '原画',
                            priority: 9999,
                            headers: {},
                        },
                    ])
                })
            })
        } catch (error) {
            resolve([])
        }
    })
}

Pan123.prototype.getLiveTranscoding = function (
    shareKey,
    FileId,
    S3KeyFlag,
    Size,
    Etag
) {
    var self = this
    return new Promise(function (resolve) {
        try {
            self.init().then(function () {
                var config = {
                    method: 'GET',
                    url: 'https://www.123684.com/b/api/video/play/info',
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                        Authorization: 'Bearer ' + self.auth,
                        'Content-Type': 'application/json;charset=UTF-8',
                        platform: 'android',
                    },
                    params: {
                        etag: Etag,
                        size: Size,
                        from: '1',
                        shareKey: shareKey,
                    },
                }
                axios.request(config).then(function (resp) {
                    var down =
                        resp &&
                        resp.data &&
                        resp.data.data &&
                        resp.data.data.video_play_info
                    var videoinfo = []
                    if (down) {
                        down.forEach(function (item) {
                            if (item.url !== '') {
                                videoinfo.push({
                                    name: item.resolution,
                                    url: item.url,
                                    priority: item.height,
                                })
                            }
                        })
                    }

                    resolve(videoinfo)
                })
            })
        } catch (error) {
            resolve([])
        }
    })
}

Pan123.prototype.getPlayUrl = function (data) {
    var self = this
    return new Promise(function (resolve) {
        if (self.passport.length < 1 || self.password.length < 1) {
            resolve({
                urls: [],
                error: '请先在环境变量中添加 123账号密码',
            })
            return
        }
        self.getDownload(
            data.ShareKey,
            data.FileId,
            data.S3KeyFlag,
            data.Size,
            data.Etag
        ).then(function (raw) {
            self.getLiveTranscoding(
                data.ShareKey,
                data.FileId,
                data.S3KeyFlag,
                data.Size,
                data.Etag
            ).then(function (transcoding) {
                var urls = [].concat(raw, transcoding)

                resolve({
                    urls: urls,
                    headers: {},
                })
            })
        })
    })
}

//189云盘
// 抄自 https://github.com/hjdhnx/drpy-node/

function Pan189() {
    this.regex = /https:\/\/cloud\.189\.cn\/web\/share\?code=([^&]+)/ //https://cloud.189.cn/web/share?code=qI3aMjqYRrqa
    this.config = {
        clientId: '538135150693412',
        model: 'KB2000',
        version: '9.0.6',
        pubKey:
            'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZLyV4gHNDUGJMZoOcYauxmNEsKrc0TlLeBEVVIIQNzG4WqjimceOj5R9ETwDeeSN3yejAKLGHgx83lyy2wBjvnbfm/nLObyWwQD/09CmpZdxoFYCH6rdDjRpwZOZ2nXSZpgkZXoOBkfNXNxnN74aXtho2dqBynTw3NFTWyQl8BQIDAQAB',
    }
    this.headers = {
        'User-Agent':
            'Mozilla/5.0 (Linux; U; Android 11; ' +
            this.config.model +
            ' Build/RP1A.201005.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36 Ecloud/' +
            this.config.version +
            ' Android/30 clientId/' +
            this.config.clientId +
            ' clientModel/' +
            this.config.model +
            ' clientChannelId/qq proVersion/1.0.6',
        Referer:
            'https://m.cloud.189.cn/zhuanti/2016/sign/index.jsp?albumBackupOpened=1',
        'Accept-Encoding': 'gzip, deflate',
    }

    this.api = 'https://cloud.189.cn/api'
    this.shareCode = ''
    this.accessCode = ''
    this.shareId = ''
    this.shareMode = ''
    this.isFolder = ''
    this.index = 0
}

// 初始化方法，加载本地配置
Pan189.prototype.init = function () {
    var self = this
    return new Promise(function (resolve) {
        if (self.cookie.length < 1) {
            self.login(self.account, self.password).then(resolve)
        } else {
            resolve()
        }
    })
}
Pan189.prototype.uzTag = ''
Pan189.prototype.account = ''
Pan189.prototype.password = ''
Pan189.prototype.cookie = ''
Pan189.prototype.authKey = '189panAuth'

Pan189.prototype.login = function (uname, passwd) {
    var self = this
    return new Promise(function (resolve) {
        if (uname.length < 1 || passwd.length < 1) {
            resolve()
            return
        }

        try {
            axios
                .post(
                    'https://open.e.189.cn/api/logbox/config/encryptConf.do?appId=cloud'
                )
                .then(function (resp) {
                    var jsonData = JSONbig.parse(resp.data)
                    var pubKey = jsonData.data.pubKey

                    axios
                        .get(
                            'https://cloud.189.cn/api/portal/loginUrl.action?redirectURL=https://cloud.189.cn/web/redirect.html?returnURL=/main.action'
                        )
                        .then(function (resp) {
                            // 获取最后请求url中的参数reqId和lt
                            var lastReq = resp.redirects.pop()

                            var lastReqUrl =
                                (lastReq.location) || lastReq.url

                            var Reqid = lastReqUrl.match(/reqId=(\w+)/)[1]
                            var Lt = lastReqUrl.match(/lt=(\w+)/)[1]
                            var tHeaders = {
                                'Content-Type':
                                    'application/x-www-form-urlencoded',
                                'User-Agent':
                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/76.0',
                                Referer: 'https://open.e.189.cn/',
                                Lt: Lt,
                                Reqid: Reqid,
                            }
                            var data = { version: '2.0', appKey: 'cloud' }
                            axios
                                .post(
                                    'https://open.e.189.cn/api/logbox/oauth2/appConf.do',
                                    qs.stringify(data),
                                    { headers: tHeaders }
                                )
                                .then(function (resp) {
                                    var returnUrl = resp.data.data.returnUrl
                                    var paramId = resp.data.data.paramId
                                    var keyData =
                                        '-----BEGIN PUBLIC KEY-----\n' +
                                        pubKey +
                                        '\n-----END PUBLIC KEY-----'

                                    var jsencrypt = new Encrypt()
                                    jsencrypt.setPublicKey(keyData)

                                    var enUname = Buffer.from(
                                        jsencrypt.encrypt(uname),
                                        'base64'
                                    ).toString('hex')
                                    var enPasswd = Buffer.from(
                                        jsencrypt.encrypt(passwd),
                                        'base64'
                                    ).toString('hex')

                                    data = {
                                        appKey: 'cloud',
                                        version: '2.0',
                                        accountType: '01',
                                        mailSuffix: '@189.cn',
                                        validateCode: '',
                                        returnUrl: returnUrl,
                                        paramId: paramId,
                                        captchaToken: '',
                                        dynamicCheck: 'FALSE',
                                        clientType: '1',
                                        cb_SaveName: '0',
                                        isOauth2: false,
                                        userName: '{NRP}' + enUname,
                                        password: '{NRP}' + enPasswd,
                                    }
                                    axios
                                        .post(
                                            'https://open.e.189.cn/api/logbox/oauth2/loginSubmit.do',
                                            qs.stringify(data),
                                            {
                                                headers: tHeaders,
                                                validateStatus: null,
                                            }
                                        )
                                        .then(function (resp) {
                                            var loginJsonData = JSONbig.parse(
                                                resp.data
                                            )

                                            if (loginJsonData.toUrl) {
                                                var cookies = resp.headers[
                                                    'set-cookie'
                                                ]
                                                    .map(function (it) {
                                                        return it.split(';')[0]
                                                    })
                                                    .join(';')

                                                self.cookie = cookies
                                                var headers = Object.assign(
                                                    {},
                                                    self.headers,
                                                    { Cookie: cookies }
                                                )

                                                axios
                                                    .get(loginJsonData.toUrl, {
                                                        headers: headers,
                                                        maxRedirects: 0,
                                                    })
                                                    .then(function (resp) {
                                                        cookies +=
                                                            '; ' +
                                                            ((resp.headers &&
                                                                resp.headers[
                                                                    'set-cookie'
                                                                ] &&
                                                                resp.headers[
                                                                    'set-cookie'
                                                                ].map(
                                                                    function (
                                                                        it
                                                                    ) {
                                                                        return it.split(
                                                                            ';'
                                                                        )[0]
                                                                    }
                                                                )
                                                                    .join(
                                                                        ';'
                                                                    )) ||
                                                                '')
                                                        self.cookie = cookies

                                                        UZUtils.setStorage({
                                                            key: self.authKey,
                                                            value: cookies,
                                                            uzTag: self.uzTag,
                                                        }).then(resolve)
                                                    })
                                            } else {
                                                console.error(
                                                    'Error during login:',
                                                    resp.data
                                                )

                                                UZUtils.setStorage({
                                                    key: self.authKey,
                                                    value: '',
                                                    uzTag: self.uzTag,
                                                }).then(resolve)
                                            }
                                        })
                                })
                        })
                })
        } catch (error) {
            UZUtils.setStorage({
                key: self.authKey,
                value: '',
                uzTag: self.uzTag,
            }).then(function () {
                console.error('Error during login:', error)
                resolve()
            })
        }
    })
}

Pan189.prototype.getShareID = function (url, accessCode) {
    var self = this
    return new Promise(function (resolve) {
        try {
            var matches = self.regex.exec(url)
            if (matches && matches[1]) {
                self.shareCode = matches[1]
                var accessCodeMatch = self.shareCode.match(/访问码：([a-zA-Z0-9]+)/)
                self.accessCode = accessCodeMatch ? accessCodeMatch[1] : ''
            } else {
                var matches_ = url.match(/https:\/\/cloud\.189\.cn\/t\/([^&]+)/)
                self.shareCode = matches_ ? matches_[1] : null
                var accessCodeMatch = self.shareCode.match(
                    /访问码：([a-zA-Z0-9]+)/
                )
                self.accessCode = accessCodeMatch ? accessCodeMatch[1] : ''
            }
            if (accessCode) {
                self.accessCode = accessCode
            }
        } catch (error) {}
        resolve()
    })
}

Pan189.prototype.fileName = ''
Pan189.prototype.getShareData = function (shareUrl, accessCode) {
    var self = this
    return new Promise(function (resolve) {
        try {
            var file = {}
            var fileData = []
            self.fileName = ''
            self.getShareInfo(shareUrl, accessCode).then(function (fileId) {
                if (fileId) {
                    self.getShareList(fileId).then(function (fileList) {
                        if (fileList && Array.isArray(fileList)) {
                            var promises = fileList.map(function (item) {
                                return new Promise(function (res) {
                                    if (!(item.name in file)) {
                                        file[item.name] = []
                                    }
                                    self.getShareFile(item.id).then(function (
                                        fileData
                                    ) {
                                        if (
                                            fileData &&
                                            fileData.length > 0
                                        ) {
                                            file[item.name].push.apply(
                                                file[item.name],
                                                fileData
                                            )
                                        }
                                        res()
                                    })
                                })
                            })
                            Promise.all(promises).then(function () {
                                self.getShareFile(fileId).then(
                                    function (rootFiles) {
                                        file['root'] = rootFiles
                                        processVideos()
                                    }
                                )
                            })
                        } else {
                            self.getShareFile(fileId).then(function (
                                rootFiles
                            ) {
                                file['root'] = rootFiles
                                processVideos()
                            })
                        }
                    })
                } else {
                    processVideos()
                }

                function processVideos() {
                    // 过滤掉空数组
                    for (var key in file) {
                        if (file[key].length === 0) {
                            delete file[key]
                        }
                    }
                    // 如果 file 对象为空，重新获取 root 数据并过滤空数组
                    if (Object.keys(file).length === 0) {
                        self.getShareFile(fileId).then(function (rootFiles) {
                            file['root'] = rootFiles
                            if (
                                file['root'] &&
                                Array.isArray(file['root'])
                            ) {
                                file['root'] = file['root'].filter(
                                    function (item) {
                                        return (
                                            item &&
                                            Object.keys(item).length > 0
                                        )
                                    }
                                )
                            }
                            finalize()
                        })
                    } else {
                        finalize()
                    }

                    function finalize() {
                        var videos = []
                        for (var key in file) {
                            for (
                                var i = 0;
                                i < (file[key] && file[key].length);
                                i++
                            ) {
                                var element = file[key][i]
                                var size = element.size / 1024 / 1024
                                var unit = 'MB'
                                if (size >= 1000) {
                                    size = size / 1024
                                    unit = 'GB'
                                }
                                size = size.toFixed(1)
                                videos.push({
                                    name: element.name,
                                    remark: '[' + size + unit + ']',
                                    panType: PanType.Pan189,
                                    data: element,
                                    fromName: key,
                                })
                            }
                        }

                        resolve({
                            videos: videos,
                            fileName: self.fileName,
                            error: '',
                        })
                    }
                }
            })
        } catch (error) {
            resolve({
                videos: [],
                error: '',
            })
        }
    })
}

Pan189.prototype.getShareInfo = function (shareUrl, accessCode) {
    var self = this
    return new Promise(function (resolve) {
        try {
            var getShareIDPromise = Promise.resolve()
            if (shareUrl.startsWith('http')) {
                getShareIDPromise = self.getShareID(shareUrl, accessCode)
            } else {
                self.shareCode = shareUrl
            }
            getShareIDPromise.then(function () {
                if (accessCode) {
                    axios
                        .get(
                            self.api +
                                '/open/share/checkAccessCode.action?shareCode=' +
                                self.shareCode +
                                '&accessCode=' +
                                self.accessCode,
                            {
                                headers: {
                                    'user-agent':
                                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                                    accept: 'application/json;charset=UTF-8',
                                    'accept-encoding':
                                        'gzip, deflate, br, zstd',
                                    'accept-language': 'zh-CN,zh;q=0.9',
                                },
                            }
                        )
                        .then(function (check) {
                            if (check.status === 200) {
                                self.shareId = check.data.shareId
                            }
                            axios
                                .get(
                                    self.api +
                                        '/open/share/getShareInfoByCodeV2.action?key=noCache&shareCode=' +
                                        self.shareCode,
                                    {
                                        headers: {
                                            'user-agent':
                                                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                                            accept:
                                                'application/json;charset=UTF-8',
                                            'accept-encoding':
                                                'gzip, deflate, br, zstd',
                                            'accept-language':
                                                'zh-CN,zh;q=0.9',
                                        },
                                    }
                                )
                                .then(function (resp) {
                                    var fileId = resp.data.fileId
                                    self.shareMode = resp.data.shareMode
                                    self.isFolder = resp.data.isFolder
                                    if (self.fileName.length < 1) {
                                        self.fileName = resp.data.fileName
                                    }
                                    resolve(fileId)
                                })
                        })
                } else {
                    var url =
                        self.api +
                        '/open/share/getShareInfoByCodeV2.action?noCache=' +
                        Math.random() +
                        '&shareCode=' +
                        self.shareCode
                    axios
                        .get(url, {
                            headers: {
                                // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                                Accept: 'application/json;charset=UTF-8',
                                // 'accept-encoding': 'gzip, deflate, br, zstd',
                                // 'accept-language': 'zh-CN,zh;q=0.9',
                            },
                        })
                        .then(function (resp) {
                            var fileId = resp.data.fileId
                            self.shareId = resp.data.shareId

                            self.shareMode = resp.data.shareMode
                            self.isFolder = resp.data.isFolder
                            if (self.fileName.length < 1) {
                                self.fileName = resp.data.fileName
                            }
                            resolve(fileId)
                        })
                }
            })
        } catch (error) {
            console.error('Error during getShareInfo:', error)
            resolve()
        }
    })
}

Pan189.prototype.getShareList = function (fileId) {
    var self = this
    return new Promise(function (resolve) {
        try {
            var videos = []
            var headers = {
                // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                Accept: 'application/json;charset=UTF-8',
                // 'Accept-Encoding': 'gzip, deflate, br, zstd',
            }
            var options = {
                method: 'GET',
                headers: headers,
                responseType: ReqResponseType.plain,
            }

            var url =
                self.api +
                '/open/share/listShareDir.action?pageNum=1&pageSize=60&fileId=' +
                fileId +
                '&shareDirFileId=' +
                fileId +
                '&isFolder=' +
                self.isFolder +
                '&shareId=' +
                self.shareId +
                '&shareMode=' +
                self.shareMode +
                '&iconOption=5&orderBy=lastOpTime&descending=true&accessCode=' +
                self.accessCode

            req(url, options).then(function (resp) {
                var text = (resp && resp.data) || ''
                var json = JSONbig.parse(text)

                var data = json && json.fileListAO
                var folderList = data && data.folderList
                if (!folderList) {
                    resolve(null)
                    return
                }

                var names = folderList.map(function (item) {
                    return item.name
                })
                var ids = folderList.map(function (item) {
                    return item.id
                })
                if (folderList && folderList.length > 0) {
                    names.forEach(function (name, index) {
                        videos.push({
                            name: name,
                            id: ids[index],
                            type: 'folder',
                        })
                    })
                    var promises = ids.map(function (id) {
                        return self.getShareList(id)
                    })
                    Promise.all(promises).then(function (result) {
                        result = result.filter(function (item) {
                            return item !== undefined && item !== null
                        })
                        var finalResult = [].concat.apply(videos, result)
                        resolve(finalResult)
                    })
                } else {
                    resolve(videos)
                }
            })
        } catch (e) {
            resolve([])
        }
    })
}

Pan189.prototype.getShareFile = function (fileId, pageNum, retry) {
    var self = this
    return new Promise(function (resolve) {
        try {
            pageNum = pageNum || 1
            retry = retry || 0
            if (!fileId || retry > 3) {
                resolve(null)
                return
            }
            var headers = {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                Accept: 'application/json;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
            }
            var options = {
                method: 'GET',
                headers: headers,
                responseType: ReqResponseType.plain,
            }
            var pageSize = 60
            var url =
                self.api +
                '/open/share/listShareDir.action?key=noCache&pageNum=' +
                pageNum +
                '&pageSize=' +
                pageSize +
                '&fileId=' +
                fileId +
                '&shareDirFileId=' +
                fileId +
                '&isFolder=' +
                self.isFolder +
                '&shareId=' +
                self.shareId +
                '&shareMode=' +
                self.shareMode +
                '&iconOption=5&orderBy=filename&descending=false&accessCode=' +
                self.accessCode +
                '&noCache=' +
                Math.random()

            req(url, options).then(function (resp) {
                if (resp.code !== 200) {
                    self.getShareFile(fileId, pageNum, retry + 1).then(resolve)
                    return
                }

                var json = JSONbig.parse((resp.data) || '')

                var videos = []
                var data = json && json.fileListAO
                var fileList = data && data.fileList
                if (!fileList) {
                    resolve(null)
                    return
                }
                for (var index = 0; index < fileList.length; index++) {
                    var element = fileList[index]
                    if (element.mediaType === 3) {
                        videos.push({
                            name: element.name,
                            fileId: element.id,
                            shareId: self.shareId,
                            size: element.size,
                        })
                    }
                }
                var totalCount = (data && data.count) || 0
                if (totalCount > pageSize * pageNum) {
                    self.getShareFile(fileId, pageNum + 1).then(
                        function (result) {
                            if (result) {
                                videos = [].concat(videos, result)
                            }
                            resolve(videos)
                        }
                    )
                } else {
                    resolve(videos)
                }
            })
        } catch (e) {
            resolve([])
        }
    })
}

Pan189.prototype.getPlayUrl = function (data) {
    var self = this
    return new Promise(function (resolve) {
        if (self.account.length < 1 || self.password.length < 1) {
            resolve({
                urls: [],
                error: '请先在环境变量中添加 天翼账号密码',
            })
            return
        }

        UZUtils.getStorage({
            key: self.authKey,
            uzTag: self.uzTag,
        }).then(function (cookie) {
            self.cookie = cookie
            self.getShareUrl(data.fileId, data.shareId).then(function (list) {
                var urls = list.map(function (it) {
                    return {
                        url: it,
                    }
                })

                resolve({
                    urls: urls,
                    headers: {},
                })
            })
        })
    })
}

Pan189.prototype.getShareUrl = function (fileId, shareId) {
    var self = this
    return new Promise(function (resolve) {
        var headers = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            Accept: 'application/json;charset=UTF-8',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
        }
        var getUrl = function () {
            if (
                self.cookie.length < 1 &&
                self.account.length > 0 &&
                self.password.length > 0 &&
                self.index < 2
            ) {
                self.login(self.account, self.password).then(function () {
                    headers['Cookie'] = self.cookie
                    fetchUrl()
                })
            } else {
                headers['Cookie'] = self.cookie
                fetchUrl()
            }
        }
        var fetchUrl = function () {
            try {
                axios
                    .get(
                        self.api +
                            '/portal/getNewVlcVideoPlayUrl.action?shareId=' +
                            shareId +
                            '&dt=1&fileId=' +
                            fileId +
                            '&type=4&key=noCache',
                        {
                            headers: headers,
                        }
                    )
                    .then(function (resp) {
                        if (resp.status !== 200 && self.index < 2) {
                            self.cookie = ''
                            self.index += 1
                            getUrl()
                            return
                        }

                        axios
                            .get(resp.data.normal.url, {
                                maxRedirects: 0, // 禁用自动重定向
                            })
                            .then(function (location) {
                                var link = ''
                                if (
                                    location.status >= 300 &&
                                    location.status < 400 &&
                                    location.headers.location
                                ) {
                                    link = location.headers.location
                                } else {
                                    link = resp.data.normal.url
                                }
                                self.index = 0
                                resolve(link)
                            })
                    })
            } catch (error) {
                if (
                    error.response &&
                    error.response.status === 400 &&
                    self.index < 2
                ) {
                    self.cookie = ''
                    self.index += 1
                    getUrl()
                } else {
                    console.error(
                        'Error during getShareUrl:',
                        error.message,
                        error.response ? error.response.status : 'N/A'
                    )
                    resolve()
                }
            } finally {
                if (self.index >= 2) {
                    self.index = 0 // 仅在达到最大重试次数后重置
                }
            }
        }
        getUrl()
    })
}

// 解析
function JieXi() {
    this.uzTag = ''
}

JieXi.isJieXiUrl = function (url) {
    return (
        url.includes('v.qq.com') ||
        url.includes('iqiyi.com') ||
        url.includes('youku.com') ||
        url.includes('mgtv.com') ||
        url.includes('bilibili.com')
    )
}

JieXi.prototype.getTypeName = function (url) {
    if (url.includes('v.qq.com')) {
        return 'TX'
    } else if (url.includes('iqiyi.com')) {
        return 'IQY'
    } else if (url.includes('youku.com')) {
        return 'YK'
    } else if (url.includes('mgtv.com')) {
        return 'MGTV'
    } else if (url.includes('bilibili.com')) {
        return 'Bili'
    } else {
        return '未知'
    }
}

JieXi.prototype.getVideoList = function (url) {
    var self = this
    return new Promise(function (resolve) {
        // 第一集$第一集的视频详情链接#第二集$第二集的视频详情链接$$$第一集$第一集的视频详情链接#第二集$第二集的视频详情链接
        var list = url.split('$$$')
        var videos = []
        for (var i = 0; i < list.length; i++) {
            var oneFrom = list[i]
            var fromName = self.getTypeName(oneFrom)
            var videoList = oneFrom.split('#')

            for (var j = 0; j < videoList.length; j++) {
                var element = videoList[j]
                var video = element.split('$')
                if (video.length === 2) {
                    var title = video[0]
                    var url = video[1]
                    videos.push({
                        name: title,
                        fromName: fromName,
                        panType: PanType.JieXi,
                        data: {
                            url: url,
                        },
                    })
                } else if (video[0] === url) {
                    videos.push({
                        name: '解析',
                        fromName: fromName,
                        panType: PanType.JieXi,
                        data: {
                            url: url,
                        },
                    })
                }
            }
        }

        resolve({
            videos: videos,
            //TODO: 推送只有一个链接的 获取视频名称 给 fileName
            fileName: self.fileName,
            error: '',
        })
    })
}

JieXi.prototype.getPlayUrl = function (data) {
    var self = this
    return new Promise(function (resolve) {
        var url = data.url
        // 格式：名称1@地址1;名称2@地址2
        getEnv(self.uzTag, '采集解析地址').then(function (allUrls) {
            if (allUrls.length < 1) {
                allUrls =
                    '钓鱼@http://8.129.30.117:8117/diaoyu.php?url=;乌贼@http://jx.dedyn.io/?url='
                setEnv(self.uzTag, '采集解析地址', allUrls).then(
                    processUrls
                )
            } else {
                processUrls()
            }

            function processUrls() {
                var jxLinks = allUrls.split(';')
                var urls = []
                var promises = jxLinks.map(function (element) {
                    return new Promise(function (res) {
                        var name = element.split('@')[0]
                        var api = element.split('@')[1]
                        req(api + url).then(function (response) {
                            if (response.code === 200) {
                                var item
                                try {
                                    item = JSON.parse(response.data)
                                } catch (error) {
                                    item = response.data
                                }
                                if (item) {
                                    for (var key in item) {
                                        if (
                                            item.hasOwnProperty(key)
                                        ) {
                                            var value = item[key]
                                            if (
                                                value &&
                                                typeof value ===
                                                    'string'
                                            ) {
                                                if (
                                                    value.includes(
                                                        'http'
                                                    ) &&
                                                    (value.includes(
                                                        'm3u8'
                                                    ) ||
                                                        value.includes(
                                                            'mp4'
                                                        ))
                                                ) {
                                                    urls.push({
                                                        url: value,
                                                        name: name,
                                                    })
                                                    continue
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            res()
                        })
                    })
                })
                Promise.all(promises).then(function () {
                    resolve({
                        urls: urls,
                        headers: {},
                    })
                })
            }
        })
    })
}

//MARK: 网盘扩展统一入口
/**
 * 网盘工具
 */
function PanTools() {
    //MARK: 1. 在这里初始化 对应网盘的具体实现对象

    this.quark = new QuarkUC(true)
    this.uc = new QuarkUC(false)
    this.ali = new Ali()
    this.pan123 = new Pan123()
    this.pan189 = new Pan189()
    this.jieXi = new JieXi()

    /**
     * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
     */
    this._uzTag = ''
}

/**
 * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
 */
Object.defineProperty(PanTools.prototype, 'uzTag', {
    set: function (value) {
        this._uzTag = value
        this.quark.uzTag = value
        this.uc.uzTag = value
        this.ali.uzTag = value
        this.pan123.uzTag = value
        this.pan189.uzTag = value
        this.jieXi.uzTag = value

        this.registerRefreshAllCookie()
        this.getAllCookie()
        this.setSaveDirName()
    },
    get: function () {
        return this._uzTag
    },
})

/**
 * 获取 夸克 UC cookie  ** 无法在 PanTools 外部操作**
 * 环境变量 key 为 PanType.xx + "Cookie",请在 json 文件中添加
 * @param {PanType} panType
 * @returns {Promise<string>}
 */
PanTools.prototype.getQuarkUCCookie = function (panType) {
    var self = this
    return new Promise(function (resolve) {
        self.getPanEnv(panType + 'Cookie').then(function (cookie) {
            resolve(cookie)
        })
    })
}

/**
 * 更新 夸克 UC cookie ** 无法在 PanTools 外部操作**
 * @param {PanType} panType
 * @param {string} cookie
 */
PanTools.prototype.updateQuarkUCCookie = function (panType, cookie) {
    var self = this
    return new Promise(function (resolve) {
        self.setPanEnv(panType + 'Cookie', cookie).then(resolve)
    })
}

/**
 * 获取 Alitoken  ** 无法在 PanTools 外部操作**
 * 环境变量 key 为 PanType.xx + keyWord关键字,请在 json 文件中添加
 * @param {PanType} panType
 * @returns {Promise<string>}
 */
PanTools.prototype.getAliDataEnv = function (panType) {
    var self = this
    return new Promise(function (resolve) {
        self.getPanEnv(panType + 'Token').then(function (token) {
            resolve(token)
        })
    })
}

/**
 * 更新 Alitoken  ** 无法在 PanTools 外部操作**
 * @param {PanType} panType
 * @param {string} data
 */
PanTools.prototype.updateAliDataEnv = function (panType, token) {
    var self = this
    return new Promise(function (resolve) {
        self.setPanEnv(panType + 'Token', token).then(resolve)
    })
}

/**
 * 统一获取环境变量
 * @param {string} envKey
 * @returns
 */
PanTools.prototype.getPanEnv = function (envKey) {
    var self = this
    return new Promise(function (resolve) {
        getEnv(self.uzTag, envKey).then(function (env) {
            resolve(env)
        })
    })
}

/**
 * 统一设置环境变量
 * @param {string} envKey
 * @param {string} envValue
 * @returns
 */
PanTools.prototype.setPanEnv = function (envKey, envValue) {
    var self = this
    return new Promise(function (resolve) {
        setEnv(self.uzTag, envKey, envValue).then(resolve)
    })
}

PanTools.prototype.registerRefreshAllCookie = function () {
    //MARK: 1.1 请实现 refreshCookie
    var that = this
    /// 更新 Quark cookie
    this.quark.updateCookie = function () {
        that.updateQuarkUCCookie(PanType.Quark, this.cookie)
    }
    /// 更新 UC cookie
    this.uc.updateCookie = function () {
        that.updateQuarkUCCookie(PanType.UC, this.cookie)
    }
    /// 更新 Ali token
    this.ali.updateToken = function () {
        that.updateAliDataEnv(PanType.Ali, this.ali.token)
    }
}

PanTools.prototype.getAllCookie = function () {
    var self = this
    return new Promise(function (resolve) {
        //MARK: 1.2 请给 cookie 赋值
        self.getQuarkUCCookie(PanType.Quark).then(function (quarkCookie) {
            self.quark.cookie = quarkCookie || ''

            self.getQuarkUCCookie(PanType.UC).then(function (ucCookie) {
                self.uc.cookie = ucCookie || ''

                self.getAliDataEnv(PanType.Ali).then(function (aliCookie) {
                    self.ali.token = aliCookie || ''

                    self.getPanEnv(PanType.Pan123 + '账号').then(
                        function (passport) {
                            self.pan123.passport = passport || ''

                            self.getPanEnv(PanType.Pan123 + '密码').then(
                                function (password) {
                                    self.pan123.password = password || ''

                                    self.getPanEnv(
                                        PanType.Pan189 + '账号'
                                    ).then(function (account) {
                                        self.pan189.account = account || ''

                                        self.getPanEnv(
                                            PanType.Pan189 + '密码'
                                        ).then(function (password) {
                                            self.pan189.password =
                                                password || ''
                                            resolve()
                                        })
                                    })
                                }
                            )
                        }
                    )
                })
            })
        })
    })
}

/**
 * 设置用户指定的转存文件夹名称
 */
PanTools.prototype.setSaveDirName = function () {
    var self = this
    return new Promise(function (resolve) {
        getEnv(self.uzTag, '转存文件夹名称').then(function (dirName) {
            if (dirName == null || dirName === '') {
                dirName = 'uz影视'
                setEnv(self.uzTag, '转存文件夹名称', dirName).then(
                    function () {
                        setNames()
                        resolve()
                    }
                )
            } else {
                setNames()
                resolve()
            }
            function setNames() {
                //MARK: 2. 请补充自定义转存文件夹名称
                self.quark.saveDirName = dirName
                self.uc.saveDirName = dirName
                self.ali.saveDirName = dirName
            }
        })
    })
}

/**
 * 清理转存文件夹
 */
PanTools.prototype.cleanSaveDir = function () {
    var self = this
    return new Promise(function (resolve) {
        //MARK: 3. 请实现清理转存文件夹
        self.quark.clearSaveDir().then(function () {
            self.uc.clearSaveDir().then(function () {
                self.ali.clearSaveDir().then(resolve)
            })
        })
    })
}

/**
 * 获取网盘资源列表
 * @param {string} shareUrl
 * @returns {Promise<PanListDetail>}
 */
PanTools.prototype.getShareVideos = function (shareUrl) {
    var self = this
    return new Promise(function (resolve) {
        //MARK: 4. 请实现获取网盘资源列表
        if (shareUrl.includes('https://pan.quark.cn')) {
            self.quark.getFilesByShareUrl(shareUrl).then(function (data) {
                resolve(JSON.stringify(data))
            })
        } else if (shareUrl.includes('https://drive.uc.cn')) {
            shareUrl = shareUrl.split('?')[0]
            self.uc.getFilesByShareUrl(shareUrl).then(function (data) {
                resolve(JSON.stringify(data))
            })
        } else if (shareUrl.includes('https://www.alipan.com')) {
            self.ali.getFilesByShareUrl(shareUrl).then(function (data) {
                resolve(JSON.stringify(data))
            })
        } else if (self.pan123.getShareData(shareUrl) != null) {
            self.pan123.getFilesByShareUrl(shareUrl).then(function (data) {
                resolve(JSON.stringify(data))
            })
        } else if (shareUrl.includes('189.cn')) {
            self.pan189.getShareData(shareUrl).then(function (data) {
                resolve(JSON.stringify(data))
            })
        } else if (JieXi.isJieXiUrl(shareUrl)) {
            self.jieXi.getVideoList(shareUrl).then(function (data) {
                resolve(JSON.stringify(data))
            })
        } else {
            var data = new PanListDetail()
            data.error = ''
            resolve(JSON.stringify(data))
        }
    })
}

/**
 * 获取播放信息
 * @param {PanVideoItem} item
 * @returns {Promise<PanPlayInfo>}
 */
PanTools.prototype.getPlayInfo = function (item) {
    var self = this
    return new Promise(function (resolve) {
        //MARK: 5. 请实现获取播放信息
        self.getAllCookie().then(function () {
            if (item.panType === PanType.Quark) {
                self.quark.getPlayUrl(item.data).then(function (data) {
                    resolve(JSON.stringify(data))
                })
            } else if (item.panType === PanType.UC) {
                self.uc.getPlayUrl(item.data).then(function (data) {
                    resolve(JSON.stringify(data))
                })
            } else if (item.panType === PanType.Ali) {
                self.ali.getPlayUrl(item.data).then(function (data) {
                    resolve(JSON.stringify(data))
                })
            } else if (item.panType === PanType.Pan123) {
                self.pan123.getPlayUrl(item.data).then(function (data) {
                    resolve(JSON.stringify(data))
                })
            } else if (item.panType === PanType.Pan189) {
                self.pan189.getPlayUrl(item.data).then(function (data) {
                    resolve(JSON.stringify(data))
                })
            } else if (item.panType === PanType.JieXi) {
                self.jieXi.getPlayUrl(item.data).then(function (data) {
                    resolve(JSON.stringify(data))
                })
            } else {
                var data = new PanPlayInfo()
                data.error = '暂不支持 ' + item.panType + ' 网盘~'
                resolve(JSON.stringify(data))
            }
        })
    })
}

//MARK: - 伪挂载相关  分页大小建议为200

/**
 * 返回支持挂载的网盘
 * @returns {Promise<[PanMount]>}
 */
PanTools.prototype.getSupportMountPan = function () {
    var self = this
    return new Promise(function (resolve) {
        self.getAllCookie().then(function () {
            self.ali.oneKeyReady().then(function () {
                var x = formatBackData([
                    new PanMount(
                        'UC',
                        PanType.UC,
                        self.uc.cookie !== ''
                    ),
                    new PanMount(
                        'Quark',
                        PanType.Quark,
                        self.quark.cookie !== ''
                    ),
                    new PanMount(
                        '阿里盘',
                        PanType.Ali,
                        self.ali.token !== ''
                    ),
                ])

                resolve(x)
            })
        })
    })
}

/**
 * 获取网盘根目录
 * @param {PanType} panType
 * @returns {Promise<{data:[PanMountListData],error:string}>}
 */
PanTools.prototype.getRootDir = function (panType) {
    var self = this
    return new Promise(function (resolve) {
        var list = []
        try {
            if (panType == PanType.Quark) {
                self.quark
                    .getFileList({
                        pdir_fid: '0',
                        page: 1,
                    })
                    .then(function (result) {
                        list = result
                        resolve(formatBackData({ data: list, error: '' }))
                    })
            } else if (panType == PanType.UC) {
                self.uc
                    .getFileList({
                        pdir_fid: '0',
                        page: 1,
                    })
                    .then(function (result) {
                        list = result
                        resolve(formatBackData({ data: list, error: '' }))
                    })
            } else if (panType == PanType.Ali) {
                self.ali
                    .getFileList({
                        args: null,
                        isRoot: true,
                        page: 1,
                    })
                    .then(function (result) {
                        list = result
                        resolve(formatBackData({ data: list, error: '' }))
                    })
            }
        } catch (error) {
            resolve(formatBackData({ data: list, error: '' }))
        }
    })
}

/**
 * 获取网盘挂载子目录
 * @param {object} args
 * @param {PanMountListData} args.data
 * @param {number} args.page
 * @returns {Promise<{data:[PanMountListData],error:string}>}
 */
PanTools.prototype.getMountDir = function (args) {
    var self = this
    return new Promise(function (resolve) {
        var list = []
        try {
            if (args.data.panType == PanType.Quark) {
                self.quark
                    .getFileList({
                        pdir_fid: args.data.data.fid,
                        page: args.page,
                    })
                    .then(function (result) {
                        list = result
                        resolve(formatBackData({ data: list, error: '' }))
                    })
            } else if (args.data.panType == PanType.UC) {
                self.uc
                    .getFileList({
                        pdir_fid: args.data.data.fid,
                        page: args.page,
                    })
                    .then(function (result) {
                        list = result
                        resolve(formatBackData({ data: list, error: '' }))
                    })
            } else if (args.data.panType == PanType.Ali) {
                self.ali
                    .getFileList({
                        args: args.data,
                        isRoot: false,
                        page: args.page,
                    })
                    .then(function (result) {
                        list = result
                        resolve(formatBackData({ data: list, error: '' }))
                    })
            }
        } catch (error) {
            resolve(formatBackData({ data: list, error: '' }))
        }
    })
}

/**
 * 获取网盘挂载文件真实地址
 * @param {PanMountListData} args
 * @returns {Promise<PanPlayInfo>}
 */
PanTools.prototype.getMountFile = function (args) {
    var self = this
    return new Promise(function (resolve) {
        var playData = new PanPlayInfo()

        try {
            if (args.panType == PanType.Quark) {
                if (args.dataType == PanDataType.Video) {
                    self.quark
                        .getVideoPlayUrl({
                            fileId: args.data.fid,
                            isMount: true,
                        })
                        .then(function (urls) {
                            playData.urls = urls
                            finalize()
                        })
                } else if (args.dataType == PanDataType.Unknown) {
                    self.quark
                        .getDownload({
                            fileId: args.data.fid,
                            isMount: true,
                        })
                        .then(function (urls) {
                            playData.urls = urls
                            finalize()
                        })
                }
                playData.playHeaders = self.quark.playHeaders
            } else if (args.panType == PanType.UC) {
                if (args.dataType == PanDataType.Video) {
                    self.uc
                        .getVideoPlayUrl({
                            fileId: args.data.fid,
                            isMount: true,
                        })
                        .then(function (urls) {
                            playData.urls = urls
                            finalize()
                        })
                } else if (args.dataType == PanDataType.Unknown) {
                    self.uc
                        .getDownload({
                            fileId: args.data.fid,
                            isMount: true,
                        })
                        .then(function (urls) {
                            playData.urls = urls
                            finalize()
                        })
                }
                playData.playHeaders = self.uc.playHeaders
            } else if (args.panType == PanType.Ali) {
                if (args.dataType == PanDataType.Video) {
                    self.ali
                        .getDownload({
                            fileId: args.data.file_id,
                            isMount: true,
                        })
                        .then(function (rawUrls) {
                            self.ali
                                .getLiveTranscoding({
                                    fileId: args.data.file_id,
                                    isMount: true,
                                })
                                .then(function (liveUrls) {
                                    playData.urls = [].concat(
                                        rawUrls,
                                        liveUrls
                                    )
                                    finalize()
                                })
                        })
                } else if (args.dataType == PanDataType.Unknown) {
                    self.ali
                        .getDownload({
                            fileId: args.data.file_id,
                            isMount: true,
                        })
                        .then(function (urls) {
                            playData.urls = urls
                            finalize()
                        })
                }
                playData.playHeaders = self.ali.playHeaders
            }
        } catch (error) {
            playData.error = error.toString()
            resolve(formatBackData(playData))
        }

        function finalize() {
            if (playData.urls && playData.urls.length > 0) {
                playData.urls.sort(function (a, b) {
                    return b.priority - a.priority
                })
                playData.url = playData.urls[0].url
            }
            resolve(formatBackData(playData))
        }
    })
}

// 固定实例名称
var uzPanToolsInstance = new PanTools()
