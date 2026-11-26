// Watak, tangan dan hidangan: vektor dilukis sendiri, saiz sama seperti imej v9.
const K = {
  skin: "#F4B88E", skinD: "#DC9466", skinL: "#F9CFAE", cheek: "#F29A94",
  red: "#D3243A", redD: "#A9182C", redL: "#E8485A",
  navy: "#2A2A86", navyD: "#1E1A68", navyL: "#3A3FA0",
  beanie: "#6E9BE0", beanieD: "#4F7CC4", hair: "#1B1850",
  kraft: "#D3A270", kraftD: "#B98451", kraftL: "#E2B887", rib: "#E0283F", ribD: "#B3142A",
};
const sv = (id, vb, body, cls = "") =>
  `<svg id="${id}" ${cls ? `class="${cls}"` : ""} viewBox="${vb}" preserveAspectRatio="none" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// Kotak hadiah kraf dengan reben. (x,y)=kiri atas, w×h.
export function giftBox(x, y, w, h, p = "gb") {
  const lid = h * 0.2, rw = Math.max(10, w * 0.085), cx = x + w / 2;
  return `<g>
    <rect x="${x + w * .03}" y="${y + lid * .6}" width="${w * .94}" height="${h - lid * .6}" rx="${w * .02}" fill="${K.kraft}"/>
    <rect x="${x + w * .03}" y="${y + lid * .6}" width="${w * .94}" height="${h - lid * .6}" rx="${w * .02}" fill="url(#${p}-sh)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${lid}" rx="${w * .02}" fill="${K.kraftL}"/>
    <rect x="${x}" y="${y + lid * .82}" width="${w}" height="${lid * .18}" fill="${K.kraftD}" opacity=".55"/>
    <rect x="${cx - rw / 2}" y="${y}" width="${rw}" height="${h}" fill="${K.rib}"/>
    <rect x="${cx - rw / 2}" y="${y}" width="${rw * .32}" height="${h}" fill="#F25A6B" opacity=".55"/>
    <path d="M${cx} ${y} C${cx - w * .3} ${y - h * .32} ${cx - w * .42} ${y - h * .04} ${cx - w * .2} ${y + h * .02} C${cx - w * .12} ${y + h * .04} ${cx - w * .04} ${y + h * .01} ${cx} ${y} Z" fill="${K.rib}"/>
    <path d="M${cx} ${y} C${cx + w * .3} ${y - h * .32} ${cx + w * .42} ${y - h * .04} ${cx + w * .2} ${y + h * .02} C${cx + w * .12} ${y + h * .04} ${cx + w * .04} ${y + h * .01} ${cx} ${y} Z" fill="${K.rib}"/>
    <path d="M${cx} ${y} C${cx - w * .22} ${y - h * .2} ${cx - w * .3} ${y - h * .06} ${cx - w * .2} ${y}" stroke="${K.ribD}" stroke-width="${w * .012}" fill="none"/>
    <path d="M${cx} ${y} C${cx + w * .22} ${y - h * .2} ${cx + w * .3} ${y - h * .06} ${cx + w * .2} ${y}" stroke="${K.ribD}" stroke-width="${w * .012}" fill="none"/>
    <ellipse cx="${cx}" cy="${y + h * .01}" rx="${w * .05}" ry="${h * .05}" fill="#C51A31"/>
  </g>`;
}
const boxDefs = p => `<linearGradient id="${p}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5B2E10" stop-opacity=".18"/></linearGradient>`;

// Muka depan: mata, pipi, senyum. r = jejari muka.
function face(cx, cy, r, look = 0) {
  const ex = r * .36, ey = cy + r * .02;
  return `
    <ellipse cx="${cx - ex + look}" cy="${ey}" rx="${r * .075}" ry="${r * .1}" fill="${K.hair}"/>
    <ellipse cx="${cx + ex + look}" cy="${ey}" rx="${r * .075}" ry="${r * .1}" fill="${K.hair}"/>
    <circle cx="${cx - ex + look + r * .025}" cy="${ey - r * .035}" r="${r * .025}" fill="#fff"/>
    <circle cx="${cx + ex + look + r * .025}" cy="${ey - r * .035}" r="${r * .025}" fill="#fff"/>
    <path d="M${cx - ex - r * .12 + look} ${ey - r * .2} q${r * .12} -${r * .07} ${r * .24} 0 M${cx + ex - r * .12 + look} ${ey - r * .2} q${r * .12} -${r * .07} ${r * .24} 0" stroke="${K.hair}" stroke-width="${r * .035}" fill="none" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="${cx - r * .58 + look}" cy="${cy + r * .28}" rx="${r * .15}" ry="${r * .09}" fill="${K.cheek}" opacity=".7"/>
    <ellipse cx="${cx + r * .58 + look}" cy="${cy + r * .28}" rx="${r * .15}" ry="${r * .09}" fill="${K.cheek}" opacity=".7"/>
    <path d="M${cx - r * .05 + look} ${cy + r * .14} q${r * .05} ${r * .06} ${r * .1} 0" stroke="${K.skinD}" stroke-width="${r * .035}" fill="none" stroke-linecap="round"/>
    <path d="M${cx - r * .2 + look} ${cy + r * .38} q${r * .2} ${r * .2} ${r * .4} 0" stroke="#9E3B3B" stroke-width="${r * .045}" fill="none" stroke-linecap="round"/>`;
}

// Tangan ringkas (genggam/tapak) di (x,y), arah d (1 = jari ke kanan).
function mitt(x, y, s, d = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${d * s} ${s})">
    <path d="M-40 -26 Q-10 -40 26 -32 Q48 -26 50 -8 Q52 10 34 18 Q4 30 -30 24 Q-48 18 -48 -2 Q-48 -20 -40 -26 Z" fill="${K.skin}"/>
    <path d="M10 -8 Q30 -6 44 -2 M8 6 Q28 8 40 10" stroke="${K.skinD}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M-12 -30 Q8 -54 30 -46 Q38 -40 30 -34 Q14 -30 0 -18 Z" fill="${K.skinL}"/>
  </g>`;
}

// Tangan memegang dari sisi kotak: jari di muka kotak.
function grip(x, y, s, d) {
  return `<g transform="translate(${x} ${y}) scale(${d * s} ${s})">
    <path d="M-60 -30 Q-30 -46 10 -40 L44 -36 Q62 -30 60 -14 Q72 -6 66 10 Q76 20 66 34 Q56 46 30 44 L-40 40 Q-66 30 -66 0 Q-66 -20 -60 -30 Z" fill="${K.skin}"/>
    <path d="M12 -14 L58 -14 M14 10 L64 10 M10 32 L58 34" stroke="${K.skinD}" stroke-width="4" stroke-linecap="round"/>
    <path d="M-10 -40 Q10 -64 36 -60 Q48 -52 38 -42 Z" fill="${K.skinL}"/>
  </g>`;
}

export function pasangan() {
  return sv("sk-img", "0 0 1080 1935", `
  <defs>
    <radialGradient id="vp-bg" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#4C63C4"/><stop offset=".55" stop-color="#2E3192"/><stop offset="1" stop-color="#1E1A68"/></radialGradient>
    <linearGradient id="vp-shirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E23246"/><stop offset="1" stop-color="#B81B30"/></linearGradient>
    ${boxDefs("vp")}
  </defs>
  <rect width="1080" height="1935" fill="url(#vp-bg)"/>
  <!-- lelaki (kanan) -->
  <rect x="620" y="1700" width="380" height="250" fill="${K.navy}"/>
  <rect x="806" y="1710" width="6" height="240" fill="${K.navyD}"/>
  <rect x="756" y="1040" width="68" height="96" rx="26" fill="${K.skinD}"/>
  <path d="M572 1250 Q580 1130 700 1112 L880 1112 Q1000 1130 1008 1250 L1016 1740 L564 1740 Z" fill="url(#vp-shirt)"/>
  <path d="M742 1112 Q790 1160 838 1112" stroke="${K.redD}" stroke-width="12" fill="none"/>
  <path d="M960 1180 Q1030 1260 1024 1390 L944 1396 Q940 1300 920 1240 Z" fill="${K.redD}"/>
  <path d="M960 1180 Q1024 1250 1022 1380" stroke="#C21F35" stroke-width="70" fill="none" stroke-linecap="round"/>
  <path d="M990 1400 Q1006 1500 930 1530 Q830 1556 730 1530" stroke="${K.skin}" stroke-width="78" fill="none" stroke-linecap="round"/>
  <circle cx="682" cy="958" r="30" fill="${K.skin}"/><circle cx="898" cy="958" r="30" fill="${K.skin}"/>
  <circle cx="682" cy="958" r="13" fill="${K.skinD}"/><circle cx="898" cy="958" r="13" fill="${K.skinD}"/>
  <ellipse cx="790" cy="952" rx="110" ry="124" fill="${K.skin}"/>
  <path d="M680 960 Q676 860 720 846 L700 900 Q696 940 690 990 Z M900 960 Q904 860 860 846 L880 900 Q884 940 890 990 Z" fill="${K.hair}"/>
  <path d="M690 880 Q740 900 800 884 Q850 900 892 880 L892 850 L690 850 Z" fill="${K.hair}"/>
  ${face(790, 975, 96)}
  <path d="M662 880 Q660 704 790 698 Q920 704 918 880 Z" fill="${K.beanie}"/>
  <path d="M708 752 Q790 720 872 752" stroke="${K.beanieD}" stroke-width="8" fill="none" opacity=".6"/>
  <rect x="652" y="838" width="276" height="60" rx="28" fill="${K.beanieD}"/>
  ${[0,1,2,3,4,5,6,7].map(i => `<rect x="${674 + i * 32}" y="848" width="10" height="40" rx="5" fill="${K.beanie}" opacity=".5"/>`).join("")}
  <!-- wanita (kiri) -->
  <rect x="140" y="1690" width="360" height="260" fill="${K.navy}"/>
  <path d="M90 1320 Q98 1214 200 1196 L446 1196 Q546 1214 554 1320 L560 1720 L84 1720 Z" fill="url(#vp-shirt)"/>
  <path d="M176 940 Q186 790 323 784 Q460 790 470 940 L500 1170 Q508 1272 430 1290 L216 1290 Q138 1272 146 1170 Z" fill="#2B3285"/>
  <path d="M300 1286 Q232 1250 200 1150 M346 1286 Q414 1250 446 1150" stroke="#222870" stroke-width="7" fill="none" opacity=".7"/>
  <path d="M220 1000 Q214 880 323 870 Q432 880 426 1000 Q432 1100 323 1140 Q214 1100 220 1000 Z" fill="${K.skin}"/>
  ${face(323, 1010, 88)}
  <path d="M206 960 Q214 846 323 840 Q432 846 440 960 Q420 890 323 886 Q226 890 206 960 Z" fill="#363E9A"/>
  <!-- lengan wanita: panjang, membengkok ke kotak -->
  <path d="M132 1290 Q110 1440 170 1510 Q240 1560 360 1556" stroke="${K.redD}" stroke-width="104" fill="none" stroke-linecap="round"/>
  <path d="M132 1290 Q110 1440 170 1510 Q240 1560 360 1556" stroke="url(#vp-shirt)" stroke-width="88" fill="none" stroke-linecap="round"/>
  ${giftBox(355, 1322, 371, 240, "vp")}
  ${grip(400, 1520, 1.1, 1)}
  ${grip(686, 1520, 1.1, -1)}`);
}

export function jalanTroli() {
  const leg = (id, hip, knee, ank, shoeRot) => `<g id="${id}">
      <path d="M${hip[0]} ${hip[1]} L${knee[0]} ${knee[1]} L${ank[0]} ${ank[1]}" stroke="${K.navy}" stroke-width="74" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(${ank[0]} ${ank[1] + 18}) rotate(${shoeRot})">
        <path d="M-40 -20 Q-38 -34 -10 -32 L20 -30 Q60 -22 66 4 L66 14 L-44 14 Z" fill="#7DB36A"/>
        <rect x="-46" y="8" width="114" height="12" rx="6" fill="#F4F1E8"/>
        <path d="M-6 -28 L30 -18" stroke="#F4F1E8" stroke-width="5"/>
      </g></g>`;
  return sv("pj-walker", "0 0 609 820", `
  <defs>${boxDefs("vw")}<linearGradient id="vw-shirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E23246"/><stop offset="1" stop-color="#B81B30"/></linearGradient></defs>
  <ellipse cx="300" cy="808" rx="270" ry="14" fill="#0F1235" opacity=".22"/>
  <path d="M322 380 L446 774" stroke="#5E8C4E" stroke-width="20" stroke-linecap="round"/>
  <path d="M322 380 L446 774" stroke="#8DBC72" stroke-width="6" stroke-linecap="round" opacity=".7"/>
  <path d="M430 768 L604 768" stroke="#5E8C4E" stroke-width="16" stroke-linecap="round"/>
  ${giftBox(372, 612, 230, 150, "vw")}
  ${giftBox(356, 526, 190, 90, "vw")}
  ${giftBox(366, 438, 160, 90, "vw")}
  <circle cx="446" cy="776" r="42" fill="${K.navyD}"/><circle cx="446" cy="776" r="16" fill="#E8B04A"/>
  ${leg("pjv-legB", [150, 450], [100, 612], [62, 760], -10)}
  <g transform="rotate(9 170 450)">
    <path d="M150 220 Q200 310 270 368" stroke="${K.skinD}" stroke-width="40" fill="none" stroke-linecap="round"/>
    <path d="M104 196 Q150 168 220 172 Q250 186 248 240 L240 448 L100 448 Q82 310 104 196 Z" fill="url(#vw-shirt)"/>
    <rect x="98" y="420" width="148" height="56" rx="20" fill="${K.navy}"/>
  </g>
  ${leg("pjv-legA", [200, 452], [262, 606], [298, 752], 6)}
  <g transform="rotate(9 170 450)">
    <path d="M198 214 Q226 256 238 290" stroke="url(#vw-shirt)" stroke-width="62" fill="none" stroke-linecap="round"/>
    <path d="M236 296 Q262 340 296 372" stroke="${K.skin}" stroke-width="42" fill="none" stroke-linecap="round"/>
    <rect x="180" y="134" width="44" height="54" rx="16" fill="${K.skinD}"/>
    <path d="M150 84 Q140 150 186 168 L228 160 Z" fill="${K.hair}"/>
    <ellipse cx="216" cy="104" rx="56" ry="62" fill="${K.skin}"/>
    <path d="M160 70 Q150 120 168 150 L184 120 Q170 100 178 80 Z" fill="${K.hair}"/>
    <circle cx="180" cy="110" r="15" fill="${K.skin}"/><circle cx="180" cy="110" r="7" fill="${K.skinD}"/>
    <ellipse cx="246" cy="100" rx="6" ry="9" fill="${K.hair}"/>
    <path d="M236 84 q10 -5 20 0" stroke="${K.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="250" cy="124" rx="12" ry="7" fill="${K.cheek}" opacity=".7"/>
    <path d="M234 138 q12 8 24 -2" stroke="#9E3B3B" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M270 104 q9 7 0 15" stroke="${K.skinD}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M152 86 Q146 12 214 8 Q282 8 278 74 Z" fill="${K.beanie}"/>
    <path d="M176 40 Q214 26 254 36" stroke="${K.beanieD}" stroke-width="5" fill="none" opacity=".6"/>
    <path d="M146 66 Q212 48 282 62 Q288 78 284 92 Q214 78 150 98 Q142 82 146 66 Z" fill="${K.beanieD}"/>
  </g>
  <ellipse cx="322" cy="388" rx="26" ry="22" fill="${K.skin}"/>
  <path d="M310 372 Q330 366 344 376" stroke="${K.skinD}" stroke-width="4" fill="none"/>`);
}

export function makcik() {
  const sleeve = d => `<g transform="translate(${d > 0 ? 0 : 479} 0) scale(${d} 1)">
    <path d="M70 380 Q30 470 60 600 L170 610 Q160 520 140 420 Z" fill="#8A5BB8"/>
    <path d="M60 600 L170 610 L176 570 L66 556 Z" fill="#7B4CA8"/>
    <g transform="translate(158 560) rotate(-14)"><path d="M-48 -4 Q-30 -30 12 -24 Q54 -18 62 6 Q52 26 4 28 Q-42 26 -48 -4 Z" fill="${K.skin}"/><path d="M-4 0 Q22 6 48 2" stroke="${K.skinD}" stroke-width="3" fill="none"/><path d="M30 -20 Q60 -42 68 -24 Q62 -8 40 -6 Z" fill="${K.skinL}"/></g></g>`;
  return sv("pt-mak", "0 0 479 1000", `
  <defs><linearGradient id="vk-baju" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C68C8"/><stop offset="1" stop-color="#7B4CA8"/></linearGradient>
  <linearGradient id="vk-tud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B58BD8"/><stop offset="1" stop-color="#9E72CA"/></linearGradient></defs>
  <path d="M40 520 Q50 400 140 380 L340 380 Q430 400 440 520 L479 1000 L0 1000 Z" fill="url(#vk-baju)"/>
  <path d="M20 850 Q240 820 460 850 L479 1000 L0 1000 Z" fill="#7448A2"/>
  ${[[110, 770, -20], [370, 760, 20]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" stroke="#C9A6E6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"><path d="M0 40 Q4 -10 0 -60"/>${[-40, -20, 0, 20].map(k => `<path d="M0 ${k} q-24 -10 -28 -26 M0 ${k - 8} q24 -10 28 -26"/>`).join("")}</g>`).join("")}
  ${sleeve(1)}${sleeve(-1)}
  <path d="M86 200 Q90 26 240 20 Q390 26 394 200 L410 430 Q330 520 240 520 Q150 520 70 430 Z" fill="url(#vk-tud)"/>
  <path d="M110 420 Q240 500 370 420 M130 340 Q240 410 350 340" stroke="#8C60BC" stroke-width="7" fill="none" opacity=".55"/>
  <path d="M146 170 Q146 60 240 56 Q334 60 334 170 Q336 270 240 296 Q144 270 146 170 Z" fill="${K.skin}"/>
  ${face(240, 178, 84)}
  <path d="M190 132 q12 -5 22 0 M268 132 q12 -5 22 0" stroke="${K.skinD}" stroke-width="3" fill="none" opacity=".7"/>
  <path d="M176 236 q-6 10 -2 20 M304 236 q6 10 2 20" stroke="${K.skinD}" stroke-width="3" fill="none" opacity=".7"/>
  <path d="M136 150 Q138 50 240 46 Q342 50 344 150 Q326 92 240 90 Q154 92 136 150 Z" fill="#A87ED2"/>`);
}

export function hulur() {
  return sv("pt-vol", "0 0 910 1340", `
  <defs>${boxDefs("vh")}<linearGradient id="vh-shirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B81B30"/><stop offset=".6" stop-color="#D3243A"/><stop offset="1" stop-color="#E23246"/></linearGradient></defs>
  <path d="M10 600 Q24 470 160 446 L420 446 Q540 466 556 600 L580 1340 L0 1340 Z" fill="url(#vh-shirt)"/>
  <path d="M50 1210 L566 1210 L580 1340 L36 1340 Z" fill="${K.navy}"/>
  <rect x="226" y="360" width="120" height="110" rx="40" fill="${K.skinD}"/>
  <path d="M220 450 Q286 480 352 450" stroke="${K.redD}" stroke-width="12" fill="none"/>
  <path d="M470 520 Q560 560 600 660" stroke="${K.redD}" stroke-width="156" fill="none" stroke-linecap="round"/>
  <path d="M470 520 Q560 560 600 660" stroke="url(#vh-shirt)" stroke-width="140" fill="none" stroke-linecap="round"/>
  <path d="M624 690 Q710 650 790 600" stroke="${K.skin}" stroke-width="86" fill="none" stroke-linecap="round"/>
  ${giftBox(495, 300, 402, 280, "vh")}
  <g transform="translate(796 594) rotate(-18) scale(1.6)"><path d="M-40 -14 Q-10 -26 30 -20 Q56 -12 58 8 Q40 26 0 22 Q-40 18 -40 -14 Z" fill="${K.skin}"/><path d="M0 -4 Q24 0 46 2" stroke="${K.skinD}" stroke-width="3" fill="none"/></g>
  <circle cx="392" cy="290" r="30" fill="${K.skin}"/><circle cx="392" cy="290" r="13" fill="${K.skinD}"/>
  <path d="M368 260 Q404 300 380 360 L340 330 Z" fill="${K.skin}"/>
  <ellipse cx="282" cy="270" rx="112" ry="128" fill="${K.hair}"/>
  <path d="M170 210 Q166 50 282 44 Q398 50 394 210 Z" fill="${K.beanie}"/>
  <path d="M200 110 Q282 80 364 110" stroke="${K.beanieD}" stroke-width="9" fill="none" opacity=".6"/>
  <rect x="160" y="170" width="244" height="66" rx="30" fill="${K.beanieD}"/>
  ${[0,1,2,3,4,5,6].map(i => `<rect x="${182 + i * 33}" y="180" width="12" height="46" rx="6" fill="${K.beanie}" opacity=".5"/>`).join("")}`);
}

export function pinggan() {
  const grain = [];
  for (let i = 0; i < 150; i++) {
    const a = i * 2.39996, r = 6 + Math.sqrt(i) * 9.4;
    const x = (318 + Math.cos(a) * r * 1.12).toFixed(1), y = (468 + Math.sin(a) * r * .92).toFixed(1);
    grain.push(`<ellipse cx="${x}" cy="${y}" rx="9" ry="5" transform="rotate(${(i * 47) % 180} ${x} ${y})" fill="${i % 4 ? "#FFFFFF" : "#E6E3DC"}"/>`);
  }
  const leaves = [];
  for (let i = 0; i < 48; i++) {
    const a = i * 2.39996, r = 8 + Math.sqrt(i) * 16;
    const x = (410 + Math.cos(a) * r * 1.2).toFixed(1), y = (165 + Math.sin(a) * r * .8).toFixed(1);
    leaves.push(`<path d="M${x} ${y} q30 -26 64 -6 q-30 24 -64 6 Z" transform="rotate(${(i * 67) % 360} ${x} ${y})" fill="${["#2B7A33", "#3E9A45", "#24692B", "#4FAE52"][i % 4]}"/>`);
  }
  return sv("hd-plate", "0 0 640 657", `
  <defs>
    <radialGradient id="vpl-p" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#F1F1F4"/><stop offset="1" stop-color="#DADBE2"/></radialGradient>
    <radialGradient id="vpl-y" cx=".42" cy=".4" r=".6"><stop offset="0" stop-color="#FFC93C"/><stop offset="1" stop-color="#F29A12"/></radialGradient>
    <radialGradient id="vpl-c" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#E0913F"/><stop offset=".7" stop-color="#B8622A"/><stop offset="1" stop-color="#8E4418"/></radialGradient>
    <radialGradient id="vpl-r" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3E0D8"/></radialGradient>
  </defs>
  <ellipse cx="326" cy="342" rx="312" ry="312" fill="#0F1235" opacity=".18"/>
  <circle cx="320" cy="328" r="312" fill="url(#vpl-p)"/>
  <circle cx="320" cy="328" r="262" fill="none" stroke="#E4E5EA" stroke-width="6"/>
  <g stroke="#3F8F3A" stroke-width="7" stroke-linecap="round" fill="none">${[[330, 230, 470, 90], [360, 250, 520, 160], [320, 190, 430, 70], [380, 240, 500, 240]].map(([a, b, c, d]) => `<path d="M${a} ${b} Q${(a + c) / 2 + 20} ${(b + d) / 2 + 10} ${c} ${d}"/>`).join("")}</g>
  ${leaves.join("")}
  <path d="M400 150 l24 -12 M460 200 l22 -12 M350 200 l20 -8 M440 110 l18 -14" stroke="#E0392E" stroke-width="9" stroke-linecap="round"/>
  <path d="M420 180 l8 4 M380 140 l8 4 M470 150 l8 4" stroke="#F6E7B0" stroke-width="7" stroke-linecap="round"/>
  <path d="M90 220 Q80 140 150 120 Q220 96 262 150 Q300 200 270 260 Q240 320 160 306 Q96 296 90 220 Z" fill="#FFFFFF"/>
  <path d="M96 250 Q90 170 140 140" stroke="#F0D9B0" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="184" cy="208" r="52" fill="url(#vpl-y)"/>
  <ellipse cx="170" cy="190" rx="16" ry="10" fill="#FFF3C4" opacity=".8"/>
  <path d="M186 470 Q178 356 300 346 Q434 340 444 452 Q452 566 318 584 Q190 582 186 470 Z" fill="url(#vpl-r)"/>
  ${grain.join("")}
  <g transform="rotate(22 480 360)">
    <path d="M478 430 L478 520" stroke="#EBD0A8" stroke-width="30" stroke-linecap="round"/>
    <circle cx="463" cy="528" r="19" fill="#F6E6CC"/><circle cx="493" cy="528" r="19" fill="#F6E6CC"/>
    <path d="M410 300 Q414 220 490 222 Q568 228 566 312 Q562 400 494 440 Q420 410 410 300 Z" fill="url(#vpl-c)"/>
    <path d="M430 280 Q480 262 540 284 M432 330 Q484 314 546 336 M450 380 Q490 368 530 384" stroke="#7A3A12" stroke-width="7" fill="none" opacity=".4" stroke-linecap="round"/>
    <ellipse cx="460" cy="262" rx="26" ry="14" fill="#F2B56A" opacity=".55"/>
  </g>`);
}

// ---------------------------------------------------------------- DUA TANGAN MEMEGANG KAD (1029×530)
export function tanganKad() {
  const one = `
    <path d="M8 530 L46 364 Q66 326 116 324 L198 334 Q214 384 176 530 Z" fill="${K.navy}"/>
    <path d="M46 364 Q66 326 116 324 L198 334 L194 360 Q118 350 46 390 Z" fill="${K.navyL}"/>
    <path d="M80 344 Q70 240 110 168 Q140 118 200 112 L236 330 Z" fill="${K.skin}"/>
    <path d="M150 140 Q190 100 240 96 Q286 100 292 136 Q296 168 270 176 Q296 186 294 218 Q292 248 266 252 Q288 266 282 294 Q272 322 236 324 L190 334 Q120 300 150 140 Z" fill="${K.skin}"/>
    <path d="M270 176 Q240 172 214 168 M266 252 Q236 246 214 240 M282 214 Q250 210 222 206" stroke="${K.skinD}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M168 150 Q186 80 222 34 Q248 10 270 22 Q284 40 268 64 Q238 110 214 160 Z" fill="${K.skin}"/>
    <path d="M232 34 Q250 14 270 22 Q282 38 266 56 Q244 58 232 34 Z" fill="${K.skinL}"/>
    <path d="M168 150 Q200 120 214 160" stroke="${K.skinD}" stroke-width="4" fill="none" opacity=".6"/>`;
  return sv("hd-hl", "0 0 1029 530", `<g>${one}</g><g transform="translate(1029 0) scale(-1 1)">${one}</g>`);
}

// ---------------------------------------------------------------- TANGAN MENUDING (1490×523, hujung jari di (1,122))
export function tanganTuding() {
  return `<svg viewBox="0 0 1490 523" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="vtt-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8BE92"/><stop offset="1" stop-color="#EBA375"/></linearGradient>
  <linearGradient id="vtt-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2E2C8C"/><stop offset="1" stop-color="#211E6A"/></linearGradient></defs>
  <path d="M1010 64 Q1200 20 1490 0 L1490 523 Q1200 500 1010 476 Q1050 270 1010 64 Z" fill="url(#vtt-c)"/>
  <path d="M1010 64 Q1050 270 1010 476 Q990 470 980 440 Q1020 270 984 80 Z" fill="#1B1857"/>
  <!-- belakang tapak tangan -->
  <path d="M420 44 Q620 20 820 50 Q960 70 1030 96 L1030 440 Q930 470 760 476 Q600 480 500 430 Q430 380 430 300 Z" fill="url(#vtt-s)"/>
  <!-- tiga jari bengkok -->
  <path d="M520 250 Q420 236 360 270 Q312 302 330 350 Q352 392 420 384 L620 366 Q650 300 600 262 Z" fill="#EFA97C"/>
  <path d="M540 340 Q440 336 392 372 Q356 410 386 446 Q414 472 480 462 L650 440 Q676 380 630 350 Z" fill="#EAA273"/>
  <path d="M580 420 Q500 420 466 452 Q446 488 482 506 Q520 520 580 508 L700 488 Q716 440 676 424 Z" fill="#E49A6A"/>
  <path d="M600 262 Q650 300 620 366 M630 350 Q676 380 650 440" stroke="#D0875A" stroke-width="5" fill="none" opacity=".6"/>
  <!-- ibu jari melintang -->
  <path d="M700 210 Q560 190 400 214 Q330 228 330 262 Q336 296 400 296 Q560 300 720 290 Z" fill="#F6B488"/>
  <path d="M332 248 Q340 222 384 222 Q408 234 400 260 Q380 286 346 280 Q326 270 332 248 Z" fill="#FBD2B4"/>
  <!-- jari telunjuk, tebal di pangkal -->
  <path d="M520 46 Q300 66 60 86 Q2 92 2 122 Q2 152 58 156 Q300 168 560 214 Q520 130 520 46 Z" fill="url(#vtt-s)"/>
  <path d="M12 108 Q20 94 60 94 Q86 104 80 124 Q70 138 30 136 Q8 130 12 108 Z" fill="#FBD2B4"/>
  <path d="M60 156 Q300 168 560 214" stroke="#D88C5E" stroke-width="5" fill="none" opacity=".45"/>
  <path d="M600 90 Q700 150 820 160" stroke="#E29A6C" stroke-width="6" fill="none" opacity=".5" stroke-linecap="round"/>
  </svg>`;
}
