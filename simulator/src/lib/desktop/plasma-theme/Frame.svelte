<script lang="ts">
  /* One KSvg::FrameSvgItem: the nine parts cut from the lane's SVG, laid
   * out by frameLayout at the rendered size, the content padded by the
   * frame margins (FrameSvgItem.margins), and optionally the KWindowShadow
   * a Dialog or PanelView gets from DialogShadows/PanelShadows. Geometry is
   * in Plasma logical px, scaled by the host's --host-scale. */
  import { getContext, type Snippet } from 'svelte';
  import type { DesktopCtx } from '../DesktopPage.svelte';
  import { ALL_BORDERS, frameLayout, shadowLayout, type Borders, type Edges } from './frame';
  import type { PlasmaSet, PtModel } from './model';

  let {
    model,
    image,
    prefix = '',
    borders = ALL_BORDERS,
    set = 'Window',
    shadow = null,
    padding = null,
    guides = false,
    style = '',
    children
  }: {
    model: PtModel;
    image: string;
    prefix?: string | string[];
    borders?: Borders;
    set?: PlasmaSet;
    /* Image whose shadow-* tiles KWin draws around this window. */
    shadow?: string | null;
    /* Override the content padding (Panel.qml pads by its own rule). */
    padding?: Edges | null;
    guides?: boolean;
    style?: string;
    children?: Snippet;
  } = $props();

  const ctx = getContext<DesktopCtx>('desktop');
  const scale = $derived(Number(ctx.view.hostStyle.match(/--host-scale:([\d.]+)/)?.[1] ?? 1) || 1);
  const f = $derived(model.frame(image, prefix, borders, set));
  const sh = $derived(shadow ? model.shadow(shadow, borders) : null);
  let cw = $state(0);
  let ch = $state(0);
  const W = $derived(cw / scale);
  const H = $derived(ch / scale);
  const layout = $derived(f && W > 0 && H > 0 ? frameLayout(f.geom, W, H) : null);
  const pad = $derived(padding ?? f?.geom.margin ?? { top: 0, bottom: 0, left: 0, right: 0 });
  const px = (v: number) => `calc(${Math.round(v * 1000) / 1000}px * var(--host-scale))`;
  const at = (c: { x: number; y: number; w: number; h: number }) => `left:${px(c.x)};top:${px(c.y)};width:${px(c.w)};height:${px(c.h)}`;
</script>

<div
  class="pf"
  data-image={f ? `${f.file.set}/${f.file.path}` : 'missing'}
  data-prefix={f?.geom.prefix ?? ''}
  style="padding:{px(pad.top)} {px(pad.right)} {px(pad.bottom)} {px(pad.left)};{style}"
  bind:clientWidth={cw}
  bind:clientHeight={ch}
>
  {#if sh && layout}
    {#each shadowLayout(sh.geom, W, H) as c (c.tile)}
      {@const t = sh.tiles[c.tile]}
      {#if t}<span class="cell shadow" style="{at(c)};background-image:url('{t.uri}')"></span>{/if}
    {/each}
  {/if}
  {#if f && layout}
    {#each layout.cells as c (c.part)}
      {@const t = f.tiles[c.part]}
      {#if t}
        <span
          class="cell"
          style="{at(c)};background-image:url('{t.uri}');{c.mode === 'tile' && c.tile ? `background-size:${px(c.tile.w)} ${px(c.tile.h)};background-repeat:repeat` : 'background-size:100% 100%;background-repeat:no-repeat'}"
        ></span>
      {/if}
    {/each}
    {#if guides}<span class="guide" style={at(layout.contents)}></span>{/if}
  {/if}
  <div class="pc">{@render children?.()}</div>
</div>

<style>
  .pf { position: relative; isolation: isolate; box-sizing: border-box; min-width: 0; }
  .cell { position: absolute; pointer-events: none; z-index: 0; }
  .cell.shadow { z-index: -1; background-size: 100% 100%; background-repeat: no-repeat; }
  .pc { position: relative; z-index: 1; height: 100%; box-sizing: border-box; }
  /* Diagnostic: the contents rect (frame minus margins). */
  .guide { position: absolute; z-index: 2; pointer-events: none; outline: 1px solid var(--ig-amber); outline-offset: -1px; }
</style>
