# Appendix A — google.user.css

```css
/* ==UserStyle==
@name           Sage Ink — Google Search
@namespace      github.com/JohnRebellion/indigo-glass
@version        0.4.0
@description    Google Search on Sage Ink structure with a near-neutral hue of its own. One flat ink canvas, ink-sharp corners, the AI-Overview streaming highlight replaced by an underline, and the results column widened and centred through Google's own grid. Selectors verified against a live render (scripts/style-check).
@author         John Rebellion
@homepageURL    https://github.com/JohnRebellion/indigo-glass
@updateURL      https://raw.githubusercontent.com/JohnRebellion/indigo-glass/main/browser/stylus/sites/google.user.css
@license        MIT
@preprocessor   default
==/UserStyle== */

/* Covers google.com plus ccTLDs (google.com.ph, google.co.uk, …) and the
 * encrypted.google.com alias. */
@-moz-document regexp("https?://(www|encrypted)\\.google\\.[a-z]{2,3}(\\.[a-z]{2})?/.*") {

  /* ─── Selector notes ───────────────────────────────────────────────────
   * Google ships no theme custom properties, so this file uses the long-lived
   * structural IDs (#cnt, #rcnt, #center_col, #search, #rso, #botstuff,
   * #appbar, #tsf, #rhs, #foot). Two class hashes are unavoidable and are
   * marked VOLATILE where used: .RNNXgb (the search field) and .GyAeWb (the
   * content wrapper). Both were read off a live SERP, not guessed.
   *
   * HUE: Google's brand is four colours at once, so there is no single brand
   * hue to honour. This file uses a near-neutral cool cast (hue 262deg at
   * C 0.05) rather than sage. Not a pure grey: links have to read as links,
   * and a zero-chroma accent is the same colour as body text. */

  /* ─── One surface, no patches ──────────────────────────────────────── */
  html,
  body,
  #main,
  #cnt,
  #rcnt,
  #center_col,
  #search,
  #rso,
  #botstuff,
  #appbar,
  #searchform,
  #tsf,
  #rhs,
  #foot,
  #footcnt {
    background-color: #07080A !important;
  }

  /* Kill inherited container fills in the result column. Media is untouched,
   * so thumbnails, favicons and Knowledge-panel imagery keep their pixels. */
  #center_col div,
  #center_col span,
  #center_col g-section-with-header,
  #botstuff div,
  #rhs div {
    background-color: transparent !important;
    background-image: none !important;
  }

  /* ─── Search field ─────────────────────────────────────────────────────
   * VOLATILE: .RNNXgb. v0.1.0 targeted `#searchform form`, which does not
   * exist — the field is div.RNNXgb inside form#tsf, painted rgb(77,81,86)
   * with a 26px pill radius, and the old rule never landed. */
  form#tsf .RNNXgb,
  div.RNNXgb {
    background-color: #0D0D10 !important;
    border: 1px solid #1C1C1E !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  form#tsf .RNNXgb:focus-within,
  div.RNNXgb:focus-within {
    border-color: #8293B2 !important;
  }

  /* ─── Width and centring, through Google's own grid ────────────────────
   * #rcnt is a 22-track CSS grid: 122.5px, twenty 36px tracks, 122.5px. The
   * result column spans eighteen of the middle tracks, which is where the
   * 652px measure comes from — it is not a max-width, which is why both
   * earlier attempts to cap #center_col starved the layout instead of
   * reflowing it (the Images masonry collapsed, then result titles wrapped
   * one word per line).
   *
   * Widening the TRACKS is the supported move: 18 x 46px = 828px of measure,
   * with 1fr gutters either side doing the centring. minmax(0, …) keeps every
   * track shrinkable, so a narrow window degrades instead of overflowing. */
  /* ─── Links — near-neutral, not Google blue ────────────────────────── */
  #center_col a,
  #botstuff a,
  #rhs a,
  #foot a,
  #center_col a h3 {
    color: #B3C5E5 !important;
  }
  #center_col a:visited,
  #center_col a:visited h3,
  #botstuff a:visited,
  #rhs a:visited {
    color: #8293B2 !important;
  }
  #center_col a:hover,
  #botstuff a:hover,
  #rhs a:hover,
  #foot a:hover {
    color: #9AACCB !important;
    text-decoration-color: #9AACCB !important;
  }

  #center_col,
  #center_col span {
    color: #F8F8F8 !important;
  }
  #center_col cite,
  #center_col cite * {
    color: #6B7280 !important;
  }

  /* ─── AI Overview highlight: underline, not flood ──────────────────────
   * The blue block that appears mid-sentence in the AI Overview — the one
   * that looks like a rendering fault because it cuts off at a hyphen — is a
   * <mark class="MAeH"> whose background animates as the summary streams in.
   * v0.1.0 scoped this rule to `#center_col mark`; the mark sits outside
   * #center_col, so the rule never applied. Unscoped now. */
  mark,
  #center_col em,
  #center_col b {
    background-color: transparent !important;
    color: inherit !important;
    text-decoration: underline !important;
    text-decoration-color: #8293B2 !important;
    text-underline-offset: 2px;
  }

  /* ─── Ink corners ──────────────────────────────────────────────────── */
  #center_col div,
  #center_col img,
  #center_col g-img,
  #botstuff div,
  #rhs div,
  [role="button"],
  [role="listitem"],
  button,
  input,
  g-fab {
    border-radius: 0 !important;
  }

  /* ─── Dividers ─────────────────────────────────────────────────────── */
  #center_col hr,
  #botstuff hr,
  #center_col [style*="border-top"],
  #center_col [style*="border-bottom"] {
    border-color: #1C1C1E !important;
  }

  /* ─── Typography ───────────────────────────────────────────────────── */
  #searchform input,
  form#tsf textarea,
  #center_col h1, #center_col h2, #center_col h3 {
    font-family: "IndigoLoopTail", "IndigoCarlito", "Carlito", system-ui, -apple-system, sans-serif !important;
  }

  /* OKLCH upgrade. Surfaces/text from tokens/indigo-glass.tokens.toml
   * [variants.sage]; accents are hue 262deg at C 0.05 on the ink ladder. */
  @supports (color: oklch(0% 0 0)) {
    html, body, #main, #cnt, #rcnt, #center_col, #search, #rso,
    #botstuff, #appbar, #searchform, #tsf, #rhs, #foot, #footcnt {
      background-color: oklch(0.1340 0.0051 262.32) !important;
    }
    form#tsf .RNNXgb,
    div.RNNXgb {
      background-color: oklch(0.1605 0.0063 285.67) !important;
    }
    #center_col a, #botstuff a, #rhs a, #foot a, #center_col a h3 {
      color: oklch(0.8200 0.0500 262.00) !important;
    }
    #center_col a:visited, #center_col a:visited h3,
    #botstuff a:visited, #rhs a:visited {
      color: oklch(0.6600 0.0500 262.00) !important;
    }
    #center_col a:hover, #botstuff a:hover, #rhs a:hover, #foot a:hover {
      color: oklch(0.7400 0.0500 262.00) !important;
    }
    #center_col cite, #center_col cite * {
      color: oklch(0.5510 0.0234 264.36) !important;
    }
  }
}

/* ─── Width and centring: TEXT results only ───────────────────────────────
 * Google's own grid: track 1 and 22 are 122.5px gutters, tracks 2-21 are
 * 36px, column-gap 20px — 1385px total on a 1400px viewport. #center_col is
 * placed at `2 / span 12`, i.e. 12 tracks + 11 gaps = 652px, hard against the
 * left gutter. That is where the cramped measure comes from; it is not a
 * max-width, which is why capping #center_col starved the layout in v0.1.0
 * instead of reflowing it.
 *
 * Re-placing the grid item is the supported move: 15 tracks = 820px, starting
 * at track 4 to sit near the middle of the viewport.
 *
 * Scoped by a NEGATIVE LOOKAHEAD, not by a reset block. The Images, Videos
 * and Shopping tabs lay their results out as a masonry grid in the same
 * #center_col and size it from the span, so the widening squeezed Images into
 * a ~510px column (v0.3.0) — and `grid-column: auto` as a reset is worse
 * still, landing the grid item in the first 122.5px gutter track. Since the
 * tab lives in the query string and no selector can read it, the rule simply
 * does not match those URLs.
 *
 * Also guarded by :not(:has(#rhs)) — when a Knowledge panel is present it
 * owns the right-hand tracks, and a wider centre column would sit under it.
 *
 * NOTE for scripts/style-check: its unwrapper concatenates every
 * @-moz-document block, so under the harness this applies to image tabs too.
 * Verify this rule against fixtures/serp-grid.html instead. */
@-moz-document regexp("https?://(www|encrypted)\\.google\\.[a-z]{2,3}(\\.[a-z]{2})?/search\\?(?!.*(udm=2|udm=7|udm=28|tbm=isch|tbm=vid|tbm=shop)).*") {
  #rcnt:not(:has(#rhs)) #center_col {
    grid-column: 4 / span 15 !important;
  }
}
```
