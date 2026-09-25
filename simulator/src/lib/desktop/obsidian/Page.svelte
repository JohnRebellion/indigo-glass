<script lang="ts">
  /* Obsidian: app shell (ribbon/sidebar/tabs/leaf), a note in reading view,
   * the editor, command palette, settings, status bar, context menu, tooltip.
   * Unlike KDE (a parsed INI model driving internal --k-* lane variables),
   * Obsidian is themed with real CSS custom properties an app's own
   * stylesheet already consumes - so the lane is painted by the REAL files,
   * scoped with sites/scopedStylus (the same reader /sites/ uses for its
   * Stylus files): stock.css scoped into BOTH lanes (it recreates Obsidian's
   * own default theme + the component rules that consume its variables),
   * then the shipped theme.css scoped into the "ours" lane only, injected
   * last so its `!important` declarations win the cascade exactly as they do
   * when Obsidian loads a theme after its own defaults. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import StructureCheck from './StructureCheck.svelte';
  import { scopePlainCss } from './cssTheme';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, stockCss, shippedCss, laneVars, coverage, ALL_CALLOUT_TYPES } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'Reconstructed Obsidian default (.theme-dark)', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'obsidian/Indigo Glass/theme.css', style: laneVars(ours), model: ours }
  };

  const stockScopedStock = scopePlainCss(stockCss, '[data-lane="stock"]');
  const oursScopedStock = scopePlainCss(stockCss, '[data-lane="ours"]');
  const oursScopedShipped = scopePlainCss(shippedCss, '[data-lane="ours"]');

  const files = ['Welcome.md', 'Projects', 'Daily notes', 'Sage Ink.md', 'Templates'];
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="shell" title="App shell" lead="Ribbon, left sidebar file explorer with an active file, tab header, workspace leaf" min="420px">
    <DPair name="workspace" span="full">
      {#snippet children()}
        <div class="theme-dark obs-shell">
          <div class="workspace-ribbon">
            <div class="side-dock-ribbon-action clickable-icon is-active">E</div>
            <div class="side-dock-ribbon-action clickable-icon">S</div>
            <div class="side-dock-ribbon-action clickable-icon">G</div>
          </div>
          <div class="obs-main">
            <div class="workspace-tab-header-container">
              <div class="workspace-tab-header is-active">Sage Ink.md</div>
              <div class="workspace-tab-header">Welcome.md</div>
            </div>
            <div class="obs-body">
              <div class="workspace-sidedock">
                <div class="nav-files-container">
                  {#each files as f, i}
                    <div class="nav-folder-title">
                      <span class="nav-folder-collapse-indicator">{i === 1 || i === 4 ? '▾' : ''}</span>{f}
                    </div>
                    {#if i === 3}<div class="nav-file-title is-active">Sage Ink.md</div>{/if}
                  {/each}
                </div>
              </div>
              <div class="workspace-leaf-content">
                <p>Active leaf content area.</p>
              </div>
            </div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="reading" title="Note (reading view)" lead="Headings, links (internal/external/unresolved), tags, blockquote, callouts, code, checklist, table, highlight" min="480px">
    <DPair name="reading view" span="full">
      {#snippet children()}
        <div class="theme-dark obs-shell obs-pad">
          <div class="markdown-preview-view">
            <h1>Sage Ink</h1>
            <h2>Design notes</h2>
            <h3>Palette</h3>
            <h4>Tokens</h4>
            <h5>Usage</h5>
            <h6>Appendix</h6>
            <p>
              See <a class="internal-link" href="#l">Welcome</a>,
              <a class="internal-link is-unresolved" href="#u">Missing Note</a> and
              <a class="external-link" href="https://example.com">the spec</a>.
              Tagged <a class="tag" href="#t">#design-system</a> <a class="tag" href="#t">#sage-ink</a>.
              This is <mark>highlighted</mark> text.
            </p>
            <blockquote>Opaque ink, hard offset shadow, radius 0.</blockquote>
            {#each ALL_CALLOUT_TYPES as type}
              <div class="callout" data-callout={type}>
                <div class="callout-title"><span class="callout-icon">●</span><span class="callout-title-inner">{type}</span></div>
                <div class="callout-content">A {type} callout.</div>
              </div>
            {/each}
            <p>Inline <code>const x = 1</code> and a block:</p>
            <pre><code>function ink() {'{'} return true; {'}'}</code></pre>
            <ul>
              <li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" checked /> Ship the theme</li>
              <li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" /> Verify on a live host</li>
            </ul>
            <table>
              <thead><tr><th>Token</th><th>Hex</th></tr></thead>
              <tbody>
                <tr><td>accent</td><td>#A6C9A6</td></tr>
                <tr><td>base</td><td>#07080A</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="editor" title="Editor" lead="Cursor, selection, active line, indent guide" min="380px">
    <DPair name="editor">
      {#snippet children()}
        <div class="theme-dark obs-shell obs-pad">
          <div class="cm-editor">
            <div class="cm-content">
              <div class="HyperMD-list-line cm-indent-guide">- a list line under an indent guide</div>
              <div class="cm-activeLine">the active line<span class="cm-cursor"></span></div>
              <div>normal text with a <span class="cm-selectionBackground">selected phrase</span> in it</div>
            </div>
          </div>
        </div>
      {/snippet}
    </DPair>

    <DPair name="command palette / modal" note="Modal + prompt input + suggestion list, one item selected.">
      {#snippet children()}
        <div class="theme-dark obs-shell obs-pad">
          <div class="modal-bg">
            <div class="modal prompt">
              <div class="prompt-input-container"><input class="prompt-input" value="sage ink" readonly /></div>
              <div class="suggestion-item is-selected">Open: <span class="suggestion-highlight">Sage</span> Ink.md</div>
              <div class="suggestion-item">Open: Welcome.md</div>
            </div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="Settings" lead="Toggle, slider, mod-cta button, and a destructive-action warning" min="360px">
    <DPair name="settings">
      {#snippet children()}
        <div class="theme-dark obs-shell obs-pad">
          <div class="setting-item">
            <span>Show line numbers</span>
            <div class="checkbox-container is-enabled"></div>
          </div>
          <div class="setting-item">
            <span>Editor font size</span>
            <input class="slider" type="range" min="8" max="32" value="16" />
          </div>
          <div class="setting-item">
            <span>Appearance</span>
            <button type="button" class="mod-cta">Save</button>
          </div>
          <p class="mod-success-banner">Vault backed up successfully.</p>
          <p class="mod-warning-banner">This action cannot be undone.</p>
          <textarea rows="2">Custom CSS snippet…</textarea>
          <div class="setting-item">
            <span>Delete vault</span>
            <button type="button" class="mod-destructive">Delete</button>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="chrome" title="Status bar, context menu, tooltip" min="280px">
    <DPair name="status bar">
      {#snippet children()}
        <div class="theme-dark obs-shell">
          <div class="status-bar">
            <span class="status-bar-item">1,204 words</span>
            <span class="status-bar-item">UTF-8</span>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="context menu">
      {#snippet children()}
        <div class="theme-dark obs-shell obs-pad">
          <div class="menu">
            <div class="menu-item">Rename</div>
            <div class="menu-item is-selected">Delete</div>
            <div class="menu-item is-disabled">Move (unavailable)</div>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="tooltip">
      {#snippet children()}
        <div class="theme-dark obs-shell obs-pad">
          <div class="tooltip">Pin this tab<span class="tooltip-arrow"></span></div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="popover" note="Obsidian's hover-preview popover for an internal link.">
      {#snippet children()}
        <div class="theme-dark obs-shell obs-pad">
          <div class="popover">
            <div class="markdown-preview-view"><h3>Welcome</h3><p>Hover preview content.</p></div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <StructureCheck />
</DesktopPage>

{@html `<style data-stock="obsidian">${stockScopedStock}</style>`}
{@html `<style data-ours-stock="obsidian">${oursScopedStock}</style>`}
{@html `<style data-ours-shipped="obsidian">${oursScopedShipped}</style>`}

<style>
  .obs-shell { width: 100%; display: flex; flex-direction: column; font-size: 13px; }
  .obs-pad { padding: 10px; }
  .obs-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .obs-body { display: flex; min-height: 140px; }
  .workspace-ribbon { width: 32px; }
  .side-dock-ribbon-action { text-align: center; margin: 2px 0; cursor: default; }
  .workspace-sidedock { width: 160px; flex-shrink: 0; }
  .workspace-leaf-content { flex: 1; padding: 8px; }
  .nav-folder-title, .nav-file-title { cursor: default; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .markdown-preview-view h1, .markdown-preview-view h2, .markdown-preview-view h3,
  .markdown-preview-view h4, .markdown-preview-view h5, .markdown-preview-view h6 { margin: 6px 0 2px; }
  .markdown-preview-view p { margin: 4px 0; }
  .markdown-preview-view table { margin: 6px 0; }
  .cm-content > div { padding: 1px 0; }
  .cm-cursor { display: inline-block; width: 1px; height: 1em; vertical-align: -2px; }
  .modal-bg { width: 100%; padding: 20px; display: flex; justify-content: center; }
  .modal.prompt { width: 100%; max-width: 320px; }
  .setting-item { gap: 10px; }
  .status-bar { width: 100%; display: flex; }
  .menu { width: 180px; }
</style>
