// ignore
//@name:「嗅」风车动漫
//@version:1
//@webSite:https://www.tt776b.com
//@remark:
//@order: D
// ignore

// 适用于 把鼠标放在视频封面上 可以右键 复制正确链接的网站
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC 是 1， 手机是 0
const isUsePC = 1
/// 默认应该是 0，当视频不能播放的时候，可以把这个设置为 1， 否则不要改动
const isAddReferer = 1

// 网站主页
const webSite = 'https://www.tt776b.com'
// 网站搜索
// https://www.tt776b.com/search/%E6%B5%B7%E8%B4%BC%E7%8E%8B-------------.html
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/search/@{searchWord}-------------.html'
// 当前网站任意视频详情页
// https://www.tt776b.com/video/9178.html
const videoDetailPage = '@{webSite}/video/9178.html'
// 当前网站任意视频播放页
// https://www.tt776b.com/play/9178-1-1.html
const videoPlayPage = '@{webSite}/play/9178-1-1.html'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '日本动漫',
        // https://www.tt776b.com/type/ribendongman-2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/type/ribendongman-@{page}.html',
    },
    {
        name: '国产动漫',
        // https://www.tt776b.com/type/guochandongman-2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/type/guochandongman-@{page}.html',
    },
    {
        name: '动漫电影',
        // https://www.tt776b.com/type/dongmandianying-2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/type/dongmandianying-@{page}.html',
    },
    {
        name: '欧美动漫',
        // https://www.tt776b.com/type/omeidongman-2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/type/omeidongman-@{page}.html',
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#