<script lang="ts">
  /* /desktop/ — every non-browser layer, and the matrix that makes them
   * checkably one design: rows are palette tokens, columns are surfaces, and
   * each cell is the colour that surface's shipped file paints for a role
   * bound to that token. A red cell is a layer that has drifted off the TOML. */
  import { SURFACES } from '$lib/desktop/registry';
  import { PALETTE, VARIANT, normHex } from '$lib/desktop/tokens';

  const tokens = [...new Set(SURFACES.flatMap((s) => s.roles.map((r) => r.token)).filter((t): t is string => !!t))]
    .sort((a, b) => Object.keys(PALETTE).indexOf(a) - Object.keys(PALETTE).indexOf(b));
  const cell = (id: string, token: string) =>
    SURFACES.find((s) => s.meta.id === id)!.roles.filter((r) => r.token === token)
      .map((r) => ({ role: r.role, hex: normHex(r.ours), ok: normHex(r.ours) === PALETTE[token] }));
  const drift = (s: (typeof SURFACES)[number]) => s.roles.filter((r) => r.token && normHex(r.ours) !== PALETTE[r.token]).length;
</script>

<svelte:head><title>Sage Ink — desktop layers, stock vs ours</title></svelte:head>

<div class="idx" data-testid="desktop-index">
  <h1>Desktop layers — stock vs Sage Ink</h1>
  <p class="lead">
    One page per non-browser layer. Each renders the layer's specimens twice from the same markup: once
    from the stock file the desktop ships, once from the file this repo installs. The simulator reads the
    shipped files directly, so fixing a page means fixing the real file. Fidelity says how far to trust a
    page before checking on the live desktop.
  </p>
  <table>
    <thead><tr><th>Layer</th><th>Group</th><th>Fidelity</th><th>Ships</th><th>Roles</th></tr></thead>
    <tbody>
      {#each SURFACES as s}
        <tr data-testid="surface-row-{s.meta.id}">
          <td><a href="/desktop/{s.meta.id}/">{s.meta.name}</a></td>
          <td>{s.meta.group}</td>
          <td><span class="fid fid-{s.meta.fidelity}">{s.meta.fidelity}</span></td>
          <td>{#each s.meta.shipped as f, i}{i ? ', ' : ''}<code>{f.path}</code>{/each}</td>
          <td class:bad={drift(s) > 0}>{s.roles.filter((r) => r.token).length - drift(s)}/{s.roles.filter((r) => r.token).length}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <h2>Consistency <span class="sub">variant {VARIANT} — each cell is what that layer paints for the token</span></h2>
  <div class="matrix-wrap">
    <table class="matrix" data-testid="matrix">
      <thead>
        <tr><th>Token</th>{#each SURFACES as s}<th class="rot"><span>{s.meta.name}</span></th>{/each}</tr>
      </thead>
      <tbody>
        {#each tokens as t}
          <tr>
            <th><span class="chip" style="background:{PALETTE[t]}"></span><code>{t}</code> {PALETTE[t]}</th>
            {#each SURFACES as s}
              {@const c = cell(s.meta.id, t)}
              <td class:bad={c.some((x) => !x.ok)} title={c.map((x) => `${x.role}: ${x.hex}`).join('\n')}>
                {#each c as x}<span class="chip" style="background:{x.hex}" data-ok={x.ok}></span>{/each}
              </td>
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
  h2 { margin: 32px 0 8px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: var(--ig-section-pt); }
  .sub { color: var(--ig-text-muted); font-weight: 400; font-size: 9pt; }
  .lead { color: var(--ig-text-muted); margin: 0 0 16px; max-width: 90ch; }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--ig-border); vertical-align: top; }
  th { color: var(--ig-text-muted); font-weight: 500; }
  code { font-family: "Iosevka Custom Condensed", monospace; }
  td.bad { color: var(--ig-negative); outline: 2px solid var(--ig-negative); outline-offset: -2px; }
  .fid { display: inline-block; padding: 0 6px; border: 2px solid var(--ig-border-strong); font-family: "Iosevka Custom Condensed", monospace; text-transform: uppercase; font-size: 8.5pt; }
  .fid-high { border-color: var(--ig-positive); color: var(--ig-positive); }
  .fid-medium { border-color: var(--ig-amber); color: var(--ig-amber); }
  .fid-low { border-color: var(--ig-negative); color: var(--ig-negative); }
  .matrix-wrap { overflow-x: auto; }
  .matrix th.rot { height: 120px; vertical-align: bottom; padding: 0 2px; }
  .matrix th.rot span { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
  .matrix td { text-align: center; }
  .chip { display: inline-block; width: 12px; height: 12px; margin: 0 1px; border: 1px solid var(--ig-border-strong); vertical-align: -2px; }
  .chip[data-ok='false'] { border: 2px solid var(--ig-negative); }
</style>
