<script lang="ts">
  /* VLC 3.x Qt interface: a main window (video, seek bar, toolbar, playlist),
   * the shiny-vs-plain seek/volume sliders, and the fullscreen controller
   * overlay's opacity. Window chrome comes from the KDE colour model VLC's
   * Qt5 window really reads through plasma-integration-qt5 (vlc/README.md);
   * only the toolbar layout and the three vlcrc keys are VLC's own files. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, laneVars, findItem, SEEK_SHINY_BLUE, type VlcModel } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'VLC 3.0.x *_TB_DEFAULT + qt.cpp defaults', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'vlc-qt-interface.ini + vlcrc.ini', style: laneVars(ours), model: ours }
  };

  const coverage = () =>
    iniCoverage(
      [
        { label: 'vlc-qt-interface.ini', doc: ours.toolbar },
        { label: 'vlcrc.ini', doc: ours.vlcrc }
      ],
      {}
    );

  /* Short glyphs for the layout specimens -- not VLC's own icon assets (those
     are SVGs under an icon licence this repo does not vendor), just enough to
     read the button order the toolbar strings decode to. */
  const GLYPH: Record<number, string> = {
    0: '▶', 1: '■', 2: '⏏', 3: '⏮', 4: '⏭', 5: '≪', 6: '≫',
    7: '⛶', 8: '⤡', 9: '☰', 10: '▤', 11: '◍', 12: '●', 13: 'AB',
    14: '⧉', 19: '⇄', 20: '↻', 25: '▭', 37: '≡', 38: 'TXT'
  };

  const keyRows: [string, string][] = [
    ['vlc-qt-interface.ini', 'MainWindow/MainToolbar1'], ['vlc-qt-interface.ini', 'MainWindow/MainToolbar2'],
    ['vlc-qt-interface.ini', 'MainWindow/AdvToolbar'], ['vlc-qt-interface.ini', 'MainWindow/InputToolbar'],
    ['vlc-qt-interface.ini', 'MainWindow/FSCtoolbar'], ['vlc-qt-interface.ini', 'MainWindow/FSCToolbar'],
    ['vlcrc.ini', 'qt/qt-dark-palette'], ['vlcrc.ini', 'qt/qt-fs-opacity'], ['vlcrc.ini', 'qt/qt-slider-colours']
  ];
  const rawValue = (lane: Lane<VlcModel>, file: string, path: string) => {
    const [group, key] = path.split('/');
    const doc = file === 'vlcrc.ini' ? lane.model.vlcrc : lane.model.toolbar;
    return doc.get(group, key) ?? '—';
  };
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="window" title="Main window" lead="Video area, seek bar (InputToolbar), advanced row (MainToolbar1) and main row (MainToolbar2), playlist" min="620px">
    <DPair name="video + seek + toolbar" span="full" note="Row order: InputToolbar (time elapsed / seek slider / time remaining) sits directly above MainToolbar1 (advanced row, hidden unless Ctrl+Alt+A -- rendered here for coverage) and MainToolbar2 (the visible control row).">
      {#snippet children(lane: Lane<VlcModel>)}
        <div class="vlc-window">
          <div class="vlc-title"><span class="tbtn"></span><span class="tt">sage-ink-trailer.mp4 - VLC media player</span><span class="tbtn"></span></div>
          <div class="video">No video</div>
          <div class="seek-row">
            {#each lane.model.inputToolbar as item, i (i)}
              {#if item.id === 43}<span class="time">00:47</span>
              {:else if item.id === 44}<span class="time">-01:12</span>
              {:else if item.id === 33}
                <div class="slider seek" class:shiny={item.shiny} style={item.shiny ? `--fill:${SEEK_SHINY_BLUE}` : ''}>
                  <div class="fill" style="width:38%"></div>
                </div>
              {/if}
            {/each}
          </div>
          <div class="tb-row adv" data-testid="mtb1">
            {#each lane.model.mainToolbar1 as item, i (i)}
              {#if item.kind === 'spacer'}<span class="gap"></span>
              {:else if item.kind === 'spacer-extend'}<span class="grow"></span>
              {:else if item.id === 39}
                <div class="adv-inline" title="Advanced controller (AdvToolbar)">
                  {#each lane.model.advToolbar as a, j (j)}<span class="chip" title={a.label}>{GLYPH[a.id] ?? a.id}</span>{/each}
                </div>
              {:else}<span class="chip" title={item.label}>{GLYPH[item.id] ?? item.label}</span>
              {/if}
            {/each}
          </div>
          <div class="tb-row main" data-testid="mtb2">
            {#each lane.model.mainToolbar2 as item, i (i)}
              {#if item.kind === 'spacer'}<span class="gap"></span>
              {:else if item.kind === 'spacer-extend'}<span class="grow"></span>
              {:else if item.id === 35}
                <div class="slider volume" class:shiny={item.shiny}>
                  {#if item.shiny}
                    <div class="grad" style="background:linear-gradient(to right,var(--vlc-stop-0),var(--vlc-stop-1) 45%,var(--vlc-stop-2) 55%,var(--vlc-stop-3))"></div>
                  {:else}
                    <div class="fill" style="width:60%"></div>
                  {/if}
                </div>
              {:else}<span class="chip" class:big={item.big} title={item.label}>{GLYPH[item.id] ?? item.label}</span>
              {/if}
            {/each}
          </div>
          <div class="playlist">
            <div class="pl-row">Sage Ink -- launch trailer.mp4</div>
            <div class="pl-row sel">indigo-glass demo reel.mkv</div>
            <div class="pl-row">grub-theme walkthrough.webm</div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="sliders" title="Seek bar and volume" lead="SeekStyle paints a hardcoded QColor(50,156,255) gradient; the shiny volume triangle gradient comes from qt-slider-colours (4 RGB stops). Dropping WIDGET_SHINY (option bit 0x4) makes both plain QSliders styled by the Qt style from the KDE palette." min="380px">
    <DPair name="seek slider" note="Stock: SeekStyle foreground gradient QColor(50,156,255) -> darker(140), over a darker(140) window-colour groove. Ours: flat accent fill, groove from the button surface -- no literal colour.">
      {#snippet children(lane: Lane<VlcModel>)}
        {@const item = findItem(lane.model.inputToolbar, 33)}
        <div class="pane">
          <div class="slider seek wide" class:shiny={item?.shiny} style={item?.shiny ? `--fill:${SEEK_SHINY_BLUE}` : ''}>
            <div class="fill" style="width:38%"></div>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="volume slider" note="Stock: SoundSlider's 4-stop gradient (green / green / yellow / red from qt-slider-colours). Ours: codegen sets all four stops to the accent hex, so even a re-enabled shiny slider paints flat.">
      {#snippet children(lane: Lane<VlcModel>)}
        {@const item = findItem(lane.model.mainToolbar2, 35)}
        <div class="pane">
          <div class="slider volume wide" class:shiny={item?.shiny}>
            {#if item?.shiny}
              <div class="grad" style="background:linear-gradient(to right,var(--vlc-stop-0),var(--vlc-stop-1) 45%,var(--vlc-stop-2) 55%,var(--vlc-stop-3))"></div>
            {:else}
              <div class="fill" style="width:70%"></div>
            {/if}
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="fsc" title="Fullscreen controller" lead="FullscreenControllerWidget::setWindowOpacity(qt-fs-opacity) applies to the whole overlay -- InputToolbar's seek row, then FSCtoolbar's buttons. Stock default is 0.8; Sage Ink pins opacity.window_active = 1.0." min="360px">
    <DPair name="overlay" span="full" note="The opacity band across the top shows the panel's own alpha; the ours lane must read fully opaque.">
      {#snippet children(lane: Lane<VlcModel>)}
        <div class="fsc-wrap">
          <div class="fsc" style="opacity:var(--vlc-fs-opacity)">
            <div class="seek-row">
              {#each lane.model.inputToolbar as item, i (i)}
                {#if item.id === 43}<span class="time">00:47</span>
                {:else if item.id === 44}<span class="time">-01:12</span>
                {:else if item.id === 33}
                  <div class="slider seek" class:shiny={item.shiny} style={item.shiny ? `--fill:${SEEK_SHINY_BLUE}` : ''}><div class="fill" style="width:38%"></div></div>
                {/if}
              {/each}
            </div>
            <div class="tb-row main">
              {#each lane.model.fscToolbar as item, i (i)}
                {#if item.kind === 'spacer'}<span class="gap"></span>
                {:else if item.kind === 'spacer-extend'}<span class="grow"></span>
                {:else if item.id === 35}
                  <div class="slider volume" class:shiny={item.shiny}>
                    {#if item.shiny}<div class="grad" style="background:linear-gradient(to right,var(--vlc-stop-0),var(--vlc-stop-1) 45%,var(--vlc-stop-2) 55%,var(--vlc-stop-3))"></div>
                    {:else}<div class="fill" style="width:60%"></div>{/if}
                  </div>
                {:else if item.id === 34}<span class="time">-01:12</span>
                {:else}<span class="chip" class:big={item.big} title={item.label}>{GLYPH[item.id] ?? item.label}</span>
                {/if}
              {/each}
            </div>
          </div>
        </div>
        <p class="opacity-readout">qt-fs-opacity: <code>{lane.model.fsOpacity.toFixed(2)}</code>{lane.model.fsOpacity === 1 ? ' (opaque)' : ' (translucent)'}. FSCtoolbar and FSCToolbar both read <code>{lane.model.fscToolbar.length === lane.model.fscToolbarAlt.length ? 'the same layout' : 'different layouts'}</code>.</p>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="Shipped keys" lead="Every key vlc-qt-interface.ini and vlcrc.ini set, literally" min="560px">
    <DPair name="raw values" span="full">
      {#snippet children(lane: Lane<VlcModel>)}
        <table class="fonts">
          <tbody>
            {#each keyRows as [file, path]}
              <tr><th>{file} [{path}]</th><td class="fam">{rawValue(lane, file, path)}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .vlc-window { width: 100%; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); border: 1px solid var(--k-frame); }
  .vlc-title { display: flex; align-items: center; gap: 8px; padding: 5px 8px; font-size: var(--host-title-pt); background: var(--k-wm-activeBackground); color: var(--k-wm-activeForeground); }
  .tt { flex: 1; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tbtn { width: 12px; height: 12px; border: 2px solid currentColor; border-radius: 50%; flex-shrink: 0; }
  .video { height: 90px; display: flex; align-items: center; justify-content: center; background: #000000; color: #5a5a5a; font-size: 9pt; } /* drift-allow: the video canvas is always rendered black by Qt's video output, independent of any palette */
  .seek-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; }
  .time { font-family: monospace; font-size: 8.5pt; color: var(--k-window-inactive); white-space: nowrap; }
  .slider { position: relative; height: 8px; border-radius: 2px; background: var(--vlc-groove); overflow: hidden; flex: 1; }
  .slider.wide { min-width: 220px; }
  .slider .fill { position: absolute; inset: 0 auto 0 0; background: var(--vlc-slider-fill); }
  .slider.seek.shiny .fill { background: linear-gradient(to bottom, var(--fill), color-mix(in srgb, var(--fill) 60%, black)); }
  .slider.volume { width: 85px; height: 14px; clip-path: polygon(0 100%, 100% 0, 100% 100%); background: var(--vlc-groove); }
  .slider.volume .grad { position: absolute; inset: 0; }
  .slider.volume .fill { position: absolute; inset: 0 auto 0 0; background: var(--vlc-slider-fill); }
  .tb-row { display: flex; align-items: center; gap: 3px; padding: 4px 8px; background: var(--k-button-bg); }
  .tb-row.adv { font-size: 8.5pt; color: var(--k-window-inactive); }
  .gap { width: 10px; flex-shrink: 0; }
  .grow { flex: 1; }
  .chip { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 4px; border: 1px solid var(--k-frame); background: var(--k-button-bg); color: var(--k-button-fg); border-radius: 3px; font-size: 10pt; }
  .chip.big { min-width: 28px; height: 28px; font-size: 13pt; }
  .adv-inline { display: inline-flex; gap: 3px; padding: 2px; border: 1px dashed var(--k-frame); border-radius: 3px; }
  .playlist { border-top: 1px solid var(--k-frame); background: var(--k-view-bg); color: var(--k-view-fg); }
  .pl-row { padding: 4px 10px; }
  .pl-row.sel { background: var(--k-selection-bg); color: var(--k-selection-fg); }
  .pane { display: flex; gap: 10px; align-items: center; padding: 14px; width: 100%; background: var(--k-window-bg); }
  .fsc-wrap { width: 100%; padding: 16px; background: var(--k-window-alt); }
  .fsc { border: 1px solid var(--k-frame); border-radius: 4px; padding: 4px 6px; background: var(--k-window-bg); }
  .opacity-readout { width: 100%; margin: 6px 0 0; padding: 0 8px; font-size: 8.5pt; color: var(--k-window-inactive); }
  .fonts { width: 100%; border-collapse: collapse; background: var(--k-window-bg); color: var(--k-window-fg); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--k-frame); font-weight: 400; }
  .fonts th { color: var(--k-window-inactive); font-family: monospace; font-size: 9pt; white-space: nowrap; }
  .fam { font-family: monospace; font-size: 9pt; }
</style>
