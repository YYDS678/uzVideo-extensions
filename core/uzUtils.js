/**
 * @file 工具类
 */

class UZUtils {
    /**
     * 用于在 uz 扩展调试模式中展示 log 信息
     */
    static debugLog() {
        sendMessage('debugLog', JSON.stringify([...arguments]))
    }

    /**
     * 从链接中获取域名
     * @param {string} url
     * @returns
     */
    static getHostFromURL(url) {
        const protocolEndIndex = url.indexOf('://')
        if (protocolEndIndex === -1) {
            return null
        }
        const hostStartIndex = protocolEndIndex + 3
        const hostEndIndex = url.indexOf('/', hostStartIndex)
        const host = hostEndIndex === -1 ? url.slice(hostStartIndex) : url.slice(hostStartIndex, hostEndIndex)

        return `${url.slice(0, protocolEndIndex + 3)}${host}`
    }

    /**
     * 去除尾部的斜杠
     * @param {string} str
     * @returns
     */
    static removeTrailingSlash(str) {
        if (str.endsWith('/')) {
            return str.slice(0, -1)
        }
        return str
    }

    /**
     * 根据正则表达式获取字符串
     * @param {*} pattern
     * @param {string} str
     * @returns {string}
     */
    static getStrByRegexDefault(pattern, str) {
        let matcher = pattern.exec(str)
        if (matcher !== null) {
            if (matcher.length >= 1) {
                if (matcher.length >= 1) return matcher[1]
            }
        }
        return str
    }

    /**
     * 计算最长公共子串
     * @param {string} s1
     * @param {string} s2
     * @returns
     */
    static lcs(s1, s2) {
        const m = s1.length,
            n = s2.length
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
        let maxLength = 0,
            endIndex = 0

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (s1[i - 1] === s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1
                    if (dp[i][j] > maxLength) {
                        maxLength = dp[i][j]
                        endIndex = i - 1
                    }
                }
            }
        }

        return s1.substring(endIndex - maxLength + 1, endIndex + 1)
    }

    /**
     * 查找元素在数组中的位置
     * @param {Array} list
     * @param {string} element
     * @returns
     */
    static findIndex(list, element) {
        for (let i = 0; i < list.length; i++) {
            if (list[i] === element) {
                return i
            }
        }
        return -1
    }

    /**
     * 忽略大小写查找字典中的 key
     * @param {object} dict - 需要查找的字典
     * @param {string} key - 需要匹配的键
     * @returns {string|null} - 匹配到的原始键，或 null
     */
    static findIgnoreCase(dict, key) {
        if (typeof dict !== 'object' || dict === null || typeof key !== 'string') {
            return null
        }
        for (let k in dict) {
            if (k.toLowerCase() === key.toLowerCase()) {
                return k
            }
        }
        return null
    }

    /**
     * 忽略大小写从字典中查找元素
     * @param {object} dict - 需要查找的字典
     * @param {string} key - 需要匹配的键
     * @returns {any|null} - 匹配到的值，如果没有找到则返回 null
     */
    static findValueIgnoreCaseInDict(dict, key) {
        if (typeof dict !== 'object' || dict === null || typeof key !== 'string') {
            return null
        }
        for (let k in dict) {
            if (k.toLowerCase() === key.toLowerCase()) {
                return dict[k]
            }
        }
        return null
    }

    /**
     * 向字典中添加元素，自动匹配大小写
     * @param {object} dict - 要添加元素的字典
     * @param {string} key - 要匹配或添加的键
     * @param {any} value - 要添加的值
     * @returns {object} - 更新后的字典
     */
    static addValueToDict(dict, key, value) {
        if (typeof dict !== 'object' || dict === null || typeof key !== 'string') {
            return dict
        }

        // 查找字典中是否有与 key 大小写不敏感匹配的键
        for (let k in dict) {
            if (k.toLowerCase() === key.toLowerCase()) {
                dict[k] = value // 更新已存在的键的值
                return dict
            }
        }
        // 如果未找到匹配的键，则直接添加新键值对
        dict[key] = value
        return dict
    }

    /**
     * 持久化存储数据
     * @param {string} key
     * @param {string} value
     */
    static async setStorage(key, value) {
        await sendMessage('setStorage', JSON.stringify({ key: key, value: value }))
    }

    /**
     * 读取持久化存储数据，如果不存在则返回空字符串
     * @param {string} key
     * @returns {string}
     */
    static async getStorage(key) {
        return await sendMessage('getStorage', JSON.stringify({ key: key }))
    }
}

//MARK: - 网络请求返回数据
/**
 * req 返回的数据
 */
class ProData {
    constructor() {
        this.error = ''
        this.data

        /**
         * @type {object} 响应头
         */
        this.headers

        /**
         * @type {number} 状态码
         */
        this.code

        /**
         * @type {boolean} 是否成功
         */
        this.ok = () => this.code === 200
    }
}

/**
 * 请求响应类型
 */
const ReqResponseType = {
    json: 'json',
    arraybuffer: 'arraybuffer',
    bytes: 'bytes',
    plain: 'plain',
    stream: 'stream',
}

//MARK: - 网络请求
/**
 * 网络请求
 * @param {string} url 请求的URL
 * @param {object} options 请求参数 {headers:{},method:"POST",data:{},responseType:ReqResponseType}
 * @returns {Promise<ProData>}
 */
async function req(url, options) {
    let pro = await sendMessage('req', JSON.stringify({ url: url, options: options }))
    return pro
}

/**
 * 读取环境变量 用户会看到读取通知
 * @param {string} uzTag 直接传入扩展的 uzTag ,请勿修改
 * @param {string} key
 * @returns {@Promise<string>}
 */
async function getEnv(uzTag, key) {
    let res = await sendMessage('getEnv', JSON.stringify({ uzTag: uzTag, key: key }))
    return res
}

/**
 * 写入环境变量 用户会看到写入通知
 * @param {string} uzTag 直接传入扩展的 uzTag ,请勿修改
 * @param {string} key
 * @param {string} value
 * @param {string} summary 描述，新增时建议传入。修改时不必传入
 */
async function setEnv(uzTag, key, value, summary) {
    let res = await sendMessage(
        'setEnv',
        JSON.stringify({
            uzTag: uzTag,
            key: key,
            value: value,
            summary: summary,
        })
    )
}

/**
 * 跳转到验证页面，自动保存cookie
 * @param {string} url
 **/
async function goToVerify(url) {
    await sendMessage('goToVerify', JSON.stringify({ url: url }))
}

/**
 * toast 弹窗
 * @param {string} msg 提示信息
 * @param {number} duration 持续时间
 **/
function toast(msg, duration = 2) {
    sendMessage('toast', JSON.stringify({ msg: msg, duration: duration }))
}
