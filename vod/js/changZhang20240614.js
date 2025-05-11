// ignore
//@name:「直」 厂长影视
//@version:2
//@webSite:https://www.czzy77.com
//@order: C
//@remark:
import { } from '../../core/uzVideo.js';
import { } from '../../core/uzHome.js';
import { } from '../../core/uz3lib.js';
import { } from '../../core/uzUtils.js';
// ignore


const appConfig = {
  _webSite: 'https://www.czzy77.com',
  /**
   * 网站主页，uz 调用每个函数前都会进行赋值操作
   * 如果不想被改变 请自定义一个变量
   */
  get webSite() {
    return this._webSite
  },
  set webSite(value) {
    this._webSite = value
  },

  _uzTag: '',
  /**
   * 扩展标识，初次加载时，uz 会自动赋值，请勿修改
   * 用于读取环境变量
   */
  get uzTag() {
    return this._uzTag
  },
  set uzTag(value) {
    this._uzTag = value
  },
  headers: {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },
  ignoreClassName: ['关于', '公告', '官方', '备用', '群', '地址'],
}

/**
* 异步获取分类列表的方法。
* @param {UZArgs} args
* @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
*/
async function getClassList(args) {
  let webUrl = args.url
  // let webUrl = await this.getNewSiteDomain()

  // 如果通过首页获取分类的话，可以将对象内部的首页更新
  appConfig.webSite = UZUtils.removeTrailingSlash(webUrl)
  var backData = new RepVideoClassList()
  try {
    const pro = await req(webUrl, { headers: appConfig.headers })
    backData.error = pro.error

    let proData = pro.data
    if (proData) {
      var document = parse(proData)
      var allClass = document.querySelectorAll('ul.submenu_mi > li > a')
      var list = []
      for (let index = 0; index < allClass.length; index++) {
        const element = allClass[index]
        var isIgnore = isIgnoreClassName(element.text)
        if (isIgnore) {
          continue
        }
        var type_name = element.text
        var url = element.attributes['href']

        url = combineUrl(url)

        if (url.length > 0 && type_name.length > 0) {
          var videoClass = new VideoClass()
          videoClass.type_id = url
          videoClass.type_name = type_name
          list.push(videoClass)
        }
      }
      backData.data = list
    }
  } catch (error) {
    backData.error = '获取分类失败～'
  }
  return JSON.stringify(backData)
}

/**
* 获取二级分类列表筛选列表的方法。
* @param {UZArgs} args
* @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
*/
async function getSubclassList(args) {
  var backData = new RepVideoSubclassList()
  try {
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
* 获取分类视频列表
* @param {UZArgs} args
* @returns {@Promise<JSON.stringify(new RepVideoList())>}
*/
async function getVideoList(args) {
  var listUrl = UZUtils.removeTrailingSlash(args.url) + '/page/' + args.page
  var backData = new RepVideoList()
  try {
    let pro = await req(listUrl, null)
    backData.error = pro.error
    let proData = pro.data
    if (proData) {
      var document = parse(proData)
      var allVideo = document
        .querySelector('.bt_img.mi_ne_kd.mrb')
        .querySelectorAll('ul > li')
      var videos = []
      for (let index = 0; index < allVideo.length; index++) {
        const element = allVideo[index]
        var vodUrl =
          element.querySelector('a')?.attributes['href'] ?? ''
        var vodPic =
          element.querySelector('a > img')?.attributes[
          'data-original'
          ] ?? ''
        var vodName =
          element.querySelector('a > img')?.attributes['alt'] ?? ''
        var vodDiJiJi = element.querySelector('div.jidi > span')?.text
        var vodHD =
          element.querySelector('div.hdinfo > span.qb')?.text ??
          element.querySelector('div.hdinfo > span.furk')?.text

        var vodDouBan = element.querySelector('div.rating')?.text ?? ''

        let videoDet = new VideoDetail()
        videoDet.vod_id = vodUrl
        videoDet.vod_pic = vodPic
        videoDet.vod_name = vodName
        videoDet.vod_remarks = vodDiJiJi ?? vodHD
        videoDet.vod_douban_score = vodDouBan
        videos.push(videoDet)
      }
      backData.data = videos
    }
  } catch (error) {
    backData.error = '获取列表失败～'
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
  } catch (error) {
    backData.error = error.toString()
  }
  return JSON.stringify(backData)
}

/**
* 获取视频详情
* @param {UZArgs} args
* @returns {@Promise<JSON.stringify(new RepVideoDetail())>}
*/
async function getVideoDetail(args) {
  var backData = new RepVideoDetail()
  try {
    var webUrl = args.url
    if (false === webUrl.endsWith('.html')) {
      webUrl =
        UZUtils.removeTrailingSlash(appConfig.webSite) +
        '/movie/' +
        webUrl +
        '.html'
    }

    let pro = await req(webUrl, { headers: appConfig.headers })
    backData.error = pro.error
    let proData = pro.data
    if (proData) {
      var document = parse(proData)
      var vod_pic =
        document.querySelector('.dyimg.fl > img')?.attributes['src'] ??
        ''
      var vod_name =
        document.querySelector('div.moviedteail_tt > h1')?.text ?? ''
      var detList =
        document
          .querySelector('.moviedteail_list')
          ?.querySelectorAll('li') ?? []
      var vod_year = ''
      var vod_director = ''
      var vod_actor = ''
      var vod_area = ''
      var vod_lang = ''
      var vod_douban_score = ''
      var type_name = ''

      for (let index = 0; index < detList.length; index++) {
        const element = detList[index]
        if (element.text.includes('年份')) {
          vod_year = element.text.replace('年份：', '')
        } else if (element.text.includes('导演')) {
          vod_director = element.text.replace('导演：', '')
        } else if (element.text.includes('主演')) {
          vod_actor = element.text.replace('主演：', '')
        } else if (element.text.includes('地区')) {
          vod_area = element.text.replace('地区：', '')
        } else if (element.text.includes('语言')) {
          vod_lang = element.text.replace('语言：', '')
        } else if (element.text.includes('类型')) {
          type_name = element.text.replace('类型：', '')
        } else if (element.text.includes('豆瓣')) {
          vod_douban_score = element.text.replace('豆瓣：', '')
        }
      }

      var vod_content = ''
      var vodBlurbDocument = document.querySelector('.yp_context')

      if (vodBlurbDocument) {
        vod_content = vodBlurbDocument.text

        var allP = vodBlurbDocument.querySelectorAll('p')

        for (let index = 0; index < allP.length; index++) {
          const element = allP[index]
          vod_content = vod_content + element.text
        }
      }

      var juJiDocment =
        document
          .querySelector('.paly_list_btn')
          ?.querySelectorAll('a') ?? []

      var vod_play_url = ''
      for (let index = 0; index < juJiDocment.length; index++) {
        const element = juJiDocment[index]

        vod_play_url += element.text
        vod_play_url += '$'
        vod_play_url += element.attributes['href']
        vod_play_url += '#'
      }

      let detModel = new VideoDetail()
      detModel.vod_year = vod_year
      detModel.type_name = type_name
      detModel.vod_director = vod_director
      detModel.vod_actor = vod_actor
      detModel.vod_area = vod_area
      detModel.vod_lang = vod_lang
      detModel.vod_douban_score = vod_douban_score
      detModel.vod_content = vod_content
      detModel.vod_pic = vod_pic
      detModel.vod_name = vod_name
      detModel.vod_play_url = vod_play_url
      detModel.vod_id = webUrl
      backData.data = detModel
    }
  } catch (error) {
    backData.error = '获取视频详情失败'
  }

  return JSON.stringify(backData)
}

/**
* 获取视频的播放地址
* @param {UZArgs} args
* @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
*/
async function getVideoPlayUrl(args) {
  var backData = new RepVideoPlayUrl()
  try {
    const pro = await req(args.url, { headers: appConfig.headers })
    backData.error = pro.error
    let proData = pro.data

    if (proData) {
      var document = parse(proData)

      let jsUrl =
        document.querySelector('iframe')?.attributes['src'] ?? ''
      if (jsUrl.length > 0) {
        let headers = {
          'user-agent': appConfig.headers['user-agent'],
        }
        if (jsUrl.includes('player-v2')) {
          headers['sec-fetch-dest'] = 'iframe'
          headers['sec-fetch-mode'] = 'navigate'
          headers['referer'] = `${appConfig.webSite}/`
        }
        let pro2 = await req(jsUrl, {
          headers: headers,
        })
        pro2.error += pro.error
        if (pro2.data) {
          let root = parse(pro2.data)
          let scripts = root.querySelectorAll('script')
          var code1 = ''
          if (scripts.length - 2 > 0) {
            code1 = scripts[scripts.length - 2].text

            if (code1.indexOf('var player') > -1) {
              let player = code1.match(/var player = "(.*?)"/)
              let rand = code1.match(/var rand = "(.*?)"/)

              let content = JSON.parse(
                cryptJs(player[1], 'VFBTzdujpR9FWBhe', rand[1])
              )
              backData.data = content['url']
              backData.headers = appConfig.headers
            } else {
              let data = code1.split('"data":"')[1].split('"')[0]
              let code = data.split('').reverse().join('')
              let temp = ''
              for (let i = 0x0; i < code.length; i = i + 0x2) {
                temp += String.fromCharCode(
                  parseInt(code[i] + code[i + 0x1], 0x10)
                )
              }
              let playUrl =
                temp.substring(0x0, (temp.length - 0x7) / 0x2) +
                temp.substring((temp.length - 0x7) / 0x2 + 0x7)
              // let path = scripts[scripts.length - 1].attributes["src"];
              // let host = UZUtils.getHostFromURL(jsUrl);
              // let pro = await req(host + path, {
              //   headers: {
              //     Referer: appConfig.webSite,
              //     "Sec-Fetch-Dest": "iframe",
              //     "Sec-Fetch-Mode": "navigate",
              //   },
              // });

              // 浏览器里这样执行可以。。。
              // let c =
              //   'document[_0x2911("43", "EL@a")](_0x82e421)[_0x2911("44", "vU#R")] =';
              // var videoHtml = "";
              // let code2 = pro.data.replace(c, "videoHtml =");

              // var res = eval('var videoHtml = "";' + code1 + code2);

              backData.data = playUrl
              backData.headers = appConfig.headers
              // backData.error = '这个加密不知道怎么解～'
            }
          }
        }
      }

      let x =
        document.querySelectorAll('script:contains(window.wp_nonce)') ??
        []
      if (x.length > 0) {
        let code = x[0].text
        let group = code.match(/(var.*)eval\((\w*\(\w*\))\)/)
        const md5 = Crypto
        const result = eval(group[1] + group[2])
        let url = result.match(/url:.*?['"](.*?)['"]/)[1]
        const res = await req(url)
        const b64Data = Crypto.enc.Base64.stringify(
          Crypto.enc.Utf8.parse(res.data)
        )
        backData.data =
          'data:application/vnd.apple.mpegurl;base64,' + b64Data
        //backData.data = url;
      }
    }
  } catch (error) {
    backData.error = '获取视频播放地址失败'
  }
  return JSON.stringify(backData)
}

/**
* 搜索视频
* @param {UZArgs} args
* @returns {@Promise<JSON.stringify(new RepVideoList())>}
*/
async function searchVideo(args) {
  var backData = new RepVideoList()
  // let url = `http://czzy.210985.xyz/czzy_search8.php?wd=${args.searchWord}&page=${args.page}`
  // try {
  //     let res = await req(url, { headers: appConfig.headers })
  //     let data = res.data
  //     if (data) {
  //         let videos = []
  //         let list = data.split('$$$')
  //         list.forEach((e) => {
  //             let p = e.split('|')
  //             let videoDet = new VideoDetail()
  //             videoDet.vod_id = p[0]

  //             videoDet.vod_pic = p[2]
  //             console.log('------', p)

  //             videoDet.vod_name = p[1]
  //             videoDet.vod_remarks = p[3]
  //             videos.push(videoDet)
  //         })
  //         backData.data = videos
  //     }
  // } catch (e) {
  //     backData.error = 'search error'
  // }

  // let url =
  //     combineUrl('/daoyongjiek0shibushiyoubing?q=') +
  //     args.searchWord +
  //     '&f=_all&p=' +
  //     args.page
  // let pro = await req(url, {
  //     headers: appConfig.headers,
  // })
  // backData.error = pro.error
  // let proData = pro.data
  // if (proData) {
  //     var document = parse(proData)

  //     let allVideo =
  //         document
  //             .querySelector('.bt_img.mi_ne_kd.search_list')
  //             ?.querySelectorAll('ul > li') ?? []
  //     console.log('----------', allVideo.length)
  // }
  // return JSON.stringify(backData)
}

// async getNewSiteDomain() {
//   try {
//       const res = await req(this.host, { headers: appConfig.headers })
//       const $ = cheerio.load(res.data)
//       const url = $('h2').eq(1).find('a').attr('href')

//       return url
//   } catch (e) {
//       return appConfig.webSite
//   }
// }

function cryptJs(text, key, iv, type) {
  let key_value = Crypto.enc.Utf8.parse(key || 'PBfAUnTdMjNDe6pL')
  let iv_value = Crypto.enc.Utf8.parse(iv || 'sENS6bVbwSfvnXrj')
  let content
  if (type) {
    content = Crypto.AES.encrypt(text, key_value, {
      iv: iv_value,
      mode: Crypto.mode.CBC,
      padding: Crypto.pad.Pkcs7,
    })
  } else {
    content = Crypto.AES.decrypt(text, key_value, {
      iv: iv_value,
      padding: Crypto.pad.Pkcs7,
    }).toString(Crypto.enc.Utf8)
  }
  return content
}

function combineUrl(url) {
  if (url === undefined) {
    return ''
  }
  if (url.indexOf(appConfig.webSite) !== -1) {
    return url
  }
  let url1 = appConfig.webSite
  if (url1.endsWith('/')) {
    url1 = url1.substring(0, url1.length - 1)
  }
  let url2 = url
  if (url2.startsWith('/')) {
    url2 = url2.substring(1)
  }
  return url1 + '/' + url2
}

function isIgnoreClassName(className) {
  for (let index = 0; index < appConfig.ignoreClassName.length; index++) {
    const element = appConfig.ignoreClassName[index]
    if (className.indexOf(element) !== -1) {
      return true
    }
  }
  return false
}
