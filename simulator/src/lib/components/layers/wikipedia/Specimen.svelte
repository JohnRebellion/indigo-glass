<script lang="ts">
  /* Wikipedia, drawn in Vector 2022 / Codex markup (the class names the
     /sites/wikipedia/ mock and wikipedia.user.css select on). Every colour
     comes from the lane stylesheets. data-sim-focus marks the one copy that
     stands for a keyboard-focused element (layers/_sites/css.ts). */
  import type { ComponentId } from '../../catalogue';
  import { probeComputed } from '../_sites/pseudo';
  let { component }: { component: ComponentId; lane: 'stock' | 'ours' } = $props();
</script>

{#if component === 'button'}
  <button class="cdx-button" type="button" data-probe="fill label edge">Preview</button>
  <button class="cdx-button" type="button" data-sim-focus data-probe="focus">Focused</button>
  <button class="cdx-button cdx-button--weight-primary cdx-button--action-progressive" type="button" data-probe="primary-fill primary-label">Publish changes</button>
{:else if component === 'menu'}
  <ul class="cdx-menu plain" role="listbox" data-probe="fill edge">
    <li class="cdx-menu-item" role="option" aria-selected="false" data-probe="label">Comparison of web servers</li>
    <li class="cdx-menu-item cdx-menu-item--highlighted" role="option" aria-selected="false" data-probe="selected-fill selected-edge selected-label">Comparison of web browsers</li>
    <li class="cdx-menu-item" role="option" aria-selected="false">Comparison of webmail</li>
  </ul>
{:else if component === 'text-field'}
  <div class="col">
    <div class="cdx-text-input"><input class="cdx-text-input__input" placeholder="Edit summary" data-probe="fill edge"
      use:probeComputed={{ slot: 'placeholder', prop: 'color', pseudo: '::placeholder' }} /></div>
    <div class="cdx-text-input"><input class="cdx-text-input__input" value="Fixed typo" data-probe="text" /></div>
    <div class="cdx-text-input"><input class="cdx-text-input__input" value="Fixed typo" data-sim-focus data-probe="focus" /></div>
  </div>
{:else if component === 'list-selection'}
  <nav class="vector-toc" data-probe="fill">
    <ul>
      <li class="vector-toc-list-item vector-toc-list-item-active" data-probe="selected-fill selected-edge"><a href="#top" data-probe="selected-label">(Top)</a></li>
      <li class="vector-toc-list-item"><a href="#top" data-probe="label">General information</a></li>
      <li class="vector-toc-list-item"><a href="#top">Release history</a></li>
    </ul>
  </nav>
{:else if component === 'checkbox'}
  <div class="col" data-probe="surface">
    <label class="cdx-checkbox" data-probe="label"><input class="cdx-checkbox__input" type="checkbox" /><span class="cdx-checkbox__icon" data-probe="box-fill box-edge"></span>Minor edit</label>
    <label class="cdx-checkbox"><input class="cdx-checkbox__input" type="checkbox" checked /><span class="cdx-checkbox__icon cdx-checkbox__icon--checked" data-probe="checked-fill"
      use:probeComputed={{ slot: 'mark', prop: 'border-right-color', pseudo: '::before' }}></span>Watch this page</label>
  </div>
{:else if component === 'tab'}
  <div class="vector-page-toolbar" data-probe="fill">
    <nav class="vector-menu-tabs">
      <a class="vector-tab-noicon selected" href="#top" data-probe="active-fill active-label active-marker">Read</a>
      <a class="vector-tab-noicon" href="#top" data-probe="inactive-label">Edit</a>
      <a class="vector-tab-noicon" href="#top">View history</a>
    </nav>
  </div>
{/if}

<style>
  .col { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
  .plain { list-style: none; margin: 0; padding: 0; }
  /* Codex hides the real input under the icon; the icon is what paints. */
  .cdx-checkbox__input { position: absolute; opacity: 0; width: 0; height: 0; margin: 0; }
</style>
