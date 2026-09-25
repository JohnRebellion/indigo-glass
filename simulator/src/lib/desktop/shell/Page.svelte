<script lang="ts">
  /* Shell: the Starship prompt (parsed from the real format string — see
   * model.ts tokenizeFormat/moduleToken), a fastfetch banner (logo + system
   * lines + title), the three shell snippets verbatim, then an exhaustive
   * settings dump so every starship.toml / fastfetch config.jsonc key is
   * accounted for (most are read directly by the specimens above; the rest
   * — thresholds, symbols not sampled, disabled flags, substitutions — are
   * shown literally here). Rendered inside a terminal using the SAME palette
   * the Konsole surface derives (../konsole/model), per the brief: a prompt
   * does not repaint the terminal it runs in. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, laneVars, KEY_VARS, type ShellModel, type PromptToken } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'zsh default PROMPT + fastfetch zero-config', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'starship.toml + config.jsonc', style: laneVars(ours), model: ours }
  };

  const coverage = () =>
    iniCoverage(
      [
        { label: 'starship.toml', doc: ours.starship! },
        { label: 'fastfetch/config.jsonc', doc: ours.fastfetch! }
      ],
      KEY_VARS
    );

  /* `group/key` (starship) or `/key` (fastfetch, group always '') — group
   * itself never contains '/', so the first '/' is always the split point. */
  function splitKey(k: string): [string, string] {
    const i = k.indexOf('/');
    return [k.slice(0, i), k.slice(i + 1)];
  }
  const starshipKeys = ours.starship?.keys() ?? [];
  const fastfetchKeys = ours.fastfetch?.keys() ?? [];

  /* fastfetch's ascii-art convention: `$1`/`$2` mark a colour switch that
   * holds until the next marker (config/fastfetch/sage-ink-mark*.txt use
   * exactly two). Stock's mark has had both markers stripped (buildStock in
   * model.ts), so it renders as one plain segment — no per-character colour,
   * matching fastfetch's zero-config compiled-in banner. */
  function logoSegments(mark: string, c1?: string, c2?: string): { text: string; color?: string }[] {
    const parts = mark.split(/(\$1|\$2)/);
    const out: { text: string; color?: string }[] = [];
    let color: string | undefined;
    for (const p of parts) {
      if (p === '$1') color = c1;
      else if (p === '$2') color = c2;
      else if (p) out.push({ text: p, color });
    }
    return out;
  }

  function tokenKey(t: PromptToken, i: number): string {
    return t.kind === 'break' ? `break-${i}` : t.kind === 'connector' ? `conn-${i}` : `${t.name}-${i}`;
  }
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="prompt" title="Starship prompt" lead="Every segment's style comes from the real format string and its module's own style/symbol keys (toml.ts + model.ts tokenizeFormat) — nothing here is hand-copied text." min="420px">
    <DPair name="prompt line" span="full" note="Stock is zsh's own default PROMPT (unset, per the Zsh Manual): no starship, no segments, terminal default colours only.">
      {#snippet children(lane: Lane<ShellModel>)}
        <div class="sterm">
          <div class="promptline">
            {#each lane.model.prompt as t, i (tokenKey(t, i))}
              {#if t.kind === 'break'}
                <div class="pbreak"></div>
              {:else if t.kind === 'connector'}
                <span class="pconn" style="background:{t.style.bg ?? t.style.fg ?? 'transparent'}">{t.text}</span>
              {:else}
                <span
                  class="pseg"
                  style="color:{t.style.fg ?? 'inherit'};background:{t.style.bg ?? 'transparent'};font-weight:{t.style.bold ? 700 : 400};text-decoration:{t.style.underline ? 'underline' : 'none'};font-style:{t.style.italic ? 'italic' : 'normal'}"
                  data-module={t.name}
                >{t.text}</span>
              {/if}
            {/each}
            <span class="pcaret">&nbsp;</span>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="fastfetch" title="fastfetch banner" lead="Logo mark (config/fastfetch/sage-ink-mark.txt) + system lines + the user@host title, coloured from config.jsonc" min="460px">
    <DPair name="fastfetch output" span="full" note="Stock has no shippable default config to diff (fastfetch's zero-config behaviour is compiled in) — see meta.stockSource. Its lines/logo here are a documented reconstruction, not a fetched file.">
      {#snippet children(lane: Lane<ShellModel>)}
        <div class="sterm ff">
          <pre class="logo">{#each logoSegments(lane.model.logoMark, lane.model.logoColor1, lane.model.logoColor2) as seg}<span style={seg.color ? `color:${seg.color}` : ''}>{seg.text}</span>{/each}</pre>
          <div class="ffinfo">
            <div class="fftitle">
              <span style="color:{lane.model.fastfetchTitle.userColor ?? 'inherit'}">{lane.model.fastfetchTitle.user}</span
              ><span style="color:{lane.model.fastfetchTitle.atColor ?? 'inherit'}">{lane.model.fastfetchTitle.at}</span
              ><span style="color:{lane.model.fastfetchTitle.hostColor ?? 'inherit'}">{lane.model.fastfetchTitle.host}</span>
            </div>
            <hr />
            {#each lane.model.fastfetchLines as l}
              <div class="ffline"><span style="color:{l.keyColor ?? 'inherit'}">{l.key}</span> {l.value}</div>
            {/each}
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="snippets" title="Shell snippets" lead="shell/zshrc-snippet.zsh, bashrc-snippet.bash, profile-snippet.sh — verbatim, no per-line colour to check (plain shell source)" min="360px">
    <DPair name="zshrc-snippet.zsh">
      {#snippet children(lane: Lane<ShellModel>)}
        <pre class="src">{lane.model.zshrc || '(stock: nothing sourced)'}</pre>
      {/snippet}
    </DPair>
    <DPair name="bashrc-snippet.bash">
      {#snippet children(lane: Lane<ShellModel>)}
        <pre class="src">{lane.model.bashrc || '(stock: nothing sourced)'}</pre>
      {/snippet}
    </DPair>
    <DPair name="profile-snippet.sh">
      {#snippet children(lane: Lane<ShellModel>)}
        <pre class="src">{lane.model.profileSnippet || '(stock: nothing sourced)'}</pre>
      {/snippet}
    </DPair>
  </Section>

  <Section id="settings" title="Every shipped key" lead="The prompt and banner above render most of these directly; everything else (thresholds, symbols not sampled, disabled flags, substitutions) is listed literally so both files are covered in full" min="480px">
    <DPair name="starship.toml" span="full">
      {#snippet children()}
        <table class="fonts"><tbody>
          {#each starshipKeys as k}
            {@const [g, key] = splitKey(k)}
            <tr><th>[{g || '(root)'}] {key}</th><td>{ours.starship?.get(g, key) ?? '—'}</td></tr>
          {/each}
        </tbody></table>
      {/snippet}
    </DPair>
    <DPair name="fastfetch/config.jsonc" span="full">
      {#snippet children()}
        <table class="fonts"><tbody>
          {#each fastfetchKeys as k}
            {@const [, key] = splitKey(k)}
            <tr><th>{key}</th><td>{ours.fastfetch?.get('', key) ?? '—'}</td></tr>
          {/each}
        </tbody></table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .sterm { width: 100%; background: var(--ks-bg); color: var(--ks-fg); font-family: var(--ks-font); padding: 10px 12px; }
  .promptline { display: flex; align-items: stretch; flex-wrap: wrap; }
  .pconn { display: inline-block; width: 8px; align-self: stretch; }
  .pseg { display: inline-flex; align-items: center; padding: 2px 0; white-space: pre; }
  .pbreak { flex-basis: 100%; height: 0; }
  .pcaret { padding-left: 4px; }
  .ff { display: flex; gap: 18px; align-items: flex-start; }
  .logo { margin: 0; font-family: monospace; font-size: 8pt; line-height: 1.05; white-space: pre; }
  .ffinfo { min-width: 0; }
  .fftitle { font-weight: 700; margin-bottom: 2px; }
  .ffinfo hr { border: none; border-top: 1px solid var(--ks-fg-faint); margin: 3px 0 6px; }
  .ffline { white-space: pre; }
  .src { width: 100%; margin: 0; padding: 10px 12px; background: var(--ks-bg); color: var(--ks-fg); font-family: var(--ks-font); font-size: 9pt; white-space: pre-wrap; overflow-wrap: anywhere; }
  .fonts { width: 100%; border-collapse: collapse; background: var(--ig-surface); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--ig-border); font-weight: 400; vertical-align: top; }
  .fonts th { color: var(--ig-text-muted); font-family: monospace; font-size: 9pt; white-space: nowrap; }
  .fonts td { font-family: monospace; font-size: 9pt; word-break: break-word; }
</style>
