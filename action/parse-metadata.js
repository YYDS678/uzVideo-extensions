const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const TYPE_MAPPING = {
  'danMu/js': 400,
  'panTools/js': 300,
  'recommend/js': 200,
  'vod/js': 101
};

const parseComments = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const deprecated = extractValue(content, '@deprecated:');
  if (deprecated && parseInt(deprecated) == 1) return null;

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
  };

  if (!metadata.name) return null;

  const relativePath = path.relative(process.cwd(), filePath);
  const dirPath = path.dirname(relativePath);
  if (!metadata.type?.trim()) {
    metadata.type = TYPE_MAPPING[dirPath];
  }
  // 获取当前分支名称，默认为 main
  const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : 'main';
  function getRepoInfo() {
    if (process.env.GITHUB_REPOSITORY) {
      return process.env.GITHUB_REPOSITORY.split('/');
    }
    try {
      const gitUrl = child_process.execSync('git config --get remote.origin.url').toString().trim();
      const matches = gitUrl.match(/github\.com[:\/](.+?)\/(.+?)(\.git)?$/);
      if (!matches) throw new Error('无法解析Git远程URL');
      return [matches[1], matches[2]];
    } catch (error) {
      throw new Error('获取仓库信息失败: ' + error.message);
    }
  }
  const [owner, repo] = getRepoInfo();
  metadata.api = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${relativePath}`;

  return metadata;
};

const extractValue = (content, tag) => {
  const regex = new RegExp(`^.*${tag}(.*)$`, 'm');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
};
const main = () => {
  const directories = ['danMu/js', 'panTools/js', 'recommend/js', 'vod/js'];
  const allInOneResult = {};
  const avResultList = [];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.js') || f.endsWith('.txt'))
      .map(f => ({ file: f, stat: fs.statSync(path.join(fullPath, f)) }))
      .sort((a, b) => b.stat.birthtimeMs - a.stat.birthtimeMs)
      .map(f => f.file);

    files.forEach(file => {
      const filePath = path.join(fullPath, file);
      const metadata = parseComments(filePath);
      if (metadata) {
        const item = {
          name: metadata.name,
          ...(metadata.version && { version: parseInt(metadata.version) }),
          ...(metadata.remark && { remark: metadata.remark }),
          ...(metadata.env && { env: metadata.env }),
          ...(metadata.webSite && { webSite: metadata.webSite }),
          ...(metadata.codeID && { codeID: metadata.codeID }),
          ...(metadata.instance && { instance: metadata.instance }),

          api: metadata.api,
          type: parseInt(metadata.type)
        }
        if (parseInt(metadata.isAV) === 1) {
          avResultList.push(item);
        } else {
          const category = dir.split('/')[0];
          allInOneResult[category] = allInOneResult[category] || [];
          allInOneResult[category].push(item);
        }

      }
    });
  });



  const liveData = JSON.parse(fs.readFileSync('live/live.json', 'utf8'));
  allInOneResult.live = liveData;

  const cmsData = JSON.parse(fs.readFileSync('cms/cms.json', 'utf8'));
  allInOneResult.vod.push(...cmsData);

  // 写入整合后的uzAio.json
  fs.writeFileSync('uzAio_raw.json', JSON.stringify(allInOneResult, null, 2));

  // 写入整合后的uzAV.json
  fs.writeFileSync('av_raw_auto.json', JSON.stringify(avResultList, null, 2));

  const githubProxy = "https://github.moeyy.xyz/";
  const githubRawHost = "https://raw.githubusercontent.com";
  allInOneResult.vod.forEach(item => {
    item.api = item.api.replaceAll(githubRawHost, `${githubProxy}${githubRawHost}`);
  });
  allInOneResult.panTools.forEach(item => {
    item.api = item.api.replaceAll(githubRawHost, `${githubProxy}${githubRawHost}`);
  });
  allInOneResult.recommend.forEach(item => {
    item.api = item.api.replaceAll(githubRawHost, `${githubProxy}${githubRawHost}`);
  });
  allInOneResult.danMu.forEach(item => {
    item.api = item.api.replaceAll(githubRawHost, `${githubProxy}${githubRawHost}`);
  });
  allInOneResult.live.forEach(item => {
    item.url = item.url.replaceAll(githubRawHost, `${githubProxy}${githubRawHost}`);
  });

  fs.writeFileSync('uzAio.json', JSON.stringify(allInOneResult, null, 2));

  avResultList.forEach(item => {
    item.api = item.api.replaceAll(githubRawHost, `${githubProxy}${githubRawHost}`)
  });
  fs.writeFileSync('av_auto.json', JSON.stringify(avResultList, null, 2));


};

main();