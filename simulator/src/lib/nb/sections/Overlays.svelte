<script lang="ts">
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';
</script>

<Section id="overlays" title="Overlays &amp; disclosure"
  lead="all forced open and in flow — positioning, collision and stacking are NOT under test here"
  min="300px">

  <Specimen name="alert" span={2} variant="divergence"
    note="Reference has exactly two variants: `default` (accent fill) and `destructive` (literally bg-black text-white). Black-on-near-black is invisible here, so destructive is bound to the `negative` token, and warning/positive are added — the reference has no semantic colour scale at all.">
    <div class="col wfull">
      <div class="nb-alert nb-alert--default">
        <span class="nb-alert-icon" aria-hidden="true">&#9679;</span>
        <div class="nb-alert-title">Tokens regenerated</div>
        <div class="nb-alert-description">21 outputs written from tokens/indigo-glass.tokens.toml.</div>
      </div>
      <div class="nb-alert nb-alert--destructive">
        <span class="nb-alert-icon" aria-hidden="true">&#9679;</span>
        <div class="nb-alert-title">Palette drift detected</div>
        <div class="nb-alert-description">3 files carry a pre-nudge `positive` hex.</div>
      </div>
      <div class="nb-alert nb-alert--warning">
        <span class="nb-alert-icon" aria-hidden="true">&#9679;</span>
        <div class="nb-alert-title">Klassy rebuild required</div>
        <div class="nb-alert-description">Radius token changed; the live decoration is unchanged until reinstall.</div>
      </div>
      <div class="nb-alert nb-alert--positive">
        <span class="nb-alert-icon" aria-hidden="true">&#9679;</span>
        <div class="nb-alert-title">Parity check clean</div>
        <div class="nb-alert-description">Every deployed scheme matches its generated counterpart.</div>
      </div>
    </div>
  </Specimen>

  <Specimen name="dialog" span={2}
    note="Rendered in-flow with its scrim rather than position:fixed, so one full-page screenshot captures every overlay at once. The scrim is --overlay, the single Tier A alpha on this page.">
    <div class="nb-overlay-scrim wfull">
      <div class="nb-dialog">
        <div>
          <div class="nb-dialog-title">Edit profile</div>
          <div class="nb-dialog-description">Make changes to your profile here. Click save when you're done.</div>
        </div>
        <div class="col">
          <label class="nb-label" for="nb-dlg-name">Name</label>
          <input class="nb-input" id="nb-dlg-name" value="John Rebellion" />
        </div>
        <div class="nb-dialog-footer">
          <button type="button" class="nb-button nb-button--neutral">Cancel</button>
          <button type="button" class="nb-button nb-button--default">Save changes</button>
        </div>
      </div>
    </div>
  </Specimen>

  <Specimen name="alert-dialog" span={2}
    note="Same surface as dialog; the difference is semantic (no close affordance, an explicit Continue/Cancel pair).">
    <div class="nb-overlay-scrim wfull">
      <div class="nb-dialog">
        <div>
          <div class="nb-dialog-title">Are you absolutely sure?</div>
          <div class="nb-dialog-description">This permanently deletes the SageInk colour scheme from ~/.local/share.</div>
        </div>
        <div class="nb-dialog-footer">
          <button type="button" class="nb-button nb-button--neutral">Cancel</button>
          <button type="button" class="nb-button nb-button--default">Continue</button>
        </div>
      </div>
    </div>
  </Specimen>

  <Specimen name="sheet" span={2}
    note="Reference sheet is a bordered edge panel — no radius, no shadow, borders on all sides in the class but only the inner edge is visible when docked.">
    <div class="sheet-frame">
      <div class="sheet-body"><span class="cap">page content behind</span></div>
      <div class="nb-sheet w260">
        <div>
          <div class="nb-dialog-title">Settings</div>
          <div class="nb-dialog-description">Applies immediately.</div>
        </div>
        <div class="col wfull">
          <label class="nb-label" for="nb-sheet-var">Variant</label>
          <button type="button" class="nb-select-trigger" id="nb-sheet-var">Sage <span aria-hidden="true">&#9662;</span></button>
        </div>
        <button type="button" class="nb-button nb-button--default">Save</button>
      </div>
    </div>
  </Specimen>

  <Specimen name="drawer" span={2}
    note="Bottom-anchored variant (Vaul in the reference). The grab handle is a `full`-radius bar in --border — one of the only places the pill radius appears outside a circle.">
    <div class="drawer-frame">
      <div class="nb-sheet">
        <div class="nb-drawer-handle"></div>
        <div class="nb-dialog-title">Move goal</div>
        <div class="nb-dialog-description">Set your daily activity goal.</div>
        <div class="nb-slider"><div class="nb-slider-track"><div class="nb-slider-range" style="width:48%"></div></div><span class="nb-slider-thumb" style="left:calc(48% - 10px)"></span></div>
        <div class="row"><button type="button" class="nb-button nb-button--default">Submit</button><button type="button" class="nb-button nb-button--neutral">Cancel</button></div>
      </div>
    </div>
  </Specimen>

  <Specimen name="popover">
    <div class="col">
      <button type="button" class="nb-button nb-button--neutral nb-button--sm">Open popover</button>
      <div class="nb-popover">
        <strong>Dimensions</strong>
        <p class="pop-p">Set the dimensions for the layer.</p>
        <div class="col wfull">
          <input class="nb-input" value="100%" />
          <input class="nb-input" value="25px" />
        </div>
      </div>
    </div>
  </Specimen>

  <Specimen name="tooltip"
    variant="divergence"
    note="Accent fill, 2px border, no shadow — all three match. Typography does not: the reference is text-sm (14px), this is caption (9pt, ~12px). Caught by GPT in the 2026-09-02 cross-model audit; the note here previously claimed 8pt, which no rule in the file ever set.">
    <div class="col">
      <button type="button" class="nb-button nb-button--neutral nb-button--sm">Hover</button>
      <span class="nb-tooltip">Add to library</span>
    </div>
  </Specimen>

  <Specimen name="hover-card">
    <div class="col">
      <a href="#overlays">@sage-ink</a>
      <div class="nb-hovercard">
        <div class="row">
          <span class="nb-avatar">SI</span>
          <div><strong>Sage Ink</strong><br /><span class="cap-inv">Cross-platform ink for Plasma.</span></div>
        </div>
      </div>
    </div>
  </Specimen>

  <Specimen name="sonner / toast" span={2}
    variant="divergence"
    note="Heading weight and accent/neutral action buttons match. The reference hardcodes 13px — the only px font size in the library — and this uses caption (9pt, ~12px) so the toast stays on the pt scale with everything else.">
    <div class="col">
      <div class="nb-toast">
        <span>Colour scheme applied.</span>
        <span class="row"><button type="button" class="nb-button nb-button--default nb-button--sm">Undo</button></span>
      </div>
      <div class="nb-toast">
        <span>Klassy rebuild finished.</span>
        <span class="row"><button type="button" class="nb-button nb-button--neutral nb-button--sm">Dismiss</button></span>
      </div>
    </div>
  </Specimen>

  <Specimen name="accordion" span={2}
    note="Accent-filled trigger, secondary-background content, and the item keeps the ink shadow while open — so an open accordion still reads as one elevated object rather than two stacked ones.">
    <div class="nb-accordion wfull">
      <div class="nb-accordion-item" data-state="open">
        <button type="button" class="nb-accordion-trigger">Is it accessible? <span class="nb-accordion-chevron" aria-hidden="true">&#9662;</span></button>
        <div class="nb-accordion-content">Sage on base is 11.00:1. It is fill-only — 1.72:1 against text — so it never carries body copy.</div>
      </div>
      <div class="nb-accordion-item" data-state="closed">
        <button type="button" class="nb-accordion-trigger">Is it styled? <span class="nb-accordion-chevron" aria-hidden="true">&#9662;</span></button>
      </div>
      <div class="nb-accordion-item" data-state="closed">
        <button type="button" class="nb-accordion-trigger">Is it animated? <span class="nb-accordion-chevron" aria-hidden="true">&#9662;</span></button>
      </div>
    </div>
  </Specimen>

  <Specimen name="collapsible" variant="accommodation"
    note="Unstyled in the reference — it is behaviour only. Shown composed with a neutral button and a bordered content block, which is how the docs demo it.">
    <div class="col wfull">
      <div class="row between wfull">
        <strong>@sage starred 3 repositories</strong>
        <button type="button" class="nb-button nb-button--neutral nb-button--icon" aria-label="Toggle">&#8597;</button>
      </div>
      <div class="collapse-item">ekmas/neobrutalism-components</div>
      <div class="collapse-item">paulmillr/klassy</div>
      <div class="collapse-item">be5invis/Iosevka</div>
    </div>
  </Specimen>
</Section>

<style>
  .col { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ig-gap-lg); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ig-gap-md); }
  .between { justify-content: space-between; }
  .wfull { width: 100%; }
  .w260 { width: 260px; }
  .cap { font-size: var(--ig-type-xs-pt); color: var(--ig-text-muted); }
  .cap-inv { font-size: var(--ig-type-xs-pt); }
  .pop-p { margin: 4px 0 10px; font-size: var(--ig-caption-pt); }

  .sheet-frame {
    display: flex;
    width: 100%;
    min-height: 220px;
    background: var(--ig-surface);
    border: var(--ig-border-hairline) solid var(--ig-border);
  }
  .sheet-body { flex: 1; display: grid; place-items: center; }

  .drawer-frame {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    width: 100%;
    min-height: 220px;
    background: var(--ig-surface);
    border: var(--ig-border-hairline) solid var(--ig-border);
  }

  .collapse-item {
    width: 100%;
    padding: var(--ig-pad-lg);
    border: var(--ig-border-default) solid var(--ig-border-strong);
    font-size: var(--ig-caption-pt);
  }
</style>
