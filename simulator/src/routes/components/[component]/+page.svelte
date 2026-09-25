<script lang="ts">
  import { page } from '$app/stores';
  import { componentById } from '$lib/components/catalogue';
  import ComponentPage from '$lib/components/ComponentPage.svelte';

  const id = $derived($page.params.component ?? '');
  const def = $derived(componentById(id));
</script>

{#if def}
  {#key id}<ComponentPage component={def} />{/key}
{:else}
  <p class="nf">No component page for <code>{id}</code>.</p>
{/if}

<style>
  .nf { padding: 24px; color: var(--ig-text-muted); }
</style>
