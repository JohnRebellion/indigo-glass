<script lang="ts">
  /* GTK3 widgets as their CSS node trees: node names as elements, style
     classes as classes, GTK state pseudo-classes as the data-* attributes
     gtkToWeb rewrites them to (:hover -> [data-hover], :checked ->
     [data-checked], :selected -> [data-selected], :focus -> [data-focus]).
     Every colour comes from the lane's translated theme (model.ts); this
     file's style block is layout only. */
  import type { ComponentId } from '../../catalogue';
  import { placeholder } from './model';
  let { component, lane }: { component: ComponentId; lane: 'stock' | 'ours' } = $props();
  /* Not a CSS node in GTK3 — the colour is GtkEntry's own lookup (model.ts). */
  const phProbe = $derived(`placeholder:=${placeholder[lane]}`);
</script>

{#if component === 'button'}
  <window class="background">
    <box class="cp-row">
      <button data-probe="fill label edge">Apply</button>
      <button data-focus data-probe="focus">Focused</button>
      <button class="suggested-action" data-probe="primary-fill primary-label">Open</button>
    </box>
  </window>
{:else if component === 'menu'}
  <window class="popup">
    <menu data-probe="fill edge">
      <menuitem data-probe="label">New Tab</menuitem>
      <menuitem data-hover data-probe="selected-fill selected-edge selected-label">Split View</menuitem>
      <menuitem>Close Tab</menuitem>
    </menu>
  </window>
{:else if component === 'tooltip'}
  <tooltip class="background" data-probe="fill label edge">Show hidden files</tooltip>
{:else if component === 'text-field'}
  <window class="background">
    <box class="cp-col">
      <entry data-probe="fill edge"><span class="ph" data-probe={phProbe}>Search…</span></entry>
      <entry data-probe="text">sage-ink.png</entry>
      <entry data-focus data-probe="focus">rename|</entry>
    </box>
  </window>
{:else if component === 'list-selection'}
  <window class="background">
    <list data-probe="fill">
      <row data-probe="label">Documents</row>
      <row data-selected data-probe="selected-fill selected-edge selected-label">Pictures</row>
      <row>Music</row>
    </list>
  </window>
{:else if component === 'scrollbar'}
  <window class="background">
    <scrollbar class="vertical right" data-probe="track">
      <contents><trough><slider data-probe="thumb"></slider></trough></contents>
    </scrollbar>
  </window>
{:else if component === 'checkbox'}
  <window class="background" data-probe="surface">
    <box class="cp-col">
      <!-- svelte-ignore a11y_label_has_associated_control — GTK's label node, not an HTML form label -->
      <checkbutton><check data-probe="box-fill box-edge"></check><label data-probe="label">Show thumbnails</label></checkbutton>
      <checkbutton>
        <!-- GTK3's builtin check image (-gtk-icon-source initial value) strokes in the node's `color`. -->
        <check data-checked data-probe="checked-fill mark:color"><svg viewBox="0 0 14 14" width="14" height="14"><path d="M3 7.5l2.8 2.8L11 4.5" /></svg></check>
        <!-- svelte-ignore a11y_label_has_associated_control — GTK's label node, not an HTML form label -->
        <label>Remember</label>
      </checkbutton>
    </box>
  </window>
{:else if component === 'tab'}
  <window class="background">
    <notebook>
      <header class="top" data-probe="fill">
        <tabs>
          <tab data-checked data-probe="active-fill active-label active-marker">General</tab>
          <tab data-probe="inactive-label">Advanced</tab>
        </tabs>
      </header>
      <stack>General tab content</stack>
    </notebook>
  </window>
{/if}

<style>
  window { display: block; padding: 10px; min-width: 240px; }
  .cp-row { display: flex; gap: 12px; align-items: flex-start; }
  .cp-col { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
  button { font: inherit; }
  menu { display: flex; flex-direction: column; margin: 0; min-width: 170px; list-style: none; }
  menuitem { display: block; }
  tooltip { display: inline-block; }
  entry { display: block; min-width: 200px; }
  .ph { color: var(--gtk3-placeholder); }
  list { display: flex; flex-direction: column; min-width: 200px; padding: 2px 0; }
  row { display: block; padding: 3px 10px; }
  scrollbar { display: flex; width: 14px; height: 120px; }
  contents, trough { display: flex; flex: 1; }
  slider { display: block; width: 100%; height: 35%; margin-top: 20px; }
  checkbutton { display: inline-flex; align-items: center; gap: 6px; }
  check { display: inline-flex; width: 16px; height: 16px; box-sizing: content-box; }
  check svg { display: none; }
  check[data-checked] svg { display: block; }
  check path { fill: none; stroke: currentColor; stroke-width: 2; }
  notebook { display: flex; flex-direction: column; min-width: 260px; }
  header, tabs { display: flex; }
  tab { display: block; }
  stack { display: block; padding: 12px; }
</style>
