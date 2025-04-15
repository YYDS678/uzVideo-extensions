# uz 影视 扩展仓库

1. 欢迎向本仓库提交适用于 uz 影视 的扩展
2. 可以提交使用 uz 影视 加密的扩展，但不支持提交需要验证 `sid` 的扩展

|                                                    模块                                                     |    功能描述     |   类型   |
| :---------------------------------------------------------------------------------------------------------: | :-------------: | :------: |
| **[core](https://github.com/YYDS678/uzVideo-extensions/tree/main/core#uzutilsjs-提供网络存储toast-等功能)** | uz 影视基础能力 |    -     |
|         **[vod](https://github.com/YYDS678/uzVideo-extensions/tree/main/core#视频源-type101-扩展)**         |   视频源扩展    | type 101 |
|  **[recommend](https://github.com/YYDS678/uzVideo-extensions/tree/main/core#uzhome首页推荐-type200-扩展)**  |  推荐首页扩展   | type 200 |
|  **[panTools](https://github.com/YYDS678/uzVideo-extensions/tree/main/core#pantools网盘工具-type300扩展)**  |  网盘工具扩展   | type 300 |
|      **[danMu](https://github.com/YYDS678/uzVideo-extensions/tree/main/core#danmu弹幕-type400-扩展)**       |    弹幕扩展     | type 400 |

# 订阅

```
https://raw.githubusercontent.com/YYDS678/uzVideo-extensions/refs/heads/test/uzAio.zip
```

# 添加方式

uz 影视 -> 设置 -> 数据管理 -> 订阅 -> + -> 输入链接 -> 确定

# 请为扩展添加以下注释，用于自动更新 json

```
// 如果扩展加密了要用成对的 //空格ignore 包裹

// ignore

//@name:扩展名称
// 网站主页，只有视频源扩展需要
//@webSite:网站主页
// 版本号纯数字
//@version:1
// 备注，没有的话就不填
//@remark:这是备注
// 加密 id，没有的话就不填
//@codeID:
// 使用的环境变量，没有的话就不填
//@env:
// 是否是AV 1是  0否
//@isAV:0
//是否弃用 1是  0否
//@deprecated:0

// ignore

```
