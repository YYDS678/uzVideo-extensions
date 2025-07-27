// ignore
//@name:[嗅] MX动漫
//@version:1
//@webSite:https://www.mxdm6.com
//@remark:
//@order: C
// ignore

// 适用于 把鼠标放在视频封面上 可以右键 复制正确链接的网站
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC 是 1， 手机是 0
const isUsePC = 1
/// 默认应该是 0，当视频不能播放的时候，可以把这个设置为 1， 否则不要改动
const isAddReferer = 1

// 网站主页
const webSite = 'https://www.mxdm6.com'
// 网站搜索
// https://www.mxdm9.cc/search/%E6%B5%B7%E8%B4%BC%E7%8E%8B-------------.html
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/search/@{searchWord}-------------.html'
// 当前网站任意视频详情页
// https://www.mxdm9.cc/dongman/9163.html
const videoDetailPage = '@{webSite}/dongman/9163.html'
// 当前网站任意视频播放页
// https://www.mxdm9.cc/dongmanplay/9163-1-1.html
const videoPlayPage = '@{webSite}/dongmanplay/9163-1-1.html'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '日本动漫',
        // https://www.mxdm9.cc/show/riman--------2---.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/show/riman--------@{page}---.html',
    },
    {
        name: '国产动漫',
        // https://www.mxdm9.cc/show/guoman--------2---.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/show/guoman--------@{page}---.html',
    },
    {
        name: '动漫电影',
        // https://www.mxdm9.cc/show/dmdianying--------2---.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/show/dmdianying--------@{page}---.html',
    },
    {
        name: '欧美动漫',
        // https://www.mxdm9.cc/show/oman--------2---.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/show/oman--------@{page}---.html',
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#