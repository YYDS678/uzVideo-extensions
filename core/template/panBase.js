//@name:夸克|UC|天翼|123|百度|解析 综合扩展
//@version:31
//@remark:iOS14 以上版本可用,App v1.6.54 及以上版本可用
//@env:百度网盘Cookie##用于播放百度网盘视频&&UCCookie##用于播放UC网盘视频&&夸克Cookie##用于播放Quark网盘视频&&转存文件夹名称##在各网盘转存文件时使用的文件夹名称&&123网盘账号##用于播放123网盘视频&&123网盘密码##用于播放123网盘视频&&天翼网盘账号##用于播放天翼网盘视频&&天翼网盘密码##用于播放天翼网盘视频&&采集解析地址##内置两个，失效不要反馈。格式：名称1@地址1;名称2@地址2
//@order: A

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
    }

    panToolsHandlers = []

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

    _isInitSuccess = false
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
