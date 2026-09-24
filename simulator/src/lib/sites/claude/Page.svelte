<script lang="ts">
  /* Claude: shell, composer, thread (user/assistant messages, prose, code
   * block, artifact, tool call), controls, dialog/menu, feedback. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="shell" title="Shell and composer" lead="Sidebar rows (rounded-lg), greeting, the rounded-2xl composer with a contenteditable, pills" min="560px">
    <Pair name="sidebar + greeting + .composer.rounded-2xl + .pill.rounded-full" span="full">
      <div class="shell"><nav class="sidebar"><div class="brand">Claude</div><a class="rounded-lg active" href="#">＋ New chat</a><a class="rounded-lg" href="#">💬 Chats</a><a class="rounded-lg" href="#">📁 Projects</a><a class="rounded-lg" href="#">🧩 Artifacts</a><div class="label">Recents</div><a class="rounded-lg" href="#">Sage Ink stock pages</a><a class="rounded-lg" href="#">OKLCH ladder maths</a><a class="rounded-lg" href="#">Playwright clip slices</a></nav>
        <div class="main"><h1 class="greeting"><span class="spark">✳</span> Good evening, John</h1>
          <div class="composer rounded-2xl"><div contenteditable="true" data-placeholder="How can I help you today?"></div><div class="bar"><button class="btn btn-icon rounded-md"><i>＋</i></button><button class="btn btn-icon rounded-md"><i>⚙</i></button><span class="model">Claude Fable 5.1 ▾</span><button class="btn btn-send rounded-lg" aria-label="Send message"><i>↑</i></button></div></div>
          <div style="display:flex;gap:8px"><span class="pill rounded-full">Write</span><span class="pill rounded-full">Learn</span><span class="pill rounded-full">Code</span><span class="pill rounded-full pro">Pro</span><span class="pill rounded-full new">New</span></div>
        </div></div>
    </Pair>
  </Section>

  <Section id="thread" title="Thread" lead="data-testid user/assistant messages, prose (headings, list, table, blockquote), code block, thinking, tool call, artifact card" min="560px">
    <Pair name="[data-testid*=message] + .prose + .code-block.rounded-lg + .artifact.rounded-xl" span="full">
      <div class="thread">
        <div data-testid="user-message" class="rounded-2xl"><p>Why does the stock lane still show rounded pills after your remap?</p></div>
        <div data-testid="assistant-message"><span class="avatar rounded-full">✳</span><div>
          <div class="thinking rounded-lg">Thought for 4 seconds ▾</div>
          <div class="prose" style="margin-top:8px"><h2>Because the pill never reads a radius token</h2><p>The file zeroes <code>[class*="rounded"]</code>, but the <strong>State</strong> pill hardcodes <code>border-radius: 2em</code>. Options:</p><ul><li>Add the class to the hardcode list</li><li>Or accept it as a documented limit</li></ul><blockquote>Radius tokens cover 90% of Primer; the rest is literal.</blockquote>
            <table><thead><tr><th>Element</th><th>Reads token</th></tr></thead><tbody><tr><td>.btn</td><td>yes</td></tr><tr><td>.State</td><td>no</td></tr></tbody></table><hr/>
            <div class="code-block rounded-lg"><div class="head"><span>css</span><button class="btn btn-ghost" style="height:24px;padding:0 6px;font-size:12px">Copy</button></div><pre><code>.State, .Counter, .topic-tag &#123;
  border-radius: 0 !important;
&#125;</code></pre></div>
            <h4>Verify</h4><div class="tool rounded-lg">🔧 <span class="font-mono">check-palette-drift.sh</span> <span class="ok">✓ passed</span></div>
            <div class="tool rounded-lg">🔧 <span class="text-mono">vite build</span> <span class="err">✕ <samp>js_parse_error</samp></span></div><h5>Output</h5><p data-test="code-output"><tt>$ npx vite build</tt></p><h6>Notes</h6>
            <div class="artifact rounded-xl"><span class="icon rounded-lg">📄</span><div><b>github/stock.css</b><small>Code · 267 lines</small></div></div>
          </div>
          <div class="msg-actions"><button class="btn btn-icon rounded-md"><i>⎘</i></button><button class="btn btn-icon rounded-md"><i>👍</i></button><button class="btn btn-icon rounded-md"><i>👎</i></button><button class="btn btn-icon rounded-md"><i>↻</i></button></div>
        </div></div>
      </div>
    </Pair>
  </Section>

  <Section id="controls" title="Controls" lead="Buttons, inputs, select, switch, checkbox, tabs, kbd, usage bar" min="420px">
    <Pair name="button variants">
      <button class="btn btn-icon" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="btn btn-primary rounded-lg bg-accent-main-000">Start chat</button><button class="btn btn-secondary rounded-lg">Cancel</button><button class="btn btn-ghost">Ghost</button><button class="btn btn-danger rounded-lg">Delete chat</button><button class="btn btn-primary rounded-lg bg-accent-main-000" disabled>Disabled</button>
    </Pair>
    <Pair name="label + input + select + switch + checkbox + kbd">
      <div style="display:flex;flex-direction:column;gap:4px"><label>Project name</label><input class="input rounded-lg" value="indigo-glass" /></div>
      <select class="select rounded-lg"><option>Claude Fable 5.1</option></select>
      <span><span class="switch rounded-full on"></span> <span class="switch rounded-full"></span> <span class="checkbox rounded on"></span> <span class="checkbox rounded"></span></span>
      <span><kbd>⌘</kbd> <kbd>K</kbd></span>
    </Pair>
    <Pair name="tabs / usage / skeleton / list rows">
      <div class="tabs" style="width:100%"><button class="active">Chats</button><button>Projects</button><button>Files</button></div>
      <div class="usage"><span></span></div>
      <div style="width:100%"><div class="list-row rounded-lg">💬 Sage Ink stock pages <small>2 h ago</small></div><div class="list-row rounded-lg">💬 OKLCH ladder maths <small>Yesterday</small></div></div>
      <div class="skeleton rounded" style="width:60%"></div>
    </Pair>
  </Section>

  <Section id="overlays" title="Overlays and feedback" lead="role=dialog, role=menu, cards, toast, banners, tooltip" min="420px">
    <Pair name="[role=dialog].rounded-2xl">
      <div role="dialog" class="rounded-2xl"><h2>Rename chat</h2><p style="color:var(--text-300)">Give this conversation a name you will find again.</p><input class="input rounded-lg" style="width:100%" value="Sage Ink stock pages" /><div class="foot"><button class="btn btn-secondary rounded-lg">Cancel</button><button class="btn btn-primary rounded-lg bg-accent-main-000">Save</button></div></div>
    </Pair>
    <Pair name="[role=menu].rounded-xl + [role=menuitem].rounded-md / card">
      <div role="menu" class="rounded-xl"><div role="menuitem" class="rounded-md">★ Star</div><div role="menuitem" class="rounded-md">✎ Rename</div><div role="menuitem" class="rounded-md">📁 Move to project</div><hr/><div role="menuitem" class="rounded-md" style="color:var(--danger-100)">🗑 Delete</div></div>
      <div class="card rounded-xl"><h3>Project: indigo-glass</h3><p>Sage Ink design system, Plasma first. 14 chats · 6 files.</p></div>
    </Pair>
    <Pair name="toast / banners / tooltip">
      <div class="toast rounded-lg">✓ Copied to clipboard</div>
      <div class="banner rounded-lg">ℹ You are using Claude Fable 5.1. <a href="#">Learn more</a></div>
      <div class="banner rounded-lg danger">✕ Message limit reached. Resets at 21:00.</div>
      <div class="banner rounded-lg success">✓ Project shared with 3 people.</div>
      <span role="tooltip" class="tooltip rounded-md">New chat (⌘K)</span>
    </Pair>
  </Section>
</SitePage>
