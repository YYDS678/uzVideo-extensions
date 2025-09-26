// ignore

// 在这里导入模块(调试开发时使用,合并时 会移除 ignore 包裹的内容)
import { cheerio, Crypto, Encrypt, JSONbig } from '../../../core/core/uz3lib.js'
import {
    PanType,
    PanDataType,
    PanMount,
    PanMountListData,
    PanPlayInfo,
    PanVideoItem,
    PanListDetail,
    panSubClasses,
} from '../panTools2.js'
import { axios, qs, base64Decode, base64Encode } from './common.js'

// ignore

// MARK: 需要实现
// 请修改模块名称,合并文件时会匹配第一个 class 类名
class PanSubBase {
    /**
     * 运行时标识符，会自动赋值一次，请勿修改
     */
    uzTag = ''

    /**
     * 获取实例，不要做耗时操作
     *
     * @param {Object} args - 函数参数对象
     * @param {string} args.uzTag - 运行时标识符
     * @param {string} args.saveDirName - 保存目录名称
     * @returns {Promise<PanXXX>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new PanXXX()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 返回网盘类型 PanType ,请勿与其他平台的冲突
     * @param {Object} args - 函数参数对象
     *
     * @returns {string} 返回网盘类型名称
     */
    getPanType(args) {
        // MARK: 需要实现
        return 'xxx网盘'
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
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        // MARK: 需要实现
        // if (args.url.includes('pan.baidu.com')) {
        //     return true
        // } else {
        //     return false
        // }
        return false
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        // MARK: 需要实现
        return new PanListDetail()
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
     */
    async parseVideo(args) {
        // MARK: 需要实现
        return new PanPlayInfo()
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {
        // MARK: 推荐实现
    }

    /**
     * 是否支持挂载，不支持返回 null
     *
     * @returns {Promise<PanMount>} 返回一个PanMount实例
     */
    async supportPanMount() {
        // MARK: 推荐实现，不支持 返回 null
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

    // --------- 开始关键逻辑 ---------
    // --------- 开始关键逻辑 ---------
    // --------- 开始关键逻辑 ---------
}

// MARK: 需要实现
// 添加模块 class
panSubClasses.push(PanSubBase)
