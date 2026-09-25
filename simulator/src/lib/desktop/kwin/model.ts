/* KWin window-manager settings: compositor effects (blur/contrast/etc.),
 * decoration binding, maximised-window borders, and the retired global
 * window-opacity rule.
 *
 * Two of the three shipped files are the same bytes: config/kwin/kwinrc.snippets
 * (hand-kept, "DO NOT EDIT (edit tokens, regenerate)" header notwithstanding —
 * confirmed via `grep` on tokens/codegen.py that only kwinrc-blur.ini is
 * codegen output) and tokens/out/kwinrc-blur.ini (generated, the one
 * scripts/install.sh actually merges into ~/.config/kwinrc around its
 * "Patching kwinrc" step). Nothing enforces that the hand-kept copy tracks
 * the generated one — this page treats that as a standing parity check, not
 * an assumption.
 *
 * The third, config/kwin/kwinrulesrc.snippet, used to force
 * opacityactive=88 / opacityinactive=85 onto every window (wmclass=.*) via a
 * "Force" rule. That is exactly the translucency CLAUDE.md and
 * tokens.toml's [opacity] (window_active/window_inactive both 1.0 now) say
 * was removed in Sage Ink v5 (2026-08-28) — found live while building this
 * page, 2026-09-25, and fixed in place (see config/kwin/kwinrulesrc.snippet's
 * own history comment). It is not applied by scripts/install.sh (confirmed:
 * no reference to kwinrulesrc.snippet anywhere in the script), so nothing
 * currently ships this bug, but the stale file itself was live ammunition for
 * whoever next scripted "apply my kwin snippets" by hand.
 */
import kwinSnippetsRaw from '../../../../../config/kwin/kwinrc.snippets?raw';
import kwinBlurIniRaw from '../../../../../tokens/out/kwinrc-blur.ini?raw';
import kwinRulesRaw from '../../../../../config/kwin/kwinrulesrc.snippet?raw';
import { parseIni, type IniDoc } from '../ini';
import { iniCoverage } from '../coverage';
import type { KeyVars } from '../coverage';
import type { Coverage } from '../surface';

/* tokens/out/kwinrc-blur.ini is the file install.sh actually merges — treated
   as canonical for every displayed value. kwinrc.snippets is read only to
   prove byte parity with it (below); it is not a second source of truth. */
export const kwinBlurIni: IniDoc = parseIni(kwinBlurIniRaw);
export const kwinSnippets: IniDoc = parseIni(kwinSnippetsRaw);
export const kwinRules: IniDoc = parseIni(kwinRulesRaw);
/* Current text of the retired file, for display — it is comment-only now, so
   there is nothing an IniDoc would show. */
export const kwinRulesText: string = kwinRulesRaw;

export const PARITY_OK = kwinSnippetsRaw.trim() === kwinBlurIniRaw.trim();

/* kwinrc.snippets carries the same keys as kwinrc-blur.ini; once the parity
   check above has run and passed, its keys are exactly the ones already
   rendered from kwinBlurIni, so mark them used the same way a page marks a
   whole group used when a table renders it wholesale (ini.ts's own `touch`
   contract). If parity ever breaks this stops firing and the hand-kept copy's
   keys show up in the coverage footer as genuinely unrendered — which is the
   point: a silent fork would surface here, not just in a page note. */
export function markSnippetsParity(): void {
  if (!PARITY_OK) return;
  for (const g of kwinSnippets.groups) kwinSnippets.touch(g);
}

export const KEY_VARS: KeyVars = {};
export const IGNORE: { token: string; why: string }[] = [];

export function coverage(): Coverage {
  const blur = iniCoverage([{ label: 'kwinrc-blur.ini', doc: kwinBlurIni }], KEY_VARS, IGNORE);
  const snippets = iniCoverage([{ label: 'kwinrc.snippets', doc: kwinSnippets }], KEY_VARS, IGNORE);
  const rules = iniCoverage([{ label: 'kwinrulesrc.snippet', doc: kwinRules }], KEY_VARS, IGNORE);
  return {
    total: blur.total + snippets.total + rules.total,
    missing: [...blur.missing, ...snippets.missing, ...rules.missing],
    ignored: [...(blur.ignored ?? []), ...(snippets.ignored ?? []), ...(rules.ignored ?? [])]
  };
}

/* Plasma 6 stock defaults. Only asserted where I have a citable source; the
   two effect-enabled defaults are common-knowledge (System Settings > Desktop
   Effects ships Blur and Background Contrast switched on) rather than a
   fetched kcfg — an attempt to fetch KWin's own effect metadata from
   invent.kde.org this session 404'd on every path tried, so this page says so
   rather than inventing a citation. */
export const STOCK_NOTE =
  'Plasma 6 kwin defaults, not a fixture file: decoration library org.kde.breeze (Breeze, unthemed Aurorae has no theme= value), ' +
  'BorderSize=Normal, no forced window-opacity rule, borders kept on maximised windows. Blur and Background Contrast effects ship ' +
  'enabled by default (System Settings > Desktop Effects) — stated from general Plasma documentation, not fetched from a kwin source ' +
  'file: invent.kde.org/api/v4/projects/plasma%2Fkwin lookups for the effects\' metadata 404\'d on every path tried 2026-09-25.';

export const STOCK = {
  library: 'org.kde.breeze',
  theme: '',
  buttonsOnLeft: 'MS',
  buttonsOnRight: 'HIAX',
  borderSize: 'Normal',
  blurEnabled: 'true',
  backgroundcontrastEnabled: 'true',
  borderlessMaximizedWindows: 'false'
};

/* --- The CRITICAL check the brief calls out by name: if anything shipped
   here enables blur, translucency or opacity < 100, it must show as a
   visible failure, not just a code comment. Each check below becomes a Role
   in index.ts: ours resolves to PALETTE.positive when the shipped file is
   clean and to a colour that will NOT equal that token when it is not —
   which DesktopPage.svelte renders as "DRIFT" in the same roles table every
   other surface uses, exactly the "role-check visible on the page" the brief
   asks for. Nothing here is currently expected to fail; the checks stay
   wired so a future regression (e.g. someone re-adding kwinrulesrc's old
   values) shows up the same way a token drift would. */
export function blurAndContrastOff(): boolean {
  return (
    kwinBlurIni.get('Plugins', 'blurEnabled') === 'false' &&
    kwinBlurIni.get('Plugins', 'better_blur_dxEnabled') === 'false' &&
    kwinBlurIni.get('Plugins', 'backgroundcontrastEnabled') === 'false'
  );
}

/* kwinrulesrc.snippet no longer carries ANY key (fixed 2026-09-25) — a
   genuinely empty INI doc has zero groups. If a group ever reappears here,
   this flips to false regardless of what the group contains, which is
   intentionally stricter than just checking the two opacity keys: the whole
   point of the fix was "there is nothing to append here". */
export function noForcedOpacity(): boolean {
  return kwinRules.groups.length === 0;
}

export function decorationIsKlassy(): boolean {
  return kwinBlurIni.get('org.kde.kdecoration2', 'library') === 'org.kde.klassy';
}

/* Every kwinrc-blur.ini key, for the settings table. Reading each via
   kwinBlurIni.get() (not touch()) is what marks it covered — the table is the
   thing that renders it, same contract as every other surface's settings
   table. Stock defaults are STOCK above, or 'n/a' where I have no citable
   source (see STOCK_NOTE). */
export const SETTINGS_ROWS: { group: string; key: string; stock?: string }[] = [
  { group: 'org.kde.kdecoration2', key: 'library', stock: STOCK.library },
  { group: 'org.kde.kdecoration2', key: 'theme', stock: '(none)' },
  { group: 'org.kde.kdecoration2', key: 'ButtonsOnLeft', stock: STOCK.buttonsOnLeft },
  { group: 'org.kde.kdecoration2', key: 'ButtonsOnRight', stock: STOCK.buttonsOnRight },
  { group: 'org.kde.kdecoration2', key: 'BorderSize', stock: STOCK.borderSize },
  { group: 'org.kde.kdecoration2', key: 'BorderSizeAuto', stock: 'true' },
  { group: 'Plugins', key: 'blurEnabled', stock: STOCK.blurEnabled },
  { group: 'Plugins', key: 'better_blur_dxEnabled', stock: 'n/a — effect not present in a stock Plasma 6 install' },
  { group: 'Plugins', key: 'backgroundcontrastEnabled', stock: STOCK.backgroundcontrastEnabled },
  { group: 'Plugins', key: 'fadedesktopEnabled', stock: 'true (built-in, on by default)' },
  { group: 'Plugins', key: 'truely-maximizedEnabled', stock: 'n/a — third-party effect, not in stock Plasma' },
  { group: 'Plugins', key: 'kwin4_effect_shapecornersEnabled', stock: 'n/a — third-party effect, not in stock Plasma' },
  { group: 'Windows', key: 'BorderlessMaximizedWindows', stock: STOCK.borderlessMaximizedWindows }
];
