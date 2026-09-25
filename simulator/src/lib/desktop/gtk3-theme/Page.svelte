<script lang="ts">
  /* GTK3 theme: SageInk (gtk.css + gtk-dark.css, concatenated as GTK loads
   * them) vs Breeze-Dark, the GTK3 theme a stock Plasma session actually
   * applies (kde-gtk-config), not upstream Adwaita. One specimen tree per
   * lane, GTK node names as custom elements, GTK style classes as HTML
   * classes, GTK state pseudo-classes as data-* attributes/.backdrop (see
   * gtkcss.ts rewritePseudoClasses) so every state renders statically. Colour
   * and border/shadow come from the injected @scope stylesheet (ours.css /
   * stock.css) matching these same element/class selectors; this file's own
   * style block is layout only (display/gap/sizing) and never sets a
   * GTK-controlled colour or border property, so the two never fight. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { cssVars, type Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, oursSource, stock, ourColor, stockColor, indexTheme, OURS_SCOPE } from './model';
  import { gtkCoverage } from './gtkcss';
  import { unusedKeys } from '../ini';

  type Model = Record<string, never>;
  const NONE: Model = {};

  const lanes = {
    stock: {
      which: 'stock' as const,
      label: 'Breeze-Dark gtk-3.0/gtk.css',
      style: cssVars({ 'desk-bg': stockColor('theme_bg_color'), 'desk-font': '"Noto Sans", sans-serif' }),
      model: NONE
    },
    ours: {
      which: 'ours' as const,
      label: 'SageInk gtk.css + gtk-dark.css',
      style: cssVars({ 'desk-bg': ourColor('theme_bg_color'), 'desk-font': '"Noto Sans", sans-serif' }),
      model: NONE
    }
  };

  /* Coverage merges the CSS selector inventory of the shipped Sage Ink files
   * (every GTK node/class the theme styles must have a rendered element) with
   * index.theme's own keys (an .ini file, so its own tracking mechanism —
   * .get() below marks each one used as the settings table renders it). */
  const coverage = () => {
    const css = gtkCoverage(oursSource, OURS_SCOPE, ours.dropped, [
      {
        token: 'frame',
        why: 'GTK\'s "frame" node name collides with the obsolete HTML <frame> element, which Svelte statically forbids outside a <frameset> parent (node_invalid_placement) — rendered here as <gtkframe class="card"> instead. The .card class token is still covered normally.'
      }
    ]);
    const iniMissing = unusedKeys(indexTheme);
    return { total: css.total + indexTheme.keys().length, missing: [...css.missing, ...iniMissing], ignored: css.ignored };
  };

  const indexRows: [string, string][] = [
    ['Desktop Entry', 'Type'],
    ['Desktop Entry', 'Name'],
    ['Desktop Entry', 'Comment'],
    ['Desktop Entry', 'Encoding'],
    ['X-GNOME-Metatheme', 'GtkTheme'],
    ['X-GNOME-Metatheme', 'MetacityTheme'],
    ['X-GNOME-Metatheme', 'IconTheme'],
    ['X-GNOME-Metatheme', 'CursorTheme'],
    ['X-GNOME-Metatheme', 'ButtonLayout']
  ];

  const files = ['Documents', 'Downloads', 'Music', 'Pictures', 'projects', 'notes.md'];
</script>

<!-- One @scope stylesheet per lane, matching every .lane-root[data-lane="..."]
     DPair renders on this page (see model.ts OURS_SCOPE/STOCK_SCOPE and
     DPair.svelte's own data-lane attribute — no extra class needed). -->
{@html `<style>${stock.css}</style>`}
{@html `<style>${ours.css}</style>`}

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="window" title="Application window" lead="Headerbar, sidebar, treeview list with selection, entries and buttons — the GTK3 file-manager shape gtk-dark.css targets by name" min="620px">
    <DPair name="active window" span="full" note="theme_selected_bg_color (Tier A: filled) on the row background; the on-select outline (Tier C) shows separately below.">
      {#snippet children()}
        <window class="background">
          <headerbar class="titlebar">
            <button class="image-button">◀</button>
            <label>Home — Files</label>
            <button class="suggested-action">Open</button>
          </headerbar>
          <box class="body">
            <placessidebar class="sidebar">
              <row data-selected>Home</row>
              <row>Documents</row>
              <row>Trash</row>
            </placessidebar>
            <box class="content">
              <toolbar>
                <entry>Filter files…</entry>
                <button class="circular">+</button>
              </toolbar>
              <list class="view">
                {#each files as f, i}
                  <row data-selected={i === 1 ? true : undefined} data-hover={i === 3 ? true : undefined}>{f}</row>
                {/each}
              </list>
            </box>
          </box>
          <box class="statusbar"><label>6 items</label></box>
        </window>
      {/snippet}
    </DPair>
    <DPair name="backdrop (unfocused window)" note="theme_unfocused_* colours — GTK's :backdrop pseudo-class, shown here as .backdrop per the brief's own example.">
      {#snippet children()}
        <window class="background backdrop">
          <headerbar class="titlebar"><label>Terminal</label></headerbar>
          <box class="content"><label>Window content under :backdrop</label></box>
        </window>
      {/snippet}
    </DPair>
  </Section>

  <Section id="controls" title="Controls" lead="Buttons (including suggested/destructive/circular/image), entries, checks, radios, switches, notebook tabs, scale, progressbar, spinbutton, combobox" min="420px">
    <DPair name="buttons">
      {#snippet children()}
        <box class="row">
          <button>Normal</button>
          <button data-hover>Hover</button>
          <button data-focus>Focus</button>
          <button data-active>Active</button>
          <button data-disabled>Disabled</button>
          <button class="suggested-action">Suggested</button>
          <button class="destructive-action">Delete</button>
          <button class="circular">+</button>
          <button class="image-button">🖉</button>
        </box>
      {/snippet}
    </DPair>
    <DPair name="entry, checks, radios, switches">
      {#snippet children()}
        <box class="row">
          <entry>Type here…</entry>
          <entry data-focus>Focused entry</entry>
          <checkbutton><check data-checked></check> Remember me</checkbutton>
          <checkbutton><check></check> Unchecked</checkbutton>
          <radiobutton><radio data-checked></radio> Option A</radiobutton>
          <radiobutton><radio></radio> Option B</radiobutton>
          <switch data-checked><slider></slider></switch>
          <switch><slider></slider></switch>
        </box>
      {/snippet}
    </DPair>
    <DPair name="notebook tabs">
      {#snippet children()}
        <notebook>
          <header><tab data-checked>General</tab><tab>Advanced</tab><tab data-hover>Plugins</tab></header>
          <stack><label>General tab content</label></stack>
        </notebook>
      {/snippet}
    </DPair>
    <DPair name="scale, progressbar, spinbutton, combobox">
      {#snippet children()}
        <box class="row">
          <scale><trough><highlight></highlight><slider></slider></trough></scale>
          <progressbar><trough><progress></progress></trough></progressbar>
          <spinbutton><entry>42</entry><button class="up">▲</button><button class="down">▼</button></spinbutton>
          <combobox><button>Fit page ▾</button></combobox>
        </box>
      {/snippet}
    </DPair>
    <DPair name="toolbar, paned, frame, card">
      {#snippet children()}
        <box class="row">
          <toolbar><button class="circular">B</button><button class="circular">I</button><separator></separator><button class="circular">🔗</button></toolbar>
          <paned><box>Left</box><separator></separator><box>Right</box></paned>
          <gtkframe>Plain frame</gtkframe>
          <gtkframe class="card">Card content</gtkframe>
        </box>
      {/snippet}
    </DPair>
  </Section>

  <Section id="menus" title="Menu, popover, tooltip" lead="menuitem/modelbutton rows, a context menu variant, a popover and a tooltip" min="360px">
    <DPair name="menu">
      {#snippet children()}
        <menu class="menu">
          <menuitem>New Tab</menuitem>
          <menuitem data-hover>Open Recent</menuitem>
          <modelbutton>Show hidden files</modelbutton>
          <menuitem data-disabled>Print</menuitem>
        </menu>
      {/snippet}
    </DPair>
    <DPair name="context menu">
      {#snippet children()}
        <menu class="context-menu">
          <menuitem>Cut</menuitem>
          <menuitem>Copy</menuitem>
          <menuitem data-hover>Paste</menuitem>
        </menu>
      {/snippet}
    </DPair>
    <DPair name="popover + tooltip">
      {#snippet children()}
        <box class="row">
          <popover><label>Popover content, anchored to a button</label></popover>
          <tooltip>Show hidden files <kbd>Alt+.</kbd></tooltip>
        </box>
      {/snippet}
    </DPair>
  </Section>

  <Section id="scroll-select" title="Scrollbars and selection" lead="scrollbar slider (normal + hover), and the selection pseudo-element in running text" min="320px">
    <DPair name="scrollbars">
      {#snippet children()}
        <box class="row">
          <scrollbar><slider></slider></scrollbar>
          <scrollbar><slider data-hover></slider></scrollbar>
        </box>
      {/snippet}
    </DPair>
    <DPair name="text selection">
      {#snippet children()}
        <label>Read <selection>this selected run of text</selection> in a GtkLabel.</label>
      {/snippet}
    </DPair>
    <DPair name="infobar" note="No dedicated infobar rule in gtk-dark.css — it inherits window/button colours rather than a warning tint. Disclosed gap, not fixed: adding one is a design decision (a warning-tinted infobar surface) outside a translator's scope.">
      {#snippet children()}
        <infobar><label>Update available</label><button>Details</button></infobar>
      {/snippet}
    </DPair>
  </Section>

  <Section id="dialogs" title="Dialogs and file chooser" lead="dialog/.dialog-vbox/messagedialog, and the GTK3 file-chooser's placessidebar/.view/pathbar" min="420px">
    <DPair name="message dialog">
      {#snippet children()}
        <dialog>
          <box class="dialog-vbox">
            <messagedialog>Delete “notes.md”? This cannot be undone.</messagedialog>
            <box class="row"><button>Cancel</button><button class="destructive-action">Delete</button></box>
          </box>
        </dialog>
      {/snippet}
    </DPair>
    <DPair name="file chooser" span="full">
      {#snippet children()}
        <filechooser>
          <placessidebar class="sidebar">
            <row data-selected>Home</row>
            <row>Documents</row>
          </placessidebar>
          <box class="content">
            <pathbar class="path-bar">
              <button>home</button>
              <button data-checked>projects</button>
            </pathbar>
            <treeview class="view">
              <header><button>Name</button><button>Size</button></header>
              <row data-selected>indigo-glass</row>
              <row>simulator</row>
            </treeview>
          </box>
        </filechooser>
      {/snippet}
    </DPair>
  </Section>

  <Section id="theme-file" title="index.theme" lead="GTK theme metadata (INI format) — the icon/cursor/button-layout choices GtkTheme=SageInk pulls in" min="360px">
    <DPair name="index.theme keys" span="full" note="Ours-only: this file has no stock equivalent (Breeze-Dark ships as an app theme, not a full desktop meta-theme).">
      {#snippet children()}
        <table class="ini">
          <tbody>
            {#each indexRows as [g, k]}
              <tr><th>[{g}] {k}</th><td>{indexTheme.get(g, k) ?? '—'}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  window { display: flex; flex-direction: column; width: 100%; min-width: 480px; }
  headerbar { display: flex; align-items: center; gap: 8px; padding: 4px 8px; }
  headerbar label { flex: 1; text-align: center; }
  box.body { display: flex; flex: 1; min-height: 220px; }
  placessidebar { display: flex; flex-direction: column; width: 140px; padding: 6px 0; gap: 1px; }
  placessidebar row { padding: 3px 10px; }
  box.content { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  toolbar { display: flex; align-items: center; gap: 6px; padding: 5px 8px; }
  list.view, treeview.view { display: flex; flex-direction: column; flex: 1; padding: 4px; gap: 1px; overflow: hidden; }
  list.view row, treeview.view row { padding: 3px 8px; }
  treeview.view header { display: flex; gap: 12px; padding: 3px 8px; }
  box.statusbar { padding: 3px 8px; }
  box.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; width: 100%; }
  checkbutton, radiobutton { display: inline-flex; align-items: center; gap: 6px; }
  check, radio { display: inline-block; width: 16px; height: 16px; }
  switch { display: inline-flex; align-items: center; width: 40px; height: 22px; padding: 2px; box-sizing: border-box; position: relative; }
  switch slider { width: 18px; height: 18px; }
  switch[data-checked] slider { margin-left: auto; }
  notebook { display: flex; flex-direction: column; width: 100%; min-width: 320px; }
  notebook > header { display: flex; }
  notebook tab { padding: 5px 14px; }
  notebook stack { padding: 12px; min-height: 60px; }
  scale { display: inline-flex; align-items: center; width: 160px; }
  scale trough { position: relative; width: 100%; height: 6px; }
  scale highlight { position: absolute; inset: 0 50% 0 0; }
  scale slider { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; }
  progressbar { display: inline-flex; width: 160px; }
  progressbar trough { width: 100%; height: 8px; }
  progressbar progress { width: 45%; height: 100%; }
  spinbutton { display: inline-flex; align-items: stretch; }
  spinbutton box, spinbutton entry { min-width: 60px; }
  spinbutton button { padding: 0 6px; font-size: 8px; }
  combobox { display: inline-flex; }
  toolbar separator, paned separator { width: 2px; align-self: stretch; margin: 0 4px; }
  paned { display: flex; width: 220px; }
  paned box { flex: 1; padding: 8px; }
  gtkframe { display: block; padding: 10px 14px; min-width: 140px; }
  menu { display: flex; flex-direction: column; min-width: 180px; padding: 4px 0; }
  menu menuitem, menu modelbutton { padding: 4px 14px; }
  popover { display: inline-block; padding: 10px 14px; min-width: 180px; }
  tooltip { display: inline-flex; align-items: center; gap: 8px; padding: 4px 8px; }
  scrollbar { display: inline-flex; width: 10px; height: 80px; align-items: flex-start; justify-content: center; padding: 2px; box-sizing: border-box; }
  scrollbar slider { width: 100%; height: 30%; }
  infobar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; width: 100%; }
  dialog { display: block; min-width: 320px; }
  .dialog-vbox { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
  messagedialog { display: block; }
  filechooser { display: flex; width: 100%; min-height: 220px; }
  filechooser .content { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  pathbar.path-bar { display: flex; gap: 2px; padding: 4px 8px; }
  entry { display: inline-block; padding: 3px 8px; min-width: 90px; }
  button { font: inherit; padding: 3px 10px; }
  label { display: inline; }
  selection { display: inline; }
  table.ini { width: 100%; border-collapse: collapse; }
  table.ini th, table.ini td { text-align: left; padding: 3px 10px; font-family: "Iosevka Custom Condensed", monospace; font-size: 9.5pt; }
  table.ini th { color: var(--ig-text-muted); font-weight: 400; white-space: nowrap; }
</style>
