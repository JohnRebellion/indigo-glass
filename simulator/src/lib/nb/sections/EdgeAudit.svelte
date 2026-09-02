<script lang="ts">
  import { onMount } from 'svelte';
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';
  import { measureEdges, type EdgeRow } from '../measureEdges';

  /* The page's own weakest number, published on the page.
   *
   * Sage Ink's material claim is colour-as-elevation: a 2px stroke plus a hard
   * offset shadow. This section asks the only question that tests it — for a
   * component with NO shadow, is there anything to see the boundary by? Added
   * after the 2026-09-02 cross-model audit, where this measurement was what
   * settled the disagreement between the two reviewers. An audit page that
   * only reports what it gets right is marketing. */
  let rows = $state<EdgeRow[]>([]);
  let ready = $state(false);

  onMount(() => {
    rows = measureEdges();
    ready = true;
  });

  const failing = $derived(rows.filter((r) => r.invisible));
</script>

<Section id="edges" title="Self-audit — does every component have an edge?"
  lead="measured live, in this page, on load — not a claim about the page but a reading of it" min="100%">
  <Specimen name="edge visibility" span="full" variant="extends"
    note="Nothing in the reference asks for this; it exists because a 2px stroke that does not separate from its own fill is decoration, not structure. A component is listed as having no perceptible edge when its fill is within 1.5:1 of the page AND its stroke is within 1.5:1 of its fill. Shadow-bearing components are excluded — the shadow supplies the silhouette. Regenerate outside the browser with simulator/scripts/measure-edges.mjs.">
    {#if ready}
      <div class="edge-head">
        <strong class:bad={failing.length > 0} class:good={failing.length === 0}>
          {failing.length} of {rows.length}
        </strong>
        <span>shadowless bordered components have no perceptible edge</span>
      </div>
      <table class="edge">
        <thead>
          <tr><th>component</th><th>fill vs page</th><th>stroke vs fill</th><th></th></tr>
        </thead>
        <tbody>
          {#each rows as r}
            <tr class:bad={r.invisible}>
              <td class="mono">{r.cls}</td>
              <td class="mono num">{r.fillVsPage.toFixed(2)}:1</td>
              <td class="mono num">{r.strokeVsFill.toFixed(2)}:1</td>
              <td class="mono">{r.invisible ? 'no edge' : ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <span class="mono">measuring…</span>
    {/if}
  </Specimen>
</Section>

<style>
  .edge-head {
    display: flex;
    align-items: baseline;
    gap: var(--ig-gap-md);
    width: 100%;
    margin-bottom: var(--ig-gap-md);
    font-size: var(--ig-caption-pt);
  }
  .edge-head strong { font-size: var(--ig-section-pt); }
  .edge-head .bad { color: var(--ig-negative); }
  .edge-head .good { color: var(--ig-positive); }
  .edge-head span { color: var(--ig-text-muted); }

  .edge { width: 100%; border-collapse: collapse; font-size: var(--ig-type-xs-pt); }
  .edge th {
    text-align: left;
    padding: 2px 12px 4px 0;
    color: var(--ig-text-muted);
    font-weight: var(--ig-weight-base);
    border-bottom: 1px solid var(--ig-border);
  }
  .edge td { padding: 2px 12px 2px 0; border-bottom: 1px solid var(--ig-border); }
  .edge .num { text-align: right; }
  .edge tr.bad td { color: var(--ig-negative); }
  .mono { font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace; }
</style>
