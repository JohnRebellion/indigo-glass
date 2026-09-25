<script lang="ts">
  /* YouTube, drawn in its own custom elements and class names (the ones the
     /sites/youtube/ mock and youtube.user.css select on). Every colour comes
     from the lane stylesheets. The layer's `wrap` puts this inside <ytd-app>.
     data-sim-focus / data-sim-hover mark the one focused / hovered copy
     (layers/_sites/css.ts). */
  import type { ComponentId } from '../../catalogue';
  import { probeComputed } from '../_sites/pseudo';
  let { component }: { component: ComponentId; lane: 'stock' | 'ours' } = $props();
</script>

{#if component === 'button'}
  <yt-button-shape><button type="button" data-probe="fill label edge">Share</button></yt-button-shape>
  <yt-button-shape><button type="button" data-sim-focus data-probe="focus">Focused</button></yt-button-shape>
  <yt-button-shape><button type="button" class="filled yt-spec-button-shape-next yt-spec-button-shape-next--filled" data-probe="primary-fill primary-label">Subscribe</button></yt-button-shape>
{:else if component === 'menu'}
  <tp-yt-iron-dropdown data-probe="fill edge">
    <tp-yt-paper-listbox role="menu">
      <ytd-menu-service-item-renderer role="menuitem" data-probe="label">Save to playlist</ytd-menu-service-item-renderer>
      <ytd-menu-service-item-renderer role="menuitem" data-sim-hover data-probe="selected-fill selected-edge selected-label">Share</ytd-menu-service-item-renderer>
      <ytd-menu-service-item-renderer role="menuitem">Not interested</ytd-menu-service-item-renderer>
    </tp-yt-paper-listbox>
  </tp-yt-iron-dropdown>
{:else if component === 'tooltip'}
  <tp-yt-paper-tooltip><div id="tooltip" role="tooltip" data-probe="fill label edge">Settings</div></tp-yt-paper-tooltip>
{:else if component === 'text-field'}
  <div class="col">
    <div class="ytSearchboxComponentInputBox" data-probe="fill edge"><input placeholder="Search"
      use:probeComputed={{ slot: 'placeholder', prop: 'color', pseudo: '::placeholder' }} /></div>
    <div class="ytSearchboxComponentInputBox"><input value="sage ink kde" data-probe="text" /></div>
    <div class="ytSearchboxComponentInputBox" data-probe="focus"><input value="sage ink kde" data-sim-focus /></div>
  </div>
{:else if component === 'list-selection'}
  <ytd-guide-renderer data-probe="fill">
    <ytd-guide-entry-renderer active data-probe="selected-fill selected-edge"><a id="endpoint" href="#top" data-probe="selected-label"><span class="guide-icon"></span>Home</a></ytd-guide-entry-renderer>
    <ytd-guide-entry-renderer><a id="endpoint" href="#top" data-probe="label"><span class="guide-icon"></span>Shorts</a></ytd-guide-entry-renderer>
    <ytd-guide-entry-renderer><a id="endpoint" href="#top"><span class="guide-icon"></span>Subscriptions</a></ytd-guide-entry-renderer>
  </ytd-guide-renderer>
{:else if component === 'tab'}
  <ytd-feed-filter-chip-bar-renderer data-probe="fill">
    <yt-chip-cloud-chip-renderer><span class="ytChipShapeChip ytChipShapeActive" data-probe="active-fill active-label active-marker">All</span></yt-chip-cloud-chip-renderer>
    <yt-chip-cloud-chip-renderer><span class="ytChipShapeChip ytChipShapeInactive" data-probe="inactive-label">Music</span></yt-chip-cloud-chip-renderer>
    <yt-chip-cloud-chip-renderer><span class="ytChipShapeChip ytChipShapeInactive">Live</span></yt-chip-cloud-chip-renderer>
  </ytd-feed-filter-chip-bar-renderer>
{/if}

<style>
  .col { display: flex; flex-direction: column; gap: 10px; align-items: stretch; min-width: 320px; }
</style>
