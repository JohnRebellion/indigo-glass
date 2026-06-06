// GRUB color parser: #RRGGBB, #RGB, "R,G,B", lowercase SVG names.

const SVG_NAMES: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  maroon: [128, 0, 0],
  olive: [128, 128, 0],
  purple: [128, 0, 128],
  teal: [0, 128, 128],
  navy: [0, 0, 128],
  orange: [255, 165, 0],
  pink: [255, 192, 203],
  cornflowerblue: [100, 149, 237],
  midnightblue: [25, 25, 112],
  indigo: [75, 0, 130],
  violet: [238, 130, 238],
  amber: [255, 191, 0]
};

export function parseColor(v: string): [number, number, number] {
  v = v.trim();
  if (v.startsWith('#')) {
    let h = v.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6) {
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16)
      ];
    }
  }
  // RGB triple
  const rgb = v.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
  if (rgb) {
    return [parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10)];
  }
  // Named
  const named = SVG_NAMES[v.toLowerCase()];
  if (named) return named;
  return [255, 255, 255];
}

export function colorToCss(c: [number, number, number], alpha = 1): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}
