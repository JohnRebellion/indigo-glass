<script lang="ts">
  let active = $state('index.ts');
  // Toggle: layered UI (3 tonal tiers, Microsoft 2026-style) vs flat (single surface)
  let layered = $state(true);
  // Toggle the "Actions" tier demo: a floating command palette overlay
  let showPalette = $state(true);
  // Toggle the Chat panel (a Tools-tier surface on the right)
  let showChat = $state(true);

  const files = [
    { name: 'README.md', icon: 'doc' },
    { name: 'index.ts', icon: 'ts' },
    { name: 'theme.json', icon: 'json' },
    { name: 'package.json', icon: 'json' },
    { name: 'tokens.toml', icon: 'toml' }
  ];

  const samples: Record<string, string> = {
    'README.md': `# Sage Ink\n\nneobrutalist ink - opaque, hard-shadow.`,
    'index.ts': `import { palette } from './tokens';\n\nexport function applyTheme(host: string): void {\n  const tokens = palette[host];\n  document.documentElement.style.setProperty('--ig-indigo', tokens.indigo);\n}\n\nconst result = applyTheme('default');`,
    'theme.json': `{\n  "name": "Sage Ink Dark",\n  "type": "dark",\n  "colors": {\n    "editor.background": "#07080A",\n    "editor.foreground": "#F8F8F8"\n  }\n}`,
    'package.json': `{\n  "name": "indigo-glass",\n  "version": "0.1.0"\n}`,
    'tokens.toml': `[variants.lime]\nbase = "#07080A"\naccent = "#A8E635"`
  };
</script>

<div
  class="vscode"
  class:layered
  data-testid="sim-vscode"
>
  <!-- Demo controls: toggle the 2026 layered treatment -->
  <div class="demo-controls" data-testid="demo-controls">
    <label><input type="checkbox" bind:checked={layered} /> Layered UI</label>
    <label><input type="checkbox" bind:checked={showChat} /> Chat panel</label>
    <label><input type="checkbox" bind:checked={showPalette} /> Command palette</label>
  </div>

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
      <span class="ab-item" title="Chat">💬</span>
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

    {#if showChat}
      <!-- CHAT PANEL: Tools tier (mid-tonal) + squircle at container boundary only -->
      <aside class="chat-panel ig-squircle-container" data-testid="chat-panel">
        <div class="chat-header">
          <span class="chat-title">💬 CHAT</span>
          <span class="chat-model">sage-ink · claude</span>
        </div>
        <div class="chat-body">
          <div class="chat-msg chat-msg-user">
            Add token for the layered UI tiers
          </div>
          <div class="chat-msg chat-msg-ai">
            <p>I'll add three tonal steps to your token file:</p>
            <pre class="chat-code">workbench = "#07080A"
tools     = "#0D0D10"
actions   = "#121216"</pre>
            <p>They map to Microsoft's 2026 Workbench/Tools/Actions hierarchy while staying in your deep-black ladder.</p>
          </div>
        </div>
        <div class="chat-input-wrap">
          <input class="chat-input" placeholder="Ask Copilot…" />
          <button class="chat-send">↑</button>
        </div>
      </aside>
    {/if}
  </div>

  <div class="status-bar">
    <span class="sb-item sb-branch">⎇ main</span>
    <span class="sb-item">0↑ 0↓</span>
    <span class="sb-flex"></span>
    <span class="sb-item">Ln 1, Col 1</span>
    <span class="sb-item">UTF-8</span>
    <span class="sb-item">TypeScript</span>
  </div>

  {#if showPalette}
    <!-- COMMAND PALETTE: Actions tier (top-tonal, floats above workbench+tools) -->
    <div class="palette-overlay" data-testid="palette">
      <div class="palette">
        <input class="palette-input" placeholder="Type '?' for help" value=">Preferences: Color Theme" />
        <ul class="palette-list">
          <li class="palette-item palette-active">
            <span class="palette-icon">🎨</span>
            <span class="palette-label">Preferences: Color Theme</span>
            <kbd class="palette-kbd">⌘K ⌘T</kbd>
          </li>
          <li class="palette-item">
            <span class="palette-icon">🎨</span>
            <span class="palette-label">Preferences: File Icon Theme</span>
          </li>
          <li class="palette-item">
            <span class="palette-icon">⚙</span>
            <span class="palette-label">Preferences: Open Settings (UI)</span>
            <kbd class="palette-kbd">⌘,</kbd>
          </li>
        </ul>
      </div>
    </div>
  {/if}
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
    font-family: "Iosevka Custom Condensed", "Iosevka Custom", "MesloLGS NF", "JetBrainsMono Nerd Font", Consolas, monospace;
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
    font-family: "Iosevka Custom Condensed", "Iosevka Custom", "MesloLGS NF", monospace;
  }
  .ln {
    font-size: 9pt;
    font-family: inherit;
  }
  .code,
  .code code {
    flex: 1;
    margin: 0;
    padding: 8px 12px;
    background: var(--ig-base);
    color: var(--ig-text);
    white-space: pre;
    overflow: auto;
    font-family: "Iosevka Custom Condensed", "Iosevka Custom", "MesloLGS NF", "JetBrainsMono Nerd Font", Consolas, monospace !important;
    font-size: 10pt;
    line-height: 1.4;
  }
  .code code {
    padding: 0;
    background: transparent;
    display: block;
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

  /* ============================================================
   * 2026 LAYERED UI — three tonal tiers borrowed from VS Code Dark 2026,
   * mapped onto Sage Ink's deep-black ladder.
   *
   *   .vscode.layered .*             — activates the layered treatment
   *   Workbench (deepest)   editor + tab-strip + gutter + status  =  var(--ig-base)        #07080A
   *   Tools (mid)           activity-bar + side-bar + chat-panel  =  var(--ig-surface)     #0D0D10
   *   Actions (top)         command palette overlay + tooltips    =  var(--ig-surface-alt) #121216
   *
   * Border-hierarchy stays consistent with the brutalist-glass rule:
   * hairline structural borders (~6% white); accent only on active/focused.
   * ============================================================ */
  .vscode.layered .activity-bar,
  .vscode.layered .side-bar {
    background: var(--ig-surface);
  }
  .vscode.layered .title-bar {
    background: var(--ig-surface);  /* titlebar aligns with Tools tier */
  }

  /* Demo controls */
  .demo-controls {
    display: flex;
    gap: 14px;
    padding: 4px 12px;
    background: var(--ig-surface-alt);
    border-bottom: 1px solid var(--ig-border);
    font-size: 9pt;
    color: var(--ig-text-muted);
    flex-wrap: wrap;
  }
  .demo-controls label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .demo-controls input[type="checkbox"] { accent-color: var(--ig-indigo); }

  /* ── Chat panel (Tools tier) — opaque ink surface ───────────────── */
  .chat-panel {
    position: relative;
    width: 320px;
    display: flex;
    flex-direction: column;
    background-color: var(--ig-surface);
    border-left: 1px solid var(--ig-border);
    isolation: isolate;
    min-width: 0;
  }
  .vscode.layered .chat-panel {
    background-color: var(--ig-surface-alt);
    /* hairline to signal it's a Tools surface, not part of the editor */
    box-shadow: inset 1px 0 0 var(--ig-border);
  }
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 8pt;
    letter-spacing: 0.08em;
    color: var(--ig-text-muted);
    border-bottom: 1px solid var(--ig-border);
  }
  .chat-model {
    font-family: "Iosevka Custom Condensed", monospace;
    color: var(--ig-indigo);
    letter-spacing: 0;
  }
  .chat-body {
    flex: 1;
    padding: 8px 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .chat-msg {
    padding: 6px 9px;
    border-radius: 6px;
    font-size: 9pt;
    line-height: 1.45;
  }
  .chat-msg p { margin: 0 0 4px; }
  .chat-msg p:last-child { margin-bottom: 0; }
  .chat-msg-user {
    background: color-mix(in srgb, var(--ig-indigo) 12%, transparent);
    border: 1px solid var(--ig-border);
    align-self: flex-end;
    max-width: 85%;
    color: var(--ig-text);
  }
  .chat-msg-ai {
    background: var(--ig-base);
    border: 1px solid var(--ig-border);
    max-width: 95%;
    color: var(--ig-text);
  }
  .vscode.layered .chat-msg-ai {
    background: var(--ig-surface-alt);  /* stand out slightly against Tools tier */
  }
  .chat-code {
    margin: 4px 0;
    padding: 6px 8px;
    background: var(--ig-base);
    border: 1px solid var(--ig-border);
    border-radius: 4px;
    font-family: "Iosevka Custom Condensed", monospace;
    font-size: 8.5pt;
    color: var(--ig-indigo-hi);
    line-height: 1.35;
  }
  .chat-input-wrap {
    display: flex;
    gap: 6px;
    padding: 8px;
    border-top: 1px solid var(--ig-border);
    background: inherit;
  }
  .chat-input {
    flex: 1;
    padding: 5px 8px;
    background: var(--ig-base);
    border: 1px solid var(--ig-border);
    border-radius: 4px;
    color: var(--ig-text);
    font-family: inherit;
    font-size: 9pt;
    outline: none;
  }
  .chat-input:focus { border-color: var(--ig-indigo); }
  .chat-send {
    padding: 5px 10px;
    background: var(--ig-indigo);
    color: #0A0B08;
    border: 1px solid var(--ig-indigo);
    border-radius: 4px;
    font-weight: 700;
    cursor: pointer;
  }

  /* ── Command palette overlay (Actions tier) ─────────────────── */
  .palette-overlay {
    position: absolute;
    top: 72px;   /* just below the titlebar + demo-controls */
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    pointer-events: none;   /* it's a static demo, not interactive */
  }
  .palette {
    width: 560px;
    background: var(--ig-surface);  /* flat mode: same tone as editor variants */
    border: 1px solid var(--ig-border);
    border-radius: 0;
    box-shadow: 14px 14px 0 0 rgba(0,0,0,0.9);
    overflow: hidden;
    font-size: 9pt;
  }
  .vscode.layered .palette {
    background: var(--ig-surface-alt);  /* Actions tier: highest tone -> clearly floats */
    box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px var(--ig-border-strong);
  }
  .palette-input {
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--ig-border);
    color: var(--ig-text);
    font-family: inherit;
    font-size: 10pt;
    outline: none;
  }
  .palette-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    max-height: 300px;
    overflow-y: auto;
  }
  .palette-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    color: var(--ig-text);
  }
  .palette-icon { width: 16px; }
  .palette-label { flex: 1; }
  .palette-kbd {
    font-family: "Iosevka Custom Condensed", monospace;
    font-size: 8pt;
    color: var(--ig-text-muted);
    background: var(--ig-base);
    border: 1px solid var(--ig-border);
    border-radius: 3px;
    padding: 1px 5px;
  }
  .palette-active {
    background: color-mix(in srgb, var(--ig-indigo) 22%, transparent);
  }
  .vscode.layered .palette-active {
    background: color-mix(in srgb, var(--ig-indigo) 28%, transparent);
  }

  /* Reposition palette so its overlay works — need relative on .vscode */
  .vscode { position: relative; }
</style>
