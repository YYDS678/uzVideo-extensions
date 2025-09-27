//@name:夸克|UC|天翼|123|百度|移动|pikpak|解析
//@version:33
//@remark:iOS14 以上版本可用,App v1.6.54 及以上版本可用
//@env:百度网盘Cookie##用于播放百度网盘视频&&UCCookie##用于播放UC网盘视频&&夸克Cookie##用于播放Quark网盘视频&&转存文件夹名称##在各网盘转存文件时使用的文件夹名称&&123网盘账号##用于播放123网盘视频&&123网盘密码##用于播放123网盘视频&&天翼网盘账号##用于播放天翼网盘视频&&天翼网盘密码##用于播放天翼网盘视频&&采集解析地址##内置两个，失效不要反馈。格式：名称1@地址1;名称2@地址2
//@order: A

// ignore
import {
    FilterLabel,
    FilterTitle,
    VideoClass,
    VideoSubclass,
    VideoDetail,
    RepVideoClassList,
    RepVideoSubclassList,
    RepVideoList,
    RepVideoDetail,
    RepVideoPlayUrl,
    UZArgs,
    UZSubclassVideoListArgs,
} from '../../core/core/uzVideo.js'

import {
    UZUtils,
    ProData,
    ReqResponseType,
    ReqAddressType,
    req,
    getEnv,
    setEnv,
    goToVerify,
    openWebToBindEnv,
    toast,
    kIsDesktop,
    kIsAndroid,
    kIsIOS,
    kIsWindows,
    kIsMacOS,
    kIsTV,
    kLocale,
    kAppVersion,
    formatBackData,
} from '../../core/core/uzUtils.js'

import { cheerio, Crypto, Encrypt, JSONbig } from '../../core/core/uz3lib.js'
// ignore

/**
 * 网盘类型
 */
const PanType = {
    XXX: 'xxx网盘',
}

/**
 * 播放信息
 **/
class PanPlayInfo {
    constructor(url = '', error = '', playHeaders = {}, urls = []) {
        /**
         * 播放地址，优先取 urls, 如果 urls 为空，取该值
         * @type {string}
         */
        this.url = url
        this.error = error
        this.playHeaders = playHeaders

        /**
         * 多个播放地址，优先取该值 如果为空取 url
         * @type {{name:string,url:string,headers:object,priority:number,isSniffer:boolean,snifferUA:string, timeOut:number, retry:number}[]}
         * @property {string} name 名称 4k 高清 之类
         * @property {string} url 播放地址
         * @property {object} headers 播放头
         * @property {number} priority 优先级
         * @property {boolean} isSniffer 是否是嗅探 默认 false, app v1.6.55 及以上版本可用
         * @property {string} snifferUA 嗅探UA, app v1.6.55 及以上版本可用
         * @property {number} timeOut 单次嗅探超时时间 单位秒 默认 12s, app v1.6.55 及以上版本可用
         * @property {number} retry 嗅探重试次数 默认 1 次 ,app v1.6.55 及以上版本可用
         */
        this.urls = urls
    }
}

/**
 * 网盘视频项
 */
class PanVideoItem {
    constructor() {
        /**
         * 展示名称 例如 老友记
         */
        this.name = ''

        /**
         * 备注信息，如 文件大小
         */
        this.remark = ''

        /**
         * 分组名称 例如 原画 、 普画  非必须
         */
        this.fromName = ''

        /**
         * 网盘类型 用于获取播放信息时
         * @type {PanType}
         **/
        this.panType = PanType.XXX

        /**
         * 关键数据 用于获取播放信息时
         * @type {Object}
         */
        this.data
    }
}

/**
 * 网盘播放列表
 */
class PanListDetail {
    constructor() {
        /**
         * @type {PanVideoItem[]}
         * 视频列表
         */
        this.videos = []
        /**
         * 最外层文件夹名称
         */
        this.fileName = ''
        this.error = ''
    }
}

/**
 * 网盘挂载 类型
 */
class PanMount {
    constructor(name = '', panType = PanType.UC, isLogin = false) {
        /**
         * 网盘展示名称
         */
        this.name = name

        /**
         * 网盘类型
         * @type {PanType}
         */
        this.panType = panType

        /**
         * 是否已登录,未登录不展示 主要是判断是否存在 cookie ，用于快速展示入口
         * @type {boolean}
         */
        this.isLogin = isLogin
    }
}

/**
 * 网盘数据类型，目前只支持视频和目录
 * @type {{Video: string, Dir: string}}
 **/
const PanDataType = {
    /**
     * 未知，其他
     */
    Unknown: 0,

    /**
     * 视频
     */
    Video: 10,

    /**
     * 目录
     */
    Dir: 20,
}

/**
 * 网盘挂载列表
 */
class PanMountListData {
    constructor(
        name = '',
        panType = PanType.XXX,
        dataType = PanDataType.Dir,
        data = {},
        remark = ''
    ) {
        /**
         * 列表展示名称
         */
        this.name = name
        /**
         * 网盘类型
         * @type {PanDataType}
         */
        this.panType = panType

        /**
         * 备注信息，如 文件大小
         */
        this.remark = ''
        /**
         * 数据类型
         * @type {PanDataType}
         */
        this.dataType = dataType
        /**
         * 关键数据
         * @type {Object}
         */
        this.data = data
    }
}

let panSubClasses = []

/**
 * 网盘工具
 */
class PanTools {
    constructor() {
        /**
         * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
         */
        this._uzTag = ''
    }

    panToolsHandlers = []

    /**
     * 扩展运行标识 ** uzApp 运行时自动赋值，请勿修改 **
     */
    set uzTag(value) {
        this._uzTag = value
        this.initHandlers()
    }

    get uzTag() {
        return this._uzTag
    }

    _isInitSuccess = false
    async initHandlers() {
        var dirName = await getEnv(this.uzTag, '转存文件夹名称')
        if (dirName == null || dirName === '') {
            dirName = 'uz影视'
            await setEnv(this.uzTag, '转存文件夹名称', dirName)
        }
        for (let i = 0; i < panSubClasses.length; i++) {
            try {
                let handler = await panSubClasses[i].getInstance({
                    uzTag: this.uzTag,
                    saveDirName: dirName,
                })
                handler.uzTag = this.uzTag
                this.panToolsHandlers.push(handler)
            } catch (error) {}
        }
        this._isInitSuccess = true
    }

    async checkState() {
        if (this._isInitSuccess) {
            return true
        }

        for (let i = 0; i < 20; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            if (this._isInitSuccess) {
                return true
            }
        }
        toast({
            msg: '初始化超时～',
            type: ToastType.error,
        })
        return false
    }

    /**
     * 清理转存文件夹
     */
    async cleanSaveDir() {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                await this.panToolsHandlers[i].clearPanSaveDir()
            } catch (error) {}
        }
    }

    /**
     * 是否可以解析
     * @param {string} url
     * @returns {{can:boolean,panType:string}} {can:是否可以解析,panType:网盘类型}
     */
    async canParse(url) {
        await this.checkState()
        let data = {
            can: false,
            panType: '',
        }
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let can = await this.panToolsHandlers[i].canParse({
                    url: url,
                })
                if (can) {
                    data.can = true
                    data.panType = this.panToolsHandlers[i].getPanType()
                }
            } catch (error) {}
        }
        return formatBackData(data)
    }

    /**
     * 获取网盘类型列表
     * @returns {{panTypes:string[]}}
     */
    async getPanTypes() {
        await this.checkState()
        let panTypes = []
        let data = { panTypes: panTypes }
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                panTypes.push(this.panToolsHandlers[i].getPanType())
            } catch (error) {}
        }
        data.panTypes = panTypes
        return formatBackData(data)
    }

    /**
     * 获取网盘资源列表
     * @param {string} shareUrl
     * @returns {@Promise<PanListDetail>}
     */
    async getShareVideos(shareUrl) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let can = await this.panToolsHandlers[i].canParse({
                    url: shareUrl,
                })
                if (can) {
                    let data = await this.panToolsHandlers[i].parseShareUrl({
                        url: shareUrl,
                    })
                    return formatBackData(data)
                }
            } catch (error) {}
        }

        let data = new PanListDetail()
        return formatBackData(data)
    }

    /**
     * 获取播放信息
     * @param {PanVideoItem} item
     * @returns {@Promise<PanPlayInfo>}
     */
    async getPlayInfo(item) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let panType = await this.panToolsHandlers[i].getPanType()
                if (panType == item.panType) {
                    let data = await this.panToolsHandlers[i].parseVideo(item)
                    return formatBackData(data)
                }
            } catch (error) {
                return formatBackData({ error: error.toString() })
            }
        }
        const data = new PanPlayInfo()
        data.error = '暂不支持 ' + item.panType + ' ~'
        return formatBackData(data)
    }

    //MARK: - 伪挂载相关  分页大小建议为200

    /**
     * 返回支持挂载的网盘
     * @returns {@Promise<[PanMount]>}
     */
    async getSupportMountPan() {
        await this.checkState()
        let list = []

        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                let item = await this.panToolsHandlers[i].supportPanMount()
                if (item) {
                    list.push(item)
                }
            } catch (error) {}
        }

        return formatBackData(list)
    }

    /**
     * 获取网盘根目录
     * @param {PanType} panType
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getRootDir(panType) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                if (panType === this.panToolsHandlers[i].getPanType()) {
                    let item = await this.panToolsHandlers[
                        i
                    ].getPanMountRootDir(panType)
                    if (item) {
                        return formatBackData(item)
                    }
                }
            } catch (error) {}
        }

        return formatBackData({ data: [], error: '' })
    }

    /**
     * 获取网盘挂载子目录
     * @param {object} args
     * @param {PanMountListData} args.data
     * @param {number} args.page
     * @returns {@Promise<{data:[PanMountListData],error:string}>}
     */
    async getMountDir(args) {
        await this.checkState()
        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                if (
                    args.data.panType === this.panToolsHandlers[i].getPanType()
                ) {
                    let item = await this.panToolsHandlers[i].getPanMountSubDir(
                        {
                            data: args.data.data,
                            page: args.page,
                        }
                    )
                    if (item) {
                        return formatBackData(item)
                    }
                }
            } catch (error) {}
        }
        return formatBackData({ data: [], error: '' })
    }

    /**
     * 获取网盘挂载文件真实地址
     * @param {PanMountListData} args
     * @returns {@Promise<PanPlayInfo>}
     */
    async getMountFile(args) {
        await this.checkState()
        let playData = new PanPlayInfo()

        for (let i = 0; i < this.panToolsHandlers.length; i++) {
            try {
                if (args.panType === this.panToolsHandlers[i].getPanType()) {
                    let item = await this.panToolsHandlers[i].getPanMountFile(
                        args.data
                    )
                    if (item) {
                        return formatBackData(item)
                    }
                }
            } catch (error) {}
        }

        return formatBackData(playData)
    }
}

// 固定实例名称
const uzPanToolsInstance = new PanTools()

// ignore
// 不支持导出，这里的代码运行时会被移除
export {
    PanType,
    PanPlayInfo,
    PanVideoItem,
    PanListDetail,
    PanMount,
    PanDataType,
    PanMountListData,
}
// ignore

//### 放在最后，保持这里不变，parse-metadata.cjs 合并替换代码需要 ###
//### 放在最后，保持这里不变，parse-metadata.cjs 合并替换代码需要 ###
//### 放在最后，保持这里不变，parse-metadata.cjs 合并替换代码需要 ###
//### 替换识别文本 ### uzVideo-Ext-Sub ###



// MARK: baidu.js
// 请勿直接修改，请修改 baidu.js 文件
// prettier-ignore
class PanBaidu{uzTag="";static async getInstance(args){let pan=new PanBaidu;pan.uzTag=args.uzTag;pan.saveDirName=args.saveDirName;return pan}async getPanEnv(key){return await getEnv(this.uzTag,key)}async updatePanEnv(key,value){await setEnv(this.uzTag,key,value)}async supportPanMount(){return null}async getPanMountRootDir(){return{}}async getPanMountSubDir(args){return{}}async getPanMountFile(args){return new PanPlayInfo}getPanType(args){return"\u767E\u5EA6"}async canParse(args){await this.initBaidu();if(args.url.includes("pan.baidu.com")){return true}else{return false}}async parseShareUrl(args){await this.initBaidu();return await this.getFilesByShareUrl(args.url)}async parseVideo(args){await this.initBaidu();return await this.getPlayUrl(args.data)}async clearPanSaveDir(){}constructor(){this.cookie="";this.regex=/https:\/\/pan\.baidu\.com\/s\/([^\\|#/]+)/;this.baseHeader={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36","Accept-Encoding":"gzip",Referer:"https://pan.baidu.com","Content-Type":"application/x-www-form-urlencoded"};this.apiUrl="https://pan.baidu.com/";this.shareTokenCache={};this.subtitleExts=[".srt",".ass",".scc",".stl",".ttml"];this.subvideoExts=[".mp4",".mkv",".avi",".rmvb",".mov",".flv",".wmv",".webm",".3gp",".mpeg",".mpg",".ts",".mts",".m2ts",".vob",".divx",".xvid",".m4v",".ogv",".f4v",".rm",".asf",".dat",".dv",".m2v"]}uzTag="";async initBaidu(){if(this.cookie.length<1){this.cookie=await this.getPanEnv("\u767E\u5EA6\u7F51\u76D8Cookie")}}getShareData(url){try{url=decodeURIComponent(url).replace(/\s+/g,"");let shareId="";let sharePwd="";const match=url.match(/pan\.baidu\.com\/(s\/|wap\/init\?surl=)([^?&#]+)/);if(!match){return null}shareId=match[2].replace(/^1+/,"").split("?")[0].split("#")[0];if(!shareId){return null}const pwdMatch=url.match(/(提取码|密码|pwd)=([^&\s]{4})/i);sharePwd=pwdMatch?pwdMatch[2]:"";return{shareId,sharePwd}}catch(error){return null}}async getDirectPlayUrl(uk,shareid,fsid,randsk){try{const uid=await this.getUid();if(!uid){return null}const headers={"User-Agent":"netdisk;P2SP;2.2.91.136;android-android;",Cookie:this.cookie};const devuid="73CED981D0F186D12BC18CAE1684FFD5|VSRCQTF6W";const time=String(Date.now());const bduss=this.cookie.match(/BDUSS=([^;]+)/)?.[1];if(!bduss){return null}const rand=this.sha1(this.sha1(bduss)+uid+"ebrcUYiuxaZv2XGu7KIYKxUrqfnOfpDF"+time+devuid+"11.30.2ae5821440fab5e1a61a025f014bd8972");const apiPath=`share/list?shareid=${shareid}&uk=${uk}&fid=${fsid}&sekey=${randsk}&origin=dlna&devuid=${devuid}&clienttype=1&channel=android_12_zhao_bd-netdisk_1024266h&version=11.30.2&time=${time}&rand=${rand}`;const response=await this.api(apiPath,{},headers,"get");if(response.errno===0&&response.list&&response.list.length>0){return response.list[0].dlink}return null}catch(error){return null}}sha1(message){return Crypto.SHA1(message).toString()}async getUid(){try{const response=await axios.get("https://mbd.baidu.com/userx/v1/info/get?appname=baiduboxapp&fields=%20%20%20%20%20%20%20%20%5B%22bg_image%22,%22member%22,%22uid%22,%22avatar%22,%20%22avatar_member%22%5D&client&clientfrom&lang=zh-cn&tpl&ttt",{headers:{"User-Agent":this.baseHeader["User-Agent"],Cookie:this.cookie}});return response.data?.data?.fields?.uid||null}catch(error){return null}}async api(url,data={},headers={},method="post",retry=3){const objectToQuery=obj=>{return Object.entries(obj).filter(([_,value])=>value!==void 0&&value!==null).map(([key,value])=>`${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")};const fullUrl=`${this.apiUrl}${url}`;headers={...this.baseHeader,...headers,Cookie:this.cookie||""};let resp;try{if(method==="get"){const query=objectToQuery(data);const finalUrl=query?`${fullUrl}?${query}`:fullUrl;resp=await axios.get(finalUrl,{headers})}else{resp=await axios.post(fullUrl,data,{headers})}}catch(err){resp=err.response||{status:500,data:{error:"\u8BF7\u6C42\u5931\u8D25"}}}if([429,503].includes(resp.status)&&retry>0){const waitTime=(3-retry+1)*1e3;await this.delay(waitTime);return this.api(url,data,headers,method,retry-1)}return resp.data!==void 0?resp.data:resp}async verifyShare(shareData){try{const shareVerify=await this.api(`share/verify?t=${Date.now()}&surl=${shareData.shareId}`,{pwd:shareData.sharePwd||""},{Cookie:this.cookie},"post");if(shareVerify.errno!==0){if(shareVerify.errno===-62||shareVerify.errno===-9){console.log("\u63D0\u53D6\u7801\u9519\u8BEF")}console.log("\u9A8C\u8BC1\u63D0\u53D6\u7801\u5931\u8D25")}if(shareVerify.randsk){let cookie=this.cookie.replace(/BDCLND=[^;]*;?\s*/g,"");if(cookie.length>0&&!cookie.endsWith(";"))cookie+="; ";cookie+=`BDCLND=${shareVerify.randsk}`;this.cookie=cookie;await this.updatePanEnv("\u767E\u5EA6\u7F51\u76D8Cookie",cookie);console.log("\u5DF2\u66F4\u65B0randsk\u5230cookie\u4E2D\u7684BDCLND")}return shareVerify}catch(error){console.log("\u9A8C\u8BC1\u5206\u4EAB\u94FE\u63A5\u5931\u8D25:",error.message);throw error}}async getShareToken(shareData){try{const shareVerify=await this.verifyShare(shareData);const headers={...this.baseHeader,Cookie:this.cookie||""};const listData=await this.api(`share/list`,{shorturl:shareData.shareId,root:1,page:1,num:100},{headers},"get");if(listData.errno!==0){if(listData.errno===-9){console.log("\u63D0\u53D6\u7801\u9519\u8BEF")}console.log("\u83B7\u53D6\u6587\u4EF6\u5217\u8868\u5931\u8D25")}this.shareTokenCache[shareData.shareId]={...shareVerify,list:listData.list,uk:listData.uk||listData.share_uk,shareid:listData.share_id||shareVerify.share_id,randsk:shareVerify.randsk,sign:listData.sign||this.generateSign(shareData.shareId,shareData.sharePwd),timestamp:listData.timestamp||Date.now()};return this.shareTokenCache[shareData.shareId]}catch(error){console.log("\u83B7\u53D6\u5206\u4EABtoken\u5931\u8D25:",error.message);throw error}}generateSign(shareId,sharePwd){const CryptoJS=Crypto;const timestamp=Date.now();const str=`${shareId}${sharePwd}${timestamp}${this.cookie||""}`;return CryptoJS.MD5(str).toString()}async getFilesByShareUrl(shareInfo){const shareData=typeof shareInfo==="string"?this.getShareData(shareInfo):shareInfo;if(!shareData)return{videos:[]};await this.getShareToken(shareData);if(!this.shareTokenCache[shareData.shareId])return{videos:[]};const cachedData=await this.shareTokenCache[shareData.shareId];const videos=[];const subtitles=[];const processDirectory=async(dirPath,dirFsId,parentDrpyPath="")=>{const shareDir=`/sharelink${cachedData.shareid}-${dirFsId}${dirPath}`;const headers={...this.baseHeader,Cookie:this.cookie||""};const dirListData=await this.api(`share/list`,{sekey:cachedData.randsk,uk:cachedData.uk,shareid:cachedData.shareid,page:1,num:100,dir:shareDir},headers,"get");if(dirListData.errno!==0||!dirListData.list){return}for(const item of dirListData.list){if(item.isdir===1||item.isdir==="1"){const subDirPath=`${dirPath}/${item.server_filename}`;const subDrpyPath=`${parentDrpyPath}/${item.server_filename}`;await processDirectory(subDirPath,item.fs_id,subDrpyPath)}else{const ext=item.server_filename.substring(item.server_filename.lastIndexOf(".")||0).toLowerCase();const fileInfo={fid:item.fs_id,file_name:item.server_filename,size:item.size,path:parentDrpyPath,file:true};if(this.subvideoExts.includes(ext)){videos.push(fileInfo)}else if(this.subtitleExts.includes(ext)){subtitles.push(fileInfo)}}}};if(cachedData.list){for(const item of cachedData.list){if(item.isdir===1||item.isdir==="1"){const dirPath=`/${item.server_filename}`;const drpyPath=`/${item.server_filename}`;await processDirectory(dirPath,item.fs_id,drpyPath)}else{const ext=item.server_filename.substring(item.server_filename.lastIndexOf(".")||0).toLowerCase();const fileInfo={fid:item.fs_id,file_name:item.server_filename,size:item.size,path:"",file:true};if(this.subvideoExts.includes(ext)){videos.push(fileInfo)}else if(this.subtitleExts.includes(ext)){subtitles.push(fileInfo)}}}}const getBaseName=fileName=>{const lastDotIndex=fileName.lastIndexOf(".");return lastDotIndex===-1?fileName:fileName.slice(0,lastDotIndex)};const subtitleMap=new Map;subtitles.forEach(sub=>{const baseName=getBaseName(sub.file_name);if(!subtitleMap.has(baseName)){subtitleMap.set(baseName,[])}subtitleMap.get(baseName).push(sub)});const videosWithSubtitles=videos.map(video=>({...video,subtitles:subtitleMap.get(getBaseName(video.file_name))||[]}));let panVideos=[];for(let index=0;index<videosWithSubtitles.length;index++){const element=videosWithSubtitles[index];let size=(element.size??0)/1024/1024;let unit="MB";if(size>=1e3){size=size/1024;unit="GB"}size=size.toFixed(1);const remark=`[${size}${unit}]`;element.shareId=shareData.shareId;panVideos.push({name:element.file_name,panType:this.getPanType(),remark,data:element})}return{videos:panVideos}}async getPlayUrl(data){if(!this.cookie){return{urls:[],error:"\u8BF7\u5728\u73AF\u5883\u53D8\u91CF\u4E2D\u6DFB\u52A0\u767E\u5EA6\u7F51\u76D8Cookie"}}try{const cachedData=this.shareTokenCache[data.shareId];if(!cachedData){return{urls:[],error:"\u672A\u627E\u5230\u5206\u4EAB\u4FE1\u606F\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u6587\u4EF6\u5217\u8868"}}const directUrl=await this.getDirectPlayUrl(cachedData.uk,cachedData.shareid,data.fid,cachedData.randsk);if(!directUrl){return{urls:[],error:"\u83B7\u53D6\u64AD\u653E\u5730\u5740\u5931\u8D25"}}return{urls:[{name:"\u539F\u753B",url:directUrl,headers:{"User-Agent":"netdisk;P2SP;2.2.91.136;android-android;",Referer:"https://pan.baidu.com"}}]}}catch(error){return{urls:[],error:error.toString()}}}}panSubClasses.push(PanBaidu);

// MARK: common.js
// 请勿直接修改，请修改 common.js 文件
// prettier-ignore
function base64Encode(text){return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))}function base64Decode(text){return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))}class axios{static async request(config){let{url,method="GET",headers={},data,params,responseType,addressType,maxRedirects}=config;let options={method,headers,data,queryParameters:params,responseType,addressType,maxRedirects};const response=await req(url,options);response.status=response.code;return response}static async get(url,config={}){return await axios.request({...config,url,method:"GET"})}static async post(url,data,config={}){return await axios.request({...config,url,method:"POST",data})}}class qs{static stringify(obj,prefix=""){const pairs=[];for(const key in obj){if(!Object.prototype.hasOwnProperty.call(obj,key))continue;const value=obj[key];const fullKey=prefix?`${prefix}[${key}]`:key;if(value===null||value===void 0){pairs.push(encodeURIComponent(fullKey)+"=")}else if(typeof value==="object"){pairs.push(stringify(value,fullKey))}else{pairs.push(encodeURIComponent(fullKey)+"="+encodeURIComponent(value))}}return pairs.join("&")}static toObject(str){if(typeof str!=="string"||str.length===0){return{}}str=str.replace(/&/g,",").replace(/=/g,":");const obj={};const pairs=str.split(",");for(let i=0;i<pairs.length;i++){const pair=pairs[i].split(":");obj[pair[0]]=pair[1]}return obj}}

// MARK: jiexi.js
// 请勿直接修改，请修改 jiexi.js 文件
// prettier-ignore
class JieXi{uzTag="";static async getInstance(args){let pan=new JieXi;pan.uzTag=args.uzTag;return pan}async getPanEnv(key){return await getEnv(this.uzTag,key)}async updatePanEnv(key,value){await setEnv(this.uzTag,key,value)}getPanType(args){return"\u91C7\u96C6\u89E3\u6790"}async canParse(args){let url=args.url;return url.includes("v.qq.com")||url.includes("iqiyi.com")||url.includes("youku.com")||url.includes("mgtv.com")||url.includes("bilibili.com")}async parseShareUrl(args){return this.getVideoList(args.url)}async parseVideo(args){return this.getPlayUrl(args.data)}async clearPanSaveDir(){}async supportPanMount(){return null}async getPanMountRootDir(){return{}}async getPanMountSubDir(args){return{}}async getPanMountFile(args){return new PanPlayInfo}getTypeName(url){if(url.includes("v.qq.com")){return"TX"}else if(url.includes("iqiyi.com")){return"IQY"}else if(url.includes("youku.com")){return"YK"}else if(url.includes("mgtv.com")){return"MGTV"}else if(url.includes("bilibili.com")){return"Bili"}else{return"\u672A\u77E5"}}async getVideoList(url){let list=url.split("$$$");let videos=[];for(let i=0;i<list.length;i++){const oneFrom=list[i];const fromName=this.getTypeName(oneFrom);let videoList=oneFrom.split("#");for(let j=0;j<videoList.length;j++){const element=videoList[j];let video=element.split("$");if(video.length===2){let title=video[0];let url2=video[1];videos.push({name:title,fromName,panType:this.getPanType(),data:{url:url2}})}else if(video[0]===url){videos.push({name:"\u89E3\u6790",fromName,panType:this.getPanType(),data:{url}})}}}return{videos,fileName:this.fileName,error:""}}async getPlayUrl(data){let url=data.url;let allUrls=await getEnv(this.uzTag,"\u91C7\u96C6\u89E3\u6790\u5730\u5740");if(allUrls.length<1){allUrls="\u9493\u9C7C@http://8.129.30.117:8117/diaoyu.php?url=;\u4E4C\u8D3C@http://jx.dedyn.io/?url=";await setEnv(this.uzTag,"\u91C7\u96C6\u89E3\u6790\u5730\u5740",allUrls)}const jxLinks=allUrls.split(";");const urls=[];for(let index=0;index<jxLinks.length;index++){const element=jxLinks[index];const name=element.split("@")[0];const api=element.split("@")[1];const response=await req(api+url);if(response.code===200){let item;try{item=JSON.parse(response.data)}catch(error){item=response.data}if(item){for(let key in item){if(item.hasOwnProperty(key)){let value=item[key];if(value&&typeof value==="string"){if(value.includes("http")&&(value.includes("m3u8")||value.includes("mp4"))){urls.push({url:value,name});continue}}}}}}}return{urls,headers:{}}}}panSubClasses.push(JieXi);

// MARK: pan123.js
// 请勿直接修改，请修改 pan123.js 文件
// prettier-ignore
class Pan123{uzTag="";static async getInstance(args){let pan=new Pan123;pan.uzTag=args.uzTag;pan.saveDirName=args.saveDirName;return pan}async getPanEnv(key){return await getEnv(this.uzTag,key)}async updatePanEnv(key,value){await setEnv(this.uzTag,key,value)}getPanType(args){return"123"}async canParse(args){let regex=/https:\/\/(www.123684.com|www.123865.com|www.123912.com|www.123pan.com|www.123pan.cn)\/s\/([^\\/]+)/;return regex.test(args.url)}async parseShareUrl(args){return await this.getFilesByShareUrl(args.url)}async parseVideo(args){return await this.getPlayUrl(args.data)}async clearPanSaveDir(){}async supportPanMount(){return null}async getPanMountRootDir(){return{}}async getPanMountSubDir(args){return{}}async getPanMountFile(args){return new PanPlayInfo}constructor(){this.regex=/https:\/\/(www.123684.com|www.123865.com|www.123912.com|www.123pan.com|www.123pan.cn)\/s\/([^\\/]+)/;this.api="https://www.123684.com/b/api/share/";this.loginUrl="https://login.123pan.com/api/user/sign_in";this.cate=""}uzTag="";password="";passport="";authKey="123panAuth";auth="";async init(){try{if(this.auth.length<1){const auth=await UZUtils.getStorage({key:this.authKey,uzTag:this.uzTag});this.auth=auth}if(this.auth?.length>0){const CryptoJS=Crypto;let info=JSON.parse(CryptoJS.enc.Base64.parse(this.auth.split(".")[1]).toString(CryptoJS.enc.Utf8));if(info.exp<=Math.floor(Date.now()/1e3)){await this.loin()}}else{await this.loin()}}catch(error){}}async loin(){this.password=await this.getPanEnv("123\u7F51\u76D8\u5BC6\u7801");this.passport=await this.getPanEnv("123\u7F51\u76D8\u8D26\u53F7");if(this.passport.length<0||this.password.length<0){return}let data=JSON.stringify({passport:this.passport,password:this.password,remember:true});let config={method:"POST",url:this.loginUrl,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","Content-Type":"application/json","App-Version":"43",Referer:"https://login.123pan.com/centerlogin?redirect_url=https%3A%2F%2Fwww.123684.com&source_page=website"},data};let auth=(await axios.request(config)).data;if(auth?.data?.token){this.auth=auth.data.token;await UZUtils.setStorage({key:this.authKey,value:this.auth,uzTag:this.uzTag})}}getShareData(url){let panUrl=decodeURIComponent(url.trim());panUrl=panUrl.replace(/[#.,，/\s]+$/,"");this.SharePwd="";let pwdMatch=panUrl.match(/[;，,\s]+[\u63d0\u53d6\u7801:：\s]*([a-zA-Z0-9]{4})/);if(pwdMatch){this.SharePwd=pwdMatch[1];panUrl=panUrl.substring(0,pwdMatch.index)}else if(panUrl.indexOf("?")>0){this.SharePwd=panUrl.slice(-4);panUrl=panUrl.split("?")[0]}else if(panUrl.indexOf("\u7801")>0){this.SharePwd=panUrl.slice(-4);const firstChinese=panUrl.match(/[\u4e00-\u9fa5]/);if(firstChinese){panUrl=panUrl.slice(0,firstChinese.index)}}panUrl=panUrl.trim();const matches=this.regex.exec(panUrl);if(!matches){return null}const shareKey=panUrl.split("/").pop();if(!shareKey){return null}return shareKey}fileName="";async getFilesByShareUrl(shareUrl){try{const shareKey=this.getShareData(shareUrl);if(shareKey===null){return{videos:[],fileName:"",error:"\u65E0\u6CD5\u89E3\u6790\u5206\u4EAB\u94FE\u63A5"}}this.fileName="";let file={};let cate=await this.getShareInfo(shareKey,this.SharePwd,0,0);if(cate&&Array.isArray(cate)){if(cate.length>0&&cate[0].isDirect){file["root"]=cate}else{await Promise.all(cate.map(async item=>{if(!(item.filename in file)){file[item.filename]=[]}const fileData=await this.getShareList(item.shareKey,item.SharePwd,item.next,item.fileId);if(fileData&&fileData.length>0){file[item.filename].push(...fileData)}}))}}let videos=[];for(let key in file){if(file[key].length>0){for(let i=0;i<file[key].length;i++){const element=file[key][i];let size=element.Size/1024/1024;let unit="MB";if(size>=1e3){size=size/1024;unit="GB"}size=size.toFixed(1);videos.push({name:element.FileName,remark:`[${size}${unit}]`,panType:this.getPanType(),data:element})}}}return{videos,fileName:this.fileName,error:""}}catch(error){return{videos:[],fileName:"",error:error.toString()}}}async getShareInfo(shareKey,SharePwd,next,ParentFileId){let cate=[];let videos=[];let list=await axios.get(this.api+"get",{headers:{},params:{limit:"100",next,orderBy:"file_name",orderDirection:"asc",shareKey,SharePwd:SharePwd??"",ParentFileId,Page:"1"}});if(list.status===200){if(list.data.code===5103){}else{let info=list.data.data;if(info==null){return[]}let next2=info.Next;let infoList=info.InfoList;infoList.forEach(item=>{if(this.fileName.length<1){this.fileName=item.FileName}if(item.Category===0){cate.push({filename:item.FileName,shareKey,SharePwd,next:next2,fileId:item.FileId})}else if(item.Category===2){videos.push({ShareKey:shareKey,FileId:item.FileId,S3KeyFlag:item.S3KeyFlag,Size:item.Size,Etag:item.Etag,FileName:item.FileName,isDirect:true})}});if(videos.length>0){return videos}let result=await Promise.all(cate.map(async it=>this.getShareInfo(shareKey,SharePwd,next2,it.fileId)));result=result.filter(item=>item!==void 0&&item!==null);return[...cate,...result.flat()]}}}async getShareList(shareKey,SharePwd,next,ParentFileId){try{let video=[];let infoList=(await axios.get(this.api+"get",{headers:{},params:{limit:"100",next,orderBy:"file_name",orderDirection:"asc",shareKey,SharePwd:SharePwd??"",ParentFileId,Page:"1"}})).data?.data?.InfoList;infoList?.forEach(it=>{if(it.Category===2){video.push({ShareKey:shareKey,FileId:it.FileId,S3KeyFlag:it.S3KeyFlag,Size:it.Size,Etag:it.Etag,FileName:it.FileName})}});return video}catch(error){return[]}}async getDownload(shareKey,FileId,S3KeyFlag,Size,Etag){try{let data=JSON.stringify({ShareKey:shareKey,FileID:FileId,S3KeyFlag,Size,Etag});let config={method:"POST",url:`${this.api}download/info`,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",Authorization:`Bearer ${this.auth}`,"Content-Type":"application/json;charset=UTF-8",platform:"android"},data};const resp=await axios.request(config);let down=resp?.data?.data;let url=down?.DownloadURL;if(url.length<1){return[]}const query=qs.toObject(url.split("?")[1]);url=base64Decode(query.params);return[{url,name:"\u539F\u753B",priority:9999,headers:{}}]}catch(error){return[]}}async getLiveTranscoding(shareKey,FileId,S3KeyFlag,Size,Etag){try{let config={method:"GET",url:`https://www.123684.com/b/api/video/play/info`,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",Authorization:`Bearer ${this.auth}`,"Content-Type":"application/json;charset=UTF-8",platform:"android"},params:{etag:Etag,size:Size,from:"1",shareKey}};let down=(await axios.request(config))?.data?.data?.video_play_info;let videoinfo=[];down?.forEach(item=>{if(item.url!==""){videoinfo.push({name:item.resolution,url:item.url,priority:item.height})}});return videoinfo}catch(error){return[]}}async getPlayUrl(data){await this.init();const raw=await this.getDownload(data.ShareKey,data.FileId,data.S3KeyFlag,data.Size,data.Etag);const transcoding=await this.getLiveTranscoding(data.ShareKey,data.FileId,data.S3KeyFlag,data.Size,data.Etag);const urls=[...raw,...transcoding];return{urls,headers:{}}}}panSubClasses.push(Pan123);

// MARK: pan189.js
// 请勿直接修改，请修改 pan189.js 文件
// prettier-ignore
class Pan189{uzTag="";static async getInstance(args){let pan=new Pan189;pan.uzTag=args.uzTag;pan.saveDirName=args.saveDirName;return pan}async getPanEnv(key){return await getEnv(this.uzTag,key)}async updatePanEnv(key,value){await setEnv(this.uzTag,key,value)}getPanType(args){return"\u5929\u7FFC"}async canParse(args){if(args.url.includes("cloud.189.cn")){return true}else{return false}}async parseShareUrl(args){return await this.getShareData(args.url)}async parseVideo(args){return await this.getPlayUrl(args.data)}async clearPanSaveDir(){}async supportPanMount(){return null}async getPanMountRootDir(){return{}}async getPanMountSubDir(args){return{}}async getPanMountFile(args){return new PanPlayInfo}constructor(){this.regex=/https:\/\/cloud\.189\.cn\/web\/share\?code=([^&]+)/;this.config={clientId:"538135150693412",model:"KB2000",version:"9.0.6",pubKey:"MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZLyV4gHNDUGJMZoOcYauxmNEsKrc0TlLeBEVVIIQNzG4WqjimceOj5R9ETwDeeSN3yejAKLGHgx83lyy2wBjvnbfm/nLObyWwQD/09CmpZdxoFYCH6rdDjRpwZOZ2nXSZpgkZXoOBkfNXNxnN74aXtho2dqBynTw3NFTWyQl8BQIDAQAB"};this.loginHeaders={"User-Agent":`Mozilla/5.0 (Linux; U; Android 11; ${this.config.model} Build/RP1A.201005.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36 Ecloud/${this.config.version} Android/30 clientId/${this.config.clientId} clientModel/${this.config.model} clientChannelId/qq proVersion/1.0.6`,Referer:"https://m.cloud.189.cn/zhuanti/2016/sign/index.jsp?albumBackupOpened=1"};this.api="https://cloud.189.cn/api";this.shareCode="";this.accessCode="";this.shareId="";this.shareMode="";this.isFolder="";this.index=0}account="";password="";cookie="";authKey="189panAuth";normalHeaders={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",Accept:"application/json;charset=UTF-8"};async logout(){this.cookie="";await UZUtils.setStorage({key:this.authKey,value:"",uzTag:this.uzTag})}async login(){if(this.cookie.length>0){return}this.cookie=await UZUtils.getStorage({key:this.authKey,uzTag:this.uzTag});if(this.cookie.length<1){this.account=await this.getPanEnv("\u5929\u7FFC\u7F51\u76D8\u8D26\u53F7");this.password=await this.getPanEnv("\u5929\u7FFC\u7F51\u76D8\u5BC6\u7801")}if(this.account.length<1||this.password.length<1){return}try{let resp=await axios.post("https://open.e.189.cn/api/logbox/config/encryptConf.do?appId=cloud");const jsonData=JSONbig.parse(resp.data);let pubKey=jsonData.data.pubKey;resp=await axios.get("https://cloud.189.cn/api/portal/loginUrl.action?redirectURL=https://cloud.189.cn/web/redirect.html?returnURL=/main.action");const lastReq=resp.redirects.pop();const lastReqUrl=lastReq.location??lastReq.url;let Reqid=lastReqUrl.match(/reqId=(\w+)/)[1];let Lt=lastReqUrl.match(/lt=(\w+)/)[1];let tHeaders={"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json;charset=UTF-8","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/76.0",Referer:"https://open.e.189.cn/",Lt,Reqid};let data={version:"2.0",appKey:"cloud"};resp=await axios.post("https://open.e.189.cn/api/logbox/oauth2/appConf.do",qs.stringify(data),{headers:tHeaders});let returnUrl=resp.data.data.returnUrl;let paramId=resp.data.data.paramId;const keyData=`-----BEGIN PUBLIC KEY-----
${pubKey}
-----END PUBLIC KEY-----`;const jsencrypt=new Encrypt;jsencrypt.setPublicKey(keyData);const enUname=Buffer.from(jsencrypt.encrypt(this.account),"base64").toString("hex");const enPasswd=Buffer.from(jsencrypt.encrypt(this.password),"base64").toString("hex");data={appKey:"cloud",version:"2.0",accountType:"01",mailSuffix:"@189.cn",validateCode:"",returnUrl,paramId,captchaToken:"",dynamicCheck:"FALSE",clientType:"1",cb_SaveName:"0",isOauth2:false,userName:`{NRP}${enUname}`,password:`{NRP}${enPasswd}`};resp=await axios.post("https://open.e.189.cn/api/logbox/oauth2/loginSubmit.do",qs.stringify(data),{headers:tHeaders,validateStatus:null});const loginJsonData=JSONbig.parse(resp.data);if(loginJsonData.toUrl){let cookies=resp.headers["set-cookie"].map(it=>it.split(";")[0]).join(";");this.cookie=cookies;const headers={...this.loginHeaders,Cookie:cookies};resp=await axios.get(loginJsonData.toUrl,{headers,maxRedirects:0});cookies+="; "+resp.headers?.["set-cookie"]?.map(it=>it.split(";")[0]).join(";");this.cookie=cookies;await UZUtils.setStorage({key:this.authKey,value:cookies,uzTag:this.uzTag})}else{console.error("Error during login:",resp.data);await UZUtils.setStorage({key:this.authKey,value:"",uzTag:this.uzTag})}}catch(error){await UZUtils.setStorage({key:this.authKey,value:"",uzTag:this.uzTag});console.error("Error during login:",error)}}async getShareID(url,accessCode){try{const matches=this.regex.exec(url);if(matches&&matches[1]){this.shareCode=matches[1];const accessCodeMatch=this.shareCode.match(/访问码：([a-zA-Z0-9]+)/);this.accessCode=accessCodeMatch?accessCodeMatch[1]:""}else{const matches_=url.match(/https:\/\/cloud\.189\.cn\/t\/([^&]+)/);this.shareCode=matches_?matches_[1]:null;const accessCodeMatch=this.shareCode.match(/访问码：([a-zA-Z0-9]+)/);this.accessCode=accessCodeMatch?accessCodeMatch[1]:""}if(accessCode){this.accessCode=accessCode}}catch(error){}}fileName="";async getShareData(shareUrl,accessCode){try{let file={};let fileData=[];this.fileName="";let fileId=await this.getShareInfo(shareUrl,accessCode);if(fileId){let fileList=await this.getShareList(fileId);if(fileList&&Array.isArray(fileList)){await Promise.all(fileList.map(async item=>{if(!(item.name in file)){file[item.name]=[]}const fileData2=await this.getShareFile(item.id);if(fileData2&&fileData2.length>0){file[item.name].push(...fileData2)}}))}file["root"]=await this.getShareFile(fileId)}for(let key in file){if(file[key].length===0){delete file[key]}}if(Object.keys(file).length===0){file["root"]=await this.getShareFile(fileId);if(file["root"]&&Array.isArray(file["root"])){file["root"]=file["root"].filter(item=>item&&Object.keys(item).length>0)}}let videos=[];for(let key in file){for(let i=0;i<file[key]?.length;i++){const element=file[key][i];let size=element.size/1024/1024;let unit="MB";if(size>=1e3){size=size/1024;unit="GB"}size=size.toFixed(1);videos.push({name:element.name,remark:`[${size}${unit}]`,panType:this.getPanType(),data:element})}}return{videos,fileName:this.fileName,error:""}}catch(error){return{videos:[],error:""}}}async getShareInfo(shareUrl,accessCode){try{if(shareUrl.startsWith("http")){await this.getShareID(shareUrl,accessCode)}else{this.shareCode=shareUrl}if(accessCode){let check=await axios.get(`${this.api}/open/share/checkAccessCode.action?shareCode=${this.shareCode}&accessCode=${this.accessCode}`,{headers:this.normalHeaders});if(check.status===200){this.shareId=check.data.shareId}let resp=await axios.get(`${this.api}/open/share/getShareInfoByCodeV2.action?key=noCache&shareCode=${this.shareCode}`,{headers:this.normalHeaders});let fileId=resp.data.fileId;this.shareMode=resp.data.shareMode;this.isFolder=resp.data.isFolder;if(this.fileName.length<1){this.fileName=resp.data.fileName}return fileId}else{const url=`${this.api}/open/share/getShareInfoByCodeV2.action?noCache=${Math.random()}&shareCode=${this.shareCode}`;let resp=await axios.get(url,{headers:this.normalHeaders});let fileId=resp.data.fileId;this.shareId=resp.data.shareId;this.shareMode=resp.data.shareMode;this.isFolder=resp.data.isFolder;if(this.fileName.length<1){this.fileName=resp.data.fileName}return fileId}}catch(error){console.error("Error during getShareInfo:",error)}}async getShareList(fileId){try{let videos=[];const options={method:"GET",headers:this.normalHeaders,responseType:ReqResponseType.plain};const url=`${this.api}/open/share/listShareDir.action?pageNum=1&pageSize=60&fileId=${fileId}&shareDirFileId=${fileId}&isFolder=${this.isFolder}&shareId=${this.shareId}&shareMode=${this.shareMode}&iconOption=5&orderBy=lastOpTime&descending=true&accessCode=${this.accessCode}`;let resp=await req(url,options);const text=resp?.data??"";const json=JSONbig.parse(text);const data=json?.fileListAO;let folderList=data?.folderList;if(!folderList){return null}let names=folderList.map(item=>item.name);let ids=folderList.map(item=>item.id);if(folderList&&folderList.length>0){names.forEach((name,index)=>{videos.push({name,id:ids[index],type:"folder"})});let result=await Promise.all(ids.map(async id=>this.getShareList(id)));result=result.filter(item=>item!==void 0&&item!==null);return[...videos,...result.flat()]}}catch(e){}}async getShareFile(fileId,pageNum=1,retry=0){try{if(!fileId||retry>3){return null}const options={method:"GET",headers:this.normalHeaders,responseType:ReqResponseType.plain};const pageSize=60;const url=`${this.api}/open/share/listShareDir.action?key=noCache&pageNum=${pageNum}&pageSize=${pageSize}&fileId=${fileId}&shareDirFileId=${fileId}&isFolder=${this.isFolder}&shareId=${this.shareId}&shareMode=${this.shareMode}&iconOption=5&orderBy=filename&descending=false&accessCode=${this.accessCode}&noCache=${Math.random()}`;let resp=await req(url,options);if(resp.code!==200){return await this.getShareFile(fileId,pageNum,retry+1)}let json=JSONbig.parse(resp.data??"");let videos=[];const data=json?.fileListAO;let fileList=data?.fileList;if(!fileList){return null}for(let index=0;index<fileList.length;index++){const element=fileList[index];if(element.mediaType===3){videos.push({name:element.name,fileId:element.id,shareId:this.shareId,size:element.size})}}const totalCount=data?.count??0;if(totalCount>pageSize*pageNum){let result=await this.getShareFile(fileId,pageNum+1);if(result){videos=[...videos,...result]}}return videos}catch(e){}}async getPlayUrl(data){let list=await this.getShareUrl(data.fileId,data.shareId);const urls=list.map(it=>{return{url:it}});return{urls,headers:{}}}async getShareUrl(fileId,shareId){let headers={...this.normalHeaders};if(this.index<2){await this.login()}headers["Cookie"]=this.cookie;try{let resp=await axios.get(`${this.api}/portal/getNewVlcVideoPlayUrl.action?shareId=${shareId}&dt=1&fileId=${fileId}&type=4&key=noCache`,{headers});if(resp.status!==200&&this.index<2){await this.logout();this.index+=1;return await this.getShareUrl(fileId,shareId)}let location=await axios.get(resp.data.normal.url,{maxRedirects:0});let link="";if(location.status>=300&&location.status<400&&location.headers.location){link=location.headers.location}else{link=resp.data.normal.url}this.index=0;return link}catch(error){if(error.response&&error.response.status===400&&this.index<2){this.cookie="";this.index+=1;return await this.getShareUrl(fileId,shareId)}else{console.error("Error during getShareUrl:",error.message,error.response?error.response.status:"N/A")}}finally{if(this.index>=2){this.index=0}}}}panSubClasses.push(Pan189);

// MARK: pikpak.js
// 请勿直接修改，请修改 pikpak.js 文件
// prettier-ignore
class PanPikPak{uzTag="";static async getInstance(args){let pan=new PanPikPak;pan.uzTag=args.uzTag;pan.saveDirName=args.saveDirName;return pan}async getPanEnv(key){return await getEnv(this.uzTag,key)}async updatePanEnv(key,value){await setEnv(this.uzTag,key,value)}async supportPanMount(){return null}async getPanMountRootDir(){return{}}async getPanMountSubDir(args){return{}}async getPanMountFile(args){return new PanPlayInfo}getPanType(args){return"pikpak"}async canParse(args){return args.url.includes("mypikpak.com")||args.url.includes("magnet")}async parseShareUrl(args){return await this.getShareData(args.url)}async parseVideo(args){UZUtils.debugLog("parseVideo==========>"+args.data);return await this.getShareUrl(args.data)}async clearPanSaveDir(){}constructor(){this.regex=/https:\/\/mypikpak.com\/s\/(.*)\?act=play/;this.api="https://api-drive.mypikpak.com/drive/v1/share";this.share_api="https://keepshare.org/ai1uqv5a/";this.x_client_id="YUMx5nI8ZU8Ap8pm";this.x_device_id="9e8c121ebc0b409e85cc72cb2d424b54";this.headers={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",referer:"https://mypikpak.com/"}}uzTag="";async req_proxy(url,mth,header,data){try{let config={url,method:mth||"get",headers:header||this.headers};if(data!==void 0){config.data=data}return await axios.request(config)}catch(error){UZUtils.debugLog(error)}}async getPass_code_token(url){let req_=await this.req_proxy(url);let ck=req_.headers["set-cookie"];let pass_code_token="";if(ck.length>0){this.cookie=ck.map(it=>{let it_path=it.split(";")[0];if(/passcode_token/.test(it_path)){pass_code_token=it_path.split("=")[1]}return it_path}).join("; ")}return pass_code_token}async getShareRedirect(url){let req_=await this.req_proxy(url);let ck=req_.headers["set-cookie"];let pass_code_token="";if(ck.length>0){this.cookie=ck.map(it=>{let it_path=it.split(";")[0];if(/passcode_token/.test(it_path)){pass_code_token=it_path.split("=")[1]}return it_path}).join("; ")}return{redirect:req_.redirects[0].location,pass_code_token}}async getSurl(url){this.link=url.trim();let matches=this.regex.exec(url)===null?/https:\/\/mypikpak.com\/s\/(.*)/.exec(url):this.regex.exec(url);let share_id="";let parent_id="";if(matches&&matches[1]){if(matches[1].includes("/")){share_id=matches[1].split("/")[0];parent_id=matches[1].split("/")[1]}else{share_id=matches[1]}}return{share_id,parent_id}}async getShareData(url){let list=[];if(url.startsWith("http")){let pass_code_token=await this.getPass_code_token(url);let{share_id,parent_id}=await this.getSurl(url);list=await this.getShareList(share_id,parent_id,pass_code_token);UZUtils.debugLog(list);return{videos:list}}if(url.startsWith("magnet")){url=this.share_api+url;let{redirect:link,pass_code_token}=await this.getShareRedirect(url);let{share_id,parent_id}=await this.getSurl(link);list=await this.getShareList(share_id,parent_id,pass_code_token);return{videos:list}}}async getShareList(share_id,parent_id,pass_code_token){let x_captcha_token=await this.getCaptcha();let header=Object.assign({"x-captcha-token":x_captcha_token,"x-client-id":this.x_client_id,"x-device-id":this.x_device_id},this.headers);let url=this.api+`/detail?limit=100&thumbnail_size=SIZE_LARGE&order=3&folders_first=true&share_id=${share_id}&parent_id=${parent_id}&pass_code_token=${pass_code_token}`;let data=await this.req_proxy(url,"get",header);if(data.status===200&&data.data.files.length>0){let dirs=[];let videos=[];data.data.files.map(item=>{if(/folder/.test(item.kind)&&item.mime_type===""){dirs.push({share_id,parent_id:item.id,pass_code_token})}if(/file/.test(item.kind)&&/video/.test(item.mime_type)){videos.push({name:item.name,panType:this.getPanType(),data:{name:item.name,share_id,file_id:item.id,panType:this.getPanType(),pass_code_token}})}});let result=await Promise.all(dirs.map(async it=>this.getShareList(it.share_id,it.parent_id,it.pass_code_token)));result=result.filter(item=>item!==void 0&&item!==null).flat();return[...videos,...result.flat()]}}async getCaptcha(){let data=JSON.stringify({client_id:"YUMx5nI8ZU8Ap8pm",action:"GET:/drive/v1/share/file_info",device_id:"9e8c121ebc0b409e85cc72cb2d424b54",captcha_token:"",meta:{captcha_sign:"1.00d38b84b3231b2ac78b41091c11e5ca",client_version:"undefined",package_name:"drive.mypikpak.com",user_id:"",timestamp:"1758527222654"}});let captcha_data=await axios.request({url:"https://user.mypikpak.com/v1/shield/captcha/init",method:"POST",headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36","Content-Type":"application/json","x-client-id":this.x_client_id,"x-device-id":this.x_device_id},data});if(captcha_data.status===200){return captcha_data.data.captcha_token}}async getShareUrl(data){let{share_id,file_id,pass_code_token}=data;UZUtils.debugLog(share_id,file_id,pass_code_token);let x_captcha_token=await this.getCaptcha();let header=Object.assign({"x-captcha-token":x_captcha_token,"x-client-id":this.x_client_id,"x-device-id":this.x_device_id},this.headers);let url=this.api+`/file_info?share_id=${share_id}&file_id=${file_id}&pass_code_token=${pass_code_token}`;let html=await this.req_proxy(url,"get",header);if(html.status===200){let urls=[];let medias=html.data.file_info.medias;medias.forEach(media=>{urls.push({name:media.media_name,url:media.link.url})});return{urls}}}}panSubClasses.push(PanPikPak);

// MARK: quark_uc.js
// 请勿直接修改，请修改 quark_uc.js 文件
// prettier-ignore
class QuarkClient{static apiUrl="https://drive-pc.quark.cn/1/clouddrive/";static pr="pr=ucpro&fr=pc";static httpHeaders={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch",Referer:"https://pan.quark.cn/","Content-Type":"application/json"}}const kUC_UTKeyWord="kUC_UTKeyWord";class UCClient{static apiUrl="https://pc-api.uc.cn/1/clouddrive/";static pr="pr=UCBrowser&fr=pc&sys=darwin&ve=1.8.6&ut="+kUC_UTKeyWord;static httpHeaders={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch",Referer:"https://drive.uc.cn","Content-Type":"application/json"}}class QuarkUC{constructor(isQuark){this.isQuark=isQuark||false;this.cookie="";this.shareTokenCache={};this.saveFileIdCaches={};this.saveDirId=null;this.saveDirName="uz\u5F71\u89C6"}uzTag="";ut="";get apiUrl(){if(this.isQuark){return QuarkClient.apiUrl}else{return UCClient.apiUrl}}get pr(){if(this.isQuark){return QuarkClient.pr}else{return UCClient.pr}}get headers(){const headers=this.isQuark?QuarkClient.httpHeaders:UCClient.httpHeaders;headers["Cookie"]=this.cookie;return headers}get playHeaders(){var cookie=this.cookie;if(this.isQuark==false){const list=this.cookie.split(";");const newList=[];for(const item of list){if(item.includes("_UP_A4A_11_")||item.includes("tfstk")||item.includes("__uid")||item.includes("__pus")||item.includes("__kp")||item.includes("__puus")){newList.push(item)}}cookie=newList.join(";")}return{cookie,Referer:this.isQuark?"https://pan.quark.cn/":"https://drive.uc.cn/","User-Agent":this.isQuark?"":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) uc-cloud-drive/1.8.6 Chrome/100.0.4896.160 Electron/18.3.5.16-b62cf9c50d Safari/537.36 Channel/ucpan_other_ch"}}fileName="";async getFilesByShareUrl(shareUrl){const data=new PanListDetail;this.fileName="";const shareData=this.getShareData(shareUrl);if(shareData==null){data.error="";return data}await this.getShareToken(shareData);const videos=[];const subtitles=[];if(!this.shareTokenCache.hasOwnProperty(shareData.shareId)){data.error="";return data}await this.listFile(shareData,videos,subtitles,shareData.shareId,shareData.folderId);for(let index=0;index<videos.length;index++){const item=videos[index];const element=JSON.parse(JSON.stringify(item));let size=(element.size??0)/1024/1024;let unit="MB";if(size>=1e3){size=size/1024;unit="GB"}size=size.toFixed(1);const remark=`[${size}${unit}]`;const videoItem=new PanVideoItem;videoItem.data=element;videoItem.panType=this.getPanType();videoItem.name=element.name;if(kAppVersion>1650){videoItem.remark=remark}else{videoItem.name=`${element.name} ${remark}`}data.videos.push(videoItem)}data.fileName=this.fileName;return data}async getPlayUrl(arg){if(this.cookie.length===0){const info=new PanPlayInfo;info.error="\u8BF7\u5728 \u8BBE\u7F6E -> \u6570\u636E\u7BA1\u7406 -> \u73AF\u5883\u53D8\u91CF \u4E2D\u4E3A"+this.getCookieName()+"\u6DFB\u52A0\u503C";return info}let playData=new PanPlayInfo;try{const{flag,shareId,shareToken,fileId,shareFileToken}=arg;const saveFileId=await this.save({shareId,stoken:shareToken,fileId,fileToken:shareFileToken,clean:true});if(saveFileId==null){const info=new PanPlayInfo;info.error="\u8F6C\u5B58\u5931\u8D25\uFF0C\u53EF\u80FD\u7A7A\u95F4\u4E0D\u8DB3 \u6216 cookie \u9519\u8BEF\uFF5E";return info}this.saveFileIdCaches={};this.saveFileIdCaches[fileId]=saveFileId;let urls=await this.getVideoPlayUrl({fileId});playData.urls=urls;playData.urls.sort((a,b)=>{return b.priority-a.priority});playData.url=playData.urls[0].url}catch(error){playData.error=error.toString()}playData.playHeaders=this.playHeaders;return playData}async getVideoPlayUrl({fileId,isMount=false}){let rawUrls=await this.getDownload({fileId,isMount});let transcodingUrls=await this.getLiveTranscoding({fileId,isMount});if(transcodingUrls.length<2&&rawUrls.length>0){rawUrls[0].priority=9999}return[...rawUrls,...transcodingUrls]}async api(url,data,retry,method){retry||(retry=3);let leftRetry=retry;method||(method="post");if(url.includes(kUC_UTKeyWord)){if(this.ut.length<1){const data2=await req(UCClient.apiUrl+"file",{responseType:ReqResponseType.plain});if(data2.data?.length>0){this.ut=data2.data}}else{url=url.replace(kUC_UTKeyWord,this.ut)}}while(leftRetry>0){try{const response=await req(this.apiUrl+url,{method,headers:this.headers,data:JSON.stringify(data)});if(response.code===401){this.cookie="";toast({msg:this.getPanType()+"\u767B\u5F55\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55",type:"error"});return{}}const resp2=response.data;if(response.headers["set-cookie"]){const puus=[response.headers["set-cookie"]].join(";;;").match(/__puus=([^;]+)/);if(puus){if(this.cookie.match(/__puus=([^;]+)/)[1]!=puus[1]){this.cookie=this.cookie.replace(/__puus=[^;]+/,`__puus=${puus[1]}`);await this.updatePanEnv(this.getCookieName(),this.cookie)}}}return resp2}catch(e){}leftRetry--;await new Promise(resolve=>setTimeout(resolve,1e3))}return resp}getShareData(url){let regex=/https:\/\/pan\.quark\.cn\/s\/([^\\|#/]+)/;if(!this.isQuark){regex=/https:\/\/drive\.uc\.cn\/s\/([^\\|#/]+)/}const matches=regex.exec(url);if(matches!=null){return{shareId:matches[1],folderId:"0"}}return null}async getShareToken(shareData){if(!this.shareTokenCache.hasOwnProperty(shareData.shareId)){delete this.shareTokenCache[shareData.shareId];const shareToken=await this.api(`share/sharepage/token?${this.pr}`,{pwd_id:shareData.shareId,passcode:shareData.sharePwd||""});if(this.fileName.length<1){this.fileName=shareToken?.data?.title}if(shareToken?.data!=null&&shareToken?.data?.stoken!=null){this.shareTokenCache[shareData.shareId]=shareToken?.data}}}async listFile(shareData,videos,subtitles,shareId,folderId,page){if(page==null)page=1;const pageSize=100;const listData=await this.api(`share/sharepage/detail?${this.pr}&pwd_id=${shareId}&stoken=${encodeURIComponent(this.shareTokenCache[shareId].stoken)}&pdir_fid=${folderId}&force=0&_page=${page}&_size=${pageSize}&_sort=file_type:asc,file_name:asc`,null,3,"get");if(listData.data==null)return[];const items=listData.data.list||[];if(items.length===0)return[];const subDir=[];for(const item of items){if(item.dir===true){subDir.push(item)}else if(item.file===true&&item.obj_category==="video"){if(parseInt(item.size.toString())<1024*1024*5)continue;item.stoken=this.shareTokenCache[shareData.shareId].stoken;videos.push({fileId:item.fid||"",shareId:shareData.shareId,shareToken:item.stoken||"",shareFileToken:item.share_fid_token||"",seriesId:item.series_id||"",name:item.file_name||"",type:item.obj_category||"",formatType:item.format_type||"",size:(item.size||"").toString(),parent:item.pdir_fid||"",lastUpdateAt:item.last_update_at||0})}else if(item.type==="file"&&this.subtitleExts.some(x=>item.file_name.endsWith(x))){subtitles.push({fileId:item.fid||"",shareId:shareData.shareId,shareToken:item.stoken||"",shareFileToken:item.share_fid_token||"",seriesId:item.series_id||"",name:item.file_name||"",type:item.obj_category||"",formatType:item.format_type||"",size:(item.size||"").toString(),parent:item.pdir_fid||"",lastUpdateAt:item.last_update_at||0})}}if(page<Math.ceil(listData.metadata._total/pageSize)){const nextItems=await this.listFile(shareData,videos,subtitles,shareId,folderId,page+1);items.push(...nextItems)}for(const dir of subDir){const subItems=await this.listFile(shareData,videos,subtitles,shareId,dir.fid);items.push(...subItems)}return items}findBestLCS(mainItem,targetItems){const results=[];let bestMatchIndex=0;for(let i=0;i<targetItems.length;i++){const currentLCS=UZUtils.lcs(mainItem.name,targetItems[i].name);results.push({target:targetItems[i],lcs:currentLCS});if(currentLCS.length>results[bestMatchIndex].lcs.length){bestMatchIndex=i}}const bestMatch=results[bestMatchIndex];return{allLCS:results,bestMatch,bestMatchIndex}}async clearSaveDir(){if(this.saveDirId==null)return;const listData=await this.api(`file/delete?${this.pr}&pdir_fid=${this.saveDirId}&_page=1&_size=200&_sort=file_type:asc,name:desc`,{action_type:2,filelist:[this.saveDirId],exclude_fids:[]},3,"post");if(listData.status===200){this.saveDirId=null}}async createSaveDir(){const listData=await this.api(`file/sort?${this.pr}&pdir_fid=0&_page=1&_size=200&_sort=file_type:asc,name:desc`,null,3,"get");if(listData.data!=null&&listData.data.list!=null){for(const item of listData.data.list){if(item.file_name===this.saveDirName){this.saveDirId=item.fid;await this.clearSaveDir();break}}}if(this.saveDirId==null){const create=await this.api(`file?${this.pr}`,{pdir_fid:"0",file_name:this.saveDirName,dir_path:"",dir_init_lock:false});if(create.data!=null&&create.data.fid!=null){this.saveDirId=create.data.fid}}}async save({shareId,stoken,fileId,fileToken,clean=false}){await this.createSaveDir();if(this.saveDirId==null)return null;if(stoken==null){await this.getShareToken({shareId});if(!this.shareTokenCache.hasOwnProperty(shareId))return null}const saveResult=await this.api(`share/sharepage/save?${this.pr}`,{fid_list:[fileId],fid_token_list:[fileToken],to_pdir_fid:this.saveDirId,pwd_id:shareId,stoken:stoken||this.shareTokenCache[shareId].stoken,pdir_fid:"0",scene:"link"});if(saveResult.data!=null&&saveResult.data.task_id!=null){let retry=0;while(true){const taskResult=await this.api(`task?${this.pr}&task_id=${saveResult.data.task_id}&retry_index=${retry}`,null,3,"get");if(taskResult.data!=null&&taskResult.data.save_as!=null&&taskResult.data.save_as.save_as_top_fids!=null&&taskResult.data.save_as.save_as_top_fids.length>0){return taskResult.data.save_as.save_as_top_fids[0]}retry++;if(retry>2)break;await new Promise(resolve=>setTimeout(resolve,1e3))}}return null}async getFileList({pdir_fid,page}){try{pdir_fid=pdir_fid||"0";page=page||1;const resData=await this.api(`file/sort?${this.pr}&uc_param_str=&pdir_fid=${pdir_fid}&_page=${page}&_size=200&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,file_name:asc`,null,3,"get");let list=resData.data?.list??[];let mountList=[];for(let index=0;index<list.length;index++){const element=list[index];let remark="";let size=(element.size??0)/1024/1024;let unit="MB";if(size!=0){if(size>=1e3){size=size/1024;unit="GB"}size=size.toFixed(1);remark=`[${size}${unit}]`}let dataType=PanDataType.Unknown;if(element.category==1){dataType=PanDataType.Video}else if(element.file_type==0){dataType=PanDataType.Dir}mountList.push({name:element.file_name,panType:this.getPanType(),dataType,data:{fid:element.fid},remark})}return mountList}catch(e){}return[]}async getLiveTranscoding(args){let isMount=args.isMount??false;const transcoding=await this.api(`file/v2/play?${this.pr}`,{fid:isMount?args.fileId:this.saveFileIdCaches[args.fileId],resolutions:"normal,low,high,super,2k,4k",supports:"fmp4"});var urls=[];const nameMap={FOUR_K:"4K",SUPER:"\u8D85\u6E05",HIGH:"\u9AD8\u6E05",NORMAL:"\u6D41\u7545"};if(transcoding.data!=null&&transcoding.data.video_list!=null){for(const video of transcoding.data.video_list){const resoultion=video.video_info?.resoultion;const priority=video.video_info?.width;const url=video.video_info?.url;if(resoultion&&url){urls.push({url,name:nameMap[resoultion]??resoultion,headers:this.playHeaders,priority})}}}return urls}async getDownload(args){let isMount=args.isMount??false;try{const down=await this.api(`file/download?${this.pr}&uc_param_str=`,{fids:isMount?[args.fileId]:[this.saveFileIdCaches[args.fileId]]});if(down.data!=null&&down.data.length>0&&down.data[0].download_url!=null){let priority=9999;if(this.isQuark&&down.data[0].video_width>2e3){priority=0}return[{name:"\u539F\u753B",url:down.data[0].download_url,headers:this.playHeaders,priority}]}}catch(error){}return[]}async initPan(){if(this.cookie.length<1){this.cookie=await this.getPanEnv(this.getCookieName())}}uzTag="";getPanType(args){return this.isQuark?"\u5938\u514B":"UC"}getCookieName(){return this.isQuark?"\u5938\u514BCookie":"UCCookie"}async getPanEnv(key){return await getEnv(this.uzTag,key)}async updatePanEnv(key,value){await setEnv(this.uzTag,key,value)}async parseShareUrl(args){if(!this.isQuark){args.url=args.url.split("?")[0]}return await this.getFilesByShareUrl(args.url)}async parseVideo(args){await this.initPan();return await this.getPlayUrl(args.data)}async clearPanSaveDir(){await this.initPan();await this.clearSaveDir()}async supportPanMount(){await this.initPan();return new PanMount(this.getPanType(),this.getPanType(),this.cookie.length>0)}async getPanMountRootDir(){await this.initPan();let data=[];let error="";try{data=await this.getFileList({pdir_fid:"0",page:1})}catch(error2){error2=error2}return{data,error}}async getPanMountSubDir(args){await this.initPan();try{let data=await this.getFileList({pdir_fid:args.data.fid,page:args.page});return{data,error:""}}catch(error){return{data:[],error}}}async getPanMountFile(args){try{let urls=await this.getVideoPlayUrl({fileId:args.fid,isMount:true});let playData=new PanPlayInfo;playData.urls=urls;return playData}catch(error){return{error}}}}class PanQuark extends QuarkUC{constructor(){super();this.isQuark=true}static async getInstance(args){let pan=new PanQuark;pan.uzTag=args.uzTag;pan.saveDirName=args.saveDirName;return pan}async canParse(args){if(args.url.includes("pan.quark.cn")){return true}else{return false}}}class PanUC extends QuarkUC{constructor(){super();this.isQuark=false}static async getInstance(args){let pan=new PanUC;pan.uzTag=args.uzTag;pan.saveDirName=args.saveDirName;return pan}async canParse(args){if(args.url.includes("drive.uc.cn")){return true}else{return false}}}panSubClasses.push(PanQuark,PanUC);
