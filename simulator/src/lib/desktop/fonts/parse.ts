/* Pure readers for the font surface: KDE/Qt font strings, GTK font names, the
 * flat-section TOML the Iosevka build plan uses, and markdown tables in
 * docs/TYPOGRAPHY.md. No ?raw imports here, so the unit tests can feed them
 * arbitrary text. */

export type KFont = { family: string; pt: number; weight: number; raw: string };

/* QFont::toString() as KConfig writes it (Qt 6, 16+ fields):
   family,pointSize,pixelSize,styleHint,weight,style,underline,strikeOut,...
   Weight is Qt 6's CSS-like scale (400 Normal, 700 Bold). A missing weight
   field means Qt's default, Normal. */
export function parseKdeFont(v: string): KFont {
  const p = v.split(',').map((s) => s.trim());
  const w = p.length > 4 && p[4] !== '' ? Number(p[4]) : 400;
  return { family: p[0], pt: Number(p[1]), weight: Number.isFinite(w) ? w : 400, raw: v };
}

/* gtk-font-name is Pango: "Family [Style...] Size", size last. */
export function parseGtkFont(v: string): KFont {
  const s = v.trim();
  const m = s.match(/^(.*?)\s+(\d+(?:\.\d+)?)$/);
  if (!m) return { family: s, pt: NaN, weight: 400, raw: v };
  let family = m[1];
  let weight = 400;
  const styles: [RegExp, number][] = [[/\s+Bold$/i, 700], [/\s+Semi-?Bold$/i, 600], [/\s+Medium$/i, 500]];
  for (const [re, wt] of styles) if (re.test(family)) { family = family.replace(re, ''); weight = wt; }
  return { family, pt: Number(m[2]), weight, raw: v };
}

/* The TOML subset share/fonts/private-build-plans.toml uses: [dotted.section]
   headers (indented or not) and key = "string" | number | true/false. */
export type FlatToml = { section: string; key: string; value: string | number | boolean }[];
export function parseFlatToml(text: string): FlatToml {
  const out: FlatToml = [];
  let section = '';
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const h = line.match(/^\[([^\]]+)\]$/);
    if (h) { section = h[1].trim(); continue; }
    const kv = line.match(/^([\w.-]+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    const value = /^".*"$/.test(v) ? v.slice(1, -1) : v === 'true' ? true : v === 'false' ? false : Number.isFinite(Number(v)) ? Number(v) : v;
    out.push({ section, key: kv[1], value });
  }
  return out;
}

/* The first pipe table under a markdown heading, as rows of trimmed cells
   with **bold** and `code` markers removed. The header row and the
   separator row are dropped. */
export function mdTable(md: string, heading: string): string[][] {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => /^#{1,6}\s/.test(l) && l.replace(/^#+\s*/, '').trim() === heading);
  if (start < 0) return [];
  const rows: string[][] = [];
  let inTable = false;
  for (const l of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(l)) break;
    if (l.trim().startsWith('|')) {
      inTable = true;
      const cells = l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/\*\*/g, '').replace(/`/g, ''));
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      rows.push(cells);
    } else if (inTable) break;
  }
  return rows.slice(1);
}

/* Where a file's family sits in the token stack. */
export type FamilyVerdict = 'ok' | 'fallback' | 'drift';
export function familyVerdict(family: string, stack: string[]): FamilyVerdict {
  const i = stack.findIndex((f) => f.toLowerCase() === family.toLowerCase());
  return i === 0 ? 'ok' : i > 0 ? 'fallback' : 'drift';
}

/* CSS font-family value: the file's family first, then the stack (minus
   the duplicate). Generic keywords stay unquoted. */
const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'system-ui', 'cursive', 'fantasy', '-apple-system', 'BlinkMacSystemFont']);
export const cssFamily = (list: string[]) =>
  list.filter((f, i) => list.findIndex((g) => g.toLowerCase() === f.toLowerCase()) === i)
    .map((f) => (GENERIC.has(f) ? f : `"${f}"`)).join(', ');

/* CSS weight matching (CSS Fonts 4, "font-weight" matching): which of the
   faces a family actually has renders for a requested weight. Used to show
   that a 500 request on a 400/700 family draws the 400 face. */
export function matchWeight(want: number, faces: number[]): number {
  if (!faces.length) return want;
  if (faces.includes(want)) return want;
  const asc = faces.filter((f) => f > want).sort((a, b) => a - b);
  const desc = faces.filter((f) => f < want).sort((a, b) => b - a);
  if (want >= 400 && want <= 500) {
    const upTo500 = asc.filter((f) => f <= 500);
    if (upTo500.length) return upTo500[0];
    if (desc.length) return desc[0];
    return asc[0];
  }
  if (want < 400) return desc[0] ?? asc[0];
  return asc[0] ?? desc[0];
}
