/* PAS 75 Tahun: deterministic scene engine. window.seek(t) renders the frame at t seconds. */
(function () {
  const D = window.DATA;
  const REEL = D.kind === 'reel';
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (cls, html, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const master = gsap.timeline({ paused: true });
  const FADE = 0.7;
  const scenesEl = $('#scenes');
  const usedCredits = [];

  const TILES = { // stylised Peninsular Malaysia: [col, row, colspan, label]
    PLS: [0, 0, 1, 'Perlis'], KED: [0, 1, 1, 'Kedah'], KEL: [2, 1, 1, 'Kelantan'], TRG: [3, 1, 1, 'Terengganu'],
    PNG: [0, 2, 1, 'P. Pinang'], PRK: [1, 2, 1, 'Perak'], PHG: [2, 2, 2, 'Pahang'],
    SEL: [1, 3, 1, 'Selangor'], NSN: [2, 3, 1, 'N. Sembilan'], MLK: [2, 4, 1, 'Melaka'], JHR: [3, 4, 1, 'Johor'],
  };

  function photoOf(key) { return key && D.photos[key] ? D.photos[key] : null; }
  function noteCredit(p) { if (p && p.credit && !usedCredits.includes(p.credit)) usedCredits.push(p.credit); }

  function plate(sc, p) {
    if (!p) return;
    const pl = el('plate');
    pl.style.backgroundImage = `url("assets/photos/${p.blur || p.file}")`;
    sc.appendChild(pl);
    master.fromTo(pl, { scale: 1.0 }, { scale: 1.08, duration: Math.max(1, sc._dur + FADE), ease: 'none' }, sc._start);
  }
  function credit(sc, p) {
    if (!p || !p.credit) return;
    noteCredit(p);
    sc.appendChild(el('credit', 'Foto: ' + p.credit));
  }
  function rise(sc, nodes, at, gap) {
    nodes.forEach((n, i) => master.fromTo(n, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, sc._start + at + i * (gap || 0.16)));
  }

  const build = {
    date(sc, s) {
      const c = el('center');
      const t = el('date-text'); const txt = el('', '', 'span'); const caret = el('caret', '', 'span');
      t.append(txt, caret);
      const sub = el('date-sub', s.sub || '');
      c.append(t, sub); sc.appendChild(c);
      const o = { n: 0 };
      master.to(o, { n: s.text.length, duration: 2.2, ease: 'none', onUpdate: () => { txt.textContent = s.text.slice(0, Math.round(o.n)); } }, sc._start + 0.9);
      master.fromTo(sub, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, sc._start + 3.3);
      sc._tick = (t0) => { caret.style.opacity = (Math.floor(t0 * 2) % 2 === 0) ? 1 : 0; };
    },
    title(sc) {
      const c = el('center');
      const k = el('t-kicker', '1951 – 2026');
      const m = el('t-main', 'PAS <b>75</b><br>TAHUN');
      const r = el('t-rule');
      const sub = el('t-sub', 'Perjalanan Sebuah Perjuangan');
      c.append(k, m, r, sub); sc.appendChild(c);
      master.fromTo(m, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, sc._start + 0.2);
      master.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.out' }, sc._start + 1.0);
      rise(sc, [k, sub], 1.2, 0.3);
      master.to(m, { scale: 1.04, duration: Math.max(1, sc._dur - 1.6), ease: 'none' }, sc._start + 1.6);
    },
    outro(sc) {
      const c = el('center');
      const m = el('t-main', 'PAS <b>75</b><br>TAHUN');
      const r = el('t-rule');
      const sub = el('t-sub', 'Satu perjalanan yang belum selesai');
      const y = el('t-years', '1951 – 2026 · MENUJU SEABAD 2051');
      c.append(m, r, sub, y); sc.appendChild(c);
      master.fromTo(m, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, sc._start + 0.2);
      master.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.9 }, sc._start + 0.9);
      rise(sc, [sub, y], 1.1, 0.4);
    },
    photo(sc, s) {
      const p = photoOf(s.photo);
      if (!p) { // no archive photo: typographic card
        const c = el('center');
        const big = el('w-big', s.caption || ''); const sub = el('w-sub', s.sub || '');
        c.append(big, sub); sc.appendChild(c); sc.classList.add('noframe');
        rise(sc, [big, sub], 0.3, 0.25);
        return;
      }
      const landscape = p.w / p.h;
      const wide = REEL ? (landscape < 0.8 && p.h >= 1300) : (landscape > 1.3 && p.w >= 1300);
      const old = (s.year || 2000) < 1995 || p.bw;
      let img;
      if (wide) {
        sc.classList.add('wide');
        const f = el('full' + (old ? ' old' : ''));
        img = el('', null, 'img'); img.src = 'assets/photos/' + p.file; f.appendChild(img); sc.appendChild(f);
        master.fromTo(img, { scale: 1.03, xPercent: -0.8 }, { scale: 1.13, xPercent: 0.8, duration: sc._dur + FADE, ease: 'none' }, sc._start);
      } else {
        plate(sc, p);
        const f = el('frame' + (old ? ' old' : ''));
        img = el('', null, 'img'); img.src = 'assets/photos/' + p.file; f.appendChild(img); sc.appendChild(f);
        master.fromTo(f, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, sc._start + 0.15);
        master.to(f, { scale: 1.05, duration: Math.max(1, sc._dur - 1), ease: 'none' }, sc._start + 1.05);
      }
      const side = el('side'); const cap = el('cap');
      const rule = el('cap-rule'); const t = el('cap-t', s.caption || ''); const sub = el('cap-s', s.sub || '');
      if (s.caption || s.sub) { cap.append(rule, t, sub); side.appendChild(cap); sc.appendChild(side);
        master.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, sc._start + 0.5);
        rise(sc, [t, sub], 0.6, 0.2); }
      if (wide) credit(sc, p);
      else if (p.credit) { noteCredit(p); sc.querySelector('.frame').appendChild(el('credit', 'Foto: ' + p.credit)); }
    },
    words(sc, s) {
      const p = photoOf(s.photo); plate(sc, p);
      const c = el('center'); const big = el('w-big', s.big); const sub = el('w-sub', s.sub || '');
      c.append(big, sub); sc.appendChild(c);
      rise(sc, [big, sub], 0.35, 0.3); credit(sc, p);
      if (p) sc.classList.add('noframe');
    },
    stat(sc, s) {
      const p = photoOf(s.photo); plate(sc, p);
      const c = el('center');
      const big = el('s-big' + (s.big.length <= 2 ? ' g' : ''), s.big); const lab = el('s-label', s.label || ''); const sub = el('s-sub', s.sub || '');
      c.append(big, lab, sub); sc.appendChild(c);
      master.fromTo(big, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'back.out(1.6)' }, sc._start + 0.3);
      rise(sc, [lab, sub], 0.8, 0.25); credit(sc, p);
      if (p) sc.classList.add('noframe');
    },
    seats(sc, s) {
      const p = photoOf(s.photo); plate(sc, p);
      const c = el('center');
      const lab = el('w-label', s.label);
      const g = el('seats');
      const dots = [];
      for (let i = 0; i < s.total; i++) { const d = el('seat'); g.appendChild(d); dots.push(d); }
      const sub = el('w-sub', s.sub || '');
      c.append(lab, g, sub); sc.appendChild(c);
      master.fromTo(dots, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out' }, sc._start + 0.4);
      const w = dots[s.total - 1];
      master.set(w, { className: 'seat won' }, sc._start + 2.6);
      master.fromTo(w, { scale: 1 }, { scale: 1.5, duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' }, sc._start + 2.6);
      rise(sc, [lab, sub], 0.2, 0.2); credit(sc, p);
      if (p) sc.classList.add('noframe');
    },
    tiles(sc, s) {
      const sp = el('split'); const viz = el('viz tiles'); const info = el('info');
      const unit = REEL ? 190 : 150, gap = REEL ? 14 : 12;
      viz.style.width = (unit * 4 + gap * 3) + 'px'; viz.style.height = (unit * 0.72 * 5 + gap * 4) + 'px';
      const fills = {};
      Object.keys(TILES).forEach((k, i) => {
        const [c, r, span, name] = TILES[k];
        const t = el('tile'); const f = el('fillg'); const lb = el('', name, 'span');
        t.style.left = (c * (unit + gap)) + 'px'; t.style.top = (r * (unit * 0.72 + gap)) + 'px';
        t.style.width = (unit * span + gap * (span - 1)) + 'px'; t.style.height = (unit * 0.72) + 'px';
        t.append(f, lb); viz.appendChild(t); fills[k] = [f, lb];
        master.fromTo(t, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, sc._start + 0.15 + i * 0.04);
      });
      info.appendChild(el('w-label', s.label));
      const stats = el('stats'); info.appendChild(stats);
      sp.append(viz, info); sc.appendChild(sp);
      const states = [];
      if (s.init) states.push(Object.assign({ at: sc._start + 0.8 }, s.init));
      s.steps.forEach(x => states.push(x));
      let prevOn = [], prevBox = null;
      states.forEach((st) => {
        Object.keys(TILES).forEach(k => {
          const on = st.on.includes(k), was = prevOn.includes(k);
          if (on !== was) {
            master.to(fills[k][0], { opacity: on ? 1 : 0, duration: 0.6, ease: 'power2.out' }, st.at);
            master.to(fills[k][1], { color: on ? '#ffffff' : 'rgba(243,239,228,.45)', duration: 0.6 }, st.at);
          }
        });
        prevOn = st.on;
        const box = el('statbox'); box.append(el('st-big', st.stat), el('st-sub', st.statsub || '')); stats.appendChild(box);
        if (prevBox) master.to(prevBox, { autoAlpha: 0, duration: 0.3 }, st.at);
        master.fromTo(box, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, st.at + (prevBox ? 0.25 : 0));
        prevBox = box;
      });
    },
    chart(sc, s) {
      const sp = el('split'); const viz = el('viz chart'); const info = el('info');
      const W = REEL ? 920 : 900, H = REEL ? 560 : 520, padL = 10, padB = 46, padT = 30;
      const x = y => padL + (y - 1955) / (2022 - 1955) * (W - padL - 30);
      const yv = v => H - padB - v / 45 * (H - padB - padT);
      const pts = D.seats.map(([y, v]) => [x(y), yv(v)]);
      const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const id = 'clip' + Math.round(sc._start * 1000);
      let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="${id}"><rect x="0" y="-40" width="0" height="${H + 80}"/></clipPath></defs>`;
      [0, 15, 30, 45].forEach(v => { svg += `<line x1="0" x2="${W}" y1="${yv(v)}" y2="${yv(v)}" stroke="rgba(243,239,228,.14)" stroke-width="2"/>`; });
      [1955, 1969, 1986, 1999, 2008, 2022].forEach(y => { svg += `<text x="${x(y)}" y="${H - 8}" font-size="20" text-anchor="middle">${y}</text>`; });
      svg += `<g clip-path="url(#${id})"><path d="${path}" fill="none" stroke="#27b566" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
      D.seats.forEach(([y, v], i) => {
        svg += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="8" fill="#0b1410" stroke="#27b566" stroke-width="5"/>`;
        if (D.seatLabels.includes(y)) svg += `<text x="${pts[i][0]}" y="${pts[i][1] - 20}" font-size="26" font-weight="700" text-anchor="middle" style="fill:#f3efe4">${v}</text>`;
      });
      svg += '</g></svg>';
      viz.innerHTML = svg;
      info.appendChild(el('w-label', s.label));
      const stats = el('stats'); info.appendChild(stats);
      sp.append(viz, info); sc.appendChild(sp);
      const rect = viz.querySelector('clipPath rect');
      const seatOf = y => D.seats.find(a => a[0] === y)[1];
      const states = [{ at: sc._start + 0.5, upto: s.upto }].concat(s.steps);
      let prevBox = null, prevW = 0;
      states.forEach((st, i) => {
        const w = x(st.upto) + 11;
        master.fromTo(rect, { attr: { width: prevW } }, { attr: { width: w }, duration: i ? 1.2 : 2.0, ease: 'power1.inOut' }, st.at);
        prevW = w;
        const box = el('statbox'); box.append(el('st-big', String(seatOf(st.upto))), el('st-sub', 'kerusi Parlimen · ' + st.upto)); stats.appendChild(box);
        const tIn = st.at + (i ? 0.9 : 1.6);
        if (prevBox) master.to(prevBox, { autoAlpha: 0, duration: 0.3 }, tIn - 0.3);
        master.fromTo(box, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, tIn);
        prevBox = box;
      });
    },
    presidents(sc) {
      const c = el('center');
      const t = el('pres-title', 'Tujuh Presiden · 1951 – 2026');
      const row = el('pres'); const cards = [];
      D.presidents.forEach(([key, name, years]) => {
        const p = photoOf(key); const card = el('pcard');
        const im = el('pimg');
        if (p) { im.style.backgroundImage = `url("assets/photos/${p.file}")`; if (p.pos) im.style.backgroundPosition = p.pos; noteCredit(p); }
        else im.textContent = name.split(' ').filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('');
        card.append(im, el('pname', name), el('pyears', years)); row.appendChild(card); cards.push(card);
      });
      c.append(t, row); sc.appendChild(c);
      master.fromTo(t, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, sc._start + 0.2);
      const per = Math.min(0.55, Math.max(0.25, (sc._dur - 2.2) / 7));
      cards.forEach((cd, i) => master.fromTo(cd, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, sc._start + 0.5 + i * per));
    },
  };

  // ---- scenes
  D.scenes.forEach((s, i) => {
    const sc = el('scene sc-' + s.type);
    sc.style.zIndex = i + 1;
    sc._start = s.start; sc._dur = s.end - s.start; s._el = sc;
    scenesEl.appendChild(sc);
    build[s.type](sc, s);
    master.fromTo(sc, { autoAlpha: 0 }, { autoAlpha: 1, duration: i ? FADE : 0.01, ease: 'none' }, s.start);
    if (i + 1 < D.scenes.length) master.set(sc, { autoAlpha: 0 }, D.scenes[i + 1].start + FADE + 0.02);
  });

  // ---- chapter cards
  const card = $('#card');
  D.cards.forEach(c => {
    master.set($('.card-era'), { textContent: c.era }, c.start - 0.02);
    master.set($('.card-title'), { textContent: c.title }, c.start - 0.02);
    master.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'none' }, c.start);
    master.fromTo('.card-in', { y: 18 }, { y: 0, duration: 1.0, ease: 'power2.out' }, c.start);
    master.fromTo('.card-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, c.start + 0.3);
    master.to(card, { autoAlpha: 0, duration: 0.6, ease: 'none' }, c.end - 0.35);
  });

  // ---- credits
  const cr = $('#credits');
  const refs = ['Mohd Fadli Ghani, Ensiklopedia Harian PAS', 'Jurnal Sejarah, Universiti Malaya', 'Wikipedia Bahasa Melayu: Parti Islam Se-Malaysia', 'Berita Harian · NST · Utusan Malaysia'];
  cr.append(el('cr-h', 'Sumber gambar'), el('cr-p', usedCredits.join(' &nbsp;·&nbsp; ') || '—'),
    el('cr-h', 'Rujukan'), el('cr-p', refs.join(REEL ? '<br>' : ' &nbsp;·&nbsp; ')),
    el('cr-n', (D.audioCredit || 'Narasi: ElevenLabs') + '<br>Sempena ulang tahun ke-75 PAS · 24 November 2026'));
  master.fromTo(cr, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: 'none' }, D.credits.start);
  master.to('#hud', { autoAlpha: 0, duration: 0.6 }, D.credits.start);
  master.to('#stage', { opacity: 0, duration: 1.0, ease: 'none' }, D.duration - 1.0);
  // HUD hidden on the cold open, the title and the outro
  master.fromTo('#hud', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, D.scenes[1].start);
  master.set({}, {}, D.duration);

  // ---- timeline HUD
  const ticks = $('#tl-ticks');
  [1951, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2026].forEach(y => {
    const pc = (y - 1951) / 75 * 100;
    const i = el('', '', 'i'); i.style.left = pc + '%'; ticks.appendChild(i);
    if (!REEL || [1951, 1970, 1990, 2010, 2026].includes(y)) { const sp = el('', String(y), 'span'); sp.style.left = pc + '%'; ticks.appendChild(sp); }
  });
  const yk = [];
  D.scenes.forEach(s => { if (s.year) yk.push([s.start, s.year]); s.steps.forEach(st => { if (st.year) yk.push([st.at, st.year]); }); });
  yk.sort((a, b) => a[0] - b[0]);
  function yearAt(t) {
    let y = yk[0][1];
    for (let i = 0; i < yk.length; i++) {
      if (t < yk[i][0]) break;
      const prev = i ? yk[i - 1][1] : yk[0][1];
      const k = Math.min(1, (t - yk[i][0]) / 0.9);
      y = prev + (yk[i][1] - prev) * (1 - Math.pow(1 - k, 3));
    }
    return y;
  }
  const capEl = $('#caption'), capSpan = $('#caption span'), yearEl = $('#tl-year'), fill = $('#tl-fill');

  window.seek = function (t) {
    master.time(t, false);
    const y = yearAt(t);
    yearEl.textContent = Math.round(y);
    fill.style.width = Math.max(0, Math.min(100, (y - 1951) / 75 * 100)) + '%';
    let line = null;
    for (const c of D.captions) { if (t >= c[0] && t < c[1]) { line = c[2]; break; } }
    if (line) { capSpan.textContent = line; capEl.style.visibility = 'visible'; } else capEl.style.visibility = 'hidden';
    D.scenes.forEach(s => { if (s._el._tick) s._el._tick(t); });
  };
  window.ready = Promise.all([document.fonts.ready].concat(Array.from(document.images).map(im => im.decode().catch(() => {})))).then(() => { window.seek(0); return true; });
})();
