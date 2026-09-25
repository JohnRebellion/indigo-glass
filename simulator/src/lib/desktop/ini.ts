/* INI reader for the desktop layers: KDE .colors / kdeglobals, klassyrc,
 * kwinrc snippets, Konsole .colorscheme/.profile, VLC, GTK settings.ini,
 * Plasma theme `colors`, SDDM theme.conf, spicetify color.ini.
 *
 * Every read goes through `get`, which records the "Group/Key" it touched.
 * A comparison page renders from these reads only, so after mount the
 * difference between `keys()` and `used()` is exactly the set of shipped
 * settings the page does not demonstrate — the same honesty contract as the
 * /sites/ selector coverage footer.
 *
 * Repeated groups (vlcrc repeats [file], KConfig allows [A][B] nesting) are
 * merged in order; a later key wins, as KConfig resolves them. */

export type IniDoc = {
  groups: string[];
  get(group: string, key: string): string | undefined;
  /* Same as get, but a missing key is a render bug, not a fallback. */
  req(group: string, key: string): string;
  has(group: string, key: string): boolean;
  keys(): string[];
  used(): Set<string>;
  /* Mark keys as shown when they are rendered by something other than get
     (a whole group handed to a table, for example). */
  touch(group: string, key?: string): void;
};

const id = (g: string, k: string) => `${g}/${k}`;

export function parseIni(text: string): IniDoc {
  const data = new Map<string, Map<string, string>>();
  let group = '';
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const head = line.match(/^((?:\[[^\]]*\])+)$/);
    if (head) {
      /* KConfig nested groups: [Colors:Window][Inactive] -> "Colors:Window/Inactive" */
      group = [...head[1].matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]).join('/');
      if (!data.has(group)) data.set(group, new Map());
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim().replace(/\[\$[a-z]+\]$/, '');
    const val = line.slice(eq + 1).trim();
    if (!data.has(group)) data.set(group, new Map());
    data.get(group)!.set(key, val);
  }

  const seen = new Set<string>();
  const doc: IniDoc = {
    groups: [...data.keys()],
    get(g, k) {
      const v = data.get(g)?.get(k);
      if (v !== undefined) seen.add(id(g, k));
      return v;
    },
    req(g, k) {
      const v = doc.get(g, k);
      if (v === undefined) throw new Error(`missing [${g}] ${k}`);
      return v;
    },
    has: (g, k) => data.get(g)?.has(k) ?? false,
    keys: () => [...data].flatMap(([g, m]) => [...m.keys()].map((k) => id(g, k))),
    used: () => seen,
    touch(g, k) {
      if (k !== undefined) {
        if (data.get(g)?.has(k)) seen.add(id(g, k));
      } else for (const key of data.get(g)?.keys() ?? []) seen.add(id(g, key));
    }
  };
  return doc;
}

/* KDE writes colours as "r,g,b" or "r,g,b,a" (0-255). Konsole the same.
 * Hex passes through; anything else is returned unchanged so a bad value
 * shows up on the page instead of silently becoming black. */
export function kdeColor(v: string | undefined): string {
  if (!v) return 'transparent';
  const s = v.trim();
  if (s.startsWith('#')) return s.toUpperCase();
  const n = s.split(',').map((x) => Number(x.trim()));
  if (n.length >= 3 && n.slice(0, 3).every((x) => Number.isFinite(x))) {
    const hex = n.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
    if (n.length === 4 && n[3] < 255) return `#${hex}${Math.round(n[3]).toString(16).padStart(2, '0').toUpperCase()}`;
    return `#${hex}`;
  }
  return s;
}

/* Keys not rendered, minus the ones a page declares out of scope. A pattern
   ending in "/*" ignores a whole group. */
export function unusedKeys(doc: IniDoc, ignore: string[] = []): string[] {
  const used = doc.used();
  const skip = (k: string) =>
    ignore.some((p) => (p.endsWith('/*') ? k.startsWith(p.slice(0, -1)) : p === k));
  return doc.keys().filter((k) => !used.has(k) && !skip(k));
}
