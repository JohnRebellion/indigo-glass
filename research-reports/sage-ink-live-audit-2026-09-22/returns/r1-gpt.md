## Q1 QML selected text

Recommendation: **Do not take (a) globally, and do not expect (b) to be solvable cleanly inside Klassy alone.** The least-bad robust architecture is to preserve the semantic distinction between `Highlight` and `HighlightedText`, and fix the **QML/Quick side of that boundary** rather than corrupting the global palette.

Qt explicitly treats `Highlight` and `HighlightedText` as a paired selection palette, and Qt Quick exposes both through `SystemPalette`. A Qt Quick application using `org.kde.desktop` deliberately reuses the application's QStyle for much of its control rendering, but the QML scene itself is still a different rendering layer. ([Qt Documentation][1])

Concretely, the failure is not really “Klassy cannot draw the outline”; it is **the selected QML text consuming the global `HighlightedText` role even though Tier C has removed the corresponding fill**.

So my order is:

**1. Preferred:** a tiny **QML-side palette/style override mechanism** that changes the selected-item text color to `Text` only for the Tier-C controls. This could be upstream app code, a local QML style override, or an application-specific override where available.

**2. Second-best:** a **Klassy/QApplication-level hook** that changes the palette only when it can positively identify the relevant Quick control path. I would not build the system around this until you verify the actual QML object/style path in System Settings. QStyle's normal widget polishing is fundamentally a `QWidget` mechanism; your existing `QAbstractItemView` trick works precisely because those objects are QWidget-side objects. ([Qt Documentation][2])

**3. Last resort:** set `[Colors:Selection] ForegroundNormal` to `#F8F8F8`.

Breaks: **(a) is visually correct for Tier C and globally wrong for filled selections.** `QLineEdit`/`QTextEdit` selection uses the `HighlightedText` role against the `Highlight` fill; Qt documents those as the paired selected-item roles. ([Qt Documentation][1]) With `HighlightedText=#F8F8F8` and `Highlight=#A6C9A6`, your own measured contrast problem comes back immediately.

So I would **not sacrifice native text-selection semantics to fix a single QML state**.

There is one interesting “something else” worth testing before patching qqc2: **whether the offending System Settings sidebar is consuming `Kirigami.Theme.highlightedTextColor` directly or resolving it through `SystemPalette.highlightedText`.** If it is the former, a narrowly-scoped Kirigami theme property override may be enough; if it is the latter, you are back at the palette-boundary problem.

The decisive probe is simple: inspect the selected label's effective `color`, the nearest `Kirigami.Theme` values, and `SystemPalette.highlightedText` simultaneously. I would not change the global KDE selection pair until that probe exists.

## Q2 Web pages

**Recommendation: split “border fidelity” from “shadow fidelity.”**

Add the **2px `border_strong`** treatment to stable, semantic component roots. Do **not** blanket-add 4px hard shadows to every button, input and card.

Your current M9 is too flat to be faithful: removing all site shadows plus retaining arbitrary 1px borders means you have effectively implemented **“dark recolor + square corners”**, not the reference grammar.

But a universal:

```css
button, input, textarea, select, div, section, ...
```

is exactly the kind of userstyle that eventually eats an editor, map, code viewer, dropdown, or nested layout.

The sane rule is:

**2px border:** broadly apply to known component roots.

**4px shadow:** apply only to things that are actually elevated in the reference grammar: buttons, cards, menus/popovers/dialogs, and other intentional surfaces. Primer's own documentation describes box shadow as an elevation mechanism primarily for elevated/overlapping content, which is much closer to this distinction than “everything gets a shadow.” ([primer.style][3])

For the four design systems:

**Primer:** target `.Button` / its documented variants and `.Box` / `Box-*`, plus the actual form-control roots used by the page. These are stable semantic classes rather than generic tags; current Primer examples explicitly expose `.Button` and `.Box`. ([primer.style][4])
Minimum surface: **Button, Box/card, text controls, popover/dialog roots.**

**Codex:** this is the nicest case. Use `.cdx-button`, `.cdx-card`, and the concrete `.cdx-*` form/control classes actually present. Codex explicitly exposes CSS-only semantic classes such as `.cdx-button` and `.cdx-card`. ([doc.wikimedia.org][5])
Minimum surface: **button, card, text-entry controls, select, popover/dialog.**

**Fluent v9:** **prefer token overrides over selector spraying.** Fluent's token set already exposes semantic color, stroke-width, border-radius, and shadow tokens, including `colorNeutralStroke*`, `borderRadius*`, and `shadow*`. ([GitHub][6]) Override the semantic tokens that the site actually consumes; only add component selectors where the site has escaped the token system.

**Material 3:** this is the underspecified one. “Material 3” is a design system, not one universal web DOM. If your site uses Material Web Components, target the actual `md-*` hosts/parts; if it uses Angular Material or a custom implementation, the selector surface is different. I would **not invent a generic Material selector layer** without seeing one of your actual sites.

One more important change: your current site styles are missing a **site-level state contract**. You have radius and shadow flattening, but you need explicit handling for `:hover`, `:focus-visible`, `:active`, `[aria-selected]`, `[aria-current]`, disabled, invalid and checked states. Otherwise you get a square UI whose state language is still the site's original system.

And for the 2px borders, use `box-sizing:border-box` only where the site already behaves compatibly with it; otherwise the 2px border can change intrinsic geometry. The safer strategy is to test each component class with a screenshot/layout diff rather than assuming border inflation is harmless.

## Q3 Edge

**The pre-compensation is sound as an empirical fit, not as a permanent invariant.**

Chromium's theme system explicitly applies theme colors and tints through a later normalization/build stage; tints are HSL transformations rather than raw RGB passthrough. The current source also exposes `frame`, `toolbar`, `ntp_background`, `ntp_header`, `ntp_link`, `ntp_text`, `omnibox_background`, etc. as separate theme inputs. ([Chromium Git Repositories][7])

So your measured channel-transfer curve is useful, but I would treat it as:

**“Edge version X on profile Y” calibration**, not a token invariant.

What I would change now:

`buttons: [0.33, 0.38, 0.82]` → **`[-1, -1, -1]`** unless you have a specific screenshot proving you need that tint. Chromium documents tints as transformations, and you already want exact opaque colors. Having one arbitrary active tint in an otherwise pre-compensated manifest is internally inconsistent. ([Chromium Git Repositories][7])

`ntp_background` → **yes, set it to base `[7,8,10]`**.

Also set:

* `ntp_text` → text
* `ntp_link` → accent-hi or accent-alt
* `ntp_header` → surface-alt or border context

Those keys are explicitly supported in the current Chromium theme map. ([Chromium Git Repositories][7])

That gives you an intentional NTP instead of accepting Edge's fallback `#363636`.

The white pill search box is the more important M7 problem, though: setting `ntp_background` fixes the page field but **does not guarantee the NTP search control will inherit your desired geometry**. That is an Edge-owned component, so measure its actual rendered fill/border/radius after the change.

I would also pre-compensate **only the colors you have measured**. Don't extrapolate your 0–48 nonlinear curve into a universal inverse LUT for the whole manifest. Chromium's theme pipeline treats normal colors, generated colors and tints differently. ([Chromium Git Repositories][7])

## Q4 Klassy buttons

**Recommendation: stop using `AccentTrafficLights`; use a neutral full-height rectangular treatment.**

Klassy exposes both **Full-height Rectangle** and **Circular** button shapes, plus configurable button colors, outlining, system icon style and system-derived highlighting. ([GitHub][8])

For your grammar, the important choices are:

```ini
ButtonShape=ShapeFullHeightRectangle
ShowBackgroundNormallyActive=false
ShowBackgroundNormallyInactive=false
ShowOutlineNormallyActive=true
ShowOutlineNormallyInactive=true
WindowCornerRadius=0
```

Then use a **single neutral titlebar/text-derived color source** rather than traffic-light colors. Keep icon rendering tied to the system icon theme:

```ini
ButtonIconStyle=StyleSystemIconTheme
```

That is preferable to introducing Fluent/Redmond/other foreign icon geometry merely to solve the color problem.

I would also keep:

```ini
VaryColorBackgroundActive=Opaque
VaryColorBackgroundInactive=Opaque
VaryColorOutlineActive=Opaque
VaryColorOutlineInactive=Opaque
```

The key visual result should be **small rectangular controls with monochrome iconography and an explicit state outline**, rather than red/amber/green circles.

I am deliberately not giving you a supposedly exact `ButtonBackgroundColorsActive=...` value here: Klassy's current public documentation describes the capabilities but does not give a complete authoritative enum-to-rendering table for every color-source option. The exact source mapping in your installed Klassy build is therefore something I would verify from its preset/config metadata before hard-coding it. ([GitHub][8])

## Q5 GTK

Findings (one per line: selector | violation | fix):
`@borders`, `@unfocused_borders` | `#000000` is effectively invisible against your ink surfaces | map both to `border_strong` `#5E5E60`
`button`, `popover`, `menu`, `tooltip`, `frame.card` | shadows are translucent `rgba(...,0.9)` | use opaque token colors directly; no alpha
`entry` | 1px border | 2px `border_strong`
`checkbutton check`, `radiobutton radio` | 1px border | 2px `border_strong`
`switch` | 1px border | 2px `border_strong`
`switch slider`, `scale > slider` | shadow geometry/color is not the stated 4px hard-shadow rule and uses alpha | remove it unless the reference explicitly shows a shadow; otherwise use the canonical 4px opaque shadow
`switch` | literal `#191c1e` violates the token-only rule | replace with an existing token, probably `surface_alt`
`progressbar > trough`, `scale > trough` | literal `#191c1e` | replace with token
`button:hover`, `treeview.view:hover`, `row:hover:not(:selected)` | `alpha(...)` hover wash violates opaque-flat rule | use an opaque token state surface
`scrollbar slider` | `alpha(@theme_fg_color,0.2)` violates opaque/no-composite rule | use `border_strong` or `text_muted`
`button:disabled`, `entry:disabled` | `opacity:0.4` is translucency, not an opaque token state | explicit muted fill/text tokens; no opacity
`button:active`, `button:active` layout | 4px margins alter widget layout/reflow | if the visual spec requires travel, use a paint/transform mechanism rather than margin-based geometry
`entry:focus` | accent inset line, not a 2px text-colour focus ring | use a 2px `text`-coloured outer ring
global `outline-color:#FFFFFF` | pure white is not a token | use `text` `#F8F8F8`
`notebook > header tab:checked` | only a 2px accent bottom rule; target says selected tab gets a 2px outline | replace with full 2px text-colour outline
`*:selected` | broad selector reintroduces filled selection semantics outside the carefully scoped Tier-C rules | delete it; keep explicit widget-specific selection selectors
`selection` | fine for text selection, but currently coupled with broad `*:selected` | keep `selection` separately
`path-bar button`, `pathbar button` | 1px border on a control | 2px border
`button.image-button` | indiscriminately grants circular geometry to every image button, potentially beyond your defined circle exceptions | constrain to actual icon-only cases if GTK apps expose a safer node/class
`destructive-action` | inherits the generic sage shadow despite being a different fill identity | explicitly specify the shadow token appropriate to negative-filled surfaces, or define this rule in the grammar instead of inheriting accidentally
headerbar hover buttons | `alpha(fg,0.08)` translucent wash | opaque token state, or explicit outline state
sidebar/header separators | hard-coded/black 1px structural lines | use `border_strong` when the line is intended as visible structure

GTK3 itself gives you the machinery you need: CSS supports `box-shadow`, pseudo-classes and widget-specific CSS nodes, so this is a **real theme-engineering problem, not a GTK3 capability ceiling**. ([https://docs.gtk.org][9]) GTK's documented node trees also confirm that `GtkEntry`, `GtkSwitch`, `GtkNotebook`, menus and scales expose reasonably targeted nodes rather than forcing you into tag-wide guesses. ([https://docs.gtk.org][10])

One particularly important point: your complete CSS is actually **closer than M2–M5 make it look**. The menu/popover/tooltip/card architecture is conceptually right. The remaining damage is mostly that the implementation repeatedly violates your own “opaque token” contract.

The `#191c1e` and `alpha(...)` cases are not harmless implementation details anymore. They are exactly the class of drift your current guard does not catch.

GTK4 ceiling: **roughly “excellent retinting and geometry normalization, incomplete component replacement.”**

A user `gtk.css` can override a substantial amount of GTK4 appearance, but libadwaita applications are not simply consuming one global theme package. Libadwaita documents its own style manager, CSS variables and application-loaded additional styles; applications can also have custom drawing that needs its own styling. ([GNOME Pages][11])

So:

**GTK4 `gtk.css` can reliably get you:** palette, many radii, many borders, many backgrounds, some focus/hover states, some shadows, some spacing.

**It cannot reliably guarantee:** every libadwaita composite widget, every custom-drawn surface, every internal node, or future widget structure.

Shipping a “GTK4 theme package” does **not** magically solve this. For libadwaita-heavy apps, the application and libadwaita stylesheet remain the real authority. The realistic ceiling for one-person maintenance is therefore **strong visual convergence, not exact component equivalence**.

## Q6 Firefox

**Yes, but only as a tiny chrome layer.**

For a rarely used browser, I would not build a second Edge-style system.

Use Firefox's supported theme-color surface for the browser frame, toolbar, tabs, URL bar and field states. Firefox's theme API exposes dedicated colors for frame, toolbar, selected-tab text, toolbar fields, field borders/focus, and URL-bar selection. ([MDN Web Docs][12])

That means you can get most of the value with one small static theme definition:

* frame/base
* toolbar/surface
* active/inactive tab text
* omnibox/toolbar field
* toolbar-field border
* focus border
* selected-text pair

I would **not** start with `userChrome.css`. Mozilla explicitly says these customizations are unsupported and warns that browser UI structure can change across updates. ([Mozilla Support][13])

Your Stylus page layer can remain the page layer.

## Q7 Missing

The largest missing pieces are **surfaces, not more CSS selectors**.

You have no demonstrated fidelity layer for:

**Plasma shell:** panel, launcher, system tray popup, notifications, OSDs, widget chrome, KRunner, lock screen.

**System overlays:** clipboard popup, screen-capture UI, authentication dialogs, transient action banners, drag-and-drop indicators.

**Web state surfaces:** dialogs, popovers, context menus, dropdowns, toasts, validation states, checked/selected/disabled states, loading/progress controls. Your current M9 work is disproportionately focused on radius and base elevation.

**GTK4/libadwaita:** currently the weakest major desktop family by architecture, not just implementation.

**Application ecosystems outside the named stack:** Electron apps, Chromium/Electron shells, Java/JavaFX if encountered, SDL/game launcher UIs, and anything that bypasses GTK/Qt theming.

**Iconography:** the brief defines color/geometry extremely well but doesn't specify an equivalent system-wide icon grammar. That may already be handled elsewhere, but I cannot infer it from this material.

**Typography and spacing:** same issue. They may exist in the repository, but this brief does not establish a target type/spacing spec, so I would not call them missing from the system itself.

There is also a more structural omission: **there is no explicit “surface contract” for z-order/elevation.** You have a shadow color and offset, but not a documented matrix saying which classes are elevated, which are structural, and which are flat. That is why different layers are starting to improvise.

## Q8 Harmful decisions

The actively harmful decision is **“hand-typed layers are acceptable” combined with a drift guard that checks stale hex values only.**

That is producing false confidence.

Your measured failures are precisely things a hex-only guard will miss:

* `rgba(...,0.9)`
* `alpha(...)`
* `opacity:0.4`
* `1px` instead of `2px`
* `#000000` where a semantic border token was intended
* `#191c1e` as an invented color
* `#FFFFFF` where `text` is the token
* incorrect shadow geometry
* selectors that reintroduce the wrong state grammar

The repository can therefore be “green” while visibly violating its own design contract.

That is materially worse than merely having some hand-typed CSS.

The next most questionable decision is **“avoid patching qqc2 unless necessary.”** That's a good maintenance preference, but it becomes harmful if interpreted as “there must be a non-qqc2 solution.” Q1 is the case where the architecture may simply not expose the needed semantic distinction. A small, isolated downstream qqc2 patch may be less harmful than permanently poisoning `[Colors:Selection]` for every toolkit.

I would **not** classify the other §5 decisions as actively harmful. The no-blur rule, radius rule, accent-as-fill rule and native-dark-mode strategy are coherent.

## Q9 Measurements that would change my answer

**Q1:** dump the actual effective colors for the offending QML selected label: `Kirigami.Theme.textColor`, `Kirigami.Theme.highlightedTextColor`, `SystemPalette.text`, `SystemPalette.highlightedText`, plus the corresponding QML object/style type. That tells us whether this is palette-level or control-level and whether a Klassy-side hook can realistically reach it.

**Q2:** take DOM inventories for one real site from each design system and list the actual stable component roots. I would then measure screenshot diffs with four variants: current, border-only, shadow-only, and border+shadow. A single percentage of changed pixels isn't enough; I care about layout shift, clipping and component breakage.

**Q3:** record the exact Edge version, channel and profile, then repeat the color-transfer calibration after toggling the `buttons` tint off. Repeat on a newer Edge build before treating the inverse mapping as durable.

**Q4:** export one current Klassy preset plus the exact enum/value metadata from the installed Klassy build. That would let me tell you the exact neutral color-source configuration instead of relying on documented capabilities and example presets.

**Q5:** use GTK Inspector on 3–5 representative GTK3 apps and at least 3 GTK4/libadwaita apps. The important thing is the actual CSS node tree and which rules win, especially around selection and focus.

**Q6:** the only thing that would materially change my recommendation is if Firefox is actually used often enough that its chrome mismatch bothers you regularly. Then its small native theme becomes worthwhile.

**Q7:** a screenshot matrix covering the Plasma shell/overlays would tell us whether the missing surfaces are genuinely absent or simply not included in this brief.

## Ranked top 5 changes

1. **Replace the GTK3 contract violations with opaque tokenized rules** — impact: very high, effort: low–medium, risk: low. This fixes several measured failures at once and gets GTK3 much closer without architectural surgery.
2. **Solve QML Tier-C selection at the Quick/Kirigami boundary rather than globally changing `HighlightedText`** — impact: very high, effort: medium–high, risk: medium. This is the one place where the current architecture genuinely has a semantic mismatch.
3. **Change the web layer from “flatten everything” to “semantic borders broadly, hard shadows selectively”** — impact: high, effort: medium, risk: medium. This restores the visual grammar without turning every site's DOM into a crime scene.
4. **Remove Edge's active button tint and explicitly theme the NTP** — impact: medium–high, effort: low, risk: low. Chromium's current theme pipeline makes the existing tint the odd man out. ([Chromium Git Repositories][7])
5. **Replace Klassy's traffic-light circles with neutral full-height rectangles and monochrome system icons** — impact: medium, effort: low, risk: low. The stock Klassy feature set already supports the necessary shape/configuration primitives. ([GitHub][8])

## Confidence and caveats

The **GTK, Edge, Firefox and general web conclusions are high-confidence** because the actual CSS/theme mechanisms are documented and your measured failures are concrete. Chromium's current source confirms the relevant theme color/tint pipeline and NTP keys. ([Chromium Git Repositories][7])

**Q1 is the largest uncertainty.** I am confident that a global `HighlightedText=Text` is the wrong architectural fix; I am **not** confident that Klassy itself can selectively repair the Quick-side consumer without seeing the exact QML object/control path.

**Q4 is also partly underspecified.** Klassy's public docs establish the available shape/color/icon capabilities, but not enough of the internal enum semantics to claim a particular color-source value is definitely the exact one you want in your installed build. ([GitHub][8])

The other big conclusion is slightly brutal but useful: **your system is not currently suffering from “not enough neobrutalism.” It is suffering from inconsistent enforcement of the neobrutalist contract.** The GTK file already contains most of the right structural ideas, and M9 already has the correct radius strategy. The remaining gains come from making the rules mechanically true across layers rather than adding more visual seasoning.

[1]: https://doc.qt.io/qt-6/qpalette.html?utm_source=chatgpt.com "QPalette Class | Qt GUI | Qt 6.11.2"
[2]: https://doc.qt.io/qt-6/qwidget.html?utm_source=chatgpt.com "QWidget Class | Qt Widgets | Qt 6.11.2"
[3]: https://primer.style/product/css-utilities/?utm_source=chatgpt.com "CSS Utilities | Primer"
[4]: https://primer.style/view-components/lookbook/inspect/primer/beta/button/invisible_all_visuals/?utm_source=chatgpt.com "Invisible all visuals :: Button :: Primer ViewComponents v0.53.5"
[5]: https://doc.wikimedia.org/codex/v1.18.0/components/demos/button.html?utm_source=chatgpt.com "Button | Codex"
[6]: https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/types.ts?utm_source=chatgpt.com "fluentui/packages/tokens/src/types.ts at master · microsoft/fluentui · GitHub"
[7]: https://chromium.googlesource.com/chromium/src/%2B/HEAD/chrome/browser/themes/browser_theme_pack.cc "chrome/browser/themes/browser_theme_pack.cc - chromium/src - Git at Google"
[8]: https://github.com/Bali10050/klassy "GitHub - Bali10050/klassy: Klassy is a highly customizable binary Window Decoration, Application Style and Global Theme plugin for recent versions of the KDE Plasma desktop. · GitHub"
[9]: https://docs.gtk.org/gtk3/css-properties.html?utm_source=chatgpt.com "Gtk – 3.0: CSS Properties"
[10]: https://docs.gtk.org/gtk3/class.Entry.html?utm_source=chatgpt.com "Gtk.Entry"
[11]: https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/styles-and-appearance.html?utm_source=chatgpt.com "Adw – 1: Styles & Appearance"
[12]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme?utm_source=chatgpt.com "theme - Mozilla | MDN"
[13]: https://support.mozilla.org/en-US/kb/firefox-advanced-customization-and-configuration?utm_source=chatgpt.com "Firefox advanced customization and configuration options | Firefox Help"
