import { describe, expect, it } from 'vitest';
import { parseKdeFont, parseGtkFont, parseFlatToml, mdTable, familyVerdict, cssFamily, matchWeight } from './parse';

describe('parseKdeFont', () => {
  it('reads family, point size and the Qt 6 weight field', () => {
    expect(parseKdeFont('Iosevka Custom Condensed,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1')).toMatchObject({ family: 'Iosevka Custom Condensed', pt: 10, weight: 400 });
    expect(parseKdeFont('Noto Sans,10,-1,5,700,0,0,0,0,0,0,0,0,0,0,1').weight).toBe(700);
  });
  it('defaults a missing weight to Normal', () => {
    expect(parseKdeFont('Carlito,11')).toMatchObject({ family: 'Carlito', pt: 11, weight: 400 });
  });
});

describe('parseGtkFont', () => {
  it('splits the trailing size off a Pango name', () => {
    expect(parseGtkFont('Carlito 11')).toMatchObject({ family: 'Carlito', pt: 11, weight: 400 });
    expect(parseGtkFont('SF Pro Display 10.5')).toMatchObject({ family: 'SF Pro Display', pt: 10.5 });
  });
  it('takes a trailing weight word off the family', () => {
    expect(parseGtkFont('Noto Sans Bold 10')).toMatchObject({ family: 'Noto Sans', weight: 700 });
  });
  it('keeps an unsized value visible as NaN rather than inventing one', () => {
    expect(Number.isNaN(parseGtkFont('Carlito').pt)).toBe(true);
  });
});

describe('parseFlatToml', () => {
  it('reads dotted, indented sections and typed values', () => {
    const t = parseFlatToml('[a.b]\nx = "y"  # c\n  [a.b.c]\n  n = 416\nflag = true\n');
    expect(t).toEqual([
      { section: 'a.b', key: 'x', value: 'y' },
      { section: 'a.b.c', key: 'n', value: 416 },
      { section: 'a.b.c', key: 'flag', value: true }
    ]);
  });
});

describe('mdTable', () => {
  const md = '# T\n\n## Weight\n\n| Role | Weight |\n|------|:---:|\n| **Body** | 400 |\n| `Toolbar` | 500 |\n\ntext\n\n## Next\n| a | b |\n|-|-|\n| 1 | 2 |\n';
  it('returns body rows of the first table under a heading, markers stripped', () => {
    expect(mdTable(md, 'Weight')).toEqual([['Body', '400'], ['Toolbar', '500']]);
  });
  it('does not read past the next heading', () => {
    expect(mdTable('## A\ntext\n## B\n| x |\n|-|\n| 1 |\n', 'A')).toEqual([]);
  });
  it('returns nothing for a missing heading', () => {
    expect(mdTable(md, 'Nope')).toEqual([]);
  });
});

describe('familyVerdict', () => {
  const stack = ['Iosevka Custom Condensed', 'Iosevka Custom', 'monospace'];
  it('ok only for the head of the stack', () => {
    expect(familyVerdict('Iosevka Custom Condensed', stack)).toBe('ok');
    expect(familyVerdict('Iosevka Custom', stack)).toBe('fallback');
    expect(familyVerdict('Hack', stack)).toBe('drift');
  });
});

describe('cssFamily', () => {
  it('quotes names, leaves generics bare, drops duplicates', () => {
    expect(cssFamily(['Carlito', 'SF Pro Display', 'carlito', 'system-ui', 'sans-serif'])).toBe('"Carlito", "SF Pro Display", system-ui, sans-serif');
  });
});

describe('matchWeight', () => {
  it('draws the 400 face for a 500 request on a 400/700 family', () => {
    expect(matchWeight(500, [400, 700])).toBe(400);
  });
  it('picks the nearest heavier face above 500', () => {
    expect(matchWeight(600, [400, 700])).toBe(700);
    expect(matchWeight(600, [300, 500, 600])).toBe(600);
  });
  it('picks lighter first below 400', () => {
    expect(matchWeight(300, [100, 400])).toBe(100);
  });
  it('uses the exact face when it exists', () => {
    expect(matchWeight(500, [400, 500, 700])).toBe(500);
  });
});
