<script lang="ts">
  /* One KSvg::FrameSvgItem at scale 1: the nine parts laid out by the
   * FrameSvg port (frame.ts frameLayout) at the rendered size, content padded
   * by the frame margins unless `bare`. The /desktop/ Frame.svelte needs the
   * desktop page context; this is the same layout without it. */
  import type { Snippet } from 'svelte';
  import { frameLayout } from '$lib/desktop/plasma-theme/frame';
  import type { PFrameData } from './paint';

  let {
    frame,
    bare = false,
    probe = undefined,
    style = '',
    children
  }: { frame: PFrameData | null; bare?: boolean; probe?: string; style?: string; children?: Snippet } = $props();

  let cw = $state(0);
  let ch = $state(0);
  const layout = $derived(frame && cw > 0 && ch > 0 ? frameLayout(frame.geom, cw, ch) : null);
  const m = $derived(bare || !frame ? { top: 0, right: 0, bottom: 0, left: 0 } : frame.geom.margin);
  const at = (c: { x: number; y: number; w: number; h: number }) => `left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px`;
</script>

<div
  class="pf"
  data-image={frame?.where ?? 'missing'}
  data-prefix={frame?.geom.prefix ?? ''}
  data-probe={probe}
  style="padding:{m.top}px {m.right}px {m.bottom}px {m.left}px;{style}"
  bind:clientWidth={cw}
  bind:clientHeight={ch}
>
  {#if frame && layout}
    {#each layout.cells as c (c.part)}
      {@const t = frame.tiles[c.part]}
      {#if t}
        <span
          class="cell"
          style="{at(c)};background-image:url('{t.uri}');{c.mode === 'tile' && c.tile ? `background-size:${c.tile.w}px ${c.tile.h}px;background-repeat:repeat` : 'background-size:100% 100%;background-repeat:no-repeat'}"
        ></span>
      {/if}
    {/each}
  {/if}
  <div class="pc">{@render children?.()}</div>
</div>

<style>
  .pf { position: relative; isolation: isolate; box-sizing: border-box; min-width: 0; }
  .cell { position: absolute; pointer-events: none; z-index: 0; }
  .pc { position: relative; z-index: 1; height: 100%; box-sizing: border-box; }
</style>
