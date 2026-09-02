# Sage Ink — Design Philosophy

> Why ink? Why these colours? Why these constraints?

---

## The reference

### The Verge — `DESIGN.md`

The single lineage reference is the extracted spec for **The Verge's 2024 redesign**, as published in the `DESIGN.md` library (`design-md/theverge/DESIGN.md`) and analysed in `research-reports/magazine-comic-style-design-system-2026-08-27.md`. It is magazine/comic-influenced neobrutalism — "developer console meets club night meets tech tabloid" — and four of its moves map directly onto a Linux desktop:

1. **Colour-as-elevation.** The Verge ships fourteen shadow entries and *none of them is a real elevation shadow* — depth is carried by fill colour and 1px hairline rings. Hierarchy is something you read, not something you infer from a blur gradient.
2. **Near-black canvas, no light mode.** `#131313` there, `#07080A` here. Deep enough to be a printed negative rather than a screen, but not pure black. (The Verge's canvas is deliberately *warm*; ours is neutral-to-cool — hue `262` at chroma `0.005`. That difference is inherited from the Lime Glass base and was not revisited.)
3. **Accent as hazard tape.** One accent doing all the decorative work, never a background wash.
4. **Print logic over screen logic.** Type does the shouting; the surface stays flat and opaque.

Two deliberate divergences, both worth naming so nobody "corrects" them later:

- **The accent is not acid.** The Verge runs Jelly Mint `#3cffd0` at full hazard intensity; sage is chroma `0.06` — pale and muted by choice. The *role* is the same, the loudness is not.
- **There is a hard offset shadow.** The research report argued colour-as-elevation was "the cleanest exit from frosted glass that does not land you in neobrutalism — no 3px borders, no `6px 6px 0` shadows". Sage Ink took the neobrutalist option anyway: colour-as-elevation *plus* an `8px 8px 0` shadow. A taste call, made knowingly. See `[shadow]` in the token file.

### Linear — what survived

Linear.app's discipline is the one thing carried over intact from the glass era, because none of it was ever about material:

1. **Cognitive linearity.** Single reading direction. One action per screen region. No zig-zag attention.
2. **Typography is hierarchy.** Weight contrast beats size contrast.
3. **Dark by conviction.** Deep near-black base (`#07080A` — NOT pure black, which halates on OLED and exhausts eyes). One restrained accent, used sparingly.

Restraint IS the style. One accent, clean panels, no rainbow. (Icons are the exception the system does not yet own — `Tela-circle-purple-dark` is a third-party, multi-colour set. See [REFERENCE.md](REFERENCE.md#current-boundary-vs-planned-scope).)

---

## What died with the glass

v1–v2 shipped as *Indigo Glass*, v3 as *Lime Glass*. Both were a three-way hybrid of visionOS spatial glass, Linear dark discipline, and Neumorphism 2.0. Two of those three references are now dead, and this is not a softening — the tokens that expressed them have been **deleted**, not deprecated:

| Dead reference | What it claimed | Where it went |
|---|---|---|
| **visionOS — "glass is the chrome"** | UI floats, frosted and tinted; the blur layer IS the design | `[blur]` deleted outright. `[glass]`, `[glass.render]`, `[glass.grain]` deleted. `[radius.squircle].enabled = false`. |
| **visionOS — "tint, don't fill"** | Colour applied AS a tint to a translucent material | Fills are opaque. `[opacity].window_active` / `window_inactive` are both `1.00` (they were `0.92` / `0.85` — the last place translucency-as-material survived). |
| **visionOS — "depth via shadow falloff"** | Z-hierarchy through soft shadow + opacity gradients | Zero-blur offset shadow (`[shadow].ink`) plus fill hierarchy. `glass_sm` / `glass` / `glass_lg` deleted. |
| **visionOS — "soft light"** | Ambient light-source orbs behind the glass | `[ambient]` deleted. |
| **Neumorphism 2.0 — selective tactility** | Soft pillowy extrusion on interactive elements only | `[shadow].neu_raised` / `neu_pressed` deleted; `[motion.roles].neu_press` deprecated in favour of `ink_press`. |

There is no chrome-is-glass carve-out either. **Every** surface is ink now.

Deletion rather than deprecation was the point. Those tokens sat marked "deprecated" for weeks while `codegen.py` kept emitting `tokens/out/glass.css` for every variant — which meant glass remained a fully-supported material that any consumer could opt into and still pass every check. That is exactly how frosted surfaces survived in the shipped Obsidian, Spicetify and Vencord themes long after the tokens said ink. A deprecated token is an available token. Git history keeps the values if a glass variant is ever genuinely wanted again.

What remains that *looks* like a survivor and is not: `[opacity].overlay_scrim` (0.80) dims the content *behind* a modal, not the modal's own fill; `disabled` (0.40) and `hover_tint` (0.10) are interaction states. Those are functional transparency, not a material. The one genuinely soft token left is `[shadow].accent_glow_lg` (`0 0 24px`), which is a focus affordance rather than an elevation cue.

---

## Material is a constraint, not a preference

The lime → sage colour migration was enforced by `scripts/check-palette-drift.sh`, which fails the build on any stale non-active-variant accent literal in a deployable layer. It worked: the colour migration landed thoroughly.

The glass → ink **material** migration had no equivalent guard, and it drifted badly — frosted surfaces survived in shipped Obsidian, Spicetify and Vencord themes, and in generated CSS, for weeks after the tokens said ink. One migration was enforced and the other was left to diligence, and the results are exactly what you would predict.

So, stated plainly: **material is a first-class constraint, at the same level as the accent hue.** "Is this surface glass or ink?" is not a per-surface taste call any more than "is this button lime or sage?" is. There is exactly one material.

Two mechanisms enforce that:

- **Deletion.** The glass, blur, grain, ambient and neumorphic-shadow tokens are gone from the source of truth, so codegen cannot emit them and no layer can consume them and still claim to derive from tokens. A deprecated token is an available token; a deleted one is not.
- **The drift guard, which now checks material as well as colour.** `check-palette-drift.sh` fails on `backdrop-filter`, `blur(`, `feTurbulence` grain, and — parsed rather than pattern-matched, so that a legitimate `0 0 0 2px` focus ring passes and `0 4px 24px` does not — any `box-shadow` with a non-zero blur radius. Run it as `--colour` or `--material` to scan one axis.

The escape hatch is a `# drift-allow` comment on the offending line. Use it rarely and say why on the same line: an unexplained `drift-allow` is drift with a note attached.

---

## Colour reasoning

### The accent-selection principle

Every variant obeys the same rule: **one decorative accent hue, chosen to sit at high contrast on a near-black base, expressed as a single hue with lightness-shifted hi/alt siblings.** The accent is not "a palette" — it is one hue. Hover (`hi`) and active/decoration (`alt`) are lightness shifts of that same hue, never new colours. `[palette.derive]` states the deltas the CSS relative-colour helpers use: `hover_dl = +0.06`, `active_dl = -0.04`, `subtle_dl = -0.10`.

Colour is **authored in OKLCH** (`[meta].color_authoring = "oklch"`) and hex is *derived* by codegen, never hand-picked. `[variants.<name>]` carries `[L, C, H]` triples; everything downstream — sRGB hex for KDE/GTK/GRUB/Windows, display-p3, native `oklch()` CSS — falls out of those three numbers.

### Default: sage `#A6C9A6`

`[variants.sage]` sets the accent to `oklch(0.8000 0.0600 145.00)` → `#A6C9A6`, on the neutral deep near-black base `#07080A`. Two things distinguish it from the lime it replaced:

- **Low chroma on purpose.** Chroma `0.06` where lime ran `0.2049`. The token comment calls the character "pale/muted, not vivid like lime". Contrast against the base is `11.00:1`, down from lime's `13.39:1` — a fill/background ratio, not a text ratio; see the next point.
- **Fill-only.** Sage is `1.72:1` against `--text`, so it **cannot carry body text**. It sits behind text, never as text. Hover is `#C0E3C0` (`L 0.88`), active/decoration `#89A889` (`L 0.70`) — same hue `145.0`, lightness shifts only.

Text stays neutral: `#F8F8F8` / `#6B7280` / `#4B5563`, with no sage tint, because sage is fill-only.

### The `positive` nudge

Sage is the only variant whose `positive` hue moved. At the shared `152.51` it sat 7.5° from sage's `145.0` and stopped reading as a distinct *status* colour next to the accent. It was nudged +12.49° to `165.00` (`#3FFABB`), clearing the accent by 20° while staying unambiguously green (teal starts around 170°). The change is scoped to sage only — lime's accent already clears `152.51` by 24.8°, and moving indigo's or lime's `positive` would ripple into hardcoded hex already baked into roughly forty downstream configs.

### Heritage variants

The system is multi-variant, and the other two are still real, still shipped, still one `[meta].default_variant` switch away:

- **`indigo` — "Indigo Glass"** (v1–v2), Linear's brand indigo `#5E6AD2`, hue `275.21`, on the shallower base `#0F0F12` — `12.79:1`.
- **`lime` — "Lime Glass"** (v3), ghost-lime `#A8E635`, hue `127.71`, `13.39:1` on `#07080A`.

Note what the names preserve: those variants are *called* Glass because that is what they were designed under. They ship today rendered in ink like everything else — the variant chooses a hue, not a material.

### Why `#FBBF24` amber for warning?

Two-colour split (Linear's own pattern):

- **The decorative accent** (sage by default) for everything interactive — selection, focus, hover, links
- **Warm amber** ONLY for semantic warnings — notifications, pending states, attention

This preserves orange's cognitive role (warning = warm) without contaminating the visual language with random warm spots. Amber is shared unchanged across all three variants.

Orange `#FF7B00` (the original KDE Sweet/Breeze accent) failed as a primary accent because orange = warning universally and cannot also mean "primary". That reasoning predates the ink migration and still holds. The other objection recorded at the time — that orange optically vibrated on near-black *glass* — no longer applies, because there is no glass to vibrate on. (Full workings: `research-reports/orange-accent-replacement-dark-ui-2026-04-25.md`.)

---

## Typography reasoning

Two families, distinct roles.

### Carlito for content (humanist with loop-tail g)

- **Double-storey `g`** (3-contour loop-tail) — matches the Iosevka mono allograph for visual consistency
- **High x-height** = readable at the 11pt anchor
- **Free, broad weight range**
- **Humanist** — warm for body text, not robotic
- **Replaced Nunito**, which uses a single-storey g and broke the loop-tail contract

### SF Pro Display for chrome (geometric)

- **Geometric precision** = sharp window titles, menus, toolbars
- **Smaller hierarchy** through size, not weight

The contrast between **humanist body** and **sharp geometric chrome** creates structure without extra ornament. Linear-style discipline applied through family contrast rather than decoration.

> **Known gap.** The Verge carries its hierarchy on a heavy display face at hero scale (Manuka 900 at up to 107px, line-height 0.80). Sage Ink has no equivalent — the scale tops out at 23pt (`hero_pt`) and the chrome face is SF Pro Display. This is the one part of the reference the system has not adopted, and 107px display type has nowhere to live in a window manager anyway. If it ever lands, it belongs to `web/`, GRUB, SDDM and fastfetch, not Klassy or Konsole.

### Iosevka Custom Condensed for mono

- Preferred where available; `[type.families].mono` falls back through `Iosevka Custom` → `MesloLGS NF` → `JetBrainsMono Nerd Font` → `Cascadia Code` → `Fira Code` → `Consolas`
- Mono runs at the same 11pt anchor as body

---

## Constraint discipline

### Single accent

Exactly ONE decorative accent hue per variant (sage `#A6C9A6` by default). The `hi`/`alt` variations are lightness shifts of that one hue — not different colours.

### Three text colours max

Primary `#F8F8F8`, muted `#6B7280`, dim `#4B5563`. No "tertiary text" in five different greys.

### Three surface levels

Base `#07080A`, surface `#0D0D10`, surface-alt `#121216` (plus sidebar `#0A0A0D`). No "surface-50, surface-100, surface-150" cascade.

### Two radius steps, and a tag

`[radius]` is deliberately two-track: **`0` for every material surface**, and **`full` (9999px) for circles and the pill CTA** — the two ends of the ladder, on purpose. `xs = 2` is the single soft step ink permits, for tags and small badges.

The intermediate 4 / 6 / 12 / 16 ladder from the glass era was **killed, not carried forward**: those steps had no material meaning once glass was gone. `default = 0` is now the canonical Klassy match (it was 8).

### The stroke has to be visible

`[palette.composite].border_strong` is white at **0.335** over `surface` — `#5E5E60` for sage, 3.10:1 against the page.

It was `0.10` (`#252528`, 1.31:1) until 2026-09-02, when the simulator's own self-audit measured **23 of 42** shadowless bordered components with no perceptible edge: every neutral surface in the system — input, table, switch, tabs, sheet, sidebar, checkbox — relied on a stroke nobody could see, leaving the shadow to carry both silhouette and elevation. A 2px stroke that does not separate from its own fill is decoration, not structure. After the raise: **0 of 42**. Re-measure with `simulator/scripts/measure-edges.mjs`.

The `indigo` heritage variant regresses here (`#68686B` is 1.18:1 against its mid-blue accent, down from 2.68:1). No single alpha satisfies both a near-black-accent and a mid-blue-accent variant; sage ships, indigo does not, so this is accepted rather than solved.

### Tone context: the reference's black is right on light surfaces

Border and shadow are lifted off black because Sage Ink's canvas is dark. On Sage Ink's *own* light surfaces — anything filled with the accent, amber or positive — that reasoning inverts and neobrutalism.dev's black is correct.

The two flip on **different** conditions, because they are painted in different places:

| | painted on | flips to black when |
| :--- | :--- | :--- |
| shadow | the backdrop only | the backdrop is light |
| border | the element's own edge, between fill and backdrop | fill **and** backdrop are light |

Measured 2026-09-02 (worst case, `simulator/e2e/tone.spec.ts`):

```
shadow on the accent fill          sage 1.44:1     black 11.53:1
shadow on the page                 sage 7.66:1     black  1.05:1
border, light fill on light        neut 3.55:1     black 11.53:1
border, light fill on dark page    neut 3.00:1     black  1.08:1
```

Threshold is relative luminance **0.179** — where black and white contrast equally, i.e. the solution of `(L + 0.05)² = 0.05 × 1.05`. Not a taste call.

Values live in `[on_light]` in the token file. The CSS lists are hand-maintained and therefore guarded: `e2e/tone.spec.ts` re-derives the correct tone per element and fails if the painted value is not the higher-contrast one.

### No blur

There is no `[blur]` table. It was a table of zeros kept alive only because `emit_kwin_blur()` still read `blur.md`, and a table of zeros is an invitation to raise them. Deleted on 2026-08-28, along with the KWin `better-blur-dx` effect itself, which `kwinrc-blur.ini` now switches **off** rather than tuning to zero. Nothing is frosted, and nothing is one config edit away from being frosted again.

### One shadow, and it is hard

`[shadow].ink` is `4px 4px 0 0` — zero blur radius — and the colour is **not** black: codegen resolves it per-variant to that variant's `accent_alt` (`#89A889` for sage), so the drop shadow carries the brand hue. `ink_lg` is `7px 7px 0 0` for feature tiles and hero cards. `hairline` (`0 0 0 1px rgba(255,255,255,0.10)`) is the quiet alternative where even ink is too loud. `ink_accent` is the same offset in the active variant's `accent_alt` — a hazard-coloured ink shadow, derived by codegen, never hardcoded per variant.

> **Corrected 2026-09-02.** This section previously documented the offsets as `8px`/`14px` black, describing a doubling applied on 2026-08-28. That doubling was reverted and the colour was moved to `accent_alt`; no generated output has carried `8px 8px 0 0 #000000` since. `docs/REFERENCE.md` carried the same stale values. The measured, shipping values are the ones above — always read `tokens/indigo-glass.tokens.toml` over prose.

### The press is mechanical, and it fires on `:active`

`[motion.roles].ink_press` is `["instant", "mechanical"]` — 60ms with `steps(2, end)`. The token file's phrase for it: **"a stamp, not a spring"**. The object translates into its own shadow by the shadow's offset while the shadow collapses to `0 0 0 0` (`[shadow].ink_press`).

**It fires on `:active`, never on `:hover`** — and this is a deliberate divergence from neobrutalism.dev, which travels on pointer arrival. State it explicitly, because the code drifted back to `:hover` in six places by copying the reference, and three of those carried a comment citing the reference as justification.

Travelling into the shadow is a *press* metaphor. Firing it on hover announces an action that has not happened, strips a control of its elevation while it is only being aimed at, and is pointer-only — keyboard and touch users never receive the feedback at all. Hover moves **fill** (`accent_hi`); it never moves geometry.

Adjudicated 2026-09-02 by [cross-model audit](../research-reports/neobrutalism-page-audit-2026-09-02/); GPT and Gemini reached it independently.

The old `neu_press` (120ms on a `cubic-bezier(0.34, 1.56, 0.64, 1.0)` overshoot) is deprecated — a soft pillowy push is the wrong feel for a hard-edged ink object. `standard` and `emphasize` easings survive for hover, focus, toggles and panels; only the *press* is mechanical.

---

## Why "Sage Ink" as a name?

- **Sage** = the accent — one pale, low-chroma green on deep black, the brand signature
- **Ink** = the material language: opaque flat fields, hard offset shadow, colour-as-elevation
- **Together** = a complete design identity, not just "another dark theme"

Naming the system as a *product* (not just "my dotfiles") forces design discipline: every change must answer "is this Sage Ink?" — not "is this what I happen to like today?"

> **Heritage:** the system began as **Indigo Glass** (Linear-indigo accent), became **Lime Glass** when the palette went multi-variant, and is **Sage Ink** today. Both earlier palettes still ship as the `indigo` and `lime` variants in `[variants.*]`. The *material* has no such fallback — glass is not a variant, it is a superseded version.
