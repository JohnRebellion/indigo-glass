<script lang="ts">
  /* Wikipedia: Vector 2022 chrome, Codex controls and the article stylesheet
   * (infobox, navbox, wikitable, comparison-table pastels, CS1 citations). */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="chrome" title="Vector 2022 chrome" lead="Header, search, page toolbar, main menu, TOC, dropdowns — Vector's night mode hardcodes these outside the Codex tokens" min="520px">
    <Pair name="vector-header + vector-search-box-input + cdx-search-input" span="full">
      <div class="mw-page-container">
        <header class="vector-header-container"><div class="vector-header">
          <button class="cdx-button cdx-button--weight-quiet cdx-button--icon-only" aria-label="Main menu"><span class="cdx-button__icon"></span></button>
          <a class="mw-logo" href="#"><span class="mw-logo-icon"></span>Wikipedia</a>
          <div class="cdx-search-input cdx-search-input--has-end-button"><div class="cdx-search-input__input-wrapper"><div class="cdx-text-input"><input class="cdx-text-input__input vector-search-box-input" placeholder="Search Wikipedia" /></div><button class="cdx-button cdx-search-input__end-button">Search</button></div></div>
          <a href="#">Donate</a> <a href="#">Create account</a> <a href="#">Log in</a>
          <button class="cdx-button cdx-button--weight-quiet cdx-button--icon-only" aria-label="Alerts"><span class="cdx-button__icon"></span></button>
        </div></header>
        <div class="vector-sticky-header"><span>Comparison of web browsers</span><span class="hlist" style="margin-left:auto"><ul><li><a href="#">Read</a></li><li><a href="#">Edit</a></li></ul></span></div>
      </div>
    </Pair>
    <Pair name="vector-page-toolbar + vector-menu-tabs">
      <div class="vector-page-toolbar" style="width:100%"><nav class="mw-portlet"><ul class="hlist"><li><a class="vector-tab-noicon selected" href="#">Article</a></li><li><a class="vector-tab-noicon" href="#">Talk</a></li></ul></nav>
        <nav class="vector-menu-tabs"><a class="vector-tab-noicon selected" href="#">Read</a><a class="vector-tab-noicon" href="#">Edit</a><a class="vector-tab-noicon" href="#">View history</a><a class="vector-tab-noicon" href="#">Tools ▾</a></nav></div>
    </Pair>
    <Pair name="vector-main-menu / vector-toc / vector-pinnable-header-toggle-button">
      <nav class="vector-main-menu"><h3>Navigation <button class="vector-pinnable-header-toggle-button">hide</button></h3><ul><li><a href="#">Main page</a></li><li><a href="#">Contents</a></li><li><a href="#">Current events</a></li><li><a href="#">Random article</a></li><li><a class="new" href="#">Missing page</a></li></ul></nav>
      <nav class="vector-toc"><h2>Contents <button class="vector-pinnable-header-toggle-button">move to sidebar</button></h2><ul><li class="vector-toc-list-item-active"><a href="#">(Top)</a></li><li><a href="#">General information</a></li><li><a href="#">Operating system support</a></li><li><a href="#">References</a></li></ul></nav>
    </Pair>
    <Pair name="vector-dropdown-content / vector-menu-content / cdx-menu / vector-settings" note="Floating overlays: border, drop shadow. Stylus gives them the 2px edge and the hard 4px offset.">
      <div class="vector-dropdown-content"><ul class="vector-menu-content"><li><a href="#">What links here</a></li><li><a href="#">Related changes</a></li><li><a href="#">Permanent link</a></li><li><a href="#">Cite this page</a></li></ul></div>
      <ul class="cdx-menu"><li class="cdx-menu-item cdx-menu-item--highlighted">Comparison of web browsers</li><li class="cdx-menu-item">Comparison of web servers</li><li class="cdx-menu-item">Comparison of webmail</li></ul>
      <div class="vector-settings"><fieldset style="border:0;padding:0;margin:0"><legend>Text</legend><label class="cdx-radio"><span class="cdx-radio__icon"></span>Small</label><br/><label class="cdx-radio"><span class="cdx-radio__icon cdx-radio__icon--checked"></span>Standard</label></fieldset><fieldset style="border:0;padding:0;margin:8px 0 0"><legend>Colour</legend><label class="cdx-radio"><span class="cdx-radio__icon"></span>Light</label><br/><label class="cdx-radio"><span class="cdx-radio__icon cdx-radio__icon--checked"></span>Dark</label></fieldset></div>
    </Pair>
  </Section>

  <Section id="codex" title="Codex controls" lead="cdx-button weights and actions, text inputs, checkbox/radio/toggle, select, message, chip, tabs, progress, dialog" min="420px">
    <Pair name="cdx-button (normal / primary / quiet / icon-only / disabled)">
      <button class="cdx-button cdx-button--icon-only" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <button class="cdx-button">Normal</button>
      <button class="cdx-button cdx-button--action-progressive">Progressive</button>
      <button class="cdx-button cdx-button--action-destructive">Destructive</button>
      <button class="cdx-button cdx-button--weight-primary cdx-button--action-progressive">Publish changes</button>
      <button class="cdx-button cdx-button--weight-primary cdx-button--action-destructive">Delete</button>
      <button class="cdx-button cdx-button--weight-quiet">Quiet</button>
      <button class="cdx-button cdx-button--weight-quiet cdx-button--icon-only"><span class="cdx-button__icon"></span></button>
      <button class="cdx-button" disabled>Disabled</button>
    </Pair>
    <Pair name="cdx-text-input / cdx-select / oo-ui button">
      <div class="cdx-text-input"><input class="cdx-text-input__input" placeholder="Edit summary" /></div>
      <select class="cdx-select"><option>Sort by relevance</option></select>
      <span class="oo-ui-buttonElement oo-ui-flaggedElement-progressive"><a class="oo-ui-buttonElement-button" role="button" href="#">Show preview</a></span>
    </Pair>
    <Pair name="cdx-checkbox / cdx-radio / cdx-toggle-switch">
      <label class="cdx-checkbox"><span class="cdx-checkbox__icon cdx-checkbox__icon--checked"></span>Watch this page</label>
      <label class="cdx-checkbox"><span class="cdx-checkbox__icon"></span>Minor edit</label>
      <label class="cdx-radio"><span class="cdx-radio__icon cdx-radio__icon--checked"></span>Automatic</label>
      <label class="cdx-toggle-switch cdx-toggle-switch--checked"><span class="cdx-toggle-switch__switch"></span>Limit content width</label>
    </Pair>
    <Pair name="cdx-message variants">
      <div class="cdx-message cdx-message--notice">ℹ You are not logged in. Your IP address will be publicly visible.</div>
      <div class="cdx-message cdx-message--warning">⚠ This page has pending changes awaiting review.</div>
      <div class="cdx-message cdx-message--error">✕ The edit could not be saved.</div>
      <div class="cdx-message cdx-message--success">✓ Your edit was saved.</div>
    </Pair>
    <Pair name="cdx-info-chip / cdx-tabs / cdx-progress-bar / cdx-thumbnail">
      <span class="cdx-info-chip cdx-info-chip--notice">Featured article</span> <span class="cdx-info-chip cdx-info-chip--warning">Semi-protected</span>
      <div class="cdx-tabs__header"><span class="cdx-tabs__list__item cdx-tabs__list__item--selected">Article</span><span class="cdx-tabs__list__item">Talk</span><span class="cdx-tabs__list__item">History</span></div>
      <div class="cdx-progress-bar"><div class="cdx-progress-bar__bar"></div></div>
      <span class="cdx-thumbnail"></span>
    </Pair>
    <Pair name="cdx-dialog / mw-notification">
      <div class="cdx-dialog" role="dialog"><div class="cdx-dialog__header">Leave without saving?</div><div class="cdx-dialog__body">You have unsaved changes to this page.</div><div class="cdx-dialog__footer"><button class="cdx-button">Keep editing</button><button class="cdx-button cdx-button--weight-primary cdx-button--action-destructive">Discard</button></div></div>
      <div class="mw-notification">Page added to your watchlist.</div>
    </Pair>
  </Section>

  <Section id="article" title="Article body" lead="Headings, hatnote, links (blue / visited / redlink), references and CS1 maintenance colours, thumbnails, categories, message boxes" min="520px">
    <Pair name="mw-body + mw-parser-output (headings, links, hatnote, references)" span="full">
      <div class="mw-body"><h1>Comparison of web browsers</h1>
        <div class="mw-parser-output">
          <div class="hatnote">This article is about desktop browsers. For mobile, see <a href="#">Comparison of mobile browsers</a>.</div>
          <p>A <b>web browser</b> is application software for accessing the <a href="#">World Wide Web</a>. <a href="#" class="mw-selflink">Self link</a>, a <a class="new" href="#">page that does not exist</a>, and a <a href="#" style="color:var(--color-visited)">visited page</a>.<sup class="reference"><a href="#">[1]</a></sup></p>
          <h2>Operating system support<span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="#">edit</a><span class="mw-editsection-bracket">]</span></span></h2>
          <p>Firefox and Chromium ship <code>--enable-features</code> flags; see <a href="#">Rendering engine</a>.</p>
          <div class="reflist"><ol><li><cite class="citation">Smith, J. (2024). <a href="#">"Browser market share"</a>. <i>StatCounter</i>.</cite> <span class="cs1-maint">CS1 maint: url-status (<a href="#">link</a>)</span></li><li><cite class="citation">Doe, A. <span class="cs1-code">doi:10.1000/182</span>. <span class="cs1-visible-error error">Check |url= value</span> <span class="cs1-hidden-error">hidden error</span></cite></li></ol></div>
        </div></div>
    </Pair>
    <Pair name="figure / thumb / catlinks / hlist">
      <figure class="mw-halign-right"><span class="mw-file-element"></span><figcaption>Timeline of browser releases</figcaption></figure>
      <div class="thumb"><div class="thumbimage"></div><div class="thumbcaption">Legacy thumb markup</div></div>
      <div class="catlinks"><b>Categories</b>: <ul><li><a href="#">Web browsers</a></li><li><a href="#">Software comparisons</a></li><li><a class="new" href="#">Missing category</a></li></ul></div>
    </Pair>
    <Pair name="ambox / ombox / quotebox / sidebar / mw-collapsible-text">
      <div class="ambox ambox-content">⚠ This article <b>needs additional citations</b> for verification. <a href="#">Learn more</a></div>
      <div class="ombox">ℹ This is a message box.</div>
      <div class="quotebox">"The browser is the operating system." <a class="mw-collapsible-toggle" href="#">[<span class="mw-collapsible-text">hide</span>]</a></div>
      <div class="sidebar"><div class="sidebar-title">Web browsers</div><div class="sidebar-list-title">Engines</div><ul class="hlist"><li><a href="#">Blink</a></li><li><a href="#">Gecko</a></li><li><a href="#">WebKit</a></li></ul></div>
    </Pair>
    <Pair name="pre / code / mw-highlight / mw-search-result">
      <div class="mw-parser-output"><pre>$ python3 tokens/codegen.py
13 files moved</pre><p>Inline <code>tokens/out/css-vars.css</code>.</p></div>
      <div class="mw-search-result"><div class="mw-search-result-heading"><a href="#">Comparison of <span class="searchmatch">web browsers</span></a></div><div class="searchresult">…lists the features of notable <span class="searchmatch">web browsers</span>, including…</div><div class="mw-search-result-data">44 KB (5,102 words) - 12:01, 20 September 2026</div></div>
    </Pair>
  </Section>

  <Section id="tables" title="Tables" lead="Infobox, navbox and wikitable carry their own greys; the comparison-table templates write mint/pink/cream/lavender inline with color:black" min="520px">
    <Pair name="infobox (with inline #C0C0C0 caption, .notheme)">
      <table class="infobox"><caption class="infobox-caption infobox-above">Firefox</caption><tbody>
        <tr><td class="infobox-image" colspan="2"><span class="cdx-thumbnail"></span></td></tr>
        <tr><th class="infobox-header" colspan="2">Details</th></tr>
        <tr><th class="infobox-label" scope="row">Developer</th><td class="infobox-data"><a href="#">Mozilla</a></td></tr>
        <tr><th class="infobox-label" scope="row">Engine</th><td class="infobox-data">Gecko, SpiderMonkey</td></tr>
        <tr><th class="infobox-label notheme" scope="row" style="background:#C0C0C0">Licence</th><td class="infobox-data">MPL 2.0</td></tr>
        <tr><td class="infobox-full-data" colspan="2">Website: <a href="#">mozilla.org/firefox</a></td></tr>
      </tbody></table>
    </Pair>
    <Pair name="navbox (title, group, list, even/odd, abovebelow)">
      <table class="navbox" style="width:100%"><tbody>
        <tr><th class="navbox-title" colspan="2">Web browsers <a class="mw-collapsible-toggle" href="#">[<span class="mw-collapsible-text">hide</span>]</a></th></tr>
        <tr><td class="navbox-abovebelow" colspan="2"><a href="#">Comparison</a> · <a href="#">Timeline</a></td></tr>
        <tr><th class="navbox-group">Blink</th><td class="navbox-list navbox-odd"><div class="hlist"><ul><li><a href="#">Chrome</a></li><li><a href="#">Edge</a></li><li><a href="#">Opera</a></li></ul></div></td></tr>
        <tr><th class="navbox-group">Gecko</th><td class="navbox-list navbox-even"><div class="hlist"><ul><li><a href="#">Firefox</a></li><li><a href="#">SeaMonkey</a></li></ul></div></td></tr>
        <tr><th class="navbox-group">WebKit</th><td class="navbox-list-with-group navbox-odd"><div class="hlist"><ul><li><a href="#">Safari</a></li><li><a href="#">GNOME Web</a></li></ul></div></td></tr>
      </tbody></table>
    </Pair>
    <Pair name="wikitable sortable + table-yes/no/partial/unknown + table-rh" span="full" note="Every pastel cell is labelled, so repainting fill and text together keeps the datum.">
      <table class="wikitable sortable"><caption>Feature support</caption><thead><tr><th>Browser</th><th>Tabs</th><th>Extensions</th><th>PWA</th><th>Sync</th><th>Licence</th><th>Status</th></tr></thead><tbody>
        <tr><th class="table-rh">Firefox</th><td class="table-yes">Yes</td><td class="table-yes2">Yes</td><td class="table-partial">Partial</td><td class="table-included">Included</td><td class="table-free">Free</td><td class="table-active">Active</td></tr>
        <tr><th class="table-rh">Chrome</th><td class="table-yes">Yes</td><td class="table-supported">Supported</td><td class="table-yes">Yes</td><td class="table-optional">Optional</td><td class="table-proprietary">Proprietary</td><td class="table-beta">Beta</td></tr>
        <tr><th class="rh heading">Netscape</th><td class="table-no">No</td><td class="table-no2">No</td><td class="table-dropped">Dropped</td><td class="table-terminated">Terminated</td><td class="table-nonfree">Non-free</td><td class="table-discontinued">Discontinued</td></tr>
        <tr><th class="table-rh">Servo</th><td class="table-maybe">Maybe</td><td class="table-depends">Depends</td><td class="table-sometimes">Sometimes</td><td class="table-experimental">Experimental</td><td class="table-planned">Planned</td><td class="table-unknown">Unknown</td></tr>
        <tr><th class="table-rh">Other</th><td class="table-Unknown">?</td><td class="table-na">N/A</td><td class="table-any">Any</td><td class="table-some">Some</td><td>—</td><td>—</td></tr>
      </tbody></table>
    </Pair>
  </Section>

  <Section id="footer" title="Footer" lead="The two attribution plates keep their vendor plate on purpose (the file's leave-the-brand-alone case)" min="420px">
    <Pair name="#footer-icons cdx-button--fake-button / mw-footer">
      <div id="footer-icons"><a class="cdx-button cdx-button--fake-button" href="#"><span data-art class="wm-mark"></span></a><a class="cdx-button cdx-button--fake-button" href="#"><span data-art class="mw-mark"></span></a></div>
      <div class="mw-footer"><ul><li><a href="#">Privacy policy</a></li><li><a href="#">About Wikipedia</a></li><li><a href="#">Disclaimers</a></li><li><a href="#">Contact Wikipedia</a></li><li><a href="#">Code of Conduct</a></li></ul></div>
    </Pair>
  </Section>
</SitePage>
