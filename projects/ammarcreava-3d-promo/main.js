// Ammarcreava 3D promo — deterministic: everything is computed from t in seek(t).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1920, H = 1080;
export const DURATION = 27;
// scene cuts land on bar lines of the music ("Inspired", 117.45 bpm, first beat 0.07 s)
const BEAT = 60 / 117.45, B0 = 0.07, BAR = 4 * BEAT, bar = k => B0 + k * BAR;
const WN = [0, bar(2), bar(4), bar(5), bar(6), bar(7), bar(8), bar(9.25), bar(9.5), bar(10.5), bar(10.5) + 1.1, 27],
      WO = [0, 3.4, 7.2, 8.5, 9.8, 11.0, 12.2, 14.7, 15.2, 16.75, 17.5, 18];
let TN = 0;
function bp(div = 1, dec = .12) { const p = BEAT * div; const ph = (((TN - B0) % p) + p) % p; return Math.exp(-ph / dec); }
function warp(t) { for (let i = 1; i < WN.length; i++) if (t <= WN[i]) return WO[i - 1] + (WO[i] - WO[i - 1]) * (t - WN[i - 1]) / (WN[i] - WN[i - 1]); return 18; }
const P = '#5B2DFF', P2 = '#7A4DFF', K = '#FF4D88', K2 = '#FFB3E6';

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const ei = x => x * x * x;
const back = x => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mix = (a, b, x) => a + (b - a) * x;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const $ = id => document.getElementById(id);

await document.fonts.load('800 100px Montserrat');
await document.fonts.load('700 100px Montserrat');
await document.fonts.load('600 100px Inter');
await document.fonts.ready;
const loadImg = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
const COVERS = {};
for (const k of ['dokumentari', '67-prompt', 'satu-ayat', 'rakam-suara', 'komik', 'kinetik']) COVERS[k] = await loadImg(`assets/cover-${k}.jpg`);
const COVER = COVERS.dokumentari;
const EBOOK = { dokumentari: ['Buat Video Dokumentari', '27 muka  •  6 langkah'], '67-prompt': ['67 Prompt Video Claude', '146 muka  •  67 prompt'],
  'satu-ayat': ['Satu Ayat, Satu Video', 'Panduan + 4 fail skill'], 'rakam-suara': ['Rakam Suara, Jadi Video', 'Panduan + fail skill'],
  komik: ['Video Cerita Komik', 'Panduan + fail skill'], kinetik: ['Video Promo Kinetik', 'Panduan + fail skill'] };
const NAVY = '#23256A', LIME = '#C9C2FF';

const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function lgrad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }

function makeScene(bg) {
  const s = new THREE.Scene(); s.background = new THREE.Color(bg); s.environment = envTex;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 6); s.add(key);
  s.add(new THREE.AmbientLight(0xffffff, 0.35));
  return s;
}

// ---------- shared materials / textures ----------
const metal = new THREE.MeshPhysicalMaterial({ color: 0x3a3a44, metalness: 0.9, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
const silver = new THREE.MeshPhysicalMaterial({ color: 0xc9c9d2, metalness: 0.95, roughness: 0.3 });
const whitePlastic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.6 });
const bubbleMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 0.15, roughness: 0, ior: 1.2, iridescence: 1, iridescenceIOR: 1.4, transparent: true, opacity: 1, envMapIntensity: 1.6 });

function screenTex(variant, key = 'dokumentari') {
  const IMG = COVERS[key], [TT, SUB] = EBOOK[key];
  return canvasTex(512, 1100, (g, w, h) => {
    g.save(); rr(g, 0, 0, w, h, 70); g.clip();
    g.fillStyle = lgrad(g, 0, 0, 0, h, [[0, '#2A2468'], [1, NAVY]]); g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '600 26px Inter'; g.textAlign = 'left'; g.fillText('10:00', 52, 62);
    g.textAlign = 'center'; g.font = '600 24px Inter'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('Ebook PDF', w / 2, 128);
    const cw = 400, ch = cw * IMG.height / IMG.width, cx = (w - cw) / 2, cy = 150;
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
    g.fillStyle = '#000'; g.fillRect(cx, cy, cw, ch); g.shadowColor = 'transparent';
    g.drawImage(IMG, cx, cy, cw, ch);
    g.fillStyle = '#fff'; g.font = '800 32px Montserrat'; g.fillText(TT, w / 2, cy + ch + 62);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '500 24px Inter'; g.fillText(SUB, w / 2, cy + ch + 100);
    g.fillStyle = LIME; rr(g, 96, cy + ch + 130, w - 192, 70, 35); g.fill();
    g.fillStyle = NAVY; g.font = '700 28px Montserrat'; g.fillText(variant === 'b' ? 'Baca sekarang' : 'Dapatkan ebook', w / 2, cy + ch + 175);
    g.restore();
  });
}
function makeBook(s = 1, key = 'dokumentari') {
  const IMG = COVERS[key];
  // sample the cover's edge colour for spine / back
  const sc = document.createElement('canvas'); sc.width = sc.height = 8; const sg = sc.getContext('2d'); sg.drawImage(IMG, 0, IMG.height * .45, 30, IMG.height * .1, 0, 0, 8, 8);
  const [cr, cg, cb] = sg.getImageData(2, 4, 1, 1).data; const edge = `rgb(${cr},${cg},${cb})`;
  const Wd = 1.41, Hd = Wd * IMG.height / IMG.width, T = .17, bd = .014, oh = .022;
  const coverT = canvasTex(IMG.width, IMG.height, g => g.drawImage(IMG, 0, 0));
  const pageEdge = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(80,70,60,${.05 + ((x * 7) % 5) * .012})`; g.fillRect(x, 0, 1, h); } });
  const pageTop = canvasTex(512, 64, (g, w, h) => { g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(80,70,60,${.05 + ((y * 7) % 5) * .012})`; g.fillRect(0, y, w, 1); } });
  const spineT = canvasTex(1024, 128, (g, w, h) => { g.fillStyle = edge; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, h * .2, w, 2); g.fillRect(0, h * .8, w, 2);
    g.fillStyle = '#fff'; g.font = '800 46px Montserrat'; g.textBaseline = 'middle'; g.fillText(EBOOK[key][0].toUpperCase(), 70, h / 2 + 2); g.font = '700 30px Montserrat'; g.textAlign = 'right'; g.fillText('AMMARCREAVA', w - 60, h / 2 + 2); });
  const edgeM = new THREE.MeshPhysicalMaterial({ color: edge, roughness: .5, clearcoat: .4 });
  const innerM = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .9 });
  const front = new THREE.Mesh(new THREE.BoxGeometry(Wd + oh, Hd + oh * 2, bd), [edgeM, edgeM, edgeM, edgeM, new THREE.MeshPhysicalMaterial({ map: coverT, roughness: .38, clearcoat: .8, clearcoatRoughness: .2 }), innerM]);
  front.position.set(oh / 2, 0, T / 2 + bd / 2);
  const backB = new THREE.Mesh(new THREE.BoxGeometry(Wd + oh, Hd + oh * 2, bd), [edgeM, edgeM, edgeM, edgeM, innerM, edgeM]);
  backB.position.set(oh / 2, 0, -T / 2 - bd / 2);
  const pm = new THREE.MeshStandardMaterial({ map: pageEdge, roughness: .95 }), pt = new THREE.MeshStandardMaterial({ map: pageTop, roughness: .95 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(Wd - .01, Hd, T), [pm, pm, pt, pt, innerM, innerM]); block.position.x = .005;
  // rounded spine: half cylinder wrapping the left edge
  const r = T / 2 + bd;
  const spineGeo = new THREE.CylinderGeometry(r, r, Hd + oh * 2, 32, 1, true, Math.PI, Math.PI);
  const spine = new THREE.Mesh(spineGeo, new THREE.MeshPhysicalMaterial({ map: spineT, roughness: .45, clearcoat: .6, side: THREE.DoubleSide }));
  spine.position.x = -Wd / 2 + .01; spine.scale.x = .55;
  spineT.rotation = Math.PI / 2; spineT.center.set(.5, .5);
  const grp = new THREE.Group(); grp.add(front, backB, block, spine);
  grp.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  grp.scale.setScalar(s); grp.userData.H = Hd; return grp;
}
function makePhone(color = metal, variant = 'a', key = 'dokumentari') {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.6, 3.3, 0.17, 6, 0.24), color); grp.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 3.18), new THREE.MeshBasicMaterial({ map: screenTex(variant, key), transparent: true, toneMapped: false }));
  scr.position.z = 0.0865; grp.add(scr);
  const isl = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.12, 0.01, 3, 0.05), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  isl.position.set(0, 1.42, 0.09); grp.add(isl);
  // back camera bump
  const bump = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.62, 0.06, 4, 0.14), color); bump.position.set(-0.36, 1.18, -0.1); grp.add(bump);
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0a12, metalness: .5, roughness: .05, clearcoat: 1 });
  [[-0.5, 1.32], [-0.22, 1.04]].forEach(([x, y]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 32), lensMat); l.rotation.x = Math.PI / 2; l.position.set(x, y, -0.14); grp.add(l); });
  return grp;
}
function makeLaptop() {
  const grp = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.12, 2.3, 4, 0.05), silver); grp.add(base);
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.0), new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: .8 }));
  kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.061, -0.3); grp.add(kb);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshStandardMaterial({ color: 0xb8b8c2, roughness: .5, metalness: .6 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.062, 0.65); grp.add(pad);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.06, -1.15); grp.add(hinge);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(3.4, 2.25, 0.07, 4, 0.04), silver); lid.position.set(0, 1.125, 0); hinge.add(lid);
  const st = canvasTex(1024, 660, (g, w, h) => {
    g.fillStyle = '#0b0b10'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2A2468'; g.fillRect(16, 16, w - 32, h - 32);
    const ch = h - 90, cw = ch * COVER.width / COVER.height; g.drawImage(COVER, 60, 45, cw, ch);
    g.fillStyle = '#f7f6fb'; g.fillRect(90 + cw, 45, w - 150 - cw, ch);
    const x0 = 120 + cw; g.fillStyle = '#7A4DFF'; g.font = '700 22px Inter'; g.fillText('LANGKAH 1 • BRIEF & SKRIP', x0, 100);
    g.fillStyle = '#15131F'; g.font = '800 38px Montserrat'; g.fillText('Sejarah 75 tahun,', x0, 156); g.fillText('video 6 minit.', x0, 200);
    g.fillStyle = '#1E1B4A'; rr(g, x0, 232, w - x0 - 90, 250, 16); g.fill();
    g.font = '500 19px monospace'; ['Buat video dokumentari', '1 minit tentang', '[SEJARAH KAMPUNG SAYA].', 'Cari fakta, tulis skrip,', 'kemudian bina video.'].forEach((l, i) => { g.fillStyle = i % 2 ? '#C5E84A' : '#fff'; g.fillText(l, x0 + 22, 274 + i * 42); });
    g.fillStyle = LIME; rr(g, x0, 512, 200, 54, 27); g.fill(); g.fillStyle = NAVY; g.font = '700 22px Inter'; g.fillText('Salin prompt', x0 + 30, 546);
  });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.25, 2.1), new THREE.MeshBasicMaterial({ map: st, toneMapped: false }));
  scr.position.set(0, 1.125, 0.037); hinge.add(scr);
  grp.userData.hinge = hinge;
  return grp;
}
function knitTex(color) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) {
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 12); g.lineTo(x + 16, y); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 8, y + 16); g.lineTo(x + 16, y + 4); g.stroke();
    }
  });
}
function knitBall(color, r) {
  const t = knitTex(color); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3);
  const m = new THREE.MeshPhysicalMaterial({ map: t, bumpMap: t, bumpScale: 3, roughness: 1, sheen: 1, sheenRoughness: .6, sheenColor: new THREE.Color(0xffffff) });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), m);
}
function giftBox(wrap, ribbon, s = 1) {
  const g = new THREE.Group();
  const wm = new THREE.MeshPhysicalMaterial({ color: wrap, roughness: .45, clearcoat: .5 });
  const rm = new THREE.MeshPhysicalMaterial({ color: ribbon, roughness: .25, metalness: .3, clearcoat: 1 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(1, .9, 1, 4, .04), wm); g.add(box);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(1.08, .22, 1.08, 4, .04), wm); lid.position.y = .5; g.add(lid);
  [[1.1, .02, .16], [.16, .02, 1.1]].forEach(([a, b, c]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(a, 1.18, c), rm); r.position.y = .07; g.add(r); });
  for (let i = 0; i < 2; i++) { const loop = new THREE.Mesh(new THREE.TorusGeometry(.16, .045, 12, 32), rm); loop.position.set(i ? .14 : -.14, .74, 0); loop.rotation.set(0, 0, i ? -.6 : .6); g.add(loop); }
  g.scale.setScalar(s); return g;
}


// ---------- icon set (drawn, no external assets) ----------
const ICON_BG = { claude: ['#E08A66', '#C96442'], ai: [P, K], film: ['#3D3FA0', '#23256A'], mic: ['#FF6FA3', K], photo: ['#FF9A5C', '#FF7A45'],
  music: ['#9A78FF', P2], code: ['#3a3850', '#1d1b28'], globe: ['#5C8BFF', '#3A6BFF'], wave: ['#2ED3A4', '#13B98A'], check: ['#2ED3A4', '#13B98A'],
  script: ['#7A5CFF', P], map: ['#FF9A5C', '#FF7A45'], play: ['#FF6FA3', K] };
function drawIcon(g, kind, cx, cy, s, col = '#fff') {
  g.save(); g.translate(cx, cy); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = s * .075; g.lineCap = 'round'; g.lineJoin = 'round';
  const L = s / 2;
  if (kind === 'claude') {
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + .13, len = (i % 2 ? .66 : .9) * L * (1 - (i % 3) * .06), wd = s * .055;
      g.save(); g.rotate(a); g.beginPath(); g.moveTo(-wd, 0); g.lineTo(0, -len); g.lineTo(wd, 0); g.closePath(); g.fill(); g.beginPath(); g.arc(0, -len + wd * .4, wd * .55, 0, Math.PI * 2); g.fill(); g.restore(); }
    g.beginPath(); g.arc(0, 0, s * .1, 0, Math.PI * 2); g.fill();
  } else if (kind === 'ai') { g.font = `800 ${s * .5}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AI', 0, s * .03);
    [[-.38, -.38], [.38, .38]].forEach(([x, y]) => { g.beginPath(); g.arc(x * L * 1.6, y * L * 1.6, s * .035, 0, 7); g.fill(); });
  } else if (kind === 'film') { rr(g, -L * .8, -L * .25, L * 1.6, L * 1.05, s * .06); g.stroke();
    g.save(); g.translate(-L * .8, -L * .35); g.rotate(-.28); rr(g, 0, -L * .32, L * 1.6, L * .32, s * .04); g.stroke();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(L * (.2 + i * .38), -L * .32); g.lineTo(L * (.4 + i * .38), 0); g.stroke(); } g.restore();
  } else if (kind === 'mic') { rr(g, -L * .28, -L * .78, L * .56, L * .98, L * .28); g.fill();
    g.beginPath(); g.arc(0, -L * .15, L * .5, .15 * Math.PI, .85 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(0, L * .36); g.lineTo(0, L * .7); g.moveTo(-L * .3, L * .7); g.lineTo(L * .3, L * .7); g.stroke();
  } else if (kind === 'photo') { rr(g, -L * .8, -L * .6, L * 1.6, L * 1.2, s * .07); g.stroke();
    g.beginPath(); g.moveTo(-L * .6, L * .4); g.lineTo(-L * .15, -L * .1); g.lineTo(L * .15, L * .2); g.lineTo(L * .35, 0); g.lineTo(L * .6, L * .4); g.closePath(); g.fill();
    g.beginPath(); g.arc(L * .35, -L * .3, L * .14, 0, 7); g.fill();
  } else if (kind === 'music') { g.beginPath(); g.moveTo(-L * .3, L * .45); g.lineTo(-L * .3, -L * .55); g.lineTo(L * .5, -L * .75); g.lineTo(L * .5, L * .3); g.stroke(); g.beginPath(); g.moveTo(-L * .3, -L * .3); g.lineTo(L * .5, -L * .5); g.stroke();
    [[-L * .5, L * .48], [L * .3, L * .33]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, L * .24, L * .18, -.4, 0, 7); g.fill(); });
  } else if (kind === 'code') { g.font = `800 ${s * .44}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('</>', 0, s * .02);
  } else if (kind === 'globe') { g.beginPath(); g.arc(0, 0, L * .72, 0, 7); g.stroke(); g.beginPath(); g.ellipse(0, 0, L * .32, L * .72, 0, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(-L * .72, 0); g.lineTo(L * .72, 0); g.moveTo(-L * .62, -L * .36); g.lineTo(L * .62, -L * .36); g.moveTo(-L * .62, L * .36); g.lineTo(L * .62, L * .36); g.stroke();
  } else if (kind === 'wave') { [.3, .7, 1, .55, .85, .4, .2].forEach((h, i) => { const x = (i - 3) * L * .26; g.beginPath(); g.moveTo(x, -h * L * .7); g.lineTo(x, h * L * .7); g.stroke(); });
  } else if (kind === 'check') { g.lineWidth = s * .11; g.beginPath(); g.moveTo(-L * .55, 0); g.lineTo(-L * .12, L * .42); g.lineTo(L * .6, -L * .45); g.stroke();
  } else if (kind === 'script') { rr(g, -L * .55, -L * .75, L * 1.1, L * 1.5, s * .06); g.stroke(); [-.4, -.1, .2].forEach((y, i) => { g.beginPath(); g.moveTo(-L * .3, y * L); g.lineTo(L * (i === 2 ? .05 : .3), y * L); g.stroke(); });
  } else if (kind === 'map') { g.beginPath(); g.arc(0, -L * .2, L * .45, Math.PI * .85, Math.PI * 2.15); g.lineTo(0, L * .75); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(0, -L * .2, L * .17, 0, 7); g.fill();
  } else if (kind === 'play') { g.beginPath(); g.moveTo(-L * .35, -L * .5); g.lineTo(L * .55, 0); g.lineTo(-L * .35, L * .5); g.closePath(); g.fill(); }
  g.restore();
}
function iconCanvas(kind, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const [a, b] = ICON_BG[kind]; g.fillStyle = lgrad(g, 0, 0, size, size, [[0, a], [1, b]]); rr(g, 0, 0, size, size, size * .24); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, 0, 0, size, size * .5, size * .24); g.fill();
  drawIcon(g, kind, size / 2, size / 2, size * .58); return c;
}
function iconTex(kind) { const tx = new THREE.CanvasTexture(iconCanvas(kind)); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx; }
function iconTile(kind, s = 1) {
  const grp = new THREE.Group();
  const [a] = ICON_BG[kind];
  grp.add(new THREE.Mesh(new RoundedBoxGeometry(.8, .8, .18, 5, .17), new THREE.MeshPhysicalMaterial({ color: a, roughness: .25, clearcoat: 1, clearcoatRoughness: .05 })));
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(.78, .78), new THREE.MeshBasicMaterial({ map: iconTex(kind), transparent: true, toneMapped: false })); pl.position.z = .092; grp.add(pl);
  grp.scale.setScalar(s); return grp;
}
window.__iconData = Object.fromEntries(Object.keys(ICON_BG).map(k => [k, iconCanvas(k, 160).toDataURL()]));

// ======================= SCENE 1: phone + "Hai AI..." + flying key tiles =======================
const s1 = makeScene('#ECEBF2');
const c1 = new THREE.PerspectiveCamera(32, W / H, .1, 100);
const phone1 = makePhone(metal, 'a'); s1.add(phone1);
const tiles = [];
{
  const letters = ['@claude', 'D', 'o', '@ai', 'k', 'u', '@film', 'm', 'e', '@mic', 'n', 't', '@photo', 'a', 'r', '@music', 'i', '@globe'];
  const R = rng(7);
  letters.forEach((ch, i) => {
    let grp;
    if (ch[0] === '@') { grp = new THREE.Group(); grp.add(iconTile(ch.slice(1), .78)); } else {
    grp = new THREE.Group();
    const tint = [0xffffff, 0xffffff, 0xf4eeff, 0xffeef5][i % 4];
    grp.add(new THREE.Mesh(new RoundedBoxGeometry(.5, .5, .16, 4, .09), new THREE.MeshPhysicalMaterial({ color: tint, roughness: .3, clearcoat: 1, transmission: .25, thickness: .3 })));
    const lt = canvasTex(128, 128, (g) => { g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = i % 5 === 0 ? P : (i % 5 === 3 ? K : '#1d1b28'); g.font = '700 74px Montserrat'; g.fillText(ch, 64, 70); });
    const lp = new THREE.Mesh(new THREE.PlaneGeometry(.42, .42), new THREE.MeshBasicMaterial({ map: lt, transparent: true })); lp.position.z = .082; grp.add(lp); }
    const ang = (i / letters.length) * Math.PI * 2 + R() * .3;
    const rad = 1.6 + R() * 1.3;
    grp.userData = { tx: Math.cos(ang) * rad * 1.25, ty: Math.sin(ang) * rad * .75 + .5, tz: .6 + R() * 1.4, rx: (R() - .5) * 1.2, ry: (R() - .5) * 1.4, rz: (R() - .5) * .8, d: R() * .35, sp: .5 + R() };
    grp.scale.setScalar(.001); s1.add(grp); tiles.push(grp);
  });
}
function seek1(t) {
  // phone rises in a hand-held style tilt
  const up = eo(lin(t, 0, 1.2));
  phone1.position.set(mix(.3, 0, up), mix(-3.4, -.75, up) + Math.sin(t * 1.6) * .03, 0);
  phone1.rotation.set(mix(.35, .12, up) - lin(t, 2.6, 3.4) * .2, mix(-.5, -.18, up) + Math.sin(t * .9) * .05, mix(.1, .03, up));
  c1.position.set(0, .2, mix(7.6, 6.7, eio(lin(t, 0, 3.4))) - ei(lin(t, 2.8, 3.4)) * 3);
  c1.lookAt(0, -.1, 0);
  phone1.scale.setScalar(1 + .018 * bp(4, .18));
  tiles.forEach(o => {
    const u = o.userData; const k = eo(lin(t, 1.0 + u.d, 1.8 + u.d));
    const fly = ei(lin(t, 2.75 + u.d * .3, 3.4));
    o.scale.setScalar(Math.max(.001, back(clamp(k)) * (1 - fly * .2) * (1 + .09 * bp())));
    o.position.set(u.tx * k * (1 + fly * 1.5), mix(-.8, u.ty, k) + Math.sin(t * 2 * u.sp + u.d * 9) * .08 + fly * u.ty, mix(0, u.tz, k) + fly * 6);
    o.rotation.set(u.rx + t * .3 * u.sp, u.ry + Math.sin(t + u.d) * .3, u.rz);
  });
}

// ======================= SCENE 2: fly-through tunnel of service cards =======================
const s2 = makeScene('#E7E3F7');
s2.fog = new THREE.Fog(0xE7E3F7, 8, 34);
const c2 = new THREE.PerspectiveCamera(50, W / H, .1, 100);
const services = [
  ['Brief & Skrip', 'script', P], ['Fakta Web', 'globe', '#3A6BFF'], ['Gambar Arkib', 'photo', '#FF7A45'], ['Suara AI', 'mic', K],
  ['Whisper', 'wave', '#13B98A'], ['Peta & Babak', 'map', '#FF7A45'], ['Muzik & SFX', 'music', P2], ['Semak Fakta', 'check', '#13B98A'],
  ['MP4 16:9', 'film', '#23256A'], ['Reels 9:16', 'play', K], ['14 Prompt', 'ai', P], ['Claude Code', 'claude', '#C96442'],
];
const serviceTex = services.map(([label, icon, col]) => canvasTex(512, 384, (g, w, h) => {
  g.fillStyle = '#fff'; rr(g, 0, 0, w, h, 40); g.fill();
  g.drawImage(iconCanvas(icon, 128), 36, 36, 128, 128);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#1d1b28'; g.font = '800 52px Montserrat'; g.fillText(label, 36, 260);
  g.fillStyle = '#e6e3f0'; rr(g, 36, 296, 300, 18, 9); g.fill(); rr(g, 36, 330, 200, 18, 9); g.fill();
}));
const cards = [];
{
  const R = rng(21);
  for (let i = 0; i < 70; i++) {
    const idx = i % services.length; const col = new THREE.Color(services[idx][2]);
    const grp = new THREE.Group();
    const back = new THREE.Mesh(new RoundedBoxGeometry(1.62, 1.24, .08, 3, .05), new THREE.MeshPhysicalMaterial({ color: col, roughness: .3, clearcoat: 1, transmission: .35, thickness: .4 }));
    back.position.z = -.05; grp.add(back);
    grp.add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: serviceTex[idx], transparent: true })));
    const a = R() * Math.PI * 2, rad = 2.3 + R() * 2.6;
    grp.position.set(Math.cos(a) * rad * 1.5, Math.sin(a) * rad, -2 - i * .55 - R() * .4);
    grp.rotation.set((R() - .5) * .9, (R() - .5) * 1.4 - Math.cos(a) * .5, (R() - .5) * .6);
    grp.userData.sp = (R() - .5) * .5; grp.userData.r0 = grp.rotation.clone();
    s2.add(grp); cards.push(grp);
  }
}
// sparkle bokeh
const sparkTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
function sparkles(n, seed, spread, z0, z1, size) {
  const R = rng(seed), pos = new Float32Array(n * 3), colA = new Float32Array(n * 3);
  const pal = [new THREE.Color('#ffffff'), new THREE.Color(K2), new THREE.Color('#9db4ff'), new THREE.Color('#c6a8ff')];
  for (let i = 0; i < n; i++) { pos[i * 3] = (R() - .5) * spread * 1.6; pos[i * 3 + 1] = (R() - .5) * spread; pos[i * 3 + 2] = mix(z0, z1, R()); pal[i % 4].toArray(colA, i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ size, map: sparkTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
}
const sp2 = sparkles(1800, 5, 16, 4, -45, .14); s2.add(sp2);
function seek2(t) {
  const u = lin(t, 3.4, 7.2);
  const z = mix(6, -26, eio(u) * .85 + u * .15);
  c2.position.set(Math.sin(u * 3) * .4, Math.cos(u * 2.4) * .25, z);
  c2.rotation.set(0, 0, 0);
  c2.rotateZ(Math.sin(u * 2.2) * .12 - ei(lin(t, 6.4, 7.2)) * .5);
  cards.forEach((c, i) => { const r = c.userData.r0; c.rotation.set(r.x + t * c.userData.sp * .4, r.y + Math.sin(t * .8 + i) * .1, r.z); });
  sp2.material.size = .12 + .05 * bp();
  c2.fov = 50 - 3.5 * bp(4, .2); c2.updateProjectionMatrix();
}

// ======================= SCENE 3: studio with knit balls, bubbles, products =======================
const s3 = makeScene('#E9E8EE');
const c3 = new THREE.PerspectiveCamera(35, W / H, .1, 100);
const balls = [
  knitBall('#7A4DFF', 1.5), knitBall('#FF4D88', 1.1), knitBall('#D9D6E3', 1.7), knitBall('#B79CFF', .9), knitBall('#FFB3E6', 1.2),
];
const ballBase = [[-5.6, -2.6, -1.5], [5.4, 2.7, -2], [-5.2, 2.9, -3.5], [4.6, -3.0, 0], [6.3, -.2, -4.5]];
balls.forEach(b => s3.add(b));
const bubbles = []; { const R = rng(3); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.22 + R() * .25, 48, 32), bubbleMat); b.userData = { x: (R() - .5) * 10, y: (R() - .5) * 5.4, z: R() * 2 - .5, p: R() * 6 }; s3.add(b); bubbles.push(b); } }
const cube = new THREE.Mesh(new RoundedBoxGeometry(.9, .9, .9, 5, .25), new THREE.MeshPhysicalMaterial({ color: K2, roughness: .9, sheen: 1, sheenColor: new THREE.Color(0xffffff) })); s3.add(cube);
const floatIcons = [['claude', -3.7, 1.9, 1.2, 1.0], ['ai', 3.9, 1.6, 1.0, .9], ['film', -4.0, -1.0, 1.6, .8], ['mic', 2.6, -2.4, 2.0, .7], ['music', -1.8, 2.9, .2, .65], ['globe', 1.8, 2.9, -.6, .6], ['wave', 4.6, -.6, -1.2, .7], ['photo', -2.4, -2.9, .8, .7]]
  .map(([k, x, y, z, sc], i) => { const o = iconTile(k, sc); o.userData = { x, y, z, p: i * 1.7, sc }; s3.add(o); return o; });
// hero A: gifts
const gifts = new THREE.Group(); gifts.scale.setScalar(1.3); s3.add(gifts);
const gA = makeBook(1.3, 'dokumentari'), gB = makeBook(.82, '67-prompt'), gC = makeBook(.8, 'satu-ayat'), gD = makeBook(.62, 'rakam-suara'), gE = makeBook(.62, 'komik');
gA.position.set(-.1, 0, .6); gB.position.set(2.15, .4, -1.0); gC.position.set(-2.2, -.4, -.8); gD.position.set(3.4, -1.0, -2.2); gE.position.set(-3.3, 1.2, -2.4); gifts.add(gA, gB, gC, gD, gE);
// hero B: laptop
const laptop = makeLaptop(); laptop.scale.setScalar(1.2); s3.add(laptop);
// hero C: fanned phones
const phones = new THREE.Group(); phones.scale.setScalar(1.15); s3.add(phones);
const pmA = new THREE.MeshPhysicalMaterial({ color: 0x6a3cff, metalness: .8, roughness: .3, clearcoat: 1 });
const pmB = new THREE.MeshPhysicalMaterial({ color: 0xff4d88, metalness: .7, roughness: .3, clearcoat: 1 });
const ph1 = makePhone(pmA, 'b', '67-prompt'), ph2 = makePhone(metal, 'a', 'dokumentari'), ph3 = makePhone(pmB, 'b', 'satu-ayat');
[ph1, ph2, ph3].forEach((p, i) => { p.position.set((i - 1) * .9, (i === 1 ? .25 : 0), i === 1 ? .55 : 0); p.rotation.set(0, .25 - i * .12, (1 - i) * .22); phones.add(p); });
// hero D: class — floating board with AI chip
const klass = new THREE.Group(); klass.scale.setScalar(1.15); s3.add(klass);
{
  const board = new THREE.Mesh(new RoundedBoxGeometry(3.0, 1.9, .1, 4, .08), whitePlastic); klass.add(board);
  const bt = canvasTex(900, 570, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.fillStyle = lgrad(g, 0, 0, w, h, [[0, '#F1ECFF'], [1, '#FFE8F2']]); rr(g, 30, 30, w - 60, h - 60, 30); g.fill();
    g.fillStyle = '#1d1b28'; g.font = '800 64px Montserrat'; g.fillText('Skrip → Video', 70, 140);
    [[200, P, 520], [260, K, 640], [320, P2, 420], [380, '#3A6BFF', 580]].forEach(([y, c, wd]) => { g.fillStyle = c; rr(g, 70, y, 22, 22, 11); g.fill(); g.fillStyle = '#d9d3ee'; rr(g, 112, y + 2, wd, 18, 9); g.fill(); });
    g.fillStyle = lgrad(g, 0, 0, w, 0, [[0, P], [1, K]]); rr(g, 70, 450, 260, 64, 32); g.fill(); g.fillStyle = '#fff'; g.font = '600 30px Inter'; g.fillText('Render MP4', 112, 492);
  });
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.84), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false })); bp.position.z = .052; klass.add(bp);
  const chip = new THREE.Mesh(new RoundedBoxGeometry(.9, .9, .22, 5, .1), new THREE.MeshPhysicalMaterial({ color: 0x5B2DFF, metalness: .4, roughness: .25, clearcoat: 1 }));
  chip.position.set(1.5, .9, .5); klass.add(chip);
  const ct = canvasTex(256, 256, g => { g.fillStyle = '#fff'; g.font = '800 120px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AI', 128, 136); });
  const cp = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), new THREE.MeshBasicMaterial({ map: ct, transparent: true })); cp.position.set(1.5, .9, .615); klass.add(cp);
  klass.userData.chip = [chip, cp];
}
// shadow blob
const blobTex = canvasTex(256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(40,20,90,.35)'); gr.addColorStop(1, 'rgba(40,20,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });

const v = new THREE.Vector3();
function project(obj, off, cam) { v.copy(off); obj.localToWorld(v); v.project(cam); return [(v.x * .5 + .5) * W, (-v.y * .5 + .5) * H]; }
function heroIO(t, a, b) { // 0..1 in, 1 hold, then out to 2
  const i = eo(lin(t, a, a + .55)); const o = ei(lin(t, b - .45, b)); return [i, o];
}
const S3A = 7.2, S3C = 8.5, S3B = 9.8, S3D = 11.0, S3E = 12.2;
function seek3(t) {
  c3.position.set(Math.sin(t * .35) * .5, Math.cos(t * .3) * .2, 9.2);
  c3.lookAt(0, 0, 0);
  const k = t - S3A;
  balls.forEach((b, i) => { const [x, y, z] = ballBase[i]; b.position.set(x + Math.sin(k * .6 + i) * .15, y + Math.cos(k * .5 + i * 2) * .18 - (1 - eo(lin(t, S3A, S3A + .8))) * 2 * (i % 2 ? -1 : 1), z); b.rotation.set(k * .1 * (i + 1), k * .15, 0); });
  bubbles.forEach(b => { const u = b.userData; b.position.set(u.x + Math.sin(k * .7 + u.p) * .3, u.y + Math.cos(k * .5 + u.p) * .25 + k * .12, u.z); });
  floatIcons.forEach((o, i) => { const u = o.userData; const a = eo(lin(t, S3A + .1 + i * .06, S3A + .8 + i * .06));
    o.position.set(u.x * mix(1.6, 1, a) + Math.sin(k * .7 + u.p) * .12, u.y * mix(1.6, 1, a) + Math.cos(k * .6 + u.p) * .15, u.z);
    o.scale.setScalar(u.sc * (1 + .14 * bp(1, .1)));
    o.rotation.set(Math.sin(k * .8 + u.p) * .25, Math.sin(k * .5 + u.p) * .5 - u.x * .06, Math.sin(k * .4 + u.p) * .12); });
  balls.forEach(b => b.scale.setScalar(1 + .035 * bp(2, .15)));
  const hp = 1 + .03 * bp(4, .18); gifts.scale.setScalar(1.3 * hp); laptop.scale.setScalar(1.2 * hp); phones.scale.setScalar(1.15 * hp); klass.scale.setScalar(1.15 * hp);
  cube.position.set(3.2 + Math.sin(k) * .1, -2.4 + Math.cos(k * .8) * .15, 1.2); cube.rotation.set(k * .4, k * .6, .3);

  // gifts
  let [i, o] = heroIO(t, S3A, S3C);
  gifts.visible = t < S3C; gifts.position.set(0, mix(-6, 0, i) + o * 7, 0); gifts.rotation.set(.05, 0, 0);
  [gA, gB, gC, gD, gE].forEach((g, j) => { g.rotation.set(Math.sin(k + j) * .1, j === 0 ? mix(-2.6, -.22, eo(lin(t, S3A, S3A + 1.1))) + Math.sin(k * 1.2) * .08 : [0, -.55, .5, -.4, .45][j] + Math.sin(k + j) * .12, Math.cos(k * .8 + j) * .07); g.position.y = [0, .4, -.4, -1.0, 1.2][j] + Math.sin(k * 1.4 + j * 2) * .12; });
  // laptop
  [i, o] = heroIO(t, S3B, S3D);
  laptop.visible = t > S3B - .1 && t < S3D; laptop.position.set(mix(5, -.4, i) - o * 7, -.5 + Math.sin(k) * .08, 0);
  laptop.rotation.set(.45 - o * .2, mix(-1.2, -.35, i) - o * .6, .08);
  laptop.userData.hinge.rotation.x = mix(1.52, -0.22, eio(lin(t, S3B + .25, S3B + 1.0)));
  // phones
  [i, o] = heroIO(t, S3C, S3B);
  phones.visible = t > S3C - .1 && t < S3B; phones.position.set(.4, mix(-6, -.1, i) + o * 7, 0); phones.rotation.set(-.05, mix(-1.2, .05, i) + Math.sin(k) * .06, mix(.4, .05, i));
  [ph1, ph2, ph3].forEach((p, j) => { p.position.x = (j - 1) * mix(.2, .95, eo(lin(t, S3C + .2, S3C + .9))); });
  // class board
  [i, o] = heroIO(t, S3D, S3E + .4);
  klass.visible = t > S3D - .1; klass.position.set(mix(-5, -.6, i), -.1 + Math.sin(k * 1.2) * .08, 0); klass.rotation.set(-.12, mix(1.2, .32, i) + Math.sin(k) * .05, .02);
  klass.userData.chip.forEach(m => { m.position.y = .9 + Math.sin(k * 2) * .1; });

  // DOM cards attached to anchors
  const cardFor = (el, obj, off, a, b) => {
    const [x, y] = project(obj, off, c3); const ii = back(clamp(lin(t, a + .45, a + .9))); const oo = lin(t, b - .4, b - .1);
    el.style.opacity = clamp(lin(t, a + .45, a + .7)) * (1 - oo); el.style.transform = `translate(${x}px, ${y}px) translateY(-50%) scale(${.6 + .4 * ii})`;
  };
  cardFor($('info1'), laptop, new THREE.Vector3(2.0, .5, .6), S3B, S3D);
  cardFor($('info2'), phones, new THREE.Vector3(-4.1, -.9, 0), S3C, S3B);
  cardFor($('info3'), klass, new THREE.Vector3(1.8, -.4, 0), S3D, S3E + .5);
  // keep card 2 on left side
  const e2 = $('info2'); e2.style.transformOrigin = '100% 50%';
}

// ======================= SCENE 4: "Kami, [+ uruskan]" + gift drop =======================
const s4 = makeScene('#EEEDF3');
const c4 = new THREE.PerspectiveCamera(30, W / H, .1, 100); c4.position.set(0, 1.2, 12); c4.lookAt(0, -.4, 0);
const bigGift = makeBook(1.45, 'dokumentari'); s4.add(bigGift);
const blob4 = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob4.rotation.x = -Math.PI / 2; blob4.position.y = -2.6; s4.add(blob4);
const S4 = 12.2;
function seek4(t) {
  const d = lin(t, S4 + 1.9, S4 + 2.5);
  const BH = bigGift.userData.H * 1.45 / 2 + .03; const yb = d < 1 ? mix(9, -2.6 + BH, ei(d)) : -2.6 + BH + Math.abs(Math.sin((t - S4 - 2.5) * 9)) * .5 * Math.exp(-(t - S4 - 2.5) * 6);
  bigGift.position.set(0, yb, 0); bigGift.rotation.set(0, -.5 + (t - S4) * .2, 0);
  bigGift.visible = t > S4 + 1.8;
  blob4.material.opacity = clamp(lin(t, S4 + 2.0, S4 + 2.5)); blob4.scale.setScalar(.6 + .4 * clamp(lin(t, S4 + 2.0, S4 + 2.5)));
}

// ======================= SCENE 5: lineup + circle wipe + end card =======================
const s5 = makeScene('#ECEBF2');
const c5 = new THREE.PerspectiveCamera(30, W / H, .1, 100);
const line = new THREE.Group(); s5.add(line);
const lp = makePhone(metal, 'a'); lp.position.set(2.6, .1, .4); lp.rotation.y = -.35; line.add(lp);
const ll = makeLaptop(); ll.position.set(-2.3, -1.55, -.4); ll.rotation.y = .5; ll.userData.hinge.rotation.x = -0.22; ll.scale.setScalar(.9); line.add(ll);
const lg = makeBook(1.2, 'dokumentari'); lg.position.set(.1, -1.6 + lg.userData.H * 1.2 / 2 + .03, -.3); lg.rotation.y = .1; line.add(lg);
const lg2 = makeBook(.78, '67-prompt'); lg2.position.set(1.25, -1.6 + lg2.userData.H * .78 / 2 + .02, 1.0); lg2.rotation.y = -.35; line.add(lg2);
const lg3 = makeBook(.7, 'kinetik'); lg3.rotation.set(-Math.PI / 2, 0, .35); lg3.position.set(-.55, -1.6 + .11, 1.25); line.add(lg3);
const lg4 = makeBook(.7, 'komik'); lg4.rotation.set(-Math.PI / 2, 0, .1); lg4.position.set(-.5, -1.6 + .25, 1.2); line.add(lg4);
const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.ShadowMaterial({ opacity: .38 })); shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = -1.6; shadowFloor.receiveShadow = true; line.add(shadowFloor);
const sun5 = new THREE.DirectionalLight(0xffffff, 1.2); sun5.position.set(-4.5, 8, 1.5); sun5.castShadow = true; sun5.shadow.mapSize.set(2048, 2048);
Object.assign(sun5.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); sun5.shadow.radius = 4; sun5.shadow.bias = -.0008; s5.add(sun5);
const contactTex = canvasTex(256, 128, g => { const gr = g.createRadialGradient(128, 64, 0, 128, 64, 128); gr.addColorStop(0, 'rgba(20,10,50,.55)'); gr.addColorStop(.5, 'rgba(20,10,50,.18)'); gr.addColorStop(1, 'rgba(20,10,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); });
[[2.6, .4, 2.0, .7], [.1, -.3, 2.0, .6], [1.25, 1.0, 1.3, .5], [-.5, 1.2, 1.9, 1.2], [-2.3, -.4, 3.6, 2.4]].forEach(([x, z, w, d]) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false })); c.rotation.x = -Math.PI / 2; c.position.set(x, -1.595, z); line.add(c); });
[lp, ll].forEach(o => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }));
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: .45 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.6; line.add(floor);
const sp5 = sparkles(400, 9, 12, 3, -6, .08); s5.add(sp5);
const S5 = 15.2;
function seek5(t) {
  const u = lin(t, S5, 18);
  c5.position.set(mix(-1.6, 1.4, eio(clamp(u * 1.6))), mix(1.4, .8, u), mix(11.5, 10, u));
  c5.lookAt(mix(-.6, .5, eio(clamp(u * 1.6))), -.4, 0);
  lp.position.y = .1 + Math.sin(t * 1.5) * .05;
  line.scale.setScalar(1 + .012 * bp(4, .2));
}

// ======================= master seek =======================
const typed = (s, t, a, cps) => s.slice(0, Math.max(0, Math.floor((t - a) * cps)));
export function seek(tn) {
  TN = tn;
  const t = warp(tn);
  // pick scene
  let scene, cam;
  if (t < 3.4) { seek1(t); scene = s1; cam = c1; }
  else if (t < 7.2) { seek2(t); scene = s2; cam = c2; }
  else if (t < S4) { seek3(t); scene = s3; cam = c3; }
  else if (t < S5) { seek4(t); scene = s4; cam = c4; }
  else { seek5(t); scene = s5; cam = c5; }
  renderer.render(scene, cam);

  // ---- DOM ----
  const hai = $('hai');
  const hs = 'Hai Claude...'; const ht = typed(hs, t, .9, 13);
  const inS1 = t < 3.4;
  hai.style.display = inS1 ? '' : 'none';
  if (inS1) {
    const caret = (Math.floor(t * 3) % 2 === 0 || ht.length < hs.length) ? '<span class="caret"></span>' : '';
    hai.innerHTML = ht.replace(/^Hai (.*)$/, (m, w) => 'Hai <span class="grad">' + w.replace(/\.+$/, '') + '</span>' + (w.match(/\.+$/) || [''])[0]) + caret;
    hai.style.transform = `translateY(${-ei(lin(t, 2.9, 3.4)) * 200}px) scale(${1 + ei(lin(t, 2.9, 3.4)) * .3})`;
    hai.style.opacity = 1 - lin(t, 3.0, 3.35);
  }
  const pr = $('prompt'); const inS2 = t >= 3.4 && t < 7.2;
  pr.style.display = inS2 ? '' : 'none';
  if (inS2) {
    const q = 'Buat video dokumentari...';
    pr.querySelector('.q').textContent = typed(q, t, 4.0, 16);
    const a = back(clamp(lin(t, 3.5, 4.0))); const tilt = eio(lin(t, 6.0, 7.2));
    pr.style.opacity = clamp(lin(t, 3.5, 3.75));
    pr.style.transform = `translate(-50%,-50%) perspective(1400px) rotateX(${tilt * 28}deg) rotateZ(${-4 + tilt * 22}deg) scale(${(.7 + .3 * a) * (1 + tilt * .35)})`;
  }
  ['info1', 'info2', 'info3'].forEach(id => { $(id).style.display = (t >= 7.2 && t < S4) ? '' : 'none'; });

  const km = $('kami'); const inS4 = t >= S4 && t < S5;
  km.style.display = inS4 ? '' : 'none';
  if (inS4) {
    const k = t - S4;
    const w = km.querySelector('.w'); w.style.opacity = clamp(lin(k, .05, .3)); w.style.transform = `translateY(${(1 - eo(lin(k, 0, .45))) * 60}px) scale(${1 + .025 * bp(1, .1)})`;
    const pill = $('pill'); const pin = eo(lin(k, .35, .85)); const shrink = eio(lin(k, .9, 1.4));
    const pw = mix(900, 790, shrink);
    pill.style.width = pw + 'px'; pill.style.opacity = clamp(lin(k, .35, .6)); pill.style.transform = `translateX(${(1 - pin) * 500}px)`;
    const rect = $('pillrect'); rect.setAttribute('width', pw - 8); rect.setAttribute('height', 142); rect.setAttribute('stroke-dashoffset', -k * 60);
    const plus = pill.querySelector('.plus'); plus.style.transform = `scale(${back(clamp(lin(k, 1.1, 1.45)))}) rotate(${(1 - clamp(lin(k, 1.1, 1.5))) * -180}deg)`;
    const tx = pill.querySelector('.txt'); tx.style.opacity = clamp(lin(k, .55, .8));
    const up = eio(lin(k, 1.75, 2.3));
    km.style.transform = `translateY(${-up * 360}px) scale(${1 - up * .62})`; km.style.opacity = 1 - up * .55;
  }
  const wipe = $('wipe'), end = $('endcard');
  const wu = eio(lin(t, 16.4, 17.0));
  wipe.style.display = t >= 16.3 ? '' : 'none';
  const ws = 10 + wu * 2400; wipe.style.width = wipe.style.height = ws + 'px';
  end.style.display = t >= 16.75 ? '' : 'none';
  if (t >= 16.75) {
    const e = back(clamp(lin(t, 16.75, 17.25)));
    const ti = end.querySelector('.title'); ti.style.transform = `scale(${.75 + .25 * e})`; ti.style.opacity = clamp(lin(t, 16.75, 17.0));
    const fade = (sel, a) => { const el = end.querySelector(sel); el.style.opacity = clamp(lin(t, a, a + .3)); el.style.transform = `translateY(${(1 - eo(lin(t, a, a + .4))) * 30}px)`; };
    fade('.sub', 16.9); fade('.cta', 17.05); fade('.btn', 17.15); fade('.tag', 17.25);
    const ic = end.querySelector('.icons');
    if (!ic.children.length) ic.innerHTML = ['claude', 'ai', 'film', 'mic', 'music', 'globe'].map(k => `<img src="${window.__iconData[k]}">`).join('');
    [...ic.children].forEach((im, i) => { const q = back(clamp(lin(t, 16.95 + i * .04, 17.2 + i * .04))); im.style.transform = `scale(${q}) translateY(${-10 * bp(1, .1) * (i % 2 ? 1 : .6)}px)`; im.style.opacity = clamp(lin(t, 16.95 + i * .04, 17.05 + i * .04)); });
  }
  const cur = $('cursor'); const btn = end.querySelector('.btn');
  if (tn >= 23.0) {
    const r = btn.getBoundingClientRect(); const bx = r.left + r.width * .62, by = r.top + r.height * .55;
    const m = eio(lin(tn, 23.2, 24.35)); const cx = mix(1500, bx, m), cy = mix(1080, by, m) + Math.sin(m * Math.PI) * -60;
    const press = Math.max(0, 1 - Math.abs(tn - bar(12)) / .18);
    cur.style.opacity = clamp(lin(tn, 23.2, 23.5)) * (1 - lin(tn, 26.2, 26.6));
    cur.style.transform = `translate(${cx - 10}px, ${cy - 6}px) scale(${1 - press * .15})`;
    btn.style.transform = `translateY(0) scale(${1 - press * .05 + Math.max(0, Math.sin((tn - bar(12) - .15) * 3)) * .02 * (tn > bar(12) + .15 ? 1 : 0)})`;
    const rp = end.querySelector('.ripple'); const ru = lin(tn, bar(12), bar(12) + .75);
    rp.style.width = rp.style.height = (10 + ru * 800) + 'px'; rp.style.opacity = tn > bar(12) ? .6 * (1 - ru) : 0;
  } else cur.style.opacity = 0;
  if (t >= 16.75) end.querySelector('.arr').style.transform = `translateX(${12 * bp(1, .14)}px)`;
  // white flashes at cuts
  const flashAt = (c, w) => Math.max(0, 1 - Math.abs(t - c) / w);
  $('flash').style.opacity = Math.max(flashAt(3.4, .22), flashAt(7.2, .25) * .95, flashAt(S4, .2) * .9, flashAt(S5, .2) * .8);
}
window.seek = seek; window.DURATION = DURATION;
seek(0);
window.READY = true;
