<script lang="ts">
  /* JetBrains editor colour scheme: a static Kotlin specimen with each span
   * pre-tagged to the TextAttributesKey it stands in for (the page is not a
   * real lexer -- see index.ts's fidelityWhy). Both lanes render the exact
   * same token stream; only the colour lookup (ours vs stock IclsScheme)
   * differs. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import type { Lane, Coverage } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, attr, hex, laneVars, ATTR_KEYS, type IclsScheme, type IclsAttr } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'Darcula (DefaultColorSchemesManager.xml)', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'Indigo Glass.icls', style: laneVars(ours), model: ours }
  };

  type Key = Parameters<typeof attr>[1];
  type Tok = { t: string; k?: Key; bold?: true };
  const NL: Tok = { t: '\n' };
  const line = (...toks: Tok[]): Tok[] => [...toks, NL];

  /* One token stream, shared by both lanes; only the colour differs. */
  const CODE: Tok[] = [
    ...line({ t: 'package ', k: 'DEFAULT_KEYWORD' }, { t: 'com.example.invoice', k: 'DEFAULT_IDENTIFIER' }),
    ...line({ t: '' }),
    ...line({ t: 'import ', k: 'DEFAULT_KEYWORD' }, { t: 'kotlin.collections.List', k: 'DEFAULT_IDENTIFIER' }),
    ...line({ t: '' }),
    ...line({ t: '/** Computes the running total for [items]. */', k: 'DEFAULT_DOC_COMMENT' }),
    ...line({ t: '@', k: 'DEFAULT_METADATA' }, { t: 'JvmInline', k: 'DEFAULT_METADATA' }),
    ...line(
      { t: 'class ', k: 'DEFAULT_KEYWORD' }, { t: 'InvoiceCalculator', k: 'DEFAULT_CLASS_NAME' }, { t: '(', k: 'DEFAULT_PARENTHS' },
      { t: 'private val ', k: 'DEFAULT_KEYWORD' }, { t: 'items', k: 'DEFAULT_PARAMETER' }, { t: ': ', k: 'DEFAULT_COMMA' },
      { t: 'List', k: 'DEFAULT_CLASS_NAME' }, { t: '<', k: 'DEFAULT_BRACKETS' }, { t: 'Item', k: 'DEFAULT_CLASS_NAME' },
      { t: '>', k: 'DEFAULT_BRACKETS' }, { t: ')', k: 'DEFAULT_PARENTHS' }, { t: ' {', k: 'DEFAULT_BRACES' }
    ),
    ...line({ t: '    // Discount-inclusive tax rate', k: 'DEFAULT_LINE_COMMENT' }),
    ...line(
      { t: '    val ', k: 'DEFAULT_KEYWORD' }, { t: 'TAX_RATE', k: 'DEFAULT_STATIC_FIELD' }, { t: ' = ', k: 'DEFAULT_OPERATION_SIGN' },
      { t: '0.08', k: 'DEFAULT_NUMBER' }
    ),
    ...line({ t: '' }),
    ...line(
      { t: '    fun ', k: 'DEFAULT_KEYWORD' }, { t: 'total', k: 'DEFAULT_FUNCTION_DECLARATION' }, { t: '(): ', k: 'DEFAULT_PARENTHS' },
      { t: 'Double', k: 'DEFAULT_CLASS_NAME' }, { t: ' {', k: 'DEFAULT_BRACES' }
    ),
    ...line(
      { t: '        var ', k: 'DEFAULT_KEYWORD' }, { t: 'sum', k: 'DEFAULT_LOCAL_VARIABLE' }, { t: ' = ', k: 'DEFAULT_OPERATION_SIGN' },
      { t: '0.0', k: 'DEFAULT_NUMBER' }
    ),
    ...line(
      { t: '        for ', k: 'DEFAULT_KEYWORD' }, { t: '(', k: 'DEFAULT_PARENTHS' }, { t: 'item', k: 'DEFAULT_LOCAL_VARIABLE' },
      { t: ' in ', k: 'DEFAULT_KEYWORD' }, { t: 'items', k: 'DEFAULT_PARAMETER' }, { t: ')', k: 'DEFAULT_PARENTHS' }, { t: ' {', k: 'DEFAULT_BRACES' }
    ),
    ...line(
      { t: '            sum', k: 'DEFAULT_LOCAL_VARIABLE' }, { t: ' += ', k: 'DEFAULT_OPERATION_SIGN' }, { t: 'item', k: 'DEFAULT_LOCAL_VARIABLE' },
      { t: '.', k: 'DEFAULT_DOT' }, { t: 'price', k: 'DEFAULT_INSTANCE_FIELD' }, { t: ' * (1 + ', k: 'DEFAULT_OPERATION_SIGN' },
      { t: 'TAX_RATE', k: 'DEFAULT_STATIC_FIELD' }, { t: ')', k: 'DEFAULT_PARENTHS' }
    ),
    ...line({ t: '        }', k: 'DEFAULT_BRACES' }),
    ...line({ t: '        return ', k: 'DEFAULT_KEYWORD' }, { t: 'sum', k: 'DEFAULT_LOCAL_VARIABLE' }),
    ...line({ t: '    }', k: 'DEFAULT_BRACES' }),
    ...line({ t: '' }),
    ...line(
      { t: '    val ', k: 'DEFAULT_KEYWORD' }, { t: 'label', k: 'DEFAULT_LOCAL_VARIABLE' }, { t: ' = "line 1\\n', k: 'DEFAULT_STRING' },
      { t: '\\q', k: 'DEFAULT_INVALID_STRING_ESCAPE' }, { t: '"', k: 'DEFAULT_STRING' }
    ),
    ...line({ t: '}', k: 'DEFAULT_BRACES' })
  ];

  function col(scheme: IclsScheme, k?: Key): string | undefined {
    if (!k) return undefined;
    const a: IclsAttr = attr(scheme, k);
    return a.fg ? hex(a.fg) : undefined;
  }
  function style(scheme: IclsScheme, tok: Tok): string {
    const c = col(scheme, tok.k);
    const a = tok.k ? attr(scheme, tok.k) : undefined;
    return [
      c ? `color:${c}` : '',
      a?.bold ? 'font-weight:700' : '',
      a?.italic ? 'font-style:italic' : ''
    ].filter(Boolean).join(';');
  }

  /* Every <colors> key and every <attributes> key the shipped .icls declares
   * (54 attrs + 17 colors, verified 1:1 against the file in model.ts's
   * ATTR_KEYS comment) appears as a row in the "Every key this scheme sets"
   * table below, in BOTH lanes -- so coverage is complete by construction:
   * nothing needs an `ignored` excuse because everything is literally shown,
   * exactly like vlc/Page.svelte's own "Shipped keys" raw-values table. */
  const colorKeys = Object.keys(ours.colors);
  const coverage = (): Coverage => ({ total: colorKeys.length + ATTR_KEYS.length, missing: [], ignored: [] });

  function attrCell(scheme: IclsScheme, key: (typeof ATTR_KEYS)[number]): string {
    const a = scheme.attrs[key];
    if (!a || (!a.fg && !a.bg && !a.effectColor)) return '→ DEFAULT_IDENTIFIER';
    const parts: string[] = [];
    if (a.fg) parts.push(`fg ${hex(a.fg)}`);
    if (a.bg) parts.push(`bg ${hex(a.bg)}`);
    if (a.effectColor) parts.push(`underline ${hex(a.effectColor)}`);
    if (a.bold) parts.push('bold');
    if (a.italic) parts.push('italic');
    return parts.join(', ');
  }
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="editor" title="Editor" lead="A static Kotlin specimen, each span pre-tagged to the TextAttributesKey it stands in for (see model.ts's header comment)." min="620px">
    <DPair name="code" span="full" note="Same token stream both lanes; only the colour lookup differs.">
      {#snippet children(lane: Lane<IclsScheme>)}
        <pre class="editor" style="background:{hex(lane.model.colors.CONSOLE_BACKGROUND_KEY)};color:{hex(attr(lane.model,'DEFAULT_IDENTIFIER').fg)}"><span class="gutter" style="background:{hex(lane.model.colors.GUTTER_BACKGROUND)};color:{hex(lane.model.colors.LINE_NUMBERS_COLOR)}">{#each Array(CODE.filter((t) => t.t === '\n').length) as _, i}{i + 1}
{/each}</span><code>{#each CODE as t}{#if t.t === '\n'}
{:else}<span style={style(lane.model, t)}>{t.t}</span>{/if}{/each}</code></pre>
      {/snippet}
    </DPair>
  </Section>

  <Section id="gutter" title="Gutter + VCS" lead="GUTTER_VCS_NEW/REMOVED/MODIFIED paint the changed-lines bar next to the line numbers." min="200px">
    <DPair name="VCS marks">
      {#snippet children(lane: Lane<IclsScheme>)}
        <div class="vcs" style="background:{hex(lane.model.colors.GUTTER_BACKGROUND)}">
          <span class="bar" style="background:{hex(attr(lane.model, 'GUTTER_VCS_NEW').fg)}" title="added"></span>
          <span class="bar" style="background:{hex(attr(lane.model, 'GUTTER_VCS_MODIFIED').fg)}" title="modified"></span>
          <span class="bar" style="background:{hex(attr(lane.model, 'GUTTER_VCS_REMOVED').fg)}" title="removed"></span>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="selection" title="Selection" lead="SELECTION_FOREGROUND painted straight over SELECTION_BACKGROUND, exactly as IntelliJ renders a highlighted selection -- no per-Klassy-style override like the KDE layer has." min="280px">
    <DPair name="selected line" note="The pair index.ts's 2026-09-25 fix exists for: text on the selection fill.">
      {#snippet children(lane: Lane<IclsScheme>)}
        <div class="sel-demo" style="background:{hex(lane.model.colors.CONSOLE_BACKGROUND_KEY)};color:{hex(attr(lane.model,'DEFAULT_IDENTIFIER').fg)}">
          <div>val total = calculator.total()</div>
          <div class="sel" style="background:{hex(lane.model.colors.SELECTION_BACKGROUND)};color:{hex(lane.model.colors.SELECTION_FOREGROUND || attr(lane.model,'DEFAULT_IDENTIFIER').fg)}">val total = calculator.total()</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="raw" title="Every key this scheme sets" lead="All 17 <colors> keys and all 54 <attributes> keys Indigo Glass.icls declares, literally -- the bespoke specimens above show the handful that read on a code sample; this table is what makes coverage complete." min="560px">
    <DPair name="raw values" span="full">
      {#snippet children(lane: Lane<IclsScheme>)}
        <table class="fonts">
          <tbody>
            {#each colorKeys as k}
              <tr><th>colors [{k}]</th><td class="fam">{hex(lane.model.colors[k])}</td></tr>
            {/each}
            {#each ATTR_KEYS as k}
              <tr><th>attributes [{k}]</th><td class="fam">{attrCell(lane.model, k)}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  .editor { margin: 0; display: flex; font-family: "Iosevka Custom Condensed", monospace; font-size: 10.5pt; line-height: 1.5; padding: 0; white-space: pre; width: 100%; overflow-x: auto; }
  .editor .gutter { display: block; text-align: right; padding: 8px 10px; user-select: none; white-space: pre; }
  .editor code { display: block; padding: 8px 12px; white-space: pre; }
  .vcs { display: flex; gap: 4px; padding: 10px; width: 100%; }
  .vcs .bar { width: 4px; height: 40px; }
  .sel-demo { width: 100%; padding: 10px 12px; font-family: "Iosevka Custom Condensed", monospace; font-size: 10.5pt; }
  .sel-demo .sel { padding: 1px 0; }
  .fonts { width: 100%; border-collapse: collapse; background: var(--jb-bg); color: var(--jb-fg); }
  .fonts th, .fonts td { text-align: left; padding: 4px 10px; border-bottom: 1px solid var(--jb-gutter); font-weight: 400; }
  .fonts th { color: var(--jb-line-numbers); font-family: monospace; font-size: 9pt; white-space: nowrap; }
  .fam { font-family: monospace; font-size: 9pt; }
</style>
