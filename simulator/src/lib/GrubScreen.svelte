<script lang="ts">
  import { onMount } from 'svelte';
  import type { LoadedPreset } from './theme/loader';
  import type { GrubCfg } from './theme/cfg';
  import type { ThemeComponent } from './theme/parser';
  import { resolveCoord } from './theme/coord';
  import { parseColor, colorToCss } from './theme/color';
  import { resolveIcon } from './theme/icon';
  import { loadImage, loadNineSlice, drawNineSlice, type NineSliceImages } from './theme/nineSlice';
  import { drawInkPanel } from './theme/inkPanel';
  import type { PFF2Font, PFF2Glyph } from './theme/pff2';

  interface Props {
    preset: LoadedPreset;
    cfg: GrubCfg;
    selected?: number;
    width?: number;
    height?: number;
  }

  let {
    preset,
    cfg,
    selected = 0,
    width = 2560,
    height = 1440
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  // Offscreen canvas holding bg only — for stacked-glass sampling
  let bgCanvas: HTMLCanvasElement | null = null;
  let bgCtx: CanvasRenderingContext2D | null = null;

  const SCREEN_W = 2560;
  const SCREEN_H = 1440;

  // The boot menu is drawn from the theme's OWN pixmaps (menu_pixmap_style /
  // selected_item_pixmap_style), exactly as GRUB does. Until 2026-09-23 this
  // renderer ignored both and painted an approximation of its own: a #1F2028
  // panel (a Plasma-era colour in no token file) with a black border that
  // measures 1.08:1 here, a per-preset tint table, an accent left-bar and an
  // "Enter" key chip that real GRUB never draws. A parity tool that invents
  // chrome cannot verify the theme, so all of that is gone; when a preset
  // ships no pixmaps the fallback is a plain ink panel and a 2px outline.

  onMount(() => {
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    const c = canvas.getContext('2d');
    if (!c) return;
    ctx = c;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    void render();
  });

  let renderToken = 0;

  $effect(() => {
    // re-render when preset/cfg/selected change
    void preset;
    void cfg;
    void selected;
    if (ctx) void render();
  });

  function currentTokenStale(t: number): boolean {
    return t !== renderToken;
  }

  async function render(): Promise<void> {
    renderToken += 1;
    const token = renderToken;

    // 0. Pre-load all images we'll need so we paint in one go (no async between draws)
    const bgUrl = preset.assets.files.get(preset.manifest.background);
    const bgColor = preset.theme.root['desktop-color'] ?? '#000000';
    let bgImage: HTMLImageElement | null = null;
    if (bgUrl) {
      try {
        bgImage = await loadImage(bgUrl);
      } catch {
        bgImage = null;
      }
    }
    if (currentTokenStale(token)) return;

    // Pre-load icons for all entries
    const iconImages = await Promise.all(
      cfg.entries.map(async (entry) => {
        const url = resolveIcon(entry, preset.assets);
        if (!url) return null;
        try {
          return await loadImage(url);
        } catch {
          return null;
        }
      })
    );
    if (currentTokenStale(token)) return;

    // Pre-load images referenced by '+ image' components
    const imageCache = new Map<string, HTMLImageElement>();
    for (const comp of preset.theme.components) {
      if (comp.type === 'image' && comp.props.file) {
        const url = resolveAsset(comp.props.file);
        if (!url || imageCache.has(url)) continue;
        try {
          imageCache.set(url, await loadImage(url));
        } catch {
          // skip
        }
      }
    }
    if (currentTokenStale(token)) return;

    // Pre-load the boot_menu pixmap boxes (GRUB's `menu_*.png` / `select_*.png`)
    const boxes = new Map<string, NineSliceImages>();
    for (const comp of preset.theme.components) {
      if (comp.type !== 'boot_menu') continue;
      for (const key of ['menu_pixmap_style', 'selected_item_pixmap_style'] as const) {
        const pattern = comp.props[key];
        if (!pattern || boxes.has(pattern)) continue;
        try {
          boxes.set(pattern, await loadNineSlice(pattern, resolveAsset));
        } catch {
          // a missing slice falls through to the flat fallback below
        }
      }
    }
    if (currentTokenStale(token)) return;

    // 1. Build (or reuse) the bg-only offscreen canvas
    if (!bgCanvas) {
      bgCanvas = document.createElement('canvas');
      bgCanvas.width = SCREEN_W;
      bgCanvas.height = SCREEN_H;
      bgCtx = bgCanvas.getContext('2d');
    }
    if (bgCtx) {
      bgCtx.clearRect(0, 0, SCREEN_W, SCREEN_H);
      if (bgImage) {
        bgCtx.drawImage(bgImage, 0, 0, SCREEN_W, SCREEN_H);
      } else {
        bgCtx.fillStyle = colorToCss(parseColor(bgColor));
        bgCtx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      }
    }

    // 2. Paint main canvas: clear + bg
    ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
    if (bgCanvas) {
      ctx.drawImage(bgCanvas, 0, 0);
    }

    // 3. Render each component in declaration order (now fully sync)
    for (const comp of preset.theme.components) {
      try {
        renderComponentSync(comp, iconImages, imageCache, boxes);
      } catch (e) {
        // Swallow per-component errors so one bad component doesn't kill render
        // eslint-disable-next-line no-console
        console.error('Render fail:', comp.type, e);
      }
    }
  }

  function resolveAsset(relPath: string): string | undefined {
    // First check direct, then under assets/
    return (
      preset.assets.files.get(relPath) ||
      preset.assets.files.get(`assets/${relPath}`)
    );
  }

  function renderComponentSync(
    comp: ThemeComponent,
    iconImages: (HTMLImageElement | null)[],
    imageCache: Map<string, HTMLImageElement>,
    boxes: Map<string, NineSliceImages>
  ): void {
    const p = comp.props;
    const left = resolveCoord(p.left ?? '0', SCREEN_W);
    const top = resolveCoord(p.top ?? '0', SCREEN_H);
    const w = resolveCoord(p.width ?? '0', SCREEN_W);
    const h = resolveCoord(p.height ?? '0', SCREEN_H);

    switch (comp.type) {
      case 'label':
        renderLabelSync(comp, left, top, w);
        break;
      case 'progress_bar':
        renderProgressBarSync(comp, left, top, w, h);
        break;
      case 'circular_progress':
        renderCircularProgressSync(comp, left, top, w, h);
        break;
      case 'image':
        renderImageSync(comp, left, top, w, h, imageCache);
        break;
      case 'boot_menu':
        renderBootMenuSync(comp, left, top, w, h, iconImages, boxes);
        break;
    }
  }

  function renderLabelSync(
    comp: ThemeComponent,
    left: number,
    top: number,
    width: number
  ): void {
    let text = comp.props.text ?? '';
    if (comp.props.id === '__timeout__') {
      text = text.replace('%d', String(cfg.timeout));
    }
    // GRUB printf-format escape: %% → %  (matches grub_vsnprintf behaviour)
    text = text.replace(/%%/g, '%');
    const align = (comp.props.align ?? 'left') as 'left' | 'center' | 'right';
    const color = parseColor(comp.props.color ?? '#ffffff'); // drift-allow: GRUB gfxmenu's own default when theme.txt omits color
    const fontName = comp.props.font ?? '';
    const font = preset.fonts.get(fontName);
    if (!font || !text) return;

    drawTextString(text, left, top, width, color, font, align);
  }

  function renderImageSync(
    comp: ThemeComponent,
    left: number,
    top: number,
    width: number,
    height: number,
    imageCache: Map<string, HTMLImageElement>
  ): void {
    const file = comp.props.file;
    if (!file) return;
    const url = resolveAsset(file);
    if (!url) return;
    const img = imageCache.get(url);
    if (!img) return;
    ctx.drawImage(img, left, top, width || img.naturalWidth, height || img.naturalHeight);
  }

  function renderCircularProgressSync(
    comp: ThemeComponent,
    left: number,
    top: number,
    width: number,
    height: number
  ): void {
    const p = comp.props;
    const numTicks = parseInt(p.num_ticks ?? '12', 10);
    const ticksDisappear = (p.ticks_disappear ?? 'false') === 'true';
    const progress = 0.7; // static demo state
    const visibleTicks = ticksDisappear ? Math.ceil(numTicks * (1 - progress)) : Math.ceil(numTicks * progress);

    const cx = left + width / 2;
    const cy = top + height / 2;
    const r = Math.min(width, height) / 2 - 2;

    // Optional center bitmap
    const centerKey = p.center_bitmap;
    if (centerKey) {
      // Center bitmap not preloaded — skip for sim; show ring only
    }

    for (let i = 0; i < numTicks; i++) {
      const isOn = i < visibleTicks;
      const angle = (i / numTicks) * Math.PI * 2 - Math.PI / 2;
      const tx = cx + Math.cos(angle) * r;
      const ty = cy + Math.sin(angle) * r;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = isOn ? '#A6C9A6' : '#1C1C1E'; // accent / border token (was #202024, a hex in no token file)
      ctx.fillRect(-1.5, -4, 3, 8);
      ctx.restore();
    }
  }

  function renderProgressBarSync(
    _comp: ThemeComponent,
    left: number,
    top: number,
    width: number,
    height: number
  ): void {
    // Simple flat progress bar (Apple-style indeterminate slim line)
    const bgY = top + height / 2 - 1;
    ctx.fillStyle = '#121216'; // surface_alt track (was #161719, a hex in no token file)
    ctx.fillRect(left, bgY, width, Math.max(2, height));
    const progress = 0.7;
    ctx.fillStyle = '#A6C9A6'; // was lime rgba(139,196,6,0.85) - stale Lime Glass accent, now opaque sage
    ctx.fillRect(left, bgY, width * progress, Math.max(2, height));
  }

  function hasSlices(b: NineSliceImages | undefined): b is NineSliceImages {
    return !!b && Object.keys(b).length > 0;
  }

  function renderBootMenuSync(
    comp: ThemeComponent,
    left: number,
    top: number,
    width: number,
    height: number,
    iconImages: (HTMLImageElement | null)[],
    boxes: Map<string, NineSliceImages>
  ): void {
    const p = comp.props;
    const itemHeight = parseInt(p.item_height ?? '64', 10);
    const itemSpacing = parseInt(p.item_spacing ?? '8', 10);
    const itemPadding = parseInt(p.item_padding ?? '16', 10);
    const iconW = parseInt(p.icon_width ?? '40', 10);
    const iconH = parseInt(p.icon_height ?? '40', 10);
    const iconSpace = parseInt(p.item_icon_space ?? '16', 10);

    // Menu box: the theme's own 9-slice, as GRUB draws it. SKIP entirely if
    // theme.txt has no menu_pixmap_style (Cmd-K / dashboard variant).
    if (p.menu_pixmap_style) {
      const menuBox = boxes.get(p.menu_pixmap_style);
      if (hasSlices(menuBox)) {
        drawNineSlice(ctx, menuBox, left, top, width, height);
      } else {
        // Preset ships no menu pixmaps: flat surface_alt panel, border_strong
        // edge, no shadow (GRUB has no shadow primitive to be faithful to).
        drawInkPanel(ctx, left, top, width, height, {
          radius: 0,
          fill: [18, 18, 22],
          borderColor: '#5E5E60',
          borderWidth: 2,
          shadow: false
        });
      }
    }

    const itemColor = parseColor(p.item_color ?? '#cccccc'); // drift-allow: GRUB gfxmenu default
    const selColor = parseColor(p.selected_item_color ?? '#ffffff'); // drift-allow: GRUB gfxmenu default
    const itemFontName = p.item_font ?? '';
    const selFontName = p.selected_item_font ?? itemFontName;
    const itemFont = preset.fonts.get(itemFontName);
    const selFont = preset.fonts.get(selFontName) ?? itemFont;
    const selBox = p.selected_item_pixmap_style ? boxes.get(p.selected_item_pixmap_style) : undefined;

    const innerX = left + itemPadding;
    const innerY = top + itemPadding;
    const innerW = width - itemPadding * 2;

    for (let i = 0; i < cfg.entries.length; i++) {
      const entry = cfg.entries[i];
      const itemY = innerY + i * (itemHeight + itemSpacing);
      const isSelected = i === selected;

      if (isSelected) {
        if (hasSlices(selBox)) {
          // GRUB stretches the selected_item box over the item rect; with a
          // c/e/w-only slice the caps keep their width and the centre spans
          // the rest. (Real GRUB lets the caps overhang the item by their own
          // width; drawing them inside is the one approximation here.)
          drawNineSlice(ctx, selBox, innerX, itemY, innerW, itemHeight);
        } else {
          // Tier C fallback: a 2px outline in the theme's selected colour, no
          // fill - the focus rule every other layer in this system uses.
          ctx.save();
          ctx.lineWidth = 2;
          ctx.strokeStyle = colorToCss(selColor);
          ctx.strokeRect(innerX + 1, itemY + 1, innerW - 2, itemHeight - 2);
          ctx.restore();
        }
      }

      // Icon (preloaded)
      const icon = iconImages[i];
      if (icon) {
        const iconY = itemY + (itemHeight - iconH) / 2;
        ctx.drawImage(icon, innerX + 12, iconY, iconW, iconH);
      }

      // Text
      const useFont = isSelected ? selFont : itemFont;
      const useColor = isSelected ? selColor : itemColor;
      if (useFont) {
        const textX = innerX + 12 + iconW + iconSpace;
        const textY = itemY + (itemHeight - useFont.ascent - useFont.descent) / 2;
        drawTextString(entry.title, textX, textY, innerW - 12 - iconW - iconSpace, useColor, useFont, 'left');
      }
    }
  }

  function drawTextString(
    text: string,
    x: number,
    y: number,
    boxWidth: number,
    color: [number, number, number],
    font: PFF2Font,
    align: 'left' | 'center' | 'right'
  ): void {
    // Measure width
    let totalW = 0;
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      const g = font.glyphs.get(cp);
      if (g) totalW += g.deviceWidth;
    }

    let drawX = x;
    if (align === 'center') drawX = x + (boxWidth - totalW) / 2;
    else if (align === 'right') drawX = x + boxWidth - totalW;

    const baselineY = y + font.ascent;
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      const g = font.glyphs.get(cp);
      if (!g) continue;
      drawGlyph(g, drawX + g.xOffset, baselineY - g.height - g.yOffset, color);
      drawX += g.deviceWidth;
    }
  }

  function drawGlyph(
    g: PFF2Glyph,
    x: number,
    y: number,
    color: [number, number, number]
  ): void {
    if (g.width === 0 || g.height === 0) return;
    // Build a temp canvas for the glyph so we can apply shadow via composite
    const tmp = document.createElement('canvas');
    tmp.width = g.width;
    tmp.height = g.height;
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    const id = tctx.createImageData(g.width, g.height);
    const pixels = id.data;
    for (let py = 0; py < g.height; py++) {
      for (let px = 0; px < g.width; px++) {
        const bitIdx = py * g.width + px;
        const byteIdx = bitIdx >> 3;
        const bitMask = 0x80 >> (bitIdx & 7);
        const on = (g.bitmap[byteIdx] & bitMask) !== 0;
        const p = bitIdx * 4;
        pixels[p] = color[0];
        pixels[p + 1] = color[1];
        pixels[p + 2] = color[2];
        pixels[p + 3] = on ? 255 : 0;
      }
    }
    tctx.putImageData(id, 0, 0);
    // No text shadow: GRUB's gfxmenu label draws bare glyphs, and a 4px blurred
    // rgba(0,0,0,0.55) shadow (removed 2026-09-23) both misrepresented that and
    // was the blurred translucent material the ink contract forbids.
    ctx.drawImage(tmp, Math.round(x), Math.round(y));
  }
</script>

<canvas
  bind:this={canvas}
  style:width="{width}px"
  style:height="{height}px"
  style:max-width="100%"
></canvas>
