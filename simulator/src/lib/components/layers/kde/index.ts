import type { LayerDef } from '../../layer';
import { stock, ours } from '$lib/desktop/kde-colors/model';
import { qtPaint, laneStyle } from './qt';

export const layer: LayerDef = {
  id: 'kde',
  name: 'Qt widgets (KDE)',
  family: 'qt',
  order: 0,
  shipped: ['share/color-schemes/SageInk.colors', 'config/kdeglobals.snippet', 'config/klassy/*.patch'],
  stockSource: 'Breeze widget style (unpatched) on BreezeDark.colors — fixtures/stock/kde-colors/, plasma-breeze-common.',
  fidelity:
    'Colours are computed with the Breeze kstyle formulas (layers/kde/qt.ts, read from breezehelper.cpp / breezestyle.cpp and the patches\' "-" lines) on the parsed colour scheme, then painted as CSS. Geometry (radii, antialiasing, the 1px drop shadow under buttons) is approximate; the colour of every slot is what Qt computes.',
  lanes: {
    stock: { label: 'Breeze + BreezeDark.colors', style: laneStyle(qtPaint(stock)) },
    ours: { label: 'Klassy (3 patches) + SageInk.colors', style: laneStyle(qtPaint(ours)) }
  },
  components: {
    button: {
      known: [
        { slot: 'edge', why: 'renderButtonFrame pens mix(Button, ButtonText, frameContrast); Button is surface_alt, not the Window surface frameContrast is solved against, so it lands one step off border_strong. No Klassy patch touches buttons yet.' },
        { slot: 'focus', why: 'focus swaps the pen to Highlight (accent), not the Tier C ring; needs a renderButtonFrame hunk.' },
        { slot: 'primary-fill', why: 'Breeze\'s default button is mix(Button, Highlight, 0.2), not an accent fill; ELEVATION level 1 is not expressible through the colour scheme.' },
        { slot: 'primary-label', why: 'default button keeps ButtonText; the ink label would need the accent fill above first.' }
      ]
    },
    menu: {
      known: [
        { slot: 'fill', why: 'drawPanelMenuPrimitive fills frameBackgroundColor = mix(Window, Base, Blend_Value 0.3), a compile-time constant no file sets; menu-tooltip-ink.patch fixed the outline, not the fill.' },
        { slot: 'selected-fill', why: 'the selected item is unfilled (Tier C holds), so it shows the menu fill above — same blend.' }
      ]
    },
    tooltip: {},
    'text-field': {
      note: 'The edge is frameOutlineColor = mix(Window, WindowText, frameContrast); codegen derives frameContrast (0.345 on sage) so that blend is border_strong exactly.'
    },
    'list-selection': {},
    scrollbar: {
      known: [
        { slot: 'track', why: 'renderScrollBarGroove fills WindowText at alpha 0.1 — translucent by construction.' },
        { slot: 'thumb', why: 'the handle fills overlayColors(Window, WindowText at 0.175), a grey composite, not an accent step.' }
      ]
    },
    checkbox: {
      note: 'The box edge is separatorColor = mix(Window, WindowText, frameContrast) — border_strong through the derived frameContrast.',
      known: [
        { slot: 'checked-fill', why: 'Highlight at alpha 0.3 composited over Button — a computed blend, not the accent itself.' }
      ]
    },
    tab: {
      known: [
        { slot: 'active-fill', why: 'frameBackgroundColor = mix(Window, Base, 0.3), a blend no file sets.' },
        { slot: 'active-marker', why: 'a 3px Highlight (accent) strip, not the Tier C ring; renderTabBarTab is unpatched.' }
      ]
    }
  },
  absent: {}
};
