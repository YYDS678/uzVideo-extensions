// ignore
//@name:「嗅」 木白
//@version:1
//@webSite:https://m.mubai.link/index
//@remark:
//@deprecated:1
// ignore

// 适用于 把鼠标放在视频封面上 可以右键 复制正确链接的网站
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC 是 1， 手机是 0
const isUsePC = 1
/// 默认应该是 0，当视频不能播放的时候，可以把这个设置为 1， 否则不要改动
const isAddReferer = 0

// 网站主页
const webSite = 'https://m.mubai.link/index'
// 网站搜索
// https://m.mubai.link/search?search=海
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/search?search=@{searchWord}&current=@{page}'
// 当前网站任意视频详情页
// https://m.mubai.link/filmDetail?link=86711
const videoDetailPage = '@{webSite}/filmDetail?link=86711'
// 当前网站任意视频播放页
// https://m.mubai.link/play?id=86711&episode=0&source=2E5B5769897C9353
const videoPlayPage = '@{webSite}/play?id=86711&episode=0&source=2E5B5769897C9353'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '动漫',
        // https://m.mubai.link/filmClassifySearch?Pid=4&Sort=update_stamp&current=2
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/filmClassifySearch?Pid=4&Sort=update_stamp&current=@{page}',
    },
    {
        name: '剧场版',
        // https://m.mubai.link/filmClassifySearch?Pid=2&Sort=update_stamp&current=2
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/filmClassifySearch?Pid=2&Sort=update_stamp&current=@{page}',
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#
