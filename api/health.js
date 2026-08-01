// 健康检查接口 — GET /api/health
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', ts: Date.now() });
}
