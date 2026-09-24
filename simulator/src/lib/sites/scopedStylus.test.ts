import { describe, it, expect } from 'vitest';
import {
  stripComments, unwrapMozDocument, mapPreludes, rewriteRoots, scopeStylus,
  selectorInventory, readMeta
} from './scopedStylus';

const HEADER = `/* ==UserStyle==
@name           Sage Ink — Test
@version        0.1.2
==/UserStyle== */
`;

describe('unwrapMozDocument', () => {
  it('finds the block brace outside a regexp() prelude containing {2,3}', () => {
    const css = `@-moz-document regexp("https?://www\\\\.google\\\\.[a-z]{2,3}/.*") { a { color: red } }`;
    expect(unwrapMozDocument(css).trim()).toBe('a { color: red }');
  });
  it('joins several blocks and drops the header', () => {
    const css = `${HEADER}@-moz-document domain("a.com") { a{} } @-moz-document domain("b.com") { b{} }`;
    expect(unwrapMozDocument(css).replace(/\s+/g, ' ').trim()).toBe('a{} b{}');
  });
});

describe('rewriteRoots', () => {
  it('rewrites :root, html and body in selector position', () => {
    expect(rewriteRoots(':root, html.skin-night, body')).toBe(':scope, :scope.skin-night, :scope');
    expect(rewriteRoots('html[dark]')).toBe(':scope[dark]');
    expect(rewriteRoots('html:is(.a, .b) :is(th, td)')).toBe(':scope:is(.a, .b) :is(th, td)');
  });
  it('leaves at-rule preludes and lookalike words alone', () => {
    expect(rewriteRoots('@supports (color: oklch(0% 0 0))')).toBe('@supports (color: oklch(0% 0 0))');
    expect(rewriteRoots('.body-copy, tbody, .html-view')).toBe('.body-copy, tbody, .html-view');
  });
});

describe('mapPreludes', () => {
  it('never hands a declaration to the callback', () => {
    const seen: string[] = [];
    mapPreludes('a { font-family: body, html; --x: :root } b { c: d }', (p) => { seen.push(p.trim()); return p; });
    expect(seen).toEqual(['a', 'b']);
  });
});

describe('scopeStylus', () => {
  const css = `${HEADER}@-moz-document domain("x.com") {
  /* prose mentioning :root and body must survive untouched — by being removed */
  :root, html[data-color-mode] { --a: #000 !important; }
  .btn { border-radius: 0 !important; }
  @supports (color: oklch(0% 0 0)) { :root { --a: oklch(0.1 0 0) !important; } }
}`;
  const out = scopeStylus(css, '.site-x[data-lane="ours"]');
  it('wraps in @scope and rewrites roots everywhere, including inside @supports', () => {
    expect(out.startsWith('@scope (.site-x[data-lane="ours"]) {')).toBe(true);
    expect(out).toContain(':scope, :scope[data-color-mode] { --a: #000 !important; }');
    expect(out).toContain('@supports (color: oklch(0% 0 0)) { :scope { --a: oklch(0.1 0 0) !important; } }');
    expect(out).not.toContain(':root');
    expect(out).not.toContain('prose');
  });
  it('keeps declarations byte-identical', () => {
    expect(out).toContain('.btn { border-radius: 0 !important; }');
  });
});

describe('selectorInventory', () => {
  it('lists classes, ids, attributes and element tokens, keeping :not() arguments', () => {
    const css = `@-moz-document domain("x.com") {
      :root { --a: 1; }
      .btn:not(.btn-octicon), [class*="prc-Button"][data-variant="primary"], #tsf .RNNXgb, pre, code, ytd-app { x: y }
      @supports (a: b) { :root { --a: 2; } }
    }`;
    expect(selectorInventory(css)).toEqual([
      '#tsf', '.RNNXgb', '.btn', '.btn-octicon', '[class*="prc-Button"]', '[data-variant="primary"]',
      'code', 'pre', 'ytd-app'
    ]);
  });
  it('does not read words out of declarations or the header', () => {
    const css = `${HEADER}@-moz-document domain("x.com") { a { font-family: "Iosevka Custom", monospace; } }`;
    expect(selectorInventory(css)).toEqual(['a']);
  });
});

describe('readMeta', () => {
  it('reads a ==UserStyle== field', () => {
    expect(readMeta(HEADER, 'version')).toBe('0.1.2');
    expect(readMeta(HEADER, 'missing')).toBeNull();
  });
});
