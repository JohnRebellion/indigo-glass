/* fastfetch's config.jsonc is JSON with full-line `//` comments (its own
 * schema documents this; no block comments or trailing-comment forms appear
 * in the shipped file). Strip those, JSON.parse the rest, then flatten to
 * the same dotted-path IniDoc shape toml.ts and ini.ts use, so coverage.ts's
 * iniCoverage works unmodified: group '' for everything (this file has no
 * natural "section" concept), key = the dotted/bracketed path
 * (`logo.color.1`, `modules.0.color.user`). */
import type { IniDoc } from '../ini';

function flatten(v: unknown, prefix: string, out: Map<string, string>): void {
  if (v === null || v === undefined) return;
  if (Array.isArray(v)) {
    v.forEach((item, i) => flatten(item, prefix ? `${prefix}.${i}` : String(i), out));
    return;
  }
  if (typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) flatten(val, prefix ? `${prefix}.${k}` : k, out);
    return;
  }
  out.set(prefix, String(v));
}

export function parseJsoncDoc(text: string): IniDoc {
  const stripped = text
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  const tree = JSON.parse(stripped);
  const flat = new Map<string, string>();
  flatten(tree, '', flat);

  const seen = new Set<string>();
  const doc: IniDoc = {
    groups: [''],
    get(_g, k) {
      const v = flat.get(k);
      if (v !== undefined) seen.add(k);
      return v;
    },
    req(g, k) {
      const v = doc.get(g, k);
      if (v === undefined) throw new Error(`missing ${k}`);
      return v;
    },
    has: (_g, k) => flat.has(k),
    keys: () => [...flat.keys()].map((k) => `/${k}`),
    used: () => new Set([...seen].map((k) => `/${k}`)),
    touch(_g, k) {
      if (k !== undefined) {
        if (flat.has(k)) seen.add(k);
      } else for (const key of flat.keys()) seen.add(key);
    }
  };
  return doc;
}
