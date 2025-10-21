/**
 * @file 视频源数据类型
 */

//MARK: - 筛选标签
/**
 * 筛选标签
 */
class FilterLabel {
    constructor() {
        /**
         * 筛选名称
         */
        this.name = ''
        /**
         * 标识值 根据情况赋值
         */
        this.id = ''
        /**
         * 标识key 根据情况赋值
         */
        this.key = ''
    }
}

//MARK: - 筛选标题
/**
 * 筛选标题
 */
class FilterTitle {
    constructor() {
        // 筛选标题
        this.name = ''
        /**
         * 筛选标签列表
         * @type {FilterLabel[]}
         */
        this.list = []
    }
}

//MARK: - 视频分类
/**
 * 视频分类
 */
class VideoClass {
    constructor() {
        // 当前分类的链接
        this.type_id = ''
        // 分类名称
        this.type_name = ''

        /**
         * 是否存在 筛选列表、子分类。 存在会调用 getSubclassList
         */
        this.hasSubclass = false
    }
}

//MARK: - 视频二级分类
/**
 * 视频二级分类，二级分类可以是 分类，也可以是筛选，都有值优先取筛选
 */
class VideoSubclass {
    constructor() {
        /**
         * 子分类
         * @type {VideoClass[]}
         */
        this.class = []
        /**
         * 筛选列表
         * 请求二级分类列表 getSubclassList 时返回该数据或者 data，
         * @type {FilterTitle[]}
         */
        this.filter = []
    }
}

//MARK: - 视频详情
/**
 * 视频详情
 */
class VideoDetail {
    constructor() {
        // 当前视频详情链接
        this.vod_id = ''
        // 视频名称
        this.vod_name = ''
        /**
         * 线路列表 (没什么特殊区别可为空) 线路1$$$线路2$$$
         */
        this.vod_play_from = ''
        /**
         * 所有剧集 使用 $$$ 分割线路，# 分割剧集，$ 分割剧集名称和剧集链接
         * 第一集$第一集的视频详情链接#第二集$第二集的视频详情链接$$$第一集$第一集的视频详情链接#第二集$第二集的视频详情链接
         */
        this.vod_play_url = ''
        // 封面 支持 data:image/xxx;base64,
        this.vod_pic = ''
        // 视频分类
        this.type_name = ''
        // 更新到
        this.vod_remarks = ''
        // 豆瓣
        this.vod_douban_score = ''
        // 语言
        this.vod_lang = ''
        // 年份
        this.vod_year = ''
        // 演员
        this.vod_actor = ''
        // 导演
        this.vod_director = ''
        // 描述
        this.vod_content = ''
        // 地区
        this.vod_area = ''
        // 跳转搜索 v1.6.63 及以上版本
        this.goSearch = false
        /**
         * 网盘分享链接列表
         * @type {string[]}
         */
        this.panUrls = []
    }
}

//MARK: - 分类列表数据
/**
 * 返回分类列表
 */
class RepVideoClassList {
    constructor() {
        /**
         * @type {VideoClass[]}
         */
        this.data = []
        this.error = ''
    }
}

//MARK: - 二级分类列表/筛选列表数据
/**
 * 返回二级分类列表(包括筛选列表)
 */
class RepVideoSubclassList {
    constructor() {
        /**
         * 二级分类数据
         * @type {VideoSubclass}
         */
        this.data = new VideoSubclass()
        this.error = ''
    }
}

//MARK: - 视频列表数据
/**
 * 返回视频列表
 */
class RepVideoList {
    constructor() {
        /**
         * @type {VideoDetail[]}
         */
        this.data = []
        this.error = ''
        this.total = 0
    }
}

//MARK: - 视频详情数据
/**
 * 返回视频详情
 */
class RepVideoDetail {
    constructor() {
        /**
         * @type {VideoDetail}
         */
        this.data = null
        this.error = ''
    }
}

class VodDanMu {
    constructor() {
        /**
         * 弹幕内容
         * @type {string}
         */
        this.content = ''

        /**
         * 弹幕出现时间 单位秒
         * @type {number}
         */
        this.time = 0
    }
}

//MARK: - 视频播放地址数据
/**
 * 返回播放地址
 */
class RepVideoPlayUrl {
    constructor() {
        /**
         * 播放视频的URL 支持 data:xxx/xxx;base64,
         **/
        this.data = ''

        /**
         * 多个播放地址，优先取该值 如果为空取 data
         * @type {{name:string,url:string,audioUrl:string,headers:object,priority:number,isSniffer:boolean,snifferUA:string, timeOut:number, retry:number}[]}
         * @property {string} name 名称 4k 高清 之类
         * @property {string} url 播放地址
         * @property {string} audioUrl 音频地址
         * @property {object} headers 播放头
         * @property {number} priority 优先级
         * @property {boolean} isSniffer 是否是嗅探 默认 false, app v1.6.55 及以上版本可用
         * @property {string} snifferUA 嗅探UA, app v1.6.55 及以上版本可用
         * @property {number} timeOut 单次嗅探超时时间 单位秒 默认 12s, app v1.6.55 及以上版本可用
         * @property {number} retry 嗅探重试次数 默认 1 次 ,app v1.6.55 及以上版本可用
         */
        this.urls = []

        /**
         * 播放视频的请求header
         **/
        this.headers

        /**
         * 嗅探对象，headers 依然有效用于播放视频 （v1.6.52 及以上版本）
         * 不一定能嗅探成功，如果嗅探失败请将链接发送给 https://t.me/uzVideoAppbot
         * @type {object}
         * @property {string} url 嗅探的URL
         * @property {string} ua 嗅探的UA
         * @property {number} timeOut 单次嗅探超时时间 单位秒 默认 30s
         * @property {number} retry 重试次数 默认 1 次
         */
        this.sniffer = {}

        /**
         * 弹幕数据
         * @type {VodDanMu[]}
         */
        this.danMu = []

        this.error = ''
    }
}

//MARK: - 传入参数
/**
 * UZArgs 封装一组参数，用于构建请求URL或进行数据查询。
 */
class UZArgs {
    constructor() {
        /**
         * 请求的URL
         * @type {string}
         */
        this.url = ''

        /**
         * 当前页码
         * @type {number}
         */
        this.page = 1

        /**
         * 搜索关键词
         * @type {string}
         */
        this.searchWord = ''

        /**
         * 返回的线路(vod_play_from)标识
         * @type {string}
         */
        this.flag = ''
    }
}

//MARK: - 二级分类传入参数
/**
 * getSubclassVideoList 方法传入的参数
 */
class UZSubclassVideoListArgs extends UZArgs {
    constructor() {
        /**
         * 主分类ID  即扩展返回的 @type {RepVideoClassList}.data[0].type_id
         */
        this.mainClassId = ''

        /**
         * 二级分类ID 即扩展返回的 @type {RepVideoSubclassList}.data.class.type_id
         */
        this.subclassId = ''

        /**
         * 筛选标签，按返回的顺序传入 即扩展返回的 {RepVideoSubclassList}.data.filter.
         * @type {FilterLabel[]}
         */
        this.filter = []
    }
}

// ignore
export {
    FilterLabel,
    FilterTitle,
    VideoClass,
    VideoSubclass,
    VideoDetail,
    RepVideoClassList,
    RepVideoSubclassList,
    RepVideoList,
    RepVideoDetail,
    RepVideoPlayUrl,
    UZArgs,
    UZSubclassVideoListArgs,
}
// ignore

// 已废弃
// prettier-ignore
class WebApiBase { constructor() { this.webSite = '', this.uzTag = '' } async getClassList(args) { return JSON.stringify(new RepVideoClassList()) } async getSubclassList(args) { return JSON.stringify(new RepVideoSubclassList()) } async getVideoList(args) { return JSON.stringify(new RepVideoList()) } async getSubclassVideoList(args) { return JSON.stringify(new RepVideoList()) } async getVideoDetail(args) { return JSON.stringify(new RepVideoDetail()) } async getVideoPlayUrl(args) { return JSON.stringify(new RepVideoPlayUrl()) } async searchVideo(args) { return JSON.stringify(new RepVideoList()) } }
