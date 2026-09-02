<script lang="ts">
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';
  import { ROSTER } from '../roster';

  /* Every place Sage Ink knowingly departs from ekmas/neobrutalism-components.
     `open` is the question a reviewing model is being asked to answer — the
     point of the page is to get these adjudicated, not to defend them. */
  const divergences = [
    {
      area: '--border',
      ref: 'oklch(0% 0 0) — pure black, both modes',
      ink: 'border_strong #5E5E60 on dark; the reference\'s BLACK on light surfaces',
      why: 'RESOLVED 2026-09-02. A border is painted at the element\'s edge, between its fill and its backdrop, so it has to survive both. Measured: light fill on a light surface — black 11.53:1 vs neutral 3.55:1; light fill on the dark page — neutral 3.00:1 vs black 1.08:1.',
      open: 'Settled, and it is conditional rather than a flat divergence. border_strong was also raised 1.31:1 -> 3.10:1 after the self-audit found 23 of 42 components with no perceptible edge.'
    },
    {
      area: '--shadow colour',
      ref: '4px 4px 0 0 var(--border) — black',
      ink: 'accent_alt #89A889 on dark backdrops; the reference\'s BLACK on light ones',
      why: 'RESOLVED 2026-09-02. A shadow is painted on the BACKDROP only, so it flips on a different condition than the border. Measured: on the accent fill, sage 1.44:1 vs black 11.53:1; on the page, sage 7.66:1 vs black 1.05:1.',
      open: 'Settled. Nothing on this page currently casts onto a light surface, so the rule is preventative — it matters the moment a shadowed control is composed inside an accent-filled popover, menu or alert.'
    },
    {
      area: '--shadow, web layer',
      ref: 'black',
      ink: 'web/app.css.example keeps BLACK; every other layer uses sage',
      why: 'The web file follows the reference schema verbatim by design; the desktop layers follow tokens.toml.',
      open: 'Two answers ship simultaneously. Which one is the system’s actual position?'
    },
    {
      area: 'radius',
      ref: '--border-radius: 5px',
      ink: '0 for every surface; xs=2 for tags; full=9999 for circles',
      why: 'radius.default=0 is the canonical Klassy window-decoration match. The 4/6/12/16 ladder was killed with the glass era.',
      open: 'Does a 0-radius neobrutalism read as brutalist or merely as unstyled? The reference chose 5px deliberately.'
    },
    {
      area: 'press trigger',
      ref: ':hover translates the object into its shadow',
      ink: ':active only — 60ms, steps(2, end). Hover moves fill, never geometry',
      why: 'RESOLVED 2026-09-02 by cross-model audit; GPT and Gemini agreed independently. Firing the press metaphor on pointer arrival announces an action that has not happened, and gives pointer users a signal keyboard and touch users never get.',
      open: 'Settled. Both behaviours were wired here until the adjudication; only :active is now.'
    },
    {
      area: 'shadow offset',
      ref: '4px / 4px',
      ink: 'tokens.toml ink=4px, ink_lg=7px',
      why: 'Matches the reference geometry exactly.',
      open: 'docs/PHILOSOPHY.md and docs/REFERENCE.md both still document 8px / 14px, which no generated output has carried since the offsets were reverted. Stale prose, not a code divergence.'
    },
    {
      area: 'on-select state',
      ref: 'active tab and selected table row take an accent FILL',
      ink: 'Tier C — a solid outline, never a wash or a fill',
      why: 'One rule has to survive GRUB 9-patch PNG, Plasma FrameSVG, GTK CSS and VSCode JSON. A 2px stroke does; a fill needs per-backend contrast retuning.',
      open: 'Tabs and table rows are shown BOTH ways on this page. Does adopting the reference’s fill for identity-bearing components break the Tier C rule, or is the rule scoped to list rows only?'
    },
    {
      area: 'semantic colour',
      ref: 'none — `destructive` is literally bg-black text-white',
      ink: 'amber / positive / negative semantic tokens',
      why: 'A desktop system needs real warning and error colours; the reference is a component library, not an OS theme.',
      open: 'Does adding three semantic hues violate the single-accent discipline, or are semantics categorically outside it?'
    },
    {
      area: 'placeholder / muted',
      ref: 'text-foreground/50 — an alpha wash',
      ink: 'text_muted #6B7280 — a real token',
      why: 'check-palette-drift.sh --alpha rejects computed translucency outside the Tier A allowlist.',
      open: 'None — this is a strict improvement in auditability. Confirm nothing is lost visually.'
    },
    {
      area: 'type unit',
      ref: 'text-sm / text-xs, px-based Tailwind scale',
      ink: 'pt-based minor-third scale anchored at 11pt',
      why: 'The same scale drives Konsole, Klassy and GTK, which are pt-native.',
      open: 'Body is 11pt ≈ 14.67px against the reference’s 14px. Does the whole page run slightly large, and does that matter?'
    },
    {
      area: 'colour mode',
      ref: 'light-first, `.dark` override',
      ink: 'dark only — no light variant exists',
      why: 'tokens.toml has one surface ladder and opacity.window_active = 1.00.',
      open: 'Neobrutalism’s canonical read is dark-on-light. Is a dark-only neobrutalism still neobrutalism, or a different material wearing the borders?'
    },
    {
      area: 'accent chroma',
      ref: 'oklch(67% 0.17 259) — a saturated blue',
      ink: 'oklch(80% 0.06 145) — near-achromatic sage',
      why: 'Chosen for 11.00:1 on base and for reading as a tinted neutral rather than a shout.',
      open: 'Neobrutalism depends on loud flat colour. Does chroma 0.06 leave enough signal for the accent to do the work the style asks of it?'
    },
    {
      area: 'tooltip type',
      ref: 'text-sm — 14px',
      ink: 'caption — 9pt, about 12px',
      why: 'The tooltip stays on the pt scale with every other surface rather than taking a px size.',
      open: 'Found by GPT in the 2026-09-02 audit. The note on this page previously claimed 8pt, a value no rule ever set — a label disagreeing with its own CSS, which is the worst failure mode this page has.'
    },
    {
      area: 'toast type',
      ref: '13px hardcoded — the only px font size in the library',
      ink: 'caption — 9pt, about 12px',
      why: 'Same reason: one type scale, in pt, across every layer.',
      open: 'Also found by GPT. Previously described but never recorded as a divergence.'
    },
    {
      area: 'font',
      ref: 'no font tokens; inherits the docs site sans',
      ink: 'Carlito prose / SF Pro chrome / Iosevka Custom Condensed mono',
      why: 'Cross-layer consistency with Konsole and Plasma chrome.',
      open: 'Neobrutalism usually pairs with a heavy grotesque. Is a humanist body face working against the material?'
    }
  ];

</script>

<Section id="ledger" title="Divergence ledger"
  lead="every knowing departure from ekmas/neobrutalism-components, with the question each one raises" min="100%">
  <Specimen name="divergences" span="full">
    <table class="led">
      <thead>
        <tr><th>#</th><th>Area</th><th>neobrutalism.dev</th><th>Sage Ink</th><th>Why</th><th>Open question</th></tr>
      </thead>
      <tbody>
        {#each divergences as d, i}
          <tr>
            <td class="num">{i + 1}</td>
            <td class="mono">{d.area}</td>
            <td class="dim">{d.ref}</td>
            <td>{d.ink}</td>
            <td class="dim">{d.why}</td>
            <td class="ask">{d.open}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Specimen>

  <Specimen name="coverage" span="full"
    note="46 entries: the 44 components in registry.json, plus combobox and data-table, which the docs site documents as composed pages with no styling of their own. The eight n* registry entries (nbutton, ncard, ndialog, ninput, nlabel, nsheet, nskeleton, ntooltip) are dependency-free duplicates of components already listed and are not counted separately.">
    <ul class="roster">
      {#each ROSTER as r}<li class="mono">{r}</li>{/each}
    </ul>
  </Specimen>
</Section>

<style>
  .led { width: 100%; border-collapse: collapse; font-size: var(--ig-type-xs-pt); line-height: 1.35; }
  .led th {
    text-align: left;
    padding: 3px 10px 5px 0;
    color: var(--ig-text-muted);
    font-weight: var(--ig-weight-base);
    border-bottom: var(--ig-border-default) solid var(--ig-border-strong);
    white-space: nowrap;
  }
  .led td { padding: 6px 10px 6px 0; vertical-align: top; border-bottom: 1px solid var(--ig-border); }
  .led .num { color: var(--ig-text-dim); }
  .led .dim { color: var(--ig-text-muted); }
  .led .ask { color: var(--ig-amber); }
  .led .mono { font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace; white-space: nowrap; }

  .roster {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 2px 12px;
    margin: 0;
    padding: 0;
    list-style: none;
    width: 100%;
  }
  .roster li {
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    font-size: var(--ig-type-xs-pt);
    color: var(--ig-text-muted);
  }
  .roster li::before { content: "\2713  "; color: var(--ig-accent); }
</style>
