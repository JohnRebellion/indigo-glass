<script lang="ts">
  /* A titled band of specimens. `columns` sets the minimum cell width so a
   * dense section (buttons) and a wide one (tables) can share one page. */
  let {
    id,
    title,
    lead = '',
    min = '260px',
    children
  }: {
    id: string;
    title: string;
    lead?: string;
    min?: string;
    children: import('svelte').Snippet;
  } = $props();
</script>

<section class="sect" {id} data-testid="section-{id}">
  <header class="sect-head">
    <h2>{title}</h2>
    {#if lead}<p>{lead}</p>{/if}
  </header>
  <div class="sect-grid" style="--min:{min}">
    {@render children()}
  </div>
</section>

<style>
  .sect { margin-top: 32px; }
  .sect-head {
    display: flex;
    align-items: baseline;
    gap: var(--ig-gap-lg);
    padding-bottom: 6px;
    margin-bottom: 10px;
    border-bottom: var(--ig-border-default) solid var(--ig-border-strong);
  }
  .sect-head h2 {
    margin: 0;
    font-family: "SF Pro Display", system-ui, sans-serif;
    font-size: var(--ig-section-pt);
    font-weight: var(--ig-weight-heading);
    letter-spacing: -0.01em;
  }
  .sect-head p {
    margin: 0;
    color: var(--ig-text-muted);
    font-size: var(--ig-caption-pt);
  }
  .sect-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
    gap: var(--ig-gap-md);
    align-items: start;
  }
</style>
