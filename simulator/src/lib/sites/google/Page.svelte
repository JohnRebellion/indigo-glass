<script lang="ts">
  /* Google Search: the dark SERP as structural ids — search form, hdtb tabs,
   * results with h3/cite/mark, AI Overview, knowledge panel, chip lists,
   * people-also-ask, related searches, pager, footer. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
  const jsc = { jscontroller: 'y' } as Record<string, string>;
  const px = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
</script>

<SitePage {site}>
  <Section id="header" title="Search header" lead="#searchform › form#tsf › div.RNNXgb, the hdtb tabs with aria-current, g-fab" min="520px">
    <Pair name="#searchform + form#tsf .RNNXgb + #appbar #hdtb-sc [aria-current=page]" wrap={false} span="full">
      <div id="main"><div id="cnt">
        <div id="searchform"><span class="glogo"><b>G</b><b>o</b><b>o</b><b>g</b><b>l</b><b>e</b></span><form id="tsf"><div class="RNNXgb"><textarea class="gLFyf" rows="1">sage ink kde theme</textarea><span class="ico">✕</span><span class="ico mic">🎤</span><span class="ico lens">◎</span><span class="ico" style="color:#8ab4f8">🔍</span></div></form><g-fab>⋮⋮</g-fab><input class="gsfi" placeholder="input" /></div>
        <div id="appbar"><div id="hdtb-sc" role="navigation"><a href="#" aria-current="page">All</a><a href="#">Images</a><a href="#">Videos</a><a href="#">News</a><a href="#">Shopping</a><a href="#">Web</a><div></div><button>Tools</button></div></div>
      </div></div>
    </Pair>
  </Section>

  <Section id="results" title="Results column" lead="#rcnt › #center_col › #search › #rso: organic results with a h3, cite, snippet em/b, mark, sitelinks, AI Overview, chip carousel, PAA" min="520px">
    <Pair name="#rcnt #center_col #rso results + [data-fh] AI Overview + mark" span="full">
      <div id="rcnt" class="shell"><div id="center_col"><h1 class="sr">Search results</h1><div id="search"><div id="rso">
        <div data-fh="1"><div class="ai-title">AI Overview</div><div>Sage Ink is an <mark>opaque flat-ink</mark> design system for KDE Plasma. It removes <em>blur</em> and <b>translucency</b>, uses OKLCH tokens and a single accent.<div role="button"><div>1</div></div><div role="button"><div>2</div></div></div><div class="ai-fade"></div><div role="button">Show more ▾</div></div>
        <div class="result"><div class="src"><g-img><img alt="" /></g-img><div><span>GitHub</span><cite>https://github.com<span> › JohnRebellion › indigo-glass</span></cite></div></div><a href="#"><h3>JohnRebellion/indigo-glass: Sage Ink design system</h3></a><div class="snip VwiC3b"><span class="date">20 Sept 2026 — </span>KDE Plasma first, plus GTK, Konsole, browsers, editors, SDDM, GRUB and Windows Terminal. The design system is <em>Sage Ink</em> …</div>
          <div class="sitelinks"><a href="#">Install</a><a href="#">Tokens</a><a href="#">Simulator</a><a href="#">Architecture</a></div></div>
        <div class="result"><div class="src"><g-img><img alt="" /></g-img><div><span>KDE Store</span><cite>https://store.kde.org<span> › p › 2201</span></cite></div></div><a href="#" style="color:#c58af9"><h3 style="color:#c58af9">Sage Ink — Plasma Color Scheme (visited)</h3></a><div class="snip VwiC3b">Deep black + muted sage. <b>Zero glass</b>, hard ink shadow, OKLCH colour. <a href="#">Read more</a></div></div>
        <g-section-with-header><h2 class="gsh-title">Images</h2><div role="list"><div role="listitem"><a role="link" href="#"><div><img src={px} alt="" /><span>Sage Ink desktop</span></div></a></div><div role="listitem"><a role="link" href="#"><div><img src={px} alt="" /><span>GRUB theme</span></div></a></div><div role="listitem"><a role="link" href="#"><div><img src={px} alt="" /><span>Konsole profile</span></div></a></div></div><div role="button">→ More images</div></g-section-with-header>
        <hr /><div style="border-top:1px solid #3c4043;padding-top:8px" class="paa"><h2 class="gsh-title">People also ask</h2><div role="button">Is Sage Ink available for GNOME? <span>⌄</span></div><div role="button">Does it support light mode? <span>⌄</span></div></div>
        <div role="region"><div><b>Videos</b><div style="display:flex;gap:12px;margin-top:8px"><img src={px} alt="" /><div><a href="#">Sage Ink walkthrough</a><br/><span class="date">YouTube · 2 days ago</span></div></div></div></div>
        <div data-attrid="kc:/x"><div {...jsc}><div class="kp-title">Sage Ink</div><div class="kp-sub">Design system</div><div style="margin-top:8px"><div role="button">Website</div> <div role="button">Repository</div></div></div></div>
        <div class="ZOyvub"><div role="region"><b>Short videos</b><div style="display:flex;gap:12px;margin-top:8px"><g-inner-card><img src={px} alt="" /></g-inner-card><g-inner-card><img src={px} alt="" /></g-inner-card></div></div></div>
        <div data-lhoverlay="1"></div>
      </div></div></div>
      <div id="rhs"><div class="kp"><img src={px} alt="" style="width:96px;height:96px;border-radius:8px;background:#303134" /><div style="font:24px arial;color:#e8eaed;margin-top:8px">KDE Plasma</div><div style="color:#9aa0a6">Desktop environment</div><hr style="border:0;border-top:1px solid #3c4043;margin:12px 0" /><div><b style="color:#e8eaed">Developer:</b> <a href="#">KDE</a></div><div><b style="color:#e8eaed">Initial release:</b> 1998</div><div style="margin-top:8px"><div role="button">Wikipedia</div></div></div></div>
      </div>
    </Pair>
    <Pair name="#botstuff related searches + pager + inline-bordered rows" span="full">
      <button class="ico" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button> <button aria-label="More options"><i>⋮</i></button>
      <div id="botstuff"><h2 class="gsh-title">Related searches</h2><div class="related"><div role="button">🔍 sage ink kde download</div><div role="button">🔍 sage ink vscode theme</div><div role="button">🔍 indigo glass plasma</div><div role="button">🔍 neobrutalism kde</div></div>
        <div style="border-top:1px solid #3c4043;margin-top:12px;padding-top:8px">Row with an inline border-top</div><div style="border-bottom:1px solid #3c4043;padding-bottom:8px">Row with an inline border-bottom</div><hr />
        <div class="pager"><a href="#">‹</a><span class="cur">1</span><a href="#">2</a><a href="#">3</a><a href="#">4</a><a href="#">5</a><a href="#">Next ›</a></div></div>
    </Pair>
    <Pair name="g-menu[role=menu] + [role=dialog] + [role=tooltip] + [role=listbox] (About this result, feedback, autocomplete)" wrap={false}>
      <g-menu role="menu"><g-menu-item role="menuitem">About this result</g-menu-item><g-menu-item role="menuitem">Share</g-menu-item><g-menu-item role="menuitem">Cached</g-menu-item></g-menu>
      <div role="dialog" class="g-dialog"><h2>Send feedback</h2><p>What went wrong with this result?</p><div class="acts"><div role="button" class="g-btn">Cancel</div><div role="button" class="g-btn cur">Send</div></div></div>
      <div role="tooltip" class="g-tip">Search by image</div>
      <div role="listbox" class="g-list"><div role="option">sage ink kde theme</div><div role="option" aria-selected="true">sage ink kde <b>plasma</b></div><div role="option">sage ink konsole</div></div>
    </Pair>
    <Pair name="#foot #footcnt" span="full">
      <div id="foot"><div id="footcnt"><span>Philippines · Makati — from your device</span><a href="#">Help</a><a href="#">Send feedback</a><a href="#">Privacy</a><a href="#">Terms</a></div></div>
    </Pair>
  </Section>
</SitePage>
