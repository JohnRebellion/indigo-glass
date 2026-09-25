<script lang="ts">
  /* KDE colour scheme: the roles a Qt/KDE app paints, in a Dolphin-shaped
   * window, an inactive window, the seven colour sets, controls, a tooltip
   * and menu, the Complementary set, and the font roles. Selection follows
   * the lane's widgetStyle from kdeglobals: Breeze fills the row with
   * Highlight; Klassy with config/klassy/tierc-outline.patch outlines it in
   * 2px white and leaves the row unfilled. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, laneVars, SETS, ROLE_KEYS, KEY_VARS, type KdeModel } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'BreezeDark.colors + Plasma defaults', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'SageInk.colors + kdeglobals.snippet', style: laneVars(ours), model: ours }
  };
  const coverage = () =>
    iniCoverage(
      [{ label: 'SageInk.colors', doc: ours.colors }, { label: 'kdeglobals.snippet', doc: ours.globals }],
      KEY_VARS,
      [{ token: 'General/ColorScheme', why: 'kdeglobals repeats the .colors id; the settings table shows the .colors copy' }]
    );
  const fontRows: [keyof KdeModel['fonts'], string, string][] = [
    ['font', 'General', 'k-font'], ['fixed', 'General', 'k-font-fixed'], ['menuFont', 'General', 'k-font-menu'],
    ['toolBarFont', 'General', 'k-font-toolbar'], ['smallestReadableFont', 'General', 'k-font-small'], ['activeFont', 'WM', 'k-font-title']
  ];
  const settingRows: [string, string][] = [
    ['General', 'ColorScheme'], ['General', 'Name'], ['General', 'shadeSortColumn'], ['KDE', 'contrast'],
    ['KDE', 'LookAndFeelPackage'], ['KDE', 'widgetStyle'], ['Icons', 'Theme'], ['Appmenu Style', 'Style']
  ];
  const files = ['Documents', 'Downloads', 'Music', 'Pictures', 'projects', 'indigo-glass.tar.zst', 'notes.md'];
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="window" title="Application window" lead="Dolphin-shaped: WM title bar, Header toolbar, Window sidebar, View list, status bar" min="560px">
    <DPair name="active window" span="full" note="Selected row follows widgetStyle: Breeze fills with Selection; Klassy (Tier C patch) draws a 2px white outline over the unfilled row.">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="kw" data-style={lane.model.style}>
          <div class="title act"><span class="tbtn"></span><span class="tt">Home — Dolphin</span><span class="tbtn"></span></div>
          <div class="toolbar">
            <button class="kbtn" type="button">◀</button><button class="kbtn" type="button">▶</button>
            <span class="crumb">/ home / johnn</span><span class="grow"></span>
            <button class="kbtn" type="button">Split</button>
          </div>
          <div class="body">
            <nav class="places">
              <div class="ph">Places</div>
              <div class="pi sel">Home</div><div class="pi">Desktop</div><div class="pi">Documents</div><div class="pi">Trash</div>
              <div class="ph">Remote</div><div class="pi">Network</div>
            </nav>
            <div class="view">
              {#each files as f, i}
                <div class="row" class:alt={i % 2 === 1} class:sel={i === 2} class:hov={i === 4}>{f}<span class="meta">{i * 3 + 2} items</span></div>
              {/each}
              <p class="vtext">Open <a class="lnk" href="#l">the manual</a> or a <a class="vis" href="#v">visited page</a>.
                <span class="pos">Copied</span> · <span class="neu">Low space</span> · <span class="neg">Failed</span></p>
            </div>
          </div>
          <div class="status">7 folders, 2 files <span class="dim">(1.2 GiB)</span></div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="inactive window" note="WM inactive colours, the Header [Inactive] subgroup and the Inactive colour effect.">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="kw inactive" data-style={lane.model.style}>
          <div class="title ina"><span class="tbtn"></span><span class="tt">Konsole</span><span class="tbtn"></span></div>
          <div class="toolbar hi"><span class="crumb">Header, window unfocused</span></div>
          <div class="ib">Window content under the Inactive effect</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="WM blend colours" note="activeBlend / inactiveBlend are read by decorations that blend the title bar; Breeze and Klassy do not use them.">
      {#snippet children()}
        <div class="blend"><span style="background:var(--k-wm-activeBlend)"></span>activeBlend</div>
        <div class="blend"><span style="background:var(--k-wm-inactiveBlend)"></span>inactiveBlend</div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="sets" title="Colour sets" lead="Every role of every set, as the System Settings colour editor lists them" min="330px">
    {#each SETS as s}
      {@const k = s.toLowerCase()}
      <DPair name={s}>
        {#snippet children()}
          <div class="set" style="background:var(--k-{k}-bg);color:var(--k-{k}-fg)">
            <div class="altrow" style="background:var(--k-{k}-alt)">Alternate background</div>
            <div class="roles">
              <span>Normal</span>
              <span style="color:var(--k-{k}-inactive)">Inactive</span>
              <span style="color:var(--k-{k}-active)">Active</span>
              <span style="color:var(--k-{k}-link);text-decoration:underline">Link</span>
              <span style="color:var(--k-{k}-visited);text-decoration:underline">Visited</span>
              <span style="color:var(--k-{k}-negative)">Negative</span>
              <span style="color:var(--k-{k}-neutral)">Neutral</span>
              <span style="color:var(--k-{k}-positive)">Positive</span>
            </div>
            <div class="decos">
              <span style="outline:2px solid var(--k-{k}-focus)">Focus</span>
              <span style="outline:2px solid var(--k-{k}-hover)">Hover</span>
            </div>
          </div>
        {/snippet}
      </DPair>
    {/each}
    <DPair name="Header [Inactive]">
      {#snippet children()}
        <div class="set" style="background:var(--k-header-inactive-bg);color:var(--k-header-inactive-fg)">
          <div class="altrow" style="background:var(--k-header-inactive-alt)">Alternate background</div>
          <div class="roles">
            <span>Normal</span>
            <span style="color:var(--k-header-inactive-inactive)">Inactive</span>
            <span style="color:var(--k-header-inactive-active)">Active</span>
            <span style="color:var(--k-header-inactive-link);text-decoration:underline">Link</span>
            <span style="color:var(--k-header-inactive-visited);text-decoration:underline">Visited</span>
            <span style="color:var(--k-header-inactive-negative)">Negative</span>
            <span style="color:var(--k-header-inactive-neutral)">Neutral</span>
            <span style="color:var(--k-header-inactive-positive)">Positive</span>
          </div>
          <div class="decos">
            <span style="outline:2px solid var(--k-header-inactive-focus)">Focus</span>
            <span style="outline:2px solid var(--k-header-inactive-hover)">Hover</span>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="controls" title="Controls" lead="Button states, the disabled effect, and text selection in a line edit" min="420px">
    <DPair name="buttons">
      {#snippet children()}
        <div class="pane">
          <button class="kbtn" type="button">Normal</button>
          <button class="kbtn hover" type="button">Hover</button>
          <button class="kbtn focus" type="button">Focus</button>
          <button class="kbtn disabled" type="button" disabled>Disabled</button>
        </div>
      {/snippet}
    </DPair>
    <DPair name="line edit" note="Klassy lane: the selection-text patch picks whichever of View text/base contrasts more with the fill.">
      {#snippet children()}
        <div class="pane"><div class="edit">Rename to <span class="tsel">sage-ink-final</span>.png</div></div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="popups" title="Tooltip, menu, Complementary" lead="Tooltip set; a menu in the menu font; the Complementary set Plasma uses for dark-on-light inversions and OSDs" min="360px">
    <DPair name="tooltip">
      {#snippet children()}
        <div class="tip">Show hidden files <span class="kbd">Alt+.</span></div>
      {/snippet}
    </DPair>
    <DPair name="menu">
      {#snippet children(lane: Lane<KdeModel>)}
        <div class="menu" data-style={lane.model.style}>
          <div class="mi">New Tab</div><div class="mi sel">Split View</div><div class="mi">Settings</div><div class="mi dis">Unavailable</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="Complementary">
      {#snippet children()}
        <div class="comp">Volume 60% <span class="bar"><span></span></span></div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="fonts" title="Font roles" lead="Families and point sizes from kdeglobals, rendered at the selected host's scale" min="560px">
    <DPair name="fonts" span="full">
      {#snippet children(lane: Lane<KdeModel>)}
        <table class="fonts">
          <tbody>
            {#each fontRows as [key, _group, v]}
              {@const f = lane.model.fonts[key]}
              <tr><th>{key}</th><td class="fam">{f.family} {f.pt}pt</td>
                <td style="font-family:var(--{v});font-size:calc({f.pt}pt * var(--host-scale));font-weight:{key === 'activeFont' ? 'var(--k-title-weight)' : 400}">The quick brown fox 0O1lI</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="scheme settings" span="full" note="Non-colour keys, shown literally. Stock lane shows Breeze's value where it sets one.">
      {#snippet children(lane: Lane<KdeModel>)}
        <table class="fonts">
          <tbody>
            {#each settingRows as [g, k]}
              <tr><th>[{g}] {k}</th><td class="fam">{lane.model.colors.get(g, k) ?? lane.model.globals.get(g, k) ?? '—'}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .kw { width: 100%; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); border: 1px solid var(--k-frame); }
  .title { display: flex; align-items: center; gap: 8px; padding: 5px 8px; font-family: var(--k-font-title); font-weight: var(--k-title-weight); font-size: var(--host-title-pt); }
  .title.act { background: var(--k-wm-activeBackground); color: var(--k-wm-activeForeground); }
  .title.ina { background: var(--k-wm-inactiveBackground); color: var(--k-wm-inactiveForeground); }
  .tt { flex: 1; text-align: center; }
  .tbtn { width: 12px; height: 12px; border: 2px solid currentColor; border-radius: 50%; }
  .toolbar { display: flex; align-items: center; gap: 6px; padding: 5px 8px; background: var(--k-header-bg); color: var(--k-header-fg); font-family: var(--k-font-toolbar); font-size: var(--host-toolbar-pt); border-bottom: 1px solid var(--k-frame); }
  .toolbar.hi { background: var(--k-header-inactive-bg); color: var(--k-header-inactive-fg); }
  .crumb { color: inherit; }
  .grow { flex: 1; }
  .kbtn { background: var(--k-button-bg); color: var(--k-button-fg); border: 1px solid var(--k-frame); padding: 3px 10px; font: inherit; border-radius: 3px; }
  .kbtn.hover { border-color: var(--k-button-hover); }
  .kbtn.focus { outline: 2px solid var(--k-button-focus); outline-offset: 1px; }
  .kbtn.disabled { background: var(--k-disabled-bg); color: var(--k-disabled-fg); }
  .body { display: grid; grid-template-columns: 140px 1fr; min-height: 190px; }
  .places { background: var(--k-window-bg); padding: 6px 0; border-right: 1px solid var(--k-frame); }
  .ph { padding: 4px 10px 2px; color: var(--k-window-inactive); font-size: var(--host-small-pt); font-family: var(--k-font-small); }
  .pi { padding: 3px 10px; margin: 1px 4px; }
  .view { background: var(--k-view-bg); color: var(--k-view-fg); padding: 4px; }
  .row { display: flex; justify-content: space-between; padding: 3px 8px; margin: 1px 0; }
  .row.alt { background: var(--k-view-alt); }
  .meta { color: var(--k-view-inactive); }
  .vtext { margin: 10px 8px 4px; }
  .lnk { color: var(--k-view-link); }
  .vis { color: var(--k-view-visited); }
  .pos { color: var(--k-view-positive); } .neu { color: var(--k-view-neutral); } .neg { color: var(--k-view-negative); }
  .status { padding: 3px 8px; border-top: 1px solid var(--k-frame); background: var(--k-window-alt); font-size: var(--host-small-pt); }
  .dim { color: var(--k-window-inactive); }
  /* Selection per widget style. */
  [data-style='Breeze'] .sel { background: var(--k-selection-bg); color: var(--k-selection-fg); border-radius: 3px; }
  [data-style='Breeze'] .row.hov { background: color-mix(in srgb, var(--k-selection-bg) 30%, transparent); }
  [data-style='Klassy'] .sel { background: transparent; color: var(--k-view-fg); outline: 2px solid #FFFFFF; outline-offset: -2px; } /* drift-allow: Qt::white is hardcoded in config/klassy/tierc-outline.patch */
  [data-style='Klassy'] .row.hov { background: color-mix(in srgb, var(--k-selection-bg) 30%, transparent); }
  .kw.inactive { min-height: 120px; }
  .ib { padding: 12px; background: var(--k-inactive-bg); color: var(--k-inactive-fg); }
  .blend { display: flex; gap: 8px; align-items: center; color: var(--k-window-fg); font-family: monospace; width: 100%; }
  .blend span { width: 60px; height: 14px; }
  .set { width: 100%; padding: 0 0 8px; border: 1px solid var(--k-frame); }
  .altrow { padding: 3px 8px; }
  .roles { display: flex; flex-wrap: wrap; gap: 4px 12px; padding: 6px 8px; }
  .decos { display: flex; gap: 12px; padding: 4px 10px; }
  .decos span { padding: 1px 6px; }
  .pane { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 12px; width: 100%; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); }
  .edit { background: var(--k-view-bg); color: var(--k-view-fg); border: 1px solid var(--k-frame); padding: 4px 8px; min-width: 260px; }
  .tsel { background: var(--k-selection-bg); color: var(--k-edit-selection-fg); }
  .tip { background: var(--k-tooltip-bg); color: var(--k-tooltip-fg); border: 1px solid var(--k-frame); padding: 4px 8px; font-family: var(--k-font); }
  .kbd { color: var(--k-tooltip-inactive); margin-left: 8px; }
  .menu { background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font-menu); font-size: var(--host-menu-pt); border: 1px solid var(--k-frame); padding: 4px 0; min-width: 180px; }
  .mi { padding: 3px 14px; margin: 0 4px; }
  .mi.dis { color: var(--k-disabled-fg); }
  .comp { background: var(--k-complementary-bg); color: var(--k-complementary-fg); padding: 10px 14px; display: flex; gap: 10px; align-items: center; width: 100%; }
  .bar { flex: 1; height: 6px; background: var(--k-complementary-alt); display: block; }
  .bar span { display: block; width: 60%; height: 100%; background: var(--k-complementary-hover); }
  .fonts { width: 100%; border-collapse: collapse; background: var(--k-window-bg); color: var(--k-window-fg); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--k-frame); font-weight: 400; }
  .fonts th { color: var(--k-window-inactive); font-family: monospace; font-size: 9pt; white-space: nowrap; }
  .fam { font-family: monospace; font-size: 9pt; color: var(--k-window-inactive); white-space: nowrap; }
</style>
