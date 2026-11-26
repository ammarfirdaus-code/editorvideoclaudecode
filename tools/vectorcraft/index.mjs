// VectorCraft: dependency-free SVG asset generators for video overlays.
// Every generator returns an SVG string. Colours are any valid SVG colour.

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const num = (v, name) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number, got "${v}"`);
  return n;
};

const svg = (width, height, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
  (defs ? `<defs>${defs}</defs>` : '') +
  body +
  '</svg>\n';

export function lowerThird({
  title,
  subtitle = '',
  accent = '#ff3d71',
  background = '#111827',
  color = '#ffffff',
  width = 1920,
  height = 1080,
  font = 'Inter, Arial, sans-serif',
} = {}) {
  if (!title) throw new Error('lower-third needs a title');
  width = num(width, 'width');
  height = num(height, 'height');
  const barH = subtitle ? 150 : 100;
  const x = Math.round(width * 0.06);
  const y = Math.round(height * 0.78);
  const barW = Math.round(width * 0.42);
  const body =
    `<g id="lower-third" transform="translate(${x} ${y})">` +
    `<rect id="lt-bg" width="${barW}" height="${barH}" rx="10" fill="${esc(background)}" fill-opacity="0.92"/>` +
    `<rect id="lt-accent" width="12" height="${barH}" rx="6" fill="${esc(accent)}"/>` +
    `<text id="lt-title" x="40" y="${subtitle ? 62 : 66}" font-family="${esc(font)}" font-size="44" font-weight="700" fill="${esc(color)}">${esc(title)}</text>` +
    (subtitle
      ? `<text id="lt-subtitle" x="40" y="112" font-family="${esc(font)}" font-size="30" fill="${esc(color)}" fill-opacity="0.75">${esc(subtitle)}</text>`
      : '') +
    '</g>';
  return svg(width, height, body);
}

export function badge({
  text,
  fill = '#ff3d71',
  color = '#ffffff',
  font = 'Inter, Arial, sans-serif',
  fontSize = 40,
} = {}) {
  if (!text) throw new Error('badge needs text');
  fontSize = num(fontSize, 'fontSize');
  const padX = Math.round(fontSize * 0.7);
  const w = Math.round(String(text).length * fontSize * 0.62 + padX * 2);
  const h = Math.round(fontSize * 1.9);
  const body =
    `<rect id="badge-bg" width="${w}" height="${h}" rx="${h / 2}" fill="${esc(fill)}"/>` +
    `<text id="badge-text" x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="central" font-family="${esc(font)}" font-size="${fontSize}" font-weight="700" fill="${esc(color)}">${esc(text)}</text>`;
  return svg(w, h, body);
}

export function arrow({ length = 400, color = '#ffd400', thickness = 14, direction = 'right' } = {}) {
  length = num(length, 'length');
  thickness = num(thickness, 'thickness');
  const head = thickness * 3.2;
  const h = Math.round(head * 2 + 10);
  const cy = h / 2;
  const shaftEnd = length - head;
  const body =
    `<g id="arrow" transform="${direction === 'left' ? `translate(${length} 0) scale(-1 1)` : ''}">` +
    `<line id="arrow-shaft" x1="0" y1="${cy}" x2="${shaftEnd}" y2="${cy}" stroke="${esc(color)}" stroke-width="${thickness}" stroke-linecap="round"/>` +
    `<polygon id="arrow-head" points="${shaftEnd},${cy - head} ${length},${cy} ${shaftEnd},${cy + head}" fill="${esc(color)}" stroke="${esc(color)}" stroke-width="${thickness / 2}" stroke-linejoin="round"/>` +
    '</g>';
  return svg(length, h, body);
}

export function underline({ width = 600, color = '#ff3d71', thickness = 12 } = {}) {
  width = num(width, 'width');
  thickness = num(thickness, 'thickness');
  const h = thickness * 4;
  const d = `M ${thickness} ${h * 0.6} Q ${width * 0.25} ${h * 0.15}, ${width * 0.5} ${h * 0.55} T ${width - thickness} ${h * 0.4}`;
  const body = `<path id="underline" d="${d}" fill="none" stroke="${esc(color)}" stroke-width="${thickness}" stroke-linecap="round" pathLength="1"/>`;
  return svg(width, h, body);
}

export function circleHighlight({ size = 300, color = '#ffd400', thickness = 10 } = {}) {
  size = num(size, 'size');
  thickness = num(thickness, 'thickness');
  const r = size / 2 - thickness * 2;
  const c = size / 2;
  const body = `<ellipse id="highlight" cx="${c}" cy="${c}" rx="${r}" ry="${r * 0.82}" transform="rotate(-8 ${c} ${c})" fill="none" stroke="${esc(color)}" stroke-width="${thickness}" stroke-linecap="round" pathLength="1" stroke-dasharray="0.96 1"/>`;
  return svg(size, size, body);
}

export const generators = {
  'lower-third': lowerThird,
  badge,
  arrow,
  underline,
  'circle-highlight': circleHighlight,
};
