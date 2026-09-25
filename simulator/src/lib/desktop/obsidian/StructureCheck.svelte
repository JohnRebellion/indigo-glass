<script lang="ts">
  /* Renders the scanStructure() result for one page's "ours" lane. Runs after
   * mount, same as DesktopPage's own coverage() call, so every specimen has
   * painted first. See structure.ts for what's checked and why this exists
   * (desktop.spec.ts does not check CSS structure the way sites.spec.ts does). */
  import { onMount } from 'svelte';
  import { scanStructure } from './structure';

  let { selector = '[data-lane="ours"]' }: { selector?: string } = $props();
  let violations = $state<string[] | null>(null);
  onMount(() => { violations = scanStructure(document, selector); });
</script>

<div class="structure" data-testid="structure">
  <h2>Structure <span class="sub">Sage Ink contract, scanned live on the Sage Ink lane</span></h2>
  {#if violations === null}
    <p>scanning…</p>
  {:else if violations.length === 0}
    <p data-testid="structure-ok">
      No structural violations: radius stays on the ladder (0 / 2px / full pill), no blur or backdrop-filter, <!-- drift-allow: pass message names the checks, isn't a style rule -->
      no gradients, shadows are opaque and hard-edged, control borders are at least 2px.
    </p>
  {:else}
    <p>{violations.length} structural violation{violations.length === 1 ? '' : 's'} on the Sage Ink lane:</p>
    <ul class="violations" data-testid="structure-violations">
      {#each violations as v}<li><code>{v}</code></li>{/each}
    </ul>
  {/if}
</div>

<style>
  .structure { margin-top: 24px; }
  .structure h2 { margin: 0 0 6px; font-size: var(--ig-section-pt); font-family: "SF Pro Display", system-ui, sans-serif; }
  .sub { color: var(--ig-text-muted); font-weight: 400; font-size: 9pt; }
  .violations { display: flex; flex-direction: column; gap: 4px; list-style: none; padding: 0; margin: 6px 0 0; }
  .violations li { border: 1px solid var(--ig-negative); color: var(--ig-negative); padding: 2px 8px; font-size: 9pt; width: fit-content; }
  code { font-family: "Iosevka Custom Condensed", monospace; }
</style>
