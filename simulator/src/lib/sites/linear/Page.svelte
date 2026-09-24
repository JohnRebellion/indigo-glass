<script lang="ts">
  /* Linear: sidebar and header, issue list with status/priority/labels,
   * board with issue cards, project card, issue detail, create-issue modal,
   * command menu, role=menu, controls, feedback. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="list" title="Shell and issue list" lead="Sidebar, header with title crumb, filter bar, grouped rows with status icon, priority, id, labels, assignee" min="600px">
    <Pair name="sidebar + header + .filter-bar + .row (status / priority / .label-chip)" span="full">
      <div class="shell"><nav class="sidebar"><div class="ws"><span></span>Indigo Glass ▾</div><a href="#">🔍 Search</a><a href="#">📥 Inbox <span class="badge" style="margin-left:auto">3</span></a><a href="#">◎ My issues</a><div class="label">Workspace</div><a href="#">◈ Views</a><a href="#">▣ Roadmap</a><div class="label">Your teams</div><a class="active" href="#">▲ SIM · Issues</a><a href="#">▲ SIM · Projects</a><a href="#">▲ SIM · Cycles</a></nav>
        <div class="main"><div class="header"><div class="title-crumb">SIM <span>›</span> All issues</div><div class="right"><button class="btn btn-ghost btn-icon"><i>☆</i></button><button class="btn btn-ghost btn-icon"><i>⋯</i></button></div></div>
          <div class="filter-bar"><button class="btn btn-ghost">⊕ Filter</button><span class="label-chip">Status: In Progress ✕</span><div class="right"><div class="tabs"><button class="active">List</button><button>Board</button></div><button class="btn btn-ghost">⚙ Display</button></div></div>
          <div class="group-head"><span class="status-icon progress"></span> In Progress <span class="count">3</span><span class="right">+</span></div>
          <div class="row selected"><span class="priority high"><i></i><i></i><i></i></span><span class="id">SIM-42</span><span class="status-icon progress"></span><span class="title-text">Stock element pages for all 15 Stylus sites</span><span class="label-chip feature">Feature</span><span class="project-icon"></span><span class="date">Sep 24</span><span class="avatar">JR</span></div>
          <div class="row"><span class="priority medium"><i></i><i></i><i></i></span><span class="id">SIM-41</span><span class="status-icon progress"></span><span class="title-text">Coverage check: every selector token needs a stock element</span><span class="label-chip bug">Bug</span><span class="date">Sep 23</span><span class="avatar">JR</span></div>
          <div class="row"><span class="priority low"><i></i><i></i><i></i></span><span class="id">SIM-40</span><span class="status-icon review"></span><span class="title-text">Canvas-resolve oklch() in Playwright</span><span class="label-chip design">Design</span><span class="date">Sep 22</span><span class="avatar" style="background:#8C3E5C">AL</span></div>
          <div class="group-head"><span class="status-icon"></span> Todo <span class="count">2</span></div>
          <div class="row"><span class="priority"><i></i><i></i><i></i></span><span class="id">SIM-39</span><span class="status-icon"></span><span class="title-text">Shopee light-only stock values</span><span class="date">—</span></div>
          <div class="row"><span class="priority urgent">⚠</span><span class="id">SIM-38</span><span class="status-icon backlog"></span><span class="title-text">Gemini Material tokens</span><span class="date">—</span></div>
          <div class="group-head"><span class="status-icon done"></span> Done <span class="count">5</span></div>
          <div class="row"><span class="priority"><i></i><i></i><i></i></span><span class="id">SIM-37</span><span class="status-icon done"></span><span class="title-text" style="color:var(--color-text-tertiary)">GitHub stock page</span><span class="date">Sep 21</span></div>
          <div class="row"><span class="priority"><i></i><i></i><i></i></span><span class="id">SIM-36</span><span class="status-icon cancelled"></span><span class="title-text" style="color:var(--color-text-tertiary);text-decoration:line-through">Blur effect</span><span class="date">Aug 28</span></div>
        </div></div>
    </Pair>
  </Section>

  <Section id="cards" title="Board, cards and detail" lead="class*=card (issue-card, project-card), issue detail with props, comment, activity, code" min="600px">
    <Pair name="board .issue-card / .project-card">
      <div class="board"><div class="col"><div class="col-head"><span class="status-icon"></span> Todo <span class="count">2</span></div><div class="issue-card"><span class="id">SIM-39</span><span class="title-text">Shopee light-only stock values</span><div class="meta"><span class="priority low"><i></i><i></i><i></i></span><span class="label-chip">Sites</span></div></div><div class="issue-card"><span class="id">SIM-38</span><span class="title-text">Gemini Material tokens</span><div class="meta"><span class="priority urgent">⚠</span><span class="avatar">JR</span></div></div></div>
        <div class="col"><div class="col-head"><span class="status-icon progress"></span> In Progress <span class="count">1</span></div><div class="issue-card"><span class="id">SIM-42</span><span class="title-text">Stock element pages</span><div class="meta"><span class="priority high"><i></i><i></i><i></i></span><span class="label-chip feature">Feature</span><span class="avatar">JR</span></div></div></div></div>
      <div class="project-card"><div class="heading-text"><span class="project-icon"></span> Sites comparison pages</div><div class="text-muted">Lead: John · Target Sep 26</div><div class="progress"><span></span></div><div class="text-muted">5 of 15 done · 33%</div></div>
    </Pair>
    <Pair name="issue detail (.title-text, .text-body, props, .comment, .activity, pre)" span="full">
      <div class="detail"><div class="body"><span class="id" style="color:var(--color-text-tertiary)">SIM-42</span><h1 class="title-text">Stock element pages for all 15 Stylus sites</h1><div class="text-body">Each page renders the site's stock elements beside the same markup under the shipped <code>.user.css</code>. Coverage is enforced: every selector token in the file needs an element in the stock lane.</div>
          <pre class="block"><code>npx playwright test e2e/sites.spec.ts -g "linear"</code></pre>
          <div class="heading-sm">Activity</div><div class="activity"><span class="avatar">JR</span><b>John</b> created the issue · 2d</div><div class="activity"><span class="status-icon progress"></span><b>John</b> changed status from Todo to In Progress · 1d</div>
          <div class="comment"><span class="avatar" style="background:#8C3E5C">AL</span><div class="text-body"><b>Ada</b> <span class="text-muted">· 3h</span><br/>Chromium keeps <code>oklch()</code> in computed styles. Resolve via canvas pixel. <kbd>⌘</kbd><kbd>↵</kbd> to reply. Output <samp>1 passed</samp> in <tt>1.6s</tt>.</div></div></div>
        <div class="props"><div class="heading-sm">Properties</div><div class="prop"><span class="k">Status</span><span class="status-icon progress"></span> In Progress</div><div class="prop"><span class="k">Priority</span><span class="priority high"><i></i><i></i><i></i></span> High</div><div class="prop"><span class="k">Assignee</span><span class="avatar">JR</span> John</div><div class="prop"><span class="k">Labels</span><span class="label-chip feature">Feature</span></div><div class="prop"><span class="k">Project</span><span class="project-icon"></span> Sites pages</div><div class="prop"><span class="k">Cycle</span>Cycle 14</div><div class="prop"><span class="k">Due</span>Sep 26</div></div></div>
    </Pair>
  </Section>

  <Section id="overlays" title="Modal, menus, controls" lead="role=dialog class*=modal, command menu, role=menu, buttons, input/select/switch/checkbox, toast, tooltip, banners" min="420px">
    <Pair name="[role=dialog].modal (create issue)" span="full">
      <div role="dialog" class="modal"><div class="modal-head"><span class="badge">SIM</span> › New issue</div><div class="modal-body"><input value="Issue title" /><textarea>Add description…</textarea></div><div class="modal-props"><button class="btn btn-secondary"><span class="status-icon backlog"></span> Backlog</button><button class="btn btn-secondary"><span class="priority"><i></i><i></i><i></i></span> Priority</button><button class="btn btn-secondary">👤 Assignee</button><button class="btn btn-secondary">⊙ Labels</button><button class="btn btn-secondary">▣ Project</button></div><div class="modal-foot"><span class="checkbox"></span> Create more <div class="right"><button class="btn btn-ghost">Cancel</button><button class="btn btn-primary">Create issue</button></div></div></div>
    </Pair>
    <Pair name="command menu + [role=menu]">
      <div class="command"><input value="Type a command or search…" /><div class="cmd-row sel">＋ Create new issue <kbd>C</kbd></div><div class="cmd-row">◎ Go to my issues <kbd>G I</kbd></div><div class="cmd-row">⚙ Open settings <kbd>G S</kbd></div></div>
      <div role="menu"><div role="menuitem">✎ Edit <kbd>E</kbd></div><div role="menuitem">⧉ Copy link <kbd>⌘⇧,</kbd></div><div role="menuitem">◈ Set status… <kbd>S</kbd></div><div class="sep"></div><div role="menuitem" style="color:var(--color-error)">🗑 Delete <kbd>⌘⌫</kbd></div></div>
    </Pair>
    <Pair name="buttons + input/select/switch/checkbox/tabs">
      <button class="btn btn-icon" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="btn btn-primary">Create issue</button><button class="btn btn-secondary">Secondary</button><button class="btn btn-ghost">Ghost</button><button class="btn btn-danger">Delete</button><button class="btn btn-primary" disabled>Disabled</button>
      <input class="input" value="Team name" /> <select class="select"><option>Cycle 14</option></select>
      <span><span class="switch on"></span> <span class="switch"></span> <span class="checkbox on"></span> <span class="checkbox"></span></span>
      <div class="tabs"><button class="active">Active</button><button>Backlog</button><button>All</button></div>
    </Pair>
    <Pair name="toast / tooltip / banners / skeleton">
      <div class="toast">Issue created <span class="text-muted">SIM-43</span> <a href="#">Open</a></div>
      <span role="tooltip" class="tooltip">Create issue <kbd>C</kbd></span>
      <div class="banner error">✕ Failed to sync. Retrying…</div><div class="banner warning">⚠ Cycle ends in 2 days.</div><div class="banner success">✓ All 15 pages pass.</div><div class="banner info">ℹ New: Sites tab in the simulator.</div>
      <div class="skeleton" style="width:60%"></div>
    </Pair>
  </Section>
</SitePage>
