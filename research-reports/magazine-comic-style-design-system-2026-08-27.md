# Magazine/Comic-Style Design System: Research Report
*Date: 2026-08-27 | Sources: 15 | Overall Confidence: Medium-High (name identification: Medium)*

> **Revision 1 (same day):** the Dribbble shot was subsequently seen directly (screenshot supplied by the
> user). It is **not** brutalist. See [Revision 1](#revision-1--the-shot-seen-directly) at the end; the
> naming in §2 still stands as vocabulary for the movement, but the exemplar sits in a cleaner lane.
>
> **Revision 2 (same day):** the actual question is answered — the forgotten name is **DESIGN.md**, and the
> magazine/comic system in it is **The Verge**. See [Revision 2](#revision-2--the-answer-designmd--the-verge).

## Executive Summary
The name you're reaching for is almost certainly **Editorial Brutalism** (also written
"brutalist editorial") for the *magazine* half, and **Neo-Print** (a.k.a. the halftone/Ben-Day-dot
revival, frequently folded into **Neobrutalism**) for the *comic* half. They are the two halves of
one 2026 movement: print-media logic — magazine typographic hierarchy, poster scale, ink texture —
imported wholesale into the browser as a reaction against smooth, AI-perfect minimalism. If what you
remembered was a *shippable* system rather than a trend name, it is **Neobrutalism / RetroUI**
(retroui.dev, formerly RetroUI) — the React + Tailwind library with thick borders and hard offset
shadows that your own June report already logged as direction **B2**. The Dribbble shot you linked is
Herb.Agency, rebranded by Phenomenon Studio around Albert Sans and explicitly "editorial roots …
structured newspaper qualities" — i.e. editorial, not comic.

## Codebase Context
Lime Glass is a cross-platform KDE Plasma 6.6+ design system (`tokens/indigo-glass.tokens.toml` →
codegen → Klassy/Konsole/GTK/GRUB/VSCode/Tailwind), currently a brutalist-glass + Linear-dark hybrid
with lime `#A8E635` on `#07080A`. Your June 2026 report `beyond-indigo-glass-directions-2026-06-26.md`
already lists **B2 Neo-Brutalist / Mono-Terminal** (`border: 3px solid`, `box-shadow: 6px 6px 0`,
lime/pink accents) — this research names and extends that lane rather than opening a new one.

## Findings

### 1. What does the Dribbble shot itself call its style?
**Insufficient data found — direct source inaccessible.** `dribbble.com/shots/26879185` returns a
JavaScript shell to WebFetch, so tags/description could not be read (FACT: two fetch attempts, empty
body).

Indirect evidence identifies the subject: Herb.Agency's rebrand is a
[Phenomenon Studio case study](https://phenomenonstudio.com/projects/herb-agency-rebranding-the-cannabis-experience)
which describes an "elevated" and "editorial" approach, **Albert Sans** as the core typeface chosen for
its "editorial roots" with a "contemporary feel", a dual palette with "30 curated color pairings",
and a modular illustration system built from "three basic shapes: pill, gummy, and capsule" (FACT).
[Herb Agency's own site](https://www.herb.agency/) frames the type choice as combining "structured
newspaper qualities with clarity" (FACT). So the exemplar sits in the *editorial/newspaper* lane with a
flat modular illustration layer — comic-adjacent, not Ben-Day comic proper (INFERENCE).

### 2. What is the named magazine/comic aesthetic of 2025–26?
Four names circulate; they overlap heavily.

- **Editorial Brutalism / brutalist editorial** — the closest fit for "magazine style". Per
  [Social Animal](https://socialanimal.dev/solutions/brutalist-editorial-web-design/), it "takes the raw,
  unpolished feel of brutalism and runs it through the structured typographic hierarchy of print
  magazines", with "oversized type, monospaced fonts, stark contrast, asymmetric grids, and intentional
  imperfection" (FACT). [Fireart](https://fireart.studio/blog/the-best-web-design-trends/) describes the
  same idea as sites that "feel like opening a high-end editorial magazine" (FACT).
- **Neo-Print** — the *comic/print-texture* half. Per
  [Artcoast Design](https://artcoastdesign.com/blog/halftone-textures-neo-print-trend-2026), the
  "Neo-Print Aesthetic" (which the article also calls "Neo-Brutalism") is "gritty, industrial, and raw",
  celebrating "the ink bleed, the misaligned registration, and most importantly: The Dot"; it is framed as
  the **"Anti-AI" aesthetic** — halftone as a signal that "a human made this" — and names *Nothing*,
  *Teenage Engineering* and *Off-White* as adopters (FACT, undated page, 2026-framed).
  [as of 2026] The 2026 halftone read is explicitly *technical/engineered*, not nostalgic.
- **Neobrutalism** — the productised UI form. [NN/g, 11 April 2025](https://www.nngroup.com/articles/neobrutalism/)
  defines it as "high contrast, blocky layouts, bold colors, thick borders, and 'unpolished' elements",
  with "stark, solid drop shadows", bold quirky typography, and Windows-98-flavoured skeuomorphs (FACT).
- **Pop-art comic** — the literal comic register: oversaturated primaries, **Ben-Day dots**, thick black
  outlines, panel compositions, halftones and hard graphic shadows (FACT, per comic-style surveys found in
  search; [Onextrapixel](https://onextrapixel.com/best-comic-book-illustrations/),
  [ToonyStory](https://toonystory.com/blog/comic-book-art-styles-explained)). No single canonical
  *web-design* name exists for this register — sources call it "comic book style", "halftone", or
  "neo-print" interchangeably (FACT: explicit non-finding in two searches).

Adjacent trend-list labels for the same territory: [Wix's 2026 list](https://www.wix.com/blog/web-design-trends)
names **"'80s excess"** (grainy textures, vintage typefaces, "magazine-inspired layouts"),
**"Tactile maximalism"**, **"Exaggerated hierarchy"** (oversized type against tiny text), and
**"Elevated brutalism"** (FACT). Fireart's own headline term is **"Tactile Brutalism"** (FACT).

**Ranked answer to "what's it called":** Editorial Brutalism (magazine) → Neo-Print (comic texture) →
Neobrutalism (the component-library flavour) → '80s excess / tactile maximalism (trend-list synonyms).

### 3. Tokens and conventions
Composite of the sources, deduped:

| Axis | Convention | Source |
|---|---|---|
| Type | Oversized display + tiny secondary ("exaggerated hierarchy"); Helvetica/grotesk bold all-caps display, **monospace body/captions**, occasional serif editorial insert; fluid `clamp()`; variable fonts < 50KB | Social Animal, Fireart, Wix |
| Layout | Asymmetric, offset columns, overlapping elements, exposed/visible grid; page as composed spread, not component container; bento-block modularity | Social Animal, Fireart |
| Colour | Stark high contrast at WCAG 2.2 AA; "deep cyber-monochrome (charcoal → true black) violently interrupted by a single highly saturated acid colour"; or high-contrast bold primaries in the neobrutalist read | Fireart, NN/g |
| Borders | `1px solid` wireframe lines *or* thick 3–4px outlines; corners either `0px` right angles or fully pill-shaped — nothing in between | Fireart, NN/g |
| Shadow | Hard **solid offset** shadows (no blur) in neobrutalism; Fireart's stricter read drops shadows entirely in favour of overlapping grid lines and z-index layering | NN/g, Fireart |
| Texture | Halftone / Ben-Day dot overlays, film grain, riso misregistration, ink bleed; CSS textures preferred over heavy 3D | Artcoast, Wix, Fireart |
| Motion | Scroll-driven manipulation (font weight mapped to scroll position), GSAP reveals with "editorial pacing", kinetic gradients; `prefers-reduced-motion` respected | Fireart, Social Animal |

### 4. Existing libraries and frameworks
- **[NeoBrutalism / RetroUI](https://retroui.dev/)** — React + Next.js + Tailwind; shadcn-style CLI
  install; reported 50+ components and 158+ blocks/templates on Radix UI and Base UI, with a free theme
  builder; free tier = atoms, Pro = blocks/templates. Not affiliated with official shadcn/ui.
  [unverified — single search-derived source for the component counts]
- **[neobrutalism.dev](https://www.neobrutalism.dev)** and
  **[neo-brutalism-ui-library.vercel.app](https://neo-brutalism-ui-library.vercel.app/)** — the two
  reference implementations already cited in your June report (FACT, local report).
- **[Awesome-Neobrutalism](https://github.com/ComradeAERGO/Awesome-Neobrutalism)** — curated resource list.
- **[Open Design](https://open-design.ai/plugins/design-system-brutalism/)** — ships *Brutalism* and
  *Neobrutalism* as agent-consumable design systems, described as ~56 tokens conforming to an Open Design
  token contract covering palette, type, spacing and motion. [unverified — single source] This is the
  closest external analogue to your `tokens/*.toml` → codegen pipeline.
- **Figma:** a [NeoBrutalism Web Components (RetroUI Community)](https://www.figma.com/community/file/1462760715922448325/neobrutalism-web-components-retroui-community) kit exists.
- No CSS framework found that targets *editorial brutalism* specifically — it is hand-built typography
  work, not a component kit (INFERENCE from absence across four searches).

### 5. Applying it to Lime Glass / Indigo Glass
All INFERENCE — no source addresses KDE theming.

- **Your palette already is the canonical neo-print palette.** Artcoast's "acid graphics" formula is
  "lo-fi grain + hi-fi colour — neon green or safety orange type over desaturated imagery"; Fireart's is
  "charcoal-to-true-black interrupted by a single highly saturated acid colour". Lime `#A8E635` on
  `#07080A` at 13.39:1 is exactly that, already AAA. **No re-colour needed** — this direction is a
  *material and type* change, not a hue change, which makes it far cheaper for you than June's B1
  Editorial Warm (which demanded a light-first flip plus a new serif).
- **The material swap is the whole cost.** Glass → flat: replace backdrop-blur surfaces with opaque
  `surface`/`surface+1` fills, 3px `accent` borders, `6px 6px 0` hard offset shadows. Layers that can
  absorb this today: Klassy titlebars/borders, Konsole (already Iosevka mono), the VSCode theme, GRUB,
  SDDM, the Tailwind `@theme` block. Layers that fight it: `kwin-effects-better-blur-dx` (the blur *is*
  the effect — it would be disabled, not restyled) and WhiteSur-Dark GTK.
- **Texture is the risky layer on a desktop.** Halftone/grain belongs on wallpaper, GRUB background,
  SDDM and fastfetch — static, non-interactive surfaces. Applying dot overlays behind live text in
  Konsole or VSCode will wreck legibility at small sizes.
- **The comic register barely survives contact with a desktop.** Ben-Day dots, panel borders and speech
  balloons are illustration devices; on a window manager they degrade to "thick borders + hard shadows",
  which is just neobrutalism. If you want genuine comic identity, spend it on the *bootloader, greeter and
  wallpaper*, keep the working surfaces neobrutalist.
- **Token additions this would need:** `border-width` (3px), `shadow-offset` (6px), `radius: 0`,
  `texture-opacity`, plus a display type token (a bold grotesk) alongside Iosevka — your existing
  `codegen.py` shape supports these without restructuring (INFERENCE from `tokens/` layout).

## Risks & Caveats
- **The primary exemplar was never read.** Dribbble blocks WebFetch; the style attribution for shot
  26879185 is inferred from Phenomenon Studio's case study and Herb's own site, not the shot's tags.
- **"Magazine/comic style design system" is not a single canonical term.** Sources use editorial
  brutalism, brutalist editorial, neo-print, neo-brutalism, tactile brutalism, '80s excess and elevated
  brutalism for overlapping territory; two searches explicitly failed to find one standardised name for
  the comic-web register. If none of these is the name you half-remember, it may be a specific product or
  template rather than a movement.
- **Trend-list sources are commercial.** Wix, Fireart, Artcoast, Social Animal and Digital Heroes all sell
  design services; their trend lists are marketing artefacts and their coinages ("Museumcore", "Tactile
  Brutalism") are not neutral vocabulary. NN/g is the only usability-research source here.
- **Contrarian evidence:** NN/g (April 2025) warns that neobrutalism "without balance … can overwhelm
  users and hinder accessibility" — bold colour pairings failing contrast, and interactive elements
  becoming hard to recognise. Artcoast's own framing is that the halftone revival is *anti-AI signalling*,
  i.e. a rhetorical stance with a shelf life, not a durable UI improvement. Fireart's version of the trend
  contradicts NN/g's on shadows (zero drop shadow vs stark solid shadow) — the "system" is not internally
  consistent across sources.
- Several component-library specifics (RetroUI's counts, Open Design's 56 tokens) are single-source and
  search-derived, not verified against the products.

## Recommendation
1. **The name is Editorial Brutalism for the magazine half and Neo-Print for the comic/halftone half;
   the shippable system is Neobrutalism (retroui.dev / neobrutalism.dev).** Use "editorial brutalism"
   when you mean layout and type, "neo-print" when you mean texture.
2. **If you pursue it, treat it as June's B2 with an editorial type layer bolted on, not a new direction.**
   Your lime-on-near-black tokens are already the correct palette; the work is killing blur, zeroing radii,
   adding hard offset shadows, and introducing one bold display grotesk beside Iosevka. That is a
   token-plus-Klassy job, not an identity rebuild.
3. **Confine halftone/grain to non-interactive surfaces** (wallpaper, GRUB, SDDM, fastfetch) and keep
   working surfaces flat, per the NN/g legibility warning. Prototype in `simulator/` before touching
   `config/` — and if the name above still isn't the one you remembered, the missing candidate is most
   likely a specific template or UI kit rather than a movement, which is a different search.

## Sources
1. **Social Animal — Brutalist & Editorial Web Design** — https://socialanimal.dev/solutions/brutalist-editorial-web-design/ — clearest definition + conventions for editorial brutalism — date unknown
2. **Artcoast Design — Graphic Design Trends 2026: The Rise of Halftone & Neo-Print** — https://artcoastdesign.com/blog/halftone-textures-neo-print-trend-2026 — names "Neo-Print"/anti-AI halftone; acid-graphics colour formula — 2026 (undated page)
3. **NN/g — Neobrutalism** — https://www.nngroup.com/articles/neobrutalism/ — definition + usability drawbacks (the contrarian voice) — 11 April 2025
4. **Fireart Studio — Web Design Trends 2026: Tactile Brutalism & Invisible Architecture** — https://fireart.studio/blog/the-best-web-design-trends/ — token-level conventions (borders, shadows, colour, motion) — 2026
5. **Wix — The 11 Biggest Web Design Trends of 2026** — https://www.wix.com/blog/web-design-trends — trend-list synonyms ('80s excess, tactile maximalism, exaggerated hierarchy) — 2026
6. **Phenomenon Studio — Herb.Agency rebrand case study** — https://phenomenonstudio.com/projects/herb-agency-rebranding-the-cannabis-experience — identifies the exemplar's actual design language — date unknown
7. **Herb Agency** — https://www.herb.agency/ — "structured newspaper qualities" type rationale — 2026
8. **NeoBrutalism / RetroUI** — https://retroui.dev/ — production component library in this style — 2026
9. **Open Design — Brutalism / Neobrutalism design systems** — https://open-design.ai/plugins/design-system-brutalism/ — token-contract packaging of the style — date unknown
10. **Awesome-Neobrutalism** — https://github.com/ComradeAERGO/Awesome-Neobrutalism — curated resource list — ongoing
11. **Local: beyond-indigo-glass-directions-2026-06-26.md** — `research-reports/` — prior B2 neo-brutalist direction for this project — 26 June 2026

## Methodology
- Sub-questions investigated: 5
- Total searches run: 5 web searches + 3 local greps (prior reports + session transcripts)
- Sources discovered: ~25 unique URLs
- Sources deep-read: 6 (Artcoast, Phenomenon, Wix, Fireart, NN/g, Social Animal)
- Mode: direct (no agents)
- Flags: Dribbble shot 26879185 unreadable (JS shell, 2 attempts) — style attribution is indirect;
  no single canonical name exists for the comic-web register; RetroUI and Open Design specifics are
  single-source; all Lime Glass application notes are inference, not sourced.

---

## Revision 1 — the shot seen directly
*Added 2026-08-27 after viewing a full-page screenshot of the Dribbble shot. Supersedes the "insufficient
data" finding in §1.*

**What is actually on screen** (FACT, direct observation): a light, polished, highly structured marketing
site by **Phenomenon Studio** — not brutalism, not comic.

| Axis | Observed |
|---|---|
| Base | Cream / off-white page; deep forest green and lilac purple as full-bleed section blocks |
| Accent | Acid lime / chartreuse (visually ~`#C9F24D`) as the single loud colour |
| Type | Heavy condensed grotesk all-caps display, tight tracking ("THE ONLY CANNABIS MARKETING HUB YOU'LL EVER NEED."), small sans body, generous whitespace |
| Layout | Modular **bento** cards, dashboard panels, pill chips and small badge labels |
| Imagery | **Greyscale / duotone cut-out collage** — flattened photographic fragments dropped into cards; one torn black 3D shape as a disruptive accent |
| Material | Flat, clean, rounded cards. No thick borders, no hard offset shadows, no exposed grid, no grit |

Phenomenon's own caption calls it "a distinct visual voice built around contrast, personality, and
confidence. Bright accents, expressive shapes, and carefully framed imagery create an immediate sense of
energy while still keeping the interface clean and structured" (FACT, quoted from the shot description).

**Consequence for naming.** "Editorial brutalism" is the wrong label for *this exemplar* — brutalism
requires the rawness the shot deliberately avoids. The accurate vocabulary is a stack, not one name:

1. **Bento grid** — the layout. Per [Buzz Interactive](https://www.itsbuzzinteractive.com/blog/top-web-design-trends)
   and [Amarakoon on Medium](https://medium.com/@aksamark/web-design-trends-2026-why-minimalism-is-evolving-into-bento-grids-16839fd31fb7),
   bento is "the fastest-rising style, keeping the clean look while adding modular structure" (FACT).
2. **Editorial** — the voice: "strong type, high contrast and confident layouts", with print references
   (bordered photography, ad-style compositions) per [Made Good Designs](https://madegooddesigns.com/editorial-design-guide/) (FACT).
3. **Cut-out collage / print-copy imagery** — the magazine-and-comic feeling, and the one place the
   earlier **Neo-Print** finding genuinely applies. [It's Nice That, 12 Jan 2026](https://www.itsnicethat.com/features/forward-thinking-graphic-trends-2026-graphic-design-120126)
   names two 2026 trends that describe this shot's imagery exactly: **"In Print: Make me a copy"**
   (greyscale office-printer aesthetics, low-res grain and debris as deliberate elements) and
   **"In Assets: The visual index"** (flattened, numbered cut-outs arranged like specimens) (FACT).
4. **Acid accent on a neutral base** — the colour move, shared with the neo-print "acid graphics" formula
   already documented in §3.

Adjacent named candidates checked and **rejected** for this shot: **Type Collage**
([Kittl, 15 April 2026](https://www.kittl.com/blogs/type-collage-design-stl/)) requires "complete canvas
coverage", minimal whitespace, absent photography and mixed rotated typefaces — the shot has generous
whitespace, a single type family and prominent photography (FACT vs. observation).
**Trinket Design / Charmcore** (stickers, pins, badges, digital trinkets — small-scale maximalism) is
adjacent via the pill chips and badges, but the shot is far too restrained to qualify.
**Scissorworks / Analog Anarchy / Acid Fade** surfaced in search summaries but could not be traced to the
sources that allegedly name them — treat as unverified vocabulary. [unverified — search-summary only]

**The finding that matters for Lime Glass.** The shot's palette is *your palette in light mode*: acid lime
as the single accent, a near-neutral base, one cool secondary (lilac there, indigo here). Your existing
`tokens/out/css-vars.lime.css` lime `#A8E635` and the Indigo Glass heritage accent `#5E6AD2` are, together,
the exact lime + lilac pairing this site is built on (INFERENCE, direct comparison). If you want this look
in Lime Glass, the work is **not** a re-colour and **not** neobrutalism:

- Build a **light variant** (cream base, forest-green deep block, lime accent, indigo as the cool secondary)
  rather than converting the dark theme — this exemplar is light-first, and your VSCode light theme already
  proves you need the darker lime ladder there (lime is illegible on white, per README).
- Add a **condensed bold grotesk display token** — the single biggest contributor to the look. Iosevka
  Custom Condensed already gives you condensed *mono*; the display face is the gap.
- Keep flat rounded cards; **do not** add 3px borders or `6px 6px 0` shadows. That is the B2 neobrutalist
  lane and it is a different design.
- Put the **greyscale cut-out collage / printer-grain** treatment where it belongs on a desktop: wallpaper,
  GRUB background, SDDM, fastfetch. Same conclusion as §5, reached from the real reference this time.

**Revised recommendation.** If the name you forgot describes *this* shot, it is most likely
**"editorial bento"** or simply **editorial + acid accent + cut-out collage** — there is no single
canonical term, and the two It's Nice That coinages ("Make me a copy", "The visual index") are the most
precise published names for its imagery. If the name you forgot describes something with thick borders and
hard shadows, it is **Neobrutalism** and §2–§4 above are the answer.

## Additional sources (Revision 1)
12. **It's Nice That — The graphic trends you'll want to bookmark for 2026** — https://www.itsnicethat.com/features/forward-thinking-graphic-trends-2026-graphic-design-120126 — names "Make me a copy" and "The visual index", the shot's imagery — 12 January 2026
13. **Kittl — Type Collage** — https://www.kittl.com/blogs/type-collage-design-stl/ — rejected candidate, with its explicit rules — 15 April 2026
14. **Made Good Designs — Editorial Design: A Complete Guide for 2026** — https://madegooddesigns.com/editorial-design-guide/ — editorial voice conventions — 2026
15. **Buzz Interactive / Medium — bento grid rise** — https://www.itsbuzzinteractive.com/blog/top-web-design-trends — bento as fastest-rising 2026 layout — 2026

---

## Revision 2 — the answer: DESIGN.md / The Verge
*Added 2026-08-27 after the user clarified the source was a blog article, not the Dribbble page.*

**The forgotten name is `DESIGN.md`** (FACT). It is not a trend — it is a *file format plus library*:
"structured design system specifications that AI coding agents read before generating UI"
([designmd.app](https://designmd.app/), which lists **562** files). Each file is YAML front-matter tokens
(colour, type, spacing, radius) followed by markdown prose across nine sections — Visual Theme &
Atmosphere, Colour Palette & Roles, Typography Rules, Component Stylings, Layout Principles, Depth &
Elevation, Do's and Don'ts, Responsive Behavior, Agent Prompt Guide — per
[VoltAgent/awesome-design-md](https://github.com/voltagent/awesome-design-md) (**110,837 stars**, FACT via
`gh api`, 2026-08-27). Search summaries report Google added the format to **Google Stitch** in March 2026
and that files are optimised for **Claude Design** (April 2026) [unverified — search summary only].
This project's June report already cited two of its pages (`getdesign.md/raycast`, `getdesign.md/claude`)
without naming the format — which is how the name got lost.

**The magazine/comic entry is `design-md/theverge/DESIGN.md`.** Verbatim from the file (FACT):

> "The Verge's 2024 redesign feels like somebody wired a Condé Nast magazine to a chiptune soundboard."
> Story tiles "feel like pasted-up rave flyers arranged into a timeline." The mood is "developer console
> meets club night meets tech tabloid."

Its extracted system:

| Axis | The Verge DESIGN.md |
|---|---|
| Canvas | **`#131313`** near-black, "just enough warmth to feel like a printed newsprint negative rather than an OLED void"; no light mode on the homepage |
| Accents | **Jelly Mint `#3cffd0`** + **Verge Ultraviolet `#5200ff`** — "hazard tape", never a background wash; `#309875` border-mint, `#3860be` link hover, `#1eaedb` focus ring only |
| Surfaces | `#2d2d2d` slate secondary, `#313131` image frames; saturated full-bleed colour-block tiles (mint, purple, yellow, pink, orange, blue) |
| Display type | **Manuka 900** (Klim) at 60 / 90 / **107px**, line-height 0.80 — "the single loudest type move in mainstream tech media" |
| UI type | PolySans 300/500/700; **PolySans Mono ALL-CAPS** for kickers, timestamps, tags, buttons — "the second-most-identifiable Verge detail"; FK Roman serif as the print-magazine counterpoint |
| Radius | **Eight discrete values** — 2 / 3 / 4 / 20 / 24 / 30 / 40px / 50%. Deliberate: "every component announces its hierarchy through its corners" |
| Depth | **Colour-as-elevation.** 14 shadow entries, none a real elevation shadow — only `1px` hairline rings (`#ffffff`, `#3cffd0`, `#5200ff`) and `0px -1px inset` active-tab underlines |
| Layout | 8px base; ~1280px max width; 12-col grid resolving to 3-col hero + StoryStream rail; tiles span 2–3 columns "on a whim" |
| Signature | **StoryStream** — a vertical timeline where posts stack on a dashed rule "like commits in a git log", each with a mono-uppercase timestamp on its left rail |
| Whitespace | "Paced, not airy" — "whitespace like a club DJ treats silence", a reset between loud blocks |

**WIRED** (`design-md/wired/DESIGN.md`) is the pure-magazine counterpart: "a strict editorial duet of stark
black wordmark on white canvas", custom display serif (WiredDisplay 64/48/32/26px at weight 400), BreveText
serif body, Apercu sans metadata, ink `#000`, hairline `#e0e0e0`, link `#057dbc` — "a printed magazine
ported to the web with very little marketing chrome" (FACT, quoted from the file).

The designmd.app library additionally carries style-not-brand entries in this territory:
**"Retro-Comic Action Blueprint"** (superhero comic, halftone dots), **"Risograph Zine Aesthetic"**
("zine aesthetics, grainy texture, multiply blending mode"), **"Vintage Editorial"**, **"Paper & Ink"**,
plus a **"Brutalism"** and **"Neobrutalismo Ousado"** for the §2 lane (FACT, listing observed).

### Why The Verge is the one worth stealing from for Lime Glass
INFERENCE, but the alignment is unusually close:

- **Same architecture as Lime Glass, different accent.** Near-black canvas (`#131313` vs your `#07080A`),
  one slate secondary surface (`#2d2d2d` vs your `#121216`), a single acid accent doing all the work, flat
  depth, hairline borders, mono type for labels. You already have Iosevka Custom Condensed where The Verge
  has PolySans Mono. **Lime `#A8E635` sits in exactly the slot Jelly Mint `#3cffd0` occupies** — and your
  Indigo Glass heritage accent `#5E6AD2` is a near-neighbour of Verge Ultraviolet `#5200ff`. Lime + indigo
  as a two-hazard pair is a *supported* Verge-style move, not a compromise.
- **Colour-as-elevation is the actual migration.** It is the cleanest exit from frosted glass that does not
  land you in neobrutalism: keep flat surfaces, drop blur, hierarchy carried by accent fill and 1px hazard
  hairlines. No 3px borders, no `6px 6px 0` shadows.
- **What you'd have to add:** a heavy display face at hero scale (the Manuka slot — your only real gap),
  the eight-step radius ladder (you have no such scale), and a mono-uppercase label convention.
- **What does not port to a desktop:** StoryStream is a feed pattern, and 107px display type has nowhere to
  live in a window manager. Both belong to the `web/` Tailwind layer, GRUB, SDDM and fastfetch — not Klassy
  or Konsole.
- **Cheapest concrete experiment:** copy `design-md/theverge/DESIGN.md`, swap `#3cffd0` → `#A8E635`,
  `#5200ff` → `#5E6AD2`, `#131313` → `#07080A`, and render it in `simulator/` before touching `config/`.

### Corrections this supersedes
- Revision 1's "there is no single canonical name" was answered for the *wrong artefact* — it described the
  Dribbble shot's style, not the system the user was trying to recall. Both readings are retained above
  because the Dribbble analysis stands on its own as the exemplar critique.
- The Medium article originally cited as the source blog (`the-most-installed-design-document-of-2026-is-30-lines-long`)
  returns **HTTP 403** to WebFetch and could not be re-read; the DESIGN.md identification rests on
  designmd.app and the awesome-design-md repo instead, both read directly.

## Additional sources (Revision 2)
16. **designmd.app** — https://designmd.app/ — the DESIGN.md format and 562-file library — 2026
17. **VoltAgent/awesome-design-md** — https://github.com/voltagent/awesome-design-md — 110,837 stars; the nine-section file structure; source of the theverge and wired files — read via `gh api` 2026-08-27
18. **design-md/theverge/DESIGN.md** — https://github.com/voltagent/awesome-design-md/blob/main/design-md/theverge/DESIGN.md — the magazine/comic system, quoted above — 2026
19. **design-md/wired/DESIGN.md** — https://github.com/voltagent/awesome-design-md/blob/main/design-md/wired/DESIGN.md — the pure-magazine counterpart — 2026
20. **designmd.app/library** — https://designmd.app/library — style entries incl. Retro-Comic Action Blueprint, Risograph Zine Aesthetic — 2026
