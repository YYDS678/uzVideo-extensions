//@name:弹幕扩展
//@version:1
//@remark:
//@order: A02
// ignore
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

const appConfig = {
    _uzTag: '',
    /**
     * 扩展标识，初次加载时，uz 会自动赋值，请勿修改
     * 用于读取环境变量
     */
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
}

class DanMu {
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

class BackData {
    constructor() {
        /**
         * 弹幕数据
         * @type {DanMu[]}
         */
        this.data = []
        /**
         * 错误信息
         * @type {string}
         */
        this.error = ''
    }
}

/**
 * 搜索弹幕
 * @param {Object} item - 包含搜索参数的对象
 * @param {string} item.name - 动画或影片的名称
 * @param {number} item.episode - 动画或影片的集数
 * @param {boolean} item.isMovie - 是否是电影
 * @returns {Promise<BackData>} backData - 返回一个 Promise 对象
 */
async function searchDanMu(item) {
    let backData = new BackData()
    try {
        let all = []
        //MARK: - 实现你的弹幕搜索逻辑
        let ddpList = await searchByDandanPlay(item)

        all = all.concat(ddpList)
        backData.data = all
    } catch (error) {
        backData.error = error.toString()
    }
    if (backData.data.length == 0) {
        backData.error = '未找到弹幕'
    }
    return formatBackData(backData)
}

async function searchByDandanPlay(item) {
    let list = []
    try {
        var searchResult = await req(
            'https://api.dandanplay.net/api/v2/search/episodes',
            {
                queryParameters: {
                    anime: item.name,
                    episode: item.isMovie ? 'movie' : `${item.episode}`,
                },
            }
        )
        if (searchResult.data?.animes?.length > 0) {
            let episodeId = searchResult.data.animes[0].episodes[0].episodeId
            let isSimplified = kLocale.indexOf('CN') !== -1
            var danMuResult = await req(
                `https://api.dandanplay.net/api/v2/comment/${episodeId}?withRelated=true&chConvert=${
                    isSimplified ? '1' : '2'
                }`
            )

            if (danMuResult.data?.comments?.length > 0) {
                for (
                    let index = 0;
                    index < danMuResult.data.comments.length;
                    index++
                ) {
                    const element = danMuResult.data.comments[index]
                    let params = element.p.split(',')
                    let danMu = new DanMu()
                    danMu.content = element.m
                    danMu.time = params[0]
                    list.push(danMu)
                }
            }
        }
    } catch (error) {}
    return list
}
