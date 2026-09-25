<script lang="ts">
  /* GTK user CSS: two @scope pairs share this page (GTK4/libadwaita primary,
   * GTK3 layering compact), each under its own ".gtk4-demo"/".gtk3-demo"
   * marker so their stylesheets never cross-match despite sharing one
   * [data-lane] value. See model.ts header for the exact scope selectors and
   * the load-order reasoning ("ours" = stock/theme concatenated with the
   * user override, the real cascade — not the override shown alone). */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { cssVars } from '../surface';
  import { meta, roles, contrast } from './index';
  import {
    oursG4, stockG4, oursG3, stockG3,
    userGtk3Css, userGtk4Css,
    ourG4Color, stockG4Color, ourG3Color,
    settings3, settings4, gtkSh,
    OURS_SCOPE_G4, OURS_SCOPE_G3
  } from './model';
  import { gtkCoverage } from '../gtk3-theme/gtkcss';
  import { unusedKeys } from '../ini';

  type Model = Record<string, never>;
  const NONE: Model = {};

  const lanes = {
    stock: {
      which: 'stock' as const,
      label: 'libadwaita 1.9.3 dark + Breeze-Dark',
      style: cssVars({ 'desk-bg': stockG4Color('window_bg_color'), 'desk-font': '"Cantarell", sans-serif' }),
      model: NONE
    },
    ours: {
      which: 'ours' as const,
      label: 'gtk-4.0/gtk.css + gtk-3.0/gtk.css, layered on their themes',
      style: cssVars({ 'desk-bg': ourG4Color('window_bg_color'), 'desk-font': 'Carlito, sans-serif' }),
      model: NONE
    }
  };

  const coverage = () => {
    const g4 = gtkCoverage(userGtk4Css, OURS_SCOPE_G4, oursG4.dropped);
    const g3 = gtkCoverage(userGtk3Css, OURS_SCOPE_G3, oursG3.dropped);
    const iniMissing = [...unusedKeys(settings3), ...unusedKeys(settings4)];
    return {
      total: g4.total + g3.total + settings3.keys().length + settings4.keys().length,
      missing: [...g4.missing, ...g3.missing, ...iniMissing],
      ignored: [...(g4.ignored ?? []), ...(g3.ignored ?? [])]
    };
  };

  const settingsRows: [string, 'gtk-3.0' | 'gtk-4.0', string, string][] = [
    ['gtk-application-prefer-dark-theme', 'gtk-3.0', 'Settings', 'Dark variant on load'],
    ['gtk-button-images', 'gtk-3.0', 'Settings', 'Icon on buttons that request one — not simulated'],
    ['gtk-cursor-blink', 'gtk-3.0', 'Settings', 'Text-cursor blink — not visible in a static specimen'],
    ['gtk-cursor-blink-time', 'gtk-3.0', 'Settings', 'Not visible in a static specimen'],
    ['gtk-cursor-theme-name', 'gtk-3.0', 'Settings', 'Cursor set — not simulated (no live cursor)'],
    ['gtk-cursor-theme-size', 'gtk-3.0', 'Settings', 'Cursor pixel size — not simulated'],
    ['gtk-decoration-layout', 'gtk-3.0', 'Settings', 'CSD button order'],
    ['gtk-enable-animations', 'gtk-3.0', 'Settings', 'Transitions — not visible in a static specimen'],
    ['gtk-font-name', 'gtk-3.0', 'Settings', 'Default font, applied below'],
    ['gtk-icon-theme-name', 'gtk-3.0', 'Settings', 'Icon set — icons are not part of this surface'],
    ['gtk-menu-images', 'gtk-3.0', 'Settings', 'Icon in menu items — not simulated'],
    ['gtk-modules', 'gtk-3.0', 'Settings', 'Loads colorreload/window-decorations/appmenu GTK modules — no paint of its own'],
    ['gtk-primary-button-warps-slider', 'gtk-3.0', 'Settings', 'Click-to-position on scale — behaviour, not paint'],
    ['gtk-shell-shows-menubar', 'gtk-3.0', 'Settings', 'Global menu via appmenu-gtk-module — not simulated'],
    ['gtk-sound-theme-name', 'gtk-3.0', 'Settings', 'Event sounds — not visual'],
    ['gtk-theme-name', 'gtk-3.0', 'Settings', 'GTK3 app theme (SageInk)'],
    ['gtk-toolbar-style', 'gtk-3.0', 'Settings', 'Icon+label vs icon-only'],
    ['gtk-xft-dpi', 'gtk-3.0', 'Settings', 'Font DPI scaling — the Host selector above covers this role instead'],
    ['gtk-application-prefer-dark-theme', 'gtk-4.0', 'Settings', 'Dark variant on load'],
    ['gtk-cursor-blink', 'gtk-4.0', 'Settings', 'Text-cursor blink — not visible in a static specimen'],
    ['gtk-cursor-blink-time', 'gtk-4.0', 'Settings', 'Not visible in a static specimen'],
    ['gtk-cursor-theme-name', 'gtk-4.0', 'Settings', 'Cursor set — not simulated (no live cursor)'],
    ['gtk-cursor-theme-size', 'gtk-4.0', 'Settings', 'Cursor pixel size — not simulated'],
    ['gtk-decoration-layout', 'gtk-4.0', 'Settings', 'CSD button order'],
    ['gtk-enable-animations', 'gtk-4.0', 'Settings', 'Transitions — not visible in a static specimen'],
    ['gtk-font-name', 'gtk-4.0', 'Settings', 'Default font, applied below'],
    ['gtk-icon-theme-name', 'gtk-4.0', 'Settings', 'Icon set — icons are not part of this surface'],
    ['gtk-primary-button-warps-slider', 'gtk-4.0', 'Settings', 'Click-to-position on scale — behaviour, not paint'],
    ['gtk-sound-theme-name', 'gtk-4.0', 'Settings', 'Event sounds — not visual'],
    ['gtk-theme-name', 'gtk-4.0', 'Settings', 'No effect — libadwaita apps ignore this key entirely'],
    ['gtk-xft-dpi', 'gtk-4.0', 'Settings', 'Font DPI scaling — the Host selector above covers this role instead']
  ];
  const docFor = (f: 'gtk-3.0' | 'gtk-4.0') => (f === 'gtk-3.0' ? settings3 : settings4);
</script>

{@html `<style>${stockG4.css}</style>`}
{@html `<style>${oursG4.css}</style>`}
{@html `<style>${stockG3.css}</style>`}
{@html `<style>${oursG3.css}</style>`}

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="gtk4" title="GTK4 / libadwaita" lead="AdwHeaderBar, boxed-list rows, an action row, switches, suggested/destructive pills, an entry, a card, a popover menu, a menubar, tabs, scrollbar, tooltip — all at gtk-font-name" min="620px">
    <DPair name="application window" span="full" note="theme_selected_bg_color is Tier A (Wi-Fi/Bluetooth rows are plain boxed-list rows, not selected); the bottom action row shows Tier C's on-select outline instead of a fill.">
      {#snippet children()}
        <div class="gtk4-demo ad-window">
          <div class="ad-headerbar">
            <button class="flat circular">☰</button>
            <span class="ad-title">Settings</span>
            <button class="suggested-action">Done</button>
          </div>
          <div class="ad-split">
            <div class="ad-sidebar">
              <div class="ad-navrow" data-selected>Network</div>
              <div class="ad-navrow">Bluetooth</div>
              <div class="ad-navrow">Displays</div>
            </div>
            <div class="ad-content">
              <div class="ad-boxedlist">
                <row>Wi-Fi <switch data-checked><slider></slider></switch></row>
                <row>Bluetooth <switch><slider></slider></switch></row>
                <row data-selected>Airplane Mode <span class="ad-outline-note">(Tier C outline)</span></row>
              </div>
              <card>
                Card surface, colour-as-elevation (hard offset shadow, no blur)
                <button class="destructive-action">Forget Network</button>
              </card>
              <entry>Search settings…</entry>
              <menu>File Edit View Help</menu>
            </div>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="checks, radios, tabs, scrollbar, tooltip">
      {#snippet children()}
        <div class="gtk4-demo ad-row">
          <checkbutton><check data-checked></check> Auto-connect</checkbutton>
          <radiobutton><radio data-checked></radio> WPA3</radiobutton>
          <tabbox><tabbutton>Details</tabbutton><tab data-checked>Security</tab></tabbox>
          <scrollbar><slider></slider></scrollbar>
          <tooltip>Forget this network</tooltip>
        </div>
      {/snippet}
    </DPair>
    <DPair name="popover menu">
      {#snippet children()}
        <div class="gtk4-demo">
          <popover class="menu"><contents>
            <menuitem>Cut</menuitem>
            <menuitem data-hover>Copy</menuitem>
            <menuitem>Paste</menuitem>
          </contents></popover>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="gtk3-layer" title="GTK3 layering" lead="Compact: gtk-3.0/gtk.css re-tints accent_color/link_color AFTER SageInk's own gtk-dark.css applies — the full GTK3 theme specimen catalogue lives on /desktop/gtk3-theme/." min="360px">
    <DPair name="accent-tinted button, link, selection" note="Stock here is Breeze-Dark alone (a stock desktop never has this override file); ours is SageInk gtk-dark.css + gtk-3.0/gtk.css concatenated, the real cascade.">
      {#snippet children()}
        <div class="gtk3-demo ad-row">
          <button class="suggested-action">Suggested</button>
          <label>Visit <a class="ad-link" href="#l">this link</a></label>
          <list><row data-selected>Selected row</row></list>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="settings.ini" lead="Keys from both files, with the effect each one actually has (or doesn't) in this comparison" min="480px">
    <DPair name="gtk-3.0 / gtk-4.0 settings.ini" span="full">
      {#snippet children()}
        <table class="ini">
          <thead><tr><th>File</th><th>Key</th><th>Value</th><th>Effect here</th></tr></thead>
          <tbody>
            {#each settingsRows as [key, file, group, effect]}
              <tr><td>{file}</td><th>{key}</th><td>{docFor(file).get(group, key) ?? '—'}</td><td>{effect}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="gtk-font-name, applied" note="Both settings.ini files agree on Carlito 11 — the font every specimen above already renders in.">
      {#snippet children()}
        <p style="font-family: Carlito, sans-serif; font-size: 11pt;">The quick brown fox jumps over the lazy dog 0O1lI — Carlito 11</p>
      {/snippet}
    </DPair>
    <DPair name="plasma-workspace/env/gtk.sh" span="full" note="Sets GTK_THEME so kde-gtk-config's own choice can't silently override it at session start.">
      {#snippet children()}
        <pre class="sh">{gtkSh}</pre>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .ad-window { display: flex; flex-direction: column; width: 100%; min-width: 520px; }
  .ad-headerbar { display: flex; align-items: center; gap: 10px; padding: 6px 10px; background: var(--gtk-headerbar_bg_color); color: var(--gtk-headerbar_fg_color); border-bottom: 1px solid var(--gtk-headerbar_border_color); }
  .ad-title { flex: 1; text-align: center; font-weight: 600; }
  .ad-split { display: flex; min-height: 240px; }
  .ad-sidebar { width: 160px; padding: 8px 0; background: var(--gtk-sidebar_bg_color); color: var(--gtk-sidebar_fg_color); }
  .ad-navrow { padding: 5px 12px; margin: 1px 6px; }
  .ad-content { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 12px; background: var(--gtk-view_bg_color); color: var(--gtk-view_fg_color); }
  .ad-boxedlist { display: flex; flex-direction: column; }
  .ad-boxedlist row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; }
  .ad-outline-note { font-size: 8.5pt; opacity: 0.7; }
  card { display: block; padding: 12px; }
  entry { display: block; padding: 5px 10px; }
  menu { display: block; padding: 4px 10px; }
  .ad-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; width: 100%; }
  checkbutton, radiobutton { display: inline-flex; align-items: center; gap: 6px; }
  check, radio { display: inline-block; width: 16px; height: 16px; }
  switch { display: inline-flex; align-items: center; width: 40px; height: 22px; padding: 2px; box-sizing: border-box; }
  switch[data-checked] slider { margin-left: auto; }
  switch slider { width: 18px; height: 18px; }
  tabbox { display: inline-flex; }
  tabbutton, tab { padding: 5px 12px; }
  scrollbar { display: inline-flex; width: 10px; height: 60px; align-items: flex-start; justify-content: center; padding: 2px; box-sizing: border-box; }
  scrollbar slider { width: 100%; height: 30%; }
  tooltip { display: inline-flex; padding: 4px 8px; }
  popover { display: inline-block; padding: 0; min-width: 160px; }
  contents { display: flex; flex-direction: column; padding: 4px 0; }
  menuitem { padding: 4px 14px; }
  button { font: inherit; padding: 4px 10px; }
  .ad-link { color: var(--gtk-link_color); }
  table.ini { width: 100%; border-collapse: collapse; }
  table.ini th, table.ini td { text-align: left; padding: 3px 10px; font-family: "Iosevka Custom Condensed", monospace; font-size: 9pt; }
  table.ini th { color: var(--ig-text-muted); font-weight: 400; white-space: nowrap; }
  pre.sh { width: 100%; margin: 0; padding: 10px; font-family: "Iosevka Custom Condensed", monospace; font-size: 9pt; white-space: pre-wrap; }
</style>
