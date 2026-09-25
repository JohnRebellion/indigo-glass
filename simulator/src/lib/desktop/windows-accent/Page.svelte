<script lang="ts">
  /* Windows 11 accent + dark mode: windows/registry/indigo-glass-accent.reg.
   * No Windows host to render against (see index.ts's meta.live) -- every
   * specimen here is a hand-built CSS approximation of Fluent controls, not
   * a Win32/UWP capture. What IS exact is the registry decode itself (see
   * model.ts's header comment on the 0xAABBGGRR byte order) and the roles/
   * contrast checks, which compare real decoded values, not approximations. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import type { Lane, Coverage } from '../surface';
  import { ours, stock, laneVars, pickOnAccentText, type AccentModel } from './model';
  import { meta, roles, contrast } from './index';

  type View = { accent: string; dark: boolean; colorPrevalence: boolean; onAccent: string };
  function toView(m: AccentModel): View {
    const accent = m.accentColor?.hex ?? '#0078D4'; // drift-allow: Windows 11's own documented default accent fallback (see model.ts STOCK_NOTE), not a Sage Ink token
    return { accent, dark: m.appsUseLightTheme === false, colorPrevalence: !!m.colorPrevalence, onAccent: pickOnAccentText(accent) };
  }

  const lanes = {
    stock: { which: 'stock' as const, label: 'Windows 11 default (no customization)', style: laneVars(stock), model: toView(stock) },
    ours: { which: 'ours' as const, label: 'indigo-glass-accent.reg', style: laneVars(ours), model: toView(ours) }
  };

  let toggleOn = $state(true);

  /* Every section/key the shipped .reg actually sets, enumerated straight
   * off the parsed model rather than a hand-typed list -- so this table
   * (and coverage()) can never silently drop a key the way jetbrains'
   * hand-typed ATTR_KEYS list once did (fixed 2026-09-25, see that
   * surface's model.ts). */
  const rows = Object.entries(ours.raw.sections).flatMap(([section, kv]) =>
    Object.keys(kv).map((key) => ({ section, key }))
  );
  const rawValue = (m: AccentModel, section: string, key: string): string => m.raw.sections[section]?.[key] ?? '(not set)';

  const coverage = (): Coverage => ({ total: rows.length, missing: [], ignored: [] });
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="titlebar" title="Title bar: active vs inactive" lead="ColorPrevalence gates whether the ACTIVE title bar is accent-filled; the inactive title bar stays neutral either way -- a real Windows behaviour, not a page simplification." min="220px">
    <DPair name="windows" span="full">
      {#snippet children(lane: Lane<View>)}
        <div class="wa-stack" style="background:var(--wa-window-bg)">
          <div class="wa-title active" style={lane.model.colorPrevalence ? `background:${lane.model.accent};color:${lane.model.onAccent}` : 'background:var(--wa-window-bg);color:var(--wa-window-fg)'}>
            <span class="wa-dot"></span> Active window
          </div>
          <div class="wa-title inactive" style="background:var(--wa-inactive-title);color:var(--wa-inactive-fg)">
            <span class="wa-dot"></span> Inactive window
          </div>
          <p class="wa-note">ColorPrevalence: <code>{lane.model.colorPrevalence}</code></p>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="controls" title="Toggle + primary button" lead="AccentColor fills a WinUI ToggleSwitch's on-state track and a primary/accent button, independent of ColorPrevalence." min="180px">
    <DPair name="fluent controls" span="full">
      {#snippet children(lane: Lane<View>)}
        <div class="wa-controls" style="background:var(--wa-window-bg);color:var(--wa-window-fg)">
          <button class="wa-toggle" class:on={toggleOn} style={toggleOn ? `background:${lane.model.accent}` : ''} onclick={() => (toggleOn = !toggleOn)} aria-pressed={toggleOn} aria-label="Toggle switch demo">
            <span class="wa-thumb" style={toggleOn ? `background:${lane.model.onAccent}` : ''}></span>
          </button>
          <button class="wa-primary" style="background:{lane.model.accent};color:{lane.model.onAccent}">Primary button</button>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="raw" title="Every registry value the .reg sets" lead="All 15 keys across [DWM], [Control Panel\Desktop], [...Themes\Personalize] and [...Explorer\Accent], literally." min="420px">
    <DPair name="raw values" span="full">
      {#snippet children(lane: Lane<View>)}
        {@const m = lane.which === 'ours' ? ours : stock}
        <table class="fonts">
          <tbody>
            {#each rows as { section, key }}
              <tr><th>[{section.split('\\').pop()}] {key}</th><td class="fam">{rawValue(m, section, key)}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .wa-stack { width: 100%; padding: 10px; font-family: "Segoe UI", "Inter", sans-serif; }
  .wa-title { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 10.5pt; margin-bottom: 6px; }
  .wa-dot { width: 10px; height: 10px; border-radius: 50%; background: currentColor; opacity: 0.5; }
  .wa-note { margin: 6px 0 0; font-size: 9pt; opacity: 0.7; }
  .wa-controls { width: 100%; padding: 16px; display: flex; align-items: center; gap: 20px; font-family: "Segoe UI", "Inter", sans-serif; }
  .wa-toggle { width: 44px; height: 22px; flex-shrink: 0; border-radius: 11px; border: 2px solid currentColor; background: transparent; padding: 2px; cursor: pointer; display: flex; align-items: center; }
  .wa-toggle.on { border-color: transparent; justify-content: flex-end; }
  .wa-thumb { width: 16px; height: 16px; border-radius: 50%; background: currentColor; display: block; }
  .wa-primary { border: none; border-radius: 4px; padding: 8px 18px; font-size: 10pt; cursor: pointer; }
  .fonts { width: 100%; border-collapse: collapse; background: var(--wa-window-bg); color: var(--wa-window-fg); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--wa-inactive-title); font-weight: 400; }
  .fonts th { font-family: monospace; font-size: 9pt; white-space: nowrap; opacity: 0.7; }
  .fam { font-family: monospace; font-size: 9pt; }
</style>
