import type { LayerDef } from '../../layer';
import { siteById } from '$lib/sites/registry';
import stockCss from '$lib/sites/github/stock.css?raw';
import primerBase from '../../../../../fixtures/stock/primer-css/base.css?raw';
import primerForms from '../../../../../fixtures/stock/primer-css/forms.css?raw';
import actionList from '../../../../../fixtures/stock/primer-react/ActionList-1ff5220c.css?raw';
import { siteLanes, siteTokens, pickRules, isFocusRule } from '../_sites/css';

const site = siteById('github')!;
/* Primer's own focus paint, which the /sites/ mock models none of:
   `button:focus-visible` (Primer CSS base), `.form-control:focus-visible`
   (Primer CSS forms) and a keyboard-focused ActionList item (Primer React),
   all reading --focus-outlineColor. */
const focus = [primerBase, primerForms, actionList].map((css) => pickRules(css, isFocusRule)).join('\n');

export const layer: LayerDef = {
  id: 'github',
  name: 'GitHub (Stylus)',
  family: 'site',
  order: 0,
  shipped: ['browser/stylus/sites/github.user.css'],
  stockSource:
    'The /sites/github/ mock (src/lib/sites/github/stock.css: Primer dark-default tokens read off github.com 2026-09-24, Primer-shaped component rules) plus the :focus* rules of Primer CSS 22.3.1 (fixtures/stock/primer-css/, base.css + forms.css) and Primer React 38.40.0 ActionList (fixtures/stock/primer-react/).',
  fidelity:
    'Real Primer class names and attributes (.btn, .Overlay + prc-ActionList, .tooltipped-box, .form-control, NavList data-active, .UnderlineNav, form-checkbox) under the same stock mock and the same scoped userstyle /sites/github/ renders, so a slot here and a specimen there cannot disagree. Focus and hover are simulated: :focus*/:hover in every lane stylesheet are rewritten to a marker attribute on one copy (layers/_sites/css.ts). Cells marked * are pseudo-element or UA-control paints read with getComputedStyle (::placeholder colour, the checkbox accent-color), which the element probe cannot reach. The mock is not live github.com: it carries the classes someone has already seen, and hardcodes a few values (Primer\'s orange current-tab strip) that live Primer reads from variables.',
  lanes: siteLanes(site, stockCss, focus),
  tokenHex: siteTokens(site),
  components: {
    button: {
      known: [
        { slot: 'focus', why: 'Primer\'s button:focus-visible outline reads --focus-outlineColor, which github.user.css:79 (and the oklch block, :222) remaps to accent_alt, not the Tier C text ring. Fix: set --focus-outlineColor to text in both places. On live github.com the universal style\'s *:focus-visible outline masks this.' }
      ],
      exceptions: [
        { slot: 'primary-fill', why: 'The action green is decided in browser/stylus/sites/README.md (per-site hue table, GitHub row: "button #7BBE81") and explained at github.user.css:98-103; it sits outside the link-blue tokenHex by design.' }
      ]
    },
    menu: {
      note: 'The selected item is a keyboard-focused Primer React ActionList item (its :focus-visible outline, fixtures/stock/primer-react/), not a hover wash.',
      known: [
        { slot: 'selected-edge', why: 'The ActionList item\'s :focus-visible outline reads --focus-outlineColor, remapped to accent_alt at github.user.css:79 / :222. Same fix as button focus: text.' }
      ]
    },
    tooltip: {
      known: [
        { slot: 'label', why: '.tooltipped-box takes --fgColor-onEmphasis, which github.user.css leaves at Primer\'s pure white (the ring value, not text). Fix: .tooltipped-box { color: text !important } in the :268 block; scoped there because the file keeps white on State pills on purpose.' }
      ]
    },
    'text-field': {
      known: [
        { slot: 'focus', why: 'github.user.css:197-205 forces border-color border_strong !important and :284-286 box-shadow: none !important on .form-control, which override Primer\'s .form-control:focus-visible border and inset ring, so focus shows no change. Fix: .form-control:focus-visible, .FormControl-input:focus-visible { outline: 2px solid text !important; outline-offset: 0 }.' }
      ]
    },
    'list-selection': {},
    checkbox: {
      skip: [
        { slot: 'box-fill', why: 'Native <input type=checkbox>: the UA draws the box; Primer and github.user.css set only accent-color, so there is no element paint to read.' },
        { slot: 'box-edge', why: 'UA-drawn native checkbox edge; no CSS paints it.' },
        { slot: 'mark', why: 'UA-drawn native tick; its colour is chosen by the UA from accent-color.' }
      ],
      known: [
        { slot: 'checked-fill', why: 'Primer sets accent-color from --bgColor-accent-emphasis, which github.user.css does not remap, so a checked box stays Primer blue. Fix: input[type=checkbox], input[type=radio] { accent-color: accent !important } in github.user.css.' }
      ]
    },
    tab: {
      known: [
        { slot: 'active-marker', why: 'The current-tab strip is Primer\'s orange --underlineNav-borderColor-active, which github.user.css does not remap. Fix: add --underlineNav-borderColor-active: text to the :root block plus .UnderlineNav-item[aria-current="page"] { border-bottom-color: text !important }.' }
      ]
    }
  },
  absent: {
    scrollbar:
      'github.user.css styles no ::-webkit-scrollbar (it only sets color-scheme: dark, so the UA draws dark native scrollbars); scrollbar paint comes from the universal Stylus style, browser/stylus/indigo-glass.user.css:122-140, which is not this layer.'
  }
};
