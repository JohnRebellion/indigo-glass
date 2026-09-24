<script lang="ts">
  /* GitHub: Primer CSS (.btn, .Box, .Label…) and Primer React (prc-*) elements
   * as github.com renders them, in the site's own token vocabulary. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="chrome" title="Chrome" lead="AppHeader, search, UnderlineNav — the repo page frame" min="520px">
    <Pair name="AppHeader + Search-module__searchButton" span="full" note="The header paints bgColor-inset; the search affordance is a button dressed as a field. Stylus gives it a 2px border_strong edge.">
      <header class="AppHeader">
        <span class="avatar avatar-small"></span>
        <span class="AppHeader-context-item">JohnRebellion</span>
        <span class="AppHeader-context-item-separator">/</span>
        <span class="AppHeader-context-item">indigo-glass</span>
        <button class="Search-module__searchButton--abc" type="button">Type <kbd>/</kbd> to search</button>
        <button class="prc-Button-ButtonBase-xyz" data-variant="invisible" type="button"><i>+</i></button>
        <span class="avatar"></span>
      </header>
    </Pair>
    <Pair name="UnderlineNav" span="full">
      <nav class="UnderlineNav">
        <a class="UnderlineNav-item" aria-current="page" href="#">Code</a>
        <a class="UnderlineNav-item" href="#">Issues <span class="Counter">12</span></a>
        <a class="UnderlineNav-item" href="#">Pull requests <span class="Counter">3</span></a>
        <a class="UnderlineNav-item" href="#">Actions</a>
        <a class="UnderlineNav-item" href="#">Settings</a>
      </nav>
    </Pair>
    <Pair name="repohead + topic-tag + Language-bar" span="full">
      <div class="repohead">
        <svg class="octicon" viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Z"/></svg>
        <a href="#">indigo-glass</a> <span class="Label">Public</span>
        <span class="Truncate">— Sage Ink design system</span>
      </div>
      <div><span class="topic-tag">kde</span> <span class="topic-tag">design-tokens</span> <span class="topic-tag">oklch</span></div>
      <div class="Language-bar"><span style="width:52%;background:#3572A5"></span><span style="width:28%;background:#563d7c"></span><span style="width:20%;background:#ff3e00"></span></div>
    </Pair>
  </Section>

  <Section id="buttons" title="Buttons" lead=".btn variants and the prc-Button-ButtonBase data-variant set; invisible, link and octicon stay flat under Stylus" min="420px">
    <Pair name="btn / btn-primary / btn-danger">
      <button class="btn" type="button">Watch <span class="Counter">4</span></button>
      <button class="btn btn-primary" type="button">Create pull request</button>
      <button class="btn btn-danger" type="button">Delete repository</button>
      <button class="btn btn-sm" type="button">Code ▾</button>
      <button class="btn" type="button" disabled>Disabled</button>
    </Pair>
    <Pair name="prc-Button-ButtonBase [data-variant]">
      <button class="prc-Button-ButtonBase-abc" type="button">Default</button>
      <button class="prc-Button-ButtonBase-abc" data-variant="primary" type="button">New issue</button>
      <button class="prc-Button-ButtonBase-abc" data-variant="danger" type="button">Close issue</button>
      <button class="prc-Button-ButtonBase-abc" data-variant="invisible" type="button">Invisible</button>
      <button class="prc-Button-ButtonBase-abc" data-variant="link" type="button">Link variant</button>
    </Pair>
    <Pair name="btn-invisible / btn-link / btn-octicon / BtnGroup" note="Icon affordances inside other chrome; the Stylus file excludes them from the 2px edge and the 4px shadow.">
      <button class="btn btn-invisible" type="button">Invisible</button>
      <button class="btn btn-link" type="button">Link button</button>
      <button class="btn-octicon" type="button"><svg class="octicon" viewBox="0 0 16 16"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg></button>
      <div class="BtnGroup"><button class="btn" type="button">Preview</button><button class="btn" type="button">Code</button><button class="btn" type="button">Blame</button></div>
    </Pair>
    <Pair name="Counter / State">
      <span class="Counter">42</span> <span class="Counter Counter--primary">7</span>
      <span class="State State--open">Open</span>
      <span class="State State--closed">Closed</span>
      <span class="State State--merged">Merged</span>
      <span class="State State--draft">Draft</span>
    </Pair>
  </Section>

  <Section id="forms" title="Form controls" lead="form-control, FormControl-input, prc-TextInput wrapper, the #qb-input-query search field, checkbox, select, toggle" min="420px">
    <Pair name="form-control / FormControl-input">
      <div><label class="FormControl-label">Repository name</label><input class="FormControl-input" value="indigo-glass" /><p class="FormControl-caption">Great repository names are short and memorable.</p></div>
      <input class="form-control" placeholder="Filter issues" />
      <select class="form-control form-select"><option>Sort: Newest</option></select>
    </Pair>
    <Pair name="prc-TextInput-TextInputWrapper / #qb-input-query">
      <span class="prc-TextInput-TextInputWrapper-abc"><svg class="octicon" viewBox="0 0 16 16"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 1 0 11.5 7Z"/></svg><input class="prc-TextInput-Input-def" placeholder="Search or jump to…" /></span>
      <input id="qb-input-query" class="form-control" placeholder="is:issue state:open" />
    </Pair>
    <Pair name="checkbox / radio / ToggleSwitch">
      <label class="form-checkbox"><input type="checkbox" checked /> Allow merge commits</label>
      <label class="form-checkbox"><input type="radio" name="v" checked /> Public</label>
      <label class="form-checkbox"><input type="radio" name="v" /> Private</label>
      <div class="ToggleSwitch"><span>Enabled</span><span class="ToggleSwitch-track" aria-checked="true"><span class="ToggleSwitch-knob"></span></span></div>
    </Pair>
  </Section>

  <Section id="labels" title="Labels, tokens, status" lead="Outline Labels read borderColor-* tokens; IssueLabel composes alpha from its own hue (documented limit L26); prc-Token hardcodes 6px" min="420px">
    <Pair name="Label variants">
      <span class="Label">Public</span> <span class="Label Label--success">Passing</span> <span class="Label Label--attention">Beta</span>
      <span class="Label Label--danger">Breaking</span> <span class="Label Label--accent">New</span> <span class="Label Label--done">Merged</span>
    </Pair>
    <Pair name="IssueLabel / prc-Token-TokenBase-te5-F" note="IssueLabel fill is per-label alpha over the page — it stays translucent on purpose; only the corner changes.">
      <span class="IssueLabel">bug</span>
      <span class="IssueLabel" style="--label-r:14;--label-g:118;--label-b:214;--label-h:207;--label-s:87;--label-l:44">enhancement</span>
      <span class="IssueLabel" style="--label-r:0;--label-g:134;--label-b:114;--label-h:171;--label-s:100;--label-l:26">help wanted</span>
      <span class="prc-Token-TokenBase-te5-F">design <span class="remove"></span></span>
      <span class="prc-Token-TokenBase-te5-F">kde <span class="remove"></span></span>
    </Pair>
    <Pair name="fgColor semantics / avatar / Progress" note="Issue and CI state are SVG fill — the fgColor-open/closed/attention remap is what recolours them.">
      <svg class="octicon" viewBox="0 0 16 16" style="color:var(--fgColor-open)"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg>
      <svg class="octicon" viewBox="0 0 16 16" style="color:var(--fgColor-closed)"><path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"/><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"/></svg>
      <svg class="octicon" viewBox="0 0 16 16" style="color:var(--fgColor-attention)"><path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/></svg>
      <svg class="octicon" viewBox="0 0 16 16" style="color:var(--fgColor-done)"><path d="M5 3.254V3.25v.005a.75.75 0 1 1 0-.005v.004Zm.45 1.9a2.25 2.25 0 1 0-1.95.218v5.256a2.25 2.25 0 1 0 1.5 0V7.123A5.735 5.735 0 0 0 9.25 9h1.378a2.251 2.251 0 1 0 0-1.5H9.25a4.25 4.25 0 0 1-3.8-2.346Z"/></svg>
      <span class="color-fg-success">✓ All checks passed</span> <span class="color-fg-danger">✕ 1 failing</span> <span class="color-fg-attention">● Pending</span> <span class="color-fg-severe">▲ Severe</span>
      <span class="avatar prc-Avatar-Avatar-0xaUi"></span><span class="avatar avatar-small"></span>
      <div class="Progress"><span class="Progress-item" style="width:60%;background:var(--bgColor-success-emphasis)"></span><span class="Progress-item" style="width:25%;background:var(--bgColor-attention-emphasis)"></span><span class="Progress-item" style="width:15%;background:var(--bgColor-danger-emphasis)"></span></div>
    </Pair>
  </Section>

  <Section id="containers" title="Box, overlays, menus" lead="Resting surfaces keep a border; floating overlays take shadow-floating-*" min="420px">
    <Pair name="Box + Box-row + react-directory-row">
      <div class="Box" style="width:100%">
        <div class="Box-header"><span class="avatar avatar-small"></span> JohnRebellion <span class="Truncate">fix(edge): stylus bundle installDate</span> <span class="commit-sha">9eb3f1b</span></div>
        <div class="react-directory-row"><span class="react-directory-filename-column">📁 browser</span><span class="react-directory-commit-message">feat(edge): per-profile brand-hue browser layer</span><span class="react-directory-commit-age">2 hours ago</span></div>
        <div class="react-directory-row"><span class="react-directory-filename-column">📁 tokens</span><span class="react-directory-commit-message">feat(grub): Orchid Ink Light card theme</span><span class="react-directory-commit-age">yesterday</span></div>
        <div class="react-directory-row"><span class="react-directory-filename-column">📄 README.md</span><span class="react-directory-commit-message">docs: rename to Sage Ink</span><span class="react-directory-commit-age">3 days ago</span></div>
        <div class="Box-footer"><a href="#">View all files</a></div>
      </div>
    </Pair>
    <Pair name="Box-row list (issues)">
      <div class="Box" style="width:100%">
        <div class="Box-row"><svg class="octicon" viewBox="0 0 16 16" style="color:var(--fgColor-open)"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg><a href="#">Blur reappears after KWin restart</a> <span class="IssueLabel">bug</span> <span class="Truncate">#41 opened by john</span></div>
        <div class="Box-row"><svg class="octicon" viewBox="0 0 16 16" style="color:var(--fgColor-done)"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Z"/></svg><a href="#">Lime Glass installable variant</a> <span class="Truncate">#38 merged</span></div>
      </div>
    </Pair>
    <Pair name="Overlay (dialog)" note="Reads overlay-bgColor, overlay-borderColor and shadow-floating-medium; the Stylus file turns the soft shadow into the hard 4px ink offset.">
      <div class="Overlay" role="dialog">
        <div class="Overlay-header">Delete branch? <button class="btn-octicon" type="button"><i>✕</i></button></div>
        <div class="Overlay-body">This will permanently delete <code>fix/edge-stylus</code>. This action cannot be undone.</div>
        <div class="Overlay-footer"><button class="btn" type="button">Cancel</button><button class="btn btn-danger" type="button">Delete</button></div>
      </div>
    </Pair>
    <Pair name="prc-ActionList (menu) with data-active" note="The active row (Issues) was a 20% wash on the live site — Tier C on-select is an inset 2px stroke.">
      <div class="Overlay Overlay--floating-small" role="menu">
        <ul class="prc-ActionList-ActionList-abc">
          <li class="prc-ActionList-ActionListItem-abc prc-ActionList-ActionListItem"><svg class="octicon" viewBox="0 0 16 16"><path d="M2 2h12v12H2z"/></svg> Code</li>
          <li class="prc-ActionList-ActionListItem-abc prc-ActionList-ActionListItem" data-active="true"><svg class="octicon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg> Issues <span class="prc-ActionList-Description">12</span></li>
          <li class="prc-ActionList-ActionListItem-abc prc-ActionList-ActionListItem"><svg class="octicon" viewBox="0 0 16 16"><path d="M4 2v12M12 2v12"/></svg> Pull requests <span class="prc-ActionList-Description">3</span></li>
          <li class="ActionList-sectionDivider" role="separator"></li>
          <li class="prc-ActionList-ActionListItem-abc prc-ActionList-ActionListItem">Settings</li>
        </ul>
      </div>
    </Pair>
    <Pair name="SelectMenu / Popover / tooltip / Toast">
      <div class="SelectMenu-modal">
        <div class="SelectMenu-header">Switch branches</div>
        <div class="SelectMenu-item" aria-checked="true">✓ main</div>
        <div class="SelectMenu-item">fix/edge-stylus</div>
        <div class="SelectMenu-item">feat/vlc</div>
      </div>
      <div class="Popover-message"><strong>Tip</strong><p class="color-fg-muted" style="margin:4px 0 8px">Press <kbd>.</kbd> to open github.dev</p><button class="btn btn-sm" type="button">Got it</button></div>
      <span class="tooltipped-box">Copy to clipboard</span>
      <div class="Toast Toast--success"><span class="Toast-icon">✓</span><span class="Toast-content">Changes saved</span></div>
    </Pair>
  </Section>

  <Section id="nav" title="Navigation" lead="subnav, pagination, breadcrumb, SideNav" min="420px">
    <Pair name="subnav / pagination">
      <div class="subnav"><a class="subnav-item selected" href="#">Open</a><a class="subnav-item" href="#">Closed</a><a class="subnav-item" href="#">All</a></div>
      <nav class="pagination"><span class="disabled">Previous</span><a href="#" aria-current="page">1</a><a href="#">2</a><a href="#">3</a><span>…</span><a href="#">12</a><a href="#">Next</a></nav>
    </Pair>
    <Pair name="breadcrumb / SideNav">
      <nav class="breadcrumb"><a href="#">indigo-glass</a><span class="color-fg-muted">/</span><a href="#">tokens</a><span class="color-fg-muted">/</span><span class="breadcrumb-item-selected">codegen.py</span></nav>
      <nav class="SideNav"><a class="SideNav-item" aria-current="page" href="#">General</a><a class="SideNav-item" href="#">Collaborators</a><a class="SideNav-item" href="#">Branches</a><a class="SideNav-item" href="#">Pages</a></nav>
    </Pair>
  </Section>

  <Section id="feedback" title="Flash, blankslate, timeline" lead="Alpha-muted fills (bgColor-*-muted) the file does not remap — a visible gap" min="420px">
    <Pair name="flash variants">
      <div class="flash">ℹ This repository has been archived by the owner.</div>
      <div class="flash flash-warn">⚠ Your branch is 3 commits behind main.</div>
      <div class="flash flash-error">✕ Merge conflict in <code>tokens/codegen.py</code>.</div>
      <div class="flash flash-success">✓ Pull request successfully merged and closed.</div>
    </Pair>
    <Pair name="blankslate / TimelineItem">
      <div class="blankslate"><svg class="octicon" viewBox="0 0 16 16" style="width:24px;height:24px"><path d="M2 2h12v12H2z"/></svg><h3>No results matched your search</h3><p>You could try an alternative filter.</p><button class="btn btn-primary" type="button">Clear filter</button></div>
      <div style="width:100%">
        <div class="TimelineItem"><span class="TimelineItem-badge">●</span><span class="TimelineItem-body"><a href="#">john</a> added the <span class="IssueLabel">bug</span> label 2 days ago</span></div>
        <div class="TimelineItem"><span class="TimelineItem-badge color-bg-success-emphasis">✓</span><span class="TimelineItem-body"><a href="#">john</a> merged commit <code>9eb3f1b</code> into main</span></div>
      </div>
    </Pair>
  </Section>

  <Section id="code" title="Code" lead="pre/code/kbd/samp, blob-wrapper, clipboard-copy, CodeMirror, the diff — 6px hardcoded radii, and the mono face swap" min="520px">
    <Pair name="pre + clipboard-copy.btn / inline code / kbd / samp">
      <pre><code><span class="pl-k">def</span> <span class="pl-en">emit</span>(tokens):
    <span class="pl-c"># regenerate every layer</span>
    <span class="pl-k">return</span> <span class="pl-s">"sage"</span></code><clipboard-copy class="btn">⧉</clipboard-copy></pre>
      <p>Run <code>python3 tokens/codegen.py</code>, then press <kbd>Ctrl</kbd> + <kbd>S</kbd>. Output: <samp>13 files moved</samp>.</p>
      <span class="Text-mono">1a2b3c4d (class*="mono")</span>
    </Pair>
    <Pair name="blob-wrapper + blob-code-inner (diff)">
      <div class="blob-wrapper highlight"><table><tbody>
        <tr><td class="blob-num blob-code-hunk" colspan="2">@@ -123,3 +123,3 @@</td></tr>
        <tr><td class="blob-num blob-num-deletion">123</td><td class="blob-code blob-code-deletion"><span class="blob-code-inner">-    --shadow-floating-small: 4px 4px 0 0 #89A889 !important;</span></td></tr>
        <tr><td class="blob-num blob-num-addition">123</td><td class="blob-code blob-code-addition"><span class="blob-code-inner">+    --shadow-floating-small: 4px 4px 0 0 #6494D5 !important;</span></td></tr>
        <tr><td class="blob-num">124</td><td class="blob-code"><span class="blob-code-inner">     --shadow-floating-large: 7px 7px 0 0 #6494D5 !important;</span></td></tr>
      </tbody></table></div>
    </Pair>
    <Pair name="cm-editor (CodeMirror)">
      <div class="cm-editor"><div class="cm-gutters">1<br/>2<br/>3</div><div class="cm-content"><span class="pl-k">import</span> tomllib
<span class="pl-k">with</span> open(<span class="pl-s">"tokens.toml"</span>) <span class="pl-k">as</span> f:
    data = tomllib.load(f)</div></div>
    </Pair>
    <Pair name="markdown-body" span="full">
      <div class="markdown-body">
        <h2>Verify</h2>
        <blockquote>Regenerating is required after any token value change, not just a variant switch.</blockquote>
        <div class="markdown-alert"><p class="markdown-alert-title">Note</p>The generated output is committed on purpose.</div>
        <div class="markdown-alert markdown-alert-warning"><p class="markdown-alert-title">Warning</p>Never find-and-replace a hex value across layers.</div>
        <table><thead><tr><th>Token</th><th>Hex</th><th>Role</th></tr></thead><tbody><tr><td><code>base</code></td><td>#07080A</td><td>page</td></tr><tr><td><code>surface</code></td><td>#0D0D10</td><td>window</td></tr><tr><td><code>sage</code></td><td>#A6C9A6</td><td>accent</td></tr></tbody></table>
        <ul><li class="task-list-item"><input type="checkbox" checked disabled /> regenerate</li><li class="task-list-item"><input type="checkbox" disabled /> run the drift guard</li></ul>
        <hr />
        <p>See <a href="#">docs/ARCHITECTURE.md</a>. <a class="Link--muted" href="#">Muted link</a>.</p>
      </div>
    </Pair>
  </Section>
</SitePage>
