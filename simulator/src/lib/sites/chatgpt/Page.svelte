<script lang="ts">
  /* ChatGPT: shell, composer, thread with data-message-author-role, prose /
   * markdown, code block, controls, dialog and menu, feedback. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="shell" title="Shell and composer" lead="Sidebar (rounded-lg rows), top bar model picker, rounded-3xl composer, suggestion chips" min="560px">
    <Pair name="sidebar + topbar + .composer.rounded-3xl + .chip.rounded-full" span="full">
      <div class="shell"><nav class="sidebar"><a class="rounded-lg" href="#">✎ New chat</a><a class="rounded-lg" href="#">🔍 Search chats</a><a class="rounded-lg" href="#">📚 Library</a><div class="label">Projects</div><a class="rounded-lg" href="#">📁 indigo-glass</a><div class="label">Chats</div><a class="rounded-lg active" href="#">Stock element pages</a><a class="rounded-lg" href="#">Playwright clip screenshots</a><a class="rounded-lg" href="#">OKLCH ladder</a></nav>
        <div class="main"><div class="topbar"><button class="model rounded-lg">ChatGPT 5 ▾</button><button class="btn btn-secondary rounded-full share">↗ Share</button><span class="avatar rounded-full">JR</span></div>
          <h1 style="text-align:center;margin-top:24px">What can I help with?</h1>
          <div class="composer rounded-3xl"><textarea rows="1" placeholder="Ask anything"></textarea><div class="bar"><button class="btn btn-icon rounded-full"><i>＋</i></button><button class="chip rounded-full" style="height:32px">🌐 Search</button><button class="chip rounded-full" style="height:32px">💡 Reason</button><button class="btn btn-icon rounded-full"><i>🎤</i></button><button class="btn btn-icon rounded-full send" disabled><i>↑</i></button></div></div>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><span class="chip rounded-full">📝 Summarise text</span><span class="chip rounded-full">💻 Code</span><span class="chip rounded-full">🧠 Brainstorm</span><span class="chip rounded-full">More</span></div>
        </div></div>
    </Pair>
  </Section>

  <Section id="thread" title="Thread" lead="data-message-author-role user/assistant, markdown prose, code block with header, sources pill, canvas card, message actions" min="560px">
    <Pair name="[data-message-author-role] + .markdown.prose + .code-block.rounded-md + .font-mono" span="full">
      <div class="thread">
        <div data-message-author-role="user"><p>Show me the selectors the Stylus file misses on GitHub.</p></div>
        <div data-message-author-role="assistant"><span class="logo rounded-full">◎</span><div>
          <div class="markdown prose"><h2>Three hardcoded radii</h2><p>The file zeroes the five Primer radius tokens, but these <strong>do not read them</strong>:</p><ol><li><code>.State</code> uses <code>2em</code></li><li><code>.Counter</code> uses <code>2em</code></li><li><code>.topic-tag</code> uses <code>2em</code></li></ol><blockquote>A token remap only reaches what reads the token.</blockquote><h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6>
            <table><thead><tr><th>Selector</th><th>Radius</th></tr></thead><tbody><tr><td class="font-mono">.btn</td><td>token</td></tr><tr><td class="font-mono">.State</td><td>2em</td></tr></tbody></table><hr/>
            <div class="code-block rounded-md"><div class="head"><span>css</span><span>⎘ Copy code</span></div><pre><code>.State, .Counter, .topic-tag &#123;
  border-radius: 0 !important;
&#125;</code></pre></div>
            <p>Verify with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd>, then <samp>check-palette-drift.sh</samp> in a <tt>tty</tt>. <a href="#">Primer docs</a>.</p>
            <span class="sources rounded-full">🔗 Sources · 3</span>
            <div class="canvas rounded-xl"><span class="icon rounded-lg">📄</span><div><b>github.user.css</b><small>Canvas · 226 lines</small></div></div>
          </div>
          <div class="msg-actions"><button><i>⎘</i></button><button><i>👍</i></button><button><i>👎</i></button><button><i>🔊</i></button><button><i>↻</i></button></div>
        </div></div>
      </div>
    </Pair>
  </Section>

  <Section id="controls" title="Controls" lead="Buttons, label/input/select, switch, checkbox, segmented tabs, cards" min="420px">
    <Pair name="button variants">
      <button class="btn btn-icon" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="btn btn-primary rounded-full">Log in</button><button class="btn btn-secondary rounded-full">Sign up for free</button><button class="btn btn-accent rounded-lg">Upgrade</button><button class="btn btn-tertiary rounded-lg">Tertiary</button><button class="btn btn-ghost rounded-lg">Ghost</button><button class="btn btn-danger rounded-lg">Delete</button>
    </Pair>
    <Pair name="label + input + select + switch + checkbox + tabs">
      <div style="display:flex;flex-direction:column;gap:4px"><label>Custom instructions</label><input class="input rounded-lg" value="Be terse." /></div>
      <select class="select rounded-lg"><option>Always</option></select>
      <span><span class="switch rounded-full on"></span> <span class="switch rounded-full"></span> <span class="checkbox rounded on"></span> <span class="checkbox rounded"></span></span>
      <div class="tabs"><button class="active">Chat</button><button>Canvas</button><button>Files</button></div>
    </Pair>
    <Pair name="cards / brand text">
      <div class="card rounded-xl"><h3>GPT: Theme Auditor</h3><p>Checks a Stylus file against a live page. By John Rebellion.</p></div>
      <p>Plan: <span class="brand">ChatGPT Plus</span> · <a href="#">Manage</a></p>
    </Pair>
  </Section>

  <Section id="overlays" title="Overlays and feedback" lead="role=dialog, role=menu, toast, banners, tooltip" min="420px">
    <Pair name="[role=dialog].rounded-2xl">
      <div role="dialog" class="rounded-2xl"><h2>Delete chat?</h2><p>This will delete <strong>Stock element pages</strong>.</p><div class="foot"><button class="btn btn-secondary rounded-full">Cancel</button><button class="btn btn-danger rounded-lg" style="border-radius:999px">Delete</button></div></div>
    </Pair>
    <Pair name="[role=menu].rounded-2xl + [role=menuitem].rounded-lg">
      <div role="menu" class="rounded-2xl"><div role="menuitem" class="rounded-lg">↗ Share</div><div role="menuitem" class="rounded-lg">✎ Rename</div><div role="menuitem" class="rounded-lg">📁 Move to project</div><hr/><div role="menuitem" class="rounded-lg" style="color:var(--text-error)">🗑 Delete</div></div>
    </Pair>
    <Pair name="toast / banners / tooltip">
      <div class="toast rounded-lg">✓ Copied</div>
      <div class="banner rounded-lg error">Something went wrong. Please try again.</div>
      <div class="banner rounded-lg warning">You have reached the Plus plan limit for GPT-5.</div>
      <div class="banner rounded-lg success">Memory updated.</div>
      <span role="tooltip" class="tooltip rounded-lg">Copy</span>
    </Pair>
  </Section>
</SitePage>
