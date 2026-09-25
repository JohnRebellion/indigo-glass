<script lang="ts">
  /* Qt widgets as Breeze/Klassy paint them. Every colour is a lane variable
     computed in qt.ts; this file carries none of its own. */
  import type { ComponentId } from '../../catalogue';
  let { component }: { component: ComponentId; lane: 'stock' | 'ours' } = $props();
</script>

{#if component === 'button'}
  <div class="row">
    <span class="btn" data-probe="fill label edge">Apply</span>
    <span class="btn focus" data-probe="focus:border">Focused</span>
    <span class="btn default" data-probe="primary-fill primary-label">OK</span>
  </div>
{:else if component === 'menu'}
  <div class="menu" data-probe="fill edge">
    <div class="mi" data-probe="label">New Tab</div>
    <div class="mi sel" data-probe="selected-fill selected-edge:outline selected-label">Split View</div>
    <div class="mi">Close Tab</div>
  </div>
{:else if component === 'tooltip'}
  <div class="tip" data-probe="fill label edge">Show hidden files</div>
{:else if component === 'text-field'}
  <div class="col">
    <div class="edit" data-probe="fill edge"><span data-probe="placeholder">Search…</span></div>
    <div class="edit" data-probe="text">sage-ink.png</div>
    <div class="edit focus" data-probe="focus:border">rename|</div>
  </div>
{:else if component === 'list-selection'}
  <div class="view" data-probe="fill">
    <div class="vrow" data-probe="label">Documents</div>
    <div class="vrow sel" data-probe="selected-fill selected-edge:outline selected-label">Pictures</div>
    <div class="vrow">Music</div>
  </div>
{:else if component === 'scrollbar'}
  <div class="sarea">
    <div class="groove" data-probe="track"><div class="handle" data-probe="thumb"></div></div>
  </div>
{:else if component === 'checkbox'}
  <div class="col" data-probe="surface">
    <div class="cb"><span class="box" data-probe="box-fill box-edge"></span><span data-probe="label">Show thumbnails</span></div>
    <div class="cb"><span class="box on" data-probe="checked-fill">
      <svg viewBox="0 0 14 14" width="14" height="14"><path d="M3 7.5l2.8 2.8L11 4.5" data-probe="mark:stroke" /></svg>
    </span><span>Remember</span></div>
  </div>
{:else if component === 'tab'}
  <div class="tabbar" data-probe="fill">
    <div class="tab on" data-probe="active-fill active-label"><span class="marker" data-probe="active-marker:bg"></span>General</div>
    <div class="tab" data-probe="inactive-label">Advanced</div>
  </div>
{/if}

<style>
  .row, .col { display: flex; gap: 10px; align-items: flex-start; color: var(--q-window-text); }
  .col { flex-direction: column; }
  .btn {
    background: var(--q-button); color: var(--q-button-text);
    border: var(--q-pen) solid var(--q-button-pen); border-radius: 3px; padding: 4px 14px;
  }
  .btn.focus { border-color: var(--q-button-focus-pen); }
  .btn.default { background: var(--q-default-fill); border-color: var(--q-default-pen); }

  .menu { background: var(--q-menu-fill); color: var(--q-window-text); border: var(--q-menu-pen) solid var(--q-menu-edge); padding: 4px 0; min-width: 170px; }
  .mi { padding: 3px 14px; margin: 0 4px; }
  .mi.sel { background: var(--q-menu-sel-fill); outline: var(--q-menu-sel-pen) solid var(--q-menu-sel-edge); outline-offset: calc(-1 * var(--q-menu-sel-pen)); }

  .tip { background: var(--q-tip-fill); color: var(--q-tip-text); border: var(--q-tip-pen) solid var(--q-tip-edge); padding: 4px 8px; }

  .edit { min-width: 200px; background: var(--q-base); color: var(--q-text); border: var(--q-pen) solid var(--q-edit-edge); border-radius: 3px; padding: 4px 8px; }
  .edit span { color: var(--q-placeholder); }
  .edit.focus { border-color: var(--q-edit-focus); }

  .view { min-width: 200px; background: var(--q-base); color: var(--q-text); padding: 2px; }
  .vrow { padding: 3px 10px; margin: 2px; }
  .vrow.sel { background: var(--q-row-sel-fill); color: var(--q-row-sel-text); outline: var(--q-row-pen) solid var(--q-row-sel-edge); outline-offset: calc(-1 * var(--q-row-pen)); }

  .sarea { height: 120px; width: 40px; background: var(--q-window); display: flex; justify-content: center; padding: 2px 0; }
  .groove { width: 8px; height: 100%; border-radius: 4px; background: var(--q-groove-fill); border: var(--q-pen) solid var(--q-groove-pen); position: relative; }
  .handle { position: absolute; left: -1px; right: -1px; top: 20%; height: 35%; border-radius: 4px; background: var(--q-handle-fill); border: var(--q-pen) solid var(--q-handle-pen); }

  .cb { display: flex; gap: 6px; align-items: center; }
  .box { width: 14px; height: 14px; border-radius: 2px; background: var(--q-button); border: var(--q-pen) solid var(--q-check-edge); display: inline-flex; }
  .box.on { background: var(--q-check-on-fill); border-color: var(--q-check-on-edge); }
  .box path { fill: none; stroke: var(--q-text); stroke-width: 2; }

  .tabbar { display: flex; background: var(--q-window); color: var(--q-window-text); padding-top: 2px; min-width: 240px; }
  .tab { position: relative; padding: 5px 14px; background: var(--q-tab-off-fill); }
  .tab.on { background: var(--q-tab-on-fill); border: var(--q-pen) solid var(--q-tab-on-pen); border-bottom: 0; }
  .marker { position: absolute; left: 0; right: 0; top: 0; height: 3px; background: var(--q-tab-marker); }
</style>
