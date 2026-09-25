/* VLC 3.x Qt interface: toolbar layout (vlc/vlc-qt-interface.ini, hand-kept)
 * and the Qt-only settings vlcrc pins (tokens/out/vlcrc.ini, generated).
 *
 * VLC has no colour-theme file of its own: its Qt5 window already reads the
 * SageInk KDE palette through plasma-integration-qt5 (vlc/README.md), so the
 * window chrome model here is literally the KDE colour model from
 * ../kde-colors/model -- not a re-parse, the same parsed KdeModel instances,
 * imported read-only per the brief ("import ours/stock from ../kde-colors/model
 * for window colours"). What VLC paints for itself, and what this file
 * decodes, is the toolbar layout strings and the three vlcrc keys the
 * Sage Ink layer touches (qt-dark-palette, qt-fs-opacity, qt-slider-colours).
 *
 * Toolbar string grammar (modules/gui/qt/components/controller.cpp
 * parseAndCreate/createAndAddWidget, VLC 3.0.x branch commit 04d8fcb9):
 * semicolon-separated tokens, each "<buttonType_e>" or "<buttonType_e>-<option
 * bitmask>". option bit 0x4 is WIDGET_SHINY (the "shiny" seek/volume paint),
 * 0x2 is WIDGET_BIG, 0x1 is WIDGET_FLAT. buttonType_e (controller.hpp, same
 * commit) enumerates plain buttons 0..25 (BUTTON_MAX=26), special widgets
 * 0x20..0x2c (32..44, SPECIAL_MAX=45: seek slider=33, volume=35, menu=37,
 * teletext=38, advanced controller=39, time elapsed/remaining=43/44), and two
 * spacer pseudo-widgets 0x40/0x41 (64 fixed gap, 65 expanding). */
import ourToolbarText from '../../../../../vlc/vlc-qt-interface.ini?raw';
import ourVlcrcText from '../../../../../tokens/out/vlcrc.ini?raw';
import stockToolbarText from '../../../../fixtures/stock/vlc/vlc-qt-interface.conf?raw';
import stockVlcrcText from '../../../../fixtures/stock/vlc/vlcrc?raw';
import { parseIni, type IniDoc } from '../ini';
import { ours as kdeOurs, stock as kdeStock, laneVars as kdeLaneVars, type KdeModel } from '../kde-colors/model';

export type ToolbarKind = 'button' | 'special' | 'spacer' | 'spacer-extend';
export type ToolbarItem = { id: number; option: number; kind: ToolbarKind; label: string; shiny: boolean; big: boolean; flat: boolean };

const BUTTON_MAX = 26;
const SPACER = 64;
const SPACER_EXTEND = 65;
const WIDGET_FLAT = 0x1;
const WIDGET_BIG = 0x2;
const WIDGET_SHINY = 0x4;

/* nameL[] in controller.hpp, index = buttonType_e. Only the entries that can
   appear in MainToolbar1/2, AdvToolbar, InputToolbar, FSCtoolbar are named;
   an id this repo's strings never use still gets a readable fallback. */
const BUTTON_NAMES: Record<number, string> = {
  0: 'Play', 1: 'Stop', 2: 'Open', 3: 'Previous / Backward', 4: 'Next / Forward',
  5: 'Slower', 6: 'Faster', 7: 'Fullscreen', 8: 'De-Fullscreen', 9: 'Extended panel',
  10: 'Playlist', 11: 'Snapshot', 12: 'Record', 13: 'A→B Loop', 14: 'Frame by frame',
  15: 'Trickplay reverse', 16: 'Step backward', 17: 'Step forward', 18: 'Quit',
  19: 'Random', 20: 'Loop / Repeat', 21: 'Information', 22: 'Previous', 23: 'Next',
  24: 'Open subtitles', 25: 'Dock fullscreen controller'
};
const SPECIAL_NAMES: Record<number, string> = {
  32: 'Splitter', 33: 'Seek slider', 34: 'Time label', 35: 'Volume', 36: 'Volume (special)',
  37: 'Menu button', 38: 'Teletext buttons', 39: 'Advanced controller', 40: 'Playback buttons',
  41: 'Aspect ratio', 42: 'Speed label', 43: 'Time elapsed', 44: 'Time remaining'
};

/* "0-2;64;3;1;4;64;7;9;64;10;20;19;64-4;37;65;35-4" -> ToolbarItem[]. Quotes
   (QSettings INI quotes a value containing ';') are stripped first. */
export function parseToolbar(spec: string | undefined): ToolbarItem[] {
  const clean = (spec ?? '').trim().replace(/^"|"$/g, '');
  if (!clean) return [];
  return clean.split(';').filter(Boolean).map((tok) => {
    const [idStr, optStr] = tok.split('-');
    const id = Number(idStr);
    const option = optStr !== undefined ? Number(optStr) : 0;
    const flags = { shiny: (option & WIDGET_SHINY) !== 0, big: (option & WIDGET_BIG) !== 0, flat: (option & WIDGET_FLAT) !== 0 };
    if (id === SPACER) return { id, option, kind: 'spacer' as const, label: 'Spacer', ...flags };
    if (id === SPACER_EXTEND) return { id, option, kind: 'spacer-extend' as const, label: 'Spacer (expanding)', ...flags };
    if (id < BUTTON_MAX) return { id, option, kind: 'button' as const, label: BUTTON_NAMES[id] ?? `Button ${id}`, ...flags };
    return { id, option, kind: 'special' as const, label: SPECIAL_NAMES[id] ?? `Special ${id}`, ...flags };
  });
}

/* QColor(50,156,255) hardcoded in SeekSlider's ctor, input_slider.cpp
   (VLC 3.0.x branch, commit d21e5980) -- not a setting, so it cannot come
   from a token; it is what the stock lane must show and the ours lane must
   never paint. */
export const SEEK_SHINY_BLUE = '#329CFF';

export type VlcModel = {
  toolbar: IniDoc;
  vlcrc: IniDoc;
  kde: KdeModel;
  mainToolbar1: ToolbarItem[];
  mainToolbar2: ToolbarItem[];
  advToolbar: ToolbarItem[];
  inputToolbar: ToolbarItem[];
  fscToolbar: ToolbarItem[];
  fscToolbarAlt: ToolbarItem[];
  darkPalette: boolean;
  fsOpacity: number;
  sliderStops: [number, number, number][];
  sliderHex: string;
};

const unquote = (v: string | undefined) => (v ?? '').trim().replace(/^"|"$/g, '');
const rgbHex = ([r, g, b]: [number, number, number]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

function model(toolbarText: string, vlcrcText: string, kde: KdeModel): VlcModel {
  const toolbar = parseIni(toolbarText);
  const vlcrc = parseIni(vlcrcText);
  const mainToolbar1 = parseToolbar(toolbar.get('MainWindow', 'MainToolbar1'));
  const mainToolbar2 = parseToolbar(toolbar.get('MainWindow', 'MainToolbar2'));
  const advToolbar = parseToolbar(toolbar.get('MainWindow', 'AdvToolbar'));
  const inputToolbar = parseToolbar(toolbar.get('MainWindow', 'InputToolbar'));
  const fscToolbar = parseToolbar(toolbar.get('MainWindow', 'FSCtoolbar'));
  const fscToolbarAlt = parseToolbar(toolbar.get('MainWindow', 'FSCToolbar'));
  const darkPalette = unquote(vlcrc.get('qt', 'qt-dark-palette')) === '1';
  const fsOpacity = Number(vlcrc.get('qt', 'qt-fs-opacity') ?? 0.8);
  const stopsRaw = unquote(vlcrc.get('qt', 'qt-slider-colours')).split(';').map(Number);
  const sliderStops: [number, number, number][] = [0, 3, 6, 9].map(
    (i) => [stopsRaw[i] ?? 0, stopsRaw[i + 1] ?? 0, stopsRaw[i + 2] ?? 0]
  );
  return { toolbar, vlcrc, kde, mainToolbar1, mainToolbar2, advToolbar, inputToolbar, fscToolbar, fscToolbarAlt, darkPalette, fsOpacity, sliderStops, sliderHex: rgbHex(sliderStops[0]) };
}

export const stock = model(stockToolbarText, stockVlcrcText, kdeStock);
export const ours = model(ourToolbarText, ourVlcrcText, kdeOurs);

export const findItem = (items: ToolbarItem[], id: number) => items.find((it) => it.id === id);

/* Reuse the KDE window-chrome vars (k-*) for the VLC specimens; add the
   slider fill / groove and the shiny stock gradient stops the KDE model has
   no concept of. */
export function laneVars(m: VlcModel): string {
  const groove = m.kde.c('Window', 'BackgroundNormal') === 'transparent' ? '#000000' : m.kde.c('Window', 'BackgroundNormal');
  const stops = m.sliderStops.map(rgbHex);
  return `${kdeLaneVars(m.kde)};--vlc-slider-fill:${m.sliderHex};--vlc-groove:${groove};--vlc-stop-0:${stops[0]};--vlc-stop-1:${stops[1]};--vlc-stop-2:${stops[2]};--vlc-stop-3:${stops[3]};--vlc-fs-opacity:${m.fsOpacity}`;
}
