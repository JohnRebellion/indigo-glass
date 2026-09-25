import { describe, expect, it } from 'vitest';
import { PALETTE } from '../tokens';
import {
  recolour, stylesheet, bodyFill, oklch, hueDelta, followsScheme, folderCandidates,
  ours, stock, NAMES, SIZES, SHEET_CLASSES, type IconColors
} from './model';

const probe: IconColors = {
  text: 'T', background: 'B', highlight: 'H', highlightedText: 'HT', positive: 'P', neutral: 'N', negative: 'X', accent: 'A'
};

describe('stylesheet (KIconColors::stylesheet)', () => {
  it('emits the eight classes in upstream order', () => {
    const sheet = stylesheet(probe);
    expect(sheet.split('\n').map((l) => l.match(/ColorScheme-(\w+)/)?.[1])).toEqual(SHEET_CLASSES.map(([c]) => c));
    expect(sheet).toContain('.ColorScheme-NegativeText { color:X; }');
  });
});

describe('recolour', () => {
  const svg = '<svg><defs><style type="text/css" id="current-color-scheme">.ColorScheme-Text { color:#dfdfdf; }</style></defs><path class="ColorScheme-Text"/></svg>';
  it('replaces only the current-color-scheme stylesheet body', () => {
    const out = recolour(svg, 'NEW');
    expect(out).toBe('<svg><defs><style type="text/css" id="current-color-scheme">NEW</style></defs><path class="ColorScheme-Text"/></svg>');
  });
  it('matches id before type, as Breeze writes it', () => {
    expect(recolour('<style id="current-color-scheme" type="text/css">x</style>', 'y')).toBe('<style id="current-color-scheme" type="text/css">y</style>');
  });
  it('leaves an SVG without the stylesheet untouched', () => {
    const plain = '<svg><rect style="fill:#5294e2" width="4" height="4"/></svg>';
    expect(recolour(plain, 'NEW')).toBe(plain);
    expect(followsScheme(plain)).toBe(false);
  });
});

describe('bodyFill', () => {
  it('takes the lane accent for a Breeze-style ColorScheme-Accent folder', () => {
    const svg = '<svg><style id="current-color-scheme">.ColorScheme-Accent{color:#3daee9}</style><path style="fill:currentColor" class="ColorScheme-Accent"/></svg>';
    expect(bodyFill(svg, probe)).toBe('A');
  });
  it('takes the largest opaque rect for a Papirus folder, skipping opacity shadows', () => {
    const svg = '<svg><rect style="opacity:0.2" width="40" height="26"/><rect style="fill:#e4e4e4" width="36" height="16"/><rect style="fill:#5294e2" width="40" height="26"/></svg>';
    expect(bodyFill(svg, probe)).toBe('#5294E2');
  });
  it('does not read stroke-width as width', () => {
    expect(bodyFill('<svg><rect fill="#111111" stroke-width="90" width="1" height="1"/><rect fill="#222222" width="2" height="2"/></svg>', probe)).toBe('#222222');
  });
});

describe('oklch', () => {
  it('white is L 1, achromatic', () => {
    const w = oklch('#ffffff');
    expect(w.L).toBeCloseTo(1, 3);
    expect(w.C).toBeLessThan(1e-3);
  });
  it('hueDelta wraps around 360', () => {
    expect(hueDelta({ H: 350 } as never, { H: 10 } as never)).toBe(20);
  });
});

describe('lane models', () => {
  it('reads [Icons] Theme from each lane file', () => {
    expect(ours.theme).toBe('Papirus-Dark');
    expect(stock.theme).toBe('breeze-dark');
  });
  it('resolves every name at every size in both themes', () => {
    for (const m of [ours, stock]) for (const n of NAMES) for (const z of SIZES) expect(m.icon(n, z).svg).toMatch(/<svg/);
  });
  it('recolours ours symbolic glyphs with SageInk text, not Papirus #dfdfdf', () => {
    const svg = ours.icon('edit-copy', 16).svg;
    expect(svg).toContain(`.ColorScheme-Text { color:${PALETTE.text}; }`);
    expect(svg.toLowerCase()).not.toContain('color:#dfdfdf');
  });
  it('Breeze 48px folders follow the scheme accent; Papirus ones are hard-coded', () => {
    expect(stock.icon('folder', 48).body).toBe(stock.colors.accent);
    expect(ours.icon('folder', 48).follows).toBe(false);
    expect(ours.icon('folder', 48).body).not.toBe(ours.colors.accent);
  });
  it('lists papirus-folders candidates with the current default flagged', () => {
    const c = folderCandidates();
    expect(c.map((x) => x.colour).sort()).toEqual(['blue', 'bluegrey', 'darkcyan', 'green', 'grey', 'teal']);
    expect(c.filter((x) => x.isDefault).map((x) => x.colour)).toEqual(['blue']);
    expect(c[0].colour).toBe('green');
  });
});
