// ignore
//@name:[嗅] MuteFun
//@version:1
//@webSite:https://www.mutean.com
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
const webSite = 'https://www.mutean.com'
// 网站搜索
// https://www.mutean.com/vodsearch/%E6%88%91%E6%8E%A8%E7%9A%84%E5%AD%A9%E5%AD%90-------------.html
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/vodsearch/@{searchWord}-------------.html'
// 当前网站任意视频详情页
// https://www.mutean.com/voddetail/1778.html
const videoDetailPage = '@{webSite}/voddetail/1778.html'
// 当前网站任意视频播放页
// https://www.mutean.com/vodplay/1778-2-1.html
const videoPlayPage = '@{webSite}/vodplay/1778-2-1.html'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '日漫',
        // https://www.mutean.com/vodtype/20.html
        // https://www.mutean.com/vodshow/20--------2---.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vodtype/20.html',
    },
    {
        name: '美漫',
        // https://www.mutean.com/vodtype/22.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vodtype/22.html',
    },
    {
        name: '特摄',
        // https://www.mutean.com/vodtype/23.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vodtype/23.html',
    },
    {
        name: '日剧',
        // https://www.mutean.com/vodtype/24.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/vodtype/24.html',
    }, 
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#