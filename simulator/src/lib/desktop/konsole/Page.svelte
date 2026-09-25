<script lang="ts">
  /* Konsole: a terminal window (tabs, prompt, cursor, scrollbar per the
   * profile), the 16 ANSI slots (normal/intense/faint), realistic program
   * output (ls, git, an htop-like meter row), selection and bold/underline
   * text, then the settings the colours can't show. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, laneVars, NORMAL_SLOTS, KEY_VARS, ansiChecks, type KonsoleModel } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: "Breeze.colorscheme + Konsole's fallback profile", style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'SageInk.colorscheme + SageInk.profile', style: laneVars(ours), model: ours }
  };
  const coverage = () =>
    iniCoverage(
      [{ label: 'SageInk.colorscheme', doc: ours.colors }, { label: 'SageInk.profile', doc: ours.profile }],
      KEY_VARS
    );

  const colorSchemeSettings: [string, string][] = [['General', 'Description'], ['General', 'Opacity'], ['General', 'Wallpaper']];
  const profileSettings: [string, string][] = [
    ['Appearance', 'ColorScheme'], ['Appearance', 'UseFontLineChararacters'], ['Appearance', 'WordCharacters'],
    ['General', 'Command'], ['General', 'Name'], ['General', 'Parent'], ['General', 'TerminalColumns'], ['General', 'TerminalRows'],
    ['Interaction Options', 'AutoCopySelectedText'], ['Interaction Options', 'TrimLeadingWhitespacesInSelectedText'], ['Interaction Options', 'TrimTrailingWhitespacesInSelectedText'],
    ['Keyboard', 'KeyBindings']
  ];

  const lsEntries: { name: string; slot: string; bold?: boolean }[] = [
    { name: 'src/', slot: 'blue', bold: true },
    { name: 'tokens/', slot: 'blue', bold: true },
    { name: 'install.sh', slot: 'green', bold: true },
    { name: 'README.md', slot: 'white' },
    { name: 'link -> src/main.ts', slot: 'cyan', bold: true },
    { name: 'archive.tar.zst', slot: 'red', bold: true }
  ];
  const diffLines: { text: string; slot?: string; bold?: boolean }[] = [
    { text: 'diff --git a/tokens/codegen.py b/tokens/codegen.py', bold: true },
    { text: '--- a/tokens/codegen.py' },
    { text: '+++ b/tokens/codegen.py' },
    { text: '@@ -742,7 +742,7 @@ def emit_wt_scheme(...):', slot: 'cyan' },
    { text: '-        "black":         p["base"],', slot: 'red' },
    { text: '+        "black":         p["sidebar"],', slot: 'green' }
  ];
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="window" title="Terminal window" lead="Tab bar, prompt, cursor and scrollbar from the profile" min="480px">
    <DPair name="Konsole window" span="full" note="Cursor shape/colour and scrollbar position come from the profile's Cursor Options and Scrolling groups; SageInk hides the scrollbar (ScrollBarPosition=hidden) and sets an accent block-free cursor.">
      {#snippet children(lane: Lane<KonsoleModel>)}
        <div class="kterm" data-scrollbar={lane.model.scrollBarPosition}>
          <div class="tabbar"><span class="tab active">~/projects/indigo-glass</span><span class="tab">2 zsh</span><span class="tab-new">+</span></div>
          <div class="term-body">
            <div class="term-text">
              <div class="line"><span class="prompt">johnn@sage-ink</span>:<span class="path">~/projects/indigo-glass</span>$ ls --color</div>
              <div class="line out">
                {#each lsEntries as e}<span class="ent" style="color:var(--ks-ansi-{e.slot});font-weight:{e.bold ? 700 : 400}">{e.name}</span>{' '}{/each}
              </div>
              <div class="line"><span class="prompt">johnn@sage-ink</span>:<span class="path">~/projects/indigo-glass</span>$ <span class="cursor" data-shape={lane.model.cursorShape} data-custom={lane.model.useCustomCursorColor}>&nbsp;</span></div>
            </div>
            <div class="scrollbar" aria-hidden="true"></div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="ansi" title="ANSI palette" lead="All 16 slots, normal / intense / faint — the functional 16-colour contract [variants.sage.ansi] describes" min="620px">
    <DPair name="normal, intense, faint" span="full">
      {#snippet children()}
        <table class="ansi-table">
          <thead><tr><th></th>{#each NORMAL_SLOTS as s}<th>{s}</th>{/each}</tr></thead>
          <tbody>
            <tr><th>normal</th>{#each NORMAL_SLOTS as s}<td><span class="sw" style="background:var(--ks-ansi-{s})"></span></td>{/each}</tr>
            <tr><th>intense</th>{#each NORMAL_SLOTS as s}<td><span class="sw" style="background:var(--ks-ansi-{s}-intense)"></span></td>{/each}</tr>
            <tr><th>faint</th>{#each NORMAL_SLOTS as s}<td><span class="sw" style="background:var(--ks-ansi-{s}-faint)"></span></td>{/each}</tr>
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="text on background" span="full" note="Each ANSI foreground set as text colour, at 1x and bold (SGR 1), against the terminal background.">
      {#snippet children()}
        <div class="ansi-lines">
          {#each NORMAL_SLOTS as s}
            <div class="aline"><span style="color:var(--ks-ansi-{s})">{s} text</span> <span style="color:var(--ks-ansi-{s});font-weight:700">{s} bold</span></div>
          {/each}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="programs" title="Program output" lead="ls --color, git status/diff, and an htop-like meter row" min="420px">
    <DPair name="ls --color">
      {#snippet children()}
        <div class="term-text">
          {#each lsEntries as e}
            <span class="ent block" style="color:var(--ks-ansi-{e.slot});font-weight:{e.bold ? 700 : 400}">{e.name}</span>
          {/each}
        </div>
      {/snippet}
    </DPair>
    <DPair name="git status">
      {#snippet children()}
        <div class="term-text">
          <div class="line">On branch <span style="font-weight:700">main</span></div>
          <div class="line">Changes to be committed:</div>
          <div class="line indent" style="color:var(--ks-ansi-green)">new file:   simulator/src/lib/desktop/konsole/index.ts</div>
          <div class="line">Changes not staged for commit:</div>
          <div class="line indent" style="color:var(--ks-ansi-red)">modified:   share/konsole/SageInk.colorscheme</div>
          <div class="line" style="color:var(--ks-ansi-yellow)">Untracked files:</div>
          <div class="line indent" style="color:var(--ks-ansi-red)">simulator/fixtures/stock/konsole/</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="git diff" span="full">
      {#snippet children()}
        <div class="term-text">
          {#each diffLines as l}
            <div class="line" style="color:{l.slot ? `var(--ks-ansi-${l.slot})` : 'var(--ks-fg)'};font-weight:{l.bold ? 700 : 400}">{l.text}</div>
          {/each}
        </div>
      {/snippet}
    </DPair>
    <DPair name="htop-like meter row" span="full" note="Load bars built from ANSI green/yellow/red thresholds and the process list's usual white/cyan split.">
      {#snippet children()}
        <div class="term-text htop">
          <div class="meter">CPU [<span class="bar"><span style="width:62%;background:var(--ks-ansi-green)"></span></span>] 62%</div>
          <div class="meter">Mem [<span class="bar"><span style="width:81%;background:var(--ks-ansi-yellow)"></span></span>] 81%</div>
          <div class="meter">Swp [<span class="bar"><span style="width:94%;background:var(--ks-ansi-red)"></span></span>] 94%</div>
          <div class="line proc"><span style="color:var(--ks-ansi-cyan)">PID USER</span> <span>%CPU</span> <span>%MEM</span> <span style="color:var(--ks-fg)">COMMAND</span></div>
          <div class="line proc"><span style="color:var(--ks-ansi-white)">4013 johnn</span> <span>12.4</span> <span>3.1</span> <span>node</span></div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="text-state" title="Selection, bold, underline" lead="Reverse-video selection and SGR text attributes" min="360px">
    <DPair name="selection highlight" note="Konsole selects by reverse video (no dedicated selection key in .colorscheme): the run's foreground and background swap.">
      {#snippet children()}
        <div class="term-text"><div class="line">Rename to <span class="selrev">sage-ink-final.tar.zst</span> before upload.</div></div>
      {/snippet}
    </DPair>
    <DPair name="bold / underline">
      {#snippet children()}
        <div class="term-text">
          <div class="line">Plain text, <span style="font-weight:700;color:var(--ks-fg-intense)">bold text</span> (SGR 1 with no colour set switches the default foreground to ForegroundIntense, as real terminals do), <span style="text-decoration:underline">underlined text</span>, <span style="font-weight:700;text-decoration:underline;color:var(--ks-fg-intense)">both</span>.</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="checks-ansi" title="ANSI slot check against tokens" lead="Foundation gap (see simulator/src/lib/desktop/konsole/ansi.ts): Role/token can only bind to a PALETTE hex, and PALETTE has no ANSI branch — this table is the equality check computed independently, converting [variants.sage.ansi]'s OKLCH straight from TOKENS with a from-scratch port of codegen.py's own oklch_to_hex." min="520px">
    <DPair name="ansi.* vs shipped Color0-7 / Color0-7Intense" span="full">
      {#snippet children()}
        <table class="fonts">
          <thead><tr><th>slot</th><th>shipped</th><th>token says</th><th></th></tr></thead>
          <tbody>
            {#each ansiChecks as c}
              <tr class:bad={!c.ok}>
                <td>ansi.{c.slot}</td>
                <td><span class="sw" style="background:{c.ours}"></span>{c.ours}</td>
                <td><span class="sw" style="background:{c.expected}"></span>{c.expected}</td>
                <td>{c.ok ? 'ok' : 'DRIFT'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="Settings" lead="Non-colour keys, shown literally for coverage" min="420px">
    <DPair name="SageInk.colorscheme [General]">
      {#snippet children(lane: Lane<KonsoleModel>)}
        <table class="fonts"><tbody>
          {#each colorSchemeSettings as [g, k]}<tr><th>[{g}] {k}</th><td>{lane.model.colors.get(g, k) ?? '—'}</td></tr>{/each}
        </tbody></table>
      {/snippet}
    </DPair>
    <DPair name="SageInk.profile" span="full">
      {#snippet children(lane: Lane<KonsoleModel>)}
        <table class="fonts"><tbody>
          {#each profileSettings as [g, k]}<tr><th>[{g}] {k}</th><td>{lane.model.profile.get(g, k) ?? '—'}</td></tr>{/each}
          <tr><th>[Appearance] Font</th><td>{lane.model.fontFamily}, {lane.model.fontPt}pt</td></tr>
          <tr><th>[Scrolling] HistoryMode</th><td>{lane.model.historyMode}</td></tr>
          <tr><th>[Scrolling] ScrollBarPosition</th><td>{lane.model.scrollBarPosition}</td></tr>
          <tr><th>[Cursor Options] CursorShape</th><td>{lane.model.cursorShape}</td></tr>
        </tbody></table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .kterm { width: 100%; background: var(--ks-bg); color: var(--ks-fg); font-family: var(--ks-font); font-size: var(--host-konsole-pt); border: 2px solid var(--ig-border-strong); }
  .tabbar { display: flex; align-items: center; gap: 2px; padding: 4px 6px 0; background: var(--ks-bg-intense); }
  .tab { padding: 4px 12px; background: var(--ks-bg-faint); color: var(--ks-fg-faint); font-size: 0.85em; }
  .tab.active { color: var(--ks-fg-intense); border-bottom: 2px solid var(--ks-ansi-green); }
  .tab-new { padding: 4px 8px; color: var(--ks-fg-faint); }
  .term-body { position: relative; display: flex; }
  .term-text { flex: 1; padding: 10px 12px; line-height: calc(1.35 + var(--ks-line-spacing, 0px) / 10); white-space: pre-wrap; min-width: 0; }
  [data-scrollbar='hidden'] .scrollbar { display: none; }
  [data-scrollbar='left'] .term-body { flex-direction: row-reverse; }
  .scrollbar { width: 10px; background: var(--ks-bg-intense); }
  .line.indent { padding-left: 14px; }
  .line.out { display: flex; flex-wrap: wrap; gap: 0 10px; }
  .prompt { color: var(--ks-ansi-green); font-weight: 700; }
  .path { color: var(--ks-ansi-blue); font-weight: 700; }
  .cursor { display: inline-block; width: 0.6em; }
  .cursor[data-shape='block'] { background: var(--ks-fg); }
  .cursor[data-shape='block'][data-custom='true'] { background: var(--ks-cursor); color: var(--ks-cursor-text); }
  .cursor[data-shape='ibeam'] { border-left: 2px solid var(--ks-fg); }
  .cursor[data-shape='ibeam'][data-custom='true'] { border-left-color: var(--ks-cursor); }
  .cursor[data-shape='underline'] { border-bottom: 2px solid var(--ks-fg); }
  .cursor[data-shape='underline'][data-custom='true'] { border-bottom-color: var(--ks-cursor); }
  .ent.block { display: block; }
  .selrev { background: var(--ks-fg); color: var(--ks-bg); }
  .htop .meter { margin-bottom: 3px; }
  .bar { display: inline-block; width: 140px; height: 0.8em; background: var(--ks-bg-intense); vertical-align: middle; }
  .bar span { display: block; height: 100%; }
  .htop .proc { display: flex; gap: 14px; color: var(--ks-fg); }
  .ansi-table { width: 100%; border-collapse: collapse; background: var(--ks-bg); }
  .ansi-table th, .ansi-table td { padding: 4px 8px; text-align: center; font-family: monospace; font-size: 9pt; color: var(--ks-fg); }
  .sw { display: inline-block; width: 22px; height: 16px; border: 1px solid var(--ig-border-strong); vertical-align: -3px; }
  .ansi-lines { width: 100%; background: var(--ks-bg); padding: 8px 10px; font-family: var(--ks-font); }
  .aline { display: flex; gap: 14px; padding: 1px 0; }
  .fonts { width: 100%; border-collapse: collapse; background: var(--ig-surface); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--ig-border); font-weight: 400; }
  .fonts th { color: var(--ig-text-muted); font-family: monospace; font-size: 9pt; white-space: nowrap; }
  .fonts tr.bad td { color: var(--ig-negative); }
</style>
