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
// 来自 秋秋 大佬
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
        }
    }

    uzTag = ''

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
        return {
            share_id,
            parent_id,
        }
    }

    async getShareData(url) {
        let list = []
        if (url.startsWith('http')) {
            let pass_code_token = await this.getPass_code_token(url)
            let { share_id, parent_id } = await this.getSurl(url)
            list = await this.getShareList(share_id, parent_id, pass_code_token)
            UZUtils.debugLog(list)
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
        let x_captcha_token = await this.getCaptcha()
        let header = Object.assign(
            {
                'x-captcha-token': x_captcha_token,
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
                    dirs.push({
                        share_id: share_id,
                        parent_id: item.id,
                        pass_code_token: pass_code_token,
                    })
                }
                if (/file/.test(item.kind) && /video/.test(item.mime_type)) {
                    videos.push({
                        name: item.name,
                        panType: this.getPanType(),
                        data: {
                            name: item.name,
                            share_id: share_id,
                            file_id: item.id,
                            panType: this.getPanType(),
                            pass_code_token: pass_code_token,
                        },
                    })
                }
            })
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
        let captcha_data = await axios.request({
            url: 'https://user.mypikpak.com/v1/shield/captcha/init',
            method: 'POST',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'x-client-id': this.x_client_id,
                'x-device-id': this.x_device_id,
            },
            data: data,
        })
        if (captcha_data.status === 200) {
            return captcha_data.data.captcha_token
        }
    }

    async getShareUrl(data) {
        let { share_id, file_id, pass_code_token } = data
        UZUtils.debugLog(share_id, file_id, pass_code_token)
        let x_captcha_token = await this.getCaptcha()
        let header = Object.assign(
            {
                'x-captcha-token': x_captcha_token,
                'x-client-id': this.x_client_id,
                'x-device-id': this.x_device_id,
            },
            this.headers
        )
        let url =
            this.api +
            `/file_info?share_id=${share_id}&file_id=${file_id}&pass_code_token=${pass_code_token}`
        let html = await this.req_proxy(url, 'get', header)
        if (html.status === 200) {
            let urls = []
            let medias = html.data.file_info.medias
            medias.forEach((media) => {
                urls.push({
                    name: media.media_name,
                    url: media.link.url,
                })
            })
            return {
                urls: urls,
            }
        }
    }
}

panSubClasses.push(PanPikPak)
