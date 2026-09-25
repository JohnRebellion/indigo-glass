import type { LayerDef } from '../../layer';
import oursText from '../../../../../../vscode/themes/indigo-glass-dark.json?raw';
import modernText from '../../../../../fixtures/stock/vscode/dark_modern.json?raw';
import plusText from '../../../../../fixtures/stock/vscode/dark_plus.json?raw';
import vsText from '../../../../../fixtures/stock/vscode/dark_vs.json?raw';
import { loadTheme, resolve, laneStyle } from './theme';

const stock = resolve(loadTheme({ 'dark_modern.json': modernText, 'dark_plus.json': plusText, 'dark_vs.json': vsText }, 'dark_modern.json'));
const ours = resolve(loadTheme({ 'indigo-glass-dark.json': oursText }, 'indigo-glass-dark.json'));

export const layer: LayerDef = {
  id: 'vscode',
  name: 'VS Code (workbench)',
  family: 'editor',
  order: 0,
  shipped: ['vscode/themes/indigo-glass-dark.json'],
  stockSource:
    'Dark Modern (dark_modern.json → dark_plus.json → dark_vs.json) — fixtures/stock/vscode/, microsoft/vscode 2ec783d8 (2026-09-25).',
  fidelity:
    'Each lane resolves its theme the way the workbench does — includes merged, unset keys filled from the dark colour-registry defaults (layers/vscode/theme.ts, cited per key), transparent() defaults computed — and exposes every key as --vscode-<key>, which is what VS Code\'s own widgets read. The specimens restate those widgets\' colour rules on their real class names, so each slot is one named key. Geometry, codicons and fonts are approximate; hover/active states and high-contrast themes are not drawn.',
  lanes: {
    stock: { label: 'Dark Modern (VS Code default)', style: laneStyle(stock) },
    ours: { label: 'Sage Ink Dark (generated from tokens/vscode_roles.py)', style: laneStyle(ours) }
  },
  /* Every `known` below was measured first (node .cp-dump.mjs). Fixes go in
     tokens/vscode_roles.py (or the role resolver in codegen.py) — the theme
     JSON is generated. The first pass found black edges (`outline_hard`),
     a black ink label (`on_accent`), unset button.secondaryBorder /
     editorWidget.* keys and a neutral scrollbar thumb; all were fixed at
     the source 2026-09-25. VS Code strokes these edges 1px whatever the key. */
  components: {
    button: {
      note: 'fill/label/edge are the secondary button (button.secondary*); VS Code reads button.secondaryBorder first and falls back to button.border only where the key is not registered.'
    },
    menu: {
      note: 'The selected item is menu.selectionBackground (transparent) with menu.selectionBorder as its outline; VS Code draws that border for keyboard selection (:focus-visible), which is what the specimen shows.'
    },
    tooltip: {
      note: 'The workbench hover (platform/hover/browser/hover.css) paints editorHoverWidget.*; none of those keys, nor the editorWidget.* they default to, is in the map.'
    },
    'text-field': {
      note: 'The focus ring is the workbench .synthetic-focus outline (focusBorder); inputOption.activeBorder paints the active Aa toggle inside it.'
    },
    'list-selection': {
      note: 'Row outline is list.focusAndSelectionOutline, else contrastActiveBorder, else list.focusOutline (listWidget.ts style()); the view is the side bar.'
    },
    scrollbar: {
      note: 'VS Code paints no track (scrollbar.shadow is a scrolled-edge shadow, not a track), so the track is the editor background under the slider.'
    },
    checkbox: {
      note: 'VS Code has no checked-state colour: toggle.ts BaseCheckbox.applyStyles paints checkbox.background whether checked or not and only adds the codicon. checkbox.selectBackground is the fill of a checkbox inside a selected list row, not a checked box.',
      known: [
        { slot: 'checked-fill', why: 'the checked box keeps checkbox.background (surface_alt). No theme key can fix this: the map would need a checked-state key VS Code does not register, so meeting the contract takes workbench CSS (none is shipped) or a documented exception in ELEVATION.md.' }
      ]
    },
    tab: {
      note: 'The current tab is marked by tab.activeBorderTop (1px strip); tab.activeBorder (bottom) is transparent in the shipped map.'
    }
  },
  absent: {}
};
