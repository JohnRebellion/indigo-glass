<script lang="ts">
  /* Notion: sidebar and topbar, page content with data-block-id blocks,
   * code block, database views (table, gallery, board), controls, popovers. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="page" title="Shell and page" lead=".notion-page-content › [contenteditable] › [data-block-id]: headings, text, to-do, toggle, callout, quote, divider, mentions, colours" min="600px">
    <Pair name="sidebar + topbar + .notion-page-content [contenteditable] [data-block-id]" wrap={false} span="full">
      <div class="shell notion-app-inner"><nav class="n-sidebar notion-sidebar-container"><div class="ws notion-sidebar-switcher"><span></span>John's Notion ▾</div><a href="#">🔍 Search</a><a href="#">🏠 Home</a><a href="#">📥 Inbox</a><div class="label">Private</div><a class="active" href="#">🎨 Sage Ink</a><a href="#">📓 Journal</a><a href="#">📋 Tasks</a><div class="label">Teamspaces</div><a href="#">🧪 Simulator</a><div style="flex:1"></div><a href="#">⚙ Settings</a><a href="#">🗑 Trash</a></nav>
        <div class="n-main notion-frame"><div class="n-topbar notion-topbar"><div class="crumb"><span>Sage Ink</span><span>/</span><b>Stock element pages</b></div><div class="actions"><span>Edited 2 h ago</span><button class="share">Share</button><button><i>💬</i></button><button><i>☆</i></button><button><i>⋯</i></button></div></div>
          <div data-art class="cover"></div><div class="icon">🎨</div>
          <div class="notion-page-content"><div contenteditable="true"><h1 data-block-id="a1">Stock element pages</h1>
            <div data-block-id="a2">One page per site: the <span class="link-mention">stock elements</span> beside the same markup under our <a href="#">.user.css</a>. Assigned to <span class="n-mention">@John</span> · due <span class="n-mention date">Sep 26, 2026</span>.</div>
            <div data-block-id="a3" class="selected">This block is selected: it paints <code>--notion-selected-block</code>.</div>
            <h2 data-block-id="a4">Coverage</h2>
            <div data-block-id="a5" class="todo done"><span class="box">✓</span><span>github, wikipedia, youtube, facebook, google</span></div>
            <div data-block-id="a6" class="todo"><span class="box"></span><span>claude, chatgpt, notion, linear, atlassian, microsoft365</span></div>
            <div data-block-id="a7" class="toggle">Remaining: copilot, gemini, aistudio, shopee</div>
            <h3 data-block-id="a8">Colour text</h3>
            <div data-block-id="a9"><span class="col-blue">blue</span> · <span class="col-purple">purple</span> · <span class="col-pink">pink</span> · <span class="col-red">red</span> · <span class="col-orange">orange</span> · <span class="col-yellow">yellow</span> · <span class="col-green">green</span> · <span class="highlight">yellow background</span></div>
            <div data-block-id="b1" class="callout">💡 <div>A token remap only reaches what reads the token.</div></div>
            <div data-block-id="b2" class="callout blue">ℹ <div>Blue callout background.</div></div>
            <div data-block-id="b3" class="callout red">⚠ <div>Red callout background.</div></div>
            <div data-block-id="b4" class="quote">Colour is elevation. Two surfaces plus a border.</div>
            <div data-block-id="b5" class="divider"></div>
            <div data-block-id="b6">Press <kbd>/</kbd> for commands, <samp>Ctrl+E</samp> for <tt>inline code</tt>.</div>
          </div></div>
        </div></div>
    </Pair>
    <Pair name=".notion-code-block + pre + code" span="full">
      <div class="notion-page-content" style="padding:0"><div class="notion-code-block"><span class="lang">CSS</span><button class="copy">Copy</button><pre><code>[role="menu"], [role="dialog"], button &#123;
  border-radius: 0 !important;
&#125;</code></pre></div></div>
    </Pair>
  </Section>

  <Section id="database" title="Database views" lead="View tabs, table with tags/status/people, gallery of a.notion-collection-item cards, board" min="600px">
    <Pair name="views + .n-table + tags + status" span="full">
      <div style="width:100%"><div class="views"><button class="active">⊞ Table</button><button>▦ Gallery</button><button>▤ Board</button><button>+ New view</button><div class="right"><div role="button" class="n-btn notion-focusable">Filter</div><div role="button" class="n-btn notion-focusable">Sort</div><div role="button" class="n-btn notion-focusable"><i>🔍</i></div><div role="button" class="n-btn primary notion-focusable">New ▾</div></div></div>
        <table class="n-table"><thead><tr><th><span>Aa Name</span></th><th><span>◎ Status</span></th><th><span>⊙ Tags</span></th><th><span>👤 Owner</span></th><th><span>▤ Progress</span></th></tr></thead><tbody>
          <tr><td>📄 github</td><td><span class="status done">Done</span></td><td><span class="tag blue">primer</span> <span class="tag green">passes</span></td><td><span class="n-avatar">J</span> John</td><td><span class="n-progress"><span></span></span></td></tr>
          <tr><td>📄 notion</td><td><span class="status progress">In progress</span></td><td><span class="tag purple">blocks</span> <span class="tag yellow">login-walled</span></td><td><span class="n-avatar">J</span> John</td><td><span class="n-progress"><span style="width:30%"></span></span></td></tr>
          <tr><td>📄 shopee</td><td><span class="status">Not started</span></td><td><span class="tag orange">light-only</span> <span class="tag pink">ncore</span> <span class="tag red">risky</span> <span class="tag gray">later</span></td><td><span class="n-avatar">J</span> John</td><td><span class="n-progress"><span style="width:0"></span></span></td></tr>
        </tbody></table></div>
    </Pair>
    <Pair name="a.notion-collection-item gallery / board">
      <div class="gallery"><a class="notion-collection-item" href="#"><div class="img"></div><div class="body"><b>GitHub</b><span class="tag green">passes</span></div></a><a class="notion-collection-item" href="#"><div class="img" style="background:linear-gradient(135deg,#4a3b66,#22262e)"></div><div class="body"><b>Wikipedia</b><span class="tag green">passes</span></div></a><a class="notion-collection-item" href="#"><div class="img" style="background:linear-gradient(135deg,#66503b,#22262e)"></div><div class="body"><b>Notion</b><span class="tag blue">writing</span></div></a></div>
      <div class="board"><div class="col"><div class="col-head"><span class="status">Not started</span> 4</div><div class="card">copilot</div><div class="card">gemini</div></div><div class="col"><div class="col-head"><span class="status progress">In progress</span> 1</div><div class="card">notion</div></div><div class="col"><div class="col-head"><span class="status done">Done</span> 5</div><div class="card">github</div><div class="card">google</div></div></div>
    </Pair>
  </Section>

  <Section id="controls" title="Controls and popovers" lead="Buttons, input, select, switch, checkbox, radio, badges; role=dialog, role=menu, slash menu, toast, tooltip, banners" min="420px">
    <Pair name="button variants + inputs">
      <div role="button" class="n-btn notion-focusable" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></div>
      <div role="button" class="n-btn primary notion-focusable">Share</div><div role="button" class="n-btn outline notion-focusable">Duplicate</div><div role="button" class="n-btn notion-focusable">Ghost</div><div role="button" class="n-btn danger notion-focusable">Delete</div>
      <input class="n-input" value="Stock element pages" /> <select class="n-select"><option>Full width</option></select>
      <span><span class="n-switch on"></span> <span class="n-switch"></span> <span class="n-check on"></span> <span class="n-check"></span> <span class="n-radio on"></span> <span class="n-radio"></span></span>
      <span><span class="n-badge">Beta</span> <span class="n-badge new">New</span></span>
      <div class="cover-picker"><span></span><span></span><span></span><span></span></div>
    </Pair>
    <Pair name="[role=dialog]">
      <div role="dialog"><h2>Move to trash?</h2><p>"Stock element pages" and 3 sub-pages will move to trash.</p><div class="foot"><div role="button" class="n-btn outline notion-focusable">Cancel</div><div role="button" class="n-btn primary notion-focusable" style="background:var(--notion-red)">Move to trash</div></div></div>
    </Pair>
    <Pair name="[role=menu] + slash menu">
      <div role="menu"><div class="head">Page</div><div role="menuitem">⧉ Copy link <kbd>⌘L</kbd></div><div role="menuitem">⧉ Duplicate <kbd>⌘D</kbd></div><div role="menuitem">➔ Move to <kbd>⌘⇧P</kbd></div><div class="sep"></div><div role="menuitem" style="color:var(--notion-red)">🗑 Delete <kbd>Del</kbd></div></div>
      <div class="n-slash"><div class="head" style="font-size:12px;color:var(--n-text-2);padding:4px 8px">Basic blocks</div><div class="row sel"><span class="ic">T</span><div><b>Text</b><small>Just start writing with plain text.</small></div></div><div class="row"><span class="ic">H1</span><div><b>Heading 1</b><small>Big section heading.</small></div></div><div class="row"><span class="ic">☑</span><div><b>To-do list</b><small>Track tasks with a to-do list.</small></div></div></div>
    </Pair>
    <Pair name="toast / tooltip / banners">
      <div class="n-toast">Page moved to trash <a href="#">Undo</a></div>
      <span role="tooltip" class="n-tooltip">Share or publish</span>
      <div class="n-banner">ℹ This page is in the trash. <div role="button" class="n-btn notion-focusable" style="height:24px">Restore</div></div>
      <div class="n-banner red">⚠ You are offline. Changes will sync when you reconnect.</div>
    </Pair>
  </Section>
</SitePage>
