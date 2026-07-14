<script lang="ts">
  import { onMount } from 'svelte';
  import type { LoadedPreset } from './theme/loader';
  import type { GrubCfg } from './theme/cfg';
  import type { ThemeComponent } from './theme/parser';
  import { resolveCoord } from './theme/coord';
  import { parseColor, colorToCss } from './theme/color';
  import { resolveIcon } from './theme/icon';
  import { loadImage } from './theme/nineSlice';
  import { drawLiquidGlass } from './theme/liquidGlass';
  import type { PFF2Font, PFF2Glyph } from './theme/pff2';

  interface GlassOverrides {
    panelBlur?: number;
    panelTintAlpha?: number;
    panelRadius?: number;
    panelSpecular?: number;
    pillBlur?: number;
    pillRadius?: number;
    pillTintAlpha?: number;
  }

  interface Props {
    preset: LoadedPreset;
    cfg: GrubCfg;
    selected?: number;
    width?: number;
    height?: number;
    glassOverrides?: GlassOverrides;
  }

  let {
    preset,
    cfg,
    selected = 0,
    width = 2560,
    height = 1440,
    glassOverrides = {}
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  // Offscreen canvas holding bg only — for stacked-glass sampling
  let bgCanvas: HTMLCanvasElement | null = null;
  let bgCtx: CanvasRenderingContext2D | null = null;

  const SCREEN_W = 2560;
  const SCREEN_H = 1440;

  // Plasma LimeGlass color scheme (~/.local/share/color-schemes/LimeGlass.colors)
  // Panel = Button BackgroundNormal #1f2028
  // Pill  = Selection BackgroundNormal #a8e635 / accent #c1ff58
  function panelTintFor(id: string): [number, number, number, number] {
    switch (id) {
      case 'amber':  return [40, 18, 8, 0.42];
      case 'blue':   return [8, 16, 40, 0.42];
      case 'green':  return [6, 30, 22, 0.42];
      default:       return [31, 32, 40, 0.78]; // Plasma #1f2028 dark frosted (matches Plasma dropdown)
    }
  }

  function pillTintFor(id: string): [number, number, number, number] {
    switch (id) {
      case 'amber':  return [251, 146, 60, 0.45];
      case 'blue':   return [59, 130, 246, 0.45];
      case 'green':  return [16, 185, 129, 0.45];
      default:       return [168, 230, 53, 0.5]; // Lime accent #a8e635
    }
  }

  function drawKeyChip(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    kind: 'enter' | 'esc'
  ): void {
    c.save();
    // Pill bg — subtle white tint
    c.fillStyle = 'rgba(255,255,255,0.10)';
    const r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
    c.fill();
    // Border
    c.strokeStyle = 'rgba(255,255,255,0.15)';
    c.lineWidth = 1;
    c.stroke();
    // Text (manually draw arrow + ENTER glyphs since PFF2 glyphs needed)
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.font = '600 18px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    if (kind === 'enter') c.fillText('↵ Enter', x + w / 2, y + h / 2);
    else c.fillText('Esc', x + w / 2, y + h / 2);
    c.restore();
  }

  function accentColorFor(id: string): string {
    switch (id) {
      case 'amber':  return '#fbbf24';
      case 'blue':   return '#60a5fa';
      case 'green':  return '#34d399';
      default:       return '#8bc406';
    }
  }

  function pillBorderBottomFor(id: string): string {
    switch (id) {
      case 'amber':  return 'rgba(120,53,15,0.75)';
      case 'blue':   return 'rgba(30,58,138,0.75)';
      case 'green':  return 'rgba(6,78,59,0.75)';
      default:       return 'rgba(30,32,80,0.75)'; // dark side of Plasma selection
    }
  }

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
        renderComponentSync(comp, iconImages, imageCache);
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
    imageCache: Map<string, HTMLImageElement>
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
        renderBootMenuSync(comp, left, top, w, h, iconImages);
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
    const color = parseColor(comp.props.color ?? '#ffffff');
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
      ctx.fillStyle = isOn ? 'rgba(139,196,6,1)' : 'rgba(255,255,255,0.12)';
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
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(left, bgY, width, Math.max(2, height));
    const progress = 0.7;
    ctx.fillStyle = 'rgba(139,196,6,0.85)';
    ctx.fillRect(left, bgY, width * progress, Math.max(2, height));
  }

  function renderBootMenuSync(
    comp: ThemeComponent,
    left: number,
    top: number,
    width: number,
    height: number,
    iconImages: (HTMLImageElement | null)[]
  ): void {
    const p = comp.props;
    const itemHeight = parseInt(p.item_height ?? '64', 10);
    const itemSpacing = parseInt(p.item_spacing ?? '8', 10);
    const itemPadding = parseInt(p.item_padding ?? '16', 10);
    const iconW = parseInt(p.icon_width ?? '40', 10);
    const iconH = parseInt(p.icon_height ?? '40', 10);
    const iconSpace = parseInt(p.item_icon_space ?? '16', 10);

    // Menu background — liquid glass (per-preset tint via preset.id)
    // SKIP if theme.txt has no menu_pixmap_style (Cmd-K / dashboard variant)
    if (p.menu_pixmap_style) {
      const panelTint: [number, number, number, number] = [...panelTintFor(preset.id)];
      if (glassOverrides.panelTintAlpha !== undefined) {
        panelTint[3] = glassOverrides.panelTintAlpha;
      }
      drawLiquidGlass(ctx, left, top, width, height, {
        radius: glassOverrides.panelRadius ?? 16,
        tint: panelTint,
        blurPx: glassOverrides.panelBlur ?? 80,
        borderTopColor: 'rgba(193,255,88,0.45)',
        borderBottomColor: 'rgba(0,0,0,0.75)',
        borderWidth: 1.5,
        specularStrength: glassOverrides.panelSpecular ?? 0.55,
        noiseStrength: 0.025,
        sourceCanvas: bgCanvas,
        flat: true
      });
    }

    const itemColor = parseColor(p.item_color ?? '#cccccc');
    const selColor = parseColor(p.selected_item_color ?? '#ffffff');
    const itemFontName = p.item_font ?? '';
    const selFontName = p.selected_item_font ?? itemFontName;
    const itemFont = preset.fonts.get(itemFontName);
    const selFont = preset.fonts.get(selFontName) ?? itemFont;

    const innerX = left + itemPadding;
    const innerY = top + itemPadding;
    const innerW = width - itemPadding * 2;

    for (let i = 0; i < cfg.entries.length; i++) {
      const entry = cfg.entries[i];
      const itemY = innerY + i * (itemHeight + itemSpacing);
      const isSelected = i === selected;

      if (isSelected) {
        const pillTint: [number, number, number, number] = [...pillTintFor(preset.id)];
        if (glassOverrides.pillTintAlpha !== undefined) {
          pillTint[3] = glassOverrides.pillTintAlpha;
        }
        drawLiquidGlass(ctx, innerX, itemY, innerW, itemHeight, {
          radius: glassOverrides.pillRadius ?? 12,
          tint: pillTint,
          blurPx: glassOverrides.pillBlur ?? 80,
          specularStrength: 0.55,
          noiseStrength: 0.015,
          outerShadow: false,
          glow: true,
          sourceCanvas: bgCanvas
        });
        // Linear-style 4px accent left-bar (rounded)
        ctx.save();
        ctx.fillStyle = accentColorFor(preset.id);
        const barW = 5;
        const barH = itemHeight * 0.55;
        const barX = innerX + 6;
        const barY = itemY + (itemHeight - barH) / 2;
        const br = 2.5;
        ctx.beginPath();
        ctx.moveTo(barX + br, barY);
        ctx.lineTo(barX + barW - br, barY);
        ctx.arcTo(barX + barW, barY, barX + barW, barY + br, br);
        ctx.lineTo(barX + barW, barY + barH - br);
        ctx.arcTo(barX + barW, barY + barH, barX + barW - br, barY + barH, br);
        ctx.lineTo(barX + br, barY + barH);
        ctx.arcTo(barX, barY + barH, barX, barY + barH - br, br);
        ctx.lineTo(barX, barY + br);
        ctx.arcTo(barX, barY, barX + br, barY, br);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Linear-style keyboard hint chip on right (↵ Enter)
        drawKeyChip(ctx, innerX + innerW - 100, itemY + (itemHeight - 36) / 2, 80, 36, 'enter');
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
    // Soft drop shadow for readability over any bg
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.drawImage(tmp, Math.round(x), Math.round(y));
    ctx.restore();
  }
</script>

<canvas
  bind:this={canvas}
  style:width="{width}px"
  style:height="{height}px"
  style:max-width="100%"
></canvas>
