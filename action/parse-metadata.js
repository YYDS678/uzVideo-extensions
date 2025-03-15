const fs = require('fs');
const path = require('path');

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
  };

  if (!metadata.name) return null;

  const relativePath = path.relative(process.cwd(), filePath);
  const dirPath = path.dirname(relativePath);
  if (!metadata.type?.trim()) {
    metadata.type = TYPE_MAPPING[dirPath];
  }
  // 获取当前分支名称，默认为 main
  const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : 'main';
  metadata.api = `https://raw.githubusercontent.com/YYDS678/uzVideo-extensions/${branch}/${relativePath}`;

  return metadata;
};

const extractValue = (content, tag) => {
  const regex = new RegExp(`^.*${tag}(.*)$`, 'm');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
};
const main = () => {
  const directories = ['danMu/js', 'panTools/js', 'recommend/js', 'vod/js'];
  const result = {};

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.js') || f.endsWith('.txt'));

    files.forEach(file => {
      const filePath = path.join(fullPath, file);
      const metadata = parseComments(filePath);
      if (metadata) {
        const category = dir.split('/')[0];
        result[category] = result[category] || [];
        result[category].push({
          name: metadata.name,
          ...(metadata.version && { version: parseInt(metadata.version) }),
          ...(metadata.remark && { remark: metadata.remark }),
          ...(metadata.env && { env: metadata.env }),
          ...(metadata.webSite && { webSite: metadata.webSite }),
          ...(metadata.codeID && { codeID: metadata.codeID }),
          ...(metadata.instance && { instance: metadata.instance }),
          url: metadata.url,
          type: parseInt(metadata.type)
        });
      }
    });
  });



  const liveData = JSON.parse(fs.readFileSync('live/live.json', 'utf8'));
  result.live = liveData;

  const cmsData = JSON.parse(fs.readFileSync('cms/cms.json', 'utf8'));
  result.vod.push(...cmsData);




  // 写入整合后的uzAio.json
  fs.writeFileSync('uzAio_auto.json', JSON.stringify(result, null, 2));

};

main();