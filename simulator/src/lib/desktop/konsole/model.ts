/* Konsole colour scheme + profile, parsed into lane variables.
 *
 * Stock: Konsole's built-in Breeze.colorscheme (compiled into the binary as
 * a Qt resource — fetched from upstream, see fixtures/stock/konsole/) and
 * the compiled-in fallback profile's defaults (Profile::DefaultProperties,
 * reconstructed the same way). Ours: share/konsole/SageInk.colorscheme and
 * SageInk.profile, imported raw — hand-kept files install.sh copies;
 * codegen.py never touches share/konsole/ (see CLAUDE.md "Never hand-edit"
 * and tokens/codegen.py, which has no Konsole target at all).
 */
import sageColorsText from '../../../../../share/konsole/SageInk.colorscheme?raw';
import sageProfileText from '../../../../../share/konsole/SageInk.profile?raw';
import breezeColorsText from '../../../../fixtures/stock/konsole/Breeze.colorscheme?raw';
import builtInProfileText from '../../../../fixtures/stock/konsole/BuiltIn.profile?raw';
import { parseIni, kdeColor, type IniDoc } from '../ini';
import { cssVars } from '../surface';
import { TOKENS } from '../tokens';
import { stock as kdeStock } from '../kde-colors/model';
import { ANSI_SLOTS, checkAnsi, type AnsiCheck, type AnsiSlot } from './ansi';
import type { KeyVars } from '../coverage';

/* Color0..Color7 -> the ANSI slot name Konsole's own convention gives them
 * (docs/konsole "extended colors"; ls, git, and every terminal app agree on
 * this order). ColorNIntense is the bold/bright counterpart. */
export const SLOT_INDEX: Record<AnsiSlot, number> = {
  black: 0, red: 1, green: 2, yellow: 3, blue: 4, magenta: 5, cyan: 6, white: 7,
  bright_black: 0, bright_red: 1, bright_green: 2, bright_yellow: 3, bright_blue: 4, bright_magenta: 5, bright_cyan: 6, bright_white: 7
};
export const NORMAL_SLOTS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const;
export type NormalSlot = (typeof NORMAL_SLOTS)[number];

/* Konsole enum values (src/Enumeration.h, invent.kde.org/utilities/konsole). */
export const CURSOR_SHAPES = ['block', 'ibeam', 'underline'] as const;
export const SCROLLBAR_POSITIONS = ['left', 'right', 'hidden'] as const;
export const HISTORY_MODES = ['none', 'fixed', 'unlimited'] as const;

export type KonsoleModel = {
  colors: IniDoc;
  profile: IniDoc;
  ansi: Record<AnsiSlot, string>;
  faint: Record<NormalSlot, string>;
  background: string;
  backgroundFaint: string;
  backgroundIntense: string;
  foreground: string;
  foregroundFaint: string;
  foregroundIntense: string;
  fontFamily: string;
  fontPt: number;
  lineSpacing: number;
  cursorShape: (typeof CURSOR_SHAPES)[number];
  cursorColor: string;
  cursorTextColor: string;
  useCustomCursorColor: boolean;
  scrollBarPosition: (typeof SCROLLBAR_POSITIONS)[number];
  historyMode: (typeof HISTORY_MODES)[number];
  historySize: string;
  colorSchemeName: string;
};

function enumOf<T extends readonly string[]>(names: T, v: string | undefined, fallback: number): T[number] {
  const i = Number(v ?? fallback);
  return names[i] ?? names[fallback];
}

function model(colorsText: string, profileText: string): KonsoleModel {
  const colors = parseIni(colorsText);
  const profile = parseIni(profileText);
  const c = (slot: string) => kdeColor(colors.get(slot, 'Color'));
  const ansi = Object.fromEntries(ANSI_SLOTS.map((s) => [s, c(s.startsWith('bright_') ? `Color${SLOT_INDEX[s]}Intense` : `Color${SLOT_INDEX[s]}`)])) as Record<AnsiSlot, string>;
  const faint = Object.fromEntries(NORMAL_SLOTS.map((s) => [s, c(`Color${SLOT_INDEX[s]}Faint`)])) as Record<NormalSlot, string>;

  /* Font is APPEARANCE_GROUP/Font, KDE's serialised-QFont CSV: family, pt,
   * pixelSize, styleHint, weight, style, underline, strikeOut, fixedPitch,
   * rawMode[, capitalization, letterSpacingType, letterSpacing, wordSpacing].
   * The stock fixture carries no Font= key at all (the real default is a
   * runtime QFontDatabase::systemFont(FixedFont) call, not a literal font
   * string) — fall back to the KDE "fixed" font role read from the
   * kde-colors surface's own stock kdeglobals fixture, since that IS what
   * systemFont(FixedFont) resolves to on this desktop. */
  const fontRaw = profile.get('Appearance', 'Font');
  const fontFamily = fontRaw ? fontRaw.split(',')[0] : kdeStock.fonts.fixed.family;
  const fontPt = fontRaw ? Number(fontRaw.split(',')[1]) : kdeStock.fonts.fixed.pt;

  return {
    colors,
    profile,
    ansi,
    faint,
    background: c('Background'),
    backgroundFaint: c('BackgroundFaint'),
    backgroundIntense: c('BackgroundIntense'),
    foreground: c('Foreground'),
    foregroundFaint: c('ForegroundFaint'),
    foregroundIntense: c('ForegroundIntense'),
    fontFamily,
    fontPt,
    lineSpacing: Number(profile.get('Appearance', 'LineSpacing') ?? 0),
    cursorShape: enumOf(CURSOR_SHAPES, profile.get('Cursor Options', 'CursorShape'), 0),
    cursorColor: kdeColor(profile.get('Cursor Options', 'CustomCursorColor')),
    cursorTextColor: kdeColor(profile.get('Cursor Options', 'CustomCursorTextColor')),
    useCustomCursorColor: (profile.get('Cursor Options', 'UseCustomCursorColor') ?? 'false') === 'true',
    scrollBarPosition: enumOf(SCROLLBAR_POSITIONS, profile.get('Scrolling', 'ScrollBarPosition'), 1),
    historyMode: enumOf(HISTORY_MODES, profile.get('Scrolling', 'HistoryMode'), 1),
    historySize: profile.get('Scrolling', 'HistorySize') ?? '',
    colorSchemeName: colors.get('General', 'Description') ?? ''
  };
}

export const stock = model(breezeColorsText, builtInProfileText);
export const ours = model(sageColorsText, sageProfileText);

/* The equality check Role/token can't express — see ansi.ts header. Computed
 * only for the Sage Ink lane: the stock lane is Breeze, which was never
 * meant to equal these tokens. */
export const ansiChecks: AnsiCheck[] = checkAnsi(
  TOKENS.variants.sage.ansi as Record<AnsiSlot, [number, number, number]>,
  ours.ansi
);

/* Coverage map: every colourscheme/profile key the shipped files carry, to
 * the CSS variable a specimen must reference for it to count as rendered. */
export const KEY_VARS: KeyVars = {};
const bind = (key: string, ...vars: string[]) => { (KEY_VARS[key] ??= []).push(...vars); };
bind('Background/Color', 'ks-bg');
bind('BackgroundFaint/Color', 'ks-bg-faint');
bind('BackgroundIntense/Color', 'ks-bg-intense');
bind('Foreground/Color', 'ks-fg');
bind('ForegroundFaint/Color', 'ks-fg-faint');
bind('ForegroundIntense/Color', 'ks-fg-intense');
for (const s of NORMAL_SLOTS) {
  bind(`Color${SLOT_INDEX[s]}/Color`, `ks-ansi-${s}`);
  bind(`Color${SLOT_INDEX[s]}Faint/Color`, `ks-ansi-${s}-faint`);
  bind(`Color${SLOT_INDEX[s]}Intense/Color`, `ks-ansi-${s}-intense`);
}
/* General/Description, Opacity, Wallpaper are shown in the settings table via doc.get (touched there). */

export function laneVars(m: KonsoleModel): string {
  const v: Record<string, string | number> = {
    'ks-bg': m.background, 'ks-bg-faint': m.backgroundFaint, 'ks-bg-intense': m.backgroundIntense,
    'ks-fg': m.foreground, 'ks-fg-faint': m.foregroundFaint, 'ks-fg-intense': m.foregroundIntense,
    'ks-cursor': m.cursorColor, 'ks-cursor-text': m.cursorTextColor,
    'ks-font': `"${m.fontFamily}", monospace`,
    'ks-line-spacing': `${m.lineSpacing}px`,
    'desk-bg': m.background,
    'desk-font': `"${m.fontFamily}", monospace`
  };
  for (const s of NORMAL_SLOTS) {
    v[`ks-ansi-${s}`] = m.ansi[s];
    v[`ks-ansi-${s}-faint`] = m.faint[s];
    v[`ks-ansi-${s}-intense`] = m.ansi[`bright_${s}` as AnsiSlot];
  }
  return cssVars(v);
}
