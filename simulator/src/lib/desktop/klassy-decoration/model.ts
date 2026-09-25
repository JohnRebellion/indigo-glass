/* Klassy window decoration vs stock Breeze decoration defaults.
 *
 * Title bar colours: ../kde-colors/model (read-only), same stock/ours split
 * as every other layer. Everything else — button shape/size, titlebar
 * margins/alignment, outline, shadow — is decoration configuration read
 * straight out of config/klassy/klassyrc's decoration groups, re-asserted in
 * part by the generated tokens/out/klassy-radius.ini (install.sh applies it
 * on top — "Patching klassyrc corner radius" — so both are shipped files).
 *
 * Stock Breeze's own compiled defaults for the keys Breeze actually has come
 * from kdecoration/breezesettingsdata.kcfg, plasma/breeze master branch,
 * fetched from invent.kde.org 2026-09-25 (commit at fetch time; see
 * BREEZE_KCFG_SOURCE below). Many klassyrc keys are Klassy-only extensions
 * with no Breeze equivalent at all — marked "n/a" in the settings table, not
 * guessed.
 */
import klassyrcRaw from '../../../../../config/klassy/klassyrc?raw';
import radiusRaw from '../../../../../tokens/out/klassy-radius.ini?raw';
import { stock as kdeStock, ours as kdeOurs, laneVars, type KdeModel } from '../kde-colors/model';
import { parseIni, type IniDoc } from '../ini';
import { iniCoverage } from '../coverage';
import type { KeyVars } from '../coverage';
import type { Coverage } from '../surface';

export const stock: KdeModel = kdeStock;
export const ours: KdeModel = kdeOurs;
export const stockVars = laneVars(stock);
export const oursVars = laneVars(ours);
export type { KdeModel };

export const BREEZE_KCFG_SOURCE =
  'plasma/breeze master, kdecoration/breezesettingsdata.kcfg (https://invent.kde.org/plasma/breeze/-/raw/master/kdecoration/breezesettingsdata.kcfg), fetched 2026-09-25';

export const klassyrc: IniDoc = parseIni(klassyrcRaw);
export const radiusDoc: IniDoc = parseIni(radiusRaw);

export const KEY_VARS: KeyVars = {};
export const KLASSYRC_IGNORE = [
  { token: 'Style/*', why: 'widget-style setting, not decoration — rendered on /desktop/klassy-style/' },
  { token: 'Global/*', why: 'metadata, rendered on /desktop/klassy-style/ settings table' }
];

/* Every decoration key klassyrc ships, with Breeze's own compiled default
 * where one exists (breezesettingsdata.kcfg has BorderSize, TitleAlignment,
 * ButtonSize, DrawBorderOnMaximizedWindows, ShadowSize/Strength/Color,
 * OutlineCloseButton/OutlineEnabled/RoundedCorners — nothing else). Every
 * row is read via klassyrc.get() in the settings table below, so it counts
 * as covered the same way kde-colors' "scheme settings" table covers
 * non-colour keys. */
export const SETTINGS_ROWS: { group: string; key: string; breeze: string; note?: string }[] = [
  { group: 'ButtonBehaviour', key: 'ShowBackgroundNormallyActive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowBackgroundNormallyInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowCloseBackgroundNormallyActive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowCloseBackgroundNormallyInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowCloseIconNormallyActive', breeze: 'n/a — Klassy-only', note: 'icons hidden by default — the button reads as a plain accent tile, not a glyph' },
  { group: 'ButtonBehaviour', key: 'ShowCloseIconNormallyInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowCloseOutlineNormallyActive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowCloseOutlineNormallyInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowIconNormallyActive', breeze: 'n/a — Klassy-only', note: 'icons hidden by default for every button, not just Close' },
  { group: 'ButtonBehaviour', key: 'ShowIconNormallyInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowOutlineNormallyActive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'ShowOutlineNormallyInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'UnisonHovering', breeze: 'n/a — Klassy-only', note: 'hovering one button dims/highlights the whole group together' },
  { group: 'ButtonBehaviour', key: 'VaryColorCloseBackgroundActive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'VaryColorCloseBackgroundInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'VaryColorCloseOutlineActive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonBehaviour', key: 'VaryColorCloseOutlineInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'ButtonBackgroundColorsActive', breeze: 'n/a — Klassy-only', note: '"Accent" resolves to the accent token — see role table' },
  { group: 'ButtonColors', key: 'ButtonBackgroundColorsInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'ButtonBackgroundOpacityActive', breeze: 'n/a — Klassy-only', note: '100 = opaque; ink requires this' },
  { group: 'ButtonColors', key: 'ButtonBackgroundOpacityInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'CloseButtonIconColorActive', breeze: 'n/a — Klassy-only', note: 'moot while icons are hidden (ShowIconNormallyActive=false)' },
  { group: 'ButtonColors', key: 'CloseButtonIconColorInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'LockButtonColorsActiveInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'OnPoorIconContrastActive', breeze: 'n/a — Klassy-only', note: 'fallback path not exercised — icons hidden by default' },
  { group: 'ButtonColors', key: 'OnPoorIconContrastInactive', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsActiveApplicationMenu', breeze: 'n/a — Klassy-only', note: 'named-colour JSON — see the button-set specimen' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsInactiveApplicationMenu', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsActiveClose', breeze: 'n/a — Klassy-only', note: 'named-colour JSON — see the button-set specimen' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsInactiveClose', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsActiveMaximize', breeze: 'n/a — Klassy-only', note: 'named-colour JSON — see the button-set specimen' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsInactiveMaximize', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsActiveMinimize', breeze: 'n/a — Klassy-only', note: 'named-colour JSON — see the button-set specimen' },
  { group: 'ButtonColors', key: 'ButtonOverrideColorsInactiveMinimize', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonSize', key: 'ButtonSize', breeze: 'ButtonDefault' },
  { group: 'ButtonSizing', key: 'ButtonCustomCornerRadius', breeze: 'n/a — Klassy-only', note: 'moot: ButtonShape=ShapeSmallCircle ignores a corner radius' },
  { group: 'ButtonSizing', key: 'ButtonSpacingLeft', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonSizing', key: 'ButtonSpacingRight', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonSizing', key: 'FullHeightButtonSpacingRight', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonSizing', key: 'IntegratedRoundedRectangleBottomPadding', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonSizing', key: 'LockButtonSpacingLeftRight', breeze: 'n/a — Klassy-only' },
  { group: 'ButtonSizing', key: 'LockFullHeightButtonSpacingLeftRight', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'BoldButtonIcons', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'BoldTitle', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'ButtonIconStyle', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'ButtonShape', breeze: 'n/a — Klassy-only', note: 'circular buttons — see the button-set specimen' },
  { group: 'Windeco', key: 'ColorizeWindowOutlineWithButton', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'DrawTitleBarSeparator', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'IconSize', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'MatchTitleBarToApplicationColor', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'SystemIconSize', breeze: 'n/a — Klassy-only' },
  { group: 'Windeco', key: 'TitleAlignment', breeze: 'AlignCenterFullWidth' },
  { group: 'Windeco', key: 'WindowCornerRadius', breeze: 'n/a — Breeze bakes a fixed small radius in code, no runtime key; re-asserted by tokens/out/klassy-radius.ini' },
  { group: 'Windeco', key: 'useTitleBarColorForAllBorders', breeze: 'n/a — Klassy-only', note: 'avoids an undefined KDecoration3 Frame role showing as a stray border' },
  { group: 'ShadowStyle', key: 'ShadowSize', breeze: 'ShadowLarge', note: 'unsuffixed key is inert — Klassy reads only the $(Active)/$(Inactive) keys below' },
  { group: 'ShadowStyle', key: 'ShadowStrength', breeze: '255', note: 'unsuffixed key is inert, same as ShadowSize' },
  { group: 'ShadowStyle', key: 'ShadowColor', breeze: '0, 0, 0', note: 'unsuffixed key is inert, same as ShadowSize' },
  { group: 'ShadowStyle', key: 'ShadowColorActive', breeze: 'n/a — Klassy-only key name (Breeze default: 0, 0, 0)' },
  { group: 'ShadowStyle', key: 'ShadowColorInactive', breeze: 'n/a — Klassy-only key name (Breeze default: 0, 0, 0)' },
  { group: 'ShadowStyle', key: 'ShadowSizeActive', breeze: 'n/a — Klassy-only key name (Breeze default: ShadowLarge)' },
  { group: 'ShadowStyle', key: 'ShadowSizeInactive', breeze: 'n/a — Klassy-only key name (Breeze default: ShadowLarge)' },
  { group: 'ShadowStyle', key: 'ShadowStrengthActive', breeze: 'n/a — Klassy-only key name (Breeze default: 255)' },
  { group: 'ShadowStyle', key: 'ShadowStrengthInactive', breeze: 'n/a — Klassy-only key name (Breeze default: 255)' },
  { group: 'TitleBarOpacity', key: 'ActiveTitleBarOpacity', breeze: 'n/a — Klassy-only', note: 'must be 100 — ink is opaque; was found at 30 live 2026-08-28 (see klassyrc comment)' },
  { group: 'TitleBarOpacity', key: 'InactiveTitleBarOpacity', breeze: 'n/a — Klassy-only', note: 'must be 100, same history' },
  { group: 'TitleBarOpacity', key: 'OpaqueMaximizedTitleBars', breeze: 'n/a — Klassy-only' },
  { group: 'TitleBarSpacing', key: 'PercentMaximizedTopBottomMargins', breeze: 'n/a — Klassy-only' },
  { group: 'TitleBarSpacing', key: 'TitleBarLeftMargin', breeze: 'n/a — Klassy-only' },
  { group: 'TitleBarSpacing', key: 'TitleBarRightMargin', breeze: 'n/a — Klassy-only' },
  { group: 'Exceptions', key: 'OpaqueTitleBar', breeze: 'false', note: 'must be true here so ActiveTitleBarOpacity/InactiveTitleBarOpacity above apply as alpha at all' }
];

/* Per-app title bar / border-size / button overrides (ContextHelp, KeepAbove,
 * KeepBelow, Menu, OnAllDesktops, Shade, and the lock-state key ordering
 * arrays) are real klassyrc keys this page does not give their own specimen:
 * ButtonsOnLeft=XIA / ButtonsOnRight=M (kwinrc.snippets) only ever shows
 * Close/Minimize/Maximize/ApplicationMenu by default, so those four are
 * demonstrated and the rest are per-app exceptions. */
export const IGNORED_OVERRIDES = [
  'ContextHelp', 'KeepAbove', 'KeepBelow', 'Menu', 'OnAllDesktops', 'Shade'
];
export const OVERRIDE_IGNORE = IGNORED_OVERRIDES.flatMap((t) => [
  { token: `ButtonColors/ButtonOverrideColorsActive${t}`, why: 'per-app/per-state button not on the default title bar (ButtonsOnLeft=XIA, ButtonsOnRight=M only show Close/Minimize/Maximize/ApplicationMenu)' },
  { token: `ButtonColors/ButtonOverrideColorsInactive${t}`, why: 'same — per-app exception, not shown by default' }
]).concat([
  { token: 'ButtonColors/ButtonOverrideColorsLockStatesActive', why: 'internal key-ordering array (which override keys the "lock" toggle applies to), not itself a colour' },
  { token: 'ButtonColors/ButtonOverrideColorsLockStatesInactive', why: 'internal key-ordering array, not itself a colour' }
]);

export function decorationCoverage(): Coverage {
  const a = iniCoverage([{ label: 'klassyrc', doc: klassyrc }], KEY_VARS, [...KLASSYRC_IGNORE, ...OVERRIDE_IGNORE]);
  const b = iniCoverage([{ label: 'klassy-radius.ini', doc: radiusDoc }], KEY_VARS, []);
  return {
    total: a.total + b.total,
    missing: [...a.missing, ...b.missing],
    ignored: [...(a.ignored ?? []), ...(b.ignored ?? [])]
  };
}

/* ink-shadow.patch hunks (kdecoration/breezedecoration.cpp) — same tracking
 * pattern as klassy-style/model.ts, since there is no file reader for a diff
 * hunk. */
export const HUNKS = [
  { id: 'decoration.shadowParams', label: 'ink-shadow.patch: s_shadowParams[Small] — hard QPoint(4,4) offset, radius 5, requires ShadowSizeActive=ShadowSmall' },
  { id: 'decoration.shadowObject', label: 'ink-shadow.patch: createShadowObject — solid displaced block, antialiasing off, no blur' }
] as const;
export type HunkId = (typeof HUNKS)[number]['id'];
const renderedHunks = new Set<HunkId>();
export const markHunk = (id: HunkId) => renderedHunks.add(id);
export function hunkCoverage(): Coverage {
  const missing = HUNKS.filter((h) => !renderedHunks.has(h.id)).map((h) => h.label);
  return { total: HUNKS.length, missing, ignored: [] };
}

export function coverage(): Coverage {
  const ini = decorationCoverage();
  const hunks = hunkCoverage();
  return {
    total: ini.total + hunks.total,
    missing: [...ini.missing, ...hunks.missing],
    ignored: [...(ini.ignored ?? []), ...(hunks.ignored ?? [])]
  };
}
