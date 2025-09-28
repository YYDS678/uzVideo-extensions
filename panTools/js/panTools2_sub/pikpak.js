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
import { getEnv, setEnv, UZUtils } from '../../../core/core/uzUtils'

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
     * @returns {Promise<PanBaidu>} 返回当前模块类实例
     */
    static async getInstance(args) {
        // MARK: 需要实现
        let pan = new PanPikPak()
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
     * 获取存储数据
     *
     * @param {string} key - 存储数据的键
     * @returns {Promise<string>} 存储数据的值
     */
    async getStorage(key) {
        return await UZUtils.getStorage({ key: key, uzTag: this.uzTag })
    }

    /**
     * 保存数据
     *
     * @param {string} key - 存储数据的键
     * @param {string} value - 存储数据的值
     * @returns {Promise<void>} 保存数据成功返回 Promise 对象
     */
    async setStorage(key, value) {
        await UZUtils.setStorage({ key: key, value: value, uzTag: this.uzTag })
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
        return 'pikpak'
    }

    /**
     * 是否可以解析分享链接
     * @param {Object} args - 函数参数对象
     * @param {string} args.url - 当前分享链接
     * @returns {Promise<boolean>} 返回一个 Promise，resolve 返回 true 表示可以解析，false 表示不能解析
     */
    async canParse(args) {
        return args.url.includes('mypikpak.com') || args.url.includes('magnet')
    }

    /**
     * 解析分享链接并获取文件列表
     * @param {Object} args - 包含分享链接信息的参数对象
     * @param {string} args.url - 分享链接URL
     * @returns {Promise<PanListDetail>} 返回解析后的文件列表数据
     */
    async parseShareUrl(args) {
        UZUtils.debugLog('parseShareUrl==========>' + args.url)
        return await this.getShareData(args.url)
    }

    /**
     * 获取视频播放地址
     * @param {PanVideoItem} args - 函数参数对象
     * @returns {Promise<PanPlayInfo>} 播放地址详情
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
    uzTag = ''
    email = ''
    pass = ''
    auth = ''
    refresh_token = ''
    fileIds = ''
    parentId = ''
    ids = []
    index = 0
    captcha_token = ''

    async init() {
        this.auth = await this.getPanEnv('PikPakToken')
        UZUtils.debugLog('auth' + this.auth)
        if (this.auth) {
            let exp = JSON.parse(
                Crypto.enc.Base64.parse(this.auth.split('.')[1]).toString(
                    Crypto.enc.Utf8
                )
            )
            let now = Math.floor(Date.now() / 1000)
            if (exp.exp < now) {
                this.auth = null
                UZUtils.debugLog('登录状态已过期,重新登录')
            } else {
                UZUtils.debugLog(
                    '登录成功，继续使用,可使用时间截止到：' +
                        new Date(exp.exp * 1000).toLocaleString()
                )
                UZUtils.debugLog('PikPak token获取成功：' + this.auth)
            }
        } else {
            await this.login()
        }
        if (this.captcha_token === '') {
            await this.getCaptcha()
        }
    }

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
        }
    }

    async getPass_code_token(url) {
        let req_ = await this.req_proxy(url)
        let ck = req_.headers['set-cookie']
        let pass_code_token = ''
        if (ck.length > 0) {
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
        let ck = req_.headers['set-cookie']
        let pass_code_token = ''
        if (ck.length > 0) {
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

    async getSize(size) {
        let fileSize = size / (1024 * 1024 * 1024)
        return fileSize > 6
    }

    async getSignCaptcha() {
        let data = JSON.stringify({
            client_id: 'YUMx5nI8ZU8Ap8pm',
            action: 'POST:/v1/auth/signin',
            device_id: this.x_device_id,
            captcha_token: '',
            meta: {
                email: this.email,
            },
        })
        let sign = await this.req_proxy(
            'https://user.mypikpak.com/v1/shield/captcha/init',
            'POST',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'x-client-id': 'YUMx5nI8ZU8Ap8pm',
                'x-device-id': this.x_device_id,
            },
            data
        )
        if (sign.status === 200) {
            return sign.data.captcha_token
        }
    }

    async login() {
        this.email = await this.getPanEnv('PikPak邮箱')
        this.pass = await this.getPanEnv('PikPak密码')
        let captcha_token = await this.getSignCaptcha()
        let data = JSON.stringify({
            username: this.email,
            password: this.pass,
            client_id: 'YUMx5nI8ZU8Ap8pm',
        })
        let login_data = await this.req_proxy(
            'https://user.mypikpak.com/v1/auth/signin',
            'POST',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'accept-language': 'zh-CN',
                'x-captcha-token': captcha_token,
                'x-client-id': 'YUMx5nI8ZU8Ap8pm',
                'x-device-id': this.x_device_id,
            },
            data
        )
        if (login_data.status === 200) {
            UZUtils.debugLog('登陆成功==========>')
            await this.updatePanEnv(
                'PikPakToken',
                login_data.data.token_type + ' ' + login_data.data.access_token
            )
            await this.setStorage(
                'pikpak_refresh_token',
                login_data.data.refresh_token
            )
        }
    }

    async getToken() {
        this.refresh_token = await this.getStorage('pikpak_refresh_token')
        let data = JSON.stringify({
            client_id: 'YUMx5nI8ZU8Ap8pm',
            grant_type: 'refresh_token',
            refresh_token: this.refresh_token,
        })
        let token = await this.req_proxy(
            'https://user.mypikpak.com/v1/auth/token',
            'POST',
            {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'accept-language':
                    'zh,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
                'x-client-id': 'YUMx5nI8ZU8Ap8pm',
                'x-device-id': this.x_device_id,
            },
            data
        )
        if (token.status === 200) {
            UZUtils.debugLog('刷新token成功')
            await this.updatePanEnv(
                'PikPakToken',
                token.data.token_type + ' ' + token.data.access_token
            )
            await this.setStorage(
                'pikpak_refresh_token',
                token.data.refresh_token
            )
        }
        if (token.status === 400) {
            UZUtils.debugLog(token.data.details[1].message)
        }
    }

    async trashEmpty() {
        let delete_status = await this.req_proxy(
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
        if (delete_status.status === 200) {
            UZUtils.debugLog('回收站清理完成')
        }
    }

    async getFileList() {
        let fileList = await this.req_proxy(
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
        if (fileList.status === 200) {
            let ids = []
            let list = fileList.data.events
            list.map((it) => {
                ids.push(it.file_id)
            })
            return ids
        }
    }

    async deleteFile(ids) {
        let data = JSON.stringify({
            ids: ids,
        })
        let detele_status = await this.req_proxy(
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
            data
        )
        if (detele_status.status === 200) {
            UZUtils.debugLog('删除文件成功')
        }
    }

    async saveFile(share_id, file_ids, parent_id, pass_code_token) {
        let ids = await this.getFileList()
        if (ids !== undefined) {
            if (ids.length > 0) {
                await this.deleteFile(ids)
                await this.getFileList()
                await this.trashEmpty()
            }
            let data = JSON.stringify({
                share_id: share_id,
                pass_code_token: pass_code_token,
                file_ids: [file_ids],
                params: {
                    trace_file_ids: file_ids,
                },
                ancestor_ids: parent_id
                    .split('|')
                    .filter((it) => it !== '') || [parent_id],
            })
            let save_status = await this.req_proxy(
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
            if (
                save_status.status === 200 &&
                save_status.data.share_status === 'OK'
            ) {
                UZUtils.debugLog('转存成功')
                return true
            }
            return false
        }
    }

    async getSurl(url) {
        this.link = url.trim()
        let matches =
            this.regex.exec(url) === null
                ? /https:\/\/mypikpak.com\/s\/(.*)/.exec(url)
                : this.regex.exec(url)
        let share_id = ''
        let parent_id = ''
        if (matches && matches[1]) {
            if (matches[1].includes('/')) {
                share_id = matches[1].split('/')[0]
                parent_id = matches[1].split('/')[1]
            } else {
                share_id = matches[1]
            }
        }
        this.fileIds = parent_id
        this.parentId = parent_id
        return {
            share_id,
            parent_id,
        }
    }

    async getShareData(url) {
        await this.init()
        let list = []
        if (url.startsWith('http')) {
            UZUtils.debugLog('开始解析==========>')
            let pass_code_token = await this.getPass_code_token(url)
            UZUtils.debugLog('pass_code_token==========>' + pass_code_token)
            let { share_id, parent_id } = await this.getSurl(url)
            UZUtils.debugLog(
                'share_id, parent_id==========>' + share_id,
                parent_id
            )
            list = await this.getShareList(share_id, parent_id, pass_code_token)
            UZUtils.debugLog('list========>' + list)
            return {
                videos: list,
            }
        }
        if (url.startsWith('magnet')) {
            url = this.share_api + url
            let { redirect: link, pass_code_token: pass_code_token } =
                await this.getShareRedirect(url)
            let { share_id, parent_id } = await this.getSurl(link)
            list = await this.getShareList(share_id, parent_id, pass_code_token)
            return {
                videos: list,
            }
        }
    }

    async getShareList(share_id, parent_id, pass_code_token) {
        let header = Object.assign(
            {
                'x-captcha-token': this.captcha_token,
                'x-client-id': this.x_client_id,
                'x-device-id': this.x_device_id,
            },
            this.headers
        )
        let url =
            this.api +
            `/detail?limit=100&thumbnail_size=SIZE_LARGE&order=3&folders_first=true&share_id=${share_id}&parent_id=${parent_id}&pass_code_token=${pass_code_token}`
        let data = await this.req_proxy(url, 'get', header)
        if (data.status === 200 && data.data.files.length > 0) {
            let dirs = []
            let videos = []
            data.data.files.map((item) => {
                if (/folder/.test(item.kind) && item.mime_type === '') {
                    if (this.index !== 0) {
                        this.ids.map((it) => {
                            return it + '|' + item.id
                        })
                    } else {
                        this.ids.push(this.fileIds + '|' + item.id)
                    }
                    dirs.push({
                        share_id: share_id,
                        parent_id: item.id,
                        pass_code_token: pass_code_token,
                    })
                }
                if (/file/.test(item.kind) && /video/.test(item.mime_type)) {
                    let parentId = ''
                    if (this.index !== 0) {
                        this.ids.map((it) => {
                            if (it.indexOf(item.parent_id)) {
                                parentId = it
                            }
                        })
                    } else {
                        parentId = parent_id
                    }
                    videos.push({
                        name: item.name,
                        panType: this.getPanType(),
                        data: {
                            name: item.name,
                            share_id: share_id,
                            file_id: item.id,
                            parent_id: parentId,
                            pass_code_token: pass_code_token,
                            size: item.size,
                        },
                    })
                }
            })
            this.index++
            if (dirs.length === 0) {
                this.fileIds = this.parentId
            }
            let result = await Promise.all(
                dirs.map(async (it) =>
                    this.getShareList(
                        it.share_id,
                        it.parent_id,
                        it.pass_code_token
                    )
                )
            )
            result = result
                .filter((item) => item !== undefined && item !== null)
                .flat()
            return [...videos, ...result.flat()]
        }
    }

    async getCaptcha() {
        let data = JSON.stringify({
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
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'x-client-id': this.x_client_id,
                'x-device-id': this.x_device_id,
            },
            data
        )
        if (captcha_data.status === 200) {
            this.captcha_token = captcha_data.data.captcha_token
        }
    }

    async getMediasUrl(share_id, file_id, parent_id, pass_code_token) {
        if (this.auth === '') {
            await this.login()
        }
        let save_status = await this.saveFile(
            share_id,
            file_id,
            parent_id,
            pass_code_token
        )
        if (save_status) {
            let ids = await this.getFileList()
            UZUtils.debugLog('ids======>' + ids)
            let file = await this.req_proxy(
                `https://api-drive.mypikpak.com/drive/v1/files/${ids[0]}?usage=FETCH`,
                'GET',
                {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) PikPak/2.7.26.5224 Chrome/100.0.4896.160 Electron/18.3.15 Safari/537.36',
                    Connection: 'keep-alive',
                    Accept: '*/*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'accept-language': 'zh-CN',
                    authorization: this.auth,
                    'x-captcha-token': this.captcha_token,
                    'x-device-id': this.x_device_id,
                }
            )
            UZUtils.debugLog('地址请求状态' + file.status)
            if (file.status === 200) {
                UZUtils.debugLog(
                    '原画' +
                        [
                            file.data.web_content_link,
                            file.data?.links['application/octet-stream'].url,
                        ]
                )
                return [
                    file.data.web_content_link,
                    file.data?.links['application/octet-stream'].url,
                ]
            }
        }
    }

    async getShareUrl(data) {
        let { share_id, file_id, parent_id, pass_code_token, size } = data
        await this.init()
        let save_flage = await this.getSize(size)
        let links = []
        if (!save_flage) {
            links = await this.getMediasUrl(
                share_id,
                file_id,
                parent_id,
                pass_code_token
            )
        }
        UZUtils.debugLog('原画列表' + links)
        let header = Object.assign(
            {
                'x-captcha-token': this.captcha_token,
                'x-client-id': this.x_client_id,
                'x-device-id': this.x_device_id,
            },
            this.headers
        )
        let url =
            this.api +
            `/file_info?share_id=${share_id}&file_id=${file_id}&pass_code_token=${pass_code_token}`
        let html = await this.req_proxy(url, 'get', header)
        let urls = []
        if (html.status === 200) {
            UZUtils.debugLog('html信息' + html.status)
            UZUtils.debugLog('html信息' + html.data.file_info)
            let list = html.data.file_info
            if (list?.web_content_link !== '') {
                urls.push(
                    '原画1',
                    'https://web-vod-xdrive.mypikpak.com/ts_downloader?client_id=UElLUEFLX1dFQg&url=' +
                        encodeURIComponent(list.web_content_link)
                )
                urls.push(
                    '原画2',
                    'https://web-vod-xdrive.mypikpak.com/ts_downloader?client_id=UElLUEFLX1dFQg&url=' +
                        encodeURIComponent(
                            list?.links['application/octet-stream'].url
                        )
                )
            } else {
                list.medias.forEach((media) => {
                    if (!save_flage && media.media_name === '原画') {
                        links.map((it, i) => {
                            urls.push({
                                name: `原画${i + 1}`,
                                url: it,
                            })
                        })
                    } else {
                        urls.push({
                            name: media.media_name,
                            url:
                                media.media_name === '原画'
                                    ? media.link.url
                                    : 'https://web-vod-xdrive.mypikpak.com/ts_downloader?client_id=UElLUEFLX1dFQg&url=' +
                                      encodeURIComponent(media.link.url),
                            // url:ENV.get('cf_domain')+media.link.url.replace('https://','')//cf反代加速，自行选择
                        })
                    }
                })
                return {
                    urls: urls,
                }
            }
        } else {
            links.map((it, i) => {
                urls.push({
                    name: `原画${i + 1}`,
                    url: it,
                })
            })
            return {
                urls: urls,
            }
        }
    }

    _uuidv4() {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (e) => {
            const r = (16 * Math.random()) | 0
            return ('x' === e ? r : (3 & r) | 8).toString(16)
        })
    }
}

panSubClasses.push(PanPikPak)
