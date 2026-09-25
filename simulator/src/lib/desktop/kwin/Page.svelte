<script lang="ts">
  /* KWin settings vs Plasma 6 defaults: compositor effects (must be off —
   * that's the CRITICAL check the brief calls out, wired as Role rows so a
   * regression shows the same red "DRIFT" every token check does, not just a
   * code comment), decoration binding, maximised-window borders, the
   * kwinrc.snippets/kwinrc-blur.ini parity check, and the retired
   * kwinrulesrc.snippet global-opacity rule. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import {
    stock as kdeStock,
    ours as kdeOurs,
    laneVars
  } from '../kde-colors/model';
  import {
    kwinBlurIni,
    kwinRules,
    kwinRulesText,
    STOCK_NOTE,
    SETTINGS_ROWS,
    PARITY_OK,
    markSnippetsParity,
    blurAndContrastOff,
    noForcedOpacity,
    coverage
  } from './model';

  markSnippetsParity();

  type KwinLane = { style: string };
  const lanes = {
    stock: {
      which: 'stock' as const,
      label: 'Plasma 6 defaults: Breeze decoration, Blur + Background Contrast on, no forced opacity',
      style: laneVars(kdeStock),
      model: { style: kdeStock.style } as KwinLane
    },
    ours: {
      which: 'ours' as const,
      label: 'kwinrc-blur.ini + kwinrc.snippets: Klassy decoration, Blur + Background Contrast off, no forced opacity',
      style: laneVars(kdeOurs),
      model: { style: kdeOurs.style } as KwinLane
    }
  };

  const rows = SETTINGS_ROWS.map((r) => ({ ...r, ours: kwinBlurIni.get(r.group, r.key) ?? '—' }));
  const blurOk = blurAndContrastOff();
  const opacityOk = noForcedOpacity();
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} coverage={() => coverage()}>
  <Section
    id="compositor"
    title="Compositor effects"
    lead="Plasma ships Blur and Background Contrast on by default (see the Stock note in the header). This repo turns both off in tokens/out/kwinrc-blur.ini so window chrome stays opaque flat ink, no translucency — asserted below as Role rows (No blur / background-contrast compositing), not just shown here."
    min="220px"
  >
    <DPair name="popup over desktop" span="full" note="Stock: KWin's Blur effect blurs whatever is behind a translucent surface (System Settings > Desktop Effects > Blur, on by default) — depicted here with a CSS blur filter over an opaque fill, since this repo's own ink-contract lint forbids real translucent fills/shadows even for a stock-comparison specimen. Ours: blurEnabled=false, so the popup edge stays sharp against the desktop with no compositing pass at all.">
      {#snippet children(lane: Lane<KwinLane>)}
        <div class="compositor" data-style={lane.model.style}>
          <div class="wallpaper"></div>
          <div class="panel"></div>
          <div class="popup">Popup / overlay</div>
        </div>
      {/snippet}
    </DPair>
    <div class="check" class:bad={!blurOk}>
      <strong>{blurOk ? 'OK' : 'REGRESSION'}</strong>
      <span>
        Plugins/blurEnabled={kwinBlurIni.get('Plugins', 'blurEnabled')},
        better_blur_dxEnabled={kwinBlurIni.get('Plugins', 'better_blur_dxEnabled')},
        backgroundcontrastEnabled={kwinBlurIni.get('Plugins', 'backgroundcontrastEnabled')}
        {blurOk ? '— all off, as shipped' : '— one of these is enabled, reintroducing translucency'}
      </span>
    </div>
  </Section>

  <Section
    id="decoration"
    title="Decoration binding + window borders"
    lead="org.kde.kdecoration2/library picks which decoration plugin paints every window's title bar and buttons — /desktop/klassy-decoration/ renders what this binding actually looks like in full; this page only checks the binding itself and the one KWin-level (not decoration-level) border setting, BorderlessMaximizedWindows."
    min="220px"
  >
    <DPair name="maximised window border" note="Windows/BorderlessMaximizedWindows=true (kwinrc-blur.ini): the maximised window's side/bottom frame disappears, flush with the screen edge. Stock Plasma keeps a border on maximised windows by default.">
      {#snippet children(lane: Lane<KwinLane>)}
        <div class="winframe" class:maxed={lane.which === 'ours'} data-style={lane.model.style}>
          <div class="wtitle">Dolphin — maximised</div>
          <div class="wbody">Window content</div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section
    id="settings"
    title="kwinrc-blur.ini (generated, installed) — every key"
    lead={`kwinrc.snippets (hand-kept) is byte-identical to this file right now — parity ${PARITY_OK ? 'holds' : 'BROKEN'}, checked below as a Role row rather than assumed. ${STOCK_NOTE}`}
    min="160px"
  >
    <table class="rows" data-testid="kwin-settings">
      <thead><tr><th>Group</th><th>Key</th><th>Shipped</th><th>Plasma 6 stock</th></tr></thead>
      <tbody>
        {#each rows as r}
          <tr>
            <td><code>{r.group}</code></td>
            <td><code>{r.key}</code></td>
            <td><code>{r.ours}</code></td>
            <td>{r.stock ?? '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Section>

  <Section
    id="rules"
    title="kwinrulesrc.snippet — retired global-opacity rule"
    lead="Found live 2026-09-25: this file forced opacityactive=88 / opacityinactive=85 onto every window (wmclass=.*, a Force rule) — the exact translucency Sage Ink v5 removed from tokens.toml. It is not applied by scripts/install.sh (grep confirms no reference to it there), so nothing currently installs this, but it sat on disk ready to be kwriteconfig6'd by hand. Fixed in place: the file now carries zero real INI keys, only its own history comment — checked below as a Role row (No forced window opacity), not just described here."
    min="120px"
  >
    <div class="check" class:bad={!opacityOk}>
      <strong>{opacityOk ? 'OK' : 'REGRESSION'}</strong>
      <span>{kwinRules.groups.length} group(s) in kwinrulesrc.snippet ({opacityOk ? 'comment-only, as fixed' : 'a group reappeared — check for a reinstated opacity rule'})</span>
    </div>
    <pre class="raw">{kwinRulesText}</pre>
  </Section>
</DesktopPage>

<style>
  .compositor {
    position: relative;
    width: 220px;
    height: 130px;
    background: var(--ig-surface-alt, var(--ig-surface));
    border: var(--ig-border-hairline) solid var(--ig-border-strong);
    overflow: hidden;
  }
  .wallpaper {
    position: absolute;
    inset: 0;
    background: var(--ig-sidebar, var(--ig-surface));
  }
  .panel {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 22px;
    background: var(--ig-border-strong);
  }
  .popup {
    position: absolute;
    top: 18px; left: 24px;
    width: 140px;
    padding: 10px;
    background: var(--ig-border-strong);
    color: var(--ig-text);
    font-size: 9pt;
    border: var(--ig-border-hairline) solid var(--ig-border);
  }
  /* Depicts the STOCK lane's real Blur effect (Plasma default,
     Plugins/blurEnabled=true) on an opaque fill via a CSS filter, not a
     literal translucent value — this repo's own ink-contract lint already
     accepts the same technique in .svelte sources. Ours (Klassy config) has
     no filter at all, which is the point of the specimen. */
  .compositor[data-style='Breeze'] .panel,
  .compositor[data-style='Breeze'] .popup {
    filter: blur(2.5px); /* drift-allow: stock-lane Blur effect depiction, opaque fill, see comment above */
  }

  .winframe {
    width: 220px;
    border: 3px solid var(--ig-border-strong);
    background: var(--ig-surface);
  }
  .winframe.maxed { border-width: 0; }
  .wtitle {
    padding: 5px 8px;
    background: var(--ig-sidebar, var(--ig-surface));
    color: var(--ig-text);
    font-size: 9.5pt;
    border-bottom: var(--ig-border-hairline) solid var(--ig-border-strong);
  }
  .wbody { padding: 16px 8px; color: var(--ig-text-muted); font-size: 9pt; }

  .rows { border-collapse: collapse; width: 100%; font-size: 9pt; }
  .rows th, .rows td { text-align: left; padding: 3px 8px; border-bottom: 1px solid var(--ig-border); font-family: "Iosevka Custom Condensed", monospace; }
  .rows th { color: var(--ig-text-muted); font-weight: 500; }

  .check { display: flex; gap: 8px; align-items: baseline; font-size: 9.5pt; margin-bottom: 8px; }
  .check strong { color: var(--ig-positive); font-family: "Iosevka Custom Condensed", monospace; }
  .check.bad strong { color: var(--ig-negative); }
  .raw {
    margin: 0;
    padding: 10px;
    background: var(--ig-surface-alt, var(--ig-surface));
    border: var(--ig-border-hairline) solid var(--ig-border);
    font-family: "Iosevka Custom Condensed", monospace;
    font-size: 8.5pt;
    white-space: pre-wrap;
    max-height: 260px;
    overflow: auto;
  }
</style>
