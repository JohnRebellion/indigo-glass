/* Klassy widget style vs stock Breeze.
 *
 * Unlike kde-colors, the "file" that differs between lanes is not a colour
 * file but three C++ patches applied to kstyle/breezestyle.cpp,
 * breezehelper.cpp and breezeshadowhelper.cpp (config/klassy/*.patch). The
 * colours both lanes paint with are read from ../kde-colors/model (read-only,
 * per the brief): `stock` there is BreezeDark.colors + Plasma defaults
 * (widgetStyle=Breeze), `ours` is SageInk.colors + kdeglobals.snippet
 * (widgetStyle=Klassy) — exactly the widget-style split this page needs.
 *
 * Geometry (outline widths, colours, shadow offsets) is read directly out of
 * the patch hunks' context lines below, not guessed: the "-" lines are stock
 * Breeze's own source, the "+" lines are what Klassy ships. Where a patch
 * does not touch a control (buttons, checkboxes, tabs, scrollbars, sliders,
 * progress bars, group boxes), both lanes use the same Breeze metric and
 * differ only by palette.
 */
import klassyrcRaw from '../../../../../config/klassy/klassyrc?raw';
import { stock as kdeStock, ours as kdeOurs, laneVars, editSelectionText, type KdeModel } from '../kde-colors/model';
import { parseIni } from '../ini';
import { iniCoverage } from '../coverage';
import type { KeyVars } from '../coverage';
import type { Coverage } from '../surface';

export const stock: KdeModel = kdeStock;
export const ours: KdeModel = kdeOurs;
export const stockVars = laneVars(stock);
export const oursVars = laneVars(ours);
export { editSelectionText };
export type { KdeModel };

/* klassyrc: only [Style] is a widget-style key (MenuOpacity, read by
 * drawPanelMenuPrimitive/drawPanelTipLabelPrimitive to decide the <100%
 * alpha branch the menu-tooltip-ink patch bypasses when it's 100). Every
 * other group (ButtonBehaviour, ButtonColors, ButtonSize, ButtonSizing,
 * Windeco, ShadowStyle, TitleBarOpacity, TitleBarSpacing, Exceptions) is
 * window-decoration configuration, rendered on /desktop/klassy-decoration/
 * instead — ignored here with that reason, not silently dropped. [Global] is
 * metadata (which upstream theme Klassy started from, the version that last
 * touched this file), shown in the settings table but not a paint input. */
export const klassyrc = parseIni(klassyrcRaw);

export const KEY_VARS: KeyVars = {};
const DECORATION_GROUPS = [
  'ButtonBehaviour', 'ButtonColors', 'ButtonSize', 'ButtonSizing', 'Windeco', 'ShadowStyle', 'TitleBarOpacity', 'TitleBarSpacing', 'Exceptions'
];
export const KLASSYRC_IGNORE = [
  ...DECORATION_GROUPS.map((g) => ({ token: `${g}/*`, why: 'window-decoration setting, not widget style — rendered on /desktop/klassy-decoration/' })),
  { token: 'Global/LookAndFeelSet', why: 'metadata (starting Look-and-Feel package), shown in the settings table' },
  { token: 'Global/RefreshedConfig', why: 'metadata (last Klassy version that rewrote this file), shown in the settings table' }
];

export function styleCoverage(): Coverage {
  return iniCoverage([{ label: 'klassyrc', doc: klassyrc }], KEY_VARS, KLASSYRC_IGNORE);
}

/* Patched hunks, enumerated from config/klassy/*.patch. Each is "covered"
 * when the specimen that demonstrates it renders — tracked the same way
 * doc.get() tracks an INI key, but there is no file reader for a diff hunk,
 * so Page.svelte calls `markHunk` directly for every hunk its specimens
 * actually show. */
export const HUNKS = [
  {
    id: 'tierc.itemViewPalette',
    label: 'tierc-outline.patch: Style::polish() remaps QAbstractItemView HighlightedText to Text (row label stays legible once the fill is gone)'
  },
  {
    id: 'tierc.focusRectColor',
    label: 'tierc-outline.patch: Style::drawFrameFocusRectPrimitive outline fixed to Qt::white, not HighlightColor.lighter()'
  },
  {
    id: 'tierc.itemFillOutline',
    label: 'tierc-outline.patch: Style::drawPanelItemViewItemPrimitive — selected row unfilled + white outline; hover+selected no longer over-lightens'
  },
  {
    id: 'tierc.menuItemOutline',
    label: 'tierc-outline.patch: Style::drawMenuItemControl — selected/sunken menu item unfilled + white outline, not an accent fill'
  },
  {
    id: 'tierc.focusRectWidth',
    label: "tierc-outline.patch: Helper::renderFocusRect pen width 2px, was Qt's cosmetic ~1px"
  },
  {
    id: 'menu.frameOutline',
    label: 'menu-tooltip-ink.patch: Style::drawPanelMenuPrimitive frame outline (fixed here to border_strong, sharp corners not hasAlpha-rounded)'
  },
  {
    id: 'menu.tooltipOutline',
    label: 'menu-tooltip-ink.patch: Style::drawPanelTipLabelPrimitive frame outline (fixed here to border_strong, sharp corners)'
  },
  {
    id: 'menu.frameWidth',
    label: "menu-tooltip-ink.patch: Helper::renderMenuFrame pen width 2px, was Qt's cosmetic ~1px"
  },
  {
    id: 'menu.shadowParams',
    label: 'menu-tooltip-ink.patch: s_shadowParams[Small] in breezeshadowhelper.cpp — hard 4,4 offset for QMenu/QComboBox/QTipLabel popups'
  },
  {
    id: 'menu.shadowTiles',
    label: 'menu-tooltip-ink.patch: ShadowHelper::shadowTiles — solid displaced block, antialiasing off, no blur'
  },
  {
    id: 'selection.editText',
    label: 'selection-text.patch: Style::polish() picks whichever of Text/Base contrasts more with Highlight for QLineEdit/QTextEdit/QPlainTextEdit'
  }
] as const;
export type HunkId = (typeof HUNKS)[number]['id'];
const renderedHunks = new Set<HunkId>();
export const markHunk = (id: HunkId) => renderedHunks.add(id);
export function hunkCoverage(): Coverage {
  const missing = HUNKS.filter((h) => !renderedHunks.has(h.id)).map((h) => h.label);
  return { total: HUNKS.length, missing, ignored: [] };
}

export function coverage(): Coverage {
  const ini = styleCoverage();
  const hunks = hunkCoverage();
  return {
    total: ini.total + hunks.total,
    missing: [...ini.missing, ...hunks.missing],
    ignored: [...(ini.ignored ?? []), ...(hunks.ignored ?? [])]
  };
}
