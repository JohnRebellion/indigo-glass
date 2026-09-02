<script lang="ts">
  /* One labelled component cell.
   *
   * `name` is the reference's own component name (registry.json `name`), so a
   * reviewer can map every cell back to neobrutalism.dev 1:1. `note` explains
   * a deliberate Sage Ink divergence; `variant="diverges"` marks the cell so
   * the divergences are findable in a screenshot without reading every note. */
  let {
    name,
    note = '',
    variant = 'equivalent',
    span = 1,
    children
  }: {
    name: string;
    note?: string;
    /* Four distinct claims, because "match" previously compressed three of
       them and overstated fidelity — the tooltip was labelled a match while
       its type size differed from the reference.
         equivalent    — the reference's own rules, re-expressed
         divergence    — knowingly different; there is a ledger row for it
         accommodation — the reference ships no styling here (behaviour-only
                         wrapper or a third-party library), so this surface
                         was invented and proves nothing about fidelity
         extends       — Sage Ink adds something the reference has no concept of */
    variant?: 'equivalent' | 'divergence' | 'accommodation' | 'extends';
    /* Columns to occupy in the parent Section grid. 'full' clamps to the row
       width, which is what a table or the ledger needs; most specimens want
       1 or 2, and giving everything a full row is what made the first draft
       of this page 13 000px tall. */
    span?: number | 'full';
    children: import('svelte').Snippet;
  } = $props();
</script>

<figure
  class="spec"
  style="--span:{span}"
  data-span={span === 'full' ? 'full' : null}
  data-variant={variant}
  data-testid="spec-{name}"
>
  <figcaption class="spec-label">
    <span class="spec-name">{name}</span>
    {#if variant !== 'equivalent'}
      <span class="spec-flag">{variant}</span>
    {/if}
  </figcaption>
  <div class="spec-body nb-root">
    {@render children()}
  </div>
  {#if note}
    <p class="spec-note">{note}</p>
  {/if}
</figure>

<style>
  .spec {
    display: flex;
    flex-direction: column;
    margin: 0;
    background: var(--ig-surface);
    border: var(--ig-border-hairline) solid var(--ig-border);
    border-radius: var(--ig-radius-default);
    break-inside: avoid;
  }
  .spec { grid-column: span var(--span); }
  /* `span 99` would force auto-fill to materialise 99 tracks and blow the
     grid far past the viewport; `1 / -1` is the only way to say "this row". */
  .spec[data-span='full'] { grid-column: 1 / -1; }

  .spec-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ig-gap-md);
    padding: 3px 8px;
    border-bottom: var(--ig-border-hairline) solid var(--ig-border);
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    font-size: var(--ig-type-xs-pt);
    letter-spacing: 0.04em;
  }
  .spec-name { color: var(--ig-text-muted); text-transform: uppercase; }
  /* Outline, not a filled chip: this is a state marker on a cell, Tier C. */
  .spec-flag {
    color: var(--ig-amber);
    border: 1px solid var(--ig-amber);
    border-radius: var(--ig-radius-xs);
    padding: 0 4px;
    text-transform: uppercase;
  }
  .spec[data-variant='extends'] .spec-flag { color: var(--ig-accent); border-color: var(--ig-accent); }
  /* Muted, not alarming: an accommodation is not a defect, it is an absence
     of evidence — the reference had nothing here to be faithful to. */
  .spec[data-variant='accommodation'] .spec-flag { color: var(--ig-text-muted); border-color: var(--ig-text-muted); }

  .spec-body {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--ig-gap-lg);
    /* Extra right/bottom room: every ink shadow lives outside the box, down
       and to the right, and hover travel moves the object 4px further. */
    padding: 16px 24px 24px 16px;
    flex: 1;
  }

  .spec-note {
    margin: 0;
    padding: 4px 8px 6px;
    border-top: var(--ig-border-hairline) solid var(--ig-border);
    color: var(--ig-text-muted);
    font-size: var(--ig-type-xs-pt);
    line-height: var(--ig-lh-default);
  }
</style>
