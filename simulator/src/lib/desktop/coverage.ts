/* Coverage for file-driven surfaces.
 *
 * A key is covered when the page RENDERS it, not when the parser read it.
 * Keys that become CSS custom properties are covered only if some rule or
 * inline style on the page references `var(--that-name)`; keys rendered as
 * text or geometry are covered if a specimen read them through IniDoc.get
 * (tracked). Everything else is listed on the page as not rendered. */
import type { IniDoc } from './ini';
import type { Coverage } from './surface';

export function referencedVars(root: ParentNode = document): Set<string> {
  const out = new Set<string>();
  const scan = (t: string) => { for (const m of t.matchAll(/var\(\s*(--[\w-]+)/g)) out.add(m[1]); };
  for (const sheet of Array.from(document.styleSheets)) {
    try { for (const r of Array.from(sheet.cssRules)) scan(r.cssText); } catch { /* cross-origin sheet */ }
  }
  root.querySelectorAll?.('[style]').forEach((el) => scan(el.getAttribute('style') ?? ''));
  return out;
}

export type KeyVars = Record<string, string[]>;

export function iniCoverage(
  docs: { label: string; doc: IniDoc }[],
  keyVars: KeyVars,
  ignore: { token: string; why: string }[] = [],
  root?: ParentNode
): Coverage {
  const refs = referencedVars(root);
  const skip = (k: string) => ignore.some((i) => (i.token.endsWith('/*') ? k.startsWith(i.token.slice(0, -1)) : i.token === k));
  const all = docs.flatMap(({ label, doc }) => doc.keys().map((k) => ({ label, k, doc })));
  const missing = all
    .filter(({ k, doc }) => {
      if (skip(k)) return false;
      const vars = keyVars[k];
      if (vars?.length) return !vars.some((v) => refs.has(v.startsWith('--') ? v : `--${v}`));
      return !doc.used().has(k);
    })
    .map(({ label, k }) => (docs.length > 1 ? `${label}: ${k}` : k));
  return { total: all.length, missing, ignored: ignore };
}
