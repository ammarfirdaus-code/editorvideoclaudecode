// Shared engine: paused GSAP master timeline driven by VO timeline (window.TL),
// karaoke captions, and window.seek(t) for frame-by-frame rendering.
(function () {
  const TL = window.TL;
  const P = TL.phrases;
  const S = (s) => P.find((p) => p.s === s).start;          // scene start
  const E = (s) => [...P].reverse().find((p) => p.s === s).end; // scene end
  const tl = gsap.timeline({ paused: true });
  window.SCENE = { S, E, P, TL };

  // --- captions ---------------------------------------------------------
  const cap = document.getElementById('cap');
  const capInner = document.createElement('div');
  capInner.className = 'cap-inner';
  cap.appendChild(capInner);
  const keywords = (window.CAP_KEYWORDS || []).map((k) => k.toLowerCase());
  // estimate word timings by character share
  P.forEach((p) => {
    const words = p.text.split(' ');
    const total = words.reduce((a, w) => a + w.length + 1, 0);
    let t = p.start;
    p.words = words.map((w) => {
      const d = ((w.length + 1) / total) * (p.end - p.start);
      const o = { w, t0: t, t1: t + d };
      t += d;
      return o;
    });
  });
  let current = -1;
  function renderCaption(t) {
    let idx = -1;
    for (let i = 0; i < P.length; i++) {
      const nextStart = i + 1 < P.length ? P[i + 1].start : Infinity;
      if (t >= P[i].start - 0.08 && t < Math.min(nextStart - 0.02, P[i].end + 0.5)) idx = i;
    }
    if (idx !== current) {
      current = idx;
      capInner.innerHTML = '';
      if (idx >= 0)
        P[idx].words.forEach((o) => {
          const sp = document.createElement('span');
          const clean = o.w.toLowerCase().replace(/[.,?!]/g, '');
          sp.textContent = o.w + ' ';
          if (keywords.includes(clean)) sp.classList.add('kw');
          capInner.appendChild(sp);
        });
    }
    cap.style.opacity = idx >= 0 ? 1 : 0;
    if (idx >= 0) {
      const p = P[idx];
      const appear = Math.min(1, (t - (p.start - 0.08)) / 0.15);
      capInner.style.transform = `translateY(${(1 - appear) * 20}px) scale(${0.96 + 0.04 * appear})`;
      [...capInner.children].forEach((sp, i) => {
        sp.classList.toggle('on', t >= p.words[i].t0);
      });
    }
  }

  window.seek = function (t) {
    tl.seek(t, false);
    renderCaption(t);
  };
  window.addEventListener('load', () => {
    window.build(tl, S, E);
    window.DURATION = TL.duration + (window.OUTRO || 2.2);
    document.fonts.ready.then(() => {
      window.seek(0);
      window.READY = true;
    });
  });
  // preview mode: ?play
  if (location.search.includes('play')) {
    window.addEventListener('load', () => {
      const a = new Audio('vo.wav');
      const t0 = performance.now();
      a.play().catch(() => {});
      (function loop() {
        const t = (performance.now() - t0) / 1000;
        window.seek(t);
        if (t < window.DURATION) requestAnimationFrame(loop);
      })();
    });
  }
})();
