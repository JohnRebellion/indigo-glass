<script lang="ts">
  /* GitHub, drawn in Primer's own markup (the class names the /sites/github/
     mock and github.user.css select on). Every colour comes from the lane
     stylesheets; this file only lays the copies out. data-sim-focus /
     data-sim-hover mark the one copy that stands for a focused / hovered
     element (layers/_sites/css.ts rewrites the pseudo-classes to them). */
  import type { ComponentId } from '../../catalogue';
  import { probeComputed } from '../_sites/pseudo';
  let { component }: { component: ComponentId; lane: 'stock' | 'ours' } = $props();
</script>

{#if component === 'button'}
  <button class="btn" type="button" data-probe="fill label edge">Watch</button>
  <button class="btn" type="button" data-sim-focus data-probe="focus">Focused</button>
  <button class="btn btn-primary" type="button" data-probe="primary-fill primary-label">Create pull request</button>
{:else if component === 'menu'}
  <div class="Overlay" role="menu" data-probe="fill edge">
    <ul class="prc-ActionList-ActionList-abc">
      <li class="prc-ActionList-ActionListItem-So4vC prc-ActionList-ActionListItem" data-probe="label">Open in github.dev</li>
      <li class="prc-ActionList-ActionListItem-So4vC prc-ActionList-ActionListItem" tabindex="-1" role="menuitem" data-sim-focus data-probe="selected-fill selected-edge selected-label">Copy permalink</li>
      <li class="prc-ActionList-ActionListItem-So4vC prc-ActionList-ActionListItem">View raw</li>
    </ul>
  </div>
{:else if component === 'tooltip'}
  <span class="tooltipped-box" data-probe="fill label edge">Copy to clipboard</span>
{:else if component === 'text-field'}
  <div class="col">
    <input class="form-control" placeholder="Filter issues" data-probe="fill edge"
      use:probeComputed={{ slot: 'placeholder', prop: 'color', pseudo: '::placeholder' }} />
    <input class="form-control" value="indigo-glass" data-probe="text" />
    <input class="form-control" value="rename" data-sim-focus data-probe="focus" />
  </div>
{:else if component === 'list-selection'}
  <nav aria-label="Repository">
    <ul class="prc-ActionList-ActionList-abc" data-probe="fill">
      <li class="prc-ActionList-ActionListItem-So4vC prc-ActionList-ActionListItem" data-probe="label">Code</li>
      <li class="prc-ActionList-ActionListItem-So4vC prc-ActionList-ActionListItem" data-active="true" data-probe="selected-fill selected-edge selected-label">Issues</li>
      <li class="prc-ActionList-ActionListItem-So4vC prc-ActionList-ActionListItem">Pull requests</li>
    </ul>
  </nav>
{:else if component === 'checkbox'}
  <div class="col" data-probe="surface">
    <label class="form-checkbox" data-probe="label"><input type="checkbox" /> Allow squash merging</label>
    <label class="form-checkbox"><input type="checkbox" checked
      use:probeComputed={{ slot: 'checked-fill', prop: 'accent-color' }} /> Allow merge commits</label>
  </div>
{:else if component === 'tab'}
  <nav class="UnderlineNav" data-probe="fill">
    <a class="UnderlineNav-item" aria-current="page" href="#top" data-probe="active-fill active-label active-marker">Code</a>
    <a class="UnderlineNav-item" href="#top" data-probe="inactive-label">Issues</a>
    <a class="UnderlineNav-item" href="#top">Pull requests</a>
  </nav>
{/if}

<style>
  .col { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
</style>
