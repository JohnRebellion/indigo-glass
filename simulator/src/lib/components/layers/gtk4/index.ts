import type { LayerDef } from '../../layer';
import { laneCss, laneStyle } from './model';

export const layer: LayerDef = {
  id: 'gtk4',
  name: 'GTK4 / libadwaita',
  family: 'gtk',
  order: 1,
  shipped: ['config/gtk-4.0/gtk.css'],
  stockSource:
    'libadwaita 1.9.3 compiled stylesheet, dark branch (fixtures/stock/libadwaita/, gresource-extracted from libadwaita-1.so.0), accent default from fixtures/stock/gtk-user-css/adwaita-dark.css.',
  fidelity:
    'libadwaita\'s real widget rules and config/gtk-4.0/gtk.css both go through the gtkcss.ts translator, with libadwaita in a cascade layer so the user file beats it at any specificity, as GTK\'s USER provider priority does. The dark branch is resolved as a dark session resolves it; :focus-within and :drop(active) are mapped to data attributes (layers/gtk4/model.ts). The specimens are DOM shaped like the GTK4 node trees; libadwaita\'s recoloured SVG assets (the check mark) are shown by the node colour they are recoloured with. Geometry is approximate.',
  lanes: {
    stock: { label: 'libadwaita 1.9.3 (dark)', style: laneStyle('stock'), css: laneCss.stock },
    ours: { label: 'libadwaita 1.9.3 + gtk-4.0/gtk.css', style: laneStyle('ours'), css: laneCss.ours }
  },
  components: {
    button: {
      known: [
        { slot: 'fill', why: 'gtk-4.0/gtk.css:104-109 gives button a border and shadow but no background, so libadwaita\'s color-mix(currentColor 10%, transparent) wash remains. Fix: add `background-color: @card_bg_color;` (surface_alt, as the GTK3 theme\'s button) at :104, and `background-color: transparent;` to button.flat at :117-119 — a USER rule beats libadwaita\'s more specific .flat reset.' }
      ]
    },
    menu: {
      known: [
        { slot: 'edge', why: 'gtk-4.0/gtk.css:213-216 (popover.menu > contents) sets radius and shadow only; libadwaita\'s 1px RGB(0 0 0 / 14%) popover border stays. Fix: add `border: 2px solid #5E5E60;` there.' },
        { slot: 'selected-fill', why: 'no rule for popover.menu modelbutton:hover/:selected, so libadwaita\'s color-mix(currentColor 10%, transparent) wash paints the current item. Fix: add `popover.menu modelbutton:hover, popover.menu modelbutton:selected { background-color: transparent; box-shadow: inset 0 0 0 2px @window_fg_color; }`.' },
        { slot: 'selected-edge', why: 'same missing modelbutton rule: the current item has no outline. The fix above paints the Tier C ring.' }
      ]
    },
    tooltip: {
      known: [
        { slot: 'fill', why: 'gtk-4.0/gtk.css:208-211 sets radius and shadow only; libadwaita\'s tooltip.background fill RGB(0 0 6 / 80%) stays translucent. Fix: add `background-color: @popover_bg_color;` there.' },
        { slot: 'label', why: 'libadwaita\'s tooltip.background paints `color: white`, not the text token. Fix: add `color: @popover_fg_color;` to the same rule.' },
        { slot: 'edge', why: 'libadwaita\'s 1px RGB(255 255 255 / 10%) tooltip border stays. Fix: add `border: 2px solid #5E5E60;` to the same rule.' }
      ]
    },
    'text-field': {
      known: [
        { slot: 'fill', why: 'gtk-4.0/gtk.css:136-140 sets the entry border but no background, so libadwaita\'s color-mix(currentColor 10%, transparent) fill remains. Fix: add `background-color: @view_bg_color;` (base, as the GTK3 entry).' },
        { slot: 'placeholder', why: 'libadwaita dims entry > text > placeholder with opacity: var(--dim-opacity) (55%) over the inherited text colour — a translucent text wash, not text_muted. Fix: add `entry > text > placeholder { opacity: 1; color: #7F8695; }`.' }
      ]
    },
    'list-selection': {},
    scrollbar: {
      known: [
        { slot: 'thumb', why: 'gtk-4.0/gtk.css:200-203 fills the resting slider #5E5E60 (border_strong); opaque, but Tier D wants an accent step. Fix: `background-color: #89A889;` (accent_alt) at :202, keeping the @accent_bg_color hover at :204-206.' }
      ]
    },
    checkbox: {},
    tab: {
      note: 'Drawn as AdwTabBar, the tab strip libadwaita apps use. A GtkNotebook tab (notebook > header > tabs > tab:checked) does match gtk-4.0/gtk.css:175 and gets the ring.',
      known: [
        { slot: 'active-fill', why: 'gtk-4.0/gtk.css:175-177 targets tab:checked, but AdwTab marks the current tab :selected (adw-tab.c sets GTK_STATE_FLAG_SELECTED), so libadwaita\'s tabbar tab:selected wash, color-mix(currentColor 10%, transparent), paints it. Fix: widen the selector to `tab:checked, tabbar tab:selected` and add `background-color: transparent;`.' },
        { slot: 'active-marker', why: 'same selector miss: the current AdwTabBar tab gets no inset ring. The widened selector above paints it.' }
      ]
    }
  },
  absent: {}
};
