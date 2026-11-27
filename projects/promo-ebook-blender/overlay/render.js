// Renders the 2D overlays: panel (transparent PNG), ui and kin (JPEG) into out/overlay/<mode>/
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const JOBS = [['panel', 1.9, 'png'], ['ui', 1.5, 'jpeg'], ['kin', 1.5, 'jpeg']];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + path.join(__dirname, 'index.html'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  for (const [mode, dur, type] of JOBS) {
    const out = path.join(__dirname, '..', 'out', 'overlay', mode); fs.mkdirSync(out, { recursive: true });
    const n = Math.round(dur * 30);
    for (let i = 0; i < n; i++) {
      await p.evaluate(([m, t]) => window.__render(m, t), [mode, i / 30]);
      await p.screenshot({ path: path.join(out, `f${String(i + 1).padStart(4, '0')}.${type === 'png' ? 'png' : 'jpg'}`), type, omitBackground: type === 'png', ...(type === 'jpeg' ? { quality: 94 } : {}) });
    }
    console.log(mode, n);
  }
  process.exit(0);
})();
