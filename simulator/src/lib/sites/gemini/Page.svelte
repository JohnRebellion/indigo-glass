<script lang="ts">
  /* Gemini: bard-sidenav shell, chat-window with greeting gradient, draft
   * chips, response with code block and code chips, input-area-v2, Material
   * controls, cards, menu, dialog, snackbar, drawer with backdrop. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="shell" title="Shell" lead="bard-sidenav-container › bard-sidenav (mat list items with aria-current / activated) + bard-sidenav-content › chat-window › .chat-history › .conversation-container, input-area-v2, autosuggest scrim, blur-bg" min="640px">
    <Pair name="bard-sidenav + chat-window + .conversation-container + input-area-v2 + .text-input-field + rich-textarea" wrap={false} span="full">
      <bard-sidenav-container class="shell"><bard-sidenav><button class="menu-btn"><i>☰</i></button><button class="new-chat">✎ New chat</button><div class="heading">Recent</div><a class="mat-mdc-list-item" aria-current="page" href="#">💬 Sage Ink stock pages</a><a class="mat-mdc-list-item mdc-list-item--activated" href="#">💬 Material tokens</a><a class="mat-mdc-list-item" href="#">💬 OKLCH ladder</a><a class="mat-mdc-list-item" href="#">💬 Playwright clips</a><div class="heading">Gems</div><a class="mat-mdc-list-item" href="#">✦ Coding partner</a><div class="foot"><a class="mat-mdc-list-item" href="#">? Help</a><a class="mat-mdc-list-item" href="#">⏱ Activity</a><a class="mat-mdc-list-item" href="#">⚙ Settings</a></div></bard-sidenav>
        <bard-sidenav-content><div class="top-bar"><span class="logo">Gemini</span><span class="model-chip">2.5 Pro ▾</span><div class="right"><button class="upsell-button">✦ Try Gemini Advanced</button><span class="user-avatar">JR</span></div></div>
          <chat-window><div class="top-gradient"></div><div class="chat-history"><div class="conversation-container">
            <div class="greeting"><span class="brand-text">Hello, John</span><span class="muted">How can I help you today?</span></div><div class="gradient-strip"></div>
            <div class="draft-chips"><div class="draft-chip">Explain how a token remap reaches a component<i>💡</i></div><div class="draft-chip">Write a Playwright test for canvas pixels<i>💻</i></div><div class="draft-chip">Compare M3 dark to Sage Ink<i>🎨</i></div></div>
            <user-query>Which Material selectors does the file square off?</user-query>
            <model-response><span class="bot-logo">✦</span><message-content><h3>Buttons, cards, menus, dialogs, form fields</h3><p style="margin:0">The radius reset lists <strong>.mdc-button</strong>, <code>.mat-mdc-card</code>, <code>.mat-mdc-menu-panel</code>, <code>.mat-mdc-dialog-container</code> and <code>.mat-mdc-form-field-flex</code>, plus everything inside <code>bard-sidenav-container</code> except avatars and spinners. <span class="priority-text">Top priority text</span> reads its own token.</p><ul><li>Active list items become an inset white stroke</li><li>The greeting gradient becomes flat violet</li></ul>
              <table><thead><tr><th>Selector</th><th>Stock radius</th></tr></thead><tbody><tr><td><code>.mdc-button</code></td><td>20px</td></tr><tr><td><code>.mat-mdc-dialog-container</code></td><td>28px</td></tr></tbody></table>
              <div class="code-block"><div class="head"><span class="code-chip selected">CSS</span><span class="code-chip">Python</span><span class="right">⎘ Copy</span></div><pre><code>.mdc-button, .mat-mdc-card &#123; border-radius: 0 !important; &#125;</code></pre></div>
              <div class="response-actions"><button><i>👍</i></button><button><i>👎</i></button><button><i>↻</i></button><button><i>↗</i></button><button class="tts-button"><i>🔊</i></button><span class="power-up">🔍 Double-check response</span></div></message-content></model-response>
          </div></div><div class="bottom-gradient"></div><div class="blur-bg"></div></chat-window>
          <input-area-v2><div class="input-area-container"><div class="text-input-field"><rich-textarea contenteditable="true" data-placeholder="Ask Gemini"></rich-textarea><button class="icon-btn"><i>🖼</i></button><button class="icon-btn"><i>🎤</i></button><button class="icon-btn send"><i>➤</i></button></div></div></input-area-v2>
          <div class="disclaimer">Gemini can make mistakes, so double-check it</div></bard-sidenav-content>
        <div class="autosuggest-scrim" style="display:none"></div></bard-sidenav-container>
    </Pair>
    <Pair name=".autosuggest-scrim + autosuggest / .blur-bg-header (class*=blur-bg) / mat-sidenav.mat-drawer + .mat-drawer-backdrop.mat-drawer-shown" wrap={false}>
      <div style="position:relative;width:100%;height:140px;background:var(--gm3-sys-color-background)"><div class="autosuggest-scrim"></div><div class="autosuggest" style="bottom:12px"><div class="row">sage ink kde theme</div><div class="row">sage ink vscode</div></div></div>
      <div class="blur-bg-header">Header over blurred content</div>
      <div class="drawer-demo"><mat-sidenav class="mat-drawer mat-sidenav"><a class="mat-mdc-list-item mdc-list-item--activated" href="#">Inbox</a><a class="mat-mdc-list-item" href="#">Starred</a></mat-sidenav><div class="mat-drawer-backdrop mat-drawer-shown"></div></div>
    </Pair>
  </Section>

  <Section id="controls" title="Material controls" lead="mdc-button variants, tonal, upsell, icon and FAB; form field flex (outlined, filled, error), select; slide toggle, checkbox, radio, slider, chips, tabs" min="420px">
    <Pair name=".mdc-button .mat-mdc-button-base variants + .mat-tonal-button">
      <button class="mat-mdc-icon-button mat-mdc-button-base" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="mdc-button mat-mdc-button-base">Text</button><button class="mdc-button mat-mdc-button-base mat-mdc-unelevated-button">Filled</button><button class="mdc-button mat-mdc-button-base mat-tonal-button">Tonal</button><button class="mdc-button mat-mdc-button-base mat-mdc-outlined-button">Outlined</button><button class="mdc-button mat-mdc-button-base mat-mdc-raised-button">Raised</button><button class="mdc-button mat-mdc-button-base mat-mdc-unelevated-button" disabled>Disabled</button>
      <span><button class="mdc-button mat-mdc-button-base mat-mdc-icon-button"><i>⚙</i></button> <button class="mdc-button mat-mdc-button-base mat-mdc-fab"><i>✎</i></button></span>
    </Pair>
    <Pair name=".mat-mdc-form-field-flex + input/textarea + .mat-mdc-select">
      <div class="mat-mdc-form-field-flex"><label>Gem name</label><input value="Coding partner" /></div>
      <div class="mat-mdc-form-field-flex filled"><label>Filled</label><input placeholder="Filled variant" /></div>
      <div class="mat-mdc-form-field-flex error"><label>Required</label><input value="" /></div><div class="mat-error">This field is required</div>
      <div class="mat-mdc-form-field-flex" style="height:auto;padding:12px 16px"><label>Instructions</label><textarea rows="2">Be concise.</textarea></div>
      <span class="mat-mdc-select">2.5 Pro <span>▾</span></span>
    </Pair>
    <Pair name="slide toggle / checkbox / radio / slider / chips / tabs">
      <span class="mat-mdc-slide-toggle"><span class="mdc-switch on"></span> Gemini Apps Activity</span> <span class="mat-mdc-slide-toggle"><span class="mdc-switch"></span> Off</span>
      <span class="mat-mdc-checkbox"><span class="mdc-checkbox on">✓</span> Checked</span> <span class="mat-mdc-checkbox"><span class="mdc-checkbox"></span> Unchecked</span> <span class="mat-mdc-radio-button"><span class="mdc-radio on"></span> Selected</span> <span class="mat-mdc-radio-button"><span class="mdc-radio"></span> Option</span>
      <span class="mat-mdc-slider"></span>
      <span><span class="mat-mdc-chip selected">Deep Research</span> <span class="mat-mdc-chip">Canvas</span> <span class="mat-mdc-chip assist">✦ Assist</span></span>
      <div class="mat-mdc-tab-group" style="width:100%"><button class="mat-mdc-tab active">Chats</button><button class="mat-mdc-tab">Gems</button><button class="mat-mdc-tab">Extensions</button></div>
    </Pair>
  </Section>

  <Section id="surfaces" title="Cards, menu, dialog, feedback" lead="mat-mdc-card variants, gem row, menu panel, dialog container, snackbar, tooltip, progress spinner and bar, banners, avatars" min="420px">
    <Pair name=".mat-mdc-card variants + .gem">
      <div class="mat-mdc-card elevated"><div class="img"></div><span class="mat-mdc-card-title">Elevated card</span><span class="mat-mdc-card-subtitle">Surface container + shadow</span><div class="mat-mdc-card-actions"><button class="mdc-button mat-mdc-button-base">Share</button><button class="mdc-button mat-mdc-button-base mat-mdc-unelevated-button">Open</button></div></div>
      <div class="mat-mdc-card outlined"><span class="mat-mdc-card-title">Outlined card</span><span class="mat-mdc-card-subtitle">Outline variant border</span></div><div class="mat-mdc-card filled"><span class="mat-mdc-card-title">Filled card</span></div>
      <div class="gem"><i data-art></i><div><b>Coding partner</b><small>Level up your coding skills</small></div></div>
      <div class="tertiary-card">Tertiary container</div>
    </Pair>
    <Pair name=".mat-mdc-menu-panel + .mat-mdc-dialog-container" wrap={false}>
      <div role="menu" class="mat-mdc-menu-panel"><div role="menuitem" class="mat-mdc-menu-item">📌 Pin</div><div role="menuitem" class="mat-mdc-menu-item">✎ Rename</div><div role="menuitem" class="mat-mdc-menu-item disabled">↗ Share (unavailable)</div><div class="mat-divider"></div><div role="menuitem" class="mat-mdc-menu-item" style="color:var(--gm3-sys-color-error)">🗑 Delete</div></div>
      <div role="dialog" class="mat-mdc-dialog-container"><h2>Delete chat?</h2><p>This will delete "Sage Ink stock pages" and any related activity.</p><div class="mat-mdc-dialog-actions"><button class="mdc-button mat-mdc-button-base">Cancel</button><button class="mdc-button mat-mdc-button-base">Delete</button></div></div>
    </Pair>
    <Pair name="snackbar / tooltip / spinner (.mat-mdc-progress-spinner, .spinner-sm) / progress bar / banners / avatars" wrap={false}>
      <div class="mat-mdc-snack-bar-container"><div class="mdc-snackbar__surface"><div class="mat-mdc-simple-snack-bar">Response copied <span class="action mat-mdc-snack-bar-action">Undo</span></div></div></div>
      <span role="tooltip" class="mat-mdc-tooltip">New chat</span> <span class="mat-mdc-progress-spinner"></span> <span class="spinner-sm"></span> <span class="mat-mdc-progress-bar"><span></span></span>
      <div class="error-banner">⚠ Something went wrong. <span class="on-error">Retry</span></div><div class="info-banner">ℹ Gemini Apps Activity is on.</div>
      <span><span class="avatar-small"></span> <span class="Avatar-large"></span> <span class="user-avatar">JR</span></span>
    </Pair>
  </Section>
</SitePage>
