/* A TOML reader for the one file this surface needs: config/starship.toml.
 * Not a general TOML parser — it covers exactly the constructs that file
 * uses (see the subset list below) and is meant to fail loudly, not
 * silently mis-parse, on anything outside that subset.
 *
 * Subset covered:
 *   - full-line comments (`# ...` as the first non-blank character)
 *   - `[table]` and `[table.sub]` headers (kept as the dotted string TOML
 *     itself uses — not split into nested groups, so callers ask for
 *     `get('directory.substitutions', 'Documents')` the same way an INI
 *     caller asks for `get('Group/Sub', 'Key')`)
 *   - `"quoted key" = value` and bare `key = value`
 *   - basic strings: `'literal'` (no escapes) and `"basic"` (\\, \", \n, \t)
 *   - one multi-line basic string per file: `key = """...""" `, applying
 *     TOML's two multi-line rules this file relies on: the newline right
 *     after the opening `"""` is trimmed, and a backslash immediately
 *     before a line ending (a "line-ending backslash") deletes the
 *     backslash, that newline, and any leading whitespace on the next line
 *   - `true` / `false` and bare integers
 *
 * NOT covered (not present in config/starship.toml today): arrays, inline
 * tables, dotted keys (`a.b = 1`), non-ASCII escapes, floats. A value using
 * one of these is returned as its raw trimmed text so a caller sees garbage
 * rather than the parser silently guessing — deliberately fragile outside
 * the tested subset. */
import type { IniDoc } from '../ini';

const id = (g: string, k: string) => `${g}\u0000${k}`;

export function parseStarshipToml(text: string): IniDoc {
  const data = new Map<string, Map<string, string>>();
  const ensure = (g: string) => data.get(g) ?? (data.set(g, new Map()), data.get(g)!);

  const lines = text.split(/\r?\n/);
  let group = '';
  ensure(group);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const header = line.match(/^\[([^\]]+)\]$/);
    if (header) {
      group = header[1];
      ensure(group);
      continue;
    }

    const eq = line.indexOf('=');
    if (eq < 0) continue;
    let rawKey = line.slice(0, eq).trim();
    if (/^"[^"]*"$/.test(rawKey) || /^'[^']*'$/.test(rawKey)) rawKey = rawKey.slice(1, -1);
    const rawVal = line.slice(eq + 1).trim();

    let value: string;
    if (rawVal.startsWith('"""')) {
      /* Multi-line basic string. If it also closes on this line
         (`""" ... """`), handle inline; otherwise consume lines until the
         closing """ is found. */
      let body: string;
      if (rawVal.length >= 6 && rawVal.endsWith('"""') && rawVal.slice(3).includes('"""') === false) {
        body = rawVal.slice(3, -3);
      } else {
        const chunk: string[] = [rawVal.slice(3)];
        let closed = false;
        while (++i < lines.length) {
          const l = lines[i];
          const end = l.indexOf('"""');
          if (end >= 0) {
            chunk.push(l.slice(0, end));
            closed = true;
            break;
          }
          chunk.push(l);
        }
        if (!closed) throw new Error(`unterminated """ string starting at line ${i}`);
        body = chunk.join('\n');
      }
      /* Trim the newline immediately after the opening delimiter. */
      body = body.replace(/^\r?\n/, '');
      /* Line-ending backslash: delete "\", the newline, and the next line's
         leading whitespace. */
      value = body.replace(/\\\r?\n[ \t]*/g, '');
    } else if (/^'.*'$/.test(rawVal)) {
      value = rawVal.slice(1, -1);
    } else if (/^".*"$/.test(rawVal)) {
      value = rawVal
        .slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else if (rawVal === 'true' || rawVal === 'false' || /^-?\d+$/.test(rawVal)) {
      value = rawVal;
    } else {
      /* Outside the covered subset (array, inline table, float, ...): keep
         the raw text so a caller sees something is off, rather than guess. */
      value = rawVal;
    }
    ensure(group).set(rawKey, value);
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
    keys: () => [...data].flatMap(([g, m]) => [...m.keys()].map((k) => `${g}/${k}`)),
    used: () => new Set([...seen].map((s) => s.replace('\u0000', '/'))),
    touch(g, k) {
      if (k !== undefined) {
        if (data.get(g)?.has(k)) seen.add(id(g, k));
      } else for (const key of data.get(g)?.keys() ?? []) seen.add(id(g, key));
    }
  };
  return doc;
}
