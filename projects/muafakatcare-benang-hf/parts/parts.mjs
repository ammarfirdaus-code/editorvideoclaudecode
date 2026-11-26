// Bahagian ilustrasi boleh guna semula (SVG, koordinat piksel 1080×1920).
// Gaya ikut bingkai rujukan assets/gaya/sukarelawan-gaya.png: rata, tanpa garis luar,
// bayang lembut, muka ringkas (mata titik, kening, pipi merah jambu), tangan berjari.
export const C = {
  skinA: "#F2C4A0", skinAd: "#E3AC85", skinB: "#D9A07A", skinBd: "#C48a64", skinC: "#C98E6A", skinCd: "#B07752",
  red: "#C5162E", redD: "#A11226", navy: "#1E1A68", navyD: "#15124D", beanie: "#7FB3E0", beanieD: "#6597C6",
  purple: "#7A6FB5", purpleD: "#655AA0", lilac: "#5E59A6", box: "#C89B6D", boxD: "#B08156", boxL: "#D6AC80",
  ribbon: "#ED2B3A", ink: "#2B2E3A", cheek: "#F28B82", white: "#FFFFFF",
};

// Tangan dilihat dari depan (gaya "sarung tangan" seperti bingkai rujukan): tapak membulat,
// tiga garis jari di hujung, ibu jari di atas. Jari menghala ke `dir` (+1 kanan, -1 kiri) dari pergelangan (x,y).
export function hand(x, y, dir = 1, s = 1, skin = C.skinA, skinD = C.skinAd, id = "") {
  const L = 70 * s, H = 54 * s, x0 = dir > 0 ? x - 6 * s : x - L + 6 * s;
  const lines = [-12, 2, 16].map(dy =>
    `<path d="M${x + dir * 40 * s} ${y + dy * s} l${dir * 24 * s} 0" stroke="${skinD}" stroke-width="${3 * s}" stroke-linecap="round"/>`).join("");
  return `<g ${id ? `id="${id}"` : ""} filter="url(#shsP)">
    <rect x="${x0}" y="${y - H / 2}" width="${L}" height="${H}" rx="${24 * s}" fill="${skin}"/>
    ${lines}
    <ellipse cx="${x + dir * 22 * s}" cy="${y - 28 * s}" rx="${24 * s}" ry="${11 * s}" fill="${skin}" transform="rotate(${dir * -18} ${x + dir * 22 * s} ${y - 28 * s})"/>
  </g>`;
}

// Lengan: bahu → siku → pergelangan, garis tebal berbucu bulat; `sleeve` = sampai mana lengan baju (0..1 dari bahu).
export function arm(sh, el, wr, w, skin, sleeveColor, sleeve = 1) {
  const seg = (a, b, col, wd) => `<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" stroke="${col}" stroke-width="${wd}" stroke-linecap="round" filter="url(#shsP)"/>`;
  if (sleeve >= 1) return seg(sh, el, sleeveColor, w) + seg(el, wr, sleeveColor, w * .92);
  const mid = [sh[0] + (el[0] - sh[0]) * sleeve, sh[1] + (el[1] - sh[1]) * sleeve];
  return seg(sh, el, skin, w * .86) + seg(el, wr, skin, w * .8) + seg(sh, mid, sleeveColor, w * 1.06);
}

// Muka ringkas: mata, kening, hidung, senyum, pipi. `blinkId` membungkus mata untuk animasi kelip.
export function face(cx, cy, s = 1, blinkId = "", skinD = C.skinAd) {
  return `
    <g ${blinkId ? `id="${blinkId}"` : ""}>
      <ellipse cx="${cx - 34 * s}" cy="${cy}" rx="${9 * s}" ry="${12 * s}" fill="${C.ink}"/>
      <ellipse cx="${cx + 34 * s}" cy="${cy}" rx="${9 * s}" ry="${12 * s}" fill="${C.ink}"/>
      <circle cx="${cx - 31 * s}" cy="${cy - 4 * s}" r="${2.6 * s}" fill="#fff"/><circle cx="${cx + 37 * s}" cy="${cy - 4 * s}" r="${2.6 * s}" fill="#fff"/>
    </g>
    <path d="M${cx - 50 * s} ${cy - 30 * s} q${16 * s} ${-10 * s} ${32 * s} ${-2 * s} M${cx + 18 * s} ${cy - 32 * s} q${16 * s} ${-8 * s} ${32 * s} ${2 * s}" stroke="${C.ink}" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/>
    <path d="M${cx + 2 * s} ${cy + 10 * s} q${-6 * s} ${18 * s} ${4 * s} ${20 * s}" stroke="${skinD}" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>
    <path d="M${cx - 22 * s} ${cy + 46 * s} q${22 * s} ${18 * s} ${44 * s} 0" stroke="#9B4A3A" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/>
    <ellipse cx="${cx - 52 * s}" cy="${cy + 36 * s}" rx="${15 * s}" ry="${9 * s}" fill="${C.cheek}" opacity=".5"/>
    <ellipse cx="${cx + 52 * s}" cy="${cy + 36 * s}" rx="${15 * s}" ry="${9 * s}" fill="${C.cheek}" opacity=".5"/>`;
}

// Kotak pek makanan dilihat dari depan, dengan reben dan riben di atas.
export function box(x, y, w, h, idPrefix = "") {
  const lid = h * .16;
  return `<g ${idPrefix ? `id="${idPrefix}"` : ""} filter="url(#shP)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.box}"/>
    <rect x="${x - 6}" y="${y}" width="${w + 12}" height="${lid}" rx="5" fill="${C.boxL}"/>
    <rect x="${x}" y="${y + lid}" width="${w}" height="8" fill="${C.boxD}" opacity=".5"/>
    <rect x="${x + w / 2 - 14}" y="${y}" width="28" height="${h}" fill="${C.ribbon}"/>
    <path d="M${x + w / 2} ${y} C${x + w / 2 - 70} ${y - 70} ${x + w / 2 - 110} ${y - 5} ${x + w / 2} ${y} C${x + w / 2 + 110} ${y - 5} ${x + w / 2 + 70} ${y - 70} ${x + w / 2} ${y}" fill="${C.ribbon}"/>
    <circle cx="${x + w / 2}" cy="${y - 4}" r="13" fill="#C9142C"/>
  </g>`;
}

// ---- Babak sukarelawan: dua orang separuh badan memegang satu kotak (seperti bingkai rujukan) ----
// Lapisan: badan & kepala → lengan (lengan dalam di belakang kotak) → kotak → tangan.
export function volunteersPair() {
  const W = { cx: 330, cy: 1010 };   // wanita bertudung
  const M = { cx: 770, cy: 960 };    // lelaki berkopiah biru
  const bx = 400, by = 1330, bw = 300, bh = 210;
  return `<g transform="translate(0 -110)">
  <g id="sk-a">
    <path d="M110 2040 L122 1350 Q132 1225 245 1196 L415 1196 Q528 1225 538 1350 L550 2040 Z" fill="${C.red}" filter="url(#shP)"/>
    <path d="M110 2040 L122 1350 Q132 1225 245 1196 L415 1196 Q528 1225 538 1350 L550 2040 Z" fill="url(#cloth)"/>
    <g id="sk-a-head">
      <path d="M${W.cx} 862 C224 862 196 960 200 1046 C204 1130 222 1186 160 1250 Q${W.cx} 1330 500 1250 C438 1186 456 1130 460 1046 C464 960 436 862 ${W.cx} 862 Z" fill="${C.navy}" filter="url(#shsP)"/>
      <ellipse cx="${W.cx}" cy="${W.cy + 18}" rx="96" ry="112" fill="${C.skinA}"/>
      <ellipse cx="${W.cx}" cy="${W.cy + 18}" rx="96" ry="112" fill="url(#skinShade)"/>
      <path d="M228 1000 C232 900 428 900 432 1000 C404 950 256 950 228 1000 Z" fill="${C.navy}"/>
      <path d="M${W.cx} 868 C262 868 222 902 210 960" stroke="#2E2990" stroke-width="12" fill="none" stroke-linecap="round" opacity=".7"/>
      ${face(W.cx, W.cy + 20, 1, "sk-a-eyes", C.skinAd)}
    </g>
    ${arm([462, 1290], [470, 1400], [420, 1440], 82, C.skinA, C.redD, 1)}
    ${arm([176, 1290], [158, 1470], [356, 1532], 86, C.skinA, C.redD, 1)}
  </g>
  <g id="sk-b">
    <path d="M540 2040 L552 1300 Q562 1175 680 1150 L860 1150 Q978 1175 988 1300 L1000 2040 Z" fill="${C.red}" filter="url(#shP)"/>
    <path d="M540 2040 L552 1300 Q562 1175 680 1150 L860 1150 Q978 1175 988 1300 L1000 2040 Z" fill="url(#cloth)"/>
    <rect x="728" y="1066" width="84" height="96" rx="20" fill="${C.skinBd}"/>
    <path d="M700 1150 Q770 1192 840 1150" fill="none" stroke="${C.redD}" stroke-width="14" stroke-linecap="round"/>
    <g id="sk-b-head">
      <ellipse cx="${M.cx - 106}" cy="${M.cy + 22}" rx="22" ry="30" fill="${C.skinB}"/>
      <ellipse cx="${M.cx + 106}" cy="${M.cy + 22}" rx="22" ry="30" fill="${C.skinB}"/>
      <ellipse cx="${M.cx}" cy="${M.cy + 20}" rx="104" ry="118" fill="${C.skinB}"/>
      <ellipse cx="${M.cx}" cy="${M.cy + 20}" rx="104" ry="118" fill="url(#skinShade)"/>
      <path d="M${M.cx - 108} ${M.cy - 22} Q${M.cx - 104} ${M.cy - 150} ${M.cx} ${M.cy - 154} Q${M.cx + 104} ${M.cy - 150} ${M.cx + 108} ${M.cy - 22} Z" fill="${C.beanie}"/>
      <rect x="${M.cx - 118}" y="${M.cy - 52}" width="236" height="44" rx="22" fill="${C.beanieD}"/>
      <path d="M${M.cx - 96} ${M.cy - 8} q34 -16 70 -4" stroke="#3B2A22" stroke-width="13" fill="none" stroke-linecap="round" opacity=".85"/>
      ${face(M.cx, M.cy + 24, 1.02, "sk-b-eyes", C.skinBd)}
    </g>
    ${arm([600, 1260], [610, 1390], [680, 1440], 80, C.skinB, C.redD, .45)}
    ${arm([948, 1270], [966, 1470], [744, 1532], 86, C.skinB, C.redD, .45)}
  </g>
  ${box(bx, by, bw, bh, "sk-box")}
  <g id="sk-hands">
    ${hand(420, 1440, 1, 1.1, C.skinA, C.skinAd)}
    ${hand(356, 1532, 1, 1.1, C.skinA, C.skinAd)}
    ${hand(680, 1440, -1, 1.1, C.skinB, C.skinBd)}
    ${hand(744, 1532, -1, 1.1, C.skinB, C.skinBd)}
  </g></g>`;
}

// Tangan menuding, dilukis dengan hujung jari telunjuk di (0,0) menghala ke kiri; diletak dengan
// translate(x,y) rotate(angle). 0° = tuding kiri, 90° = tuding atas, -90° = tuding bawah.
export function pointingHand(x, y, angle = 0, s = 1, id = "", skin = C.skinA, skinD = C.skinAd, sleeve = C.navy) {
  return `<g ${id ? `id="${id}"` : ""}><g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})" filter="url(#shP)">
    <rect x="214" y="-40" width="520" height="128" rx="26" fill="${sleeve}"/>
    <rect x="214" y="-40" width="40" height="128" rx="12" fill="#fff" opacity=".12"/>
    <rect x="96" y="-34" width="138" height="112" rx="40" fill="${skin}"/>
    <rect x="96" y="-34" width="138" height="112" rx="40" fill="url(#skinShade)"/>
    <rect x="0" y="-15" width="132" height="30" rx="15" fill="${skin}"/>
    <rect x="6" y="-10" width="24" height="18" rx="8" fill="#F8DCC6"/>
    <rect x="84" y="16" width="64" height="24" rx="12" fill="${skin}"/>
    <rect x="88" y="38" width="60" height="22" rx="11" fill="${skin}"/>
    <rect x="94" y="58" width="54" height="20" rx="10" fill="${skin}"/>
    <path d="M96 39 l40 0 M100 59 l36 0" stroke="${skinD}" stroke-width="3" stroke-linecap="round"/>
    <rect x="128" y="-58" width="78" height="26" rx="13" fill="${skin}" transform="rotate(-12 128 -45)"/>
  </g></g>`;
}

// Penolak troli dilihat dari sisi, menghadap kanan. Kaki di (x, y); kaki boleh dihayun (id pj-legF / pj-legB).
export function trolleyWalker(x, y) {
  const t = (dx, dy) => `${x + dx} ${y + dy}`;
  const leg = (id, col, dx) => `<g id="${id}">
      <rect x="${x + dx - 26}" y="${y - 262}" width="52" height="236" rx="24" fill="${col}"/>
      <ellipse cx="${x + dx + 16}" cy="${y - 16}" rx="44" ry="19" fill="#2B2E3A"/></g>`;
  const boxSide = (bx, by, bw, bh, id = "") => `<g ${id ? `id="${id}"` : ""} filter="url(#shsP)">
      <rect x="${x + bx}" y="${y + by}" width="${bw}" height="${bh}" rx="6" fill="${C.box}"/>
      <rect x="${x + bx}" y="${y + by}" width="${bw}" height="${bh * .14}" rx="5" fill="${C.boxL}"/>
      <rect x="${x + bx + bw / 2 - 9}" y="${y + by}" width="18" height="${bh}" fill="${C.ribbon}"/></g>`;
  return `
  <g id="pj-trolley">
    <path d="M${t(118, -470)} L${t(150, -470)} M${t(134, -470)} L${t(170, -34)} L${t(380, -34)}" stroke="#3A3F55" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${boxSide(176, -168, 190, 130)}${boxSide(186, -290, 170, 122)}${boxSide(208, -380, 126, 90, "pj-topbox")}
    <g id="pj-wh1"><circle cx="${x + 196}" cy="${y - 4}" r="30" fill="#2B2E3A"/><circle cx="${x + 196}" cy="${y - 4}" r="11" fill="#C8CCD8"/><rect x="${x + 193}" y="${y - 30}" width="6" height="14" fill="#C8CCD8"/></g>
    <g id="pj-wh2"><circle cx="${x + 352}" cy="${y - 4}" r="30" fill="#2B2E3A"/><circle cx="${x + 352}" cy="${y - 4}" r="11" fill="#C8CCD8"/><rect x="${x + 349}" y="${y - 30}" width="6" height="14" fill="#C8CCD8"/></g>
  </g>
  ${arm([x - 4, y - 470], [x + 52, y - 380], [x + 118, y - 446], 50, C.skinC, C.redD, .5)}
  ${leg("pj-legB", C.navyD, -8)}
  <g id="pj-body">
    <rect x="${x - 66}" y="${y - 528}" width="132" height="290" rx="54" fill="${C.red}" filter="url(#shsP)"/>
    <rect x="${x - 66}" y="${y - 528}" width="132" height="290" rx="54" fill="url(#cloth)"/>
    <g id="pj-head">
      <rect x="${x - 14}" y="${y - 576}" width="40" height="60" rx="14" fill="${C.skinCd}"/>
      <circle cx="${x + 8}" cy="${y - 616}" r="74" fill="${C.skinC}"/>
      <circle cx="${x + 8}" cy="${y - 616}" r="74" fill="url(#skinShade)"/>
      <circle cx="${x + 82}" cy="${y - 602}" r="12" fill="${C.skinC}"/>
      <ellipse cx="${x - 16}" cy="${y - 606}" rx="14" ry="20" fill="${C.skinCd}"/>
      <path d="M${t(-68, -630)} Q${t(-60, -716)} ${t(10, -720)} Q${t(84, -716)} ${t(86, -640)} Z" fill="${C.beanie}"/>
      <rect x="${x - 74}" y="${y - 656}" width="164" height="32" rx="16" fill="${C.beanieD}"/>
      <ellipse cx="${x + 52}" cy="${y - 612}" rx="7" ry="9" fill="${C.ink}"/>
      <path d="M${t(42, -636)} q12 -6 22 0" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M${t(48, -578)} q14 8 26 -2" stroke="#7A4030" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="${x + 34}" cy="${y - 590}" rx="13" ry="8" fill="${C.cheek}" opacity=".45"/>
    </g>
  </g>
  ${leg("pj-legF", C.navy, 8)}
  ${arm([x + 10, y - 470], [x + 72, y - 372], [x + 126, y - 440], 54, C.skinC, C.red, .5)}
  <circle cx="${x + 128}" cy="${y - 448}" r="22" fill="${C.skinC}" filter="url(#shsP)"/>`;
}

// Babak pintu: mak cik bertudung di ambang pintu menyambut kotak dengan dua tangan;
// sukarelawan di latar depan, dilihat dari belakang, menghulur kotak (id pt-give bergerak).
export function doorHandover() {
  return `
  <g id="pt-mak">
    <path d="M330 1960 L342 1240 Q352 1120 460 1094 L660 1094 Q768 1120 778 1240 L790 1960 Z" fill="${C.purple}" filter="url(#shP)"/>
    <path d="M330 1960 L342 1240 Q352 1120 460 1094 L660 1094 Q768 1120 778 1240 L790 1960 Z" fill="url(#cloth)"/>
    <g id="pt-head">
      <path d="M560 760 C454 760 426 858 430 944 C434 1028 452 1084 390 1150 Q560 1230 730 1150 C668 1084 686 1028 690 944 C694 858 666 760 560 760 Z" fill="${C.lilac}" filter="url(#shsP)"/>
      <ellipse cx="560" cy="926" rx="94" ry="110" fill="#D9A77E"/>
      <ellipse cx="560" cy="926" rx="94" ry="110" fill="url(#skinShade)"/>
      <path d="M460 900 C464 800 656 800 660 900 C632 850 488 850 460 900 Z" fill="${C.lilac}"/>
      <g id="pt-eyes"><path d="M512 920 q16 -14 32 0 M576 920 q16 -14 32 0" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      <path d="M520 892 q14 -8 28 -2 M574 890 q14 -6 28 2" stroke="${C.ink}" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M538 966 q22 18 44 0" stroke="#8A4A38" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M508 978 q4 10 14 12 M612 978 q-4 10 -14 12" stroke="#C08A66" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
      <ellipse cx="508" cy="958" rx="15" ry="9" fill="${C.cheek}" opacity=".45"/><ellipse cx="612" cy="958" rx="15" ry="9" fill="${C.cheek}" opacity=".45"/>
    </g>
    ${arm([372, 1190], [380, 1370], [478, 1418], 80, "#D9A77E", C.purpleD, 1)}
    ${arm([748, 1190], [760, 1370], [668, 1418], 80, "#D9A77E", C.purpleD, 1)}
  </g>
  <g id="pt-give">
    ${box(440, 1240, 260, 186, "pt-box")}
    <g id="pt-vol">
      ${arm([250, 1560], [330, 1470], [448, 1360], 88, C.skinC, C.redD, .5)}
      ${hand(448, 1360, 1, 1.15, C.skinC, C.skinCd)}
      <path d="M-40 1960 L-30 1600 Q-10 1470 150 1452 L250 1460 Q400 1490 410 1640 L420 1960 Z" fill="${C.red}" filter="url(#shP)"/>
      <path d="M-40 1960 L-30 1600 Q-10 1470 150 1452 L250 1460 Q400 1490 410 1640 L420 1960 Z" fill="url(#cloth)"/>
      <rect x="140" y="1384" width="80" height="80" rx="22" fill="${C.skinCd}"/>
      <ellipse cx="180" cy="1300" rx="120" ry="128" fill="${C.skinC}"/>
      <path d="M58 1312 Q60 1164 180 1158 Q300 1164 302 1312 Z" fill="${C.beanie}"/>
      <rect x="54" y="1270" width="252" height="50" rx="25" fill="${C.beanieD}"/>
      <ellipse cx="300" cy="1330" rx="22" ry="30" fill="${C.skinC}"/>
    </g>
  </g>
  <g id="pt-hands">
    ${hand(478, 1418, 1, 1.1, "#D9A77E", "#C08A66")}
    ${hand(668, 1418, -1, 1.1, "#D9A77E", "#C08A66")}
  </g>`;
}

// Dua tangan memegang kad dari bawah kiri dan kanan (jari di muka kad), lengan baju indigo.
export function cardHands() {
  return `
  <g id="hd-hl">${arm([60, 2040], [120, 1740], [258, 1470], 110, C.skinA, C.navy, 1)}${hand(258, 1470, 1, 1.5, C.skinA, C.skinAd)}</g>
  <g id="hd-hr">${arm([1020, 2040], [960, 1740], [822, 1470], 110, C.skinA, C.navy, 1)}${hand(822, 1470, -1, 1.5, C.skinA, C.skinAd)}</g>`;
}

// Tangan menuding dari imej Codex (assets/img/tangan-tuding.webp, 1490×523, hujung jari di (1,122)).
// Bekas bersaiz sifar dengan hujung jari di asalnya: GSAP x/y meletakkan hujung jari, rotation memusing
// di sekeliling hujung jari (0° tuding kiri, 90° tuding atas, -90° tuding bawah).
export function handImg(id, s = .55) {
  return `<div id="${id}" style="position:absolute;left:0;top:0;width:0;height:0">` +
    `<img src="assets/img/tangan-tuding.webp" alt="" style="position:absolute;left:${-1 * s}px;top:${-122 * s}px;width:${1490 * s}px;height:${523 * s}px;max-width:none"></div>`;
}

// Pecah teks kepada <span class="w"> per perkataan, untuk kemasukan tajuk per perkataan (motion craft HyperFrames).
export function words(text) {
  return text.split(" ").map(w => `<span class="w" style="display:inline-block">${w}</span>`).join(" ");
}
