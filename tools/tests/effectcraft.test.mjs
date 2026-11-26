import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFilter, presets } from '../effectcraft/index.mjs';

const ctx = { width: 1280, height: 720, duration: 10 };
const cli = join(dirname(fileURLToPath(import.meta.url)), '../effectcraft/cli.mjs');

test('chains effects with arguments', () => {
  const f = buildFilter('zoom-punch:1.2,vignette,grain:8', ctx);
  assert.equal(f, 'crop=iw/1.2:ih/1.2,scale=1280:720,vignette=angle=0.6,noise=alls=8:allf=t+u');
});

test('fade-out starts relative to clip duration', () => {
  assert.equal(buildFilter('fade-out:2', ctx), 'fade=t=out:st=8.000:d=2');
});

test('unknown effect lists the available ones', () => {
  assert.throws(() => buildFilter('nope', ctx), /unknown effect "nope".*zoom-punch/);
});

test('bad arguments are rejected', () => {
  assert.throws(() => buildFilter('zoom-punch:0.5', ctx), /zoom must be >= 1/);
  assert.throws(() => buildFilter('grain:abc', ctx), /strength must be a number/);
  assert.throws(() => buildFilter('shake:0.9', ctx), /intensity/);
  assert.throws(() => buildFilter('', ctx), /no effects/);
});

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

test('every preset renders a real clip with ffmpeg', { skip: !hasFfmpeg && 'ffmpeg not installed' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'effectcraft-'));
  const src = join(dir, 'src.mp4');
  const gen = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=25:duration=2', '-pix_fmt', 'yuv420p', src]);
  assert.equal(gen.status, 0);
  for (const name of Object.keys(presets)) {
    const out = join(dir, `${name}.mp4`);
    const r = spawnSync('node', [cli, 'apply', src, out, '--fx', name], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${name}: ${r.stderr.slice(-300)}`);
    assert.ok(existsSync(out), name);
  }
});
