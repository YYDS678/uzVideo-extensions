// ignore
//@name:[嗅] NT动漫
//@version:1
//@webSite:https://www.ntdm9.com
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
const webSite = 'https://www.ntdm9.com'
// 网站搜索
// https://www.ntdm9.com/search/-------------.html?wd=%E8%83%86%E5%A4%A7%E5%85%9A&page=1
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/search/-------------.html?wd=@{searchWord}&page=@{page}'
// 当前网站任意视频详情页
// https://www.ntdm9.com/video/6139.html
const videoDetailPage = '@{webSite}/video/6139.html'
// 当前网站任意视频播放页
// https://www.ntdm9.com/play/6139-1-1.html
const videoPlayPage = '@{webSite}/play/6139-1-1.html'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '日漫',
        // https://www.ntdm9.com/type/riben-2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/type/riben-@{page}.html',
    },
    {
        name: '国漫',
        // https://www.ntdm9.com/type/zhongguo-2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/type/zhongguo-@{page}.html',
    },
    {
        name: '欧漫',
        // https://www.ntdm9.com/type/omei-2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/type/omei-@{page}.html',
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#