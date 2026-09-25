<script lang="ts">
  /* Windows Terminal + PowerShell/PSReadLine: a terminal window (scheme name,
   * a syntax-highlighted PowerShell line, an error, a comment), the scheme's
   * 16 ANSI slots + background/foreground/cursor/selection, the -Colors
   * token swatches, then every remaining shipped key shown literally.
   * No Windows host is available to verify this live — see meta.live. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, laneVars, WT_SLOTS, KEY_VARS, type WtModel } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'Campbell + PSReadLine compiled-in defaults', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'indigo-glass.scheme.json + PSReadLine profile', style: laneVars(ours), model: ours }
  };

  const coverage = () =>
    iniCoverage(
      [
        { label: 'indigo-glass.scheme.json', doc: ours.scheme },
        { label: 'profile.ps1 -Colors', doc: ours.psDoc! }
      ],
      KEY_VARS
    );

  type Tok = { text: string; v?: string };
  const cmdLine: Tok[] = [
    { text: 'Get-ChildItem', v: 'command' }, { text: ' ' },
    { text: '-Path', v: 'parameter' }, { text: ' ' },
    { text: "'C:\\Users'", v: 'string' }, { text: ' ' },
    { text: '-Filter', v: 'parameter' }, { text: ' ' },
    { text: "'*.txt'", v: 'string' }, { text: ' | ' },
    { text: 'Where-Object', v: 'command' }, { text: ' { ' },
    { text: '$_', v: 'variable' }, { text: '.Length', v: 'default' }, { text: ' -gt ', v: 'operator' },
    { text: '100', v: 'number' }, { text: ' }' }
  ];
  const typeLine: Tok[] = [
    { text: '[int]', v: 'type' }, { text: '::' }, { text: 'Parse', v: 'command' }, { text: '(' }, { text: "'42'", v: 'string' }, { text: ')' }
  ];
  const keywordLine: Tok[] = [
    { text: 'foreach', v: 'keyword' }, { text: ' (' }, { text: '$f', v: 'variable' }, { text: ' in ' }, { text: '$files', v: 'variable' }, { text: ') { ' },
    { text: 'Get-Content', v: 'command' }, { text: ' ' }, { text: '$f', v: 'variable' }, { text: ' }' }
  ];

  function splitKey(k: string): [string, string] {
    const i = k.indexOf('/');
    return [k.slice(0, i), k.slice(i + 1)];
  }
  const schemeKeys = ours.scheme.keys();
  const psKeys = ours.psDoc?.keys() ?? [];
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="terminal" title="Terminal window" lead="Tab title from the scheme's own name, a PSReadLine-coloured command line, a comment, an error — profile.ps1's -Colors hashtable, parsed by psreadline.ts" min="480px">
    <DPair name="Windows Terminal + PowerShell" span="full" note="Member/Emphasis token kinds are not set by profile.ps1 at all — see the report. Selection (ours only) uses the file's own VT truecolor pair; stock has no override in the fetched PSReadLine defaults so its selection specimen uses reverse video instead.">
      {#snippet children(lane: Lane<WtModel>)}
        <div class="wterm">
          <div class="tabbar"><span class="tab active">{lane.model.scheme.get('', 'name') ?? '—'}</span></div>
          <div class="term-body">
            <div class="line" style="color:var(--ps-comment, var(--wt-ansi-brightBlack))"># list text files over 100 bytes</div>
            <div class="line"><span class="prompt">PS C:\Users\johnn&gt;</span> {#each cmdLine as t}<span style={t.v ? `color:var(--ps-${t.v}, var(--wt-fg))` : ''}>{t.text}</span>{/each}</div>
            <div class="line">{#each typeLine as t}<span style={t.v ? `color:var(--ps-${t.v}, var(--wt-fg))` : ''}>{t.text}</span>{/each}</div>
            <div class="line">{#each keywordLine as t}<span style={t.v ? `color:var(--ps-${t.v}, var(--wt-fg))` : ''}>{t.text}</span>{/each}</div>
            <div class="line" style="color:var(--ps-error, var(--wt-ansi-red))">Get-Item : Cannot find path 'C:\missing.txt' because it does not exist.</div>
            <div class="line dim" style="color:var(--ps-inlineprediction, var(--wt-ansi-brightBlack))">  Get-Content .\notes.md   # inline prediction</div>
            <div class="line">Rename <span class="sel" style="color:var(--ps-selection-fg, var(--wt-bg));background:var(--ps-selection-bg, var(--wt-fg))">sage-ink-final.zip</span> before upload.</div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="ansi" title="Scheme colours" lead="background / foreground / cursorColor / selectionBackground, then all 16 ANSI slots — the fields emit_wt_scheme() writes" min="520px">
    <DPair name="core + ANSI" span="full">
      {#snippet children(lane: Lane<WtModel>)}
        <table class="ansi-table">
          <tbody>
            <tr>
              <td>background<br /><span class="sw" style="background:var(--wt-bg)"></span>{lane.model.background}</td>
              <td>foreground<br /><span class="sw" style="background:var(--wt-fg)"></span>{lane.model.foreground}</td>
              <td>cursorColor<br /><span class="sw" style="background:var(--wt-cursor)"></span>{lane.model.cursorColor}</td>
              <td>selectionBackground<br /><span class="sw" style="background:var(--wt-selection)"></span>{lane.model.selectionBackground}</td>
            </tr>
          </tbody>
        </table>
        <table class="ansi-table">
          <thead><tr>{#each WT_SLOTS as s}<th>{s}</th>{/each}</tr></thead>
          <tbody><tr>{#each WT_SLOTS as s}<td><span class="sw" style="background:var(--wt-ansi-{s})"></span>{lane.model.ansi[s]}</td>{/each}</tr></tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>

  <Section id="psreadline" title="PSReadLine -Colors" lead="Every key profile.ps1 sets, as a swatch" min="360px">
    <DPair name="token colours" span="full">
      {#snippet children(lane: Lane<WtModel>)}
        <table class="ansi-table">
          <thead><tr>{#each lane.model.ps as e}<th>{e.name}</th>{/each}</tr></thead>
          <tbody>
            <tr>
              {#each lane.model.ps as e}
                {#if e.kind === 'hex'}
                  <td><span class="sw" style="background:{e.hex}"></span>{e.hex}</td>
                {:else}
                  <td><span class="sw" style="background:{e.fg}"></span>/<span class="sw" style="background:{e.bg}"></span></td>
                {/if}
              {/each}
            </tr>
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="Every shipped key" lead="Non-colour scheme.json fields and the raw -Colors values, listed literally" min="380px">
    <DPair name="indigo-glass.scheme.json" span="full">
      {#snippet children()}
        <table class="fonts"><tbody>
          {#each schemeKeys as k}
            {@const [, key] = splitKey(k)}
            <tr><th>{key}</th><td>{ours.scheme.get('', key) ?? '—'}</td></tr>
          {/each}
        </tbody></table>
      {/snippet}
    </DPair>
    <DPair name="profile.ps1 -Colors (raw)" span="full">
      {#snippet children()}
        <table class="fonts"><tbody>
          {#each psKeys as k}
            {@const [, key] = splitKey(k)}
            <tr><th>{key}</th><td>{ours.psDoc?.get('', key) ?? '—'}</td></tr>
          {/each}
        </tbody></table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .wterm { width: 100%; background: var(--wt-bg); color: var(--wt-fg); font-family: var(--desk-font); border: 2px solid var(--ig-border-strong); }
  .tabbar { display: flex; padding: 4px 6px; background: color-mix(in srgb, var(--wt-bg) 85%, var(--wt-fg)); }
  .tab.active { padding: 3px 12px; color: var(--wt-fg); font-size: 0.85em; }
  .term-body { padding: 10px 12px; line-height: 1.5; }
  .line { white-space: pre-wrap; }
  .line.dim { opacity: 0.9; }
  .prompt { color: var(--wt-ansi-brightBlue); font-weight: 700; }
  .sel { padding: 0 2px; }
  .ansi-table { width: 100%; border-collapse: collapse; background: var(--wt-bg); color: var(--wt-fg); margin-bottom: 8px; }
  .ansi-table th, .ansi-table td { padding: 4px 8px; text-align: center; font-family: monospace; font-size: 9pt; }
  .sw { display: inline-block; width: 22px; height: 16px; border: 1px solid var(--ig-border-strong); vertical-align: -3px; margin-right: 3px; }
  .fonts { width: 100%; border-collapse: collapse; background: var(--ig-surface); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--ig-border); font-weight: 400; }
  .fonts th { color: var(--ig-text-muted); font-family: monospace; font-size: 9pt; white-space: nowrap; }
</style>
