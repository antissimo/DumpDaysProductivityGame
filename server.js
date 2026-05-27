const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const ROOT = __dirname;
const SCORE_FILE = path.join(ROOT, 'scores.json');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

async function ensureScoreFile() {
  try {
    await fs.access(SCORE_FILE);
  } catch {
    await fs.writeFile(SCORE_FILE, '[]', 'utf8');
  }
}

async function readScores() {
  await ensureScoreFile();
  const content = await fs.readFile(SCORE_FILE, 'utf8');
  try {
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

async function writeScores(scores) {
  await fs.writeFile(SCORE_FILE, JSON.stringify(scores, null, 2), 'utf8');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

async function serveStatic(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    sendText(res, 404, 'Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/scores') {
    if (req.method === 'GET') {
      const scores = await readScores();
      return sendJson(res, 200, scores);
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const entry = JSON.parse(body);
          const scores = await readScores();
          scores.push(entry);
          await writeScores(scores);
          return sendJson(res, 200, scores);
        } catch (err) {
          return sendText(res, 400, 'Invalid JSON payload');
        }
      });
      return;
    }
    return sendText(res, 405, 'Method Not Allowed');
  }

  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(ROOT, decodeURIComponent(filePath));
  if (!filePath.startsWith(ROOT)) {
    return sendText(res, 403, 'Forbidden');
  }
  await serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
  console.log('Leaderboard API available at http://localhost:' + PORT + '/api/scores');
});
