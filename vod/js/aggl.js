// ignore
//@name:「嗅」 girigirilove
//@version:1
//@webSite:https://anime.girigirilove.com
//@remark:
//@order: D
// ignore

// 适用于 把鼠标放在视频封面上 可以右键 复制正确链接的网站
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC 是 1， 手机是 0
const isUsePC = 1
/// 当视频不能播放的时候，可以把这个设置为 1， 否则不要改动
const isAddReferer = 0

// 网站主页
const webSite = 'https://anime.girigirilove.com'
// 网站搜索
// https://anime.girigirilove.com/search/海----------2---/
const searchUrl = '@{webSite}/search/@{searchWord}----------@{page}---'
// 当前网站任意视频详情页
// https://anime.girigirilove.com/GV26152/
const videoDetailPage = '@{webSite}/GV26152/'
// 当前网站任意视频播放页
// https://anime.girigirilove.com/playGV26152-1-1/
const videoPlayPage = '@{webSite}/playGV26152-1-1/'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '日漫',
        id: '日漫',
        subClass: [
            {
                name: '全部',
                // https://anime.girigirilove.com/show/2--------2---
                // 把网站主页变成 @{webSite}  把页码变成 @{page}
                id: '@{webSite}/show/2--------@{page}---',
            },
            {
                name: '喜剧',
                // https://anime.girigirilove.com/show/2---喜剧-----2---
                // 把网站主页变成 @{webSite}  把页码变成 @{page}
                id: '@{webSite}/show/2---喜剧-----@{page}---',
            },
            {
                name: '爱情',
                id: '@{webSite}/show/2---爱情-----@{page}---',
            },
            {
                name: '恐怖',
                id: '@{webSite}/show/2---恐怖-----@{page}---',
            },
            {
                name: '动作',
                id: '@{webSite}/show/2---动作-----@{page}---',
            },
            {
                name: '科幻',
                id: '@{webSite}/show/2---科幻-----@{page}---',
            },
            {
                name: '剧情',
                id: '@{webSite}/show/2---剧情-----@{page}---',
            },
            {
                name: '战争',
                id: '@{webSite}/show/2---战争-----@{page}---',
            },
            {
                name: '奇幻',
                id: '@{webSite}/show/2---奇幻-----@{page}---',
            },
            {
                name: '冒险',
                id: '@{webSite}/show/2---冒险-----@{page}---',
            },
            {
                name: '悬疑',
                id: '@{webSite}/show/2---悬疑-----@{page}---',
            },
            {
                name: '热血',
                id: '@{webSite}/show/2---热血-----@{page}---',
            },
        ],
    },
    {
        name: '剧场版',
        id: '剧场版',
        subClass: [
            {
                // https://anime.girigirilove.com/show/21--------2---/
                name: '全部',
                id: '@{webSite}/show/21--------@{page}---',
            },
            {
                // https://anime.girigirilove.com/show/21---喜剧-----2---/
                name: '喜剧',
                id: '@{webSite}/show/21---喜剧-----@{page}---',
            },
            {
                name: '爱情',
                id: '@{webSite}/show/21---爱情-----@{page}---',
            },
            {
                name: '恐怖',
                id: '@{webSite}/show/21---恐怖-----@{page}---',
            },
            {
                name: '动作',
                id: '@{webSite}/show/21---动作-----@{page}---',
            },
            {
                name: '科幻',
                id: '@{webSite}/show/21---科幻-----@{page}---',
            },
            {
                name: '剧情',
                id: '@{webSite}/show/21---剧情-----@{page}---',
            },
            {
                name: '战争',
                id: '@{webSite}/show/21---战争-----@{page}---',
            },
            {
                name: '奇幻',
                id: '@{webSite}/show/21---奇幻-----@{page}---',
            },
            {
                name: '冒险',
                id: '@{webSite}/show/21---冒险-----@{page}---',
            },
            {
                name: '悬疑',
                id: '@{webSite}/show/21---悬疑-----@{page}---',
            },
            {
                name: '热血',
                id: '@{webSite}/show/21---热血-----@{page}---',
            },
        ],
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#
