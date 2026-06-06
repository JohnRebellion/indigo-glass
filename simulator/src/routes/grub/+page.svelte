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
  let activeId = $state<string>('indigo');
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

  // Tunable glass params exposed to UI (override defaults in component)
  // Plasma IndigoGlass defaults
  let panelBlur = $state(80);
  let panelTintAlpha = $state(0.78);
  let panelRadius = $state(16);
  let panelSpecular = $state(0.55);
  let pillBlur = $state(80);
  let pillRadius = $state(10);
  let pillTintAlpha = $state(0.28);

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

  let glassOverrides = $derived({
    panelBlur,
    panelTintAlpha,
    panelRadius,
    panelSpecular,
    pillBlur,
    pillRadius,
    pillTintAlpha
  });
</script>

<div class="layout">
  <aside>
    <header class="brand">
      <span class="logo"></span>
      <div>
        <h1>GRUB Simulator</h1>
        <p>Liquid-glass theme studio</p>
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
      <h2>Glass</h2>
      <label>Panel blur <span class="val">{panelBlur}px</span>
        <input type="range" min="0" max="160" bind:value={panelBlur} />
      </label>
      <label>Panel tint <span class="val">{Math.round(panelTintAlpha * 100)}%</span>
        <input type="range" min="0" max="100" value={Math.round(panelTintAlpha * 100)} oninput={(e) => panelTintAlpha = +e.currentTarget.value / 100} />
      </label>
      <label>Panel radius <span class="val">{panelRadius}px</span>
        <input type="range" min="0" max="64" bind:value={panelRadius} />
      </label>
      <label>Panel specular <span class="val">{Math.round(panelSpecular * 100)}%</span>
        <input type="range" min="0" max="100" value={Math.round(panelSpecular * 100)} oninput={(e) => panelSpecular = +e.currentTarget.value / 100} />
      </label>
      <hr />
      <label>Pill blur <span class="val">{pillBlur}px</span>
        <input type="range" min="0" max="80" bind:value={pillBlur} />
      </label>
      <label>Pill radius <span class="val">{pillRadius}px</span>
        <input type="range" min="0" max="48" bind:value={pillRadius} />
      </label>
      <label>Pill tint <span class="val">{Math.round(pillTintAlpha * 100)}%</span>
        <input type="range" min="0" max="100" value={Math.round(pillTintAlpha * 100)} oninput={(e) => pillTintAlpha = +e.currentTarget.value / 100} />
      </label>
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
              {glassOverrides}
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
  :global(body) {
    margin: 0;
    background: #07070f;
  }
  .layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    height: 100vh;
    color: #e0e7ff;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  aside {
    overflow-y: auto;
    padding: 1.25rem;
    border-right: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(180deg, #11112a 0%, #0a0a1a 100%);
  }
  .brand {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .brand h1 { font-size: 1rem; margin: 0; letter-spacing: 0.01em; }
  .brand p  { font-size: 0.72rem; color: #818cf8; margin: 0; }
  .logo {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    box-shadow: 0 0 12px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.4);
  }
  h2 {
    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em;
    color: #818cf8; margin: 1.25rem 0 0.6rem;
  }
  section { margin-bottom: 1.25rem; }

  .preset-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.55rem;
  }
  .preset-card {
    position: relative;
    padding: 0; border: 0;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    background: #1a1a2e;
    box-shadow: 0 1px 0 rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.4);
    outline: 2px solid transparent;
    transition: outline-color 120ms;
  }
  .preset-card img {
    display: block; width: 100%; height: 80px; object-fit: cover;
  }
  .preset-card .card-label {
    display: block;
    padding: 0.4rem 0.55rem;
    font-size: 0.72rem;
    text-align: left;
    color: #e0e7ff;
    background: rgba(0,0,0,0.55);
  }
  .preset-card.active { outline-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 4px 16px rgba(0,0,0,0.5); }
  .preset-card:hover { outline-color: rgba(255,255,255,0.18); }

  label {
    display: block; font-size: 0.72rem; color: #c7d2fe;
    margin: 0.55rem 0;
  }
  label .val { float: right; color: #818cf8; }
  input[type='range'] { width: 100%; accent-color: #a78bfa; }
  input[type='text'], textarea {
    background: #15152a; border: 1px solid #2a2a4a; color: #e0e7ff;
    padding: 0.4rem; border-radius: 4px; font: 11px monospace; width: 100%;
    box-sizing: border-box;
  }
  textarea { resize: vertical; font-size: 10.5px; }
  hr { border: 0; border-top: 1px solid rgba(255,255,255,0.07); margin: 0.85rem 0; }

  .entry-row {
    display: grid;
    grid-template-columns: 1fr 90px 26px;
    gap: 0.3rem;
    margin-bottom: 0.3rem;
  }
  .entry-row.active > input { border-color: #a78bfa; box-shadow: 0 0 0 1px rgba(167,139,250,0.4); }
  .x { background: #2a1a1a; color: #fca5a5; }
  .x:hover { background: #7f1d1d; color: #fff; }
  .add { width: 100%; margin-top: 0.3rem; }

  .actions { display: flex; gap: 0.5rem; margin-top: 0.4rem; }
  .actions button { flex: 1; }
  button {
    background: #2a2a4a; color: #e0e7ff; border: 0;
    padding: 0.5rem 0.85rem; border-radius: 5px; cursor: pointer;
    font-size: 0.78rem;
    transition: background 100ms;
  }
  button:hover { background: #3a3a5a; }
  button.primary {
    background: linear-gradient(180deg, #7c3aed, #5b21b6);
    color: #fff;
    box-shadow: 0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 12px rgba(124,58,237,0.4);
  }
  button.primary:hover { background: linear-gradient(180deg, #8b4ff5, #6d28d9); }

  main {
    padding: 2rem;
    overflow: auto;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    background:
      radial-gradient(ellipse at top left, rgba(124,58,237,0.08), transparent 50%),
      radial-gradient(ellipse at bottom right, rgba(59,130,246,0.06), transparent 50%),
      #07070f;
  }
  .monitor { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
  .bezel {
    padding: 14px 14px 18px;
    border-radius: 18px;
    background:
      linear-gradient(180deg, #1a1a2a 0%, #0e0e18 100%);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 12px 40px rgba(0,0,0,0.7),
      inset 0 1px 0 rgba(255,255,255,0.08);
    position: relative;
  }
  .screen-wrap {
    background: #000;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
    line-height: 0;
  }
  .stand {
    width: 130px; height: 9px;
    background: linear-gradient(180deg, #2a2a44, #18182c);
    border-radius: 0 0 12px 12px;
    margin: 14px auto -22px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.5);
  }
  .size-control {
    margin-top: 30px;
    width: 320px;
    text-align: center;
  }
</style>
