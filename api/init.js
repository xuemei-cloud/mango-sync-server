async function redisCmd(...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('UPSTASH 未配置');
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  if (!resp.ok) throw new Error('Upstash 错误: ' + resp.status);
  return resp.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pin } = req.body || {};
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN至少4位' });

  const key = 'mango:' + pin;
  try {
    const existing = await redisCmd('GET', key);
    if (existing && existing.result) return res.status(200).json({ ok: true, exists: true });
    const initData = { totalGems: 0, streak: 0, checkins: {}, exchanges: [], achievements: [], _ts: Date.now() };
    await redisCmd('SET', key, JSON.stringify(initData));
    res.status(200).json({ ok: true, exists: false });
  } catch (e) {
    res.status(500).json({ error: '创建失败: ' + e.message });
  }
}
