<script lang="ts">
  import { onMount } from 'svelte';
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';
  import { readVar, toHex, contrast } from '../liveTokens';

  /* The reference's own eight-variable schema (src/styling/globals.css).
     `ref` is the value the reference ships in its .dark block, so a reviewer
     can see the mapping and the divergence side by side without leaving the
     screenshot. */
  /* `on` names the pairing each ratio is measured across, because a bare
     number against an implicit background is the kind of a11y claim that
     reads as rigour and means nothing. `null` = nothing meaningful to rate. */
  const schema = [
    { v: '--background',           ref: 'oklch(29.12% .0633 270.86)', role: 'Page fill',                on: ['--foreground', '--background'] },
    { v: '--secondary-background', ref: 'oklch(23.93% 0 0)',          role: 'Lifted control / input fill', on: ['--foreground', '--secondary-background'] },
    { v: '--foreground',           ref: 'oklch(92.49% 0 0)',          role: 'Body text',                on: ['--foreground', '--background'] },
    { v: '--main',                 ref: 'oklch(67.47% .1725 259.61)', role: 'The one accent — fill only', on: ['--main-foreground', '--main'] },
    { v: '--main-foreground',      ref: 'oklch(0% 0 0)',              role: 'Text ON the accent fill',  on: ['--main-foreground', '--main'] },
    { v: '--border',               ref: 'oklch(0% 0 0)',              role: 'Every 2px stroke',         on: ['--border', '--background'] },
    { v: '--ring',                 ref: 'oklch(100% 0 0)',            role: 'Focus outline',            on: ['--ring', '--background'] },
    { v: '--overlay',              ref: 'oklch(0% 0 0 / .8)',         role: 'Modal scrim (Tier A alpha)', on: null }
  ] as const;

  /* Surfaces are rated as "can text survive here"; accent + semantic fills as
     "can the dark on-fill text survive"; text tokens against the page. */
  const palette = [
    { v: '--ig-base',          role: 'base — page',               on: ['--ig-text', '--ig-base'] },
    { v: '--ig-surface',       role: 'surface — window',          on: ['--ig-text', '--ig-surface'] },
    { v: '--ig-surface-alt',   role: 'surface_alt — elevated',    on: ['--ig-text', '--ig-surface-alt'] },
    { v: '--ig-sidebar',       role: 'sidebar',                   on: ['--ig-text', '--ig-sidebar'] },
    { v: '--ig-accent',        role: 'accent — sage',             on: ['--ig-base', '--ig-accent'] },
    { v: '--ig-accent-hi',     role: 'accent_hi — hover',         on: ['--ig-base', '--ig-accent-hi'] },
    { v: '--ig-accent-alt',    role: 'accent_alt — shadow',       on: ['--ig-base', '--ig-accent-alt'] },
    { v: '--ig-amber',         role: 'warning',                   on: ['--ig-base', '--ig-amber'] },
    { v: '--ig-positive',      role: 'success',                   on: ['--ig-base', '--ig-positive'] },
    { v: '--ig-negative',      role: 'error',                     on: ['--ig-text', '--ig-negative'] },
    { v: '--ig-text',          role: 'text',                      on: ['--ig-text', '--ig-base'] },
    { v: '--ig-text-muted',    role: 'text_muted',                on: ['--ig-text-muted', '--ig-base'] },
    { v: '--ig-text-dim',      role: 'text_dim',                  on: ['--ig-text-dim', '--ig-base'] },
    { v: '--ig-border',        role: 'border — hairline',         on: ['--ig-border', '--ig-base'] },
    { v: '--ig-border-strong', role: 'border_strong — 2px stroke', on: ['--ig-border-strong', '--ig-base'] }
  ] as const;

  const charts = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-active-dot'];

  const typeScale = [
    { v: '--ig-type-xs-pt',   step: '-2', use: 'tooltip, shortcut' },
    { v: '--ig-type-sm-pt',   step: '-1', use: 'caption, smallest' },
    { v: '--ig-type-md-pt',   step: ' 0', use: 'body — anchor' },
    { v: '--ig-type-lg-pt',   step: '+1', use: 'heading' },
    { v: '--ig-type-xl-pt',   step: '+2', use: 'section' },
    { v: '--ig-type-xxl-pt',  step: '+3', use: 'display' },
    { v: '--ig-type-hero-pt', step: '+4', use: 'hero only' }
  ];

  const shadows = [
    { v: '--ig-shadow-ink',       label: 'ink' },
    { v: '--ig-shadow-ink-lg',    label: 'ink_lg' },
    { v: '--ig-shadow-ink-press', label: 'ink_press' },
    { v: '--ig-shadow-hairline',  label: 'hairline' },
    { v: '--ig-shadow-none',      label: 'none' }
  ];

  const spacing = [
    '--ig-pad-xs', '--ig-pad-sm', '--ig-pad-md', '--ig-pad-lg', '--ig-pad-xl',
    '--ig-gap-xs', '--ig-gap-sm', '--ig-gap-md', '--ig-gap-lg', '--ig-gap-xl'
  ];

  const motion = [
    '--ig-dur-instant', '--ig-dur-quick', '--ig-dur-default', '--ig-dur-slow', '--ig-dur-hero'
  ];

  const easings = [
    { v: '--ig-ease-standard',   use: 'hover, focus' },
    { v: '--ig-ease-emphasize',  use: 'panel open, state draw' },
    { v: '--ig-ease-mechanical', use: 'ink press — a stamp, not a spring' },
    { v: '--ig-ease-spring',     use: 'deprecated (neu_press)' }
  ];

  /* Resolved at mount so every label is the live token, never a copy. */
  let root = $state<HTMLElement | null>(null);
  let hex = $state<Record<string, string>>({});
  let raw = $state<Record<string, string>>({});
  let ratio = $state<Record<string, number | null>>({});

  onMount(() => {
    const scope = root;
    const nextHex: Record<string, string> = {};
    const nextRaw: Record<string, string> = {};
    const nextRatio: Record<string, number | null> = {};

    // --nb/--main/... live on .nb-root; --ig-* live on :root.
    const read = (v: string) => readVar(v, v.startsWith('--ig-') ? null : scope);

    for (const entry of [...schema, ...palette]) {
      const value = read(entry.v);
      nextRaw[entry.v] = value;
      nextHex[entry.v] = toHex(value);
      nextRatio[entry.v] = entry.on ? contrast(read(entry.on[0]), read(entry.on[1])) : null;
    }
    for (const v of charts) {
      const value = read(v);
      nextRaw[v] = value;
      nextHex[v] = toHex(value);
    }
    for (const v of [...typeScale.map((t) => t.v), ...spacing, ...motion,
                     ...easings.map((e) => e.v), ...shadows.map((sh) => sh.v),
                     '--ig-radius-default', '--ig-radius-xs', '--ig-radius-full',
                     '--ig-border-default', '--ig-border-hairline',
                     '--ig-weight-base', '--ig-weight-heading',
                     '--ig-lh-tight', '--ig-lh-default', '--ig-lh-prose']) {
      nextRaw[v] = readVar(v);
    }

    hex = nextHex;
    raw = nextRaw;
    ratio = nextRatio;
  });

  const fmt = (n: number | null | undefined) => (n == null ? '—' : `${n.toFixed(2)}:1`);
  const grade = (n: number | null | undefined) =>
    n == null ? '' : n >= 7 ? 'AAA' : n >= 4.5 ? 'AA' : n >= 3 ? 'AA-lg' : 'fail';
</script>

<div bind:this={root} class="nb-root styling-scope">

<Section id="schema" title="Styling — reference variable schema"
  lead="the eight variables neobrutalism.dev's customizer emits, bound to Sage Ink tokens" min="330px">
  <Specimen name="colors / schema" span="full" variant="divergence"
    note="--border and --shadow are the two real divergences. The reference paints both pure black; on a #07080A page a black stroke and a black drop shadow are invisible, so border lifts to border_strong and the shadow takes the variant's accent_alt.">
    <table class="tk">
      <thead><tr><th>variable</th><th>Sage Ink</th><th>hex</th><th>reference (.dark)</th><th>role</th><th>contrast</th></tr></thead>
      <tbody>
        {#each schema as s}
          <tr>
            <td class="mono">{s.v}</td>
            <td><span class="chip" style="background:var({s.v})"></span><span class="mono dim">{raw[s.v] ?? ''}</span></td>
            <td class="mono">{hex[s.v] ?? ''}</td>
            <td class="mono dim">{s.ref}</td>
            <td>{s.role}</td>
            <td class="mono">
              {#if s.on}{fmt(ratio[s.v])} <span class="grade">{grade(ratio[s.v])}</span>
                <br /><span class="dim">{s.on[0].replace('--', '')} on {s.on[1].replace('--', '')}</span>
              {:else}<span class="dim">n/a — alpha</span>{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Specimen>

  <Specimen name="colors / full palette" span="full"
    note="Sage Ink ships one accent hue per variant; accent_hi and accent_alt are lightness shifts of it, not separate colours. Fill ratings are text-on-fill; text ratings are text-on-base.">
    <div class="swatches">
      {#each palette as p}
        <div class="sw">
          <div class="sw-chip" style="background:var({p.v})"></div>
          <div class="sw-meta">
            <span class="mono">{hex[p.v] ?? ''}</span>
            <span class="dim">{p.role}</span>
            <span class="mono">{fmt(ratio[p.v])} <span class="grade">{grade(ratio[p.v])}</span></span>
            <span class="mono dim">{p.on[0].replace('--ig-', '')} on {p.on[1].replace('--ig-', '')}</span>
          </div>
        </div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="chart" variant="divergence"
    note="Reference chart-1..5 are its own blue/red/yellow/green/violet. Sage Ink re-hues slot 1 to the accent and slot 4 to `positive` (#3FFABB, nudged to hue 165 so it never reads as sage).">
    <div class="swatches tight">
      {#each charts as c}
        <div class="sw">
          <div class="sw-chip sm" style="background:var({c})"></div>
          <div class="sw-meta">
            <span class="mono">{c.replace('--chart-', '')}</span>
            <span class="mono dim">{hex[c] ?? ''}</span>
          </div>
        </div>
      {/each}
    </div>
  </Specimen>
</Section>

<Section id="typography" title="Styling — typography" lead="minor-third scale, two weights, three families" min="300px">
  <Specimen name="type scale" span={2}
    note="ratio 1.2, anchored at body = 11pt. Sizes are pt, not px — the same scale drives Konsole, Klassy and GTK, which are all pt-native.">
    <div class="scale">
      {#each typeScale as t}
        <div class="scale-row">
          <span class="mono dim">{t.step}</span>
          <span class="mono">{raw[t.v] ?? ''}</span>
          <span style="font-size:var({t.v})">Sage Ink</span>
          <span class="dim">{t.use}</span>
        </div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="font weight"
    note="Exactly two weights, matching the reference's base=500 / heading=700. No 400 and no 600 anywhere in the system.">
    <div class="stack">
      <p style="font-weight:var(--ig-weight-base);margin:0">base — {raw['--ig-weight-base'] ?? ''} — body, controls, labels</p>
      <p style="font-weight:var(--ig-weight-heading);margin:0">heading — {raw['--ig-weight-heading'] ?? ''} — titles, buttons, badges</p>
    </div>
  </Specimen>

  <Specimen name="font family" variant="extends"
    note="The reference ships no font tokens at all (it inherits the docs site's sans). Sage Ink pins three families so the web layer matches Konsole and Plasma chrome.">
    <div class="stack">
      <p style="font-family:var(--nb-font-prose);margin:0">Carlito — prose, humanist, loop-tail g</p>
      <p style="font-family:var(--nb-font-chrome);margin:0">SF Pro Display — chrome, geometric</p>
      <p style="font-family:var(--nb-font-mono);margin:0">Iosevka Custom Condensed — mono 0O1lI</p>
    </div>
  </Specimen>

  <Specimen name="line height">
    <div class="stack">
      {#each [['tight', '--ig-lh-tight'], ['default', '--ig-lh-default'], ['prose', '--ig-lh-prose']] as [label, v]}
        <div style="line-height:var({v})">
          <span class="mono dim">{label} {raw[v] ?? ''}</span><br />
          Opaque flat ink. No blur, no gradient, no translucent glass anywhere in the material.
        </div>
      {/each}
    </div>
  </Specimen>
</Section>

<Section id="material" title="Styling — material" lead="shadow, radius, border, spacing, motion" min="280px">
  <Specimen name="shadow" span={2} variant="divergence"
    note="One depth cue, and it is hard: zero blur radius everywhere. A non-zero blur fails scripts/check-palette-drift.sh --material. Reference geometry is identical (4px 4px 0 0); only the colour differs.">
    <div class="shadow-row">
      {#each shadows as s}
        <div class="shadow-cell">
          <div class="shadow-box" style="box-shadow:var({s.v})"></div>
          <span class="mono">{s.label}</span>
          <span class="mono dim">{raw[s.v] ?? ''}</span>
        </div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="border radius" variant="divergence"
    note="Reference --border-radius is 5px. Sage Ink's ladder is deliberately two-ended: 0 for every material surface, full for circles and the pill CTA, with xs=2 as the single soft step, for tags only.">
    <div class="radius-row">
      {#each [['default', '--ig-radius-default'], ['xs', '--ig-radius-xs'], ['full', '--ig-radius-full']] as [label, v]}
        <div class="radius-cell">
          <div class="radius-box" style="border-radius:var({v})"></div>
          <span class="mono">{label}</span>
          <span class="mono dim">{raw[v] ?? ''}</span>
        </div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="border width"
    note="2px is the canonical stroke on anything bordered or shadowed; 1px hairline is for quiet dividers and is never paired with an ink shadow.">
    <div class="radius-row">
      {#each [['default', '--ig-border-default'], ['hairline', '--ig-border-hairline']] as [label, v]}
        <div class="radius-cell">
          <div class="radius-box" style="border-width:var({v})"></div>
          <span class="mono">{label} {raw[v] ?? ''}</span>
        </div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="spacing" span={2}
    note="Sage Ink's spacing ladder is compact by design (Linear/Raycast density). The reference uses Tailwind's default 4px scale untouched.">
    <div class="space-row">
      {#each spacing as sp}
        <div class="space-cell">
          <div class="space-bar" style="width:var({sp});height:var({sp})"></div>
          <span class="mono dim">{sp.replace('--ig-', '')}</span>
          <span class="mono">{raw[sp] ?? ''}</span>
        </div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="motion" span={2} variant="extends"
    note="The reference has no motion tokens; it uses Tailwind's transition-all default. Hover the button to see the mechanical press — 60ms on steps(2, end), the object travelling into its own shadow.">
    <div class="motion-grid">
      <div class="stack">
        {#each motion as m}
          <div class="mono"><span class="dim">{m.replace('--ig-dur-', '')}</span> {raw[m] ?? ''}</div>
        {/each}
      </div>
      <div class="stack">
        {#each easings as e}
          <div class="mono"><span class="dim">{e.v.replace('--ig-ease-', '')}</span> {raw[e.v] ?? ''}<br /><span class="dim">{e.use}</span></div>
        {/each}
      </div>
      <div class="stack">
        <button class="nb-button nb-button--default" type="button">hover me</button>
        <span class="dim">press = translate by the shadow offset, shadow collapses to 0 0 0 0</span>
      </div>
    </div>
  </Specimen>

  <Specimen name="state grammar" span={2} variant="extends"
    note="Sage Ink's own rule, not the reference's: fill means identity (a badge is always filled), outline means state (a selected row gets a stroke, never a wash). The reference fills on-select states — see the divergence ledger.">
    <div class="grammar">
      <div>
        <span class="mono dim">Tier D — identity fill</span>
        <div class="row"><span class="nb-badge nb-badge--default">badge</span><span class="nb-badge nb-badge--neutral">neutral</span><span class="nb-badge nb-badge--neutral nb-badge--tag">tag</span></div>
      </div>
      <div>
        <span class="mono dim">Tier C — on-select outline</span>
        <div class="rows">
          <div class="grow">row — idle</div>
          <div class="grow" data-active>row — selected (outline)</div>
          <div class="grow">row — idle</div>
        </div>
      </div>
      <div>
        <span class="mono dim">Tier A — content alpha (exempt)</span>
        <p class="sel-demo">A selection wash paints <span class="selection-wash">running content</span>, so it stays alpha by definition.</p>
      </div>
    </div>
  </Specimen>
</Section>
</div>

<style>
  .styling-scope :global(.mono) {
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    font-size: var(--ig-type-xs-pt);
  }
  .styling-scope :global(.dim) { color: var(--ig-text-muted); }

  .tk { width: 100%; border-collapse: collapse; font-size: var(--ig-type-xs-pt); }
  .tk th {
    text-align: left;
    padding: 2px 8px 4px 0;
    color: var(--ig-text-muted);
    font-weight: var(--ig-weight-base);
    border-bottom: 1px solid var(--ig-border);
  }
  .tk td { padding: 3px 8px 3px 0; vertical-align: middle; border-bottom: 1px solid var(--ig-border); }
  .chip {
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 6px;
    vertical-align: -3px;
    border: 1px solid var(--ig-border-strong);
  }
  .grade { color: var(--ig-text-muted); }

  .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: var(--ig-gap-sm); width: 100%; }
  .swatches.tight { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .sw { display: flex; align-items: center; gap: var(--ig-gap-md); }
  .sw-chip { width: 34px; height: 34px; flex-shrink: 0; border: 1px solid var(--ig-border-strong); }
  .sw-chip.sm { width: 22px; height: 22px; }
  .sw-meta { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
  .sw-meta span { font-size: var(--ig-type-xs-pt); white-space: nowrap; }

  .scale { display: grid; gap: 2px; width: 100%; }
  .scale-row { display: grid; grid-template-columns: 32px 52px 1fr 140px; align-items: baseline; gap: var(--ig-gap-md); }

  .stack { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ig-gap-md); font-size: var(--ig-caption-pt); }

  .shadow-row, .radius-row, .space-row { display: flex; flex-wrap: wrap; gap: var(--ig-gap-xl); }
  .shadow-cell, .radius-cell, .space-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .shadow-box, .radius-box {
    width: 56px;
    height: 40px;
    background: var(--ig-accent);
    border: var(--ig-border-default) solid var(--ig-border-strong);
  }
  .radius-box { background: var(--ig-surface-alt); border-style: solid; }
  .space-bar { background: var(--ig-accent); min-width: 2px; min-height: 2px; }
  .space-cell { min-width: 54px; }

  .motion-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--ig-gap-xl); width: 100%; }

  .grammar { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--ig-gap-xl); width: 100%; }
  .row { display: flex; gap: var(--ig-gap-md); margin-top: 6px; }
  .rows { display: grid; gap: 2px; margin-top: 6px; }
  .grow {
    padding: 3px 8px;
    font-size: var(--ig-caption-pt);
    border: var(--ig-border-default) solid transparent;
    color: var(--ig-text-muted);
  }
  .grow[data-active] { border-color: var(--ig-text); color: var(--ig-text); }
  .sel-demo { margin: 6px 0 0; font-size: var(--ig-caption-pt); }
  /* Tier A: a selection wash IS the medium — the one place alpha is correct. */
  .selection-wash { background: rgba(166, 201, 166, 0.45); }
</style>
