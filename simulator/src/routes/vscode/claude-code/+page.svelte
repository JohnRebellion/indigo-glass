<script lang="ts">
  let input = $state('Refactor the auth middleware to use the new token format.');
  let sending = $state(false);

  type Msg = {
    role: 'user' | 'assistant' | 'tool-in' | 'tool-out';
    text: string;
    label?: string;
  };

  let messages = $state<Msg[]>([
    {
      role: 'user',
      text: 'Audit my src/auth.ts and tell me which token validators are dead code.'
    },
    {
      role: 'tool-in',
      label: 'Bash',
      text: 'rg -n "validateToken|checkToken|verifyToken" src/auth.ts'
    },
    {
      role: 'tool-out',
      text: 'src/auth.ts:14:export function validateToken(t: string)\nsrc/auth.ts:32:function checkToken(req)  // unused\nsrc/auth.ts:51:export async function verifyToken(token: string)'
    },
    {
      role: 'assistant',
      text: 'checkToken at src/auth.ts:32 is dead. validateToken + verifyToken are both reachable. Drop checkToken or wire it into the new middleware chain.'
    }
  ]);

  function send() {
    if (!input.trim()) return;
    messages.push({ role: 'user', text: input });
    input = '';
    sending = true;
    setTimeout(() => {
      messages.push({
        role: 'assistant',
        text: 'Acknowledged. Running the refactor pass now.'
      });
      sending = false;
    }, 400);
  }
</script>

<div class="cc-panel" data-testid="sim-claude-code">
  <div class="cc-header">
    <span class="cc-brand-dot"></span>
    <span class="cc-brand">Claude Code</span>
    <span class="cc-model">claude-opus-4-7</span>
    <span class="cc-flex"></span>
    <button class="ig-button-secondary ig-button">New session</button>
  </div>

  <div class="cc-messages" data-testid="messages">
    {#each messages as m}
      {#if m.role === 'user'}
        <div class="msg msg-user" data-testid="msg-user">
          <strong>You</strong>
          <p>{m.text}</p>
        </div>
      {:else if m.role === 'assistant'}
        <div class="msg msg-assistant" data-testid="msg-assistant">
          <strong>Claude</strong>
          <p>{m.text}</p>
        </div>
      {:else if m.role === 'tool-in'}
        <div class="msg msg-tool" data-testid="msg-tool-in">
          <div class="tool-head">
            <span class="dot"></span>
            <strong>{m.label}</strong>
            <span class="tool-label">IN</span>
          </div>
          <pre class="tool-body">{m.text}</pre>
        </div>
      {:else}
        <div class="msg msg-tool" data-testid="msg-tool-out">
          <div class="tool-head">
            <span class="tool-label">OUT</span>
          </div>
          <pre class="tool-body tool-out">{m.text}</pre>
        </div>
      {/if}
    {/each}
    {#if sending}
      <div class="msg msg-assistant pending">
        <strong>Claude</strong>
        <p class="dim">Thinking...</p>
      </div>
    {/if}
  </div>

  <div class="cc-composer">
    <textarea
      bind:value={input}
      placeholder="Reply to Claude or paste a Bash command..."
      class="ig-input"
      rows="2"
      data-testid="composer"
    ></textarea>
    <div class="cc-composer-row">
      <span class="hint">Carlito body. Iosevka Custom Condensed mono. Indigo focus.</span>
      <button class="ig-button" onclick={send} data-testid="send">Send</button>
    </div>
  </div>
</div>

<style>
  .cc-panel {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 36px);
    background: var(--ig-base);
    color: var(--ig-text);
    max-width: 720px;
    margin: 0 auto;
    border-left: 1px solid var(--ig-border);
    border-right: 1px solid var(--ig-border);
  }

  .cc-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--ig-surface);
    border-bottom: 1px solid var(--ig-border);
    font-size: 10pt;
  }
  .cc-brand-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ig-indigo);
    box-shadow: 0 0 6px var(--ig-indigo-hi);
  }
  .cc-brand { font-weight: 600; }
  .cc-model {
    color: var(--ig-text-muted);
    font-family: "Iosevka Custom Condensed", monospace;
    font-size: 8pt;
  }
  .cc-flex { flex: 1; }

  .cc-messages {
    flex: 1;
    overflow: auto;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .msg p { margin: 2px 0 0; font-size: 10pt; line-height: 1.5; }
  .msg strong { font-size: 9pt; color: var(--ig-text-muted); display: block; }
  .msg-assistant strong { color: var(--ig-indigo-hi); }

  .msg-tool {
    background: var(--ig-surface-alt);
    border: 1px solid var(--ig-border);
    border-radius: var(--ig-radius-default);
    padding: 6px 8px;
  }
  .tool-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .tool-head .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ig-positive);
  }
  .tool-head strong { font-size: 9pt; color: var(--ig-text); }
  .tool-label {
    font-family: "Iosevka Custom Condensed", monospace;
    font-size: 8pt;
    color: var(--ig-text-muted);
    padding: 0 4px;
    border: 1px solid var(--ig-border-strong);
    border-radius: 3px;
  }
  .tool-body {
    margin: 0;
    padding: 4px 6px;
    background: var(--ig-base);
    border-radius: var(--ig-radius-sm);
    font-family: "Iosevka Custom Condensed", "MesloLGS NF", monospace;
    font-size: 9pt;
    line-height: 1.4;
    color: var(--ig-text);
    white-space: pre-wrap;
    overflow-x: auto;
  }
  .tool-out { color: var(--ig-text-muted); }

  .pending .dim { color: var(--ig-text-muted); font-style: italic; }

  .cc-composer {
    padding: 8px 12px;
    background: var(--ig-surface);
    border-top: 1px solid var(--ig-border);
  }
  .cc-composer textarea {
    width: 100%;
    resize: none;
    font-family: inherit;
    font-size: 10pt;
    min-height: 36px;
  }
  .cc-composer-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .hint {
    color: var(--ig-text-muted);
    font-size: 8pt;
    flex: 1;
  }
</style>
