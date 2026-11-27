// Usage:
//   node render.js still 0.5 2 5        -> renders/still-<t>.png
//   node render.js video <part> <parts> -> renders/frames/f00000.jpg (every <parts>-th frame from <part>)
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname, FPS = 30;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(p, (e, d) => { if (e) { rsp.writeHead(404); return rsp.end(); } rsp.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); rsp.end(d); });
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('PAGE', m.text()); });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  await page.goto(`http://localhost:${srv.address().port}/index.html`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  fs.mkdirSync(path.join(ROOT, 'renders/frames'), { recursive: true });
  if (mode === 'still') {
    for (const a of args) {
      await page.evaluate(t => window.seek(t), +a);
      await page.screenshot({ path: path.join(ROOT, `renders/still-${a}.png`) });
      console.log('still', a);
    }
  } else {
    const part = +(args[0] || 0), parts = +(args[1] || 1);
    const total = Math.round(await page.evaluate('window.DURATION') * FPS);
    for (let f = part; f < total; f += parts) {
      await page.evaluate(t => window.seek(t), f / FPS);
      await page.screenshot({ path: path.join(ROOT, `renders/frames/f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 });
      if (f % 60 === part) console.log(`part ${part}: frame ${f}/${total}`);
    }
  }
  await browser.close(); srv.close();
})();
