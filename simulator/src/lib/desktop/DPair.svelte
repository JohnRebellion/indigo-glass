<script lang="ts" generics="M">
  /* One desktop specimen, rendered once per lane from the same snippet. The
   * snippet receives the lane — its parsed model and CSS custom properties —
   * so the only thing that can differ between the two renders is the file the
   * lane was parsed from. Page view mode (split / stock / ours) hides lanes. */
  import { getContext } from 'svelte';
  import type { Lane } from './surface';
  import type { DesktopCtx } from './DesktopPage.svelte';

  let {
    name,
    note = '',
    span = 1,
    children
  }: {
    name: string;
    note?: string;
    span?: number | 'full';
    children: import('svelte').Snippet<[Lane<M>]>;
  } = $props();

  const ctx = getContext<DesktopCtx<M>>('desktop');
  const shown = $derived(
    ctx.view.mode === 'split' ? [ctx.lanes.stock, ctx.lanes.ours] : [ctx.lanes[ctx.view.mode]]
  );
</script>

<figure class="dpair" style="--span:{span}" data-span={span === 'full' ? 'full' : null} data-testid="pair-{name}">
  <figcaption class="dpair-label"><span>{name}</span></figcaption>
  <div class="lanes" style="grid-template-columns:repeat({shown.length}, 1fr)">
    {#each shown as lane (lane.which)}
      <div class="lane">
        <div class="lane-root" data-lane={lane.which} style="{lane.style};{ctx.view.hostStyle}">
          {@render children(lane)}
        </div>
      </div>
    {/each}
  </div>
  {#if note}<p class="dpair-note">{note}</p>{/if}
</figure>

<style>
  .dpair {
    display: flex;
    flex-direction: column;
    margin: 0;
    background: var(--ig-surface);
    border: var(--ig-border-hairline) solid var(--ig-border);
    border-radius: var(--ig-radius-default);
    grid-column: span var(--span);
    min-width: 0;
  }
  .dpair[data-span='full'] { grid-column: 1 / -1; }
  .dpair-label {
    padding: 3px 8px;
    border-bottom: var(--ig-border-hairline) solid var(--ig-border);
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    font-size: var(--ig-type-xs-pt);
    letter-spacing: 0.04em;
    color: var(--ig-text-muted);
    text-transform: uppercase;
  }
  .lanes { display: grid; flex: 1; }
  .lane { min-width: 0; display: flex; }
  .lane + .lane { border-left: var(--ig-border-hairline) solid var(--ig-border); }
  /* The lane root stands in for the desktop behind the specimen. It paints
     nothing itself: each specimen sets its own window/panel background from
     the lane's variables. Right/bottom room for 4px ink shadows. */
  .lane-root {
    flex: 1;
    min-width: 0;
    padding: 14px 20px 20px 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
    background: var(--desk-bg, #000);
    font-family: var(--desk-font, "Carlito", sans-serif);
    font-size: var(--host-body-pt, 11pt);
    line-height: 1.35;
  }
  .dpair-note {
    margin: 0;
    padding: 4px 8px 6px;
    border-top: var(--ig-border-hairline) solid var(--ig-border);
    color: var(--ig-text-muted);
    font-size: var(--ig-type-xs-pt);
    line-height: var(--ig-lh-default);
  }
</style>
