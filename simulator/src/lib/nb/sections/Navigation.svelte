<script lang="ts">
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';
</script>

<Section id="navigation" title="Navigation" lead="tabs, breadcrumb, pagination, navigation menu, menubar, dropdown menu, context menu, sidebar" min="300px">

  <Specimen name="tabs" span={2} variant="divergence"
    note="The reference FILLS the active tab (data-[state=active]:bg-main + border). Sage Ink's own Tier C rule says an on-select state is an outline, never a fill — and the simulator's shell nav follows Tier C. Both are on this page on purpose; resolving the contradiction is the top item in the ledger.">
    <div class="col wfull">
      <div>
        <div class="nb-tabs-list">
          <button type="button" class="nb-tabs-trigger" data-state="active">Account</button>
          <button type="button" class="nb-tabs-trigger">Password</button>
          <button type="button" class="nb-tabs-trigger">Tokens</button>
        </div>
        <div class="nb-tabs-content"><span class="cap">reference behaviour — active tab is accent-filled</span></div>
      </div>
      <div>
        <div class="nb-tabs-list">
          <button type="button" class="nb-tabs-trigger tier-c" data-state="active">Account</button>
          <button type="button" class="nb-tabs-trigger">Password</button>
          <button type="button" class="nb-tabs-trigger">Tokens</button>
        </div>
        <div class="nb-tabs-content"><span class="cap">Sage Ink Tier C — active tab is outlined, not filled</span></div>
      </div>
    </div>
  </Specimen>

  <Specimen name="breadcrumb">
    <nav class="nb-breadcrumb" aria-label="Breadcrumb">
      <a href="#navigation">Home</a>
      <span class="nb-breadcrumb-sep" aria-hidden="true">/</span>
      <a href="#navigation">Tokens</a>
      <span class="nb-breadcrumb-sep" aria-hidden="true">/</span>
      <span class="nb-breadcrumb-sep" aria-hidden="true">&#8943;</span>
      <span class="nb-breadcrumb-sep" aria-hidden="true">/</span>
      <span aria-current="page">Sage</span>
    </nav>
  </Specimen>

  <Specimen name="pagination" span={2}
    note="Only the current page keeps the ink shadow; the rest are flat neutral cells. Elevation marks the current position rather than a fill alone.">
    <nav class="nb-pagination" aria-label="Pagination">
      <a class="nb-pagination-link" href="#navigation">Previous</a>
      <a class="nb-pagination-link" href="#navigation">1</a>
      <a class="nb-pagination-link" href="#navigation" aria-current="page">2</a>
      <a class="nb-pagination-link" href="#navigation">3</a>
      <span class="nb-pagination-ellipsis" aria-hidden="true">&#8943;</span>
      <a class="nb-pagination-link" href="#navigation">9</a>
      <a class="nb-pagination-link" href="#navigation">Next</a>
    </nav>
  </Specimen>

  <Specimen name="navigation-menu" span={2}>
    <div class="col wfull">
      <div class="nb-navmenu">
        <button type="button" class="nb-navmenu-trigger">Layers <span aria-hidden="true">&#9662;</span></button>
        <button type="button" class="nb-navmenu-trigger">Tokens <span aria-hidden="true">&#9662;</span></button>
        <a class="nb-navmenu-trigger" href="#navigation">Docs</a>
      </div>
      <div class="nb-navmenu-viewport w420">
        <div class="nm-grid">
          <div><strong>Plasma</strong><br /><span class="sub">Klassy, KWin, colour scheme</span></div>
          <div><strong>GTK</strong><br /><span class="sub">GTK3 + GTK4 SageInk theme</span></div>
          <div><strong>Terminal</strong><br /><span class="sub">Konsole, Starship, Fastfetch</span></div>
          <div><strong>Web</strong><br /><span class="sub">Tailwind v4 @theme block</span></div>
        </div>
      </div>
    </div>
  </Specimen>

  <Specimen name="menubar" span={2}>
    <div class="col wfull">
      <div class="nb-menubar">
        <button type="button" class="nb-menubar-trigger" data-state="open">File</button>
        <button type="button" class="nb-menubar-trigger">Edit</button>
        <button type="button" class="nb-menubar-trigger">View</button>
        <button type="button" class="nb-menubar-trigger">Profiles</button>
      </div>
      <div class="nb-menu w220">
        <div class="nb-menu-item">New Tab <span class="nb-menu-shortcut">⌘T</span></div>
        <div class="nb-menu-item" data-highlighted>New Window <span class="nb-menu-shortcut">⌘N</span></div>
        <div class="nb-menu-separator"></div>
        <div class="nb-menu-item">Share</div>
        <div class="nb-menu-item" data-disabled>Print… <span class="nb-menu-shortcut">⌘P</span></div>
      </div>
    </div>
  </Specimen>

  <Specimen name="dropdown-menu"
    note="Highlighted row takes a border, not a fill — `focus:border-border` on a transparent 2px border, so nothing shifts on hover.">
    <div class="col">
      <button type="button" class="nb-button nb-button--neutral nb-button--sm">Open <span aria-hidden="true">&#9662;</span></button>
      <div class="nb-menu w220">
        <div class="nb-menu-label">My Account</div>
        <div class="nb-menu-separator"></div>
        <div class="nb-menu-item">Profile <span class="nb-menu-shortcut">⇧⌘P</span></div>
        <div class="nb-menu-item" data-highlighted>Billing <span class="nb-menu-shortcut">⌘B</span></div>
        <div class="nb-menu-item nb-menu-item--inset">Team</div>
        <div class="nb-menu-item">Subscription <span aria-hidden="true">&#8250;</span></div>
        <div class="nb-menu-separator"></div>
        <div class="nb-menu-item" data-disabled>Log out</div>
      </div>
    </div>
  </Specimen>

  <Specimen name="context-menu"
    note="Identical surface to dropdown-menu in the reference; only the trigger differs. Shown with a checkbox item and a radio item, which is what distinguishes it in practice.">
    <div class="col">
      <div class="ctx-target">right-click target</div>
      <div class="nb-menu w220">
        <div class="nb-menu-item">Back <span class="nb-menu-shortcut">⌘[</span></div>
        <div class="nb-menu-item" data-disabled>Forward <span class="nb-menu-shortcut">⌘]</span></div>
        <div class="nb-menu-separator"></div>
        <div class="nb-menu-item nb-menu-item--inset" data-highlighted><span class="mark" aria-hidden="true">&#10003;</span> Show Bookmarks</div>
        <div class="nb-menu-item nb-menu-item--inset"><span class="mark" aria-hidden="true">&#9679;</span> Sage</div>
        <div class="nb-menu-item nb-menu-item--inset">Indigo</div>
      </div>
    </div>
  </Specimen>

  <Specimen name="sidebar" span={2} variant="divergence"
    note="Reference sidebar has no dedicated on-select styling beyond the menu-item border. Sage Ink pins it to Tier C explicitly: active item is outlined with --ring, never filled, so the sidebar matches VSCode's activityBar.activeBorder and Plasma's DecorationFocus.">
    <div class="row top">
      <div class="nb-sidebar">
        <div class="nb-sidebar-header"><strong>Sage Ink</strong></div>
        <div class="nb-sidebar-group-label">Layers</div>
        <div class="nb-sidebar-item" data-active>Plasma</div>
        <div class="nb-sidebar-item">GTK</div>
        <div class="nb-sidebar-item">Konsole</div>
        <div class="nb-sidebar-group-label">Build</div>
        <div class="nb-sidebar-item">Tokens</div>
        <div class="nb-sidebar-item">Install</div>
        <div class="nb-sidebar-footer"><span class="cap">v5 &middot; sage</span></div>
      </div>
      <div class="col">
        <span class="cap">Paired content pane</span>
        <div class="nb-card w260">
          <div class="nb-card-header"><div class="nb-card-title">Plasma</div></div>
          <div class="nb-card-content">Klassy decoration, KWin rules, SageInk colour scheme.</div>
        </div>
      </div>
    </div>
  </Specimen>
</Section>

<style>
  .col { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ig-gap-lg); }
  .row { display: flex; flex-wrap: wrap; gap: var(--ig-gap-xl); }
  .top { align-items: flex-start; }
  .wfull { width: 100%; }
  .w220 { width: 220px; }
  .w260 { width: 260px; }
  .w420 { width: 420px; max-width: 100%; }
  .cap { font-size: var(--ig-type-xs-pt); color: var(--ig-text-muted); }
  .sub { font-size: var(--ig-type-xs-pt); opacity: 0.8; }
  .nm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ig-gap-lg); font-size: var(--ig-caption-pt); }
  .mark { width: 14px; display: inline-block; margin-left: -20px; }

  .ctx-target {
    display: grid;
    place-items: center;
    width: 200px;
    height: 60px;
    border: var(--ig-border-default) dashed var(--ig-border-strong);
    color: var(--ig-text-muted);
    font-size: var(--ig-caption-pt);
  }

  /* Tier C alternative to the reference's filled active tab. */
  :global(.nb-tabs-trigger.tier-c[data-state='active']) {
    background: transparent;
    color: var(--foreground);
    border-color: var(--ring);
  }
</style>
