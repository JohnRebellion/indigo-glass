<script lang="ts">
  import GlassInk from '$lib/GlassInk.svelte';
  import { palettes, type Palette } from '$lib/palettes';

  /**
   * Accent candidates for Glass & Ink.
   *
   * Deliberately NOT a side-by-side grid: simultaneous contrast makes adjacent
   * accents distort each other, so seven panes at once would be a misleading
   * instrument. One window, one position, accent swapped in place.
   */
  let selectedId = $state('moss');
  let material = $state<'ink' | 'glass'>('ink');

  const current = $derived(palettes.find((p) => p.id === selectedId) ?? palettes[0]);

  function vars(p: Palette): string {
    return [
      `--ig-accent: ${p.accent}`,
      `--ig-accent-hi: ${p.accentHi}`,
      `--ig-accent-alt: ${p.accentAlt}`,
      `--ig-indigo: ${p.accent}`,
      `--ig-indigo-hi: ${p.accentHi}`,
      `--ig-base: ${p.base}`,
      `--ig-surface: ${p.surface}`,
      `--ig-surface-alt: ${p.surfaceAlt}`,
      `--ig-sidebar: ${p.sidebar}`,
      `--ig-glass-accent-rgb: ${p.accentRgb}`,
      `--ig-glass-surface-rgb: ${p.surfaceRgb}`
    ].join('; ');
  }
</script>

<div class="pal" style={vars(current)} data-testid="palettes">
  <div class="pal-amb" aria-hidden="true"></div>

  <header class="pal-head">
    <p class="pal-eyebrow">Accent candidates · {palettes.length} options</p>
    <h1>Quieter</h1>
    <p class="pal-lede">
      Lime is L&nbsp;0.85 / C&nbsp;0.205 — near-maximum lightness <em>and</em> near-maximum chroma at the
      same time. Perceived intensity tracks chroma and lightness far more than hue, so the fix may not be
      a new colour at all. Both routes are below: same hue dialled down, and genuinely different hues.
    </p>
  </header>

  <div class="pal-chips" role="radiogroup" aria-label="Accent candidate">
    {#each palettes as p}
      <button
        type="button"
        role="radio"
        aria-checked={p.id === selectedId}
        class="pal-chip"
        class:active={p.id === selectedId}
        style="--chip: {p.accent}"
        onclick={() => (selectedId = p.id)}
        data-testid="chip-{p.id}"
      >
        <span class="pal-chip-dot"></span>
        <span class="pal-chip-name">{p.name}</span>
        <span class="pal-chip-char">{p.character}</span>
      </button>
    {/each}
  </div>

  <div class="pal-stage">
    <div class="pal-window">
      {#key selectedId + material}
        <GlassInk
          variant={material}
          accentName={current.name}
          accentContrast={`${current.contrastBase}:1`}
        />
      {/key}
    </div>

    <aside class="pal-meta">
      <div class="pal-meta-row">
        <span class="pal-label">Character</span>
        <strong>{current.character} · {current.temp}</strong>
      </div>
      <div class="pal-meta-row">
        <span class="pal-label">Accent</span>
        <div class="pal-hexes">
          <span class="pal-hex"><i style="background:{current.accent}"></i>{current.accent}</span>
          <span class="pal-hex"><i style="background:{current.accentHi}"></i>{current.accentHi}</span>
          <span class="pal-hex"><i style="background:{current.accentAlt}"></i>{current.accentAlt}</span>
        </div>
      </div>
      <div class="pal-meta-row">
        <span class="pal-label">OKLCH</span>
        <code>[{current.oklch[0]}, {current.oklch[1]}, {current.oklch[2]}]</code>
      </div>
      <div class="pal-meta-row">
        <span class="pal-label">Contrast</span>
        <strong class="pal-nums">
          {current.contrastBase}:1 <span class="pal-dim">base</span>
          &nbsp;·&nbsp;
          {current.contrastSurface}:1 <span class="pal-dim">surface</span>
        </strong>
      </div>
      <p class="pal-note">{current.note}</p>
      <p class="pal-warn"><span class="pal-label">Semantics</span>{current.collision}</p>

      <div class="pal-material">
        <span class="pal-label">Material</span>
        <div class="pal-toggle">
          <button type="button" class:on={material === 'ink'} onclick={() => (material = 'ink')}>Ink</button>
          <button type="button" class:on={material === 'glass'} onclick={() => (material = 'glass')}>Glass</button>
        </div>
      </div>
    </aside>
  </div>

  <section class="pal-strip">
    <h2>All candidates</h2>
    <p class="pal-strip-note">
      Small swatches only — big adjacent fields of colour distort each other, which is why the comparison
      above happens one at a time.
    </p>
    <div class="pal-strip-row">
      {#each palettes as p}
        <button
          type="button"
          class="pal-sw"
          class:active={p.id === selectedId}
          onclick={() => (selectedId = p.id)}
          title="{p.name} — {p.character}"
        >
          <span class="pal-sw-chip" style="background:{p.accent}"></span>
          <span class="pal-sw-name">{p.name}</span>
          <span class="pal-sw-c">C {p.oklch[1].toFixed(3)}</span>
        </button>
      {/each}
    </div>
  </section>
</div>

<style>
  .pal {
    position: relative;
    max-width: 1420px;
    margin: 0 auto;
    padding: 22px 16px 44px;
    background: var(--ig-base);
    min-height: 100vh;
  }
  .pal-amb {
    position: absolute;
    inset: -6% -6% 40%;
    z-index: 0;
    pointer-events: none;
    background-image:
      radial-gradient(circle at 22% 20%, color-mix(in oklab, var(--ig-accent) 9%, transparent) 0%, transparent 58%),
      radial-gradient(circle at 80% 60%, color-mix(in oklab, var(--ig-accent-alt) 6%, transparent) 0%, transparent 58%);
    filter: blur(110px);
  }
  .pal > *:not(.pal-amb) { position: relative; z-index: 1; }

  .pal-eyebrow {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ig-accent);
    margin: 0 0 10px;
  }
  .pal-head h1 {
    font-family: 'Anton', 'Iosevka Custom Heavy Condensed', Impact, sans-serif;
    font-size: 54px;
    line-height: 0.85;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    margin: 0 0 10px;
    color: var(--ig-text);
  }
  .pal-lede {
    color: var(--ig-text-muted);
    font-size: 13.5px;
    line-height: 1.55;
    max-width: 74ch;
    margin: 0 0 22px;
  }
  .pal-lede em { color: var(--ig-text); font-style: normal; }

  /* ---- chips ---- */
  .pal-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 22px;
  }
  .pal-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px 7px 9px;
    background: var(--ig-surface);
    border: 1px solid var(--ig-border-strong);
    border-radius: 2px;
    cursor: pointer;
    color: var(--ig-text-muted);
    font-family: inherit;
    font-size: 12.5px;
    transition: border-color 120ms ease, color 120ms ease;
  }
  .pal-chip:hover { color: var(--ig-text); border-color: var(--chip); }
  .pal-chip.active {
    color: var(--ig-text);
    border-color: var(--chip);
    box-shadow: 3px 3px 0 0 var(--chip);
  }
  .pal-chip:focus-visible { outline: 2px solid var(--chip); outline-offset: 2px; }
  .pal-chip-dot {
    width: 12px;
    height: 12px;
    background: var(--chip);
    flex: 0 0 12px;
  }
  .pal-chip-char {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ig-text-dim);
  }

  /* ---- stage ---- */
  .pal-stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 22px;
    align-items: start;
  }
  .pal-window { min-width: 0; }

  .pal-meta {
    background: var(--ig-surface);
    border: 1px solid var(--ig-border-strong);
    box-shadow: 4px 4px 0 0 #000;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .pal-label {
    display: block;
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ig-text-dim);
    margin-bottom: 5px;
  }
  .pal-meta-row strong { font-size: 13.5px; color: var(--ig-text); }
  .pal-meta-row code {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--ig-accent);
  }
  .pal-nums { font-variant-numeric: tabular-nums; }
  .pal-dim { color: var(--ig-text-dim); font-weight: 400; font-size: 11px; }
  .pal-hexes { display: flex; flex-direction: column; gap: 4px; }
  .pal-hex {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 11.5px;
    color: var(--ig-text);
  }
  .pal-hex i { width: 13px; height: 13px; flex: 0 0 13px; }
  .pal-note {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--ig-text-muted);
  }
  .pal-warn {
    margin: 0;
    padding: 10px 12px;
    background: var(--ig-base);
    border-left: 2px solid var(--ig-amber);
    font-size: 12px;
    line-height: 1.45;
    color: var(--ig-text-muted);
  }

  .pal-material { border-top: 1px solid var(--ig-border); padding-top: 14px; }
  .pal-toggle { display: flex; gap: 6px; }
  .pal-toggle button {
    flex: 1;
    padding: 7px 10px;
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: transparent;
    color: var(--ig-text-muted);
    border: 1px solid var(--ig-border-strong);
    cursor: pointer;
  }
  .pal-toggle button.on {
    background: var(--ig-accent);
    border-color: var(--ig-accent);
    color: var(--ig-base);
  }
  .pal-toggle button:focus-visible { outline: 2px solid var(--ig-accent-hi); outline-offset: 2px; }

  /* ---- strip ---- */
  .pal-strip { margin-top: 34px; }
  .pal-strip h2 {
    font-family: 'Anton', 'Iosevka Custom Heavy Condensed', Impact, sans-serif;
    font-size: 24px;
    text-transform: uppercase;
    letter-spacing: 0.015em;
    margin: 0 0 6px;
    color: var(--ig-text);
  }
  .pal-strip-note {
    margin: 0 0 14px;
    font-size: 12px;
    color: var(--ig-text-dim);
    max-width: 70ch;
    line-height: 1.5;
  }
  .pal-strip-row { display: flex; flex-wrap: wrap; gap: 10px; }
  .pal-sw {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 9px;
    width: 104px;
    background: var(--ig-surface);
    border: 1px solid var(--ig-border);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }
  .pal-sw.active { border-color: var(--ig-accent); }
  .pal-sw:focus-visible { outline: 2px solid var(--ig-accent); outline-offset: 2px; }
  .pal-sw-chip { display: block; height: 34px; }
  .pal-sw-name { font-size: 12px; color: var(--ig-text); }
  .pal-sw-c {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.1em;
    color: var(--ig-text-dim);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 1080px) {
    .pal-stage { grid-template-columns: minmax(0, 1fr); }
  }
</style>
