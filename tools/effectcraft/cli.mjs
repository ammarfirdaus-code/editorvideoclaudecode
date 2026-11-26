#!/usr/bin/env node
// Usage:
//   node tools/effectcraft/cli.mjs list
//   node tools/effectcraft/cli.mjs apply in.mp4 out.mp4 --fx zoom-punch:1.2,vignette,grain [--print]
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildFilter, presets } from './index.mjs';

function probe(file) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file],
    { encoding: 'utf8' },
  );
  if (r.error || r.status !== 0) {
    throw new Error(`ffprobe failed on "${file}": ${r.error?.message ?? r.stderr.trim()}`);
  }
  const info = JSON.parse(r.stdout);
  const s = info.streams?.[0];
  if (!s) throw new Error(`no video stream in "${file}"`);
  return { width: s.width, height: s.height, duration: Number(info.format?.duration) };
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === '--help') {
    console.log('Commands: list | apply <in> <out> --fx <effects> [--print]');
    return;
  }
  if (cmd === 'list') {
    for (const [name, p] of Object.entries(presets)) console.log(`${name.padEnd(10)} ${p.help}`);
    return;
  }
  if (cmd !== 'apply') throw new Error(`unknown command "${cmd}"`);
  const [input, output, ...flags] = rest;
  if (!input || !output) throw new Error('usage: apply <in> <out> --fx <effects> [--print]');
  let fx;
  let printOnly = false;
  for (let i = 0; i < flags.length; i++) {
    if (flags[i] === '--fx') fx = flags[++i];
    else if (flags[i] === '--print') printOnly = true;
    else throw new Error(`unexpected argument "${flags[i]}"`);
  }
  if (!fx) throw new Error('--fx is required');
  const filter = buildFilter(fx, probe(input));
  const args = ['-y', '-i', input, '-vf', filter, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'copy', output];
  if (printOnly) {
    console.log(['ffmpeg', ...args.map((a) => (/[^\w./:=-]/.test(a) ? `'${a}'` : a))].join(' '));
    return;
  }
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`effectcraft: ${e.message}`);
    process.exit(1);
  }
}
