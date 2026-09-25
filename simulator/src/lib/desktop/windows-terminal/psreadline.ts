/* Reads the `Set-PSReadLineOption -Colors @{ ... }` hashtable out of
 * windows/powershell/Microsoft.PowerShell_profile.ps1 — not a general
 * PowerShell parser, just this one block's two value shapes:
 *   - a single-quoted hex literal, optionally followed by a `# token_name`
 *     comment the file already carries (e.g. `'#C0E3C0'  # accent_hi`) —
 *     that comment is itself the author's own token citation, used as the
 *     role's token rather than re-deriving it by reverse hex lookup;
 *   - Selection's double-quoted VT truecolor pair,
 *     `` `e[38;2;R;G;Bm`e[48;2;R;G;Bm `` (fg then bg, no alpha — standard
 *     ANSI SGR truecolor takes exactly 3 numeric params).
 * Full-line `#` comments inside the block (the Selection rationale) are
 * skipped, not parsed as key/value. */
import type { IniDoc } from '../ini';

export type PwshColorEntry =
  | { name: string; kind: 'hex'; raw: string; hex: string; tokenHint?: string }
  | { name: string; kind: 'ansi-pair'; raw: string; fg: string; bg: string };

function toHex2(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
}

function extractColorsBlock(text: string): string | null {
  const start = text.indexOf('-Colors');
  if (start < 0) return null;
  const brace = text.indexOf('@{', start);
  if (brace < 0) return null;
  let depth = 0;
  let i = brace;
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) return null;
  return text.slice(brace + 2, i);
}

export function parsePwshColors(text: string): { entries: PwshColorEntry[]; doc: IniDoc } {
  const block = extractColorsBlock(text) ?? '';
  const entries: PwshColorEntry[] = [];

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const hexMatch = line.match(/^(\w+)\s*=\s*'(#[0-9A-Fa-f]{6})'\s*(?:#\s*(.*))?$/);
    if (hexMatch) {
      entries.push({ name: hexMatch[1], kind: 'hex', raw: hexMatch[2], hex: hexMatch[2].toUpperCase(), tokenHint: hexMatch[3]?.trim() });
      continue;
    }

    const ansiMatch = line.match(/^(\w+)\s*=\s*"(.*)"$/);
    if (ansiMatch) {
      const body = ansiMatch[2];
      const triples = [...body.matchAll(/`e\[(38|48);2;(\d+);(\d+);(\d+)m/g)];
      const fgTriple = triples.find((m) => m[1] === '38');
      const bgTriple = triples.find((m) => m[1] === '48');
      if (fgTriple && bgTriple) {
        const fg = `#${toHex2(+fgTriple[2])}${toHex2(+fgTriple[3])}${toHex2(+fgTriple[4])}`;
        const bg = `#${toHex2(+bgTriple[2])}${toHex2(+bgTriple[3])}${toHex2(+bgTriple[4])}`;
        entries.push({ name: ansiMatch[1], kind: 'ansi-pair', raw: body, fg, bg });
      }
    }
  }

  const seen = new Set<string>();
  const map = new Map(entries.map((e) => [e.name, e]));
  const doc: IniDoc = {
    groups: [''],
    get(_g, k) {
      const e = map.get(k);
      if (!e) return undefined;
      seen.add(k);
      return e.kind === 'hex' ? e.hex : `${e.fg}/${e.bg}`;
    },
    req(g, k) {
      const v = doc.get(g, k);
      if (v === undefined) throw new Error(`missing PSReadLine colour ${k}`);
      return v;
    },
    has: (_g, k) => map.has(k),
    keys: () => [...map.keys()].map((k) => `/${k}`),
    used: () => new Set([...seen].map((k) => `/${k}`)),
    touch(_g, k) {
      if (k !== undefined) { if (map.has(k)) seen.add(k); }
      else for (const key of map.keys()) seen.add(key);
    }
  };
  return { entries, doc };
}
