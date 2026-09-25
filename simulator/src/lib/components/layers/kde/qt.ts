/* Qt widget paints, computed the way Breeze's kstyle computes them.
 *
 * Formulas are read out of the Klassy tree (a Breeze fork; kstyle/
 * breezehelper.cpp + breezestyle.cpp at ~/src/klassy 2b4b6fd) and the "-"
 * lines of config/klassy/*.patch, which are stock Breeze's own source:
 *   KColorUtils::mix(a, b, t)  sRGB interpolation (KF6 kguiaddons)
 *   frameIntensityBias()      KColorScheme::frameContrast(): [KDE] frameContrast
 *                             in the scheme (0.2 in Breeze; codegen derives
 *                             Sage Ink's so the frame blend is border_strong)
 *   frameBackgroundColor()    mix(Window, Base, Blend_Value 0.3)
 *   focusColor()/hoverColor() View DecorationFocus / DecorationHover
 * The palette mapping is KColorScheme::createApplicationPalette: Window/
 * WindowText = Colors:Window, Base/Text/PlaceholderText = Colors:View
 * (PlaceholderText is ForegroundInactive), Button/ButtonText = Colors:Button,
 * Highlight/HighlightedText = Colors:Selection, ToolTip* = Colors:Tooltip.
 *
 * The Klassy lane differs from Breeze only where a patch hunk says so
 * (`patched` below); everything else is the same formula on SageInk.colors.
 */
import type { KdeModel } from '$lib/desktop/kde-colors/model';

const ch = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('').toUpperCase();

export function mix(a: string, b: string, t: number): string {
  const [x, y] = [ch(a), ch(b)];
  return hex(x.map((v, i) => v + (y[i] - v) * t));
}
/* A translucent brush as Qt holds it: the colour at alpha a (0..1). */
export const alpha = (c: string, a: number) => c.slice(0, 7) + Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();

/* QColor::darker(factor): HSV value divided by factor/100. */
export function darker(c: string, factor: number): string {
  const [r, g, b] = ch(c).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const v = (max * 100) / factor;
  const C = v * s, X = C * (1 - Math.abs((h % 2) - 1)), m = v - C;
  const [rr, gg, bb] = h < 0 ? [C, 0, X] : h < 1 ? [C, X, 0] : h < 2 ? [X, C, 0] : h < 3 ? [0, C, X] : h < 4 ? [0, X, C] : h < 5 ? [X, 0, C] : [C, 0, X];
  return hex([rr + m, gg + m, bb + m].map((x) => x * 255));
}

/* Fixed colours the Klassy patches paint (config/klassy/*.patch "+" lines). */
export const PATCH = {
  /* menu-tooltip-ink.patch: QColor(94, 94, 96), border_strong */
  menuOutline: '#5E5E60',
  /* tierc-outline.patch: Qt::white for the Tier C ring */
  ring: '#FFFFFF'
};

export type QtPaint = Record<string, string | number>;

export function qtPaint(m: KdeModel): QtPaint {
  const patched = m.style === 'Klassy';
  const W = m.c('Window', 'BackgroundNormal'), WT = m.c('Window', 'ForegroundNormal');
  const Base = m.c('View', 'BackgroundNormal'), Text = m.c('View', 'ForegroundNormal');
  const Btn = m.c('Button', 'BackgroundNormal'), BtnT = m.c('Button', 'ForegroundNormal');
  const H = m.c('Selection', 'BackgroundNormal'), HT = m.c('Selection', 'ForegroundNormal');
  const TipB = m.c('Tooltip', 'BackgroundNormal'), TipT = m.c('Tooltip', 'ForegroundNormal');
  const Placeholder = m.c('View', 'ForegroundInactive');
  const focus = m.c('View', 'DecorationFocus');
  const bias = Number(m.colors.get('KDE', 'frameContrast') ?? m.globals.get('KDE', 'frameContrast') ?? 0.2);
  const frameBg = mix(W, Base, 0.3);
  const frameOutline = mix(W, WT, bias);
  const btnPen = mix(Btn, BtnT, bias);
  /* drawScrollBarSliderControl at rest: scrollBarHandleColor = WindowText
     at 0.5, times (0.7 + 0.3 * grooveAnimationOpacity 0); renderScrollBarHandle
     fills overlayColors(Window, that at 0.5) — an opaque composite — with a
     1px pen of the translucent colour itself. */
  const handleA = 0.5 * 0.7;
  return {
    'q-pen': '1px', /* PenWidth::Frame = 1.001 */
    'q-window': W, 'q-window-text': WT, 'q-base': Base, 'q-text': Text,
    'q-button': Btn, 'q-button-text': BtnT,
    /* renderButtonFrame: resting pen mix(Button, ButtonText, bias); any of
       hovered/visualFocus/down swaps the pen for Highlight. The default
       button (isActiveWindow && defaultButton) fills mix(Button, Highlight,
       0.2) and pens halfway between Highlight and the resting pen. */
    'q-button-pen': btnPen,
    'q-button-focus-pen': H,
    'q-default-fill': mix(Btn, H, 0.2),
    'q-default-pen': mix(H, btnPen, 0.5),
    /* drawPanelMenuPrimitive: fill frameBackgroundColor; outline
       frameOutlineColor (stock) or PATCH.menuOutline at 2px (Klassy). */
    'q-menu-fill': frameBg,
    'q-menu-edge': patched ? PATCH.menuOutline : frameOutline,
    'q-menu-pen': patched ? '2px' : '1px',
    /* drawMenuItemControl, selected: stock fills focusColor at Blend_Value
       with a focusOutlineColor pen (mix(focus, WindowText, 0.15)); Klassy
       paints no fill and a Qt::white 2px ring (renderFocusRect patch). */
    'q-menu-sel-fill': patched ? 'transparent' : alpha(focus, 0.3),
    'q-menu-sel-edge': patched ? PATCH.ring : mix(focus, WT, 0.15),
    'q-menu-sel-pen': patched ? '2px' : '1px',
    /* drawPanelTipLabelPrimitive: ToolTipBase fill; stock outline
       mix(ToolTipBase, ToolTipText, bias). */
    'q-tip-fill': TipB, 'q-tip-text': TipT,
    'q-tip-edge': patched ? PATCH.menuOutline : mix(TipB, TipT, bias),
    'q-tip-pen': patched ? '2px' : '1px',
    /* drawFrameLineEditPrimitive: Base fill, frameOutlineColor pen, which
       becomes focusColor with focus. */
    'q-edit-edge': frameOutline, 'q-edit-focus': focus, 'q-placeholder': Placeholder,
    /* drawPanelItemViewItemPrimitive, selected: stock fills Highlight and
       rings it in the same colour, label HighlightedText; Klassy no fill,
       Qt::white 2px ring, HighlightedText remapped to Text in polish(). */
    'q-row-sel-fill': patched ? 'transparent' : H,
    'q-row-sel-edge': patched ? PATCH.ring : H,
    'q-row-sel-text': patched ? Text : HT,
    'q-row-pen': patched ? '2px' : '1px',
    /* renderScrollBarGroove: WindowText at 0.2 pen, half that as fill. */
    'q-groove-fill': alpha(WT, 0.1), 'q-groove-pen': alpha(WT, 0.2),
    'q-handle-fill': mix(W, WT, handleA * 0.5), 'q-handle-pen': alpha(WT, handleA),
    /* renderCheckBoxBackground: Button fill, separatorColor pen (off) or
       Highlight pen plus Highlight at highlightBackgroundAlpha 0.3 over the
       fill (on); the mark is a 2px palette.text() stroke. */
    'q-check-edge': mix(W, WT, bias),
    'q-check-on-fill': mix(Btn, H, 0.3), 'q-check-on-edge': H,
    /* renderTabBarTab (north, not documentMode): selected tab fills
       frameBackgroundColor, pens mix(fill, WindowText, bias) and paints a
       3px Highlight strip on top; others fill Window.darker(120). Labels
       are WindowText either way (QCommonStyle). */
    'q-tab-on-fill': frameBg, 'q-tab-on-pen': mix(frameBg, WT, bias), 'q-tab-marker': H,
    'q-tab-off-fill': darker(W, 120),
    'desk-bg': W
  };
}

export const laneStyle = (p: QtPaint) => Object.entries(p).map(([k, v]) => `--${k}: ${v}`).join('; ');
