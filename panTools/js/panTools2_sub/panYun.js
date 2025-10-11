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
    ReqResponseType,
    req,
} from '../panTools2.js'
import { qs, base64Decode, base64Encode } from './common.js'

// ignore

// 移动云盘（139邮箱云盘）
// 抄自 https://github.com/hjdhnx/drpy-node/

class PanYun {
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
            const statusCode = resp?.code

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
                for (let i = 0; i < file[key]?.length; i++) {
                    const element = file[key][i]
                    
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
            const caLst = json?.caLst
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