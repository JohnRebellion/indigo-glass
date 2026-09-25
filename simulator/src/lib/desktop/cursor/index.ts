import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { oursSrc, recipe, SLOT_MEANING, PATCH_DARK, PATCH_LIGHT, type CursorModel } from './model';

export const meta: SurfaceMeta = {
  id: 'cursor',
  name: 'Cursor theme',
  group: 'linux',
  order: 11,
  shipped: [
    { path: 'cursor/out/Bibata-IndigoGlass/cursors/*', generated: true },
    { path: 'cursor/out/Bibata-IndigoGlass/index.theme', generated: true },
    { path: 'cursor/out/Bibata-IndigoGlass/cursor.theme', generated: true }
  ],
  stockSource:
    'breeze_cursors (Plasma 6 default) from breeze-cursor-theme-6.7.4-2.fc44: 13 compiled Xcursor files plus index.theme copied byte for byte into fixtures/stock/cursor (provenance and hashes in its README). Ours is cursor/out/, built by cursor/build-bibata.sh from Bibata_Cursor 35ccfe20 (gitignored build output; cursor/README.md installs it by hand, scripts/install.sh only points GTK at it).',
  fidelity: 'high',
  fidelityWhy:
    'The pixels are decoded from the real Xcursor binaries (libXcursor layout, size pick and premultiplied alpha, unit-tested) and drawn 1:1 at the size libXcursor would choose, so shape, hotspot and colour are what X11/XWayland clients show. Not modelled: KWin 6 on Wayland prefers a theme\'s cursors_scalable/ SVGs, which Breeze has and Bibata lacks, so the stock lane is Breeze\'s bitmap fallback; and fractional-scale size rounding (hosts/*.toml carry no cursor size).',
  live:
    'System Settings > Colours & Themes > Cursors shows "Bibata Indigo Glass" (kcminputrc [Mouse] cursorTheme=Bibata-IndigoGlass, set on this host); hover a link (pointer), a text field (text) and a window edge (resize) and compare with the specimens; `XCURSOR_THEME=Bibata-IndigoGlass xterm` for the X11 path. scripts/check-deployment.sh reports whether the theme directory is installed. Checkable on this host (~/.local/share/icons/Bibata-IndigoGlass is byte-identical to cursor/out/), not run by this agent.'
};

/* Build recipe's slot table, bound to the token each colour must equal. The
   Page adds roles sampled from the compiled pixels on top of these. */
const SLOT_TOKEN: Record<string, string> = { '#00FF00': 'base', '#0000FF': 'text', '#FF0000': 'accent' };
const commentAccent = oursSrc.index.get('Icon Theme', 'Comment')?.match(/#[0-9A-Fa-f]{6}/)?.[0]?.toUpperCase() ?? '';

export const roles: Role[] = [
  ...Object.entries(recipe.slots).map(([slot, hex]) => ({
    role: `recipe ${slot} (${SLOT_MEANING[slot]})`,
    ours: hex,
    token: SLOT_TOKEN[slot] ?? null,
    note: 'build-bibata.sh render.json patch'
  })),
  { role: 'index.theme Comment accent', ours: commentAccent, token: 'accent', note: 'the theme names its own accent' }
];

/* Pixel-sampled roles: what the compiled binary actually paints. */
export function sampledRoles(ours: CursorModel, stock: CursorModel): Role[] {
  /* First colour that is not the body/outline fill and not a pure #FFFFFF /
     #000000 resampling clamp (drift-allow: Lanczos overshoot, not a paint). */
  const CLAMP = new Set(['#FFFFFF', '#000000']);
  const feature = (m: CursorModel, name: string) =>
    m.sample.hist[name]?.find(([c]) => c !== m.sample.body && c !== m.sample.outline && !CLAMP.has(c))?.[0] ?? '';
  return [
    { role: 'default: body fill (sampled)', ours: ours.sample.body, stock: stock.sample.body, token: 'base' },
    { role: 'default: outline (sampled)', ours: ours.sample.outline, stock: stock.sample.outline, token: 'text' },
    { role: 'wait: spinner accent (sampled)', ours: ours.sample.accent ?? 'absent', stock: stock.sample.accent ?? undefined, token: 'accent' },
    {
      role: 'not-allowed: slash (sampled)', ours: feature(ours, 'not-allowed'), stock: feature(stock, 'not-allowed'), token: null,
      note: 'Bibata hardcodes #FE0000 in crossed_circle.svg, off by one from the #FF0000 placeholder so the recolour skips it'
    },
    ...[1, 2, 3, 4].map((i) => ({
      role: `wait: spinner colour ${i} (sampled)`, ours: ours.sample.hist.wait?.filter(([c]) => c !== ours.sample.body && c !== ours.sample.outline && c !== ours.sample.accent)[i - 1]?.[0] ?? '',
      token: null,
      note: 'upstream wait-*.svg hardcodes a four-colour ring (#32A0DA #7EBA41 #F05024 #FCB813); only the #FF0000 segment takes the accent'
    }))
  ];
}

/* A cursor has no text. Its legibility is the outline ring against what it
   crosses, and the ring against its own fill: UI floor 3 throughout. */
export function pairs(body: string, outline: string, accent: string | null): ContrastPair[] {
  return [
    { name: 'Outline ring on the dark desktop (base)', fg: outline, bg: PATCH_DARK, min: 3 },
    { name: 'Body fill on a white page', fg: body, bg: PATCH_LIGHT, min: 3 },
    { name: 'Outline ring against the body fill', fg: outline, bg: body, min: 3 },
    ...(accent ? [{ name: 'Spinner accent on the dark desktop', fg: accent, bg: PATCH_DARK, min: 3 }] : [])
  ];
}

const slot = (s: string) => recipe.slots[s] ?? '';
export const contrast: ContrastPair[] = pairs(slot('#00FF00'), slot('#0000FF'), slot('#FF0000') || null);
