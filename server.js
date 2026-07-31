const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ------ 数据存取 ------
function loadRoom(pin) {
  const safe = pin.replace(/[^a-zA-Z0-9]/g, '');
  if (!safe) return null;
  const file = path.join(DATA_DIR, 'room_' + safe + '.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function saveRoom(pin, data) {
  const safe = pin.replace(/[^a-zA-Z0-9]/g, '');
  if (!safe) return false;
  const file = path.join(DATA_DIR, 'room_' + safe + '.json');
  try {
    fs.writeFileSync(file, JSON.stringify(data), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

function readBody(req) {
  return new Promise(function(resolve) {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { resolve({}); }
    });
  });
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJSON(res, status, data) {
  setCORS(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ------ 服务器 ------
const server = http.createServer(async function(req, res) {
  setCORS(res);

  // 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 健康检查
  if (req.method === 'GET' && req.url === '/health') {
    sendJSON(res, 200, { status: 'ok', uptime: process.uptime() });
    return;
  }

  const urlObj = new URL(req.url, 'http://localhost');
  const pathname = urlObj.pathname;

  // ===== API 路由 =====

  // GET /api/state?pin=XXXX — 拉取数据
  if (req.method === 'GET' && pathname === '/api/state') {
    const pin = urlObj.searchParams.get('pin') || '';
    if (!pin) { sendJSON(res, 400, { error: '缺少PIN码' }); return; }
    const room = loadRoom(pin);
    if (!room) { sendJSON(res, 404, { error: '房间不存在' }); return; }
    sendJSON(res, 200, { data: room.data, version: room.version });
    return;
  }

  // POST /api/state — 保存数据
  if (req.method === 'POST' && pathname === '/api/state') {
    const body = await readBody(req);
    const pin = body.pin || '';
    const newData = body.data;
    if (!pin) { sendJSON(res, 400, { error: '缺少PIN码' }); return; }
    if (typeof newData !== 'object') { sendJSON(res, 400, { error: '数据格式错误' }); return; }

    let room = loadRoom(pin);
    let version = 1;
    if (room) {
      version = (body.version || 0) > room.version ? body.version : room.version + 1;
    }

    if (!saveRoom(pin, { data: newData, version: version })) {
      sendJSON(res, 500, { error: '保存失败' }); return;
    }
    sendJSON(res, 200, { ok: true, version: version });
    return;
  }

  // POST /api/init — 创建新房间
  if (req.method === 'POST' && pathname === '/api/init') {
    const body = await readBody(req);
    const pin = body.pin || '';
    if (!pin || pin.length < 4) {
      sendJSON(res, 400, { error: 'PIN码至少4位' }); return;
    }
    if (loadRoom(pin)) {
      sendJSON(res, 200, { ok: true, msg: '房间已存在，数据将共享' }); return;
    }
    if (!saveRoom(pin, { data: {}, version: 1 })) {
      sendJSON(res, 500, { error: '创建失败' }); return;
    }
    sendJSON(res, 200, { ok: true, msg: '创建成功' });
    return;
  }

  // 404
  sendJSON(res, 404, { error: 'Not Found' });
});

server.listen(PORT, function() {
  console.log('✅ 芒果学习同步服务器已启动，端口: ' + PORT);
});
