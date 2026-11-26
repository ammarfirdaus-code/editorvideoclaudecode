// Latar: kampung (2880×1920) dan pintu rumah (1280×1920), vektor dilukis sendiri.
const sv = (id, vb, body, style = "") =>
  `<svg ${id ? `id="${id}"` : ""} viewBox="${vb}" preserveAspectRatio="none" style="overflow:visible;${style}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

function palm(bx, by, tx, ty, s = 1, p = "pa") {
  const fr = [[-150, -10], [-130, 60], [-60, 110], [150, -10], [130, 60], [60, 110], [-90, -70], [90, -70], [0, -100]];
  return `<g>
    <path d="M${bx} ${by} Q${(bx + tx) / 2 + 40 * s} ${(by + ty) / 2} ${tx} ${ty}" stroke="#8A6544" stroke-width="${26 * s}" fill="none" stroke-linecap="round"/>
    <path d="M${bx} ${by} Q${(bx + tx) / 2 + 40 * s} ${(by + ty) / 2} ${tx} ${ty}" stroke="#6E4D33" stroke-width="${26 * s}" stroke-dasharray="${4 * s} ${30 * s}" fill="none"/>
    ${fr.map(([dx, dy], i) => `<path d="M${tx} ${ty} Q${tx + dx * .5 * s} ${ty + dy * .2 * s - 50 * s} ${tx + dx * s} ${ty + dy * s}" stroke="${i % 2 ? "#4E9A4A" : "#3B8A3E"}" stroke-width="${30 * s}" fill="none" stroke-linecap="round"/>
      <path d="M${tx} ${ty} Q${tx + dx * .5 * s} ${ty + dy * .2 * s - 50 * s} ${tx + dx * s} ${ty + dy * s}" stroke="#2E6E33" stroke-width="${30 * s}" stroke-dasharray="${3 * s} ${12 * s}" fill="none" opacity=".5"/>`).join("")}
    <circle cx="${tx - 14 * s}" cy="${ty + 18 * s}" r="${14 * s}" fill="#7BA640"/><circle cx="${tx + 12 * s}" cy="${ty + 22 * s}" r="${14 * s}" fill="#6E9A38"/><circle cx="${tx}" cy="${ty + 40 * s}" r="${14 * s}" fill="#7BA640"/>
  </g>`;
}
function bush(x, y, w, flower = "#E0392E") {
  const f = [];
  for (let i = 0; i < 6; i++) f.push(`<g transform="translate(${x + w * (.15 + .14 * i)} ${y - 40 - (i % 2) * 40})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-12" rx="9" ry="14" transform="rotate(${a})" fill="${flower}"/>`).join("")}<circle r="6" fill="#FFE07A"/></g>`);
  return `<path d="M${x} ${y} Q${x - 10} ${y - 90} ${x + w * .25} ${y - 110} Q${x + w * .45} ${y - 170} ${x + w * .7} ${y - 120} Q${x + w + 20} ${y - 100} ${x + w} ${y} Z" fill="#4E9A4A"/>
  <path d="M${x + w * .1} ${y} Q${x + w * .2} ${y - 80} ${x + w * .5} ${y - 70} Q${x + w * .8} ${y - 80} ${x + w * .9} ${y} Z" fill="#3B8A3E"/>${f.join("")}`;
}
function windowShut(x, y, w, h) {
  return `<rect x="${x - w * .55}" y="${y}" width="${w * .5}" height="${h}" fill="#8A4A2E"/><rect x="${x + w * 1.05}" y="${y}" width="${w * .5}" height="${h}" fill="#8A4A2E"/>
  ${[1, 2, 3, 4].map(k => `<path d="M${x - w * .5} ${y + h * k / 5} h${w * .4} M${x + w * 1.1} ${y + h * k / 5} h${w * .4}" stroke="#6B3520" stroke-width="5"/>`).join("")}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F7EEDC" stroke="#8A4A2E" stroke-width="8"/>
  <path d="M${x} ${y + h} Q${x + w * .5} ${y + h * .2} ${x + w} ${y + h} Z" fill="#3B2A2A" opacity=".85"/>`;
}
function house(o) {
  const { x, w, apex, body, bot, stilt, wall, wallD, roof, roofD } = o;
  const st = [];
  for (let i = 0; i < 6; i++) st.push(`<rect x="${x + 30 + i * (w - 80) / 5}" y="${bot}" width="22" height="${stilt - bot}" fill="#7A4A30"/><rect x="${x + 22 + i * (w - 80) / 5}" y="${stilt - 18}" width="38" height="18" fill="#D8D0C4"/>`);
  const lines = [];
  for (let yy = body + 30; yy < bot; yy += 34) lines.push(`<path d="M${x} ${yy} h${w}" stroke="${wallD}" stroke-width="4" opacity=".55"/>`);
  return `<g>${st.join("")}
    <rect x="${x}" y="${body}" width="${w}" height="${bot - body}" fill="${wall}"/>${lines.join("")}
    <rect x="${x}" y="${bot - 16}" width="${w}" height="16" fill="${wallD}"/>
    <path d="M${x - w * .06} ${body + 10} L${x + w * .5} ${apex} L${x + w * 1.06} ${body + 10} L${x + w * 1.02} ${body + 34} L${x + w * .5} ${apex + 36} L${x - w * .02} ${body + 34} Z" fill="${roof}"/>
    <path d="M${x + w * .5} ${apex + 36} L${x + w * 1.02} ${body + 34} L${x + w * .98} ${body + 46} L${x + w * .5} ${apex + 56} Z" fill="${roofD}"/>
    <path d="M${x + w * .02} ${body + 34} L${x + w * .5} ${apex + 36} L${x + w * .98} ${body + 34} Z" fill="${wall}" opacity=".9"/>
    ${o.windows.map(([wx, wy, ww, wh]) => windowShut(wx, wy, ww, wh)).join("")}
  </g>`;
}

// ---------------------------------------------------------------- KAMPUNG (2880×1920)
export function bgKampung() {
  return sv("pj-bg", "0 0 2880 1920", `
  <defs>
    <linearGradient id="vkg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3AFA2"/><stop offset=".45" stop-color="#F8CDB8"/><stop offset=".75" stop-color="#FBE3CF"/></linearGradient>
    <radialGradient id="vkg-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6D2" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></radialGradient>
    <linearGradient id="vkg-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93C96E"/><stop offset="1" stop-color="#76B25A"/></linearGradient>
    <linearGradient id="vkg-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9C2CC"/><stop offset="1" stop-color="#A8A0AE"/></linearGradient>
  </defs>
  <rect width="2880" height="1300" fill="url(#vkg-sky)"/>
  <circle cx="608" cy="400" r="260" fill="url(#vkg-sun)"/><circle cx="608" cy="400" r="86" fill="#FFF2C6"/>
  ${[[180, 560, 1.2], [1320, 470, 1], [2620, 330, 1.3], [2050, 620, .8]].map(([x, y, s]) => `<g fill="#FFF6EE" opacity=".85"><ellipse cx="${x}" cy="${y}" rx="${200 * s}" ry="${50 * s}"/><circle cx="${x - 60 * s}" cy="${y - 30 * s}" r="${70 * s}"/><circle cx="${x + 50 * s}" cy="${y - 50 * s}" r="${90 * s}"/></g>`).join("")}
  <path d="M0 860 Q300 740 620 820 Q900 700 1260 800 Q1600 690 1950 790 Q2300 660 2600 760 Q2760 720 2880 760 L2880 1300 L0 1300 Z" fill="#A9C99A"/>
  <path d="M0 960 Q380 820 760 930 Q1100 830 1450 920 Q1800 820 2150 900 Q2500 800 2880 880 L2880 1300 L0 1300 Z" fill="#7FB074"/>
  ${Array.from({ length: 30 }, (_, i) => `<circle cx="${i * 100 + (i % 3) * 20}" cy="${1060 + (i % 4) * 22}" r="${80 + (i % 3) * 22}" fill="${i % 2 ? "#5E9E5C" : "#6BAA62"}"/>`).join("")}
  <rect y="1240" width="2880" height="310" fill="url(#vkg-grass)"/>
  ${Array.from({ length: 40 }, (_, i) => `<path d="M${40 + i * 72} ${1380 + (i * 37) % 140} l10 -26 l6 26 l8 -20 l4 20" stroke="#5E9E4A" stroke-width="5" fill="none"/>`).join("")}
  ${palm(30, 1380, 160, 600, 1.2)}
  ${palm(900, 1240, 860, 830, .8)}
  ${house({ x: 112, w: 752, apex: 896, body: 1088, bot: 1296, stilt: 1392, wall: "#3E9C9A", wallD: "#2E7E7C", roof: "#C93A3A", roofD: "#9E2A2A", windows: [[420, 1150, 90, 110], [640, 1150, 90, 110]] })}
  ${house({ x: 1040, w: 624, apex: 960, body: 1120, bot: 1296, stilt: 1392, wall: "#D9787E", wallD: "#B85E64", roof: "#C93A3A", roofD: "#9E2A2A", windows: [[1240, 1170, 80, 96], [1420, 1170, 80, 96]] })}
  ${palm(1680, 1420, 1790, 520, 1.4)}
  ${bush(70, 1400, 260)}${bush(960, 1380, 220, "#F2C230")}${bush(1700, 1420, 240)}
  <!-- rumah besar oker dengan pintu biru -->
  ${house({ x: 1888, w: 944, apex: 576, body: 800, bot: 1296, stilt: 1440, wall: "#EDB45A", wallD: "#C98F36", roof: "#C93A3A", roofD: "#9E2A2A", windows: [[2050, 990, 110, 150], [2610, 990, 110, 150]] })}
  <g fill="#8A4A2E">${Array.from({ length: 9 }, (_, i) => `<path d="M2360 760 L${2250 + i * 27} 690 L${2262 + i * 27} 690 Z"/>`).join("")}</g>
  <path d="M1900 850 Q2360 830 2820 850" stroke="#F7E3B8" stroke-width="14" stroke-dasharray="20 14" fill="none"/>
  <rect x="2290" y="962" width="172" height="330" fill="#8A4A2E"/>
  <rect x="2304" y="976" width="144" height="316" fill="#3F4FB0"/>
  <rect x="2320" y="1000" width="112" height="120" rx="6" fill="none" stroke="#2E3B8E" stroke-width="6"/><rect x="2320" y="1140" width="112" height="130" rx="6" fill="none" stroke="#2E3B8E" stroke-width="6"/>
  <circle cx="2424" cy="1140" r="9" fill="#E8B04A"/>
  <g fill="#9A5A36">${[0, 1, 2, 3, 4].map(i => `<rect x="${2190 - i * 8}" y="${1296 + i * 38}" width="${372 + i * 16}" height="20"/>`).join("")}</g>
  <path d="M2180 1300 L2130 1480 M2560 1300 L2610 1480" stroke="#7A4A30" stroke-width="16"/>
  <path d="M2180 1220 L2130 1400 M2560 1220 L2610 1400" stroke="#7A4A30" stroke-width="12"/>
  ${[0, 1, 2, 3].map(i => `<path d="M${2172 - i * 12} ${1250 + i * 45} v80 M${2568 + i * 12} ${1250 + i * 45} v80" stroke="#7A4A30" stroke-width="8"/>`).join("")}
  ${bush(1900, 1430, 250)}${bush(2620, 1440, 220)}
  <!-- jalan -->
  <rect y="1540" width="2880" height="380" fill="url(#vkg-road)"/>
  <rect y="1534" width="2880" height="16" fill="#ECE7EE"/>
  <ellipse cx="1500" cy="1760" rx="900" ry="60" fill="#B2AAB8" opacity=".5"/>
  <!-- daun latar depan -->
  ${[[-40, 1920, 1], [2700, 1920, 1.1], [1350, 1940, .7]].map(([x, y, s]) => `<g>${[-60, -30, 0, 30, 60].map(a => `<path d="M${x + 120 * s} ${y} Q${x + 120 * s + a * 3 * s} ${y - 160 * s} ${x + 120 * s + a * 6 * s} ${y - 260 * s} Q${x + 120 * s + a * 2 * s} ${y - 150 * s} ${x + 140 * s} ${y} Z" fill="${a % 60 ? "#3B8A3E" : "#2E7433"}"/>`).join("")}</g>`).join("")}`);
}

// ---------------------------------------------------------------- PINTU RUMAH (1280×1920)
export function bgPintu(id = "pt-bg", style = "") {
  const sid = lines => lines;
  const siding = [];
  for (let y = 160; y < 1820; y += 52) siding.push(`<path d="M0 ${y} H1280" stroke="#C98F36" stroke-width="5" opacity=".6"/>`);
  const rugs = [];
  for (let i = 0; i < 14; i++) rugs.push(`<path d="M${400 + i * 34} 1196 l-40 92" stroke="#B97F3E" stroke-width="5" opacity=".6"/>`);
  return sv(id, "0 0 1280 1920", `
  <defs>
    <linearGradient id="vpt-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A2A18"/><stop offset=".55" stop-color="#6E4126"/><stop offset="1" stop-color="#7E4D2C"/></linearGradient>
    <linearGradient id="vpt-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A5E34"/><stop offset="1" stop-color="#B8763F"/></linearGradient>
    <radialGradient id="vpt-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD98A" stop-opacity=".75"/><stop offset="1" stop-color="#FFB34A" stop-opacity="0"/></radialGradient>
    <linearGradient id="vpt-door" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2F3D98"/><stop offset="1" stop-color="#4A5BC0"/></linearGradient>
  </defs>
  <rect width="1280" height="1920" fill="#EDB45A"/>${siding.join("")}
  <!-- bumbung zink merah -->
  <rect width="1280" height="140" fill="#B8323A"/>
  ${Array.from({ length: 27 }, (_, i) => `<rect x="${i * 48}" y="0" width="20" height="140" fill="#D04A4E" opacity=".7"/>`).join("")}
  <rect y="130" width="1280" height="22" fill="#7A2A26"/>
  ${[120, 640, 1160].map(x => `<path d="M${x} 152 L${x + 30} 152 L${x + 30} 260 Q${x + 15} 240 ${x} 200 Z" fill="#8A4A2E"/>`).join("")}
  <!-- tingkap kiri -->
  <rect x="-20" y="470" width="200" height="560" fill="#8A3B2E"/>
  ${Array.from({ length: 10 }, (_, i) => `<rect x="0" y="${495 + i * 52}" width="160" height="30" fill="#F4EBDD"/>`).join("")}
  <!-- bingkai pintu -->
  <rect x="272" y="358" width="704" height="1110" fill="#8E3B2E"/>
  <rect x="312" y="400" width="624" height="1056" fill="url(#vpt-in)"/>
  <!-- bumbung dalaman -->
  <path d="M312 400 L624 560 L936 400 M312 470 L624 600 L936 470 M624 400 V620" stroke="#3A2010" stroke-width="10" fill="none" opacity=".8"/>
  <!-- tingkap belakang -->
  <rect x="404" y="660" width="150" height="230" fill="#9CCB8A"/>
  <path d="M430 890 Q470 740 520 700 M470 800 q-40 -30 -70 -20 M470 800 q40 -40 80 -30" stroke="#3B8A3E" stroke-width="12" fill="none" stroke-linecap="round"/>
  <rect x="404" y="660" width="150" height="230" fill="none" stroke="#3A2010" stroke-width="10"/>
  <path d="M370 640 Q400 760 380 920 L420 920 Q430 760 410 640 Z M560 640 Q540 760 560 920 L600 920 Q610 760 590 640 Z" fill="#EADBC0"/>
  <rect x="356" y="630" width="260" height="14" rx="7" fill="#3A2010"/>
  <!-- lampu rotan -->
  <path d="M700 400 V560" stroke="#2A160A" stroke-width="4"/>
  <circle cx="700" cy="610" r="190" fill="url(#vpt-glow)"/>
  <path d="M640 600 Q646 556 700 552 Q754 556 760 600 Z" fill="#E6A750"/>
  ${[0, 1, 2, 3].map(i => `<path d="M${652 + i * 32} 560 l-6 40" stroke="#B97F3E" stroke-width="4"/>`).join("")}
  <path d="M640 600 H760" stroke="#B97F3E" stroke-width="5"/>
  <ellipse cx="700" cy="606" rx="40" ry="8" fill="#FFF0C0"/>
  <!-- kabinet + pasu -->
  <rect x="656" y="976" width="240" height="192" fill="#8A5230"/>
  <rect x="668" y="990" width="104" height="164" fill="#9A6038"/><rect x="780" y="990" width="104" height="164" fill="#9A6038"/>
  <circle cx="760" cy="1072" r="6" fill="#E8B04A"/><circle cx="792" cy="1072" r="6" fill="#E8B04A"/>
  <path d="M820 976 Q806 940 834 924 Q862 940 848 976 Z" fill="#C9874A"/>
  <path d="M834 924 q-30 -40 -60 -36 M834 924 q0 -50 10 -70 M834 924 q30 -40 60 -30" stroke="#3B8A3E" stroke-width="12" fill="none" stroke-linecap="round"/>
  <rect x="690" y="950" width="70" height="26" rx="8" fill="#C9944A"/>
  <!-- lantai + tikar -->
  <rect x="312" y="1176" width="624" height="280" fill="url(#vpt-fl)"/>
  ${[1230, 1300, 1380].map(y => `<path d="M312 ${y} H936" stroke="#8A5230" stroke-width="4" opacity=".5"/>`).join("")}
  <path d="M410 1190 L896 1190 L870 1296 L368 1296 Z" fill="#D9A35B"/>${rugs.join("")}
  <path d="M410 1190 L896 1190 L870 1296 L368 1296 Z" fill="none" stroke="#B97F3E" stroke-width="8"/>
  <rect x="300" y="1440" width="648" height="30" fill="#7A3326"/>
  <!-- pintu biru terbuka -->
  <path d="M936 400 L1214 304 L1214 1530 L936 1456 Z" fill="url(#vpt-door)"/>
  <path d="M966 470 L1180 410 L1180 900 L966 920 Z M966 980 L1180 970 L1180 1440 L966 1410 Z" fill="none" stroke="#28337E" stroke-width="10"/>
  <circle cx="1176" cy="930" r="14" fill="#E8B04A"/>
  <rect x="926" y="520" width="14" height="60" fill="#C9944A"/><rect x="926" y="1260" width="14" height="60" fill="#C9944A"/>
  <!-- tangga -->
  <rect x="288" y="1470" width="672" height="110" fill="#9A4E3A"/><rect x="288" y="1470" width="672" height="22" fill="#B86A50"/>
  <rect x="270" y="1580" width="708" height="120" fill="#8E4434"/><rect x="270" y="1580" width="708" height="22" fill="#B0604A"/>
  <rect x="250" y="1700" width="748" height="130" fill="#803C2E"/><rect x="250" y="1700" width="748" height="22" fill="#A85846"/>
  <rect y="1820" width="1280" height="100" fill="#79B25A"/>
  <!-- bunga raya dalam pasu, daun kanan -->
  <path d="M30 1640 L200 1640 L180 1820 L50 1820 Z" fill="#C9673E"/><rect x="20" y="1630" width="190" height="26" rx="8" fill="#D97A4E"/>
  ${[[60, 1560], [130, 1500], [190, 1580], [90, 1460], [40, 1620], [170, 1630]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="22" transform="rotate(${i * 50} ${x} ${y})" fill="${i % 2 ? "#3B8A3E" : "#2E7433"}"/>`).join("")}
  ${[[110, 1480], [60, 1580], [180, 1560]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-20" rx="18" ry="26" transform="rotate(${a})" fill="#E0283F"/>`).join("")}<circle r="8" fill="#FFE07A"/></g>`).join("")}
  ${[-50, -20, 10, 40].map(a => `<path d="M1180 1920 Q${1180 + a * 2} 1760 ${1180 + a * 4} 1640 Q${1180 + a} 1780 1210 1920 Z" fill="${a % 20 ? "#3B8A3E" : "#2E7433"}"/>`).join("")}`, style);
}
