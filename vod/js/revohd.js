//@name:「盘」 清影
//@version:1
//@webSite:https://www.revohd.com
//@remark:v1.6.57及以上版本可用，加载不出来就是空资源
//@deprecated:1
//@order: B



// 适用于 把鼠标放在视频封面上 可以右键 复制正确链接的网站
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC 是 1， 手机是 0
const isUsePC = 1
/// 默认应该是 0，当视频不能播放的时候，可以把这个设置为 1， 否则不要改动
const isAddReferer = 0

/// 当前网站是不是网盘资源分享站 0 不是，1 是
const isPan = 1

/// 匹配的网盘类型，一般不需要改动
const panUrls = [
    '189.cn', //天翼
    '123684.com', // 123
    '123865.com',
    '123912.com',
    '123pan.com',
    '123pan.cn',
    '123592.com',
    'pan.quark.cn', // 夸克
    'drive.uc.cn', // uc
    'alipan.com', // 阿里
]

// 网站主页
const webSite = 'https://www.revohd.com'

// 网站搜索
// https://www.revohd.com/vodsearch/海----------2---.html
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/vodsearch/@{searchWord}----------@{page}---.html'

// 当前网站任意视频详情页
// https://www.revohd.com/voddetail/12895.html
const videoDetailPage = '@{webSite}/voddetail/12895.html'

// 当 isPan = 1 时，表明是资源分享站 这个不用改动。
// 当前网站任意视频播放页
const videoPlayPage = ''

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '电影',
        // https://www.revohd.com/vod/show/id/1/page/2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vod/show/id/1/page/@{page}.html',
    },
    {
        name: '剧集',
        // https://www.revohd.com/vod/show/id/2/page/2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vod/show/id/2/page/@{page}.html',
    },
    {
        name: '动漫',
        // https://www.revohd.com/vod/show/id/5/page/2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vod/show/id/5/page/@{page}.html',
    },
    {
        name: '娱乐',
        // https://www.revohd.com/vod/show/id/3/page/2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vod/show/id/3/page/@{page}.html',
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#