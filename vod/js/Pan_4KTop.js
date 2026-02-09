//@name:[盘] 4KTop
//@version:2
//@webSite:https://4ktop.com
//@remark:TG频道：https://t.me/Lsp115
//@author:🙀是白猫呀！！！
//@order: A01

const appConfig = {
    _webSite: 'https://4ktop.com',
    /**
     * 网站主页
     */
    get webSite() {
        return this._webSite
    },
    set webSite(value) {
        this._webSite = value
    },

    _uzTag: '',
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
}

// 全局变量
let hasShownWelcome = false  // 标记是否已显示欢迎提示

/**
 * 异步获取分类列表的方法
 * 根据MacCMS常用结构设定，ID需根据网站实际调整，这里预设了常见ID
 * @param {UZArgs} args
 * @returns {Promise<RepVideoClassList>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        // 首次加载时显示欢迎提示
        if (!hasShownWelcome) {
            hasShownWelcome = true
            toast("🙀白猫出品，三无产品！！！", 3)  // 显示3秒
        }
        backData.data = [
            {
                type_id: '1',
                type_name: '电影',
                hasSubclass: true,
            },
            {
                type_id: '2',
                type_name: '电视剧',
                hasSubclass: true,
            },
            {
                type_id: '3',
                type_name: '综艺',
                hasSubclass: true,
            },
            {
                type_id: '4',
                type_name: '动漫',
                hasSubclass: true,
            },
            {
                type_id: '72',
                type_name: '短剧',
                hasSubclass: true,
            },
            {
                type_id: '5',
                type_name: '演唱会',
                hasSubclass: true,
            },
            {
                type_id: '53',
                type_name: '纪录片',
                hasSubclass: true,
            }
        ]
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
    let backData = new RepVideoSubclassList()
    backData.data = new VideoSubclass()
    const id = args.url
    try {
        backData.error = null
        let filter = []

        switch (id) {
            case '1': // 电影
                filter = [
                    {
                        name: '剧情',
                        list: [
                            { name: '全部', id: '' },
                            { name: '喜剧', id: '喜剧' },
                            { name: '爱情', id: '爱情' },
                            { name: '动作', id: '动作' },
                            { name: '科幻', id: '科幻' },
                            { name: '动画', id: '动画' },
                            { name: '悬疑', id: '悬疑' },
                            { name: '犯罪', id: '犯罪' },
                            { name: '惊悚', id: '惊悚' },
                            { name: '冒险', id: '冒险' },
                            { name: '音乐', id: '音乐' },
                            { name: '历史', id: '历史' },
                            { name: '奇幻', id: '奇幻' },
                            { name: '恐怖', id: '恐怖' },
                            { name: '战争', id: '战争' },
                            { name: '传记', id: '传记' },
                            { name: '歌舞', id: '歌舞' },
                            { name: '武侠', id: '武侠' },
                            { name: '情色', id: '情色' },
                            { name: '灾难', id: '灾难' },
                            { name: '西部', id: '西部' },
                            { name: '纪录片', id: '纪录片' },
                            { name: '短片', id: '短片' }
                        ],
                    },
                    {
                        name: '地区',
                        list: [
                            { name: '全部', id: '' },
                            { name: '中国大陆', id: '中国大陆' },
                            { name: '中国香港', id: '中国香港' },
                            { name: '中国台湾', id: '中国台湾' },
                            { name: '美国', id: '美国' },
                            { name: '法国', id: '法国' },
                            { name: '英国', id: '英国' },
                            { name: '日本', id: '日本' },
                            { name: '韩国', id: '韩国' },
                            { name: '德国', id: '德国' },
                            { name: '泰国', id: '泰国' },
                            { name: '印度', id: '印度' },
                            { name: '意大利', id: '意大利' },
                            { name: '西班牙', id: '西班牙' },
                            { name: '加拿大', id: '加拿大' },
                            { name: '其他', id: '其他' }
                        ],
                    },
                    {
                        name: '年份',
                        list: [
                            { name: '全部', id: '' },
                            { name: '2026', id: '2026' },
                            { name: '2025', id: '2025' },
                            { name: '2024', id: '2024' },
                            { name: '2023', id: '2023' },
                            { name: '2022', id: '2022' },
                            { name: '2021', id: '2021' },
                            { name: '2020', id: '2020' },
                            { name: '2019', id: '2019' },
                            { name: '2018', id: '2018' },
                            { name: '2017', id: '2017' },
                            { name: '2016', id: '2016' },
                            { name: '2015', id: '2015' },
                            { name: '2014', id: '2014' },
                            { name: '2013', id: '2013' },
                            { name: '2012', id: '2012' },
                            { name: '2011', id: '2011' },
                            { name: '2010', id: '2010' },
                            { name: '2009', id: '2009' },
                            { name: '2008', id: '2008' },
                            { name: '2007', id: '2007' },
                            { name: '2006', id: '2006' },
                            { name: '2005', id: '2005' },
                            { name: '2004', id: '2004' },
                            { name: '2003', id: '2003' },
                            { name: '2002', id: '2002' },
                            { name: '2001', id: '2001' },
                            { name: '2000', id: '2000' },
                            { name: '1999', id: '1999' },
                            { name: '1998', id: '1998' },
                            { name: '1997', id: '1997' },
                            { name: '1996', id: '1996' },
                            { name: '1995', id: '1995' },
                            { name: '1994', id: '1994' },
                            { name: '1993', id: '1993' },
                            { name: '1992', id: '1992' },
                            { name: '1991', id: '1991' },
                            { name: '1990', id: '1990' }
                        ],
                    },
                    {
                        name: '版本',
                        list: [
                            { name: '全部', id: '' },
                            { name: '蓝光原盘', id: '蓝光原盘' },
                            { name: '4KRemux', id: '4KRemux' },
                            { name: '4KDVRemux', id: '4KDVRemux' },
                            { name: '4KDV', id: '4KDV' },
                            { name: '4K', id: '4K' },
                            { name: '1080PRemux', id: '1080PRemux' },
                            { name: '1080P蓝光', id: '1080P蓝光' },
                            { name: '1080P', id: '1080P' },
                            { name: '720P', id: '720P' }
                        ],
                    },
                    {
                        name: '排序',
                        list: [
                            { name: '时间排序', id: 'time' },
                            { name: '人气排序', id: 'hits' },
                            { name: '评分排序', id: 'score' },
                        ],
                    },
                ]
                break
            case '2': // 电视剧
                filter = [
                    {
                        name: '剧情',
                        list: [
                            { name: '全部', id: '' },
                            { name: '喜剧', id: '喜剧' },
                            { name: '爱情', id: '爱情' },
                            { name: '悬疑', id: '悬疑' },
                            { name: '动画', id: '动画' },
                            { name: '武侠', id: '武侠' },
                            { name: '古装', id: '古装' },
                            { name: '家庭', id: '家庭' },
                            { name: '犯罪', id: '犯罪' },
                            { name: '科幻', id: '科幻' },
                            { name: '恐怖', id: '恐怖' },
                            { name: '历史', id: '历史' },
                            { name: '战争', id: '战争' },
                            { name: '动作', id: '动作' },
                            { name: '冒险', id: '冒险' },
                            { name: '传记', id: '传记' },
                            { name: '剧情', id: '剧情' },
                            { name: '奇幻', id: '奇幻' },
                            { name: '惊悚', id: '惊悚' },
                            { name: '歌舞', id: '歌舞' },
                            { name: '短片', id: '短片' }
                        ],
                    },
                    {
                        name: '地区',
                        list: [
                            { name: '全部', id: '' },
                            { name: '中国大陆', id: '中国大陆' },
                            { name: '中国香港', id: '中国香港' },
                            { name: '中国台湾', id: '中国台湾' },
                            { name: '美国', id: '美国' },
                            { name: '法国', id: '法国' },
                            { name: '英国', id: '英国' },
                            { name: '日本', id: '日本' },
                            { name: '韩国', id: '韩国' },
                            { name: '德国', id: '德国' },
                            { name: '泰国', id: '泰国' },
                            { name: '印度', id: '印度' },
                            { name: '意大利', id: '意大利' },
                            { name: '西班牙', id: '西班牙' },
                            { name: '加拿大', id: '加拿大' },
                            { name: '其他', id: '其他' }
                        ],
                    },
                    {
                        name: '年份',
                        list: [
                            { name: '全部', id: '' },
                            { name: '2026', id: '2026' },
                            { name: '2025', id: '2025' },
                            { name: '2024', id: '2024' },
                            { name: '2023', id: '2023' },
                            { name: '2022', id: '2022' },
                            { name: '2021', id: '2021' },
                            { name: '2020', id: '2020' },
                            { name: '2019', id: '2019' },
                            { name: '2018', id: '2018' },
                            { name: '2017', id: '2017' },
                            { name: '2016', id: '2016' },
                            { name: '2015', id: '2015' },
                            { name: '2014', id: '2014' },
                            { name: '2013', id: '2013' },
                            { name: '2012', id: '2012' },
                            { name: '2011', id: '2011' },
                            { name: '2010', id: '2010' },
                            { name: '2009', id: '2009' },
                            { name: '2008', id: '2008' },
                            { name: '2007', id: '2007' },
                            { name: '2006', id: '2006' },
                            { name: '2005', id: '2005' },
                            { name: '2004', id: '2004' },
                            { name: '2003', id: '2003' },
                            { name: '2002', id: '2002' },
                            { name: '2001', id: '2001' },
                            { name: '2000', id: '2000' }
                        ],
                    },
                    {
                        name: '版本',
                        list: [
                            { name: '全部', id: '' },
                            { name: '4K完结', id: '4K完结' },
                            { name: '1080P完结', id: '1080P完结' },
                            { name: '4K', id: '4K' },
                            { name: '1080P', id: '1080P' }
                        ],
                    },
                    {
                        name: '排序',
                        list: [
                            { name: '时间排序', id: 'time' },
                            { name: '人气排序', id: 'hits' },
                            { name: '评分排序', id: 'score' },
                        ],
                    },
                ]
                break
            case '3': // 综艺
                filter = [
                    {
                        name: '剧情',
                        list: [
                            { name: '全部', id: '' },
                            { name: '选秀', id: '选秀' },
                            { name: '情感', id: '情感' },
                            { name: '访谈', id: '访谈' },
                            { name: '播报', id: '播报' },
                            { name: '旅游', id: '旅游' },
                            { name: '音乐', id: '音乐' },
                            { name: '美食', id: '美食' },
                            { name: '纪实', id: '纪实' },
                            { name: '曲艺', id: '曲艺' },
                            { name: '生活', id: '生活' },
                            { name: '游戏互动', id: '游戏互动' },
                            { name: '财经', id: '财经' },
                            { name: '求职', id: '求职' }
                        ],
                    },
                    {
                        name: '地区',
                        list: [
                            { name: '全部', id: '' },
                            { name: '中国大陆', id: '中国大陆' },
                            { name: '中国香港', id: '中国香港' },
                            { name: '中国台湾', id: '中国台湾' },
                            { name: '美国', id: '美国' },
                            { name: '法国', id: '法国' },
                            { name: '英国', id: '英国' },
                            { name: '日本', id: '日本' },
                            { name: '韩国', id: '韩国' },
                            { name: '德国', id: '德国' },
                            { name: '泰国', id: '泰国' },
                            { name: '印度', id: '印度' },
                            { name: '意大利', id: '意大利' },
                            { name: '西班牙', id: '西班牙' },
                            { name: '加拿大', id: '加拿大' },
                            { name: '其他', id: '其他' }
                        ],
                    },
                    {
                        name: '年份',
                        list: [
                            { name: '全部', id: '' },
                            { name: '2026', id: '2026' },
                            { name: '2025', id: '2025' },
                            { name: '2024', id: '2024' },
                            { name: '2023', id: '2023' },
                            { name: '2022', id: '2022' },
                            { name: '2021', id: '2021' },
                            { name: '2020', id: '2020' },
                            { name: '2019', id: '2019' },
                            { name: '2018', id: '2018' },
                            { name: '2017', id: '2017' },
                            { name: '2016', id: '2016' },
                            { name: '2015', id: '2015' },
                            { name: '2014', id: '2014' },
                            { name: '2013', id: '2013' },
                            { name: '2012', id: '2012' },
                            { name: '2011', id: '2011' },
                            { name: '2010', id: '2010' }
                        ],
                    },
                    {
                        name: '版本',
                        list: [
                            { name: '全部', id: '' },
                            { name: '4K完结', id: '4K完结' },
                            { name: '1080P完结', id: '1080P完结' },
                            { name: '4KDV', id: '4KDV' },
                            { name: '4K', id: '4K' },
                            { name: '1080P原盘ISO', id: '1080P原盘ISO' },
                            { name: '1080PRemux', id: '1080PRemux' },
                            { name: '1080P蓝光', id: '1080P蓝光' },
                            { name: '1080P', id: '1080P' },
                            { name: '720P', id: '720P' }
                        ],
                    },
                    {
                        name: '排序',
                        list: [
                            { name: '时间排序', id: 'time' },
                            { name: '人气排序', id: 'hits' },
                            { name: '评分排序', id: 'score' },
                        ],
                    },
                ]
                break
            case '4': // 动漫
                filter = [
                    {
                        name: '剧情',
                        list: [
                            { name: '全部', id: '' },
                            { name: '爱情', id: '爱情' },
                            { name: '悬疑', id: '悬疑' },
                            { name: '动画', id: '动画' },
                            { name: '武侠', id: '武侠' },
                            { name: '古装', id: '古装' },
                            { name: '家庭', id: '家庭' },
                            { name: '犯罪', id: '犯罪' },
                            { name: '科幻', id: '科幻' },
                            { name: '恐怖', id: '恐怖' },
                            { name: '历史', id: '历史' },
                            { name: '战争', id: '战争' },
                            { name: '动作', id: '动作' },
                            { name: '冒险', id: '冒险' },
                            { name: '传记', id: '传记' },
                            { name: '剧情', id: '剧情' },
                            { name: '奇幻', id: '奇幻' },
                            { name: '惊悚', id: '惊悚' },
                            { name: '灾难', id: '灾难' },
                            { name: '歌舞', id: '歌舞' },
                            { name: '音乐', id: '音乐' }
                        ],
                    },
                    {
                        name: '地区',
                        list: [
                            { name: '全部', id: '' },
                            { name: '中国大陆', id: '中国大陆' },
                            { name: '香港', id: '香港' },
                            { name: '台湾', id: '台湾' },
                            { name: '美国', id: '美国' },
                            { name: '日本', id: '日本' },
                            { name: '英国', id: '英国' },
                            { name: '加拿大', id: '加拿大' },
                            { name: '法国', id: '法国' },
                            { name: '印度', id: '印度' },
                            { name: '意大利', id: '意大利' },
                            { name: '德国', id: '德国' },
                            { name: '韩国', id: '韩国' },
                            { name: '泰国', id: '泰国' },
                            { name: '俄罗斯', id: '俄罗斯' },
                            { name: '苏联', id: '苏联' }
                        ],
                    },
                    {
                        name: '年份',
                        list: [
                            { name: '全部', id: '' },
                            { name: '2026', id: '2026' },
                            { name: '2025', id: '2025' },
                            { name: '2024', id: '2024' },
                            { name: '2023', id: '2023' },
                            { name: '2022', id: '2022' },
                            { name: '2021', id: '2021' },
                            { name: '2020', id: '2020' },
                            { name: '2019', id: '2019' },
                            { name: '2018', id: '2018' },
                            { name: '2017', id: '2017' },
                            { name: '2016', id: '2016' },
                            { name: '2015', id: '2015' },
                            { name: '2014', id: '2014' },
                            { name: '2013', id: '2013' },
                            { name: '2012', id: '2012' },
                            { name: '2011', id: '2011' },
                            { name: '2010', id: '2010' },
                            { name: '2009', id: '2009' },
                            { name: '2008', id: '2008' },
                            { name: '2007', id: '2007' },
                            { name: '2006', id: '2006' },
                            { name: '2005', id: '2005' },
                            { name: '2004', id: '2004' },
                            { name: '2003', id: '2003' },
                            { name: '2002', id: '2002' },
                            { name: '2001', id: '2001' },
                            { name: '2000', id: '2000' },
                            { name: '1999', id: '1999' }
                        ],
                    },
                    {
                        name: '版本',
                        list: [
                            { name: '全部', id: '' },
                            { name: '蓝光原盘', id: '蓝光原盘' },
                            { name: '4KRemux', id: '4KRemux' },
                            { name: '4KDVRemux', id: '4KDVRemux' },
                            { name: '4KDV', id: '4KDV' },
                            { name: '4K', id: '4K' },
                            { name: '1080PRemux', id: '1080PRemux' },
                            { name: '1080P蓝光', id: '1080P蓝光' },
                            { name: '1080P', id: '1080P' },
                            { name: '720P', id: '720P' },
                            { name: '4K完结', id: '4K完结' },
                            { name: '1080P完结', id: '1080P完结' }
                        ],
                    },
                    {
                        name: '排序',
                        list: [
                            { name: '时间排序', id: 'time' },
                            { name: '人气排序', id: 'hits' },
                            { name: '评分排序', id: 'score' },
                        ],
                    },
                ]
                break
            case '72': // 短剧
                filter = [
                    {
                        name: '剧情',
                        list: [
                            { name: '全部', id: '' },
                            { name: '爱情', id: '爱情' },
                            { name: '悬疑', id: '悬疑' },
                            { name: '古装', id: '古装' },
                            { name: '奇幻', id: '奇幻' },
                            { name: '剧情', id: '剧情' },
                            { name: '喜剧', id: '喜剧' },
                            { name: '动作', id: '动作' },
                            { name: '恐怖', id: '恐怖' },
                            { name: '惊悚', id: '惊悚' },
                            { name: '科幻', id: '科幻' }
                        ],
                    },

                    {
                        name: '年份',
                        list: [
                            { name: '全部', id: '' },
                            { name: '2026', id: '2026' },
                            { name: '2025', id: '2025' },
                            { name: '2024', id: '2024' },
                            { name: '2023', id: '2023' }
                        ],
                    },
                    {
                        name: '版本',
                        list: [
                            { name: '全部', id: '' },
                            { name: '4K完结', id: '4K完结' },
                            { name: '1080P完结', id: '1080P完结' }
                        ],
                    },
                    {
                        name: '排序',
                        list: [
                            { name: '时间排序', id: 'time' },
                            { name: '人气排序', id: 'hits' },
                            { name: '评分排序', id: 'score' },
                        ],
                    },
                ]
                break
            case '5': // 演唱会
                filter = [
                    {
                        name: '剧情',
                        list: [
                            { name: '全部', id: '' },
                            { name: '流行演唱会', id: '流行演唱会' },
                            { name: '摇滚演唱会', id: '摇滚演唱会' },
                            { name: '古典音乐会', id: '古典音乐会' },
                            { name: '说唱演唱会', id: '说唱演唱会' },
                            { name: '民谣演唱会', id: '民谣演唱会' },
                            { name: '群星演唱会', id: '群星演唱会' }
                        ],
                    },
                    {
                        name: '地区',
                        list: [
                            { name: '全部', id: '' },
                            { name: '中国大陆', id: '中国大陆' },
                            { name: '中国香港', id: '中国香港' },
                            { name: '中国台湾', id: '中国台湾' },
                            { name: '美国', id: '美国' },
                            { name: '法国', id: '法国' },
                            { name: '英国', id: '英国' },
                            { name: '日本', id: '日本' },
                            { name: '韩国', id: '韩国' },
                            { name: '德国', id: '德国' },
                            { name: '泰国', id: '泰国' },
                            { name: '印度', id: '印度' },
                            { name: '意大利', id: '意大利' },
                            { name: '西班牙', id: '西班牙' },
                            { name: '加拿大', id: '加拿大' },
                            { name: '其他', id: '其他' }
                        ],
                    },
                    {
                        name: '年份',
                        list: [
                            { name: '全部', id: '' },
                            { name: '2026', id: '2026' },
                            { name: '2025', id: '2025' },
                            { name: '2024', id: '2024' },
                            { name: '2023', id: '2023' },
                            { name: '2022', id: '2022' },
                            { name: '2021', id: '2021' },
                            { name: '2020', id: '2020' },
                            { name: '2019', id: '2019' },
                            { name: '2018', id: '2018' },
                            { name: '2017', id: '2017' },
                            { name: '2016', id: '2016' },
                            { name: '2015', id: '2015' },
                            { name: '2014', id: '2014' },
                            { name: '2013', id: '2013' },
                            { name: '2012', id: '2012' },
                            { name: '2011', id: '2011' }
                        ],
                    },
                    {
                        name: '版本',
                        list: [
                            { name: '全部', id: '' },
                            { name: '蓝光原盘', id: '蓝光原盘' },
                            { name: '4KRemux', id: '4KRemux' },
                            { name: '4KDVRemux', id: '4KDVRemux' },
                            { name: '4KDV', id: '4KDV' },
                            { name: '4K', id: '4K' },
                            { name: '1080PRemux', id: '1080PRemux' },
                            { name: '1080P蓝光', id: '1080P蓝光' },
                            { name: '1080P', id: '1080P' },
                            { name: '720P', id: '720P' }
                        ],
                    },
                    {
                        name: '排序',
                        list: [
                            { name: '时间排序', id: 'time' },
                            { name: '人气排序', id: 'hits' },
                            { name: '评分排序', id: 'score' },
                        ],
                    },
                ]
                break
            case '53': // 纪录片
                filter = [
                    {
                        name: '剧情',
                        list: [
                            { name: '全部', id: '' },
                            { name: '自然', id: '自然' },
                            { name: '历史', id: '历史' },
                            { name: '动物', id: '动物' },
                            { name: '社会', id: '社会' },
                            { name: '文化', id: '文化' },
                            { name: '探险', id: '探险' },
                            { name: '天文', id: '天文' },
                            { name: '科技', id: '科技' },
                            { name: '政治', id: '政治' },
                            { name: '音乐', id: '音乐' },
                            { name: '旅行', id: '旅行' },
                            { name: '美食', id: '美食' },
                            { name: '人物传记', id: '人物传记' },
                            { name: '心理', id: '心理' },
                            { name: '艺术', id: '艺术' },
                            { name: '犯罪', id: '犯罪' },
                            { name: '环保', id: '环保' },
                            { name: '体育', id: '体育' }
                        ],
                    },
                    {
                        name: '地区',
                        list: [
                            { name: '全部', id: '' },
                            { name: '中国大陆', id: '中国大陆' },
                            { name: '中国香港', id: '中国香港' },
                            { name: '中国台湾', id: '中国台湾' },
                            { name: '美国', id: '美国' },
                            { name: '法国', id: '法国' },
                            { name: '英国', id: '英国' },
                            { name: '日本', id: '日本' },
                            { name: '韩国', id: '韩国' },
                            { name: '德国', id: '德国' },
                            { name: '泰国', id: '泰国' },
                            { name: '印度', id: '印度' },
                            { name: '意大利', id: '意大利' },
                            { name: '西班牙', id: '西班牙' },
                            { name: '加拿大', id: '加拿大' },
                            { name: '其他', id: '其他' }
                        ],
                    },
                    {
                        name: '年份',
                        list: [
                            { name: '全部', id: '' },
                            { name: '2025', id: '2025' },
                            { name: '2024', id: '2024' },
                            { name: '2023', id: '2023' },
                            { name: '2022', id: '2022' },
                            { name: '2021', id: '2021' },
                            { name: '2020', id: '2020' },
                            { name: '2019', id: '2019' },
                            { name: '2018', id: '2018' },
                            { name: '2017', id: '2017' },
                            { name: '2016', id: '2016' },
                            { name: '2015', id: '2015' },
                            { name: '2014', id: '2014' },
                            { name: '2013', id: '2013' },
                            { name: '2012', id: '2012' },
                            { name: '2011', id: '2011' },
                            { name: '2010', id: '2010' },
                            { name: '2009', id: '2009' },
                            { name: '2008', id: '2008' },
                            { name: '2007', id: '2007' },
                            { name: '2006', id: '2006' },
                            { name: '2005', id: '2005' },
                            { name: '2004', id: '2004' },
                            { name: '2003', id: '2003' },
                            { name: '2002', id: '2002' },
                            { name: '2001', id: '2001' },
                            { name: '2000', id: '2000' },
                            { name: '1999', id: '1999' }
                        ],
                    },
                    {
                        name: '版本',
                        list: [
                            { name: '全部', id: '' },
                            { name: '蓝光原盘', id: '蓝光原盘' },
                            { name: '4KRemux', id: '4KRemux' },
                            { name: '4KDVRemux', id: '4KDVRemux' },
                            { name: '4KDV', id: '4KDV' },
                            { name: '4K', id: '4K' },
                            { name: '1080PRemux', id: '1080PRemux' },
                            { name: '1080P蓝光', id: '1080P蓝光' },
                            { name: '1080P', id: '1080P' },
                            { name: '720P', id: '720P' }
                        ],
                    },
                    {
                        name: '排序',
                        list: [
                            { name: '时间排序', id: 'time' },
                            { name: '人气排序', id: 'hits' },
                            { name: '评分排序', id: 'score' },
                        ],
                    },
                ]
                break
        }
        backData.data.filter = filter
    } catch (error) {
        backData.error = '获取分类失败～ ' + error
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类视频列表 或 筛选视频列表
 * @param {UZSubclassVideoListArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    try {
        // 根据示例链接构建URL: https://4ktop.com/vodshow/1-%E4%B8%AD%E5%9B%BD%E5%A4%A7%E9%99%86-time-%E5%96%9C%E5%89%A7--------2025/version/4K/
        // 格式: /vodshow/分类ID-地区-排序-剧情-----页码---年份/version/版本/

        // 根据filter的长度来决定如何解构
        if (args.filter.length === 5) {
            [{ id: genre }, { id: area }, { id: year }, { id: version }, { id: sort }] = args.filter
        } else if (args.filter.length === 4) {
            [{ id: genre }, { id: year }, { id: version }, { id: sort }] = args.filter
            area = ''
        }

        let searchUrl = UZUtils.removeTrailingSlash(appConfig.webSite) + `/vodshow/${args.mainClassId}-${area}-${sort}-${genre}-----${args.page}---${year}/version/${version}`


        // 获取数据
        let repData = await req(searchUrl)
        const $ = cheerio.load(repData.data)

        // 定位搜索结果
        let vodItems = $('.module .module-item')

        vodItems.each((_, e) => {
            let videoDet = new VideoDetail()

            // 获取链接
            videoDet.vod_id = $(e).attr('href')

            // 获取图片
            let imgElem = $(e).find('.module-item-pic img').first()
            videoDet.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + imgElem.attr('data-original')
            videoDet.vod_name = imgElem.attr('alt')

            // 获取备注
            videoDet.vod_remarks = $(e).find('.module-item-note').text()

            backData.data.push(videoDet)
        })
    } catch (error) {
        backData.error = '获取筛选视频列表失败: ' + error
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {Promise<RepVideoDetail>}
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let webUrl = combineUrl(args.url)
        let pro = await req(webUrl)

        backData.error = pro.error
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            let vodDetail = new VideoDetail()
            vodDetail.vod_id = args.url

            // 1. 获取标题和图片
            let imgInfo = $('.module-info-poster .module-item-pic img')
            vodDetail.vod_name = imgInfo.attr('alt')

            vodDetail.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + imgInfo.attr('data-original')

            // 2. 获取简介
            vodDetail.vod_content = $('.module-info-introduction-content p').text().trim()

            // 3. 获取 导演/编剧/主演
            let infoItems = $('.module-info-item')
            infoItems.each((_, item) => {
                let title = $(item).find('.module-info-item-title').text()
                let content = $(item).find('.module-info-item-content a').map((i, el) => $(el).text()).get().join(',')

                if (title.includes('导演')) {
                    vodDetail.vod_director = content
                } else if (title.includes('主演')) {
                    vodDetail.vod_actor = content
                }
            })

            // 4. 获取网盘链接
            const panUrls = []
            // 定位到下载模块的行
            let downloadRows = $('#download-list .module-row-info')

            downloadRows.each((_, row) => {
                // 获取包含注释的 HTML 原始内容
                let shortcutHtml = $(row).find('.module-row-shortcuts').html()

                if (shortcutHtml) {
                    // 使用正则提取注释中的 data-clipboard-text
                    let match = shortcutHtml.match(/data-clipboard-text="([^"]+)"/)

                    if (match && match[1]) {
                        panUrls.push(match[1])
                    }
                }
            })

            vodDetail.panUrls = panUrls

            backData.data = vodDetail
        }
    } catch (error) {
        backData.error = '获取视频详情失败' + error
    }

    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {Promise<RepVideoPlayUrl>}
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * URL格式参考: /vodsearch/关键字----------页码---/
 * @param {UZArgs} args
 * @returns {Promise<RepVideoList>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        // 构造搜索URL
        let searchUrl = `${UZUtils.removeTrailingSlash(appConfig.webSite)}/vodsearch/${args.searchWord}----------${args.page}---/`

        let repData = await req(searchUrl)
        const $ = cheerio.load(repData.data)

        // 定位搜索结果
        let items = $('.module-card-item')

        items.each((_, item) => {
            let video = new VideoDetail()

            // 获取链接和标题
            let linkTag = $(item).find('.module-card-item-poster')
            video.vod_id = linkTag.attr('href')

            let imgTag = linkTag.find('img').first()
            video.vod_name = imgTag.attr('alt')
            video.vod_pic = UZUtils.removeTrailingSlash(appConfig.webSite) + imgTag.attr('data-original')

            // 获取备注
            video.vod_remarks = $(item).find('.module-item-note').text()

            backData.data.push(video)
        })
    } catch (error) {
        backData.error = '搜索失败: ' + error
    }
    return JSON.stringify(backData)
}

function combineUrl(url) {
    if (url === undefined) {
        return ''
    }
    if (url.indexOf(appConfig.webSite) !== -1) {
        return url
    }
    if (url.startsWith('http')) {
        return url
    }
    if (url.startsWith('/')) {
        return appConfig.webSite + url
    }
    return appConfig.webSite + '/' + url
}