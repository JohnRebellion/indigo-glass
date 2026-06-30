<script lang="ts">
  const surfaces = [
    { href: '/browser/',          name: 'Browser',                 desc: 'Stylus + Dark Reader cross-site retint' },
    { href: '/vscode/',           name: 'VSCode',                  desc: 'Lime Glass Dark color theme' },
    { href: '/vscode/claude-code/', name: 'Claude Code',           desc: 'Anthropic webview retint via patch-webview-css' },
    { href: '/grub/',             name: 'GRUB',                    desc: 'Boot picker theme (consolidated from grub-simulator)' }
  ];

  // Lime Glass default variant (deep-black ladder + ghost-lime accent).
  const palette = [
    { token: 'base',        hex: '#07080A', role: 'Raycast-deep near-black' },
    { token: 'surface',     hex: '#0D0D10', role: 'Window background' },
    { token: 'surface_alt', hex: '#121216', role: 'Elevated panel, glass base' },
    { token: 'lime',        hex: '#A8E635', role: 'Brand primary (accent)' },
    { token: 'lime_hi',     hex: '#C1FF58', role: 'Hover, focus' },
    { token: 'lime_alt',    hex: '#8BC407', role: 'Visited link, accent' },
    { token: 'amber',       hex: '#FBBF24', role: 'Warning' },
    { token: 'positive',    hex: '#71F79F', role: 'Success' },
    { token: 'negative',    hex: '#ED254E', role: 'Error' },
    { token: 'text',        hex: '#F8F8F8', role: 'Primary text' },
    { token: 'text_muted',  hex: '#6B7280', role: 'Secondary text' }
  ];
</script>

<div class="ig-overview ig-ambient">
  <header class="ig-overview-hero">
    <h1>Lime Glass</h1>
    <p class="ig-tagline">brutalist-glass + Linear dark discipline + Neumorphism 2.0</p>
    <p class="ig-sub">Compact, translucent, single-accent. Deep black + ghost lime, OKLCH color, grained glass, squircle corners.</p>
  </header>

  <section class="ig-surfaces" data-testid="surfaces">
    <h2>Surfaces</h2>
    <div class="ig-grid">
      {#each surfaces as s}
        <a class="ig-card ig-liquid ig-liquid-squircle" href={s.href} data-testid="card-{s.name.toLowerCase().replace(/\s/g, '-')}">
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
    background: color-mix(in srgb, var(--ig-surface-alt) 70%, transparent);
    border: 1px solid var(--ig-border);
    text-decoration: none;
    color: var(--ig-text);
    backdrop-filter: blur(var(--ig-blur-md));
  }
  .ig-card:hover {
    border-color: var(--ig-indigo);
    background: color-mix(in srgb, var(--ig-indigo) 12%, var(--ig-surface-alt));
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
    border-radius: var(--ig-radius-sm);
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
