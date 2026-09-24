<script lang="ts">
  /* YouTube: masthead, guide, chips, lockups, buttons, dialogs, watch page —
   * the ytd, yt and tp-yt custom elements the file names, under --yt-spec-*. */
  import './stock.css';
  import SitePage from '../SitePage.svelte';
  import Section from '$lib/nb/Section.svelte';
  import Pair from '../Pair.svelte';
  import type { Site } from '../registry';
  let { site }: { site: Site } = $props();
</script>

<SitePage {site}>
  <Section id="masthead" title="Masthead" lead="#masthead-container, #background, search form, voice button, avatar, skip link, #frosted-glass" min="520px">
    <Pair name="ytd-masthead + #search-form + .ytSearchboxComponentInputBox + #voice-search-button" span="full" wrap={false}>
      <ytd-app><div id="masthead-container" class="ytd-app"><ytd-masthead><div id="background" class="ytd-masthead"></div>
        <a id="skip-navigation" class="ytd-masthead" href="#">Skip navigation</a>
        <span id="logo">YouTube</span>
        <form id="search-form"><ytd-searchbox id="container" class="ytd-searchbox"><div class="ytSearchboxComponentInputBox"><input placeholder="Search" /></div></ytd-searchbox></form>
        <button class="ytSearchboxComponentSearchButton" aria-label="Search"><i>🔍</i></button>
        <div id="voice-search-button" class="ytd-masthead"><button aria-label="Search with your voice"><i>🎤</i></button></div>
        <yt-button-shape><button>+ Create</button></yt-button-shape>
        <ytd-notification-topbar-button-renderer><span class="guide-icon"></span><span class="yt-spec-icon-badge-shape__badge">9+</span></ytd-notification-topbar-button-renderer>
        <ytd-topbar-menu-button-renderer><img alt="" /></ytd-topbar-menu-button-renderer>
      </ytd-masthead></div>
      <div id="frosted-glass" class="ytd-app" style="height:8px;width:100%"></div>
      <div id="page-manager" class="ytd-app"><ytd-feed-filter-chip-bar-renderer><yt-chip-cloud-chip-renderer><span class="ytChipShapeChip ytChipShapeActive">All</span></yt-chip-cloud-chip-renderer><yt-chip-cloud-chip-renderer><span class="ytChipShapeChip ytChipShapeInactive">Music</span></yt-chip-cloud-chip-renderer><yt-chip-cloud-chip-renderer><span class="ytChipShapeChip ytChipShapeInactive">Live</span></yt-chip-cloud-chip-renderer><yt-chip-cloud-chip-renderer><span class="ytChipShapeChip ytChipShapeInactive">KDE Plasma</span></yt-chip-cloud-chip-renderer><ytd-button-renderer class="ytd-feed-filter-chip-bar-renderer"><button><i>›</i></button></ytd-button-renderer></ytd-feed-filter-chip-bar-renderer></div>
      </ytd-app>
    </Pair>
    <Pair name="ytd-guide-entry-renderer[active] / ytd-mini-guide-entry-renderer[active]" note="The selected nav row was a 10% fill; Tier C on-select becomes an inset stroke.">
      <tp-yt-app-drawer><div id="contentContainer"><ytd-guide-renderer>
        <ytd-guide-entry-renderer active><a id="endpoint" href="#"><span class="guide-icon"></span>Home</a></ytd-guide-entry-renderer>
        <ytd-guide-entry-renderer><a id="endpoint" href="#"><span class="guide-icon"></span>Shorts</a></ytd-guide-entry-renderer>
        <ytd-guide-entry-renderer><a id="endpoint" href="#"><span class="guide-icon"></span>Subscriptions</a></ytd-guide-entry-renderer>
        <ytd-guide-entry-renderer><a id="endpoint" href="#"><span class="guide-icon"></span><span class="selected-nav">You</span></a></ytd-guide-entry-renderer>
      </ytd-guide-renderer></div></tp-yt-app-drawer>
      <ytd-mini-guide-renderer>
        <ytd-mini-guide-entry-renderer active><span class="guide-icon"></span>Home</ytd-mini-guide-entry-renderer>
        <ytd-mini-guide-entry-renderer><span class="guide-icon"></span>Shorts</ytd-mini-guide-entry-renderer>
        <ytd-mini-guide-entry-renderer><span class="guide-icon"></span>Subscriptions</ytd-mini-guide-entry-renderer>
      </ytd-mini-guide-renderer>
    </Pair>
  </Section>

  <Section id="lockups" title="Thumbnails and lockups" lead="Rich grid item, list item, playlist, shorts, collection stack, skeleton — every rounded corner the file zeroes" min="420px">
    <Pair name="ytd-rich-item-renderer + ytd-thumbnail + badge-shape + resume progress">
      <ytd-rich-item-renderer><ytd-thumbnail><a id="thumbnail" href="#"><yt-img-shadow><img alt="" /></yt-img-shadow><badge-shape class="ytBadgeShapeHost ytBadgeShapeThumbnailDefault">12:34</badge-shape><ytd-thumbnail-overlay-resume-playback-renderer><div id="progress" class="ytd-thumbnail-overlay-resume-playback-renderer"></div></ytd-thumbnail-overlay-resume-playback-renderer></a></ytd-thumbnail>
        <div class="rich-video-meta"><yt-img-shadow id="avatar"><img alt="" /></yt-img-shadow><div><h3>Sage Ink on KDE Plasma 6 — full walkthrough</h3><div class="meta">John Rebellion <span class="verified"></span><br/>12K views · 2 days ago</div></div></div><ytd-video-preview><div id="media-container"></div></ytd-video-preview></ytd-rich-item-renderer>
    </Pair>
    <Pair name="ytd-video-renderer (list) + yt-thumbnail-view-model + ytd-playlist-thumbnail">
      <ytd-video-renderer><ytd-thumbnail><yt-thumbnail-view-model><div class="ytThumbnailViewModelHost"><img class="ytThumbnailViewModelImage" alt="" /></div><badge-shape class="ytBadgeShapeHost">LIVE</badge-shape></yt-thumbnail-view-model></ytd-thumbnail><div class="text-shell"><div><h3>Zero-blur KWin: why translucency was removed</h3><div class="meta">3.1K watching · <span class="ytSpecAvatarShapeLiveBadge">LIVE</span></div></div></div></ytd-video-renderer>
      <ytd-playlist-thumbnail><span class="count">▤ 24</span></ytd-playlist-thumbnail>
    </Pair>
    <Pair name="shortsLockupViewModel / ytCollectionsStackCollectionStack / skeleton-bg-color">
      <div><div class="shortsLockupViewModelHostThumbnailParentContainer shortsLockupViewModelHostThumbnailParentContainerRounded"></div><div class="shortsLockupViewModelHostOutsideMetadata shortsLockupViewModelHostMetadataRounded">Ink shadow in 30s</div></div>
      <div class="ytCollectionsStackCollectionStackHost"></div>
      <div style="width:200px;display:flex;flex-direction:column;gap:8px"><div class="skeleton-bg-color" style="height:112px"></div><div class="skeleton-bg-color"></div><div class="skeleton-bg-color" style="width:60%"></div></div>
    </Pair>
  </Section>

  <Section id="buttons" title="Buttons and feedback shapes" lead="ytd-button-renderer, yt-button-shape variants, tonal, subscribe, like/dislike; yt-interaction / touch-feedback fills" min="420px">
    <Pair name="yt-button-shape variants / ytSpecButtonShapeNextTonal">
      <button class="yt-spec-button-shape-next yt-spec-button-shape-next--icon-button" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button>
      <yt-button-shape><button>Default</button></yt-button-shape>
      <yt-button-shape><button class="filled yt-spec-button-shape-next yt-spec-button-shape-next--filled">Filled</button></yt-button-shape>
      <yt-button-shape><button class="brand">Join</button></yt-button-shape>
      <yt-button-shape><button class="cta yt-spec-button-shape-next yt-spec-button-shape-next--tonal">Sign in</button></yt-button-shape>
      <yt-button-shape><button class="text yt-spec-button-shape-next yt-spec-button-shape-next--text">Show more</button></yt-button-shape>
      <button class="ytSpecButtonShapeNextTonal yt-spec-button-shape-next yt-spec-button-shape-next--tonal">Tonal</button>
      <ytd-button-renderer><button>Share</button></ytd-button-renderer>
    </Pair>
    <Pair name="yt-interaction / yt-touch-feedback-shape (fill, stroke, hover)" note="The pressed/hover feedback layers are white at 10% — the file paints the fill in the brand accent.">
      <yt-button-shape><button style="position:relative">Pressed<yt-interaction><div class="fill style-scope"></div><div class="stroke style-scope"></div></yt-interaction></button></yt-button-shape>
      <yt-button-shape><button style="position:relative">Hover<yt-touch-feedback-shape><div class="ytSpecTouchFeedbackShapeHoverEffect"></div><div class="ytSpecTouchFeedbackShapeFill"></div><div class="ytSpecTouchFeedbackShapeStroke"></div></yt-touch-feedback-shape></button></yt-button-shape>
      <ytd-subscribe-button-renderer><button>Subscribe</button></ytd-subscribe-button-renderer>
      <ytd-segmented-like-dislike-button-renderer><span>👍 1.2K</span><span>👎</span></ytd-segmented-like-dislike-button-renderer>
    </Pair>
    <Pair name="text roles / suggested action / inverted / raised">
      <span>Primary</span> <span class="secondary-text">Secondary</span> <span class="disabled-text">Disabled</span> <span class="error-text">Error indicator</span> <a href="#">Text link</a>
      <span data-art class="suggested">Suggested action</span> <span data-art class="inverted">Inverted</span>
      <div data-art class="raised">raised-background</div><div data-art class="general-c">general-background-c</div>
    </Pair>
  </Section>

  <Section id="overlays" title="Overlays" lead="tp-yt-paper-dialog, ytd-menu-popup-renderer, feed nudge, snackbar" min="420px">
    <Pair name="tp-yt-paper-dialog / ytd-menu-popup-renderer">
      <tp-yt-paper-dialog><h2>Sign in to like</h2><p>Use YouTube with your Google account to like videos and subscribe.</p><div class="actions"><yt-button-shape><button class="text yt-spec-button-shape-next yt-spec-button-shape-next--text">Cancel</button></yt-button-shape><yt-button-shape><button class="cta yt-spec-button-shape-next yt-spec-button-shape-next--tonal">Sign in</button></yt-button-shape></div></tp-yt-paper-dialog>
      <ytd-menu-popup-renderer><div class="item"><span class="guide-icon"></span>Save to Watch later</div><div class="item"><span class="guide-icon"></span>Save to playlist</div><div class="item"><span class="guide-icon"></span>Share</div><div class="item"><span class="guide-icon"></span>Not interested</div></ytd-menu-popup-renderer>
    </Pair>
    <Pair name="ytd-feed-nudge-renderer / tp-yt-paper-toast">
      <ytd-feed-nudge-renderer><div id="dismissible" class="ytd-feed-nudge-renderer"><div id="content-wrapper" class="ytd-feed-nudge-renderer"><span class="guide-icon"></span><div><b>Try searching to get started</b><div class="secondary-text">Start watching videos to help us build a feed you'll love.</div></div></div></div></ytd-feed-nudge-renderer>
      <tp-yt-paper-toast>Saved to Watch later <a href="#">UNDO</a></tp-yt-paper-toast>
    </Pair>
    <Pair name="ytd-popup-container › tp-yt-iron-dropdown tp-yt-paper-listbox[role=menu] + tp-yt-paper-dialog[role=dialog] + tp-yt-paper-tooltip[role=tooltip]" wrap={false}>
      <ytd-popup-container>
        <tp-yt-iron-dropdown><tp-yt-paper-listbox role="menu"><ytd-menu-service-item-renderer role="menuitem">Save to playlist</ytd-menu-service-item-renderer><ytd-menu-service-item-renderer role="menuitem">Share</ytd-menu-service-item-renderer><ytd-menu-service-item-renderer role="menuitem">Not interested</ytd-menu-service-item-renderer></tp-yt-paper-listbox></tp-yt-iron-dropdown>
        <tp-yt-paper-dialog role="dialog"><h2>Delete this video?</h2><p>This can't be undone.</p><div class="acts"><button class="yt-spec-button-shape-next yt-spec-button-shape-next--text">Cancel</button><button class="yt-spec-button-shape-next yt-spec-button-shape-next--filled">Delete</button></div></tp-yt-paper-dialog>
        <tp-yt-paper-tooltip role="tooltip">Settings</tp-yt-paper-tooltip>
      </ytd-popup-container>
    </Pair>
  </Section>

  <Section id="watch" title="Watch page" lead="Player progress swatch, metadata, description box, comment thread" min="520px">
    <Pair name="ytp-progress-bar + ytp-play-progress / ytp-swatch-background-color" span="full">
      <div data-scrim class="ytp-chrome-bottom"><div class="ytp-progress-bar"><div class="ytp-load-progress"></div><div class="ytp-play-progress ytp-swatch-background-color"></div></div><div style="margin-top:8px;display:flex;gap:12px;align-items:center"><span>▶</span><span>⏭</span><span>🔊</span><span class="secondary-text">4:12 / 12:34</span><span class="ytp-swatch-background-color dot"></span></div></div>
    </Pair>
    <Pair name="ytd-watch-metadata + #description + ytd-comment-thread-renderer" span="full">
      <ytd-watch-metadata><h1>Sage Ink: opaque flat ink for KDE, GTK, browsers and GRUB</h1>
        <div style="display:flex;gap:12px;align-items:center"><yt-img-shadow id="avatar"><img alt="" /></yt-img-shadow><div><b>John Rebellion</b> <span class="verified"></span><div class="secondary-text">1.2K subscribers</div></div><ytd-subscribe-button-renderer><button>Subscribe</button></ytd-subscribe-button-renderer><span style="flex:1"></span><ytd-segmented-like-dislike-button-renderer><span>👍 321</span><span>👎</span></ytd-segmented-like-dislike-button-renderer><yt-button-shape><button>Share</button></yt-button-shape></div>
        <div id="description" class="ytd-watch-metadata description" style="margin-top:12px"><b>12K views · 2 days ago</b> <a href="#">#kde</a> <a href="#">#designsystem</a><br/>Tokens in OKLCH, generated into every layer. Repo: <a href="#">github.com/JohnRebellion/indigo-glass</a></div></ytd-watch-metadata>
      <ytd-comment-thread-renderer><yt-img-shadow id="avatar"><img alt="" /></yt-img-shadow><div><div class="author">@plasmafan <small>2 days ago</small></div><div>Finally a theme that doesn't blur everything. The hard shadow reads great on OLED.</div><div class="secondary-text" style="margin-top:4px">👍 42 · Reply</div></div></ytd-comment-thread-renderer>
    </Pair>
  </Section>
</SitePage>
