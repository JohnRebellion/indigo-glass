<script lang="ts">
  import GlassInk from '$lib/GlassInk.svelte';

  /**
   * Decision 1 of the Glass & Ink merge proposal:
   * does glass stay a general material, or become chrome only?
   *
   * Both panes render the same component with the same content. Chrome is
   * glass in both. Only the content objects differ.
   */
  const diffs = [
    { axis: 'Card fill',   ink: 'opaque #0D0D10',         glass: 'rgba(18,18,22,.70) + blur 13px' },
    { axis: 'Card radius', ink: '0px',                    glass: '12px' },
    { axis: 'Card shadow', ink: '4px 4px 0 #8BC406',      glass: '0 8px 24px rgba(0,0,0,.45)' },
    { axis: 'Hazard tile', ink: 'saturated lime fill',    glass: 'lime tint at 14%' },
    { axis: 'Press',       ink: 'travels 4px, 80ms steps', glass: 'shadow softens, 200ms ease' },
    { axis: 'Badges',      ink: '2px typewriter tag',     glass: 'pill' }
  ];
</script>

<div class="gi-page">
  <header class="gi-head">
    <p class="gi-eyebrow">Decision record · resolved</p>
    <h1>Glass &amp; Ink</h1>
    <p class="gi-lede">
      Same window, same content, same tokens. Chrome — window frame, titlebar, sidebar — is glass in both
      panes below. That was decision 1 of the original merge proposal.
    </p>
    <p class="gi-resolution">
      <strong>The actual call went further than either pane: no glass at all, not even chrome.</strong>
      Sage Ink drops backdrop-blur system-wide — see <code>tokens/indigo-glass.tokens.toml</code> §material/
      shadow/blur (v4). Kept below as the record of why ink, not glass, won on <em>objects</em> — the
      chrome question was overtaken by dropping glass entirely rather than answered by picking a side.
    </p>
  </header>

  <div class="gi-compare">
    <section class="gi-pane">
      <div class="gi-pane-head">
        <span class="gi-pane-tag rec">Chrome only · this pane's chrome is now the ONLY glass anywhere</span>
        <p>Objects are ink: opaque, square, hard shadow. In the shipped system even this chrome went flat.</p>
      </div>
      <GlassInk variant="ink" />
    </section>

    <section class="gi-pane">
      <div class="gi-pane-head">
        <span class="gi-pane-tag">Glass everywhere · rejected</span>
        <p>Objects stay translucent and rounded. No hard shadows anywhere; depth is blur and falloff.</p>
      </div>
      <GlassInk variant="glass" />
    </section>
  </div>

  <section class="gi-diff">
    <h2>What differs</h2>
    <div class="gi-diff-scroll">
      <table>
        <thead>
          <tr><th>Axis</th><th>Chrome only (ink)</th><th>Glass everywhere</th></tr>
        </thead>
        <tbody>
          {#each diffs as d}
            <tr>
              <td class="axis">{d.axis}</td>
              <td class="ink">{d.ink}</td>
              <td class="glass">{d.glass}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="gi-note">
      Display type resolves to <code>Iosevka Custom Heavy Condensed</code> here — Anton is not installed
      locally, and the simulator loads no web fonts. That makes these screenshots a preview of the
      zero-new-dependency option for the display tier.
    </p>
  </section>
</div>

<style>
  .gi-page {
    max-width: 1560px;
    margin: 0 auto;
    padding: 22px 16px 40px;
  }
  .gi-eyebrow {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ig-accent);
    margin: 0 0 10px;
  }
  .gi-head h1 {
    font-family: 'Anton', 'Iosevka Custom Heavy Condensed', Impact, sans-serif;
    font-size: 54px;
    line-height: 0.85;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    margin: 0 0 10px;
  }
  .gi-lede {
    color: var(--ig-text-muted);
    font-size: 13.5px;
    max-width: 66ch;
    margin: 0 0 12px;
    line-height: 1.5;
  }

  .gi-resolution {
    color: var(--ig-text);
    font-size: 13px;
    max-width: 70ch;
    margin: 0 0 26px;
    line-height: 1.55;
    padding: 12px 14px;
    background: var(--ig-surface-alt);
    border: 1px solid var(--ig-border-strong);
    box-shadow: var(--ig-shadow-ink);
  }
  .gi-resolution strong { color: var(--ig-accent); }
  .gi-resolution code {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--ig-text-muted);
  }

  .gi-compare {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }
  .gi-pane-head { margin-bottom: 12px; }
  .gi-pane-head p {
    margin: 8px 0 0;
    font-size: 12.5px;
    color: var(--ig-text-muted);
    line-height: 1.45;
    max-width: 56ch;
  }
  .gi-pane-tag {
    display: inline-block;
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 5px 10px;
    border: 1px solid var(--ig-border-strong);
    color: var(--ig-text-muted);
    border-radius: 2px;
  }
  .gi-pane-tag.rec {
    background: var(--ig-accent);
    border-color: var(--ig-accent);
    color: var(--ig-base);
  }

  .gi-diff { margin-top: 34px; }
  .gi-diff h2 {
    font-family: 'Anton', 'Iosevka Custom Heavy Condensed', Impact, sans-serif;
    font-size: 26px;
    text-transform: uppercase;
    letter-spacing: 0.015em;
    margin: 0 0 14px;
  }
  .gi-diff-scroll { overflow-x: auto; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    min-width: 620px;
  }
  th, td {
    text-align: left;
    padding: 9px 12px;
    border-bottom: 1px solid var(--ig-border);
  }
  th {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ig-text-muted);
    border-bottom: 1px solid var(--ig-border-strong);
  }
  td.axis { color: var(--ig-text); }
  td.ink { color: var(--ig-accent); font-family: 'Iosevka Custom Condensed', monospace; }
  td.glass { color: var(--ig-text-muted); font-family: 'Iosevka Custom Condensed', monospace; }
  .gi-note {
    margin: 16px 0 0;
    font-size: 12px;
    color: var(--ig-text-dim);
    max-width: 70ch;
    line-height: 1.5;
  }
  .gi-note code { color: var(--ig-accent-alt); }

  @media (max-width: 1100px) {
    .gi-compare { grid-template-columns: minmax(0, 1fr); }
  }
</style>
