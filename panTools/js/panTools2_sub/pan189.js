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

//189云盘
// 抄自 https://github.com/hjdhnx/drpy-node/

class Pan189 {
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
    }

    account = ''
    password = ''
    cookie = ''
    authKey = '189panAuth'
    normalHeaders = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json;charset=UTF-8',
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

            const lastReqUrl = lastReq.location ?? lastReq.url

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

                cookies +=
                    '; ' +
                        resp.headers?.['set-cookie']
                            ?.map((it) => it.split(';')[0])
                            .join(';') ?? ''
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

    fileName = ''
    
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
                for (let i = 0; i < file[key]?.length; i++) {
                    const element = file[key][i]
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
                if (check.status === 200 && check.data?.shareId) {
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
                if (!this.shareId && resp.data?.shareId) {
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

            const text = resp?.data ?? ''
            const json = JSONbig.parse(text)

            const data = json?.fileListAO
            let folderList = data?.folderList
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

            let json = JSONbig.parse(resp.data ?? '')

            let videos = []
            const data = json?.fileListAO
            let fileList = data?.fileList
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
            const totalCount = data?.count ?? 0
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
