// 初始化同步房间 — POST /api/init
// body: { pin }
// 返回: { ok, exists }
import { put, head } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pin } = req.body || {};
  if (!pin || pin.length < 4) {
    return res.status(400).json({ error: 'PIN至少4位' });
  }

  const key = 'mango-' + pin + '.json';

  // 检查房间是否已存在
  try {
    const existing = await head(key);
    if (existing) {
      return res.status(200).json({ ok: true, exists: true });
    }
  } catch (e) {
    // 不存在，继续创建
  }

  // 创建初始数据
  const initData = {
    totalGems: 0,
    streak: 0,
    checkins: {},
    exchanges: [],
    achievements: [],
    _ts: Date.now()
  };

  try {
    await put(key, JSON.stringify(initData), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    res.status(200).json({ ok: true, exists: false });
  } catch (e) {
    res.status(500).json({ error: '创建失败: ' + e.message });
  }
}
