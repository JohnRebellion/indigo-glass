<script lang="ts">
  /* Plasma desktop theme: the frames Plasma cuts from the theme's SVGs — a
   * bottom panel with a task manager, tray and clock; Kickoff flush on it; a
   * task tooltip window and an in-scene PC3 tooltip; scrollbars; viewitem
   * states; a desktop widget — then the 9-slice itself at several widths
   * with the hint margins drawn, and the theme's colour groups and settings.
   * Every frame is laid out by the FrameSvg port in frame.ts from the lane's
   * own file (KSvg lookup with selector and fallback, model.ts). */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import Frame from './Frame.svelte';
  import { meta, roles, contrast } from './index';
  import {
    ours, stock, laneVars, KEY_VARS, PLASMA_SETS, SAGE, DEFAULT, ROOT_FILES, VARIANT_FILES, variantIdentical, variantRoot,
    svgCoverage, audit, widgetPrefix, type PtModel
  } from './model';
  import { ALL_BORDERS, SIDES, panelPadding, type Borders } from './frame';

  const lanes = {
    stock: { which: 'stock' as const, label: 'breeze-dark + default (translucent/)', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'config/plasma-theme/SageInk (root files)', style: laneVars(ours), model: ours }
  };

  const NOT_ALT = 'never read: Plasma has no alternate background — PlasmaTheme::syncColors sets alternateBackgroundColor to BackgroundColor (plasmatheme.cpp:151-152) and ksvg has no AlternateBackground class';
  const SEL_ONLY = 'Plasma reads only Selection BackgroundNormal/ForegroundNormal (ThemePrivate::color Highlight/HighlightedText; ksvg namedColor Highlight/HighlightedText)';
  const SEL_KEYS = ['ForegroundInactive', 'ForegroundActive', 'ForegroundLink', 'ForegroundVisited', 'ForegroundNegative', 'ForegroundNeutral', 'ForegroundPositive', 'DecorationFocus', 'DecorationHover'];
  const coverage = () => {
    const svg = svgCoverage(ours);
    return iniCoverage(
      [{ label: 'colors', doc: ours.colors }, { label: 'plasmarc', doc: ours.plasmarc }, { label: 'metadata.json', doc: ours.meta }, ...svg.docs],
      KEY_VARS,
      [
        ...[...PLASMA_SETS, 'Selection'].map((s) => ({ token: `Colors:${s}/BackgroundAlternate`, why: NOT_ALT })),
        ...SEL_KEYS.map((k) => ({ token: `Colors:Selection/${k}`, why: SEL_ONLY })),
        ...svg.ignore
      ]
    );
  };

  const TOP: Borders = { top: true, bottom: false, left: false, right: false };
  const NO_BOTTOM: Borders = { top: true, bottom: false, left: true, right: true };
  const PANEL_T = 32;
  const thick = (m: PtModel) => m.frame('widgets/panel-background', 'thick');
  const panelPad = (m: PtModel, t = PANEL_T) => panelPadding(thick(m)?.geom.fixedMargin ?? { top: 0, bottom: 0, left: 0, right: 0 }, t);
  const TASKS: [string, string][] = [['normal', 'Dolphin'], ['focus', 'Konsole'], ['hover', 'Firefox'], ['attention', 'Kate'], ['minimized', 'Elisa']];
  const scrollSize = (m: PtModel) => {
    const f = m.svg('widgets/scrollbar');
    const b = f?.src.box('hint-scrollbar-size');
    return Math.round(b?.w ?? 8);
  };
  const KICKOFF: [string, string, string][] = [
    ['Firefox', 'Web Browser', 'hover'], ['Dolphin', 'File Manager', 'selected'], ['Konsole', 'Terminal', 'normal'],
    ['Kate', 'Text Editor', 'normal'], ['System Settings', 'Configuration', 'normal'], ['Spectacle', 'Screenshot Capture', 'normal']
  ];
  const STATES = ['normal', 'hover', 'selected', 'selected+hover'];
  const SLICES = [
    { image: 'widgets/panel-background', prefix: ['south', ''], widths: [120, 240, 420], h: PANEL_T, shadow: 'widgets/panel-background' },
    { image: 'dialogs/background', prefix: '', widths: [180, 300], h: 90, shadow: 'dialogs/background' },
    { image: 'widgets/tooltip', prefix: '', widths: [140, 260], h: 50, shadow: null },
    { image: 'solid/widgets/tooltip', prefix: 'shadow', widths: [160], h: 60, shadow: null },
    { image: 'widgets/background', prefix: 'widget', widths: [180, 300], h: 90, shadow: null }
  ];
  const slicePrefix = (m: PtModel, p: string | string[]) => (p === 'widget' ? widgetPrefix(m) : p);
  const setKey = (s: string) => s.toLowerCase();
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const settingRows: [string, string, string][] = [
    ['Settings', 'FallbackTheme', 'libplasma walks it for wallpaper settings only (theme_p.cpp setThemeName :435-453); SVGs fall back to "default" (ksvg imageset_p.cpp:719)'],
    ['ContrastEffect', 'enabled', 'backgroundContrastEnabled (processContrastSettings :346; a missing group means false): asks KWin for the contrast effect behind popups and panels (dialog.cpp updateTheme, panelview.cpp updateMask)'],
    ['AdaptiveTransparency', 'enabled', 'true: the panel turns opaque (solid/widgets/panel-background) while a window is maximised; false or missing: PanelView::opacityMode() is always Translucent (panelview.cpp:544-550)'],
    ['BlurBehindEffect', 'enabled', 'blurBehindEnabled (processBlurBehindSettings :372; a missing group means true): KWin blurs behind popups and panels whenever its blur effect is on'],
    ['Wallpaper', 'defaultWallpaperTheme', 'default wallpaper package (processWallpaperSettings)'],
    ['Wallpaper', 'defaultFileSuffix', 'wallpaper'], ['Wallpaper', 'defaultWidth', 'wallpaper'], ['Wallpaper', 'defaultHeight', 'wallpaper']
  ];
  const metaRows = ours.meta.keys().map((k) => k.split('/') as [string, string]);
  const storedGroups = ['General', 'KDE', 'WM', 'ColorEffects:Disabled', 'ColorEffects:Inactive'];
  const storedWhy: Record<string, string> = {
    General: 'scheme name; Plasma does not show it',
    KDE: 'KColorScheme::frameContrast() and contrast read kdeglobals, not this file',
    WM: 'title-bar colours: KWin and the decoration read kdeglobals',
    'ColorEffects:Disabled': 'not applied: libplasma and ksvg build every KColorScheme with QPalette::Active',
    'ColorEffects:Inactive': 'not applied: QPalette::Active only'
  };
  const used = ['widgets/panel-background', 'widgets/tasks', 'dialogs/background', 'widgets/tooltip', 'solid/widgets/tooltip', 'widgets/scrollbar', 'widgets/viewitem', 'widgets/background'];
  const auditOf = (m: PtModel) => {
    const paths = used.map((u) => m.resolve(u)).filter((r) => !!r) as { set: string; path: string }[];
    const files: Record<string, string> = {};
    for (const r of paths) files[`${r.set}/${r.path}`] = (r.set === SAGE.name ? SAGE : DEFAULT).files[r.path];
    return audit(files, Object.keys(files));
  };
  const audits = { stock: auditOf(stock), ours: auditOf(ours) };
  const summary = (rows: ReturnType<typeof auditOf>) => {
    const by = new Map<string, number>();
    for (const r of rows) by.set(`${r.file} · ${r.kind}${r.live ? '' : ' (not painted)'}`, (by.get(`${r.file} · ${r.kind}${r.live ? '' : ' (not painted)'}`) ?? 0) + 1);
    return [...by];
  };
</script>

{#snippet icon(kind: string)}
  <span class="ico ico-{kind}" aria-hidden="true"></span>
{/snippet}

{#snippet scrollbar(m: PtModel, vertical: boolean, hover: boolean, len: number)}
  {@const size = scrollSize(m)}
  <div class="sb" style="{vertical ? `width:calc(${size}px * var(--host-scale));height:calc(${len}px * var(--host-scale))` : `height:calc(${size}px * var(--host-scale));width:calc(${len}px * var(--host-scale))`}">
    <Frame model={m} image="widgets/scrollbar" prefix={vertical ? 'background-vertical' : 'background-horizontal'} padding={{ top: 0, bottom: 0, left: 0, right: 0 }} style="position:absolute;inset:0" />
    <Frame model={m} image="widgets/scrollbar" prefix={hover ? 'mouseover-slider' : 'slider'} padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
      style="position:absolute;{vertical ? `left:0;right:0;top:calc(${len * 0.18}px * var(--host-scale));height:calc(${len * 0.34}px * var(--host-scale))` : `top:0;bottom:0;left:calc(${len * 0.18}px * var(--host-scale));width:calc(${len * 0.34}px * var(--host-scale))`}" />
  </div>
{/snippet}

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="panel" title="Panel" lead="A full-width bottom panel: only its top border is enabled; content padding follows Panel.qml's rule from the thick- margins" min="560px">
    <DPair name="bottom panel" span="full" note="Task states left to right: normal, focus (active window), hover, attention, minimized. The task frames come from widgets/tasks, which SageInk does not ship: both lanes render the default theme's translucent washes.">
      {#snippet children(lane: Lane<PtModel>)}
        {@const m = lane.model}
        {@const p = panelPad(m)}
        <div class="screen">
          <Frame model={m} image="widgets/panel-background" prefix={['south', '']} borders={TOP} shadow="widgets/panel-background" padding={p}
            style="position:absolute;left:0;right:0;bottom:0;height:calc({PANEL_T}px * var(--host-scale))">
            <div class="prow">
              <span class="launcher">{@render icon('grid')}</span>
              {#each TASKS as [state, name] (state)}
                <Frame model={m} image="widgets/tasks" prefix={[`south-${state}`, state]} style="height:100%;min-width:calc(96px * var(--host-scale))">
                  <span class="task" class:min={state === 'minimized'}>{@render icon('app')}{name}</span>
                </Frame>
              {/each}
              <span class="grow"></span>
              <span class="tray">{@render icon('vol')}{@render icon('net')}{@render icon('bat')}</span>
              <span class="clock"><span>15:42</span><span class="date">Thu 25 Sep</span></span>
            </div>
          </Frame>
        </div>
      {/snippet}
    </DPair>
    <DPair name="panel padding (Panel.qml)" note="padding = round(min(thick fixedMargin + smallSpacing 4, floor(max(1, thickness - 22) / 2))). A missing thick- prefix falls back to the plain frame's margins.">
      {#snippet children(lane: Lane<PtModel>)}
        {@const t = thick(lane.model)}
        <table class="kv">
          <thead><tr><th>thick</th><th>thick- margin t/b/l/r</th><th>padding</th></tr></thead>
          <tbody>
            {#each [24, 32, 44, 64] as th (th)}
              {@const p = panelPad(lane.model, th)}
              <tr><td>{th}px</td><td>{t ? SIDES.map((s) => r2(t.geom.fixedMargin[s])).join(' / ') : '—'} <span class="dim">{t?.geom.prefix ? '' : '(no thick-)'}</span></td><td>{p.top} / {p.bottom} / {p.left} / {p.right}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>

  <Section id="popups" title="Popups" lead="Kickoff (dialogs/background, bottom border removed where it meets the panel) and the two tooltips" min="420px">
    <DPair name="Kickoff" span="full" note="The search field shows typed text selected (PC3 TextField: highlightedTextColor on highlightColor). Dialog::syncBorders drops the border on the edge the popup touches, so Kickoff has no bottom edge and KWin gets no bottom shadow. Window shadows are dialogs/background shadow-* tiles (DialogShadows).">
      {#snippet children(lane: Lane<PtModel>)}
        {@const m = lane.model}
        <div class="kick-screen">
          <Frame model={m} image="dialogs/background" borders={NO_BOTTOM} shadow="dialogs/background" style="width:calc(340px * var(--host-scale))">
            <div class="kick">
              <div class="khead">{@render icon('user')}<span>johnn</span><span class="grow"></span><span class="kfield"><span class="tsel">fire</span>fox</span></div>
              <div class="kbody">
                <div class="klist">
                  {#each KICKOFF as [name, desc, state] (name)}
                    <Frame model={m} image="widgets/viewitem" prefix={state} style="margin:calc(1px * var(--host-scale)) 0">
                      <span class="kitem">{@render icon('app')}<span class="ktext"><span>{name}</span><span class="kdesc">{desc}</span></span></span>
                    </Frame>
                  {/each}
                </div>
                {@render scrollbar(m, true, false, 200)}
              </div>
              <div class="kfoot"><a class="klink" href="#k">All Applications</a><span class="grow"></span><span class="kneg">Shut Down</span></div>
            </div>
          </Frame>
          <Frame model={m} image="widgets/panel-background" prefix={['south', '']} borders={TOP} padding={panelPad(m)} style="height:calc({PANEL_T}px * var(--host-scale))">
            <div class="prow"><Frame model={m} image="widgets/tasks" prefix={['south-focus', 'focus']} style="height:100%"><span class="launcher">{@render icon('grid')}</span></Frame></div>
          </Frame>
        </div>
      {/snippet}
    </DPair>
    <DPair name="task tooltip window" note="Dialog type Tooltip: widgets/tooltip, all borders, colorSet Tooltip. Its window shadow is DialogShadows on dialogs/background, not the tooltip's own shadow-* tiles.">
      {#snippet children(lane: Lane<PtModel>)}
        <Frame model={lane.model} image="widgets/tooltip" set="Tooltip" shadow="dialogs/background">
          <div class="tip"><strong>Konsole</strong><span class="tipsub">~/projects : zsh — 3 windows</span></div>
        </Frame>
      {/snippet}
    </DPair>
    <DPair name="in-scene tooltip (PC3 ToolTip)" note="PlasmaComponents3 ToolTip inside a popup: solid/widgets/tooltip with a second FrameSvgItem, prefix shadow, anchored outside by its margins. This is the only place the tooltip's own shadow-* tiles are painted.">
      {#snippet children(lane: Lane<PtModel>)}
        {@const m = lane.model}
        {@const sf = m.frame('solid/widgets/tooltip', 'shadow', ALL_BORDERS, 'Tooltip')}
        {@const mg = sf?.geom.margin ?? { top: 0, bottom: 0, left: 0, right: 0 }}
        <div class="scene">
          <Frame model={m} image="solid/widgets/tooltip" prefix="shadow" set="Tooltip"
            style="position:absolute;top:calc({-mg.top}px * var(--host-scale));bottom:calc({-mg.bottom}px * var(--host-scale));left:calc({-mg.left}px * var(--host-scale));right:calc({-mg.right}px * var(--host-scale))" />
          <Frame model={m} image="solid/widgets/tooltip" set="Tooltip">
            <div class="tip"><span>Pin to Task Manager</span><span class="tipsub">Meta+1</span></div>
          </Frame>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="controls" title="Scrollbar and view items" lead="widgets/scrollbar (track, slider, mouseover-slider) and widgets/viewitem's four prefixes on a popup fill" min="600px">
    <DPair name="scrollbars" note="Thickness is hint-scrollbar-size (PC3 ScrollBar implicit size). PC3 fades the track in on hover; both states show it here.">
      {#snippet children(lane: Lane<PtModel>)}
        {@const m = lane.model}
        <div class="bars">
          <span></span><span class="cap">rest</span><span class="cap">hover</span>
          <span class="cap">vertical</span>{@render scrollbar(m, true, false, 110)}{@render scrollbar(m, true, true, 110)}
          <span class="cap">horizontal</span>{@render scrollbar(m, false, false, 90)}{@render scrollbar(m, false, true, 90)}
        </div>
      {/snippet}
    </DPair>
    <DPair name="viewitem states" note="Upstream Highlight.qml paints viewitem at opacity 0.6 when not active; shown here at 1.">
      {#snippet children(lane: Lane<PtModel>)}
        <div class="vlist">
          {#each STATES as s (s)}
            <Frame model={lane.model} image="widgets/viewitem" prefix={s}>
              <span class="kitem">{@render icon('app')}<span class="ktext"><span>{s}</span><span class="kdesc">widgets/viewitem prefix "{s}"</span></span></span>
            </Frame>
          {/each}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="widget" title="Desktop widget" lead="widgets/background as BasicAppletContainer paints it: prefix blurred when the theme has one, else none" min="420px">
    <DPair name="sticky note" note="Stock uses the blurred prefix and Plasma adds a MultiEffect wallpaper blur under it (not simulated). SageInk has no blurred prefix, so the applet is the plain opaque frame.">
      {#snippet children(lane: Lane<PtModel>)}
        {@const m = lane.model}
        <Frame model={m} image="widgets/background" prefix={widgetPrefix(m)} style="width:calc(260px * var(--host-scale))">
          <div class="note"><strong>Notes</strong><span>Buy ink. Re-run the drift guard before the commit.</span><span class="kdesc">prefix "{widgetPrefix(m) || '(none)'}"</span></div>
        </Frame>
      {/snippet}
    </DPair>
  </Section>

  <Section id="slices" title="9-slice" lead="FrameSvg at several widths; the amber outline is the contents rect (frame minus hint margins)" min="560px">
    <DPair name="frames and margins" span="full">
      {#snippet children(lane: Lane<PtModel>)}
        {@const m = lane.model}
        <div class="slices">
          {#each SLICES as sl (sl.image + sl.prefix)}
            {@const pre = slicePrefix(m, sl.prefix)}
            {@const f = m.frame(sl.image, pre)}
            <div class="slice">
              <div class="scap"><code>{f ? `${f.file.set}/${f.file.path}` : sl.image}</code> prefix <code>{f?.geom.prefix || '""'}</code></div>
              <div class="srow">
                {#each sl.widths as w (w)}
                  <Frame model={m} image={sl.image} prefix={pre} shadow={sl.shadow} guides style="width:calc({w}px * var(--host-scale));height:calc({sl.h}px * var(--host-scale))">
                    <span class="dim">{w}×{sl.h}</span>
                  </Frame>
                {/each}
              </div>
              {#if f}
                <table class="kv">
                  <tbody>
                    <tr><th>border t/b/l/r</th><td>{SIDES.map((s) => r2(f.geom.border[s])).join(' / ')}</td></tr>
                    <tr><th>margin t/b/l/r</th><td>{SIDES.map((s) => `${r2(f.geom.margin[s])}${f.geom.marginFrom[s] === 'hint' ? 'ʰ' : ''}`).join(' / ')} <span class="dim">(ʰ = hint-*-margin)</span></td></tr>
                    <tr><th>inset t/b/l/r</th><td>{SIDES.map((s) => r2(f.geom.inset[s])).join(' / ')}</td></tr>
                    <tr><th>hints</th><td>{[f.geom.tileCenter && 'tile-center', f.geom.stretchBorders && 'stretch-borders', f.geom.composeOverBorder && 'compose-over-border'].filter(Boolean).join(', ') || '—'}</td></tr>
                  </tbody>
                </table>
              {/if}
            </div>
          {/each}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="colours" title="Colour groups" lead="The theme's colors file as Plasma reads it: one group per Kirigami colorSet, plus the Selection pair" min="300px">
    {#each PLASMA_SETS as s (s)}
      {@const k = setKey(s)}
      <DPair name={s}>
        {#snippet children()}
          <div class="set" style="background:var(--pt-{k}-bg);color:var(--pt-{k}-fg)">
            <div class="roles">
              <span>Text</span>
              <span style="color:var(--pt-{k}-inactive)">Disabled</span>
              <span style="color:var(--pt-{k}-active)">Active</span>
              <span style="color:var(--pt-{k}-link);text-decoration:underline">Link</span>
              <span style="color:var(--pt-{k}-visited);text-decoration:underline">Visited</span>
              <span style="color:var(--pt-{k}-negative)">Negative</span>
              <span style="color:var(--pt-{k}-neutral)">Neutral</span>
              <span style="color:var(--pt-{k}-positive)">Positive</span>
            </div>
            <div class="decos">
              <span style="outline:2px solid var(--pt-{k}-focus)">Focus</span>
              <span style="outline:2px solid var(--pt-{k}-hover)">Hover</span>
            </div>
          </div>
        {/snippet}
      </DPair>
    {/each}
    <DPair name="Selection" note="PC3 TextField/TextArea draw selected text with exactly this pair (selectedTextColor: highlightedTextColor), so the plasma-theme copy of the scheme ships Selection ForegroundNormal = base on accent. It was text on accent (1.72:1) until 2026-09-25. The one outlined consumer, a selected label in a non-root Folder View, pays for it.">
      {#snippet children()}
        <div class="set" style="background:var(--pt-window-bg);color:var(--pt-window-fg)">
          <div class="roles"><span class="hl" style="background:var(--pt-selection-bg);color:var(--pt-selection-fg)">Highlight / HighlightedText</span></div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="files" title="Theme files" lead="How each lane resolves its images, what plasmarc switches, and what the colors file stores but Plasma does not apply" min="560px">
    <DPair name="image lookup" span="full" note={`Selectors: stock ${JSON.stringify(stock.selectors)} — ${stock.selectorWhy}. Sage Ink ${JSON.stringify(ours.selectors)} — ${ours.selectorWhy}.`}>
      {#snippet children(lane: Lane<PtModel>)}
        <table class="kv">
          <thead><tr><th>image</th><th>renders from</th></tr></thead>
          <tbody>
            {#each used as u (u)}
              {@const r = lane.model.resolve(u)}
              <tr><td><code>{u}</code></td><td>{r ? `${r.set}/${r.path}.svg` : 'missing'}{r && r.set !== lane.model.theme.name ? ' (fallback)' : ''}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="plasmarc" span="full">
      {#snippet children(lane: Lane<PtModel>)}
        <table class="kv">
          <thead><tr><th>[group] key</th><th>value</th><th>effect</th></tr></thead>
          <tbody>
            {#each settingRows as [g, k, why] (g + k)}
              <tr><th>[{g}] {k}</th><td>{lane.model.plasmarc.get(g, k) ?? '—'}</td><td class="why">{why}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="metadata.json" span="full" note="X-Plasma-API 5.0: ThemePrivate::color keeps every colorSet (below 5 it maps all but Window to Button).">
      {#snippet children(lane: Lane<PtModel>)}
        <table class="kv">
          <tbody>
            {#each metaRows as [g, k] (g + k)}
              <tr><th>{g === 'root' ? '' : `${g}.`}{k}</th><td>{lane.model.meta.get(g, k) ?? '—'}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="colors: stored, not applied by Plasma" span="full">
      {#snippet children(lane: Lane<PtModel>)}
        <table class="kv">
          <tbody>
            {#each storedGroups as g (g)}
              {@const keys = ours.colors.keys().filter((x) => x.startsWith(`${g}/`)).map((x) => x.slice(g.length + 1))}
              <tr><th>[{g}]</th><td>{keys.map((k) => `${k}=${lane.model.colors.get(g, k) ?? '—'}`).join('  ')}</td><td class="why">{storedWhy[g]}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="variant copies" span="full" note="opaque/ (X11 without compositing), translucent/ (blur on) and solid/ (SolidBackground hint) shadow the root file. All Sage Ink copies are the root file byte for byte, so every selector paints the same opaque frame.">
      {#snippet children(lane: Lane<PtModel>)}
        <table class="kv">
          <tbody>
            {#if lane.which === 'ours'}
              {#each VARIANT_FILES as v (v)}
                <tr><th>{v}.svg</th><td>{variantIdentical(v) ? `identical to ${variantRoot(v)}.svg` : `DIFFERS from ${variantRoot(v)}.svg`}</td></tr>
              {/each}
            {:else}
              {#each Object.keys(DEFAULT.files).filter((p) => /^(opaque|solid|translucent)\//.test(p)).sort() as v (v)}
                <tr><th>default/{v}.svg</th><td>{DEFAULT.files[v] === DEFAULT.files[variantRoot(v)] ? 'identical to root' : DEFAULT.files[variantRoot(v)] ? 'differs from root' : 'root copy not in fixtures'}</td></tr>
              {/each}
            {/if}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="ink audit (translucency, gradient, blur)" span="full" note="Every frame and shadow part of the files each lane renders. Sage Ink root files carry none in any painted part; 'not painted' rows are dead art nothing reads.">
      {#snippet children(lane: Lane<PtModel>)}
        {@const rows = audits[lane.which]}
        <table class="kv">
          <tbody>
            {#each summary(rows) as [k, n] (k)}<tr><th>{k}</th><td>{n} part{n === 1 ? '' : 's'}</td></tr>{:else}<tr><td>no findings in {ROOT_FILES.length} files</td></tr>{/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .screen { position: relative; width: 100%; height: calc(130px * var(--host-scale)); }
  .prow { display: flex; align-items: stretch; gap: calc(4px * var(--host-scale)); height: 100%; color: var(--pt-window-fg); font-family: var(--pt-font); font-size: var(--host-panel-pt); }
  .launcher, .task, .tray, .clock { display: flex; align-items: center; gap: calc(6px * var(--host-scale)); height: 100%; }
  .launcher { padding: 0 calc(4px * var(--host-scale)); }
  .task { padding: 0 calc(2px * var(--host-scale)); white-space: nowrap; }
  .task.min { color: var(--pt-window-inactive); }
  .grow { flex: 1; }
  .clock { flex-direction: column; justify-content: center; align-items: center; gap: 0; line-height: 1; white-space: nowrap; padding: 0 calc(6px * var(--host-scale)); }
  .date { font-size: calc(var(--host-small-pt) * 0.9); color: var(--pt-window-inactive); }
  /* Symbolic icons: monochrome, drawn in the text colour, as Breeze symbolic icons are. */
  .ico { display: inline-block; flex: none; width: calc(16px * var(--host-scale)); height: calc(16px * var(--host-scale)); box-sizing: border-box; border: 2px solid currentColor; }
  .ico-grid { background: currentColor; border-radius: 2px; }
  .ico-app { border-radius: 3px; }
  .ico-user { border-radius: 50%; width: calc(24px * var(--host-scale)); height: calc(24px * var(--host-scale)); }
  .ico-vol, .ico-net, .ico-bat { width: calc(12px * var(--host-scale)); height: calc(12px * var(--host-scale)); }
  .ico-net { border-radius: 50% 50% 0 0; }
  .ico-bat { width: calc(16px * var(--host-scale)); }
  .tray { gap: calc(8px * var(--host-scale)); padding: 0 calc(4px * var(--host-scale)); }
  .kick-screen { display: flex; flex-direction: column; width: 100%; padding-top: calc(12px * var(--host-scale)); }
  .kick { display: flex; flex-direction: column; gap: calc(6px * var(--host-scale)); color: var(--pt-window-fg); font-family: var(--pt-font); font-size: var(--host-body-pt); }
  .khead { display: flex; align-items: center; gap: calc(8px * var(--host-scale)); padding-bottom: calc(4px * var(--host-scale)); }
  .kfield { color: var(--pt-view-fg); background: var(--pt-view-bg); padding: calc(3px * var(--host-scale)) calc(8px * var(--host-scale)); min-width: calc(120px * var(--host-scale)); }
  /* PC3 TextField: selectionColor highlightColor, selectedTextColor highlightedTextColor. */
  .tsel { background: var(--pt-selection-bg); color: var(--pt-selection-fg); }
  .kbody { display: flex; gap: calc(4px * var(--host-scale)); }
  .klist { flex: 1; min-width: 0; }
  .kitem { display: flex; align-items: center; gap: calc(8px * var(--host-scale)); padding: calc(2px * var(--host-scale)) calc(4px * var(--host-scale)); }
  .ktext { display: flex; flex-direction: column; line-height: 1.2; }
  .kdesc { color: var(--pt-window-inactive); font-size: var(--host-small-pt); }
  .kfoot { display: flex; align-items: center; padding-top: calc(4px * var(--host-scale)); }
  .klink { color: var(--pt-window-link); }
  .kneg { color: var(--pt-window-negative); }
  .tip { display: flex; flex-direction: column; gap: 2px; color: var(--pt-tooltip-fg); font-family: var(--pt-font); font-size: var(--host-body-pt); white-space: nowrap; }
  .tipsub { color: var(--pt-tooltip-inactive); font-size: var(--host-small-pt); }
  .scene { position: relative; isolation: isolate; margin: calc(8px * var(--host-scale)); }
  .sb { position: relative; flex: none; }
  .bars { display: grid; grid-template-columns: auto auto auto; gap: calc(10px * var(--host-scale)) calc(16px * var(--host-scale)); align-items: center; justify-items: start; padding: calc(10px * var(--host-scale)); background: var(--pt-window-bg); color: var(--pt-window-fg); font-size: var(--host-small-pt); width: 100%; box-sizing: border-box; }
  .cap { color: var(--pt-window-inactive); }
  .vlist { display: flex; flex-direction: column; gap: calc(2px * var(--host-scale)); width: 100%; padding: calc(8px * var(--host-scale)); background: var(--pt-window-bg); color: var(--pt-window-fg); font-family: var(--pt-font); font-size: var(--host-body-pt); }
  .note { display: flex; flex-direction: column; gap: 4px; color: var(--pt-window-fg); font-family: var(--pt-font); font-size: var(--host-body-pt); }
  .slices { display: flex; flex-direction: column; gap: 14px; width: 100%; }
  .slice { display: flex; flex-direction: column; gap: 6px; }
  .scap { color: var(--pt-complementary-fg); font-size: 9pt; }
  .srow { display: flex; flex-wrap: wrap; gap: calc(14px * var(--host-scale)); align-items: flex-start; padding: 4px 8px 8px 4px; }
  .dim { color: var(--pt-window-inactive); font-size: 8.5pt; font-family: monospace; }
  .set { width: 100%; padding: 6px 0 8px; }
  .roles { display: flex; flex-wrap: wrap; gap: 4px 12px; padding: 6px 8px; }
  .decos { display: flex; gap: 12px; padding: 4px 10px; }
  .decos span { padding: 1px 6px; }
  .hl { padding: 2px 8px; }
  .kv { width: 100%; border-collapse: collapse; background: var(--pt-window-bg); color: var(--pt-window-fg); font-size: 9pt; }
  .kv th, .kv td { text-align: left; padding: 3px 8px; border-bottom: 1px solid var(--pt-window-inactive); font-weight: 400; vertical-align: top; }
  .kv th { color: var(--pt-window-inactive); font-family: monospace; white-space: nowrap; }
  .kv td { font-family: monospace; overflow-wrap: anywhere; }
  .kv td.why { font-family: var(--pt-font); color: var(--pt-window-inactive); }
  code { font-family: monospace; }
</style>
