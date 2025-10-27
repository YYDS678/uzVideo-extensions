function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))
}
function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))
}
class axios {
    /**
     * 发送请求
     * @param {object} config 请求配置
     * @returns {Promise<ProData>}
     */
    static async request(config) {
        let {
            url,
            method = 'GET',
            headers = {},
            data,
            params,
            responseType,
            addressType,
            maxRedirects,
        } = config

        let options = {
            method,
            headers,
            data,
            queryParameters: params,
            responseType,
            addressType,
            maxRedirects,
        }

        const response = await req(url, options)
        response.status = response.code
        return response
    }

    /**
     * GET 请求
     * @param {string} url 请求的URL
     * @param {object} [config] 可选的请求配置
     * @returns {Promise<ProData>}
     */
    static async get(url, config = {}) {
        return await axios.request({ ...config, url, method: 'GET' })
    }
    /**
     * POST 请求
     * @param {string} url 请求的URL
     * @param {object} [data] 可选的请求数据
     * @param {object} [config] 可选的请求配置
     * @returns {Promise<ProData>}
     */
    static async post(url, data, config = {}) {
        return await axios.request({ ...config, url, method: 'POST', data })
    }
}

class qs {
    static stringify(obj, prefix = '') {
        const pairs = []

        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

            const value = obj[key]
            const fullKey = prefix ? `${prefix}[${key}]` : key

            if (value === null || value === undefined) {
                pairs.push(encodeURIComponent(fullKey) + '=')
            } else if (typeof value === 'object') {
                pairs.push(stringify(value, fullKey))
            } else {
                pairs.push(
                    encodeURIComponent(fullKey) +
                        '=' +
                        encodeURIComponent(value)
                )
            }
        }

        return pairs.join('&')
    }

    static toObject(str) {
        if (typeof str !== 'string' || str.length === 0) {
            return {}
        }
        str = str.replace(/&/g, ',').replace(/=/g, ':')
        const obj = {}
        const pairs = str.split(',')
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i].split(':')
            obj[pair[0]] = pair[1]
        }
        return obj
    }
}

/**
 * 延迟函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 查找最佳LCS匹配
 * @param {Object} mainItem 主项目，需要有 name 属性
 * @param {Array} targetItems 目标项目数组，每项需要有 name 属性
 * @returns {Object} 返回 {allLCS, bestMatch, bestMatchIndex}
 */
function findBestLCS(mainItem, targetItems) {
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

    return { allLCS: results, bestMatch: bestMatch, bestMatchIndex: bestMatchIndex }
}

/**
 * 生成设备ID
 * @param {string} timestamp 时间戳
 * @returns {string} 设备ID（MD5前16位）
 */
function generateDeviceID(timestamp) {
    return Crypto.MD5(timestamp).toString().slice(0, 16)
}

/**
 * 生成请求ID
 * @param {string} deviceID 设备ID
 * @param {string} timestamp 时间戳
 * @returns {string} 请求ID（MD5前16位）
 */
function generateReqId(deviceID, timestamp) {
    return Crypto.MD5(deviceID + timestamp).toString().slice(0, 16)
}

/**
 * 生成X-Pan-Token签名
 * @param {string} method HTTP方法
 * @param {string} pathname 路径名
 * @param {string} timestamp 时间戳
 * @param {string} key 签名密钥
 * @returns {string} SHA256签名
 */
function generateXPanToken(method, pathname, timestamp, key) {
    const data = method + '&' + pathname + '&' + timestamp + '&' + key
    return Crypto.SHA256(data).toString()
}

// ignore

export { axios, qs, base64Decode, base64Encode, delay, findBestLCS, generateDeviceID, generateReqId, generateXPanToken }

// ignore
