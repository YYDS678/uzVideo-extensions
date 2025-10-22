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

//123盘
// 抄自 https://github.com/hjdhnx/drpy-node/
class Pan123 {
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
        this.regex =
            /https:\/\/(www\.)?123(684|865|912|pan)\.(com|cn)\/s\/([^\\/]+)/
        this.api = 'https://www.123684.com/b/api/share/'
        this.loginUrl = 'https://login.123pan.com/api/user/sign_in'
        this.cate = ''
    }
    uzTag = ''
    password = ''
    passport = ''
    authKey = '123panAuth'
    auth = ''

    async init() {
        try {
            if (this.auth.length < 1) {
                const auth = await UZUtils.getStorage({
                    key: this.authKey,
                    uzTag: this.uzTag,
                })
                this.auth = auth
            }

            if (this.auth?.length > 0) {
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

        if (auth?.data?.token) {
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

    fileName = ''
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
                SharePwd: SharePwd ?? '',
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
            let infoList = (
                await axios.get(this.api + 'get', {
                    headers: {},
                    params: {
                        limit: '100',
                        next: next,
                        orderBy: 'file_name',
                        orderDirection: 'asc',
                        shareKey: shareKey,
                        SharePwd: SharePwd ?? '',
                        ParentFileId: ParentFileId,
                        Page: '1',
                    },
                })
            ).data?.data?.InfoList
            infoList?.forEach((it) => {
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

            let down = resp?.data?.data
            let url = down?.DownloadURL

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
            let down = (await axios.request(config))?.data?.data
                ?.video_play_info
            let videoinfo = []
            down?.forEach((item) => {
                if (item.url !== '') {
                    videoinfo.push({
                        name: item.resolution,
                        url: item.url,
                        priority: item.height,
                    })
                }
            })

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
