<script lang="ts">
  /* Cursor theme: the pointer shapes a desktop asks for, decoded from the
   * compiled Xcursor binaries and drawn 1:1 at the size libXcursor would
   * pick, over a dark ink patch and a white page. Ticks in the margin mark
   * the hotspot row and column; the zoomed row draws it as a crosshair.
   * Both lanes run the same snippets; only the theme directory differs. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import type { Lane } from '../surface';
  import { PALETTE } from '../tokens';
  import { meta, roles as recipeRoles, sampledRoles, pairs } from './index';
  import {
    oursSrc, stockSrc, loadTheme, laneVars, cursorCoverage, SPECIMENS, NOMINAL, SHIPPED_SIZE, SHIPPED_THEME,
    recipe, SLOT_MEANING, OURS_BUILT, type CursorModel
  } from './model';
  import { bestSize, framesAt, frameCount, sizes, toRGBA, type XcImage } from './xcursor';

  const MARK = PALETTE.amber; /* hotspot annotation: the simulator's, not the theme's */
  const M = 5; /* margin around a 1:1 cursor that carries the hotspot ticks */

  const load = Promise.all([loadTheme(stockSrc), loadTheme(oursSrc)]).then(([stock, ours]) => ({
    stock,
    ours,
    lanes: {
      stock: { which: 'stock' as const, label: 'breeze_cursors (breeze-cursor-theme 6.7.4)', style: laneVars(stock), model: stock },
      ours: { which: 'ours' as const, label: 'cursor/out/Bibata-IndigoGlass', style: laneVars(ours), model: ours }
    },
    roles: [...recipeRoles, ...sampledRoles(ours, stock)],
    contrast: pairs(ours.sample.body, ours.sample.outline, ours.sample.accent)
  }));

  type Paint = { m: CursorModel; name: string; size: number; zoom?: number; cross?: boolean; animate?: boolean };

  function frames(p: Paint): XcImage[] {
    const f = p.m.file(p.name);
    if (!f) return [];
    const all = framesAt(f, bestSize(f, p.size));
    return p.animate ? all : all.slice(0, 1);
  }

  function draw(node: HTMLCanvasElement, img: XcImage, p: Paint) {
    const z = p.zoom ?? 1, pad = z === 1 ? M : 0;
    node.width = img.width * z + 2 * pad;
    node.height = img.height * z + 2 * pad;
    node.style.width = `${node.width}px`;
    node.style.height = `${node.height}px`;
    const ctx = node.getContext('2d')!;
    ctx.clearRect(0, 0, node.width, node.height);
    const src = document.createElement('canvas');
    src.width = img.width; src.height = img.height;
    src.getContext('2d')!.putImageData(new ImageData(toRGBA(img), img.width, img.height), 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, pad, pad, img.width * z, img.height * z);
    ctx.fillStyle = MARK;
    if (pad) {
      /* ticks in the margin, on the hotspot pixel's row and column */
      ctx.fillRect(pad + img.xhot, 0, 1, pad - 1);
      ctx.fillRect(pad + img.xhot, node.height - pad + 1, 1, pad - 1);
      ctx.fillRect(0, pad + img.yhot, pad - 1, 1);
      ctx.fillRect(node.width - pad + 1, pad + img.yhot, pad - 1, 1);
    }
    if (p.cross) {
      /* the hotspot pixel outlined, with arms clear of it */
      const x = img.xhot * z, y = img.yhot * z;
      ctx.strokeStyle = MARK;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, z - 1, z - 1);
      ctx.fillRect(x + z / 2 - 0.5, y - 3 * z, 1, 2 * z);
      ctx.fillRect(x + z / 2 - 0.5, y + 2 * z, 1, 2 * z);
      ctx.fillRect(x - 3 * z, y + z / 2 - 0.5, 2 * z, 1);
      ctx.fillRect(x + 2 * z, y + z / 2 - 0.5, 2 * z, 1);
    }
  }

  /* Draws the cursor and records the real file as shown (coverage). */
  function paint(node: HTMLCanvasElement, p: Paint) {
    const imgs = frames(p);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (imgs.length) {
      draw(node, imgs[0], p);
      p.m.shown.add(p.m.realName(p.name)!);
      if (p.animate && imgs.length > 1) {
        let i = 0;
        const tick = () => { i = (i + 1) % imgs.length; draw(node, imgs[i], p); timer = setTimeout(tick, imgs[i].delay || 50); };
        timer = setTimeout(tick, imgs[0].delay || 50);
      }
    }
    return { destroy: () => clearTimeout(timer) };
  }

  const info = (m: CursorModel, name: string, size: number) => {
    const f = m.file(name);
    if (!f) return null;
    const s = bestSize(f, size);
    const img = framesAt(f, s)[0];
    return { real: m.realName(name)!, s, w: img.width, h: img.height, x: img.xhot, y: img.yhot, frames: frameCount(f, s), delay: img.delay, all: sizes(f) };
  };
  const listed = (m: CursorModel, name: string) => { m.shown.add(`alias:${name}`); return name; };
  const themeRows = (m: CursorModel) =>
    ([['index.theme', m.index], ['cursor.theme', m.cursorTheme]] as const).flatMap(([file, d]) =>
      d ? d.keys().filter((k) => !k.includes('[')).map((k) => { const [g, key] = k.split('/'); return { file, g, key, v: d.get(g, key) ?? '' }; }) : []);
  const HOT = ['default', 'pointer', 'text', 'crosshair', 'ne-resize', 'help'];
</script>

{#if !OURS_BUILT}
  <p class="loading" data-testid="cursor-unbuilt">cursor/out/Bibata-IndigoGlass is not built (gitignored build output). Run <code>cursor/build-bibata.sh</code>, then reload.</p>
{:else}
{#await load}
  <p class="loading" data-testid="cursor-loading">Decoding cursor files…</p>
{:then d}
  <DesktopPage {meta} lanes={d.lanes} roles={d.roles} contrast={d.contrast} coverage={() => cursorCoverage(d.ours)}>
    <Section id="set" title="Pointer set" lead="The shapes Qt and GTK ask for, by freedesktop name, 1:1 at the size libXcursor picks; amber ticks mark the hotspot row and column" min="100%">
      {#each NOMINAL as size}
        <DPair name="nominal {size}" span="full" note={size === SHIPPED_SIZE ? `${size} is what config/gtk-3.0/settings.ini ships (gtk-cursor-theme-size, theme ${SHIPPED_THEME}) and Plasma's default.` : ''}>
          {#snippet children(lane: Lane<CursorModel>)}
            <div class="set">
              {#each SPECIMENS as s}
                {@const i = info(lane.model, s.name, size)}
                <div class="cell">
                  <div class="patch dark"><canvas use:paint={{ m: lane.model, name: s.name, size }}></canvas></div>
                  <div class="patch light"><canvas use:paint={{ m: lane.model, name: s.name, size }}></canvas></div>
                  <span class="nm">{s.label}</span>
                  {#if i}<span class="meta">{i.real}{i.s !== size ? ` @${i.s}` : ''} · {i.w}²</span>{:else}<span class="meta miss">absent</span>{/if}
                </div>
              {/each}
            </div>
          {/snippet}
        </DPair>
      {/each}
    </Section>

    <Section id="hotspot" title="Hotspot" lead="x4, nearest-neighbour, at 32: the outlined pixel is (xhot, yhot) from the image chunk" min="100%">
      <DPair name="hotspots x4" span="full">
        {#snippet children(lane: Lane<CursorModel>)}
          <div class="set">
            {#each HOT as name}
              {@const i = info(lane.model, name, 32)}
              <div class="cell">
                <div class="patch dark"><canvas class="px" use:paint={{ m: lane.model, name, size: 32, zoom: 4, cross: true }}></canvas></div>
                <span class="nm">{name}</span>
                {#if i}<span class="meta">hot ({i.x}, {i.y}) in {i.w}×{i.h}</span>{/if}
              </div>
            {/each}
          </div>
        {/snippet}
      </DPair>
    </Section>

    <Section id="anim" title="Busy cursors" lead="Every frame at 32, played at the chunk's own delay" min="320px">
      <DPair name="wait and progress">
        {#snippet children(lane: Lane<CursorModel>)}
          <div class="set">
            {#each ['wait', 'progress'] as name}
              {@const i = info(lane.model, name, 32)}
              <div class="cell">
                <div class="patch dark"><canvas use:paint={{ m: lane.model, name, size: 32, animate: true }}></canvas></div>
                <div class="patch light"><canvas use:paint={{ m: lane.model, name, size: 32, animate: true }}></canvas></div>
                <span class="nm">{name}</span>
                {#if i}<span class="meta">{i.frames} frames × {i.delay} ms</span>{/if}
              </div>
            {/each}
          </div>
        {/snippet}
      </DPair>
      <DPair name="painted colours" note="Opaque pixels of the largest image, most common first: the fills the SVGs paint, not the anti-aliased edge.">
        {#snippet children(lane: Lane<CursorModel>)}
          <div class="hist">
            {#each Object.entries(lane.model.sample.hist) as [name, h]}
              <div class="hrow"><span class="nm">{name}</span>
                {#each h.slice(0, 6) as [c, n]}<span class="ent" title="{c} × {n} px"><span class="sw" style="background:{c}"></span><code>{c}</code></span>{/each}
              </div>
            {/each}
            <div class="hrow roles">
              <span>body <i class="sw" style="background:var(--cur-body)"></i></span>
              <span>outline <i class="sw" style="background:var(--cur-outline)"></i></span>
              {#if lane.model.sample.accent}<span>accent <i class="sw" style="background:var(--cur-accent)"></i></span>{/if}
            </div>
            {#if lane.which === 'ours'}
              <table class="kv"><tbody>
                {#each Object.entries(recipe.slots) as [slot, hex]}<tr><td>{slot}</td><td>{SLOT_MEANING[slot]}</td><td><code>{hex}</code></td></tr>{/each}
              </tbody></table>
            {/if}
          </div>
        {/snippet}
      </DPair>
    </Section>

    <Section id="files" title="Every cursor file" lead="Each real Xcursor file in the theme directory, first frame at 24" min="100%">
      <DPair name="all files" span="full">
        {#snippet children(lane: Lane<CursorModel>)}
          <div class="set tight">
            {#each lane.model.regular as name}
              <div class="cell small">
                <div class="patch dark"><canvas use:paint={{ m: lane.model, name, size: 24 }}></canvas></div>
                <span class="meta">{name}</span>
              </div>
            {/each}
          </div>
        {/snippet}
      </DPair>
      <DPair name="names" span="full" note="Symlinks in cursors/: the name an application asks for, and the file it gets.">
        {#snippet children(lane: Lane<CursorModel>)}
          <div class="aliases">
            {#each Object.entries(lane.model.aliases).sort() as [a, t]}
              <span><code>{listed(lane.model, a)}</code> → <code>{t}</code></span>
            {/each}
          </div>
        {/snippet}
      </DPair>
      <DPair name="theme files" span="full" note="libXcursor reads only index.theme (library.c _XcursorThemeInherits); cursor.theme is ctgen's template, rewritten by build-bibata.sh to agree with it.">
        {#snippet children(lane: Lane<CursorModel>)}
          <table class="kv"><tbody>
            {#each themeRows(lane.model) as r}<tr><td>{r.file}</td><td>[{r.g}]</td><td>{r.key}</td><td><code>{r.v}</code></td></tr>{/each}
          </tbody></table>
        {/snippet}
      </DPair>
    </Section>
  </DesktopPage>
{:catch e}
  <p class="loading" data-testid="cursor-load-error">Could not load the cursor files: {String(e)}</p>
{/await}
{/if}

<style>
  .loading { padding: 24px; color: var(--ig-text-muted); }
  .set { display: flex; flex-wrap: wrap; gap: 10px 12px; color: var(--ig-text); font-size: var(--host-small-pt); }
  .set.tight { gap: 6px 8px; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 64px; }
  .cell.small { min-width: 56px; }
  .patch { display: flex; align-items: center; justify-content: center; min-width: 58px; min-height: 58px; border: var(--ig-border-hairline) solid var(--ig-border-strong); }
  .patch.dark { background: var(--patch-dark); }
  .patch.light { background: var(--patch-light); }
  canvas { display: block; }
  canvas.px { image-rendering: pixelated; }
  .nm { font-weight: 600; }
  .meta { color: var(--ig-text-muted); font-family: "Iosevka Custom Condensed", monospace; font-size: var(--host-small-pt); }
  .meta.miss { color: var(--ig-negative); }
  .hist { display: flex; flex-direction: column; gap: 5px; color: var(--ig-text); font-size: var(--host-small-pt); }
  .hrow { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .hrow .nm { min-width: 80px; }
  .ent { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; margin-right: 6px; }
  .hrow.roles { gap: 14px; }
  .sw { display: inline-block; width: 12px; height: 12px; border: var(--ig-border-hairline) solid var(--ig-border-strong); vertical-align: -2px; }
  code { font-family: "Iosevka Custom Condensed", monospace; }
  .aliases { display: flex; flex-wrap: wrap; gap: 2px 14px; color: var(--ig-text); font-size: var(--host-small-pt); }
  .kv { border-collapse: collapse; color: var(--ig-text); font-size: var(--host-small-pt); }
  .kv td { padding: 1px 8px 1px 0; border-bottom: var(--ig-border-hairline) solid var(--ig-border); }
</style>
