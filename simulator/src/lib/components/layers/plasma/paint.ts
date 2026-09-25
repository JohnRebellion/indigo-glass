/* The Plasma desktop theme's controls, as PlasmaComponents 3 paints them.
 *
 * Colours and frames come from the /desktop/plasma-theme/ lane models
 * (read-only): the lane's colors file through ImageSetPrivate::namedColor,
 * and its SVGs through KSvg's lookup (theme, then the "default" image set,
 * with the lane's selector). That model only carries the default-set files
 * its page draws, so the PC3 controls' own images — widgets/button,
 * lineedit, checkmarks, tabbar — come from fixtures/stock/plasma-pc3, the
 * same libplasma 6.7.4 default set. Neither SageInk nor breeze-dark ships
 * any of the four, so KSvg falls back to exactly these files in both lanes;
 * only the colors file behind them differs.
 *
 * Which image, prefix and colour set each control uses is read from the
 * installed PC3 QML (libplasma 6.7.4, /usr/lib64/qt6/qml/org/kde/plasma/):
 *   Button          RaisedButtonBackground: widgets/button "normal";
 *                   ButtonFocus: "focus"; colorSet Button (Button.qml:43-44)
 *   TextField       widgets/lineedit "base"; "focusframe" under visualFocus
 *                   when the file has it, else "focus"; colorSet View
 *                   (TextField.qml:66-72, 190-225)
 *   CheckIndicator  widgets/button "normal" + widgets/checkmarks "checkbox"
 *                   (CheckIndicator.qml:27-45); inherits the Window set
 *   TabBar          highlight widgets/tabbar "north-active-tab" (TabBar.qml:49)
 *   Menu            background widgets/background (Menu.qml:99); MenuItem
 *                   highlight widgets/viewitem "hover" for hovered AND
 *                   keyboard-highlighted items (MenuItem.qml:112-121)
 *   ScrollBar       widgets/scrollbar "background-vertical" / "slider"
 *   Highlight       (PlasmaExtras) widgets/viewitem "selected" when pressed
 *   ToolTipDialog   widgets/tooltip, colorSet Tooltip */
import { stock, ours, topPaint, type PtModel, type PlasmaSet } from '$lib/desktop/plasma-theme/model';
import { parseSvg, elementBox, partSvg, dataUri, paintsOf, type SvgDoc, type Box, type Paint } from '$lib/desktop/plasma-theme/svg';
import { frameGeometry, resolvePrefix, PARTS, ALL_BORDERS, type Borders, type FrameGeom, type PartName, type ElementSource } from '$lib/desktop/plasma-theme/frame';
import type { LaneName } from '../../layer';

const PC3_RAW = import.meta.glob('../../../../../fixtures/stock/plasma-pc3/default/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const PC3: Record<string, string> = Object.fromEntries(
  Object.entries(PC3_RAW).map(([p, t]) => [p.slice(p.indexOf('default/') + 8).replace(/\.svg$/, ''), t])
);

export const MODELS: Record<LaneName, PtModel> = { stock, ours };

type Doc = { where: string; doc: SvgDoc; inModel: boolean };
const parsed = new Map<string, SvgDoc>();

/* KSvg lookup: the lane model first (theme, then its default-set files),
   else the PC3 fixture — the default image set's copy, which is what KSvg
   ends at when neither theme ships the file. */
function load(m: PtModel, name: string): Doc | null {
  const f = m.svg(name);
  if (f) return { where: `${f.set}/${f.path}`, doc: f.doc, inModel: true };
  const text = PC3[name];
  if (text === undefined) return null;
  let doc = parsed.get(name);
  if (!doc) parsed.set(name, (doc = parseSvg(text)));
  return { where: `default/${name}`, doc, inModel: false };
}

const hexA = (p: Paint): string => {
  const hex = p.colour.toUpperCase();
  const a = Math.round(p.alpha * 255);
  return a < 255 && /^#[0-9A-F]{6}$/.test(hex) ? hex + a.toString(16).padStart(2, '0').toUpperCase() : hex;
};

/* Every paint of one element, colours resolved for the lane and set. */
export function paints(m: PtModel, name: string, id: string, set: PlasmaSet = 'Window'): Paint[] {
  const d = load(m, name);
  return d ? paintsOf(d.doc, id, (c) => m.named(set, c)) : [];
}

/* The topmost paint at >= min alpha — topPaint's rule, applied to the
   fixture files too. */
export function top(m: PtModel, name: string, id: string, set: PlasmaSet = 'Window', min = 0.5): string {
  const d = load(m, name);
  if (!d) return 'transparent';
  if (d.inModel) return topPaint(m, name, id, set, min);
  const p = paints(m, name, id, set).filter((x) => !x.gradient && x.alpha >= min);
  return p.length ? hexA(p[p.length - 1]) : 'transparent';
}

/* The first paint of a kind (the wash under a mark, say), alpha kept. */
export function firstOf(m: PtModel, name: string, id: string, kind: 'fill' | 'stroke', set: PlasmaSet = 'Window'): string {
  const p = paints(m, name, id, set).find((x) => x.kind === kind && !x.gradient);
  return p ? hexA(p) : 'transparent';
}
export function lastOf(m: PtModel, name: string, id: string, kind: 'fill' | 'stroke', set: PlasmaSet = 'Window'): string {
  const p = paints(m, name, id, set).filter((x) => x.kind === kind && !x.gradient);
  return p.length ? hexA(p[p.length - 1]) : 'transparent';
}

/* What a stack of frames shows at a point: the topmost layer that paints,
   else the one under it. A translucent top layer is returned as-is. */
export const over = (...layers: string[]) => layers.find((v) => v !== 'transparent') ?? 'transparent';

/* ---- frames ------------------------------------------------------------ */

export type Tile = { uri: string; box: Box };
export type PFrameData = { where: string; geom: FrameGeom; tiles: Partial<Record<PartName, Tile>> };

/* One FrameSvgItem: geometry from frame.ts, tiles cut with the lane's
   colours. Built on the parsed doc directly, so nothing is recorded in the
   /desktop/ page's coverage tracking. */
export function frame(m: PtModel, name: string, prefixes: string | string[], set: PlasmaSet = 'Window', borders: Borders = ALL_BORDERS): PFrameData | null {
  const d = load(m, name);
  if (!d) return null;
  const src: ElementSource = { has: (id) => d.doc.has(id), box: (id) => elementBox(d.doc, id) };
  const prefix = resolvePrefix(src, prefixes);
  const geom = frameGeometry(src, prefix, borders);
  const tiles: PFrameData['tiles'] = {};
  for (const p of PARTS) {
    if (!geom.present[p]) continue;
    const t = element(m, name, prefix + p, set);
    if (t) tiles[p] = t;
  }
  return { where: d.where, geom, tiles };
}

/* One KSvg::SvgItem element (a check mark), cut with the lane's colours. */
export function element(m: PtModel, name: string, id: string, set: PlasmaSet = 'Window'): Tile | null {
  const d = load(m, name);
  if (!d) return null;
  const part = partSvg(d.doc, id, (classes) => Object.fromEntries([...classes].map((c) => [c, m.named(set, c)])));
  return part ? { uri: dataUri(part.xml), box: part.box } : null;
}

export const hasElement = (m: PtModel, name: string, id: string) => !!load(m, name)?.doc.has(id);
export const whereOf = (m: PtModel, name: string) => load(m, name)?.where ?? `${name} (missing)`;

/* ---- the values each slot probes -------------------------------------- */

export type LaneFrames = ReturnType<typeof build>;

function build(m: PtModel) {
  const popup = frame(m, 'dialogs/background', '');
  const popupFill = top(m, 'dialogs/background', 'center');
  const menuFill = top(m, 'widgets/background', 'center');
  const lineFocus = hasElement(m, 'widgets/lineedit', 'focusframe-center') ? 'focusframe' : 'focus';
  const sb = load(m, 'widgets/scrollbar');
  const sbHint = sb ? elementBox(sb.doc, 'hint-scrollbar-size') : null;
  return {
    /* PC3 ScrollBar implicitWidth: hint-scrollbar-size (ScrollBar.qml:64). */
    scrollSize: Math.round(sbHint?.w ?? 8),
    frames: {
      popup,
      button: frame(m, 'widgets/button', 'normal', 'Button'),
      buttonFocus: frame(m, 'widgets/button', 'focus', 'Button'),
      menu: frame(m, 'widgets/background', ''),
      menuHover: frame(m, 'widgets/viewitem', 'hover'),
      tooltip: frame(m, 'widgets/tooltip', '', 'Tooltip'),
      line: frame(m, 'widgets/lineedit', 'base', 'View'),
      lineFocus: frame(m, 'widgets/lineedit', lineFocus, 'View'),
      selected: frame(m, 'widgets/viewitem', 'selected'),
      track: frame(m, 'widgets/scrollbar', 'background-vertical'),
      slider: frame(m, 'widgets/scrollbar', 'slider'),
      box: frame(m, 'widgets/button', 'normal'),
      check: element(m, 'widgets/checkmarks', 'checkbox'),
      tab: frame(m, 'widgets/tabbar', 'north-active-tab')
    },
    hex: {
      popupFill,
      buttonFill: top(m, 'widgets/button', 'normal-center', 'Button'),
      buttonEdge: top(m, 'widgets/button', 'normal-top', 'Button'),
      buttonFocus: top(m, 'widgets/button', 'focus-top', 'Button'),
      menuFill,
      menuEdge: top(m, 'widgets/background', 'top'),
      menuSelFill: over(top(m, 'widgets/viewitem', 'hover-center'), menuFill),
      menuSelEdge: top(m, 'widgets/viewitem', 'hover-top'),
      tipFill: top(m, 'widgets/tooltip', 'center', 'Tooltip'),
      tipEdge: top(m, 'widgets/tooltip', 'top', 'Tooltip'),
      lineFill: top(m, 'widgets/lineedit', 'base-center', 'View'),
      lineEdge: top(m, 'widgets/lineedit', 'base-top', 'View'),
      lineFocus: top(m, 'widgets/lineedit', `${lineFocus}-top`, 'View'),
      rowSelFill: over(top(m, 'widgets/viewitem', 'selected-center'), popupFill),
      rowSelEdge: top(m, 'widgets/viewitem', 'selected-top'),
      track: top(m, 'widgets/scrollbar', 'background-vertical-center'),
      thumb: top(m, 'widgets/scrollbar', 'slider-center'),
      boxFill: top(m, 'widgets/button', 'normal-center'),
      boxEdge: top(m, 'widgets/button', 'normal-top'),
      /* The checked box is the "checkbox" element over the unchecked box:
         its rect's fill is what reads as the checked fill. */
      checkedFill: over(firstOf(m, 'widgets/checkmarks', 'checkbox', 'fill'), top(m, 'widgets/button', 'normal-center')),
      mark: lastOf(m, 'widgets/checkmarks', 'checkbox', 'stroke'),
      tabFill: over(top(m, 'widgets/tabbar', 'north-active-tab-center'), popupFill),
      tabMarker: top(m, 'widgets/tabbar', 'north-active-tab-bottom')
    }
  };
}

const cache = new Map<LaneName, LaneFrames>();
/* Built on first use, in the browser: parsing needs DOMParser. */
export function laneFrames(lane: LaneName): LaneFrames {
  let v = cache.get(lane);
  if (!v) cache.set(lane, (v = build(MODELS[lane])));
  return v;
}
