<script lang="ts">
  /* Microsoft 365 (Outlook web + Teams + Calendar): the OWA shell with app
   * launcher and search, folder tree, message list tabs, reading pane with
   * command bar, Fluent v9 controls, Personas and Avatars with presence,
   * legacy Fabric ms-* controls, menus, dialogs, feedback. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="shell" title="Outlook shell" lead="#appContainer › .ms-Fabric › owaAppShell header with #owaAppLauncherBtn_container and #searchBoxId-Mail, app rail, folder tree, message list with button.fui-Tab, reading pane with command bar" min="640px">
    <Pair name="#appContainer .ms-Fabric [class*=owaAppShell] #owaAppLauncherBtn_container #searchBoxId-Mail button.fui-Tab" wrap={false} span="full">
      <div id="appContainer" class="ms-Fabric shell"><div class="owaAppShell-header o365cs-nav-header"><div id="owaAppLauncherBtn_container"><button title="App launcher"><i>⋮⋮⋮</i></button></div><span class="brand">Outlook</span><div id="searchBoxId-Mail"><span>🔍</span><input placeholder="Search" /><span>⚙</span></div><button class="hdr-btn"><i>💎</i></button><button class="hdr-btn"><i>🔔</i></button><button class="hdr-btn"><i>⚙</i></button><button class="hdr-btn"><i>?</i></button><span class="fui-Avatar sm" style="margin-right:8px">JR<span class="fui-PresenceBadge"></span></span></div>
        <div class="owaAppShell-body"><div class="app-rail"><button aria-selected="true"><i>✉</i></button><button><i>📅</i></button><button><i>👥</i></button><button><i>📎</i></button><button><i>✓</i></button><button>T</button><button><i>⋯</i></button></div>
          <div class="folder-pane"><div class="fui-Tree-item group">▾ Favourites</div><div class="fui-Tree-item selected">📥 Inbox <span class="count">12</span></div><div class="fui-Tree-item">📤 Sent Items</div><div class="fui-Tree-item">📝 Drafts <span class="count">2</span></div><div class="fui-Tree-item group">▾ john@mtusa.com</div><div class="fui-Tree-item">📥 Inbox</div><div class="fui-Tree-item">🗑 Deleted Items</div><div class="fui-Tree-item">⚠ Junk Email</div><div class="fui-Tree-item">📁 Archive</div><div class="fui-Tree-item">📁 Projects</div></div>
          <div class="message-list"><div class="fui-TabList"><button class="fui-Tab" aria-selected="true">Focused</button><button class="fui-Tab">Other</button><div class="right">Filter ▾</div></div>
            <div class="msg-item unread selected"><span class="fui-Avatar">AL<span class="fui-PresenceBadge"></span></span><div class="body"><div class="row"><span class="from">Ada Lovelace</span><span class="time">14:02</span></div><div class="row"><span class="subject">Sage Ink stock pages</span><span class="attach">📎</span></div><span class="preview">Chromium keeps oklch() in computed styles, so the test resolves via canvas…</span></div></div>
            <div class="msg-item unread"><span class="fui-Avatar berry">GH<span class="fui-PresenceBadge busy"></span></span><div class="body"><div class="row"><span class="from">Grace Hopper</span><span class="time">13:40</span></div><div class="row"><span class="subject">RE: Playwright clip slices</span><span class="flag">⚑</span></div><span class="preview">The image guard rejects anything over 3.75 MP…</span></div></div>
            <div class="msg-item"><span class="fui-Avatar green">KD<span class="fui-PresenceBadge away"></span></span><div class="body"><div class="row"><span class="from">KDE Community</span><span class="time">Yesterday</span></div><div class="row"><span class="subject">Plasma 6.5 colour scheme API</span><span class="pin">📌</span></div><span class="preview">Themes can now declare OKLCH tokens directly…</span></div></div>
            <div class="msg-item"><span class="fui-Avatar square">MS<span class="fui-PresenceBadge offline"></span></span><div class="body"><div class="row"><span class="from">Microsoft 365 Message Center</span><span class="time">Mon</span></div><div class="row"><span class="subject">Weekly digest</span></div><span class="preview">3 new features, 1 plan for change…</span></div></div></div>
          <div class="reading-pane"><div class="command-bar"><button class="ms-CommandBarItem live"><i>↩</i> Reply</button><button class="ms-CommandBarItem live"><i>↩↩</i> Reply all</button><button class="ms-CommandBarItem live"><i>→</i> Forward</button><button class="ms-CommandBarItem"><i>📁</i> Archive</button><button class="ms-CommandBarItem"><i>🗑</i> Delete</button><button class="ms-CommandBarItem"><i>⛔</i> Block</button><button class="ms-CommandBarItem"><i>⚑</i> Flag</button><button class="ms-CommandBarItem"><i>⋯</i></button></div>
            <div class="head"><h2>Sage Ink stock pages</h2><div class="sender"><span class="fui-Avatar">AL<span class="fui-PresenceBadge"></span></span><div><span class="name">Ada Lovelace</span><br/><span class="to">To: John Rebellion; Grace Hopper</span></div><span class="date">Wed 24/09/2026 14:02</span></div></div>
            <div class="content"><p>Hi John,</p><p>Chromium keeps <code>oklch()</code> in computed styles, so the test resolves lane colours via a canvas pixel. Details in the <a href="#">simulator README</a>.</p><p>— Ada</p><div class="fui-Tag">📎 sites.spec.ts <span class="fui-Text subtle">4 KB</span></div><div style="display:flex;gap:8px;margin-top:8px"><button class="fui-Button">↩ Reply</button><button class="fui-Button">→ Forward</button></div></div></div></div></div>
    </Pair>
  </Section>

  <Section id="people" title="Personas and avatars" lead="Fluent Persona / Avatar / PresenceBadge and legacy ms-Persona-image / ms-Persona-initials, the only things the file exempts from the radius reset" min="420px">
    <Pair name=".fui-Persona .fui-Avatar .fui-PresenceBadge (sizes, presence)">
      <div class="fui-Persona"><span class="fui-Avatar">JR<span class="fui-PresenceBadge"></span></span><span><span class="fui-Persona__primaryText">John Rebellion</span><span class="fui-Persona__secondaryText">Available · Solutions engineer</span></span></div>
      <div class="fui-Persona"><span class="fui-Avatar berry lg">AL<span class="fui-PresenceBadge busy"></span></span><span><span class="fui-Persona__primaryText">Ada Lovelace</span><span class="fui-Persona__secondaryText">Busy · In a meeting</span></span></div>
      <span><span class="fui-Avatar sm">GH<span class="fui-PresenceBadge away"></span></span> <span class="fui-Avatar green">KD<span class="fui-PresenceBadge offline"></span></span> <span class="fui-Avatar square">MS</span></span>
    </Pair>
    <Pair name=".ms-Persona .ms-Persona-image .ms-Persona-initials (Fabric)">
      <div class="ms-Persona"><span class="ms-Persona-image"></span><span><span class="ms-Persona-primaryText">Grace Hopper</span><span class="ms-Persona-secondaryText">Rear Admiral</span></span></div>
      <div class="ms-Persona"><span class="ms-Persona-initials">JR</span><span><span class="ms-Persona-primaryText">John Rebellion</span><span class="ms-Persona-secondaryText">john@mtusa.com</span></span></div>
    </Pair>
  </Section>

  <Section id="controls" title="Fluent v9 controls" lead="fui-Button appearances and shapes, SplitButton, Input variants, Label/Field, Dropdown, Checkbox, Radio, Switch, Slider, Badges, Tags, Text colours" min="420px">
    <Pair name=".fui-Button appearances + shapes + .fui-SplitButton">
      <button class="fui-Button icon" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="fui-Button">Secondary</button><button class="fui-Button primary">Primary</button><button class="fui-Button outline">Outline</button><button class="fui-Button subtle">Subtle</button><button class="fui-Button transparent">Transparent</button><button class="fui-Button" disabled>Disabled</button>
      <span><button class="fui-Button icon"><i>✉</i></button> <button class="fui-Button icon circular"><i>＋</i></button> <button class="fui-Button icon square"><i>⚙</i></button></span>
      <div class="fui-SplitButton"><button class="fui-Button primary">New mail</button><button class="fui-Button primary"><i>▾</i></button></div>
    </Pair>
    <Pair name=".fui-Label + .fui-Input variants + .fui-Dropdown + .fui-Textarea" wrap={false}>
      <div><label class="fui-Label">Subject <span class="req">*</span></label><span class="fui-Input"><input value="Sage Ink stock pages" /></span><div class="fui-Field__hint">Keep it short.</div></div>
      <div><label class="fui-Label">Required</label><span class="fui-Input" style="border-bottom-color:var(--colorPaletteRedForeground1)"><input value="" placeholder="Required" /></span><div class="fui-Field__validationMessage">✕ This field is required.</div></div>
      <span class="fui-Input underline"><input placeholder="Underline" /></span> <span class="fui-Input filled"><input placeholder="Filled darker" /></span>
      <span class="fui-Dropdown">Focused inbox ▾</span> <span class="fui-Select"><select><option>Segoe UI</option></select></span>
      <textarea class="fui-Textarea" placeholder="Add a note…"></textarea>
    </Pair>
    <Pair name=".fui-Checkbox .fui-Radio .fui-Switch .fui-Slider">
      <span class="fui-Checkbox checked"><span class="fui-Checkbox__indicator">✓</span> Checked</span> <span class="fui-Checkbox"><span class="fui-Checkbox__indicator"></span> Unchecked</span>
      <span class="fui-Radio checked"><span class="fui-Radio__indicator"></span> Selected</span> <span class="fui-Radio"><span class="fui-Radio__indicator"></span> Option</span>
      <span class="fui-Switch checked"><span class="fui-Switch__indicator"></span> Dark mode</span> <span class="fui-Switch"><span class="fui-Switch__indicator"></span> Focused inbox</span>
      <span class="fui-Slider"></span>
    </Pair>
    <Pair name=".fui-Badge .fui-CounterBadge .fui-Tag .fui-Text">
      <div><span class="fui-Badge">Brand</span> <span class="fui-Badge danger">Danger</span> <span class="fui-Badge success">Success</span> <span class="fui-Badge warning">Warning</span> <span class="fui-Badge outline">Outline</span> <span class="fui-Badge subtle">Subtle</span> <span class="fui-Badge important">Important</span> <span class="fui-Badge informative">Informative</span> <span class="fui-Badge square">Square</span> <span class="fui-Badge rounded">Rounded</span> <span class="fui-CounterBadge">12</span></div>
      <div><span class="fui-Tag">📎 Attachment</span> <span class="fui-Tag circular"><span class="fui-Avatar sm">AL</span> Ada Lovelace ✕</span> <span class="fui-Tag brand">Brand</span> <span class="fui-Tag outline">Outline</span></div>
      <div><span class="fui-Text">Foreground1</span> · <span class="fui-Text subtle">Foreground3</span> · <span class="fui-Text disabled">Disabled</span> · <span class="fui-Text brand">Brand</span> · <span class="fui-Text danger">Red</span> · <span class="fui-Text success">Green</span> · <span class="fui-Text warning">Yellow</span> · <a class="fui-Link" href="#">Link</a></div>
    </Pair>
  </Section>

  <Section id="surfaces" title="Cards, menus, dialogs, feedback" lead="fui-Card variants, Menu, DialogSurface, Popover, Tooltip, Toast, MessageBar, ProgressBar, Spinner, Skeleton, Divider, Breadcrumb, Accordion, Table, compose window, app launcher" min="420px">
    <Pair name=".fui-Card variants + .fui-Menu" wrap={false}>
      <div class="fui-Card"><div class="fui-CardHeader"><span class="fui-Avatar">AL<span class="fui-PresenceBadge"></span></span><div><b>Ada Lovelace</b><small>Shared a file · 2 h</small></div></div><div data-art class="fui-CardPreview"></div><span>sites.spec.ts</span><div class="fui-CardFooter"><button class="fui-Button">Open</button><button class="fui-Button subtle">Share</button></div></div>
      <div class="fui-Card filled-alt"><b>Filled alternative</b><span class="fui-Text subtle">Background2</span></div><div class="fui-Card outline"><b>Outline</b></div><div class="fui-Card subtle"><b>Subtle</b></div>
      <div role="menu" class="fui-Menu"><div class="fui-MenuGroupHeader">Actions</div><div role="menuitem" class="fui-MenuItem">↩ Reply <span class="fui-MenuItem__secondaryContent">Ctrl+R</span></div><div role="menuitem" class="fui-MenuItem">→ Forward <span class="fui-MenuItem__secondaryContent">Ctrl+F</span></div><div role="menuitem" class="fui-MenuItem">📁 Move to ▸</div><div class="fui-MenuDivider"></div><div role="menuitem" class="fui-MenuItem">🗑 Delete <span class="fui-MenuItem__secondaryContent">Del</span></div></div>
    </Pair>
    <Pair name=".fui-DialogSurface + .fui-Popover + .fui-Tooltip" wrap={false}>
      <div role="dialog" class="fui-DialogSurface"><div class="fui-DialogTitle">Discard draft? <button class="fui-Button transparent icon"><i>✕</i></button></div><div class="fui-DialogContent">Your changes to "Sage Ink stock pages" will be lost.</div><div class="fui-DialogActions"><button class="fui-Button">Cancel</button><button class="fui-Button primary">Discard</button></div></div>
      <div class="fui-Popover"><b>Focused inbox</b><p style="margin:4px 0 0;color:var(--colorNeutralForeground2)">Sorts your inbox into Focused and Other.</p></div><div class="fui-Popover brand"><b>New</b> Copilot can draft replies.</div>
      <span role="tooltip" class="fui-Tooltip">Reply (Ctrl+R)</span> <span class="fui-Tooltip inverted">Inverted</span>
    </Pair>
    <Pair name=".fui-Toast .fui-MessageBar .fui-ProgressBar .fui-Spinner .fui-Skeleton .fui-Divider" wrap={false}>
      <div class="fui-Toast"><span class="ic">✓</span><div><span class="fui-ToastTitle">Message sent</span><span class="fui-ToastBody">To Ada Lovelace</span></div><button class="fui-Button transparent" style="margin-left:auto">Undo</button></div><div class="fui-Toast error"><span class="ic">✕</span><div><span class="fui-ToastTitle">Couldn't send</span></div></div>
      <div class="fui-MessageBar"><span class="ic">ℹ</span><span><b>Info</b> The simulator is a web approximation.</span><button class="fui-Button transparent">Dismiss</button></div><div class="fui-MessageBar error"><span class="ic">✕</span><span><b>Error</b> Build failed.</span></div><div class="fui-MessageBar warning"><span class="ic">⚠</span><span><b>Warning</b> Mailbox 92% full.</span></div><div class="fui-MessageBar success"><span class="ic">✓</span><span><b>Success</b> All pages pass.</span></div>
      <span><span class="fui-ProgressBar"><span></span></span> <span class="fui-ProgressBar thick success"><span></span></span> <span class="fui-ProgressBar thick error"><span></span></span> <span class="fui-Spinner"></span></span>
      <div class="fui-Skeleton" style="width:60%"></div><div class="fui-Divider">Yesterday</div>
    </Pair>
    <Pair name=".fui-Breadcrumb .fui-Accordion .fui-Table">
      <div class="fui-Breadcrumb"><button class="fui-BreadcrumbButton">Files</button><span class="fui-BreadcrumbDivider">›</span><button class="fui-BreadcrumbButton">Projects</button><span class="fui-BreadcrumbDivider">›</span><button class="fui-BreadcrumbButton current">indigo-glass</button></div>
      <div class="fui-Accordion"><div class="fui-AccordionHeader">▾ Mail settings</div><div class="fui-AccordionPanel">Layout, compose and reply, attachments, rules.</div><div class="fui-AccordionHeader">▸ Calendar settings</div></div>
      <table class="fui-Table"><thead><tr><th class="fui-TableHeaderCell">Name</th><th class="fui-TableHeaderCell">Modified</th><th class="fui-TableHeaderCell">Size</th></tr></thead><tbody><tr class="fui-TableRow selected"><td class="fui-TableCell">📄 sites.spec.ts</td><td class="fui-TableCell">Today</td><td class="fui-TableCell">4 KB</td></tr><tr class="fui-TableRow"><td class="fui-TableCell">📁 stock</td><td class="fui-TableCell">Yesterday</td><td class="fui-TableCell">—</td></tr></tbody></table>
    </Pair>
    <Pair name="compose window + app launcher" span="full">
      <div class="compose"><div class="compose-bar"><button class="fui-Button primary">Send</button><button class="fui-Button subtle">📎 Attach ▾</button><button class="fui-Button subtle">✎ Editor</button><button class="fui-Button subtle">✦ Copilot</button><button class="fui-Button subtle icon" style="margin-left:auto"><i>🗑</i></button><button class="fui-Button subtle icon"><i>⋯</i></button></div><div class="field-row">To <span class="fui-Tag circular" style="height:24px"><span class="fui-Avatar sm" style="width:18px;height:18px;font-size:8px">AL</span> Ada Lovelace ✕</span></div><div class="field-row">Cc</div><div class="field-row"><span style="color:var(--colorNeutralForeground1)">Add a subject</span></div><div class="editor">Hi Ada, the stock lane reads the same tokens the file remaps…</div><div class="fmt"><button class="fui-Button subtle icon"><b>B</b></button><button class="fui-Button subtle icon"><i>I</i></button><button class="fui-Button subtle icon"><u>U</u></button><button class="fui-Button subtle icon"><i>≡</i></button><button class="fui-Button subtle icon"><i>🔗</i></button></div></div>
      <div class="waffle"><b>Apps</b><div class="apps"><a href="#"><i style="background:#0078D4"></i>Outlook</a><a href="#"><i style="background:#0F6CBD"></i>OneDrive</a><a href="#"><i style="background:#185ABD"></i>Word</a><a href="#"><i style="background:#107C41"></i>Excel</a><a href="#"><i style="background:#C43E1C"></i>PowerPoint</a><a href="#"><i style="background:#7B83EB"></i>Teams</a></div></div>
    </Pair>
  </Section>

  <Section id="fabric" title="Fabric (legacy) and other apps" lead="ms-Button, ms-TextField, ms-Pivot, ms-Toggle, ms-Checkbox, ms-Dropdown, ms-Nav, ms-DetailsRow, ms-Callout, ms-MessageBar; calendar grid; Teams chat" min="420px">
    <Pair name="[class*=ms-] controls">
      <span><button class="ms-Button">Standard</button> <button class="ms-Button ms-Button--primary">Primary</button></span>
      <span class="ms-TextField">Fabric text field</span> <span class="ms-Dropdown">Dropdown ▾</span>
      <div class="ms-Pivot"><button class="ms-Pivot-link is-selected">Mail</button><button class="ms-Pivot-link">Calendar</button><button class="ms-Pivot-link">People</button></div>
      <span><span class="ms-Toggle is-checked"></span> <span class="ms-Toggle"></span> <span class="ms-Checkbox-checkbox is-checked">✓</span> <span class="ms-Checkbox-checkbox"></span> <span class="ms-Icon">✉</span> <a class="ms-Link" href="#">ms-Link</a></span>
      <div style="width:220px"><div class="ms-Nav-link is-selected">📥 Inbox</div><div class="ms-Nav-link">📤 Sent</div></div>
      <div style="width:100%"><div class="ms-DetailsRow is-selected"><span class="ms-Checkbox-checkbox is-checked">✓</span>📄 report.docx<span style="margin-left:auto;color:var(--neutralSecondary)">Today</span></div><div class="ms-DetailsRow"><span class="ms-Checkbox-checkbox"></span>📊 budget.xlsx<span style="margin-left:auto;color:var(--neutralSecondary)">Yesterday</span></div></div>
      <div class="ms-Callout"><b>Callout</b><br/>Fabric surface on neutralLighterAlt.</div>
      <div class="ms-MessageBar">ℹ Fabric message bar</div><div class="ms-MessageBar ms-MessageBar--error">✕ Error</div><div class="ms-MessageBar ms-MessageBar--warning">⚠ Warning</div><div class="ms-MessageBar ms-MessageBar--success">✓ Success</div>
    </Pair>
    <Pair name="calendar week + Teams chat">
      <div class="calendar"><div class="dow">Mon</div><div class="dow">Tue</div><div class="dow">Wed</div><div class="dow">Thu</div><div class="dow">Fri</div><div class="dow">Sat</div><div class="dow">Sun</div><div class="day">21</div><div class="day">22<span class="event">Sprint review</span></div><div class="day">23<span class="event teams">Teams sync</span></div><div class="day today"><b>24</b><span class="event">Stock pages</span><span class="event teams">1:1 Ada</span></div><div class="day">25</div><div class="day">26<span class="event">Due</span></div><div class="day">27</div></div>
      <div class="teams-msg"><span class="fui-Avatar berry">AL<span class="fui-PresenceBadge busy"></span></span><div class="bubble"><div class="meta"><b>Ada Lovelace</b><span>14:05</span></div>Canvas pixel works. Tolerance ±2.<div class="reactions"><span>👍 2</span><span>❤ 1</span></div></div></div>
      <div class="teams-msg"><div class="bubble mine"><div class="meta"><b>You</b><span>14:06</span></div>Regenerating after every token change.</div></div>
      <textarea class="fui-Textarea chat" placeholder="Type a message"></textarea>
    </Pair>
  </Section>
</SitePage>
