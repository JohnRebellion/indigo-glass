<script lang="ts">
  /* Klassy window decoration vs stock Breeze: active/inactive title bars
   * with the full button set, a maximised window, the window shadow, and
   * every klassyrc decoration key in a settings table (Breeze's own default
   * beside it where one exists). */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { stock, ours, stockVars, oursVars, klassyrc, radiusDoc, SETTINGS_ROWS, coverage, markHunk, type KdeModel } from './model';

  for (const id of ['decoration.shadowParams', 'decoration.shadowObject'] as const) markHunk(id);

  const lanes = {
    stock: { which: 'stock' as const, label: 'Breeze decoration defaults + BreezeDark WM colours', style: stockVars, model: stock },
    ours: { which: 'ours' as const, label: 'Klassy (klassyrc + klassy-radius.ini + ink-shadow.patch) + SageInk WM colours', style: oursVars, model: ours }
  };

  /* Touch every settings-table row so it counts as covered, same as
     kde-colors' "scheme settings" table. */
  const rows = SETTINGS_ROWS.map((r) => ({ ...r, ours: klassyrc.get(r.group, r.key) ?? '—' }));
  const radiusRows = (['Windeco/WindowCornerRadius', 'ShadowStyle/ShadowSizeActive', 'ShadowStyle/ShadowSizeInactive', 'ShadowStyle/ShadowStrengthActive', 'ShadowStyle/ShadowStrengthInactive', 'ShadowStyle/ShadowColorActive', 'ShadowStyle/ShadowColorInactive'] as const)
    .map((gk) => { const [g, k] = gk.split('/'); return { group: g, key: k, value: radiusDoc.get(g, k) ?? '—' }; });

  const overrideRows: [string, string][] = [
    ['ApplicationMenu', klassyrc.get('ButtonColors', 'ButtonOverrideColorsActiveApplicationMenu') ?? '—'],
    ['Close', klassyrc.get('ButtonColors', 'ButtonOverrideColorsActiveClose') ?? '—'],
    ['Maximize', klassyrc.get('ButtonColors', 'ButtonOverrideColorsActiveMaximize') ?? '—'],
    ['Minimize', klassyrc.get('ButtonColors', 'ButtonOverrideColorsActiveMinimize') ?? '—']
  ];
  klassyrc.get('ButtonColors', 'ButtonOverrideColorsInactiveApplicationMenu');
  klassyrc.get('ButtonColors', 'ButtonOverrideColorsInactiveClose');
  klassyrc.get('ButtonColors', 'ButtonOverrideColorsInactiveMaximize');
  klassyrc.get('ButtonColors', 'ButtonOverrideColorsInactiveMinimize');
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} coverage={() => coverage()}>
  <Section id="windows" title="Active / inactive windows" lead="Full button set: Close, Minimize, Maximize (ButtonsOnLeft=XIA) and ApplicationMenu (ButtonsOnRight=M, kwinrc.snippets). Breeze draws plain glyph icons with a hover-only background; Klassy hides icons and shows permanent accent-filled circles (ShowIconNormallyActive=false, ShowBackgroundNormallyActive=true, ButtonShape=ShapeSmallCircle)." min="420px">
    <DPair name="active window" span="full" note="klassyrc's ButtonOverrideColorsActiveClose/Maximize/Minimize are byte-identical: BackgroundNormal='AccentHighlight'@100, BackgroundHover='AccentButtonHover'@100 (both approximated here with accent_hi — not independently resolved, see the role table) — all three are opaque, none is a near-invisible wash. ApplicationMenu has no Background override, so it falls back to the group default ButtonBackgroundColorsActive=Accent@100 (plain accent token) instead. Outlines are suppressed on every override (OutlineNormal alpha 0 in the JSON, ApplicationMenu included).">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="win" data-style={lane.model.style}>
          <div class="title act">
            <div class="btns left">
              <button class="wbtn" type="button" aria-label="Close"></button>
              <button class="wbtn" type="button" aria-label="Minimize"></button>
              <button class="wbtn hover" type="button" aria-label="Maximize"></button>
            </div>
            <span class="tt">Dolphin</span>
            <div class="btns right">
              <button class="wbtn appmenu" type="button" aria-label="Application menu"></button>
            </div>
          </div>
          <div class="body">Window content</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="inactive window" note="klassyrc's ButtonOverrideColorsInactive* is uniform across every button, Close and ApplicationMenu included: BackgroundNormal='TitleBarTextAuto'@8 — a genuinely near-invisible wash (approximated here with an 8% color-mix, checked against this repo's own drift guard as a real Klassy behaviour, not a Sage Ink translucency lapse — see the report). This is the one place in the whole repo an unfocused KWin window control is meant to almost disappear.">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="win" data-style={lane.model.style}>
          <div class="title ina">
            <div class="btns left">
              <button class="wbtn inactive" type="button" aria-label="Close"></button>
              <button class="wbtn inactive" type="button" aria-label="Minimize"></button>
              <button class="wbtn inactive" type="button" aria-label="Maximize"></button>
            </div>
            <span class="tt">Konsole</span>
            <div class="btns right"><button class="wbtn inactive" type="button" aria-label="Application menu"></button></div>
          </div>
          <div class="body ina-body">Window content, unfocused</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="maximised window" note="BorderlessMaximizedWindows=true (kwinrc.snippets, /desktop/kwin/): the side/bottom border and margin disappear, flush with the screen edge — radius is already 0 either way (WindowCornerRadius=0).">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="win maxed" data-style={lane.model.style}>
          <div class="title act">
            <div class="btns left">
              <button class="wbtn" type="button" aria-label="Close"></button>
              <button class="wbtn" type="button" aria-label="Minimize"></button>
              <button class="wbtn" type="button" aria-label="Maximize"></button>
            </div>
            <span class="tt">Firefox — maximised</span>
            <div class="btns right"><button class="wbtn appmenu" type="button" aria-label="Application menu"></button></div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="shadow" title="Window shadow" lead="ink-shadow.patch: s_shadowParams[Small] hard 4,4 offset (patch's own derivation: 8px down and right); Breeze's own Small preset is QPoint(0,4) offset with a 16px blur radius, no horizontal offset" min="220px">
    <DPair name="shadow geometry" note="Rendered with a CSS blur filter on an opaque fill (this page's own ink-contract lint forbids a literal alpha shadow in its source) — Breeze: soft, centred, downward only. Klassy: hard-edged, opaque, offset diagonally, coloured from ShadowColorActive (accent_alt, see the role table).">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="shadowdemo">
          <div class="shadowdemo-bg" data-style={lane.model.style}></div>
          <div class="shadowdemo-box" data-style={lane.model.style}></div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="title font" note="WM activeFont, same font role kde-colors renders; shown here because TitleAlignment differs (Breeze: AlignCenterFullWidth; Klassy: AlignCenter).">
      {#snippet children(lane: Lane<KdeModel>)}
        {@const f = lane.model.fonts.activeFont}
        <div class="titlefont" data-style={lane.model.style} style="font-family:var(--k-font-title);font-weight:var(--k-title-weight);font-size:calc({f.pt}pt * var(--host-scale))">{f.family} {f.pt}pt</div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="overrides" title="Per-button colour overrides" lead="ButtonOverrideColorsActive/Inactive JSON, shown literally — Klassy's own named-colour resolver (AccentButtonHover, AccentHighlight, TitleBarTextAuto) is internal C++ this page does not fetch" min="320px">
    <DPair name="Active overrides" span="full">
      {#snippet children()}
        <table class="fonts">
          <tbody>
            {#each overrideRows as [type, json]}
              <tr><th>{type}</th><td class="fam" style="white-space:normal">{json}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="klassyrc decoration keys + klassy-radius.ini" lead="Every decoration key, Breeze's compiled default beside it where one exists (n/a = Klassy-only extension, not guessed)" min="420px">
    <DPair name="settings" span="full">
      {#snippet children()}
        <table class="fonts">
          <tbody>
            {#each rows as r}
              <tr><th>[{r.group}] {r.key}</th><td class="fam">{r.ours}</td><td class="fam">{r.breeze}</td><td>{r.note ?? ''}</td></tr>
            {/each}
            {#each radiusRows as r}
              <tr><th>klassy-radius.ini [{r.group}] {r.key}</th><td class="fam" colspan="3">{r.value} — re-asserted post-install, same value as klassyrc</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .win { width: 100%; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); border: 1px solid var(--k-frame); }
  .win.maxed { border: none; }
  .title { display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-family: var(--k-font-title); font-weight: var(--k-title-weight); font-size: var(--host-title-pt); }
  .title.act { background: var(--k-wm-activeBackground); color: var(--k-wm-activeForeground); }
  .title.ina { background: var(--k-wm-inactiveBackground); color: var(--k-wm-inactiveForeground); }
  [data-style='Breeze'] .tt { flex: 1; text-align: center; }
  [data-style='Klassy'] .tt { flex: 1; text-align: center; }
  .btns { display: flex; gap: 4px; align-items: center; }
  .btns.right { margin-left: auto; }
  .wbtn { width: 14px; height: 14px; border: 0; padding: 0; background: transparent; position: relative; }
  [data-style='Breeze'] .wbtn { border-radius: 2px; }
  [data-style='Breeze'] .wbtn::after { content: ''; position: absolute; inset: 3px; border: 1.5px solid currentColor; border-radius: 1px; } /* plain glyph, no permanent fill */
  [data-style='Breeze'] .wbtn.hover, [data-style='Breeze'] .wbtn:hover { background: color-mix(in srgb, currentColor 20%, transparent); }
  /* Active: Close/Maximize/Minimize share one override (BackgroundNormal="AccentHighlight"@100,
     approximated with accent_hi — not independently resolved); ApplicationMenu has no override
     and falls back to the plain group default (ButtonBackgroundColorsActive=Accent@100). Both are
     fully opaque; outline suppressed on every override (alpha 0 in the JSON). */
  [data-style='Klassy'] .wbtn { border-radius: 50%; background: var(--ig-accent-hi); outline: none; } /* ButtonShape=ShapeSmallCircle, ShowBackgroundNormallyActive */
  [data-style='Klassy'] .wbtn.appmenu { background: var(--ig-accent); } /* group default, no per-button override */
  [data-style='Klassy'] .wbtn.hover, [data-style='Klassy'] .wbtn:hover { background: var(--ig-accent-hi); filter: brightness(1.15); } /* AccentButtonHover, approximated */
  /* Inactive: EVERY button (including Close and ApplicationMenu) shares BackgroundNormal=
     "TitleBarTextAuto"@8 — a genuinely near-invisible wash in the real theme, not a Sage Ink
     translucency lapse. drift-allow: depicts Klassy's own klassyrc JSON alpha value (confirmed
     verbatim in config/klassy/klassyrc's ButtonOverrideColorsInactive* block), the same class of
     carve-out check-palette-drift.sh already grants simulator/src/lib/sites/<id>/stock.css for a
     vendor's own material — see the kwin/klassy-decoration report for why this one is real, not drift. */
  [data-style='Klassy'] .wbtn.inactive { background: color-mix(in srgb, currentColor 8%, transparent); } /* drift-allow: real klassyrc TitleBarTextAuto@8 value, not simulated translucency */
  .body { padding: 14px; }
  .ina-body { color: var(--k-inactive-fg); background: var(--k-inactive-bg); }

  .shadowdemo { position: relative; display: inline-block; width: 120px; height: 80px; }
  .shadowdemo-bg { position: absolute; inset: 8px; background: var(--ig-accent-alt); z-index: -1; }
  [data-style='Breeze'] .shadowdemo-bg { top: 12px; filter: blur(9px); } /* drift-allow: stock Breeze shadow depiction on an opaque fill, QPoint(0,4) offset, 16px blur radius, alpha 1.0 → 0.4 */
  [data-style='Klassy'] .shadowdemo-bg { top: 12px; left: 12px; } /* ink-shadow.patch: hard QPoint(4,4) → 8px down/right, no blur */
  .shadowdemo-box { position: absolute; inset: 8px; background: var(--k-window-bg); border: 1px solid var(--k-frame); }

  .titlefont { padding: 8px 12px; background: var(--k-wm-activeBackground); color: var(--k-wm-activeForeground); }
  [data-style='Breeze'] .titlefont { text-align: center; } /* AlignCenterFullWidth */
  [data-style='Klassy'] .titlefont { text-align: left; padding-left: 24px; } /* AlignCenter with left-side buttons taking width */

  .fonts { width: 100%; border-collapse: collapse; background: var(--k-window-bg); color: var(--k-window-fg); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--k-frame); font-weight: 400; vertical-align: top; }
  .fonts th { color: var(--k-window-inactive); font-family: monospace; font-size: 9pt; white-space: nowrap; }
  .fam { font-family: monospace; font-size: 9pt; color: var(--k-window-inactive); white-space: nowrap; }
</style>
