/**
 * uzVideo Extensions 构建脚本
 * ----------------------------------------
 * 功能：
 * 1. 解析各目录下 JS/TXT 脚本的注释信息，提取元数据。
 * 2. 按规则合并为 all-in-one JSON 配置。
 * 3. 支持环境变量提取 (env.json)。
 * 4. 自动替换子目录内容 (sub 文件夹)。
 * 5. 生成压缩包 uzAio.zip。
 * 6. 自动更新 README.md。
 */

const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const { transformSync } = require('esbuild')
const child_process = require('child_process')

// ================== 常量定义 ==================

// 各目录对应的类型映射
const TYPE_MAPPING = {
    'danMu/js': 400,
    'panTools/js': 300,
    'recommend/js': 200,
    'vod/js': 101,
}

const kLocalPathTAG = '_localPathTAG_' // 占位符，用于本地路径替换

// ================== 工具函数 ==================

/**
 * 从内容中提取标记对应的值
 * @param {string} content - 文件内容
 * @param {string} tag - 形如 @name: 的标记
 */
const extractValue = (content, tag) => {
    const regex = new RegExp(`^.*${tag}(.*)$`, 'm')
    const match = content.match(regex)
    return match ? match[1].trim() : ''
}

/**
 * 获取当前仓库信息（owner/repo）
 * - 优先读取 GitHub Actions 提供的环境变量
 * - 其次尝试从 git remote.origin.url 中解析
 */
const getRepoInfo = () => {
    if (process.env.GITHUB_REPOSITORY) {
        return process.env.GITHUB_REPOSITORY.split('/')
    }
    try {
        const gitUrl = child_process
            .execSync('git config --get remote.origin.url')
            .toString()
            .trim()

        // 支持两种形式：
        // 1. https://github.com/user/repo.git
        // 2. git@github.com:user/repo.git
        const matches = gitUrl.match(
            /(?:git@([^:]+):|https?:\/\/([^\/]+)\/)([^\/]+)\/([^\/.]+)(?:\.git)?$/
        )

        if (!matches || matches.length < 5) {
            throw new Error('无法解析Git远程URL')
        }

        const host = matches[1] || matches[2]
        const owner = matches[3]
        const repo = matches[4]
        return [owner, repo]
    } catch (error) {
        throw new Error('获取仓库信息失败: ' + error.message)
    }
}

// ================== 元数据处理 ==================

/**
 * 从 JS 文件注释中提取元数据
 * @param {string} filePath - 文件路径
 */
const parseComments = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8')

    // 如果被标记为废弃，直接返回 null
    const deprecated = extractValue(content, '@deprecated:')
    if (deprecated && parseInt(deprecated) === 1) return null

    // 提取注释中的元信息
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
        order: extractValue(content, '@order:'),
        logo: extractValue(content, '@logo:'),
    }

    if (!metadata.name) return null

    // 自动推导 type
    const relativePath = path.relative(process.cwd(), filePath)
    const dirPath = path.dirname(relativePath)
    if (!metadata.type?.trim()) {
        metadata.type = TYPE_MAPPING[dirPath]
    }

    // 获取当前分支，默认为 main
    const branch = process.env.GITHUB_REF
        ? process.env.GITHUB_REF.replace('refs/heads/', '')
        : 'main'
    const [owner, repo] = getRepoInfo()

    // 构建远程原始文件 API 地址
    metadata.api = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${kLocalPathTAG}${relativePath.replace(
        /\\/g,
        '/'
    )}`

    return metadata
}

// ================== 排序逻辑 ==================

/**
 * 排序函数，支持 order 分组与字母、长度排序
 */
const sortByOrder = (a, b) => {
    if (a.order && b.order) {
        const aOrderChar = a.order.charAt(0)
        const bOrderChar = b.order.charAt(0)

        if (aOrderChar !== bOrderChar) {
            return aOrderChar.localeCompare(bOrderChar)
        }

        const orderCompare = a.order.localeCompare(b.order)
        if (orderCompare !== 0) return orderCompare

        if (a.name.length !== b.name.length) {
            return a.name.length - b.name.length
        }

        return a.name.localeCompare(b.name)
    }
    if (a.order) return -1
    if (b.order) return 1
    return a.name.localeCompare(b.name)
}

// ================== 压缩打包逻辑 ==================

/**
 * 判断文件是否应该被包含进压缩包
 */
const shouldInclude = (filePath, includePaths) => {
    const relativePath = path.relative(process.cwd(), filePath)
    const fileName = path.basename(relativePath)

    if (includePaths.excludeFiles.includes(fileName)) return false

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            if (content.includes('@deprecated:')) {
                const deprecated = extractValue(content, '@deprecated:')
                if (deprecated && parseInt(deprecated) === 1) return false
            }
        } catch {}
    }

    if (includePaths.files.includes(relativePath)) return true
    // 排除 _sub 目录下的文件
    if (relativePath.includes('_sub')) return false
    return includePaths.directories.some((dir) => relativePath.startsWith(dir))
}

// ================== README 更新 ==================

/**
 * 更新 README.md 文件中的分支信息
 */
const updateMarkdownFiles = async () => {
    const readmeContent = fs.readFileSync('readme/README.main.md', 'utf8')
    const [owner, repo] = getRepoInfo()
    const branch = process.env.GITHUB_REF
        ? process.env.GITHUB_REF.replace('refs/heads/', '')
        : 'main'

    const cur = `${owner}/${repo}/releases/download/uzVideo-Extensions-${branch}`
    const updatedContent = readmeContent.replaceAll(
        'YYDS678/uzVideo-extensions/releases/download/uzVideo-Extensions-main',
        cur
    )
    fs.writeFileSync('README.md', updatedContent)
}

// ================== 主函数 ==================

const main = async () => {
    // 1. 定义要扫描的目录
    const directories = ['danMu/js', 'panTools/js', 'recommend/js', 'vod/js']
    const allInOneResult = {}
    const avResultList = []


    const [owner, repo] = getRepoInfo()
    const branch = process.env.GITHUB_REF
        ? process.env.GITHUB_REF.replace('refs/heads/', '')
        : 'main'
    const jsdelivrCDN = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/`
    const githubRawHost = 'https://raw.githubusercontent.com'


    // 2. 遍历目录，解析文件元数据
    directories.forEach((dir) => {
        const fullPath = path.join(__dirname, '..', dir)
        if (!fs.existsSync(fullPath)) return

        const files = fs
            .readdirSync(fullPath)
            .filter((f) => f.endsWith('.js') || f.endsWith('.txt'))
            .map((f) => f)

        files.forEach((file) => {
            const filePath = path.join(fullPath, file)

            // 如果存在同名_sub 文件夹，则拼接子内容
            const subDir = path.join(
                fullPath,
                path.basename(file, '.js') + '_sub'
            )
            if (fs.existsSync(subDir)) {
                let allFilesContent = ''
                const subFiles = fs
                    .readdirSync(subDir)
                    .filter((f) => f.endsWith('.js') || f.endsWith('.txt'))

                subFiles.forEach((subFile) => {
                    const subFilePath = path.join(subDir, subFile)
                    let subFileContent = fs.readFileSync(subFilePath, 'utf8')

                    // 移除 // ignore 包裹的内容
                    if (subFileContent.includes('// ignore')) {
                        subFileContent = subFileContent.replace(
                            /\/\/\s*ignore[\s\S]*?\/\/\s*ignore/g,
                            ''
                        )
                    }

                    // GitHub Actions 环境下压缩子文件
                    if (process.env.GITHUB_ACTIONS) {
                        console.log('GitHub Actions 压缩子文件:', subFile)
                        try {
                            subFileContent = transformSync(subFileContent, {
                                minifyWhitespace: true,
                                format: 'esm',
                            }).code
                        } catch (error) {
                            console.warn('esbuild 压缩失败:', error.message)
                        }
                    }

                    allFilesContent +=
                        `\n// MARK: ${subFile}\n// 请勿直接修改，请修改 ${subFile} 文件\n// prettier-ignore\n` +
                        subFileContent
                })

                // 将子文件内容替换进主文件
                let fileContent = fs.readFileSync(filePath, 'utf8')
                const tag = '//### 替换识别文本 ### uzVideo-Ext-Sub ###'
                if (fileContent.includes(tag)) {
                    fileContent = fileContent.replace(
                        new RegExp(`${tag}[\\s\\S]*$`),
                        tag
                    )
                    fileContent += '\n\n\n' + allFilesContent
                    fs.writeFileSync(filePath, fileContent)
                }
            }

            // 提取文件元数据
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
                    ...(metadata.order && { order: metadata.order }),
                    api: metadata.api,
                    type: parseInt(metadata.type) || TYPE_MAPPING[dir] || 101,
                }
                if (metadata.logo) {
                    item.logo = metadata.logo
                    if (!item.logo.startsWith("http")) {
                        item.logo =  `${githubRawHost}/${owner}/${repo}/${branch}/logo/${metadata.logo}`
                    }
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

    // 3. 各类数据排序
    Object.keys(allInOneResult).forEach((cat) => {
        if (Array.isArray(allInOneResult[cat])) {
            allInOneResult[cat].sort(sortByOrder)
        }
    })
    avResultList.sort(sortByOrder)

    // 4. 合并 live 和 cms 数据
    const liveData = JSON.parse(fs.readFileSync('live/live.json', 'utf8'))
    allInOneResult.live = liveData

    const cmsData = JSON.parse(fs.readFileSync('cms/cms.json', 'utf8'))
    allInOneResult.vod.push(...cmsData)
    allInOneResult.vod.sort(sortByOrder)

    // 5. 重新组织顺序
    const orderedResult = {
        panTools: allInOneResult.panTools || [],
        danMu: allInOneResult.danMu || [],
        recommend: allInOneResult.recommend || [],
        live: allInOneResult.live || [],
        vod: allInOneResult.vod || [],
    }

    // 6. 输出 JSON 文件（分类单独、整合、AV）
    const categoryDirs = ['panTools', 'danMu', 'recommend', 'vod']
    categoryDirs.forEach((category) => {
        if (orderedResult[category]?.length > 0) {
            const fileName = `${category}.json`
            fs.writeFileSync(
                path.join(category, fileName),
                JSON.stringify(orderedResult[category], null, 2).replaceAll(
                    kLocalPathTAG,
                    ''
                )
            )
        }
    })

    fs.writeFileSync(
        'uzAio_raw.json',
        JSON.stringify(orderedResult, null, 2).replaceAll(kLocalPathTAG, '')
    )
    fs.writeFileSync(
        'av_raw_auto.json',
        JSON.stringify(avResultList, null, 2).replaceAll(kLocalPathTAG, '')
    )


    let sources = [
        ...orderedResult.panTools,
        ...orderedResult.danMu,
        ...orderedResult.recommend,
        ...orderedResult.live,
        ...orderedResult.vod,
        ...avResultList,
    ]
    // 7. 替换为 jsDelivr CDN 地址
    sources.forEach((item) => {
        item.api = item.api.replace(
            `${githubRawHost}/${owner}/${repo}/${branch}/`,
            jsdelivrCDN
        )
        if (item.logo) {
            item.logo = item.logo.replace(
                `${githubRawHost}/${owner}/${repo}/${branch}/`,
                jsdelivrCDN
            )
        }
    })

    fs.writeFileSync(
        'uzAio.json',
        JSON.stringify(orderedResult, null, 2).replaceAll(kLocalPathTAG, '')
    )
    fs.writeFileSync(
        'av_auto.json',
        JSON.stringify(avResultList, null, 2).replaceAll(kLocalPathTAG, '')
    )

    // 8. 提取环境变量配置
    let sourcesCopy = JSON.parse(JSON.stringify(sources))
    let envList = []
    const envSet = new Set()
    sourcesCopy.forEach((item) => {
        if (item.api.includes(kLocalPathTAG)) {
            item.api = item.api.split(kLocalPathTAG)[1]
        }
        if (item.env?.length > 0) {
            const longList = item.env.split('&&')
            longList.forEach((env) => {
                const [key, desc] = env.split('##')
                if (!envSet.has(key)) {
                    envSet.add(key)
                    envList.push({ name: key, desc, value: '' })
                }
            })
        }
    })

    fs.writeFileSync('local.json', JSON.stringify(sourcesCopy, null, 2))
    fs.writeFileSync('env.json', JSON.stringify(envList, null, 2))

    // 9. 打包为 zip
    const includePaths = {
        directories: ['danMu', 'panTools', 'recommend', 'vod', 'live', 'cms'],
        files: ['local.json', 'env.json'],
        excludeFiles: [
            'recommend.json',
            'panTools.json',
            'danMu.json',
            'vod.json',
            'README.md',
        ],
    }

    const output = fs.createWriteStream('uzAio.zip')
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(output)

    const walk = (directoryPath) => {
        fs.readdirSync(directoryPath).forEach((file) => {
            const filePath = path.join(directoryPath, file)
            const stats = fs.statSync(filePath)
            if (!shouldInclude(filePath, includePaths)) return

            if (stats.isDirectory()) {
                walk(filePath)
            } else {
                archive.file(filePath, {
                    name: path.relative(process.cwd(), filePath),
                })
            }
        })
    }

    walk(process.cwd())
    await archive.finalize()
    console.log('✅ uzAio.zip 已生成')

    // 10. 更新 README.md
    await updateMarkdownFiles()
}

main()
