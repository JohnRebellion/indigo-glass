<script lang="ts">
  /* Single-page audit surface: every neobrutalism.dev component and every
   * styling page, rendered in Sage Ink tokens, laid out so one full-page
   * screenshot is a complete review artefact.
   *
   * Reference: ekmas/neobrutalism-components (registry.json, 44 components +
   * combobox + data-table). Component styling is in ../../lib/nb/nb-core.css
   * and nb-surfaces.css — those two files ARE the implementation under
   * review; everything here is markup over them.
   *
   * Everything that would normally be behind an interaction (dialogs, menus,
   * tooltips, open selects, hover and focus states) is rendered in-flow and
   * forced open, because a screenshot cannot hover.
   */
  import '$lib/nb/nb-core.css';
  import '$lib/nb/nb-surfaces.css';
  import Styling from '$lib/nb/sections/Styling.svelte';
  import Buttons from '$lib/nb/sections/Buttons.svelte';
  import Forms from '$lib/nb/sections/Forms.svelte';
  import DataDisplay from '$lib/nb/sections/DataDisplay.svelte';
  import Navigation from '$lib/nb/sections/Navigation.svelte';
  import Overlays from '$lib/nb/sections/Overlays.svelte';
  import EdgeAudit from '$lib/nb/sections/EdgeAudit.svelte';
  import Ledger from '$lib/nb/sections/Ledger.svelte';

  const contents = [
    { id: 'schema',     label: 'Variable schema' },
    { id: 'typography', label: 'Typography' },
    { id: 'material',   label: 'Material' },
    { id: 'buttons',    label: 'Button' },
    { id: 'forms',      label: 'Form controls' },
    { id: 'data',       label: 'Data display' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'overlays',   label: 'Overlays' },
    { id: 'edges',      label: 'Self-audit' },
    { id: 'ledger',     label: 'Divergence ledger' }
  ];
</script>

<svelte:head><title>Sage Ink — neobrutalism.dev implementation</title></svelte:head>

<div class="nb-page" data-testid="neobrutalism-page">
  <header class="hero">
    <div class="hero-main">
      <h1>Sage Ink &times; neobrutalism.dev</h1>
      <p class="lead">
        Every component in <code>ekmas/neobrutalism-components</code> and every styling page,
        rendered in Sage Ink tokens on one page. Interactive states are forced open so a
        still capture shows what a pointer would.
      </p>
      <dl class="facts">
        <div><dt>Reference</dt><dd>ekmas/neobrutalism-components &mdash; registry.json, 44 components</dd></div>
        <div><dt>Tokens</dt><dd>tokens/indigo-glass.tokens.toml &rarr; tokens/out/css-vars.css (variant: sage)</dd></div>
        <div><dt>Bridge</dt><dd>simulator/src/lib/nb/nb-core.css + nb-surfaces.css</dd></div>
        <div><dt>Material</dt><dd>opaque fills, zero-blur shadow, colour-as-elevation &mdash; no glass anywhere</dd></div>
      </dl>
    </div>

    <aside class="brief" data-testid="review-brief">
      <h2>Review brief</h2>
      <p>This page exists to be handed to a second model. Answer in this order:</p>
      <ol>
        <li><strong>Fidelity.</strong> Where does a component fail to match the reference in a way the divergence ledger does <em>not</em> already claim as deliberate? Those are bugs.</li>
        <li><strong>Adjudication.</strong> Work the ledger's open questions. Take a position; do not restate the trade-off.</li>
        <li><strong>Coherence.</strong> Does the set read as one system, or as a reference implementation with a palette swapped in?</li>
        <li><strong>Contradiction.</strong> Two entries in the ledger record the system disagreeing with itself (shadow colour, press trigger). Say which side should win.</li>
      </ol>
      <p class="brief-foot">Cite components by the label on each cell.</p>
      <p class="boundary">
        <strong>Simulation boundary.</strong> Overlays are rendered in flow and
        forced open so a still capture can show them. Their
        <em>positioning, collision handling and stacking are therefore not
        under test</em> — only fill, stroke, shadow, radius and typography are.
        A cell marked <em>accommodation</em> is a surface the reference ships
        no styling for, so it is not fidelity evidence at all.
      </p>
    </aside>
  </header>

  <nav class="toc" aria-label="Contents">
    {#each contents as c}<a href="#{c.id}">{c.label}</a>{/each}
  </nav>

  <Styling />
  <Buttons />
  <Forms />
  <DataDisplay />
  <Navigation />
  <Overlays />
  <EdgeAudit />
  <Ledger />
</div>

<style>
  .nb-page {
    max-width: 1560px;
    margin: 0 auto;
    padding: 20px 16px 64px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr);
    gap: var(--ig-gap-xl);
    align-items: start;
  }
  .hero h1 {
    margin: 0 0 6px;
    font-family: "SF Pro Display", system-ui, sans-serif;
    font-size: var(--ig-type-hero-pt);
    font-weight: var(--ig-weight-heading);
    letter-spacing: -0.02em;
  }
  .lead { margin: 0 0 12px; max-width: 62ch; font-size: var(--ig-caption-pt); color: var(--ig-text-muted); }
  .lead code { font-family: "Iosevka Custom Condensed", monospace; color: var(--ig-text); }

  .facts { display: grid; gap: 2px; margin: 0; font-size: var(--ig-type-xs-pt); }
  .facts div { display: grid; grid-template-columns: 90px 1fr; gap: var(--ig-gap-md); }
  .facts dt { color: var(--ig-text-dim); }
  .facts dd { margin: 0; color: var(--ig-text-muted); font-family: "Iosevka Custom Condensed", monospace; }

  .brief {
    background: var(--ig-surface-alt);
    border: var(--ig-border-default) solid var(--ig-border-strong);
    box-shadow: var(--ig-shadow-ink);
    padding: 12px 16px;
    font-size: var(--ig-type-xs-pt);
    line-height: var(--ig-lh-default);
  }
  .brief h2 {
    margin: 0 0 6px;
    font-size: var(--ig-caption-pt);
    font-weight: var(--ig-weight-heading);
  }
  .brief p { margin: 0 0 6px; color: var(--ig-text-muted); }
  .brief ol { margin: 0; padding-left: 18px; display: grid; gap: 4px; }
  .brief li { color: var(--ig-text-muted); }
  .brief strong { color: var(--ig-text); }
  .brief-foot { margin-top: 8px !important; color: var(--ig-text-dim) !important; }
  .boundary {
    margin: 8px 0 0;
    padding-top: 8px;
    border-top: var(--ig-border-hairline) solid var(--ig-border);
    color: var(--ig-text-muted);
  }
  .boundary strong { color: var(--ig-amber); }
  .boundary em { font-style: normal; color: var(--ig-text); }

  .toc {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ig-gap-md);
    margin-top: 20px;
    padding-top: 10px;
    border-top: var(--ig-border-hairline) solid var(--ig-border);
    font-family: "Iosevka Custom Condensed", monospace;
    font-size: var(--ig-type-xs-pt);
  }
  .toc a {
    color: var(--ig-text-muted);
    border: 1px solid var(--ig-border-strong);
    padding: 2px 8px;
  }
  .toc a:hover { color: var(--ig-text); border-color: var(--ig-accent); }
</style>
