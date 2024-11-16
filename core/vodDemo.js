// ignore
import {} from './uzVideo.js'
import {} from './uzUtils.js'
import {} from './uz3lib.js'
// ignore

// TODO: 请根据实际情况修改 class name
class VodDemo extends WebApiBase {
    constructor() {
        super()
        /**
         * 网站主页
         **/
        this.webSite = ''

        /**
         * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
         */
        this.uzTag = ''
    }

    /**
     * 异步获取分类列表的方法。
     * @param {UZArgs} args
     * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
     */
    async getClassList(args) {
        var backData = new RepVideoClassList()
        try {
        } catch (error) {
            backData.error = error.toString()
        }
        return JSON.stringify(backData)
    }

    /**
     * 获取二级分类列表筛选列表的方法。
     * @param {UZArgs} args
     * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
     */
    async getSubclassList(args) {
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
    async getVideoList(args) {
        var backData = new RepVideoList()
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
    async getSubclassVideoList(args) {
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
    async getVideoDetail(args) {
        var backData = new RepVideoDetail()
        try {
        } catch (error) {
            backData.error = error.toString()
        }
        return JSON.stringify(backData)
    }
    /**
     * 获取视频的播放地址
     * @param {UZArgs} args
     * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
     */
    async getVideoPlayUrl(args) {
        var backData = new RepVideoPlayUrl()
        try {
        } catch (error) {
            backData.error = error.toString()
        }
        return JSON.stringify(backData)
    }
    /**
     * 搜索视频
     * @param {UZArgs} args
     * @returns {@Promise<JSON.stringify(new RepVideoList())>}
     */
    async searchVideo(args) {
        var backData = new RepVideoList()
        try {
        } catch (error) {
            backData.error = error.toString()
        }
        return JSON.stringify(backData)
    }
}

// TODO: 请根据实际情况修改 class name  instance name
var vodDemo20241116 = new VodDemo()
