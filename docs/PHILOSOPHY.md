# Lime Glass — Design Philosophy

> Why the hybrid? Why these colors? Why these constraints?

---

## The three references

### visionOS — Spatial Glass

Apple's spatial computing OS introduced **dimensional materials** as a primary UI language. Five principles map directly to a 2D Linux desktop:

1. **Glass is the chrome.** UI doesn't sit on top of content — it floats, frosted, tinted. The blur layer IS the design.
2. **Tint, don't fill.** Color applied AS a tint to the glass material, not as a flat colored background. Saturated solids contaminate blur. A single restrained accent on dark glass tints elegantly.
3. **Depth via shadow falloff.** Z-axis hierarchy through shadow + opacity gradients, not borders + lines.
4. **Content primary, chrome recedes.** Decoration vanishes when not needed. Window titlebars minimal. Panels translucent.
5. **Soft light.** Warmth even in dark palettes. Not harsh flat black.

### Linear — Dark Discipline

Linear.app set the modern dark UI standard with three pillars:

1. **Cognitive linearity.** Single reading direction. One action per screen region. No zig-zag attention.
2. **Typography is hierarchy.** Weight contrast > size contrast. Inter Display heavy for headings, regular for body.
3. **Dark by conviction.** Deep near-black base (`#07080A` by default — NOT pure black, which halates on OLED and exhausts eyes). Single accent (ghost-lime `#A8E635` by default; indigo `#5E6AD2` heritage) used sparingly. Subtle gradients on dark surfaces — not flat, not loud.

Restraint IS the style. One accent, mono icons, clean panels, no rainbow.

### Neumorphism 2.0 — Selective Tactility

Original neumorphism (2020) failed because it was applied to **entire UIs**. Low-contrast pillowy surfaces meant nav, text, and backgrounds all blurred into one soft mass. Accessibility nightmare.

**2.0 evolution (2025+):** Selective application only.

| Allowed | Forbidden |
|---|---|
| Buttons | Text, headings |
| Sliders, knobs | Navigation, sidebars |
| Toggles, switches | Backgrounds |
| Volume widgets | Headers |
| Notification cards | Body text |

Soft pillowy shadows on **interactive elements only** — preserving contrast where reading happens.

---

## Why these three together?

Each solves a problem the others don't:

| Problem | visionOS | Linear | Neumorphism 2.0 |
|---|---|---|---|
| Depth without clutter | ✓ glass + blur | — | — |
| Restraint + readability | — | ✓ typography + accent | — |
| Tactility on interactive | — | — | ✓ shadow extrusion |
| Premium feel | ✓ | ✓ | ✓ |

**visionOS alone** = beautiful but overproduced. Glass everywhere overwhelms.
**Linear alone** = excellent reading, but flat and cold.
**Neumorphism alone** = unusable for anything more than a calculator.

**Hybrid** = depth where you want to feel space (windows, panels), discipline where you read (text, nav), tactility where you interact (buttons, sliders). Right tool for each surface.

---

## Color reasoning

### The accent-selection principle

Every variant obeys the same rule: **one decorative accent hue, chosen to sit at maximum contrast on a near-black base, expressed as a single hue with lightness-shifted hi/alt siblings.** The accent is not "a palette" — it is one hue. Hover (`hi`) and active/decoration (`alt`) are lightness shifts of that same hue, never new colors. This keeps the interface reading as one voice instead of a spectrum.

The principle demands three things of any candidate hue:

- **High contrast on near-black** — the base is deliberately deep (not pure `#000`, to avoid OLED halation) so the accent can carry the eye without a second competing color
- **Single hue** — one authoritative decorative color; everything interactive shares it, and depth comes from elevation, not from more hues
- **No blur pollution** — the accent must tint glass cleanly rather than vibrate on it (saturated colors vibrate on near-black and cause eye strain on OLED/VA panels)

### Default: ghost-lime `#A8E635`

Lime Glass sets the accent to ghost-lime `#A8E635` (hue `127.71`) on a neutral Raycast-deep near-black base `#07080A`. The base is intentionally *deeper* than the heritage indigo base to **maximize lime contrast** — `13.39:1` against `#07080A` — while staying OLED-safe (not pure black, so no halation) and preserving depth-via-elevation. The base stays neutral, not lime-tinted: the lime lives only in the accent, so a single hue does all the decorative work. `#C1FF58` is the brighter hover shift, `#8BC406` the darker active/decoration shift — the same hue at three lightnesses.

### Heritage alternative: indigo `#5E6AD2`

The original Indigo Glass variant uses Linear's brand indigo `#5E6AD2` (hue ~`264`) on the shallower `#0F0F12` base, achieving `12.79:1`. It follows the identical principle — desaturated (unlike Tailwind's `#6366F1`) so it tints glass without vibrating, treated in LCH as the calmer/more authoritative variant, and Apple's visionOS HIG already places `#5E6AD2` in the "brighter zone" it recommends for glass backgrounds. Indigo remains available as a heritage variant; lime is the default.

### Why `#FBBF24` amber for warning?

Two-color split (Linear's own pattern):

- **The decorative accent** (lime by default, indigo in heritage) for everything interactive (selection, focus, hover, links)
- **Warm amber** ONLY for semantic warnings (notifications, pending states, attention)

This preserves orange's cognitive role (warning = warm) without contaminating the visual language with random warm spots.

Orange `#FF7B00` (the original KDE Sweet/Breeze accent) failed on three counts as a primary accent:

1. **Optical vibration** on near-black glass surfaces
2. **Semantic collision** — orange = warning universally, can't also = "primary"
3. **Aesthetic mismatch** — visionOS, Linear, neumorphism are all cool/neutral; orange fights all three

Amber `#FBBF24` (Tailwind amber-400) keeps the warm signal where it belongs (semantic) without dominating.

---

## Typography reasoning

Two families, distinct roles:

### Carlito for content (humanist with loop-tail g)

- **Double-storey `g`** (3-contour loop-tail) — matches Iosevka mono allograph for visual consistency
- **High x-height** = readable at 10pt UI
- **Free, broad weight range** (300-800 + italic axes)
- **Humanist** — warm for body text, not robotic
- **Replaced Nunito** which uses single-storey g — broke the loop-tail contract

### SF Pro Display for chrome (geometric Apple)

- **Geometric precision** = sharp window titles, menus, toolbars
- **Apple-system** = visionOS-native feel
- **Smaller hierarchy** through size, not weight

The contrast between **rounded humanist body** and **sharp geometric chrome** creates structure without needing extra ornament. Linear-style discipline applied through typography family contrast.

### JetBrainsMono Nerd Font for terminal

- Monospace with full Nerd Font glyphs (Powerline, Devicons, Octicons)
- Free, broadly available
- Iosevka Custom Condensed is preferred if available, but proprietary/custom

---

## Constraint discipline

### Single accent

Exactly ONE decorative accent hue per variant (lime `#A8E635` by default; indigo `#5E6AD2` heritage). The hi/alt variations (e.g. lime `#C1FF58` / `#8BC406`, or indigo `#818CF8` / `#A78BFA`) are luminance shifts of that one hue — not different colors.

### Three text colors max

Primary `#F8F8F8`, muted `#6B7280`, inactive `#6B7280`. No "tertiary text" in 5 different greys.

### Three surface levels

Base, surface, surface-elevated. No "surface-50, surface-100, surface-150" cascade.

### One radius default

`8px` everywhere — Klassy CornerRadius matches. Breaking only for: large containers (12px), pills (full).

### One blur default

`13px` (KWin BlurStrength=13) — same value in Tailwind `--blur-glass`. Stronger only for modals/critical glass surfaces.

---

## Why "Lime Glass" as a name?

- **Lime** = the accent — a single ghost-lime (`#A8E635`) on deep black, the brand signature
- **Glass** = the material language, the visionOS/brutalist-glass reference
- **Together** = a complete design identity, not just "another dark theme"

Naming the system as a *product* (not just "my dotfiles") forces design discipline: every change must answer "is this Lime Glass?" — not "is this what I happen to like today?"

> **Heritage:** the system began as **Indigo Glass** (Linear-indigo `#5E6AD2` accent). That palette still ships as the `indigo` variant (`[variants.indigo]` in the token file) — Lime Glass is the default, Indigo Glass is one `default_variant` switch away.
