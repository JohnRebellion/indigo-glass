<script lang="ts">
  import { page } from '$app/stores';
  import { surfaceById } from '$lib/desktop/registry';

  const id = $derived($page.params.surface ?? '');
  const entry = $derived(surfaceById(id));
</script>

{#if entry?.page}
  {#key id}<entry.page />{/key}
{:else}
  <p class="nf">No comparison page for <code>{id}</code>.</p>
{/if}

<style>
  .nf { padding: 24px; color: var(--ig-text-muted); }
</style>
