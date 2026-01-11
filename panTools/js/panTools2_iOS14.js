//@name:夸克|UC|天翼|123|百度|移动|pikpak|115|解析
//@version:1
//@remark:iOS 14 及以下版本专用
//@env:百度网盘Cookie##用于播放百度网盘视频&&UCCookie##用于播放UC网盘视频&&UC_Token##UC网盘 Open API Token（可选，优先使用）&&夸克Cookie##用于播放Quark网盘视频&&转存文件夹名称##在各网盘转存文件时使用的文件夹名称&&123网盘账号##用于播放123网盘视频&&123网盘密码##用于播放123网盘视频&&天翼网盘账号##用于播放天翼网盘视频&&天翼网盘密码##用于播放天翼网盘视频&&115Cookie##用于播放115网盘视频&&PikPakToken##用于存储登录信息,Bearer 开头&&采集解析地址##内置两个，失效不要反馈。格式：名称1@地址1;名称2@地址2
//@order: B

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
 */
const PanType = {
    XXX: 'xxx网盘',
}

/**
 * 播放信息
 **/
class PanPlayInfo {
    constructor(url = '', error = '', playHeaders = {}, urls = []) {
        /**
         * 播放地址，优先取 urls, 如果 urls 为空，取该值
         * @type {string}
         */
        this.url = url
        this.error = error
        this.playHeaders = playHeaders

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
        this.urls = urls
    }
}

/**
 * 网盘视频项
 */
class PanVideoItem {
    constructor() {
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
        this.panType = PanType.XXX

        /**
         * 关键数据 用于获取播放信息时
         * @type {Object}
         */
        this.data
    }
}

/**
 * 网盘播放列表
 */
class PanListDetail {
    constructor() {
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
}

/**
 * 网盘挂载 类型
 */
class PanMount {
    constructor(name = '', panType = PanType.UC, isLogin = false) {
        /**
         * 网盘展示名称
         */
        this.name = name

        /**
         * 网盘类型
         * @type {PanType}
         */
        this.panType = panType

        /**
         * 是否已登录,未登录不展示 主要是判断是否存在 cookie ，用于快速展示入口
         * @type {boolean}
         */
        this.isLogin = isLogin
    }
}

/**
 * 网盘数据类型，目前只支持视频和目录
 * @type {{Video: string, Dir: string}}
 **/
const PanDataType = {
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
class PanMountListData {
    constructor(
        name = '',
        panType = PanType.XXX,
        dataType = PanDataType.Dir,
        data = {},
        remark = ''
    ) {
        /**
         * 列表展示名称
         */
        this.name = name
        /**
         * 网盘类型
         * @type {PanDataType}
         */
        this.panType = panType

        /**
         * 备注信息，如 文件大小
         */
        this.remark = ''
        /**
         * 数据类型
         * @type {PanDataType}
         */
        this.dataType = dataType
        /**
         * 关键数据
         * @type {Object}
         */
        this.data = data
    }
}

let panSubClasses = []

/**
 * 网盘工具
 */
class PanTools {
    constructor() {
        /**
         * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
         */
        this._uzTag = ''
        this.panToolsHandlers = []
        this._isInitSuccess = false
    }

    /**
     * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
     */
    set uzTag(value) {
        this._uzTag = value
        this.initHandlers()
    }

    get uzTag() {
        return this._uzTag
    }

    async initHandlers() {
        var dirName = await getEnv(this.uzTag, '转存文件夹名称')
        if (dirName == null || dirName === '') {
            dirName = 'uz影视'
            await setEnv(this.uzTag, '转存文件夹名称', dirName)
        }
        for (let i = 0; i < panSubClasses.length; i++) {
            try {
                let handler = await panSubClasses[i].getInstance({
                    uzTag: this.uzTag,
                    saveDirName: dirName,
                })
                handler.uzTag = this.uzTag
                this.panToolsHandlers.push(handler)
            } catch (error) {}
        }
        this._isInitSuccess = true
    }

    async checkState() {
        if (this._isInitSuccess) {
            return true
        }

        for (let i = 0; i < 20; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            if (this._isInitSuccess) {
                return true
            }
        }
        toast({
            msg: '初始化超时～',
            type: ToastType.error,
        })
        return false
    }

    /**
     * 清理转存文件夹
     */
    async cleanSaveDir() {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                await this.panToolsHandlers[i].clearPanSaveDir()
            } catch (error) {}
        }
    }

    /**
     * 是否可以解析
     * @param {string} url
     * @returns {{can:boolean,panType:string}} {can:是否可以解析,panType:网盘类型}
     */
    async canParse(url) {
        await this.checkState()
        let data = {
            can: false,
            panType: '',
        }
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let can = await this.panToolsHandlers[i].canParse({
                    url: url,
                })
                if (can) {
                    data.can = true
                    data.panType = this.panToolsHandlers[i].getPanType()
                }
            } catch (error) {}
        }
        return formatBackData(data)
    }

    /**
     * 获取网盘类型列表
     * @returns {{panTypes:string[]}}
     */
    async getPanTypes() {
        await this.checkState()
        let panTypes = []
        let data = { panTypes: panTypes }
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                panTypes.push(this.panToolsHandlers[i].getPanType())
            } catch (error) {}
        }
        data.panTypes = panTypes
        return formatBackData(data)
    }

    /**
     * 获取网盘资源列表
     * @param {string} shareUrl
     * @returns {@Promise<PanListDetail>}
     */
    async getShareVideos(shareUrl) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let can = await this.panToolsHandlers[i].canParse({
                    url: shareUrl,
                })
                if (can) {
                    let data = await this.panToolsHandlers[i].parseShareUrl({
                        url: shareUrl,
                    })
                    return formatBackData(data)
                }
            } catch (error) {}
        }

        let data = new PanListDetail()
        return formatBackData(data)
    }

    /**
     * 获取播放信息
     * @param {PanVideoItem} item
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPlayInfo(item) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let panType = await this.panToolsHandlers[i].getPanType()
                if (panType == item.panType) {
                    let data = await this.panToolsHandlers[i].parseVideo(item)
                    return formatBackData(data)
                }
            } catch (error) {
                return formatBackData({ error: error.toString() })
            }
        }
        const data = new PanPlayInfo()
        data.error = '暂不支持 ' + item.panType + ' ~'
        return formatBackData(data)
    }

    //MARK: - 伪挂载相关  分页大小建议为200

    /**
     * 返回支持挂载的网盘
     * @returns {@Promise<[PanMount]>}
     */
    async getSupportMountPan() {
        await this.checkState()
        let list = []

        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let item = await this.panToolsHandlers[i].supportPanMount()
                if (item) {
                    list.push(item)
                }
            } catch (error) {}
        }

        return formatBackData(list)
    }

    /**
     * 获取网盘根目录
     * @param {PanType} panType
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getRootDir(panType) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                if (panType === this.panToolsHandlers[i].getPanType()) {
                    let item = await this.panToolsHandlers[
                        i
                    ].getPanMountRootDir(panType)
                    if (item) {
                        return formatBackData(item)
                    }
                }
            } catch (error) {}
        }

        return formatBackData({ data: [], error: '' })
    }

    /**
     * 获取网盘挂载子目录
     * @param {object} args
     * @param {PanMountListData} args.data
     * @param {number} args.page
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getMountDir(args) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                if (
                    args.data.panType === this.panToolsHandlers[i].getPanType()
                ) {
                    let item = await this.panToolsHandlers[i].getPanMountSubDir(
                        {
                            data: args.data.data,
                            page: args.page,
                        }
                    )
                    if (item) {
                        return formatBackData(item)
                    }
                }
            } catch (error) {}
        }
        return formatBackData({ data: [], error: '' })
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData} args
     * @returns {@Promise<PanPlayInfo>}
     */
    async getMountFile(args) {
        await this.checkState()
        let playData = new PanPlayInfo()

        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                if (args.panType === this.panToolsHandlers[i].getPanType()) {
                    let item = await this.panToolsHandlers[i].getPanMountFile(
                        args.data
                    )
                    if (item) {
                        return formatBackData(item)
                    }
                }
            } catch (error) {}
        }

        return formatBackData(playData)
    }
}

// 固定实例名称
const uzPanToolsInstance = new PanTools()

// ignore
// 不支持导出，这里的代码运行时会被移除
export {
    PanType,
    PanPlayInfo,
    PanVideoItem,
    PanListDetail,
    PanMount,
    PanDataType,
    PanMountListData,
}
// ignore

//### 放在最后，保持这里不变，parse-metadata.cjs 合并替换代码需要 ###
//### 放在最后，保持这里不变，parse-metadata.cjs 合并替换代码需要 ###
//### 放在最后，保持这里不变，parse-metadata.cjs 合并替换代码需要 ###
//### 替换识别文本 ### uzVideo-Ext-Sub ###



// MARK: baidu.js
// 请勿直接修改，请修改 baidu.js 文件
// prettier-ignore


// baidu云盘
// 抄自 https://github.com/hjdhnx/drpy-node/
class PanBaidu {
    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanBaidu>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new PanBaidu()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @returns
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @param {String} value
     * @returns
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }
    /**
     * 是否支持挂载
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例的Promise对象
     */
    async supportPanMount() {
        // MARK: 推荐实现
        return null
    }

    /**
     * 获取网盘根目录
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountRootDir() {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘子目录
     * @param {object} args
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @param {number} args.page 页码
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountSubDir(args) {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPanMountFile(args) {
        // MARK: 推荐实现
        return new PanPlayInfo()
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        return '百度'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回一个 Promise，resolve 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        if (args.url.includes('pan.baidu.com')) {
            return true
        } else {
            return false
        }
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        await this.initBaidu()
        return await this.getFilesByShareUrl(args.url)
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        await this.initBaidu()
        return await this.getPlayUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // 调用清除保存目录的方法
        // await this.clearSaveDir()
    }

    ////////////////////////////////////////
    constructor() {
        /**
         * 运行时标识符，会自动赋值一次，请勿修改
         */
        this.uzTag = ''

        // 初始化百度云盘处理类
        this.cookie = ''
        this.regex = /https:\/\/pan\.baidu\.com\/s\/([^\\|#/]+)/
        this.baseHeader = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept-Encoding': 'gzip',
            Referer: 'https://pan.baidu.com',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        this.apiUrl = 'https://pan.baidu.com/'
        this.shareTokenCache = {}
        this.subtitleExts = ['.srt', '.ass', '.scc', '.stl', '.ttml']
        this.subvideoExts = [
            '.mp4',
            '.mkv',
            '.avi',
            '.rmvb',
            '.mov',
            '.flv',
            '.wmv',
            '.webm',
            '.3gp',
            '.mpeg',
            '.mpg',
            '.ts',
            '.mts',
            '.m2ts',
            '.vob',
            '.divx',
            '.xvid',
            '.m4v',
            '.ogv',
            '.f4v',
            '.rm',
            '.asf',
            '.dat',
            '.dv',
            '.m2v',
        ]
    }

    async initBaidu() {
        if (this.cookie.length < 1) {
            this.cookie = await this.getPanEnv('百度网盘Cookie')
        }
    }

    getShareData(url) {
        // 解析分享链接获取分享ID和密码
        try {
            url = decodeURIComponent(url).replace(/\s+/g, '')

            let shareId = ''
            let sharePwd = ''
            const match = url.match(
                /pan\.baidu\.com\/(s\/|wap\/init\?surl=)([^?&#]+)/
            )
            if (!match) {
                return null
            }
            shareId = match[2].replace(/^1+/, '').split('?')[0].split('#')[0]
            if (!shareId) {
                return null
            }
            const pwdMatch = url.match(/(提取码|密码|pwd)=([^&\s]{4})/i)
            sharePwd = pwdMatch ? pwdMatch[2] : ''
            return { shareId, sharePwd }
        } catch (error) {
            return null
        }
    }

    async getDirectPlayUrl(uk, shareid, fsid, randsk) {
        // 获取原画直链地址（更稳定的播放方式）
        try {
            const uid = await this.getUid()
            if (!uid) {
                return null
            }

            const headers = {
                'User-Agent': 'netdisk;P2SP;2.2.91.136;android-android;',
                Cookie: this.cookie,
            }

            const devuid = '73CED981D0F186D12BC18CAE1684FFD5|VSRCQTF6W'
            const time = String(Date.now())
            const bduss = (this.cookie.match(/BDUSS=([^;]+)/) || [])[1]

            if (!bduss) {
                return null
            }

            // 生成签名 - 完全按照 baidu.js 的实现
            const rand = this.sha1(
                this.sha1(bduss) +
                    uid +
                    'ebrcUYiuxaZv2XGu7KIYKxUrqfnOfpDF' +
                    time +
                    devuid +
                    '11.30.2ae5821440fab5e1a61a025f014bd8972'
            )

            const apiPath = `share/list?shareid=${shareid}&uk=${uk}&fid=${fsid}&sekey=${randsk}&origin=dlna&devuid=${devuid}&clienttype=1&channel=android_12_zhao_bd-netdisk_1024266h&version=11.30.2&time=${time}&rand=${rand}`

            const response = await this.api(apiPath, {}, headers, 'get')

            if (
                response.errno === 0 &&
                response.list &&
                response.list.length > 0
            ) {
                return response.list[0].dlink
            }

            return null
        } catch (error) {
            return null
        }
    }

    sha1(message) {
        // SHA1 哈希函数 - 完全按照 baidu.js 的实现
        return Crypto.SHA1(message).toString()
    }

    async getUid() {
        // 获取用户ID - 完全按照 baidu.js 的实现
        try {
            const response = await axios.get(
                'https://mbd.baidu.com/userx/v1/info/get?appname=baiduboxapp&fields=%20%20%20%20%20%20%20%20%5B%22bg_image%22,%22member%22,%22uid%22,%22avatar%22,%20%22avatar_member%22%5D&client&clientfrom&lang=zh-cn&tpl&ttt',
                {
                    headers: {
                        'User-Agent': this.baseHeader['User-Agent'],
                        Cookie: this.cookie,
                    },
                }
            )
            return response.data &&
                response.data.data &&
                response.data.data.fields
                ? response.data.data.fields.uid
                : null
        } catch (error) {
            return null
        }
    }

    async api(url, data = {}, headers = {}, method = 'post', retry = 3) {
        // 发送API请求
        const objectToQuery = (obj) => {
            return Object.entries(obj)
                .filter(([_, value]) => value !== undefined && value !== null)
                .map(
                    ([key, value]) =>
                        `${encodeURIComponent(key)}=${encodeURIComponent(
                            value
                        )}`
                )
                .join('&')
        }

        const fullUrl = `${this.apiUrl}${url}`
        headers = { ...this.baseHeader, ...headers, Cookie: this.cookie || '' }
        let resp

        try {
            if (method === 'get') {
                const query = objectToQuery(data)
                const finalUrl = query ? `${fullUrl}?${query}` : fullUrl
                resp = await axios.get(finalUrl, { headers })
            } else {
                resp = await axios.post(fullUrl, data, { headers })
            }
        } catch (err) {
            resp = err.response || { status: 500, data: { error: '请求失败' } }
        }

        if ([429, 503].includes(resp.status) && retry > 0) {
            const waitTime = (3 - retry + 1) * 1000
            await this.delay(waitTime)
            return this.api(url, data, headers, method, retry - 1)
        }

        return resp.data !== undefined ? resp.data : resp
    }

    // 新增验证分享链接的函数
    async verifyShare(shareData) {
        try {
            const shareVerify = await this.api(
                `share/verify?t=${Date.now()}&surl=${shareData.shareId}`,
                {
                    pwd: shareData.sharePwd || '',
                },
                { Cookie: this.cookie },
                'post'
            )

            if (shareVerify.errno !== 0) {
                if (shareVerify.errno === -62 || shareVerify.errno === -9) {
                    console.log('提取码错误')
                }
                console.log('验证提取码失败')
            }

            // 更新cookie中的BDCLND
            if (shareVerify.randsk) {
                let cookie = this.cookie.replace(/BDCLND=[^;]*;?\s*/g, '')
                if (cookie.length > 0 && !cookie.endsWith(';')) cookie += '; '
                cookie += `BDCLND=${shareVerify.randsk}`
                this.cookie = cookie
                await this.updatePanEnv('百度网盘Cookie', cookie)
                console.log('已更新randsk到cookie中的BDCLND')
            }

            return shareVerify
        } catch (error) {
            console.log('验证分享链接失败:', error.message)
            throw error
        }
    }

    async getShareToken(shareData) {
        // 先检查缓存，存在则直接返回
        // if (this.shareTokenCache[shareData.shareId]) {
        //     return this.shareTokenCache[shareData.shareId]
        // }

        // 缓存不存在时，执行获取令牌的逻辑
        try {
            // 等待验证完成
            const shareVerify = await this.verifyShare(shareData)

            // 验证完成后，执行获取文件列表的逻辑
            const headers = { ...this.baseHeader, Cookie: this.cookie || '' }

            const listData = await this.api(
                `share/list`,
                {
                    shorturl: shareData.shareId,
                    root: 1,
                    page: 1,
                    num: 100,
                },
                { headers },
                'get'
            )

            if (listData.errno !== 0) {
                if (listData.errno === -9) {
                    console.log('提取码错误')
                }
                console.log('获取文件列表失败')
            }

            // 设置缓存
            this.shareTokenCache[shareData.shareId] = {
                ...shareVerify,
                list: listData.list,
                uk: listData.uk || listData.share_uk,
                shareid: listData.share_id || shareVerify.share_id,
                randsk: shareVerify.randsk,
                sign:
                    listData.sign ||
                    this.generateSign(shareData.shareId, shareData.sharePwd),
                timestamp: listData.timestamp || Date.now(),
            }

            return this.shareTokenCache[shareData.shareId]
        } catch (error) {
            console.log('获取分享token失败:', error.message)
            throw error
        }
    }

    generateSign(shareId, sharePwd) {
        const CryptoJS = Crypto
        // 生成签名
        const timestamp = Date.now()
        const str = `${shareId}${sharePwd}${timestamp}${this.cookie || ''}`
        return CryptoJS.MD5(str).toString()
    }

    async getFilesByShareUrl(shareInfo) {
        // 获取分享链接中的文件列表
        const shareData =
            typeof shareInfo === 'string'
                ? this.getShareData(shareInfo)
                : shareInfo
        if (!shareData) return { videos: [] }

        // 确保验证和获取令牌完成后再继续
        await this.getShareToken(shareData)
        if (!this.shareTokenCache[shareData.shareId]) return { videos: [] }

        const cachedData = await this.shareTokenCache[shareData.shareId]
        const videos = []
        const subtitles = []

        const processDirectory = async (
            dirPath,
            dirFsId,
            parentDrpyPath = ''
        ) => {
            const shareDir = `/sharelink${cachedData.shareid}-${dirFsId}${dirPath}`
            const headers = { ...this.baseHeader, Cookie: this.cookie || '' }

            const dirListData = await this.api(
                `share/list`,
                {
                    sekey: cachedData.randsk,
                    uk: cachedData.uk,
                    shareid: cachedData.shareid,
                    page: 1,
                    num: 100,
                    dir: shareDir,
                },
                headers,
                'get'
            )
            if (dirListData.errno !== 0 || !dirListData.list) {
                return
            }

            for (const item of dirListData.list) {
                if (item.isdir === 1 || item.isdir === '1') {
                    const subDirPath = `${dirPath}/${item.server_filename}`
                    const subDrpyPath = `${parentDrpyPath}/${item.server_filename}`
                    await processDirectory(subDirPath, item.fs_id, subDrpyPath)
                } else {
                    const ext = item.server_filename
                        .substring(item.server_filename.lastIndexOf('.') || 0)
                        .toLowerCase()
                    const fileInfo = {
                        fid: item.fs_id,
                        file_name: item.server_filename,
                        size: item.size,
                        path: parentDrpyPath,
                        file: true,
                    }

                    if (this.subvideoExts.includes(ext)) {
                        videos.push(fileInfo)
                    } else if (this.subtitleExts.includes(ext)) {
                        subtitles.push(fileInfo)
                    }
                }
            }
        }

        if (cachedData.list) {
            for (const item of cachedData.list) {
                if (item.isdir === 1 || item.isdir === '1') {
                    const dirPath = `/${item.server_filename}`
                    const drpyPath = `/${item.server_filename}`
                    await processDirectory(dirPath, item.fs_id, drpyPath)
                } else {
                    const ext = item.server_filename
                        .substring(item.server_filename.lastIndexOf('.') || 0)
                        .toLowerCase()
                    const fileInfo = {
                        fid: item.fs_id,
                        file_name: item.server_filename,
                        size: item.size,
                        path: '',
                        file: true,
                    }

                    if (this.subvideoExts.includes(ext)) {
                        videos.push(fileInfo)
                    } else if (this.subtitleExts.includes(ext)) {
                        subtitles.push(fileInfo)
                    }
                }
            }
        }

        const getBaseName = (fileName) => {
            const lastDotIndex = fileName.lastIndexOf('.')
            return lastDotIndex === -1
                ? fileName
                : fileName.slice(0, lastDotIndex)
        }

        const subtitleMap = new Map()
        subtitles.forEach((sub) => {
            const baseName = getBaseName(sub.file_name)
            if (!subtitleMap.has(baseName)) {
                subtitleMap.set(baseName, [])
            }
            subtitleMap.get(baseName).push(sub)
        })

        const videosWithSubtitles = videos.map((video) => ({
            ...video,
            subtitles: subtitleMap.get(getBaseName(video.file_name)) || [],
        }))

        let panVideos = []
        for (let index = 0; index < videosWithSubtitles.length; index++) {
            const element = videosWithSubtitles[index]
            let size =
                (element.size !== undefined && element.size !== null
                    ? element.size
                    : 0) /
                1024 /
                1024
            let unit = 'MB'
            if (size >= 1000) {
                size = size / 1024
                unit = 'GB'
            }
            size = size.toFixed(1)
            const remark = `[${size}${unit}]`
            element.shareId = shareData.shareId
            panVideos.push({
                name: element.file_name,
                panType: this.getPanType(),
                remark: remark,
                data: element,
            })
        }

        return { videos: panVideos }
    }

    async getPlayUrl(data) {
        // 直接获取原画播放地址，无需转存
        if (!this.cookie) {
            return {
                urls: [],
                error: '请在环境变量中添加百度网盘Cookie',
            }
        }

        try {
            // 从缓存中获取分享信息
            const cachedData = this.shareTokenCache[data.shareId]
            if (!cachedData) {
                return {
                    urls: [],
                    error: '未找到分享信息，请重新获取文件列表',
                }
            }

            // 获取原画直链
            const directUrl = await this.getDirectPlayUrl(
                cachedData.uk,
                cachedData.shareid,
                data.fid,
                cachedData.randsk
            )

            if (!directUrl) {
                return {
                    urls: [],
                    error: '获取播放地址失败',
                }
            }

            return {
                urls: [
                    {
                        name: '原画',
                        url: directUrl,
                        headers: {
                            'User-Agent':
                                'netdisk;P2SP;2.2.91.136;android-android;',
                            Referer: 'https://pan.baidu.com',
                        },
                    },
                ],
            }
        } catch (error) {
            return {
                urls: [],
                error: error.toString(),
            }
        }
    }
}

panSubClasses.push(PanBaidu)

// MARK: common.js
// 请勿直接修改，请修改 common.js 文件
// prettier-ignore
function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))
}
function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))
}
class axios {
    /**
     * 发送请求
     * @param {object} config 请求配置
     * @returns {Promise<ProData>}
     */
    static async request(config) {
        let {
            url,
            method = 'GET',
            headers = {},
            data,
            params,
            responseType,
            addressType,
            maxRedirects,
        } = config

        let options = {
            method,
            headers,
            data,
            queryParameters: params,
            responseType,
            addressType,
            maxRedirects,
        }

        const response = await req(url, options)
        response.status = response.code
        return response
    }

    /**
     * GET 请求
     * @param {string} url 请求的URL
     * @param {object} [config] 可选的请求配置
     * @returns {Promise<ProData>}
     */
    static async get(url, config = {}) {
        return await axios.request({ ...config, url, method: 'GET' })
    }
    /**
     * POST 请求
     * @param {string} url 请求的URL
     * @param {object} [data] 可选的请求数据
     * @param {object} [config] 可选的请求配置
     * @returns {Promise<ProData>}
     */
    static async post(url, data, config = {}) {
        return await axios.request({ ...config, url, method: 'POST', data })
    }
}

class qs {
    static stringify(obj, prefix = '') {
        const pairs = []

        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

            const value = obj[key]
            const fullKey = prefix ? `${prefix}[${key}]` : key

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

    static toObject(str) {
        if (typeof str !== 'string' || str.length === 0) {
            return {}
        }
        str = str.replace(/&/g, ',').replace(/=/g, ':')
        const obj = {}
        const pairs = str.split(',')
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i].split(':')
            obj[pair[0]] = pair[1]
        }
        return obj
    }
}

/**
 * 延迟函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 查找最佳LCS匹配
 * @param {Object} mainItem 主项目，需要有 name 属性
 * @param {Array} targetItems 目标项目数组，每项需要有 name 属性
 * @returns {Object} 返回 {allLCS, bestMatch, bestMatchIndex}
 */
function findBestLCS(mainItem, targetItems) {
    const results = []
    let bestMatchIndex = 0

    for (let i = 0; i < targetItems.length; i++) {
        const currentLCS = UZUtils.lcs(mainItem.name, targetItems[i].name)
        results.push({ target: targetItems[i], lcs: currentLCS })
        if (currentLCS.length > results[bestMatchIndex].lcs.length) {
            bestMatchIndex = i
        }
    }

    const bestMatch = results[bestMatchIndex]

    return { allLCS: results, bestMatch: bestMatch, bestMatchIndex: bestMatchIndex }
}

/**
 * 生成设备ID
 * @param {string} timestamp 时间戳
 * @returns {string} 设备ID（MD5前16位）
 */
function generateDeviceID(timestamp) {
    return Crypto.MD5(timestamp).toString().slice(0, 16)
}

/**
 * 生成请求ID
 * @param {string} deviceID 设备ID
 * @param {string} timestamp 时间戳
 * @returns {string} 请求ID（MD5前16位）
 */
function generateReqId(deviceID, timestamp) {
    return Crypto.MD5(deviceID + timestamp).toString().slice(0, 16)
}

/**
 * 生成X-Pan-Token签名
 * @param {string} method HTTP方法
 * @param {string} pathname 路径名
 * @param {string} timestamp 时间戳
 * @param {string} key 签名密钥
 * @returns {string} SHA256签名
 */
function generateXPanToken(method, pathname, timestamp, key) {
    const data = method + '&' + pathname + '&' + timestamp + '&' + key
    return Crypto.SHA256(data).toString()
}



// MARK: jiexi.js
// 请勿直接修改，请修改 jiexi.js 文件
// prettier-ignore


// 解析
class JieXi {
    constructor() {
        /**
         * 运行时标识符，会自动赋值一次，请勿修改
         */
        this.uzTag = ''
    }

    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanXXX>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new JieXi()
        pan.uzTag = args.uzTag
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @returns
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @param {String} value
     * @returns
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        // MARK: 需要实现
        return '采集解析'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        let url = args.url
        return (
            url.includes('v.qq.com') ||
            url.includes('iqiyi.com') ||
            url.includes('youku.com') ||
            url.includes('mgtv.com') ||
            url.includes('bilibili.com')
        )
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        // MARK: 需要实现
        return this.getVideoList(args.url)
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        // MARK: 需要实现
        return this.getPlayUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // MARK: 推荐实现
    }

    /**
     * 是否支持挂载
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例的Promise对象
     */
    async supportPanMount() {
        // MARK: 推荐实现，不支持 不需要改动
        return null
    }

    /**
     * 获取网盘根目录
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountRootDir() {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘子目录
     * @param {object} args
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @param {number} args.page 页码
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountSubDir(args) {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPanMountFile(args) {
        // MARK: 推荐实现
        return new PanPlayInfo()
    }

    ///////////////////

    getTypeName(url) {
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

    async getVideoList(url) {
        // 第一集$第一集的视频详情链接#第二集$第二集的视频详情链接$$$第一集$第一集的视频详情链接#第二集$第二集的视频详情链接
        let list = url.split('$$$')
        let videos = []
        for (let i = 0; i < list.length; i++) {
            const oneFrom = list[i]
            const fromName = this.getTypeName(oneFrom)
            let videoList = oneFrom.split('#')

            for (let j = 0; j < videoList.length; j++) {
                const element = videoList[j]
                let video = element.split('$')
                if (video.length === 2) {
                    let title = video[0]
                    let url = video[1]
                    videos.push({
                        name: title,
                        fromName: fromName,
                        panType: this.getPanType(),
                        data: {
                            url: url,
                        },
                    })
                } else if (video[0] === url) {
                    videos.push({
                        name: '解析',
                        fromName: fromName,
                        panType: this.getPanType(),
                        data: {
                            url: url,
                        },
                    })
                }
            }
        }

        return {
            videos: videos,
            //TODO: 推送只有一个链接的 获取视频名称 给 fileName
            fileName: this.fileName,
            error: '',
        }
    }

    async getPlayUrl(data) {
        let url = data.url
        // 格式：名称1@地址1;名称2@地址2
        let allUrls = await getEnv(this.uzTag, '采集解析地址')
        if (allUrls.length < 1) {
            allUrls =
                '钓鱼@http://8.129.30.117:8117/diaoyu.php?url=;乌贼@http://jx.dedyn.io/?url='
            await setEnv(this.uzTag, '采集解析地址', allUrls)
        }
        const jxLinks = allUrls.split(';')
        const urls = []
        for (let index = 0; index < jxLinks.length; index++) {
            const element = jxLinks[index]
            const name = element.split('@')[0]
            const api = element.split('@')[1]
            const response = await req(api + url)

            if (response.code === 200) {
                let item
                try {
                    item = JSON.parse(response.data)
                } catch (error) {
                    item = response.data
                }
                if (item) {
                    for (let key in item) {
                        if (item.hasOwnProperty(key)) {
                            let value = item[key]
                            if (value && typeof value === 'string') {
                                if (
                                    value.includes('http') &&
                                    (value.includes('m3u8') ||
                                        value.includes('mp4'))
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
        }
        return {
            urls: urls,
            headers: {},
        }
    }
}

panSubClasses.push(JieXi)

// MARK: pan115.js
// 请勿直接修改，请修改 pan115.js 文件
// prettier-ignore


// 获取 JSEncrypt 内部的 BigInteger 类
// JSEncrypt 是一个构造函数，需要先实例化才能访问内部类
let BigInteger = null
try {
    const tempEncrypt = new Encrypt()
    // 设置一个临时公钥来初始化内部结构
    tempEncrypt.setPublicKey('-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN\nFOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76\nxFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4\ngwQco1KRMDSmXSMkDwIDAQAB\n-----END PUBLIC KEY-----')
    // 获取 BigInteger 构造函数
    if (tempEncrypt.key && tempEncrypt.key.n) {
        BigInteger = tempEncrypt.key.n.constructor
    }
} catch (e) {
    UZUtils.debugLog('115 获取 BigInteger 失败:', e.toString())
}

const PAN115_G_KTS = new Uint8Array([
    0xf0, 0xe5, 0x69, 0xae, 0xbf, 0xdc, 0xbf, 0x8a, 0x1a, 0x45, 0xe8, 0xbe, 0x7d, 0xa6, 0x73, 0xb8,
    0xde, 0x8f, 0xe7, 0xc4, 0x45, 0xda, 0x86, 0xc4, 0x9b, 0x64, 0x8b, 0x14, 0x6a, 0xb4, 0xf1, 0xaa,
    0x38, 0x01, 0x35, 0x9e, 0x26, 0x69, 0x2c, 0x86, 0x00, 0x6b, 0x4f, 0xa5, 0x36, 0x34, 0x62, 0xa6,
    0x2a, 0x96, 0x68, 0x18, 0xf2, 0x4a, 0xfd, 0xbd, 0x6b, 0x97, 0x8f, 0x4d, 0x8f, 0x89, 0x13, 0xb7,
    0x6c, 0x8e, 0x93, 0xed, 0x0e, 0x0d, 0x48, 0x3e, 0xd7, 0x2f, 0x88, 0xd8, 0xfe, 0xfe, 0x7e, 0x86,
    0x50, 0x95, 0x4f, 0xd1, 0xeb, 0x83, 0x26, 0x34, 0xdb, 0x66, 0x7b, 0x9c, 0x7e, 0x9d, 0x7a, 0x81,
    0x32, 0xea, 0xb6, 0x33, 0xde, 0x3a, 0xa9, 0x59, 0x34, 0x66, 0x3b, 0xaa, 0xba, 0x81, 0x60, 0x48,
    0xb9, 0xd5, 0x81, 0x9c, 0xf8, 0x6c, 0x84, 0x77, 0xff, 0x54, 0x78, 0x26, 0x5f, 0xbe, 0xe8, 0x1e,
    0x36, 0x9f, 0x34, 0x80, 0x5c, 0x45, 0x2c, 0x9b, 0x76, 0xd5, 0x1b, 0x8f, 0xcc, 0xc3, 0xb8, 0xf5,
])

// 115网盘
// 参考 https://github.com/gendago/CatPawOpen
class Pan115 {

    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<Pan115>} 返回当前模块类实例
     */
    static async getInstance(args) {
        UZUtils.debugLog('115 getInstance called')
        let pan = new Pan115()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        UZUtils.debugLog('115 getInstance success')
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @returns
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @param {String} value
     * @returns
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        return '115'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        UZUtils.debugLog('115 canParse url:', args.url)
        // 支持 115.com, anxia.com, 115cdn.com 域名
        const result = /https:\/\/(?:115|anxia|115cdn)\.com\/s\/[a-zA-Z0-9]+/.test(args.url)
        UZUtils.debugLog('115 canParse result:', result)
        return result
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        UZUtils.debugLog('115 parseShareUrl called with url:', args.url)
        const result = await this.getFilesByShareUrl(args.url)
        UZUtils.debugLog('115 parseShareUrl result:', JSON.stringify(result))
        return result
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        return await this.getPlayUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // 115 不需要实现
    }

    /**
     * 是否支持挂载
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例的Promise对象
     */
    async supportPanMount() {
        return null
    }

    /**
     * 获取网盘根目录
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountRootDir() {
        return {}
    }

    /**
     * 获取网盘子目录
     * @param {object} args
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @param {number} args.page 页码
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountSubDir(args) {
        return {}
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPanMountFile(args) {
        return new PanPlayInfo()
    }

    ////////////////////////////////////////
    // 115 网盘特有实现
    ////////////////////////////////////////

    constructor() {
        /**
         * 运行时标识符，会自动赋值一次，请勿修改
         */
        this.uzTag = ''
        this.cookie = ''
        this.G_kts = PAN115_G_KTS
        this._RSA_e = null
        this._RSA_n = null
        // 支持更宽松的 URL 格式，密码部分可能包含特殊字符
        this.regex = /https:\/\/(?:115|anxia|115cdn)\.com\/s\/([a-zA-Z0-9]+)(?:\?password=([^&#\s]+))?/
        this.cookieKey = '115Cookie'
    }

    /**
     * 初始化，获取 Cookie
     */
    async init() {
        if (!this.cookie) {
            this.cookie = await this.getPanEnv(this.cookieKey)
        }
    }

    /**
     * 判断是否为媒体文件
     */
    isMediaFile(filename) {
        const lastDot = filename ? filename.lastIndexOf('.') : -1
        const ext = lastDot !== -1
            ? filename.slice(lastDot + 1).toLowerCase()
            : ''
        return ['mp4', 'webm', 'avi', 'wmv', 'flv', 'mov', 'mkv', 'mpeg', '3gp', 'ts', 'm2ts', 'mp3', 'wav', 'aac', 'iso'].includes(ext)
    }

    /**
     * 从分享链接中提取分享码和接收码
     */
    getShareData(shareUrl) {
        const matches = this.regex.exec(shareUrl)
        if (!matches) return null

        return {
            shareCode: matches[1],
            receiveCode: matches[2] || '' // 如果没有密码，使用空字符串
        }
    }

    /**
     * 递归获取分享链接中的所有文件
     */
    async getFilesByShareUrl(shareUrl) {
        try {
            const shareData = this.getShareData(shareUrl)
            UZUtils.debugLog('115 shareData:', shareData)

            if (!shareData) {
                return {
                    videos: [],
                    fileName: '',
                    error: '无法解析分享链接',
                }
            }

            const videos = []
            const listFile = async (dirID) => {
                UZUtils.debugLog('115 requesting dirID:', dirID)
                const dirInfo = await axios.get(`https://webapi.115.com/share/snap`, {
                    params: {
                        share_code: shareData.shareCode,
                        receive_code: shareData.receiveCode,
                        cid: dirID,
                        limit: '9999',
                        offset: '0',
                    },
                })

                UZUtils.debugLog('115 response status:', dirInfo.status)
                UZUtils.debugLog('115 response data type:', typeof dirInfo.data)

                // 解析 JSON 响应
                let responseData = dirInfo.data
                if (typeof responseData === 'string') {
                    responseData = JSON.parse(responseData)
                }

                UZUtils.debugLog('115 parsed data:', JSON.stringify(responseData))

                if (!responseData.data) return

                // 检查分享链接状态
                if (responseData.data.share_state === 7) {
                    const forbidReason =
                        responseData.data.shareinfo &&
                        responseData.data.shareinfo.forbid_reason
                            ? responseData.data.shareinfo.forbid_reason
                            : '链接已过期'
                    throw new Error(forbidReason)
                }

                const files = responseData.data.list.filter((item) => item.fc === 1)
                const folders = responseData.data.list.filter((o) => o.fc === 0)

                UZUtils.debugLog('115 found files:', files.length, 'folders:', folders.length)

                for (let file of files) {
                    UZUtils.debugLog('115 checking file:', file.n)
                    if (this.isMediaFile(file.n)) {
                        UZUtils.debugLog('115 added media file:', file.n)
                        videos.push({
                            ...file,
                            shareCode: shareData.shareCode,
                            receiveCode: shareData.receiveCode,
                        })
                    }
                }

                for (let folder of folders) {
                    UZUtils.debugLog('115 entering folder:', folder.n, 'cid:', folder.cid)
                    await listFile(folder.cid)
                }
            }

            await listFile(shareData.shareCode)

            const panVideos = videos.map((v) => {
                let size = v.s / 1024 / 1024
                let unit = 'MB'
                if (size >= 1000) {
                    size = size / 1024
                    unit = 'GB'
                }
                size = size.toFixed(1)

                return {
                    name: v.n,
                    remark: `[${size}${unit}]`,
                    panType: this.getPanType(),
                    data: {
                        shareCode: v.shareCode,
                        receiveCode: v.receiveCode,
                        fileId: v.fid,
                    },
                }
            })

            return {
                videos: panVideos,
                fileName: videos.length > 0 ? videos[0].n : '',
                error: '',
            }
        } catch (error) {
            return {
                videos: [],
                fileName: '',
                error: error.toString(),
            }
        }
    }

    /**
     * 获取播放地址
     */
    async getPlayUrl(data) {
        await this.init()

        const { shareCode, receiveCode, fileId } = data
        const requestData = `data=${encodeURIComponent(
            this.encrypt115(
                `{"share_code":"${shareCode}","receive_code":"${receiveCode}","file_id":"${fileId}"}`
            )
        )}`

        try {
            const response = await axios.post(
                'http://pro.api.115.com/app/share/downurl',
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Cookie: this.cookie,
                    },
                }
            )

            // 解析响应数据（可能是字符串）
            let responseData = response.data
            if (typeof responseData === 'string') {
                responseData = JSON.parse(responseData)
            }

            if (!responseData) {
                return new PanPlayInfo('', '115盘无响应数据')
            }

            // 优先检查 state 和 error
            if (responseData.state === false) {
                // 优先使用 msg 字段，如果没有再使用 error 字段
                const errorMsg = responseData.msg || responseData.error || '未知错误'
                if (errorMsg.includes('登录')) {
                    return new PanPlayInfo('', '请在 设置 -> 数据管理 -> 环境变量 中为115Cookie添加值')
                }
                return new PanPlayInfo('', `115盘错误: ${errorMsg}`)
            }

            // 检查 data 字段是否存在且为字符串
            if (!responseData.data || typeof responseData.data !== 'string') {
                return new PanPlayInfo('', '请在 设置 -> 数据管理 -> 环境变量 中为115Cookie添加值')
            }

            const resData = JSON.parse(this.decrypt115(responseData.data))
            return new PanPlayInfo(resData.url.url)
        } catch (error) {
            return new PanPlayInfo('', error.toString())
        }
    }

    ////////////////////////////////////////
    // 115 加密/解密算法
    ////////////////////////////////////////
    // 115 密钥表已移到 PAN115_G_KTS

    get RSA_e() {
        if (this._RSA_e === null) {
            this._RSA_e = new BigInteger('8686980c0f5a24c4b9d43020cd2c22703ff3f450756529058b1cf88f09b8602136477198a6e2683149659bd122c33592fdb5ad47944ad1ea4d36c6b172aad6338c3bb6ac6227502d010993ac967d1aef00f0c8e038de2e4d3bc2ec368af2e9f10a6f1eda4f7262f136420c07c331b871bf139f74f3010e3c4fe57df3afb71683', 16)
        }
        return this._RSA_e
    }

    get RSA_n() {
        if (this._RSA_n === null) {
            this._RSA_n = new BigInteger('10001', 16)
        }
        return this._RSA_n
    }

    /**
     * BigInteger 转字节数组
     */
    toBytes(value, length) {
        if (length == undefined) length = Math.ceil(value.toString(16).length / 2)
        const buffer = new Uint8Array(length)
        for (let i = length - 1; i >= 0; i--) {
            buffer[i] = value.and(new BigInteger('ff', 16)).intValue()
            value = value.shiftRight(8)
        }
        return buffer
    }

    /**
     * 字节数组转 BigInteger
     */
    fromBytes(bytes) {
        let intVal = new BigInteger('0', 10)
        for (const b of bytes) {
            intVal = intVal.shiftLeft(8).or(new BigInteger(String(b), 10))
        }
        return intVal
    }

    /**
     * 累积步进生成器
     */
    *accStep(start, stop, step = 1) {
        for (let i = start + step; i < stop; i += step) {
            yield [start, i, step]
            start = i
        }
        if (start !== stop) yield [start, stop, stop - start]
    }

    /**
     * 字节数组异或运算
     */
    bytesXor(v1, v2) {
        const result = new Uint8Array(v1.length)
        for (let i = 0; i < v1.length; i++) result[i] = v1[i] ^ v2[i]
        return result
    }

    /**
     * 生成密钥
     */
    genKey(randKey, skLen) {
        const xorKey = new Uint8Array(skLen)
        let length = skLen * (skLen - 1)
        let index = 0
        for (let i = 0; i < skLen; i++) {
            const x = (randKey[i] + this.G_kts[index]) & 0xff
            xorKey[i] = this.G_kts[length] ^ x
            length -= skLen
            index += skLen
        }
        return xorKey
    }

    /**
     * PKCS1 v1.5 填充
     */
    padPkcs1V1_5(message) {
        const msg_len = message.length
        const buffer = new Uint8Array(128)
        buffer.fill(0x02, 1, 127 - msg_len)
        buffer.set(message, 128 - msg_len)
        return this.fromBytes(buffer)
    }

    /**
     * XOR 异或运算
     */
    xor(src, key) {
        const buffer = new Uint8Array(src.length)
        const i = src.length & 0b11
        if (i) buffer.set(this.bytesXor(src.subarray(0, i), key.subarray(0, i)))
        for (const [j, k] of this.accStep(i, src.length, key.length))
            buffer.set(this.bytesXor(src.subarray(j, k), key), j)
        return buffer
    }

    /**
     * 模幂运算 (使用 BigInteger 的 modPow 方法)
     */
    pow(base, exponent, modulus) {
        return base.modPow(exponent, modulus)
    }

    /**
     * 115 加密
     */
    encrypt115(data) {
        if (typeof data === 'string' || data instanceof String) {
            // 使用 Crypto.enc.Utf8.parse 替代 TextEncoder
            const wordArray = Crypto.enc.Utf8.parse(data)
            // 将 WordArray 转换为 Uint8Array
            const words = wordArray.words
            const sigBytes = wordArray.sigBytes
            data = new Uint8Array(sigBytes)
            for (let i = 0; i < sigBytes; i++) {
                data[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
            }
        }
        const xorText = new Uint8Array(16 + data.length)
        xorText.set(
            this.xor(
                this.xor(data, new Uint8Array([0x8d, 0xa5, 0xa5, 0x8d])).reverse(),
                new Uint8Array([0x78, 0x06, 0xad, 0x4c, 0x33, 0x86, 0x5d, 0x18, 0x4c, 0x01, 0x3f, 0x46])
            ),
            16
        )
        const cipherData = new Uint8Array(Math.ceil(xorText.length / 117) * 128)
        let start = 0
        for (const [l, r] of this.accStep(0, xorText.length, 117))
            cipherData.set(
                this.toBytes(this.pow(this.padPkcs1V1_5(xorText.subarray(l, r)), this.RSA_n, this.RSA_e), 128),
                start,
                (start += 128)
            )
        return Buffer.from(cipherData).toString('base64')
    }

    /**
     * 115 解密
     */
    decrypt115(cipherData) {
        const cipher_data = new Uint8Array(Buffer.from(cipherData, 'base64'))
        let data = []
        for (const [l, r] of this.accStep(0, cipher_data.length, 128)) {
            const p = this.pow(this.fromBytes(cipher_data.subarray(l, r)), this.RSA_n, this.RSA_e)
            const b = this.toBytes(p)
            data.push(...b.subarray(b.indexOf(0) + 1))
        }
        data = new Uint8Array(data)
        const keyL = this.genKey(data.subarray(0, 16), 12)
        const tmp = this.xor(data.subarray(16), keyL).reverse()
        // 使用 Crypto.enc.Utf8.stringify 替代 TextDecoder
        const bytes = this.xor(tmp, new Uint8Array([0x8d, 0xa5, 0xa5, 0x8d]))
        const words = []
        for (let i = 0; i < bytes.length; i += 4) {
            words.push(
                (bytes[i] << 24) |
                ((bytes[i + 1] || 0) << 16) |
                ((bytes[i + 2] || 0) << 8) |
                (bytes[i + 3] || 0)
            )
        }
        const wordArray = Crypto.lib.WordArray.create(words, bytes.length)
        return Crypto.enc.Utf8.stringify(wordArray)
    }
}

// 注册 115 网盘 (使用 JSEncrypt 的 BigInteger，不依赖原生 BigInt)
if (BigInteger !== null) {
    UZUtils.debugLog('115 网盘已注册 (使用 JSEncrypt BigInteger)')
    panSubClasses.push(Pan115)
} else {
    UZUtils.debugLog('115 网盘注册失败：无法获取 BigInteger 类')
}


// MARK: pan123.js
// 请勿直接修改，请修改 pan123.js 文件
// prettier-ignore


//123盘
// 抄自 https://github.com/hjdhnx/drpy-node/
class Pan123 {
    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanXXX>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new Pan123()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @returns
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @param {String} value
     * @returns
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        // MARK: 需要实现
        return '123'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        // MARK: 需要实现
        let regex =
            /https:\/\/(www\.)?123(684|865|912|pan)\.(com|cn)\/s\/([^\\/]+)/

        return regex.test(args.url)
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        // MARK: 需要实现
        return await this.getFilesByShareUrl(args.url)
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        // MARK: 需要实现
        return await this.getPlayUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // MARK: 推荐实现
    }

    /**
     * 是否支持挂载
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例的Promise对象
     */
    async supportPanMount() {
        // MARK: 推荐实现，不支持 不需要改动
        return null
    }

    /**
     * 获取网盘根目录
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountRootDir() {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘子目录
     * @param {object} args
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @param {number} args.page 页码
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountSubDir(args) {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPanMountFile(args) {
        // MARK: 推荐实现
        return new PanPlayInfo()
    }

    ////////////////////////////////////////

    constructor() {
        /**
         * 运行时标识符，会自动赋值一次，请勿修改
         */
        this.uzTag = ''
        this.regex =
            /https:\/\/(www\.)?123(684|865|912|pan)\.(com|cn)\/s\/([^\\/]+)/
        this.api = 'https://www.123684.com/b/api/share/'
        this.loginUrl = 'https://login.123pan.com/api/user/sign_in'
        this.cate = ''
        this.password = ''
        this.passport = ''
        this.authKey = '123panAuth'
        this.auth = ''
        this.fileName = ''
    }

    async init() {
        try {
            if (this.auth.length < 1) {
                const auth = await UZUtils.getStorage({
                    key: this.authKey,
                    uzTag: this.uzTag,
                })
                this.auth = auth
            }

            if (this.auth && this.auth.length > 0) {
                const CryptoJS = Crypto
                let info = JSON.parse(
                    CryptoJS.enc.Base64.parse(this.auth.split('.')[1]).toString(
                        CryptoJS.enc.Utf8
                    )
                )
                if (info.exp <= Math.floor(Date.now() / 1000)) {
                    await this.loin()
                }
            } else {
                await this.loin()
            }
        } catch (error) {}
    }

    async loin() {
        this.password = await this.getPanEnv('123网盘密码')
        this.passport = await this.getPanEnv('123网盘账号')
        if (this.passport.length < 0 || this.password.length < 0) {
            return
        }
        let data = JSON.stringify({
            passport: this.passport,
            password: this.password,
            remember: true,
        })
        let config = {
            method: 'POST',
            url: this.loginUrl,
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

        let auth = (await axios.request(config)).data

        if (auth && auth.data && auth.data.token) {
            this.auth = auth.data.token

            await UZUtils.setStorage({
                key: this.authKey,
                value: this.auth,
                uzTag: this.uzTag,
            })
        }
    }

    getShareData(url) {
        let panUrl = decodeURIComponent(url.trim())
        // 先清理尾部符号，确保后续处理正确
        panUrl = panUrl.replace(/[#.,，/\s]+$/, '')
        this.SharePwd = ''
        // 支持 ;、,、，、空格后跟提取码
        let pwdMatch = panUrl.match(
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
            const firstChinese = panUrl.match(/[\u4e00-\u9fa5]/)
            if (firstChinese) {
                panUrl = panUrl.slice(0, firstChinese.index)
            }
        }
        panUrl = panUrl.trim()
        const matches = this.regex.exec(panUrl)
        if (!matches) {
            return null
        }
        const shareKey = panUrl.split('/').pop()
        if (!shareKey) {
            return null
        }
        return shareKey
    }

    async getFilesByShareUrl(shareUrl) {
        try {
            const shareKey = this.getShareData(shareUrl)

            if (shareKey === null) {
                return {
                    videos: [],
                    fileName: '',
                    error: '无法解析分享链接',
                }
            }
            this.fileName = ''
            let file = {}
            let cate = await this.getShareInfo(shareKey, this.SharePwd, 0, 0)

            if (cate && Array.isArray(cate)) {
                // 检查是否为直接分享的视频文件
                if (cate.length > 0 && cate[0].isDirect) {
                    // 直接分享的视频文件，无需进一步处理文件夹
                    file['root'] = cate
                } else {
                    // 文件夹结构，按原逻辑处理
                    await Promise.all(
                        cate.map(async (item) => {
                            if (!(item.filename in file)) {
                                file[item.filename] = []
                            }

                            const fileData = await this.getShareList(
                                item.shareKey,
                                item.SharePwd,
                                item.next,
                                item.fileId
                            )

                            if (fileData && fileData.length > 0) {
                                file[item.filename].push(...fileData)
                            }
                        })
                    )
                }
            }

            let videos = []

            // 过滤掉空数组
            for (let key in file) {
                if (file[key].length > 0) {
                    for (let i = 0; i < file[key].length; i++) {
                        const element = file[key][i]
                        let size = element.Size / 1024 / 1024
                        let unit = 'MB'
                        if (size >= 1000) {
                            size = size / 1024
                            unit = 'GB'
                        }
                        size = size.toFixed(1)
                        videos.push({
                            name: element.FileName,
                            remark: `[${size}${unit}]`,
                            panType: this.getPanType(),
                            data: element,
                            // fromName: key,
                        })
                    }
                }
            }

            return {
                videos: videos,
                fileName: this.fileName,
                error: '',
            }
        } catch (error) {
            return {
                videos: [],
                fileName: '',
                error: error.toString(),
            }
        }
    }

    async getShareInfo(shareKey, SharePwd, next, ParentFileId) {
        let cate = []
        let videos = []
        let list = await axios.get(this.api + 'get', {
            headers: {},
            params: {
                limit: '100',
                next: next,
                orderBy: 'file_name',
                orderDirection: 'asc',
                shareKey: shareKey,
                SharePwd: SharePwd !== undefined && SharePwd !== null ? SharePwd : '',
                ParentFileId: ParentFileId,
                Page: '1',
            },
        })
        if (list.status === 200) {
            if (list.data.code === 5103) {
            } else {
                let info = list.data.data
                if (info == null) {
                    return []
                }
                let next = info.Next
                let infoList = info.InfoList

                infoList.forEach((item) => {
                    if (this.fileName.length < 1) {
                        this.fileName = item.FileName
                    }
                    if (item.Category === 0) {
                        // 文件夹
                        cate.push({
                            filename: item.FileName,
                            shareKey: shareKey,
                            SharePwd: SharePwd,
                            next: next,
                            fileId: item.FileId,
                        })
                    } else if (item.Category === 2) {
                        // 直接分享的视频文件
                        videos.push({
                            ShareKey: shareKey,
                            FileId: item.FileId,
                            S3KeyFlag: item.S3KeyFlag,
                            Size: item.Size,
                            Etag: item.Etag,
                            FileName: item.FileName,
                            isDirect: true, // 标记为直接分享的文件
                        })
                    }
                })

                // 如果有直接分享的视频文件，优先返回
                if (videos.length > 0) {
                    return videos
                }

                // 否则处理文件夹
                let result = await Promise.all(
                    cate.map(async (it) =>
                        this.getShareInfo(shareKey, SharePwd, next, it.fileId)
                    )
                )
                result = result.filter(
                    (item) => item !== undefined && item !== null
                )
                return [...cate, ...result.flat()]
            }
        }
    }

    async getShareList(shareKey, SharePwd, next, ParentFileId) {
        try {
            let video = []
            const listResp = await axios.get(this.api + 'get', {
                headers: {},
                params: {
                    limit: '100',
                    next: next,
                    orderBy: 'file_name',
                    orderDirection: 'asc',
                    shareKey: shareKey,
                    SharePwd: SharePwd !== undefined && SharePwd !== null ? SharePwd : '',
                    ParentFileId: ParentFileId,
                    Page: '1',
                },
            })
            let infoList =
                listResp &&
                listResp.data &&
                listResp.data.data
                    ? listResp.data.data.InfoList
                    : null
            if (infoList) {
                infoList.forEach((it) => {
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
            return video
        } catch (error) {
            return []
        }
    }

    async getDownload(shareKey, FileId, S3KeyFlag, Size, Etag) {
        try {
            let data = JSON.stringify({
                ShareKey: shareKey,
                FileID: FileId,
                S3KeyFlag: S3KeyFlag,
                Size: Size,
                Etag: Etag,
            })

            let config = {
                method: 'POST',
                url: `${this.api}download/info`,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    Authorization: `Bearer ${this.auth}`,
                    'Content-Type': 'application/json;charset=UTF-8',
                    platform: 'android',
                },
                data: data,
            }
            const resp = await axios.request(config)

            let down =
                resp && resp.data && resp.data.data
                    ? resp.data.data
                    : null
            let url = down && down.DownloadURL ? down.DownloadURL : ''

            if (url.length < 1) {
                return []
            }

            const query = qs.toObject(url.split('?')[1])

            url = base64Decode(query.params)
            return [
                {
                    url: url,
                    name: '原画',
                    priority: 9999,
                    headers: {},
                },
            ]
        } catch (error) {
            return []
        }
    }

    async getLiveTranscoding(shareKey, FileId, S3KeyFlag, Size, Etag) {
        try {
            let config = {
                method: 'GET',
                url: `https://www.123684.com/b/api/video/play/info`,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    Authorization: `Bearer ${this.auth}`,
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
            const playResp = await axios.request(config)
            let down =
                playResp && playResp.data && playResp.data.data
                    ? playResp.data.data.video_play_info
                    : null
            let videoinfo = []
            if (down) {
                down.forEach((item) => {
                    if (item.url !== '') {
                        videoinfo.push({
                            name: item.resolution,
                            url: item.url,
                            priority: item.height,
                        })
                    }
                })
            }

            return videoinfo
        } catch (error) {
            return []
        }
    }

    async getPlayUrl(data) {
        await this.init()
        const raw = await this.getDownload(
            data.ShareKey,
            data.FileId,
            data.S3KeyFlag,
            data.Size,
            data.Etag
        )

        const transcoding = await this.getLiveTranscoding(
            data.ShareKey,
            data.FileId,
            data.S3KeyFlag,
            data.Size,
            data.Etag
        )
        const urls = [...raw, ...transcoding]

        return {
            urls: urls,
            headers: {},
        }
    }
}
panSubClasses.push(Pan123)

// MARK: pan189.js
// 请勿直接修改，请修改 pan189.js 文件
// prettier-ignore


//189云盘
// 抄自 https://github.com/hjdhnx/drpy-node/

class Pan189 {
    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanXXX>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new Pan189()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @returns
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @param {String} value
     * @returns
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        // MARK: 需要实现
        return '天翼'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        // MARK: 需要实现
        if (args.url.includes('cloud.189.cn')) {
            return true
        } else {
            return false
        }
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        // MARK: 需要实现
        return await this.getShareData(args.url)
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        // MARK: 需要实现
        return await this.getPlayUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // MARK: 推荐实现
    }

    /**
     * 是否支持挂载
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例的Promise对象
     */
    async supportPanMount() {
        // MARK: 推荐实现，不支持 不需要改动
        return null
    }

    /**
     * 获取网盘根目录
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountRootDir() {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘子目录
     * @param {object} args
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @param {number} args.page 页码
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountSubDir(args) {
        // MARK: 推荐实现
        return {}
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPanMountFile(args) {
        // MARK: 推荐实现
        return new PanPlayInfo()
    }
    constructor() {
        this.uzTag = ''
        this.regex = /https:\/\/cloud\.189\.cn\/web\/share\?code=([^&]+)/ //https://cloud.189.cn/web/share?code=qI3aMjqYRrqa
        this.config = {
            clientId: '538135150693412',
            model: 'KB2000',
            version: '9.0.6',
            pubKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZLyV4gHNDUGJMZoOcYauxmNEsKrc0TlLeBEVVIIQNzG4WqjimceOj5R9ETwDeeSN3yejAKLGHgx83lyy2wBjvnbfm/nLObyWwQD/09CmpZdxoFYCH6rdDjRpwZOZ2nXSZpgkZXoOBkfNXNxnN74aXtho2dqBynTw3NFTWyQl8BQIDAQAB',
        }
        this.loginHeaders = {
            'User-Agent': `Mozilla/5.0 (Linux; U; Android 11; ${this.config.model} Build/RP1A.201005.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36 Ecloud/${this.config.version} Android/30 clientId/${this.config.clientId} clientModel/${this.config.model} clientChannelId/qq proVersion/1.0.6`,
            Referer:
                'https://m.cloud.189.cn/zhuanti/2016/sign/index.jsp?albumBackupOpened=1',
            // 'Accept-Encoding': 'gzip, deflate',
        }

        this.api = 'https://cloud.189.cn/api'
        this.shareCode = ''
        this.accessCode = ''
        this.shareId = ''
        this.shareMode = ''
        this.isFolder = ''
        this.index = 0
        this.account = ''
        this.password = ''
        this.cookie = ''
        this.authKey = '189panAuth'
        this.normalHeaders = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            Accept: 'application/json;charset=UTF-8',
        }
        this.fileName = ''
    }

    async logout() {
        this.cookie = ''
        await UZUtils.setStorage({
            key: this.authKey,
            value: '',
            uzTag: this.uzTag,
        })
    }

    async login() {
        if (this.cookie.length > 0) {
            return
        }
        this.cookie = await UZUtils.getStorage({
            key: this.authKey,
            uzTag: this.uzTag,
        })
        if (this.cookie.length < 1) {
            this.account = await this.getPanEnv('天翼网盘账号')
            this.password = await this.getPanEnv('天翼网盘密码')
        }

        if (this.account.length < 1 || this.password.length < 1) {
            return
        }

        try {
            let resp = await axios.post(
                'https://open.e.189.cn/api/logbox/config/encryptConf.do?appId=cloud'
            )

            const jsonData = JSONbig.parse(resp.data)
            let pubKey = jsonData.data.pubKey

            resp = await axios.get(
                'https://cloud.189.cn/api/portal/loginUrl.action?redirectURL=https://cloud.189.cn/web/redirect.html?returnURL=/main.action'
            )
            // 获取最后请求url中的参数reqId和lt
            const lastReq = resp.redirects.pop()

            const lastReqUrl =
                lastReq.location !== undefined && lastReq.location !== null
                    ? lastReq.location
                    : lastReq.url

            let Reqid = lastReqUrl.match(/reqId=(\w+)/)[1]
            let Lt = lastReqUrl.match(/lt=(\w+)/)[1]
            let tHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json;charset=UTF-8',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/76.0',
                Referer: 'https://open.e.189.cn/',
                Lt,
                Reqid,
            }
            let data = { version: '2.0', appKey: 'cloud' }
            resp = await axios.post(
                'https://open.e.189.cn/api/logbox/oauth2/appConf.do',
                qs.stringify(data),
                { headers: tHeaders }
            )
            let returnUrl = resp.data.data.returnUrl
            let paramId = resp.data.data.paramId
            const keyData = `-----BEGIN PUBLIC KEY-----\n${pubKey}\n-----END PUBLIC KEY-----`

            const jsencrypt = new Encrypt()
            jsencrypt.setPublicKey(keyData)

            const enUname = Buffer.from(
                jsencrypt.encrypt(this.account),
                'base64'
            ).toString('hex')
            const enPasswd = Buffer.from(
                jsencrypt.encrypt(this.password),
                'base64'
            ).toString('hex')

            data = {
                appKey: 'cloud',
                version: '2.0',
                accountType: '01',
                mailSuffix: '@189.cn',
                validateCode: '',
                returnUrl,
                paramId,
                captchaToken: '',
                dynamicCheck: 'FALSE',
                clientType: '1',
                cb_SaveName: '0',
                isOauth2: false,
                userName: `{NRP}${enUname}`,
                password: `{NRP}${enPasswd}`,
            }
            resp = await axios.post(
                'https://open.e.189.cn/api/logbox/oauth2/loginSubmit.do',
                qs.stringify(data),
                {
                    headers: tHeaders,
                    validateStatus: null,
                }
            )
            const loginJsonData = JSONbig.parse(resp.data)

            if (loginJsonData.toUrl) {
                let cookies = resp.headers['set-cookie']
                    .map((it) => it.split(';')[0])
                    .join(';')

                this.cookie = cookies
                const headers = { ...this.loginHeaders, Cookie: cookies }

                resp = await axios.get(loginJsonData.toUrl, {
                    headers: headers,
                    maxRedirects: 0,
                })

                const setCookie =
                    resp.headers && resp.headers['set-cookie']
                        ? resp.headers['set-cookie']
                        : null
                cookies +=
                    '; ' +
                    (setCookie ? setCookie.map((it) => it.split(';')[0]).join(';') : '')
                this.cookie = cookies

                await UZUtils.setStorage({
                    key: this.authKey,
                    value: cookies,
                    uzTag: this.uzTag,
                })
            } else {
                console.error('Error during login:', resp.data)

                await UZUtils.setStorage({
                    key: this.authKey,
                    value: '',
                    uzTag: this.uzTag,
                })
            }
        } catch (error) {
            await UZUtils.setStorage({
                key: this.authKey,
                value: '',
                uzTag: this.uzTag,
            })
            console.error('Error during login:', error)
        }
    }

    async getShareID(url, accessCode) {
        try {
            // 优先级：外部传入 > URL参数pwd > shareCode中的访问码 > 括号中的访问码
            
            // 1. 从URL参数中提取密码 (?pwd=xxx 或 &pwd=xxx)
            const pwdMatch = url.match(/[?&]pwd=([^&]+)/);
            if (pwdMatch && pwdMatch[1]) {
                this.accessCode = pwdMatch[1];
            }

            // 2. 提取 shareCode（完整内容，可能包含访问码）
            const matches = this.regex.exec(url)
            if (matches && matches[1]) {
                let rawCode = matches[1]
                
                // 从 rawCode 中提取访问码（各种格式）
                if (!this.accessCode) {
                    // 格式1: "（访问码：pu0o）" 或 "(访问码：pu0o)"
                    const accessCodeMatch1 = rawCode.match(/[（(]\s*访问码[：:]\s*([a-zA-Z0-9]+)\s*[）)]/)
                    // 格式2: 空格后的 "访问码：vkf5" 或 "访问码:vkf5"
                    const accessCodeMatch2 = rawCode.match(/\s+访问码[：:]\s*([a-zA-Z0-9]+)/)
                    
                    if (accessCodeMatch1) {
                        this.accessCode = accessCodeMatch1[1]
                    } else if (accessCodeMatch2) {
                        this.accessCode = accessCodeMatch2[1]
                    }
                }
                
                // 清理 shareCode：只保留开头的字母数字部分
                // 遇到空格、括号或中文就停止
                const cleanMatch = rawCode.match(/^([a-zA-Z0-9]+)/)
                this.shareCode = cleanMatch ? cleanMatch[1] : rawCode.trim()
                    
            } else {
                // 支持多种短链接格式
                const patterns = [
                    /https:\/\/cloud\.189\.cn\/t\/([a-zA-Z0-9]+)/,                      // cloud.189.cn/t/
                    /https:\/\/h5\.cloud\.189\.cn\/share\.html#\/t\/([a-zA-Z0-9]+)/    // h5.cloud.189.cn/share.html#/t/
                ]
                
                for (const pattern of patterns) {
                    const matches_ = url.match(pattern)
                    if (matches_ && matches_[1]) {
                        this.shareCode = matches_[1]
                        break
                    }
                }
            }
            
            // 3. 外部传入的 accessCode 优先级最高
            if (accessCode) {
                this.accessCode = accessCode
            }
        } catch (error) {}
    }


    /**
     * 判断文件是否为视频文件（根据扩展名）
     * @param {string} filename - 文件名
     * @returns {boolean} 是否为视频文件
     */
    isVideoFile(filename) {
        if (!filename) return false
        const videoExtensions = [
            '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v',
            '.rmvb', '.rm', '.3gp', '.ts', '.mpg', '.mpeg', '.f4v', '.m3u8',
            '.iso', '.vob', '.asf', '.dat'
            // 注意：.iso 等部分格式可能无法播放，但仍显示在列表中让用户知晓
        ]
        const lowerName = filename.toLowerCase()
        return videoExtensions.some(ext => lowerName.endsWith(ext))
    }
    
    async getShareData(shareUrl, accessCode) {
        try {
            // 重置状态，避免上次解析的残留数据影响本次
            this.shareCode = ''
            this.accessCode = ''
            this.shareId = ''
            this.shareMode = ''
            this.isFolder = ''
            this.fileName = ''
            
            let file = {}
            let fileData = []
            let fileId = await this.getShareInfo(shareUrl, accessCode)

            if (fileId) {
                let fileList = await this.getShareList(fileId)
                if (fileList && Array.isArray(fileList)) {
                    await Promise.all(
                        fileList.map(async (item) => {
                            if (!(item.name in file)) {
                                file[item.name] = []
                            }
                            const fileData = await this.getShareFile(item.id)
                            if (fileData && fileData.length > 0) {
                                file[item.name].push(...fileData)
                            }
                        })
                    )
                }
                file['root'] = await this.getShareFile(fileId)
            }
            // 过滤掉空数组
            for (let key in file) {
                if (file[key].length === 0) {
                    delete file[key]
                }
            }
            // 如果 file 对象为空，重新获取 root 数据并过滤空数组
            if (Object.keys(file).length === 0) {
                file['root'] = await this.getShareFile(fileId)
                if (file['root'] && Array.isArray(file['root'])) {
                    file['root'] = file['root'].filter(
                        (item) => item && Object.keys(item).length > 0
                    )
                }
            }

            let videos = []
            for (let key in file) {
                const list = file[key] || []
                for (let i = 0; i < list.length; i++) {
                    const element = list[i]
                    let size = element.size / 1024 / 1024
                    let unit = 'MB'
                    if (size >= 1000) {
                        size = size / 1024
                        unit = 'GB'
                    }
                    size = size.toFixed(1)
                    videos.push({
                        name: element.name,
                        remark: `[${size}${unit}]`,
                        panType: this.getPanType(),
                        data: element,
                        // fromName: key,
                    })
                }
            }

            return {
                videos: videos,
                fileName: this.fileName,
                error: '',
            }
        } catch (error) {
            return {
                videos: [],
                error: '',
            }
        }
    }

    async getShareInfo(shareUrl, accessCode) {
        try {
            if (shareUrl.startsWith('http')) {
                await this.getShareID(shareUrl, accessCode)
            } else {
                this.shareCode = shareUrl
            }
            if (this.accessCode) {
                let check = await axios.get(
                    `${this.api}/open/share/checkAccessCode.action?shareCode=${this.shareCode}&accessCode=${this.accessCode}`,
                    {
                        headers: this.normalHeaders,
                    }
                )
                if (check.status === 200 && check.data && check.data.shareId) {
                    this.shareId = check.data.shareId
                }
                let resp = await axios.get(
                    `${this.api}/open/share/getShareInfoByCodeV2.action?key=noCache&shareCode=${this.shareCode}`,
                    {
                        headers: this.normalHeaders,
                    }
                )
                let fileId = resp.data.fileId
                // 如果 checkAccessCode 没有返回 shareId，从 getShareInfoByCodeV2 获取
                if (!this.shareId && resp.data && resp.data.shareId) {
                    this.shareId = resp.data.shareId
                }
                this.shareMode = resp.data.shareMode
                this.isFolder = resp.data.isFolder
                if (this.fileName.length < 1) {
                    this.fileName = resp.data.fileName
                }
                return fileId
            } else {
                const url = `${
                    this.api
                }/open/share/getShareInfoByCodeV2.action?noCache=${Math.random()}&shareCode=${
                    this.shareCode
                }`
                let resp = await axios.get(url, {
                    headers: this.normalHeaders,
                })
                let fileId = resp.data.fileId
                this.shareId = resp.data.shareId

                this.shareMode = resp.data.shareMode
                this.isFolder = resp.data.isFolder
                if (this.fileName.length < 1) {
                    this.fileName = resp.data.fileName
                }
                return fileId
            }
        } catch (error) {
            console.error('Error during getShareInfo:', error)
        }
    }

    async getShareList(fileId) {
        try {
            let videos = []

            const options = {
                method: 'GET',
                headers: this.normalHeaders,
                responseType: ReqResponseType.plain,
            }

            const url = `${this.api}/open/share/listShareDir.action?pageNum=1&pageSize=60&fileId=${fileId}&shareDirFileId=${fileId}&isFolder=${this.isFolder}&shareId=${this.shareId}&shareMode=${this.shareMode}&iconOption=5&orderBy=lastOpTime&descending=true&accessCode=${this.accessCode}`

            let resp = await req(url, options)

            const text =
                resp && resp.data !== undefined && resp.data !== null
                    ? resp.data
                    : ''
            const json = JSONbig.parse(text)

            const data = json && json.fileListAO ? json.fileListAO : null
            let folderList = data && data.folderList ? data.folderList : null
            if (!folderList) {
                return null
            }

            let names = folderList.map((item) => item.name)
            let ids = folderList.map((item) => item.id)
            if (folderList && folderList.length > 0) {
                names.forEach((name, index) => {
                    videos.push({
                        name: name,
                        id: ids[index],
                        type: 'folder',
                    })
                })
                let result = await Promise.all(
                    ids.map(async (id) => this.getShareList(id))
                )
                result = result.filter(
                    (item) => item !== undefined && item !== null
                )
                return [...videos, ...result.flat()]
            }
        } catch (e) {}
    }

    async getShareFile(fileId, pageNum = 1, retry = 0) {
        try {
            if (!fileId || retry > 3) {
                return null
            }

            const options = {
                method: 'GET',
                headers: this.normalHeaders,
                responseType: ReqResponseType.plain,
            }
            const pageSize = 60
            const url = `${
                this.api
            }/open/share/listShareDir.action?key=noCache&pageNum=${pageNum}&pageSize=${pageSize}&fileId=${fileId}&shareDirFileId=${fileId}&isFolder=${
                this.isFolder
            }&shareId=${this.shareId}&shareMode=${
                this.shareMode
            }&iconOption=5&orderBy=filename&descending=false&accessCode=${
                this.accessCode
            }&noCache=${Math.random()}`

            let resp = await req(url, options)

            if (resp.code !== 200) {
                return await this.getShareFile(fileId, pageNum, retry + 1)
            }

            let json = JSONbig.parse(
                resp.data !== undefined && resp.data !== null ? resp.data : ''
            )

            let videos = []
            const data = json && json.fileListAO ? json.fileListAO : null
            let fileList = data && data.fileList ? data.fileList : null
            if (!fileList) {
                return null
            }
            for (let index = 0; index < fileList.length; index++) {
                const element = fileList[index]
                // 检查是否为视频文件：mediaType === 3 或 文件扩展名匹配
                const isVideo = element.mediaType === 3 || this.isVideoFile(element.name)
                if (isVideo) {
                    videos.push({
                        name: element.name,
                        fileId: element.id,
                        shareId: this.shareId,
                        size: element.size,
                    })
                }
            }
            const totalCount =
                data && data.count !== undefined && data.count !== null
                    ? data.count
                    : 0
            if (totalCount > pageSize * pageNum) {
                let result = await this.getShareFile(fileId, pageNum + 1)
                if (result) {
                    videos = [...videos, ...result]
                }
            }
            return videos
        } catch (e) {}
    }

    async getPlayUrl(data) {
        let list = await this.getShareUrl(data.fileId, data.shareId)
        const urls = list.map((it) => {
            return {
                url: it,
            }
        })

        return {
            urls: urls,
            headers: {},
        }
    }

    async getShareUrl(fileId, shareId) {
        let headers = { ...this.normalHeaders }
        if (this.index < 2) {
            await this.login()
        }
        headers['Cookie'] = this.cookie

        try {
            let resp = await axios.get(
                `${this.api}/portal/getNewVlcVideoPlayUrl.action?shareId=${shareId}&dt=1&fileId=${fileId}&type=4&key=noCache`,
                {
                    headers: headers,
                }
            )

            if (resp.status !== 200 && this.index < 2) {
                await this.logout()
                this.index += 1
                return await this.getShareUrl(fileId, shareId)
            }

            let location = await axios.get(resp.data.normal.url, {
                maxRedirects: 0, // 禁用自动重定向
            })

            let link = ''
            if (
                location.status >= 300 &&
                location.status < 400 &&
                location.headers.location
            ) {
                link = location.headers.location
            } else {
                link = resp.data.normal.url
            }
            this.index = 0
            return link
        } catch (error) {
            if (
                error.response &&
                error.response.status === 400 &&
                this.index < 2
            ) {
                this.cookie = ''
                this.index += 1
                return await this.getShareUrl(fileId, shareId)
            } else {
                console.error(
                    'Error during getShareUrl:',
                    error.message,
                    error.response ? error.response.status : 'N/A'
                )
            }
        } finally {
            if (this.index >= 2) {
                this.index = 0 // 仅在达到最大重试次数后重置
            }
        }
    }
}

panSubClasses.push(Pan189)

// MARK: panYun.js
// 请勿直接修改，请修改 panYun.js 文件
// prettier-ignore


// 移动云盘（139邮箱云盘）
// 抄自 https://github.com/hjdhnx/drpy-node/

class PanYun {
    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanYun>} 返回当前模块类实例
     */
    static async getInstance(args) {
        let pan = new PanYun()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        await pan.init()
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @returns
     */
    async getPanEnv(key) {
        // 当前基本功能不需要环境变量，仅在下载功能时按需获取
        try {
            return await getEnv(this.uzTag, key)
        } catch (error) {
            return null
        }
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     * 可直接调用
     * @param {String} key
     * @param {String} value
     * @returns
     */
    async updatePanEnv(key, value) {
        // 保留接口兼容性，实际可选使用
        try {
            await setEnv(this.uzTag, key, value)
        } catch (error) {
            // 忽略环境变量设置错误
        }
    }

    /**
     * 是否支持挂载
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例的Promise对象
     */
    async supportPanMount() {
        return null
    }

    /**
     * 获取网盘根目录
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountRootDir() {
        return {}
    }

    /**
     * 获取网盘子目录
     * @param {object} args
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @param {number} args.page 页码
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountSubDir(args) {
        return {}
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData.data} args.data PanMountListData 的 data
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPanMountFile(args) {
        return new PanPlayInfo()
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        return '移动'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回一个 Promise，resolve 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        return args.url.includes('yun.139.com') || args.url.includes('caiyun.139.com')
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        return await this.getShareData(args.url)
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        return await this.getPlayUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // 调用清除保存目录的方法
    }

    ////////////////////////////////////////
    constructor() {
        /**
         * 运行时标识符，会自动赋值一次，请勿修改
         */
        this.uzTag = ''
        // 移动云盘分享链接的正则表达式
        this.regex = /https:\/\/yun.139.com\/shareweb\/#\/w\/i\/([^&]+)/
        // AES加密密钥
        this.x = Crypto.enc.Utf8.parse("PVGDwmcvfs1uV3d1")
        // API基础URL
        this.baseUrl = 'https://share-kd-njs.yun.139.com/yun-share/richlifeApp/devapp/IOutLink/'
        // 备用API地址（万一主地址失效）
        this.alternativeUrls = [
            'https://cloud.139.com/yun-share/richlifeApp/devapp/IOutLink/',
            'https://yun.139.com/yun-share/richlifeApp/devapp/IOutLink/',
            'https://share.yun.139.com/yun-share/richlifeApp/devapp/IOutLink/'
        ]
        // 默认请求头
        this.baseHeader = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'hcy-cool-flag': '1',
            'x-deviceinfo': '||3|12.27.0|chrome|131.0.0.0|5c7c68368f048245e1ce47f1c0f8f2d0||windows 10|1536X695|zh-CN|||',
            'Origin': 'https://yun.139.com',
            'Referer': 'https://yun.139.com/'
        }
        // 分享链接ID
        this.linkID = ''
        // 缓存对象，用于存储API响应结果
        this.cache = {}
        // 授权token
        this.authorization = ''
        // 账号信息
        this.account = ''
        this.cookie = ''
    }

    /**
     * 初始化移动云盘驱动
     */
    async init() {
        // 基本功能（分享链接解析、播放）不需要环境变量
        // Cookie和账号信息仅在下载功能时按需获取
    }

    /**
     * 数据加密方法
     * 
     * 使用AES-CBC模式对数据进行加密，支持字符串和对象类型
     * 
     * @param {string|object} data - 需要加密的数据
     * @returns {string} Base64编码的加密结果
     */
    encrypt(data) {
        try {
            // 生成随机初始化向量 - 使用 fallback 方案
            let t, n = ""
            try {
                // 尝试使用标准方式
                t = Crypto.lib.WordArray.random(16)
            } catch (randomError) {
                // Fallback: 手动生成16字节(4个words)的随机数组
                const words = []
                for (let i = 0; i < 4; i++) {
                    // 生成32位随机数
                    words[i] = Math.floor(Math.random() * 0x100000000)
                }
                t = Crypto.lib.WordArray.create(words, 16)
            }

            if ("string" == typeof data) {
                // 字符串类型加密
                const o = Crypto.enc.Utf8.parse(data)
                n = Crypto.AES.encrypt(o, this.x, {iv: t, mode: Crypto.mode.CBC, padding: Crypto.pad.Pkcs7})
            } else if (typeof data === 'object' && data !== null) {
                // 对象类型先转JSON再加密
                const a = JSON.stringify(data), s = Crypto.enc.Utf8.parse(a)
                n = Crypto.AES.encrypt(s, this.x, {iv: t, mode: Crypto.mode.CBC, padding: Crypto.pad.Pkcs7})
            }

            // 返回IV和密文的Base64编码
            const result = Crypto.enc.Base64.stringify(t.concat(n.ciphertext))
            return result
        } catch (error) {
            throw error
        }
    }

    /**
     * 数据解密方法
     * 
     * 解密使用AES-CBC模式加密的数据
     * 
     * @param {string} data - Base64编码的加密数据
     * @returns {string} 解密后的原始数据
     */
    decrypt(data) {
        try {
            // 解析Base64数据
            const t = Crypto.enc.Base64.parse(data), n = t.clone(), i = n.words.splice(4)

            // 分离IV和密文
            n.init(n.words), t.init(i)
            const o = Crypto.enc.Base64.stringify(t)

            // 执行AES解密
            const a = Crypto.AES.decrypt(o, this.x, {iv: n, mode: Crypto.mode.CBC, padding: Crypto.pad.Pkcs7})
            const s = a.toString(Crypto.enc.Utf8)

            return s.toString()
        } catch (error) {
            throw error
        }
    }

    /**
     * 从分享URL中提取分享ID
     * 
     * 支持多种格式的移动云盘分享链接
     * 
     * @async
     * @param {string} url - 移动云盘分享链接
     * @returns {Promise<void>}
     */
    async getShareID(url) {
        // 支持多种格式的分享链接
        const patterns = [
            this.regex,                                                    // yun.139.com/shareweb/#/w/i/
            /https:\/\/yun\.139\.com\/sharewap\/#\/m\/i\?([^&]+)/,         // yun.139.com/sharewap/#/m/i?
            /https:\/\/caiyun\.139\.com\/m\/i\?([^&]+)/,                   // caiyun.139.com/m/i?
            /https:\/\/caiyun\.139\.com\/w\/i\/([^&\/]+)/                  // caiyun.139.com/w/i/
        ]

        let matches = null
        for (const pattern of patterns) {
            matches = pattern.exec(url)
            if (matches && matches[1]) {
                this.linkID = matches[1]
                return
            }
        }
    }

    /**
     * 获取分享信息
     * 
     * 通过API获取指定目录的分享信息，包含文件和文件夹列表
     * 
     * @async
     * @param {string} pCaID - 父目录ID，'root'表示根目录
     * @returns {Promise<object|null>} 分享信息对象，失败时返回null
     */
    async getShareInfo(pCaID) {
        if (!this.linkID) {
            return null
        }
        // 检查缓存
        const cacheKey = `${this.linkID}-${pCaID}`
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey]
        }
        // 构造请求数据
        const requestPayload = {
            "getOutLinkInfoReq": {
                "account": "",
                "linkID": this.linkID,
                "passwd": "",
                "caSrt": 1,
                "coSrt": 1,
                "srtDr": 0,
                "bNum": 1,
                "pCaID": pCaID,
                "eNum": 200
            },
            "commonAccountInfo": {"account": "", "accountType": 1}
        }

        const jsonString = JSON.stringify(requestPayload)
        const encryptedData = this.encrypt(jsonString)

        // 使用原始字符串格式发送请求
        let data = encryptedData

        try {
            // 尝试多个API地址
            let resp = null
            const urlsToTry = [this.baseUrl, ...this.alternativeUrls]

            for (let i = 0; i < urlsToTry.length; i++) {
                const currentUrl = urlsToTry[i]

                // 发送API请求 - 直接使用 req() 函数，绕过有问题的 axios 包装
                try {
                    resp = await req(currentUrl + 'getOutLinkInfoV6', {
                        method: 'POST',
                        headers: this.baseHeader,
                        data: data,
                        responseType: ReqResponseType.plain
                    })

                    if (resp && resp.code !== undefined) {
                        break // 成功就退出循环
                    } else {
                        resp = { code: 500, data: null, error: '无效响应' }
                    }
                } catch (reqError) {
                    resp = { code: 500, data: null, error: `网络请求失败: ${reqError.message}` }

                    // 如果不是最后一个地址，继续尝试下一个
                    if (i < urlsToTry.length - 1) {
                        continue
                    } else {
                        break
                    }
                }
            }

            // 检查响应是否成功
            const statusCode = resp ? resp.code : undefined

            // 检查是否有数据
            if (!resp || resp.data === null || resp.data === undefined) {
                return null
            }

            if (!statusCode || statusCode !== 200) {
                return null
            }

            // 解密响应数据
            const decryptedData = this.decrypt(resp.data)

            // 特殊处理：如果服务器返回 "null" 字符串
            if (resp.data === "null") {
                return null
            }

            // 检查解密结果是否为空
            if (!decryptedData || decryptedData.trim() === '') {
                // 如果原始数据不是加密格式，尝试直接解析
                if (resp.data && resp.data !== "null" && resp.data.length > 10) {
                    try {
                        const directJson = JSON.parse(resp.data)
                        if (directJson.data) {
                            return directJson.data
                        }
                    } catch (directParseError) {
                        // 忽略解析错误
                    }
                }

                return null
            }

            let json
            try {
                const parsedData = JSON.parse(decryptedData)
                json = parsedData.data
            } catch (jsonError) {
                return null
            }

            // 缓存结果
            this.cache[cacheKey] = json
            return json
        } catch (error) {
            return null
        }
    }

    /**
     * 获取分享数据
     * 
     * 解析分享链接或目录ID，获取完整的文件结构
     * 
     * @async
     * @param {string} url - 分享链接或目录ID
     * @returns {Promise<object>} 文件结构对象，按目录名分组
     */
    async getShareData(url) {
        try {
            if (!url) {
                return { videos: [], error: '链接不能为空' }
            }

            // 判断是URL还是目录ID
            const isValidUrl = url.startsWith('http')
            let pCaID = isValidUrl ? 'root' : url

            if (isValidUrl) {
                await this.getShareID(url)
            }

            let file = {}
            // 获取文件信息
            let fileInfo = await this.getShareFile(pCaID)

            if (fileInfo && Array.isArray(fileInfo)) {
                // 并发获取所有文件的下载链接
                await Promise.all(fileInfo.map(async (item) => {
                    if (!(item.name in file)) {
                        file[item.name] = []
                    }
                    let filelist = await this.getShareUrl(item.path)
                    if (filelist && filelist.length > 0) {
                        file[item.name].push(...filelist)
                    }
                }))
            }

            // 清理空的文件夹
            for (let key in file) {
                if (file[key].length === 0) {
                    delete file[key]
                }
            }

            // 如果没有找到文件，尝试获取根目录文件
            if (Object.keys(file).length === 0) {
                file['root'] = await this.getShareUrl(pCaID)
                if (file['root'] && Array.isArray(file['root'])) {
                    file['root'] = file['root'].filter(item => item && Object.keys(item).length > 0)
                }
            }

            // 标准化返回格式
            let videos = []
            for (let key in file) {
                const list = file[key] || []
                for (let i = 0; i < list.length; i++) {
                    const element = list[i]
                    
                    // 构建 remark，与其他网盘保持一致的格式（只显示文件大小）
                    let remark = '[移动]'  // 默认显示网盘类型
                    if (element.size && element.size > 0) {
                        // 使用与pan189.js相同的格式化逻辑
                        let size = element.size / 1024 / 1024  // 转换为 MB
                        let unit = 'MB'
                        if (size >= 1000) {
                            size = size / 1024  // 转换为 GB
                            unit = 'GB'
                        }
                        size = size.toFixed(1)
                        remark = `[${size}${unit}]`  // 只显示文件大小，与其他网盘保持一致
                    }
                    
                    videos.push({
                        name: element.name,
                        panType: this.getPanType(),
                        remark: remark,
                        data: element,
                    })
                }
            }

            return {
                videos: videos,
                error: '',
            }
        } catch (error) {
            return {
                videos: [],
                error: error.toString(),
            }
        }
    }

    /**
     * 获取分享文件列表
     * 
     * 递归获取指定目录下的所有文件和子目录
     * 
     * @async
     * @param {string} pCaID - 目录ID或分享链接
     * @returns {Promise<Array|null>} 文件列表数组，失败时返回null
     */
    async getShareFile(pCaID) {
        if (!pCaID) {
            return null
        }
        try {
            // 处理URL格式
            const isValidUrl = pCaID.startsWith('http')
            pCaID = isValidUrl ? 'root' : pCaID
            // 获取目录信息
            const json = await this.getShareInfo(pCaID)
            if (!json || !json.caLst) {
                return null
            }
            const caLst = json && json.caLst ? json.caLst : null
            const names = caLst.map(it => it.caName)
            const rootPaths = caLst.map(it => it.path)
            // 过滤不需要的目录
            const filterRegex = /App|活动中心|免费|1T空间|免流/
            const videos = []
            if (caLst && caLst.length > 0) {
                // 添加符合条件的目录
                names.forEach((name, index) => {
                    if (!filterRegex.test(name)) {
                        videos.push({name: name, path: rootPaths[index]})
                    }
                })
                // 递归获取子目录内容
                let result = await Promise.all(rootPaths.map(async (path) => this.getShareFile(path)))
                result = result.filter(item => item !== undefined && item !== null)
                return [...videos, ...result.flat()]
            }
        } catch (error) {
            return null
        }
    }

    /**
     * 获取分享文件的下载链接
     * 
     * 获取指定目录下所有视频文件的下载信息
     * 
     * @async
     * @param {string} pCaID - 目录ID
     * @returns {Promise<Array|null>} 文件下载信息数组，失败时返回null
     */
    async getShareUrl(pCaID) {
        try {
            const json = await this.getShareInfo(pCaID)
            if (!json || !('coLst' in json)) {
                return null
            }
            const coLst = json.coLst
            if (coLst !== null) {
                // 过滤出视频文件（coType === 3）
                const filteredItems = coLst.filter(it => it && it.coType === 3)
                return filteredItems.map(it => ({
                    name: it.coName,
                    contentId: it.path,
                    linkID: this.linkID,
                    size: it.coSize || 0  // 添加文件大小信息
                }))
            } else if (json.caLst !== null) {
                // 递归处理子目录
                const rootPaths = json.caLst.map(it => it.path)
                let result = await Promise.all(rootPaths.map(path => this.getShareUrl(path)))
                result = result.filter(item => item && item.length > 0)
                return result.flat()
            }
        } catch (error) {
            return null
        }
    }

    /**
     * 获取视频播放地址
     * @param {Object} data - 视频数据对象
     * @returns {Promise<Object>} 播放地址信息
     */
    async getPlayUrl(data) {
        try {
            // 获取播放链接
            const playUrl = await this.getSharePlay(data.contentId, data.linkID)

            if (!playUrl) {
                // 如果播放链接获取失败，尝试获取下载链接
                const downloadUrl = await this.getDownload(data.contentId, data.linkID)
                if (downloadUrl) {
                    return {
                        urls: [{
                            name: '下载',
                            url: downloadUrl,
                        }],
                        headers: {},
                    }
                }

                return {
                    urls: [],
                    error: '获取播放地址失败',
                }
            }

            return {
                urls: [{
                    name: '播放',
                    url: playUrl,
                }],
                headers: {},
            }
        } catch (error) {
            return {
                urls: [],
                error: error.toString(),
            }
        }
    }

    /**
     * 获取文件播放链接
     * 
     * 通过contentId和linkID获取文件的直接播放链接
     * 
     * @async
     * @param {string} contentId - 文件内容ID
     * @param {string} linkID - 分享链接ID
     * @returns {Promise<string|undefined>} 播放链接，失败时返回undefined
     */
    async getSharePlay(contentId, linkID) {
        // 构造请求数据
        let data = {
            "getContentInfoFromOutLinkReq": {
                "contentId": contentId.split('/')[1],
                "linkID": linkID,
                "account": ""
            },
            "commonAccountInfo": {
                "account": "",
                "accountType": 1
            }
        }
        // 发送API请求
        let resp = await req(this.baseUrl + 'getContentInfoFromOutLink', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Content-Type': 'application/json'
            },
            data: data,
            responseType: ReqResponseType.plain
        })
        if (resp.code === 200 && resp.data) {
            // getContentInfoFromOutLink API 返回未加密的JSON数据
            let responseData
            try {
                // 先尝试直接解析JSON（如果已经是对象就直接使用）
                responseData = typeof resp.data === 'string' ? JSON.parse(resp.data) : resp.data
            } catch (parseError) {
                return null
            }
            
            if (responseData && responseData.data && responseData.data.contentInfo) {
                return responseData.data.contentInfo.presentURL
            }
        }
    }

    /**
     * 获取文件下载链接
     * 
     * 通过contentId和linkID获取文件的直接下载链接（需要登录）
     * 
     * @async
     * @param {string} contentId - 文件内容ID
     * @param {string} linkID - 分享链接ID
     * @returns {Promise<string|undefined>} 下载链接，失败时返回undefined
     */
    async getDownload(contentId, linkID) {
        // 下载功能需要账号和认证信息，按需获取
        if (!this.account) {
            this.account = await this.getPanEnv('移动云盘账号') || ''
        }
        if (!this.authorization && !this.cookie) {
            this.cookie = await this.getPanEnv('移动云盘Cookie') || ''
            if (this.cookie) {
                const cookie = this.cookie.split(';')
                cookie.forEach((item) => {
                    if (item.indexOf('authorization') !== -1) {
                        this.authorization = item.replace('authorization=', '')
                    }
                })
            }
        }
        
        // 构造加密请求数据
        let data = this.encrypt(JSON.stringify({
            "dlFromOutLinkReqV3": {
                "linkID": linkID,
                "account": this.account,
                "coIDLst": {
                    "item": [contentId]
                }
            },
            "commonAccountInfo": {
                "account": this.account,
                "accountType": 1
            }
        }))
        // 发送API请求（需要authorization）
        let resp = await req(this.baseUrl + 'dlFromOutLinkV3', {
            method: 'POST',
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
                "Connection": "keep-alive",
                "Accept": "application/json, text/plain, */*",
                "Accept-Encoding": "gzip, deflate, br",
                "Content-Type": "application/json",
                "accept-language": "zh,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6",
                "authorization": this.authorization,
                "content-type": "application/json;charset=UTF-8",
                'hcy-cool-flag': '1',
                'x-deviceinfo': '||3|12.27.0|chrome|136.0.0.0|189f4426ca008b9cbe9bf9bd79723d77||windows 10|1536X695|zh|||'
            },
            data: data,
            responseType: ReqResponseType.plain
        })
        if (resp.code === 200) {
            // 解密响应获取下载链接
            let json = JSON.parse(this.decrypt(resp.data))
            return json.data.redrUrl
        }
    }
}

panSubClasses.push(PanYun)
// MARK: pikpak.js
// 请勿直接修改，请修改 pikpak.js 文件
// prettier-ignore


// PikPak云盘
// 作者：你猜
class PanPikPak {
    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanPikPak>} 返回当前模块类实例
     */
    static async getInstance(args) {
        let pan = new PanPikPak()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }

    // MARK: 挂载相关方法 (未实现)
    async supportPanMount() {
        return null
    }
    async getPanMountRootDir() {
        return {}
    }
    async getPanMountSubDir(args) {
        return {}
    }
    async getPanMountFile(args) {
        return new PanPlayInfo()
    }

    /**
     * 返回网盘类型
     */
    getPanType(args) {
        return 'pikpak'
    }

    /**
     * 是否可以解析分享链接
     */
    async canParse(args) {
        return args.url.includes('mypikpak.com') || args.url.includes('magnet')
    }

    /**
     * 解析分享链接并获取文件列表
     */
    async parseShareUrl(args) {
        UZUtils.debugLog('parseShareUrl==========>' + args.url)
        return await this.getShareData(args.url)
    }

    /**
     * 获取视频播放地址
     */
    async parseVideo(args) {
        UZUtils.debugLog('parseVideo==========>' + args.data)
        return await this.getShareUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {}

    constructor() {
        this.uzTag = ''
        this.auth = ''
        this.captcha_token = ''
        this.fileIds = ''
        this.parentId = ''
        this.ids = []
        this.index = 0
        this.regex = /https:\/\/mypikpak.com\/s\/(.*)\?act=play/
        this.api = 'https://api-drive.mypikpak.com/drive/v1/share'
        this.share_api = 'https://keepshare.org/ai1uqv5a/'
        this.x_client_id = 'YUMx5nI8ZU8Ap8pm'
        this.x_device_id = '9e8c121ebc0b409e85cc72cb2d424b54'
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            referer: 'https://mypikpak.com/',
            'accept-language': 'zh-CN',
        }
    }

    /**
     * 初始化，检查并验证Token
     */
    async init() {
        if (this.auth) return // 如果已经初始化过，则跳过

        let token = await this.getPanEnv('PikPakToken')
        if (token) {
            try {
                let exp = JSON.parse(
                    Crypto.enc.Base64.parse(token.split('.')[1]).toString(
                        Crypto.enc.Utf8
                    )
                )
                let now = Math.floor(Date.now() / 1000)
                if (exp.exp < now) {
                    UZUtils.debugLog('PikPak token已过期, 清除token')
                    await this.updatePanEnv('PikPakToken', '')
                    this.auth = ''
                } else {
                    UZUtils.debugLog('PikPak token有效')
                    this.auth = token
                }
            } catch (e) {
                UZUtils.debugLog('PikPak token解析失败, 清除token')
                await this.updatePanEnv('PikPakToken', '')
                this.auth = ''
            }
        } else {
            UZUtils.debugLog('未找到PikPak token, 将使用公共模式')
            this.auth = ''
        }
    }

    /**
     * 统一网络请求
     */
    async req_proxy(url, mth, header, data) {
        try {
            let config = {
                url: url,
                method: mth || 'get',
                headers: header || this.headers,
            }
            if (data !== undefined) {
                config.data = data
            }
            return await axios.request(config)
        } catch (error) {
            UZUtils.debugLog(error)
            return null
        }
    }

    /**
     * 获取验证码
     */
    async getCaptcha() {
        let payload = JSON.stringify({
            client_id: 'YUMx5nI8ZU8Ap8pm',
            action: 'GET:/drive/v1/share/file_info',
            device_id: '9e8c121ebc0b409e85cc72cb2d424b54',
            captcha_token: '',
            meta: {
                captcha_sign: '1.00d38b84b3231b2ac78b41091c11e5ca',
                client_version: 'undefined',
                package_name: 'drive.mypikpak.com',
                user_id: '',
                timestamp: '1758527222654',
            },
        })
        let captcha_data = await this.req_proxy(
            'https://user.mypikpak.com/v1/shield/captcha/init',
            'POST',
            {
                ...this.headers,
                'Content-Type': 'application/json',
                'x-client-id': this.x_client_id,
                'x-device-id': this.x_device_id,
            },
            payload
        )
        if (captcha_data && captcha_data.status === 200) {
            this.captcha_token = captcha_data.data.captcha_token
            return this.captcha_token
        }
        return ''
    }

    /**
     * 获取分享数据
     */
    async getShareData(url) {
        await this.init()
        let list = []
        if (url.startsWith('http')) {
            let pass_code_token = await this.getPass_code_token(url)
            let { share_id, parent_id } = await this.getSurl(url)
            list = await this.getShareList(share_id, parent_id, pass_code_token)
            return { videos: list }
        }
        if (url.startsWith('magnet')) {
            url = this.share_api + url
            let { redirect: link, pass_code_token } =
                await this.getShareRedirect(url)
            if (!link) return { videos: [] }
            let { share_id, parent_id } = await this.getSurl(link)
            list = await this.getShareList(share_id, parent_id, pass_code_token)
            return { videos: list }
        }
        return { videos: [] }
    }

    /**
     * 获取文件列表（统一处理）
     */
    async getShareList(share_id, parent_id, pass_code_token) {
        // 确保无论何种模式，都有最新的captcha_token
        await this.getCaptcha()

        let header = {
            ...this.headers,
            'x-captcha-token': this.captcha_token,
            'x-client-id': this.x_client_id,
            'x-device-id': this.x_device_id,
        }
        let url = `${this.api}/detail?limit=100&thumbnail_size=SIZE_LARGE&order=3&folders_first=true&share_id=${share_id}&parent_id=${parent_id}&pass_code_token=${pass_code_token}`
        let res = await this.req_proxy(url, 'get', header)

        if (res && res.status === 200 && res.data.files) {
            let dirs = []
            let videos = []
            res.data.files.forEach((item) => {
                if (item.kind === 'drive#folder') {
                    // Token模式下，追踪父ID路径
                    if (this.auth) {
                        if (this.index !== 0) {
                            this.ids = this.ids.map((it) => it + '|' + item.id)
                        } else {
                            this.ids.push(this.fileIds + '|' + item.id)
                        }
                    }
                    dirs.push({ share_id, parent_id: item.id, pass_code_token })
                } else if (
                    item.mime_type &&
                    item.mime_type.startsWith('video/')
                ) {
                    let video_data = {
                        name: item.name,
                        share_id: share_id,
                        file_id: item.id,
                        panType: this.getPanType(),
                        pass_code_token: pass_code_token,
                        size: item.size,
                    }

                    // Token模式下，添加用于转存的父ID
                    if (this.auth) {
                        video_data.parent_id =
                            this.index !== 0
                                ? this.ids.find((it) =>
                                      it.includes(item.parent_id)
                                  ) || parent_id
                                : parent_id
                    }

                    videos.push({
                        name: item.name,
                        panType: this.getPanType(),
                        data: video_data,
                    })
                }
            })

            if (this.auth) {
                this.index++
                if (dirs.length === 0) {
                    this.fileIds = this.parentId
                }
            }

            let result = await Promise.all(
                dirs.map((it) =>
                    this.getShareList(
                        it.share_id,
                        it.parent_id,
                        it.pass_code_token
                    )
                )
            )
            return [...videos, ...result.flat()]
        }
        return []
    }

    /**
     * 获取播放链接
     */
    async getShareUrl(data) {
        await this.init()
        const { share_id, file_id, parent_id, pass_code_token, size } = data

        // 优先尝试Token逻辑
        if (this.auth && !(await this.getSize(size))) {
            const links = await this.getMediasUrl(
                share_id,
                file_id,
                parent_id,
                pass_code_token
            )
            if (links && links.length > 0) {
                return {
                    urls: links.map((it, i) => ({
                        name: `原画${i + 1}`,
                        url: it,
                    })),
                }
            }
        }

        // Token逻辑失败或无Token，执行公共逻辑
        let x_captcha_token = await this.getCaptcha()
        let header = {
            ...this.headers,
            'x-captcha-token': x_captcha_token,
            'x-client-id': this.x_client_id,
            'x-device-id': this.x_device_id,
        }
        let url = `${this.api}/file_info?share_id=${share_id}&file_id=${file_id}&pass_code_token=${pass_code_token}`
        let res = await this.req_proxy(url, 'get', header)

        if (res && res.status === 200 && res.data.file_info) {
            let urls = []
            let medias = res.data.file_info.medias || []
            medias.forEach((media) => {
                urls.push({
                    name: media.media_name,
                    url: media.link.url,
                })
            })
            return { urls }
        }

        return { urls: [] }
    }

    // --- 辅助方法 ---

    async getPass_code_token(url) {
        let req_ = await this.req_proxy(url)
        if (!req_ || !req_.headers['set-cookie']) return ''

        let ck = req_.headers['set-cookie']
        let pass_code_token = ''
        if (ck && ck.length > 0) {
            this.cookie = ck
                .map((it) => {
                    let it_path = it.split(';')[0]
                    if (/passcode_token/.test(it_path)) {
                        pass_code_token = it_path.split('=')[1]
                    }
                    return it_path
                })
                .join('; ')
        }
        return pass_code_token
    }

    async getShareRedirect(url) {
        let req_ = await this.req_proxy(url)
        if (!req_ || !req_.redirects || req_.redirects.length === 0) {
            return { redirect: null, pass_code_token: '' }
        }

        let ck = req_.headers['set-cookie']
        let pass_code_token = ''
        if (ck && ck.length > 0) {
            this.cookie = ck
                .map((it) => {
                    let it_path = it.split(';')[0]
                    if (/passcode_token/.test(it_path)) {
                        pass_code_token = it_path.split('=')[1]
                    }
                    return it_path
                })
                .join('; ')
        }
        return {
            redirect: req_.redirects[0].location,
            pass_code_token: pass_code_token,
        }
    }

    async getSurl(url) {
        this.link = url.trim()
        let matches =
            this.regex.exec(url) || /https:\/\/mypikpak.com\/s\/(.*)/.exec(url)
        let share_id = '',
            parent_id = ''
        if (matches && matches[1]) {
            if (matches[1].includes('/')) {
                ;[share_id, parent_id] = matches[1].split('/')
            } else {
                share_id = matches[1]
            }
        }
        this.fileIds = parent_id
        this.parentId = parent_id
        return { share_id, parent_id }
    }

    // --- Token模式专属方法 ---

    async getSize(size) {
        return size / (1024 * 1024 * 1024) > 6
    }

    async trashEmpty() {
        await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/files/trash:empty',
            'PATCH',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'accept-language': 'zh-CN',
                authorization: this.auth,
                'content-type': 'application/json',
                'x-captcha-token': this.captcha_token,
                'x-device-id': this.x_device_id,
            }
        )
    }

    async getFileList() {
        let res = await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/events?thumbnail_size=SIZE_MEDIUM&limit=100',
            'GET',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'accept-language': 'zh-CN',
                authorization: this.auth,
                'x-captcha-token': this.captcha_token,
                'x-device-id': this.x_device_id,
            }
        )
        return res && res.status === 200
            ? res.data.events.map((it) => it.file_id)
            : []
    }

    async deleteFile(ids) {
        await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/files:batchTrash',
            'POST',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                authorization: this.auth,
                'x-captcha-token': this.captcha_token,
                'x-device-id': this.x_device_id,
            },
            JSON.stringify({ ids })
        )
    }

    async saveFile(share_id, file_ids, parent_id, pass_code_token) {
        let ids = await this.getFileList()
        if (ids && ids.length > 0) {
            await this.deleteFile(ids)
            await this.trashEmpty()
        }
        let data = JSON.stringify({
            share_id: share_id,
            pass_code_token: pass_code_token,
            file_ids: [file_ids],
            params: { trace_file_ids: file_ids },
            ancestor_ids: parent_id.split('|').filter((it) => it) || [
                parent_id,
            ],
        })
        let res = await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/share/restore',
            'POST',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'accept-language': 'zh-CN',
                authorization: this.auth,
                'x-captcha-token': this.captcha_token,
                'x-client-id': 'YUMx5nI8ZU8Ap8pm',
                'x-device-id': this.x_device_id,
            },
            data
        )
        return res && res.status === 200 && res.data.share_status === 'OK'
    }

    async getMediasUrl(share_id, file_id, parent_id, pass_code_token) {
        if (!this.auth) return []

        if (
            await this.saveFile(share_id, file_id, parent_id, pass_code_token)
        ) {
            let ids = await this.getFileList()
            if (ids && ids.length > 0) {
                let file = await this.req_proxy(
                    `https://api-drive.mypikpak.com/drive/v1/files/${ids[0]}?usage=FETCH`,
                    'GET',
                    {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                        'Content-Type': 'application/json',
                        'accept-language': 'zh-CN',
                        authorization: this.auth,
                        'x-captcha-token': this.captcha_token,
                        'x-client-id': 'YUMx5nI8ZU8Ap8pm',
                        'x-device-id': this.x_device_id,
                    }
                )
                if (file && file.status === 200) {
                    let links = []
                    if (file.data.web_content_link)
                        links.push(file.data.web_content_link)
                    if (
                        file.data &&
                        file.data.links &&
                        file.data.links['application/octet-stream'] &&
                        file.data.links['application/octet-stream'].url
                    ) {
                        links.push(
                            file.data.links['application/octet-stream'].url
                        )
                    }
                    return links
                }
            }
        }
        return []
    }
}

panSubClasses.push(PanPikPak)

// MARK: quark_uc.js
// 请勿直接修改，请修改 quark_uc.js 文件
// prettier-ignore


// 抄自 https://github.com/jadehh/TVSpider
// 集成了 CatPawOpen-main/nodejs/src/util/uc.js 的 Open API 支持

class QuarkClient {}
QuarkClient.apiUrl = 'https://drive-pc.quark.cn/1/clouddrive/'
QuarkClient.pr = 'pr=ucpro&fr=pc'
QuarkClient.httpHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
    Referer: 'https://pan.quark.cn/',
    'Content-Type': 'application/json',
}

const kUC_UTKeyWord = 'kUC_UTKeyWord'
class UCClient {}
UCClient.apiUrl = 'https://pc-api.uc.cn/1/clouddrive/'
UCClient.pr = 'pr=UCBrowser&fr=pc&sys=darwin&ve=1.8.6&ut=' + kUC_UTKeyWord
UCClient.httpHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
    Referer: 'https://drive.uc.cn',
    'Content-Type': 'application/json',
}

// UC Open API 配置
UCClient.Addition = {
    DeviceID: '07b48aaba8a739356ab8107b5e230ad4',
    RefreshToken: '',
    AccessToken: ''
}

UCClient.conf = {
    api: 'https://open-api-drive.uc.cn',
    clientID: '5acf882d27b74502b7040b0c65519aa7',
    signKey: 'l3srvtd7p42l0d0x1u8d7yc8ye9kki4d',
    appVer: '1.6.8',
    channel: 'UCTVOFFICIALWEB',
    codeApi: 'http://api.extscreen.com/ucdrive',
}

class QuarkUC {
    constructor(isQuark) {
        this.isQuark = isQuark || false
        this.cookie = ''
        this.shareTokenCache = {}
        this.saveFileIdCaches = {}
        this.saveDirId = null
        this.saveDirName = 'uz影视'
        this.uzTag = ''
        this.ut = ''
        this.token = '' // UC Open API token
        this.subtitleExts = ['.srt', '.ass', '.scc', '.stl', '.ttml']
        this.fileName = ''
    }

    get apiUrl() {
        if (this.isQuark) {
            return QuarkClient.apiUrl
        } else {
            return UCClient.apiUrl
        }
    }

    get pr() {
        if (this.isQuark) {
            return QuarkClient.pr
        } else {
            return UCClient.pr
        }
    }
    get headers() {
        const headers = this.isQuark
            ? QuarkClient.httpHeaders
            : UCClient.httpHeaders
        headers['Cookie'] = this.cookie
        return headers
    }
    get playHeaders() {
        var cookie = this.cookie
        if (this.isQuark == false) {
            const list = this.cookie.split(';')
            const newList = []
            for (const item of list) {
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
    }
    /**
     * 获取文件列表
     * @param {string} shareUrl
     * @returns {@Promise<PanListDetail>}
     **/
    async getFilesByShareUrl(shareUrl) {
        const data = new PanListDetail()
        this.fileName = ''
        const shareData = this.getShareData(shareUrl)
        if (shareData == null) {
            data.error = ''
            return data
        }

        await this.getShareToken(shareData)

        const videos = []
        const subtitles = []
        if (!this.shareTokenCache.hasOwnProperty(shareData.shareId)) {
            data.error = ''
            return data
        }

        await this.listFile(
            shareData,
            videos,
            subtitles,
            shareData.shareId,
            shareData.folderId
        )

        // if (subtitles.length > 0) {
        //     for (const item of videos) {
        //         const matchSubtitle = this.findBestLCS(item, subtitles)
        //         if (matchSubtitle.bestMatch != null) {
        //             item.subtitle = matchSubtitle.bestMatch.target
        //         }
        //     }
        // }
        for (let index = 0; index < videos.length; index++) {
            const item = videos[index]
            // 复制 item
            const element = JSON.parse(JSON.stringify(item))
            let size =
                (element.size !== undefined && element.size !== null
                    ? element.size
                    : 0) /
                1024 /
                1024
            let unit = 'MB'
            if (size >= 1000) {
                size = size / 1024
                unit = 'GB'
            }
            size = size.toFixed(1)
            const remark = `[${size}${unit}]`
            const videoItem = new PanVideoItem()
            videoItem.data = element
            videoItem.panType = this.getPanType()
            videoItem.name = element.name
            if (kAppVersion > 1650) {
                videoItem.remark = remark
            } else {
                videoItem.name = `${element.name} ${remark}`
            }
            data.videos.push(videoItem)
        }
        data.fileName = this.fileName
        return data
    }

    /**
     * 获取播放信息
     * @param {{flag:string,shareId:string,shareToken:string,fileId:string,shareFileToken:string }} arg
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPlayUrl(arg) {
        if (this.cookie.length === 0) {
            const info = new PanPlayInfo()
            info.error =
                '请在 设置 -> 数据管理 -> 环境变量 中为' +
                this.getCookieName() +
                '添加值'
            return info
        }

        let playData = new PanPlayInfo()

        try {
            const { flag, shareId, shareToken, fileId, shareFileToken } = arg

            const saveFileId = await this.save({
                shareId,
                stoken: shareToken,
                fileId,
                fileToken: shareFileToken,
                clean: true,
            })

            if (saveFileId == null) {
                const info = new PanPlayInfo()
                info.error = '转存失败，可能空间不足 或 cookie 错误～'
                return info
            }
            this.saveFileIdCaches = {}
            this.saveFileIdCaches[fileId] = saveFileId

            let urls = await this.getVideoPlayUrl({ fileId: fileId })
            playData.urls = urls
            playData.urls.sort((a, b) => {
                return b.priority - a.priority
            })
            playData.url = playData.urls[0].url
        } catch (error) {
            playData.error = error.toString()
        }
        // 检查是否有 Open API 返回的 URL
        const hasOpenAPI = playData.urls.some(u => u.isOpenAPI)
        if (!hasOpenAPI) {
            // 只有在没有 Open API URL 时才设置 playHeaders
            playData.playHeaders = this.playHeaders
        }
        return playData
    }

    async getVideoPlayUrl({ fileId, isMount = false }) {
        let rawUrls = await this.getDownload({
            fileId: fileId,
            isMount: isMount,
        })
        let transcodingUrls = await this.getLiveTranscoding({
            fileId: fileId,
            isMount: isMount,
        })
        if (transcodingUrls.length < 2 && rawUrls.length > 0) {
            rawUrls[0].priority = 9999
        }
        return [...rawUrls, ...transcodingUrls]
    }

    async api(url, data, retry, method) {
        retry || (retry = 3)
        let leftRetry = retry
        method || (method = 'post')

        if (url.includes(kUC_UTKeyWord)) {
            if (this.ut.length < 1) {
                const data = await req(UCClient.apiUrl + 'file', {
                    responseType: ReqResponseType.plain,
                })
                if (data.data && data.data.length > 0) {
                    this.ut = data.data
                }
            }
            // 替换 URL 中的 UT 占位符
            if (this.ut.length > 0) {
                url = url.replace(kUC_UTKeyWord, this.ut)
            }
        }

        while (leftRetry > 0) {
            try {
                const response = await req(this.apiUrl + url, {
                    method: method,
                    headers: this.headers,
                    data: JSON.stringify(data),
                })
                if (response.code === 401) {
                    this.cookie = ''
                    toast({
                        msg: this.getPanType() + '登录失效，请重新登录',
                        type: 'error',
                    })
                    return {}
                }
                const resp = response.data
                if (response.headers['set-cookie']) {
                    const puus = [response.headers['set-cookie']]
                        .join(';;;')
                        .match(/__puus=([^;]+)/)
                    if (puus) {
                        if (this.cookie.match(/__puus=([^;]+)/)[1] != puus[1]) {
                            this.cookie = this.cookie.replace(
                                /__puus=[^;]+/,
                                `__puus=${puus[1]}`
                            )
                            await this.updatePanEnv(
                                this.getCookieName(),
                                this.cookie
                            )
                        }
                    }
                }
                return resp
            } catch (e) {}
            leftRetry--
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        return resp
    }

    /**
     * 根据链接获取分享ID和文件夹ID
     * @param {string} url
     * @returns {null|{shareId: string, folderId: string}}
     **/
    getShareData(url) {
        let regex = /https:\/\/pan\.quark\.cn\/s\/([^\\|#/]+)/
        if (!this.isQuark) {
            regex = /https:\/\/drive\.uc\.cn\/s\/([^\\|#/]+)/
        }
        const matches = regex.exec(url)
        if (matches != null) {
            return { shareId: matches[1], folderId: '0' }
        }
        return null
    }
    /**
     * 获取分享token
     * @param {{shareId: string, sharePwd: string}} shareData
     **/
    async getShareToken(shareData) {
        if (!this.shareTokenCache.hasOwnProperty(shareData.shareId)) {
            delete this.shareTokenCache[shareData.shareId]
            const shareToken = await this.api(
                `share/sharepage/token?${this.pr}`,
                {
                    pwd_id: shareData.shareId,
                    passcode: shareData.sharePwd || '',
                }
            )
            if (this.fileName.length < 1) {
                this.fileName =
                    shareToken && shareToken.data && shareToken.data.title
                        ? shareToken.data.title
                        : ''
            }
            if (
                shareToken &&
                shareToken.data != null &&
                shareToken.data.stoken != null
            ) {
                this.shareTokenCache[shareData.shareId] = shareToken.data
            }
        }
    }

    async listFile(shareData, videos, subtitles, shareId, folderId, page) {
        if (page == null) page = 1
        const pageSize = 100
        const listData = await this.api(
            `share/sharepage/detail?${
                this.pr
            }&pwd_id=${shareId}&stoken=${encodeURIComponent(
                this.shareTokenCache[shareId].stoken
            )}&pdir_fid=${folderId}&force=0&_page=${page}&_size=${pageSize}&_sort=file_type:asc,file_name:asc`,
            null,
            3,
            'get'
        )
        if (listData.data == null) return []
        const items = listData.data.list || []
        if (items.length === 0) return []
        const subDir = []
        const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.m3u8', '.ts', '.rmvb', '.rm', '.mpeg', '.mpg', '.m4v', '.webm']
        for (const item of items) {
            if (item.dir === true) {
                subDir.push(item)
            } else if (item.file === true && (item.category === 1 || item.obj_category === 'video' || videoExts.some(ext => item.file_name && item.file_name.toLowerCase().endsWith(ext)))) {
                if (parseInt(item.size.toString()) < 1024 * 1024 * 5) continue
                item.stoken = this.shareTokenCache[shareData.shareId].stoken
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
                this.subtitleExts.some((x) => item.file_name.endsWith(x))
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

        if (page < Math.ceil(listData.metadata._total / pageSize)) {
            const nextItems = await this.listFile(
                shareData,
                videos,
                subtitles,
                shareId,
                folderId,
                page + 1
            )
            items.push(...nextItems)
        }
        for (const dir of subDir) {
            const subItems = await this.listFile(
                shareData,
                videos,
                subtitles,
                shareId,
                dir.fid
            )
            items.push(...subItems)
        }
        return items
    }
    findBestLCS(mainItem, targetItems) {
        const results = []
        let bestMatchIndex = 0
        for (let i = 0; i < targetItems.length; i++) {
            const currentLCS = UZUtils.lcs(mainItem.name, targetItems[i].name)
            results.push({ target: targetItems[i], lcs: currentLCS })
            if (currentLCS.length > results[bestMatchIndex].lcs.length) {
                bestMatchIndex = i
            }
        }
        const bestMatch = results[bestMatchIndex]
        return {
            allLCS: results,
            bestMatch: bestMatch,
            bestMatchIndex: bestMatchIndex,
        }
    }
    /**
     * 清空保存目录
     */
    async clearSaveDir() {
        if (this.saveDirId == null) return
        const listData = await this.api(
            `file/delete?${this.pr}&pdir_fid=${this.saveDirId}&_page=1&_size=200&_sort=file_type:asc,name:desc`,
            {
                action_type: 2,
                filelist: [this.saveDirId],
                exclude_fids: [],
            },
            3,
            'post'
        )
        if (listData.status === 200) {
            this.saveDirId = null
        }
    }

    /**
     * 创建保存目录
     */
    async createSaveDir() {
        const listData = await this.api(
            `file/sort?${this.pr}&pdir_fid=0&_page=1&_size=200&_sort=file_type:asc,name:desc`,
            null,
            3,
            'get'
        )
        if (listData.data != null && listData.data.list != null) {
            for (const item of listData.data.list) {
                if (item.file_name === this.saveDirName) {
                    this.saveDirId = item.fid
                    await this.clearSaveDir()
                    break
                }
            }
        }
        if (this.saveDirId == null) {
            const create = await this.api(`file?${this.pr}`, {
                pdir_fid: '0',
                file_name: this.saveDirName,
                dir_path: '',
                dir_init_lock: false,
            })
            if (create.data != null && create.data.fid != null) {
                this.saveDirId = create.data.fid
            }
        }
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
    async save({ shareId, stoken, fileId, fileToken, clean = false }) {
        await this.createSaveDir()
        if (this.saveDirId == null) return null
        if (stoken == null) {
            await this.getShareToken({ shareId })
            if (!this.shareTokenCache.hasOwnProperty(shareId)) return null
        }
        const saveResult = await this.api(`share/sharepage/save?${this.pr}`, {
            fid_list: [fileId],
            fid_token_list: [fileToken],
            to_pdir_fid: this.saveDirId,
            pwd_id: shareId,
            stoken: stoken || this.shareTokenCache[shareId].stoken,
            pdir_fid: '0',
            scene: 'link',
        })
        if (saveResult.data != null && saveResult.data.task_id != null) {
            let retry = 0
            while (true) {
                const taskResult = await this.api(
                    `task?${this.pr}&task_id=${saveResult.data.task_id}&retry_index=${retry}`,
                    null,
                    3,
                    'get'
                )
                if (
                    taskResult.data != null &&
                    taskResult.data.save_as != null &&
                    taskResult.data.save_as.save_as_top_fids != null &&
                    taskResult.data.save_as.save_as_top_fids.length > 0
                ) {
                    return taskResult.data.save_as.save_as_top_fids[0]
                }
                retry++
                if (retry > 2) break
                await new Promise((resolve) => setTimeout(resolve, 1000))
            }
        }
        return null
    }

    /**
     *  获取指定目录下的文件列表
     * @param {Object} param0
     * @param {string} param0.pdir_fid - 目录ID
     * @param {number} param0.page - 页码
     * @returns {Promise<[PanMountListData]>}
     */
    async getFileList({ pdir_fid, page }) {
        try {
            pdir_fid = pdir_fid || '0'
            page = page || 1
            const resData = await this.api(
                `file/sort?${this.pr}&uc_param_str=&pdir_fid=${pdir_fid}&_page=${page}&_size=200&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,file_name:asc`,
                null,
                3,
                'get'
            )

            let list = resData.data && resData.data.list ? resData.data.list : []
            let mountList = []
            for (let index = 0; index < list.length; index++) {
                const element = list[index]

                let remark = ''
                let size =
                    (element.size !== undefined && element.size !== null
                        ? element.size
                        : 0) /
                    1024 /
                    1024
                let unit = 'MB'
                if (size != 0) {
                    if (size >= 1000) {
                        size = size / 1024
                        unit = 'GB'
                    }
                    size = size.toFixed(1)
                    remark = `[${size}${unit}]`
                }

                let dataType = PanDataType.Unknown
                if (element.category == 1) {
                    dataType = PanDataType.Video
                } else if (element.file_type == 0) {
                    dataType = PanDataType.Dir
                }
                mountList.push({
                    name: element.file_name,
                    panType: this.getPanType(),
                    dataType: dataType,
                    data: {
                        fid: element.fid,
                    },
                    remark: remark,
                })
            }
            return mountList
        } catch (e) {}
        return []
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
    async getLiveTranscoding(args) {
        let isMount = args.isMount !== undefined ? args.isMount : false
        const transcoding = await this.api(`file/v2/play?${this.pr}`, {
            fid: isMount ? args.fileId : this.saveFileIdCaches[args.fileId],
            resolutions: 'normal,low,high,super,2k,4k',
            supports: 'fmp4',
        })

        var urls = []
        const nameMap = {
            FOUR_K: '4K',
            SUPER: '超清',
            HIGH: '高清',
            NORMAL: '流畅',
        }
        if (transcoding.data != null && transcoding.data.video_list != null) {
            for (const video of transcoding.data.video_list) {
                const videoInfo = video.video_info || {}
                const resoultion = videoInfo.resoultion
                const priority = videoInfo.width
                const url = videoInfo.url
                if (resoultion && url) {
                    const name =
                        nameMap[resoultion] !== undefined &&
                        nameMap[resoultion] !== null
                            ? nameMap[resoultion]
                            : resoultion
                    urls.push({
                        url: url,
                        name: name,
                        headers: this.playHeaders,
                        priority: priority,
                    })
                }
            }
        }
        return urls
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
    async getDownload(args) {
        let isMount = args.isMount !== undefined ? args.isMount : false

        // UC 网盘优先尝试使用 Open API token 方式
        if (!this.isQuark && this.token && this.token.length > 0) {
            try {
                const pathname = '/file'
                const timestamp = Math.floor(Date.now() / 1000).toString() + '000'
                const deviceID = UCClient.Addition.DeviceID || generateDeviceID(timestamp)
                const reqId = generateReqId(deviceID, timestamp)
                const x_pan_token = generateXPanToken('GET', pathname, timestamp, UCClient.conf.signKey)

                const config = {
                    method: 'GET',
                    url: `${UCClient.conf.api}/file`,
                    params: {
                        req_id: reqId,
                        access_token: this.token,
                        app_ver: UCClient.conf.appVer,
                        device_id: deviceID,
                        device_brand: 'Xiaomi',
                        platform: 'tv',
                        device_name: 'M2004J7AC',
                        device_model: 'M2004J7AC',
                        build_device: 'M2004J7AC',
                        build_product: 'M2004J7AC',
                        device_gpu: 'Adreno (TM) 550',
                        activity_rect: '{}',
                        channel: UCClient.conf.channel,
                        method: 'streaming',
                        group_by: 'source',
                        fid: isMount ? args.fileId : this.saveFileIdCaches[args.fileId],
                        resolution: 'low,normal,high,super,2k,4k',
                        support: 'dolby_vision'
                    },
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 9; zh-cn; RMX1931 Build/PQ3A.190605.05081124) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1',
                        'Connection': 'Keep-Alive',
                        'Accept-Encoding': 'gzip',
                        'x-pan-tm': timestamp,
                        'x-pan-token': x_pan_token,
                        'content-type': 'text/plain;charset=UTF-8',
                        'x-pan-client-id': UCClient.conf.clientID
                    }
                }

                const response = await axios.request(config)
                if (
                    response.status === 200 &&
                    response.data &&
                    response.data.data &&
                    response.data.data.video_info
                ) {
                    const videoInfo = response.data.data.video_info.filter((t) => t.accessable)[0]
                    if (videoInfo && videoInfo.url) {
                        // Open API 返回的 URL 已包含认证参数
                        // 参考 CatPawOpen: 当使用 token 时，不设置 header
                        // 同时标记这是 Open API 返回的 URL，以便在 getPlayUrl 中不设置 playHeaders
                        return [
                            {
                                name: '原画',
                                url: videoInfo.url,
                                headers: {},
                                priority: 9999,
                                isOpenAPI: true,  // 标记为 Open API
                            }
                        ]
                    }
                }
            } catch (error) {
                UZUtils.debugLog('UC Open API 获取下载地址失败:', error)
                // 失败后继续尝试传统方式
            }
        }

        // 传统 cookie 方式
        try {
            // this.pr 中已经包含了 UT 参数（如果有的话）
            const down = await this.api(
                `file/download?${this.pr}&uc_param_str=`,
                {
                    fids: isMount
                        ? [args.fileId]
                        : [this.saveFileIdCaches[args.fileId]],
                }
            )

            if (
                down.data != null &&
                down.data.length > 0 &&
                down.data[0].download_url != null
            ) {
                let priority = 9999
                if (this.isQuark && down.data[0].video_width > 2000) {
                    priority = 0
                }
                return [
                    {
                        name: '原画',
                        url: down.data[0].download_url,
                        headers: this.playHeaders,
                        priority: priority,
                    },
                ]
            }
        } catch (error) {
            UZUtils.debugLog('获取下载地址失败:', error)
        }
        return []
    }

    async initPan() {
        if (this.cookie.length < 1) {
            this.cookie = await this.getPanEnv(this.getCookieName())
        }

        // UC 网盘额外初始化 token
        // UT 会在 api 方法中动态获取，无需从环境变量读取
        if (!this.isQuark) {
            if (this.token.length < 1) {
                const token = await this.getPanEnv('UC_Token')
                if (token && token.length > 0) {
                    this.token = token
                }
            }
        }
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        // MARK: 需要实现
        return this.isQuark ? '夸克' : 'UC'
    }

    getCookieName() {
        return this.isQuark ? '夸克Cookie' : 'UCCookie'
    }

    /**
     * 读取环境变量 key 为 registerEnvs 配置项的 name。
     * 可直接调用
     * @param {String} key
     * @returns
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为 registerEnvs 配置项的 name。
     * 可直接调用
     * @param {String} key
     * @param {String} value
     * @returns
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        // MARK: 需要实现
        if (!this.isQuark) {
            args.url = args.url.split('?')[0]
        }
        return await this.getFilesByShareUrl(args.url)
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        // MARK: 需要实现
        await this.initPan()
        return await this.getPlayUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // MARK: 推荐实现
        await this.initPan()
        await this.clearSaveDir()
    }

    /**
     * 是否支持挂载
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例的Promise对象
     */
    async supportPanMount() {
        // MARK: 推荐实现，不支持 不需要改动
        await this.initPan()
        return new PanMount(
            this.getPanType(),
            this.getPanType(),
            this.cookie.length > 0
        )
    }

    /**
     * 获取网盘根目录
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountRootDir() {
        // MARK: 推荐实现
        await this.initPan()
        let data = []
        let error = ''
        try {
            data = await this.getFileList({
                pdir_fid: '0',
                page: 1,
            })
        } catch (error) {
            error = error
        }
        return {
            data: data,
            error: error,
        }
    }

    /**
     * 获取网盘子目录
     * @param {PanMountListData.data} args PanMountListData 的 data
     * @param {number} args.page 页码
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getPanMountSubDir(args) {
        await this.initPan()
        // MARK: 推荐实现
        try {
            let data = await this.getFileList({
                pdir_fid: args.data.fid,
                page: args.page,
            })
            return {
                data: data,
                error: '',
            }
        } catch (error) {
            return {
                data: [],
                error: error,
            }
        }
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData.data} args PanMountListData 的 data
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPanMountFile(args) {
        // MARK: 推荐实现
        try {
            let urls = await this.getVideoPlayUrl({
                fileId: args.fid,
                isMount: true,
            })
            let playData = new PanPlayInfo()
            playData.urls = urls
            return playData
        } catch (error) {
            return {
                error: error,
            }
        }
    }
}

class PanQuark extends QuarkUC {
    constructor() {
        super() // 调用父类构造函数，初始化公共属性
        this.isQuark = true
    }

    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanXXX>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new PanQuark()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        // MARK: 需要实现
        if (args.url.includes('pan.quark.cn')) {
            return true
        } else {
            return false
        }
    }
}

class PanUC extends QuarkUC {
    constructor() {
        super()
        this.isQuark = false
    }

    /**
     * 获取实例
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanXXX>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new PanUC()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        // MARK: 需要实现
        if (args.url.includes('drive.uc.cn')) {
            return true
        } else {
            return false
        }
    }
}

panSubClasses.push(PanQuark, PanUC)
