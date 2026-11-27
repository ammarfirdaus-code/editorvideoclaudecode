// Usage: node render.js [outDir] [fps] [t1,t2,...] [startFrame] [endFrame]
// Serves this folder over HTTP (ES modules need it), then seeks the 3D timeline
// frame by frame and screenshots each frame.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.css': 'text/css' };
const root = __dirname;
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const out = process.argv[2] || 'out/frames';
  const fps = Number(process.argv[3] || 30);
  const only = process.argv[4] && process.argv[4] !== '-' ? process.argv[4].split(',').map(Number) : null;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 240; i++) {
    const st = await page.evaluate(() => ({ r: !!window.__ready, e: window.__err || null }));
    if (st.e) { console.log('init error', st.e); process.exit(1); }
    if (st.r) break;
    await page.waitForTimeout(500);
  }
  const dur = await page.evaluate(() => window.__dur);
  const total = Math.round(dur * fps);
  const s0 = Number(process.argv[5] || 0), s1 = Number(process.argv[6] || total);
  const list = only ? only.map((t) => [t, `t${t.toFixed(2)}.jpg`]) : Array.from({ length: s1 - s0 }, (_, j) => [(s0 + j) / fps, `f${String(s0 + j).padStart(5, '0')}.jpg`]);
  const t0 = Date.now();
  for (let i = 0; i < list.length; i++) {
    const [t, name] = list[i];
    await page.evaluate((x) => { window.__render(x); return 1; }, t);
    await page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 93 });
    if (!only && i % 60 === 0) console.log('frame', s0 + i, `${((Date.now() - t0) / (i + 1)).toFixed(0)}ms/f`);
  }
  process.exit(0);
})();
