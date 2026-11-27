import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1280, H = 720, DUR = 28.2;
const $ = (id) => document.getElementById(id);

/* ---------- helpers ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const E = {
  lin: (t) => t,
  o3: (t) => 1 - Math.pow(1 - t, 3),
  o5: (t) => 1 - Math.pow(1 - t, 5),
  i3: (t) => t * t * t,
  io3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  sin: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
};
const k = (t, a, b, e = E.io3) => e(clamp((t - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;
const lv = (A, B, t) => A.map((v, i) => lerp(v, B[i], t));
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const C = { or: 0xf26a1b, or2: 0xff8a3d, peach: 0xf7d9c4, peach2: 0xf4c8a8, cream: 0xfbf3ea, white: 0xffffff,
  indigo: 0x3a2fa6, yellow: 0xffc93c, ink: 0x2b1d16, pink: 0xff6f91 };

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function ctex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.userData = { canvas: c, g, draw };
  return t;
}
function wrapText(g, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const w of words) { const test = line + w + ' '; if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); line = w + ' '; y += lh; } else line = test; }
  g.fillText(line, x, y); return y;
}
const imgs = {};
function loadImg(name) { return new Promise((res) => { const i = new Image(); i.onload = () => { imgs[name] = i; res(); }; i.src = 'assets/' + name; }); }
function imgTex(name) { const t = new THREE.Texture(imgs[name]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }
function drawCover(g, img, x, y, w, h) { const r = Math.max(w / img.width, h / img.height); const iw = img.width * r, ih = img.height * r; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); g.restore(); }

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });
const glossy = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, ...o });
function shadowAll(o) { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }

/* ---------- renderer ---------- */
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.LinearToneMapping; renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const composer = new EffectComposer(renderer);
const rp = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bokeh = new BokehPass(rp.scene, rp.camera, { focus: 5, aperture: 0.002, maxblur: 0.008 });
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.55, 1.0);
composer.addPass(rp); composer.addPass(bokeh); composer.addPass(new OutputPass());

function mkScene(bg, fogNear, fogFar) {
  const s = new THREE.Scene(); s.background = new THREE.Color(bg); s.environment = envTex;
  if (fogFar) s.fog = new THREE.Fog(bg, fogNear, fogFar);
  return s;
}
function warmLights(s, dir = V(-4, 9, 5), shadowSize = 8, intensity = 2.2) {
  s.add(new THREE.HemisphereLight(0xfff4ea, 0xd98a5c, 0.8));
  const d = new THREE.DirectionalLight(0xfff0dc, intensity); d.position.copy(dir); d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048); d.shadow.radius = 6; d.shadow.bias = -0.0004;
  const c = d.shadow.camera; c.left = -shadowSize; c.right = shadowSize; c.top = shadowSize; c.bottom = -shadowSize; c.near = 0.5; c.far = 40;
  s.add(d); s.add(d.target); return d;
}
function dust(s, n, box, size = 0.03, color = 0xffffff) {
  const g = new THREE.BufferGeometry(); const p = [];
  for (let i = 0; i < n; i++) p.push(box[0] + rnd() * (box[1] - box[0]), box[2] + rnd() * (box[3] - box[2]), box[4] + rnd() * (box[5] - box[4]));
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const tex = ctex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: tex, transparent: true, depthWrite: false, color, opacity: 0.8 }));
  s.add(pts); return pts;
}

/* ---------- object factories ---------- */
let FONT3D;
function text3D(str, size, depth, mat, bevel = 0.02) {
  const g = new TextGeometry(str, { font: FONT3D, size, height: depth, curveSegments: 6, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 3 });
  g.computeBoundingBox(); const bb = g.boundingBox; g.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -depth / 2);
  return new THREE.Mesh(g, mat);
}

function edgeTex() {
  return ctex(256, 64, (g, w, h) => { g.fillStyle = '#fbf6ee'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,130,110,.35)'; g.lineWidth = 1; for (let y = 2; y < h; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
}
const EDGE = () => std(0xfbf6ee, { map: edgeTex(), roughness: 0.9 });

function makeBook(coverTex, w = 1, h = 1.41, d = 0.16, spine = C.indigo) {
  const sp = std(spine, { roughness: 0.5 });
  const mats = [EDGE(), sp, EDGE(), EDGE(), std(0xffffff, { map: coverTex, roughness: 0.42 }), sp];
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.castShadow = m.receiveShadow = true; return m;
}
// open book lying in XY plane facing +Z; spine at x=0
function makeOpenBook(leftTex, rightTex, pw = 1, ph = 1.41) {
  const g = new THREE.Group();
  const block = (tex, side) => {
    const gg = new THREE.Group();
    const mats = [EDGE(), EDGE(), EDGE(), EDGE(), std(0xffffff, { map: tex, roughness: 0.75 }), std(C.indigo)];
    const m = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.06), mats); m.position.x = side * pw / 2; gg.add(m);
    gg.rotation.y = -side * 0.07; return gg;
  };
  const cover = new THREE.Mesh(new THREE.BoxGeometry(pw * 2 + 0.06, ph + 0.05, 0.02), std(C.indigo)); cover.position.z = -0.05;
  g.add(cover, block(leftTex, -1), block(rightTex, 1));
  return shadowAll(g);
}
function makeCursor(color = C.or, s = 1) {
  const sh = new THREE.Shape();
  const P = [[0, 0], [0, -1.0], [0.24, -0.78], [0.42, -1.16], [0.58, -1.09], [0.41, -0.72], [0.73, -0.72]];
  sh.moveTo(P[0][0], P[0][1]); P.slice(1).forEach((p) => sh.lineTo(p[0], p[1])); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 6, curveSegments: 4 });
  g.translate(0, 0, -0.09);
  const m = new THREE.Mesh(g, glossy(color, { roughness: 0.42 })); m.scale.setScalar(s); m.castShadow = true;
  const grp = new THREE.Group(); grp.add(m); return grp;
}
// card/pill: rounded slab with canvas face (faces +Z)
function makeCard(w, h, color, draw, opt = {}) {
  const d = opt.depth ?? 0.08, r = opt.r ?? Math.min(w, h) * 0.25;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, Math.min(r, d / 2 - 0.001)), (opt.glossy ? glossy : std)(color, { roughness: 0.45 }));
  const s = 256 * (opt.res ?? 1);
  const tex = ctex(Math.round(s * w), Math.round(s * h), draw);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, ...(opt.emissive ? { emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: opt.emissive } : {}) }));
  face.position.z = d / 2 + 0.002;
  g.add(body, face); g.userData = { body, face, tex }; shadowAll(body); return g;
}
function pillDraw(title, sub, iconBg = '#f26a1b', titleColor = '#2b1d16', subColor = '#8a7468') {
  return (g, w, h) => {
    const u = h / 100;
    g.fillStyle = iconBg; roundRect(g, w - 26 * u - 52 * u, 24 * u, 52 * u, 52 * u, 14 * u); g.fill();
    g.fillStyle = iconBg === '#ffffff' ? '#f26a1b' : '#fff'; g.beginPath(); g.moveTo(w - 60 * u, 38 * u); g.lineTo(w - 60 * u, 62 * u); g.lineTo(w - 40 * u, 50 * u); g.closePath(); g.fill();
    g.textAlign = 'left'; g.fillStyle = titleColor; g.font = `900 ${sub ? 34 : 40}px Nunito`.replace(/(\d+)px/, (_, n) => `${n * u}px`);
    g.fillText(title, 28 * u, sub ? 50 * u : 63 * u);
    if (sub) { g.fillStyle = subColor; g.font = `800 ${17 * u}px Nunito`; g.fillText(sub, 30 * u, 77 * u); }
  };
}
function makeSticky(text, bg = '#ffd45a', w = 1, h = 0.82, color = '#7a4a1a') {
  const g = makeCard(w, h, new THREE.Color(bg).getHex(), (c, cw, ch) => {
    c.fillStyle = color; c.font = `800 ${ch * 0.16}px Nunito`; c.textAlign = 'left';
    wrapText(c, text, cw * 0.1, ch * 0.32, cw * 0.82, ch * 0.2);
  }, { depth: 0.02, r: 0.01 });
  return g;
}
function makePencil(color, len = 1.1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 6), std(color, { roughness: 0.4 }));
  const wood = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), std(0xf2c79a)); wood.position.y = len / 2 + 0.07;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.05, 6), std(0x3a2a22)); tip.position.y = len / 2 + 0.125;
  g.add(body, wood, tip); return shadowAll(g);
}
function makeCup(color = 0xf5b48a, n = 7, mesh = false) {
  const g = new THREE.Group();
  const mat = mesh ? new THREE.MeshStandardMaterial({ color: 0x5a4a44, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    : std(color, { roughness: 0.55, side: THREE.DoubleSide });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.8, 32, 1, true), mat); cup.position.y = 0.4;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), mat); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.01;
  g.add(cup, bottom);
  const cols = [C.or, 0xffb33a, 0xe8452c, C.yellow, 0xf58b4c, 0xd9542a, 0xffe08a];
  for (let i = 0; i < n; i++) {
    const p = makePencil(cols[i % cols.length], 1.15); const a = (i / n) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.14, 0.62, Math.sin(a) * 0.14); p.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); g.add(p);
  }
  return shadowAll(g);
}
function makeDesk(w = 3.2, dpt = 1.2, h = 1.05) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, 0.08, dpt, 3, 0.03), std(0xfbefe4, { roughness: 0.5 })); top.position.y = h; g.add(top);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 10), std(0xffffff)); l.position.set(x * (w / 2 - 0.15), h / 2, z * (dpt / 2 - 0.12)); g.add(l); }
  return shadowAll(g);
}
function makeChair() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.12, 0.85, 3, 0.05), std(0xf08a4b)); seat.position.y = 0.95;
  const pegTex = ctex(256, 256, (c, w, h) => { c.fillStyle = '#f08a4b'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe1c8'; for (let y = 20; y < h; y += 34) for (let x = 20; x < w; x += 34) { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } });
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.95, 1.05, 0.1, 3, 0.04), [std(0xf08a4b), std(0xf08a4b), std(0xf08a4b), std(0xf08a4b), std(0xffffff, { map: pegTex }), std(0xffffff, { map: pegTex })]);
  back.position.set(0, 1.6, -0.4); back.rotation.x = -0.08;
  g.add(seat, back);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8), std(0xffffff)); l.position.set(x * 0.36, 0.47, z * 0.33); g.add(l); }
  return shadowAll(g);
}
function makePlant() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 20), std(0xf3e3d3)); pot.position.y = 0.13; g.add(pot);
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.32, 4, 8), std(0x9cc46a)); l.position.set((i - 2) * 0.05, 0.42, 0); l.rotation.z = (i - 2) * 0.28; g.add(l); }
  return shadowAll(g);
}
function makeMug(color = 0xf08a4b) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.36, 24), std(color)); b.position.y = 0.18;
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), std(color)); h.position.set(0.18, 0.2, 0); h.rotation.y = Math.PI / 2;
  g.add(b, h); return shadowAll(g);
}
function makeMarker() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.5, 6, 20), glossy(0xffbf2e, { roughness: 0.35 }));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.2, 20), std(0x3a2a22)); band.position.y = -0.62;
  const tipBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.18, 20), std(0xffbf2e)); tipBase.position.y = -0.98;
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.06), std(0xffd84a, { emissive: 0xffc400, emissiveIntensity: 0.2 })); tip.position.y = -1.13;
  g.add(body, band, tipBase, tip); return shadowAll(g);
}
function makeCloud(s = 1) {
  const g = new THREE.Group(); const m = std(0xffffff, { roughness: 0.9, emissive: 0xfff2e6, emissiveIntensity: 0.25 });
  const parts = [[0, 0, 0, 1], [0.9, -0.15, 0.1, 0.75], [-0.9, -0.2, 0, 0.7], [0.4, 0.45, 0, 0.7], [-0.45, 0.35, 0.1, 0.62], [1.6, -0.35, 0, 0.5], [-1.6, -0.35, 0, 0.45]];
  for (const [x, y, z, r] of parts) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m); b.position.set(x, y, z); b.scale.y = 0.85; g.add(b); }
  g.scale.setScalar(s); return g;
}
function makeFolder(label) {
  const g = new THREE.Group(); const back = std(0xf4a83a, { roughness: 0.5 });
  const b = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.5, 0.06, 3, 0.03), back);
  const tab = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.3, 0.06, 3, 0.03), back); tab.position.set(-0.7, 0.8, 0);
  const paper = makeCard(1.9, 1.3, 0xffffff, (c, w, h) => { c.fillStyle = '#2b1d16'; c.font = `900 ${h * 0.14}px Nunito`; c.fillText('.pdf', w * 0.08, h * 0.2); c.fillStyle = '#e6d8cc'; for (let i = 0; i < 4; i++) c.fillRect(w * 0.08, h * (0.32 + i * 0.1), w * (0.7 - i * 0.1), h * 0.035); }, { depth: 0.015, r: 0.01 });
  paper.position.set(0, 0.15, 0.06);
  const front = makeCard(2.25, 1.15, 0xffc35a, (c, w, h) => { c.fillStyle = '#d4520f'; c.font = `900 ${h * 0.2}px Nunito`; c.textAlign = 'center'; c.save(); c.translate(w / 2, h * 0.62); c.rotate(-0.08); c.fillText(label, 0, 0); c.restore(); }, { depth: 0.06, r: 0.03 });
  front.position.set(0, -0.2, 0.12);
  g.add(b, tab, paper, front); g.userData = { paper, front }; return shadowAll(g);
}

/* ---------- page textures ---------- */
const PROMPT = 'Aku nak buat video dokumentari ringkas tentang [topik], sempena [peristiwa]. Cari fakta dari sumber yang boleh dipercayai, kemudian tulis DRAF.md.';
function pageHeader(g, w, label, title) {
  g.fillStyle = '#f26a1b'; roundRect(g, 70, 70, 74, 74, 14); g.fill();
  g.fillStyle = '#fff'; g.font = '900 40px Nunito'; g.textAlign = 'center'; g.fillText(label, 107, 122); g.textAlign = 'left';
  g.fillStyle = '#2b1d16'; g.font = '900 56px Nunito'; g.fillText(title, 165, 126);
}
function texWorkflow() {
  return ctex(1024, 1448, (g, w, h) => {
    g.fillStyle = '#fffaf4'; g.fillRect(0, 0, w, h); pageHeader(g, w, '1', 'Workflow 5 fasa');
    const items = ['Sediakan Claude Code', 'Brief & draf skrip', 'Kumpul bahan', 'Bina video', 'Semak & render'];
    const cols = ['#f26a1b', '#ff8a3d', '#e8452c', '#3a2fa6', '#ffb33a'];
    items.forEach((t, i) => { const y = 230 + i * 120; g.fillStyle = cols[i]; g.beginPath(); g.arc(110, y, 36, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 38px Nunito'; g.textAlign = 'center'; g.fillText(i + 1, 110, y + 13); g.textAlign = 'left'; g.fillStyle = '#3a2a22'; g.font = '800 44px Nunito'; g.fillText(t, 170, y + 15); });
    drawCover(g, imgs['f1.jpg'], 70, 860, w - 140, 470);
  });
}
function texScreens() {
  return ctex(1024, 1448, (g, w, h) => {
    g.fillStyle = '#fffaf4'; g.fillRect(0, 0, w, h); pageHeader(g, w, '2', 'Persediaan');
    drawCover(g, imgs['ss1.jpg'], 70, 200, w - 140, 400);
    g.strokeStyle = '#f26a1b'; g.lineWidth = 8; roundRect(g, 80, 250, 230, 60, 12); g.stroke();
    g.fillStyle = '#f26a1b'; g.beginPath(); g.arc(330, 280, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 34px Nunito'; g.fillText('1', 320, 292);
    g.fillStyle = '#e8d9cc'; for (let i = 0; i < 6; i++) g.fillRect(70, 680 + i * 52, w - 140 - (i % 3) * 140, 22);
    drawCover(g, imgs['f3.jpg'], 70, 1010, w - 140, 360);
  });
}
function texStoryboard() {
  return ctex(1024, 1448, (g, w, h) => {
    g.fillStyle = '#f26a1b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; roundRect(g, 60, 60, 110, 110, 18); g.fill(); g.fillStyle = '#f26a1b'; g.font = '900 60px Nunito'; g.fillText('3', 96, 138);
    g.fillStyle = '#fff'; g.font = '900 76px Nunito'; g.fillText('Bina babak', 200, 140);
    g.fillStyle = '#fff4ea'; g.beginPath(); g.ellipse(w / 2, 720, 400, 430, 0, 0, 7); g.fill();
    drawCover(g, imgs['f2.jpg'], 190, 470, 300, 170); drawCover(g, imgs['f4.jpg'], 530, 470, 300, 170); drawCover(g, imgs['f1.jpg'], 360, 690, 300, 170);
    g.fillStyle = '#f26a1b'; g.font = '900 120px Nunito'; g.fillText('♪', 600, 1030); g.fillText('🎙', 280, 1030);
    g.fillStyle = '#fff'; g.font = '800 40px Nunito'; g.fillText('Peta, arkib, sari kata & muzik', 120, 1300);
  });
}
function texPromptPage(p) {
  return ctex(2048, 1152, (g, w, h) => drawPromptPage(g, w, h, p));
}
function drawPromptPage(g, w, h, p) {
  g.fillStyle = '#fffdf9'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f26a1b'; roundRect(g, 120, 90, 430, 70, 35); g.fill(); g.fillStyle = '#fff'; g.font = '900 38px Nunito'; g.fillText('LANGKAH 1 · BRIEF', 160, 140);
  g.fillStyle = '#e46a35'; g.font = '900 110px Nunito'; g.fillText('Tulis brief pertama', 120, 300);
  g.font = '800 64px Nunito'; const lines = ['Aku nak buat video dokumentari', 'ringkas tentang [topik], sempena', '[peristiwa]. Cari fakta, tulis DRAF.md'];
  lines.forEach((l, i) => {
    const y = 470 + i * 120; const lw = g.measureText(l).width; const hp = clamp(p * 3 - i);
    if (hp > 0) { g.fillStyle = 'rgba(255,205,40,.75)'; g.fillRect(110, y - 62, (lw + 20) * hp, 86); }
    g.fillStyle = '#d4824e'; g.fillText(l, 120, y);
  });
  g.fillStyle = '#efe2d6'; for (let i = 0; i < 3; i++) g.fillRect(120, 860 + i * 60, 1400 - i * 260, 26);
}
function texKeyboard() {
  return ctex(1024, 512, (g, w, h) => { g.fillStyle = '#211a17'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a302b'; for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { roundRect(g, 20 + c * 71, 30 + r * 92, 62, 80, 8); g.fill(); } });
}
function speckleTex(base = '#f4dccb', dots = '#d9a989') {
  return ctex(1024, 1024, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = i % 3 ? dots : '#fff6ee'; g.globalAlpha = 0.35; g.fillRect(rnd() * w, rnd() * h, 2, 2); } g.globalAlpha = 1; });
}

/* =========================================================
   SHOTS
   ========================================================= */
const shots = [];
const shot = (t0, t1, o) => shots.push({ t0, t1, ...o });
function aim(cam, pos, tgt, roll = 0, fov) { cam.position.set(...pos); cam.lookAt(...tgt); if (roll) cam.rotateZ(roll); if (fov && cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } }
function faceCam(obj, cam, tilt = 0) { obj.quaternion.copy(cam.quaternion); if (tilt) obj.rotateZ(tilt); }

function buildFlatlay(variant) {
  const s = mkScene(0xf3cdb3, 16, 40);
  const L = warmLights(s, V(-3, 10, -4), 7, 2.4);
  const tex = speckleTex('#f3d3bd', '#d39a78'); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), std(0xffffff, { map: tex, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  const g = {};
  // papers
  for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.01, 1.5), std(0xfffdf9)); p.position.set((rnd() - 0.5) * 7, 0.006 + i * 0.002, (rnd() - 0.5) * 5); p.rotation.y = rnd() * 3; p.receiveShadow = true; s.add(p); }
  const cup = makeCup(0xf5b48a, 7, variant === 'B'); cup.position.set(-2.1, 0, -1.5); s.add(cup); g.cup = cup;
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.22, 0.22, 2, 0.04), std(i % 2 ? C.or : 0xffb33a)); c.position.set((rnd() - 0.5) * 6, 0.11, (rnd() - 0.5) * 4.5); c.rotation.y = rnd() * 3; c.castShadow = true; s.add(c); }
  if (variant === 'A') {
    const ob = makeOpenBook(texWorkflow(), texScreens(), 1.15, 1.62); ob.rotation.x = -Math.PI / 2; ob.position.set(0, 0.06, 0.15); ob.rotation.z = 0.12; s.add(ob); g.book = ob;
    const cb = makeBook(imgTex('cover.jpg'), 1.05, 1.48, 0.14); cb.rotation.x = -Math.PI / 2; cb.rotation.z = -0.35; cb.position.set(2.35, 0.08, -1.45); s.add(cb); g.cover = cb;
    g.pill = makeCard(2.3, 0.78, 0xffffff, pillDraw('Belajar Prompt', 'Salin & tampal, tanpa koding'), { depth: 0.14, r: 0.07, res: 1.4 }); s.add(g.pill);
    g.chipA = makeCard(1.5, 0.42, C.or, pillDraw('Untuk pemula', null, '#ffffff', '#ffffff'), { depth: 0.1, r: 0.05, res: 1.4 }); s.add(g.chipA);
    g.chipB = makeCard(1.4, 0.4, C.or, pillDraw('Claude Code', null, '#ffffff', '#ffffff'), { depth: 0.1, r: 0.05, res: 1.4 }); s.add(g.chipB);
    g.cursor = makeCursor(C.or, 0.7); s.add(g.cursor);
  } else {
    const ob = makeOpenBook(texStoryboard(), imgTex('cover.jpg'), 1.2, 1.7); ob.rotation.x = -Math.PI / 2; ob.position.set(0, 0.06, 0); s.add(ob); g.book = ob;
    g.sticky = makeSticky('27 muka, step by step', '#fff07a', 1.0, 0.85); g.sticky.rotation.x = -Math.PI / 2; g.sticky.rotation.z = 0.1; g.sticky.position.set(1.85, 0.08, 0.35); s.add(g.sticky);
    const p1 = makePencil(C.or, 1.3); p1.rotation.set(-Math.PI / 2, 0, 1.2); p1.position.set(-1.6, 0.05, 1.3); s.add(p1);
    const p2 = makePencil(0xffb33a, 1.0); p2.rotation.set(-Math.PI / 2, 0, -0.5); p2.position.set(1.7, 0.05, -1.3); s.add(p2);
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 3), std(C.or)); tri.position.set(0.4, 0.07, -1.45); tri.castShadow = true; s.add(tri);
    g.cursor = makeCursor(C.or, 0.35); g.cursor.rotation.x = -Math.PI / 2; g.cursor.position.set(1.4, 0.15, -0.75); s.add(g.cursor);
    // swoosh ribbon
    const curve = new THREE.CatmullRomCurve3([V(-4, 0.5, 1.6), V(-1.5, 0.6, 0.8), V(0.5, 0.7, 0.2), V(2.5, 0.9, -0.6), V(5, 1.2, -1.8)]);
    g.ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.07, 10), glossy(C.or)); g.ribbon.geometry.setDrawRange(0, 0); s.add(g.ribbon);
  }
  g.dust = dust(s, 260, [-5, 5, 0.2, 3, -4, 4], 0.035);
  return { s, g, cam: new THREE.PerspectiveCamera(40, W / H, 0.1, 100) };
}

function buildRoom() {
  const s = mkScene(0xf2c9ad, 10, 30);
  const L = warmLights(s, V(1.5, 6, -9), 9, 2.6); L.target.position.set(0, 0, 0);
  const wallM = std(0xf6d2b9, { roughness: 0.95 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std(0xeebda0, { roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  // back wall with window hole: build from 4 boxes
  const wz = -4.2, ww = 5.2, wh = 3.0, wy = 2.4;
  const parts = [[0, wy + wh / 2 + 2.5, 30, 5], [0, (wy - wh / 2) / 2, 30, wy - wh / 2], [-(ww / 2 + 7.5), wy, 15, wh], [ww / 2 + 7.5, wy, 15, wh]];
  for (const [x, y, w, h] of parts) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), wallM); m.position.set(x, y, wz); m.receiveShadow = true; s.add(m); }
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfffaf0).multiplyScalar(2.2) })); glow.position.set(0, wy, wz - 0.3); s.add(glow);
  const frameM = std(0xffffff);
  for (const x of [-ww / 2, 0, ww / 2]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.1, wh, 0.2), frameM); f.position.set(x, wy, wz); s.add(f); }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.4, 0.1, 0.5), frameM); sill.position.set(0, wy - wh / 2, wz + 0.15); s.add(sill);
  // side wall + sticky grid
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.3, 10, 20), wallM); side.position.set(-5.2, 5, 0); side.receiveShadow = true; s.add(side);
  const gridCols = [0xf26a1b, 0xffb33a, 0xffd45a, 0xf58b4c, 0xe8452c];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.32), std(gridCols[(r * 4 + c) % 5])); n.position.set(-5.03, 3.6 - r * 0.42, -2.6 + c * 0.42); s.add(n); }
  const desk = makeDesk(3.4, 1.2, 1.05); desk.position.set(0, 0, -2.6); s.add(desk);
  // easel with open book on desk
  const easel = new THREE.Group();
  const board = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.25, 0.06, 2, 0.02), std(0xe9b98e)); easel.add(board);
  const ob = makeOpenBook(texWorkflow(), texScreens(), 0.82, 1.15); ob.position.z = 0.08; easel.add(ob);
  easel.position.set(0, 1.78, -2.85); easel.rotation.x = -0.18; shadowAll(easel); s.add(easel);
  const plant = makePlant(); plant.position.set(-1.35, 1.09, -2.75); s.add(plant);
  const cup = makeCup(0xf5d2b6, 6); cup.scale.setScalar(0.42); cup.position.set(1.15, 1.09, -2.55); s.add(cup);
  const mug = makeMug(); mug.position.set(-0.95, 1.09, -2.3); s.add(mug);
  const chair = makeChair(); chair.position.set(1.9, 0, -1.6); chair.rotation.y = -0.7; s.add(chair);
  const bookStack = makeBook(imgTex('cover.jpg'), 0.55, 0.78, 0.09); bookStack.rotation.x = -Math.PI / 2; bookStack.position.set(-0.5, 1.14, -2.25); bookStack.rotation.z = 0.3; s.add(bookStack);
  const g = { easel, desk, chair, deskItems: [plant, mug, bookStack, cup] };
  g.cursor = makeCursor(C.or, 0.5); s.add(g.cursor);
  g.btn = new THREE.Group(); // "Mula" 3D button
  const btnBody = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.82, 0.32, 6, 0.16), glossy(0xf6c7a6, { roughness: 0.35 }));
  const btnTxt = text3D('Mula', 0.42, 0.12, glossy(C.or, { emissive: 0xff7a2a, emissiveIntensity: 0 }), 0.025); btnTxt.position.z = 0.2;
  g.btn.add(btnBody, btnTxt); g.btnBody = btnBody; g.btnTxt = btnTxt; shadowAll(g.btn); s.add(g.btn);
  g.miniPill = makeCard(0.9, 0.3, C.or, pillDraw('Mula', null, '#ffffff', '#ffffff'), { depth: 0.08, r: 0.04, res: 1.5 }); s.add(g.miniPill);
  g.flyPencil = makePencil(C.or, 1.2); s.add(g.flyPencil);
  // end card group
  g.end = new THREE.Group(); s.add(g.end);
  const titleM = glossy(0x4a2c1d, { roughness: 0.4 }), orM = glossy(C.or, { roughness: 0.35 });
  const t1 = text3D('Video', 0.26, 0.08, titleM); const t2 = text3D('Dokumentari', 0.26, 0.08, orM); const t3a = text3D('dengan', 0.2, 0.06, titleM); const t3b = text3D('Claude', 0.26, 0.08, orM);
  t1.position.set(-1.55, 2.42, 0); t2.position.set(-1.0, 2.05, 0); t3a.position.set(-1.68, 1.7, 0); t3b.position.set(-0.55, 1.7, 0);
  g.titleParts = [t1, t2, t3a, t3b]; g.titleParts.forEach((m) => { m.castShadow = true; g.end.add(m); });
  g.endBook = makeBook(imgTex('cover.jpg'), 0.95, 1.34, 0.14); g.end.add(g.endBook);
  g.endPill = makeCard(1.75, 0.38, C.or, pillDraw('Dapatkan · RM19', null, '#ffffff', '#ffffff'), { depth: 0.1, r: 0.06, res: 1.6 }); g.end.add(g.endPill);
  g.endCursor = makeCursor(C.or, 0.22); g.end.add(g.endCursor);
  g.endCup = makeCup(0xf5d2b6, 7); g.endCup.scale.setScalar(0.5); g.end.add(g.endCup);
  g.conf = [];
  const ccol = [C.or, 0xffb33a, 0x7b4fd6, 0xe8452c, 0xffd45a, 0xff6f91];
  for (let i = 0; i < 70; i++) {
    const geo = i % 3 === 0 ? new THREE.TetrahedronGeometry(0.05) : i % 3 === 1 ? new THREE.BoxGeometry(0.03, 0.09, 0.01) : new THREE.OctahedronGeometry(0.045);
    const m = new THREE.Mesh(geo, std(ccol[i % ccol.length], { roughness: 0.4 }));
    m.userData = { a: rnd() * Math.PI * 2, sp: 0.6 + rnd() * 1.4, up: 0.8 + rnd() * 1.6, rs: rnd() * 8, d: rnd() * 0.3 };
    g.end.add(m); g.conf.push(m);
  }
  g.dust = dust(s, 300, [-5, 5, 0.3, 4.5, -4, 3], 0.03);
  return { s, g, cam: new THREE.PerspectiveCamera(42, W / H, 0.1, 100) };
}

function buildHighlight() {
  const s = mkScene(0xf2cbb0, 9, 26);
  warmLights(s, V(-4, 8, 3), 6, 2.3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), std(0xf6dccb, { roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), std(0xe9b391)); wall.position.set(0, 5, -6); s.add(wall);
  const g = {};
  g.promptTex = texPromptPage(0);
  g.paper = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.012, 2.36), [std(0xffffff), std(0xffffff), std(0xffffff, { map: g.promptTex, roughness: 0.8 }), std(0xffffff), std(0xffffff), std(0xffffff)]);
  g.paper.position.set(0.3, 0.01, 0); g.paper.rotation.y = -0.18; g.paper.receiveShadow = true; s.add(g.paper);
  const kb = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.12, 1.5, 3, 0.04), [std(0x211a17), std(0x211a17), std(0xffffff, { map: texKeyboard() }), std(0x211a17), std(0x211a17), std(0x211a17)]);
  kb.position.set(-1.6, 0.06, 2.2); kb.rotation.y = 0.5; kb.receiveShadow = kb.castShadow = true; s.add(kb);
  g.marker = makeMarker(); s.add(g.marker);
  g.cup = makeCup(0x5a4a44, 8, true); s.add(g.cup);
  g.dust = dust(s, 200, [-4, 4, 0.2, 3, -3, 3], 0.03);
  return { s, g, cam: new THREE.PerspectiveCamera(38, W / H, 0.05, 100) };
}

function buildVoid() {
  const s = mkScene(0xfdf0e6, 8, 24);
  warmLights(s, V(3, 8, 6), 8, 2.0);
  const g = { notes: [], balls: [] };
  const texts = ['Cari fakta', 'Tulis skrip', 'Suara narasi', 'Sari kata', 'Peta & arkib', 'Muzik & SFX', 'Render MP4', 'Semak fakta'];
  const cols = ['#ffd45a', '#f8a24a', '#f26a1b', '#ffe08a', '#ffbf6a'];
  for (let i = 0; i < 26; i++) {
    const n = makeSticky(texts[i % texts.length], cols[i % cols.length], 0.9, 0.7, i % 5 === 2 ? '#fff' : '#7a3d12');
    n.userData.p = V((rnd() - 0.5) * 9, (rnd() - 0.5) * 5, -2 - rnd() * 9); n.userData.r = V(rnd() * 6, rnd() * 6, rnd() * 6); n.userData.v = 0.6 + rnd();
    s.add(n); g.notes.push(n);
  }
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.55 + rnd() * 0.35, 40, 28), glossy(C.or, { roughness: 0.18, clearcoat: 1 })); b.userData.p = V((i - 2) * 0.75, (rnd() - 0.5) * 0.4, -5 - rnd() * 0.8); s.add(b); g.balls.push(b); }
  const curve = new THREE.CatmullRomCurve3([V(-6, -1, -4), V(-2, 0.6, -5), V(0, -0.4, -6), V(2.5, 0.8, -5), V(6, 0, -3)]);
  g.ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.06, 10), glossy(C.or)); s.add(g.ribbon);
  g.book = makeOpenBook(texWorkflow(), texScreens(), 0.5, 0.7); s.add(g.book);
  g.ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.03, 8, 120, Math.PI * 1.2), std(C.or)); s.add(g.ring);
  return { s, g, cam: new THREE.PerspectiveCamera(50, W / H, 0.1, 100) };
}

function buildSky() {
  const s = new THREE.Scene(); s.environment = envTex;
  s.background = ctex(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f08a52'); gr.addColorStop(0.55, '#f8c4a0'); gr.addColorStop(1, '#fbe3d2'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  s.fog = new THREE.Fog(0xf6c09e, 14, 36);
  s.add(new THREE.HemisphereLight(0xffffff, 0xf0a070, 1.4));
  const d = new THREE.DirectionalLight(0xfff0e0, 1.8); d.position.set(3, 6, 8); s.add(d);
  const g = { clouds: [] };
  const cp = [[-6, -1.6, -4, 1.4], [5.5, -1.2, -3, 1.3], [-2.5, 2.6, -9, 1.6], [4, 2.2, -10, 1.8], [0, -3.4, -2, 1.5], [-7, 1.5, -12, 2], [8, -0.5, -12, 2], [2, -2.2, -6, 1.1], [-4, 0.2, -7, 0.9]];
  cp.forEach(([x, y, z, sc]) => { const c = makeCloud(sc); c.position.set(x, y, z); c.userData.p = V(x, y, z); s.add(c); g.clouds.push(c); });
  g.name = text3D('AMMARCREAVA', 0.72, 0.16, std(0xffffff, { roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.35, transparent: true }), 0.03);
  g.name.position.set(0, 0.4, -3); s.add(g.name);
  g.sub = makeCard(4.2, 0.45, 0xffffff, (c, w, h) => { c.fillStyle = '#f26a1b'; c.font = `900 ${h * 0.55}px Nunito`; c.textAlign = 'center'; c.fillText('Perunding AI & video · 27 muka · 14 prompt', w / 2, h * 0.7); }, { depth: 0.001, r: 0.0005 });
  g.sub.userData.body.visible = false; g.sub.position.set(0, -0.55, -2.9); s.add(g.sub);
  // flipping book: two covers hinged at spine
  g.bk = new THREE.Group();
  g.bkL = new THREE.Group(); g.bkR = new THREE.Group();
  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.13, 0.04), [EDGE(), EDGE(), EDGE(), EDGE(), std(0xffffff, { map: texWorkflow() }), std(0xffffff, { map: imgTex('cover.jpg') })]);
  pageL.position.x = -0.4; g.bkL.add(pageL);
  const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.13, 0.04), [EDGE(), EDGE(), EDGE(), EDGE(), std(0xffffff, { map: texScreens() }), std(C.indigo)]);
  pageR.position.x = 0.4; g.bkR.add(pageR);
  g.bk.add(g.bkL, g.bkR); shadowAll(g.bk); s.add(g.bk);
  g.dust = dust(s, 160, [-8, 8, -4, 4, -8, 0], 0.05, 0xfff3e8);
  return { s, g, cam: new THREE.PerspectiveCamera(42, W / H, 0.1, 100) };
}

function buildFolder() {
  const s = mkScene(0xfdf6ef, 10, 30);
  warmLights(s, V(2, 6, 8), 6, 2.0);
  const g = {};
  const ringTex = ctex(512, 64, (c, w, h) => { c.fillStyle = '#f26a1b'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 8) { c.beginPath(); c.arc(x + 4, y + 4, 1.6 * (y / h), 0, 7); c.fill(); } });
  ringTex.wrapS = THREE.RepeatWrapping; ringTex.repeat.set(12, 1);
  g.ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.42, 24, 160, Math.PI * 1.45), std(0xffffff, { map: ringTex, roughness: 0.5 })); s.add(g.ring);
  g.ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.02, 8, 160), std(C.or)); s.add(g.ring2);
  g.folder = makeFolder('video-dokumentari'); s.add(g.folder);
  g.ghost = text3D('Skill', 1.5, 0.05, std(0xffffff, { transparent: true, opacity: 0.85, emissive: 0xffffff, emissiveIntensity: 0.2 }), 0.01); g.ghost.position.set(0, 0, -2.5); s.add(g.ghost);
  g.slab = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.2, 0.16, 4, 0.08), glossy(C.or)); s.add(g.slab);
  const mk = (txt) => makeCard(1.6, 0.95, 0xfff3ea, (c, w, h) => { c.fillStyle = '#c9b2a3'; c.font = `900 ${h * 0.14}px Nunito`; c.fillText(txt, w * 0.36, h * 0.25); }, { depth: 0.03, r: 0.02 });
  g.cardA = mk('.pdf'); g.cardB = mk('SKILL.md'); s.add(g.cardA, g.cardB); shadowAll(g.slab);
  return { s, g, cam: new THREE.PerspectiveCamera(40, W / H, 0.1, 100) };
}

/* =========================================================
   per-frame shot logic
   ========================================================= */
let FL_A, FL_B, ROOM, HL, VOID, SKY, FOLD;
const overlay = { meta: 0, footer: 0, blur: 0, blurY: 0, ui: 0, kin: 0, panel: 0 };

function setupShots() {
  /* A 0–3.0 flatlay overhead w/ floating pills */
  shot(0, 3.05, { sc: () => FL_A, update(t) {
    const { g, cam } = FL_A;
    const a = lerp(-0.5, 0.15, k(t, 0, 3.05, E.sin));
    const r = lerp(7.2, 4.4, k(t, 0, 3.0, E.io3));
    const h = lerp(7.4, 3.6, k(t, 0, 3.0, E.io3));
    const tgt = lv([0.4, 0, -0.2], [0.6, 0.9, 0.3], k(t, 1.2, 3.0));
    aim(cam, [tgt[0] + Math.sin(a) * r * 0.55, h, tgt[2] + Math.cos(a) * r * 0.6], tgt, lerp(-0.42, -0.12, k(t, 0, 3)), 40);
    const pop = (o, t0, p0, p1, tilt) => { const q = k(t, t0, t0 + 0.7, E.back); o.position.copy(V(...lv(p0, p1, q))); faceCam(o, cam, tilt); o.scale.setScalar(Math.max(0.001, q)); };
    pop(g.pill, 0.35, [0.3, 0.1, 0.2], [0.7, 1.15, 0.55], 0.08);
    pop(g.chipA, 0.55, [-0.6, 0.1, 0.3], [-1.25, 0.75, 0.9], -0.1);
    pop(g.chipB, 0.7, [1.8, 0.1, -1.2], [1.75, 0.8, -0.85], 0.12);
    // cursor path then click
    const cp = k(t, 0.6, 2.0, E.io3);
    g.cursor.position.copy(V(...lv([2.2, 0.3, 1.4], [1.25, 1.05, 0.9], cp)));
    faceCam(g.cursor, cam, 0.25);
    const press = Math.sin(Math.PI * clamp((t - 2.05) / 0.22));
    g.cursor.scale.setScalar(1 - 0.15 * press); g.pill.scale.multiplyScalar(1 - 0.06 * press);
    g.dust.rotation.y = t * 0.05;
    overlay.blur = 26 * k(t, 2.75, 3.05, E.i3);
    return { focus: cam.position.distanceTo(g.pill.position), aperture: 0.0025, maxblur: 0.009 };
  } });

  /* C 3.05–5.5 room wide + cursor flies to camera */
  shot(3.05, 5.5, { sc: () => ROOM, update(t) {
    const { g, cam } = ROOM; const l = t - 3.05;
    roomVisibility('room');
    aim(cam, lv([0.9, 1.45, 3.6], [0.4, 1.5, 2.6], k(l, 0, 2.45, E.o3)), [0, 1.35, -2.6], lerp(0.12, 0.04, k(l, 0, 2.4)), 42);
    const cp = k(l, 0.4, 2.3, E.io3);
    g.cursor.position.copy(V(...lv([-0.2, 1.3, -2.2], [-0.05, 1.05, 1.55], cp)));
    g.cursor.scale.setScalar(lerp(0.5, 1.0, cp)); faceCam(g.cursor, cam, 0.35);
    overlay.blur = 26 * (1 - k(l, 0, 0.35, E.o3)); overlay.meta = k(l, 0.3, 0.8);
    return { focus: lerp(5.5, 1.6, cp), aperture: 0.0018, maxblur: 0.008 };
  } });

  /* D 5.5–8.0 push to easel, Mula button click */
  shot(5.5, 8.0, { sc: () => ROOM, update(t) {
    const { g, cam } = ROOM; const l = t - 5.5;
    roomVisibility('btn');
    aim(cam, lv([0.55, 1.85, -0.1], [0.2, 1.75, -0.6], k(l, 0, 2.5, E.o3)), [0, 1.6, -2.8], lerp(-0.06, -0.12, k(l, 0, 2.5)), 40);
    const q = k(l, 0.25, 1.0, E.back);
    g.btn.position.set(-0.05, 1.38, -1.75); g.btn.scale.setScalar(Math.max(0.001, q * 0.3)); faceCam(g.btn, cam, -0.04);
    const cp = k(l, 0.8, 1.55, E.io3);
    g.cursor.position.copy(V(...lv([1.6, 0.6, -0.5], [0.24, 1.3, -1.6], cp))); g.cursor.scale.setScalar(0.2); faceCam(g.cursor, cam, 0.3);
    const press = Math.sin(Math.PI * clamp((l - 1.6) / 0.25));
    g.btn.scale.multiplyScalar(1 - 0.06 * press); g.cursor.scale.multiplyScalar(1 - 0.15 * press);
    const on = k(l, 1.7, 1.95);
    g.btnBody.material.color.lerpColors(new THREE.Color(0xf6c7a6), new THREE.Color(C.or), on);
    g.btnTxt.material.color.lerpColors(new THREE.Color(C.or), new THREE.Color(0xffffff), on);
    g.btnTxt.material.emissive.set(0xffffff); g.btnTxt.material.emissiveIntensity = on * 0.9;
    overlay.meta = 1 - k(l, 2.0, 2.4);
    return { focus: cam.position.distanceTo(g.btn.position), aperture: 0.004, maxblur: 0.012 };
  } });

  /* E 8.0–9.6 pull back flying */
  shot(8.0, 9.6, { sc: () => ROOM, update(t) {
    const { g, cam } = ROOM; const l = t - 8.0;
    roomVisibility('fly');
    const p = k(l, 0, 1.6, E.io3);
    aim(cam, lv([-0.6, 1.6, -1.2], [2.6, 2.3, 1.6], p), lv([0, 1.6, -2.7], [-0.4, 1.3, -2.6], p), lerp(0.05, -0.25, p), 44);
    g.miniPill.position.set(-0.75, 2.05 + Math.sin(l * 2) * 0.05, -2.4); faceCam(g.miniPill, cam, 0.05);
    const fp = k(l, 0.1, 1.2, E.lin);
    g.flyPencil.position.copy(V(...lv([1.6, 1.3, -1.0], [-1.4, 2.4, -2.4], fp))); g.flyPencil.rotation.set(0.3, 0, 1.0 + fp * 2);
    overlay.blur = 30 * k(l, 1.25, 1.6, E.i3);
    return { focus: 4.5, aperture: 0.0015, maxblur: 0.006 };
  } });

  /* F 9.6–12.6 cup tumble then highlighter */
  shot(9.6, 12.6, { sc: () => HL, update(t) {
    const { g, cam } = HL; const l = t - 9.6;
    if (l < 1.0) {
      const p = k(l, 0, 1.0, E.lin);
      g.cup.visible = true; g.marker.visible = false;
      g.cup.position.set(lerp(-1.2, 0.8, p), 1.6 + Math.sin(p * 3) * 0.1, 1.0); g.cup.rotation.set(0.6 + p * 0.8, 0.4, -0.9 + p * 0.5);
      aim(cam, [0.2, 2.3, 4.2], [0, 1.5, 0.8], 0.15, 38);
      overlay.blur = 22 * (1 - k(l, 0, 0.3, E.o3)) + 18 * k(l, 0.8, 1.0, E.i3);
      return { focus: cam.position.distanceTo(g.cup.position), aperture: 0.004, maxblur: 0.012 };
    }
    const m = l - 1.0; g.marker.visible = true;
    g.cup.position.set(-1.9, 0, -1.4); g.cup.rotation.set(0, 0, 0);
    const hp = k(m, 0.25, 1.75, E.io3);
    drawPromptPage(g.promptTex.userData.g, 2048, 1152, hp); g.promptTex.needsUpdate = true;
    // marker tip follows highlight lines across paper (paper local coords)
    const line = Math.min(2, Math.floor(hp * 3)); const lp = clamp(hp * 3 - line);
    const local = V(lerp(-1.85, 0.6 - line * 0.05, lp), 0.02, lerp(-0.31, -0.31, 0) + line * 0.245);
    const world = local.clone().applyAxisAngle(V(0, 1, 0), g.paper.rotation.y).add(g.paper.position);
    g.marker.position.set(world.x + 0.35, world.y + 1.15, world.z + 0.15); g.marker.rotation.set(0.25, 0.3, -0.32);
    const cpos = lv([1.4, 0.75, 1.6], [0.6, 0.62, 1.25], k(m, 0, 2, E.o3));
    aim(cam, cpos, [world.x * 0.6 + 0.0, 0.05, world.z * 0.5], lerp(0.32, 0.22, k(m, 0, 2)), 40);
    overlay.blur = 18 * (1 - k(m, 0, 0.3, E.o3));
    return { focus: cam.position.distanceTo(world), aperture: 0.006, maxblur: 0.014 };
  } });

  /* G 12.6–15.0 overhead spread + sticky, dive, ribbon */
  shot(12.6, 15.0, { sc: () => FL_B, update(t) {
    const { g, cam } = FL_B; const l = t - 12.6;
    const dive = k(l, 1.55, 2.4, E.i3);
    aim(cam, lv([0.3, 4.9, 1.1], [0.9, 2.0, 0.2], dive), lv([0.1, 0, 0], [0.9, 0, -0.1], dive), lerp(0.04, 0.3, k(l, 0, 2.4)), 40);
    cam.position.x += Math.sin(l * 0.8) * 0.15;
    g.sticky.position.y = 0.08 + Math.sin(l * 3) * 0.02;
    const rp = k(l, 0.9, 1.9, E.o3); g.ribbon.geometry.setDrawRange(0, Math.floor(rp * 80 * 10 * 6));
    overlay.blur = 24 * (1 - k(l, 0, 0.3, E.o3)) + 22 * k(l, 2.1, 2.4, E.i3);
    return { focus: cam.position.y - 0.05, aperture: 0.002, maxblur: 0.008 };
  } });

  /* H 15.0–16.6 flying notes + spheres, then white ring flash */
  shot(15.0, 16.6, { sc: () => VOID, update(t) {
    const { g, cam } = VOID; const l = t - 15.0;
    aim(cam, [lerp(-0.6, 0.6, k(l, 0, 1.6)), 0, lerp(2.5, 0.5, k(l, 0, 1.6, E.lin))], [0, 0, -6], lerp(-0.2, 0.15, k(l, 0, 1.6)), 50);
    g.notes.forEach((n, i) => { const p = n.userData.p; n.position.set(p.x + Math.sin(l * n.userData.v + i) * 0.4, p.y + Math.cos(l * n.userData.v + i) * 0.3, p.z + l * 3.5 * n.userData.v); n.rotation.set(n.userData.r.x + l * 1.5, n.userData.r.y + l, n.userData.r.z); });
    const bq = k(l, 0.2, 0.7, E.back);
    g.balls.forEach((b, i) => { b.position.copy(b.userData.p).add(V(0, Math.sin(l * 4 + i) * 0.12, 0)); b.scale.setScalar(Math.max(0.001, bq)); b.visible = l < 1.05; });
    g.ribbon.rotation.z = l * 0.6; g.ribbon.visible = l < 1.05;
    const white = l >= 1.05; g.book.visible = white; g.ring.visible = white;
    if (white) { const w = l - 1.05; g.book.position.set(-0.2, 0, -3); g.book.rotation.set(0.4, -0.6 + w * 1.2, 0.2); g.ring.position.set(0.5, 0, -3.2); g.ring.rotation.z = w * 2; VOID.s.background.set(0xffffff); g.notes.forEach((n) => (n.visible = false)); }
    else { VOID.s.background.set(0xfdf0e6); g.notes.forEach((n) => (n.visible = true)); }
    overlay.blur = 22 * (1 - k(l, 0, 0.25, E.o3)) + (white ? 0 : 20 * k(l, 0.85, 1.05, E.i3));
    overlay.speed = white ? 1 - k(l, 1.05, 1.6) : 0;
    return { focus: 4, aperture: 0.003, maxblur: 0.01 };
  } });

  /* I 16.6–20.1 sky, brand name, book flip, lower-third panel */
  shot(16.6, 20.1, { sc: () => SKY, update(t) {
    const { g, cam } = SKY; const l = t - 16.6;
    aim(cam, [lerp(-0.3, 0.3, k(l, 0, 3.5)), lerp(0.2, 0.6, k(l, 1.4, 2.2)), lerp(5.2, 4.6, k(l, 0, 3.5))], [0, lerp(0.2, 1.0, k(l, 1.4, 2.2)), -3], 0, 42);
    g.clouds.forEach((c, i) => { c.position.x = c.userData.p.x + Math.sin(l * 0.3 + i) * 0.3 + l * 0.12 * (i % 2 ? 1 : -1); });
    const nameO = k(l, 0.1, 0.5) * (1 - k(l, 1.3, 1.7));
    g.name.material.opacity = nameO; g.name.visible = nameO > 0.01; g.name.scale.setScalar(lerp(0.92, 1.02, k(l, 0, 1.7)));
    g.sub.visible = l > 0.4 && l < 1.7; g.sub.userData.face.material.opacity = k(l, 0.45, 0.8) * (1 - k(l, 1.3, 1.6));
    // book: falls in front of the name, then opens and floats up
    const fall = k(l, 0.0, 0.8, E.back);
    g.bk.position.set(lerp(-0.4, 0.05, fall), lerp(3.5, 0.45, fall) + lerp(0, 1.1, k(l, 1.4, 2.4)), -1.2);
    g.bk.rotation.set(lerp(0.4, 0.15, fall), lerp(1.2, -0.35, k(l, 0, 2.6)) + Math.sin(l) * 0.1, lerp(-0.4, 0.05, fall));
    const open = k(l, 0.75, 1.6, E.io3);
    g.bkL.rotation.y = lerp(-Math.PI + 0.02, -0.25, open) * -1; g.bkR.rotation.y = lerp(0, -0.25, open);
    g.bkL.rotation.y = lerp(Math.PI - 0.02, 0.25, open);
    overlay.panel = k(l, 1.6, 2.2, E.o5); overlay.panelT = l;
    return { focus: 5.5, aperture: 0.0012, maxblur: 0.005 };
  } });

  /* J 20.1–21.6 ring + folder + cards */
  shot(20.1, 21.6, { sc: () => FOLD, update(t) {
    const { g, cam } = FOLD; const l = t - 20.1;
    aim(cam, [lerp(-1.0, 0.4, k(l, 0, 1.5)), 0.2, lerp(7.5, 6.2, k(l, 0, 1.5))], [0, 0, 0], 0, 40);
    g.ring.rotation.z = lerp(1.6, 3.4, k(l, 0, 1.5, E.o3)); g.ring.position.set(-1.2, 0, 0); g.ring2.position.set(-1.0, 0, -0.5);
    g.ring.scale.setScalar(lerp(1.6, 1.0, k(l, 0, 0.6, E.o3)));
    const f = k(l, 0.05, 0.6, E.back);
    const folderOn = l < 0.95; g.folder.visible = folderOn; g.ghost.visible = folderOn;
    g.folder.position.set(lerp(-3, 0.2, f), lerp(-1, 0, f), 0.5); g.folder.rotation.set(0.25, lerp(-1.2, -0.25, f), lerp(0.6, 0.12, f)); g.folder.scale.setScalar(0.75);
    g.folder.userData.paper.position.y = 0.15 + 0.45 * k(l, 0.45, 0.8, E.o3);
    g.ghost.material.opacity = 0.75 * k(l, 0.2, 0.6);
    const c = k(l, 0.95, 1.5, E.o3); g.slab.visible = g.cardA.visible = g.cardB.visible = !folderOn;
    g.slab.position.set(0.6, -0.7, 0.3); g.slab.rotation.set(-0.9, 0.2, 0.5);
    g.cardA.position.set(lerp(0.6, 0.1, c), lerp(-0.5, 0.9, c), lerp(0.4, 0.8, c)); g.cardA.rotation.set(-0.5, 0.3, 0.35);
    g.cardB.position.set(lerp(0.6, 0.5, c), lerp(-0.5, 0.2, c), lerp(0.4, 1.0, c)); g.cardB.rotation.set(-0.6, 0.25, 0.4);
    overlay.blur = 18 * k(l, 1.3, 1.5, E.i3);
    return { focus: 6.5, aperture: 0.0015, maxblur: 0.006 };
  } });

  /* K 21.6–23.1 UI (2D) */
  shot(21.6, 23.1, { two: 'ui', update(t) { const l = t - 21.6; overlay.ui = 1; overlay.uiT = l; overlay.blur = 16 * (1 - k(l, 0, 0.25, E.o3)) + 14 * k(l, 1.3, 1.5, E.i3); return null; } });
  /* L 23.1–24.6 kinetic words (2D) */
  shot(23.1, 24.6, { two: 'kin', update(t) { const l = t - 23.1; overlay.kin = 1; overlay.kinT = l; overlay.blur = 0; return null; } });

  /* M 24.6–28.2 end card */
  shot(24.6, DUR + 0.01, { sc: () => ROOM, update(t) {
    const { g, cam } = ROOM; const l = t - 24.6;
    roomVisibility('end');
    aim(cam, lv([-0.55, 1.5, 2.2], [-0.35, 1.55, 1.75], k(l, 0, 3.6, E.o3)), [-0.15, 1.85, -2.3], -0.06, 40);
    g.end.position.set(0, 0, -2.2);
    g.titleParts.forEach((m, i) => { const q = k(l, 0.15 + i * 0.12, 0.65 + i * 0.12, E.back); m.scale.setScalar(Math.max(0.001, q)); m.rotation.y = lerp(0.6, 0.18, q); m.position.z = 0.1; });
    const bq = k(l, 0.55, 1.15, E.back);
    g.endBook.position.set(0.95, lerp(3.2, 1.8, bq) + Math.sin(l * 1.6) * 0.03 * k(l, 1.2, 1.6), -0.1); g.endBook.rotation.set(-0.05, -0.5 + Math.sin(l) * 0.05, lerp(0.6, -0.12, bq));
    const pq = k(l, 1.15, 1.6, E.back); g.endPill.position.set(-1.05, 1.2, 0.15); g.endPill.rotation.y = 0.18; g.endPill.scale.setScalar(Math.max(0.001, pq));
    const cq = k(l, 1.4, 1.9, E.o3); g.endCursor.position.set(lerp(0.3, -0.4, cq), lerp(0.75, 1.08, cq), 0.3); g.endCursor.rotation.set(0, 0.18, 0.3);
    const press = Math.sin(Math.PI * clamp((l - 2.0) / 0.22)); g.endPill.scale.multiplyScalar(1 - 0.06 * press); g.endCursor.scale.setScalar(1 - 0.15 * press);
    g.endCup.position.set(-2.1, 1.09 - 2.2 + 2.2, 0.1); g.endCup.position.y = 1.09 - 0.0; g.endCup.position.z = 0.0;
    g.endCup.position.set(-2.55, lerp(-1, 1.09, k(l, 0, 0.6, E.back)), -0.3);
    g.conf.forEach((m) => { const u = m.userData; const ct = clamp(l - 0.8 - u.d); const vis = ct > 0; m.visible = vis; if (!vis) return;
      m.position.set(0.95 + Math.cos(u.a) * u.sp * ct * 1.2, 1.8 + u.up * ct - 1.2 * ct * ct, -0.1 + Math.sin(u.a) * u.sp * ct * 0.8); m.rotation.set(u.rs * ct, u.rs * ct * 0.7, 0); });
    overlay.meta = 0; overlay.blur = 20 * (1 - k(l, 0, 0.3, E.o3)); overlay.footer = 0;
    return { focus: cam.position.distanceTo(V(0, 1.6, -2.2)), aperture: 0.0016, maxblur: 0.006 };
  } });
}

function roomVisibility(mode) {
  const g = ROOM.g;
  g.cursor.visible = mode === 'room' || mode === 'btn';
  g.btn.visible = mode === 'btn';
  g.miniPill.visible = mode === 'fly';
  g.flyPencil.visible = mode === 'fly';
  g.end.visible = mode === 'end';
  g.easel.visible = mode !== 'end';
  g.deskItems.forEach((o) => (o.visible = mode !== 'end'));
}

/* ---------- 2D overlays ---------- */
function applyOverlay(t) {
  const blur = overlay.blur || 0;
  $('mbg').setAttribute('stdDeviation', `${blur.toFixed(1)} ${(blur * 0.08).toFixed(1)}`);
  canvas.style.filter = blur > 0.3 ? 'url(#mb)' : 'none';
  $('meta').style.opacity = overlay.meta || 0;
  $('footer').style.opacity = overlay.footer || 0;
  // panel
  const pnl = overlay.panel || 0; $('panel').style.transform = `translateY(${(1 - pnl) * 320}px)`;
  const pt = overlay.panelT || 0;
  ['c3a', 'c3b', 'c3c'].forEach((id, i) => { const q = k(pt, 1.9 + i * 0.12, 2.3 + i * 0.12, E.o3); $(id).style.transform = `translateX(${(1 - q) * 120}px)`; $(id).style.opacity = q; });
  document.querySelectorAll('.bul').forEach((b, i) => { const q = k(pt, 2.3 + i * 0.12, 2.6 + i * 0.12, E.o3); b.style.opacity = q; b.style.transform = `translateX(${(1 - q) * 30}px)`; });
  // UI
  $('ui').style.opacity = overlay.ui || 0;
  if (overlay.ui) {
    const l = overlay.uiT;
    [...$('thumbs').children].forEach((d, i) => { const q = k(l, 0.1 + i * 0.07, 0.5 + i * 0.07, E.back); d.style.transform = `translateY(${(1 - q) * 60}px) scale(${0.6 + 0.4 * q})`; d.style.opacity = clamp(q * 1.5); });
    const hq = k(l, 0.2, 0.6, E.o3); $('uih').style.opacity = hq; $('uih').style.transform = `translateY(${(1 - hq) * 20}px)`;
    [...$('tags').children].forEach((d, i) => { const q = k(l, 0.55 + i * 0.06, 0.85 + i * 0.06, E.back); d.style.transform = `scale(${q})`; });
  }
  // kinetic
  $('kin').style.opacity = overlay.kin || 0;
  if (overlay.kin) {
    const l = overlay.kinT; const seg = l < 0.38 ? 1 : l < 0.75 ? 2 : l < 1.12 ? 3 : 4;
    for (let i = 1; i <= 4; i++) $('k' + i).style.opacity = i === seg ? 1 : 0;
    $('k1').style.transform = `scale(${lerp(1.25, 1, k(l, 0, 0.2, E.o3))})`;
    $('k2').style.transform = `translateX(${lerp(-60, 0, k(l, 0.38, 0.55, E.o3))}px)`;
    $('k3').style.transform = `translateX(${lerp(900, -1500, k(l, 0.75, 1.12, E.lin))}px)`;
    $('k4').style.transform = `scale(${lerp(0.6, 1, k(l, 1.12, 1.3, E.back))})`;
  }
  // speed lines in shot H white flash use halftone layer intensity
  $('halftone').style.opacity = overlay.two ? 0.25 : 0.55;
}

/* ---------- main render ---------- */
function renderAt(t) {
  for (const key in overlay) overlay[key] = 0;
  const s = shots.find((x) => t >= x.t0 && t < x.t1) || shots[shots.length - 1];
  const dof = s.update(t);
  if (s.two) { overlay.two = 1; renderer.setClearColor(0xf5efe9); renderer.clear(); }
  else {
    const S = s.sc();
    rp.scene = S.s; rp.camera = S.cam; bokeh.scene = S.s; bokeh.camera = S.cam;
    if (dof) { bokeh.uniforms.focus.value = dof.focus; bokeh.uniforms.aperture.value = dof.aperture; bokeh.uniforms.maxblur.value = dof.maxblur; }
    if (window.__mode === 'raw') renderer.render(S.s, S.cam); else if (window.__mode === 'nobokeh') { bokeh.enabled = false; composer.render(); bokeh.enabled = true; } else if (window.__mode === 'nobloom') { bloom.enabled = false; composer.render(); bloom.enabled = true; } else composer.render();
  }
  applyOverlay(t);
}

async function init() {
  await Promise.all(['cover.jpg', 'f1.jpg', 'f2.jpg', 'f3.jpg', 'f4.jpg', 'ss1.jpg', 'logo.png'].map(loadImg));
  await Promise.all([600, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px Nunito`)));
  const buf = await (await fetch('fonts/Nunito-900.ttf')).arrayBuffer();
  FONT3D = new Font(new TTFLoader().parse(buf));
  FL_A = buildFlatlay('A'); FL_B = buildFlatlay('B'); ROOM = buildRoom(); HL = buildHighlight(); VOID = buildVoid(); SKY = buildSky(); FOLD = buildFolder();
  setupShots();
  window.__render = renderAt; window.__dur = DUR;
  renderAt(0);
  window.__ready = true;
}
init().catch((e) => { window.__err = String(e && e.stack || e); console.error(e); });
