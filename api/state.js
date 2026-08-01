// 数据同步接口
// GET  /api/state?pin=xxx  → 拉取数据，返回 { data, version }
// POST /api/state          → 推送数据，body: { pin, data }，返回 { ok, version }
import { readAllData, writeAllData } from './gist-store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const pin = req.query.pin;
    if (!pin) return res.status(400).json({ error: 'PIN required' });
    try {
      const all = await readAllData();
      const data = all[pin];
      if (!data) return res.status(404).json({ error: 'No data found' });
      return res.status(200).json({ data: data, version: data._ts || 0 });
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
      const all = await readAllData();
      all[pin] = enriched;
      await writeAllData(all);
      return res.status(200).json({ ok: true, version: ts });
    } catch (e) {
      return res.status(500).json({ error: '保存失败: ' + e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
