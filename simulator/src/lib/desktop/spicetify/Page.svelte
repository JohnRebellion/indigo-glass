<script lang="ts">
  /* Spicetify (Spotify desktop): sidebar/library, main-view cards/shelf,
   * playlist track list, now-playing bar, context menu, search input,
   * buttons. Same hybrid pattern as ../vencord/Page.svelte: real user.css
   * scoped into the DOM per lane (scopePlainCss, reused read-only from
   * ../obsidian/cssTheme), plus color.ini's own real `--spice-*` variable
   * convention driving the specimens user.css never touches (sidebar chrome,
   * now-playing background, the search input). StructureCheck is the same
   * generic scanner every /desktop/ app surface reuses. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import StructureCheck from '../obsidian/StructureCheck.svelte';
  import { scopePlainCss } from '../obsidian/cssTheme';
  import { meta, roles, contrast } from './index';
  import { ours, stock, stockCss, shippedCss, laneVars, coverage } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'Reconstructed Spotify default', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'spicetify/Themes/indigo-glass', style: laneVars(ours), model: ours }
  };

  const stockScopedStock = scopePlainCss(stockCss, '[data-lane="stock"]');
  const oursScopedStock = scopePlainCss(stockCss, '[data-lane="ours"]');
  const oursScopedShipped = scopePlainCss(shippedCss, '[data-lane="ours"]');
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="sidebar-library" title="Sidebar + library" lead="Nav bar background, library row list" min="380px">
    <DPair name="sidebar + library" span="full">
      {#snippet children()}
        <div class="sp-shell">
          <div class="Root__nav-bar main-yourLibraryX-libraryRootlist">
            <div class="main-yourLibraryX-listItem"><div class="main-yourLibraryX-rowItem">Liked Songs</div></div>
            <div class="main-yourLibraryX-listItem"><div class="main-yourLibraryX-rowItem">Sage Ink Radio</div></div>
            <div class="main-yourLibraryX-listItem"><div class="main-yourLibraryX-rowItem">Discover Weekly</div></div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="cards" title="Main view cards / shelf" lead="Album/playlist tiles, one hovered" min="360px">
    <DPair name="card shelf" span="full">
      {#snippet children()}
        <div class="sp-shell sp-pad" style="display:flex; gap:12px;">
          <div class="main-card-card">Sage Ink Radio</div>
          <div class="main-card-card sp-hover">Discover Weekly</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="tracklist" title="Playlist track list" lead="Track rows, one hovered, one selected, one currently playing" min="380px">
    <DPair name="track list" span="full">
      {#snippet children()}
        <div class="sp-shell sp-pad" style="display:flex; flex-direction:column; gap:2px;">
          <div class="main-trackList-trackListRow">
            <div class="main-trackList-rowMainContent"><span class="standalone-ellipsis-one-line">Ink (Reprise)</span></div>
          </div>
          <div class="main-trackList-trackListRow sp-hover">
            <div class="main-trackList-rowMainContent"><span class="standalone-ellipsis-one-line">Opaque Flat</span></div>
          </div>
          <div class="main-trackList-trackListRow main-trackList-selected" aria-selected="true">
            <div class="main-trackList-rowMainContent"><span class="standalone-ellipsis-one-line" data-text-color="brightAccent">Now Playing (selected)</span></div>
          </div>
          <div class="main-trackList-trackListRow playing">
            <div class="main-trackList-rowMainContent"><span data-encore-id="text">Hard Offset Shadow</span></div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="now-playing" title="Now-playing bar" lead="Playback bar with a seek/progress track" min="320px">
    <DPair name="now-playing bar" span="full">
      {#snippet children()}
        <div class="sp-shell">
          <div class="Root__now-playing-bar main-nowPlayingBar-nowPlayingBar" style="width:100%;">
            <span>Ink (Reprise) — Sage</span>
            <div class="progress-bar__bg x-progressBar-bg" style="flex:1; position:relative;">
              <div class="progress-bar__fg x-progressBar-fillForeground" style="width:40%;"></div>
            </div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="context-menu" title="Context menu" lead="Right-click menu, including the ad-hide target" min="280px">
    <DPair name="context menu">
      {#snippet children()}
        <div class="sp-shell sp-pad">
          <div class="main-contextMenu-menu">
            <div class="main-contextMenu-menuItemButton">Add to playlist</div>
            <div class="main-contextMenu-menuItemButton">Go to artist</div>
            <div class="main-contextMenu-menuItemButton" data-tooltip="Upgrade to Premium">Upgrade (hidden)</div>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="search input" note="No confirmed real Spotify selector this pass (see index.ts fidelityWhy) - driven by color.ini's own --spice-* vars via a plain input[type=search].">
      {#snippet children()}
        <div class="sp-shell sp-pad">
          <input type="search" placeholder="What do you want to play?" />
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="buttons" title="Buttons" lead="Primary play button, secondary/small variants" min="280px">
    <DPair name="buttons" span="full">
      {#snippet children()}
        <div class="sp-shell sp-pad" style="display:flex; gap:10px; align-items:center;">
          <button type="button" class="main-buttons-button">Play</button>
          <button type="button" class="Button-md-encore-light">Follow</button>
          <button type="button" class="Button-sm-encore-light">Shuffle</button>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <StructureCheck />
</DesktopPage>

{@html `<style data-stock="spicetify">${stockScopedStock}</style>`}
{@html `<style data-ours-stock="spicetify">${oursScopedStock}</style>`}
{@html `<style data-ours-shipped="spicetify">${oursScopedShipped}</style>`}

<style>
  .sp-shell { width: 100%; font-size: 13px; background: var(--spice-main); color: var(--spice-text); }
  .sp-pad { padding: 10px; }
  .Root__nav-bar.main-yourLibraryX-libraryRootlist { background: var(--spice-sidebar); }
  .main-yourLibraryX-rowItem { cursor: default; }
  .main-card-card { cursor: default; width: 140px; }
  .main-trackList-trackListRow { cursor: default; }
  .Root__now-playing-bar.main-nowPlayingBar-nowPlayingBar { background: var(--spice-player); display: flex; align-items: center; gap: 16px; padding: 8px 16px; }
  .main-contextMenu-menu { width: 200px; }
  .main-contextMenu-menuItemButton { cursor: default; }
  input[type='search'] {
    background: var(--spice-card);
    color: var(--spice-text);
    border: 2px solid var(--spice-misc);
    border-radius: 9999px;
    padding: 6px 14px;
    font: inherit;
    width: 220px;
  }
  input[type='search']::placeholder { color: var(--spice-subtext); }
  button.main-buttons-button, .Button-md-encore-light, .Button-sm-encore-light { font: inherit; cursor: default; }
  /* Hover-state specimens (:hover can't be forced on a static screenshot) -
     .sp-hover mirrors the shipped/stock :hover rule's own declarations so the
     "one hovered" row in each pair is visible without a live cursor. */
  :global([data-lane='ours'] .main-card-card.sp-hover) { background-color: #121216 !important; border-color: #A6C9A6 !important; }
  :global([data-lane='stock'] .main-card-card.sp-hover) { background-color: #282828; } /* drift-allow: Spotify's own reconstructed stock hover shade (fixtures/stock/spicetify/stock.css), not a Sage Ink value */
  :global([data-lane='ours'] .main-trackList-trackListRow.sp-hover) { background-color: rgba(166, 201, 166, 0.10) !important; }
  :global([data-lane='stock'] .main-trackList-trackListRow.sp-hover) { background-color: rgba(255,255,255,0.1); }
</style>
