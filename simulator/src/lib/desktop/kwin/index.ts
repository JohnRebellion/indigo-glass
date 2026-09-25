import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PALETTE } from '../tokens';
import { kwinBlurIni, kwinRules, PARITY_OK, blurAndContrastOff, noForcedOpacity, decorationIsKlassy } from './model';

export const meta: SurfaceMeta = {
  id: 'kwin',
  name: 'KWin',
  group: 'linux',
  order: 4,
  shipped: [
    { path: 'config/kwin/kwinrc.snippets' },
    { path: 'config/kwin/kwinrulesrc.snippet' },
    { path: 'tokens/out/kwinrc-blur.ini', generated: true }
  ],
  stockSource:
    'Plasma 6 kwin defaults — see the Stock note on this page for exactly what is and is not a fetched citation (a 2026-09-25 attempt to fetch KWin\'s own effect-metadata source from invent.kde.org 404\'d on every path tried).',
  fidelity: 'low',
  fidelityWhy:
    'KWin paints no colour or text of its own on this page — it is a settings table plus the visual consequences those settings have on the window specimens klassy-decoration already renders (borders, maximised-window corners). The one thing this page asserts with certainty is the CRITICAL design invariant: nothing shipped here enables blur, background contrast, or window opacity below 100%. That is checked, not eyeballed — see the design-check roles below.',
  live: 'System Settings > Window Decorations (library/theme), > Desktop Effects (Blur/Background Contrast off), and > Window Management > Window Rules (no global opacity rule). kwinrc.snippets and kwinrc-blur.ini are never applied by this repo\'s install.sh directly — a human merges them into ~/.config/kwinrc; kwinrulesrc.snippet is not applied at all (dead file, kept only for its history comment). Checkable on this host by reading ~/.config/kwinrc, not by running install.sh.'
};

const okColor = (ok: boolean) => (ok ? PALETTE.positive : PALETTE.negative);

export const roles: Role[] = [
  {
    role: 'No blur / background-contrast compositing (Plugins/blurEnabled, better_blur_dxEnabled, backgroundcontrastEnabled)',
    ours: okColor(blurAndContrastOff()),
    token: 'positive',
    note: `kwinrc-blur.ini: blurEnabled=${kwinBlurIni.get('Plugins', 'blurEnabled')}, better_blur_dxEnabled=${kwinBlurIni.get('Plugins', 'better_blur_dxEnabled')}, backgroundcontrastEnabled=${kwinBlurIni.get('Plugins', 'backgroundcontrastEnabled')}. Stock Plasma ships both Blur and Background Contrast ON by default — this is the one place in the whole repo that has to actively turn them off to keep the opaque-ink design; a regression here would reintroduce a real visual blur, not just a token drift.`
  },
  {
    role: 'No forced window opacity (kwinrulesrc.snippet)',
    ours: okColor(noForcedOpacity()),
    token: 'positive',
    note: noForcedOpacity()
      ? 'Fixed 2026-09-25: this file used to Force opacityactive=88 / opacityinactive=85 onto every window (wmclass=.*). It is not applied by install.sh and never was reachable from a fresh install, but it was live ammunition for a hand-run kwriteconfig6 — see the file\'s own history comment. It now carries zero real keys, only the history note.'
      : `REGRESSION: kwinrulesrc.snippet has ${kwinRules.groups.length} group(s) again — check for a reintroduced opacity Force rule.`
  },
  {
    role: 'kwinrc.snippets (hand-kept) matches kwinrc-blur.ini (generated) byte-for-byte',
    ours: okColor(PARITY_OK),
    token: 'positive',
    note: PARITY_OK
      ? 'Currently identical. Nothing enforces this: tokens/codegen.py only emits kwinrc-blur.ini (confirmed via grep — kwinrc.snippets is not in its output list), so the hand-kept copy is free to drift the next time someone edits one file and not the other. Proposed fix (not applied, per the brief\'s "never hand-edit generated files" rule): either delete kwinrc.snippets and point its one non-codegen consumer at kwinrc-blur.ini directly, or add a codegen_check step that diffs the two and fails the drift guard if they differ.'
      : 'DRIFT: kwinrc.snippets no longer matches the generated kwinrc-blur.ini — one of them was hand-edited without regenerating the other.'
  },
  {
    role: 'Decoration binding (org.kde.kdecoration2/library)',
    ours: kwinBlurIni.get('org.kde.kdecoration2', 'library') === 'org.kde.klassy' ? PALETTE.positive : PALETTE.negative,
    token: 'positive',
    note: `library=${kwinBlurIni.get('org.kde.kdecoration2', 'library')}, theme=${kwinBlurIni.get('org.kde.kdecoration2', 'theme')} — cross-checked against /desktop/klassy-decoration/, which renders what this binding actually paints.`
  }
];

/* KWin paints no text itself — the window titlebar text this config affects
   is klassy-decoration's contrast pair, not a second copy here. */
export const contrast: ContrastPair[] = [];

export { decorationIsKlassy };
