// Ilustrasi vektor dilukis sendiri (SVG), menggantikan imej Codex satu per satu.
// Setiap fungsi memulangkan <svg> dengan id/kelas/saiz yang sama seperti <img> asal,
// supaya kedudukan CSS dan semua animasi dalam src/*.html kekal sebiji.

const svg = (id, vb, style = "", cls = "", body = "") =>
  `<svg ${id ? `id="${id}"` : ""} ${cls ? `class="${cls}"` : ""} viewBox="${vb}" preserveAspectRatio="none" style="overflow:visible;${style}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// ---------------------------------------------------------------- BABAK STOR
export function bgStor() {
  return svg("st-bg", "0 0 1280 1920", "", "", `
  <defs>
    <radialGradient id="vs-wall" cx=".5" cy=".32" r=".85">
      <stop offset="0" stop-color="#FFD9A0"/><stop offset=".45" stop-color="#F3B96A"/><stop offset="1" stop-color="#D98F3E"/></radialGradient>
    <linearGradient id="vs-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B58A79"/><stop offset="1" stop-color="#93695B"/></linearGradient>
    <linearGradient id="vs-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E29E62"/><stop offset="1" stop-color="#C47A40"/></linearGradient>
    <linearGradient id="vs-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B26934"/><stop offset="1" stop-color="#94532A"/></linearGradient>
    <linearGradient id="vs-leg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9733C"/><stop offset=".5" stop-color="#A3602F"/><stop offset="1" stop-color="#874D24"/></linearGradient>
    <radialGradient id="vs-bulb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6DC" stop-opacity=".95"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/></radialGradient>
    <linearGradient id="vs-cone" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#FFF3D2" stop-opacity=".55"/><stop offset="1" stop-color="#FFF3D2" stop-opacity="0"/></linearGradient>
    <linearGradient id="vs-shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4C47A8"/><stop offset="1" stop-color="#25216A"/></linearGradient>
    <filter id="vs-soft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#5B2E10" flood-opacity=".28"/></filter>
  </defs>
  <rect width="1280" height="1920" fill="url(#vs-wall)"/>
  <rect y="1655" width="1280" height="265" fill="url(#vs-floor)"/>
  <rect y="1650" width="1280" height="10" fill="#7E5446" opacity=".35"/>
  <!-- cahaya lampu jatuh ke dinding -->
  <path d="M300 860 L700 1650 L120 1650 Z" fill="url(#vs-cone)"/>
  <!-- lampu lengkung -->
  <path d="M118 1700 L118 860 Q118 735 222 712" stroke="#2C2860" stroke-width="16" fill="none" stroke-linecap="round"/>
  <ellipse cx="118" cy="1706" rx="78" ry="18" fill="#2C2860"/>
  <g transform="rotate(22 268 790)">
    <path d="M178 790 Q180 690 268 682 Q356 690 358 790 Z" fill="url(#vs-shade)"/>
    <ellipse cx="268" cy="790" rx="90" ry="20" fill="#FFF1C9"/>
    <ellipse cx="268" cy="792" rx="70" ry="13" fill="#FFFBEA"/>
  </g>
  <circle cx="300" cy="830" r="120" fill="url(#vs-bulb)"/>
  <!-- rak dinding -->
  <g filter="url(#vs-soft)">
    <rect x="190" y="1000" width="950" height="34" rx="6" fill="url(#vs-top)"/>
    <rect x="190" y="1022" width="950" height="14" rx="4" fill="url(#vs-front)"/>
    <path d="M285 1036 L330 1036 L330 1110 Q330 1120 318 1118 L298 1104 Q285 1096 285 1082 Z" fill="url(#vs-front)"/>
    <path d="M1000 1036 L1045 1036 L1045 1082 Q1045 1096 1032 1104 L1012 1118 Q1000 1120 1000 1110 Z" fill="url(#vs-front)"/>
  </g>
  <!-- meja -->
  <g filter="url(#vs-soft)">
    <rect x="215" y="1395" width="44" height="345" fill="url(#vs-leg)"/>
    <rect x="1075" y="1395" width="44" height="345" fill="url(#vs-leg)"/>
    <rect x="305" y="1395" width="34" height="270" fill="#8E4F26"/>
    <rect x="995" y="1395" width="34" height="270" fill="#8E4F26"/>
    <rect x="165" y="1322" width="1004" height="46" rx="8" fill="url(#vs-top)"/>
    <rect x="175" y="1362" width="984" height="40" rx="4" fill="url(#vs-front)"/>
    <rect x="165" y="1322" width="1004" height="8" rx="4" fill="#F1B57E" opacity=".7"/>
  </g>`);
}

export function itemBeras() {
  return svg("st-i1", "0 0 252 310", "left:140px; top:690px; width:252px; height:310px", "st-it", `
  <defs>
    <linearGradient id="vb-sack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9E4DA"/><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCD5C8"/></linearGradient>
    <linearGradient id="vb-lab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E9A57"/><stop offset="1" stop-color="#2C7A43"/></linearGradient>
  </defs>
  <path d="M30 40 Q20 20 46 14 Q126 2 206 14 Q232 20 222 40 L236 270 Q240 300 206 304 L46 304 Q12 300 16 270 Z" fill="url(#vb-sack)"/>
  <path d="M46 14 Q60 36 52 52 M86 10 Q92 34 86 48 M126 8 Q128 32 126 46 M166 10 Q160 34 166 48 M206 14 Q192 36 200 52" stroke="#D3CBBC" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M22 118 Q126 96 230 118 L234 216 Q126 196 18 216 Z" fill="url(#vb-lab)"/>
  <path d="M22 118 Q126 96 230 118" stroke="#E7B44B" stroke-width="7" fill="none"/>
  <path d="M18 216 Q126 196 234 216" stroke="#E7B44B" stroke-width="7" fill="none"/>
  <path d="M76 200 Q90 150 108 128" stroke="#F3D27A" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g fill="#F3D27A">${[0,1,2,3,4].map(i=>`<ellipse cx="${98+i*4}" cy="${140+i*12}" rx="9" ry="5" transform="rotate(-40 ${98+i*4} ${140+i*12})"/>`).join("")}</g>
  <g fill="#FFFFFF">${[[140,176],[156,170],[170,178],[150,184],[164,186],[180,184],[144,190],[172,192]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="7" ry="4"/>`).join("")}</g>
  <path d="M30 40 Q126 30 222 40" stroke="#CFC6B6" stroke-width="3" fill="none" opacity=".6"/>`);
}

export function itemGula() {
  return svg("st-i2", "0 0 184 240", "left:410px; top:760px; width:184px; height:240px", "st-it", `
  <defs><linearGradient id="vg-p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6B9C8"/><stop offset=".5" stop-color="#FBD6DF"/><stop offset="1" stop-color="#EFA6B8"/></linearGradient></defs>
  <rect x="8" y="22" width="168" height="214" rx="10" fill="url(#vg-p)"/>
  <path d="M4 6 L180 6 L178 32 L6 32 Z" fill="#D8263F"/>
  <path d="M4 6 L180 6" stroke="#B51A31" stroke-width="4" stroke-dasharray="6 5"/>
  <rect x="8" y="226" width="168" height="12" rx="4" fill="#D8263F"/>
  <path d="M24 88 Q92 60 160 88 L160 200 Q92 214 24 200 Z" fill="#FFFFFF" opacity=".92"/>
  <g fill="#F4ECEC">${[[50,120],[70,140],[96,118],[120,146],[140,124],[60,170],[90,176],[126,180],[110,160]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4"/>`).join("")}</g>
  <path d="M8 150 Q92 126 176 162 L176 196 Q92 168 8 190 Z" fill="#D8263F" opacity=".85"/>
  <path d="M136 210 L144 150 M150 212 L158 156" stroke="#9BC45A" stroke-width="9" stroke-linecap="round"/>
  <path d="M144 160 q-16 -10 -26 -2 M158 166 q16 -12 26 -4" stroke="#6FA840" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="14" y="30" width="22" height="196" rx="8" fill="#FFFFFF" opacity=".25"/>`);
}

export function itemMinyak() {
  return svg("st-i3", "0 0 131 280", "left:622px; top:720px; width:131px; height:280px", "st-it", `
  <defs><linearGradient id="vm-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8A70E"/><stop offset=".35" stop-color="#FFD54A"/><stop offset=".6" stop-color="#FFC21C"/><stop offset="1" stop-color="#D99300"/></linearGradient></defs>
  <rect x="44" y="0" width="44" height="30" rx="7" fill="#D8263F"/>
  <rect x="44" y="20" width="44" height="8" fill="#A9182C"/>
  <path d="M48 30 L84 30 L90 52 Q126 70 126 112 L126 252 Q126 276 102 278 L30 278 Q6 276 6 252 L6 112 Q6 70 42 52 Z" fill="url(#vm-b)"/>
  ${[120,150,180,210,240].map(y=>`<path d="M8 ${y} Q66 ${y+10} 124 ${y}" stroke="#E0A000" stroke-width="4" fill="none" opacity=".7"/>`).join("")}
  <rect x="22" y="92" width="20" height="170" rx="10" fill="#FFF3B0" opacity=".6"/>`);
}

export function itemTin() {
  const can = (y) => `
    <rect x="6" y="${y}" width="151" height="92" rx="10" fill="url(#vt-c)"/>
    <ellipse cx="81.5" cy="${y}" rx="75.5" ry="14" fill="#C9D3E0"/>
    <ellipse cx="81.5" cy="${y}" rx="64" ry="10" fill="#AEBBCD"/>
    <path d="M6 ${y + 26} L157 ${y + 26} L157 ${y + 74} L6 ${y + 74} Z" fill="url(#vt-l)"/>
    <path d="M6 ${y + 54} Q81 ${y + 40} 157 ${y + 56} L157 ${y + 74} L6 ${y + 74} Z" fill="#F2C96B"/>
    <path d="M46 ${y + 56} q20 -18 46 -6 q14 6 22 0" stroke="#F4A6A0" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M118 ${y + 36} q14 6 10 20 q-12 -2 -10 -20" fill="#E0543F"/>
    <path d="M28 ${y + 44} q8 -14 22 -12 q-4 14 -22 12" fill="#7BB35C"/>`;
  return svg("st-i4", "0 0 163 200", "left:790px; top:800px; width:163px; height:200px", "st-it", `
  <defs>
    <linearGradient id="vt-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA8BC"/><stop offset=".45" stop-color="#E4EAF2"/><stop offset="1" stop-color="#8794A8"/></linearGradient>
    <linearGradient id="vt-l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4F73A6"/><stop offset=".5" stop-color="#6F93C4"/><stop offset="1" stop-color="#44669A"/></linearGradient>
  </defs>
  ${can(104)}${can(14)}`);
}

function boxBody(w, h, lidH, id, extra = "") {
  return `
  <defs>
    <linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D3A270"/><stop offset="1" stop-color="#B98451"/></linearGradient>
    <linearGradient id="${id}-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2B887"/><stop offset="1" stop-color="#CC9C66"/></linearGradient>
  </defs>
  ${extra}`;
}

export function boxOpen() {
  return svg("st-open", "0 0 436 322", "left:322px; top:1006px; width:436px; height:322px", "st-it", `
  ${boxBody(436, 322, 0, "vo")}
  <path d="M60 96 L376 96 L404 64 L32 64 Z" fill="#9C6B3F"/>
  <path d="M40 92 L10 30 L150 8 L172 70 Z" fill="url(#vo-l)"/>
  <path d="M396 92 L426 30 L286 8 L264 70 Z" fill="url(#vo-l)"/>
  <path d="M40 92 L10 30" stroke="#B88A5A" stroke-width="3"/><path d="M396 92 L426 30" stroke="#B88A5A" stroke-width="3"/>
  <rect x="40" y="92" width="356" height="226" rx="8" fill="url(#vo-f)"/>
  <rect x="40" y="92" width="356" height="14" fill="#A87444" opacity=".55"/>
  <rect x="52" y="112" width="18" height="196" rx="8" fill="#E4BC8D" opacity=".35"/>`);
}

export function boxClosed() {
  return svg("st-closed", "0 0 410 334", "left:335px; top:994px; width:410px; height:334px", "st-it", `
  ${boxBody(410, 334, 0, "vc")}
  <rect x="26" y="122" width="358" height="208" rx="8" fill="url(#vc-f)"/>
  <rect x="12" y="96" width="386" height="50" rx="8" fill="url(#vc-l)"/>
  <rect x="12" y="140" width="386" height="10" fill="#A87444" opacity=".5"/>
  <rect x="190" y="96" width="30" height="234" fill="#E0283F"/>
  <rect x="190" y="96" width="9" height="234" fill="#F25A6B" opacity=".6"/>
  <path d="M205 96 C150 30 92 66 120 96 C138 110 180 104 205 96 Z" fill="#E0283F"/>
  <path d="M205 96 C260 30 318 66 290 96 C272 110 230 104 205 96 Z" fill="#E0283F"/>
  <path d="M205 96 C162 56 128 72 136 90" stroke="#B3142A" stroke-width="5" fill="none"/>
  <path d="M205 96 C248 56 282 72 274 90" stroke="#B3142A" stroke-width="5" fill="none"/>
  <ellipse cx="205" cy="98" rx="20" ry="16" fill="#C51A31"/>`);
}
