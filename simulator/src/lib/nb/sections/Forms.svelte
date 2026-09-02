<script lang="ts">
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';

  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  /* A fixed September 2026 grid — static so the visual snapshot is stable. */
  const days = [
    [31, 1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
    [28, 29, 30, 1, 2, 3, 4]
  ];
  const outside = (row: number, d: number) => (row === 0 && d > 7) || (row === 4 && d < 7);
</script>

<Section id="forms" title="Form controls" lead="input, textarea, label, checkbox, radio, switch, select, slider, OTP, form, combobox, command, calendar" min="300px">

  <Specimen name="input" variant="divergence"
    note="Reference placeholder is `text-foreground/50`, an alpha wash. Sage Ink resolves it to the real text_muted token — the --alpha guard rejects computed translucency outside Tier A.">
    <div class="col">
      <input class="nb-input" type="text" placeholder="Placeholder" />
      <input class="nb-input" type="text" value="Filled value" />
      <input class="nb-input is-focus" type="text" value="Focused (forced)" />
      <input class="nb-input" type="text" value="Disabled" disabled />
    </div>
  </Specimen>

  <Specimen name="textarea">
    <textarea class="nb-textarea" placeholder="Type here…"></textarea>
  </Specimen>

  <Specimen name="label + form" variant="accommodation"
    note="Reference `Form` is a react-hook-form wrapper: Label / Control / Description / Message. The styling contract is just heading-weight label, caption description, and an error message.">
    <div class="col field">
      <label class="nb-label" for="nb-email">Email</label>
      <input class="nb-input" id="nb-email" type="email" placeholder="you@example.com" />
      <span class="hint">We only use this to send the build receipt.</span>
      <span class="err">Enter a valid address.</span>
    </div>
  </Specimen>

  <Specimen name="checkbox"
    note="Reference uses `outline-2 outline-border` rather than a border, so the box does not shift when checked. Sage Ink keeps that.">
    <div class="col">
      <span class="ctl"><span class="nb-checkbox" data-state="unchecked"></span> unchecked</span>
      <span class="ctl"><span class="nb-checkbox" data-state="checked" aria-hidden="true">&#10003;</span> checked</span>
      <span class="ctl"><span class="nb-checkbox" data-state="indeterminate" aria-hidden="true">&minus;</span> indeterminate</span>
      <span class="ctl dis"><span class="nb-checkbox" data-state="unchecked"></span> disabled</span>
    </div>
  </Specimen>

  <Specimen name="radio-group">
    <div class="col">
      <span class="ctl"><span class="nb-radio"></span> Sage</span>
      <span class="ctl"><span class="nb-radio"><span class="nb-radio-dot"></span></span> Indigo</span>
      <span class="ctl dis"><span class="nb-radio"></span> Lime (disabled)</span>
    </div>
  </Specimen>

  <Specimen name="switch" variant="divergence"
    note="Reference thumb is bg-white. Sage Ink has no pure-white token; the nearest real one is `text` (#F8F8F8).">
    <div class="col">
      <span class="ctl"><span class="nb-switch" data-state="unchecked"><span class="nb-switch-thumb"></span></span> off</span>
      <span class="ctl"><span class="nb-switch" data-state="checked"><span class="nb-switch-thumb"></span></span> on</span>
      <span class="ctl dis"><span class="nb-switch" data-state="unchecked"><span class="nb-switch-thumb"></span></span> disabled</span>
    </div>
  </Specimen>

  <Specimen name="select" span={2}
    note="The select TRIGGER is accent-filled in the reference (unlike input, which is secondary-background), and the open list is accent-filled too, with the highlighted row taking a border rather than a fill — the same outline-not-highlight rule Sage Ink calls Tier C.">
    <div class="row top">
      <div class="w220">
        <button type="button" class="nb-select-trigger">Sage Ink <span aria-hidden="true">&#9662;</span></button>
      </div>
      <div class="nb-select-content w220">
        <div class="nb-select-label">Variants</div>
        <div class="nb-select-item" data-highlighted>Sage <span class="tick" aria-hidden="true">&#10003;</span></div>
        <div class="nb-select-item">Indigo Glass</div>
        <div class="nb-select-item">Lime Glass</div>
        <div class="nb-select-separator"></div>
        <div class="nb-select-item">Custom…</div>
      </div>
    </div>
  </Specimen>

  <Specimen name="combobox" span={2} variant="accommodation"
    note="Composed from popover + command in the reference — no standalone styling of its own. Shown open so the screenshot captures the list.">
    <div class="row top">
      <button type="button" class="nb-button nb-button--neutral">Select framework… <span aria-hidden="true">&#9662;</span></button>
      <div class="nb-command w260">
        <input class="nb-command-input" placeholder="Search framework…" value="sv" />
        <div class="nb-command-group-heading">Frameworks</div>
        <div class="nb-command-item" data-selected>SvelteKit</div>
        <div class="nb-command-item">Next.js</div>
        <div class="nb-command-item">Astro</div>
      </div>
    </div>
  </Specimen>

  <Specimen name="command" span={2}
    note="Command palette. The selected row is the one place the reference uses BOTH a border and an accent fill.">
    <div class="nb-command">
      <input class="nb-command-input" placeholder="Type a command or search…" />
      <div class="nb-command-group-heading">Suggestions</div>
      <div class="nb-command-item" data-selected>Regenerate tokens <span class="nb-menu-shortcut">⌘G</span></div>
      <div class="nb-command-item">Apply colour scheme <span class="nb-menu-shortcut">⌘A</span></div>
      <div class="nb-menu-separator"></div>
      <div class="nb-command-group-heading">Settings</div>
      <div class="nb-command-item">Toggle density <span class="nb-menu-shortcut">⌘D</span></div>
    </div>
  </Specimen>

  <Specimen name="slider">
    <div class="col wfull">
      <div class="nb-slider">
        <div class="nb-slider-track"><div class="nb-slider-range" style="width:62%"></div></div>
        <span class="nb-slider-thumb" style="left:calc(62% - 10px)"></span>
      </div>
      <div class="nb-slider dis">
        <div class="nb-slider-track"><div class="nb-slider-range" style="width:25%"></div></div>
        <span class="nb-slider-thumb" style="left:calc(25% - 10px)"></span>
      </div>
    </div>
  </Specimen>

  <Specimen name="input-otp"
    note="Reference rounds only the first and last slot and drops the shared inner border, so six boxes read as one control.">
    <div class="nb-otp">
      {#each ['5', 'A', 'G', 'E', '', ''] as ch, i}
        <div class="nb-otp-slot">{ch}{#if i === 4}<span class="nb-otp-caret"></span>{/if}</div>
      {/each}
    </div>
  </Specimen>

  <Specimen name="calendar" span={2} variant="accommodation"
    note="A Date Picker in the reference is this calendar inside a popover; there is no separate styling for it.">
    <div class="row top">
      <div class="nb-calendar">
        <div class="nb-calendar-nav">
          <button type="button" class="nb-button nb-button--neutral nb-button--icon" aria-label="Previous month">&#8249;</button>
          <span class="nb-calendar-caption">September 2026</span>
          <button type="button" class="nb-button nb-button--neutral nb-button--icon" aria-label="Next month">&#8250;</button>
        </div>
        <table class="nb-calendar-grid">
          <thead><tr>{#each weekdays as w}<th>{w}</th>{/each}</tr></thead>
          <tbody>
            {#each days as week, row}
              <tr>
                {#each week as d}
                  <td>
                    <span
                      class="nb-calendar-day"
                      class:nb-calendar-day--outside={outside(row, d)}
                      class:nb-calendar-day--today={row === 0 && d === 2}
                      class:nb-calendar-day--selected={row === 2 && d === 16}
                    >{d}</span>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="col">
        <span class="cap">Date picker — trigger</span>
        <button type="button" class="nb-button nb-button--neutral">16 September 2026 <span aria-hidden="true">&#9662;</span></button>
      </div>
    </div>
  </Specimen>
</Section>

<style>
  .col { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ig-gap-md); }
  .wfull { width: 100%; }
  .row { display: flex; flex-wrap: wrap; gap: var(--ig-gap-xl); }
  .top { align-items: flex-start; }
  .w220 { width: 220px; }
  .w260 { width: 260px; }

  .ctl { display: inline-flex; align-items: center; gap: var(--ig-gap-md); font-size: var(--ig-caption-pt); }
  .dis { opacity: var(--ig-opacity-disabled); }

  .field { width: 100%; }
  .hint { font-size: var(--ig-type-xs-pt); color: var(--ig-text-muted); }
  .err { font-size: var(--ig-type-xs-pt); color: var(--ig-negative); }
  .cap { font-size: var(--ig-type-xs-pt); color: var(--ig-text-muted); }
  .tick { margin-left: auto; }

  :global(.nb-input.is-focus) {
    outline: var(--ig-border-default) solid var(--ring);
    outline-offset: 2px;
  }
</style>
