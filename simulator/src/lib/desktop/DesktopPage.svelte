<script lang="ts" module>
  import type { Lane } from './surface';
  export type ViewMode = 'split' | 'stock' | 'ours';
  export type DesktopCtx<M = unknown> = {
    lanes: { stock: Lane<M>; ours: Lane<M> };
    view: { mode: ViewMode; hostStyle: string };
  };
</script>

<script lang="ts" generics="M">
  /* Shell of one /desktop/<id>/ page: what ships, where stock comes from, how
   * far the simulator can be trusted for this layer, the specimens, then the
   * three checks — roles against the token palette, contrast of the pairs the
   * layer paints, and coverage of the shipped file. The machine-readable
   * copies (data-roles, data-contrast) are what e2e/desktop.spec.ts asserts. */
  import { setContext, onMount } from 'svelte';
  import { PALETTE, VARIANT, contrast as ratio, normHex } from './tokens';
  import { HOSTS, hostVars } from './hosts';
  import type { SurfaceMeta, Role, ContrastPair, Coverage } from './surface';

  let {
    meta,
    lanes,
    roles,
    contrast = [],
    coverage,
    children
  }: {
    meta: SurfaceMeta;
    lanes: { stock: Lane<M>; ours: Lane<M> };
    roles: Role[];
    contrast?: ContrastPair[];
    /* Called after mount, once every specimen has rendered (and so read
       every key it is going to read). */
    coverage: () => Coverage;
    children: import('svelte').Snippet;
  } = $props();

  let hostId = $state(HOSTS[0].id);
  const view = $state({ mode: 'split' as ViewMode, hostStyle: hostVars(HOSTS[0]) });
  $effect(() => { view.hostStyle = hostVars(HOSTS.find((h) => h.id === hostId) ?? HOSTS[0]); });
  /* svelte-ignore state_referenced_locally — lanes are fixed per mount */
  setContext<DesktopCtx<M>>('desktop', { lanes, view });

  /* svelte-ignore state_referenced_locally */
  const roleRows = roles.map((r) => {
    const want = r.token ? PALETTE[r.token] : undefined;
    const got = normHex(r.ours);
    return { ...r, got, want, ok: r.token === null ? null : got === want };
  });
  /* svelte-ignore state_referenced_locally */
  const pairRows = contrast.map((p) => {
    const v = ratio(normHex(p.fg).slice(0, 7), normHex(p.bg).slice(0, 7));
    return { ...p, ratio: Math.round(v * 100) / 100, ok: v >= p.min };
  });

  let cov = $state<Coverage | null>(null);
  onMount(() => { cov = coverage(); });
</script>

<svelte:head><title>Sage Ink — {meta.name} stock vs ours</title></svelte:head>

<div
  class="dpage"
  data-testid="desktop-page-{meta.id}"
  data-roles={JSON.stringify(roleRows)}
  data-contrast={JSON.stringify(pairRows)}
>
  <header class="hero">
    <div>
      <h1>{meta.name} <span class="grp">{meta.group}</span></h1>
      <dl class="facts">
        <div><dt>Ships</dt><dd>{#each meta.shipped as f, i}{i ? ', ' : ''}<code>{f.path}</code>{f.generated ? ' (generated)' : ''}{/each}</dd></div>
        <div><dt>Stock</dt><dd>{meta.stockSource}</dd></div>
        <div><dt>Fidelity</dt><dd><span class="fid fid-{meta.fidelity}">{meta.fidelity}</span> {meta.fidelityWhy}</dd></div>
        <div><dt>Live check</dt><dd>{meta.live}</dd></div>
      </dl>
    </div>
    <div class="controls">
      <div class="seg" role="radiogroup" aria-label="View" data-testid="view-toggle">
        {#each [['split', 'Both'], ['stock', 'Stock'], ['ours', 'Sage Ink']] as [m, l]}
          <button type="button" role="radio" aria-checked={view.mode === m} class:on={view.mode === m}
            data-testid="view-{m}" onclick={() => (view.mode = m as ViewMode)}>{l}</button>
        {/each}
      </div>
      <label class="host">Host
        <select bind:value={hostId} data-testid="host-select">
          {#each HOSTS as h}<option value={h.id}>{h.name} ({h.scale}x)</option>{/each}
        </select>
      </label>
      <div class="legend" aria-label="Lanes">
        <div><strong>Stock</strong><span>{lanes.stock.label}</span></div>
        <div><strong>Sage Ink</strong><span>{lanes.ours.label}</span></div>
      </div>
    </div>
  </header>

  {@render children()}

  <section class="checks">
    <div>
      <h2>Roles vs tokens <span class="sub">variant {VARIANT}</span></h2>
      <table data-testid="roles">
        <thead><tr><th>Role</th><th>Token</th><th>Sage Ink lane</th><th>Stock lane</th><th></th></tr></thead>
        <tbody>
          {#each roleRows as r}
            <tr class:bad={r.ok === false} data-testid="role-{r.role}">
              <td>{r.role}</td>
              <td>{#if r.token}<code>{r.token}</code> <span class="chip" style="background:{r.want}"></span>{r.want}{:else}<em>not a token</em>{/if}</td>
              <td><span class="chip" style="background:{r.got}"></span>{r.got}</td>
              <td>{#if r.stock}<span class="chip" style="background:{normHex(r.stock)}"></span>{normHex(r.stock)}{/if}</td>
              <td>{r.ok === null ? '·' : r.ok ? 'ok' : 'DRIFT'}{r.note ? ` — ${r.note}` : ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if pairRows.length}
      <div>
        <h2>Contrast <span class="sub">Sage Ink lane</span></h2>
        <table data-testid="contrast">
          <thead><tr><th>Pair</th><th>fg / bg</th><th>Ratio</th><th>Floor</th></tr></thead>
          <tbody>
            {#each pairRows as p}
              <tr class:bad={!p.ok}>
                <td>{p.name}</td>
                <td><span class="chip" style="background:{p.fg}"></span><span class="chip" style="background:{p.bg}"></span>{normHex(p.fg)} / {normHex(p.bg)}</td>
                <td>{p.ratio}:1</td><td>{p.min}:1</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    <div data-testid="coverage">
      <h2>Coverage</h2>
      {#if cov === null}
        <p>measuring…</p>
      {:else if cov.missing.length === 0}
        <p data-testid="coverage-ok">All {cov.total} settings in the shipped files are rendered on this page.</p>
      {:else}
        <p>{cov.missing.length} of {cov.total} shipped settings are <strong>not rendered</strong>:</p>
        <ul class="missing" data-testid="coverage-missing">{#each cov.missing as k}<li><code>{k}</code></li>{/each}</ul>
      {/if}
      {#if cov?.ignored?.length}
        <ul class="ignored">{#each cov.ignored as i}<li><code>{i.token}</code> — {i.why}</li>{/each}</ul>
      {/if}
    </div>
  </section>
</div>

<style>
  .dpage { padding: 16px 20px 48px; max-width: 1400px; margin: 0 auto; }
  .hero { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
  h1 { margin: 0 0 8px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: 22pt; letter-spacing: -0.01em; }
  .grp { color: var(--ig-text-muted); font-weight: 400; font-size: 11pt; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
  .facts { display: grid; grid-template-columns: auto 1fr; gap: 3px 14px; margin: 0; font-size: 9.5pt; }
  .facts div { display: contents; }
  .facts dt { color: var(--ig-text-muted); }
  .facts dd { margin: 0; max-width: 90ch; }
  code { font-family: "Iosevka Custom Condensed", monospace; }
  .fid { display: inline-block; padding: 0 6px; border: 2px solid var(--ig-border-strong); font-family: "Iosevka Custom Condensed", monospace; text-transform: uppercase; font-size: 8.5pt; }
  .fid-high { border-color: var(--ig-positive); color: var(--ig-positive); }
  .fid-medium { border-color: var(--ig-amber); color: var(--ig-amber); }
  .fid-low { border-color: var(--ig-negative); color: var(--ig-negative); }
  .controls { display: flex; flex-direction: column; gap: 8px; }
  .seg { display: grid; grid-template-columns: repeat(3, 1fr); border: 2px solid var(--ig-border-strong); }
  .seg button { background: var(--ig-surface); color: var(--ig-text-muted); border: 0; padding: 5px 0; font: inherit; font-size: 9.5pt; cursor: pointer; }
  .seg button + button { border-left: 2px solid var(--ig-border-strong); }
  .seg button.on { color: var(--ig-text); outline: 2px solid var(--ig-text); outline-offset: -4px; }
  .host { display: flex; gap: 8px; align-items: center; font-size: 9.5pt; color: var(--ig-text-muted); }
  .host select { flex: 1; background: var(--ig-surface); color: var(--ig-text); border: 2px solid var(--ig-border-strong); padding: 3px 4px; font: inherit; }
  .legend { display: grid; grid-template-columns: 1fr 1fr; border: 2px solid var(--ig-border-strong); }
  .legend div { padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; font-size: 9pt; }
  .legend div + div { border-left: 2px solid var(--ig-border-strong); }
  .legend span { color: var(--ig-text-muted); font-family: "Iosevka Custom Condensed", monospace; }
  .checks { margin-top: 40px; padding-top: 10px; border-top: 2px solid var(--ig-border-strong); display: grid; gap: 24px; font-size: 9.5pt; }
  .checks h2 { margin: 0 0 6px; font-size: var(--ig-section-pt); font-family: "SF Pro Display", system-ui, sans-serif; }
  .sub { color: var(--ig-text-muted); font-weight: 400; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 3px 8px; border-bottom: 1px solid var(--ig-border); font-family: "Iosevka Custom Condensed", monospace; }
  th { color: var(--ig-text-muted); font-weight: 500; font-family: inherit; }
  tr.bad td { color: var(--ig-negative); }
  .chip { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border: 1px solid var(--ig-border-strong); vertical-align: -1px; }
  .missing { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
  .missing li { border: 1px solid var(--ig-amber); color: var(--ig-amber); padding: 0 6px; font-size: 9pt; }
  .ignored { margin: 6px 0 0; padding-left: 18px; color: var(--ig-text-muted); font-size: 9pt; }
</style>
