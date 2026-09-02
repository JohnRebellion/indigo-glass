<script lang="ts">
  import Section from '../Section.svelte';
  import Specimen from '../Specimen.svelte';

  /* cva variants, verbatim from src/components/ui/button.tsx. */
  const variants = [
    { id: 'default',  label: 'default',  note: 'accent fill + shadow, travels down-right on PRESS (reference: on hover)' },
    { id: 'noShadow', label: 'noShadow', note: 'accent fill, no shadow, no travel in any state' },
    { id: 'neutral',  label: 'neutral',  note: 'secondary-background fill + shadow, same press travel' },
    { id: 'reverse',  label: 'reverse',  note: 'starts flat, GAINS shadow travelling up-left on press' }
  ] as const;

  const sizes = [
    { id: '',     label: 'default', h: '40px' },
    { id: 'sm',   label: 'sm',      h: '36px' },
    { id: 'lg',   label: 'lg',      h: '44px' },
    { id: 'icon', label: 'icon',    h: '40x40' }
  ] as const;
</script>

<Section id="buttons" title="Button" lead="4 cva variants x 4 sizes, plus states" min="300px">
  {#each variants as v}
    <Specimen name="button / {v.label}" note={v.note}>
      <div class="col">
        {#each sizes as s}
          <button
            type="button"
            class="nb-button nb-button--{v.id} {s.id ? `nb-button--${s.id}` : ''}"
          >
            {s.id === 'icon' ? '■' : s.label}
          </button>
        {/each}
      </div>
    </Specimen>
  {/each}

  <Specimen name="button / states" span={2}
    note="Reference base class carries `disabled:pointer-events-none disabled:opacity-50`. Sage Ink routes that through the [opacity].disabled token (0.4) so the whole system dims by one number. The focus ring is the dark-mode --ring (near-white), not the reference's light-mode black.">
    <div class="row">
      <button type="button" class="nb-button nb-button--default">idle</button>
      <button type="button" class="nb-button nb-button--default is-hover">hover (forced) — fill only</button>
      <button type="button" class="nb-button nb-button--default is-press">active (forced) — geometry</button>
      <button type="button" class="nb-button nb-button--default is-focus">focus-visible (forced)</button>
      <button type="button" class="nb-button nb-button--default" disabled>disabled</button>
      <button type="button" class="nb-button nb-button--neutral" disabled>disabled neutral</button>
    </div>
  </Specimen>

  <Specimen name="button / with icon + link" span={2}
    note="Reference sizes any child svg to 16px and gaps 8px. `asChild` renders the same classes on an <a>, which is why anchors carry the button classes here rather than a separate link style.">
    <div class="row">
      <button type="button" class="nb-button nb-button--default"><span aria-hidden="true">&#9679;</span> leading icon</button>
      <button type="button" class="nb-button nb-button--neutral">trailing icon <span aria-hidden="true">&#8594;</span></button>
      <a class="nb-button nb-button--default" href="#buttons">anchor asChild</a>
      <button type="button" class="nb-button nb-button--reverse">reverse</button>
      <button type="button" class="nb-button nb-button--reverse is-hover-reverse">reverse (press forced)</button>
    </div>
  </Specimen>
</Section>

<style>
  .col { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ig-gap-lg); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ig-gap-lg); }

  /* Forced states so a still screenshot shows what a pointer would.
     Same declarations as the :hover / :active / :focus-visible rules in
     nb-core.css — hover moves fill, press moves geometry. */
  :global(.nb-button.is-hover) { background: var(--ig-accent-hi); }
  :global(.nb-button.is-press) {
    transform: translate(var(--box-shadow-x), var(--box-shadow-y));
    box-shadow: var(--shadow-none);
  }
  /* `reverse` is the one variant a still cannot show: idle it is identical to
     noShadow, and the whole point is what happens on press. */
  :global(.nb-button.is-hover-reverse) {
    transform: translate(var(--reverse-box-shadow-x), var(--reverse-box-shadow-y));
    box-shadow: var(--shadow);
  }
  :global(.nb-button.is-hover):hover,
  :global(.nb-button.is-press):hover { background: var(--ig-accent-hi); }
  :global(.nb-button.is-focus) {
    outline: var(--ig-border-default) solid var(--ring);
    outline-offset: 2px;
  }
</style>
