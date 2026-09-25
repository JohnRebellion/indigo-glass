<script lang="ts">
  /* /components/ — one page per UI component, each drawing that component in
   * every theming layer that has one, stock beside Sage Ink. This index is
   * the layer-by-component map: which layers draw which component, and why a
   * layer that has none has none. The measured verdicts live on each page. */
  import { COMPONENTS } from '$lib/components/catalogue';
  import { LAYERS } from '$lib/components/registry';
</script>

<svelte:head><title>Sage Ink — components across layers</title></svelte:head>

<div class="idx" data-testid="components-index">
  <h1>Components across layers</h1>
  <p class="lead">
    A button, a menu, a tooltip… drawn by every layer this repo themes: Qt widgets, the Plasma shell,
    GTK, VS Code and the Stylus sites. Each page renders the component from each layer's stock file and
    from its shipped Sage Ink file through the same markup, then reads the painted colours back and checks
    them against the documented contract (docs/STATE_GRAMMAR.md, docs/ELEVATION.md) and against each other.
    Stock layers disagree by design; the Sage Ink lanes should not.
  </p>
  <div class="wrap">
    <table data-testid="component-map">
      <thead>
        <tr><th>Component</th>{#each LAYERS as { layer }}<th>{layer.name}</th>{/each}</tr>
      </thead>
      <tbody>
        {#each COMPONENTS as c}
          <tr data-testid="component-row-{c.id}">
            <th><a href="/components/{c.id}/">{c.name}</a><div class="sub">{c.slots.length} slots</div></th>
            {#each LAYERS as { layer }}
              {#if layer.components[c.id]}
                <td class="yes">drawn{#if layer.components[c.id]?.exceptions?.length}<span class="exc"> · {layer.components[c.id]?.exceptions?.length} exc</span>{/if}{#if layer.components[c.id]?.known?.length}<span class="gap" data-testid="gaps-{c.id}-{layer.id}"> · {layer.components[c.id]?.known?.length} known gap{layer.components[c.id]?.known?.length === 1 ? '' : 's'}</span>{/if}</td>
              {:else}
                <td class="no" title={layer.absent[c.id] ?? ''}>—<div class="sub">{layer.absent[c.id] ?? ''}</div></td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .idx { padding: 16px 20px 48px; max-width: 1400px; margin: 0 auto; }
  h1 { margin: 0 0 6px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: 22pt; }
  .lead { color: var(--ig-text-muted); margin: 0 0 16px; max-width: 90ch; }
  .wrap { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--ig-border); vertical-align: top; }
  th { color: var(--ig-text-muted); font-weight: 500; }
  tbody th a { color: var(--ig-text); font-weight: 600; }
  .sub { color: var(--ig-text-muted); font-weight: 400; font-size: 8pt; max-width: 24ch; }
  .yes { color: var(--ig-text); }
  .no { color: var(--ig-text-muted); }
  .exc { color: var(--ig-amber); }
  .gap { color: var(--ig-negative); }
</style>
