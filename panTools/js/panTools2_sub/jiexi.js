// ignore

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

// 解析
class JieXi {
    /**
     * 运行时标识符，会自动赋值一次，请勿修改
     */
    uzTag = ''

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
