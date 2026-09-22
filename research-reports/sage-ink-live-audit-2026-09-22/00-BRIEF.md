# Brief — Sage Ink desktop + browser fidelity to neobrutalism.dev (round 1)

You are reviewing a personal, open-source desktop design system. You have no
filesystem access and no prior context; everything you need is below. Assume
competence: no generic theming advice, no "consider accessibility" filler.

## 1. Context

- **Operator:** one person, daily-driving KDE Plasma 6.6 on Wayland (Fedora-based
  distro, 2560x1440 at scale 1), plus Microsoft Edge (4 profiles) and a rarely
  used Firefox. Repo: github.com/JohnRebellion/indigo-glass.
- **Goal:** every surface — Qt apps, QML/Kirigami apps, GTK3/GTK4 apps, Klassy
  window decoration, Konsole, Edge chrome, web pages via Stylus userstyles —
  should read as one system that is as close as possible to the
  **neobrutalism.dev** component grammar, rendered in the "Sage Ink" palette.
- **Source of truth:** a TOML token file (OKLCH) → a Python codegen → generated
  outputs (KDE colour scheme, Plasma theme colours, CSS vars, VSCode themes,
  Windows Terminal). Many layer configs (GTK CSS, klassyrc, Edge manifest,
  Stylus site styles) are **hand-typed**, and a text drift guard checks them
  for stale hex values only.

## 2. Target grammar (neobrutalism.dev, as encoded by this repo)

- 2px solid border on every control and card. Border colour on dark =
  `border_strong` #5E5E60 (reference bridge `--border`).
- Hard offset shadow 4px 4px 0 0, zero blur, colour `accent_alt` #89A889 on the
  dark page; on an accent-filled object the shadow is the page colour #07080A
  (sage-on-sage measured 1.44:1). Buttons: shadow collapses on press.
- Radius 0. Pill/circle only for switch tracks and thumbs, radio dots, avatars,
  slider handles — mirroring the reference's own `rounded-full` components.
- Flat opaque fills. **No blur, no gradient, no translucency** — a hard rule
  after a previous "glass" iteration was removed.
- **State grammar:** fill = identity (buttons, badges keep fills); outline =
  state (selected list rows, tabs, menu items get a 2px solid outline, not a
  filled highlight). Focus ring: 2px solid text colour.
- Inputs: 2px border, no shadow. Check/radio/switch/thumb: 2px border.

Palette (dark, default): base #07080A, surface #0D0D10, surface_alt #121216,
sidebar #0A0A0D, accent #A6C9A6 (fill-only — 1.72:1 against text, so never
text), accent_hi #C0E3C0, accent_alt #89A889, text #F8F8F8, text_muted
#6B7280, border_strong #5E5E60, negative #ED254E, positive #3FFABB, amber
#FBBF24.

## 3. How the stack works (read this — it constrains every answer)

- **Qt widgets** are drawn by *Klassy* (a Breeze fork) as the QStyle, built
  from source with three local patches: opaque hard window shadow, menu/tooltip
  ink, and "Tier C outline" (selected item-view rows draw an outline instead of
  a Highlight fill). Because the fill is gone but `QStyledItemDelegate` still
  paints selected text in `QPalette::HighlightedText` (dark ink, needed for
  real sage fills such as QLineEdit text selection), the patch remaps
  HighlightedText := Text **only for QAbstractItemView widgets inside
  `Style::polish()`** (excerpt in §7).
- **QML/Kirigami** apps (System Settings, Discover, Plasma applets) take text
  colours from the KDE colour scheme through Kirigami.Theme, and backgrounds
  from qqc2-desktop-style, which calls into the same QStyle.
- **GTK3** uses a hand-written SageInk theme (full CSS in §7). GTK4 has only a
  `~/.config/gtk-4.0/gtk.css` override (192 lines, not shown); there is no GTK4
  theme package.
- **Edge chrome** uses an unpacked Chrome theme extension loaded with
  `--load-extension` on every launch. Web pages use Stylus: a universal style
  (scrollbar/selection/focus) plus 15 per-site styles that remap each site's
  own design tokens (Primer, Codex, Fluent, Material 3…), zero radius tokens,
  flatten surfaces to two ink steps and set site shadows to `none`. Dark Reader
  is disabled on those 15 domains.
- **Konsole** uses a generated colour scheme. **Firefox** has no layer.

## 4. Measured baseline (live screenshots + pixel sampling, 2026-09-22)

Every item was verified by reading the actual file or sampling actual pixels.

| # | Surface | Finding |
|---|---|---|
| M1 | QML (System Settings) | Selected sidebar item's label is **invisible**: outline drawn, interior unfilled #07080A, text #07080A. The colour-scheme preview's "Highlighted text" row is also invisible. `[Colors:Selection] ForegroundNormal=7,8,10`. |
| M2 | GTK3 | All hard shadows are `rgba(137,168,137,0.9)` / `rgba(7,8,10,0.9)` — translucent; sampled #7C987D instead of #89A889. |
| M3 | GTK3 | `@borders` is #000000 — invisible on #07080A/#0D0D10. |
| M4 | GTK3 | Entries, check, radio, switch use 1px borders; buttons 2px. |
| M5 | GTK3 | Switch track literal #191c1e (not a token); headerbar button hover is a translucent `alpha(fg,0.08)` wash. |
| M6 | Edge | Theme is loaded, but Edge lifts dark theme colours non-linearly. Input→render per channel: 0→0, 1→6, 2→9, 3→11, 4→12, 7→16, 10→18, 15→22, 18→25, 30→35, 40→44, 48→51; vivid colours pass almost unchanged (255,0,0→255,3,0). Pre-compensated frame [10,10,15] renders exactly #121216. Omnibox cannot hit #07080A exactly (nearest #06090B). |
| M7 | Edge NTP | Renders flat #363636 with a white rounded pill search box. The theme omits `ntp_background` to keep Edge's daily Bing photo, but no photo shows on this profile. `ntp_background` is honoured when set (probe). |
| M8 | Firefox | Unthemed. Toolbar #222224, pages light. |
| M9 | Web pages | Site styles achieve radius 0 (verified by zoom) and palette, but keep the sites' own 1px low-contrast borders and have **no** hard shadows on buttons/inputs/cards. |
| M10 | Klassy titlebar | Buttons are macOS-style "AccentTrafficLights", small circles, red/amber/green (close #910323) — outside the palette. Window shadow itself is correct: opaque #89A889, right+bottom. |
| M11 | Qt (Dolphin) | Selection outline correct and legible; window shadow correct. |

Gemini screenshot reads claimed rounded corners on web pages and missing GTK
shadows; both were refuted by zoom and pixel sampling (downscaled montage
artefacts). Do not repeat them.

## 5. Already decided — do not re-propose or argue

- No blur, translucency or gradient anywhere. KWin blur removed deliberately.
- Radius 0; pill exceptions exactly as in §2.
- Shadow colour rule (sage on page, page colour on accent fill).
- Accent is fill-only, never text.
- Outline-for-state grammar (§2).
- Klassy is patched from source; patching C++ is acceptable. Patching
  Plasma/Kirigami/qqc2 system libraries is **not** preferred (distro updates
  overwrite them) unless no other route exists.
- Sites with a strong native dark mode get token remaps, not Dark Reader.
- Generated outputs are committed; hand-typed layers are acceptable.

## 6. Constraints

- Must survive distro package updates without re-patching system libraries.
- One person maintains it; no daemon or watchdog that fights user settings.
- Every colour must be a real token; no ad-hoc composites.
- Web userstyles must not break site functionality (icon fonts, editors, maps).

## 7. Artefacts (in full or exact excerpt)

### 7a. KDE colour scheme — Selection block
```ini
[Colors:Selection]
BackgroundNormal=166,201,166
BackgroundAlternate=192,227,192
ForegroundNormal=7,8,10
ForegroundActive=7,8,10
ForegroundInactive=107,114,128
ForegroundLink=137,168,137
ForegroundVisited=189,195,199
ForegroundNegative=237,37,78
ForegroundNeutral=251,191,36
ForegroundPositive=63,250,187
DecorationFocus=248,248,248
DecorationHover=192,227,192

```

### 7b. Klassy Tier C patch — polish() excerpt
```cpp
         itemView->viewport()->setAttribute(Qt::WA_Hover);
 
        // Sage Ink: selected rows no longer paint a Highlight fill
        // (drawPanelItemViewItemPrimitive, Tier C outline instead of fill),
        // but QStyledItemDelegate still draws selected text in
        // QPalette::HighlightedText unconditionally - that role stays dark
        // ink system-wide because genuinely-filled Tier A widgets (QLineEdit/
        // QTextEdit text selection) still need it there for contrast against
        // their own real sage fill. Remapping it globally would make THOSE
        // unreadable instead. Per-widget-type remap via polish() is the
        // correct fix: only QAbstractItemView's own HighlightedText becomes
        // the same as its Text role, so selected item text stays legible
        // against the item's now-unfilled background. 2026-09-04. Dolphin's
        // own file list is unaffected either way - KStandardItemListWidget
        // is not a QAbstractItemView and already uses its own textColor()
        // logic, independent of this palette role.
        QPalette itemViewPalette = itemView->palette();
        itemViewPalette.setColor(QPalette::Active, QPalette::HighlightedText, itemViewPalette.color(QPalette::Active, QPalette::Text));
        itemViewPalette.setColor(QPalette::Inactive, QPalette::HighlightedText, itemViewPalette.color(QPalette::Inactive, QPalette::Text));
        itemView->setPalette(itemViewPalette);

```

### 7c. GTK3 theme — gtk-dark.css (complete)
```css
/* Sage Ink — GTK3 theme
 * Neobrutalist ink: opaque flat surfaces, colour-as-elevation, hard offset
 * shadow (zero blur), sharp corners except deliberate pill/tag exceptions.
 * Single accent: muted sage. No frosted glass, no soft shadows, no gradients.
 *
 * Palette (from indigo-glass.tokens.toml [variants.sage]):
 *   base        #07080A   surface      #0D0D10   surface-alt  #121216
 *   sidebar     #0A0A0D   accent       #A6C9A6   accent-hi    #C0E3C0
 *   accent-alt  #89A889   text         #F8F8F8   text-muted   #6B7280
 *   negative    #ED254E   positive     #3FFABB   amber        #FBBF24
 *
 * Shadow offset is 8px (doubled from 4px 2026-08-28) — this theme renders on
 * THIS machine's own 27in 1440p monitor via native desktop apps (Dolphin,
 * GTK dialogs), the same category as Klassy/SDDM, not the "web/css viewed on
 * arbitrary screens" category that reverted to 4px.
 */

@define-color theme_bg_color #0D0D10;
@define-color theme_fg_color #F8F8F8;
@define-color theme_base_color #07080A;
@define-color theme_text_color #F8F8F8;
@define-color theme_selected_bg_color #A6C9A6;
@define-color theme_selected_fg_color #07080A;
@define-color insensitive_bg_color #0A0A0D;
@define-color insensitive_fg_color #6B7280;
@define-color insensitive_base_color #0A0A0D;
@define-color theme_unfocused_bg_color #0D0D10;
@define-color theme_unfocused_fg_color #6B7280;
@define-color theme_unfocused_base_color #07080A;
@define-color theme_unfocused_selected_bg_color #89A889;
@define-color theme_unfocused_selected_fg_color #07080A;
@define-color borders #000000;
@define-color unfocused_borders #000000;
@define-color warning_color #FBBF24;
@define-color error_color #ED254E;
@define-color success_color #3FFABB;

@define-color accent_color #A6C9A6;
@define-color accent_bg_color #A6C9A6;
@define-color accent_fg_color #07080A;
@define-color destructive_color #ED254E;
@define-color destructive_bg_color #ED254E;
@define-color destructive_fg_color #F8F8F8;

* {
  outline-width: 2px;
  /* Positive offset (was -2px, inset) - the reference's focus ring sits
     OFF the element (ring-offset-2), not overlapping its own border; an
     inset outline doubled up with the element's existing border-2 and
     read as one much thicker band. */
  outline-offset: 2px;
  /* White (was @accent_color, then briefly literal black) - the
     reference's own focus ring adapts to the surface: black in light
     mode, WHITE in dark mode (--ring: oklch(100% 0 0) in .dark) - never
     literally black on a near-black theme, where it would be nearly
     invisible. This is the dark Sage Ink variant, so white. */
  outline-color: #FFFFFF;
  -gtk-icon-shadow: none;
  text-shadow: none;
  box-shadow: none;
  border-radius: 0;
}

window, .background {
  background-color: @theme_bg_color;
  color: @theme_fg_color;
}

/* === Buttons — opaque flat fill, hard offset shadow, sharp corners ===
 * Border is 2px (neobrutalism.dev reference: border-2 on every shadow-
 * bearing surface, no exceptions) — was 1px, mismatched against the
 * shadow it's meant to silhouette. */
button {
  background-color: #121216;
  color: @theme_fg_color;
  border: 2px solid @borders;
  border-radius: 0;
  box-shadow: 4px 4px 0 0 rgba(137, 168, 137, 0.9);
  padding: 5px 12px;
  transition: none; /* mechanical: no eased hover fade */
}
button:hover {
  background-color: #191c1e;
  border-color: @accent_color;
}
button:active, button:checked {
  box-shadow: 0 0 0 0 rgba(137, 168, 137, 0.9);
  margin: 4px 0 0 4px; /* travels into its own shadow */
}
button:disabled {
  opacity: 0.4;
  box-shadow: none;
}

/* Accent-filled widgets cast the PAGE colour, not sage. A shadow reads as a
   displaced copy of the object casting it, so it has to separate from that
   object first: sage on the sage fill measures 1.44:1, the base colour
   11.00:1. Settled 2026-09-02 — see docs/PHILOSOPHY.md "Tone context". */
button.suggested-action {
  box-shadow: 4px 4px 0 0 rgba(7, 8, 10, 0.9);
  background-color: @accent_color;
  color: @accent_fg_color;
  border-color: @accent_color;
}
button.suggested-action:hover {
  background-color: @theme_selected_bg_color;
}
button.destructive-action {
  background-color: @destructive_bg_color;
  color: @destructive_fg_color;
  border-color: @destructive_bg_color;
}
/* Circular buttons (icon-only, close/nav) are the deliberate pill exception */
button.circular, button.image-button {
  border-radius: 9999px;
  box-shadow: none;
}

/* === Entries / text fields — flat, sharp, accent focus ring not glow === */
entry {
  background-color: @theme_base_color;
  color: @theme_text_color;
  border: 1px solid @borders;
  border-radius: 0;
  box-shadow: none;
  padding: 6px 10px;
}
entry:focus {
  border-color: @accent_color;
  box-shadow: inset 0 0 0 1px @accent_color;
}
entry:disabled {
  opacity: 0.4;
}

/* === Headerbar — opaque flat, no gradient, hard bottom hairline === */
headerbar, .titlebar {
  background-color: #121216;
  color: @theme_fg_color;
  border: none;
  border-bottom: 1px solid @borders;
  box-shadow: none;
  border-radius: 0;
}
headerbar button, .titlebar button {
  box-shadow: none;
  background-color: transparent;
  border-color: transparent;
}
headerbar button:hover, .titlebar button:hover {
  background-color: alpha(@theme_fg_color, 0.08);
}

/* === Checkbuttons / radiobuttons — sharp check, radio stays circular === */
checkbutton check, radiobutton radio {
  background-color: @theme_base_color;
  border: 1px solid @borders;
  min-width: 16px;
  min-height: 16px;
}
checkbutton check {
  border-radius: 0; /* tag-step sharp, not the old rounded box */
}
radiobutton radio {
  border-radius: 9999px; /* pill exception: a radio dot IS a circle */
}
checkbutton check:checked, radiobutton radio:checked {
  background-color: @accent_color;
  border-color: @accent_color;
  color: @accent_fg_color;
}
checkbutton check:hover, radiobutton radio:hover {
  border-color: @accent_color;
}

/* === Switches — pill track (deliberate exception), sharp knob === */
switch {
  background-color: #191c1e;
  border: 1px solid @borders;
  border-radius: 9999px;
  box-shadow: none;
}
switch:checked {
  background-color: @accent_color;
  border-color: @accent_color;
}
switch slider {
  background-color: @theme_fg_color;
  border-radius: 9999px;
  box-shadow: 2px 2px 0 0 rgba(137, 168, 137, 0.9);
}

/* === Notebook / tabs — sharp, hard bottom rule on active tab === */
notebook > header {
  background-color: #0A0A0D;
  border: none;
  box-shadow: none;
}
notebook > header tab {
  background-color: transparent;
  color: @theme_unfocused_fg_color;
  border: none;
  border-radius: 0;
  padding: 8px 14px;
}
notebook > header tab:checked {
  color: @theme_fg_color;
  border-bottom: 2px solid @accent_color;
  box-shadow: none;
}
notebook > header tab:hover {
  color: @theme_fg_color;
}

/* === Popovers / menus — opaque flat, hard offset shadow, sharp corners ===
 * Border 2px (was 1px) — shadow-bearing surfaces take border-2 per the
 * neobrutalism.dev reference, so the border reads as the shadow's own
 * silhouette rather than a thin unrelated outline. */
popover, popover.background {
  background-color: #121216;
  color: @theme_fg_color;
  border: 2px solid @borders;
  border-radius: 0;
  box-shadow: 4px 4px 0 0 rgba(137, 168, 137, 0.9);
}
menu, .menu, .context-menu {
  background-color: #121216;
  color: @theme_fg_color;
  border: 2px solid @borders;
  border-radius: 0;
  box-shadow: 4px 4px 0 0 rgba(137, 168, 137, 0.9);
  padding: 4px;
}
menuitem, modelbutton {
  border-radius: 0;
  padding: 6px 10px;
  transition: none;
}
/* Outline, not a solid accent fill (was background-color: alpha(@accent_color,
   1) - a menu item's hover IS its on-select state, same as every other
   on-select fix this session, not a casual list-row hover preview). Inset,
   not detached: menu items sit flush with no gap. */
menuitem:hover, modelbutton:hover {
  outline: 2px solid #FFFFFF;
  outline-offset: -2px;
  color: @theme_text_color;
}

/* === Lists / rows — flat, accent selection fill, no glow === */
list, treeview {
  background-color: @theme_base_color;
  color: @theme_text_color;
}
row, treeview row {
  border-radius: 0;
  transition: none;
}
/* Tier C outline via box-shadow, not the `outline` property — see the file
   list rule above for why. The ring reuses @theme_text_color rather than a
   literal #FFFFFF: the reference schema's --ring is oklch(100% 0 0), which
   Sage Ink resolves to the `text` token (#F8F8F8, near-white) everywhere
   else — this file had it as pure white with no token behind it. */
row:selected, treeview row:selected {
  background-color: transparent;
  color: @theme_text_color;
  box-shadow: inset 0 0 0 2px @theme_text_color;
}
row:hover:not(:selected), treeview row:hover:not(:selected) {
  background-color: alpha(@theme_fg_color, 0.06);
}

/* === Scrollbars — sharp, flat, accent thumb === */
scrollbar {
  background-color: transparent;
}
scrollbar slider {
  background-color: alpha(@theme_fg_color, 0.2);
  border-radius: 0;
  min-width: 8px;
  min-height: 8px;
}
scrollbar slider:hover {
  background-color: @accent_color;
}

/* === Progress bars / scales — sharp, flat, accent fill === */
progressbar > trough {
  background-color: #191c1e;
  border-radius: 0;
}
progressbar > trough > progress {
  background-color: @accent_color;
  border-radius: 0;
}
scale > trough {
  background-color: #191c1e;
  border-radius: 0;
  min-height: 4px;
}
scale > trough > highlight {
  background-color: @accent_color;
  border-radius: 0;
}
scale > slider {
  background-color: @theme_fg_color;
  border-radius: 9999px; /* pill exception: a slider handle IS a circle */
  box-shadow: 2px 2px 0 0 rgba(137, 168, 137, 0.9);
}

/* === Tooltips — opaque flat, hard offset shadow (no soft glow) ===
 * Border 2px (was 1px) — shadow-bearing, same rationale as popover/menu
 * above. */
tooltip, tooltip.background {
  /* #121216, not #191c1e — Qt/Klassy tooltips and the Plasma QML tooltip
     (widgets/tooltip.svg, fill: currentColor) both render the tooltip on
     surface-alt. GTK was the only surface using a lighter fill. */
  background-color: #121216;
  color: @theme_fg_color;
  border: 2px solid @borders;
  border-radius: 0;
  box-shadow: 4px 4px 0 0 rgba(137, 168, 137, 0.9);
  padding: 4px 8px;
}

/* === Dialogs — opaque flat, sharp corners === */
dialog, .dialog-vbox, messagedialog {
  background-color: @theme_bg_color;
  color: @theme_fg_color;
  border-radius: 0;
  box-shadow: none;
}

/* === Sidebar / panes — structural chrome === */
.sidebar, placessidebar {
  background-color: #0A0A0D;
  color: @theme_fg_color;
  border-right: 1px solid @borders;
}

/* === Frames / cards — opaque flat, hard shadow when it reads as elevated ===
 * Plain frame stays hairline (no shadow); frame.card steps up to border-2
 * to match its shadow, per the neobrutalism.dev reference. */
frame {
  border: 1px solid @borders;
  border-radius: 0;
  box-shadow: none;
}
frame.card {
  background-color: #121216;
  border-width: 2px;
  box-shadow: 4px 4px 0 0 rgba(137, 168, 137, 0.9);
}

/* === Selection / text === */
selection, *:selected {
  background-color: @accent_color;
  color: @accent_fg_color;
}

/* === GTK3 file chooser — the portal's Open/Save dialog =====================
 * xdg-desktop-portal-gtk links libgtk-3 (no libadwaita), so this dialog is
 * the one GTK surface in the system that IS fully themeable — it is what
 * MS Edge gets, since FileChooser is routed to the gtk backend deliberately
 * (KDE's picker sorts listings wrongly for Edge).
 *
 * GTK3's file list and places sidebar are GtkTreeViews, whose rows are `.view`
 * cells — NOT the `row` nodes GtkListBox uses. The generic `row:selected` rule
 * above therefore never matched here, and selection fell through to GTK's
 * default fill: theme_selected_bg_color (pale sage) under white text, ~1.9:1.
 * That is the "no contrast" this section fixes. */

.view,
treeview.view {
  background-color: @theme_base_color;
  color: @theme_text_color;
}

/* Tier C (docs/STATE_GRAMMAR.md): on-select is outline, not fill. `outline`
   itself does not render here — verified empirically (offscreen, with
   SELECTED|FOCUSED forced directly): zero white pixels on both GtkListBox
   rows and GtkTreeView cells. `box-shadow: inset` is the real mechanism and
   is the standard workaround other GTK3 themes use for this exact gap;
   verified rendering on both widget types. A fill was tried and reverted
   2026-09-04 — Dolphin's own selection reads as low-contrast in practice
   (KItemListView blends Highlight with alpha rather than using the flat
   11.0:1 [Colors:Selection] pair), so fill is not actually the safer choice
   either; outline is correct on both counts. */
.view:selected,
.view:selected:focus,
.view:selected:hover,
treeview.view:selected,
treeview.view:selected:focus,
treeview.view:selected:hover {
  background-color: transparent;
  background-image: none;
  color: @theme_text_color;
  box-shadow: inset 0 0 0 2px @theme_text_color;
}

treeview.view:hover:not(:selected) {
  background-color: alpha(@theme_fg_color, 0.06);
}

/* Column headers — flat, sharp, hard hairline under the row */
treeview.view header button {
  background-color: #121216;
  color: @theme_fg_color;
  border: none;
  border-bottom: 1px solid @borders;
  border-radius: 0;
  box-shadow: none;
  padding: 6px 10px;
}
treeview.view header button:hover {
  background-color: #191c1e;
  color: @accent_color;
}

/* Places sidebar — structural chrome, same ink as the pane behind it */
placessidebar,
placessidebar .view,
placessidebar treeview.view {
  background-color: #0A0A0D;
  color: @theme_fg_color;
}
/* Same on-select language as the file list. */
placessidebar .view:selected,
placessidebar treeview.view:selected,
placessidebar list row:selected,
placessidebar row:selected {
  background-color: transparent;
  background-image: none;
  color: @theme_text_color;
  box-shadow: inset 0 0 0 2px @theme_text_color;
}

/* Path bar — the breadcrumb buttons carry no shadow; they are chrome inside
   the dialog, not elevated surfaces sitting on top of it. */
.path-bar button,
pathbar button {
  background-color: #121216;
  border: 1px solid @borders;
  border-radius: 0;
  box-shadow: none;
  padding: 4px 10px;
}
.path-bar button:checked,
pathbar button:checked {
  background-color: #191c1e;
  border-color: @accent_color;
  color: @theme_fg_color;
}

/* The dialog's own surfaces */
filechooser,
filechooser .view,
filechooser stack {
  background-color: @theme_base_color;
}
filechooser paned > separator {
  background-color: @borders;
}
```

### 7d. klassyrc (complete, comments stripped)
```ini
[ButtonBehaviour]
ShowBackgroundNormallyActive=true
ShowBackgroundNormallyInactive=true
ShowCloseBackgroundNormallyActive=true
ShowCloseBackgroundNormallyInactive=true
ShowCloseIconNormallyActive=false
ShowCloseIconNormallyInactive=false
ShowCloseOutlineNormallyActive=true
ShowCloseOutlineNormallyInactive=true
ShowIconNormallyActive=false
ShowIconNormallyInactive=false
ShowOutlineNormallyActive=true
ShowOutlineNormallyInactive=true
UnisonHovering=true
VaryColorCloseBackgroundActive=Opaque
VaryColorCloseBackgroundInactive=Opaque
VaryColorCloseOutlineActive=Opaque
VaryColorCloseOutlineInactive=Opaque

[ButtonColors]
ButtonBackgroundColorsActive=AccentTrafficLights
ButtonBackgroundColorsInactive=AccentTrafficLights
ButtonBackgroundOpacityActive=100
ButtonBackgroundOpacityInactive=100
ButtonOverrideColorsActiveApplicationMenu={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveClose={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveContextHelp={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveKeepAbove={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveKeepBelow={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveMaximize={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveMenu={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveMinimize={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveOnAllDesktops={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsActiveShade={"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveApplicationMenu={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveClose={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveContextHelp={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveKeepAbove={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveKeepBelow={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveMaximize={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveMenu={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveMinimize={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveOnAllDesktops={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsInactiveShade={"BackgroundNormal":["TitleBarTextAuto",8],"OutlineHover":[10,0,0,0],"OutlineNormal":[10,0,0,0],"OutlinePress":[10,0,0,0]}
ButtonOverrideColorsLockStatesActive=["OutlineNormal","OutlineHover","OutlinePress"]
ButtonOverrideColorsLockStatesInactive=["BackgroundNormal","OutlineNormal","OutlineHover","OutlinePress"]
CloseButtonIconColorActive=AsSelected
CloseButtonIconColorInactive=AsSelected
LockButtonColorsActiveInactive=false
OnPoorIconContrastActive=Nothing
OnPoorIconContrastInactive=Nothing

[ButtonSize]
ButtonSize=Tiny

[ButtonSizing]
ButtonCustomCornerRadius=1
ButtonSpacingLeft=4
ButtonSpacingRight=4
FullHeightButtonSpacingRight=4
IntegratedRoundedRectangleBottomPadding=0
LockButtonSpacingLeftRight=true
LockFullHeightButtonSpacingLeftRight=true

[Global]
LookAndFeelSet=org.kde.breezedark.desktop
RefreshedConfig=6.5.3

[Style]
MenuOpacity=100

[TitleBarOpacity]
ActiveTitleBarOpacity=100
InactiveTitleBarOpacity=100
OpaqueMaximizedTitleBars=true

[TitleBarSpacing]
PercentMaximizedTopBottomMargins=100
TitleBarLeftMargin=8
TitleBarRightMargin=8

[Windeco]
BoldButtonIcons=BoldIconsBold
BoldTitle=false
ButtonIconStyle=StyleSystemIconTheme
ButtonShape=ShapeSmallCircle
ColorizeWindowOutlineWithButton=false
DrawTitleBarSeparator=false
IconSize=IconDefault
MatchTitleBarToApplicationColor=true
SystemIconSize=SystemIcon12
TitleAlignment=AlignCenter
WindowCornerRadius=0
useTitleBarColorForAllBorders=true

[ShadowStyle]
ShadowSize=ShadowSmall
ShadowStrength=255
ShadowColor=137, 168, 137

[Exceptions]
OpaqueTitleBar=true
```

### 7e. Edge theme manifest.json (complete)
```json
{
  "manifest_version": 3,
  "name": "Sage Ink — Edge Theme",
  "short_name": "Sage Ink",
  "version": "1.3.1",
  "description": "Aligns Edge chrome (frame, toolbar, tabs, NTP) to Sage Ink tokens. Eliminates the color seam between Klassy/KWin titlebar and Edge nav bar.",
  "author": "John Rebellion",
  "theme": {
    "colors": {
      "frame":                     [18, 18, 22],
      "frame_inactive":            [13, 13, 16],
      "frame_incognito":           [10, 10, 13],
      "frame_incognito_inactive":  [7, 8, 10],

      "toolbar":                   [18, 18, 22],
      "toolbar_text":              [248, 248, 248],

      "tab_text":                  [248, 248, 248],
      "tab_background_text":       [165, 169, 178],
      "tab_background_text_inactive": [120, 122, 130],

      "bookmark_text":             [248, 248, 248],

      "omnibox_background":        [7, 8, 10],
      "omnibox_text":              [248, 248, 248],

      "button_background":         [18, 18, 22]
    },
    "tints": {
      "buttons":           [0.33, 0.38, 0.82],
      "frame":             [-1, -1, -1],
      "background_tab":    [-1, -1, -1]
    }
  }
}
```

### 7f. Stylus site-style pattern (GitHub, radius section excerpt)
```css
    --button-default-bgColor-rest: #121216 !important;
    --button-default-fgColor-rest: #F8F8F8 !important;
    --button-default-borderColor-rest: #1C1C1E !important;
    --button-danger-fgColor-rest: #ED254E !important;
    --button-danger-bgColor-rest: #121216 !important;

    /* ─── Radius ───────────────────────────────────────────────────────────
     * Primer has exactly five radius tokens. --borderRadius-full is left
     * alone: it is what keeps avatars and the notification dot round. */
    --borderRadius-small: 0 !important;
    --borderRadius-medium: 0 !important;
    --borderRadius-default: 0 !important;
    --borderRadius-large: 0 !important;

    /* ─── Elevation ────────────────────────────────────────────────────────
     * Sage Ink has no soft shadow; depth is a border or nothing. */
    --shadow-resting-small: none !important;
    --shadow-resting-medium: none !important;
    --shadow-floating-small: none !important;
    --shadow-floating-medium: none !important;
    --shadow-floating-large: none !important;
  }

  /* Code blocks, the copy button and the issue-label tokens hardcode a 6px
   * radius instead of reading --borderRadius-medium (caught by a live audit
   * of a repo README). */
  pre,
  code,
  .blob-wrapper,
  clipboard-copy.btn,
  .btn,
  .Box,
  .prc-Token-TokenBase-te5-F {
    border-radius: 0 !important;
  }

```

## 8. Questions

1. **M1, QML selected text.** Given §3 and §5, what is the most robust fix
   that does not patch Kirigami/qqc2? Candidates we see: (a) set
   `[Colors:Selection] ForegroundNormal` to text and accept that real sage
   fills (text selection in QLineEdit, Kirigami's filled selections) lose
   contrast unless Klassy repaints them; (b) a Klassy-side remap reachable by
   QML items; (c) something else. Which breaks least, and what exactly will it
   break?
2. **Web pages (M9).** Should the per-site styles add neobrutalist 2px
   `border_strong` borders and 4px hard shadows to buttons, inputs and cards?
   Or should web stay "retint + flatten" because site DOMs are hostile? If yes,
   what is the minimum selector surface per design system (Primer, Codex,
   Fluent v9, Material 3) that won't break functionality?
3. **Edge (M6/M7).** Is pre-compensating the manifest for Edge's lift sound, or
   will Edge's transform change between versions/profiles? Should NTP get
   `ntp_background` = base given no photo is shown? Anything else in the
   manifest you would change for grammar fidelity?
4. **Klassy titlebar buttons (M10).** What configuration best matches the
   grammar within Klassy's stock options (shape, colour source, icon style),
   without the traffic-light palette?
5. **GTK (M2–M5).** Beyond fixing those, what in the complete gtk-dark.css
   still violates the grammar or is missing compared with a well-built
   neobrutalist GTK3 theme (menus, popovers, tooltips, notebooks, lists,
   scrollbars, headerbars, dialogs)? For GTK4/libadwaita, what is the realistic
   ceiling of a `gtk.css` override versus shipping a GTK4 theme?
6. **Firefox (M8).** Worth a layer at all for a rarely used browser? If yes,
   minimum viable approach.
7. **What is missing** that a faithful neobrutalist desktop has and this one
   lacks entirely?
8. **Which current decision in §5 or §3 is actively harmful**, as opposed to
   merely suboptimal?
9. **What measurement would change your answer** to any of the above?

## 9. Response format (exact skeleton — keep headings)

```
## Q1 QML selected text
Recommendation: …
Breaks: …
## Q2 Web pages
…
## Q3 Edge
…
## Q4 Klassy buttons
…
## Q5 GTK
Findings (one per line: selector | violation | fix):
…
GTK4 ceiling: …
## Q6 Firefox
…
## Q7 Missing
…
## Q8 Harmful decisions
…
## Q9 Measurements that would change my answer
…
## Ranked top 5 changes
1. … (impact, effort, risk)
## Confidence and caveats
Where you are guessing. What you would need to see to be sure. Say plainly if
a question was underspecified — do not invent detail to fill the format.
```

Do not soften findings to be agreeable — a second model is being asked the
same questions independently for exactly that reason.
