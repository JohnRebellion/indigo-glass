import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PAINT, VGA } from './model';

export const meta: SurfaceMeta = {
  id: 'grub',
  name: 'GRUB boot theme',
  group: 'linux',
  order: 15,
  shipped: [
    { path: 'share/grub-theme/theme.txt' },
    { path: 'share/grub-theme/background.jpg', generated: true },
    { path: 'share/grub-theme/assets/menu_*.png, select_*.png, accent_line.png', generated: true },
    { path: 'share/grub-theme/sfpro-*.pf2' },
    { path: 'share/grub-theme/icons/*.png' }
  ],
  stockSource:
    "GRUB 2.12's no-theme text console: grub-core/normal/menu_text.c (fetched from " +
    'git.savannah.gnu.org/cgit/grub.git, HEAD 2026-09-25) plus the GRUB manual\'s ' +
    '"Menu color control" defaults (color_normal light-gray/black, color_highlight ' +
    'black/light-gray). There is no stock theme.txt to import: real default GRUB has ' +
    'no gfxmenu component tree at all.',
  fidelity: 'low',
  fidelityWhy:
    'Ours renders bit-for-bit through the real engine (theme/parser.ts, theme/pff2.ts, ' +
    'GrubScreen.svelte) fed the actual shipped theme.txt, fonts and pixmaps — that half ' +
    'is exact. Stock is a different subsystem entirely (VGA text-mode console, not a ' +
    'gfxterm canvas): a browser cannot reproduce an 8x16 bitmap console font or real ' +
    'text-mode cell geometry, so it is a monospace-webfont approximation of the layout ' +
    "and colour policy menu_text.c documents, not a pixel match.",
  live: 'scripts/sync-grub-parity.sh --deploy installs the theme and regenerates grub.cfg, ' +
    'but confirming the render means rebooting into the GRUB menu — this agent session ' +
    'cannot reboot the host, so this is a report-only live-check step for the user.'
};

const c = PAINT;

export const roles: Role[] = [
  { role: 'Card section label', ours: c.cardLabel, token: null, note: 'orchid_light accent — see model.test.ts (DesktopPage\'s automatic check only covers the default variant)' },
  { role: 'Card headline', ours: c.cardHeadline, token: null, stock: VGA.lightGray, note: 'orchid_light text; stock has no stat cards, VGA normal fg shown for reference' },
  { role: 'Card sub-line', ours: c.cardSubline, token: null, note: 'orchid_light accent_hi' },
  { role: 'Card capability caption', ours: c.cardCaption, token: null, note: 'orchid_light accent' },
  { role: 'BOOT PICKER header', ours: c.header, token: null, note: 'orchid_light text' },
  { role: 'Page background', ours: c.base, token: null, stock: VGA.black, note: 'orchid_light base; stock is the raw VGA console background' },
  { role: 'Boot menu card fill', ours: c.cardFill, token: null, stock: VGA.black, note: 'orchid_light card_fill (accent 0.45 over base, baked into assets/menu_*.png); stock has no card, just the console background' },
  { role: 'Boot menu edge / shadow', ours: c.edge, token: null, note: 'on_light.border — a global token, not variant-scoped' },
  { role: 'Boot menu item text', ours: c.itemText, token: null, stock: VGA.lightGray, note: 'orchid_light text; stock is VGA color_normal fg' },
  {
    role: 'Boot menu selected item text',
    ours: c.selectedItemText,
    token: null,
    stock: VGA.black,
    note:
      'orchid_light text — 2026-09-25 fix (was accent_hi, 4.4515:1 on card_fill, a hair ' +
      'under the 4.5:1 floor). Stock inverts to VGA color_highlight fg (black) instead.'
  }
];

export const contrast: ContrastPair[] = [
  { name: 'Card section label on page', fg: c.cardLabel, bg: c.base, min: 4.5 },
  { name: 'Card headline on page', fg: c.cardHeadline, bg: c.base, min: 4.5 },
  { name: 'Card sub-line on page', fg: c.cardSubline, bg: c.base, min: 4.5 },
  { name: 'Card capability caption on page', fg: c.cardCaption, bg: c.base, min: 4.5 },
  { name: 'BOOT PICKER header on page', fg: c.header, bg: c.base, min: 4.5 },
  { name: 'Item text on card', fg: c.itemText, bg: c.cardFill, min: 4.5 },
  /* The pair the 2026-09-25 fix exists for: proves selected-item text still
     clears the floor now that it shares item text's colour instead of
     accent_hi's. */
  { name: 'Selected item text on card', fg: c.selectedItemText, bg: c.cardFill, min: 4.5 }
];
