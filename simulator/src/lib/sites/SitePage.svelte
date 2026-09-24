<script lang="ts">
  /* Shell of one /sites/<id>/ page: header with the file's own metadata, the
   * two-lane legend, the specimen sections, and a coverage footer that lists
   * every selector token in the .user.css with no element on this page.
   *
   * The Stylus file is injected LAST in the document, scoped to the "ours"
   * lane roots, so where a rule of ours carries no `!important` it still wins
   * the source-order tie against the stock stylesheet — the same order Stylus
   * gives it on the live site (user styles load after the page's own). */
  import { setContext, onMount } from 'svelte';
  import { laneRootClass, type Site } from './registry';
  import { scopeStylus, selectorInventory, missingFromDom, readMeta } from './scopedStylus';

  let { site, children }: { site: Site; children: import('svelte').Snippet } = $props();
  setContext('site', site);

  /* svelte-ignore state_referenced_locally — a page is mounted for one site
     and remounted for another; these never need to track a changing prop. */
  const version = readMeta(site.css, 'version') ?? '?';
  const oursCss = scopeStylus(site.css, `.${laneRootClass(site)}[data-lane="ours"]`);
  const ignored = new Set((site.ignore ?? []).map((i) => i.token));
  const inventory = selectorInventory(site.css).filter((t) => !ignored.has(t));

  let pageEl: HTMLElement;
  let missing = $state<string[] | null>(null);
  onMount(() => {
    missing = missingFromDom(pageEl, '[data-lane="stock"]', inventory);
  });
</script>

<svelte:head><title>Sage Ink — {site.name} stock vs ours</title></svelte:head>

<div class="site-page" bind:this={pageEl} data-testid="site-page-{site.id}" data-alt={site.hue.alt}>
  <header class="hero">
    <div>
      <h1>{site.name} <span class="domain">{site.domain}</span></h1>
      <p class="lead">
        Every element <code>browser/stylus/sites/{site.file}</code> (v{version}) names, in the site's
        own markup and token vocabulary. Left lane: the site's stock dark values. Right lane: the same
        markup with the shipped Stylus file applied, scoped to that lane. Nothing on the right is
        styled by anything but that file.
      </p>
      <dl class="facts">
        <div><dt>Stock source</dt><dd>{site.stockSource}</dd></div>
        <div><dt>Hue</dt><dd>{site.hue.source} — {site.hue.deg}°</dd></div>
        <div><dt>Ink ladder</dt><dd>
          <span class="chip" style="background:{site.hue.hi}"></span>{site.hue.hi}
          <span class="chip" style="background:{site.hue.mid}"></span>{site.hue.mid}
          <span class="chip" style="background:{site.hue.alt}"></span>{site.hue.alt}
        </dd></div>
      </dl>
    </div>
    <div class="legend" aria-label="Lanes">
      <div class="legend-lane"><strong>Stock</strong><span>the site's own dark theme</span></div>
      <div class="legend-lane"><strong>Sage Ink</strong><span>{site.file} v{version}</span></div>
    </div>
  </header>

  {@render children()}

  <section class="coverage" id="coverage" data-testid="coverage">
    <h2>Coverage</h2>
    {#if missing === null}
      <p>measuring…</p>
    {:else if missing.length === 0}
      <p data-testid="coverage-ok">
        All {inventory.length} selector tokens in {site.file} have an element on this page.
      </p>
      {#if site.ignore?.length}
        <ul class="ignored">
          {#each site.ignore as i}<li><code>{i.token}</code> — {i.why}</li>{/each}
        </ul>
      {/if}
    {:else}
      <p>
        {missing.length} of {inventory.length} selector tokens in {site.file} have <strong>no element</strong>
        on this page — rules the right lane cannot demonstrate:
      </p>
      <ul class="missing" data-testid="coverage-missing">
        {#each missing as tok}<li><code>{tok}</code></li>{/each}
      </ul>
    {/if}
  </section>

  {@html `<style data-ours="${site.id}">${oursCss}</style>`}
</div>

<style>
  .site-page { padding: 16px 20px 48px; max-width: 1400px; margin: 0 auto; }
  .hero { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
  h1 { margin: 0 0 6px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: 22pt; letter-spacing: -0.01em; }
  .domain { color: var(--ig-text-muted); font-weight: 400; font-size: 12pt; margin-left: 8px; }
  .lead { margin: 0 0 10px; color: var(--ig-text-muted); max-width: 80ch; font-size: 10.5pt; }
  .lead code { color: var(--ig-text); font-family: "Iosevka Custom Condensed", monospace; }
  .facts { display: grid; grid-template-columns: auto 1fr; gap: 2px 14px; margin: 0; font-size: 9.5pt; }
  .facts div { display: contents; }
  .facts dt { color: var(--ig-text-muted); }
  .facts dd { margin: 0; font-family: "Iosevka Custom Condensed", monospace; }
  .chip { display: inline-block; width: 10px; height: 10px; margin: 0 4px 0 10px; border: 1px solid var(--ig-border-strong); vertical-align: -1px; }
  .chip:first-child { margin-left: 0; }
  .legend { display: grid; grid-template-columns: 1fr 1fr; border: var(--ig-border-default) solid var(--ig-border-strong); }
  .legend-lane { padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; font-size: 9.5pt; }
  .legend-lane + .legend-lane { border-left: var(--ig-border-default) solid var(--ig-border-strong); }
  .legend-lane span { color: var(--ig-text-muted); font-family: "Iosevka Custom Condensed", monospace; }
  .coverage { margin-top: 40px; padding-top: 10px; border-top: var(--ig-border-default) solid var(--ig-border-strong); font-size: 10pt; }
  .coverage h2 { margin: 0 0 6px; font-size: var(--ig-section-pt); font-family: "SF Pro Display", system-ui, sans-serif; }
  .missing { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
  .ignored { margin: 6px 0 0; padding-left: 18px; color: var(--ig-text-muted); font-size: 9pt; }
  .ignored code { font-family: "Iosevka Custom Condensed", monospace; color: var(--ig-text); }
  .missing li { border: 1px solid var(--ig-amber); color: var(--ig-amber); padding: 0 6px; font-family: "Iosevka Custom Condensed", monospace; font-size: 9pt; }
</style>
