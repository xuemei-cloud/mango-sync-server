// 初始化同步房间 — POST /api/init
import { readAllData, writeAllData } from './gist-store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pin } = req.body || {};
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN至少4位' });

  try {
    const all = await readAllData();
    if (all[pin]) return res.status(200).json({ ok: true, exists: true });

    all[pin] = {
      totalGems: 0,
      streak: 0,
      checkins: {},
      exchanges: [],
      achievements: [],
      _ts: Date.now()
    };
    await writeAllData(all);
    res.status(200).json({ ok: true, exists: false });
  } catch (e) {
    res.status(500).json({ error: '创建失败: ' + e.message });
  }
}
