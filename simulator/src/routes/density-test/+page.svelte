<script lang="ts">
  import { onMount } from 'svelte';

  let densityOn = $state(false);

  function toggle() {
    densityOn = !densityOn;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('ig-density-on', densityOn);
    }
  }

  onMount(() => {
    // Honor ?density=on — always re-sync class so test isolation works
    const params = new URLSearchParams(location.search);
    densityOn = params.get('density') === 'on';
    document.documentElement.classList.toggle('ig-density-on', densityOn);
  });

  const codeSnippet = "const tokens = require('indigo-glass/tokens');\nconst indigo = tokens.palette.sRGB.indigo;\napplyTheme({ accent: indigo });";
</script>

<div class="density-test" data-testid="density-test">
  <div class="ctrl">
    <button class="ig-button" onclick={toggle} data-testid="toggle-density">
      density: {densityOn ? 'ON' : 'OFF'}
    </button>
    <span class="hint">Compare common element rendering w/ + w/o density rules</span>
  </div>

  <!-- Sidebar-style list (FB left rail equivalent) -->
  <section data-testid="section-sidebar">
    <h3>Sidebar list (FB-style)</h3>
    <ul class="sidebar-list">
      <li><a href="/">John Necir Rebellion</a></li>
      <li><a href="/">Meta AI</a></li>
      <li><a href="/">Manus AI</a></li>
      <li><a href="/">Friends</a></li>
      <li><a href="/">Marketplace</a></li>
      <li><a href="/">Saved</a></li>
      <li><a href="/">Memories</a></li>
      <li><a href="/">Groups</a></li>
    </ul>
  </section>

  <!-- Form (bare HTML) -->
  <section data-testid="section-form">
    <h3>Form fields (bare HTML)</h3>
    <form>
      <label>Email <input type="email" placeholder="you@example.com" data-testid="input-email" /></label>
      <label>Password <input type="password" placeholder="*****" data-testid="input-password" /></label>
      <label>Search <input type="search" placeholder="Search..." data-testid="input-search" /></label>
      <label>Bio <textarea rows="3" placeholder="..."></textarea></label>
      <button type="button" data-testid="bare-button">Submit</button>
      <button type="reset">Cancel</button>
    </form>
  </section>

  <!-- Card grid -->
  <section data-testid="section-cards">
    <h3>Card grid</h3>
    <div class="cards">
      {#each Array(4) as _, i}
        <div class="card">
          <h4>Card {i + 1}</h4>
          <p>Body content has its own internal padding.</p>
          <button>Action</button>
        </div>
      {/each}
    </div>
  </section>

  <!-- Chip row -->
  <section data-testid="section-chips">
    <h3>Chips (compact-by-design)</h3>
    <div class="chips">
      <span class="chip">design</span>
      <span class="chip">linear</span>
      <span class="chip">visionOS</span>
      <span class="chip">indigo-glass</span>
    </div>
  </section>

  <!-- Code blocks -->
  <section data-testid="section-code">
    <h3>Code (always mono)</h3>
    <p>Inline <code>--ig-indigo: #5E6AD2</code> and a block:</p>
    <pre><code>{codeSnippet}</code></pre>
  </section>
</div>

<style>
  .density-test {
    max-width: 920px;
    margin: 0 auto;
    padding: 16px;
    font-family: "Carlito", "SF Pro Display", system-ui, sans-serif;
  }

  .ctrl {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 8px;
    border-radius: 8px;
    background: var(--ig-surface-alt);
    border: 1px solid var(--ig-border);
  }
  .hint { color: var(--ig-text-muted); font-size: 9pt; }

  section { margin-bottom: 16px; }
  section h3 {
    margin: 0 0 6px;
    color: var(--ig-text-muted);
    font-size: 10pt;
    font-weight: 600;
  }

  /* Sidebar list - intentionally bare HTML so we test what
   * happens when our density rules touch native <li>/<a> */
  .sidebar-list {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--ig-surface);
    border-radius: 8px;
    border: 1px solid var(--ig-border);
  }
  .sidebar-list li {
    border-bottom: 1px solid var(--ig-border);
  }
  .sidebar-list li:last-child { border-bottom: 0; }
  .sidebar-list a {
    display: block;
    padding: 8px 12px;       /* site-native padding */
    color: var(--ig-text);
    text-decoration: none;
  }
  .sidebar-list a:hover {
    background: color-mix(in srgb, var(--ig-indigo) 10%, transparent);
  }

  /* Bare form */
  form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
    background: var(--ig-surface);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--ig-border);
  }
  form label { display: flex; flex-direction: column; gap: 2px; font-size: 9pt; }
  form input, form textarea {
    background: var(--ig-base);
    color: var(--ig-text);
    border: 1px solid var(--ig-border);
    border-radius: 4px;
    padding: 6px 10px;       /* site-native */
    font-family: inherit;
  }
  form button {
    background: var(--ig-indigo);
    color: white;
    border: none;
    padding: 6px 14px;       /* site-native */
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
  }
  form button[type="reset"] {
    background: var(--ig-surface-alt);
    color: var(--ig-text);
  }

  /* Cards */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
  }
  .card {
    background: var(--ig-surface-alt);
    border: 1px solid var(--ig-border);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .card h4 { margin: 0 0 4px; font-size: 11pt; }
  .card p { margin: 0 0 8px; font-size: 9pt; color: var(--ig-text-muted); }
  .card button {
    background: transparent;
    border: 1px solid var(--ig-border-strong);
    color: var(--ig-text);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9pt;
    cursor: pointer;
  }

  /* Chips */
  .chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    background: color-mix(in srgb, var(--ig-indigo) 18%, transparent);
    color: var(--ig-indigo-hi);
    padding: 1px 8px;
    border-radius: 9999px;
    font-size: 9pt;
  }

  /* Code */
  code, pre {
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    background: var(--ig-surface-alt);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 9pt;
  }
  pre {
    padding: 8px 12px;
    overflow-x: auto;
    line-height: 1.5;
  }
  pre code { background: transparent; padding: 0; }
</style>
