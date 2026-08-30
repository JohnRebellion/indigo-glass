<script lang="ts">
  let address = $state('https://github.com/JohnRebellion/indigo-glass');
  let active = $state('marketplace');

  const tabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'mail', label: 'Inbox' }
  ];
</script>

<div class="sim-browser" data-testid="sim-browser">
  <div class="window">
    <div class="window-chrome">
      <div class="traffic">
        <span class="tl tl-close"></span>
        <span class="tl tl-min"></span>
        <span class="tl tl-max"></span>
      </div>
      <div class="addr">
        <input class="ig-input" bind:value={address} data-testid="addr-input" />
      </div>
      <div class="chrome-actions">
        <button class="ig-button-secondary ig-button" data-testid="reload">Reload</button>
      </div>
    </div>

    <div class="tabbar">
      {#each tabs as t}
        <button
          class="tab"
          class:active={active === t.id}
          onclick={() => (active = t.id)}
          data-testid="tab-{t.id}"
        >{t.label}</button>
      {/each}
    </div>

    <div class="content">
      {#if active === 'feed'}
        <div class="post">
          <h3>Linear app dark discipline notes</h3>
          <p>
            The good design language emerges when restraint becomes the style.
            A single accent <a href="/">indigo</a>, mono icons, near-black surfaces.
            Avoid pure <code>#000</code> &mdash; it halates on OLED.
          </p>
          <div class="post-meta">
            <span class="chip">design</span>
            <span class="chip chip-violet">linear</span>
          </div>
        </div>
      {:else if active === 'marketplace'}
        <div class="grid">
          {#each Array(8) as _, i}
            <div class="card">
              <div class="card-img"></div>
              <div class="card-body">
                <strong>Item {i + 1}</strong>
                <span class="muted">PHP {(i + 1) * 1200}</span>
              </div>
            </div>
          {/each}
        </div>
      {:else if active === 'mail'}
        <ul class="mail-list">
          {#each Array(6) as _, i}
            <li>
              <span class="mail-from">Sender {i + 1}</span>
              <span class="mail-subj">Re: Sage Ink token system v{i + 1}</span>
              <span class="mail-time muted">{i + 1}h ago</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

<style>
  .sim-browser {
    padding: 12px;
  }
  .window {
    max-width: 1100px;
    margin: 0 auto;
    background: var(--ig-surface);
    border-radius: var(--ig-radius-default);
    border: var(--ig-border-default) solid var(--ig-border);
    overflow: hidden;
    box-shadow: var(--ig-shadow-ink-lg); /* was --ig-shadow-glass, a token deleted in tokens v5 - resolved to nothing */
  }
  .window-chrome {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    background: var(--ig-surface);
    border-bottom: 1px solid var(--ig-border);
  }
  .traffic {
    display: flex;
    gap: 4px;
  }
  .tl {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .tl-close { background: var(--ig-negative); }
  .tl-min   { background: var(--ig-amber); }
  .tl-max   { background: var(--ig-positive); }
  .addr {
    flex: 1;
  }
  .addr input {
    width: 100%;
    font-size: 9pt;
  }
  .chrome-actions button {
    font-size: 9pt;
  }

  .tabbar {
    display: flex;
    background: var(--ig-base);
    padding: 0 8px;
    border-bottom: 1px solid var(--ig-border);
  }
  .tab {
    background: transparent;
    border: none;
    color: var(--ig-text-muted);
    padding: 4px 10px;
    font-size: 9pt;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color var(--ig-dur-quick), border-color var(--ig-dur-quick);
  }
  .tab:hover {
    color: var(--ig-text);
  }
  .tab.active {
    color: var(--ig-text);
    border-bottom-color: var(--ig-indigo);
  }

  .content {
    padding: 12px;
    min-height: 320px;
    background: var(--ig-base);
  }

  .post h3 {
    font-size: 13pt;
    margin: 0 0 6px;
  }
  .post p {
    color: var(--ig-text);
    margin: 0;
    font-size: 10pt;
    line-height: 1.55;
  }
  .post code {
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    background: var(--ig-surface-alt);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 9pt;
  }
  .post-meta {
    margin-top: 8px;
    display: flex;
    gap: 4px;
  }
  .chip {
    background: var(--ig-surface-alt); /* was color-mix(...,18%,transparent) - opaque badge fill, real token not a blend */
    color: var(--ig-indigo-hi);
    padding: 1px 6px;
    border-radius: 9999px;
    font-size: 8pt;
  }
  .chip-violet {
    background: var(--ig-surface-alt); /* was color-mix(...,18%,transparent) - opaque badge fill */
    color: var(--ig-violet);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 6px;
  }
  .card {
    background: var(--ig-surface-alt);
    border: var(--ig-border-default) solid var(--ig-border);
    border-radius: var(--ig-radius-default); /* was --ig-radius-sm, a token that doesn't exist */
    box-shadow: var(--ig-shadow-ink);
    overflow: hidden;
    transition: border-color var(--ig-dur-quick), transform var(--ig-motion-ink-press, 80ms steps(2, end)), box-shadow var(--ig-motion-ink-press, 80ms steps(2, end));
  }
  /* Press travels on :hover per the neobrutalism.dev reference. */
  .card:hover {
    border-color: var(--ig-indigo);
    transform: translate(4px, 4px);
    box-shadow: var(--ig-shadow-none);
  }
  .card-img {
    aspect-ratio: 1;
    background: linear-gradient(135deg, var(--ig-surface), var(--ig-sidebar));
  }
  .card-body {
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
  }
  .card-body strong {
    font-size: 10pt;
  }
  .muted {
    color: var(--ig-text-muted);
    font-size: 8pt;
  }

  .mail-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .mail-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 8px;
    border-bottom: 1px solid var(--ig-border);
    font-size: 10pt;
  }
  .mail-list li:hover {
    background: color-mix(in srgb, var(--ig-indigo) 8%, transparent);
  }
  .mail-from {
    min-width: 100px;
    font-weight: 500;
  }
  .mail-subj {
    flex: 1;
    color: var(--ig-text-muted);
  }
  .mail-time {
    font-size: 8pt;
  }
</style>
