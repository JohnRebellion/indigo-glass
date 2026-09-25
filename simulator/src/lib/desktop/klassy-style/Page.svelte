<script lang="ts">
  /* Klassy widget style vs stock Breeze: item views (Tier C outline vs
   * Breeze fill), menus/tooltips (frame, shadow, selected/disabled items),
   * a line edit's text selection, then the controls none of the three
   * patches touch (buttons, check/radio, tabs, scrollbars, sliders,
   * progress, group box) — same Breeze metrics both lanes, palette only. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { stock, ours, stockVars, oursVars, klassyrc, coverage, markHunk, type KdeModel } from './model';

  /* Every hunk this page's specimens demonstrate. Called at module init, not
     conditionally, because every specimen below is unconditionally rendered
     (the view toggle hides a LANE, never a specimen) — see model.ts. */
  for (const id of [
    'tierc.itemViewPalette', 'tierc.focusRectColor', 'tierc.itemFillOutline', 'tierc.menuItemOutline', 'tierc.focusRectWidth',
    'menu.frameOutline', 'menu.tooltipOutline', 'menu.frameWidth', 'menu.shadowParams', 'menu.shadowTiles',
    'selection.editText'
  ] as const)
    markHunk(id);

  const lanes = {
    stock: { which: 'stock' as const, label: 'Breeze (unpatched) + BreezeDark.colors', style: stockVars, model: stock },
    ours: { which: 'ours' as const, label: 'Klassy (3 patches) + SageInk.colors', style: oursVars, model: ours }
  };

  /* [Style] MenuOpacity is the one widget-style key in klassyrc; touch it so
     coverage sees it read, and show Breeze's own compiled default beside it
     (kstyle/breeze.kcfg, plasma/breeze master, fetched 2026-09-25). */
  const menuOpacity = klassyrc.get('Style', 'MenuOpacity') ?? '100';
  const globalMeta: [string, string][] = [
    ['LookAndFeelSet', klassyrc.get('Global', 'LookAndFeelSet') ?? '—'],
    ['RefreshedConfig', klassyrc.get('Global', 'RefreshedConfig') ?? '—']
  ];
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} coverage={() => coverage()}>
  <Section id="itemviews" title="Item views" lead="Normal / hover / selected / selected+hover / focused — Breeze fills Selection; Klassy (tierc-outline.patch) outlines 2px and drops the fill" min="280px">
    <DPair name="list rows" span="full" note="polish() remaps QAbstractItemView's HighlightedText to Text so the Klassy label stays legible once the fill is gone (tierc.itemViewPalette). Breeze's own selected+hover lightens the fill further (Focus_LightenColorValue); the patch removes that step for the selected case, so Klassy's selected+hover looks the same as plain selected (tierc.itemFillOutline). Focused row: Breeze draws a 1px cosmetic HighlightColor.lighter(110) ring; Klassy fixes the colour to Qt::white and the pen to 2px (tierc.focusRectColor, tierc.focusRectWidth).">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="rows" data-style={lane.model.style}>
          <div class="row">Documents</div>
          <div class="row hov">Downloads</div>
          <div class="row sel">Pictures</div>
          <div class="row sel hov">Music</div>
          <div class="row foc">Videos</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="menus" title="Menus and tooltip" lead="Frame, corner sharpness and shadow per menu-tooltip-ink.patch's s_shadowParams/shadowTiles; selected/hovered item and separators per tierc-outline.patch's drawMenuItemControl" min="260px">
    <DPair name="menu" note="Frame outline: Breeze blends Window/WindowText (var(--k-frame), same maths as kde-colors' frameContrast); Klassy shipped literal black here (menu.frameOutline) — fixed in this pass to border_strong after it measured 1.08:1 against this fill (see the role table). Shadow: Breeze blurs 12px/6px at 0.26/0.16 alpha, 3px down (menu.shadowParams); Klassy discards the blur and paints a hard 4,4 offset opaque block (menu.shadowTiles) — approximated here with a CSS blur filter on an opaque fill, since this page's own ink-contract lint forbids a literal alpha shadow in its source.">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="popshadow">
          <div class="popshadow-bg" data-style={lane.model.style}></div>
          <div class="menu" data-style={lane.model.style}>
            <div class="mi">New Tab</div>
            <div class="mi hov">Open Recent</div>
            <div class="mi sel">Split View</div>
            <div class="sep"></div>
            <div class="mi dis">Unavailable</div>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="tooltip" note="Same frame fix as the menu (menu.tooltipOutline): Breeze blends ToolTipBase/ToolTipText; Klassy's literal black is fixed here to border_strong.">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="tip" data-style={lane.model.style}>Show hidden files <span class="kbd">Alt+.</span></div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="lineedit" title="Line edit" lead="selection-text.patch: HighlightedText picks whichever of Text/Base contrasts more with the Highlight fill" min="320px">
    <DPair name="text selection" span="full" note="selection.editText — Breeze uses Colors:Selection ForegroundNormal unconditionally; Klassy recomputes per edit widget so the label reads against the real fill, not just whatever the colour scheme declared.">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="pane">
          <div class="edit" data-style={lane.model.style}>Rename to <span class="tsel">sage-ink-final</span>.png</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="unpatched" title="Not touched by these three patches" lead="Buttons, checkboxes/radios, tabs, scrollbars, sliders, progress bars and group boxes keep Breeze's own metrics in both lanes — only the KDE palette differs" min="220px">
    <DPair name="buttons">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="pane" data-style={lane.model.style}>
          <button class="kbtn" type="button">Normal</button>
          <button class="kbtn hover" type="button">Hover</button>
          <button class="kbtn focus" type="button">Focus</button>
          <button class="kbtn pressed" type="button">Pressed</button>
          <button class="kbtn default" type="button">Default</button>
          <button class="kbtn" type="button" disabled>Disabled</button>
        </div>
      {/snippet}
    </DPair>
    <DPair name="checkboxes / radios">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="pane" data-style={lane.model.style}>
          <label class="cb"><span class="box"></span>Unchecked</label>
          <label class="cb on"><span class="box"></span>Checked</label>
          <label class="rb"><span class="dot"></span>Option A</label>
          <label class="rb on"><span class="dot"></span>Option B</label>
        </div>
      {/snippet}
    </DPair>
    <DPair name="tabs">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="tabs" data-style={lane.model.style}>
          <div class="tab on">General</div><div class="tab">Advanced</div><div class="tab">Plugins</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="scrollbar">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="track" data-style={lane.model.style}><div class="thumb"></div></div>
      {/snippet}
    </DPair>
    <DPair name="slider">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="slider" data-style={lane.model.style}><div class="fill"></div><div class="handle"></div></div>
      {/snippet}
    </DPair>
    <DPair name="progress bar">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="progress" data-style={lane.model.style}><div class="pfill"></div></div>
      {/snippet}
    </DPair>
    <DPair name="group box" span="full">
      {#snippet children(lane: Lane<KdeModel>)}
        <fieldset class="gbox" data-style={lane.model.style}>
          <legend>Options</legend>
          <label class="cb on"><span class="box"></span>Enable feature</label>
        </fieldset>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="klassyrc [Style]" lead="The one widget-style key; Breeze's own compiled default is quoted from kstyle/breeze.kcfg (plasma/breeze master, invent.kde.org, fetched 2026-09-25)" min="360px">
    <DPair name="MenuOpacity" span="full">
      {#snippet children()}
        <table class="fonts">
          <tbody>
            <tr><th>[Style] MenuOpacity</th><td class="fam">Breeze default: 100</td><td>klassyrc: {menuOpacity}</td>
              <td>{menuOpacity === '100' ? 'opaque path taken in both lanes — the <100 alpha branch in drawPanelMenuPrimitive/drawPanelTipLabelPrimitive never runs' : 'DRIFT — Klassy would take the translucent branch this design forbids'}</td></tr>
            {#each globalMeta as [k, v]}
              <tr><th>[Global] {k}</th><td class="fam" colspan="3">{v}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .rows { width: 100%; background: var(--k-view-bg); color: var(--k-view-fg); font-family: var(--k-font); border: 1px solid var(--k-frame); }
  .row { padding: 4px 10px; margin: 1px 0; }
  .row.hov { background: color-mix(in srgb, var(--k-selection-bg) 30%, transparent); } /* transient hover wash, allowed by STATE_GRAMMAR.md regardless of tier */
  [data-style='Breeze'] .row.sel { background: var(--k-selection-bg); color: var(--k-selection-fg); }
  [data-style='Breeze'] .row.sel.hov { background: color-mix(in srgb, var(--k-selection-bg) 60%, white 40%); } /* stock: color.lighter(Focus_LightenColorValue) over-brightens selected+hover */
  [data-style='Breeze'] .row.foc { outline: 1px solid color-mix(in srgb, var(--k-selection-bg) 70%, white 30%); outline-offset: -1px; }
  [data-style='Klassy'] .row.sel { background: transparent; color: var(--k-view-fg); outline: 2px solid #FFFFFF; outline-offset: -2px; } /* drift-allow: Qt::white hardcoded in tierc-outline.patch drawPanelItemViewItemPrimitive */
  [data-style='Klassy'] .row.sel.hov { background: transparent; color: var(--k-view-fg); outline: 2px solid #FFFFFF; outline-offset: -2px; } /* drift-allow: patch removes the over-lighten step for selected+hover; same outline as plain selected */
  [data-style='Klassy'] .row.foc { outline: 2px solid #FFFFFF; outline-offset: -2px; } /* drift-allow: Qt::white + 2px pen, drawFrameFocusRectPrimitive/renderFocusRect */

  .popshadow { position: relative; display: inline-block; }
  .popshadow-bg { position: absolute; inset: 0; background: var(--ig-border-strong); z-index: -1; }
  [data-style='Breeze'] .popshadow-bg { top: 3px; filter: blur(5px); } /* drift-allow: stock Breeze shadow depiction on an opaque fill, QPoint(0,3) offset, 12px/6px blur radii (breezeshadowhelper.cpp pre-patch) */
  [data-style='Klassy'] .popshadow-bg { top: 4px; left: 4px; } /* menu.shadowParams: hard QPoint(4,4), no blur (menu.shadowTiles) */
  .menu { position: relative; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font-menu); font-size: var(--host-menu-pt); padding: 4px 0; min-width: 180px; }
  [data-style='Breeze'] .menu { border: 1px solid var(--k-frame); border-radius: 6px; } /* stock: renderMenuFrame 1px cosmetic pen, roundCorners=hasAlpha under any compositor */
  [data-style='Klassy'] .menu { border: 2px solid var(--ig-border-strong); border-radius: 0; } /* menu.frameOutline fixed to border_strong; menu.frameWidth: 2px pen; sharp corners (roundCorners=false) */
  .mi { padding: 3px 14px; margin: 0 4px; }
  .mi.hov { background: color-mix(in srgb, var(--k-selection-bg) 30%, transparent); }
  [data-style='Breeze'] .mi.sel { background: color-mix(in srgb, var(--k-selection-bg) 80%, transparent); }
  [data-style='Klassy'] .mi.sel { background: transparent; outline: 2px solid #FFFFFF; outline-offset: -2px; } /* drift-allow: Qt::white, drawMenuItemControl (tierc.menuItemOutline) */
  .mi.dis { color: var(--k-disabled-fg); }
  .sep { height: 1px; margin: 4px 0; background: var(--k-frame); }
  .tip { position: relative; background: var(--k-tooltip-bg); color: var(--k-tooltip-fg); padding: 4px 8px; font-family: var(--k-font); }
  [data-style='Breeze'] .tip { border: 1px solid var(--k-frame); border-radius: 4px; }
  [data-style='Klassy'] .tip { border: 2px solid var(--ig-border-strong); border-radius: 0; } /* menu.tooltipOutline + menu.frameWidth */
  .kbd { color: var(--k-tooltip-inactive, var(--k-tooltip-fg)); margin-left: 8px; }

  .pane { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 12px; width: 100%; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); }
  .edit { background: var(--k-view-bg); color: var(--k-view-fg); border: 1px solid var(--k-frame); padding: 4px 8px; min-width: 260px; }
  .tsel { background: var(--k-selection-bg); color: var(--k-edit-selection-fg); }

  .kbtn { background: var(--k-button-bg); color: var(--k-button-fg); border: 1px solid var(--k-frame); padding: 3px 10px; font: inherit; border-radius: 3px; }
  .kbtn.hover { border-color: var(--k-button-hover); }
  .kbtn.focus { outline: 2px solid var(--k-button-focus); outline-offset: 1px; }
  .kbtn.pressed { background: var(--k-selection-bg); color: var(--k-selection-fg); }
  .kbtn.default { border-width: 2px; font-weight: 700; }
  .kbtn:disabled { background: var(--k-disabled-bg); color: var(--k-disabled-fg); }

  .cb, .rb { display: flex; align-items: center; gap: 6px; }
  .box { width: 14px; height: 14px; border: 1px solid var(--k-frame); background: var(--k-view-bg); }
  .cb.on .box { background: var(--k-selection-bg); border-color: var(--k-selection-bg); }
  .dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--k-frame); background: var(--k-view-bg); }
  .rb.on .dot { box-shadow: inset 0 0 0 3px var(--k-view-bg); background: var(--k-selection-bg); border-color: var(--k-selection-bg); }

  .tabs { display: flex; width: 100%; border-bottom: 1px solid var(--k-frame); }
  .tab { padding: 4px 12px; color: var(--k-window-inactive); }
  .tab.on { color: var(--k-window-fg); border-bottom: 2px solid var(--k-selection-bg); }

  .track { width: 100%; height: 12px; background: var(--k-view-bg); border: 1px solid var(--k-frame); position: relative; }
  .thumb { position: absolute; top: 1px; bottom: 1px; left: 20%; width: 30%; background: var(--k-button-hover); }

  .slider { width: 100%; height: 16px; position: relative; display: flex; align-items: center; }
  .slider .fill { position: absolute; left: 0; right: 40%; height: 3px; background: var(--k-selection-bg); }
  .slider .handle { position: absolute; left: 60%; width: 12px; height: 12px; border-radius: 50%; background: var(--k-button-bg); border: 1px solid var(--k-frame); }

  .progress { width: 100%; height: 10px; background: var(--k-view-bg); border: 1px solid var(--k-frame); }
  .pfill { width: 55%; height: 100%; background: var(--k-selection-bg); }

  .gbox { width: 100%; border: 1px solid var(--k-frame); border-radius: 3px; padding: 10px; margin: 0; background: var(--k-window-bg); color: var(--k-window-fg); }
  .gbox legend { padding: 0 4px; color: var(--k-window-inactive); }

  .fonts { width: 100%; border-collapse: collapse; background: var(--k-window-bg); color: var(--k-window-fg); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--k-frame); font-weight: 400; }
  .fonts th { color: var(--k-window-inactive); font-family: monospace; font-size: 9pt; white-space: nowrap; }
  .fam { font-family: monospace; font-size: 9pt; color: var(--k-window-inactive); white-space: nowrap; }
</style>
