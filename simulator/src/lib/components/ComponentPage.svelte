<script lang="ts">
  /* One /components/<id>/ page: the component drawn by every layer that has
   * it, stock beside Sage Ink, then the slot matrix read back off those
   * drawings. The matrix is the point of the page: stock layers each paint a
   * button their own way; the Sage Ink lanes should paint it from the same
   * tokens, and where a document states the rule (catalogue.ts), they must.
   * data-results carries the judged matrix for e2e/components.spec.ts. */
  import { onMount, tick } from 'svelte';
  import type { ComponentDef } from './catalogue';
  import { layersFor, layersWithout } from './registry';
  import { measure, judge, type LayerResult, type Readings } from './probe';
  import type { LaneName } from './layer';
  import { PALETTE, VARIANT } from '$lib/desktop/tokens';

  let { component }: { component: ComponentDef } = $props();

  const LANES: LaneName[] = ['stock', 'ours'];
  type ViewMode = 'split' | LaneName;
  let mode = $state<ViewMode>('split');
  /* svelte-ignore state_referenced_locally — a page mounts for one component */
  const entries = layersFor(component.id);
  /* svelte-ignore state_referenced_locally */
  const without = layersWithout(component.id);
  const lanesShown = $derived<LaneName[]>(mode === 'split' ? ['stock', 'ours'] : [mode]);

  let pageEl: HTMLElement;
  let results = $state<LayerResult[] | null>(null);

  onMount(async () => {
    await tick();
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const read = (id: string, lane: LaneName): Readings | null => {
      const root = pageEl.querySelector(`.lane-root[data-layer="${id}"][data-lane="${lane}"]`);
      return root ? measure(root, component) : null;
    };
    results = entries.map(({ layer }) => {
      const stock = read(layer.id, 'stock');
      const ours = read(layer.id, 'ours');
      if (!stock || !ours) throw new Error(`${layer.id}: lane root missing`);
      return judge(component, layer, stock, ours);
    });
  });

  const resultFor = (id: string) => results?.find((r) => r.layer === id);

  /* Per slot: how many distinct colours the layers paint, stock vs ours. */
  const agreement = $derived(
    results
      ? component.slots.map((s) => {
          const distinct = (lane: 'stock' | 'ours') =>
            new Set(results!.map((r) => r.cells.find((c) => c.slot === s.id)?.[lane]).filter(Boolean)).size;
          return { slot: s.id, label: s.label, stock: distinct('stock'), ours: distinct('ours') };
        })
      : []
  );
  const having = (v: string) => (results ? results.flatMap((r) => r.cells.filter((c) => c.verdict === v).map((c) => `${r.layer}.${c.slot}`)) : []);
  const failures = $derived(having('fail'));
  const known = $derived(having('known'));
  const chip = (hex: string | null) => (hex ? `background:${hex}` : '');
  const GLYPH: Record<string, string> = { ok: 'ok', observed: '·', fail: 'FAIL', known: 'gap', exception: 'exc', skip: 'n/a' };
</script>

<svelte:head><title>Sage Ink — {component.name} across layers</title></svelte:head>

{#each entries as { layer }}
  {#each LANES as lane}
    {#if layer.lanes[lane].css}{@html `<style data-layer-css="${layer.id}-${lane}">${layer.lanes[lane].css}</style>`}{/if}
  {/each}
{/each}

<div
  class="cpage"
  bind:this={pageEl}
  data-testid="component-page-{component.id}"
  data-ready={results ? 'true' : 'false'}
  data-results={results ? JSON.stringify(results) : ''}
  data-absent={JSON.stringify(without.map((w) => ({ layer: w.layer.id, why: w.why })))}
>
  <header class="hero">
    <div>
      <h1>{component.name} <span class="sub">across {entries.length} layers</span></h1>
      <p class="lead">{component.lead} Each row is one theming layer, drawn from its stock file (left) and its shipped Sage Ink file (right) through the same markup; the matrix below is read back off those drawings with <code>getComputedStyle</code>.</p>
    </div>
    <div class="controls">
      <div class="seg" role="radiogroup" aria-label="View" data-testid="view-toggle">
        {#each [['split', 'Both'], ['stock', 'Stock'], ['ours', 'Sage Ink']] as [m, l]}
          <button type="button" role="radio" aria-checked={mode === m} class:on={mode === m}
            data-testid="view-{m}" onclick={() => (mode = m as ViewMode)}>{l}</button>
        {/each}
      </div>
      <p class="sub">Variant <code>{VARIANT}</code>. Layers without a {component.name.toLowerCase()}: {without.length ? without.map((w) => w.layer.name).join(', ') : 'none'}.</p>
    </div>
  </header>

  {#each entries as { layer, Specimen }}
    {@const use = layer.components[component.id] ?? {}}
    <figure class="lpair" data-testid="layer-{layer.id}">
      <figcaption>
        <strong>{layer.name}</strong>
        <span class="fam">{layer.family}</span>
        <span class="files">{#each layer.shipped as f, i}{i ? ', ' : ''}<code>{f}</code>{/each}</span>
      </figcaption>
      <div class="lanes" style="grid-template-columns:repeat({lanesShown.length}, 1fr)">
        {#each lanesShown as lane (lane)}
          {@const def = layer.lanes[lane]}
          <div class="lane">
            <div class="lane-tag">{lane === 'stock' ? 'Stock' : 'Sage Ink'} — {def.label}</div>
            <div class="lane-root {def.rootClass ?? ''}" data-layer={layer.id} data-lane={lane} {...def.rootAttrs} style={def.style ?? ''}>
              {#if Specimen}
                {#if layer.wrap}
                  <svelte:element this={layer.wrap.tag} {...layer.wrap.attrs} class="wrap-root {layer.wrap.attrs?.class ?? ''}">
                    <Specimen component={component.id} {lane} />
                  </svelte:element>
                {:else}
                  <Specimen component={component.id} {lane} />
                {/if}
              {:else}
                <p class="err">{layer.id} has no Specimen.svelte</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      <div class="lnotes">
        <p><span class="k">Stock</span> {layer.stockSource}</p>
        <p><span class="k">Fidelity</span> {layer.fidelity}</p>
        {#if use.note}<p><span class="k">Note</span> {use.note}</p>{/if}
        {#each use.skip ?? [] as s}<p class="skip"><span class="k">n/a</span> <code>{s.slot}</code> — {s.why}</p>{/each}
        {#each use.exceptions ?? [] as e}<p class="exc"><span class="k">Exception</span> <code>{e.slot}</code> — {e.why}</p>{/each}
        {#each use.known ?? [] as e}<p class="gap"><span class="k">Known gap</span> <code>{e.slot}</code> — {e.why}</p>{/each}
      </div>
    </figure>
  {/each}

  <section class="checks">
    <h2>Slots <span class="sub">Sage Ink lane, read off the drawings above; stock value underneath</span></h2>
    {#if !results}
      <p>measuring…</p>
    {:else}
      <div class="scroll">
        <table class="matrix" data-testid="matrix">
          <thead>
            <tr><th>Slot</th><th>Contract</th>{#each entries as { layer }}<th>{layer.name}</th>{/each}</tr>
          </thead>
          <tbody>
            {#each component.slots as s}
              <tr data-testid="slot-{s.id}">
                <th>{s.label}</th>
                <td class="contract">
                  {#if !s.expect}<em>observed</em>
                  {:else if 'token' in s.expect}<code>{s.expect.token}</code> <span class="chip" style={chip(PALETTE[s.expect.token])}></span>
                  {:else if 'oneOf' in s.expect}{s.expect.oneOf.join(' | ')}
                  {:else}same as <code>{s.expect.sameAs}</code>{/if}
                </td>
                {#each entries as { layer }}
                  {@const c = resultFor(layer.id)?.cells.find((x) => x.slot === s.id)}
                  <td class="cell v-{c?.verdict}" title={c?.why || (c?.expect ? c.expect.source : '')} data-testid="cell-{layer.id}-{s.id}">
                    {#if c}
                      <div><span class="chip" style={chip(c.ours)}></span>{c.tokens[0] ?? c.ours ?? '—'}{c.how === 'model' ? '*' : ''} <b>{GLYPH[c.verdict]}</b></div>
                      <div class="stock"><span class="chip" style={chip(c.stock)}></span>{c.stock ?? '—'}</div>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="sub">* value read from the layer's parsed model (an SVG tile or canvas the browser cannot report through CSS), not off the DOM. Hover a cell for the contract source or the failure.</p>
      {#if failures.length}
        <p class="bad" data-testid="failures">{failures.length} slot(s) break a documented rule: {failures.join(', ')}</p>
      {:else if !known.length}
        <p data-testid="all-ok">Every slot in every Sage Ink lane is an opaque palette token, and every documented contract holds or carries a stated exception.</p>
      {/if}
      {#if known.length}
        <p class="bad" data-testid="known-gaps">{known.length} known gap(s) in shipped files, each explained in its layer's notes above: {known.join(', ')}</p>
      {/if}

      <h2>Agreement <span class="sub">distinct colours painted across the {entries.length} layers</span></h2>
      <table class="agree" data-testid="agreement">
        <thead><tr><th>Slot</th><th>Stock</th><th>Sage Ink</th></tr></thead>
        <tbody>
          {#each agreement as a}
            <tr><th>{a.label}</th><td>{a.stock}</td><td class:one={a.ours === 1}>{a.ours}</td></tr>
          {/each}
        </tbody>
      </table>

      <h2>Contrast <span class="sub">Sage Ink lane</span></h2>
      <table class="agree" data-testid="contrast">
        <thead><tr><th>Layer</th><th>Pair</th><th>fg / bg</th><th>Ratio</th><th>Floor</th></tr></thead>
        <tbody>
          {#each results as r}
            {#each r.contrast as p}
              <tr class:bad={p.ok === false}>
                <td>{r.layer}</td><td>{p.name}</td>
                <td><span class="chip" style={chip(p.fg)}></span><span class="chip" style={chip(p.bg)}></span>{p.fg ?? '—'} / {p.bg ?? '—'}</td>
                <td>{p.ratio === null ? 'n/a' : `${p.ratio}:1`}</td><td>{p.min}:1</td>
              </tr>
            {/each}
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</div>

<style>
  .cpage { padding: 16px 20px 48px; max-width: 1400px; margin: 0 auto; }
  .hero { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; margin-bottom: 18px; }
  h1 { margin: 0 0 6px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: 22pt; letter-spacing: -0.01em; }
  .lead { margin: 0; color: var(--ig-text-muted); max-width: 90ch; font-size: 10.5pt; }
  code { font-family: "Iosevka Custom Condensed", monospace; }
  .sub { color: var(--ig-text-muted); font-weight: 400; font-size: 9pt; }
  .controls { display: flex; flex-direction: column; gap: 8px; }
  .seg { display: grid; grid-template-columns: repeat(3, 1fr); border: 2px solid var(--ig-border-strong); }
  .seg button { background: var(--ig-surface); color: var(--ig-text-muted); border: 0; padding: 5px 0; font: inherit; font-size: 9.5pt; cursor: pointer; }
  .seg button + button { border-left: 2px solid var(--ig-border-strong); }
  .seg button.on { color: var(--ig-text); outline: 2px solid var(--ig-text); outline-offset: -4px; }
  .lpair { margin: 0 0 16px; background: var(--ig-surface); border: var(--ig-border-hairline) solid var(--ig-border); min-width: 0; }
  figcaption { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; padding: 5px 8px; border-bottom: var(--ig-border-hairline) solid var(--ig-border); font-size: 10pt; }
  .fam { font-family: "Iosevka Custom Condensed", monospace; text-transform: uppercase; font-size: 8.5pt; color: var(--ig-text-muted); letter-spacing: 0.06em; }
  .files { color: var(--ig-text-muted); font-size: 8.5pt; }
  .lanes { display: grid; }
  .lane { min-width: 0; display: flex; flex-direction: column; }
  .lane + .lane { border-left: var(--ig-border-hairline) solid var(--ig-border); }
  .lane-tag { padding: 2px 8px; font-family: "Iosevka Custom Condensed", monospace; font-size: 8pt; color: var(--ig-text-muted); border-bottom: var(--ig-border-hairline) solid var(--ig-border); }
  /* Stands in for the desktop / page behind the specimen. Paints only what
     the layer's lane style gives it; room right/bottom for 4px ink shadows. */
  .lane-root {
    flex: 1;
    min-width: 0;
    padding: 14px 20px 20px 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
    background: var(--desk-bg, transparent);
    font-family: var(--desk-font, "Carlito", sans-serif);
    font-size: 11pt;
    line-height: 1.35;
  }
  .lane-root :global(.wrap-root) { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 12px; width: 100%; min-width: 0; }
  .lnotes { padding: 4px 8px 6px; border-top: var(--ig-border-hairline) solid var(--ig-border); font-size: 8.5pt; color: var(--ig-text-muted); }
  .lnotes p { margin: 1px 0; }
  .k { display: inline-block; min-width: 64px; font-family: "Iosevka Custom Condensed", monospace; text-transform: uppercase; font-size: 8pt; }
  .exc { color: var(--ig-amber); }
  .err { color: var(--ig-negative); }
  .checks { margin-top: 32px; padding-top: 10px; border-top: 2px solid var(--ig-border-strong); font-size: 9.5pt; }
  .checks h2 { margin: 18px 0 6px; font-size: var(--ig-section-pt); font-family: "SF Pro Display", system-ui, sans-serif; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; }
  .matrix { width: 100%; }
  th, td { text-align: left; padding: 3px 8px; border-bottom: 1px solid var(--ig-border); vertical-align: top; }
  th { color: var(--ig-text-muted); font-weight: 500; }
  td { font-family: "Iosevka Custom Condensed", monospace; }
  .cell .stock { color: var(--ig-text-muted); font-size: 8pt; }
  .cell b { font-weight: 400; font-size: 8pt; margin-left: 4px; }
  .v-fail, .v-known, .gap { color: var(--ig-negative); }
  .v-exception { color: var(--ig-amber); }
  .v-skip { color: var(--ig-text-muted); }
  .one { color: var(--ig-positive); }
  tr.bad td, .bad { color: var(--ig-negative); }
  .chip { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border: 1px solid var(--ig-border-strong); vertical-align: -1px; }
</style>
