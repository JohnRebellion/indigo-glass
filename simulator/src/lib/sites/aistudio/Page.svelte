<script lang="ts">
  /* Google AI Studio: ms-app shell (header, nav-content, chat page, run
   * settings), chunks and code blocks, prompt input, category cards,
   * Material controls, cards, menu, dialog, feedback. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="shell" title="ms-app shell" lead="ms-app › .banner-and-app-container › ms-header + ms-navbar .nav-content (active / aria-current / playground-link.active-override) + .page-container › ms-chat-page with toolbar, chunks, prompt input, ms-run-settings" min="720px">
    <Pair name="ms-app ms-header .nav-content .toolbar-container ms-text-chunk .chunk-editor ms-code-block ms-prompt-input-wrapper .ctrl-enter-submits ms-run-settings" wrap={false} span="full">
      <ms-app class="shell"><div class="banner-and-app-container"><a class="skip-content shown" href="#">Skip to main content</a>
        <ms-header><span class="logo">Google <span>AI Studio</span></span><div class="right"><button class="paid-api-key-button">🔑 Get API key</button><button class="upgrade-button">✦ Upgrade</button><button class="account-switcher-button">JR</button></div></ms-header>
        <div class="body"><ms-navbar class="v3-left-nav"><div class="nav-content"><a class="playground-link active-override" href="#">💬 Chat</a><a href="#">🎥 Stream</a><a href="#">🖼 Generate media</a><a href="#">🧩 Build</a><a class="active" href="#">📜 History</a><a aria-current="page" href="#">🔑 API keys</a><div class="heading">More</div><a href="#">📚 Documentation</a><a href="#">⚙ Settings</a><div class="upgrade-card-wrapper"><div class="upgrade-card"><b>Upgrade to paid</b><small>Higher rate limits, no data used for training.</small><button class="cta">Upgrade</button></div></div></div></ms-navbar>
          <div class="page-container"><ms-chat-page><div class="toolbar-container"><span class="title">Sage Ink stock pages</span><span class="token-count">1,240 / 1,048,576 <span class="progress-bar" style="width:120px"><span style="width:2%"></span></span></span><div class="right"><button class="icon-btn"><i>⎘</i></button><button class="icon-btn"><i>↗</i></button><button class="icon-btn"><i>⋯</i></button></div></div>
            <div class="chat-body"><ms-text-chunk class="user"><div class="role">User</div>Which shell classes does the file force to ink?</ms-text-chunk>
              <ms-text-chunk><div class="role"><span class="avatar-dot"></span> Model · gemini-2.5-pro</div><div class="chunk-editor"><div class="chunk-editor-main">Five shell surfaces: <code>ms-app</code>, <code>.banner-and-app-container</code>, <code>ms-prompt-page</code>, <code>ms-chat-page</code> and <code>.page-container</code> all get <code>#07080A</code>. The nav and header get the same with an ink border. Cards, run settings and chunk editors step up to <code>#0D0D10</code>. <span class="code-inline-badge">code-inline</span>
                <ms-code-block><div class="head"><span>css</span><span>⎘ Copy</span></div><pre><code>ms-app, .page-container &#123; background-color: #07080A !important; &#125;</code></pre></ms-code-block>
                <div class="cm-editor"><span class="cm-gutter">1</span>const lanes = ['stock', 'ours'];</div></div><div class="chunk-actions"><button><i>✎</i></button><button><i>↻</i></button><button><i>👍</i></button><button><i>👎</i></button><button><i>⋯</i></button></div></div></ms-text-chunk>
              <ms-prompt-page style="display:none"></ms-prompt-page></div>
            <ms-prompt-input-wrapper><div class="prompt-input-wrapper"><div class="prompt-box-container"><textarea rows="1" placeholder="Type something or tab to choose an example prompt"></textarea><button class="icon-btn"><i>＋</i></button><button class="ctrl-enter-submits">Run <kbd>Ctrl ↵</kbd></button></div><div style="display:flex;gap:6px"><span class="enabled-tool">🌐 Grounding</span><span class="enabled-tool">💻 Code execution</span></div></div></ms-prompt-input-wrapper></ms-chat-page>
            <ms-run-settings><div class="settings-panel"><h3>Run settings <button class="icon-btn"><i>✕</i></button></h3><div class="model-card"><b>Gemini 2.5 Pro</b><small>gemini-2.5-pro · 1M context</small><select class="mat-mdc-select"><option>gemini-2.5-pro</option></select></div><div class="settings-card"><div class="setting-row"><span class="k">Temperature</span><span>1.0</span></div><span class="mat-mdc-slider"></span><div class="setting-row"><span class="k">Structured output</span><span class="mdc-switch"></span></div><div class="setting-row"><span class="k">Code execution</span><span class="mdc-switch on"></span></div><div class="setting-row"><span class="k">Safety settings</span><a href="#">Edit</a></div></div><div class="setting-row"><span class="k">Tools</span></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="ms-button-filter-chip selected">Grounding</button><button class="ms-button-filter-chip">URL context</button></div></div></ms-run-settings></div></div></div></ms-app>
    </Pair>
    <Pair name=".category-card + .api-key + .dragging-overlay" wrap={false}>
      <div class="category-card"><i>💬</i><b>Chat</b><small>Prompt a model conversationally</small></div><div class="category-card"><i>🎥</i><b>Stream</b><small>Live multimodal</small></div>
      <div class="api-key" style="width:100%">AIza••••••••••••••••••••••••••••••Q4 <button class="icon-btn code-copy"><i>⎘</i></button></div>
      <div class="dragging-overlay">Drop files to upload</div>
    </Pair>
  </Section>

  <Section id="controls" title="Material controls" lead="mdc-button variants, .ms-button-primary, text field wrappers (outlined, filled), select, switch, checkbox, radio, slider, tabs" min="420px">
    <Pair name=".mdc-button .mat-mdc-button-base + .ms-button-primary">
      <button class="mat-mdc-icon-button mat-mdc-button-base" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="mdc-button mat-mdc-button-base">Text</button><button class="mdc-button mat-mdc-button-base mat-mdc-unelevated-button">Filled</button><button class="mdc-button mat-mdc-button-base tonal">Tonal</button><button class="mdc-button mat-mdc-button-base mat-mdc-outlined-button">Outlined</button><button class="mdc-button mat-mdc-button-base" disabled>Disabled</button><button class="ms-button-primary">Save</button><button class="mdc-button mat-mdc-button-base mat-mdc-icon-button"><i>⚙</i></button>
    </Pair>
    <Pair name=".mat-mdc-text-field-wrapper(.mdc-text-field--outlined) .mat-mdc-form-field-flex + input/textarea/select">
      <div class="mat-mdc-text-field-wrapper mdc-text-field--outlined"><div class="mat-mdc-form-field-flex"><label>System instructions</label><input value="You are a design-system auditor." /></div></div>
      <div class="mat-mdc-text-field-wrapper"><div class="mat-mdc-form-field-flex"><label>Filled</label><input placeholder="Filled field" /></div></div>
      <div class="mat-mdc-text-field-wrapper mdc-text-field--outlined" style="height:auto;padding:12px 16px"><div class="mat-mdc-form-field-flex"><label>Notes</label><textarea rows="2">Regenerate after every token change.</textarea></div></div>
      <select class="mat-mdc-select"><option>gemini-2.5-flash</option></select>
    </Pair>
    <Pair name="switch / checkbox / radio / slider / tabs">
      <span><span class="mdc-switch on"></span> <span class="mdc-switch"></span> <span class="mdc-checkbox on">✓</span> <span class="mdc-checkbox"></span> <span class="mdc-radio on"></span> <span class="mdc-radio"></span></span>
      <span class="mat-mdc-slider" style="width:200px"></span>
      <div class="mat-mdc-tab-group" style="width:100%"><button class="mat-mdc-tab active">Prompts</button><button class="mat-mdc-tab">Tuned models</button><button class="mat-mdc-tab">Library</button></div>
    </Pair>
  </Section>

  <Section id="surfaces" title="Cards, menu, dialog, feedback" lead="mat-mdc-card, menu panel, dialog container, snackbar, tooltip, spinners (class*=spinner) and progress (class*=progress), banners, avatars" min="420px">
    <Pair name=".mat-mdc-card + .mat-mdc-menu-panel" wrap={false}>
      <div class="mat-mdc-card"><span class="title">Prompt: Sage Ink audit</span><span class="sub">Saved 2 h ago · gemini-2.5-pro</span><div style="display:flex;gap:8px;justify-content:flex-end"><button class="mdc-button mat-mdc-button-base">Share</button><button class="mdc-button mat-mdc-button-base mat-mdc-unelevated-button">Open</button></div></div>
      <div role="menu" class="mat-mdc-menu-panel"><div role="menuitem" class="mat-mdc-menu-item">✎ Rename</div><div role="menuitem" class="mat-mdc-menu-item">⎘ Duplicate</div><div role="menuitem" class="mat-mdc-menu-item">💾 Save to Drive</div><div class="mat-divider"></div><div role="menuitem" class="mat-mdc-menu-item" style="color:var(--gm3-sys-color-error)">🗑 Delete</div></div>
    </Pair>
    <Pair name=".mat-mdc-dialog-container" wrap={false}>
      <div role="dialog" class="mat-mdc-dialog-container"><h2>Delete prompt?</h2><p>"Sage Ink stock pages" will be permanently deleted from your library.</p><div class="mat-mdc-dialog-actions"><button class="mdc-button mat-mdc-button-base">Cancel</button><button class="mdc-button mat-mdc-button-base mat-mdc-unelevated-button">Delete</button></div></div>
    </Pair>
    <Pair name="snackbar / tooltip / spinner / progress / banners / avatars" wrap={false}>
      <div class="mat-mdc-snack-bar-container">Prompt saved <span class="action">View</span></div>
      <span role="tooltip" class="mat-mdc-tooltip">Copy code</span> <span class="mat-mdc-progress-spinner"></span> <span class="spinner-sm"></span> <span class="progress-bar"><span></span></span>
      <div class="error-banner">⚠ Rate limit exceeded. <span class="on-error">Retry</span></div><div class="info-banner">ℹ Free tier: data may be used to improve products.</div>
      <span><span class="avatar-user">JR</span> <span class="Avatar-lg"></span></span>
    </Pair>
  </Section>
</SitePage>
