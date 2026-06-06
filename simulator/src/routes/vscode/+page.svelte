<script lang="ts">
  let active = $state('index.ts');
  const files = [
    { name: 'README.md', icon: 'doc' },
    { name: 'index.ts', icon: 'ts' },
    { name: 'theme.json', icon: 'json' },
    { name: 'package.json', icon: 'json' },
    { name: 'tokens.toml', icon: 'toml' }
  ];

  const samples: Record<string, string> = {
    'README.md': `# Indigo Glass\n\nvisionOS spatial glass + Linear dark discipline.`,
    'index.ts': `import { palette } from './tokens';\n\nexport function applyTheme(host: string): void {\n  const tokens = palette[host];\n  document.documentElement.style.setProperty('--ig-indigo', tokens.indigo);\n}\n\nconst result = applyTheme('default');`,
    'theme.json': `{\n  "name": "Indigo Glass Dark",\n  "type": "dark",\n  "colors": {\n    "editor.background": "#0F0F12",\n    "editor.foreground": "#F8F8F8"\n  }\n}`,
    'package.json': `{\n  "name": "indigo-glass",\n  "version": "0.1.0"\n}`,
    'tokens.toml': `[palette.sRGB]\nbase = "#0F0F12"\nindigo = "#5E6AD2"`
  };
</script>

<div class="vscode" data-testid="sim-vscode">
  <div class="title-bar">
    <span class="title-traffic">
      <span class="tl tl-close"></span>
      <span class="tl tl-min"></span>
      <span class="tl tl-max"></span>
    </span>
    <span class="title-text">{active} - indigo-glass - Visual Studio Code Insiders</span>
  </div>

  <div class="layout">
    <div class="activity-bar">
      <span class="ab-item ab-active" title="Explorer">📁</span>
      <span class="ab-item" title="Search">🔍</span>
      <span class="ab-item" title="Source Control">⎇</span>
      <span class="ab-item" title="Run">▶</span>
      <span class="ab-item" title="Extensions">⊞</span>
      <span class="ab-spacer"></span>
      <span class="ab-item" title="Accounts">👤</span>
      <span class="ab-item" title="Settings">⚙</span>
    </div>

    <div class="side-bar">
      <div class="side-header">EXPLORER</div>
      <ul class="file-list">
        {#each files as f}
          <li>
            <button
              type="button"
              class="file"
              class:active={active === f.name}
              onclick={() => (active = f.name)}
              data-testid="file-{f.name.replace('.', '-')}"
            >
              <span class="file-icon">{f.icon}</span>
              <span class="file-name">{f.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>

    <div class="editor">
      <div class="tab-strip">
        <div class="tab tab-active">
          <span>{active}</span>
          <span class="tab-close">×</span>
        </div>
      </div>
      <div class="editor-body">
        <div class="gutter">
          {#each Array(samples[active]?.split('\n').length || 1) as _, i}
            <span class="ln">{i + 1}</span>
          {/each}
        </div>
        <pre class="code"><code>{samples[active] || ''}</code></pre>
      </div>
    </div>
  </div>

  <div class="status-bar">
    <span class="sb-item sb-branch">⎇ main</span>
    <span class="sb-item">0↑ 0↓</span>
    <span class="sb-flex"></span>
    <span class="sb-item">Ln 1, Col 1</span>
    <span class="sb-item">UTF-8</span>
    <span class="sb-item">TypeScript</span>
  </div>
</div>

<style>
  .vscode {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 36px);
    background: var(--ig-base);
    color: var(--ig-text);
    font-family: "SF Pro Display", -apple-system, system-ui, sans-serif;
    font-size: 10pt;
  }

  .title-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 8px;
    background: var(--ig-surface);
    border-bottom: 1px solid var(--ig-border);
    font-size: 9pt;
    color: var(--ig-text-muted);
  }
  .title-traffic { display: flex; gap: 4px; }
  .tl { width: 10px; height: 10px; border-radius: 50%; }
  .tl-close { background: var(--ig-negative); }
  .tl-min { background: var(--ig-amber); }
  .tl-max { background: var(--ig-positive); }

  .layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .activity-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    width: 42px;
    background: var(--ig-base);
    border-right: 1px solid var(--ig-border);
  }
  .ab-item {
    color: var(--ig-text-muted);
    font-size: 16px;
    cursor: pointer;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .ab-item:hover { color: var(--ig-text); background: var(--ig-border); }
  .ab-active { color: var(--ig-text); border-left: 2px solid var(--ig-indigo); padding-left: 2px; margin-left: -2px; }
  .ab-spacer { flex: 1; }

  .side-bar {
    width: 200px;
    background: var(--ig-base);
    border-right: 1px solid var(--ig-border);
    display: flex;
    flex-direction: column;
  }
  .side-header {
    padding: 4px 12px;
    font-size: 8pt;
    color: var(--ig-text-muted);
    letter-spacing: 0.08em;
  }
  .file-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .file-list li {
    margin: 0;
    padding: 0;
  }
  .file {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 12px;
    cursor: pointer;
    font-size: 10pt;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
  }
  .file:hover { background: color-mix(in srgb, var(--ig-indigo) 10%, transparent); }
  .file.active {
    background: color-mix(in srgb, var(--ig-indigo) 22%, transparent);
    color: var(--ig-text);
  }
  .file-icon {
    font-family: "Iosevka Custom Condensed", monospace;
    font-size: 8pt;
    color: var(--ig-indigo-hi);
    width: 16px;
  }

  .editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--ig-base);
    min-width: 0;
  }
  .tab-strip {
    display: flex;
    background: var(--ig-base);
    border-bottom: 1px solid var(--ig-border);
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--ig-surface-alt);
    color: var(--ig-text);
    font-size: 9pt;
    border-right: 1px solid var(--ig-border);
    border-top: 2px solid transparent;
  }
  .tab-active { border-top-color: var(--ig-indigo); }
  .tab-close { color: var(--ig-text-muted); cursor: pointer; }

  .editor-body {
    flex: 1;
    display: flex;
    overflow: auto;
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    font-size: 10pt;
    line-height: 1.4;
  }
  .gutter {
    display: flex;
    flex-direction: column;
    padding: 8px 6px 8px 8px;
    color: var(--ig-text-muted);
    text-align: right;
    user-select: none;
    background: var(--ig-base);
  }
  .ln { font-size: 9pt; }
  .code {
    flex: 1;
    margin: 0;
    padding: 8px 12px;
    background: var(--ig-base);
    color: var(--ig-text);
    white-space: pre;
    overflow: auto;
  }

  .status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    background: var(--ig-base);
    border-top: 1px solid var(--ig-border);
    color: var(--ig-text-muted);
    font-size: 9pt;
    height: 22px;
  }
  .sb-item { padding: 0 6px; }
  .sb-branch { color: var(--ig-indigo-hi); }
  .sb-flex { flex: 1; }
</style>
