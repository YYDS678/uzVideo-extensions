// ignore
// 不支持导入，这里只是本地开发用于代码提示
// 如需添加通用依赖，请联系 https://t.me/uzVideoAppbot
import {} from '../uzVideo.js'
import {} from './uzHome.js'
import {} from '../uz3lib.js'
import {} from '../uzUtils.js'
// ignore

/**
 * 网盘类型
 * 环境变量 key 为 PanType.xx + "Cookie",请在 json 文件中添加
 */
const PanType = {
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
         * @type {{name:string,url:string,headers:object,priority:number}[]}
         * @property {string} name 名称 4k 高清 之类
         * @property {string} url 播放地址
         * @property {object} headers 播放头
         * @property {number} priority 优先级
         */
        this.urls = []
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
        this.error = ''
    }
}

/**
 * 网盘挂载 类型
 */
class PanMount {
    constructor(name = '', panType = PanType.UC) {
        /**
         * 网盘展示名称
         */
        this.name = name

        /**
         * 网盘类型
         * @type {PanType}
         */
        this.panType = panType
    }
}

/**
 * 网盘数据类型
 * @type {{Video: string, Dir: string}}
 **/
const PanDataType = {
    /**
     * 视频
     */
    Video: 'video',

    /**
     * 目录
     */
    Dir: 'dir',
}

/**
 * 网盘挂载列表
 */
class PanMountListData {
    constructor(
        name = '',
        panType = PanType.UC,
        dataType = PanDataType.Dir,
        data = {}
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

//MARK: - 夸克 UC 相关实现
class QuarkUC {}

//MARK: - 阿里 相关实现
class Ali {}

//MARK: 网盘扩展统一入口
/**
 * 网盘工具
 */
class PanTools {
    constructor() {
        //MARK: 1. 在这里初始化 对应网盘的具体实现对象

        this.quark = new QuarkUC()
        this.uc = new QuarkUC()
        this.ali = new Ali()

        /**
         * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
         */
        this._uzTag = ''
    }

    /**
     * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
     */
    set uzTag(value) {
        this._uzTag = value

        this.setSaveDirName()
    }

    get uzTag() {
        return this._uzTag
    }

    /**
     * 获取 夸克 UC cookie  ** 无法在 PanTools 外部操作**
     * 环境变量 key 为 PanType.xx + "Cookie",请在 json 文件中添加
     * @param {PanType} panType
     * @returns {@Promise<string>}
     */
    async getQuarkUCCookie(panType) {
        const cookie = await getEnv(this.uzTag, panType + 'Cookie')
        return cookie
    }

    /**
     * 更新 夸克 UC cookie ** 无法在 PanTools 外部操作**
     * @param {PanType} panType
     * @param {string} cookie
     */
    async updateQuarkUCCookie(panType, cookie) {
        await setEnv(this.uzTag, panType + 'Cookie', cookie)
    }

    /**
     * 获取 Alitoken  ** 无法在 PanTools 外部操作**
     * 环境变量 key 为 PanType.xx + keyWord关键字,请在 json 文件中添加
     * @param {PanType} panType
     * @param {string} keyWord
     * @returns {@Promise<string>}
     */
    async getAliDataEnv(panType, keyWord) {
        const data = await getEnv(this.uzTag, panType + keyWord)
        return data
    }

    /**
     * 更新 Alitoken  ** 无法在 PanTools 外部操作**
     * @param {PanType} panType
     * @param {string} keyWord
     * @param {string} data
     */
    async updateAliDataEnv(panType, keyWord, data) {
        await setEnv(this.uzTag, panType + keyWord, data)
    }

    /**
     * 设置用户指定的转存文件夹名称
     */
    async setSaveDirName() {
        var dirName = await getEnv(this.uzTag, '转存文件夹名称')

        if (dirName == null || dirName === '') {
            dirName = 'uz影视'
            await setEnv(this.uzTag, '转存文件夹名称', dirName)
        }
        //MARK: 2. 请补充自定义转存文件夹名称
        this.quark.saveDirName = dirName
        this.uc.saveDirName = dirName
        this.ali.saveDirName = dirName
    }

    /**
     * 清理转存文件夹
     */
    async cleanSaveDir() {
        //MARK: 3. 请实现清理转存文件夹
        await this.quark.createSaveDir()
        await this.uc.createSaveDir()
        await this.ali.createSaveDir()
    }

    /**
     * 获取网盘资源列表
     * @param {string} shareUrl
     * @returns {@Promise<PanListDetail>}
     */
    async getShareVideos(shareUrl) {
        //MARK: 4. 请实现获取网盘资源列表
        if (shareUrl.includes('https://pan.quark.cn')) {
            const data = await this.quark.getFilesByShareUrl(shareUrl)
            return JSON.stringify(data)
        } else if (shareUrl.includes('https://drive.uc.cn')) {
            shareUrl = shareUrl.split('?')[0]
            const data = await this.uc.getFilesByShareUrl(shareUrl)
            return JSON.stringify(data)
        } else if (shareUrl.includes('https://www.alipan.com')) {
            const data = await this.ali.getFilesByShareUrl(shareUrl)
            return JSON.stringify(data)
        }

        const data = new PanListDetail()
        data.error = ''
        return JSON.stringify(data)
    }

    /**
     * 获取播放信息
     * @param {PanVideoItem} item
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPlayInfo(item) {
        //MARK: 5. 请实现获取播放信息
        if (item.panType === PanType.Quark) {
            /// 如果需要 cookie 请在这里获取
            this.quark.cookie = await this.getQuarkUCCookie(PanType.Quark)
            /// 更新 Quark cookie
            const that = this
            this.quark.updateCookie = function () {
                that.updateQuarkUCCookie(PanType.Quark, this.cookie)
            }
            if (this.quark.cookie === '') {
                const data = new PanPlayInfo()
                data.error = '获取 ' + PanType.Quark + ' cookie 失败~'
                return JSON.stringify(data)
            }
            const data = await this.quark.getPlayUrl(item.data)
            return JSON.stringify(data)
        } else if (item.panType === PanType.UC) {
            /// 如果需要 cookie 请在这里获取
            this.uc.cookie = await this.getQuarkUCCookie(PanType.UC)
            /// 更新 UC cookie
            const that = this
            this.uc.updateCookie = function () {
                that.updateQuarkUCCookie(PanType.UC, this.cookie)
            }
            if (this.uc.cookie === '') {
                const data = new PanPlayInfo()
                data.error = '获取 ' + PanType.UC + ' cookie 失败~'
                return JSON.stringify(data)
            }
            const data = await this.uc.getPlayUrl(item.data)
            return JSON.stringify(data)
        } else if (item.panType === PanType.Ali) {
            /// 如果需要 data 请在这里获取
            this.ali.token32 = await this.getAliDataEnv(PanType.Ali, 'Token32')
            this.ali.token280 = await this.getAliDataEnv(
                PanType.Ali,
                'Token280'
            )
            /// 更新 token
            const that = this
            this.ali.updateToken32 = function () {
                that.updateAliDataEnv(PanType.Ali, 'Token32', this.ali.token32)
            }
            this.ali.updateToken280 = function () {
                that.updateAliDataEnv(PanType.Ali, 'Token280', this.ali.token32)
            }
            if (this.ali.token32 === '' || this.ali.token280 === '') {
                const data = new PanPlayInfo()
                data.error = '获取 ' + PanType.Ali + ' token 失败~'
                return JSON.stringify(data)
            }
            const data = await this.ali.getPlayUrl(item.data)
            return JSON.stringify(data)
        }

        const data = new PanPlayInfo()
        data.error = '暂不支持 ' + item.panType + ' 网盘~'
        return JSON.stringify(data)
    }

    //MARK: - 伪挂载相关 以下暂未实现

    /**
     * 返回支持挂载的网盘
     * @returns {@Promise<[PanMount]>}
     */
    async getSupportMountPan() {
        return JSON.stringify([
            new PanMount('阿里盘', PanType.Ali),
            new PanMount('UC', PanType.UC),
            new PanMount('Quark', PanType.Quark),
        ])
    }

    /**
     * 获取网盘根目录
     * @param {PanType} panType
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getRootDir(panType) {}

    /**
     * 获取网盘挂载子目录
     * @param {PanMountListData} item
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getMountDir(item) {}

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData} item
     * @returns {@Promise<PanPlayInfo>}
     */
    async getMountFile(item) {}
}

// 固定实例名称
const uzPanToolsInstance = new PanTools()
