// Paused GSAP master timeline + deterministic float + captions. window.seek(t) for frame rendering.
(function () {
  const TL = window.TL, P = TL.phrases;
  const S = (s) => P.find((p) => p.s === s).start;
  const tl = gsap.timeline({ paused: true });
  const $ = (id) => document.getElementById(id);
  const E3 = 'power3.out', E4 = 'power4.out', EI = 'power3.inOut', EB = 'back.out(1.6)';

  // ---------- deterministic float (CSS `translate`/`rotate`, composes with GSAP transforms)
  const floats = [];
  const bob = (el, ax, ay, sp, ph, rot = 0) => floats.push({ el, ax, ay, sp, ph, rot });
  function applyFloat(t) {
    floats.forEach((f) => {
      f.el.style.translate = `${Math.sin(t * f.sp + f.ph) * f.ax}px ${Math.cos(t * f.sp * 0.83 + f.ph) * f.ay}px`;
      if (f.rot) f.el.style.rotate = `${Math.sin(t * f.sp * 0.7 + f.ph) * f.rot}deg`;
    });
  }
  const show = (id, a, b) => {
    tl.set('#' + id, { visibility: 'visible' }, a);
    if (b != null) tl.set('#' + id, { visibility: 'hidden' }, b);
  };
  const flash = (t, peak = 0.85) => tl.fromTo('#flash', { opacity: peak }, { opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, t);

  const L = document.documentElement.classList.contains('land');
  function build() {
    const T2 = S('ebook') - 0.25, T3 = 9.25, T4 = 12.65, T5 = 20.1, T6 = 24.75, T7 = 28.0;
    const END = TL.duration;

    // ---------- props: per-scene positions
    const props = ['pA', 'pB', 'pC', 'pD', 'pE', 'pF', 'pG'];
    props.forEach((id, i) => bob($(id), 18 + i * 4, 22 + i * 3, 0.6 + i * 0.13, i * 1.7, id.startsWith('p') && i > 4 ? 10 : 0));
    const layout = [
      // [x,y,scale,z] per prop for each scene start
      [0,   { pA: [790, 230, 1, 0], pB: [-60, 260, 1, 0], pC: [120, 1250, 1, 0], pD: [760, 1250, 1, 0], pE: [480, 160, 1, 0], pF: [80, 1520, .8, 0], pG: [900, 560, .8, 0] }],
      [T2,  { pA: [-90, 1150, .9, 0], pB: [780, 1000, 1.1, 0], pC: [880, 170, .8, 0], pD: [-120, 140, .9, 0], pE: [120, 560, 1, 0], pF: [830, 1490, .9, 0], pG: [60, 1560, .7, 0] }],
      [T3,  { pA: [820, 600, .8, 0], pB: [-80, 860, .9, 0], pC: [600, 1500, .9, 0], pD: [880, -120, 1, 0], pE: [300, 600, 1, 0], pF: [-40, 1500, .8, 0], pG: [940, 1000, .7, 0] }],
      [T4,  { pA: [860, 1180, .9, 0], pB: [-110, 200, 1.2, 0], pC: [40, 1180, 1, 0], pD: [800, -60, .9, 0], pE: [900, 760, 1, 0], pF: [60, 820, .8, 0], pG: [780, 1560, .7, 0] }],
      [T5,  { pA: [900, 1580, .8, 0], pB: [-90, 1500, 1, 0], pC: [960, 120, .7, 0], pD: [-160, -60, 1, 0], pE: [820, 1120, 1, 0], pF: [70, 140, .7, 0], pG: [480, 1600, .6, 0] }],
      [T6,  { pA: [80, 1240, .8, 0], pB: [820, 1260, 1, 0], pC: [910, 700, .8, 0], pD: [-140, 620, .9, 0], pE: [160, 820, .9, 0], pF: [840, 160, .7, 0], pG: [60, 120, .6, 0] }],
      [T7,  { pA: [-60, 1350, 1, 0], pB: [800, 1320, 1.1, 0], pC: [870, 230, .8, 0], pD: [-170, 60, 1, 0], pE: [120, 1050, .9, 0], pF: [830, 680, .8, 0], pG: [80, 640, .7, 0] }],
    ];
    layout.forEach(([t, m], k) => {
      Object.entries(m).forEach(([id, [x, y, s]]) => {
        if (L) { x = x * 1920 / 1080 - 40; y = y * 1080 / 1920 - 60; s *= 0.8; }
        if (k === 0) tl.set('#' + id, { x, y, scale: s }, 0);
        else tl.to('#' + id, { x, y, scale: s, duration: 1.1, ease: EI }, t - 0.35);
      });
    });
    tl.from(props.map((p) => '#' + p), { scale: 0, duration: 0.9, ease: EB, stagger: 0.07 }, 0.05);

    // ---------- 1 HOOK: tiles
    show('s1', 0, T2 + 0.3);
    const rows = [['N', 'A', 'K'], ['B', 'U', 'A', 'T'], ['K', 'E', 'B', 'A', 'I', 'K', 'A', 'N', '?']];
    const box = $('tiles'); let n = 0; const tiles = [];
    rows.forEach((r, ri) => r.forEach((ch, ci) => {
      const d = document.createElement('div');
      d.className = 'tile' + (ri === 0 ? ' r' : ''); d.textContent = ch;
      const W = 108, CX = L ? 960 : 540, CY = L ? 440 : 800, x0 = CX - (r.length * W - 8) / 2 + ci * W, y0 = (L ? 280 : 640) + ri * 160;
      d.style.left = x0 + 'px'; d.style.top = y0 + 'px'; box.appendChild(d); tiles.push(d);
      const rnd = (k) => Math.sin(n * 12.9898 + k * 78.233) * 43758.5453 % 1;
      tl.from(d, { x: rnd(1) * 900, y: rnd(2) * 1100, z: -1800 + rnd(3) * 900, rotationX: rnd(4) * 360, rotationY: rnd(5) * 360, rotationZ: rnd(6) * 180,
        opacity: 0, duration: 1.3, ease: 'expo.out' }, 0.1 + n * 0.045);
      tl.to(d, { x: (x0 - CX + 50) * 2.2, y: (y0 - CY) * 2.2, z: 900, rotationY: rnd(7) * 120, rotationX: rnd(8) * 90, opacity: 0, duration: 0.6, ease: 'power3.in' }, T2 - 0.35 + rnd(9) * 0.12);
      n++;
    }));
    tl.to(tiles, { y: '-=14', duration: 0.25, ease: 'sine.inOut', yoyo: true, repeat: 1, stagger: 0.03 }, 1.9);
    tiles.forEach((d, i) => bob(d, 3, 5, 1.1, i * 0.6, 2));

    // ---------- 2 EBOOK
    show('s2', T2 - 0.15, T3 + 0.4);
    tl.from('#eb-k', { y: -40, opacity: 0, duration: 0.6, ease: E3 }, T2 + 0.3);
    tl.from('#eb-h', { y: 60, opacity: 0, duration: 0.8, ease: E4 }, T2 + 0.4);
    const cv = [['#cv1', -320, -32, -260, -6], ['#cv3', 320, 32, -260, 6], ['#cv2', 0, 0, 80, 0]];
    cv.forEach(([id, x, ry, z, rz], i) => {
      tl.fromTo(id, { x: x * 0.2, y: 700, z: -2200, rotationY: ry * 4 + 180, rotationX: 40, opacity: 0 },
        { x, y: 0, z, rotationY: ry, rotationX: 4, rotationZ: rz, opacity: 1, duration: 1.4, ease: 'expo.out' }, T2 + 0.35 + i * 0.18);
    });
    tl.fromTo('#covers', { rotationY: -10 }, { rotationY: 10, duration: T3 - T2, ease: 'none' }, T2);
    bob($('cv2'), 6, 12, 1.0, 0.3); bob($('cv1'), 5, 10, 0.9, 1.2); bob($('cv3'), 5, 10, 0.95, 2.4);
    ['#tg1', '#tg2', '#tg3'].forEach((id, i) => tl.from(id, { scale: 0, opacity: 0, duration: 0.5, ease: EB }, S('ebook') + 1.55 + i * 0.42));
    [$('tg1'), $('tg2'), $('tg3')].forEach((e, i) => bob(e, 8, 12, 1.2, i * 2));
    tl.from('#eb-chip', { y: 50, opacity: 0, scale: 0.9, duration: 0.6, ease: EB }, P[2].start - 0.1);
    tl.to(['#covers', '#eb-h', '#eb-k', '#eb-chip', '#tg1', '#tg2', '#tg3'], { z: 600, opacity: 0, duration: 0.5, ease: 'power3.in' }, T3 - 0.3);

    // ---------- 3 SEARCH
    show('s3', T3 - 0.15, T4 + 0.5);
    tl.fromTo('#srchwrap', { rotationX: 25, rotationY: -20, rotationZ: -10, z: -900, y: 200, opacity: 0 },
      { rotationX: 14, rotationY: -12, rotationZ: -6, z: 0, y: 0, opacity: 1, duration: 1.0, ease: E4 }, T3);
    tl.to('#srchwrap', { rotationX: 6, rotationY: 8, rotationZ: -2, duration: T4 - T3 - 0.8, ease: 'sine.inOut' }, T3 + 1.0);
    ['#pt1', '#pt2', '#pt3', '#pt4', '#pt5'].forEach((id, i) => {
      tl.fromTo(id, { z: -1400, opacity: 0, rotationY: 30 - i * 15 }, { z: -200 + i * 60, opacity: 1, rotationY: -15 + i * 8, rotationX: 10, duration: 1.2, ease: E3 }, T3 + 0.1 + i * 0.08);
      bob($(id.slice(1)), 10, 14, 0.8 + i * 0.1, i, 3);
    });
    const q = 'Ke mana nak salurkan infak?'; const ty = { n: 0 };
    tl.to(ty, { n: q.length, duration: 1.7, ease: 'none', onUpdate: () => { $('typed').textContent = q.slice(0, Math.round(ty.n)); } }, P[3].start + 0.15);
    tl.set('#typed', { textContent: '' }, T3);
    ['#sg1', '#sg2', '#sg3', '#sg4'].forEach((id, i) => tl.from(id, { y: -60, opacity: 0, rotationX: -50, duration: 0.5, ease: E3 }, P[3].start + 2.0 + i * 0.12));
    tl.to(['#srchwrap', '#ptiles'], { x: -1200, rotationY: 40, opacity: 0, duration: 0.6, ease: 'power3.in' }, T4 - 0.25);

    // ---------- 4 PROGRAMS
    show('s4', T4 - 0.15, T5 + 0.3);
    const progs = [
      ['pek-bantuan.jpg', 'Foodbank Bulanan', 'Pek makanan asas untuk asnaf, ibu tunggal & warga emas.', 'RM50 = 1 pek makanan'],
      ['katil-pasang.jpg', 'Wakaf Katil Hospital', 'Dipinjamkan tanpa caj kepada pesakit terlantar di rumah.', 'RM50 = 1 slot wakaf'],
      ['hantar-pintu.jpg', 'Sedekah Subuh & Infak Jumaat', 'Infak kecil harian & mingguan untuk program bulanan.', 'Serendah RM1'],
      ['banjir-redah.jpg', 'Bantuan Ziarah & Kecemasan', 'Bantuan segera kepada keluarga yang terjejas.', 'Sampai ke lokasi'],
    ];
    const per = (T5 - T4) / progs.length;
    progs.forEach(([img, t, d, pr], i) => {
      const el = document.createElement('div'); el.className = 'prog p3'; el.id = 'pg' + i;
      el.innerHTML = `<div class="count">0${i + 1} / 04</div><div class="frame" style="background-image:url(assets/${img})"></div>
        <div class="label"><div class="t">${t}</div><div class="d">${d}</div><div class="pr">${pr}</div><span class="pill red btn">Infak Sekarang</span></div>`;
      $('progs').appendChild(el);
      const a = T4 + i * per;
      tl.fromTo(el, { x: 720, z: -420, rotationY: -35, opacity: 0 }, { x: 0, z: 0, rotationY: -6, opacity: 1, duration: 0.95, ease: 'power3.out' }, a - 0.05);
      tl.fromTo(el.querySelector('.label'), { x: 160, z: 200, opacity: 0 }, { x: 0, z: 120, opacity: 1, duration: 0.7, ease: E4 }, a + 0.18);
      tl.to(el, { rotationY: 6, duration: per - 1.2, ease: 'sine.inOut' }, a + 0.9);
      tl.to(el.querySelector('.frame'), { backgroundPosition: '50% 30%', duration: per, ease: 'none' }, a);
      tl.to(el, { x: -720, z: -420, rotationY: 35, opacity: 0, duration: 0.6, ease: 'power2.in' }, a + per - 0.3);
      tl.set(el, { opacity: 0 }, 0);
      bob(el.querySelector('.label'), 4, 8, 1.3, i);
    });

    // ---------- 5 TRUST
    show('s5', T5 - 0.15, T6 + 0.3);
    const imgs = ['serahan', 'hantar-pintu', 'van-bekalan', 'muat-bekalan', 'hantar-kotak', 'banjir-redah', 'pek-bantuan', 'katil-pasang', 'stok-foodbank', 'serahan', 'jaga-pesakit', 'hantar-pintu'];
    imgs.forEach((m) => { const d = document.createElement('div'); d.style.backgroundImage = `url(assets/${m}.jpg)`; $('plane').appendChild(d); });
    tl.fromTo('#planeWrap', { rotationX: 38, rotationZ: -14, z: -700, y: 300, opacity: 0 },
      { rotationX: 30, rotationZ: -12, z: -300, y: -120, opacity: 1, duration: 1.2, ease: E4 }, T5 - 0.1);
    tl.to('#planeWrap', { y: -520, rotationZ: -8, duration: T6 - T5 - 0.9, ease: 'none' }, T5 + 1.1);
    tl.from('#tr1', { y: 60, opacity: 0, duration: 0.6, ease: E4 }, T5 + 0.15);
    tl.to('#tr1', { y: -60, opacity: 0, duration: 0.4, ease: 'power2.in' }, S('trust') + 1.75);
    tl.from('#tr2', { y: 60, opacity: 0, duration: 0.6, ease: E4 }, S('trust') + 2.0);
    tl.from('#tr-chip', { scale: 0.6, opacity: 0, duration: 0.6, ease: EB }, S('trust') + 2.9);
    tl.from('#tr-reg', { opacity: 0, y: 20, duration: 0.5, ease: E3 }, S('trust') + 3.2);
    tl.to('#s5 > *', { opacity: 0, duration: 0.4 }, T6 - 0.2);

    // ---------- 6 BAG
    show('s6', T6 - 0.15, T7 + 0.4);
    tl.fromTo('#bag', { y: 900, rotationY: -40, rotationX: 20 }, { y: 0, rotationY: -14, rotationX: 4, duration: 1.0, ease: 'expo.out' }, T6);
    tl.to('#bag', { rotationY: 10, duration: T7 - T6 - 1, ease: 'sine.inOut' }, T6 + 1);
    tl.from('#bg-h', { y: 60, opacity: 0, duration: 0.7, ease: E4 }, T6 + 0.25);
    const dr = ['pek-bantuan', 'katil-pasang', 'hantar-kotak', 'serahan', 'muat-bekalan'];
    dr.forEach((m, i) => {
      const d = document.createElement('div'); d.className = 'ptile';
      Object.assign(d.style, { left: (L ? 1290 : 430) + ((i * 97) % 200) - 60 + 'px', top: (L ? 390 : 880) + 'px', width: '220px', height: '220px', backgroundImage: `url(assets/${m}.jpg)`, borderWidth: '6px' });
      $('drops').appendChild(d);
      tl.fromTo(d, { y: -230, x: (i - 2) * 230, rotation: (i - 2) * 25, opacity: 0, scale: 0.8 },
        { y: 120, x: 0, rotation: (i - 2) * 6, scale: 0.6, opacity: 1, duration: 0.75, ease: 'power2.in' }, T6 + 0.9 + i * 0.28);
      tl.set(d, { opacity: 0 }, T6 + 0.9 + i * 0.28 + 0.75);
      tl.to('#bag', { scaleY: 0.96, scaleX: 1.03, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, T6 + 0.9 + i * 0.28 + 0.72);
      tl.set(d, { opacity: 0 }, 0);
    });
    tl.to(['#bag', '#bg-h'], { scale: 2.6, z: 600, opacity: 0, duration: 0.55, ease: 'power3.in' }, T7 - 0.35);

    // ---------- 7 END
    show('s7', T7 - 0.15);
    tl.from('#en-logo', { scale: 0.4, opacity: 0, rotationY: -60, duration: 1.1, ease: 'expo.out' }, T7 + 0.15);
    tl.from('#en-tag', { y: 40, opacity: 0, duration: 0.6, ease: E3 }, T7 + 0.6);
    tl.from('#en-url', { scale: 0.5, opacity: 0, duration: 0.7, ease: EB }, T7 + 0.85);
    tl.from('#en-b1', { y: 60, opacity: 0, duration: 0.6, ease: EB }, T7 + 1.25);
    tl.from('#en-b2', { y: 60, opacity: 0, duration: 0.6, ease: EB }, T7 + 1.38);
    tl.from('#en-reg', { opacity: 0, duration: 0.6 }, T7 + 1.6);
    tl.to('#en-b1', { scale: 1.07, duration: 0.35, yoyo: true, repeat: 3, ease: 'sine.inOut' }, T7 + 2.2);
    bob($('en-logo'), 0, 10, 1.1, 0);

    // ---------- unified scene transitions (camera push-through)
    const cuts = [[null, 's1', 0], ['s1', 's2', T2], ['s2', 's3', T3], ['s3', 's4', T4], ['s4', 's5', T5], ['s5', 's6', T6], ['s6', 's7', T7]];
    cuts.forEach(([out, inn, t]) => {
      if (out) tl.to('#' + out, { scale: 1.14, opacity: 0, filter: 'blur(14px)', duration: 0.5, ease: 'power2.in' }, t - 0.32);
      if (t > 0) tl.fromTo('#' + inn, { scale: 0.88, opacity: 0, filter: 'blur(14px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, t - 0.12);
    });
    tl.set({}, {}, END);
  }

  // ---------- captions (word timing estimated by character share)
  const cap = $('cap'), ci = document.createElement('div'); ci.className = 'cap-inner'; cap.appendChild(ci);
  const KW = ['percuma', 'ebook', 'rm1', 'infak', 'papan', 'impak', 'muafakatcare.my', 'kebaikan', 'direkod', 'wakaf'];
  P.forEach((p) => {
    const ws = p.text.split(' '), tot = ws.reduce((a, w) => a + w.length + 1, 0); let t = p.start;
    p.words = ws.map((w) => { const d = ((w.length + 1) / tot) * (p.end - p.start); const o = { w, t0: t }; t += d; return o; });
  });
  let cur = -2;
  function renderCap(t) {
    let idx = -1;
    P.forEach((p, i) => { const nx = i + 1 < P.length ? P[i + 1].start : 1e9; if (t >= p.start - 0.08 && t < Math.min(nx - 0.02, p.end + 0.45)) idx = i; });
    if (idx !== cur) {
      cur = idx; ci.innerHTML = '';
      if (idx >= 0) P[idx].words.forEach((o) => {
        const sp = document.createElement('span'); sp.textContent = o.w + ' ';
        if (KW.includes(o.w.toLowerCase().replace(/[.,?!]$/g, ''))) sp.classList.add('kw'); ci.appendChild(sp);
      });
    }
    cap.style.opacity = idx >= 0 ? 1 : 0;
    if (idx >= 0) {
      const p = P[idx], ap = Math.min(1, (t - (p.start - 0.08)) / 0.15);
      ci.style.transform = `translateY(${(1 - ap) * 18}px) scale(${0.96 + 0.04 * ap})`;
      [...ci.children].forEach((sp, i) => sp.classList.toggle('on', t >= p.words[i].t0));
    }
  }

  window.seek = (t) => { tl.seek(t, false); applyFloat(t); renderCap(t); };
  window.addEventListener('load', () => {
    build();
    window.DURATION = TL.duration;
    document.fonts.ready.then(() => { window.seek(0); window.READY = true; });
  });
})();
