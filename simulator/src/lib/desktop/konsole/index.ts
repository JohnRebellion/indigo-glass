import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock, ansiChecks } from './model';
import { ANSI_SLOTS } from './ansi';

export const meta: SurfaceMeta = {
  id: 'konsole',
  name: 'Konsole',
  group: 'linux',
  order: 5,
  shipped: [{ path: 'share/konsole/SageInk.colorscheme' }, { path: 'share/konsole/SageInk.profile' }],
  stockSource:
    "Konsole's built-in Breeze.colorscheme (invent.kde.org/utilities/konsole, data/color-schemes/Breeze.colorscheme, commit dc63dd8, 2023-11-13 — compiled into the konsole binary as a Qt resource; there is no /usr/share/konsole/Breeze.colorscheme on this host to copy) plus the compiled-in fallback profile's defaults reconstructed from Profile::DefaultProperties (src/profile/Profile.cpp, commit 362e8f0, 2026-08-08) and Konsole's Enum::* values (src/Enumeration.h). Both in fixtures/stock/konsole/.",
  fidelity: 'medium',
  fidelityWhy:
    'Every colourscheme and profile key is read from the real shipped files, so colours, font, cursor, scrollbar and history settings are exact. The window chrome (tab bar, title) is a Konsole-shaped mock-up, not a Qt render, and the stock profile has no on-disk Font= value (QFontDatabase::systemFont(FixedFont) is a runtime call) — it is approximated from the KDE "fixed" font role (kde-colors surface, same host).',
  live: 'Konsole > Edit Current Profile > Appearance shows "SageInk" active; Profile shows the cursor/scrolling settings. scripts/check-deployment.sh does not check Konsole specifically. Checkable on this host if Konsole is installed with this profile active.'
};

/* Foreground tracks the ANSI white slot (Color7), a common terminal
 * convention (the "default text" colour is one of the 16, not a 17th
 * colour) — not a PALETTE token itself, so token: null; the equality check
 * against ansi.white lives in the ansiChecks table below, same as the other
 * 15 slots (see ansi.ts header for why Role can't carry this directly). */
const ansiNote = (slot: (typeof ANSI_SLOTS)[number]) => {
  const chk = ansiChecks.find((a) => a.slot === slot)!;
  return chk.ok ? `matches ansi.${slot} token (${chk.expected})` : `DRIFT vs ansi.${slot}: shipped ${chk.ours}, token says ${chk.expected}`;
};

export const roles: Role[] = [
  { role: 'Background', ours: ours.background, stock: stock.background, token: 'base' },
  { role: 'BackgroundFaint', ours: ours.backgroundFaint, stock: stock.backgroundFaint, token: 'base' },
  { role: 'BackgroundIntense', ours: ours.backgroundIntense, stock: stock.backgroundIntense, token: 'surface' },
  { role: 'Foreground', ours: ours.foreground, stock: stock.foreground, token: null, note: ansiNote('white') },
  { role: 'ForegroundIntense', ours: ours.foregroundIntense, stock: stock.foregroundIntense, token: 'text' },
  {
    role: 'ForegroundFaint',
    ours: ours.foregroundFaint,
    stock: stock.foregroundFaint,
    token: null,
    note: 'Konsole extension (dim SGR); [variants.sage.ansi] has no *_faint slot to check against — proposed TOML addition, not applied'
  },
  { role: 'CustomCursorColor', ours: ours.cursorColor, stock: stock.cursorColor, token: 'accent', note: 'Stock leaves UseCustomCursorColor false (Qt::white/black defaults); stock value shown for comparison only' },
  { role: 'CustomCursorTextColor', ours: ours.cursorTextColor, stock: stock.cursorTextColor, token: 'base', note: 'Stock leaves UseCustomCursorColor false (Qt::white/black defaults); stock value shown for comparison only' },
  ...ANSI_SLOTS.map((slot) => ({
    role: `ansi.${slot}`,
    ours: ours.ansi[slot],
    stock: stock.ansi[slot],
    token: null,
    note: ansiNote(slot)
  }))
];

/* Contrast the layer actually paints: every ANSI foreground against the
 * terminal background, at the normal-text floor — except plain `black`
 * (Color0), which [variants.sage.ansi] itself documents as "dim by design"
 * (1.70:1, a near-invisible-on-background slot some ls/grep configs rely on
 * for a "muted" black rather than a legible one). Forcing a 4.5 floor on it
 * would either fail honestly or require weakening the floor to pass, which
 * the brief rules out; excluding it and saying why is the honest option.
 * bright_black (`ansi.bright_black` = text_muted, 5.48:1) clears 4.5 and is
 * included normally. */
const bg = ours.background;
export const contrast: ContrastPair[] = [
  { name: 'Default text (Foreground on Background)', fg: ours.foreground, bg, min: 4.5 },
  ...ANSI_SLOTS.filter((s) => s !== 'black').map((s) => ({ name: `ansi.${s} on Background`, fg: ours.ansi[s], bg, min: 4.5 }))
];
