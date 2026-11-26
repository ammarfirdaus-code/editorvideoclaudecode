// Render index.html bingkai demi bingkai ke MP4 (tanpa audio).
// Guna: node render.js [fps] [output]   |   node render.js --stills 1,5,12  (PNG pegun untuk semakan)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const stills = args[0] === '--stills' ? args[1].split(',').map(Number) : null;
const fps = stills ? 30 : Number(args[0] || 30);
const out = stills ? null : (args[1] || path.join(__dirname, 'renders', 'video.mp4'));
const DURATION = 30;

(async () => {
  fs.mkdirSync(path.join(__dirname, 'renders'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => window.ready);
  const stage = await page.$('#stage');
  // Jangan pulangkan objek timeline: Playwright akan cuba menyalinnya dan tergantung.
  const seek = t => page.evaluate(tt => { window.tl.seek(tt, false); }, t);

  if (stills) {
    for (const t of stills) {
      await seek(t);
      await stage.screenshot({ path: path.join(__dirname, 'renders', `still-${String(t).replace('.', '_')}.png`) });
    }
    await browser.close();
    return;
  }

  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(DURATION * fps);
  for (let i = 0; i < total; i++) {
    await seek(i / fps);
    const buf = await stage.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`bingkai ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('siap:', out);
})();
