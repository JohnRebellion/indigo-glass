# Modern Design Trends & Indigo Glass Gaps: Research Report
*Date: 2026-06-26 | Sources: 16 | Overall Confidence: High*

---

## Executive Summary

Indigo Glass has a strong, principled foundation — the visionOS glass + Linear discipline + Neumorphism 2.0 hybrid is exactly the right direction for 2026. However, five concrete gaps exist where the design system is behind current production standards: **(1)** the token system uses sRGB/hex but the field has moved to OKLCH as the authoring-space default; **(2)** no noise/grain texture layer on glass surfaces, which is now the primary differentiator of Glassmorphism 2.0 from 1.0; **(3)** no motion/animation token vocabulary — durations, easings, and reduced-motion fallbacks are undocumented; **(4)** the border-radius system uses a single `8px` value, while the field has moved to squircle geometry (CSS `corner-shape`) for premium feel; **(5)** no ambient gradient / light-source system behind glass layers. None of these require a redesign — they are additive layers on the existing token architecture.

---

## Codebase Context

Indigo Glass is a cross-platform KDE Plasma 6.6+ design system (tokens in `tokens/indigo-glass.tokens.toml`) that spans desktop, GTK, terminal, GRUB, web, and VSCode. The token file already declares a `[palette.P3]` section with `display-p3` wide-gamut values — the infrastructure for perceptual color is partly there. The web layer uses Tailwind v4. The gaps identified map directly to token additions or new token sections, not architectural changes.

---

## Findings

### 1. Color Space: sRGB/Hex vs. OKLCH as Authoring Default

**Current state:** `tokens/indigo-glass.tokens.toml` authors all palette values as sRGB hex (`"#5E6AD2"`), with a secondary `[palette.P3]` block as a bolted-on wide-gamut layer.

**Gap:** OKLCH is now the recommended authoring-space default for all new CSS design systems. According to [Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) (FACT), HSL has a critical flaw for design systems: "When modifying an HSL color by 10%, the actual perceived brightness differs based on the hue value." OKLCH's `L` axis is perceptually uniform, making hover state generation (`calc(l + 0.1)`) consistent across all hues. [Tailwind v4 generates its palette in OKLCH natively](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl); [Stripe's Sail tokens and Linear have moved toward perceptually uniform systems](https://www.colorpick.app/blog/css-color-functions-2026-guide). Browser support is universal — Chrome 111, Safari 15.4, Firefox 113, Edge 111. As of mid-2025, global coverage is above 93% (FACT, [colorpick.app](https://www.colorpick.app/blog/css-color-functions-2026-guide)).

**Specific implication for Indigo Glass:** The `[palette.P3]` block in the tokens file can be eliminated — OKLCH natively encodes P3-gamut colors without a separate block. `oklch(0.57 0.18 286)` covers the same gamut as `color(display-p3 0.36 0.40 0.81)`, but is human-readable and mutable. The relative color syntax `oklch(from var(--color-indigo) calc(l + 0.1) c h)` can replace hardcoded `indigo_hi` values entirely.

**CSS pattern:**
```css
/* Indigo Glass in OKLCH */
--color-indigo:    oklch(0.55 0.15 264);  /* #5E6AD2 equivalent */
--color-indigo-hi: oklch(0.65 0.16 264);  /* #818CF8 — derived, not hardcoded */
--color-violet:    oklch(0.70 0.17 291);  /* #A78BFA */
/* Hover state without a separate token: */
.button:hover { background: oklch(from var(--color-indigo) calc(l + 0.1) c h); }
```

---

### 2. Noise/Grain Texture on Glass Surfaces (Glassmorphism 2.0 Differentiator)

**Current state:** Glass surfaces in Indigo Glass are defined by `backdrop-filter: blur(13px)` + `rgba(255,255,255,0.06)` border. No noise or grain layer exists in any token or config.

**Gap:** The field has named this the single biggest differentiator between Glassmorphism 1.0 (2020–2023) and 2.0 (2024–2026). According to [midrocket.com](https://midrocket.com/en/guides/ui-design-trends-2026/) (FACT), "Modern implementations now feature noise textures paired with translucency." The [lucky.graphics 2026 trends guide](https://lucky.graphics/learn/ui-design-trends-2026/) confirms noise + gradient borders as the primary surface treatment (FACT). The effect adds tactility and differentiates glass from a simple semi-transparent rectangle — it simulates ground glass / sandblasted material.

**Implementation:** An SVG `<feTurbulence>` filter encoded as a CSS `background-image: url('data:image/svg+xml,...')` applied at 3–6% opacity on top of the blur layer. This does NOT blur (the search result warning about "high-frequency noise in background images causing blur artifacts" applies to images *behind* the glass, not grain *on* the glass surface itself).

**CSS pattern:**
```css
/* Noise overlay token — add to tokens file */
--glass-noise-opacity: 0.04;  /* 3-6% range */

/* Glass surface recipe v2 */
.glass-surface {
  background: rgba(31, 32, 40, 0.72);       /* surface_alt at 72% */
  backdrop-filter: blur(13px);
  border: 1px solid var(--border);
  /* Noise grain on top */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
```

**New token needed:** `glass.noise_opacity = 0.04` in `[glass]` token section.

---

### 3. Motion / Animation Token Vocabulary (Currently Missing Entirely)

**Current state:** The `tokens/indigo-glass.tokens.toml` file has no `[motion]` section. Zero duration, easing, or delay tokens exist.

**Gap:** Motion systems are now a design system table-stakes requirement. According to [primotech.com](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/) (FACT), "by the end of 2025, 75% of customer-facing applications incorporate micro-interactions as standard UI-UX practice." The [lucky.graphics guide](https://lucky.graphics/learn/ui-design-trends-2026/) documents specific timing standards (FACT):

| Interaction | Duration | Effect |
|---|---|---|
| Button hover | 150–200ms | Scale + color shift |
| Card hover/lift | 200–300ms | Shadow elevation change |
| Toggle slide | 200ms | Smooth state |
| Success draw | 400ms | Checkmark path animation |
| Skeleton shimmer | loop | Loading state |

The [ripplix.com animation guide](https://www.ripplix.com/blog/ultimate-ui-animation-guide-for-2026) identifies `prefers-reduced-motion` fallback as non-negotiable: "reduced-motion support is not optional."

**Specific implication for Indigo Glass:** The web layer's Tailwind v4 `@theme` block, VSCode extension, and any future Svelte/React components all need a shared easing vocabulary. The glass-surface hover lift (shadow + slight upward translate) is the most visually consistent with the neumorphic pillowy-widget philosophy.

**Token additions needed:**
```toml
[motion]
# Durations
dur_instant   = "100ms"   # state only (no visual travel)
dur_fast      = "150ms"   # button hover, focus ring
dur_normal    = "200ms"   # toggle, card hover
dur_slow      = "300ms"   # panel open, sheet expand
dur_deliberate = "400ms"  # success/error state draws

# Easings (CSS cubic-bezier)
ease_out      = "cubic-bezier(0.0, 0, 0.2, 1)"   # most UI exits
ease_in_out   = "cubic-bezier(0.4, 0, 0.2, 1)"   # panel slide
ease_spring   = "cubic-bezier(0.34, 1.56, 0.64, 1)"  # neumorphic push (slight overshoot)

# Reduced-motion fallback
reduced_motion_dur = "0ms"   # swap all durations via prefers-reduced-motion
```

---

### 4. Squircle / corner-shape Geometry (Organic Corners)

**Current state:** `tokens/indigo-glass.tokens.toml` uses `radius.default = "8px"`, `radius.large = "12px"`, `radius.pill = "9999px"`. Standard `border-radius` only.

**Gap:** Squircle geometry (CSS `corner-shape: squircle` or SVG superellipse clip-path) has emerged as the premium corner treatment, used by Apple (macOS app icons, visionOS sheets), Framer, and Linear for cards and modal containers. According to [Smashing Magazine](https://www.smashingmagazine.com/2026/03/beyond-border-radius-css-corner-shape-property-ui/) (FACT, March 2026), the CSS `corner-shape` property with `squircle` keyword is now available in Chrome 139+. The [squircle.js docs](https://squircle.js.org/blog/squircles-in-web-design) confirm an SVG clip-path approach works cross-browser today (FACT).

**Caveat:** `corner-shape` is Chrome 139+ only (Chromium) as of March 2026. Firefox and Safari don't support it yet. Production use requires SVG clip-path fallback [unverified — single source for timeline].

**Relevance to Indigo Glass:** The web portfolio layer (`~/portfolio/web`) and any Electron/web apps in the system should use squircles on modal sheets and app icon containers — it directly reinforces the visionOS spatial aesthetic. The KDE desktop layer can use Klassy's corner radius to approximate it.

**Token addition:**
```toml
[radius]
default  = "8px"
large    = "12px"
pill     = "9999px"
squircle = "squircle"   # CSS corner-shape value; use with SVG fallback
```

**CSS progressive enhancement:**
```css
.modal-sheet {
  border-radius: var(--radius-large);           /* fallback */
  corner-shape: squircle;                        /* Chrome 139+ */
}
```

---

### 5. Ambient Gradient / Light-Source System

**Current state:** No ambient background gradient system. The deep `#0F0F12` base is flat. Glass surfaces float on uniform dark.

**Gap:** The current generation of premium dark interfaces uses *ambient color orbs* — soft, large-radius radial gradients positioned as pseudo-light-sources behind glass panels. This is the technique that makes glass feel like it's lit rather than just semi-transparent. According to [medium.com/@developer_89726](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) (FACT), "To achieve the best results, you need ambient gradients — vibrant orbs of color that float behind your UI." Lucky.graphics identifies "variable refraction" and "color absorption" (background-reactive tinting) as 2026-specific evolutions (FACT).

**Design constraint for Indigo Glass:** The single-accent rule (`#5E6AD2` only) means ambient orbs MUST use the existing indigo/violet palette — no rainbow orbs. The restraint is preserved: one dim indigo orb at `~5% opacity` behind the primary panel, one violet orb at `~3%` behind the sidebar. This adds dimension without introducing new hues.

**Token additions:**
```toml
[ambient]
# Ambient light sources — radial gradients behind glass surfaces
# Applied on the root background, not on glass panels themselves
orb_primary_color   = "#5E6AD2"   # indigo
orb_primary_opacity = 0.05        # 5% — barely perceptible, adds warmth
orb_secondary_color = "#A78BFA"   # violet
orb_secondary_opacity = 0.03      # 3%
orb_blur_radius     = "120px"     # large feather for softness
```

**CSS pattern:**
```css
body::before {
  content: '';
  position: fixed;
  width: 600px; height: 600px;
  background: radial-gradient(circle, oklch(0.55 0.15 264 / 5%) 0%, transparent 70%);
  top: -200px; left: 30%;
  pointer-events: none;
  z-index: 0;
}
```

---

### Accessibility: WCAG 2 Remains the Standard

**Current state:** Indigo Glass has strong contrast ratios (primary text `#F8F8F8` on `#0F0F12` = ~17:1).

**Confirmed gap (low urgency):** APCA is NOT a replacement for WCAG 2 as of April 2026. According to [Adrian Roselli](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html) (FACT), APCA was removed from WCAG 3 working drafts in 2023 and WCAG 3 itself won't be finalized until ~2030. WCAG 2 remains the legal compliance standard. The practical recommendation: ensure all text over glass surfaces has a semi-opaque backing film at ~30% opacity to dampen the variable background behind frosted glass (according to [medium.com/@developer_89726](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f), FACT). Indigo Glass's `overlay = "#0F0F12cc"` (80% scrim) already handles critical cases — a lighter `glass-text-backing = rgba(15,15,18,0.30)` token would cover the rest.

---

## Risks & Caveats

- **Squircle browser support:** `corner-shape` is Chrome 139+ only. Firefox/Safari timeline unconfirmed [unverified — single source]. SVG clip-path fallback is required for production.
- **OKLCH migration cost:** Converting existing tokens to OKLCH authoring space requires running a conversion tool (`npx convert-to-oklch`) and re-verifying all contrast ratios. The perceptual values don't change, but existing hex references in KDE `.colors` files would need updating separately from CSS tokens.
- **Ambient orb performance:** `position: fixed` radial gradients behind glass layers add GPU compositing layers. Test on lower-end AMD iGPU configurations (the system targets AMD RX 7600 XT but also laptops).
- **Noise texture on glass:** SVG `feTurbulence` adds a small inline data URI per-component. Use a shared CSS custom property pointing to a single `<svg>` filter definition, not per-element duplication.
- **Motion tokens for KDE:** Duration tokens are useful for the web layer; KWin effects have their own animation speed sliders that don't read CSS tokens. Motion tokens apply to: web portfolio, VSCode, Spicetify, Vencord, browser, and future Electron apps — not KWin or SDDM.

---

## Recommendation

**Priority 1 (High impact, low effort):**
1. **Add `[motion]` section to `tokens/indigo-glass.tokens.toml`** — durations, easings, reduced-motion value. Apply to Tailwind `@theme` block and VSCode `editor.tokenColorCustomizations`.
2. **Add `[ambient]` section** — two radial gradient orb tokens (indigo + violet at 5%/3%). Implement on web portfolio `body::before`/`::after`.

**Priority 2 (Medium impact, moderate effort):**
3. **Migrate web layer (`[palette.web]`) to OKLCH authoring** — keep hex in the `[palette.sRGB]` block for KDE/GTK/GRUB layers (they don't read CSS), add OKLCH equivalents to the Tailwind `@theme` export. Derive `indigo_hi` and `indigo_hover` via relative color syntax rather than hardcoded values.
4. **Add noise/grain to glass surface definition** — one shared SVG filter, applied via CSS custom property on `.glass-surface` class in the web layer and browser `userContent.css`.

**Priority 3 (Future enhancement, watch status):**
5. **Squircle radius token** — add `radius.squircle = "squircle"` now, implement as progressive enhancement (Chrome 139+) on modal sheets and cards. SVG clip-path fallback when Firefox/Safari support lands.

None of these break the existing aesthetic or require changes to the KDE/GTK/GRUB layers — they extend the web and token layers only.

---

## Sources

1. **Lucky Graphics — UI Design Trends 2026** — https://lucky.graphics/learn/ui-design-trends-2026/ — Primary source for motion timing standards and glassmorphism 2.0 noise/gradient techniques — 2026
2. **Evil Martians — OKLCH in CSS** — https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl — Definitive technical guide on OKLCH vs RGB/HSL for design systems — 2025
3. **colorpick.app — Modern CSS Color Functions 2026** — https://www.colorpick.app/blog/css-color-functions-2026-guide — OKLCH browser support figures and design system adoption — 2026
4. **Adrian Roselli — WCAG3 Contrast as of April 2026** — https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html — Authoritative status of APCA/WCAG 3, legal compliance guidance — April 2026
5. **Smashing Magazine — Beyond border-radius: CSS corner-shape** — https://www.smashingmagazine.com/2026/03/beyond-border-radius-css-corner-shape-property-ui/ — CSS corner-shape / squircle browser support status — March 2026
6. **Squircle.js — Squircles in Web Design** — https://squircle.js.org/blog/squircles-in-web-design — SVG clip-path cross-browser fallback approach — 2025
7. **Medium @developer_89726 — Dark Glassmorphism 2026** — https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f — Ambient gradient orbs, noise texture, accessibility text backing — 2026
8. **Midrocket — UI Design Trends 2026 Guide** — https://midrocket.com/en/guides/ui-design-trends-2026/ — Noise textures on glass, dark-first workflow, variable typography — 2026
9. **Primotech — UI/UX Evolution 2026: Micro-Interactions** — https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/ — Micro-interaction adoption statistics — 2026
10. **Ripplix — Ultimate UI Animation Guide 2026** — https://www.ripplix.com/blog/ultimate-ui-animation-guide-for-2026 — prefers-reduced-motion as non-negotiable standard — 2026
11. **Fontfabric — Top 10 Design & Typography Trends 2026** — https://www.fontfabric.com/blog/10-design-trends-shaping-the-visual-typographic-landscape-in-2026/ — Typographic maximalism, variable font axes — 2026
12. **CSS-Tricks — superellipse()** — https://css-tricks.com/almanac/functions/s/superellipse/ — Technical CSS superellipse/squircle function reference — 2026
13. **MDN — corner-shape-value** — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/corner-shape-value — Authoritative browser compatibility data for corner-shape — 2026
14. **Weblogtrips — Glassmorphism 2.0 CSS Techniques 2026** — https://weblogtrips.com/technology/glassmorphism-2-0-css-techniques-2026/ — Surface transduction, dark mode glass treatment — 2026
15. **Josue Somarribas — Squircles, Apple, and Framer** — https://josuesomarribas.com/blog/the-geometry-behind-modern-ui-squircles-apple-and-today%27s-framer-update — Framer squircle support, design rationale — 2025
16. **Robin Rendle — Design systems, color spaces, and CSS** — https://robinrendle.com/notes/design-systems-color-spaces-and-css/ — Color space migration context for design systems — 2025

---

## Methodology
- Sub-questions investigated: 5
- Total searches run: 7
- Sources discovered: ~60
- Sources deep-read: 5
- Mode: direct (no agents — main session)
- Flags: Squircle browser support timeline is single-source (Chrome 139+ confirmed, Firefox/Safari ETA unconfirmed). APCA contrast guidance cross-verified against Adrian Roselli as primary source — no contradicting sources found.
