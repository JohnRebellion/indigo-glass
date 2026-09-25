/* GRUB boot theme: share/grub-theme/theme.txt (hand-kept, the one colour
 * switch per its own header) plus the assets it bakes (background.jpg,
 * assets/*.png, sfpro-*.pf2, icons/*.png). "Ours" renders through the SAME
 * engine the studio /grub/ route and the real bootloader use — theme/parser.ts,
 * theme/pff2.ts and GrubScreen.svelte, all imported read-only — fed the real
 * shipped theme.txt.
 *
 * "Stock" (GRUB 2.12, no GRUB_THEME set) is a completely different code path:
 * grub-core/normal/menu_text.c's plain VGA-text console menu. It has no
 * gfxmenu component tree, no pixmaps, no PFF2 fonts to parse — there is no
 * "stock theme.txt" to import raw. It is reconstructed here as plain data,
 * cited to the upstream source read via `curl -sL
 * https://git.savannah.gnu.org/cgit/grub.git/plain/grub-core/normal/menu_text.c`
 * (HEAD, 2026-09-25) and the GRUB manual's "Menu color control" defaults.
 */

import themeTxtRaw from '../../../../../share/grub-theme/theme.txt?raw';
import backgroundUrl from '../../../../../share/grub-theme/background.jpg?url';
import tokensJson from '../../../../../tokens/out/json-tokens.json';
import { parseTheme, type Theme } from '../../theme/parser';
import { parsePFF2, type PFF2Font } from '../../theme/pff2';
import type { LoadedPreset } from '../../theme/loader';
import type { ThemeAssets } from '../../theme/icon';
import type { GrubCfg } from '../../theme/cfg';

/* ---------- ours: the real theme.txt, parsed once at module load ---------- */

export const theme: Theme = parseTheme(themeTxtRaw);

const bootMenu = theme.components.find((c) => c.type === 'boot_menu');
if (!bootMenu) throw new Error('grub/model: theme.txt has no boot_menu component');

function labelProps(text: string): Record<string, string> {
  const c = theme.components.find((c) => c.type === 'label' && c.props.text === text);
  if (!c) throw new Error(`grub/model: theme.txt has no label with text "${text}"`);
  return c.props;
}

/* ---------- orchid_light tokens, read from the same generated json every
   other surface's tokens.ts reads — never hand-copied. tokens.ts's own
   PALETTE is the DEFAULT variant only (sage), so DesktopPage's automatic
   role check cannot verify a variant-locked layer like this one; roles in
   index.ts carry token: null and the real cross-check lives in
   model.test.ts against these same values. ---------- */

type PaletteSwatch = { hex: string };
type TokensDoc = {
  _derived: { palettes: Record<string, Record<string, PaletteSwatch>> };
  on_light: { border: string };
};
const doc = tokensJson as unknown as TokensDoc;

export const ORCHID_LIGHT: Record<string, string> = Object.fromEntries(
  Object.entries(doc._derived.palettes.orchid_light).map(([k, v]) => [k, v.hex.toUpperCase()])
);
export const ON_LIGHT_BORDER = doc.on_light.border.toUpperCase();

/* ---------- every hex GRUB actually paints, read off the parsed theme ---------- */

export const PAINT = {
  base: (theme.root['desktop-color'] ?? '#FAFAFC').toUpperCase(),
  cardLabel: labelProps('CPU').color.toUpperCase(),
  cardHeadline: labelProps('Ryzen 7 5700X3D').color.toUpperCase(),
  cardSubline: labelProps('8C / 16T - 96MB 3D V-Cache').color.toUpperCase(),
  cardCaption: labelProps('AMD-V - IOMMU - AVX2/AES/SHA').color.toUpperCase(),
  header: labelProps('BOOT PICKER').color.toUpperCase(),
  itemText: (bootMenu.props.item_color ?? '').toUpperCase(),
  selectedItemText: (bootMenu.props.selected_item_color ?? '').toUpperCase(),
  /* Not a literal theme.txt prop — baked into assets/menu_*.png by
     generate-menu.sh (accent 0.45 over base). Cited to README.md's own
     "Design contract" table and confirmed against the generated palette. */
  cardFill: ORCHID_LIGHT.card_fill,
  edge: ON_LIGHT_BORDER
};

/* ---------- shared boot menu content — same entries in both lanes; only the
   theme (this layer) differs between stock and ours. Matches the existing
   studio /grub/ route's default cfg for this host. ---------- */

export const cfg: GrubCfg = {
  entries: [
    { title: 'Nobara Linux (7.0.1-200.nobara.fc43.x86_64)', classes: ['nobara', 'gnu-linux', 'gnu', 'os'] },
    { title: 'Nobara Linux (7.0.0-200.nobara.fc43.x86_64)', classes: ['nobara', 'gnu-linux', 'gnu', 'os'] },
    { title: 'Windows 11', classes: ['windows', 'os'] },
    { title: 'UEFI Firmware Settings', classes: ['uefi-firmware'] },
    { title: 'Memory test (memtest86+x64.efi)', classes: ['memtest'] }
  ],
  defaultIndex: 0,
  timeout: 5
};

/* ---------- ours: load the real assets + fonts for the canvas renderer ---------- */

const ASSET_GLOB = import.meta.glob<string>('../../../../../share/grub-theme/assets/*.png', {
  query: '?url',
  import: 'default',
  eager: true
});
const ICON_GLOB = import.meta.glob<string>('../../../../../share/grub-theme/icons/*.png', {
  query: '?url',
  import: 'default',
  eager: true
});
const FONT_GLOB = import.meta.glob<string>('../../../../../share/grub-theme/sfpro-*.pf2', {
  query: '?url',
  import: 'default',
  eager: true
});

function keyAfter(globPath: string, marker: string): string {
  const i = globPath.indexOf(marker);
  return i === -1 ? globPath : globPath.slice(i + marker.length);
}

const ASSET_FILES = new Map(Object.entries(ASSET_GLOB).map(([p, url]) => [`assets/${keyAfter(p, '/assets/')}`, url]));
const ICON_FILES = new Map(Object.entries(ICON_GLOB).map(([p, url]) => [`icons/${keyAfter(p, '/icons/')}`, url]));
const FONT_URLS = Object.values(FONT_GLOB);

let cachedPreset: Promise<LoadedPreset> | null = null;
/** Builds the LoadedPreset GrubScreen.svelte expects, from the real repo
 * files — never from a manifest.json (share/grub-theme ships none; adding
 * one would mean hand-editing the surface's shipped directory just to feed
 * the studio route's fetch-based loader, which this folder does not own). */
export function loadOursPreset(): Promise<LoadedPreset> {
  if (!cachedPreset) cachedPreset = buildPreset();
  return cachedPreset;
}

async function buildPreset(): Promise<LoadedPreset> {
  const files = new Map<string, string>([...ASSET_FILES, ...ICON_FILES, ['background.jpg', backgroundUrl]]);
  const fonts = new Map<string, PFF2Font>();
  await Promise.all(
    FONT_URLS.map(async (url) => {
      const buf = await fetch(url).then((r) => r.arrayBuffer());
      const font = parsePFF2(buf);
      fonts.set(font.name, font);
    })
  );
  const assets: ThemeAssets = { files };
  return {
    id: 'grub-sage-ink',
    manifest: {
      name: 'Sage Ink (orchid_light)',
      themeTxt: 'theme.txt',
      background: 'background.jpg',
      fonts: [...FONT_URLS],
      assets: [...ASSET_FILES.keys()],
      icons: [...ICON_FILES.keys()]
    },
    theme,
    assets,
    fonts,
    rawFiles: new Map()
  };
}

/* ---------- stock: GRUB 2.12's no-theme text console (menu_text.c) ---------- */

/* Standard 16-colour VGA text palette GRUB's colour names resolve to
   (grub-core/term/i386/pc/vga_text.c / the GRUB manual's colour name table).
   `color_normal` defaults to "light-gray/black", `color_highlight` to
   "black/light-gray" — GRUB manual §12 "Menu color control", and
   grub_color_menu_normal/grub_color_menu_highlight in menu_text.c which
   fall back to those names when menu_color_normal/menu_color_highlight are
   unset in grub.cfg. */
export const VGA = {
  black: '#000000',
  lightGray: '#AAAAAA'
} as const;

/* Exact strings from grub-core/normal/menu_text.c print_message() (non-edit,
   CLI-enabled branch), and the '*' marker print_entry() draws before a
   highlighted title when there is more than one entry. */
export const STOCK_HELP = [
  'Use the ↑ and ↓ keys to select which entry is highlighted.',
  "Press enter to boot the selected OS, `e' to edit the commands before booting or `c' for a command-line."
] as const;

/* GRUB_UNICODE_* box-drawing codepoints from include/grub/unicode.h — the
   HEAVY box (menu_text.c draws GRUB_UNICODE_CORNER_* / HLINE / VLINE, not
   the light variants). */
export const BOX = {
  tl: '┏', tr: '┓', bl: '┗', br: '┛',
  h: '━', v: '┃'
} as const;

export type StockLine = { text: string; selected: boolean };
export type StockMenu = { top: string; lines: StockLine[]; bottom: string };

/** Lays out cfg.entries the way print_entries()/print_entry() do: a box one
 * char wider than the longest title (plus the leading '*'/' ' highlight
 * marker print_entry() draws whenever there is more than one entry), rows
 * padded so the right border lines up. */
export function stockMenuBox(entries: { title: string }[], selectedIndex: number): StockMenu {
  const marker = entries.length > 1;
  const innerWidth = Math.max(...entries.map((e) => e.title.length)) + (marker ? 1 : 0) + 1;
  const top = `${BOX.tl}${BOX.h.repeat(innerWidth + 2)}${BOX.tr}`;
  const bottom = `${BOX.bl}${BOX.h.repeat(innerWidth + 2)}${BOX.br}`;
  const lines = entries.map((e, i) => {
    const prefix = marker ? (i === selectedIndex ? '*' : ' ') : '';
    return { text: ` ${prefix}${e.title}`.padEnd(innerWidth + 2, ' '), selected: i === selectedIndex };
  });
  return { top, lines, bottom };
}
