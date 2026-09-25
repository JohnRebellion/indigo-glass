import type { LayerDef } from '../../layer';
import { laneCss, laneStyle } from './model';

export const layer: LayerDef = {
  id: 'gtk3',
  name: 'GTK3 theme',
  family: 'gtk',
  order: 0,
  shipped: [
    'config/gtk-theme/SageInk/gtk-3.0/gtk.css',
    'config/gtk-theme/SageInk/gtk-3.0/gtk-dark.css',
    'config/gtk-3.0/gtk.css'
  ],
  stockSource:
    'Breeze-Dark gtk-3.0/gtk.css (fixtures/stock/gtk3-theme/, breeze-gtk-gtk3 6.7.4) — what a stock Plasma 6 session applies to GTK3 apps via kde-gtk-config.',
  fidelity:
    'Both stylesheets go through the gtkcss.ts translator /desktop/gtk3-theme/ uses: real selectors, @define-color as custom properties, shade()/alpha()/mix() as color-mix(), GTK state pseudo-classes as data attributes on DOM shaped like the GTK3 node tree. Two renderer facts are modelled in layers/gtk3/model.ts: outline paints only on the focused widget (gtkcssgadget.c), and the entry placeholder is the named colour placeholder_text_color or GTK\'s #808080 fallback (gtkentry.c), not a CSS node. Breeze\'s -gtk-icon-source check-mark asset is dropped, so the stock mark shows the node colour. Geometry is approximate.',
  lanes: {
    stock: { label: 'Breeze-Dark gtk-3.0/gtk.css', style: laneStyle('stock'), css: laneCss('stock') },
    ours: { label: 'SageInk gtk.css + gtk-dark.css, then gtk-3.0/gtk.css', style: laneStyle('ours'), css: laneCss('ours') }
  },
  components: {
    button: {
      known: [
        { slot: 'focus', why: 'gtk-dark.css:52-69 sets outline-width/offset/color on * but never outline-style, whose GTK3 initial value is none (gtkcssstylepropertyimpl.c), and no button:focus rule exists (:80-100) — a keyboard-focused button draws no ring and keeps its border_strong edge. Fix: after :100 add `button:focus { outline: 2px solid @theme_text_color; outline-offset: 2px; }`.' }
      ]
    },
    menu: {
      known: [
        { slot: 'selected-edge', why: 'gtk-dark.css:261-265 marks the hovered item with `outline`, which GTK3 paints only on a focused widget (gtkcssgadget.c draw_focus; the file itself records this at :410-413 for rows) — a menu item under the pointer is never focused, so it shows no ring at all. Fix: replace the outline with `box-shadow: inset 0 0 0 2px @theme_text_color;`, the mechanism :281-285 already uses for rows.' }
      ]
    },
    tooltip: {},
    'text-field': {
      note: 'GTK3 draws the placeholder in the named colour placeholder_text_color (gtkentry.c:6333), read from the lane\'s @define-color map; it is not a CSS node, so the value is the model\'s.',
      known: [
        { slot: 'placeholder', why: 'no `@define-color placeholder_text_color` in gtk-dark.css:19-50 (nor in gtk-3.0/gtk.css), so GtkEntry falls back to rgb(0.5, 0.5, 0.5) = #808080, off-palette. Fix: add `@define-color placeholder_text_color #7F8695;` (text_muted, as insensitive_fg_color at :26).' }
      ]
    },
    'list-selection': {},
    scrollbar: {
      known: [
        { slot: 'thumb', why: 'gtk-dark.css:295-300 fills the resting slider with @borders (border_strong grey); opaque, but Tier D wants an accent step. Fix: `background-color: #89A889;` (accent_alt) at :296, keeping the @accent_color hover at :301-303.' }
      ]
    },
    checkbox: {},
    tab: {}
  },
  absent: {}
};
