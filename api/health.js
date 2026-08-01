// 健康检查接口 — GET /api/health
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return res.status(200).json({
      status: 'ok',
      storage: 'not_configured',
      message: '请先配置 UPSTASH 环境变量'
    });
  }
  return res.status(200).json({ status: 'ok', storage: 'ready', ts: Date.now() });
}
