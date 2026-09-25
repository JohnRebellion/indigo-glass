#!/usr/bin/env python3
"""Sage Ink structure blocks for browser/stylus/sites/*.user.css — v3.

Each site file ends its @-moz-document block with a "Sage Ink structure"
section. This script owns that section: it replaces everything from the
marker header to the block's closing brace, bumps @version, and applies a
handful of surgical edits to rules that live OUTSIDE the section (listed in
OUTSIDE below). Idempotent — run it as often as you like.

    python3 scripts/style-check/structure-blocks.py

Elevation (docs/ELEVATION.md) is what changed in v3. Every text button used
to carry the 4px offset; now only a primary, accent-filled button does:

  level 0  resting      secondary buttons, cards, rows, inputs, tags, tabs,
                        chips, segmented controls, drawers  -> no shadow,
                        2px border_strong where a boundary is needed
  level 1  primary      the accent-filled action button       -> ink 4px
  level 2  transient    menu, popover, tooltip, toast, flag,
                        command palette, autosuggest         -> ink 4px
  level 3  modal        dialog, alertdialog, sheet            -> ink_lg 7px

simulator/e2e/sites.spec.ts and scripts/style-check/live-contract.mjs judge
the result by computed style: a button whose fill is lighter than relative
luminance 0.179 (the [on_light] threshold in the tokens) must be hard, every
other button must be flat, and no two inked elements may sit closer than the
offset. Keep the three in step.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2] / 'browser' / 'stylus' / 'sites'
ICON = ':not(:has(> :only-child:is(svg, i)))'
MUTED_OLD, MUTED_NEW = '#6B7280', '#7F8695'   # text_muted lifted 2026-09-24 (tokens.toml)
MUTED_OLD_OKLCH = 'oklch(0.5510 0.0234 264.36)'  # the same value in the @supports blocks
MUTED_NEW_OKLCH = 'oklch(0.6200 0.0234 264.36)'
MUTED_OLD_RGB, MUTED_NEW_RGB = '107 114 128', '127 134 149'    # copilot's space-separated triples
# negative lifted 0.6124 -> 0.63 on 2026-09-24: 4.43:1 on surface_alt was a miss.
NEG_OLD, NEG_NEW = '#ED254E', '#F42E53'
NEG_OLD_OKLCH, NEG_NEW_OKLCH = 'oklch(0.6124 0.2279 17.60)', 'oklch(0.6300 0.2279 17.60)'

# Per-site accent ladder — must match simulator/src/lib/sites/registry.ts.
HUE = {
    'github':       ('#94C7FF', '#7CADEF', '#6494D5'),
    'wikipedia':    ('#9DC4FF', '#85ABF1', '#6D92D6'),
    'youtube':      ('#FFA99B', '#E89082', '#CD776A'),
    'facebook':     ('#9AC5FF', '#81ACF0', '#6A93D5'),
    'google':       ('#B3C5E5', '#9AACCB', '#8293B2'),
    'claude-ai':    ('#FFAB8F', '#E69277', '#CB795F'),
    'chatgpt':      ('#74DBB9', '#58C1A0', '#3CA887'),
    'notion':       ('#90C8FF', '#77AFEF', '#5F96D4'),
    'linear':       ('#AFBEFF', '#97A5F0', '#7F8CD5'),
    'atlassian':    ('#98C6FF', '#80ACF0', '#6893D5'),
    'microsoft365': ('#8EC9FF', '#76AFEE', '#5D96D3'),
    'copilot':      ('#8EC9FF', '#75AFEE', '#5D96D3'),
    'gemini':       ('#D3B2FE', '#BA99E3', '#A181C9'),
    'aistudio':     ('#9AC5FF', '#82ACF0', '#6A93D5'),
    'shopee':       ('#FFAA96', '#E7907D', '#CC7866'),
}


def low(s):
    """Wrap a base's ancestors in :where() so the rule weighs only its subject.
    `#appContainer button` would otherwise outrank `button.fui-Button.primary`."""
    if ' ' not in s:
        return s
    anc, subj = s.rsplit(' ', 1)
    if anc.endswith('>'):
        return f':where({anc[:-1].strip()}) > {subj}'
    return f':where({anc}) {subj}'


def button_block(site, bases, exempt='', primary=None, primary_label=None, danger=None):
    """Level 0 for `bases` (edge, no lift); level 1 for `primary` (accent fill,
    ink label and edge, 4px offset collapsing on press) and for `danger`
    (same lift and ink label, but the site's own warning or danger fill)."""
    hi, mid, alt = HUE[site]
    # :where() zeroes the exclusions' and ancestors' specificity, so the base
    # rule stays at the bare subject's weight and the primary rule below can
    # outrank it.
    sel = ',\n  '.join(f'{low(s)}:where({ICON}{exempt})' for s in bases)
    act = ',\n  '.join(f'{low(s)}:where({ICON}{exempt}):active' for s in bases)
    out = f"""
  /* Secondary buttons are level 0: a 2px border_strong edge, no offset. The
   * hard shadow is reserved for the one accent-filled primary per view
   * (docs/ELEVATION.md). Icon-only affordances and the chrome named in the
   * exclusions keep their own geometry. */
  {sel} {{
    border: 2px solid #5E5E60 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background-image: none !important;
    transform: none !important;
  }}
  {act} {{
    box-shadow: none !important;
    transform: none !important;
  }}"""
    if primary:
        plist = [p.strip() for p in primary.split(',')]
        psel = ', '.join(plist)
        phov = ', '.join(f'{p}:hover' for p in plist)
        pact = ', '.join(f'{p}:active' for p in plist)
        plabel = primary_label or ', '.join(f'{p} *' for p in plist)
        out += f"""
  /* Primary: level 1. Accent fill, ink edge and label, the 4px accent_alt
   * offset. Hover moves fill only; the press travels into the shadow. */
  {psel} {{
    background-color: {mid} !important;
    background-image: none !important;
    color: #07080A !important;
    border: 2px solid #07080A !important;
    border-radius: 0 !important;
    box-shadow: 4px 4px 0 0 {alt} !important;
    transform: none !important;
  }}
  {plabel} {{
    color: #07080A !important;
  }}
  {phov} {{
    background-color: {hi} !important;
    box-shadow: 4px 4px 0 0 {alt} !important;
    transform: none !important;
  }}
  {pact} {{
    box-shadow: none !important;
    transform: translate(4px, 4px) !important;
  }}"""
    if danger:
        dlist = [d.strip() for d in danger.split(',')]
        dsel = ', '.join(dlist)
        dact = ', '.join(f'{d}:active' for d in dlist)
        dlabel = ', '.join(f'{d} *' for d in dlist)
        out += f"""
  /* Danger and warning: level 1 on the site's own fill. Every such fill sits
   * above the on_light threshold, so the label and edge are ink. */
  {dsel} {{
    background-image: none !important;
    color: #07080A !important;
    border: 2px solid #07080A !important;
    border-radius: 0 !important;
    box-shadow: 4px 4px 0 0 {alt} !important;
    transform: none !important;
  }}
  {dlabel} {{
    color: #07080A !important;
  }}
  {dact} {{
    box-shadow: none !important;
    transform: translate(4px, 4px) !important;
  }}"""
    return out


def overlay_block(site, menus, dialogs, tooltips=''):
    alt = HUE[site][2]
    out = f"""
  /* Floating chrome: level 2 (menus, popovers, toasts) at 4px, level 3
   * (dialogs) at 7px. 2px edge, nothing soft, nothing translucent. */
  {menus} {{
    border: 2px solid #5E5E60 !important;
    border-radius: 0 !important;
    box-shadow: 4px 4px 0 0 {alt} !important;
  }}
  {dialogs} {{
    border: 2px solid #5E5E60 !important;
    border-radius: 0 !important;
    box-shadow: 7px 7px 0 0 {alt} !important;
  }}"""
    if tooltips:
        out += f"""
  {tooltips} {{
    border: 2px solid #5E5E60 !important;
    border-radius: 0 !important;
    box-shadow: 4px 4px 0 0 {alt} !important;
    background-color: #121216 !important;
    color: #F8F8F8 !important;
  }}"""
    return out


def resting_block(cards):
    return f"""
  /* Resting surfaces (level 0): a border or nothing. No lift, no radius. */
  {cards} {{
    box-shadow: none !important;
    border-radius: 0 !important;
  }}"""


def inputs_block(inputs, inner=''):
    out = f"""
  /* Text entry: 2px border_strong on the field, nothing on the inner input. */
  {inputs} {{
    border: 2px solid #5E5E60 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }}"""
    if inner:
        out += f"""
  {inner} {{
    border: 0 !important;
    box-shadow: none !important;
    outline: 0 !important;
  }}"""
    return out


def radius_block(sel):
    return f"""
  /* Radius leftovers the simulator page still measured above 2px. */
  {sel} {{
    border-radius: 0 !important;
  }}"""


def header(ver, id_):
    return f"""
  /* ─── {ver}: Sage Ink structure ────────────────────────────────────────
   * Generated by scripts/style-check/structure-blocks.py and verified against
   * the simulator page /sites/{id_}/, whose contract (simulator/e2e/sites.spec.ts)
   * fails when this file drifts: ink page, hard opaque shadows only, no blur
   * or gradient, radius 0 off circles and pills, the offset on primary buttons
   * only (docs/ELEVATION.md), hard-edged dialogs and menus. */"""


S = {}

S['github'] = ('0.6.0', header('0.6.0', 'github') + """
  /* Only the fills this file owns take an ink label. Primer's outlined
   * Labels, the grey draft State and Counter keep Primer's text; its green,
   * red and purple State pills keep white, which is the better contrast
   * on those fills (measured 2026-09-24). */
  .color-bg-success-emphasis {
    color: #07080A !important;
  }
  /* kbd, CodeMirror, Toast and the rest hardcode 6px. */
  .State, kbd, .cm-editor, .cm-gutters, .Toast, .Toast-icon, .Toast-content, .Popover-message,
  .Overlay, .SelectMenu-modal, .flash, .markdown-alert, .Box-row, .blankslate,
  .form-select, .form-control, .FormControl-input, .tooltipped-box, .Progress {
    border-radius: 0 !important;
  }
  .Toast, .Popover-message, .tooltipped-box {
    border: 2px solid #5E5E60 !important;
    box-shadow: 4px 4px 0 0 #6494D5 !important;
  }
  .Overlay, .SelectMenu-modal {
    border: 2px solid #5E5E60 !important;
    box-shadow: 7px 7px 0 0 #6494D5 !important;
  }
  .Box, .TimelineItem-badge, .flash, .markdown-alert {
    box-shadow: none !important;
  }
  .form-select {
    border-width: 2px !important;
    border-color: #5E5E60 !important;
  }
  /* Primer's inset text-field shadow is a 24% wash; the 2px edge replaces it. */
  .form-control, .FormControl-input, .form-select, #qb-input-query,
  [class*="prc-TextInput-TextInputWrapper"], input[class*="prc-TextInput"] {
    box-shadow: none !important;
  }
  /* Primer rings avatars with a 15% white 1px shadow; on live github.com
   * that is the only alpha shadow left (live-contract, 2026-09-24). */
  .avatar, [class*="prc-Avatar-Avatar"] {
    box-shadow: none !important;
  }
  /* Link-variant buttons are text, not controls: no edge. */
  .btn-link, [class*="prc-Button-ButtonBase"][data-variant="link"] {
    border: 0 !important;
  }""")

S['wikipedia'] = ('0.5.0', header('0.5.0', 'wikipedia') + button_block(
    'wikipedia',
    ['.cdx-button', '.oo-ui-buttonElement-button'],
    exempt=':not(.cdx-button--weight-quiet):not(.cdx-button--icon-only):not(.cdx-button--fake-button)',
    primary='.cdx-button--weight-primary.cdx-button--action-progressive, .cdx-button--weight-primary.cdx-button--action-destructive, .oo-ui-flaggedElement-progressive .oo-ui-buttonElement-button') +
    overlay_block('wikipedia', '.cdx-menu, .vector-dropdown-content, .mw-notification', '.cdx-dialog') +
    inputs_block('.cdx-text-input__input, .cdx-select, .cdx-search-input__input-wrapper, .vector-search-box-input',
                 '.cdx-search-input__input-wrapper .cdx-text-input__input') +
    radius_block('.cdx-message, .cdx-menu-item, .cdx-thumbnail, .cdx-info-chip, .cdx-tabs__header, .infobox, .navbox, .ambox, .ombox, .hatnote, .quotebox, .thumb, .thumbimage, .cdx-progress-bar, .cdx-checkbox__icon, .vector-pinnable-header-toggle-button, .mw-search-result') +
    resting_block('.infobox, .navbox, .thumb, .cdx-message, .ambox, .ombox, .mw-notification, .cdx-tabs__header, .cdx-thumbnail') + """
  /* Infobox and table text: Vector's #202122 on the ink surface. */
  .infobox, .infobox th, .infobox td, .infobox-label, .infobox-data, .infobox-above, .infobox-header,
  .navbox, .navbox th, .navbox td, .wikitable th, .wikitable td, .ambox, .ombox, .hatnote, .quotebox,
  .cdx-message, .catlinks, .mw-footer, .reflist, .citation {
    color: #F8F8F8 !important;
  }
  .infobox-caption, .thumbcaption, .mw-editsection, .hatnote, .catlinks li, .mw-footer li {
    color: #7F8695 !important;
  }
  /* .notheme cells keep an inline light fill by design; give them back
   * Vector's dark text rather than painting light on light. */
  .notheme[style*="background"], .notheme[style*="background"] * {
    color: #202122 !important;
  }
  /* Quiet buttons are text affordances: no edge at all rather than a 1px one. */
  .cdx-button--weight-quiet { border-color: transparent !important; }""")

# 0.5.1 (live, 2026-09-24): youtube.com renamed its button classes to
# camelCase (`ytSpecButtonShapeNextIconButton`, `...Text`, `...Outline`); the
# kebab-case exemptions stopped matching and 25 icon-only kebab menus grew a
# 2px box. `.ytSpecButtonShapeNextHost` joins the bases because the masthead
# Sign in is an <a>, not a <button>.
# 0.5.2 (live, 2026-09-24): the paper-tooltip HOST carries role=tooltip and is
# always in the DOM, so level 2 chrome on `[role=tooltip]` painted 4x4 accent
# dots at every button corner. Chrome moves to its #tooltip child.
S['youtube'] = ('0.5.2', header('0.5.2', 'youtube') + button_block(
    'youtube',
    ['ytd-app button', '.yt-spec-button-shape-next', '.ytSpecButtonShapeNextHost', '.ytSpecButtonShapeNextTonal', '.ytSearchboxComponentSearchButton', 'ytd-app .cta'],
    exempt=':not(.yt-spec-button-shape-next--icon-button):not(.yt-spec-button-shape-next--text):not(.text):not(.ytChipShapeChip)'
           ':not(.ytSpecButtonShapeNextIconButton):not([class*="ytSpecButtonShapeNextIconOnly"]):not(.ytSpecButtonShapeNextText)'
           ':not(.yt-icon-button):not(.ytmMuteButtonButton):not(.ytmClosedCaptioningButtonButton)',
    primary='.yt-spec-button-shape-next--filled, ytd-app .cta.filled, ytd-subscribe-button-renderer button, .cta.yt-spec-button-shape-next--tonal') + """
  /* Join sits beside Subscribe; one inked member per group, so the brand
   * button is level 0 on the raised surface. */
  yt-button-shape button.brand {
    background-color: #121216 !important;
    color: #F8F8F8 !important;
  }""" +
    overlay_block('youtube', 'tp-yt-paper-toast, tp-yt-paper-listbox, ytd-menu-popup-renderer, tp-yt-iron-dropdown, ytd-feed-nudge-renderer, .ytSearchboxComponentSuggestionsContainer, .ytdMiniplayerComponentContent, tp-yt-paper-material',
                  'tp-yt-paper-dialog, ytd-popup-container [role="dialog"]', 'tp-yt-paper-tooltip #tooltip, ytd-app [role="tooltip"]:not(tp-yt-paper-tooltip)') + """
  /* Toast and nudge fills are repainted above; their text follows. */
  tp-yt-paper-toast, ytd-feed-nudge-renderer, tp-yt-paper-toast *, ytd-feed-nudge-renderer * {
    color: #F8F8F8 !important;
  }""" +
    inputs_block('.ytSearchboxComponentInputBox, ytd-searchbox #container', '.ytSearchboxComponentInputBox input') +
    radius_block('.ytSearchboxComponentSearchButton, tp-yt-paper-toast, .guide-icon, a#endpoint, #endpoint, #description, ytd-guide-entry-renderer, ytd-guide-entry-renderer a, ytd-video-preview, ytd-video-preview #media-container, ytd-watch-metadata #description, .skeleton-bg-color, .ytp-chrome-bottom, .ytp-progress-bar, ytd-thumbnail-overlay-resume-playback-renderer, .ytBadgeShapeHost, .ytThumbnailViewModelHost, .shortsLockupViewModelHostThumbnailParentContainerRounded, .shortsLockupViewModelHostMetadataRounded, .ytSpecTouchFeedbackShapeStroke, .ytSpecTouchFeedbackShapeFill, .ytSpecTouchFeedbackShapeHoverEffect, .ytCollectionsStackCollectionStackHost, ytd-feed-nudge-renderer, .ytd-feed-nudge-renderer') +
    resting_block('#search-form, ytd-searchbox, ytd-rich-item-renderer, ytd-video-renderer, ytd-watch-metadata, ytd-comment-thread-renderer, ytd-guide-entry-renderer, .skeleton-bg-color'))

# 0.6.1 (live, 2026-09-24): Facebook's icon-only buttons carry no class we
# can name (atomic hashes), but every one is `div[role=button] > svg` (the
# profile button nests it one level: `> div > svg[role=img]`); 27 of them wore
# the edge. Structural exemptions instead of class ones.
# 0.6.2 (live, 2026-09-24): five more icon trees - avatar `> div > span > img`,
# mask icon `> div > div > i`, svg `> div > div > div > svg`, marketplace
# `> span > svg` and the seller avatar stack `> div > div > img`.
S['facebook'] = ('0.6.2', header('0.6.2', 'facebook') + button_block(
    'facebook',
    ['div[role="button"]', 'button'],
    exempt=':not(.fb-icon-btn):not([class*="fb-nav"]):not([class*="fb-menu-row"]):not([class*="fb-story"]):not([class*="fb-reaction"]):not([class*="fb-avatar"]):not(.fb-btn-floating):not([class*="fb-tile"]):not([class*="fb-chip"]):not(.fb-btn-deemph)'
           ':not(:has(> svg)):not(:has(> i)):not(:has(> img)):not(:has(> div > svg)):not(:has(> div > i:only-child))'
           ':not(:has(> div > span > img)):not(:has(> div > div > i)):not(:has(> div > div > div > svg))'
           ':not(:has(> span > svg)):not(:has(> div > div > img)):not([aria-hidden="true"])',
    primary='div[role="button"].fb-btn-primary') +
    overlay_block('facebook', '[role="menu"], .fb-popover, .fb-popover-card, .fb-toast, .fb-messenger', '[role="dialog"]', '[role="tooltip"], .fb-tooltip') +
    inputs_block('.fb-input, .fb-textarea, .fb-composer-input, input[type="search"], label[role="combobox"]', 'label[role="combobox"] input') +
    radius_block('.fb-card, .fb-card-media, .fb-market-card, .fb-market-img, .fb-comment-bubble, .fb-msg, .fb-msg-bar, .fb-composer, .fb-alert, .fb-warn, .fb-badge, .fb-infochip, .fb-glimmer, .fb-highlight, .fb-tile, .fb-messenger, .fb-messenger-head, .fb-tabs, .fb-section-title') +
    resting_block('.fb-card, .fb-market-card, .fb-composer, .fb-comment-bubble, .fb-msg, .fb-alert'))

# 0.7.1 (live, 2026-09-24): tools-bar toggle chips are `span[role=button]
# [aria-pressed]` outside #rcnt (1px pill); knowledge-panel arrows `.duf-h`
# carry a soft shadow.
S['google'] = ('0.7.1', header('0.7.1', 'google') + button_block(
    'google',
    ['#rcnt div[role="button"]', '#rcnt button', '[role="dialog"] div[role="button"]', 'span[role="button"][aria-pressed]'],
    exempt=':not(.mic):not(.lens)',
    primary='[role="dialog"] div[role="button"].cur') +
    overlay_block('google', '[role="listbox"], g-menu, [role="menu"]', '[role="dialog"]', '[role="tooltip"]') +
    inputs_block('.RNNXgb', '.RNNXgb textarea, .RNNXgb input, .gLFyf, .gsfi') + """
  /* Body text: Google paints snippets #bfbfbf and titles #99c3ff; the ink
   * ladder wants text / muted. */
  #rcnt, #search, #center_col, #rhs, #rcnt .VwiC3b, #rcnt .kp, .kp-title, #rcnt .paa, #rcnt .related, #rcnt .sitelinks {
    color: #F8F8F8 !important;
  }
  #rcnt cite, #rcnt .date, #rcnt .kp-sub, #rcnt .src span, #rcnt .pager {
    color: #7F8695 !important;
  }
  /* The pager's current page is a level-0 selected state: raised fill,
   * light text, edge - not an accent fill. */
  #rcnt .cur {
    background-color: #121216 !important;
    color: #F8F8F8 !important;
    border: 2px solid #5E5E60 !important;
    box-shadow: none !important;
  }""" +
    radius_block('#rcnt .kp, #rcnt .paa, #rcnt .related, #rcnt g-img, #rcnt .ico, #rcnt .sitelinks, #rcnt .ai-title, #rcnt .pager, #rcnt .sr, g-menu, [role="listbox"], #rcnt g-inner-card, .ZOyvub') +
    resting_block('#rcnt .kp, #rcnt .paa, #rcnt .related, #rcnt .sr, #rcnt g-inner-card'))

S['claude-ai'] = ('0.9.0', header('0.9.0', 'claude') + """
  /* Surfaces promoted from an accent retint to the full ink stack. Claude's
   * bg ladder is inverted in dark mode (bg-000 is the raised composer, bg-100
   * the page, bg-200 the sidebar), so the map follows use, not number. */
  :root, html, body, [data-mode="dark"], .dark {
    color-scheme: dark;
    --bg-000: #121216 !important;
    --bg-100: #07080A !important;
    --bg-200: #0D0D10 !important;
    --bg-300: #0D0D10 !important;
    --bg-400: #121216 !important;
    --bg-500: #121216 !important;
    --text-000: #F8F8F8 !important;
    --text-100: #F8F8F8 !important;
    --text-200: #F8F8F8 !important;
    --text-300: #7F8695 !important;
    --text-400: #7F8695 !important;
    --text-500: #4B5563 !important;
    --border-100: #1C1C1E !important;
    --border-200: #1C1C1E !important;
    --border-300: #1C1C1E !important;
    --border-400: #5E5E60 !important;
  }
  body { background-color: #07080A !important; color: #F8F8F8 !important; }""" +
    button_block('claude-ai', ['button'], exempt=':not(.btn-icon):not(.btn-send):not(.btn-ghost):not(.pill)',
                 primary='button[class*="bg-accent-main"], button.btn-primary') +
    overlay_block('claude-ai', '[role="menu"], .toast', '[role="dialog"]', '[role="tooltip"], .tooltip') +
    inputs_block('[class*="rounded-2xl"]:has([contenteditable]), .input, select', '[contenteditable]') +
    radius_block('button, a, code, kbd, pre, .tabs, .tabs *, .sidebar *, [class*="rounded-lg"], [class*="rounded-md"], [class*="rounded-xl"], [class*="rounded-2xl"], .rounded, .card, .banner, .artifact, .code-block, .skeleton, .tool, .thinking, .list-row, .usage, .checkbox, .select') +
    resting_block('.card, .artifact, .banner, .code-block, .tool, .thinking, .usage'))

S['chatgpt'] = ('0.8.0', header('0.8.0', 'chatgpt') + """
  /* Surfaces promoted from an accent retint to the full ink stack. */
  :root, html, body, .dark {
    color-scheme: dark;
    --main-surface-background: #07080A !important;
    --main-surface-primary: #07080A !important;
    --main-surface-secondary: #0D0D10 !important;
    --main-surface-tertiary: #121216 !important;
    --message-surface: #121216 !important;
    --composer-surface: #0D0D10 !important;
    --sidebar-surface-primary: #0D0D10 !important;
    --sidebar-surface-secondary: #121216 !important;
    --sidebar-surface-tertiary: #121216 !important;
    --interactive-bg-secondary-default: #121216 !important;
    --interactive-bg-secondary-hover: #1C1C1E !important;
    --interactive-bg-tertiary-default: #121216 !important;
    --text-primary: #F8F8F8 !important;
    --text-secondary: #7F8695 !important;
    --text-tertiary: #7F8695 !important;
    --text-quaternary: #4B5563 !important;
    --text-placeholder: #4B5563 !important;
    --border-light: #1C1C1E !important;
    --border-medium: #1C1C1E !important;
    --border-heavy: #5E5E60 !important;
    --border-xheavy: #5E5E60 !important;
  }
  body { background-color: #07080A !important; color: #F8F8F8 !important; }
  /* Composer chips and the model picker sat muted-on-grey (1.10:1). Level 0
   * surfaces: raised fill, light text. */
  .chip, .model, button.chip, button.model {
    background-color: #121216 !important;
    color: #F8F8F8 !important;
  }""" +
    button_block('chatgpt', ['button'], exempt=':not(.btn-icon):not(.send):not(.chip):not(.model):not(.btn-ghost)',
                 primary='button.btn-accent, button.btn-primary', danger='button.btn-danger') +
    overlay_block('chatgpt', '[role="menu"], .toast', '[role="dialog"]', '[role="tooltip"], .tooltip') +
    inputs_block('[class*="rounded-3xl"]:has(textarea), .input, select', '.composer textarea') +
    radius_block('button, a, code, kbd, pre, .tabs, .tabs *, .sidebar *, [class*="rounded-lg"], [class*="rounded-md"], [class*="rounded-xl"], [class*="rounded-2xl"], [class*="rounded-3xl"], .rounded, .card, .banner, .canvas, .code-block, .sources, .markdown pre, .checkbox, .select') +
    resting_block('.card, .canvas, .banner, .code-block, .sources'))

S['notion'] = ('0.8.0', header('0.8.0', 'notion') + """
  /* Surfaces promoted from an accent retint to the full ink stack. Notion
   * exposes no surface variables; the shell classes are stable. */
  :root, html, body { color-scheme: dark; }
  body, .notion-app-inner, .notion-frame, .notion-page-content {
    background-color: #07080A !important;
    color: #F8F8F8 !important;
  }
  .notion-sidebar-container, .notion-topbar {
    background-color: #0D0D10 !important;
    color: #F8F8F8 !important;
  }
  .notion-app-inner [role="dialog"], .notion-app-inner [role="menu"] {
    background-color: #0D0D10 !important;
    color: #F8F8F8 !important;
  }""" +
    button_block('notion', ['.notion-app-inner [role="button"]', '.notion-app-inner button'],
                 exempt=':not(.notion-topbar [role="button"]):not(.notion-sidebar-container [role="button"]):not(.copy):not(.share)',
                 primary='.notion-app-inner [role="button"].primary') +
    overlay_block('notion', '[role="menu"], .n-slash, .n-toast', '[role="dialog"]', '[role="tooltip"], .n-tooltip') +
    inputs_block('.notion-app-inner input, .notion-app-inner select') +
    radius_block('.notion-app-inner button, .notion-app-inner [role="button"], .notion-app-inner a, .notion-app-inner code, .notion-app-inner kbd, .notion-sidebar-switcher, .notion-sidebar-switcher *, .notion-app-inner [role="menu"] *, .notion-app-inner .n-slash *, .notion-app-inner .n-check, .notion-app-inner .n-check *, .notion-app-inner .n-progress, .notion-app-inner .n-progress *, .notion-app-inner .n-badge, .notion-app-inner .status, .notion-app-inner .cover-picker *, .notion-app-inner .card, .notion-collection-item, .notion-app-inner .callout, .notion-code-block, .notion-app-inner .n-badge, .notion-app-inner .n-mention, .notion-app-inner .n-banner, .notion-app-inner .n-progress, .notion-app-inner .n-table, .notion-app-inner .box, .notion-app-inner .gallery > *, .notion-app-inner .board .col, .notion-app-inner .n-check, .notion-app-inner .cover, .notion-app-inner .cover-picker, .notion-app-inner .tag') +
    resting_block('.notion-app-inner .card, .notion-collection-item, .notion-app-inner .callout, .notion-code-block, .notion-app-inner .n-banner, .notion-app-inner .box, .notion-app-inner .n-table'))

S['linear'] = ('0.8.0', header('0.8.0', 'linear') + """
  /* Surfaces promoted from an accent retint to the full ink stack. */
  :root, html, body {
    color-scheme: dark;
    --color-bg-primary: #07080A !important;
    --color-bg-secondary: #0D0D10 !important;
    --color-bg-tertiary: #121216 !important;
    --color-bg-quaternary: #121216 !important;
    --color-bg-quinary: #1C1C1E !important;
    --color-bg-level-0: #07080A !important;
    --color-bg-level-1: #0D0D10 !important;
    --color-bg-level-2: #121216 !important;
    --color-bg-level-3: #121216 !important;
    --color-bg-translucent: #121216 !important;
    --color-overlay-primary: #0D0D10 !important;
    --color-text-primary: #F8F8F8 !important;
    --color-text-secondary: #7F8695 !important;
    --color-text-tertiary: #7F8695 !important;
    --color-text-quaternary: #4B5563 !important;
    --color-border-primary: #1C1C1E !important;
    --color-border-secondary: #1C1C1E !important;
    --color-border-tertiary: #5E5E60 !important;
    --color-border-translucent: #1C1C1E !important;
    /* Owned: every fill --color-accent-text sits on is this file's accent. */
    --color-accent-text: #07080A !important;
  }
  body { background-color: #07080A !important; color: #F8F8F8 !important; }""" +
    button_block('linear', ['button'], exempt=':not(.btn-icon):not(.btn-ghost)',
                 primary='button.btn-primary', danger='button.btn-danger') +
    overlay_block('linear', '[role="menu"], .command, .toast', '[role="dialog"], .modal', '[role="tooltip"], .tooltip') +
    inputs_block('.input, .select, select, textarea') +
    radius_block('button, a, code, kbd, pre, .tabs, .tabs *, .sidebar *, .ws, .ws *, .command *, [role="menu"] *, .cmd-row *, .k, .project-icon, .issue-card, .project-card, .banner, .badge, .label-chip, .skeleton, .checkbox, .comment, .activity, .col, .detail, .filter-bar, .group-head, .cmd-row, .progress, .block') +
    resting_block('.issue-card, .project-card, .banner, .comment, .detail, .block'))

S['atlassian'] = ('0.4.0', header('0.4.0', 'atlassian') + button_block(
    'atlassian',
    ['button'],
    exempt=':not(.icon-btn):not(.nav-item):not(.subtle):not(.link):not(.toggle)',
    primary='button.primary', danger='button.danger, button.warning') +
    overlay_block('atlassian', '[role="menu"], .dropdown, .inline-dialog, .flag', '[role="dialog"], .modal', '[role="tooltip"], .tooltip') +
    inputs_block('.textfield, .select, .search, .comment-box') +
    radius_block('.card, .lozenge, .tag, .badge, .section-message, .banner, .flag, .empty-state, .panel, .code-block, .progress, .skeleton, .bubble, .column, .breadcrumbs, .tabs, .checkbox, .toggle, .radio, .avatar-group, .field, .helper, .comment, .detail, .issue-header') +
    resting_block('.card, .section-message, .banner, .panel, .empty-state, .code-block, .bubble, .comment, .column') + """
  /* Lozenge labels sit on bold fills the file owns; ink black reads on all. */
  .lozenge.bold, .lozenge.bold *, .badge.primary {
    color: #07080A !important;
  }""")

S['microsoft365'] = ('0.4.1', header('0.4.1', 'microsoft365') + button_block(
    'microsoft365',
    ['#appContainer button', 'button.fui-Button', 'button.ms-Button', '.hdr-btn'],
    exempt=':not(.subtle):not(.transparent):not(.ms-CommandBarItem):not(.fui-Tab):not(.ms-Pivot-link):not(.fui-BreadcrumbButton):not(.fui-MenuItem):not(.fui-Tree-item):not(.ms-Nav-link):not(.waffle):not(.icon):not(.fui-AccordionHeader button)',
    primary='button.fui-Button.primary, button.ms-Button--primary, button.fui-Button.danger') +
    overlay_block('microsoft365', '.fui-Menu, .fui-Popover, .ms-Callout, [role="menu"], .fui-Toast', '[role="dialog"], .fui-DialogSurface', '[role="tooltip"], .fui-Tooltip') +
    inputs_block('.fui-Input, .fui-Textarea, .fui-Select, .fui-Dropdown, .ms-TextField, .ms-Dropdown, .compose-bar, .editor', '.fui-Input input, .fui-Textarea textarea, .ms-TextField input, .fui-Select select') +
    radius_block('.fui-Card, .fui-CardPreview, .fui-Badge:not(.circular), .fui-CounterBadge, .fui-Tag, .fui-MessageBar, .ms-MessageBar, .fui-Toast, .fui-Skeleton, .fui-ProgressBar, .fui-ProgressBar *, .fui-Slider, .fui-Checkbox__indicator, .fui-Table, .fui-Accordion, .fui-AccordionPanel, .fui-Divider, .event, .msg-item, .teams-msg .bubble, .preview, .reactions, .ms-DetailsRow, .fui-Tab, .fui-TabList') +
    resting_block('.fui-Card, .fui-MessageBar, .ms-MessageBar, .msg-item, .event, .teams-msg .bubble, .fui-Table, .fui-Accordion, .ms-DetailsRow, .reading-pane, .folder-pane, .message-list, .fui-Tab, .fui-Skeleton, .ms-Persona') + """
  /* Only fills this file owns take an ink label: the brand badge, the
   * counter, the danger badge (its fill is the negative token, 5.10:1 ink
   * against 3.93:1 white) and the checked box. Fluent's own success and
   * warning fills and the grey Tag keep Fluent's white text (measured
   * 2026-09-24: white is the higher contrast on #107C10).
   * .fui-PresenceBadge is deliberately absent: its status dot is an SVG
   * filled with currentColor, and the status hue IS its color. Inking it
   * blacked out every presence dot in Teams and Outlook (2026-09-25). */
  .fui-Badge.brand, .fui-Badge.brand *, .fui-CounterBadge, .fui-Badge.danger,
  .ms-Checkbox-checkbox.is-checked, .ms-Checkbox-checkbox.is-checked *, .fui-Checkbox__indicator {
    color: #07080A !important;
  }
  /* A primary split button ("New mail" + chevron) is one group with one
   * lift: the wrapper carries the edge and the offset, the halves are flat
   * inside it with a single ink divider (docs/ELEVATION.md, clearance). */
  .fui-SplitButton:has(> .fui-Button.primary) {
    border: 2px solid #07080A !important;
    box-shadow: 4px 4px 0 0 #5D96D3 !important;
  }
  .fui-SplitButton > button.fui-Button.primary {
    border: 0 !important;
    box-shadow: none !important;
  }
  .fui-SplitButton > button.fui-Button.primary + button.fui-Button.primary {
    border-left: 2px solid #07080A !important;
  }
  .fui-SplitButton:has(> .fui-Button.primary):active {
    box-shadow: none !important;
    transform: translate(4px, 4px) !important;
  }
  .fui-SplitButton > button.fui-Button.primary:active {
    transform: none !important;
  }""")

# 0.4.2: the account hit-target is an EMPTY transparent button over the
# avatar; the edge boxed it (iconEdge, 2026-09-24). An empty button is never
# a labelled action.
S['copilot'] = ('0.4.2', header('0.4.2', 'copilot') + button_block(
    'copilot',
    ['#app button'],
    exempt=':not(.icon):not(.send):not(.mode-toggle):not(.voice-orb):not(.followups > *):not(.citation):not(.image-tile):not(.chip):not(.pill):not(.ghost):not(:empty)',
    primary='#app button.primary') +
    overlay_block('copilot', '[role="menu"], .toast', '[role="dialog"]', '[role="tooltip"], .tooltip') +
    inputs_block('.composer, #app textarea, .input, .textarea', '.composer textarea') +
    radius_block('[role="menu"] *, [role="menuitem"], .banner, .toast, .tooltip, .skeleton, #app .card, #app .banner, #app .code-block, #app .skeleton, #app .msg, #app .sources, #app .citation, #app .image-tile, #app .img, #app .checkbox, .toast, .tooltip, #app .msg-actions, #app .followups, #app .typing, [class*="NavItem"], [class*="NavSubItem"], [class*="NavCategoryItem"], .spa-link, button.fui-Button:not([class*="icon" i]):not(.rounded-full)') +
    resting_block('#app .card, #app .banner, #app .code-block, #app .msg, #app .sources, #app .image-tile, #app .composer'))

MAT_EXEMPT = ':not(.mat-mdc-icon-button):not(.mat-mdc-fab):not(.mat-mdc-tab):not(.icon-btn):not(.mat-mdc-list-item):not(.mat-mdc-menu-item):not(.mat-mdc-chip):not(.action)'
S['gemini'] = ('0.5.1', header('0.5.1', 'gemini') + button_block(
    'gemini',
    ['bard-sidenav-container button', '.mdc-button', '.mat-mdc-unelevated-button', '.mat-mdc-raised-button', '.mat-mdc-outlined-button', '.mat-tonal-button', 'button.upsell-button', 'button.new-chat'],
    exempt=MAT_EXEMPT + ':not(.send):not(.tts-button):not(.menu-btn):not(.draft-chip):not(.model-chip):not(.code-chip):not(.response-actions button)',
    primary='button.mdc-button.mat-mdc-unelevated-button, .mat-mdc-unelevated-button') +
    overlay_block('gemini', '.mat-mdc-menu-panel, .mat-mdc-snack-bar-container, .autosuggest', '.mat-mdc-dialog-container, [role="dialog"]', '.mat-mdc-tooltip, [role="tooltip"]') +
    inputs_block('.text-input-field, .input-area-container, .mat-mdc-form-field-flex, .mat-mdc-select', '.text-input-field textarea, .text-input-field [contenteditable], .mat-mdc-form-field-flex input, .mat-mdc-form-field-flex textarea') +
    radius_block('.autosuggest *, .on-error, .mat-mdc-chip, .mat-mdc-chip *, .draft-chip, .model-chip, .code-chip, .mat-mdc-card, .mat-mdc-card *, .tertiary-card, .mat-mdc-snack-bar-container, .mat-mdc-tooltip, .info-banner, .error-banner, .disclaimer, .mat-mdc-progress-bar, .mat-mdc-progress-bar *, .mat-mdc-slider, .mat-mdc-tab, .mat-mdc-tab-group, .mat-mdc-list-item, .mat-mdc-select, .mat-drawer, .code-block, .conversation-container, .gem, .autosuggest, .gradient-strip, .top-gradient, .bottom-gradient, .mat-mdc-form-field-flex, .mat-mdc-menu-panel, .mat-mdc-dialog-container') +
    resting_block('input-area-v2, .mat-mdc-fab, .mat-mdc-card, .tertiary-card, .info-banner, .error-banner, .disclaimer, .code-block, .conversation-container, .mat-mdc-tab-group, .mat-mdc-list-item, .mat-mdc-raised-button, .gem, .mdc-switch, .mdc-switch *, .mat-mdc-slide-toggle *, .mat-drawer, .mat-sidenav') + """
  /* The side drawer is a resting pane, not a modal: 2px edge, no lift. */
  .mat-drawer, .mat-sidenav { border-right: 2px solid #5E5E60 !important; }
  /* Tonal buttons (raised, upsell, power-up) are level 0: ink surface with
   * accent text, never an ink label on a dark fill. */
  .mat-mdc-raised-button, .mat-mdc-raised-button *, button.upsell-button, button.upsell-button *, .power-up, .power-up * {
    color: #D3B2FE !important;
  }
  /* Gradients: flat. */
  .gradient-strip, .top-gradient, .bottom-gradient, .power-up, .draft-chip {
    background-image: none !important;
  }
  .gradient-strip, .top-gradient, .bottom-gradient { background-color: #0D0D10 !important; }""")

S['aistudio'] = ('0.5.0', header('0.5.0', 'aistudio') + button_block(
    'aistudio',
    ['ms-app button', '.mdc-button', '.mat-mdc-unelevated-button', '.mat-mdc-outlined-button', 'button.ms-button-primary', 'button.upgrade-button', 'button.paid-api-key-button'],
    exempt=':not(.mat-mdc-icon-button):not(.mat-mdc-tab):not(.icon-btn):not(.mat-mdc-menu-item):not(.action):not(.ms-button-filter-chip):not(.code-copy):not(.chunk-actions button):not(.account-switcher-button):not(.playground-link):not(.skip-content):not(.toolbar-container button)',
    primary='button.ms-button-primary, .mat-mdc-unelevated-button') +
    overlay_block('aistudio', '.mat-mdc-menu-panel, .mat-mdc-snack-bar-container, .settings-panel', '.mat-mdc-dialog-container, [role="dialog"]', '.mat-mdc-tooltip, [role="tooltip"]') +
    inputs_block('.prompt-input-wrapper, .prompt-box-container, .mat-mdc-text-field-wrapper, .mat-mdc-form-field-flex, .mat-mdc-select, .api-key, .cm-editor', '.prompt-input-wrapper textarea, .mat-mdc-text-field-wrapper input, .mat-mdc-text-field-wrapper textarea, .mat-mdc-form-field-flex input, .api-key input') +
    radius_block('.ms-button-filter-chip, .mat-mdc-card, .mat-mdc-card *, .model-card, .category-card, .category-card i, .on-error, .settings-card, .upgrade-card, .upgrade-card-wrapper, .settings-panel, .mat-mdc-snack-bar-container, .mat-mdc-tooltip, .info-banner, .error-banner, .progress-bar, .progress-bar *, .mat-mdc-slider, .mat-mdc-tab, .mat-mdc-tab-group, .mat-mdc-menu-item, .mat-mdc-select, .code-inline-badge, .cm-editor, .chunk-editor, .chunk-editor-main, .token-count, .enabled-tool, .setting-row, .dragging-overlay, .mat-mdc-text-field-wrapper, .mat-mdc-form-field-flex, .prompt-input-wrapper, .prompt-box-container, .mat-mdc-menu-panel, .mat-mdc-dialog-container') +
    resting_block('.mat-mdc-card, .model-card, .category-card, .settings-card, .upgrade-card, .upgrade-card-wrapper, .info-banner, .error-banner, .chunk-editor, .cm-editor, .mdc-switch, .mdc-switch *, .settings-panel, .dragging-overlay') + """
  /* The drop overlay is a full-surface scrim, not a dialog: 2px edge, no lift.
   * The upgrade button is tonal (level 0): light text on its ink surface. */
  .dragging-overlay { border: 2px solid #5E5E60 !important; }
  button.upgrade-button, button.upgrade-button * { color: #F8F8F8 !important; }
  .upgrade-card, .upgrade-card-wrapper { background-image: none !important; }""")

S['shopee'] = ('0.3.1', header('0.3.1', 'shopee') + button_block(
    'shopee',
    ['.stardust-button', '.shopee-button-solid--primary', '.btn-solid-primary', '.shopee-page-controller button'],
    exempt=':not(.stardust-button--ghost):not(.stardust-carousel__arrow):not(.carousel-arrow):not(.stardust-tabs-header__tab):not(.stardust-button--disabled)',
    primary='.stardust-button--primary, .shopee-button-solid--primary, .btn-solid-primary') +
    overlay_block('shopee', '.stardust-popover, .stardust-dropdown, .shopee-toast, [role="menu"]', '.shopee-modal, [role="dialog"]', '[role="tooltip"]') +
    inputs_block('.shopee-searchbar, .shopee-searchbar-input, .stardust-input', '.shopee-searchbar-input__input, .stardust-input input') +
    radius_block('.product-card, .mall-item, .voucher, .voucher *, .flash-item, .flash-item *, .shopee-alert, .shopee-toast, .shopee-label, .stardust-form-error, .stardust-dropdown, .stardust-dropdown__item, .stardust-popover, .stardust-tabs-header__tab, .shopee-countdown-timer__number, .home-category-list__category-grid, .home-category-list__grid, .homepage-mall-section, .shopee-header-section, .shopee-header-section__header, .shopee-searchbar, .shopee-searchbar-input, .cart-number-badge, .placeholder, .discount, .tag, footer .payments span, .stardust-carousel, .stardust-carousel__arrow, .carousel-arrow, .mall .img, .img') +
    resting_block('.stardust-button--ghost, .stardust-button--disabled, .product-card, .mall-item, .voucher, .flash-item, .shopee-alert, .home-category-list, .homepage-mall-section, .shopee-header-section, .shopee-searchbar, .shopee-page-controller, .stardust-carousel, .flash-sale, .navbar, .header-main, .shopee-top') + """
  /* Gradient primary: flat hue. The header section is Shopee's white card;
   * it takes the raised ink step and ink text. */
  :root, html, body {
    --nc-primary-gradient: linear-gradient(#E7907D, #E7907D) !important;
    --ne-depth6: none !important; --ne-depth5: none !important; --ne-depth4: none !important;
    --ne-depth3: none !important; --ne-depth2: none !important; --ne-depth1: none !important;
  }
  .shopee-header-section, .shopee-header-section__header, .homepage-mall-section, .home-category-list, .flash-sale, .product-card, .mall-item, .voucher, .voucher .left, .voucher .right, .shopee-page-controller, footer .payments span, .stardust-dropdown, .stardust-popover, .stardust-tabs, .shopee-modal {
    background-color: #0D0D10 !important;
    background-image: none !important;
    color: #F8F8F8 !important;
  }
  /* Stardust's white default button, the tab strip, the modal and the
   * countdown's black tiles were never repainted (white-on-white, ink on
   * black, measured 2026-09-24). Level 0: raised fill, light text. */
  .stardust-button:not(.stardust-button--primary):not(.stardust-button--ghost):not(.stardust-button--disabled), .stardust-button--secondary, .shopee-countdown-timer__number, .shopee-modal p, .shopee-modal h2 {
    background-color: #121216 !important;
    color: #F8F8F8 !important;
  }
  .shopee-modal p, .shopee-modal h2 { background-color: transparent !important; }
  .shopee-header-section__header__title, .product-card .name, .mall-item .name, .flash-item .name, .flash-item .price, .navbar__link-text, .shopee-searchbar-input__input, .voucher .right, footer, footer .legal, .stardust-tabs-header__tab, .home-category-list__category-grid, .mall .name {
    color: #F8F8F8 !important;
  }
  .product-card .meta, .product-card .sold, .mall-item .meta, .text-secondary, footer .cols, .hints, .sep, .disabled-text {
    color: #7F8695 !important;
  }
  /* Ink labels only on the fills this file paints: the amber discount, the
   * cart badge and filled labels. Outlined .tag keeps its own text. */
  .discount, .cart-number-badge, .shopee-label:not(.shopee-label--outline), .stardust-carousel__dot--active {
    color: #07080A !important;
  }
  .flash-item .discount, .product-card .discount { background-color: #FBBF24 !important; }
  .stardust-button, .stardust-button * { background-image: none !important; }""")

# Surgical edits to rules that live OUTSIDE the structure section. Each is
# (site, old, new); the old text must be present exactly once, or the run
# stops. When the rule has already been edited, the tuple is a no-op only if
# `new` is already present.
OUTSIDE = [
    ('github',
     """  .btn:not(.btn-octicon):not(.btn-invisible):not(.btn-link),
  [class*="prc-Button-ButtonBase"]:not([data-variant="invisible"]):not([data-variant="link"]) {
    border-width: 2px !important;
    box-shadow: 4px 4px 0 0 #6494D5 !important;
  }
  /* "New issue" reads a translucent Primer border, not
   * --button-primary-borderColor-rest, so set the ink edge directly. */
  .btn-primary,
  [class*="prc-Button-ButtonBase"][data-variant="primary"] {
    border-color: #07080A !important;
  }
  .btn:not(.btn-octicon):not(.btn-invisible):not(.btn-link):active,
  [class*="prc-Button-ButtonBase"]:not([data-variant="invisible"]):not([data-variant="link"]):active {
    box-shadow: none !important;
    transform: translate(4px, 4px);
  }""",
     """  .btn:where(:not(.btn-octicon):not(.btn-invisible):not(.btn-link)),
  [class*="prc-Button-ButtonBase"]:where(:not([data-variant="invisible"]):not([data-variant="link"])) {
    border-width: 2px !important; /* level 0; :where() keeps .btn-primary above it */
    box-shadow: none !important;
  }
  /* Level 1 (docs/ELEVATION.md): only the primary fill carries the offset.
   * Primer's danger button rests on the neutral fill with red text, so it
   * stays level 0. "New issue" reads a translucent Primer border, not
   * --button-primary-borderColor-rest, so set the ink edge directly. */
  .btn-primary,
  [class*="prc-Button-ButtonBase"][data-variant="primary"] {
    border-color: #07080A !important;
    color: #07080A !important;
    box-shadow: 4px 4px 0 0 #6494D5 !important;
  }
  .btn-primary *, [class*="prc-Button-ButtonBase"][data-variant="primary"] * {
    color: #07080A !important;
  }
  .btn-primary:active,
  [class*="prc-Button-ButtonBase"][data-variant="primary"]:active {
    box-shadow: none !important;
    transform: translate(4px, 4px);
  }"""),
    ('wikipedia',
     """  .cdx-button:not(.cdx-button--weight-quiet):not(.cdx-button--fake-button) {
    box-shadow: 4px 4px 0 0 #6D92D6 !important;
  }
  .cdx-button:not(.cdx-button--weight-quiet):not(.cdx-button--fake-button):active {
    box-shadow: none !important;
    transform: translate(4px, 4px);""",
     """  .cdx-button:not(.cdx-button--weight-quiet):not(.cdx-button--fake-button) {
    box-shadow: none !important; /* level 0; the primary rule below lifts its own */
  }
  .cdx-button:not(.cdx-button--weight-quiet):not(.cdx-button--fake-button):active {
    box-shadow: none !important;
    transform: none;"""),
    ('gemini',
     """  .mat-tonal-button,
  .tts-button,
  button.mdc-button.mat-mdc-unelevated-button,
  .upsell-button {
    background-color: #121216 !important;""",
     """  .mat-tonal-button,
  .tts-button,
  .upsell-button {
    background-color: #121216 !important;"""),
    ('aistudio',
     """  .ctrl-enter-submits,
  .ms-button-primary,
  .upgrade-button,""",
     """  .ctrl-enter-submits,
  .upgrade-button,"""),
]


# Contrast fixes measured by simulator/e2e/quality.spec.ts (2026-09-24),
# appended after each site's structure block. Selectors marked "mock" are
# the simulator's stand-ins; the live selector is confirmed by
# scripts/style-check/live-contract.mjs, not here.
EXTRA = {
    'github': """
  /* Ink on the fills this file paints: the toast icon square (positive,
   * accent, negative) and the diff gutter numbers on their tints. */
  .Toast-icon { color: #07080A !important; }
  .blob-num-addition, .blob-num-deletion { color: #F8F8F8 !important; }""",
    'youtube': """
  /* The notification count sits on the negative fill: ink, 5.10:1. */
  .yt-spec-icon-badge-shape__badge, .ytSpecAvatarShapeLiveBadge { color: #07080A !important; }
  /* YouTube's 2026 "light shapes" (yt-light-shape, live 2026-09-24): a
   * 10px-blurred white wash and a rim light under tonal and outline buttons -
   * a soft glow, which is a soft shadow by another name. Purely decorative,
   * so the element goes rather than being repainted. */
  yt-light-shape, [class*="contribYtLightShape"] { display: none !important; }
  /* Blurred backdrops the first passes never measured: the overlay-dark
   * media button (Shorts mute), the chip bar's scrim and the player's
   * suggested-action badge. Opaque ink instead. */
  .ytSpecButtonShapeNextOverlayDark, .with-chipbar.ytd-app, .ytp-suggested-action-badge {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  .ytSpecButtonShapeNextOverlayDark { background-color: #07080A !important; }
  /* The three floating surfaces lifted above are stock #212121/#282828 boxes;
   * the raised step is the ink surface for a level 2 sheet. */
  .ytSearchboxComponentSuggestionsContainer, .ytdMiniplayerComponentContent, tp-yt-paper-material {
    background-color: #0D0D10 !important;
  }
  /* The tooltip HOST is always in the DOM - empty until upgraded, and with
   * its #tooltip child hidden until hover - so chrome on the host paints 4x4
   * accent dots at every button corner (live 2026-09-24, masthead Sign in).
   * The level 2 edge and shadow go on #tooltip above; the host stays bare. */
  tp-yt-paper-tooltip {
    border: 0 !important;
    box-shadow: none !important;
    background-color: transparent !important;
    padding: 0 !important;
  }""",
    'google': """
  /* The result carousels' scroll arrows (g-left-button / g-right-button) fade
   * in over the strip with a gradient (live 2026-09-24). Opaque ink. */
  g-left-button, g-right-button {
    background-image: none !important;
    background-color: #07080A !important;
  }
  /* Knowledge-panel image carousel arrows (.duf-h, absolute 32x32 over the
   * photo) carry a 0 1px 2px soft shadow; the fill is already repainted by
   * the #rhs rule above. */
  #rhs .kno-fb-ctx a > div, .duf-h { box-shadow: none !important; }""",
    'facebook': """
  /* Own message bubble and the current nav icon are accent fills: ink label.
   * (.fb-msg.me / .fb-nav-icon are mock classes.) */
  .fb-msg.me, .fb-msg.me *, .fb-nav-icon, .fb-logo { color: #07080A !important; }""",
    'claude-ai': """
  /* Send button is an accent fill: ink glyph (2.40:1 white before). */
  button[aria-label="Send message"], button[aria-label="Send message"] *, .btn-send, .btn-send *,
  .pill.new, .pill.new *, .avatar {
    color: #07080A !important;
  }""",
    'notion': """
  /* Checked box, avatar and badge are accent / amber / negative fills: ink.
   * (mock classes: .todo.done .box, .n-avatar, .n-badge) */
  .todo.done .box, .n-avatar, .n-badge { color: #07080A !important; }""",
    'linear': """
  /* Selection was a 30% accent wash, the one translucent surface left;
   * the opaque surface_alt step keeps muted text at 5.11:1 on it. */
  :root { --color-selection: #121216 !important; }""",
    'atlassian': """
  /* The error flag is the bold danger fill: ink icon (1.52:1 red before).
   * Subtle danger surfaces (removed lozenge, danger section message) drop
   * their red tint for surface_alt so negative text reads at 4.76:1. */
  .flag.error .ic { color: #07080A !important; }
  :root { --ds-background-danger: #121216 !important; }""",
    'chatgpt': """
  /* The error banner's 15% red wash left negative text at 4.21:1; the
   * opaque surface_alt step reads at 4.76:1. */
  :root { --surface-error: #121216 !important; }""",
    'copilot': """
  /* Prompt suggestions (live: button.fx-Suggestion, hashed second class) sit
   * outside the #app base rule's reach and kept a 1px stroke: level 0 edge. */
  .fx-Suggestion {
    border: 2px solid #5E5E60 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background-image: none !important;
  }
  /* Copilot's nav overrides live in `@layer application` and are !important
   * (probe.mjs --style, 2026-09-24: `.SnBES2Fu { border-radius … !important }`).
   * Among important declarations a layered rule outranks every unlayered one,
   * whatever its specificity, so the flattening has to sit in that same layer;
   * there, ordinary order and specificity decide, and this sheet loads last. */
  @layer application {
    [class*="NavItem"][class], [class*="NavSubItem"][class], [class*="NavCategoryItem"][class],
    #app *:not([class*="avatar"]):not([class*="Avatar"]):not([class*="spinner"]):not([class*="rounded-full"]),
    button, button[class], input, textarea, [role="dialog"], [role="menu"],
    [role="button"]:not([class*="avatar" i]),
    [class]:has(> * > * > #user-account-avatar) {
      border-radius: 0 !important;
    }
    /* The hit button and overlay on the round account avatar ask for 50%
     * inline; the host forces 12px !important on them. Circles they stay. */
    [class]:has(> * > * > #user-account-avatar) button,
    [class]:has(> * > * > #user-account-avatar) [role="button"] {
      border-radius: 50% !important;
    }
  }""",
    'gemini': """
  /* The greeting is gradient text: with the gradient gone the clip left it
   * transparent on the page (1:1). A flat accent fill instead. */
  .greeting .brand-text, .brand-text {
    background: none !important;
    -webkit-background-clip: border-box !important;
    background-clip: border-box !important;
    -webkit-text-fill-color: #BA99E3 !important;
    color: #BA99E3 !important;
  }
  /* Snackbar is Material's inverse (light) surface; level 2 is the ink
   * overlay with the light action colour. */
  .mat-mdc-snack-bar-container, .mdc-snackbar__surface, .mat-mdc-simple-snack-bar {
    background-color: #121216 !important;
    color: #F8F8F8 !important;
  }
  .mat-mdc-snack-bar-container .action, .mat-mdc-snack-bar-action {
    color: #D3B2FE !important;
  }""",
    'aistudio': """
  /* Snackbar is Material's inverse (light) surface; level 2 is the ink
   * overlay with the light action colour (2.43:1 before). */
  .mat-mdc-snack-bar-container, .mdc-snackbar__surface, .mat-mdc-simple-snack-bar {
    background-color: #121216 !important;
    color: #F8F8F8 !important;
  }
  .mat-mdc-snack-bar-container .action, .mat-mdc-snack-bar-action {
    color: #9AC5FF !important;
  }""",
    'shopee': """
  /* Peach and accent fills this file paints take an ink label: the flash
   * "selling fast" bar, the corner badge and the checked box. The Mall
   * label's own red is below the on_light threshold, so it keeps white.
   * div.JH7cJR is the live peach chip (16x in the audit above, white on
   * #FFBDA6): a CSS-module hash, so it may rot with a deploy; the mock
   * carries it so coverage notices when it does. */
  .flash-item .sold, .flash-item .sold span, .product-card .img .badge, .JH7cJR, .stardust-checkbox--checked {
    color: #07080A !important;
  }
  .shopee-label.shopee-label--mall { color: #F8F8F8 !important; }""",
}

MARK = 'Sage Ink structure ─'


def first_block_close(lines):
    d = 0
    started = False
    for i, l in enumerate(lines):
        if l.startswith('@-moz-document'):
            started = True
        if started:
            d += l.count('{')
            d -= l.count('}')
            if d == 0 and '}' in l:
                return i
    raise SystemExit('no close')


def main():
    for sid, (ver, block) in S.items():
        p = ROOT / f'{sid}.user.css'
        text = p.read_text()
        for site, old, new in OUTSIDE:
            if site != sid:
                continue
            if new in text or old not in text:
                continue
            assert text.count(old) == 1, f'{sid}: outside edit anchor not found exactly once'
            text = text.replace(old, new)
        for site, old, new in OUTSIDE:
            assert site != sid or new in text, f'{sid}: outside edit did not land: {new[:70]!r}'
        lines = text.split('\n')
        hdr = next((i for i, l in enumerate(lines) if MARK in l), None)
        close = first_block_close(lines)
        if hdr is not None:
            del lines[hdr:close]
            close = hdr
        block = block + EXTRA.get(sid, '')
        lines.insert(close, block.rstrip('\n') + '\n')
        t = '\n'.join(lines)
        t = re.sub(r'(@version\s+)[0-9.]+', lambda m: m.group(1) + ver, t, count=1)
        t = t.replace(MUTED_OLD, MUTED_NEW).replace(MUTED_OLD.lower(), MUTED_NEW)
        t = t.replace(MUTED_OLD_OKLCH, MUTED_NEW_OKLCH).replace(MUTED_OLD_RGB, MUTED_NEW_RGB)
        t = t.replace(NEG_OLD, NEG_NEW).replace(NEG_OLD.lower(), NEG_NEW).replace(NEG_OLD_OKLCH, NEG_NEW_OKLCH)
        p.write_text(t)
        print('wrote', sid, ver)


if __name__ == '__main__':
    main()
