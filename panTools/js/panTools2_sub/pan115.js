// ignore

import { cheerio, Crypto, Encrypt, JSONbig, Buffer } from '../../../core/core/uz3lib.js'
import { UZUtils } from '../../../core/core/uzUtils.js'
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

// 获取 JSEncrypt 内部的 BigInteger 类
// JSEncrypt 是一个构造函数，需要先实例化才能访问内部类
let BigInteger = null
try {
    const tempEncrypt = new Encrypt()
    // 设置一个临时公钥来初始化内部结构
    tempEncrypt.setPublicKey('-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN\nFOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76\nxFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4\ngwQco1KRMDSmXSMkDwIDAQAB\n-----END PUBLIC KEY-----')
    // 获取 BigInteger 构造函数
    if (tempEncrypt.key && tempEncrypt.key.n) {
        BigInteger = tempEncrypt.key.n.constructor
    }
} catch (e) {
    UZUtils.debugLog('115 获取 BigInteger 失败:', e.toString())
}

// 115网盘
// 参考 https://github.com/gendago/CatPawOpen
class Pan115 {
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
     * @returns {Promise<Pan115>} 返回当前模块类实例
     */
    static async getInstance(args) {
        UZUtils.debugLog('115 getInstance called')
        let pan = new Pan115()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        UZUtils.debugLog('115 getInstance success')
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
        return '115'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        UZUtils.debugLog('115 canParse url:', args.url)
        // 支持 115.com, anxia.com, 115cdn.com 域名
        const result = /https:\/\/(?:115|anxia|115cdn)\.com\/s\/[a-zA-Z0-9]+/.test(args.url)
        UZUtils.debugLog('115 canParse result:', result)
        return result
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        UZUtils.debugLog('115 parseShareUrl called with url:', args.url)
        const result = await this.getFilesByShareUrl(args.url)
        UZUtils.debugLog('115 parseShareUrl result:', JSON.stringify(result))
        return result
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
        // 115 不需要实现
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

    ////////////////////////////////////////
    // 115 网盘特有实现
    ////////////////////////////////////////

    constructor() {
        // 支持更宽松的 URL 格式，密码部分可能包含特殊字符
        this.regex = /https:\/\/(?:115|anxia|115cdn)\.com\/s\/([a-zA-Z0-9]+)(?:\?password=([^&#\s]+))?/
        this.cookieKey = '115Cookie'
    }

    uzTag = ''
    cookie = ''

    /**
     * 初始化，获取 Cookie
     */
    async init() {
        if (!this.cookie) {
            this.cookie = await this.getPanEnv(this.cookieKey)
        }
    }

    /**
     * 判断是否为媒体文件
     */
    isMediaFile(filename) {
        const ext = filename?.slice(filename?.lastIndexOf('.') + 1)?.toLowerCase()
        return ['mp4', 'webm', 'avi', 'wmv', 'flv', 'mov', 'mkv', 'mpeg', '3gp', 'ts', 'm2ts', 'mp3', 'wav', 'aac', 'iso'].includes(ext)
    }

    /**
     * 从分享链接中提取分享码和接收码
     */
    getShareData(shareUrl) {
        const matches = this.regex.exec(shareUrl)
        if (!matches) return null

        return {
            shareCode: matches[1],
            receiveCode: matches[2] || '' // 如果没有密码，使用空字符串
        }
    }

    /**
     * 递归获取分享链接中的所有文件
     */
    async getFilesByShareUrl(shareUrl) {
        try {
            const shareData = this.getShareData(shareUrl)
            UZUtils.debugLog('115 shareData:', shareData)

            if (!shareData) {
                return {
                    videos: [],
                    fileName: '',
                    error: '无法解析分享链接',
                }
            }

            const videos = []
            const listFile = async (dirID) => {
                UZUtils.debugLog('115 requesting dirID:', dirID)
                const dirInfo = await axios.get(`https://webapi.115.com/share/snap`, {
                    params: {
                        share_code: shareData.shareCode,
                        receive_code: shareData.receiveCode,
                        cid: dirID,
                        limit: '9999',
                        offset: '0',
                    },
                })

                UZUtils.debugLog('115 response status:', dirInfo.status)
                UZUtils.debugLog('115 response data type:', typeof dirInfo.data)

                // 解析 JSON 响应
                let responseData = dirInfo.data
                if (typeof responseData === 'string') {
                    responseData = JSON.parse(responseData)
                }

                UZUtils.debugLog('115 parsed data:', JSON.stringify(responseData))

                if (!responseData.data) return

                // 检查分享链接状态
                if (responseData.data.share_state === 7) {
                    const forbidReason = responseData.data.shareinfo?.forbid_reason || '链接已过期'
                    throw new Error(forbidReason)
                }

                const files = responseData.data.list.filter((item) => item.fc === 1)
                const folders = responseData.data.list.filter((o) => o.fc === 0)

                UZUtils.debugLog('115 found files:', files.length, 'folders:', folders.length)

                for (let file of files) {
                    UZUtils.debugLog('115 checking file:', file.n)
                    if (this.isMediaFile(file.n)) {
                        UZUtils.debugLog('115 added media file:', file.n)
                        videos.push({
                            ...file,
                            shareCode: shareData.shareCode,
                            receiveCode: shareData.receiveCode,
                        })
                    }
                }

                for (let folder of folders) {
                    UZUtils.debugLog('115 entering folder:', folder.n, 'cid:', folder.cid)
                    await listFile(folder.cid)
                }
            }

            await listFile(shareData.shareCode)

            const panVideos = videos.map((v) => {
                let size = v.s / 1024 / 1024
                let unit = 'MB'
                if (size >= 1000) {
                    size = size / 1024
                    unit = 'GB'
                }
                size = size.toFixed(1)

                return {
                    name: v.n,
                    remark: `[${size}${unit}]`,
                    panType: this.getPanType(),
                    data: {
                        shareCode: v.shareCode,
                        receiveCode: v.receiveCode,
                        fileId: v.fid,
                    },
                }
            })

            return {
                videos: panVideos,
                fileName: videos.length > 0 ? videos[0].n : '',
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

    /**
     * 获取播放地址
     */
    async getPlayUrl(data) {
        await this.init()

        const { shareCode, receiveCode, fileId } = data
        const requestData = `data=${encodeURIComponent(
            this.encrypt115(
                `{"share_code":"${shareCode}","receive_code":"${receiveCode}","file_id":"${fileId}"}`
            )
        )}`

        try {
            const response = await axios.post(
                'http://pro.api.115.com/app/share/downurl',
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Cookie: this.cookie,
                    },
                }
            )

            // 解析响应数据（可能是字符串）
            let responseData = response.data
            if (typeof responseData === 'string') {
                responseData = JSON.parse(responseData)
            }

            if (!responseData) {
                return new PanPlayInfo('', '115盘无响应数据')
            }

            // 优先检查 state 和 error
            if (responseData.state === false) {
                // 优先使用 msg 字段，如果没有再使用 error 字段
                const errorMsg = responseData.msg || responseData.error || '未知错误'
                if (errorMsg.includes('登录')) {
                    return new PanPlayInfo('', '请在 设置 -> 数据管理 -> 环境变量 中为115Cookie添加值')
                }
                return new PanPlayInfo('', `115盘错误: ${errorMsg}`)
            }

            // 检查 data 字段是否存在且为字符串
            if (!responseData.data || typeof responseData.data !== 'string') {
                return new PanPlayInfo('', '请在 设置 -> 数据管理 -> 环境变量 中为115Cookie添加值')
            }

            const resData = JSON.parse(this.decrypt115(responseData.data))
            return new PanPlayInfo(resData.url.url)
        } catch (error) {
            return new PanPlayInfo('', error.toString())
        }
    }

    ////////////////////////////////////////
    // 115 加密/解密算法
    ////////////////////////////////////////

    // 115 密钥表
    G_kts = new Uint8Array([
        0xf0, 0xe5, 0x69, 0xae, 0xbf, 0xdc, 0xbf, 0x8a, 0x1a, 0x45, 0xe8, 0xbe, 0x7d, 0xa6, 0x73, 0xb8,
        0xde, 0x8f, 0xe7, 0xc4, 0x45, 0xda, 0x86, 0xc4, 0x9b, 0x64, 0x8b, 0x14, 0x6a, 0xb4, 0xf1, 0xaa,
        0x38, 0x01, 0x35, 0x9e, 0x26, 0x69, 0x2c, 0x86, 0x00, 0x6b, 0x4f, 0xa5, 0x36, 0x34, 0x62, 0xa6,
        0x2a, 0x96, 0x68, 0x18, 0xf2, 0x4a, 0xfd, 0xbd, 0x6b, 0x97, 0x8f, 0x4d, 0x8f, 0x89, 0x13, 0xb7,
        0x6c, 0x8e, 0x93, 0xed, 0x0e, 0x0d, 0x48, 0x3e, 0xd7, 0x2f, 0x88, 0xd8, 0xfe, 0xfe, 0x7e, 0x86,
        0x50, 0x95, 0x4f, 0xd1, 0xeb, 0x83, 0x26, 0x34, 0xdb, 0x66, 0x7b, 0x9c, 0x7e, 0x9d, 0x7a, 0x81,
        0x32, 0xea, 0xb6, 0x33, 0xde, 0x3a, 0xa9, 0x59, 0x34, 0x66, 0x3b, 0xaa, 0xba, 0x81, 0x60, 0x48,
        0xb9, 0xd5, 0x81, 0x9c, 0xf8, 0x6c, 0x84, 0x77, 0xff, 0x54, 0x78, 0x26, 0x5f, 0xbe, 0xe8, 0x1e,
        0x36, 0x9f, 0x34, 0x80, 0x5c, 0x45, 0x2c, 0x9b, 0x76, 0xd5, 0x1b, 0x8f, 0xcc, 0xc3, 0xb8, 0xf5,
    ])

    // RSA 公钥指数和模数 (使用 JSEncrypt 的 BigInteger)
    _RSA_e = null
    _RSA_n = null

    get RSA_e() {
        if (this._RSA_e === null) {
            this._RSA_e = new BigInteger('8686980c0f5a24c4b9d43020cd2c22703ff3f450756529058b1cf88f09b8602136477198a6e2683149659bd122c33592fdb5ad47944ad1ea4d36c6b172aad6338c3bb6ac6227502d010993ac967d1aef00f0c8e038de2e4d3bc2ec368af2e9f10a6f1eda4f7262f136420c07c331b871bf139f74f3010e3c4fe57df3afb71683', 16)
        }
        return this._RSA_e
    }

    get RSA_n() {
        if (this._RSA_n === null) {
            this._RSA_n = new BigInteger('10001', 16)
        }
        return this._RSA_n
    }

    /**
     * BigInteger 转字节数组
     */
    toBytes(value, length) {
        if (length == undefined) length = Math.ceil(value.toString(16).length / 2)
        const buffer = new Uint8Array(length)
        for (let i = length - 1; i >= 0; i--) {
            buffer[i] = value.and(new BigInteger('ff', 16)).intValue()
            value = value.shiftRight(8)
        }
        return buffer
    }

    /**
     * 字节数组转 BigInteger
     */
    fromBytes(bytes) {
        let intVal = new BigInteger('0', 10)
        for (const b of bytes) {
            intVal = intVal.shiftLeft(8).or(new BigInteger(String(b), 10))
        }
        return intVal
    }

    /**
     * 累积步进生成器
     */
    *accStep(start, stop, step = 1) {
        for (let i = start + step; i < stop; i += step) {
            yield [start, i, step]
            start = i
        }
        if (start !== stop) yield [start, stop, stop - start]
    }

    /**
     * 字节数组异或运算
     */
    bytesXor(v1, v2) {
        const result = new Uint8Array(v1.length)
        for (let i = 0; i < v1.length; i++) result[i] = v1[i] ^ v2[i]
        return result
    }

    /**
     * 生成密钥
     */
    genKey(randKey, skLen) {
        const xorKey = new Uint8Array(skLen)
        let length = skLen * (skLen - 1)
        let index = 0
        for (let i = 0; i < skLen; i++) {
            const x = (randKey[i] + this.G_kts[index]) & 0xff
            xorKey[i] = this.G_kts[length] ^ x
            length -= skLen
            index += skLen
        }
        return xorKey
    }

    /**
     * PKCS1 v1.5 填充
     */
    padPkcs1V1_5(message) {
        const msg_len = message.length
        const buffer = new Uint8Array(128)
        buffer.fill(0x02, 1, 127 - msg_len)
        buffer.set(message, 128 - msg_len)
        return this.fromBytes(buffer)
    }

    /**
     * XOR 异或运算
     */
    xor(src, key) {
        const buffer = new Uint8Array(src.length)
        const i = src.length & 0b11
        if (i) buffer.set(this.bytesXor(src.subarray(0, i), key.subarray(0, i)))
        for (const [j, k] of this.accStep(i, src.length, key.length))
            buffer.set(this.bytesXor(src.subarray(j, k), key), j)
        return buffer
    }

    /**
     * 模幂运算 (使用 BigInteger 的 modPow 方法)
     */
    pow(base, exponent, modulus) {
        return base.modPow(exponent, modulus)
    }

    /**
     * 115 加密
     */
    encrypt115(data) {
        if (typeof data === 'string' || data instanceof String) {
            // 使用 Crypto.enc.Utf8.parse 替代 TextEncoder
            const wordArray = Crypto.enc.Utf8.parse(data)
            // 将 WordArray 转换为 Uint8Array
            const words = wordArray.words
            const sigBytes = wordArray.sigBytes
            data = new Uint8Array(sigBytes)
            for (let i = 0; i < sigBytes; i++) {
                data[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
            }
        }
        const xorText = new Uint8Array(16 + data.length)
        xorText.set(
            this.xor(
                this.xor(data, new Uint8Array([0x8d, 0xa5, 0xa5, 0x8d])).reverse(),
                new Uint8Array([0x78, 0x06, 0xad, 0x4c, 0x33, 0x86, 0x5d, 0x18, 0x4c, 0x01, 0x3f, 0x46])
            ),
            16
        )
        const cipherData = new Uint8Array(Math.ceil(xorText.length / 117) * 128)
        let start = 0
        for (const [l, r] of this.accStep(0, xorText.length, 117))
            cipherData.set(
                this.toBytes(this.pow(this.padPkcs1V1_5(xorText.subarray(l, r)), this.RSA_n, this.RSA_e), 128),
                start,
                (start += 128)
            )
        return Buffer.from(cipherData).toString('base64')
    }

    /**
     * 115 解密
     */
    decrypt115(cipherData) {
        const cipher_data = new Uint8Array(Buffer.from(cipherData, 'base64'))
        let data = []
        for (const [l, r] of this.accStep(0, cipher_data.length, 128)) {
            const p = this.pow(this.fromBytes(cipher_data.subarray(l, r)), this.RSA_n, this.RSA_e)
            const b = this.toBytes(p)
            data.push(...b.subarray(b.indexOf(0) + 1))
        }
        data = new Uint8Array(data)
        const keyL = this.genKey(data.subarray(0, 16), 12)
        const tmp = this.xor(data.subarray(16), keyL).reverse()
        // 使用 Crypto.enc.Utf8.stringify 替代 TextDecoder
        const bytes = this.xor(tmp, new Uint8Array([0x8d, 0xa5, 0xa5, 0x8d]))
        const words = []
        for (let i = 0; i < bytes.length; i += 4) {
            words.push(
                (bytes[i] << 24) |
                ((bytes[i + 1] || 0) << 16) |
                ((bytes[i + 2] || 0) << 8) |
                (bytes[i + 3] || 0)
            )
        }
        const wordArray = Crypto.lib.WordArray.create(words, bytes.length)
        return Crypto.enc.Utf8.stringify(wordArray)
    }
}

// 注册 115 网盘 (使用 JSEncrypt 的 BigInteger，不依赖原生 BigInt)
if (BigInteger !== null) {
    UZUtils.debugLog('115 网盘已注册 (使用 JSEncrypt BigInteger)')
    panSubClasses.push(Pan115)
} else {
    UZUtils.debugLog('115 网盘注册失败：无法获取 BigInteger 类')
}

