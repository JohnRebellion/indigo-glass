import type { LayerDef } from '../../layer';
import { stock, ours, laneVars } from '$lib/desktop/plasma-theme/model';

/* No SageInk file exists for these, so the fix is a new hand-kept file. */
const NEW = (f: string) => `config/plasma-theme/SageInk/widgets/${f}.svg does not exist, so KSvg falls back to default/widgets/${f}.svg`;

export const layer: LayerDef = {
  id: 'plasma',
  name: 'Plasma desktop theme (PlasmaComponents 3)',
  family: 'plasma',
  order: 0,
  shipped: ['config/plasma-theme/SageInk/colors', 'config/plasma-theme/SageInk/widgets/*.svg', 'config/plasma-theme/SageInk/dialogs/background.svg'],
  stockSource:
    'breeze-dark colors over the "default" image set, libplasma 6.7.4 (fixtures/stock/plasma-theme, as /desktop/plasma-theme/ uses it, KSvg selector "translucent"), plus the default set\'s widgets/button, lineedit, checkmarks and tabbar (fixtures/stock/plasma-pc3), which neither theme ships.',
  fidelity:
    'Every frame is cut from the lane\'s SVG through the /desktop/plasma-theme/ FrameSvg port and model (KSvg lookup, selector, namedColor over the theme\'s own colors file); which image, prefix and colour set a control uses is read from the PC3 QML (paint.ts header). SVG slots are the model\'s topmost paint at >= 0.5 alpha (topPaint), marked "model"; labels are CSS text in the colors-file roles, read back painted. Button, text field, checkbox and tab images are the default set\'s in BOTH lanes (SageInk ships none), so only the colors file differs there. The browser rasterises the SVG, not QtSvg; geometry is at scale 1.',
  lanes: {
    stock: { label: 'breeze-dark + default image set (translucent/)', style: laneVars(stock) },
    ours: { label: 'config/plasma-theme/SageInk (root files) + default fallbacks', style: laneVars(ours) }
  },
  components: {
    button: {
      note: 'PC3 Button: widgets/button prefix "normal" (fill ButtonBackground, edge ColorScheme-Frame) with ButtonFocus.qml laying prefix "focus" over it; colorSet Button (Button.qml:43-44).',
      skip: [
        { slot: 'primary-fill', why: 'PC3 Button has no default / suggested / highlighted look: RaisedButtonBackground and ButtonContent ignore `highlighted`, and widgets/button has no element for it (only hint-focus-highlighted-background, which swaps the label colour under keyboard focus).' },
        { slot: 'primary-label', why: 'no primary button (see primary fill).' }
      ],
      known: [
        { slot: 'edge', why: `${NEW('button')}, whose normal-* edges (default button.svg:443-528 and :1722-1757) paint ColorScheme-Frame; namedColor makes Frame mix(Button bg, Button fg, frameContrast), and frameContrast is solved against the Window surface, not surface_alt, so it lands off border_strong. Fix: ship SageInk/widgets/button.svg with the normal-*/pressed-* edge rects filled border_strong (a literal, as dialogs/background.svg edge-* already is).` },
        { slot: 'focus', why: `${NEW('button')}, whose focus-* parts (default button.svg:1005-1141) paint ColorScheme-Highlight (accent), plus a 0.33-alpha Highlight inner wash. Fix: in the new SageInk/widgets/button.svg paint focus-* opaque ColorScheme-ButtonFocus (Button DecorationFocus = text) and drop the wash.` }
      ]
    },
    menu: {
      note: 'PC3 Menu: background widgets/background, no prefix (Menu.qml:99); MenuItem highlight widgets/viewitem prefix "hover", shown for hovered AND keyboard-highlighted items (MenuItem.qml:112-121). Context menus of the shell itself (desktop, panel, task manager) are QMenus drawn by the Qt style — the kde layer.',
      known: [
        { slot: 'edge', why: 'SageInk/widgets/background.svg edge parts (left :243, bottom :265, right :287, topleft :309, top :340, topright :444, bottomleft :452, bottomright :471) paint only ColorScheme-Background, so a PC3 menu has no edge and its surface fill equals the popup it opens over. Fix: add the 2px border_strong edge rects dialogs/background.svg already carries (edge-top-0 etc., :268) to those parts. Note the file is also the desktop-widget frame (BasicAppletContainer), which gains the same edge.' },
        { slot: 'selected-edge', why: 'the keyboard-highlighted item paints viewitem "hover" (MenuItem.qml:114-115), whose ring is ColorScheme-ButtonHover = accent_hi (SageInk/widgets/viewitem.svg hover-* parts, e.g. hover-top :502-515). PC3 has no separate focused prefix. Fix: paint the hover-* ring ColorScheme-ButtonFocus (DecorationFocus = text), the same stroke as selected-*; the trade-off is that pointer hover then reads the same as keyboard highlight, which is what PC3 already means by "hover" (PlasmaExtras.Highlight also shows "hover" for a ListView\'s current item).' }
      ]
    },
    tooltip: {
      note: 'ToolTipDialog (Dialog type Tooltip): widgets/tooltip, colorSet Tooltip; ColorScheme-Background is the Window set whatever the colorSet (namedColor).'
    },
    'text-field': {
      note: 'PC3 TextField: widgets/lineedit "base", colorSet View; focus prefix "focusframe" (visualFocus, when the file has it) else "focus" (TextField.qml:222-225); placeholder is disabledTextColor = View ForegroundInactive (ThemePrivate::color DisabledTextColor -> InactiveText).',
      known: [
        { slot: 'edge', why: `${NEW('lineedit')}, whose base-* edges (default lineedit.svg:138-277) paint ColorScheme-Frame; in the View set that is mix(base, text, frameContrast), off border_strong (frameContrast is solved on the Window surface). Fix: ship SageInk/widgets/lineedit.svg with the base-* edge rects filled border_strong.` }
      ]
    },
    'list-selection': {
      note: 'PlasmaExtras.Highlight on widgets/viewitem: "selected" when pressed, else "hover" — a ListView\'s current item shows "hover" by default (Highlight.qml: hovered is true inside a view), so many applets show the menu\'s accent_hi hover ring for the current row, not this one. PC3 ItemDelegate uses widgets/listitem instead (not drawn here).'
    },
    scrollbar: {
      note: 'PC3 ScrollBar fades the track (background-vertical) in only on hover (ScrollBar.qml:68); drawn here as it shows when it is visible. At rest the thumb sits directly on the popup fill.'
    },
    checkbox: {
      note: 'PC3 CheckIndicator: widgets/button "normal" as the box, widgets/checkmarks element "checkbox" over it when checked (CheckIndicator.qml:27-45); inherits the Window set, where Frame is border_strong through the derived frameContrast.',
      known: [
        { slot: 'checked-fill', why: `${NEW('checkmarks')}, whose checkbox rect (default checkmarks.svg:16, rect924) fills ColorScheme-ButtonFocus at fill-opacity 0.33 — a translucent wash (text over surface_alt on Sage). Fix: ship SageInk/widgets/checkmarks.svg with rect924 filled ColorScheme-Highlight (accent) at fill-opacity 1 and the mark (path2684, :17) in ColorScheme-HighlightedText (base in the plasma-shell scheme), and the radiobutton the same way.` }
      ]
    },
    tab: {
      note: 'PC3 TabBar highlight: widgets/tabbar "north-active-tab" (TabBar.qml:49); its centre and top/sides paint #e4e6e8 at 1% alpha (effectively nothing; topPaint ignores it), the marker is the bottom part in ColorScheme-ButtonFocus. The inactive tab paints no frame. Both labels are textColor (TabButton.qml:68).'
    }
  },
  absent: {}
};
