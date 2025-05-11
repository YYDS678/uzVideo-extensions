// ignore
//@name:「嗅」 E-ACG2
//@version:1
//@webSite:https://eacg1.com
//@remark:
//@order: D
// ignore

// 适用于 把鼠标放在视频封面上 可以右键 复制正确链接的网站
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC 是 1， 手机是 0
const isUsePC = 1
/// 默认应该是 0，当视频不能播放的时候，可以把这个设置为 1， 否则不要改动
const isAddReferer = 0

// 网站主页
const webSite = 'https://eacg1.com'
// 网站搜索
// https://eacg1.com/vodsearch/海----------2---.html
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/vodsearch/@{searchWord}----------@{page}---.html'
// 当前网站任意视频详情页
// https://eacg1.com/voddetails-55797.html
const videoDetailPage = '@{webSite}/voddetails-55797.html'
// 当前网站任意视频播放页
// https://eacg1.com/Comicplay/55797-1-1.html
const videoPlayPage = '@{webSite}/Comicplay/55797-1-1.html'

// https://eacg1.com/vodshow/21---搞笑-----2---2021.html
// 筛选列表 @{mainId} 对应上面的 21 即大分类
// 筛选列表 @{filterId0} 对应上面的 搞笑 即筛选条件类型
// 筛选列表 @{filterId1} 对应上面的 2021 即筛选条件年份
// 筛选列表 @{page} 对应上面的 2 即页码
const filterListUrl = '@{webSite}/vodshow/@{mainId}---@{filterId0}-----@{page}---@{filterId1}.html'

const firstClass = [
    {
        //  分类列表 筛选列表
        //  一级分类的名称 如果不想写筛选 那么往下看剧场版分类 或者搜索 3.5
        // 这个就是我们在网站上看到的一级分类的名称
        // 也是在 app 里展示的名称
        name: '日漫',
        // 这个就是我们在网站上看到的一级分类的 id 对应上面的 @{mainId} 即21
        id: '21',
        // 这个是这个大分类的所有筛选类别  类型、地区、年份 这种 都是写在这个 [] 里的
        filter: [
            // MARK: 3.1 这个是单个筛选类别
            {
                // 这个是筛选标题
                name: '类型',
                // 这里面就是 类型 的筛选列表，可以在网站上依次选中看看变化
                // 同一个类型的 key 是一致的！
                // 这个 key 就是上面链接里要被替换的内容，这里对应 @{filterId0}
                list: [
                    {
                        // 这个就是筛选标签的名称
                        name: '全部',
                        // 这个就是筛选标签的 id 对应上面的 @{filterId0}
                        // 可以看到我们选了全部之后链接没有增加东西
                        // 所以这里的 id 是 空
                        id: '',
                        key: '@{filterId0}',
                    },
                    {
                        // 这个就是筛选标签的名称
                        name: '科幻',
                        // 这个就是筛选标签的 id 对应上面的 @{filterId0} 即科幻
                        //  我们选中科幻后 链接只增加了 科幻 两个字，所有 id 是 科幻
                        id: '科幻',
                        key: '@{filterId0}',
                    },
                    {
                        name: '热血',
                        id: '热血',
                        key: '@{filterId0}',
                    },
                    {
                        name: '推理',
                        id: '推理',
                        key: '@{filterId0}',
                    },
                ],
            },
            // MARK: 3.2 一个大分类 多个筛选条件
            // 现在是第二个筛选条件 年份 对应 @{filterId1}
            {
                name: '年份',
                list: [
                    {
                        name: '全部',
                        id: '',
                        key: '@{filterId1}',
                    },
                    {
                        name: '2025',
                        id: '2025',
                        key: '@{filterId1}',
                    },
                    {
                        name: '2024',
                        id: '2024',
                        key: '@{filterId1}',
                    },
                    {
                        name: '2023',
                        id: '2023',
                        key: '@{filterId1}',
                    },
                    {
                        name: '2022',
                        id: '2022',
                        key: '@{filterId1}',
                    },
                ],
            },
        ],
    },
    {
        // 3.3 一级分类的名称
        // 第二个大分类
        name: '国语动漫',
        // 这个就是我们在网站上看到的一级分类的 id 对应上面的 @{mainId} 即20
        id: '20',
        filter: [
            // 4.这个是筛选类别，我们只写了一个类型。如果有多个筛选类别那么就照着这个大括号的格式写多个
            {
                // 这个是筛选标题
                name: '类型',
                // 这里面就是 类型 的筛选列表，可以在网站上依次选中看看变化
                list: [
                    {
                        // 这个就是筛选标签的名称
                        name: '全部',
                        // 这个就是筛选标签的 id 对应上面的 @{filterId0}
                        // 可以看到我们选了全部之后链接没有增加东西
                        // 所以这里的 id 是 空
                        id: '',
                        key: '@{filterId0}',
                    },
                    {
                        // 这个就是筛选标签的名称
                        name: '科幻',
                        // 这个就是筛选标签的 id 对应上面的 @{filterId0} 即科幻
                        id: '科幻',
                        key: '@{filterId0}',
                    },
                    {
                        name: '热血',
                        id: '热血',
                        key: '@{filterId0}',
                    },
                    {
                        name: '推理',
                        id: '推理',
                        key: '@{filterId0}',
                    },
                ],
            },
        ],
    },
    {
        name: '剧场版',
        // 不想写分类筛选了。。。
        // https://eacg1.com/vodclassification/24-2.html
        id: '@{webSite}/vodclassification/24-@{page}.html',
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#
