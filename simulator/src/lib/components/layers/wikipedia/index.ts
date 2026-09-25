import type { LayerDef } from '../../layer';
import { siteById } from '$lib/sites/registry';
import stockCss from '$lib/sites/wikipedia/stock.css?raw';
import codex from '../../../../../fixtures/stock/codex/codex.style.css?raw';
import { siteLanes, siteTokens, pickRules, isFocusRule } from '../_sites/css';

const site = siteById('wikipedia')!;
/* What the /sites/ mock does not model, from Codex itself: the focus paint of
   .cdx-button / .cdx-text-input__input, and the checkbox tick (a rotated
   ::before border in --border-color-inverted-fixed). */
const TICK = /^\.cdx-checkbox__input:(enabled:)?checked:not\(:indeterminate\)\+\.cdx-checkbox__icon:before$/;
const upstream = [
  pickRules(codex, (s) => isFocusRule(s) && /^\.cdx-(button|text-input__input)[:.]/.test(s)),
  pickRules(codex, (s) => TICK.test(s))
].join('\n');

export const layer: LayerDef = {
  id: 'wikipedia',
  name: 'Wikipedia (Stylus)',
  family: 'site',
  order: 1,
  shipped: ['browser/stylus/sites/wikipedia.user.css'],
  stockSource:
    'The /sites/wikipedia/ mock (src/lib/sites/wikipedia/stock.css: Codex night-mode tokens read off en.wikipedia.org 2026-09-24, Vector 2022 night hardcodes) plus Codex 2.7.0 focus and checkbox-tick rules (fixtures/stock/codex/).',
  fidelity:
    'Vector 2022 / Codex class names (.cdx-button, .cdx-menu + .cdx-menu-item--highlighted, .cdx-text-input__input, .vector-toc, .vector-menu-tabs, .cdx-checkbox) under the same stock mock and scoped userstyle /sites/wikipedia/ renders; the lane root carries skin-theme-clientpref-night as <html> does. Focus is simulated by rewriting :focus* to a marker attribute on one copy (layers/_sites/css.ts). Cells marked * are pseudo-element paints read with getComputedStyle (::placeholder, the tick\'s ::before border). Stock-lane focus colours fall back to Codex\'s day values where the mock declares no night token.',
  lanes: siteLanes(site, stockCss, upstream),
  tokenHex: siteTokens(site),
  components: {
    button: {
      known: [
        { slot: 'focus', why: 'wikipedia.user.css:250-260 and the structure block :378-384 set border: 2px solid border_strong !important and box-shadow: none !important on .cdx-button, erasing Codex\'s :focus border and inset ring; nothing replaces them. Fix: .cdx-button:focus-visible { outline: 2px solid text !important; outline-offset: 2px }.' }
      ]
    },
    menu: {
      known: [
        { slot: 'selected-fill', why: '.cdx-menu-item--highlighted paints --background-color-interactive-subtle--hover, remapped to surface_alt at wikipedia.user.css:42: a fill one step off the menu surface, not a Tier C outline (this is Codex\'s keyboard highlight, not a hover preview). Fix: .cdx-menu-item--highlighted { background-color: transparent !important; box-shadow: inset 0 0 0 2px text !important }.' },
        { slot: 'selected-edge', why: 'No outline or ring on .cdx-menu-item--highlighted (the :438 block sets box-shadow: none). Same fix as selected-fill.' }
      ]
    },
    'text-field': {
      known: [
        { slot: 'focus', why: 'wikipedia.user.css:253-256 and :427-431 set border: 2px solid border_strong !important and box-shadow: none !important on .cdx-text-input__input, overriding Codex\'s :focus border and inset ring. Fix: .cdx-text-input__input:focus { border-color: text !important } (or an outline in text).' }
      ]
    },
    'list-selection': {
      known: [
        { slot: 'label', why: 'wikipedia.user.css:122-127 colours .vector-toc a with the link accent !important, so TOC entries read as links rather than text.' },
        { slot: 'selected-label', why: 'The same :125 .vector-toc a rule beats Vector\'s active-entry colour. Fix: drop .vector-toc a from that selector list and add .vector-toc a { color: text !important }.' },
        { slot: 'selected-edge', why: 'Nothing rings .vector-toc-list-item-active; the active entry is marked by weight alone. Fix: .vector-toc-list-item-active > a { box-shadow: inset 2px 0 0 0 text !important } or a full 2px outline.' }
      ]
    },
    checkbox: {
      known: [
        { slot: 'box-edge', why: '.cdx-checkbox__icon borders read --border-color-interactive, remapped to accent_alt at wikipedia.user.css:73, not the border_strong control edge. Fix: .cdx-checkbox__icon { border-color: border_strong !important } for the unchecked state.' },
        { slot: 'checked-fill', why: 'A checked .cdx-checkbox__icon paints --background-color-progressive, which wikipedia.user.css does not remap, so it stays Codex blue. Fix: --background-color-progressive: accent in the :22 block (the tick then needs an ink --border-color-inverted-fixed to clear contrast).' }
      ]
    },
    tab: {
      known: [
        { slot: 'active-label', why: 'The blanket a { color: accent !important } rule at wikipedia.user.css:122-127 recolours the selected .vector-tab-noicon link, overriding Vector\'s text colour for the current tab. Fix: .vector-menu-tabs .selected a, .vector-tab-noicon.selected { color: text !important }.' }
      ]
    }
  },
  absent: {
    tooltip:
      'Vector 2022 shows the browser\'s native title tooltip (no DOM to style); neither wikipedia.user.css nor the /sites/wikipedia/ mock names a tooltip element.',
    scrollbar:
      'wikipedia.user.css styles no ::-webkit-scrollbar (it only sets color-scheme: dark, so the UA draws dark native scrollbars); scrollbar paint comes from the universal Stylus style, browser/stylus/indigo-glass.user.css:122-140, which is not this layer.'
  }
};
