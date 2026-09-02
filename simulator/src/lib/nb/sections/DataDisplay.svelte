<script lang="ts">
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';

  const rows = [
    { id: 'INV001', layer: 'Klassy',  status: 'Paid',    total: '$250.00' },
    { id: 'INV002', layer: 'GTK4',    status: 'Pending', total: '$150.00' },
    { id: 'INV003', layer: 'Konsole', status: 'Unpaid',  total: '$350.00' }
  ];

  /* Static bar chart — same five chart slots the reference's Recharts
     wrapper consumes, drawn as plain SVG so the page has no chart dep. */
  const bars = [
    { label: 'sage',  v: 78, key: 'var(--chart-1)' },
    { label: 'blue',  v: 52, key: 'var(--chart-2)' },
    { label: 'amber', v: 64, key: 'var(--chart-3)' },
    { label: 'mint',  v: 41, key: 'var(--chart-4)' },
    { label: 'iris',  v: 33, key: 'var(--chart-5)' }
  ];
</script>

<Section id="data" title="Data display" lead="card, image card, badge, avatar, table, data table, progress, skeleton, chart, marquee, scroll area, resizable, carousel" min="300px">

  <Specimen name="card" variant="divergence"
    note="Reference card fill is `bg-background` — the SAME colour as the page — so the card reads only via its 2px border and hard shadow. On Sage Ink's near-black base that is the strongest argument for lifting --border off pure black.">
    <div class="nb-card w260">
      <div class="nb-card-header">
        <div class="nb-card-title">Sage Ink</div>
        <div class="nb-card-description">Cross-platform ink for Plasma 6.6+</div>
      </div>
      <div class="nb-card-content">Opaque flat surfaces, hard offset shadow, colour-as-elevation.</div>
      <div class="nb-card-footer">
        <button type="button" class="nb-button nb-button--default nb-button--sm">Install</button>
        <button type="button" class="nb-button nb-button--neutral nb-button--sm">Docs</button>
      </div>
    </div>
  </Specimen>

  <Specimen name="image-card"
    note="Fixed 250px width in the reference, accent-filled body, media separated by a 2px border.">
    <div class="nb-image-card">
      <div class="nb-image-card-media"><span class="media-mark" aria-hidden="true">▦</span></div>
      <div class="nb-image-card-caption">Wallpaper — sage on ink</div>
    </div>
  </Specimen>

  <Specimen name="badge" variant="extends"
    note="Reference ships two variants (default / neutral). The `tag` cell is Sage Ink's own addition: [radius].xs = 2px exists for tags and small badges, the one soft step ink permits.">
    <div class="row">
      <span class="nb-badge nb-badge--default">default</span>
      <span class="nb-badge nb-badge--neutral">neutral</span>
      <span class="nb-badge nb-badge--neutral nb-badge--tag">tag (radius xs)</span>
      <span class="nb-badge nb-badge--default"><span aria-hidden="true">&#9679;</span> with icon</span>
    </div>
  </Specimen>

  <Specimen name="avatar">
    <div class="row">
      <span class="nb-avatar">SI</span>
      <span class="nb-avatar">JR</span>
      <span class="nb-avatar" style="background:var(--main);color:var(--main-foreground)">A</span>
    </div>
  </Specimen>

  <Specimen name="table" span="full" variant="divergence"
    note="The loudest single move in the library: every table ROW is accent-filled (bg-main on <tr>), and a selected row inverts to secondary-background. Reproduced faithfully — but on Sage Ink the accent is fill-only and cannot carry text, so the row text is main-foreground (#07080A) throughout.">
    <table class="nb-table">
      <caption>Layers billed this cycle</caption>
      <thead><tr><th>Invoice</th><th>Layer</th><th>Status</th><th>Total</th></tr></thead>
      <tbody>
        {#each rows as r, i}
          <tr data-state={i === 1 ? 'selected' : undefined}>
            <td>{r.id}</td><td>{r.layer}</td><td>{r.status}</td><td>{r.total}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot><tr><td colspan="3">Total</td><td>$750.00</td></tr></tfoot>
    </table>
  </Specimen>

  <Specimen name="data-table" span="full" variant="accommodation"
    note="Composed in the reference from table + checkbox + dropdown-menu + pagination; it has no styling of its own. Shown with the toolbar, selection column and footer that composition implies.">
    <div class="dt">
      <div class="dt-bar">
        <input class="nb-input w220" placeholder="Filter layers…" />
        <button type="button" class="nb-button nb-button--neutral nb-button--sm">Columns <span aria-hidden="true">&#9662;</span></button>
      </div>
      <table class="nb-table">
        <thead><tr><th><span class="nb-checkbox" data-state="indeterminate" aria-hidden="true">&minus;</span></th><th>Layer</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {#each rows as r, i}
            <tr data-state={i === 0 ? 'selected' : undefined}>
              <td><span class="nb-checkbox" data-state={i === 0 ? 'checked' : 'unchecked'} aria-hidden="true">{i === 0 ? '✓' : ''}</span></td>
              <td>{r.layer}</td><td>{r.status}</td><td>&#8943;</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="dt-bar between">
        <span class="cap">1 of 3 row(s) selected.</span>
        <div class="row">
          <button type="button" class="nb-button nb-button--neutral nb-button--sm">Previous</button>
          <button type="button" class="nb-button nb-button--neutral nb-button--sm">Next</button>
        </div>
      </div>
    </div>
  </Specimen>

  <Specimen name="progress" span={2}
    note="The indicator carries its own 2px right border, so the fill terminates in a hard edge rather than fading — the same zero-blur discipline as the shadow.">
    <div class="col wfull">
      {#each [18, 46, 82, 100] as p}
        <div class="nb-progress"><div class="nb-progress-indicator" style="width:{p}%"></div></div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="skeleton">
    <div class="col wfull">
      <div class="nb-skeleton" style="height:40px;width:40px;border-radius:var(--ig-radius-full)"></div>
      <div class="nb-skeleton" style="height:14px;width:100%"></div>
      <div class="nb-skeleton" style="height:14px;width:70%"></div>
    </div>
  </Specimen>

  <Specimen name="chart" span={2} variant="accommodation"
    note="Reference chart is a Recharts wrapper; drawn here as static SVG so the page carries no chart dependency. Slot 1 is the accent, slot 4 is `positive` at hue 165 — nudged 12.5 off sage precisely so a success bar never reads as a brand bar.">
    <div class="nb-chart wfull">
      <svg viewBox="0 0 320 120" width="100%" height="120" role="img" aria-label="Sample bar chart using the five chart slots">
        <line x1="0" y1="100" x2="320" y2="100" stroke="var(--border)" stroke-width="2" />
        {#each bars as b, i}
          <rect x={12 + i * 62} y={100 - b.v} width="44" height={b.v} fill={b.key} stroke="var(--border)" stroke-width="2" />
        {/each}
        <circle cx={12 + 2 * 62 + 22} cy={100 - bars[2].v} r="4" fill="var(--chart-active-dot)" stroke="var(--border)" stroke-width="2" />
      </svg>
      <div class="nb-chart-legend">
        {#each bars as b}
          <span><span class="nb-chart-key" style="background:{b.key}"></span>{b.label}</span>
        {/each}
        <span><span class="nb-chart-key" style="background:var(--chart-active-dot)"></span>active dot</span>
      </div>
    </div>
  </Specimen>

  <Specimen name="marquee" span={2}
    note="Reference marquee is bordered top and bottom only, filled with secondary-background — a band, not a card.">
    <div class="nb-marquee">
      <div class="nb-marquee-track">
        {#each ['OPAQUE', 'FLAT', 'HARD SHADOW', 'COLOUR AS ELEVATION', 'NO GLASS', 'NO BLUR'] as w}
          <span>{w} &#9679;</span>
        {/each}
      </div>
    </div>
  </Specimen>

  <Specimen name="scroll-area" variant="accommodation"
    note="Sage Ink styles the thumb with the real accent_alt token rather than a translucent blend — a scrollbar thumb is Tier D (identity fill), so it may not be a wash.">
    <div class="nb-scroll-area">
      {#each Array(12) as _, i}
        <p class="sa-line">Tag {i + 1} — v{i + 1}.0.0 release notes for the ink material.</p>
      {/each}
    </div>
  </Specimen>

  <Specimen name="resizable" variant="accommodation">
    <div class="nb-resizable wfull">
      <div class="nb-resizable-panel">One</div>
      <div class="nb-resizable-handle"></div>
      <div class="nb-resizable-panel">Two</div>
    </div>
  </Specimen>

  <Specimen name="carousel" span={2} variant="accommodation">
    <div class="nb-carousel wfull">
      <button type="button" class="nb-button nb-button--neutral nb-button--icon" aria-label="Previous slide">&#8249;</button>
      <div class="nb-carousel-viewport">
        {#each [1, 2, 3, 4, 5] as n}<div class="nb-carousel-slide">{n}</div>{/each}
      </div>
      <button type="button" class="nb-button nb-button--neutral nb-button--icon" aria-label="Next slide">&#8250;</button>
    </div>
  </Specimen>

  <Specimen name="separator" variant="extends"
    note="Not a registry component — included because Sage Ink's [border] table is two-track and the pairing rule matters: a 1px hairline is never combined with an ink shadow.">
    <div class="col wfull">
      <span class="cap">border.default — 2px</span>
      <hr class="nb-separator" />
      <span class="cap">border.hairline — 1px, quiet dividers only</span>
      <hr class="nb-separator nb-separator--hairline" />
    </div>
  </Specimen>
</Section>

<style>
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ig-gap-lg); }
  .col { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ig-gap-md); }
  .wfull { width: 100%; }
  .w260 { width: 260px; }
  .cap { font-size: var(--ig-type-xs-pt); color: var(--ig-text-muted); }

  .dt { display: flex; flex-direction: column; gap: var(--ig-gap-lg); width: 100%; }
  .dt-bar { display: flex; align-items: center; gap: var(--ig-gap-lg); }
  .between { justify-content: space-between; }
  .dt :global(.w220) { width: 220px; }

  .media-mark { font-size: var(--ig-type-hero-pt); color: var(--ig-text-dim); }
  .sa-line { margin: 0 0 8px; }
</style>
