// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { apply, auditPart, colourAlpha, elementBox, namedParts, paintsOf, parseSvg, parseTransform, partSvg, pathPoints } from './svg';

const doc = (body: string, attrs = 'width="100" height="50"') =>
  parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ${attrs}>${body}</svg>`);
const round = (b: { x: number; y: number; w: number; h: number } | null) => b && [b.x, b.y, b.w, b.h].map((v) => Math.round(v * 1000) / 1000);

describe('parseTransform', () => {
  test('translate, scale and matrix compose left to right', () => {
    expect(apply(parseTransform('translate(10 5) scale(2)'), 1, 1)).toEqual([12, 7]);
    expect(apply(parseTransform('matrix(1,0,0,1,3,4)'), 0, 0)).toEqual([3, 4]);
  });
  test('rotate about a centre', () => {
    const [x, y] = apply(parseTransform('rotate(90 10 10)'), 20, 10);
    expect([Math.round(x), Math.round(y)]).toEqual([10, 20]);
  });
  test('empty is identity', () => expect(parseTransform(null)).toEqual([1, 0, 0, 1, 0, 0]));
});

describe('pathPoints', () => {
  test('relative lines and closepath', () => {
    expect(pathPoints('m 1 2 h 3 v 4 z')).toEqual([[1, 2], [4, 2], [4, 6], [1, 2]]);
  });
  test('packed arc flags (a4 4 0 014 4) parse', () => {
    const pts = pathPoints('M0 0a4 4 0 014 4');
    const last = pts[pts.length - 1];
    expect(last.map((v) => Math.round(v))).toEqual([4, 4]);
    /* The arc bulges beyond the chord. */
    expect(Math.max(...pts.map((p) => p[0]))).toBeGreaterThan(3.9);
  });
  test('cubic curves are sampled through their end point', () => {
    const pts = pathPoints('M0 0C0 10 10 10 10 0');
    expect(pts[pts.length - 1]).toEqual([10, 0]);
    expect(Math.max(...pts.map((p) => p[1]))).toBeCloseTo(7.5, 1);
  });
});

describe('elementBox', () => {
  test('ancestor transforms and the viewBox scale apply', () => {
    const s = doc('<g transform="translate(10 0)"><rect id="a" x="0" y="0" width="5" height="5"/></g>', 'width="200" height="100" viewBox="0 0 100 50"');
    expect(round(elementBox(s, 'a'))).toEqual([20, 0, 10, 10]);
  });
  test('<use> follows its target with x/y', () => {
    const s = doc('<defs><rect id="t" width="4" height="4"/></defs><use id="u" xlink:href="#t" x="3" y="2"/>');
    expect(round(elementBox(s, 'u'))).toEqual([3, 2, 4, 4]);
  });
  test('missing element is null', () => expect(elementBox(doc(''), 'x')).toBeNull());
});

describe('partSvg', () => {
  const s = doc(
    '<defs><style id="current-color-scheme">.ColorScheme-Text{color:#123456}</style><linearGradient id="g"><stop offset="0"/></linearGradient></defs>' +
    '<g transform="translate(5 5)"><g id="part"><rect class="ColorScheme-Text" style="fill:currentColor" width="10" height="4"/><use xlink:href="#shape"/></g></g>' +
    '<rect id="shape" width="1" height="1"/>'
  );
  const p = partSvg(s, 'part', (cls) => Object.fromEntries([...cls].map((c) => [c, '#ABCDEF'])))!;
  test('viewBox is the user-space bounds; size is px', () => {
    expect(p.xml).toContain('viewBox="5 5 10 4"');
    expect(p.xml).toContain('preserveAspectRatio="none"');
    expect(round(p.box)).toEqual([5, 5, 10, 4]);
  });
  test('the injected colour scheme replaces the file\'s own', () => {
    expect(p.xml).toContain('.ColorScheme-Text{color:#ABCDEF;}');
    expect(p.xml).not.toContain('#123456');
    expect([...p.classes]).toEqual(['Text']);
  });
  test('<use> targets outside <defs> and the ancestor transform come along', () => {
    expect(p.xml).toContain('id="shape"');
    expect(p.xml).toContain('translate(5 5)');
  });
});

describe('paintsOf / auditPart', () => {
  const s = doc(
    '<defs><linearGradient id="grad"><stop offset="0" stop-opacity="0.2"/><stop offset="1" stop-opacity="0"/></linearGradient></defs>' +
    '<g id="solid"><rect class="ColorScheme-Background" style="fill:currentColor" width="4" height="4"/></g>' +
    '<g id="wash" style="opacity:0.5"><rect fill="#FFFFFF" fill-opacity="0.5" width="4" height="4"/></g>' +
    '<g id="ghost"><rect style="opacity:0" fill="#000" width="4" height="4"/></g>' +
    '<g id="fade"><rect fill="url(#grad)" width="4" height="4"/></g>' +
    '<g id="blur"><rect style="filter:url(#f)" fill="#000" width="4" height="4"/></g>' +
    '<g id="inline" class="ColorScheme-Text" style="color:#222222"><rect fill="currentColor" width="1" height="1"/></g>' +
    '<g id="hint-top-margin"><rect width="1" height="1"/></g><path id="path123" d="M0 0h1v1z"/>'
  );
  const cls = (c: string) => (c === 'Background' ? '#0D0D10' : '#F8F8F8');
  test('class colours resolve through currentColor', () => {
    expect(paintsOf(s, 'solid', cls)).toMatchObject([{ colour: '#0D0D10', alpha: 1 }]);
  });
  test('an inline color wins over the class rule', () => {
    expect(paintsOf(s, 'inline', cls)[0].colour).toBe('#222222');
  });
  test('opacity multiplies through groups and fill-opacity', () => {
    expect(paintsOf(s, 'wash')[0].alpha).toBeCloseTo(0.25);
  });
  test('invisible paint is not paint', () => expect(paintsOf(s, 'ghost')).toEqual([]));
  test('audit flags translucency, gradients and filters; solid parts are clean', () => {
    expect(auditPart(s, 'solid')).toEqual([]);
    expect(auditPart(s, 'wash').map((f) => f.kind)).toEqual(['translucent']);
    expect(auditPart(s, 'fade').map((f) => f.kind)).toEqual(['gradient']);
    expect(auditPart(s, 'blur').map((f) => f.kind)).toContain('blur');
  });
  test('colourAlpha', () => {
    expect([colourAlpha('#00000080'), colourAlpha('none'), colourAlpha('rgba(0,0,0,.25)'), colourAlpha('#FFF')]).toEqual([128 / 255, 0, 0.25, 1]);  // drift-allow: parser inputs for colourAlpha, not paint
  });
  test('namedParts skips auto ids and defs', () => {
    expect(namedParts(s)).toEqual(['solid', 'wash', 'ghost', 'fade', 'blur', 'inline', 'hint-top-margin']);
  });
});
