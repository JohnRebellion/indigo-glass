/* A small QML reader for the SDDM greeter pages.
 *
 * Not a QML engine: it builds the object tree (types, ids, property objects
 * like `background: Rectangle {}`, lists like `actionItems: [...]`, grouped
 * properties like `anchors { ... }`) and keeps every property binding as its
 * source text. The page resolves the few expressions a greeter paints with —
 * string literals, root properties, Qt.rgba(), a `cond ? a : b` state pair —
 * the way the QML engine would, including one scoping rule that bit the
 * shipped theme: an unqualified name resolves on the binding's own object
 * first, so `color: text` inside a Text is that Text's string, not root.text.
 *
 * The result implements IniDoc (group = node name, key = property), so the
 * shared coverage code can hold the page to every binding in the file. */
import type { IniDoc } from '../ini';

export type QmlNode = {
  type: string;
  id?: string;
  /* Stable group name: the id, else parent path + type, else parent.prop. */
  name: string;
  props: Map<string, string>;
  children: QmlNode[];
  parent?: QmlNode;
  /* Set when the node is the value of a property (background: Rectangle {}). */
  via?: string;
};

export type QmlDoc = IniDoc & {
  root: QmlNode;
  nodes: QmlNode[];
  node(name: string): QmlNode | undefined;
  /* get() without recording a read — for structure probes, not rendering. */
  peek(group: string, key: string): string | undefined;
};

const isUpper = (s: string) => /^[A-Z]/.test(s.split('.').pop() ?? '');

class Scanner {
  i = 0;
  constructor(readonly s: string) {}
  get c() { return this.s[this.i]; }
  /* Method form of `c === ch`, so TS does not narrow `c` across a loop. */
  at(ch: string) { return this.s[this.i] === ch; }
  eof() { return this.i >= this.s.length; }
  /* Skip spaces, and newlines/comments too when `nl`. */
  ws(nl = true) {
    for (;;) {
      const c = this.s[this.i];
      if (c === ' ' || c === '\t' || c === '\r' || (nl && c === '\n')) this.i++;
      else if (nl && this.s.startsWith('//', this.i)) this.toEol();
      else if (this.s.startsWith('/*', this.i)) { const e = this.s.indexOf('*/', this.i + 2); this.i = e < 0 ? this.s.length : e + 2; }
      else return;
    }
  }
  toEol() { const e = this.s.indexOf('\n', this.i); this.i = e < 0 ? this.s.length : e; }
  ident(): string {
    const m = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/.exec(this.s.slice(this.i, this.i + 200));
    if (!m) return '';
    this.i += m[0].length;
    return m[0];
  }
  peekRe(re: RegExp) { return re.exec(this.s.slice(this.i, this.i + 200)); }
  /* Skip a string literal starting at the cursor. */
  str() {
    const q = this.c;
    this.i++;
    while (!this.eof() && this.c !== q) { if (this.c === '\\') this.i++; this.i++; }
    this.i++;
  }
  /* Skip a balanced (), [] or {} group starting at the cursor. */
  group() {
    const open = this.c, close = open === '(' ? ')' : open === '[' ? ']' : '}';
    let d = 0;
    while (!this.eof()) {
      const c = this.c;
      if (c === '"' || c === "'" || c === '`') { this.str(); continue; }
      if (this.s.startsWith('//', this.i)) { this.toEol(); continue; }
      if (this.s.startsWith('/*', this.i)) { this.ws(false); continue; }
      if (c === open) d++;
      else if (c === close && --d === 0) { this.i++; return; }
      this.i++;
    }
  }
  /* A binding's expression: up to a newline, `;` or `}` at depth 0, joining
     lines when one ends on an operator or the next starts with one. */
  expr(stopComma = false): string {
    const start = this.i;
    let end = this.i;
    while (!this.eof()) {
      const c = this.c;
      if (c === '"' || c === "'" || c === '`') { this.str(); end = this.i; continue; }
      if (c === '(' || c === '[' || c === '{') { this.group(); end = this.i; continue; }
      if (this.s.startsWith('//', this.i)) { this.toEol(); continue; }
      if (this.s.startsWith('/*', this.i)) { this.ws(false); continue; }
      if (c === ';' || c === '}' || c === ']' || (stopComma && c === ',')) break;
      if (c === '\n') {
        const before = this.s.slice(start, end).trimEnd();
        const after = this.s.slice(this.i + 1).match(/^\s*(\S{1,2})/)?.[1] ?? '';
        if (/[-+*/?:&|,=(]$/.test(before) || /^(\?|:|\.|\+|&&|\|\|)/.test(after)) { this.i++; continue; }
        break;
      }
      this.i++;
      if (c !== ' ' && c !== '\t' && c !== '\r') end = this.i;
    }
    return this.s.slice(start, end).trim();
  }
}

function node(type: string, parent?: QmlNode, via?: string): QmlNode {
  const n: QmlNode = { type, name: '', props: new Map(), children: [], parent, via };
  parent?.children.push(n);
  return n;
}

/* Members of an object body, or of a grouped property when `prefix` is set. */
function body(sc: Scanner, n: QmlNode, prefix = '') {
  for (;;) {
    sc.ws();
    if (sc.eof()) return;
    if (sc.c === '}') { sc.i++; return; }
    if (sc.c === ';' || sc.c === ',') { sc.i++; continue; }
    const save = sc.i;
    let word = sc.ident();
    if (!word) { sc.i = save + 1; continue; }
    if (word === 'import' || word === 'pragma') { sc.toEol(); continue; }
    while (['readonly', 'default', 'required'].includes(word)) { sc.ws(false); word = sc.ident(); }
    if (word === 'signal') { sc.ws(false); sc.ident(); sc.ws(false); if (sc.c === '(') sc.group(); continue; }
    if (word === 'enum') { sc.ws(); sc.ident(); sc.ws(); if (sc.c === '{') sc.group(); continue; }
    if (word === 'function') {
      sc.ws(false);
      const name = sc.ident();
      sc.ws(false);
      if (sc.c === '(') sc.group();
      sc.ws();
      const at = sc.i;
      if (sc.c === '{') sc.group();
      n.props.set(`${prefix}function ${name}`, sc.s.slice(at, sc.i).trim());
      continue;
    }
    if (word === 'property') {
      sc.ws(false);
      sc.ident();
      if (sc.c === '<') { const e = sc.s.indexOf('>', sc.i); sc.i = e + 1; }
      sc.ws(false);
      const name = sc.ident();
      sc.ws(false);
      if (sc.c === ':') { sc.i++; value(sc, n, prefix + name); }
      continue;
    }
    sc.ws(false);
    if (sc.c === '{') {
      sc.i++;
      if (isUpper(word)) body(sc, node(word, n));
      else body(sc, n, `${prefix}${word}.`);
      continue;
    }
    const on = sc.peekRe(/^on\s+([\w.]+)\s*\{/);
    if (on && isUpper(word)) { sc.i += on[0].length; body(sc, node(`${word} on ${on[1]}`, n)); continue; }
    if (sc.c === ':') { sc.i++; value(sc, n, prefix + word); continue; }
    sc.toEol();
  }
}

function value(sc: Scanner, n: QmlNode, key: string) {
  sc.ws(false);
  const obj = sc.peekRe(/^([A-Z][\w]*(?:\.[A-Za-z_]\w*)*)\s*\{/);
  if (obj) { sc.i += obj[0].length; body(sc, node(obj[1], n, key)); return; }
  if (sc.c === '[') {
    const at = sc.i;
    sc.i++;
    let k = 0;
    const objects: QmlNode[] = [];
    for (;;) {
      sc.ws();
      if (sc.eof() || sc.at(']')) { sc.i++; break; }
      if (sc.at(',')) { sc.i++; continue; }
      const o = sc.peekRe(/^([A-Z][\w]*(?:\.[A-Za-z_]\w*)*)\s*\{/);
      if (o) { sc.i += o[0].length; const c = node(o[1], n, `${key}[${k++}]`); objects.push(c); body(sc, c); }
      else { sc.expr(true); k++; }
    }
    if (!objects.length) n.props.set(key, sc.s.slice(at, sc.i).trim());
    return;
  }
  n.props.set(key, sc.expr());
}

function name(n: QmlNode) {
  if (n.id) n.name = n.id;
  else if (!n.parent) n.name = n.type;
  else if (n.via) n.name = `${n.parent.name}.${n.via}`;
  else {
    const same = n.parent.children.filter((c) => !c.via && !c.id && c.type === n.type);
    n.name = `${n.parent.name}>${n.type}${same.length > 1 ? `[${same.indexOf(n)}]` : ''}`;
  }
  n.children.forEach(name);
}

export function parseQml(text: string): QmlDoc {
  const sc = new Scanner(text.replace(/^﻿/, ''));
  const top = node('<file>');
  body(sc, top);
  const root = top.children[0];
  if (!root) throw new Error('no root object');
  delete root.parent;
  const all: QmlNode[] = [];
  const walk = (x: QmlNode) => {
    const id = x.props.get('id');
    if (id) { x.id = id; x.props.delete('id'); }
    all.push(x);
    x.children.forEach(walk);
  };
  walk(root);
  name(root);
  const byName = new Map(all.map((x) => [x.name, x]));
  const seen = new Set<string>();
  const doc: QmlDoc = {
    root,
    nodes: all,
    node: (g) => byName.get(g),
    groups: all.map((x) => x.name),
    peek: (g, k) => byName.get(g)?.props.get(k),
    get(g, k) {
      const v = byName.get(g)?.props.get(k);
      if (v !== undefined) seen.add(`${g}/${k}`);
      return v;
    },
    req(g, k) {
      const v = doc.get(g, k);
      if (v === undefined) throw new Error(`missing ${g}.${k}`);
      return v;
    },
    has: (g, k) => byName.get(g)?.props.has(k) ?? false,
    keys: () => all.flatMap((x) => [...x.props.keys()].map((k) => `${x.name}/${k}`)),
    used: () => seen,
    touch(g, k) {
      const p = byName.get(g)?.props;
      if (!p) return;
      if (k !== undefined) { if (p.has(k)) seen.add(`${g}/${k}`); }
      else for (const key of p.keys()) seen.add(`${g}/${key}`);
    }
  };
  return doc;
}

/* ---- expression helpers ------------------------------------------------ */

export const unquote = (e: string | undefined) => {
  const m = e?.match(/^"((?:[^"\\]|\\.)*)"$|^'((?:[^'\\]|\\.)*)'$/);
  return m ? (m[1] ?? m[2]) : undefined;
};

/* Own properties of the types a greeter uses that an unqualified name can
   collide with. Enough to catch the `color: text` class of bug. */
const OWN: Record<string, string[]> = {
  Text: ['text', 'color', 'font', 'width', 'height', 'opacity', 'visible'],
  TextField: ['text', 'color', 'font', 'placeholderText', 'width', 'height', 'opacity'],
  Button: ['text', 'font', 'width', 'height', 'opacity'],
  ComboBox: ['model', 'currentText', 'font', 'width', 'height'],
  Rectangle: ['color', 'border', 'radius', 'width', 'height', 'opacity', 'gradient'],
  Image: ['source', 'opacity', 'width', 'height'],
  Item: ['width', 'height', 'opacity', 'visible']
};

/* An invalid colour string on a QML color property paints #000000 — checked
   with Qt 6.x's `qml` runtime on this host. */
export const QML_INVALID_COLOR = '#000000'; // drift-allow: Qt's value for an invalid colour, not a fill

const hex2 = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0').toUpperCase();

/* `via`: root properties the value was read through (for coverage). */
export type Resolved = { value: string; state?: string; shadowed?: string; via?: string[] };

/* Resolve a colour binding on `n`: its rest value, and for `cond ? a : b`
   the value the other branch paints (`state`). */
export function resolveColor(doc: QmlDoc, n: QmlNode, expr: string | undefined, depth = 0): Resolved {
  const e = (expr ?? '').replace(/\/\/.*$/, '').trim();
  if (!e || depth > 8) return { value: QML_INVALID_COLOR };
  const t = e.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
  if (t) {
    const on = resolveColor(doc, n, t[2], depth + 1), off = resolveColor(doc, n, t[3], depth + 1);
    return { value: off.value, state: on.value, shadowed: off.shadowed ?? on.shadowed, via: [...(off.via ?? []), ...(on.via ?? [])] };
  }
  const lit = unquote(e);
  if (lit !== undefined) {
    if (lit === 'transparent') return { value: 'transparent' };
    return /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(lit) ? { value: lit.length === 9 ? `#${lit.slice(3)}${lit.slice(1, 3)}`.toUpperCase() : lit.toUpperCase() } : { value: QML_INVALID_COLOR };
  }
  const rgba = e.match(/^Qt\.rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
  if (rgba) {
    const [r, g, b, a] = rgba.slice(1).map(Number);
    return { value: `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a) : ''}` };
  }
  const q = e.match(/^(\w+)\.(\w+)$/);
  const through = (p: string): Resolved => {
    const r = resolveColor(doc, doc.root, doc.root.props.get(p), depth + 1);
    return { ...r, via: [p, ...(r.via ?? [])] };
  };
  if (q && (q[1] === 'root' || q[1] === doc.root.id) && doc.root.props.has(q[2])) return through(q[2]);
  if (/^\w+$/.test(e)) {
    if ((OWN[n.type] ?? []).includes(e) && n !== doc.root) {
      const own = n.props.get(e);
      const r = own === undefined ? { value: QML_INVALID_COLOR } : resolveColor(doc, n, own, depth + 1);
      return { ...r, shadowed: `${n.name}: \`${e}\` resolves to this ${n.type}'s own ${e}` };
    }
    if (doc.root.props.has(e)) return through(e);
  }
  return { value: QML_INVALID_COLOR };
}

/* Numeric literal, or undefined for a binding. */
export const num = (e: string | undefined) => (e !== undefined && /^-?[\d.]+$/.test(e.trim()) ? Number(e) : undefined);
