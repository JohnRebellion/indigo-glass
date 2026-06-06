// theme.txt parser
// Grammar (from CTXz GrubThemeFormat-Reference + gibibit):
//   root:        key ':' '"' value '"'    e.g. terminal-top: "50%"
//                key ':' value             e.g. desktop-image: "bg.png"
//   component:   '+' name '{' (key '=' value)* '}'
//   value:       string | number | percent-math
// Comments: '#' to end-of-line.

export type ThemeValue = string;

export interface ThemeComponent {
  type: string;
  props: Record<string, ThemeValue>;
}

export interface Theme {
  root: Record<string, ThemeValue>;
  components: ThemeComponent[];
}

export function parseTheme(src: string): Theme {
  const theme: Theme = { root: {}, components: [] };

  // Strip comments + normalise whitespace.
  // A '#' starts a comment ONLY when at start-of-line or preceded by whitespace
  // — otherwise it's a hex color like #RRGGBB.
  const lines = src
    .split('\n')
    .map((l) => stripComment(l).trim())
    .filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Component block start: "+ name {"  OR inline "+ name { k = v  k = v }"
    const compMatch = line.match(/^\+\s*(\w+)\s*\{?\s*(.*)$/);
    if (compMatch) {
      const type = compMatch[1];
      const trailing = (compMatch[2] || '').trim();
      const props: Record<string, ThemeValue> = {};

      // Inline single-line form: ends with "}" on same line
      if (trailing.endsWith('}')) {
        const inner = trailing.slice(0, -1).trim();
        parseInlineProps(inner, props);
        theme.components.push({ type, props });
        i++;
        continue;
      }

      // Multi-line form
      if (!line.includes('{')) i++;
      i++;
      while (i < lines.length && lines[i] !== '}') {
        const propLine = lines[i];
        const m = propLine.match(/^(\w+)\s*=\s*(.+?)\s*;?\s*$/);
        if (m) {
          props[m[1]] = stripQuotes(m[2]);
        }
        i++;
      }
      i++; // skip closing }
      theme.components.push({ type, props });
      continue;
    }

    // Root property: "key: value" or "key : value"
    const rootMatch = line.match(/^([\w-]+)\s*:\s*(.+?)\s*;?\s*$/);
    if (rootMatch) {
      theme.root[rootMatch[1]] = stripQuotes(rootMatch[2]);
    }
    i++;
  }

  return theme;
}

/** Parse `key = val   key = "string with spaces"   key = 50%-100` inline pairs. */
function parseInlineProps(s: string, props: Record<string, string>): void {
  let i = 0;
  while (i < s.length) {
    // Skip whitespace
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    // Read key
    const keyStart = i;
    while (i < s.length && /\w/.test(s[i])) i++;
    const key = s.slice(keyStart, i);
    if (!key) break;
    // Skip whitespace + '='
    while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '=')) i++;
    // Read value: quoted string OR bareword (no spaces, but allows %+-*/.)
    let value = '';
    if (s[i] === '"' || s[i] === "'") {
      const quote = s[i++];
      const vStart = i;
      while (i < s.length && s[i] !== quote) i++;
      value = s.slice(vStart, i);
      if (s[i] === quote) i++;
    } else {
      const vStart = i;
      while (i < s.length && !/\s/.test(s[i])) i++;
      value = s.slice(vStart, i);
    }
    props[key] = value;
  }
}

function stripComment(line: string): string {
  // Skip '#' if it's part of a hex literal (preceded by '"' or '=' or ':' followed by # alphanum).
  // Simpler heuristic: a comment '#' is preceded by whitespace OR is the first non-space char.
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '#') {
      const prev = i === 0 ? ' ' : line[i - 1];
      if (prev === ' ' || prev === '\t') {
        return line.slice(0, i);
      }
      if (i === 0) return '';
    }
  }
  return line;
}

function stripQuotes(v: string): string {
  v = v.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

// Serialise back to theme.txt
export function serialiseTheme(theme: Theme): string {
  const out: string[] = [];
  for (const [k, v] of Object.entries(theme.root)) {
    out.push(`${k}: "${v}"`);
  }
  out.push('');
  for (const c of theme.components) {
    out.push(`+ ${c.type} {`);
    for (const [k, v] of Object.entries(c.props)) {
      // Numeric and percent-math values: unquoted
      const needsQuote = !/^[\d%+\-*\/.]+$/.test(v) && !v.includes('"');
      out.push(`  ${k} = ${needsQuote ? `"${v}"` : v}`);
    }
    out.push('}');
    out.push('');
  }
  return out.join('\n');
}
