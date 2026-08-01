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

  const key_prefix = 'mango:';

  if (req.method === 'GET') {
    const pin = req.query.pin;
    if (!pin) return res.status(400).json({ error: 'PIN required' });
    try {
      const result = await redisCmd('GET', key_prefix + pin);
      if (result && result.result) {
        const data = JSON.parse(result.result);
        return res.status(200).json({ data: data, version: data._ts || 0 });
      }
      return res.status(404).json({ error: 'No data found' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { pin, data } = req.body || {};
    if (!pin || !data) return res.status(400).json({ error: 'PIN and data required' });
    const ts = Date.now();
    const enriched = Object.assign({}, data, { _ts: ts });
    try {
      await redisCmd('SET', key_prefix + pin, JSON.stringify(enriched));
      return res.status(200).json({ ok: true, version: ts });
    } catch (e) {
      return res.status(500).json({ error: '保存失败: ' + e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
