<script lang="ts">
  /* GTK4 / libadwaita widgets as their CSS node trees (GtkButton, GtkPopoverMenu,
     GtkTooltip, GtkEntry > GtkText, GtkListBox, GtkScrollbar, GtkCheckButton,
     AdwTabBar). GTK states are the data-* attributes gtkToWeb and
     layers/gtk4/model.ts rewrite them to. Every colour comes from the lane's
     translated stylesheet; this file's style block is layout only. */
  import type { ComponentId } from '../../catalogue';
  let { component }: { component: ComponentId; lane: 'stock' | 'ours' } = $props();
</script>

{#if component === 'button'}
  <window class="background">
    <box class="cp-row">
      <button class="text-button" data-probe="fill label edge">Apply</button>
      <button class="text-button" data-focus data-focus-visible data-probe="focus">Focused</button>
      <button class="text-button suggested-action" data-probe="primary-fill primary-label">Open</button>
    </box>
  </window>
{:else if component === 'menu'}
  <popover class="background menu">
    <contents data-probe="fill edge">
      <stack>
        <box class="vertical">
          <modelbutton data-probe="label">New Tab</modelbutton>
          <!-- GtkPopoverMenu marks the item under the pointer or keyboard :selected (and :hover). -->
          <modelbutton data-hover data-selected data-probe="selected-fill selected-edge selected-label">Split View</modelbutton>
          <modelbutton>Close Tab</modelbutton>
        </box>
      </stack>
    </contents>
  </popover>
{:else if component === 'tooltip'}
  <tooltip class="background" data-probe="fill label edge"><box>Show hidden files</box></tooltip>
{:else if component === 'text-field'}
  <window class="background">
    <box class="cp-col">
      <entry data-probe="fill edge"><text><placeholder data-probe="placeholder">Search…</placeholder></text></entry>
      <entry data-probe="text"><text>sage-ink.png</text></entry>
      <entry data-focus-within data-probe="focus"><text data-focus>rename|</text></entry>
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
    <scrollbar class="vertical" data-probe="track">
      <range class="vertical"><trough><slider data-probe="thumb"></slider></trough></range>
    </scrollbar>
  </window>
{:else if component === 'checkbox'}
  <window class="background" data-probe="surface">
    <box class="cp-col">
      <!-- svelte-ignore a11y_label_has_associated_control — GTK's label node, not an HTML form label -->
      <checkbutton><check data-probe="box-fill box-edge"></check><label data-probe="label">Show thumbnails</label></checkbutton>
      <checkbutton>
        <!-- libadwaita's check-symbolic.svg is -gtk-recolor()ed to the node's `color`. -->
        <check data-checked data-probe="checked-fill mark:color"><svg viewBox="0 0 14 14" width="14" height="14"><path d="M3 7.5l2.8 2.8L11 4.5" /></svg></check>
        <!-- svelte-ignore a11y_label_has_associated_control — GTK's label node, not an HTML form label -->
        <label>Remember</label>
      </checkbutton>
    </box>
  </window>
{:else if component === 'tab'}
  <window class="background">
    <tabbar>
      <revealer>
        <box class="box" data-probe="fill">
          <scrolledwindow>
            <viewport>
              <tabbox>
                <!-- AdwTab sets GTK_STATE_FLAG_SELECTED on the current tab (adw-tab.c), i.e. :selected. -->
                <tabboxchild><tab data-selected data-probe="active-fill active-label active-marker">General</tab></tabboxchild>
                <tabboxchild><tab data-probe="inactive-label">Advanced</tab></tabboxchild>
              </tabbox>
            </viewport>
          </scrolledwindow>
        </box>
      </revealer>
    </tabbar>
  </window>
{/if}

<style>
  window { display: block; padding: 10px; min-width: 240px; }
  .cp-row { display: flex; gap: 12px; align-items: flex-start; }
  .cp-col { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
  button { font: inherit; padding: 5px 12px; }
  popover { display: inline-block; }
  contents, stack { display: block; }
  box.vertical { display: flex; flex-direction: column; min-width: 170px; }
  modelbutton { display: block; padding: 6px 12px; }
  tooltip { display: inline-block; }
  entry { display: block; min-width: 200px; padding: 6px 10px; }
  text, placeholder { display: inline; }
  list { display: flex; flex-direction: column; min-width: 200px; }
  row { display: block; padding: 5px 10px; }
  scrollbar { display: flex; width: 14px; height: 120px; }
  range, trough { display: flex; flex: 1; }
  slider { display: block; width: 100%; height: 35%; margin-top: 20px; }
  checkbutton { display: inline-flex; align-items: center; gap: 6px; }
  check { display: inline-flex; width: 14px; height: 14px; box-sizing: content-box; }
  check svg { display: none; }
  check[data-checked] svg { display: block; }
  check path { fill: none; stroke: currentColor; stroke-width: 2; }
  tabbar, revealer, scrolledwindow, viewport { display: block; min-width: 260px; }
  box.box, tabbox { display: flex; }
  tabboxchild { display: block; }
  tab { display: block; padding: 5px 16px; }
</style>
