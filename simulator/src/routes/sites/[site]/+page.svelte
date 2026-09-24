<script lang="ts">
  import { page } from '$app/stores';
  import { siteById } from '$lib/sites/registry';
  import { PAGES } from '$lib/sites/pages';

  const id = $derived($page.params.site ?? '');
  const site = $derived(siteById(id));
  const Page = $derived(PAGES[id]);
</script>

{#if site && Page}
  <Page {site} />
{:else}
  <p class="nf">No comparison page for <code>{id}</code>.</p>
{/if}

<style>
  .nf { padding: 24px; color: var(--ig-text-muted); }
</style>
