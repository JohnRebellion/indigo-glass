<script lang="ts">
  import { SITES } from '$lib/sites/registry';
  import { readMeta, selectorInventory } from '$lib/sites/scopedStylus';
</script>

<svelte:head><title>Sage Ink — site styles, stock vs ours</title></svelte:head>

<div class="idx" data-testid="sites-index">
  <h1>Site styles — stock vs Sage Ink</h1>
  <p class="lead">
    One page per Stylus site style. Each renders the site's own components twice: as the site ships
    them, and under the shipped <code>.user.css</code>. The coverage count is the number of selector
    tokens the file names; the page for that site reports how many of them it fails to show.
  </p>
  <table>
    <thead><tr><th>Site</th><th>Domain</th><th>File</th><th>Version</th><th>Hue</th><th>Ladder</th><th>Selector tokens</th></tr></thead>
    <tbody>
      {#each SITES as s}
        <tr data-testid="site-row-{s.id}">
          <td><a href="/sites/{s.id}/">{s.name}</a></td>
          <td>{s.domain}</td>
          <td><code>{s.file}</code></td>
          <td>{readMeta(s.css, 'version')}</td>
          <td>{s.hue.deg}°</td>
          <td class="ladder">
            <span style="background:{s.hue.hi}"></span><span style="background:{s.hue.mid}"></span><span style="background:{s.hue.alt}"></span>
          </td>
          <td>{selectorInventory(s.css).length}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .idx { padding: 16px 20px 48px; max-width: 1100px; margin: 0 auto; }
  h1 { margin: 0 0 6px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: 22pt; }
  .lead { color: var(--ig-text-muted); margin: 0 0 16px; max-width: 80ch; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; }
  th, td { text-align: left; padding: 5px 10px; border-bottom: var(--ig-border-hairline) solid var(--ig-border); }
  th { color: var(--ig-text-muted); font-weight: 500; }
  code { font-family: "Iosevka Custom Condensed", monospace; }
  .ladder span { display: inline-block; width: 14px; height: 14px; border: 1px solid var(--ig-border-strong); margin-right: 2px; vertical-align: middle; }
</style>
