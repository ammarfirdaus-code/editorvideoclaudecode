#!/usr/bin/env node
/* Renders index.html to video frames with headless Chromium and pipes them to FFmpeg.
   Usage: node build/render.js <main|reel> <out.mp4> [startFrame endFrame]
          node build/render.js <main|reel> --still <seconds> <out.png>            */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const [kind, a, b, c] = process.argv.slice(2);
  const size = kind === 'reel' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?kind=' + kind);
  await page.evaluate(() => window.ready);
  const { fps, duration } = await page.evaluate(() => ({ fps: DATA.fps, duration: DATA.duration }));
  if (a === '--still') {
    await page.evaluate(t => window.seek(t), parseFloat(b));
    await page.screenshot({ path: c });
    await browser.close();
    return;
  }
  const total = Math.round(duration * fps);
  const f0 = b ? parseInt(b) : 0, f1 = c ? Math.min(total, parseInt(c)) : total;
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), a], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.seek(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`${kind} ${f0}-${f1}: frame ${f}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
})();
