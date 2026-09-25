<script lang="ts">
  /* Icon theme: the theme [Icons] Theme names, drawn where KDE draws icons —
   * a Dolphin window (22px toolbar actions, 16px Places, 48px icon view), the
   * 16/22/32/48 size ramp, message widgets and a dialog, and the folder
   * colour against the lane accent. Every SVG is the host's own file,
   * recoloured the way KIconLoader recolours it for that lane's colour scheme.
   * Below the pairs: the colours papirus-folders could switch Papirus to,
   * measured against the Sage Ink accent. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, laneVars, folderCandidates, oklch, hueDelta, GROUPS, SIZES, type IconModel, type IconName, type Size } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'breeze-dark + BreezeDark.colors', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'Papirus-Dark (kdeglobals.snippet) + SageInk.colors', style: laneVars(ours), model: ours }
  };
  const coverage = () =>
    iniCoverage([{ label: 'kdeglobals.snippet', doc: ours.globals }], {}, [
      { token: 'General/*', why: 'colour scheme and font roles: the kde-colors surface owns and renders them' },
      { token: 'KDE/*', why: 'widget style and global theme: rendered on /desktop/kde-colors/' },
      { token: 'Appmenu Style/*', why: 'menu style: rendered on /desktop/kde-colors/' }
    ]);

  const theme = (m: IconModel) => m.globals.get('Icons', 'Theme') ?? '(unset)';
  const places: [IconName, string][] = [['user-home', 'Home'], ['folder-documents', 'Documents'], ['folder-download', 'Downloads'], ['user-trash', 'Trash']];
  const viewItems: [IconName, string][] = [
    ['folder', 'projects'], ['folder-documents', 'Documents'], ['folder-download', 'Downloads'], ['user-home', 'johnn'],
    ['text-x-generic', 'notes.txt'], ['application-pdf', 'invoice.pdf'], ['image-x-generic', 'wall.png'], ['user-trash', 'Trash']
  ];
  const tools: [IconName, string][] = [['list-add', 'New'], ['edit-copy', 'Copy'], ['document-save', 'Save'], ['edit-delete', 'Delete']];
  const messages: [IconName, string][] = [
    ['dialog-information', 'Indexing finished: 2 312 files.'],
    ['dialog-warning', 'Low disk space on /home (6% free).'],
    ['dialog-error', 'Could not mount the network share.']
  ];
  const fmt = (x: number, d = 3) => x.toFixed(d);
  const lchOf = (hex: string | null) => (hex ? oklch(hex) : null);
  const cands = folderCandidates();
  const accent = oklch(ours.colors.accent);
</script>

{#snippet ico(m: IconModel, name: IconName, size: Size)}
  {@const r = m.icon(name, size)}
  <img class="ico" src={r.uri} width={size} height={size} alt={name} title="{r.entry.file}{r.follows ? ' (recoloured)' : ''}" />
{/snippet}

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="dolphin" title="In a file manager" lead="Dolphin-shaped: 22px toolbar actions on the Header set, 16px Places on Window, 48px icon view on View" min="560px">
    <DPair name="Dolphin, icon view" span="full" note="Toolbar and Places glyphs are symbolic (ColorScheme-Text) in both themes, so they take the scheme text. The 48px folders differ: Breeze paints them ColorScheme-Accent (the lane's Selection colour); Papirus hard-codes blue.">
      {#snippet children(lane: Lane<IconModel>)}
        <div class="kw">
          <div class="toolbar">
            {#each tools as [n, l]}<span class="tool">{@render ico(lane.model, n, 22)}<span>{l}</span></span>{/each}
            <span class="grow"></span><span class="crumb">[Icons] Theme={theme(lane.model)}</span>
          </div>
          <div class="body">
            <nav class="places">
              <div class="ph">Places</div>
              {#each places as [n, l]}<div class="pi">{@render ico(lane.model, n, 16)}<span>{l}</span></div>{/each}
            </nav>
            <div class="view">
              {#each viewItems as [n, l]}<div class="item">{@render ico(lane.model, n, 48)}<span>{l}</span></div>{/each}
            </div>
          </div>
          <div class="status">6 folders, 3 files</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="ramp" title="Size ramp" lead="Each size is the file index.theme resolves for it; ↑24 means the theme has no 32/48 file and KIconLoader scales the 24px one" min="560px">
    <DPair name="16 / 22 / 32 / 48 px on the window background" span="full" note="Dot after a name: the SVG carries the current-color-scheme stylesheet and was recoloured for this lane.">
      {#snippet children(lane: Lane<IconModel>)}
        <table class="ramp">
          <thead><tr><th>name</th>{#each SIZES as z}<th>{z}</th>{/each}</tr></thead>
          <tbody>
            {#each Object.entries(GROUPS) as [g, names]}
              <tr class="grp"><td colspan={SIZES.length + 1}>{g}</td></tr>
              {#each names as n}
                <tr>
                  <td class="nm">{n}</td>
                  {#each SIZES as z}
                    {@const r = lane.model.icon(n, z)}
                    <td><span class="cell">{@render ico(lane.model, n, z)}<span class="src">{r.follows ? '•' : ''}{r.entry.dirSize !== z ? `↑${r.entry.dirSize}` : ''}</span></span></td>
                  {/each}
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>

  <Section id="status" title="Status icons" lead="22px in an inline message, 48px in a dialog: the sizes where the two themes disagree most" min="640px">
    <DPair name="inline messages (22px)" note="Frame drawn in the scheme's Window Link/Neutral/Negative colour as a stand-in for KMessageWidget. Papirus's 22px warning glyph is ColorScheme-Text, not NeutralText, so it is not amber.">
      {#snippet children(lane: Lane<IconModel>)}
        <div class="pane">
          {#each messages as [n, t], i}
            <div class="msg" data-kind={i}>{@render ico(lane.model, n, 22)}<span>{t}</span></div>
          {/each}
        </div>
      {/snippet}
    </DPair>
    <DPair name="dialog (48px)" note="At 48px Papirus draws fixed-colour discs (yellow/red/blue) that no colour scheme changes; Breeze's 64px status art is fixed-colour too.">
      {#snippet children(lane: Lane<IconModel>)}
        <div class="dialog">
          <div class="dlg-row">{@render ico(lane.model, 'dialog-warning', 48)}
            <div><strong>Overwrite “notes.txt”?</strong><p>A file with this name already exists in Documents.</p></div>
          </div>
          <div class="dlg-icons">{#each messages as [n]}{@render ico(lane.model, n, 48)}{/each}</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="folder" title="Folder colour against the accent" lead="The largest coloured area an icon theme puts on screen" min="420px">
    <DPair name="folder body vs lane accent" span="full" note="Hue and chroma in OKLCH. Breeze's folder is the accent by construction; Papirus's is whatever folder.svg links to (folder-blue.svg by default).">
      {#snippet children(lane: Lane<IconModel>)}
        {@const body = lane.model.icon('folder', 48).body}
        {@const b = lchOf(body)}
        {@const a = oklch(lane.model.colors.accent)}
        <div class="pane fold">
          {@render ico(lane.model, 'folder', 48)}
          {@render ico(lane.model, 'folder', 32)}
          {@render ico(lane.model, 'folder', 22)}
          <span class="sw" style="background:var(--ic-accent)"></span>
          <dl class="lch">
            <dt>folder</dt><dd>{body ?? 'n/a'}{#if b} · L {fmt(b.L, 2)} C {fmt(b.C)} H {fmt(b.H, 0)}°{/if}</dd>
            <dt>accent</dt><dd>{lane.model.colors.accent} · L {fmt(a.L, 2)} C {fmt(a.C)} H {fmt(a.H, 0)}°</dd>
            <dt>Δhue</dt><dd>{b ? `${fmt(hueDelta(b, a), 0)}°` : 'n/a'}{lane.model.icon('folder', 48).follows ? ' (follows the scheme)' : ' (hard-coded)'}</dd>
          </dl>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <section class="cands" data-testid="papirus-folders">
    <h2>papirus-folders candidates <span class="sub">measured against the Sage Ink accent {ours.colors.accent} (H {fmt(accent.H, 0)}°, C {fmt(accent.C)}), on the Sage Ink window</span></h2>
    <p class="lead">install.sh installs papirus-icon-theme and sets Papirus-Dark but never runs <code>papirus-folders</code>, so folders stay the Papirus default. Sorted by OKLab distance to the accent; contrast is against the window background (non-text floor 3).</p>
    <table>
      <thead><tr><th></th><th>-C colour</th><th>body</th><th>L</th><th>C</th><th>H</th><th>Δhue</th><th>ΔE (OKLab)</th><th>on window</th><th></th></tr></thead>
      <tbody>
        {#each cands as c}
          <tr class:def={c.isDefault}>
            <td class="ci"><img src={c.uri} width="48" height="48" alt="folder-{c.colour}" /></td>
            <td><code>{c.colour}</code></td>
            <td><span class="chip" style="background:{c.fill}"></span>{c.fill}</td>
            <td>{fmt(c.lch.L, 2)}</td><td>{fmt(c.lch.C)}</td><td>{fmt(c.lch.H, 0)}°</td>
            <td>{fmt(c.dH, 0)}°</td><td>{fmt(c.dE)}</td><td>{fmt(c.onWindow, 2)}:1</td>
            <td>{c.isDefault ? 'current (default)' : ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</DesktopPage>

<style>
  .ico { display: block; flex: none; image-rendering: auto; }
  .kw { width: 100%; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); font-size: var(--host-body-pt); border: 1px solid var(--k-frame); }
  .toolbar { display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--k-header-bg); color: var(--k-header-fg); font-size: var(--host-toolbar-pt); font-family: var(--k-font-toolbar); border-bottom: 1px solid var(--k-frame); }
  .tool { display: flex; align-items: center; gap: 5px; padding: 3px 7px; }
  .grow { flex: 1; }
  .crumb { color: var(--k-header-inactive); font-family: var(--k-font-fixed); font-size: var(--host-small-pt); }
  .body { display: grid; grid-template-columns: 150px 1fr; min-height: 200px; }
  .places { padding: 6px 0; border-right: 1px solid var(--k-frame); }
  .ph { padding: 4px 10px 2px; color: var(--k-window-inactive); font-size: var(--host-small-pt); font-family: var(--k-font-small); }
  .pi { display: flex; align-items: center; gap: 6px; padding: 3px 10px; }
  .view { background: var(--k-view-bg); color: var(--k-view-fg); display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px; padding: 10px; align-content: start; }
  .item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px; text-align: center; overflow-wrap: anywhere; }
  .status { padding: 3px 8px; border-top: 1px solid var(--k-frame); background: var(--k-window-alt); font-size: var(--host-small-pt); }
  .ramp { width: 100%; border-collapse: collapse; background: var(--k-window-bg); color: var(--k-window-fg); font-size: var(--host-small-pt); }
  .ramp th, .ramp td { padding: 3px 6px; border-bottom: 1px solid var(--k-frame); text-align: left; font-weight: 400; vertical-align: middle; }
  .ramp th { color: var(--k-window-inactive); font-family: var(--k-font-fixed); }
  .ramp .grp td { color: var(--k-window-inactive); font-family: var(--k-font-fixed); text-transform: uppercase; letter-spacing: 0.05em; padding-top: 8px; }
  .nm { font-family: var(--k-font-fixed); white-space: nowrap; }
  .cell { display: flex; align-items: center; gap: 6px; min-height: 50px; }
  .src { color: var(--k-window-inactive); font-family: var(--k-font-fixed); font-size: 8pt; min-width: 2.5em; }
  .pane { width: 100%; display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); }
  .msg { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 2px solid var(--k-window-link); }
  .msg[data-kind='1'] { border-color: var(--k-window-neutral); }
  .msg[data-kind='2'] { border-color: var(--k-window-negative); }
  .dialog { width: 100%; background: var(--k-window-bg); color: var(--k-window-fg); font-family: var(--k-font); padding: 14px; border: 1px solid var(--k-frame); }
  .dlg-row { display: flex; gap: 14px; align-items: flex-start; }
  .dlg-row p { margin: 4px 0 0; color: var(--k-window-inactive); }
  .dlg-icons { display: flex; gap: 12px; margin-top: 14px; }
  .fold { flex-direction: row; align-items: center; flex-wrap: wrap; gap: 14px; }
  .sw { width: 48px; height: 32px; border: 2px solid var(--k-window-fg); }
  .lch { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; margin: 0; font-family: var(--k-font-fixed); font-size: var(--host-small-pt); }
  .lch dt { color: var(--k-window-inactive); }
  .lch dd { margin: 0; }
  .cands { margin-top: 32px; padding: 10px 12px 12px; background: var(--ig-surface); border: var(--ig-border-hairline) solid var(--ig-border); }
  .cands h2 { margin: 0 0 4px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: var(--ig-section-pt); }
  .cands .sub { color: var(--ig-text-muted); font-weight: 400; font-size: 9pt; }
  .cands .lead { margin: 0 0 8px; color: var(--ig-text-muted); font-size: 9pt; }
  .cands table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  .cands th, .cands td { text-align: left; padding: 3px 8px; border-bottom: 1px solid var(--ig-border); font-family: "Iosevka Custom Condensed", monospace; vertical-align: middle; }
  .cands th { color: var(--ig-text-muted); font-weight: 500; }
  .cands tr.def td { color: var(--ig-amber); }
  .ci img { display: block; }
  .chip { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border: 1px solid var(--ig-border-strong); vertical-align: -1px; }
</style>
