// GitHub Gist 数据存储工具
const GIST_ID = process.env.GIST_ID;
const TOKEN = process.env.GITHUB_TOKEN;
const FILENAME = 'mango-sync.json';

async function readAllData() {
  const resp = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'GET',
    headers: {
      'Authorization': 'token ' + TOKEN,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'mango-sync'
    }
  });
  if (!resp.ok) throw new Error('读取Gist失败: ' + resp.status);
  const gist = await resp.json();
  const file = gist.files && gist.files[FILENAME];
  if (!file || !file.content) return {};
  try {
    return JSON.parse(file.content || '{}');
  } catch(e) { return {}; }
}

async function writeAllData(data) {
  const body = {
    files: {
      [FILENAME]: { content: JSON.stringify(data) }
    }
  };
  const resp = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'token ' + TOKEN,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'mango-sync'
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error('写入Gist失败: ' + resp.status);
  return resp.json();
}

export { readAllData, writeAllData, GIST_ID, TOKEN, FILENAME };
