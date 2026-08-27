<script lang="ts">
  /**
   * Glass & Ink — material comparison surface.
   *
   * Renders one mock application window. Chrome (window frame, titlebar,
   * sidebar) is glass in BOTH variants; only content objects change, so the
   * comparison isolates a single variable:
   *
   *   variant="ink"   — cards/buttons/terminal are opaque, square, hard 4px
   *                     offset shadow (chrome-only glass)
   *   variant="glass" — cards/buttons/terminal are translucent, rounded, soft
   *                     shadow (status quo: glass everywhere)
   *
   * Content is identical between variants by construction.
   */
  let {
    variant = 'ink',
    accentName = 'Sage',
    accentContrast = '11.00:1',
    titleLabel = 'tokens · sage ink'
  }: {
    variant?: 'ink' | 'glass';
    /** Accent label shown on the first contrast card — keep it truthful when the accent is swapped. */
    accentName?: string;
    /** Measured contrast of that accent against the current base. */
    accentContrast?: string;
    /** Titlebar text — keep in sync with whichever variant is actually active. */
    titleLabel?: string;
  } = $props();

  const sidebar = [
    { icon: '▤', label: 'Tokens', active: true },
    { icon: '◫', label: 'Surfaces', active: false },
    { icon: '◇', label: 'Variants', active: false },
    { icon: '⌗', label: 'Parity', active: false },
    { icon: '⎋', label: 'Deploy', active: false }
  ];

  const tabs = [
    { label: 'codegen.py', active: true },
    { label: 'tokens.toml', active: false },
    { label: 'klassy.ini', active: false }
  ];

  const cards = $derived([
    {
      kicker: 'Contrast',
      title: `${accentName} on base`,
      value: accentContrast,
      note: 'Measured against this variant’s own base, not lime’s.'
    },
    {
      kicker: 'Contrast',
      title: 'Hazard 2 on base',
      value: '5.10:1',
      note: 'Indigo #5E6AD2. AA large only — cannot carry small text.'
    }
  ]);
</script>

<div class="gi" data-variant={variant} data-testid="glass-ink-{variant}">
  <div class="gi-win ig-glass">
    <div class="gi-title">
      <span class="gi-dots"><i></i><i></i><i></i></span>
      <span class="gi-title-text">{titleLabel}</span>
      <span class="gi-title-meta">{variant === 'ink' ? 'chrome-only glass' : 'glass everywhere'}</span>
    </div>

    <div class="gi-body">
      <aside class="gi-side">
        {#each sidebar as s}
          <div class="gi-side-item" class:active={s.active}>
            <span class="gi-side-icon">{s.icon}</span>{s.label}
          </div>
        {/each}
      </aside>

      <div class="gi-main">
        <div class="gi-tabs">
          {#each tabs as t}
            <span class="gi-tab" class:active={t.active}>{t.label}</span>
          {/each}
        </div>

        <div class="gi-hazard">
          <span class="gi-kicker gi-kicker-on-fill">Hazard block · one per view</span>
          <h3>Colour is the elevation</h3>
          <p>Hierarchy by saturated fill, not by shadow depth.</p>
        </div>

        <div class="gi-cards">
          {#each cards as c}
            <div class="gi-card">
              <span class="gi-kicker">{c.kicker}</span>
              <strong class="gi-card-title">{c.title}</strong>
              <span class="gi-card-value">{c.value}</span>
              <p class="gi-card-note">{c.note}</p>
            </div>
          {/each}
        </div>

        <div class="gi-btns">
          <button type="button" class="gi-btn primary">Regenerate</button>
          <button type="button" class="gi-btn ghost">Diff</button>
          <span class="gi-badge">schema v3</span>
          <span class="gi-badge alt">2 variants</span>
        </div>

        <pre class="gi-term"><span class="p">~/indigo-glass</span> <span class="c">$</span> python3 tokens/codegen.py
<span class="ok">✓</span> css-vars.lime.css      <span class="d">22 tokens</span>
<span class="ok">✓</span> kde-palette.lime.colors <span class="d">18 roles</span>
<span class="ok">✓</span> klassy-radius.ini       <span class="d">glass 18 · ink 0</span></pre>
      </div>
    </div>
  </div>
</div>

<style>
  /* ---- material definitions: the only thing that differs ---- */
  .gi[data-variant='ink'] {
    --gi-obj-bg: var(--ig-surface);
    --gi-obj-blur: none;
    --gi-obj-radius: 0px;
    --gi-obj-border: rgba(168, 230, 53, 0.45);
    --gi-obj-shadow: 4px 4px 0 0 var(--ig-accent-alt);
    --gi-obj-shadow-quiet: 4px 4px 0 0 #000;
    --gi-obj-press: translate(4px, 4px);
    --gi-obj-press-shadow: 0 0 0 0 #000;
    --gi-obj-motion: 80ms steps(2, end);
    --gi-tag-radius: 2px;
  }
  .gi[data-variant='glass'] {
    --gi-obj-bg: rgba(18, 18, 22, 0.70);
    --gi-obj-blur: blur(13px) saturate(110%);
    --gi-obj-radius: 12px;
    --gi-obj-border: var(--ig-glass-border);
    --gi-obj-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    --gi-obj-shadow-quiet: 0 4px 14px rgba(0, 0, 0, 0.35);
    --gi-obj-press: none;
    --gi-obj-press-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    --gi-obj-motion: 200ms cubic-bezier(0.2, 0, 0, 1);
    --gi-tag-radius: 9999px;
  }

  .gi {
    --gi-display: 'Anton', 'Iosevka Custom Heavy Condensed', Impact, 'Inter Display', sans-serif;
    --gi-label: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    container-type: inline-size;
  }

  /* ---- chrome: glass in BOTH variants ---- */
  .gi-win {
    border-radius: 18px;
    overflow: hidden;
    min-height: 470px;
    display: flex;
    flex-direction: column;
  }
  .gi-title {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    border-bottom: 1px solid var(--ig-border);
    background: rgba(10, 10, 13, 0.45);
  }
  .gi-dots { display: flex; gap: 5px; }
  .gi-dots i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ig-border-strong);
  }
  .gi-dots i:first-child { background: var(--ig-accent); }
  .gi-title-text {
    font-family: var(--gi-label);
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ig-text-muted);
  }
  .gi-title-meta {
    margin-left: auto;
    font-family: var(--gi-label);
    font-size: 9.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ig-accent);
  }

  .gi-body { display: flex; flex: 1; min-height: 0; }

  .gi-side {
    width: 148px;
    flex: 0 0 148px;
    padding: 10px 8px;
    border-right: 1px solid var(--ig-border);
    background: rgba(10, 10, 13, 0.40);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .gi-side-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 9px;
    border-radius: 12px;
    font-size: 12.5px;
    color: var(--ig-text-muted);
  }
  .gi-side-item.active {
    background: rgba(168, 230, 53, 0.10);
    color: var(--ig-text);
    box-shadow: inset 2px 0 0 0 var(--ig-accent);
  }
  .gi-side-icon { color: var(--ig-accent); font-size: 11px; }

  .gi-main {
    flex: 1;
    min-width: 0;
    padding: 14px 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ---- tabs: active underline is the Verge inset move ---- */
  .gi-tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--ig-border);
  }
  .gi-tab {
    font-family: var(--gi-label);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ig-text-dim);
    padding: 7px 11px;
  }
  .gi-tab.active {
    color: var(--ig-text);
    box-shadow: 0 -1px 0 0 var(--ig-accent) inset;
  }

  /* ---- objects: material comes from the variant vars ---- */
  .gi-hazard {
    background: var(--ig-accent);
    color: var(--ig-base);
    border-radius: var(--gi-obj-radius);
    box-shadow: var(--gi-obj-shadow-quiet);
    padding: 14px 16px;
  }
  .gi[data-variant='glass'] .gi-hazard {
    background: rgba(168, 230, 53, 0.14);
    color: var(--ig-text);
    border: 1px solid var(--gi-obj-border);
    -webkit-backdrop-filter: var(--gi-obj-blur);
    backdrop-filter: var(--gi-obj-blur);
  }
  .gi-hazard h3 {
    font-family: var(--gi-display);
    font-size: 26px;
    line-height: 0.9;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    margin: 0 0 4px;
  }
  .gi-hazard p { margin: 0; font-size: 12.5px; opacity: 0.78; }

  .gi-kicker {
    display: block;
    font-family: var(--gi-label);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ig-accent);
    margin-bottom: 7px;
  }
  .gi-kicker-on-fill { color: rgba(7, 8, 10, 0.62); }
  .gi[data-variant='glass'] .gi-kicker-on-fill { color: var(--ig-accent); }

  .gi-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .gi-card {
    background: var(--gi-obj-bg);
    border: 1px solid var(--gi-obj-border);
    border-radius: var(--gi-obj-radius);
    box-shadow: var(--gi-obj-shadow);
    -webkit-backdrop-filter: var(--gi-obj-blur);
    backdrop-filter: var(--gi-obj-blur);
    padding: 13px 15px;
  }
  .gi-card-title { display: block; font-size: 13px; }
  .gi-card-value {
    display: block;
    font-family: var(--gi-display);
    font-size: 34px;
    line-height: 1;
    letter-spacing: 0.01em;
    color: var(--ig-accent);
    font-variant-numeric: tabular-nums;
    margin: 4px 0 6px;
  }
  .gi-card-note {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.4;
    color: var(--ig-text-muted);
  }

  /* ---- buttons: the tactile demo ---- */
  .gi-btns { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .gi-btn {
    font-family: var(--gi-label);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 8px 14px;
    border-radius: var(--gi-obj-radius);
    transition: transform var(--gi-obj-motion), box-shadow var(--gi-obj-motion);
  }
  .gi-btn.primary {
    background: var(--ig-accent);
    color: var(--ig-base);
    border: 1px solid var(--ig-accent);
    box-shadow: var(--gi-obj-shadow-quiet);
  }
  .gi-btn.ghost {
    background: transparent;
    color: var(--ig-accent);
    border: 1px solid var(--ig-accent);
    box-shadow: var(--gi-obj-shadow);
  }
  .gi-btn:active {
    transform: var(--gi-obj-press);
    box-shadow: var(--gi-obj-press-shadow);
  }
  .gi-btn:focus-visible { outline: 2px solid var(--ig-accent-hi); outline-offset: 2px; }

  .gi-badge {
    font-family: var(--gi-label);
    font-size: 9.5px;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    padding: 4px 9px;
    border-radius: var(--gi-tag-radius);
    border: 1px solid var(--ig-border-strong);
    color: var(--ig-text-muted);
  }
  .gi-badge.alt { border-color: rgba(94, 106, 210, 0.5); color: #7C87E8; }

  /* ---- terminal: ink in both readings, but obeys the variant ---- */
  .gi-term {
    margin: auto 0 0;
    padding: 12px 14px;
    font-family: 'Iosevka Custom Condensed', 'JetBrains Mono', monospace;
    font-size: 11.5px;
    line-height: 1.65;
    color: var(--ig-text);
    background: var(--gi-obj-bg);
    border: 1px solid var(--ig-border);
    border-radius: var(--gi-obj-radius);
    box-shadow: var(--gi-obj-shadow-quiet);
    -webkit-backdrop-filter: var(--gi-obj-blur);
    backdrop-filter: var(--gi-obj-blur);
    overflow-x: auto;
  }
  .gi-term .p { color: var(--ig-accent); }
  .gi-term .c { color: var(--ig-text-dim); }
  .gi-term .ok { color: var(--ig-positive); }
  .gi-term .d { color: var(--ig-text-muted); }

  @container (max-width: 520px) {
    .gi-cards { grid-template-columns: minmax(0, 1fr); }
    .gi-side { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .gi-btn { transition: none; }
    .gi-btn:active { transform: none; }
  }
</style>
