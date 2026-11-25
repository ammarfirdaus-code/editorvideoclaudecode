#!/usr/bin/env node
/* Writes the sound-effect cue list the scene engine produced. Usage: node build/export_sfx.js <main|reel> <out.json> */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [kind, out] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?kind=' + kind);
  await p.evaluate(() => window.ready);
  const d = await p.evaluate(() => ({ sfx: window.SFX, duration: DATA.duration }));
  fs.writeFileSync(out, JSON.stringify(d));
  console.log(kind, d.sfx.length, 'cues');
  await b.close();
})();
