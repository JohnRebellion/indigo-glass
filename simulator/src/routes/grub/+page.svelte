<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import GrubScreen from '$lib/GrubScreen.svelte';
  import { loadPreset, type LoadedPreset } from '$lib/theme/loader';
  import type { GrubCfg } from '$lib/theme/cfg';
  import { serialiseTheme, parseTheme } from '$lib/theme/parser';
  import { downloadZip } from 'client-zip';

  interface PresetInfo {
    id: string;
    name: string;
    primary: string;
    accent: string;
  }

  let presets = $state<PresetInfo[]>([]);
  let activeId = $state<string>('sage');
  let loaded = $state<LoadedPreset | null>(null);
  let cfg = $state<GrubCfg>({
    entries: [
      { title: 'Nobara Linux (7.0.1-200.nobara.fc43.x86_64)', classes: ['nobara', 'gnu-linux', 'gnu', 'os'] },
      { title: 'Nobara Linux (7.0.0-200.nobara.fc43.x86_64)', classes: ['nobara', 'gnu-linux', 'gnu', 'os'] },
      { title: 'Windows 11', classes: ['windows', 'os'] },
      { title: 'UEFI Firmware Settings', classes: ['uefi-firmware'] },
      { title: 'Memory test (memtest86+x64.efi)', classes: ['memtest'] }
    ],
    defaultIndex: 0,
    timeout: 5
  });
  let selected = $state(0);
  let editingTheme = $state<string>('');
  let viewWidth = $state(1100);


  onMount(async () => {
    const idx = await fetch(`${base}/presets/index.json`).then((r) => r.json());
    presets = idx.presets;
    await loadActive();
  });

  $effect(() => {
    void activeId;
    if (presets.length > 0) void loadActive();
  });

  async function loadActive(): Promise<void> {
    loaded = await loadPreset(activeId, `${base}/presets`);
    editingTheme = serialiseTheme(loaded.theme);
  }

  function applyEdit(): void {
    if (!loaded) return;
    try {
      loaded.theme = parseTheme(editingTheme);
      loaded = { ...loaded };
    } catch (e) {
      console.error('Parse error:', e);
    }
  }

  function addEntry(): void {
    cfg.entries = [...cfg.entries, { title: 'New Entry', classes: ['os'] }];
  }

  function removeEntry(i: number): void {
    cfg.entries = cfg.entries.filter((_, idx) => idx !== i);
    if (selected >= cfg.entries.length) selected = Math.max(0, cfg.entries.length - 1);
  }

  async function exportZip(): Promise<void> {
    if (!loaded) return;
    const files: { name: string; input: Blob }[] = [];
    for (const [path, buf] of loaded.rawFiles.entries()) {
      const content =
        path === loaded.manifest.themeTxt
          ? new TextEncoder().encode(editingTheme).buffer
          : buf;
      files.push({ name: path, input: new Blob([content]) });
    }
    const blob = await downloadZip(files).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grub-theme-${activeId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

</script>

<div class="layout">
  <aside>
    <header class="brand">
      <span class="logo"></span>
      <div>
        <h1>GRUB Simulator</h1>
        <p>Ink theme studio</p>
      </div>
    </header>

    <section>
      <h2>Preset</h2>
      <div class="preset-grid">
        {#each presets as p (p.id)}
          <button
            class="preset-card"
            class:active={activeId === p.id}
            onclick={() => (activeId = p.id)}
            style:--accent={p.accent}
          >
            <img src="{base}/presets/{p.id}/thumb.jpg" alt={p.name} />
            <span class="card-label">{p.name}</span>
          </button>
        {/each}
      </div>
    </section>

    <section>
      <h2>Entries ({cfg.entries.length})</h2>
      {#each cfg.entries as entry, i (i)}
        <div class="entry-row" class:active={selected === i}>
          <input
            type="text"
            bind:value={entry.title}
            onfocus={() => (selected = i)}
          />
          <input
            type="text"
            placeholder="classes"
            value={entry.classes.join(',')}
            oninput={(e) => {
              entry.classes = (e.currentTarget.value || '').split(',').map((s) => s.trim()).filter(Boolean);
              cfg = { ...cfg };
            }}
          />
          <button class="x" onclick={() => removeEntry(i)}>×</button>
        </div>
      {/each}
      <button class="add" onclick={addEntry}>+ Add Entry</button>
    </section>

    <section>
      <h2>theme.txt</h2>
      <textarea bind:value={editingTheme} rows="14"></textarea>
      <div class="actions">
        <button onclick={applyEdit}>Apply</button>
        <button class="primary" onclick={exportZip}>Export Zip</button>
      </div>
    </section>
  </aside>

  <main>
    <div class="monitor">
      <div class="bezel">
        <div class="screen-wrap" style:width="{viewWidth}px">
          {#if loaded}
            <GrubScreen
              preset={loaded}
              {cfg}
              {selected}
              width={viewWidth}
              height={Math.round(viewWidth * 9 / 16)}
            />
          {:else}
            <p style="color:#888;padding:2rem">Loading preset…</p>
          {/if}
        </div>
        <div class="stand"></div>
      </div>
      <div class="size-control">
        <label>Preview width
          <input type="range" min="640" max="1600" step="40" bind:value={viewWidth} />
          <span class="val">{viewWidth}px</span>
        </label>
      </div>
    </div>
  </main>
</div>

<style>
  /* Sidebar, controls and monitor mockup on Sage Ink tokens only. The
     2026-09-22 live audit's contract (research-reports/sage-ink-live-audit-
     2026-09-22): opaque fills, hard offset shadows, 2px border_strong on
     controls, no gradient, no blur, no translucency, every hex a token.
     Before this pass the route carried an aside gradient, a CRT bezel with a
     40px blurred rgba shadow and two indigo-era gradients, a translucent
     focus ring, and eight hand-picked greys - all on drift-allow or below the
     drift guard's radar. The monitor still reads as a monitor from its
     geometry (bezel + stand); it no longer needs glass to do it. */
  :global(body) {
    margin: 0;
    background: #07080A;
  }
  .layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    height: 100vh;
    color: #F8F8F8;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  aside {
    overflow-y: auto;
    padding: 1.25rem;
    border-right: 1px solid #1C1C1E; /* Tier B hairline divider: border token */
    background: #121216;
  }
  .brand {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .brand h1 { font-size: 1rem; margin: 0; letter-spacing: 0.01em; }
  .brand p  { font-size: 0.72rem; color: #C0E3C0; margin: 0; }
  .logo {
    width: 32px; height: 32px; border-radius: 0;
    background: #A6C9A6;
    border: 2px solid #5E5E60;
    box-shadow: 4px 4px 0 0 #89A889;
  }
  h2 {
    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em;
    color: #C0E3C0; margin: 1.25rem 0 0.6rem;
  }
  section { margin-bottom: 1.25rem; }

  .preset-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.55rem;
  }
  .preset-card {
    position: relative;
    padding: 0;
    border: 2px solid #5E5E60;
    border-radius: 0;
    overflow: hidden;
    cursor: pointer;
    background: #0D0D10;
    box-shadow: 4px 4px 0 0 #89A889;
    outline: 2px solid transparent;
    outline-offset: 2px;
    transition: outline-color 120ms, transform 80ms steps(2, end), box-shadow 80ms steps(2, end);
  }
  .preset-card img {
    display: block; width: 100%; height: 80px; object-fit: cover;
  }
  .preset-card .card-label {
    display: block;
    padding: 0.4rem 0.55rem;
    font-size: 0.72rem;
    text-align: left;
    color: #F8F8F8;
    background: #121216; /* was rgba(0,0,0,0.55) over the thumbnail: the label now sits below it, opaque */
  }
  /* Tier C: the chosen preset is an on-select state, so it gets the detached
     2px text ring every other layer uses - not an accent halo. */
  .preset-card.active { outline-color: #F8F8F8; }
  /* Press travels on :active, not :hover — adjudicated 2026-09-02 by
     cross-model audit. Travelling into the shadow is a press metaphor; firing
     it on pointer arrival announces an action that has not happened, and is
     pointer-only so keyboard and touch users never see it. Deliberate
     divergence from neobrutalism.dev, which uses :hover. */
  .preset-card:hover { outline-color: #5E5E60; }
  .preset-card:active { transform: translate(4px, 4px); box-shadow: 0 0 0 0 #89A889; }

  label {
    display: block; font-size: 0.72rem; color: #F8F8F8;
    margin: 0.55rem 0;
  }
  label .val { float: right; color: #C0E3C0; }
  input[type='range'] { width: 100%; accent-color: #A6C9A6; }
  input[type='text'], textarea {
    background: #07080A; border: 2px solid #5E5E60; color: #F8F8F8; /* 2px border_strong on a control (was 1px #1A1B1D) */
    padding: 0.4rem; border-radius: 0; font: 11px monospace; width: 100%;
    box-sizing: border-box;
  }
  textarea { resize: vertical; font-size: 10.5px; }

  .entry-row {
    display: grid;
    grid-template-columns: 1fr 90px 26px;
    gap: 0.3rem;
    margin-bottom: 0.3rem;
  }
  /* The row whose entry is the previewed selection: outline, not a halo
     (was border accent + 0 0 0 1px rgba(166,201,166,0.4)). */
  .entry-row.active > input { border-color: #A6C9A6; }
  .x { background: #121216; color: #F42E53; }
  .x:hover { background: #F42E53; color: #F8F8F8; }
  .add { width: 100%; margin-top: 0.3rem; }

  .actions { display: flex; gap: 0.5rem; margin-top: 0.4rem; }
  .actions button { flex: 1; }
  button {
    background: #121216; color: #F8F8F8; border: 2px solid #5E5E60;
    padding: 0.5rem 0.85rem; border-radius: 0; cursor: pointer;
    font-size: 0.78rem; font-weight: 700;
    box-shadow: 4px 4px 0 0 #89A889;
    transition: background 100ms, transform 80ms steps(2, end), box-shadow 80ms steps(2, end);
  }
  button:hover { background: #0D0D10; } /* neutral hover moves fill only, to the surface token (was #191c1e) */
  button:active { transform: translate(4px, 4px); box-shadow: 0 0 0 0 #89A889; }
  button.primary {
    background: #A6C9A6;
    color: #07080A;
    border-color: #5E5E60;
    box-shadow: 4px 4px 0 0 #07080A; /* light fill casts the base-coloured shadow (tone context, nb-surfaces.css) */
  }
  button.primary:hover { background: #C0E3C0; }
  button.primary:active { box-shadow: 0 0 0 0 #07080A; }

  main {
    padding: 2rem;
    overflow: auto;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    background: #07080A;
  }
  .monitor { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
  .bezel {
    padding: 14px 14px 18px;
    border-radius: 0;
    background: #121216;
    border: 2px solid #5E5E60;
    box-shadow: 7px 7px 0 0 #89A889;
    position: relative;
  }
  .screen-wrap {
    background: #000;
    border-radius: 0;
    overflow: hidden;
    line-height: 0;
  }
  .stand {
    width: 130px; height: 9px;
    background: #121216;
    border: 2px solid #5E5E60;
    border-top: 0;
    border-radius: 0;
    margin: 14px auto -22px;
    box-shadow: 4px 4px 0 0 #89A889;
  }
  .size-control {
    margin-top: 30px;
    width: 320px;
    text-align: center;
  }
</style>
