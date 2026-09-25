<script lang="ts">
  /* Fonts: every desktop font role — kdeglobals' five, the title bar, Konsole,
   * GTK 3/4 — checked against TOKENS.type (family = head of the token stack,
   * pt = the token role), then rendered per lane at the selected host's size:
   * a glyph-disambiguation line, the weights in play, and a paragraph.
   * The first table is the point of the page; the shared footer below only
   * checks the colours the specimens paint. */
  import { onMount } from 'svelte';
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Coverage, Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import {
    ours, stock, laneVars, snippet, KEY_VARS, CHECKS, TYPE, NAMING, DOC_VS_TOKEN, DOC_WEIGHTS, DOC_ROLES,
    SNIPPET_COMMENT, README_ROWS, README_TITLE, README_NOT_SHIPPED, BUNDLE_FILES, BUILD_PLAN, GTK_HOST_MISMATCH,
    KIRIGAMI, type FontsModel, type RoleId
  } from './model';
  import { matchWeight } from './parse';

  const lanes = {
    stock: { which: 'stock' as const, label: 'Plasma 6 defaults (Noto Sans 10 / Hack 10)', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'kdeglobals.snippet + SageInk.colors + Konsole/GTK', style: laneVars(ours), model: ours }
  };

  /* ---- verdicts ---- */
  const rows = CHECKS.map((c) => ({ ...c, ok: c.familyOk === 'ok' && c.sizeOk }));
  const passed = rows.filter((r) => r.ok).length;

  /* ---- snippet keys that are not fonts: shown, read through get ---- */
  const otherKeys = snippet.keys().filter((k) => !(k in KEY_VARS)).map((k) => {
    const i = k.lastIndexOf('/');
    return { k, v: snippet.get(k.slice(0, i), k.slice(i + 1)) ?? '' };
  });

  /* ---- weights ---- */
  const docW = (role: string) => DOC_WEIGHTS.find((d) => d.role === role)?.weight;
  const weightRows = [
    { what: 'Body text', toml: `type.weight.base = ${TYPE.weight.base}`, doc: docW('Body'), tomlN: TYPE.weight.base },
    { what: 'Headings', toml: `type.weight.heading = ${TYPE.weight.heading}`, doc: docW('Strong / heading'), tomlN: TYPE.weight.heading },
    { what: 'Hero', toml: '— (heading applies)', doc: docW('Hero'), tomlN: TYPE.weight.heading },
    { what: 'Caption / dim', toml: `type.weight.base = ${TYPE.weight.base}`, doc: docW('Caption / dim'), tomlN: TYPE.weight.base },
    { what: 'Toolbar', toml: `type.weight.base = ${TYPE.weight.base}`, doc: docW('Toolbar'), tomlN: TYPE.weight.base }
  ].map((r) => ({ ...r, ok: r.doc === r.tomlN }));
  const docToolbar = DOC_ROLES.find((r) => r.role === 'Toolbar button label');

  /* ---- browser font availability (after mount) ---- */
  const families = [...new Set([
    ...CHECKS.flatMap((c) => [c.family, c.stock.family]),
    ...Object.values(TYPE.families).flat()
  ])].filter((f) => !['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif', 'monospace', 'serif'].includes(f));
  let avail = $state<Record<string, 'webfont' | 'system' | 'missing'>>({});
  const renders = (list: string[]) => list.find((f) => avail[f] && avail[f] !== 'missing') ?? 'generic fallback';
  const PROBE = 'mmmmmmmmmmlli0O1rn{}[]->WwQqag';
  async function detect() {
    await document.fonts.ready;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    const width = (f: string) => { ctx.font = `32px ${f}`; return ctx.measureText(PROBE).width; };
    const out: typeof avail = {};
    for (const f of families) {
      await document.fonts.load(`32px "${f}"`, PROBE).catch(() => []);
      const has = ['monospace', 'serif', 'sans-serif'].some((g) => width(`"${f}", ${g}`) !== width(g));
      const web = [...document.fonts].some((ff) => ff.family.replace(/["']/g, '') === f && ff.status === 'loaded');
      out[f] = has ? (web ? 'webfont' : 'system') : 'missing';
    }
    avail = out;
  }
  onMount(() => { detect(); });

  /* ---- coverage: snippet keys via vars/get, bundle files and plan keys via DOM ---- */
  const coverage = (): Coverage => {
    const ini = iniCoverage([{ label: 'kdeglobals.snippet', doc: snippet }], KEY_VARS);
    const inDom = (attr: string, v: string) => document.querySelector(`[${attr}="${CSS.escape(v)}"]`) !== null;
    const bundleMissing = BUNDLE_FILES.filter((f) => !inDom('data-bundle', f)).map((f) => `bundle: ${f}`);
    const planMissing = BUILD_PLAN.filter((p) => !inDom('data-plan-key', `${p.section}/${p.key}`)).map((p) => `build plan: ${p.section}/${p.key}`);
    return {
      total: ini.total + BUNDLE_FILES.length + BUILD_PLAN.length,
      missing: [...ini.missing.map((m) => `kdeglobals.snippet: ${m}`), ...bundleMissing, ...planMissing],
      ignored: ini.ignored
    };
  };

  /* ---- specimen helpers ---- */
  const GLYPHS = '0O 1lI rn m {} [] -> · ag';
  const weightsFor = (lane: Lane<FontsModel>, id: RoleId) => {
    const f = lane.model.fonts[id];
    const faces = CHECKS.find((c) => c.id === id)?.faces ?? null;
    const draw = (w: number) => (faces ? matchWeight(w, faces) : w);
    const list: { w: number; label: string }[] = [{ w: f.weight, label: `${f.weight} file` }];
    if (lane.which === 'ours') {
      list.push({ w: TYPE.weight.base, label: `${TYPE.weight.base} token base${draw(TYPE.weight.base) !== TYPE.weight.base ? ` (draws ${draw(TYPE.weight.base)})` : ''}` });
      list.push({ w: TYPE.weight.heading, label: `${TYPE.weight.heading} token heading${draw(TYPE.weight.heading) !== TYPE.weight.heading ? ` (draws ${draw(TYPE.weight.heading)})` : ''}` });
    } else list.push({ w: 700, label: '700 bold' });
    return list.filter((x, i) => list.findIndex((y) => y.w === x.w) === i);
  };
  const fam = (id: RoleId) => `font-family:var(--f-${id}-family);font-size:var(--f-${id}-size);font-weight:var(--f-${id}-weight)`;
  /* Ours keys that hosts/apply.sh rewrites are drawn at the host's size, so
     the label says the file pt is not what is on screen. */
  const who = (lane: Lane<FontsModel>, id: RoleId) => {
    const f = lane.model.fonts[id];
    const scaled = lane.which === 'ours' && CHECKS.find((c) => c.id === id)?.applied;
    return `${f.family} ${f.pt}pt ${f.weight}${scaled ? ' in file · drawn at the host apply.sh size' : ''}`;
  };
  const PROSE = 'Sage Ink sets body text in Carlito at the anchor size, so a folder view, a settings page and a mail reader share one measure. Numbers like 10.0.0.1 and 0x1F stay legible when zero, capital O, one, lower-case L and capital I sit side by side.';
</script>

{#snippet specimen(lane: Lane<FontsModel>, id: RoleId, text: string)}
  <div class="spec" style={fam(id)}>
    <div class="who">{who(lane, id)}</div>
    <div class="glyphs" data-testid="glyphs-{id}">{GLYPHS}</div>
    <div class="weights">
      {#each weightsFor(lane, id) as w}<span style="font-weight:{w.w}">{w.label}</span>{/each}
    </div>
    <p class="para">{text}</p>
  </div>
{/snippet}

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="type-check" title="Type roles vs TOKENS.type" lead="Family must be the head of the token stack; pt must equal the token role. Read from the shipped files, not from the lanes below." min="100%">
    <div class="wide" data-testid="type-check" data-passed={passed} data-total={rows.length}>
      <p class="tally" class:all={passed === rows.length}>
        <span class="badge" class:ok={passed === rows.length} class:bad={passed !== rows.length}>{passed} / {rows.length}</span>
        roles match TOKENS.type in family and size
      </p>
      <div class="scroll">
        <table class="check">
          <thead>
            <tr><th></th><th>Role</th><th>File · key</th><th>Family <span class="sub">vs stack head</span></th><th>pt <span class="sub">vs token</span></th><th>apply.sh <span class="sub">_default</span></th><th>Weight <span class="sub">file · TOML · doc</span></th><th>Renders as <span class="sub">this browser</span></th><th>Stock</th></tr>
          </thead>
          <tbody>
            {#each rows as r}
              <tr class:rowbad={!r.ok} data-testid="type-row-{r.id}" data-ok={r.ok}>
                <td><span class="badge" class:ok={r.ok} class:bad={!r.ok}>{r.ok ? 'OK' : 'DRIFT'}</span></td>
                <td class="role">{r.label}</td>
                <td class="mono small">{r.file}<br />{r.key}</td>
                <td class:cbad={r.familyOk === 'drift'} class:cwarn={r.familyOk === 'fallback'}>
                  {r.family}{#if r.familyOk !== 'ok'} <span class="sub">want {r.stackHead}{r.familyOk === 'fallback' ? ' (in stack, not head)' : ''}</span>{/if}
                  <div class="sub mono">type.families.{r.stack}</div>
                </td>
                <td class:cbad={!r.sizeOk}><strong>{r.pt}</strong> <span class="sub">/ {r.tokenPt} roles.{r.tokenKey}</span></td>
                <td class:cbad={r.applied !== null && !r.applied.ok}>
                  {#if r.applied}{r.applied.pt}pt{r.applied.ok ? '' : ' ≠ token'}{:else}<span class="cwarn">not patched</span> <span class="sub">file pt on every host</span>{/if}
                </td>
                <td class:cwarn={!r.weightAgree}>
                  {r.weight} · {r.weightToml} · {r.weightDoc.weight}
                  <div class="sub">{r.weightDoc.from}{#if r.drawn && r.drawn.toml !== r.weightToml}; {r.weightToml} draws {r.drawn.toml} (faces {r.faces?.join('/')}){/if}</div>
                </td>
                <td class="small">
                  {#if avail[r.family]}
                    <span class:cbad={avail[r.family] === 'missing'}>{r.family}: {avail[r.family]}</span>
                    {#if avail[r.family] === 'missing'}<div class="sub">draws {renders(TYPE.families[r.stack])}</div>{/if}
                  {:else}<span class="sub">measuring…</span>{/if}
                </td>
                <td class="small">{r.stock.family} {r.stock.pt} · {r.stock.weight}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if GTK_HOST_MISMATCH.length}<p class="cbad">GTK lane uses --host-body-pt but: {GTK_HOST_MISMATCH.join('; ')}</p>{/if}
    </div>
  </Section>

  <Section id="disagreements" title="Where the sources disagree" lead="TOKENS.type (tokens/out/json-tokens.json) vs docs/TYPOGRAPHY.md vs the shipped files. Shown, not resolved: the token file is what the check above binds to." min="420px">
    <div class="card" data-testid="weights">
      <h3>Weight</h3>
      <table class="mini">
        <thead><tr><th>Role</th><th>TOML [type.weight]</th><th>TYPOGRAPHY.md</th><th></th></tr></thead>
        <tbody>
          {#each weightRows as w}
            <tr><td>{w.what}</td><td class="mono">{w.toml}</td><td>{w.doc ?? '—'}</td><td><span class="badge" class:ok={w.ok} class:warn={!w.ok}>{w.ok ? 'agree' : 'differ'}</span></td></tr>
          {/each}
        </tbody>
      </table>
      <p class="sub">The doc says "[type.*] in the token file carries … no weight axis"; the TOML has had <code>[type.weight]</code> (base {TYPE.weight.base}, heading {TYPE.weight.heading}, "no 400/600 in between") since the neobrutalism pass. Its only consumers are the CSS/SCSS outputs (<code>--ig-weight-*</code>, used by this simulator's chrome). No desktop file carries a token weight: every kdeglobals / activeFont / Konsole value is 400. Carlito ships 400 and 700 faces only, so base 500 draws the 400 face (CSS and fontconfig alike); SF Pro Display has a real 500.</p>
    </div>
    <div class="card" data-testid="naming">
      <h3>Heading role names</h3>
      <table class="mini">
        <thead><tr><th>Token key</th><th>pt</th><th>TYPOGRAPHY.md row at that pt</th></tr></thead>
        <tbody>{#each NAMING as n}<tr><td class="mono">{n.token}</td><td>{n.pt}</td><td>{n.doc}</td></tr>{/each}</tbody>
      </table>
      <p class="sub">Values agree; names cross over: the token's <code>heading_pt</code> is the doc's "Section heading", and the token's <code>section_pt</code> is the doc's "Page heading".</p>
    </div>
    <div class="card" data-testid="doc-sizes">
      <h3>Doc sizes vs token roles</h3>
      <table class="mini">
        <thead><tr><th>TYPOGRAPHY.md role</th><th>doc pt</th><th>token</th><th></th></tr></thead>
        <tbody>
          {#each DOC_VS_TOKEN as d}
            <tr><td>{d.role}</td><td>{d.pt}</td><td class="mono">{d.tokenKey ? `${d.tokenKey} = ${d.tokenPt}` : '—'}</td>
              <td>{#if d.ok === null}<span class="sub">no desktop key</span>{:else}<span class="badge" class:ok={d.ok} class:bad={!d.ok}>{d.ok ? 'agree' : 'differ'}</span>{/if}</td></tr>
          {/each}
        </tbody>
      </table>
      {#if docToolbar && docToolbar.pt !== TYPE.roles.toolbar_pt}
        <p class="sub">The doc puts the toolbar at step -1 = {docToolbar.pt}pt and forbids "sizes between these steps (no 10…)", yet <code>roles.toolbar_pt</code>, both host profiles and kdeglobals ship {TYPE.roles.toolbar_pt}.</p>
      {/if}
    </div>
    <div class="card" data-testid="kirigami">
      <h3>Headings on the desktop</h3>
      <p class="sub">No kdeglobals key sets a heading. Plasma and Kirigami apps draw <code>Kirigami.Heading</code> from the general font × {KIRIGAMI.map((k) => k.factor).join(' / ')} (levels 1-3), weight 400 unless Primary. With Carlito {ours.fonts.body.pt} that is {KIRIGAMI.map((k) => Math.round(ours.fonts.body.pt * k.factor * 100) / 100).join(' / ')}pt — not the token's {TYPE.roles.heading_pt} / {TYPE.roles.section_pt} at {TYPE.weight.heading}. The token heading roles reach CSS consumers only.</p>
      <h3>kdeglobals.snippet header comment</h3>
      <ul class="sub">{#each SNIPPET_COMMENT as l}<li class="mono">{l}</li>{/each}</ul>
    </div>
  </Section>

  <Section id="kde-roles" title="KDE font roles" lead="kdeglobals [General] as Qt apps draw it. Ours at the selected host's apply.sh size; stock at Plasma's 100%." min="560px">
    <DPair name="general font (body)" note="Dolphin/System Settings content. Carlito ships 400/700 faces only.">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="win">{@render specimen(lane, 'body', PROSE)}</div>
      {/snippet}
    </DPair>
    <DPair name="menu font" note="Context menu in menuFont.">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="win menu" style={fam('menu')}>
          <div class="who">{who(lane, 'menu')}</div>
          <div class="mi">Open in New Tab<span class="kb">Ctrl+T</span></div>
          <div class="mi">Copy Location<span class="kb">Ctrl+Alt+C</span></div>
          <div class="sep"></div>
          <div class="mi glyphs">{GLYPHS}</div>
          <div class="mi"><span style="font-weight:700">Bold item</span><span class="kb">700</span></div>
          <div class="mi">Properties<span class="kb">Alt+Return</span></div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="toolbar font" note="Toolbar labels in toolBarFont.">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="win">
          <div class="toolbar" style={fam('toolbar')}>
            <span class="tb">Back</span><span class="tb">Forward</span><span class="tb">Split</span><span class="tb">Search</span>
          </div>
          {@render specimen(lane, 'toolbar', 'Toolbar labels sit one step under the body so a row of six fits a 960px window. 0O 1lI in a path: /srv/l10n/0O1lI.')}
        </div>
      {/snippet}
    </DPair>
    <DPair name="smallest readable (caption / tooltip)" note="Tooltips, places headers and status bars in smallestReadableFont, painted in the inactive text colour.">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="win caption">
          <div class="tip" style={fam('smallest')}>Show hidden files <span class="kb">Alt+.</span></div>
          <div class="muted">{@render specimen(lane, 'smallest', '7 folders, 2 files (1.2 GiB free). Captions stay at the smallest readable step, never below it.')}</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="window title" note="[WM] activeFont from the colour scheme. hosts/apply.sh never writes it, so it stays at the file's pt on every host.">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="win">
          <div class="title" style={fam('title')}><span class="tt">Home — Dolphin</span></div>
          {@render specimen(lane, 'title', 'Title bars use the chrome family. Sage Ink ships it from SageInk.colors, not from kdeglobals.snippet.')}
        </div>
      {/snippet}
    </DPair>
    <DPair name="fixed font (code)" note="Kate/KWrite editor view in the fixed font.">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="view">
          <div class="who">{who(lane, 'mono')}</div>
          <pre class="code" style={fam('mono')}><span class="cm"># glyphs: {GLYPHS}</span>
def scale(pt: float, host: float = 1.27) -&gt; int:
    return round(pt * host)  <span class="cm"># 11 -&gt; 14, 0O 1lI</span>
{'{'}"rn": [1, 0, "m"]{'}'}</pre>
          <div class="weights" style={fam('mono')}>{#each weightsFor(lane, 'mono') as w}<span style="font-weight:{w.w}">{w.label}</span>{/each}</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="apps" title="Terminal and GTK" lead="Konsole's profile font and GTK's gtk-font-name — separate files that must land on the same roles" min="560px">
    <DPair name="Konsole" note="share/konsole/SageInk.profile Font; apply.sh writes hosts [konsole] font_size over it. Stock: Konsole's default profile uses the system fixed font. The browser applies Iosevka's ligatures (-> as an arrow); whether Konsole does depends on its version — check live.">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="view term">
          <div class="who">{who(lane, 'terminal')}</div>
          <pre class="code" style={fam('terminal')}>johnn@nobara:~/projects/indigo-glass$ ls -l
drwxr-xr-x 1 johnn johnn  320 Sep 25 fonts
-rw-r--r-- 1 johnn johnn 2577 Sep 25 README.md
$ echo '{GLYPHS}'
{GLYPHS}</pre>
          <div class="weights" style={fam('terminal')}>{#each weightsFor(lane, 'terminal') as w}<span style="font-weight:{w.w}">{w.label}</span>{/each}</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="GTK 3 / GTK 4" note="gtk-font-name from config/gtk-3.0 and gtk-4.0 settings.ini. Stock: kde-gtk-config copies the general font. Ours sized by --host-body-pt (hosts [gtk] font_pt equals body_pt in both profiles).">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="win">
          <div class="gtkbar" style={fam('gtk3')}>GTK 3 — {who(lane, 'gtk3')}</div>
          {@render specimen(lane, 'gtk3', 'A GTK 3 dialog: Firefox’s file picker or GIMP’s preferences use gtk-font-name.')}
          <div class="gtkbar" style={fam('gtk4')}>GTK 4 — {who(lane, 'gtk4')}</div>
          <div class="glyphs" style={fam('gtk4')}>{GLYPHS}</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="headings" title="Headings" lead="Kirigami headings as Plasma draws them from the general font; ours also shows the token heading roles CSS consumers use" min="560px">
    <DPair name="headings" span="full">
      {#snippet children(lane: Lane<FontsModel>)}
        <div class="win heads">
          {#each lane.model.headings as h}
            <div class="head" style="font-family:var(--f-{h.stack === 'chrome' ? 'menu' : 'body'}-family);font-size:{h.size};font-weight:{h.weight}">
              <span>{h.pt}pt {h.weight} — Settings and Appearance</span>
              <span class="hsub">{h.label}</span>
            </div>
          {/each}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="bundle" title="Font bundle" lead="share/fonts/indigo-glass-fonts — every file, and what its README claims" min="520px">
    <div class="card">
      <h3>README <span class="sub">"{README_TITLE}"</span></h3>
      <table class="mini" data-testid="readme-claims">
        <thead><tr><th>Folder</th><th>README files</th><th>tracked files</th><th>Licence</th></tr></thead>
        <tbody>
          {#each README_ROWS as r}
            <tr class:rowbad={r.claimed !== r.actual || /proprietary/i.test(r.licence)}>
              <td class="mono">{r.dir}/</td><td>{r.claimed}</td><td>{r.actual}</td>
              <td>{r.licence}{#if /proprietary/i.test(r.licence) && r.actual > 0} <span class="badge bad">shipped in the repo bundle</span>{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <ul class="sub">
        {#if /Lime Glass/.test(README_TITLE)}<li>The README is headed "Lime Glass"; Lime is token-only (CLAUDE.md) — the bundle serves Sage Ink.</li>{/if}
        {#if README_NOT_SHIPPED && BUNDLE_FILES.some((f) => f.includes('Condensed'))}<li>README says "Iosevka Custom Condensed (NOT shipped)"; the bundle tracks {BUNDLE_FILES.filter((f) => f.includes('Condensed')).length} Condensed files (the simulator's static copy is the same file).</li>{/if}
        <li>Iosevka Custom has Thin / Regular / Heavy only (build plan weights 100/400/900): a 700 request on mono draws Heavy or a synthetic bold.</li>
      </ul>
    </div>
    <div class="card">
      <h3>Files</h3>
      <table class="mini">
        <thead><tr><th>File</th><th>Family folder</th></tr></thead>
        <tbody>
          {#each BUNDLE_FILES as f}
            <tr data-bundle={f}><td class="mono small">{f.split('/')[1]}</td><td>{f.split('/')[0]}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h3>Iosevka build plan <span class="sub">share/fonts/private-build-plans.toml</span></h3>
      <table class="mini">
        <thead><tr><th>Section</th><th>Key</th><th>Value</th></tr></thead>
        <tbody>
          {#each BUILD_PLAN as p}
            <tr data-plan-key="{p.section}/{p.key}"><td class="mono small">{p.section.replace('buildPlans.IosevkaCustom', '…')}</td><td class="mono">{p.key}</td><td class="mono">{String(p.value)}</td></tr>
          {/each}
        </tbody>
      </table>
      <p class="sub">Double-storey a/g is pinned in the plan; the glyph lines above end in "ag" so the storey is visible in every role.</p>
    </div>
    <div class="card">
      <h3>kdeglobals.snippet, non-font keys</h3>
      <table class="mini">
        <tbody>{#each otherKeys as o}<tr><td class="mono">{o.k}</td><td class="mono">{o.v}</td></tr>{/each}</tbody>
      </table>
      <p class="sub">Colour scheme, widget style and icon keys; their effect is rendered on /desktop/kde-colors/.</p>
    </div>
  </Section>
</DesktopPage>

<style>
  .wide { grid-column: 1 / -1; min-width: 0; }
  .scroll { overflow-x: auto; }
  .tally { margin: 0 0 8px; font-size: 13pt; font-family: "SF Pro Display", system-ui, sans-serif; }
  .badge { display: inline-block; padding: 0 6px; border: 2px solid var(--ig-border-strong); font-family: "Iosevka Custom Condensed", monospace; font-size: 9pt; font-weight: 700; letter-spacing: 0.04em; }
  .tally .badge { font-size: 13pt; padding: 0 10px; margin-right: 6px; }
  .badge.ok { border-color: var(--ig-positive); color: var(--ig-positive); }
  .badge.bad { border-color: var(--ig-negative); color: var(--ig-negative); }
  .badge.warn { border-color: var(--ig-amber); color: var(--ig-amber); }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  th, td { text-align: left; vertical-align: top; padding: 4px 8px; border-bottom: 1px solid var(--ig-border); }
  th { color: var(--ig-text-muted); font-weight: 500; }
  .check tr { border-left: 4px solid var(--ig-positive); }
  .check tr.rowbad { border-left-color: var(--ig-negative); }
  .check thead tr { border-left-color: transparent; }
  .role { font-weight: 700; white-space: nowrap; }
  .mono, code { font-family: "Iosevka Custom Condensed", monospace; }
  .small { font-size: 8.5pt; }
  .sub { color: var(--ig-text-muted); font-weight: 400; font-size: 8.5pt; }
  .cbad, .cbad strong { color: var(--ig-negative); }
  .cwarn { color: var(--ig-amber); }
  tr.rowbad td { color: inherit; }
  .card { background: var(--ig-surface); border: 1px solid var(--ig-border); padding: 8px 10px; min-width: 0; }
  .card h3 { margin: 0 0 6px; font-family: "SF Pro Display", system-ui, sans-serif; font-size: var(--ig-heading-pt); }
  .card ul { margin: 6px 0 0; padding-left: 18px; }
  .card p { margin: 6px 0 0; line-height: var(--ig-lh-default); }
  .mini td, .mini th { padding: 2px 6px; }
  .mini tr.rowbad td { color: var(--ig-negative); }

  /* specimens: paint only from lane variables */
  .win { width: 100%; background: var(--f-window-bg); color: var(--f-window-fg); border: 1px solid var(--f-rule); }
  .view { width: 100%; background: var(--f-view-bg); color: var(--f-view-fg); border: 1px solid var(--f-rule); padding: 8px 10px; }
  .spec { padding: 8px 10px; }
  .who { font-family: "Iosevka Custom Condensed", monospace; font-size: 8pt; font-weight: 400; color: var(--f-window-muted); margin-bottom: 4px; }
  .glyphs { font-size: 1.25em; letter-spacing: 0.02em; margin: 2px 0 4px; }
  .weights { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-bottom: 4px; }
  .para { margin: 0; line-height: 1.4; max-width: 70ch; }
  .menu { padding: 4px 0; max-width: 360px; }
  .menu .who { padding: 0 12px; }
  .mi { display: flex; justify-content: space-between; gap: 24px; padding: 3px 12px; }
  .kb { color: var(--f-window-muted); }
  .sep { height: 1px; margin: 3px 8px; background: var(--f-rule); }
  .toolbar { display: flex; gap: 4px; padding: 5px 8px; border-bottom: 1px solid var(--f-rule); }
  .tb { padding: 2px 8px; border: 2px solid var(--f-rule); }
  .caption { padding-top: 8px; }
  .tip { display: inline-block; margin: 0 10px; padding: 3px 8px; border: 1px solid var(--f-rule); background: var(--f-view-bg); }
  .muted { color: var(--f-window-muted); }
  .title { display: flex; padding: 5px 8px; background: var(--f-title-bg); color: var(--f-title-fg); border-bottom: 1px solid var(--f-rule); }
  .tt { flex: 1; text-align: center; }
  .code { margin: 0; white-space: pre-wrap; word-break: break-word; line-height: 1.4; }
  .cm { color: var(--f-window-muted); }
  .term .code { margin-bottom: 4px; }
  .gtkbar { padding: 5px 10px; border-bottom: 1px solid var(--f-rule); }
  .gtkbar ~ .glyphs { padding: 0 10px 8px; }
  .heads { padding: 8px 12px; display: grid; gap: 6px; }
  .head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; line-height: 1.2; }
  .hsub { font-family: "Iosevka Custom Condensed", monospace; font-size: 8pt; font-weight: 400; color: var(--f-window-muted); }
</style>
