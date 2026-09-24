<script lang="ts">
  /* One specimen, rendered twice: the site's stock markup in the left lane,
   * the same markup under the scoped Stylus file in the right. The children
   * snippet is the ONLY copy of the markup — there is no way for the two
   * lanes to drift apart except through the stylesheet under review. */
  import { getContext } from 'svelte';
  import { laneRootClass, type Site } from './registry';

  let {
    name,
    note = '',
    span = 1,
    wrap = true,
    children
  }: {
    /* The site's own name for the element (Primer, Codex, Fluent...) so a
       reviewer can find it in the site's DOM. */
    name: string;
    note?: string;
    span?: number | 'full';
    /* false for the shell specimen (it is the app root) and for overlays,
       which the live site renders outside the app root. */
    wrap?: boolean;
    children: import('svelte').Snippet;
  } = $props();

  const site = getContext<Site>('site');
  const rootClass = `${laneRootClass(site)} ${site.rootClass ?? ''}`.trim();
  const wrapEl = wrap && site.wrap ? site.wrap : null;
</script>

{#snippet lane(which: 'stock' | 'ours')}
  <div class="site-root {rootClass}" {...site.rootAttrs} data-lane={which}>
    {#if wrapEl}
      <svelte:element this={wrapEl.tag} {...wrapEl.attrs} class="wrap-root {wrapEl.attrs?.class ?? ''}">
        {@render children()}
      </svelte:element>
    {:else}
      {@render children()}
    {/if}
  </div>
{/snippet}

<figure
  class="pair"
  style="--span:{span}"
  data-span={span === 'full' ? 'full' : null}
  data-testid="pair-{name}"
>
  <figcaption class="pair-label"><span>{name}</span></figcaption>
  <div class="lanes">
    <div class="lane">{@render lane('stock')}</div>
    <div class="lane">{@render lane('ours')}</div>
  </div>
  {#if note}<p class="pair-note">{note}</p>{/if}
</figure>

<style>
  .pair {
    display: flex;
    flex-direction: column;
    margin: 0;
    background: var(--ig-surface);
    border: var(--ig-border-hairline) solid var(--ig-border);
    border-radius: var(--ig-radius-default);
    break-inside: avoid;
    grid-column: span var(--span);
    min-width: 0;
  }
  .pair[data-span='full'] { grid-column: 1 / -1; }
  .pair-label {
    padding: 3px 8px;
    border-bottom: var(--ig-border-hairline) solid var(--ig-border);
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    font-size: var(--ig-type-xs-pt);
    letter-spacing: 0.04em;
    color: var(--ig-text-muted);
    text-transform: uppercase;
  }
  .lanes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
  }
  .lane { min-width: 0; display: flex; }
  .lane + .lane { border-left: var(--ig-border-hairline) solid var(--ig-border); }
  /* The lane root is the stand-in for the site's <html>: it paints the page
     background the site's own stylesheet gives it, and everything inside
     inherits from it, not from the simulator shell. Extra right/bottom room
     for the 4px ink shadows. */
  .site-root {
    flex: 1;
    min-width: 0;
    padding: 14px 20px 20px 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
    font-family: -apple-system, system-ui, "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }
  /* The wrapper is the app root, not a layout: same wrapping row as the lane. */
  .wrap-root { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 10px; width: 100%; min-width: 0; }
  .pair-note {
    margin: 0;
    padding: 4px 8px 6px;
    border-top: var(--ig-border-hairline) solid var(--ig-border);
    color: var(--ig-text-muted);
    font-size: var(--ig-type-xs-pt);
    line-height: var(--ig-lh-default);
  }
</style>
