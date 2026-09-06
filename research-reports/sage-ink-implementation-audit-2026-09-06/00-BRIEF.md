# Review brief — Sage Ink design system, implementation consistency

You are reviewing a cross-platform design system. Assume competence: the
operator is an experienced engineer, the system already has automated drift
guards and a 49-test browser suite, and generic advice ("consider using design
tokens", "add tests", "document your decisions") is worthless here — all three
already exist. Only findings that survive contact with the specifics below are
useful.

Do not soften findings to be agreeable. A second model is being asked these
same questions independently, for exactly that reason.

---

## 1. Context

**Sage Ink** is a single visual identity deployed across an entire Linux
desktop plus several applications. It is not a web design system with a
desktop skin bolted on — the desktop *is* the primary target, and the web
layer is secondary.

Deployment targets, all sharing one token file:

| Layer | Mechanism |
| :--- | :--- |
| KDE Plasma window decoration | Klassy, **built from patched C++ source** |
| Plasma widget theme | custom `SageInk` FrameSVG package |
| Plasma colour scheme | `share/color-schemes/SageInk.colors` |
| Qt application style | Klassy QStyle plugin (compiled `.so`) |
| GTK3 / GTK4 | custom `SageInk` theme package (own CSS, not a fork) |
| Konsole terminal | profile + colour scheme |
| VSCode | theme JSON + injected CSS |
| Discord (Vencord), Spotify (Spicetify), Obsidian | CSS injection |
| GRUB bootloader | 9-patch PNG theme |
| Web / portfolio | Tailwind v4 `@theme` block |

Single source of truth: `tokens/indigo-glass.tokens.toml` (schema v6).
`tokens/codegen.py` emits per-layer artefacts into `tokens/out/` — CSS custom
properties, SCSS, KDE `.colors`, Klassy `.ini`, Windows Terminal JSON, JSON.

---

## 2. The material rules being enforced

The system is **neobrutalist ink**, audited against the actual
[neobrutalism.dev](https://neobrutalism.dev) reference implementation
(`ekmas/neobrutalism-components`), not folk-knowledge "neobrutalism".

1. **Opaque flat fill everywhere.** No blur, no gradient, no translucency.
   A previous "glass" material (`backdrop-filter`, translucent tints) was
   deleted outright at schema v5 — deprecated-but-emitted aliases had let
   glass survive in three shipped themes for weeks after it was nominally
   removed.
2. **Elevation is a hard offset shadow, zero blur radius.** Canonical token:
   `4px 4px 0 0 <colour>`. Colour-as-elevation, never softness.
3. **2px solid border on every shadow-bearing surface.** `border.default = 2`,
   `border.hairline = 1` reserved for quiet dividers and never paired with an
   ink shadow.
4. **Radius ladder `0 / 2 / 9999`.** Sharp everywhere except deliberate
   pills/circles (badges, radio indicators, round CTAs).
5. **State grammar — fill means identity, outline means state.** A badge, tag
   or button keeps its opaque fill because it says *what a thing is*. A list
   row, tab, menu item or nav entry that is selected/focused gets a **solid
   colour 2px outline**, never a filled or translucent highlight, because it
   says *what is happening to it right now*.

Rule 5 has a four-tier taxonomy (`docs/STATE_GRAMMAR.md`):

- **Tier A — content**: alpha painted behind/within running content (editor
  selection, find-match, diff regions, modal scrim). Permanently exempt; the
  alpha *is* the medium.
- **Tier B — chrome**: hairline dividers. Composited to opaque at codegen time.
- **Tier C — on-select state**: selected row/tab/menu item. **Outline, not
  fill.** Colour is the `--ring` token — near-white `#F8F8F8` on dark surfaces.
- **Tier D — identity fill**: badges, tags, scrollbar thumbs, status chips.
  Keep the fill, make it opaque.

A transient non-scrollbar hover wash is an explicit allowed exception.

---

## 3. Palette (active variant: sage)

```
Base           #07080A     near-black, OLED-safe
Surface        #0D0D10
Surface+1      #121216
Sidebar        #0A0A0D

Accent (sage)  #A6C9A6     fill only
Accent+1       #C0E3C0     hover / focus
Accent-alt     #89A889     active / decoration
Amber          #FBBF24     warning
Positive       #3FFABB
Negative       #ED254E

Text primary   #F8F8F8
Text muted     #6B7280
```

Sage on base = **11.00:1** (AAA). Sage is deliberately **fill-only** — against
`--text` it is 1.72:1, so it cannot carry body text. Text stays neutral
throughout; only fills, borders and icons take the accent.

---

## 4. Existing enforcement (do not propose these — they exist)

**`scripts/check-palette-drift.sh`** — runs 6 scans over 16–17 directories.
Directory list is derived by *exclusion* (everything except a known
non-deployable set), so a new top-level directory is scanned by default rather
than being invisible by default. This was a deliberate rewrite: v1 listed
directories explicitly, silently omitted six deployable ones, and reported
"clean" while three shipped themes were still the previous brand's colours.

Scans:
- **colour** — literal hex *and* decimal RGB tuples (`rgba(168,230,53,.3)`,
  `"168,230,53"` in KDE schemes). v1 matched `#RRGGBB` only; five decimal
  tints survived every prior sweep.
- **material** — opaque, zero blur, hard shadow
- **alpha** — flags any `rgba()` with alpha < 1 or `#RRGGBBAA` outside the
  Tier A allowlist and the hover exception. Escape hatch is a trailing
  `# drift-allow` comment with a reason.
- **Tier C** — on-select noun plus opaque fill
- **parity** — `codegen.py --check`, shipped deployables vs freshly generated
- **shadow** — geometry and tone, offsets from the token file not hardcoded

**Current status: clean on all six scans.**

**`simulator/`** — a SvelteKit app that reproduces every surface (desktop
shell, browser, VSCode, Claude Code, GRUB) using the real generated tokens,
with a Playwright suite. **44 passed, 5 skipped, 0 failed** as of this audit.
Notable tests: computed-style golden baseline, GRUB parity at 1920×1080,
roster coverage (every component in the roster has a specimen), token values
resolved live rather than hardcoded, focus ring is the white `--ring` and not
the accent, ink material assertions (no `backdrop-filter`, opaque fill, hard
shadow), and a tone suite asserting every shadow separates from the fill that
casts it and every border survives against both its fill and its backdrop.

**Visual reference diffing** — `simulator/scripts/shoot-reference.mjs` captures
all 46 roster components from the **live** neobrutalism.dev site (forcing dark
mode and asserting `<html class="dark">`, skipping rather than silently saving
a wrong capture); `shoot-ours.mjs` crops the matching specimen cells from our
built page. Both sides are montaged per section and diffed with a
vision model under a colour-blind prompt (report geometry only, ignore
palette). Every reported difference is verified against source before being
counted as real.

---

## 5. Already decided — do not re-report

- **Sharp corners vs the reference's rounded corners.** Deliberate:
  `--border-radius: 0` matches the Klassy window decoration. Ledgered.
- **Sage shadow vs the reference's black shadow.** Deliberate, ledgered.
- **Achromatic/desaturated accent vs the reference's saturated blue.**
  Deliberate, ledgered.
- **Dark-only vs the reference's light-first.** Deliberate, ledgered.
- **Overlays and menus shown forced-open** while the reference shows them
  closed. Documented page convention — the specimen page exists to prove
  roster and state coverage; nothing is `position: fixed`.
- **More variants/states per specimen than the reference's single demo.**
  Same convention.
- **Different placeholder content** (our feature card vs their login form,
  our icon vs their photo). Arbitrary demo content on both sides.
- **Table/data-table full-width vs the reference's contained card.**
  Specimens are deliberately `span="full"` for the review grid.

### Known walls (investigated to the mechanism — do not re-litigate)

| Wall | Why |
| :--- | :--- |
| **Klassy QStyle** | Compiled Qt style plugin; `klassyrc` exposes only window-decoration options. |
| **Vencord / Discord** | Can only override the *value* of variables Discord's compiled stylesheet already reads as `background-color`. Class names are hash-obfuscated and churn per release — no stable selector for a real outline. Mitigated to barely-there + opaque. |
| **VSCode `statusBarItem`** | No outline/border key exists in the theme-colour API (focus-only). Confirmed against the official reference. |
| **VSCode `quickInputList` / `peekViewResult`** | Same — no outline key for the focused/selected row. Fallback is a neutral non-accent fill, documented per-key. |
| **Edge / Chrome theme manifest** | Colour slots plus one HSL tint. No border, radius or shadow concept exists in the API. |

---

## 6. What this audit measured (fresh evidence, today)

Method: capture the *running* desktop as pixels, describe with a vision model
under an explicitly adversarial prompt ("do not assume compliance"), then
verify every claim against source or by direct pixel sampling before counting
it. The vision model was caught fabricating detail twice and both fabrications
were discarded — see below.

### Confirmed clean

- All six drift scans clean; `codegen.py --check` exits 0.
- Simulator suite 44/44 passing.
- GTK3 widget factory: opaque fills throughout, 0px radius on buttons, entries,
  checkboxes, frames, progress bars and sliders; pills only on switches; radio
  indicators circular. No gradients, no soft shadows.
- Konsole: flat opaque fill, 0px radius, no translucency or wallpaper
  bleed-through.
- Dolphin: selected file row renders as an **outline**, not a fill — the Tier C
  noun is correct in the live compiled widget.

### Vision-model claims that source refuted (discarded)

1. Claimed our `input-otp` specimen had "five connected boxes with rounded
   outer corners and no center separator". Source: `.nb-otp-slot` declares no
   `border-radius` at all (so radius 0, correct), the specimen renders **six**
   slots, and there is a blinking caret element. Fabricated on all three
   counts.
2. Claimed the GTK TreeView selected row showed "no visible selection
   outline". The theme declares
   `box-shadow: inset 0 0 0 2px @theme_text_color` for
   `.view:selected` / `treeview.view:selected`. No row had actually been
   clicked in the captured screenshot — absence of a selection, not absence of
   styling.

### Confirmed defects (verified, not merely reported)

**Finding 1 — gsettings was a third, unmanaged source of truth for the GTK theme.**
Both `~/.config/gtk-3.0/settings.ini` and `~/.config/gtk-4.0/settings.ini`
correctly read `gtk-theme-name=SageInk`, but
`gsettings get org.gnome.desktop.interface gtk-theme` returned
`'WhiteSur-Dark-purple'` — a completely unrelated previously-installed theme.
libadwaita and GTK4 applications, and anything routed through
`xdg-desktop-portal`, read the gsettings/XSettings key and ignore
`settings.ini` entirely. `scripts/install.sh` never set it; it only printed a
manual "next step" instruction. Fixed in this pass by adding a guarded
`gsettings set` block covering `gtk-theme`, `icon-theme`, `color-scheme`,
`cursor-theme` and `font-name`. Verified applied.

**Finding 2 — Dolphin's selection outline is off-token and 1px, inside compiled C++.**
Pixel-sampled from a live screenshot: the selection ring is exactly **one**
pixel row (at y=354 and y=373 of the capture), colour `(183,221,183)` =
`#B7DDB7`. Two deviations from the grammar:
- Width is 1px where Tier C specifies 2px.
- `#B7DDB7` is **not a token**. It sits between `accent` `#A6C9A6` and
  `accent_hi` `#C0E3C0` — i.e. it is an *alpha composite* of
  `[Colors:Selection] BackgroundNormal` (`166,201,166`) over the surface.
  Tier C specifies the `--ring`/`DecorationFocus` token, near-white `#F8F8F8`.

The colour scheme sets `DecorationFocus=248,248,248` correctly in all seven
colour groups. `KItemListView` simply does not read it — it derives its
selection frame from the Selection background role and blends with alpha.
This is precisely the class of off-palette composite the alpha scan exists to
prevent, but it is produced at paint time inside `libKF6ItemViews`, where a
text-based scanner cannot see it.

An existing ledger entry described this wall as drawing "a filled rect from
the palette Highlight role". That description is now **stale** — the live
behaviour is an outline. The entry has been corrected with the measured
evidence.

---

## 7. Questions

Answer each under its own heading. Where a question is underspecified, say so
plainly rather than inventing detail to fill the format.

**Q1.** The drift guard is a *static text scanner*. Finding 1 (gsettings) and
Finding 2 (a composite produced at paint time in compiled C++) were both
invisible to it, and both are real. What is the general shape of the blind
spot, and what class of check would close it? Be concrete about what would be
measured and where it would run — a proposal that amounts to "screenshot
everything and eyeball it" is not useful unless you can say what the assertion
is and what makes it fail.

**Q2.** Three separate mechanisms now claim authority over the GTK theme name:
two `settings.ini` files and gsettings. Setting all three on install is the
fix that was applied. Is that the right fix, or does converging three writable
sources of truth on install merely defer the problem to the next time
something else writes one of them? If you would do something structurally
different, say what.

**Q3.** For Finding 2, the realistic options are: (a) accept the wall and
ledger it precisely, (b) patch `libKF6ItemViews` and maintain a rebuild, or
(c) find a colour-role assignment that makes the composite land on a real
token even though the blend is not under our control. Which would you take,
and — importantly — what makes (c) either viable or a trap? Note that the
project already builds Klassy from patched source, so "maintains a patched
build" is an established cost here, not a new one.

**Q4.** The system defines a four-tier state taxonomy (content / chrome /
on-select / identity fill) and enforces it across ~10 heterogeneous backends,
several of which cannot express an outline at all. Is the taxonomy itself
sound, or is it over-fitted to the backends that *can* express it? What would
a well-built version of this have that this description does not mention?

**Q5.** Which of the enforcement mechanisms described in §4 are actively
*harmful* — as opposed to merely redundant or low-yield? Specifically consider
whether "clean on all six scans" plus "44/44 tests passing" creates false
confidence, given that this audit found two real defects while every automated
check was green.

**Q6.** What measurement would change your answer to any of the above?

---

## Response format

```markdown
## Q1 — static-scanner blind spot
...
## Q2 — three sources of truth for the GTK theme
...
## Q3 — Dolphin / KItemListView
...
## Q4 — state taxonomy soundness
...
## Q5 — harmful enforcement
...
## Q6 — what would change your answer
...
## Confidence and caveats
Where you are guessing. What you would need to see to be sure. Say plainly if
a question was underspecified — do not invent detail to fill the format.
```
