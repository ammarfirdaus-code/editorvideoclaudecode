// Frame-accurate renderer: node render.js <themeDir> [--stills 1,5,9] [--fps 30]
// Seeks the paused GSAP timeline per frame, pipes JPEG frames to ffmpeg, then mixes VO + music.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2]);
const args = process.argv.slice(3);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const fps = args.includes('--fps') ? +args[args.indexOf('--fps') + 1] : 30;
const name = path.basename(dir);

fs.writeFileSync(path.join(dir, 'timeline.js'), 'window.TL=' + fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8') + ';');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(dir, 'index.html'));
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  const duration = await page.evaluate(() => window.DURATION);

  if (stillsArg) {
    fs.mkdirSync(path.join(dir, 'stills'), { recursive: true });
    for (const t of stillsArg.split(',').map(Number)) {
      await page.evaluate((t) => window.seek(t), t);
      await page.screenshot({ path: path.join(dir, 'stills', `t${String(t).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 80 });
    }
    await browser.close();
    console.log('stills done');
    return;
  }

  const silent = path.join(dir, 'silent.mp4');
  const remixOnly = args.includes('--remix') && fs.existsSync(silent);
  if (!remixOnly) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(fps), silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(duration * fps);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.seek(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`${name}: frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  }
  await browser.close();

  // mix: VO (delayed 0) + music ducked under VO via sidechain, loudness-normalised
  const out = path.join(dir, `ammarcreava-promo-${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', path.join(dir, 'vo.wav'), '-i', path.join(dir, 'music.wav'),
    '-filter_complex',
    '[1:a]aresample=44100,highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,volume=1.6,apad,asplit=2[vo][sc];' +
    '[2:a]volume=0.32[m];[m][sc]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=300[md];' +
    '[vo][md]amix=inputs=2:duration=shortest:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('done', out);
})();
