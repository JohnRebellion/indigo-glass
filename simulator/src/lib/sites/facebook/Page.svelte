<script lang="ts">
  /* Facebook: role-anchored chrome (banner, navigation, main, complementary,
   * dialog, search) plus the variable-driven cards, buttons and bubbles. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="chrome" title="Chrome" lead="div[role=banner] with search combobox, tab links with aria-current, left rail navigation and right complementary" min="520px">
    <Pair name="div[role=banner] + div[role=search] + input[type=search] + a[role=link][aria-current=page]" span="full">
      <div role="banner"><span class="fb-logo">f</span>
        <div role="search"><span>🔍</span><input type="search" placeholder="Search Facebook" /></div>
        <nav class="fb-tabs"><a role="link" aria-current="page" href="#">⌂</a><a role="link" href="#">▶</a><a role="link" href="#">🏬</a><a role="link" href="#">👥</a><a role="link" href="#">🎮</a></nav>
        <button class="fb-icon-btn"><i>⋮⋮</i></button><button class="fb-icon-btn">💬<span class="fb-badge">3</span></button><button class="fb-icon-btn">🔔<span class="fb-badge">12</span></button><span class="fb-avatar"></span></div>
    </Pair>
    <Pair name="div[role=navigation][aria-label] + a[aria-current=page] / div[role=complementary]" note="The current-page rail row was a 10% wash; Tier C makes it an inset stroke.">
      <div role="navigation" aria-label="Shortcuts"><a class="fb-nav-row" href="#"><span class="fb-avatar"></span>John Rebellion</a><a class="fb-nav-row" aria-current="page" href="#"><span class="fb-nav-icon"></span>Browse all</a><a class="fb-nav-row" href="#"><span class="fb-nav-icon" style="background:#F7B125"></span>Marketplace</a><a class="fb-nav-row" href="#"><span class="fb-nav-icon" style="background:#3FBB46"></span>Groups</a><a class="fb-nav-row" href="#"><span class="fb-nav-icon" style="background:#B0B3B8"></span>See more</a></div>
      <div role="complementary"><div class="fb-section-title">Contacts</div><a class="fb-nav-row" href="#"><span class="fb-avatar"></span>Ada Lovelace</a><a class="fb-nav-row" href="#"><span class="fb-avatar" style="background:#8a6d5c"></span>Grace Hopper</a><div class="fb-section-title">Group conversations</div><a class="fb-nav-row" href="#"><span class="fb-nav-icon"></span>Plasma theming</a></div>
    </Pair>
    <Pair name="label[role=combobox] + input[role=combobox] (Marketplace search)">
      <label role="combobox"><span>🔍</span><input role="combobox" placeholder="Search Marketplace" /></label>
      <input class="fb-input" placeholder="Location" /> <input class="fb-input" disabled value="Disabled" />
    </Pair>
  </Section>

  <Section id="feed" title="Feed" lead="Composer, stories, post card with media, reactions, comments; the fills come from card/comment/hover variables" min="520px">
    <Pair name="div[role=main] › composer + stories + post card" span="full">
      <div role="main">
        <div class="fb-card"><div class="fb-composer"><span class="fb-avatar"></span><div class="fb-composer-input">What's on your mind, John?</div></div><div class="fb-card-actions"><button>🎥 Live video</button><button>🖼 Photo/video</button><button>😊 Feeling/activity</button></div></div>
        <div class="fb-stories"><div class="fb-story create">+ Create story</div><div class="fb-story"><span class="fb-avatar"></span><span>Ada</span></div><div class="fb-story" style="background:linear-gradient(180deg,#8a6d5c,#1c1c1d)"><span class="fb-avatar"></span><span>Grace</span></div><div class="fb-story" style="background:linear-gradient(180deg,#5c8a6d,#1c1c1d)"><span class="fb-avatar"></span><span>Linus</span></div></div>
        <div class="fb-card"><div class="fb-card-head"><span class="fb-avatar"></span><div><b>KDE Community</b><small>2 h · 🌐</small></div><button class="fb-icon-btn" style="margin-left:auto;background:transparent"><i>⋯</i></button></div>
          <div class="fb-card-body">Plasma 6.5 ships a new <a href="#">colour scheme API</a>. Themes can now declare <span class="fb-highlight">OKLCH</span> tokens directly. <span class="fb-infochip">Edited</span></div>
          <div data-art class="fb-card-media"></div>
          <div class="fb-reshare"><b>Shared post</b><br/><small style="color:var(--secondary-text)">Sage Ink · design system</small></div>
          <div class="fb-reactions"><span class="fb-reaction"></span><span class="fb-reaction love"></span><span class="fb-reaction haha"></span> 1.2K <span style="margin-left:auto">84 comments · 12 shares</span></div>
          <div class="fb-card-actions"><button>👍 Like</button><button>💬 Comment</button><button>↪ Share</button></div>
          <div class="fb-comment"><span class="fb-avatar sm"></span><div><div class="fb-comment-bubble"><b>Ada Lovelace</b>Does it drop the blur effect too?</div><div class="fb-comment-meta"><b>Like</b><b>Reply</b>1h</div></div></div>
          <div class="fb-comment"><span class="fb-avatar sm"></span><textarea class="fb-textarea" placeholder="Write a comment…"></textarea></div>
        </div>
      </div>
    </Pair>
  </Section>

  <Section id="controls" title="Buttons and controls" lead="Primary, secondary, deemphasized, floating, disabled, on-media; chips, switch, checkbox, radio; semantic text" min="420px">
    <Pair name="button variants">
      <button class="fb-icon-btn" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <div role="button" class="fb-btn fb-btn-primary"><span>Add friend</span></div><div role="button" class="fb-btn fb-btn-secondary"><span>Message</span></div><div role="button" class="fb-btn fb-btn-deemph"><span>Following</span></div>
      <div role="button" class="fb-btn fb-btn-floating"><span>Floating</span></div><div role="button" class="fb-btn fb-btn-disabled"><span>Disabled</span></div><div role="button" class="fb-btn fb-btn-primary fb-btn-lg"><span>Large radius</span></div>
      <span data-art style="background:#222;padding:8px;border-radius:12px;display:inline-flex;gap:8px"><div role="button" class="fb-btn fb-btn-on-media"><span>On media</span></div><div role="button" class="fb-btn fb-btn-secondary-on-media"><span>Secondary</span></div></span>
    </Pair>
    <Pair name="chips / switch / checkbox / radio / tile">
      <span class="fb-chip selected">All</span><span class="fb-chip">Photos</span><span class="fb-chip">Videos</span>
      <span><span class="fb-switch on"></span> <span class="fb-switch"></span></span>
      <span><span class="fb-checkbox on"></span> <span class="fb-checkbox"></span> <span class="fb-radio on"></span> <span class="fb-radio"></span></span>
      <span class="fb-tile">🏬</span>
    </Pair>
    <Pair name="text roles / links">
      <span>Primary text</span> <span style="color:var(--secondary-text)">Secondary text</span> <span style="color:var(--disabled-text)">Disabled</span>
      <a href="#">Blue link</a> <span class="fb-pos">● Active now</span> <span class="fb-neg">✕ Failed to send</span> <span class="fb-warn">⚠ Limited</span>
    </Pair>
  </Section>

  <Section id="overlays" title="Overlays and cards" lead="Dialog, popover with menu rows, tooltip, toast, alert banner, messenger card, glimmer skeleton, marketplace grid" min="420px">
    <Pair name="div[role=dialog]">
      <div role="dialog"><div class="fb-dialog-head">Create post<button class="fb-icon-btn"><i>✕</i></button></div><div class="fb-dialog-body"><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><span class="fb-avatar"></span><div><b>John Rebellion</b><br/><span class="fb-chip" style="height:24px;font-size:12px">🌐 Public ▾</span></div></div><textarea class="fb-textarea" placeholder="What's on your mind, John?"></textarea></div><div class="fb-dialog-foot"><div role="button" class="fb-btn fb-btn-disabled" style="width:100%"><span>Post</span></div></div></div>
    </Pair>
    <Pair name="popover + menu rows / tooltip / toast / alert">
      <div role="menu" class="fb-popover"><div class="fb-popover-card"><div class="fb-menu-row"><span class="fb-avatar"></span><b>John Rebellion</b></div><div class="fb-menu-row">See all profiles</div></div><div class="fb-menu-row"><span class="fb-nav-icon" style="background:#B0B3B8"></span>Settings &amp; privacy</div><div class="fb-menu-row"><span class="fb-nav-icon" style="background:#B0B3B8"></span>Display &amp; accessibility</div><div class="fb-menu-row"><span class="fb-nav-icon" style="background:#B0B3B8"></span>Log out</div></div>
      <span role="tooltip" class="fb-tooltip">Notifications</span>
      <div class="fb-toast">Post shared to your timeline <a href="#">View</a></div>
      <div class="fb-alert">ℹ Your password was changed 3 days ago. <a href="#" style="margin-left:auto">Review</a></div>
    </Pair>
    <Pair name="messenger card / glimmer / marketplace grid">
      <div class="fb-messenger"><div class="fb-messenger-head"><span class="fb-avatar sm"></span><b>Ada Lovelace</b><span class="fb-pos" style="font-size:12px;margin-left:auto">Active now</span></div><div class="fb-msg">Blur off, shadows hard. Looks great.</div><div class="fb-msg me">Regenerate after every token change.</div><div class="fb-msg-bar"><input placeholder="Aa" /><span>👍</span></div></div>
      <div class="fb-glimmer" style="width:200px"><span style="width:60%"></span><span class="hc"></span><span style="width:80%"></span></div>
      <div class="fb-market"><div class="fb-market-card"><div class="fb-market-img"></div><b>PHP 12,000</b><small>ThinkPad X1 · Makati</small></div><div class="fb-market-card"><div class="fb-market-img" style="background:linear-gradient(135deg,#8a7a5c,#2a2f38)"></div><b>PHP 3,500</b><small>Mechanical keyboard · Quezon City</small></div><div class="fb-market-card"><div class="fb-market-img" style="background:linear-gradient(135deg,#5c8a7a,#2a2f38)"></div><b>PHP 900</b><small>USB-C dock · Pasig</small></div></div>
    </Pair>
  </Section>
  <Section id="live-icons" title="Icon buttons as facebook.com builds them" lead="div[role=button] &gt; svg + div[role=none] — no nameable class, the exemption is structural" min="320px">
    <Pair name="div[role=button] > svg (menu, messenger, notifications) + profile (> div > svg[role=img])">
      <div class="fb-live-bar"><div role="button" aria-label="Facebook menu" tabindex="0" class="x1i10hfl xjqpnuy"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2"/></svg><div role="none"></div></div><div role="button" aria-label="Messenger" tabindex="0" class="x1i10hfl xjqpnuy"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/></svg><div role="none"></div></div><div role="button" aria-label="Notifications" tabindex="0" class="x1i10hfl xjqpnuy"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 17V11a6 6 0 0112 0v6l2 2H4l2-2z" stroke="currentColor" stroke-width="2" fill="none"/></svg><div role="none"></div></div><div role="button" aria-label="Your profile" tabindex="0" class="x1i10hfl x1qjc9v5"><div><svg role="img" viewBox="0 0 40 40" width="40" height="40" aria-label="John"><circle cx="20" cy="20" r="20" fill="#5a7fc0"/></svg></div><div role="none"></div></div><div role="button" aria-label="Notifications" aria-hidden="true" tabindex="-1" class="x1i10hfl fb-live-ghost"><div role="none"></div></div><div role="button" aria-label="More" tabindex="0" class="x1i10hfl xjbqb8w"><i class="fb-live-mask" aria-hidden="true"></i><div role="none"></div></div><div role="button" aria-label="Search" tabindex="0" class="x1i10hfl x1qjc9v5"><div><i class="fb-live-mask" aria-hidden="true"></i></div><div role="none"></div></div><div role="button" aria-label="Menu" tabindex="0" class="x1i10hfl x1qjc9v5 xjbqb8w"><div><div><i class="fb-live-mask" aria-hidden="true"></i><div></div></div></div><div role="none"></div></div><div role="button" aria-label="Your profile" tabindex="0" class="x1i10hfl xjbqb8w xjqpnuy"><div><span><img alt="" class="fb-live-avatar" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" /></span></div><div role="none"></div></div><div role="button" aria-label="Create" tabindex="0" class="x1i10hfl x1qjc9v5 xjbqb8w"><div><div><div><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="currentColor"></circle></svg></div></div></div><div role="none"></div></div><div role="button" aria-label="Filters" tabindex="0" class="x1i10hfl xjqpnuy xc5r6h4"><span><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="2"/></svg></span><div role="none"></div></div><div role="button" aria-label="Seller" tabindex="0" class="x1i10hfl x1qjc9v5 xjqpnuy"><div><div><img alt="" class="fb-live-avatar" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" /><img alt="" class="fb-live-avatar" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" /><div></div><div></div></div></div></div></div>
    </Pair>
  </Section>

</SitePage>
