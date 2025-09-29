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
import { getEnv, setEnv, UZUtils } from '../../../core/core/uzUtils.js'

// ignore

// PikPak云盘
// 作者：你猜
class PanPikPak {
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
     * @returns {Promise<PanPikPak>} 返回当前模块类实例
     */
    static async getInstance(args) {
        let pan = new PanPikPak()
        pan.uzTag = args.uzTag
        pan.saveDirName = args.saveDirName
        return pan
    }

    /**
     * 读取环境变量 key 为主文件中 env 的声明
     */
    async getPanEnv(key) {
        return await getEnv(this.uzTag, key)
    }

    /**
     * 更新环境变量 key 为主文件中 env 的声明
     */
    async updatePanEnv(key, value) {
        await setEnv(this.uzTag, key, value)
    }

    // MARK: 挂载相关方法 (未实现)
    async supportPanMount() {
        return null
    }
    async getPanMountRootDir() {
        return {}
    }
    async getPanMountSubDir(args) {
        return {}
    }
    async getPanMountFile(args) {
        return new PanPlayInfo()
    }

    /**
     * 返回网盘类型
     */
    getPanType(args) {
        return 'pikpak'
    }

    /**
     * 是否可以解析分享链接
     */
    async canParse(args) {
        return args.url.includes('mypikpak.com') || args.url.includes('magnet')
    }

    /**
     * 解析分享链接并获取文件列表
     */
    async parseShareUrl(args) {
        UZUtils.debugLog('parseShareUrl==========>' + args.url)
        return await this.getShareData(args.url)
    }

    /**
     * 获取视频播放地址
     */
    async parseVideo(args) {
        UZUtils.debugLog('parseVideo==========>' + args.data)
        return await this.getShareUrl(args.data)
    }

    /**
     * 清除Pan保存目录
     */
    async clearPanSaveDir() {}

    constructor() {
        this.regex = /https:\/\/mypikpak.com\/s\/(.*)\?act=play/
        this.api = 'https://api-drive.mypikpak.com/drive/v1/share'
        this.share_api = 'https://keepshare.org/ai1uqv5a/'
        this.x_client_id = 'YUMx5nI8ZU8Ap8pm'
        this.x_device_id = '9e8c121ebc0b409e85cc72cb2d424b54'
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            referer: 'https://mypikpak.com/',
            'accept-language': 'zh-CN',
        }
    }

    // --- 类属性 ---
    auth = ''
    captcha_token = ''
    fileIds = ''
    parentId = ''
    ids = []
    index = 0

    /**
     * 初始化，检查并验证Token
     */
    async init() {
        if (this.auth) return // 如果已经初始化过，则跳过

        let token = await this.getPanEnv('PikPakToken')
        if (token) {
            try {
                let exp = JSON.parse(
                    Crypto.enc.Base64.parse(token.split('.')[1]).toString(
                        Crypto.enc.Utf8
                    )
                )
                let now = Math.floor(Date.now() / 1000)
                if (exp.exp < now) {
                    UZUtils.debugLog('PikPak token已过期, 清除token')
                    await this.updatePanEnv('PikPakToken', '')
                    this.auth = ''
                } else {
                    UZUtils.debugLog('PikPak token有效')
                    this.auth = token
                }
            } catch (e) {
                UZUtils.debugLog('PikPak token解析失败, 清除token')
                await this.updatePanEnv('PikPakToken', '')
                this.auth = ''
            }
        } else {
            UZUtils.debugLog('未找到PikPak token, 将使用公共模式')
            this.auth = ''
        }
    }

    /**
     * 统一网络请求
     */
    async req_proxy(url, mth, header, data) {
        try {
            let config = {
                url: url,
                method: mth || 'get',
                headers: header || this.headers,
            }
            if (data !== undefined) {
                config.data = data
            }
            return await axios.request(config)
        } catch (error) {
            UZUtils.debugLog(error)
            return null
        }
    }

    /**
     * 获取验证码
     */
    async getCaptcha() {
        let payload = JSON.stringify({
            client_id: 'YUMx5nI8ZU8Ap8pm',
            action: 'GET:/drive/v1/share/file_info',
            device_id: '9e8c121ebc0b409e85cc72cb2d424b54',
            captcha_token: '',
            meta: {
                captcha_sign: '1.00d38b84b3231b2ac78b41091c11e5ca',
                client_version: 'undefined',
                package_name: 'drive.mypikpak.com',
                user_id: '',
                timestamp: '1758527222654',
            },
        })
        let captcha_data = await this.req_proxy(
            'https://user.mypikpak.com/v1/shield/captcha/init',
            'POST',
            {
                ...this.headers,
                'Content-Type': 'application/json',
                'x-client-id': this.x_client_id,
                'x-device-id': this.x_device_id,
            },
            payload
        )
        if (captcha_data && captcha_data.status === 200) {
            this.captcha_token = captcha_data.data.captcha_token
            return this.captcha_token
        }
        return ''
    }

    /**
     * 获取分享数据
     */
    async getShareData(url) {
        await this.init()
        let list = []
        if (url.startsWith('http')) {
            let pass_code_token = await this.getPass_code_token(url)
            let { share_id, parent_id } = await this.getSurl(url)
            list = await this.getShareList(share_id, parent_id, pass_code_token)
            return { videos: list }
        }
        if (url.startsWith('magnet')) {
            url = this.share_api + url
            let { redirect: link, pass_code_token } =
                await this.getShareRedirect(url)
            if (!link) return { videos: [] }
            let { share_id, parent_id } = await this.getSurl(link)
            list = await this.getShareList(share_id, parent_id, pass_code_token)
            return { videos: list }
        }
        return { videos: [] }
    }

    /**
     * 获取文件列表（统一处理）
     */
    async getShareList(share_id, parent_id, pass_code_token) {
        // 确保无论何种模式，都有最新的captcha_token
        await this.getCaptcha()

        let header = {
            ...this.headers,
            'x-captcha-token': this.captcha_token,
            'x-client-id': this.x_client_id,
            'x-device-id': this.x_device_id,
        }
        let url = `${this.api}/detail?limit=100&thumbnail_size=SIZE_LARGE&order=3&folders_first=true&share_id=${share_id}&parent_id=${parent_id}&pass_code_token=${pass_code_token}`
        let res = await this.req_proxy(url, 'get', header)

        if (res && res.status === 200 && res.data.files) {
            let dirs = []
            let videos = []
            res.data.files.forEach((item) => {
                if (item.kind === 'drive#folder') {
                    // Token模式下，追踪父ID路径
                    if (this.auth) {
                        if (this.index !== 0) {
                            this.ids = this.ids.map((it) => it + '|' + item.id)
                        } else {
                            this.ids.push(this.fileIds + '|' + item.id)
                        }
                    }
                    dirs.push({ share_id, parent_id: item.id, pass_code_token })
                } else if (
                    item.mime_type &&
                    item.mime_type.startsWith('video/')
                ) {
                    let video_data = {
                        name: item.name,
                        share_id: share_id,
                        file_id: item.id,
                        panType: this.getPanType(),
                        pass_code_token: pass_code_token,
                        size: item.size,
                    }

                    // Token模式下，添加用于转存的父ID
                    if (this.auth) {
                        video_data.parent_id =
                            this.index !== 0
                                ? this.ids.find((it) =>
                                      it.includes(item.parent_id)
                                  ) || parent_id
                                : parent_id
                    }

                    videos.push({
                        name: item.name,
                        panType: this.getPanType(),
                        data: video_data,
                    })
                }
            })

            if (this.auth) {
                this.index++
                if (dirs.length === 0) {
                    this.fileIds = this.parentId
                }
            }

            let result = await Promise.all(
                dirs.map((it) =>
                    this.getShareList(
                        it.share_id,
                        it.parent_id,
                        it.pass_code_token
                    )
                )
            )
            return [...videos, ...result.flat()]
        }
        return []
    }

    /**
     * 获取播放链接
     */
    async getShareUrl(data) {
        await this.init()
        const { share_id, file_id, parent_id, pass_code_token, size } = data

        // 优先尝试Token逻辑
        if (this.auth && !(await this.getSize(size))) {
            const links = await this.getMediasUrl(
                share_id,
                file_id,
                parent_id,
                pass_code_token
            )
            if (links && links.length > 0) {
                return {
                    urls: links.map((it, i) => ({
                        name: `原画${i + 1}`,
                        url: it,
                    })),
                }
            }
        }

        // Token逻辑失败或无Token，执行公共逻辑
        let x_captcha_token = await this.getCaptcha()
        let header = {
            ...this.headers,
            'x-captcha-token': x_captcha_token,
            'x-client-id': this.x_client_id,
            'x-device-id': this.x_device_id,
        }
        let url = `${this.api}/file_info?share_id=${share_id}&file_id=${file_id}&pass_code_token=${pass_code_token}`
        let res = await this.req_proxy(url, 'get', header)

        if (res && res.status === 200 && res.data.file_info) {
            let urls = []
            let medias = res.data.file_info.medias || []
            medias.forEach((media) => {
                urls.push({
                    name: media.media_name,
                    url: media.link.url,
                })
            })
            return { urls }
        }

        return { urls: [] }
    }

    // --- 辅助方法 ---

    async getPass_code_token(url) {
        let req_ = await this.req_proxy(url)
        if (!req_ || !req_.headers['set-cookie']) return ''

        let ck = req_.headers['set-cookie']
        let pass_code_token = ''
        if (ck && ck.length > 0) {
            this.cookie = ck
                .map((it) => {
                    let it_path = it.split(';')[0]
                    if (/passcode_token/.test(it_path)) {
                        pass_code_token = it_path.split('=')[1]
                    }
                    return it_path
                })
                .join('; ')
        }
        return pass_code_token
    }

    async getShareRedirect(url) {
        let req_ = await this.req_proxy(url)
        if (!req_ || !req_.redirects || req_.redirects.length === 0) {
            return { redirect: null, pass_code_token: '' }
        }

        let ck = req_.headers['set-cookie']
        let pass_code_token = ''
        if (ck && ck.length > 0) {
            this.cookie = ck
                .map((it) => {
                    let it_path = it.split(';')[0]
                    if (/passcode_token/.test(it_path)) {
                        pass_code_token = it_path.split('=')[1]
                    }
                    return it_path
                })
                .join('; ')
        }
        return {
            redirect: req_.redirects[0].location,
            pass_code_token: pass_code_token,
        }
    }

    async getSurl(url) {
        this.link = url.trim()
        let matches =
            this.regex.exec(url) || /https:\/\/mypikpak.com\/s\/(.*)/.exec(url)
        let share_id = '',
            parent_id = ''
        if (matches && matches[1]) {
            if (matches[1].includes('/')) {
                ;[share_id, parent_id] = matches[1].split('/')
            } else {
                share_id = matches[1]
            }
        }
        this.fileIds = parent_id
        this.parentId = parent_id
        return { share_id, parent_id }
    }

    // --- Token模式专属方法 ---

    async getSize(size) {
        return size / (1024 * 1024 * 1024) > 6
    }

    async trashEmpty() {
        await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/files/trash:empty',
            'PATCH',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'accept-language': 'zh-CN',
                authorization: this.auth,
                'content-type': 'application/json',
                'x-captcha-token': this.captcha_token,
                'x-device-id': this.x_device_id,
            }
        )
    }

    async getFileList() {
        let res = await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/events?thumbnail_size=SIZE_MEDIUM&limit=100',
            'GET',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'accept-language': 'zh-CN',
                authorization: this.auth,
                'x-captcha-token': this.captcha_token,
                'x-device-id': this.x_device_id,
            }
        )
        return res && res.status === 200
            ? res.data.events.map((it) => it.file_id)
            : []
    }

    async deleteFile(ids) {
        await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/files:batchTrash',
            'POST',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                authorization: this.auth,
                'x-captcha-token': this.captcha_token,
                'x-device-id': this.x_device_id,
            },
            JSON.stringify({ ids })
        )
    }

    async saveFile(share_id, file_ids, parent_id, pass_code_token) {
        let ids = await this.getFileList()
        if (ids && ids.length > 0) {
            await this.deleteFile(ids)
            await this.trashEmpty()
        }
        let data = JSON.stringify({
            share_id: share_id,
            pass_code_token: pass_code_token,
            file_ids: [file_ids],
            params: { trace_file_ids: file_ids },
            ancestor_ids: parent_id.split('|').filter((it) => it) || [
                parent_id,
            ],
        })
        let res = await this.req_proxy(
            'https://api-drive.mypikpak.com/drive/v1/share/restore',
            'POST',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'accept-language': 'zh-CN',
                authorization: this.auth,
                'x-captcha-token': this.captcha_token,
                'x-client-id': 'YUMx5nI8ZU8Ap8pm',
                'x-device-id': this.x_device_id,
            },
            data
        )
        return res && res.status === 200 && res.data.share_status === 'OK'
    }

    async getMediasUrl(share_id, file_id, parent_id, pass_code_token) {
        if (!this.auth) return []

        if (
            await this.saveFile(share_id, file_id, parent_id, pass_code_token)
        ) {
            let ids = await this.getFileList()
            if (ids && ids.length > 0) {
                let file = await this.req_proxy(
                    `https://api-drive.mypikpak.com/drive/v1/files/${ids[0]}?usage=FETCH`,
                    'GET',
                    {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                        'Content-Type': 'application/json',
                        'accept-language': 'zh-CN',
                        authorization: this.auth,
                        'x-captcha-token': this.captcha_token,
                        'x-client-id': 'YUMx5nI8ZU8Ap8pm',
                        'x-device-id': this.x_device_id,
                    }
                )
                if (file && file.status === 200) {
                    let links = []
                    if (file.data.web_content_link)
                        links.push(file.data.web_content_link)
                    if (file.data?.links?.['application/octet-stream']?.url)
                        links.push(
                            file.data.links['application/octet-stream'].url
                        )
                    return links
                }
            }
        }
        return []
    }
}

panSubClasses.push(PanPikPak)
