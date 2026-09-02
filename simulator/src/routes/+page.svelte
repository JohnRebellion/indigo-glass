<script lang="ts">
  const surfaces = [
    { href: '/browser/',          name: 'Browser',                 desc: 'Stylus + Dark Reader cross-site retint' },
    { href: '/vscode/',           name: 'VSCode',                  desc: 'Sage Ink Dark color theme' },
    { href: '/vscode/claude-code/', name: 'Claude Code',           desc: 'Anthropic webview retint via patch-webview-css' },
    { href: '/grub/',             name: 'GRUB',                    desc: 'Boot picker theme (consolidated from grub-simulator)' }
  ];

  // Sage Ink default variant (deep-black ladder + muted-sage accent).
  const palette = [
    { token: 'base',        hex: '#07080A', role: 'Raycast-deep near-black' },
    { token: 'surface',     hex: '#0D0D10', role: 'Window background' },
    { token: 'surface_alt', hex: '#121216', role: 'Elevated panel, ink base' },
    { token: 'sage',        hex: '#A6C9A6', role: 'Brand primary (accent) - fill only, never text' },
    { token: 'sage_hi',     hex: '#C0E3C0', role: 'Hover, focus' },
    { token: 'sage_alt',    hex: '#89A889', role: 'Visited link, ink shadow colour' },
    { token: 'amber',       hex: '#FBBF24', role: 'Warning' },
    { token: 'positive',    hex: '#3FFABB', role: 'Success (hue nudged +12.5° off sage)' },
    { token: 'negative',    hex: '#ED254E', role: 'Error' },
    { token: 'text',        hex: '#F8F8F8', role: 'Primary text' },
    { token: 'text_muted',  hex: '#6B7280', role: 'Secondary text' }
  ];
</script>

<div class="ig-overview">
  <header class="ig-overview-hero">
    <h1>Sage Ink</h1>
    <p class="ig-tagline">neobrutalist ink — opaque, hard-shadow, colour-as-elevation</p>
    <p class="ig-sub">Compact, single-accent. Deep black + muted sage, OKLCH color, zero glass.</p>
  </header>

  <section class="ig-surfaces" data-testid="surfaces">
    <h2>Surfaces</h2>
    <div class="ig-grid">
      {#each surfaces as s}
        <a class="ig-card" href={s.href} data-testid="card-{s.name.toLowerCase().replace(/\s/g, '-')}">
          <strong>{s.name}</strong>
          <span>{s.desc}</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="ig-palette" data-testid="palette">
    <h2>Palette</h2>
    <div class="ig-swatches">
      {#each palette as p}
        <div class="ig-swatch" data-testid="swatch-{p.token}">
          <div class="ig-swatch-chip" style="background:{p.hex}"></div>
          <div class="ig-swatch-meta">
            <strong>{p.token}</strong>
            <code>{p.hex}</code>
            <span>{p.role}</span>
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .ig-overview {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 16px 32px;
  }
  .ig-overview-hero h1 {
    font-family: var(--ig-font-chrome, "SF Pro Display", system-ui, sans-serif);
    font-size: 23pt;
    font-weight: 700;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
  }
  .ig-tagline {
    color: var(--ig-text);
    font-size: 13pt;
    margin: 0 0 4px;
  }
  .ig-sub {
    color: var(--ig-text-muted);
    margin: 0;
    font-size: 10pt;
  }

  section {
    margin-top: 24px;
  }
  section h2 {
    font-size: 13pt;
    font-weight: 600;
    color: var(--ig-text-muted);
    margin: 0 0 8px;
    text-transform: none;
  }

  .ig-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
  }
  .ig-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    border-radius: var(--ig-radius-default);
    background: var(--ig-surface-alt);
    border: var(--ig-border-default) solid var(--ig-border-strong);
    box-shadow: var(--ig-shadow-ink);
    text-decoration: none;
    color: var(--ig-text);
    transition: transform var(--ig-motion-ink-press, 80ms steps(2, end)), box-shadow var(--ig-motion-ink-press, 80ms steps(2, end));
  }
  /* Press travels on :active, not :hover — adjudicated 2026-09-02 by
     cross-model audit. Travelling into the shadow is a press metaphor; firing
     it on pointer arrival announces an action that has not happened, and is
     pointer-only so keyboard and touch users never see it. Deliberate
     divergence from neobrutalism.dev, which uses :hover. */
  .ig-card:hover {
    border-color: var(--ig-accent);
  }
  .ig-card:active {
    border-color: var(--ig-accent);
    transform: translate(4px, 4px);
    box-shadow: var(--ig-shadow-none);
  }
  .ig-card strong {
    font-size: 11pt;
  }
  .ig-card span {
    color: var(--ig-text-muted);
    font-size: 9pt;
  }

  .ig-swatches {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 4px;
  }
  .ig-swatch {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    background: var(--ig-surface);
    border-radius: var(--ig-radius-xs); /* was --ig-radius-sm, a token that doesn't exist */
    border: 1px solid var(--ig-border);
  }
  .ig-swatch-chip {
    width: 32px;
    height: 32px;
    border-radius: var(--ig-radius-xs);
    border: 1px solid var(--ig-border-strong);
    flex-shrink: 0;
  }
  .ig-swatch-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 9pt;
    line-height: 1.2;
  }
  .ig-swatch-meta strong {
    font-size: 10pt;
  }
  .ig-swatch-meta code {
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    color: var(--ig-text-muted);
    font-size: 8pt;
  }
  .ig-swatch-meta span {
    color: var(--ig-text-muted);
    font-size: 8pt;
  }
</style>
