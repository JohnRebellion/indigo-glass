<script lang="ts">
  /* Microsoft Copilot: #app shell with sidebar and composer, thread with
   * citations and code, squircle-clipped cards, controls, dialog and menu,
   * the avatar/spinner/rounded-full exemptions. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="shell" title="#app shell" lead="Sidebar Fluent nav items (fui-NavItem / SplitNavItem / NavCategoryItem / NavSubItem, r=12 live), greeting, squircle composer with textarea and rounded-full send, suggestion chips, mode toggle" min="600px">
    <Pair name="#app + sidebar button + .composer textarea + .btn.send.rounded-full + .chip" wrap={false} span="full">
      <div id="app" class="shell"><nav class="sidebar"><a class="brand spa-link" href="#"><i data-art></i> Copilot</a><button class="fui-NavItem active">💬 Chat</button><button class="fui-NavItem">🖼 Imagine</button><button class="fui-NavItem">📚 Pages</button><button class="fui-NavItem">🔔 Notifications</button><div class="label">Recent</div><div class="fui-SplitNavItem"><button class="fui-NavItem">Sage Ink stock pages</button></div><div class="fui-NavCategoryItem"><button class="fui-NavItem">Tailwind ramp channels</button><a class="fui-NavSubItem" href="#">Squircle clip-paths</a></div><div class="user"><div class="account"><div><span aria-hidden="true"><span id="user-account-avatar" class="avatar" role="img" aria-label="John Rebellion">JR</span></span></div><div class="account-hit"><div><button type="button" aria-label="Account" style="height:31px;width:31px;border-radius:50%;background:transparent"></button></div></div><div role="button" class="account-overlay" tabindex="0" aria-label="John Rebellion"></div><span>John Rebellion</span></div></div></nav>
        <div class="main"><div class="greeting">Hey John, what's on your mind?</div>
          <div class="composer"><textarea rows="1" placeholder="Message Copilot"></textarea><div class="bar"><button class="btn icon ghost rounded-full"><i>＋</i></button><div class="mode-toggle"><button class="active">Quick response</button><button>Think deeper</button></div><div class="right"><button class="btn icon ghost rounded-full"><i>🎤</i></button><button class="btn send rounded-full"><i>↑</i></button></div></div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><span class="chip">✍ Write a draft</span><span class="chip selected">💡 Explain OKLCH</span><span class="chip">🧩 Debug CSS</span><span class="chip">🌐 Search the web</span></div>
        </div></div>
    </Pair>
  </Section>

  <Section id="thread" title="Thread" lead="User bubble, bot answer with citations, table, code block (class*=code), sources, follow-ups, typing spinner" min="600px">
    <Pair name=".msg.user + .msg.bot + .code-block + code + .citation + .sources" span="full">
      <div class="thread"><div class="msg user">Why do the ramps use space-separated channels?</div>
        <div class="msg bot"><span data-art class="avatar-bot"></span><div class="body"><h3>Alpha composition</h3><p style="margin:0">Tailwind stores <code>--color-background-100</code> as <strong>three channels</strong> so utilities can add opacity: <code>rgb(var(--x) / .5)</code>.<span class="citation">1</span> A remap must keep the channel format.<span class="citation">2</span></p>
          <ul><li>Hex values break every <code>rgb(var())</code> consumer</li><li>Static ramps invert for on-colour text</li></ul>
          <table><thead><tr><th>Token</th><th>Stock</th><th>Ours</th></tr></thead><tbody><tr><td><code>background-100</code></td><td>14 17 27</td><td>7 8 10</td></tr><tr><td><code>accent-700</code></td><td>183 201 254</td><td>142 201 255</td></tr></tbody></table>
          <div class="code-block"><div class="head"><span>css</span><span>⎘ Copy</span></div><pre><code>--color-background-100: 7 8 10 !important;
--clip-path-squircle-24: none !important;</code></pre></div>
          <div class="sources"><a href="#"><i></i> tailwindcss.com</a><a href="#"><i style="background:#7fba00"></i> learn.microsoft.com</a></div>
          <div class="msg-actions"><button><i>⎘</i></button><button><i>👍</i></button><button><i>👎</i></button><button><i>🔊</i></button><button><i>↻</i></button></div>
          <div class="followups"><button class="fx-Suggestion followup">Show me the static ramp mapping</button><button class="fx-Suggestion followup">Why keep rounded-full exempt?</button></div>
          <span class="typing"><i></i><i></i><i></i></span> <span class="spinner"></span></div></div></div>
    </Pair>
  </Section>

  <Section id="controls" title="Controls and cards" lead="button variants, input/textarea, switch/checkbox/radio, tabs, pill, squircle cards, image tiles, avatars (class*=avatar / Avatar), voice orb" min="420px">
    <Pair name="button variants + .btn.icon.rounded-full">
      <button class="btn icon" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="btn primary">Sign in</button><button class="btn fui-Button">Secondary</button><button class="btn outline">Outline</button><button class="btn ghost">Ghost</button><button class="btn danger">Delete</button><button class="btn" disabled>Disabled</button>
      <span><button class="btn icon"><i>⚙</i></button> <button class="btn icon rounded-full"><i>＋</i></button></span>
    </Pair>
    <Pair name="input + textarea + switch/checkbox/radio + tabs + .pill.rounded-full">
      <input class="input" value="Copilot Pro" /> <textarea class="textarea" placeholder="Custom instructions"></textarea>
      <span><span class="switch on"></span> <span class="switch"></span> <span class="checkbox on"></span> <span class="checkbox"></span> <span class="radio on"></span> <span class="radio"></span></span>
      <div class="tabs" style="width:100%"><button class="active">Chats</button><button>Pages</button><button>Images</button></div>
      <span><span class="pill rounded-full">Pro</span> <span class="pill rounded-full">New</span></span>
    </Pair>
    <Pair name=".card (squircle) + .image-tile + .avatar / .Avatar-lg + .voice-orb.rounded-full">
      <div class="card"><div class="img"></div><b>Sage Ink stock pages</b><p>Page 2 · Updated 2 h ago</p><div style="display:flex;gap:8px"><button class="btn" style="height:32px">Open</button><button class="btn ghost" style="height:32px">Share</button></div></div>
      <div class="card caramel"><b>Caramel tint</b><p>Semantic ramp for warm cards.</p></div><div class="card cocoa"><b>Cocoa tint</b><p>Warm neutral ramp.</p></div>
      <span><span class="image-tile"></span> <span class="image-tile" style="background:linear-gradient(135deg,#7fba00,#00a4ef)"></span></span>
      <span><span class="avatar">JR</span> <span class="Avatar-lg"></span> <span class="voice-orb rounded-full"></span></span>
    </Pair>
  </Section>

  <Section id="overlays" title="Overlays and feedback" lead="role=dialog, role=menu, toast, banners, tooltip, skeleton" min="420px">
    <Pair name="[role=dialog]" wrap={false}>
      <div role="dialog"><h2>Delete this chat?</h2><p>"Sage Ink stock pages" will be removed from your history.</p><div class="foot"><button class="btn ghost">Cancel</button><button class="btn danger">Delete</button></div></div>
    </Pair>
    <Pair name="[role=menu] + [role=menuitem]" wrap={false}>
      <div role="menu"><div role="menuitem">✎ Rename</div><div role="menuitem">📌 Pin</div><div role="menuitem">↗ Share</div><hr/><div role="menuitem" style="color:#f28b92">🗑 Delete</div></div>
    </Pair>
    <Pair name="toast / banners / tooltip / skeleton" wrap={false}>
      <div class="toast">✓ Link copied</div>
      <div class="banner">✦ Copilot can make mistakes. Check important info.</div><div class="banner error">✕ Something went wrong. Try again.</div>
      <span role="tooltip" class="tooltip">New chat</span>
      <div class="skeleton" style="width:60%"></div>
    </Pair>
  </Section>
</SitePage>
