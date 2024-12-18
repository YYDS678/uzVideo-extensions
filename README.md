# uz 影视 扩展仓库

1. 欢迎向本仓库提交适用于 uz影视 的扩展
2. 可以提交使用 uz 影视 加密的扩展，但不支持提交需要验证 `sid` 的扩展

|                                        模块                                        |    功能描述     |   类型   |
| :--------------------------------------------------------------------------------: | :-------------: | :------: |
|      **[core](https://github.com/YYDS678/uzVideo-extensions/tree/main/core)**      | uz 影视基础能力 |    -     |
| **[vod](https://github.com/YYDS678/uzVideo-extensions/tree/main/core/vod101.js)**  |   视频源扩展    | type 101 |
| **[recommend](https://github.com/YYDS678/uzVideo-extensions/tree/main/recommend)** |  推荐首页扩展   | type 200 |
|  **[panTools](https://github.com/YYDS678/uzVideo-extensions/tree/main/panTools)**  |  网盘工具扩展   | type 300 |
|     **[danMu](https://github.com/YYDS678/uzVideo-extensions/tree/main/danMu)**     |    弹幕扩展     | type 400 |


# 订阅

https://gh-proxy.com/https://raw.githubusercontent.com/YYDS678/uzVideo-extensions/refs/heads/main/uzAio.json

# 添加方式

uz 影视 -> 设置 -> 数据管理 -> 订阅 -> + -> 输入链接 -> 确定


# json 格式

```
{
    "recommend": [
        {
            "name": "名称",
            "codeID": "如果选择了加密请填写，由 uz 生成",
            "url": "扩展链接",
            "remark": "备注",
            "env":"",//环境变量名称1##环境变量描述1&&环境变量名称2##环境变量描述2
            "version": 1, //扩展版本号
            "type": 200 //推荐首页扩展固定 200
        }
    ],
    "panTools": [
        {
            "name": "名称",
            "codeID": "如果选择了加密请填写，由 uz 生成",
            "url": "扩展链接",
            "remark": "备注",
            "env":"",//环境变量名称1##环境变量描述1&&环境变量名称2##环境变量描述2
            "version": 1, //扩展版本号
            "type": 300 //网盘工具扩展固定 300
        }
    ],
    "danMu": [
        {
            "name": "名称",
            "codeID": "如果选择了加密请填写，由 uz 生成",
            "url": "扩展链接",
            "remark": "备注",
            "env":"",//环境变量名称1##环境变量描述1&&环境变量名称2##环境变量描述2
            "version": 1, //扩展版本号
            "type": 400 //弹幕扩展固定 400
        }
    ],
    "live": [
        {
            "name": "名称",
            "url": "直播源链接 m3u 或 txt 格式",
            "remark": "备注",
            "type": 10 //直播源固定 10
        }
    ],
    "vod": [
        {
            "name": "名称",
            "codeID": "如果选择了加密请填写，由 uz 生成",
            "url": "扩展链接",
            "remark": "备注",
            "env":"",//环境变量名称1##环境变量描述1&&环境变量名称2##环境变量描述2
            "version": 1, //扩展版本号
            "type": 101 //视频源扩展固定 101
        }
    ]
}

```