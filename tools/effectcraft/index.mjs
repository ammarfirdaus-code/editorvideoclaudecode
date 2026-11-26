// EffectCraft: named FFmpeg video-filter presets that can be chained.
// Each preset takes (arg, ctx) and returns an FFmpeg filter string.
// ctx = { width, height, duration } is probed from the input clip.

const n = (v, fallback, name) => {
  if (v === undefined || v === '') return fallback;
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error(`${name} must be a number, got "${v}"`);
  return x;
};

export const presets = {
  'zoom-punch': {
    help: 'Static punch-in crop. arg = zoom factor (default 1.15)',
    build(arg, { width, height }) {
      const z = n(arg, 1.15, 'zoom');
      if (z < 1) throw new Error('zoom must be >= 1');
      return `crop=iw/${z}:ih/${z},scale=${width}:${height}`;
    },
  },
  vignette: {
    help: 'Darkened edges. arg = angle in radians (default 0.6, lower = stronger)',
    build: (arg) => `vignette=angle=${n(arg, 0.6, 'angle')}`,
  },
  grain: {
    help: 'Film grain. arg = strength 1-50 (default 12)',
    build: (arg) => `noise=alls=${n(arg, 12, 'strength')}:allf=t+u`,
  },
  warm: {
    help: 'Warm colour grade',
    build: () => 'eq=contrast=1.05:saturation=1.15,colorbalance=rs=0.06:bs=-0.06',
  },
  cool: {
    help: 'Cool colour grade',
    build: () => 'eq=contrast=1.05:saturation=1.05,colorbalance=rs=-0.05:bs=0.07',
  },
  bw: {
    help: 'Black and white',
    build: () => 'hue=s=0,eq=contrast=1.1',
  },
  sharpen: {
    help: 'Sharpen. arg = amount (default 0.8)',
    build: (arg) => `unsharp=5:5:${n(arg, 0.8, 'amount')}`,
  },
  shake: {
    help: 'Handheld camera shake. arg = intensity 0-0.2 (default 0.05)',
    build(arg, { width, height }) {
      const k = n(arg, 0.05, 'intensity');
      if (k <= 0 || k >= 0.5) throw new Error('intensity must be between 0 and 0.5');
      const keep = 1 - k;
      return (
        `crop=w=iw*${keep}:h=ih*${keep}:` +
        `x='(iw-ow)/2*(1+sin(t*35))':y='(ih-oh)/2*(1+cos(t*43))',` +
        `scale=${width}:${height}`
      );
    },
  },
  'fade-in': {
    help: 'Fade from black. arg = seconds (default 0.5)',
    build: (arg) => `fade=t=in:st=0:d=${n(arg, 0.5, 'seconds')}`,
  },
  'fade-out': {
    help: 'Fade to black at the end. arg = seconds (default 0.5)',
    build(arg, { duration }) {
      const d = n(arg, 0.5, 'seconds');
      if (!Number.isFinite(duration)) throw new Error('fade-out needs the clip duration');
      return `fade=t=out:st=${Math.max(0, duration - d).toFixed(3)}:d=${d}`;
    },
  },
};

// "zoom-punch:1.2,vignette,grain:8" -> "crop=...,vignette=...,noise=..."
export function buildFilter(spec, ctx) {
  const parts = String(spec)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) throw new Error('no effects given');
  return parts
    .map((part) => {
      const [name, arg] = part.split(':');
      const preset = presets[name];
      if (!preset) {
        throw new Error(`unknown effect "${name}". Available: ${Object.keys(presets).join(', ')}`);
      }
      return preset.build(arg, ctx);
    })
    .join(',');
}
