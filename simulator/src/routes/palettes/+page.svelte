<script lang="ts">
  import { palettes, type Palette } from '$lib/palettes';

  /**
   * Accent candidates.
   *
   * Deliberately NOT a side-by-side grid: simultaneous contrast makes adjacent
   * accents distort each other, so seven panes at once would be a misleading
   * instrument. One window, one position, accent swapped in place.
   */
  let selectedId = $state('moss');

  const current = $derived(palettes.find((p) => p.id === selectedId) ?? palettes[0]);

  const sidebarItems = [
    { icon: '▤', label: 'Tokens', active: true },
    { icon: '◫', label: 'Surfaces', active: false },
    { icon: '◇', label: 'Variants', active: false },
    { icon: '⌗', label: 'Parity', active: false },
    { icon: '⎋', label: 'Deploy', active: false }
  ];

  const tabItems = [
    { label: 'codegen.py', active: true },
    { label: 'tokens.toml', active: false },
    { label: 'klassy.ini', active: false }
  ];

  const previewCards = $derived([
    {
      kicker: 'Contrast',
      title: `${current.name} on base`,
      value: `${current.contrastBase}:1`,
      note: 'Measured against this variant’s own base.'
    },
    {
      kicker: 'Contrast',
      title: 'Hazard 2 on base',
      value: '5.10:1',
      note: 'Indigo #5E6AD2. AA large only — cannot carry small text.'
    }
  ]);

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
      `--ig-sidebar: ${p.sidebar}`
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
      {#key selectedId}
        <div class="pw" data-testid="pal-window">
          <div class="pw-title">
            <span class="pw-dots"><i></i><i></i><i></i></span>
            <span class="pw-title-text">tokens · {current.name.toLowerCase()}</span>
          </div>
          <div class="pw-body">
            <aside class="pw-side">
              {#each sidebarItems as s}
                <div class="pw-side-item" class:active={s.active}>
                  <span class="pw-side-icon">{s.icon}</span>{s.label}
                </div>
              {/each}
            </aside>
            <div class="pw-main">
              <div class="pw-tabs">
                {#each tabItems as t}
                  <span class="pw-tab" class:active={t.active}>{t.label}</span>
                {/each}
              </div>
              <div class="pw-hazard">
                <span class="pw-kicker pw-kicker-on-fill">Hazard block · one per view</span>
                <h3>Colour is the elevation</h3>
                <p>Hierarchy by saturated fill, not by shadow depth.</p>
              </div>
              <div class="pw-cards">
                {#each previewCards as c}
                  <div class="pw-card">
                    <span class="pw-kicker">{c.kicker}</span>
                    <strong class="pw-card-title">{c.title}</strong>
                    <span class="pw-card-value">{c.value}</span>
                    <p class="pw-card-note">{c.note}</p>
                  </div>
                {/each}
              </div>
              <div class="pw-btns">
                <button type="button" class="pw-btn primary">Regenerate</button>
                <button type="button" class="pw-btn ghost">Diff</button>
                <span class="pw-badge">schema v3</span>
                <span class="pw-badge alt">2 variants</span>
              </div>
              <pre class="pw-term"><span class="p">~/indigo-glass</span> <span class="c">$</span> python3 tokens/codegen.py
<span class="ok">✓</span> css-vars.{current.id}.css      <span class="d">22 tokens</span>
<span class="ok">✓</span> kde-palette.{current.id}.colors <span class="d">18 roles</span>
<span class="ok">✓</span> klassy-radius.ini       <span class="d">ink 0</span></pre>
            </div>
          </div>
        </div>
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
    /* Page-wide decorative ambient glow (class name literally "pal-amb"),
       not a component fill - same carve-out as the grub simulator's own
       CRT-bezel chrome. */
    background-image:
      radial-gradient(circle at 22% 20%, color-mix(in oklab, var(--ig-accent) 9%, transparent) 0%, transparent 58%), /* drift-allow: see comment above */
      radial-gradient(circle at 80% 60%, color-mix(in oklab, var(--ig-accent-alt) 6%, transparent) 0%, transparent 58%); /* drift-allow: see comment above */
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
    border: var(--ig-border-default) solid var(--ig-border-strong);
    border-radius: var(--ig-radius-xs);
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
  .pal-chip:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 2px; }
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
    border: var(--ig-border-default) solid var(--ig-border-strong);
    box-shadow: 4px 4px 0 0 #000; /* NOTE: black shadow leftover pattern (see docs/SAGE_INK_AUDIT.md #7) - out of scope for this border-width pass */
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

  /* ---- preview window (ink only — no material toggle, glass was retired) ---- */
  .pw {
    border: var(--ig-border-default) solid var(--ig-border);
    border-radius: 0;
    overflow: hidden;
    min-height: 470px;
    display: flex;
    flex-direction: column;
    background: var(--ig-surface);
    box-shadow: 8px 8px 0 0 #000; /* NOTE: black shadow leftover pattern (see docs/SAGE_INK_AUDIT.md #7) - out of scope for this border-width pass */
    container-type: inline-size;
  }
  .pw-title {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    border-bottom: 1px solid var(--ig-border);
    background: var(--ig-base);
  }
  .pw-dots { display: flex; gap: 5px; }
  .pw-dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--ig-border-strong); }
  .pw-dots i:first-child { background: var(--ig-accent); }
  .pw-title-text {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ig-text-muted);
  }
  .pw-body { display: flex; flex: 1; min-height: 0; }
  .pw-side {
    width: 148px;
    flex: 0 0 148px;
    padding: 10px 8px;
    border-right: 1px solid var(--ig-border);
    background: var(--ig-base);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pw-side-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 9px;
    font-size: 12.5px;
    color: var(--ig-text-muted);
  }
  .pw-side-item.active {
    /* No background fill (was var(--ig-surface-alt)) - matches its own
       siblings on this page (.pal-chip.active, .pw-tab.active), neither of
       which fill either; the accent bar alone carries the on-select signal. */
    color: var(--ig-text);
    box-shadow: inset 2px 0 0 0 var(--ig-accent);
  }
  .pw-side-icon { color: var(--ig-accent); font-size: 11px; }
  .pw-main { flex: 1; min-width: 0; padding: 14px 16px 18px; display: flex; flex-direction: column; gap: 14px; }
  .pw-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--ig-border); }
  .pw-tab {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ig-text-dim);
    padding: 7px 11px;
  }
  .pw-tab.active { color: var(--ig-text); box-shadow: 0 -1px 0 0 var(--ig-accent) inset; }
  .pw-hazard {
    background: var(--ig-accent);
    color: var(--ig-base);
    box-shadow: 4px 4px 0 0 #000;
    padding: 14px 16px;
  }
  .pw-hazard h3 {
    font-family: 'Anton', 'Iosevka Custom Heavy Condensed', Impact, sans-serif;
    font-size: 26px;
    line-height: 0.9;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    margin: 0 0 4px;
  }
  .pw-hazard p { margin: 0; font-size: 12.5px; opacity: 0.78; }
  .pw-kicker {
    display: block;
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ig-accent);
    margin-bottom: 7px;
  }
  .pw-kicker-on-fill { color: rgba(7, 8, 10, 0.62); } /* drift-allow: deliberate muted-foreground-on-fill text opacity (paired with the fully-opaque .pw-kicker above), not a glass fill or border - same convention as e.g. Tailwind's text-foreground/60 */
  .pw-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .pw-card {
    background: var(--ig-surface-alt);
    border: var(--ig-border-default) solid var(--ig-border-strong);
    box-shadow: 4px 4px 0 0 var(--ig-accent-alt);
    padding: 13px 15px;
  }
  .pw-card-title { display: block; font-size: 13px; }
  .pw-card-value {
    display: block;
    font-family: 'Anton', 'Iosevka Custom Heavy Condensed', Impact, sans-serif;
    font-size: 34px;
    line-height: 1;
    letter-spacing: 0.01em;
    color: var(--ig-accent);
    font-variant-numeric: tabular-nums;
    margin: 4px 0 6px;
  }
  .pw-card-note { margin: 0; font-size: 11.5px; line-height: 1.4; color: var(--ig-text-muted); }
  .pw-btns { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pw-btn {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 8px 14px;
  }
  .pw-btn.primary {
    background: var(--ig-accent);
    color: var(--ig-base);
    border: var(--ig-border-default) solid var(--ig-accent);
    box-shadow: 4px 4px 0 0 #000; /* NOTE: black shadow leftover pattern (see docs/SAGE_INK_AUDIT.md #7) - out of scope for this border-width pass */
  }
  .pw-btn.ghost {
    background: transparent;
    color: var(--ig-accent);
    border: var(--ig-border-default) solid var(--ig-accent);
    box-shadow: 4px 4px 0 0 var(--ig-accent-alt);
  }
  /* Press travels on :hover per the neobrutalism.dev reference - was :active. */
  .pw-btn:hover { transform: translate(4px, 4px); box-shadow: 0 0 0 0 #000; }
  .pw-btn:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 2px; }
  .pw-badge {
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    padding: 4px 9px;
    border: 1px solid var(--ig-border-strong);
    color: var(--ig-text-muted);
  }
  .pw-badge.alt { border-color: rgba(94, 106, 210, 0.5); color: #7C87E8; } /* drift-allow: this route legitimately shows other variants' hues side by side (see check-palette-drift.sh's own colour-check exclusion for simulator/); a comparison swatch, not a live theme surface */
  .pw-term {
    margin: auto 0 0;
    padding: 12px 14px;
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 11.5px;
    line-height: 1.65;
    color: var(--ig-text);
    background: var(--ig-base);
    border: var(--ig-border-default) solid var(--ig-border);
    box-shadow: 4px 4px 0 0 #000; /* NOTE: black shadow leftover pattern (see docs/SAGE_INK_AUDIT.md #7) - out of scope for this border-width pass */
    overflow-x: auto;
  }
  .pw-term .p { color: var(--ig-accent); }
  .pw-term .c { color: var(--ig-text-dim); }
  .pw-term .ok { color: var(--ig-positive); }
  .pw-term .d { color: var(--ig-text-muted); }
  @container (max-width: 520px) {
    .pw-cards { grid-template-columns: minmax(0, 1fr); }
    .pw-side { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pw-btn:hover { transform: none; }
  }

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
  .pal-sw:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 2px; }
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
