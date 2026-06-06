<script lang="ts">
  import { page } from '$app/stores';
  import '../lib/styles/tokens.css';
  import '../lib/styles/density.css';
  import '../lib/styles/liquid-glass.css';
  import '../lib/styles/global.css';

  let { children } = $props();

  const tabs = [
    { href: '/',                  label: 'Overview',     id: 'overview' },
    { href: '/browser/',          label: 'Browser',      id: 'browser' },
    { href: '/vscode/',           label: 'VSCode',       id: 'vscode' },
    { href: '/vscode/claude-code/', label: 'Claude Code', id: 'claude-code' },
    { href: '/grub/',             label: 'GRUB',         id: 'grub' }
  ];

  function isActive(href: string): boolean {
    if (href === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(href);
  }
</script>

<!-- Liquid Glass refraction filter - referenced by .ig-liquid -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="ig-liquid-glass" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.014" numOctaves="2" seed="7" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>

<div class="ig-shell">
  <header class="ig-shell-header" data-testid="shell-header">
    <div class="ig-brand">
      <span class="ig-brand-dot"></span>
      <span class="ig-brand-name">Indigo Glass</span>
      <span class="ig-brand-sub">simulator</span>
    </div>
    <nav class="ig-tabs" aria-label="Surfaces">
      {#each tabs as t}
        <a
          href={t.href}
          class="ig-tab"
          class:active={isActive(t.href)}
          data-testid="tab-{t.id}"
        >
          {t.label}
        </a>
      {/each}
    </nav>
  </header>

  <main class="ig-shell-main" data-testid="shell-main">
    {@render children()}
  </main>
</div>

<style>
  .ig-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--ig-base);
    color: var(--ig-text);
  }
  .ig-shell-header {
    display: flex;
    align-items: center;
    gap: var(--ig-gap-lg);
    padding: 4px 12px;
    background: var(--ig-surface);
    border-bottom: 1px solid var(--ig-border);
  }
  .ig-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--ig-font-chrome, "SF Pro Display", system-ui, sans-serif);
    font-size: 12pt;
    font-weight: 600;
  }
  .ig-brand-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--ig-indigo);
    box-shadow: 0 0 0 1px var(--ig-border-strong), 0 0 8px var(--ig-indigo-hi);
  }
  .ig-brand-sub {
    color: var(--ig-text-muted);
    font-weight: 400;
    font-size: 9pt;
  }
  .ig-tabs {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }
  .ig-tab {
    color: var(--ig-text-muted);
    text-decoration: none;
    padding: 3px 10px;
    border-radius: 4px;
    font-family: var(--ig-font-chrome, "SF Pro Display", system-ui, sans-serif);
    font-size: 10pt;
    transition: background var(--ig-dur-quick) var(--ig-ease-standard), color var(--ig-dur-quick);
  }
  .ig-tab:hover {
    background: var(--ig-border);
    color: var(--ig-text);
  }
  .ig-tab.active {
    background: color-mix(in srgb, var(--ig-indigo) 18%, transparent);
    color: var(--ig-text);
  }
  .ig-shell-main {
    flex: 1;
    overflow: auto;
  }
</style>
