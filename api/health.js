// 健康检查接口 — GET /api/health
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const gistId = process.env.GIST_ID;
  const token = process.env.GITHUB_TOKEN;
  if (!gistId || !token) {
    return res.status(200).json({
      status: 'ok',
      storage: 'not_configured',
      message: '请先配置 GIST_ID 和 GITHUB_TOKEN 环境变量'
    });
  }
  return res.status(200).json({ status: 'ok', storage: 'ready', ts: Date.now() });
}
