const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const archiver = require('archiver')

const TYPE_MAPPING = {
  'danMu/js': 400,
  'panTools/js': 300,
  'recommend/js': 200,
  'vod/js': 101,
}

const kLocalPathTAG = '_localPathTAG_'

const getRepoInfo = () => {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY.split('/')
  }
  try {
    const gitUrl = child_process.execSync('git config --get remote.origin.url').toString().trim()
    const matches = gitUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/)
    if (!matches) throw new Error('无法解析Git远程URL')
    return [matches[1], matches[2]]
  } catch (error) {
    throw new Error('获取仓库信息失败: ' + error.message)
  }
}

const parseComments = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8')
  const deprecated = extractValue(content, '@deprecated:')
  if (deprecated && parseInt(deprecated) == 1) return null

  const metadata = {
    name: extractValue(content, '@name:'),
    webSite: extractValue(content, '@webSite:'),
    version: extractValue(content, '@version:'),
    remark: extractValue(content, '@remark:'),
    env: extractValue(content, '@env:'),
    codeID: extractValue(content, '@codeID:'),
    type: extractValue(content, '@type:'),
    instance: extractValue(content, '@instance:'),
    isAV: extractValue(content, '@isAV:'),
  }

  if (!metadata.name) return null

  const relativePath = path.relative(process.cwd(), filePath)
  const dirPath = path.dirname(relativePath)
  if (!metadata.type?.trim()) {
    metadata.type = TYPE_MAPPING[dirPath]
  }
  // 获取当前分支名称，默认为 main
  const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : 'main'
  const [owner, repo] = getRepoInfo()
  metadata.api = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${kLocalPathTAG}${relativePath}`
  return metadata
}

const extractValue = (content, tag) => {
  const regex = new RegExp(`^.*${tag}(.*)$`, 'm')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}
const main = async () => {
  const directories = ['danMu/js', 'panTools/js', 'recommend/js', 'vod/js']
  const allInOneResult = {}
  const avResultList = []

  directories.forEach((dir) => {
    const fullPath = path.join(__dirname, '..', dir)
    if (!fs.existsSync(fullPath)) return

    const files = fs
      .readdirSync(fullPath)
      .filter((f) => f.endsWith('.js') || f.endsWith('.txt'))
      .map((f) => ({
        file: f,
        stat: fs.statSync(path.join(fullPath, f)),
      }))
      // .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
      .map((f) => f.file)

    files.forEach((file) => {
      const filePath = path.join(fullPath, file)
      const metadata = parseComments(filePath)
      if (metadata) {
        const item = {
          name: metadata.name,
          ...(metadata.version && {
            version: parseInt(metadata.version),
          }),
          ...(metadata.remark && { remark: metadata.remark }),
          ...(metadata.env && { env: metadata.env }),
          ...(metadata.webSite && { webSite: metadata.webSite }),
          ...(metadata.codeID && { codeID: metadata.codeID }),
          ...(metadata.instance && { instance: metadata.instance }),

          api: metadata.api,
          type: parseInt(metadata.type),
        }
        if (parseInt(metadata.isAV) === 1) {
          avResultList.push(item)
        } else {
          const category = dir.split('/')[0]
          allInOneResult[category] = allInOneResult[category] || []
          allInOneResult[category].push(item)
        }
      }
    })
  })

  // allInOneResult.vod 按 name 排序
  allInOneResult.vod.sort((a, b) => b.name.localeCompare(a.name))
  // avResultList 按 name 排序
  avResultList.sort((a, b) => a.name.localeCompare(b.name))

  const liveData = JSON.parse(fs.readFileSync('live/live.json', 'utf8'))
  allInOneResult.live = liveData

  const cmsData = JSON.parse(fs.readFileSync('cms/cms.json', 'utf8'))
  allInOneResult.vod.push(...cmsData)

  // 写入整合后的uzAio.json
  fs.writeFileSync('uzAio_raw.json', JSON.stringify(allInOneResult, null, 2).replaceAll(kLocalPathTAG, ''))

  // 写入整合后的uzAV.json
  fs.writeFileSync('av_raw_auto.json', JSON.stringify(avResultList, null, 2).replaceAll(kLocalPathTAG, ''))

  let sources = [...allInOneResult.vod, ...allInOneResult.panTools, ...allInOneResult.recommend, ...allInOneResult.danMu, ...allInOneResult.live, ...avResultList]

  const githubProxy = 'https://github.moeyy.xyz/'
  const githubRawHost = 'https://raw.githubusercontent.com'
  sources.forEach((item) => {
    item.api = item.api.replaceAll(githubRawHost, `${githubProxy}${githubRawHost}`)
  })
  fs.writeFileSync('uzAio.json', JSON.stringify(allInOneResult, null, 2).replaceAll(kLocalPathTAG, ''))
  fs.writeFileSync('av_auto.json', JSON.stringify(avResultList, null, 2).replaceAll(kLocalPathTAG, ''))

  let sourcesCopy = JSON.parse(JSON.stringify(sources))
  let envList = []
  sourcesCopy.forEach((item) => {
    if (item.api.includes(kLocalPathTAG)) {
      item.api = item.api.split(kLocalPathTAG)[1]
    }
    if (item.env?.length > 0) {
      const longList = item.env.split('&&')
      longList.forEach((env) => {
        const oneEnv = env.split('##')
        envList.push({
          name: oneEnv[0],
          desc: oneEnv[1],
          value: '',
        })
      })
    }
  })

  fs.writeFileSync('local.json', JSON.stringify(sourcesCopy, null, 2))
  fs.writeFileSync('env.json', JSON.stringify(envList, null, 2))
  const includePaths = {
    directories: ['danMu', 'panTools', 'recommend', 'vod', 'live', 'cms'],
    files: ['local.json', 'env.json'],
  }

  const shouldInclude = (filePath) => {
    const relativePath = path.relative(process.cwd(), filePath)
    // 检查是否是指定的文件
    if (includePaths.files.includes(relativePath)) {
      return true
    }

    // 检查是否在指定的目录下
    return includePaths.directories.some((dir) => relativePath.startsWith(dir))
  }

  // Create a zip archive
  const output = fs.createWriteStream('uzAio.zip')
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Set the compression level
  })

  output.on('close', () => {
    console.log(archive.pointer() + ' total bytes')
    console.log('uzAio.zip has been created')
  })

  archive.on('error', (err) => {
    throw err
  })

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('Warning:', err)
    } else {
      throw err
    }
  })

  archive.pipe(output)

  try {
    const walk = (directoryPath) => {
      const files = fs.readdirSync(directoryPath)

      files.forEach((file) => {
        try {
          const filePath = path.join(directoryPath, file)
          const stats = fs.statSync(filePath)

          // 只处理包含的文件和目录
          if (!shouldInclude(filePath)) {
            return
          }

          if (stats.isDirectory()) {
            walk(filePath)
          } else {
            archive.file(filePath, {
              name: path.relative(process.cwd(), filePath),
            })
          }
        } catch (err) {
          console.error(`Error processing ${file}:`, err)
        }
      })
    }

    walk(process.cwd())

    // Finalize the archive
    await archive.finalize()
  } catch (err) {
    console.error('Error creating archive:', err)
    throw err
  }

  await updateMarkdownFiles()
}

const updateMarkdownFiles = async () => {
  // 读取 readme/README.main.md 文件
  const readmeContent = fs.readFileSync('readme/README.main.md', 'utf8')
  const [owner, repo] = getRepoInfo()
  const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : 'main'
  console.log(process.env.GITHUB_REF)
  const cur = `${owner}/${repo}/refs/heads/${branch}`
  readmeContent.replaceAll('YYDS678/uzVideo-extensions/refs/heads/main', cur)
  // 写入 README.md 文件
  fs.writeFileSync('README.md', readmeContent)
}

main()
