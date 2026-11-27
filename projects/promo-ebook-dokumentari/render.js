// Usage: node render.js [outDir] [fps] [t1,t2,...]
// Seeks the paused GSAP timeline frame by frame and screenshots each frame.
// Waiting for the 'load' event or document.fonts.ready hung headless Chromium
// in this container, so wait for DOMContentLoaded plus a fixed delay instead.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || 'out/frames';
  const fps = Number(process.argv[3] || 30);
  const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const DUR = 30;
  const times = only || Array.from({ length: Math.round(DUR * fps) }, (_, i) => i / fps);
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => { window.__render(t); return 1; }, times[i]);
    const name = only ? `t${times[i].toFixed(2)}.jpg` : `f${String(i).padStart(5, '0')}.jpg`;
    await page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 92 });
    if (!only && i % 150 === 0) console.log('frame', i, '/', times.length);
  }
  process.exit(0);
})();
