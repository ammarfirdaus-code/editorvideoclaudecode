/* PAS 75 Tahun: deterministic scene engine, paper-collage style. window.seek(t) renders the frame at t seconds. */
(function () {
  const D = window.DATA;
  const REEL = D.kind === 'reel';
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (cls, html, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const master = gsap.timeline({ paused: true });
  const FADE = 0.45;
  const LOGO = '<svg class="logo" viewBox="0 0 647 448"><rect width="647" height="448" fill="#008000"/><circle cx="323.5" cy="224" r="157" fill="#ffffff"/></svg>';
  document.querySelector('#mark .dot').outerHTML = LOGO;
  const scenesEl = $('#scenes');
  const usedCredits = [];
  const dark = []; // [start, end] spans where the stage is dark (title, cards, outro, credits)
  let tilt = 0;
  const SFX = []; window.SFX = SFX;
  const sfx = (k, t) => SFX.push([k, Math.round(t * 1000) / 1000]);

  const photoOf = key => (key && D.photos[key] ? D.photos[key] : null);
  const noteCredit = p => { if (p && p.credit && !usedCredits.includes(p.credit)) usedCredits.push(p.credit); };
  const src = f => 'assets/photos/' + f;

  // "slap" an element onto the page like a sticker
  function slap(sc, node, at, rot) {
    const r = rot == null ? 0 : rot;
    sfx(node.classList.contains('vis') || node.classList.contains('note') || node.classList.contains('headline') ? 'slap' : 'tick', sc._start + at);
    master.fromTo(node, { autoAlpha: 0, scale: 1.14, rotation: r - 4 }, { autoAlpha: 1, scale: 1, rotation: r, duration: 0.42, ease: 'back.out(1.7)' }, sc._start + at);
  }
  function drift(sc, node, from) {
    master.to(node, { scale: 1.035, duration: Math.max(1, sc._dur - from), ease: 'none' }, sc._start + from);
  }
  function pops(sc, nodes, at, gap) {
    nodes.filter(Boolean).forEach((n, i) => slap(sc, n, at + i * (gap == null ? 0.16 : gap), 0));
  }
  // visual for a photo slot: a cut-out sticker when there is one, else a taped black-and-white print
  function logoRow(sc, s, info, at) {
    if (!s.logos || !s.logos.length) return;
    const row = el('logos');
    s.logos.forEach((k, i) => { const c = el('logo-card'); const im = el('', null, 'img'); im.src = 'assets/logos/' + k + '.png'; c.appendChild(im); row.appendChild(c); slap(sc, c, at + i * 0.18, i % 2 ? 2 : -2); });
    info.appendChild(row);
  }
  function visual(sc, p, at, forcePrint, colour) {
    const wrap = el('vis');
    noteCredit(p);
    if (p.cut && !forcePrint) {
      wrap.classList.add('cutwrap');
      const im = el('cutout', null, 'img'); im.src = src(colour && p.cutc ? p.cutc : p.cut); wrap.appendChild(im);
    } else {
      const pr = el('print' + (forcePrint ? ' small' : '')); const im = el('', null, 'img'); im.src = src(colour && p.col ? p.col : (p.bw || p.file));
      pr.append(el('tape'), im); wrap.appendChild(pr);
    }
    if (p.credit) wrap.appendChild(el('credit', 'Foto: ' + p.credit));
    tilt = tilt > 0 ? -1.6 : 1.6;
    slap(sc, wrap, at, p.cut && !forcePrint ? 0 : tilt);
    drift(sc, wrap, at + 0.5);
    return wrap;
  }
  function duo(sc, vis, info) {
    const d = el('duo'); if (vis) d.appendChild(vis); d.appendChild(info); sc.appendChild(d); return d;
  }

  const build = {
    date(sc, s) {
      const c = el('center');
      const t = el('typed'); const txt = el('', '', 'span'); const caret = el('caret', '', 'span');
      t.append(txt, caret);
      const sub = el('chip', s.sub || '');
      c.append(t, sub); sc.appendChild(c);
      slap(sc, t, 0.35, -1.2);
      for (let i = 0; i < s.text.length; i++) if (s.text[i] !== ' ') sfx('key', sc._start + 0.9 + (i + 0.5) * 2.2 / s.text.length);
      const o = { n: 0 };
      master.to(o, { n: s.text.length, duration: 2.2, ease: 'none', onUpdate: () => { txt.textContent = s.text.slice(0, Math.round(o.n)); } }, sc._start + 0.9);
      slap(sc, sub, 3.3, 1);
      sc._tick = t0 => { caret.style.opacity = (Math.floor(t0 * 2) % 2 === 0) ? 1 : 0; };
    },
    title(sc, s) {
      sc.classList.add('dark'); dark.push([s.start, s.end]);
      const top = el('t-top');
      const b = el('badge', LOGO + 'Kisah 75 tahun');
      const m = el('t-main', 'PAS <b>75 Tahun</b>');
      const sub = el('t-sub', 'Perjalanan sebuah perjuangan · 1951 – 2026');
      top.append(b, m, sub); sc.appendChild(top);
      const row = el('t-row'); const ps = [];
      [['asri', 'Asri Muda'], ['burhanuddin_p', 'Burhanuddin', 1], ['fadzil', 'Fadzil Noor'], ['nikaziz', 'Nik Aziz', 1], ['hadi_p', 'Hadi Awang']].forEach(([k, n, big]) => {
        const p = photoOf(k); if (!p || !p.cut) return; noteCredit(p);
        const w = el('t-p' + (big ? ' big' : '')); const im = el('', null, 'img'); im.src = src(p.cut);
        w.append(im, el('ntag', n)); row.appendChild(w); ps.push(w);
      });
      sc.appendChild(row);
      slap(sc, b, 0.25, 0);
      sfx('whoosh', sc._start - 0.15); sfx('hit', sc._start + 0.5);
      master.fromTo(m, { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'back.out(1.5)' }, sc._start + 0.45);
      master.fromTo(sub, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, sc._start + 1.0);
      ps.forEach((w, i) => sfx('pop', sc._start + 0.95 + i * 0.14));
      ps.forEach((w, i) => master.fromTo(w, { autoAlpha: 0, y: 90 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }, sc._start + 0.9 + i * 0.14));
    },
    outro(sc, s) {
      sc.classList.add('dark'); dark.push([s.start, D.duration]);
      const c = el('center');
      const b = el('badge', LOGO + '1951 – 2026');
      const m = el('t-main', 'PAS <b>75 Tahun</b>');
      const sub = el('t-sub', 'Satu perjalanan yang belum selesai');
      const y = el('t-sub', 'Menuju seabad · 2051');
      m.style.marginTop = '30px';
      c.append(b, m, sub, y); sc.appendChild(c);
      slap(sc, b, 0.2, 0);
      sfx('whoosh', sc._start - 0.15); sfx('hit', sc._start + 0.45);
      master.fromTo(m, { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'back.out(1.5)' }, sc._start + 0.4);
      master.fromTo([sub, y], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.35 }, sc._start + 1.0);
    },
    photo(sc, s) {
      const p = photoOf(s.photo);
      const info = el('info');
      const t = s.caption ? el('tag', s.caption) : null;
      const sub = s.sub ? el('chip', s.sub) : null;
      if (t) info.appendChild(t); if (sub) info.appendChild(sub);
      if (!p) { const c = el('center'); c.append(...[t, sub].filter(Boolean)); sc.appendChild(c); pops(sc, [t, sub], 0.3, 0.2); return; }
      duo(sc, visual(sc, p, 0.2, false, s.colour), info);
      pops(sc, [t, sub], 0.55, 0.2);
      logoRow(sc, s, info, 1.0);
    },
    words(sc, s) {
      const p = photoOf(s.photo);
      const info = el('info');
      const h = el('headline', s.big); const sub = s.sub ? el('chip', s.sub) : null;
      info.appendChild(h); if (sub) info.appendChild(sub);
      if (p) duo(sc, visual(sc, p, 0.2, true, s.colour), info);
      else { const c = el('center'); c.append(h); if (sub) c.append(sub); sc.appendChild(c); }
      logoRow(sc, s, p ? info : sc.querySelector('.center'), 1.1);
      slap(sc, h, p ? 0.5 : 0.25, -1.2); if (sub) slap(sc, sub, p ? 0.8 : 0.6, 0);
    },
    stat(sc, s) {
      const p = photoOf(s.photo);
      const info = el(p ? 'info' : 'center');
      const big = el('num' + (s.big.length <= 2 ? ' g' : ' long'), s.big);
      const lab = el('tag', s.label || ''); const sub = s.sub ? el('chip', s.sub) : null;
      info.append(big, lab); if (sub) info.appendChild(sub);
      if (p) duo(sc, visual(sc, p, 0.2, true), info); else sc.appendChild(info);
      sfx('thud', sc._start + 0.38);
      master.fromTo(big, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, sc._start + 0.3);
      pops(sc, [lab, sub], 0.7, 0.22);
    },
    seats(sc, s) {
      const p = photoOf(s.photo);
      const info = el('info');
      const note = el('note'); const g = el('seats'); const dots = [];
      for (let i = 0; i < s.total; i++) { const d = el('seat'); g.appendChild(d); dots.push(d); }
      note.append(el('tape'), el('kicker', s.label), g);
      const sub = el('chip', s.sub || '');
      info.append(note, sub);
      if (p) duo(sc, visual(sc, p, 0.2, true), info); else { const c = el('center'); c.append(note, sub); sc.appendChild(c); }
      slap(sc, note, 0.45, 1);
      master.fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.3, stagger: 0.025, ease: 'back.out(2)' }, sc._start + 0.8);
      const w = dots[s.total - 1];
      sfx('roll', sc._start + 0.8); sfx('ding', sc._start + 2.6);
      master.set(w, { className: 'seat won' }, sc._start + 2.6);
      master.fromTo(w, { scale: 1 }, { scale: 1.6, duration: 0.45, yoyo: true, repeat: 3, ease: 'sine.inOut' }, sc._start + 2.6);
      slap(sc, sub, 1.0, 0);
    },
    tiles(sc, s) {
      const viz = el('vis mapviz'); const info = el('info');
      const M = window.MYMAP, hpx = REEL ? 640 : 620, wpx = hpx * M.w / M.h;
      const out = { PLS: [-22, -6, 'end'], PNG: [-24, 10, 'end'], MLK: [-26, 28, 'end'] };
      const keys = Object.keys(M.states);
      let svg = `<svg width="${wpx.toFixed(0)}" height="${hpx}" viewBox="0 0 ${M.w} ${M.h}">`;
      keys.forEach(k => { svg += `<path class="st-halo" d="${M.states[k].d}"/>`; });
      keys.forEach(k => { svg += `<path class="st-base" d="${M.states[k].d}"/><path class="st-on" data-k="${k}" d="${M.states[k].d}"/>`; });
      keys.forEach(k => { const st = M.states[k]; if (!st.name) return; const o = out[k] || [0, 8, 'middle'];
        svg += `<text class="st-lab" data-k="${k}" x="${st.cx + o[0]}" y="${st.cy + o[1]}" text-anchor="${o[2]}">${st.name}</text>`; });
      viz.innerHTML = svg + '</svg>';
      const fills = {};
      viz.querySelectorAll('.st-on').forEach(p => { fills[p.dataset.k] = [p, viz.querySelector(`.st-lab[data-k="${p.dataset.k}"]`)]; });
      info.appendChild(el('kicker', s.label));
      const stats = el('stats'); info.appendChild(stats);
      logoRow(sc, s, info, 1.2);
      duo(sc, viz, info);
      slap(sc, viz, 0.15, -2); drift(sc, viz, 0.7);
      const states = [];
      if (s.init) states.push(Object.assign({ at: sc._start + 0.8 }, s.init));
      s.steps.forEach(x => states.push(x));
      let prevOn = [], prevBox = null;
      states.forEach(st => {
        Object.keys(fills).forEach(k => {
          const on = st.on.includes(k), was = prevOn.includes(k);
          if (on !== was) {
            sfx(on ? 'pop' : 'drop', st.at);
            master.to(fills[k][0], { opacity: on ? 1 : 0, duration: 0.5, ease: 'power2.out' }, st.at);
            if (fills[k][1]) master.to(fills[k][1], { fill: on ? '#ffffff' : '#4a4741', duration: 0.5 }, st.at);
          }
        });
        prevOn = st.on;
        const box = el('statbox'); box.append(el('st-big', st.stat), el('st-sub', st.statsub || '')); stats.appendChild(box);
        if (prevBox) master.to(prevBox, { autoAlpha: 0, duration: 0.25 }, st.at);
        master.fromTo(box, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)', transformOrigin: REEL ? '50% 50%' : '0% 50%' }, st.at + (prevBox ? 0.22 : 0));
        prevBox = box;
      });
    },
    chart(sc, s) {
      const note = el('vis note chart'); const info = el('info');
      const W = REEL ? 880 : 860, H = REEL ? 520 : 480, padL = 14, padB = 46, padT = 34;
      const x = y => padL + (y - 1955) / (2022 - 1955) * (W - padL - 34);
      const yv = v => H - padB - v / 45 * (H - padB - padT);
      const pts = D.seats.map(([y, v]) => [x(y), yv(v)]);
      const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const id = 'clip' + Math.round(sc._start * 1000);
      let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="${id}"><rect x="0" y="-40" width="0" height="${H + 80}"/></clipPath></defs>`;
      svg += `<line x1="0" x2="${W}" y1="${yv(0)}" y2="${yv(0)}" stroke="#141414" stroke-width="3"/>`;
      [1955, 1969, 1986, 1999, 2008, 2022].forEach(y => { svg += `<text x="${x(y)}" y="${H - 8}" font-size="20" text-anchor="middle">${y}</text>`; });
      svg += `<g clip-path="url(#${id})"><path d="${path}" fill="none" stroke="#141414" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
      D.seats.forEach(([y, v], i) => {
        svg += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="9" fill="#0f9d58" stroke="#f8f6f0" stroke-width="4"/>`;
        if (D.seatLabels.includes(y)) svg += `<text x="${pts[i][0] - 14}" y="${pts[i][1] - 20}" font-size="27" font-weight="700" text-anchor="middle" style="fill:#141414">${v}</text>`;
      });
      note.innerHTML = '<div class="tape"></div>' + svg + '</g></svg>';
      info.appendChild(el('kicker', s.label));
      const stats = el('stats'); info.appendChild(stats);
      duo(sc, note, info);
      slap(sc, note, 0.15, 1.2);
      const rect = note.querySelector('clipPath rect');
      const seatOf = y => D.seats.find(a => a[0] === y)[1];
      const states = [{ at: sc._start + 0.6, upto: s.upto }].concat(s.steps);
      let prevBox = null, prevW = 0;
      states.forEach((st, i) => {
        const w = x(st.upto) + 12;
        sfx('swish', st.at);
        master.fromTo(rect, { attr: { width: prevW } }, { attr: { width: w }, duration: i ? 1.1 : 1.8, ease: 'power1.inOut' }, st.at);
        prevW = w;
        const box = el('statbox'); box.append(el('st-big', String(seatOf(st.upto))), el('st-sub', 'kerusi Parlimen · ' + st.upto)); stats.appendChild(box);
        const tIn = st.at + (i ? 0.8 : 1.4);
        if (prevBox) master.to(prevBox, { autoAlpha: 0, duration: 0.25 }, tIn - 0.25);
        master.fromTo(box, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)', transformOrigin: REEL ? '50% 50%' : '0% 50%' }, tIn);
        prevBox = box;
      });
    },
    presidents(sc) {
      const c = el('center');
      const t = el('tag', 'Tujuh presiden');
      const row = el('pres'); const cards = [];
      D.presidents.forEach(([key, name, years]) => {
        const p = photoOf(key); const card = el('pcard'); const im = el('pimg');
        if (p && p.cut) { const i = el('', null, 'img'); i.src = src(key === 'hadi_p' && p.cutc ? p.cutc : p.cut); im.appendChild(i); noteCredit(p); }
        else if (p) { const f = el('pprint'); f.style.backgroundImage = `url("${src(p.bw || p.file)}")`; if (p.pos) f.style.backgroundPosition = p.pos; im.appendChild(f); noteCredit(p); }
        else im.appendChild(el('pmono', name.split(' ').filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('')));
        card.append(im, el('pname', name), el('pyears', years)); row.appendChild(card); cards.push(card);
      });
      c.append(t, row); sc.appendChild(c);
      slap(sc, t, 0.15, -1);
      const per = Math.min(0.5, Math.max(0.22, (sc._dur - 2.2) / 7));
      cards.forEach((cd, i) => slap(sc, cd, 0.5 + i * per, 0));
    },
  };

  // ---- scenes
  D.scenes.forEach((s, i) => {
    const sc = el('scene sc-' + s.type);
    sc.style.zIndex = i + 1;
    sc._start = s.start; sc._dur = s.end - s.start; s._el = sc;
    scenesEl.appendChild(sc);
    build[s.type](sc, s);
    master.fromTo(sc, { autoAlpha: 0 }, { autoAlpha: 1, duration: i ? 0.25 : 0.01, ease: 'none' }, s.start);
    if (i + 1 < D.scenes.length) {
      const nxt = D.scenes[i + 1];
      // paper scenes swap quickly (the next one is transparent); a dark scene covers what is below it
      master.to(sc, { autoAlpha: 0, duration: 0.25, ease: 'none' }, nxt.start - (sc.classList.contains('dark') ? 0 : 0.05));
    }
  });

  // ---- chapter cards
  const card = $('#card');
  D.cards.forEach(c => {
    dark.push([c.start, c.end - 0.2]);
    sfx('whoosh', c.start - 0.2); sfx('hit', c.start + 0.25); sfx('whoosh', c.end - 0.5);
    master.set($('.card-era'), { textContent: c.era }, c.start - 0.02);
    master.set($('.card-title'), { textContent: c.title }, c.start - 0.02);
    master.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'none' }, c.start);
    master.fromTo('.card-era', { scale: 1.2, rotation: -4 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(1.7)' }, c.start + 0.1);
    master.fromTo('.card-title', { scale: 1.1 }, { scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, c.start + 0.2);
    master.to(card, { autoAlpha: 0, duration: 0.35, ease: 'none' }, c.end - 0.35);
  });

  // ---- credits
  const cr = $('#credits');
  const refs = ['Mohd Fadli Ghani, Ensiklopedia Harian PAS', 'Jurnal Sejarah, Universiti Malaya', 'Wikipedia Bahasa Melayu: Parti Islam Se-Malaysia', 'Berita Harian · NST · Utusan Malaysia'];
  cr.append(el('cr-h', 'Sumber gambar'), el('cr-p', usedCredits.join(' &nbsp;·&nbsp; ') || '—'),
    el('cr-h', 'Rujukan'), el('cr-p', refs.join(REEL ? '<br>' : ' &nbsp;·&nbsp; ')),
    el('cr-n', (D.audioCredit || 'Narasi: ElevenLabs') + '<br>Sempena ulang tahun ke-75 PAS · 24 November 2026'));
  master.fromTo(cr, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'none' }, D.credits.start);
  master.to('#hud', { autoAlpha: 0, duration: 0.4 }, D.credits.start);
  master.to('#stage', { opacity: 0, duration: 1.0, ease: 'none' }, D.duration - 1.0);
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
  const capEl = $('#caption'), capSpan = $('#caption span'), yearEl = $('#tl-year'), fill = $('#tl-fill'), hud = $('#hud'), wm = $('#wm');
  const hudFrom = D.scenes[1].start;

  window.seek = function (t) {
    master.time(t, false);
    const y = yearAt(t);
    yearEl.textContent = Math.round(y);
    fill.style.width = Math.max(0, Math.min(100, (y - 1951) / 75 * 100)) + '%';
    const isDark = dark.some(d => t >= d[0] && t < d[1]);
    hud.style.display = (isDark || t < hudFrom) ? 'none' : 'block';
    wm.className = isDark ? 'on-dark' : '';
    let line = null;
    for (const c of D.captions) { if (t >= c[0] && t < c[1]) { line = c[2]; break; } }
    if (line) { capSpan.textContent = line; capEl.style.visibility = 'visible'; } else capEl.style.visibility = 'hidden';
    D.scenes.forEach(s => { if (s._el._tick) s._el._tick(t); });
  };
  window.ready = Promise.all([document.fonts.ready].concat(Array.from(document.images).map(im => im.decode().catch(() => {})))).then(() => { window.seek(0); return true; });
})();
