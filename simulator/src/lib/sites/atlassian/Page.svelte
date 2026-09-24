<script lang="ts">
  /* Atlassian (Jira): top navigation, side nav, board with cards and
   * lozenges, issue detail, ADS controls, dropdown and modal, flags and
   * section messages, tables, code blocks. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="board" title="Navigation and board" lead="Top nav with selected item and search, side nav, breadcrumbs, board columns of raised cards with lozenges, priority, avatars" min="600px">
    <Pair name="topnav + sidenav + .board .column .card + .lozenge" span="full">
      <div class="shell"><div class="topnav"><span class="logo"><i></i> Jira</span><a class="nav-item" href="#">Your work ▾</a><a class="nav-item selected" aria-current="page" href="#">Projects ▾</a><a class="nav-item" href="#">Filters ▾</a><a class="nav-item" href="#">Dashboards ▾</a><a class="nav-item" href="#">Teams ▾</a><button class="btn primary">Create</button><div class="search">🔍 Search</div><button class="icon-btn"><i>🔔</i></button><button class="icon-btn"><i>?</i></button><button class="icon-btn"><i>⚙</i></button><span class="avatar">JR</span></div>
        <div class="body"><nav class="sidenav"><div class="proj"><i></i><div><b>Indigo Glass</b><small>Software project</small></div></div><div class="heading">Planning</div><a href="#">📅 Roadmap</a><a href="#">📋 Backlog</a><a class="selected" href="#">▦ Board</a><a href="#">📈 Reports</a><div class="heading">Development</div><a href="#">⎇ Code</a><a href="#">🚀 Releases</a><a href="#">⚙ Project settings</a></nav>
          <div class="content"><div class="breadcrumbs"><a href="#">Projects</a><span>/</span><a href="#">Indigo Glass</a><span>/</span><a href="#">IG board</a></div><h1 class="page-title">IG Sprint 14</h1>
            <div style="display:flex;gap:8px;align-items:center"><div class="textfield" style="width:160px;height:32px">🔍</div><div class="avatar-group"><span class="avatar">JR</span><span class="avatar" style="background:#DE350B">AL</span><span class="avatar" style="background:#00875A">GH</span></div><button class="btn subtle">Epic ▾</button><button class="btn subtle selected">Only my issues</button><button class="btn" style="margin-left:auto">Complete sprint</button><button class="btn icon subtle"><i>⋯</i></button></div>
            <div class="board"><div class="column"><div class="col-head">To do <span class="count">2</span></div><div class="card"><span class="summary">Shopee light-only stock values</span><div class="meta"><span class="type"></span><span class="key">IG-39</span><span class="priority low">↓</span><span class="avatar sm">JR</span></div></div><div class="card"><span class="summary">Gemini Material tokens</span><div class="meta"><span class="type task"></span><span class="key">IG-38</span><span class="lozenge new">Design</span><span class="priority">↑</span></div></div></div>
              <div class="column"><div class="col-head">In progress <span class="count">1</span></div><div class="card"><span class="summary">Stock element pages for all 15 Stylus sites</span><div class="meta"><span class="type epic"></span><span class="key">IG-42</span><span class="lozenge inprogress">In progress</span><span class="priority">↑</span><span class="avatar sm">JR</span></div></div></div>
              <div class="column"><div class="col-head">Done <span class="count">3</span></div><div class="card"><span class="summary" style="text-decoration:line-through;color:var(--ds-text-subtlest)">GitHub stock page</span><div class="meta"><span class="type"></span><span class="key">IG-37</span><span class="lozenge success">Done</span></div></div><div class="card"><span class="summary">Coverage check</span><div class="meta"><span class="type bug"></span><span class="key">IG-36</span><span class="lozenge success">Done</span><span class="priority medium">=</span></div></div></div></div>
          </div></div></div>
    </Pair>
    <Pair name="lozenge set (subtle + bold) / tags / badges">
      <div><span class="lozenge">Default</span> <span class="lozenge inprogress">In progress</span> <span class="lozenge success">Success</span> <span class="lozenge removed">Removed</span> <span class="lozenge moved">Moved</span> <span class="lozenge new">New</span></div>
      <div><span class="lozenge bold">Default</span> <span class="lozenge bold inprogress">In progress</span> <span class="lozenge bold success">Success</span> <span class="lozenge bold removed">Removed</span> <span class="lozenge bold moved">Moved</span> <span class="lozenge bold new">New</span></div>
      <div><span class="tag">plasma</span> <span class="tag purple">tokens</span> <span class="tag teal">simulator</span> <span class="tag lime">stylus</span> <span class="tag magenta">grub</span> <span class="tag rounded"><span class="avatar sm">JR</span> John</span></div>
      <div><span class="badge">12</span> <span class="badge primary">3</span> <span class="badge important">99+</span> <span class="badge added">+5</span> <span class="badge removed">-2</span></div>
    </Pair>
  </Section>

  <Section id="detail" title="Issue detail" lead="Header with key, description, code block with data-code-lang, comments, field sidebar, progress" min="600px">
    <Pair name=".detail + .code-block[data-code-lang] + pre/code + comments" span="full">
      <div class="detail"><div class="main"><div class="issue-header"><span class="type epic" style="width:16px;height:16px;display:inline-block;border-radius:2px;background:var(--ds-background-discovery-bold)"></span><a class="key" href="#">IG-42</a></div><h1 class="page-title">Stock element pages for all 15 Stylus sites</h1>
          <div style="display:flex;gap:8px"><button class="btn">📎 Attach</button><button class="btn">⊞ Add a child issue</button><button class="btn">🔗 Link issue</button><button class="btn icon"><i>⋯</i></button></div>
          <h2>Description</h2><div class="desc">Each page renders the stock elements beside the same markup under the shipped <code>.user.css</code>. Verify with the narrowest check:</div>
          <div class="code-block" data-code-lang="bash"><div class="gutter">1<br/>2</div><pre><code>npx vite build
npx playwright test e2e/sites.spec.ts -g "atlassian"</code></pre></div>
          <div class="tabs"><button class="selected">Comments</button><button>History</button><button>Work log</button></div>
          <div class="comment"><span class="avatar" style="background:#DE350B">AL</span><div class="bubble"><b>Ada Lovelace</b><small>2 hours ago</small><div>Chromium keeps <code>oklch()</code> in computed styles; resolve via canvas pixel.</div><div style="margin-top:4px"><button class="btn link">Reply</button> · <button class="btn link">Edit</button></div></div></div>
          <div class="comment-box"><span class="avatar">JR</span><input class="textfield" placeholder="Add a comment…" /></div></div>
        <div class="side"><button class="btn" style="justify-content:space-between"><span class="lozenge inprogress" style="font-size:12px">In progress</span> ▾</button><div class="panel"><div class="field"><span class="k">Assignee</span><span class="avatar sm">JR</span> John Rebellion</div><div class="field"><span class="k">Reporter</span><span class="avatar sm" style="background:#DE350B">AL</span> Ada Lovelace</div><div class="field"><span class="k">Priority</span><span class="priority">↑</span> High</div><div class="field"><span class="k">Labels</span><span class="tag purple">tokens</span></div><div class="field"><span class="k">Sprint</span><a href="#">IG Sprint 14</a></div><div class="field"><span class="k">Story points</span>8</div><div class="field"><span class="k">Progress</span><span class="progress success"><span></span></span></div></div><small style="color:var(--ds-text-subtlest)">Created 2 days ago · Updated 3 hours ago</small></div></div>
    </Pair>
  </Section>

  <Section id="controls" title="Controls" lead="Button appearances, text field states, select, checkbox, radio, toggle, tabs, table" min="420px">
    <Pair name="button appearances">
      <button class="icon-btn" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="btn">Default</button><button class="btn primary">Primary</button><button class="btn subtle">Subtle</button><button class="btn link">Link</button><button class="btn warning">Warning</button><button class="btn danger">Danger</button><button class="btn selected">Selected</button><button class="btn" disabled>Disabled</button>
    </Pair>
    <Pair name="text field states + select + checkbox/radio/toggle">
      <div><label class="field-label">Summary <b>*</b></label><input class="textfield" value="Stock element pages" /><div class="helper">Concise summary of the work.</div></div>
      <div><label class="field-label">Invalid</label><input class="textfield invalid" value="" /><div class="helper error">This field is required.</div></div>
      <input class="textfield" disabled value="Disabled" /> <select class="select"><option>Story</option></select>
      <span><span class="checkbox on"></span> <span class="checkbox"></span> <span class="radio on"></span> <span class="radio"></span> <span class="toggle on"></span> <span class="toggle"></span></span>
    </Pair>
    <Pair name="table.ds + empty state + skeleton">
      <table class="ds"><thead><tr><th>Key</th><th>Summary</th><th>Status</th><th>Assignee</th></tr></thead><tbody><tr><td><a href="#">IG-42</a></td><td>Stock element pages</td><td><span class="lozenge inprogress">In progress</span></td><td><span class="avatar sm">JR</span></td></tr><tr><td><a class="visited" href="#">IG-37</a></td><td>GitHub stock page</td><td><span class="lozenge success">Done</span></td><td><span class="avatar sm">JR</span></td></tr></tbody></table>
      <div class="empty-state"><h3>No issues match</h3>Try clearing a filter.</div>
      <div class="skeleton" style="width:60%"></div>
    </Pair>
  </Section>

  <Section id="overlays" title="Overlays and messages" lead="Dropdown menu (role=menu), modal (role=dialog), flags, section messages, banner, tooltip, inline dialog" min="420px">
    <Pair name="[role=menu].dropdown + [role=dialog].modal">
      <div role="menu" class="dropdown"><div class="group-title">Actions</div><div role="menuitem" class="item">✎ Edit</div><div role="menuitem" class="item selected">🔗 Copy link</div><div role="menuitem" class="item">➔ Move</div><div class="sep"></div><div role="menuitem" class="item" style="color:var(--ds-text-danger)">🗑 Delete</div></div>
      <div role="dialog" class="modal"><div class="modal-head">⚠ Delete IG-42?</div><div class="modal-body"><p style="margin:0">You're about to permanently delete this issue, its comments and attachments.</p><div class="section-message warning"><span class="ic">⚠</span><div>Deleted issues cannot be recovered.</div></div></div><div class="modal-foot"><button class="btn subtle">Cancel</button><button class="btn danger">Delete</button></div></div>
    </Pair>
    <Pair name="flags + section messages">
      <div class="flag"><span class="ic">✓</span><div><b>IG-43 created</b>Sage Ink stock pages · <a href="#">View issue</a><div class="actions"><a href="#">Copy link</a></div></div></div>
      <div class="flag error"><span class="ic">✕</span><div><b>Something went wrong</b>Could not save. <a href="#">Retry</a></div></div>
      <div class="section-message"><span class="ic">ℹ</span><div><b>Information</b>The simulator is a web approximation.</div></div><div class="section-message success"><span class="ic">✓</span><div><b>All pages pass</b></div></div><div class="section-message error"><span class="ic">✕</span><div><b>Build failed</b></div></div><div class="section-message discovery"><span class="ic">✦</span><div><b>New in Jira</b></div></div>
    </Pair>
    <Pair name="banner / tooltip / inline dialog">
      <div class="banner">⚠ Scheduled maintenance at 02:00 UTC.</div><div class="banner error">✕ You are offline.</div>
      <span role="tooltip" class="tooltip">Create issue (c)</span>
      <div class="inline-dialog"><b>Sprint goal</b><p style="margin:4px 0 0;color:var(--ds-text-subtle)">All 15 stock pages pass e2e.</p></div>
    </Pair>
  </Section>
</SitePage>
