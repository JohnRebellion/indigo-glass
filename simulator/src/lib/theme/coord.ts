// Coordinate evaluator
// Supports: "50", "50%", "50%-100", "50%+50", "100%-N"

export function resolveCoord(value: string | number, parentDim: number): number {
  if (typeof value === 'number') return value;
  const v = value.trim();

  // Pure number
  if (/^-?\d+(\.\d+)?$/.test(v)) return parseFloat(v);

  // Percent math: N% +/- M
  const m = v.match(/^(-?\d+(?:\.\d+)?)%(?:\s*([+\-])\s*(-?\d+(?:\.\d+)?))?$/);
  if (m) {
    const pct = parseFloat(m[1]) / 100;
    let base = parentDim * pct;
    if (m[2] && m[3]) {
      const offset = parseFloat(m[3]);
      base += m[2] === '+' ? offset : -offset;
    }
    return base;
  }

  return 0;
}
