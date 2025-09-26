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

// baidu云盘
// 抄自 https://github.com/hjdhnx/drpy-node/
class PanBaidu {
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
        await this.initBaidu()
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

    uzTag = ''

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
            const bduss = this.cookie.match(/BDUSS=([^;]+)/)?.[1]

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
            return response.data?.data?.fields?.uid || null
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
            let size = (element.size ?? 0) / 1024 / 1024
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
