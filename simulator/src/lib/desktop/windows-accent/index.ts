import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PALETTE } from '../tokens';
import { ours, stock, pickOnAccentText } from './model';

export const meta: SurfaceMeta = {
  id: 'windows-accent',
  name: 'Windows 11 accent + dark mode',
  group: 'windows',
  order: 2,
  shipped: [{ path: 'windows/registry/indigo-glass-accent.reg' }],
  stockSource:
    'Windows 11 has no shippable "default theme" source file (unlike Darcula or Campbell, the shell theme engine is not open source). Each stock field cites a documented Microsoft behaviour or a ' +
    'community-verified fresh-install default instead of a fetched file -- see model.ts\'s STOCK_NOTE for the exact citation per field. Fields DWM computes at runtime from the wallpaper ' +
    '(ColorizationColor/Afterglow and their balance knobs) are left unset in the stock lane rather than invented.',
  fidelity: 'low',
  fidelityWhy:
    'Every registry DWORD this page reads is decoded with the real 0xAABBGGRR byte order (verified against the shipped file\'s own bytes, not assumed) and matched 1:1 against tokens.ts\'s PALETTE. ' +
    'But the specimens themselves (taskbar, title bar, toggle, button) are hand-built CSS approximations of Fluent/Mica materials, not a Win32/UWP render -- this repo\'s own no-blur, opaque-flat-ink ' +
    'aesthetic means no attempt is made to reproduce Windows\' acrylic/Mica translucency even in the stock lane, so the shapes read right but the material does not.',
  live: 'This host has no Windows installation (see project machine topology: two Linux machines + Windows) -- `reg import indigo-glass-accent.reg`, sign out/in, and comparing Settings > ' +
    'Personalization > Colors against this page is a manual check for the user on the Windows machine.'
};

const accentHex = ours.accentColor?.hex ?? '#000000';
const onAccent = pickOnAccentText(accentHex);

const NOT_SET = '(not set)';

export const roles: Role[] = [
  { role: 'AccentColor (DWM)', ours: accentHex, stock: stock.accentColor?.hex ?? NOT_SET, token: 'accent' },
  { role: 'AccentColorMenu (DWM)', ours: ours.accentColorMenuDwm?.hex ?? NOT_SET, token: 'accent', note: 'duplicate of AccentColor under [...\\DWM] -- both keys always match in a well-formed .reg' },
  { role: 'AccentColorMenu (Explorer\\Accent)', ours: ours.accentColorMenuExplorer?.hex ?? NOT_SET, token: 'accent' },
  { role: 'StartColorMenu (Explorer\\Accent)', ours: ours.startColorMenu?.hex ?? NOT_SET, token: 'accent' },
  { role: 'ColorizationColor', ours: ours.colorizationColor?.hex ?? NOT_SET, token: 'accent', note: `alpha 0x${ours.colorizationColor?.a.toString(16)} -- not fully opaque; Windows composites this under system chrome, it is not painted flat` },
  { role: 'ColorizationAfterglow', ours: ours.colorizationAfterglow?.hex ?? NOT_SET, token: 'accent', note: 'same accent, used for the colorization fade-out edge' },
  { role: 'Caption/glyph text on the accent fill', ours: onAccent, token: onAccent === PALETTE.base ? 'base' : null, note: 'not a registry key -- DWM computes this from accent luminance at runtime; sage\'s accent is light so real Windows renders dark glyphs here too (see model.ts pickOnAccentText)' }
];

export const contrast: ContrastPair[] = [
  { name: 'Caption/glyph text on active title bar (accent fill)', fg: onAccent, bg: accentHex, min: 4.5 },
  /* 2026-09-25 finding: a plain white toggle thumb (WinUI's usual on-state
     knob colour) measures 1.82:1 on this light accent -- under even the 3:1
     UI floor. There is no registry key for this (it is OS chrome, not
     anything Sage Ink ships a value for), so the honest fix is the same
     "light fill needs the dark token" rule as the caption text above, not a
     fixed white -- see model.ts's pickOnAccentText and its header comment. */
  { name: 'Toggle thumb on accent track', fg: onAccent, bg: accentHex, min: 3 }
];
