<script lang="ts">
  /* PlasmaComponents 3 controls cut from the lane's Plasma theme SVGs
   * (paint.ts), inside a plasmoid popup (dialogs/background). SVG paint is
   * not CSS the browser can report, so frame slots carry the model's value
   * (slot:=#HEX); labels are CSS text in the colors-file roles and are read
   * back painted. No colour literal lives in this file. */
  import type { ComponentId } from '../../catalogue';
  import type { LaneName } from '../../layer';
  import PFrame from './PFrame.svelte';
  import { laneFrames } from './paint';

  let { component, lane }: { component: ComponentId; lane: LaneName } = $props();
  const L = $derived(laneFrames(lane));
  const F = $derived(L.frames);
  const H = $derived(L.hex);
</script>

<div class="desk">
  {#if component === 'tooltip'}
    <PFrame frame={F.tooltip} probe="fill:={H.tipFill} edge:={H.tipEdge}" style="display:inline-block">
      <span class="tip" data-probe="label">Show hidden files</span>
    </PFrame>
  {:else if component === 'menu'}
    <PFrame frame={F.menu} probe="fill:={H.menuFill} edge:={H.menuEdge}" style="width:190px">
      <div class="mi"><span class="win" data-probe="label">New Tab</span></div>
      <PFrame frame={F.menuHover} probe="selected-fill:={H.menuSelFill} selected-edge:={H.menuSelEdge}">
        <span class="win" data-probe="selected-label">Split View</span>
      </PFrame>
      <div class="mi"><span class="win">Close Tab</span></div>
    </PFrame>
  {:else}
    <PFrame frame={F.popup} style="width:260px">
      {#if component === 'button'}
        <div class="row">
          <PFrame frame={F.button} probe="fill:={H.buttonFill} edge:={H.buttonEdge}">
            <span class="btn" data-probe="label">Apply</span>
          </PFrame>
          <div class="stack">
            <PFrame frame={F.button}><span class="btn">Focused</span></PFrame>
            <PFrame frame={F.buttonFocus} bare probe="focus:={H.buttonFocus}" style="position:absolute;inset:0" />
          </div>
        </div>
      {:else if component === 'text-field'}
        <div class="col">
          <PFrame frame={F.line} probe="fill:={H.lineFill} edge:={H.lineEdge}">
            <span class="ph" data-probe="placeholder">Search…</span>
          </PFrame>
          <PFrame frame={F.line}><span class="view" data-probe="text">sage-ink.png</span></PFrame>
          <div class="stack">
            <PFrame frame={F.line}><span class="view">rename|</span></PFrame>
            <PFrame frame={F.lineFocus} bare probe="focus:={H.lineFocus}" style="position:absolute;inset:0" />
          </div>
        </div>
      {:else if component === 'list-selection'}
        <div class="col tight" data-probe="fill:={H.popupFill}">
          <div class="vrow"><span class="win" data-probe="label">Documents</span></div>
          <PFrame frame={F.selected} probe="selected-fill:={H.rowSelFill} selected-edge:={H.rowSelEdge}">
            <span class="win" data-probe="selected-label">Pictures</span>
          </PFrame>
          <div class="vrow"><span class="win">Music</span></div>
        </div>
      {:else if component === 'scrollbar'}
        <div class="sarea">
          <PFrame frame={F.track} bare probe="track:={H.track}" style="width:{L.scrollSize}px;height:120px">
            <PFrame frame={F.slider} bare probe="thumb:={H.thumb}" style="position:absolute;left:0;right:0;top:22px;height:44px" />
          </PFrame>
        </div>
      {:else if component === 'checkbox'}
        <div class="col" data-probe="surface:={H.popupFill}">
          <div class="cb">
            <PFrame frame={F.box} bare probe="box-fill:={H.boxFill} box-edge:={H.boxEdge}" style="width:16px;height:16px" />
            <span class="win" data-probe="label">Show thumbnails</span>
          </div>
          <div class="cb">
            <PFrame frame={F.box} bare style="width:16px;height:16px">
              {#if F.check}
                <span class="mark" data-probe="checked-fill:={H.checkedFill} mark:={H.mark}" style="background-image:url('{F.check.uri}')"></span>
              {/if}
            </PFrame>
            <span class="win">Remember</span>
          </div>
        </div>
      {:else if component === 'tab'}
        <div class="tabbar" data-probe="fill:={H.popupFill}">
          <PFrame frame={F.tab} probe="active-fill:={H.tabFill} active-marker:={H.tabMarker}">
            <span class="win tab" data-probe="active-label">General</span>
          </PFrame>
          <div class="tabpad"><span class="win tab" data-probe="inactive-label">Advanced</span></div>
        </div>
      {/if}
    </PFrame>
  {/if}
</div>

<style>
  .desk { padding: 14px; background: var(--desk-bg); font-family: var(--pt-font); font-size: 13px; }
  .row { display: flex; gap: 8px; align-items: flex-start; }
  .col { display: flex; flex-direction: column; gap: 8px; }
  .col.tight { gap: 2px; }
  .stack { position: relative; }
  .btn { color: var(--pt-button-fg); padding: 0 8px; white-space: nowrap; }
  .win { color: var(--pt-window-fg); }
  .view { color: var(--pt-view-fg); }
  .ph { color: var(--pt-view-inactive); }
  .tip { color: var(--pt-tooltip-fg); white-space: nowrap; }
  .mi, .vrow { padding: 4px 8px; }
  .sarea { display: flex; justify-content: flex-end; height: 120px; }
  .cb { display: flex; gap: 8px; align-items: center; }
  .mark { position: absolute; inset: 0; background-size: 100% 100%; background-repeat: no-repeat; }
  .tabbar { display: flex; align-items: stretch; }
  .tab { display: inline-block; padding: 2px 10px; }
  .tabpad { padding: 4px 0; }
</style>
