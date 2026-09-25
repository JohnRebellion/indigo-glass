import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PALETTE } from '../tokens';
import { ours, stock } from './model';

export const meta: SurfaceMeta = {
  id: 'klassy-decoration',
  name: 'Klassy window decoration',
  group: 'linux',
  order: 3,
  shipped: [
    { path: 'config/klassy/klassyrc' },
    { path: 'tokens/out/klassy-radius.ini', generated: true },
    { path: 'config/klassy/ink-shadow.patch' }
  ],
  stockSource:
    'Breeze window decoration defaults, unpatched (kdecoration/breezesettingsdata.kcfg, plasma/breeze master, invent.kde.org, fetched 2026-09-25) for button style/size, border size, title alignment and shadow size/strength/colour; the same BreezeDark WM colours ../kde-colors/model uses for its stock lane for the title bar itself.',
  fidelity: 'medium',
  fidelityWhy:
    "Button shape/size, titlebar alignment/margins, corner radius and the window shadow's offset are read directly from klassyrc + klassy-radius.ini + ink-shadow.patch, so that geometry is exact. Most of klassyrc's ButtonColors entries are Klassy's own named-colour system (\"AccentButtonHover\", \"TitleBarTextAuto\") resolved by internal C++ this repo's patches don't touch — those are shown as their literal klassyrc text in the settings table, not guessed at as swatches.",
  live: "System Settings > Window Decorations shows Klassy active with these button/shadow settings. Drag a window, check its shadow's offset and hardness, and compare an active vs. inactive title bar. Checkable on this host if Klassy is built and applied; scripts/check-deployment.sh does not check the decoration theme."
};

const WM_TOKEN: Record<string, string> = {
  activeBackground: 'surface', activeForeground: 'text',
  inactiveBackground: 'sidebar', inactiveForeground: 'text_muted'
};

export const roles: Role[] = [
  ...(['activeBackground', 'activeForeground', 'inactiveBackground', 'inactiveForeground'] as const).map((k) => ({
    role: `Title bar ${k}`,
    ours: ours.wm(k),
    stock: stock.wm(k),
    token: WM_TOKEN[k]
  })),
  {
    role: 'Window border/outline (useTitleBarColorForAllBorders)',
    ours: ours.wm('activeBackground'),
    token: 'surface',
    note: "klassyrc: useTitleBarColorForAllBorders=true — KDecoration3's own Frame colour role is undefined in SageInk.colors, which otherwise shows as a stray dark border regardless of outline/shadow settings (klassyrc's own comment, measured live). Forcing frame = titlebar colour removes the dependency."
  },
  {
    role: 'Button background (ButtonBackgroundColorsActive=Accent)',
    ours: PALETTE.accent,
    token: 'accent',
    note: '"Accent" is Klassy\'s named alias for the system accent colour — the one ButtonColors value this page resolves to a real token without Klassy\'s own colour-name C++. Active-window Close/Maximize/Minimize further override to "AccentHighlight"/"AccentButtonHover" (opaque, approximated with accent_hi); ApplicationMenu has no active override and stays plain Accent. Inactive-window overrides are uniform across every button, ApplicationMenu and Close included: "TitleBarTextAuto"@8 — a genuinely near-invisible wash, approximated with an 8% colour-mix on the specimen. None of these named tones resolve to an exact hex without Klassy\'s own C++ — shown as literal JSON, not swatches, in the settings table.'
  },
  {
    role: 'Window shadow colour (ShadowColorActive/Inactive)',
    ours: PALETTE.accent_alt,
    token: 'accent_alt',
    note: "klassyrc's own comment: \"ShadowColor derived from the active variant's accent_alt\" (137,168,137 = #89A889) — verified against tokens/out/json-tokens.json's palette."
  }
];

const wmContrast = (label: string, fg: string, bg: string): ContrastPair => ({ name: label, fg, bg, min: 4.5 });
export const contrast: ContrastPair[] = [
  wmContrast('Active title text', ours.wm('activeForeground'), ours.wm('activeBackground')),
  wmContrast('Inactive title text', ours.wm('inactiveForeground'), ours.wm('inactiveBackground'))
];
