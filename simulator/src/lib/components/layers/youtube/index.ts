import type { LayerDef } from '../../layer';
import { siteById } from '$lib/sites/registry';
import stockCss from '$lib/sites/youtube/stock.css?raw';
import { siteLanes, siteTokens } from '../_sites/css';

const site = siteById('youtube')!;

export const layer: LayerDef = {
  id: 'youtube',
  name: 'YouTube (Stylus)',
  family: 'site',
  order: 2,
  shipped: ['browser/stylus/sites/youtube.user.css'],
  stockSource:
    'The /sites/youtube/ mock (src/lib/sites/youtube/stock.css: the --yt-spec-* dark fallbacks YouTube\'s components read, custom elements given display). YouTube\'s own Polymer bundle is minified, served per build and has no stable upstream to freeze, so nothing beyond the mock is modelled.',
  fidelity:
    'The ytd-*, yt-* and tp-yt-* custom elements and the class names youtube.user.css selects on, inside <ytd-app> with the dark / system-icons attributes on the lane root, as on youtube.com — the same stock mock and scoped userstyle /sites/youtube/ renders. Focus and hover are simulated by rewriting :focus*/:hover to a marker attribute on one copy (layers/_sites/css.ts). The placeholder cell (*) is ::placeholder read with getComputedStyle.',
  lanes: siteLanes(site, stockCss),
  tokenHex: siteTokens(site),
  wrap: site.wrap,
  components: {
    button: {
      known: [
        { slot: 'focus', why: 'youtube.user.css has no :focus rule for yt-button-shape buttons, so the measured "ring" is the level-0 border_strong edge. YouTube\'s own focus paint lives in its minified bundle and is not modelled, so the stock lane fails the same way. Fix: yt-button-shape button:focus-visible { outline: 2px solid text !important; outline-offset: 2px }.' }
      ]
    },
    menu: {
      note: 'The selected item is a hover preview: YouTube\'s keyboard highlight on ytd-menu-service-item-renderer is set by its Polymer bundle (focused / iron-selected state) and is not modelled.',
      exceptions: [
        { slot: 'selected-fill', why: 'Hover wash: --yt-spec-10-percent-layer (youtube.user.css:84). docs/STATE_GRAMMAR.md:35-39 allows a transient, non-scrollbar hover wash regardless of tier.' },
        { slot: 'selected-edge', why: 'Same hover wash; STATE_GRAMMAR.md:35-39 needs no outline on a hover preview. The keyboard state that would need one is not modelled (see note).' }
      ]
    },
    tooltip: {},
    'text-field': {
      known: [
        { slot: 'placeholder', why: 'youtube.user.css does not recolour .ytSearchboxComponentInputBox input::placeholder (the :410 block sets only border / shadow / outline), so YouTube\'s grey placeholder stays off-palette. Fix: .ytSearchboxComponentInputBox input::placeholder { color: text_muted !important }.' },
        { slot: 'focus', why: '.ytSearchboxComponentInputBox:focus-within sets border-color accent_alt at youtube.user.css:214-217 (and the oklch block :297-300), not the Tier C text ring. Fix: border-color text in both places.' }
      ]
    },
    'list-selection': {},
    tab: {}
  },
  absent: {
    scrollbar:
      'youtube.user.css styles no ::-webkit-scrollbar (it only sets color-scheme: dark), and the /sites/youtube/ mock models no YouTube scrollbar; scrollbar paint comes from the universal Stylus style, browser/stylus/indigo-glass.user.css:122-140, which is not this layer.',
    checkbox:
      'youtube.user.css names no checkbox, and YouTube\'s tp-yt-paper-checkbox (the Save-to-playlist sheet) paints from --paper-checkbox-* values inside its minified Polymer bundle, which neither the /sites/youtube/ mock nor any frozen upstream carries — there is nothing to draw it from without inventing values.'
  }
};
