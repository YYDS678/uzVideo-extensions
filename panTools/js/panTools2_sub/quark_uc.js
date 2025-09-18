// ignore

import { cheerio, Crypto, Encrypt, JSONbig } from '../../../core/core/uz3lib.js'
import { toast } from '../../../core/core/uzUtils.js'
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

// 抄自 https://github.com/jadehh/TVSpider

class QuarkClient {
    static apiUrl = 'https://drive-pc.quark.cn/1/clouddrive/'
    static pr = 'pr=ucpro&fr=pc'
    static httpHeaders = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
        Referer: 'https://pan.quark.cn/',
        'Content-Type': 'application/json',
    }
}

const kUC_UTKeyWord = 'kUC_UTKeyWord'
class UCClient {
    static apiUrl = 'https://pc-api.uc.cn/1/clouddrive/'

    static pr = 'pr=UCBrowser&fr=pc&sys=darwin&ve=1.8.6&ut=' + kUC_UTKeyWord
    static httpHeaders = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
        Referer: 'https://drive.uc.cn',
        'Content-Type': 'application/json',
    }
}

class QuarkUC {
    constructor(isQuark) {
        this.isQuark = isQuark || false
        this.cookie = ''
        this.shareTokenCache = {}
        this.saveFileIdCaches = {}
        this.saveDirId = null
        this.saveDirName = 'uz影视'
    }
    uzTag = ''
    ut = ''

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
    fileName = ''
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
            let size = (element.size ?? 0) / 1024 / 1024
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
        playData.playHeaders = this.playHeaders
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
                if (data.data?.length > 0) {
                    this.ut = data.data
                }
            } else {
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
                this.fileName = shareToken?.data?.title
            }
            if (shareToken?.data != null && shareToken?.data?.stoken != null) {
                this.shareTokenCache[shareData.shareId] = shareToken?.data
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
        for (const item of items) {
            if (item.dir === true) {
                subDir.push(item)
            } else if (item.file === true && item.obj_category === 'video') {
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

            let list = resData.data?.list ?? []
            let mountList = []
            for (let index = 0; index < list.length; index++) {
                const element = list[index]

                let remark = ''
                let size = (element.size ?? 0) / 1024 / 1024
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
        let isMount = args.isMount ?? false
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
                const resoultion = video.video_info?.resoultion
                const priority = video.video_info?.width
                const url = video.video_info?.url
                if (resoultion && url) {
                    urls.push({
                        url: url,
                        name: nameMap[resoultion] ?? resoultion,
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
        let isMount = args.isMount ?? false
        try {
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
        } catch (error) {}
        return []
    }

    async initPan() {
        if (this.cookie.length < 1) {
            this.cookie = await this.getPanEnv(this.getCookieName())
        }
    }

    /**
     * 运行时标识符，会自动赋值一次，请勿修改
     */
    uzTag = ''

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
