<script lang="ts">
  /* GRUB: a canvas render of the real share/grub-theme/theme.txt (ours) next
   * to GRUB 2.12's no-theme text console (stock) -- two different rendering
   * subsystems (gfxmenu vs VGA text mode), so unlike every other surface the
   * two lanes' markup differs by lane.which within a shared snippet, not just
   * by parsed values. See model.ts's header comment for why. */
  import { onMount } from 'svelte';
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import GrubScreen from '$lib/GrubScreen.svelte';
  import type { LoadedPreset } from '$lib/theme/loader';
  import type { Lane, Coverage } from '../surface';
  import { meta, roles, contrast } from './index';
  import { missingFonts } from '$lib/theme/loader';
  import { theme, cfg, loadOursPreset, VGA, STOCK_HELP, stockMenuBox, PAINT } from './model';

  type GrubLaneModel = { which: 'stock' } | { which: 'ours'; preset: LoadedPreset };

  let preset = $state<LoadedPreset | null>(null);
  let loadError = $state<string | null>(null);
  onMount(async () => {
    try {
      preset = await loadOursPreset();
    } catch (e) {
      loadError = e instanceof Error ? e.message : String(e);
    }
  });

  const lanes = $derived.by((): { stock: Lane<GrubLaneModel>; ours: Lane<GrubLaneModel> } | null => {
    if (!preset) return null;
    const p = preset;
    return {
      stock: {
        which: 'stock',
        label: 'GRUB 2.12 menu_text.c, no GRUB_THEME set',
        style: `--desk-bg:${VGA.black}`,
        model: { which: 'stock' }
      },
      ours: {
        which: 'ours',
        label: 'share/grub-theme/theme.txt',
        style: `--desk-bg:${PAINT.base}`,
        model: { which: 'ours', preset: p }
      }
    };
  });

  const menu = stockMenuBox(cfg.entries, cfg.defaultIndex);

  function coverage(): Coverage {
    const ignored: { token: string; why: string }[] = [];
    let total = 0;
    for (const k of Object.keys(theme.root)) {
      total++;
      if (k === 'title-text' && theme.root[k] === '') {
        ignored.push({ token: `root.${k}`, why: 'empty string in theme.txt -- no title bar text; GrubScreen.svelte does not render title-text at all' });
      }
    }
    theme.components.forEach((c, i) => {
      for (const k of Object.keys(c.props)) {
        total++;
        if (c.type === 'boot_menu' && k === 'scrollbar') {
          ignored.push({ token: `boot_menu[${i}].scrollbar`, why: 'GrubScreen.svelte paints no scrollbar for any preset (its 2026-09-23 header comment: chrome real GRUB never draws was removed)' });
        }
      }
    });
    return { total, missing: [], ignored };
  }
</script>

{#if loadError}
  <p class="err">Failed to load share/grub-theme assets: {loadError}</p>
{:else if !lanes}
  <p class="loading">Loading share/grub-theme…</p>
{:else}
  <DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
    <Section id="screen" title="Full boot screen" lead="Five static hardware-fact stat cards, the BOOT PICKER header, the boot menu and the footer hints -- every component in theme.txt, in declaration order, at 0.25 scale (2560x1440 native)." min="620px">
      <DPair name="boot screen" span="full" note="Stock has no stat cards, no header, no card -- GRUB's no-theme console is only ever the box, the entries and the two help lines below it.">
        {#snippet children(lane: Lane<GrubLaneModel>)}
          {#if lane.model.which === 'ours'}
            <div class="ours-wrap">
              <GrubScreen preset={lane.model.preset} cfg={cfg} selected={cfg.defaultIndex} width={640} height={360} />
            </div>
            {@const absent = missingFonts(lane.model.preset.theme, lane.model.preset.fonts)}
            {#if absent.length}
              <p class="sub" data-testid="grub-font-fallback">SF Pro Display is used but not bundled (Apple licence). {absent.length} label font(s) drawn with a browser fallback: {absent.join(', ')}. Install SF Pro and run <code>scripts/build-sfpro-pf2.sh</code> for the real GRUB bitmaps.</p>
            {/if}
          {:else}
            <div class="console" style="width:640px;min-height:360px;">
              <pre class="box">{menu.top}
{#each menu.lines as l}<span class:sel={l.selected}>{l.text}</span>
{/each}{menu.bottom}</pre>
              <p class="help">{#each STOCK_HELP as h}{h}<br />{/each}</p>
            </div>
          {/if}
        {/snippet}
      </DPair>
    </Section>

    <Section id="selected" title="Selected item: stroke vs invert" lead="theme.txt's boot_menu.selected_item_color was accent_hi (4.4515:1 on card_fill, under the 4.5:1 floor) -- fixed 2026-09-25 to text, same colour as an unselected item, since the selection is already carried structurally by select_*.png's 4px stroke. Stock has no stroke concept: menu_text.c inverts the whole row to color_highlight (black on light-gray)." min="480px">
      <DPair name="boot menu, zoomed" note="Cropped to the boot_menu component's own rect (96,470, 2368x800) at 0.5 scale, so the stroke-vs-invert difference and the fixed text colour are legible.">
        {#snippet children(lane: Lane<GrubLaneModel>)}
          {#if lane.model.which === 'ours'}
            <div class="crop" style="width:1184px;height:400px;">
              <div class="crop-inner" style="margin-left:-48px;margin-top:-235px;">
                <GrubScreen preset={lane.model.preset} cfg={cfg} selected={cfg.defaultIndex} width={1280} height={720} />
              </div>
            </div>
          {:else}
            <div class="console big" style="width:1184px;min-height:400px;">
              <pre class="box">{menu.top}
{#each menu.lines as l}<span class:sel={l.selected}>{l.text}</span>
{/each}{menu.bottom}</pre>
            </div>
          {/if}
        {/snippet}
      </DPair>
    </Section>
  </DesktopPage>
{/if}

<style>
  .err { padding: 24px; color: var(--ig-negative); }
  .loading { padding: 24px; color: var(--ig-text-muted); }
  .ours-wrap :global(canvas) { border: 1px solid var(--ig-border); }
  .crop { overflow: hidden; position: relative; border: 1px solid var(--ig-border); }
  .crop-inner { position: absolute; top: 0; left: 0; }

  /* Real GRUB text console: light-gray on black, heavy VGA box-drawing,
     highlighted row inverted (menu_text.c's GRUB_TERM_COLOR_HIGHLIGHT). */
  .console {
    background: #000000; /* drift-allow: VGA console black, the one colour real GRUB text mode ever paints as background */
    color: #AAAAAA; /* drift-allow: VGA "light-gray", GRUB's color_normal default foreground -- not a Sage Ink token */
    font-family: ui-monospace, "Cascadia Code", "Iosevka Custom Condensed", monospace;
    font-size: 13px;
    line-height: 1.3;
    padding: 12px;
    box-sizing: border-box;
  }
  .console.big { font-size: 20px; }
  .console .box { margin: 0; white-space: pre; }
  .console .box span { display: block; }
  .console .box span.sel {
    background: #AAAAAA; /* drift-allow: VGA color_highlight background (inverted light-gray/black) */
    color: #000000; /* drift-allow: VGA color_highlight foreground */
  }
  .console .help { margin: 10px 0 0; font-size: 0.75em; opacity: 0.9; }
</style>
