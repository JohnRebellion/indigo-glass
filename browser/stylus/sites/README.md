# Sage Ink - Per-site Stylus overrides

Surgical retints for sites where the universal Sage Ink Stylus style isn't enough OR where the site has strong native dark mode that just needs accent realignment.

## Sites covered

| File | Domain | Strategy |
|---|---|---|
| `claude-ai.user.css` | claude.ai + claude.com | Full palette override - Anthropic's surface vars |
| `chatgpt.user.css` | chatgpt.com + chat.openai.com | OpenAI surface vars + interactive accent |
| `notion.user.css` | notion.so + notion.site | Notion `--notion-*` color vars |
| `linear.user.css` | linear.app | Light retint - Linear is already aligned w/ our design philosophy |
| `google.user.css` | google.com + ccTLDs | Structural IDs + grid re-placement - Google ships no theme vars |
| `youtube.user.css` | youtube.com + music.youtube.com | `--yt-spec-*` remap (consumed via fallbacks, never declared) |
| `facebook.user.css` | facebook.com + messenger.com | FB's 982 `:root` vars - surfaces, accents, 68 radius tokens |
| `github.user.css` | github.com | Primer's ~1260 `--bgColor-*`/`--fgColor-*` tokens |
| `atlassian.user.css` | atlassian.net + atlassian.com | Atlassian Design System `--ds-*` (any tenant) |
| `microsoft365.user.css` | cloud.microsoft, outlook.office.com, teams, sharepoint | Fluent v9 `--color*` + legacy Fabric slots |
| `wikipedia.user.css` | wikipedia/wikimedia/wiktionary/wikidata | Codex tokens + direct rules for Vector's night mode |
| `gemini.user.css` | gemini.google.com | Material 3 `--gm3-sys-color-*` + Gemini's `--bard-color-*` |
| `aistudio.user.css` | aistudio.google.com | Material 3 tokens + the `ms-*` shell components |
| `copilot.user.css` | copilot.microsoft.com | Tailwind-style 100-900 ramps, squircle clip-paths off |

All of them:
- Override the CSS custom properties the site already defines, at `:root` (no
  specificity wars) — except Google, which publishes none and needs structural
  selectors.
- Flatten the site's surface stack onto the two ink steps (base + surface) and
  zero its radius tokens. Most stock dark themes are a patchwork of four to six
  greys, which reads as broken next to the rest of the system.
- Carry the site's own hue on the ink ladder, plus the shared amber / positive /
  negative semantics.
- Set `color-scheme: dark` where they force a dark surface stack, so
  browser-rendered widgets follow.

**Run every one of them WITHOUT Dark Reader** — all 14 domains are in Dark
Reader's `disabledFor` list. Two engines repainting the same DOM is what
produced every defect in this system's history: the black hole punched into
Google's AI Overview, Facebook's left rail coming back white, Wikipedia
rendering Dark Reader's `#181a1b` instead of its own colours.

The **universal** Stylus style stays on everywhere alongside these. It defines
the `@font-face` with the metric overrides that the site styles reference by
name, plus scrollbars, selection and the focus ring — and it touches no colour,
so it cannot conflict with either a site style or Dark Reader.

### Per-site hue

**Every site style carries that site's own hue**, re-cut on the ink lightness
ladder rather than used raw: L 0.82 / 0.74 / 0.66 at C 0.11, against sage's
0.88 / 0.80 / 0.70 at C 0.06. The structure is always ours — flat ink surfaces,
radius 0, opaque chrome — the hue is always theirs.

| Site | Hue source | deg | accent_hi / accent / accent_alt |
|---|---|---|---|
| YouTube | its red | 29.2 | `#FFA99B` / `#E89082` / `#CD776A` |
| Anthropic (claude.ai, claude.com) | Anthropic clay `#D97757` | 38.8 | `#FFAB8F` / `#E69277` / `#CB795F` |
| ChatGPT | OpenAI teal `#10A37F` | 169.5 | `#74DBB9` / `#58C1A0` / `#3CA887` |
| Microsoft Copilot | Microsoft blue `#0078D4` | 251.3 | `#8EC9FF` / `#75AFEE` / `#5D96D3` |
| Microsoft 365 | its blue | 251.6 | `#8EC9FF` / `#76AFEE` / `#5D96D3` |
| Notion | Notion UI blue `#2383E2` | 252.7 | `#90C8FF` / `#77AFEF` / `#5F96D4` |
| GitHub | link blue + action green | 255.9 / 146.3 | `#94C7FF` / `#7CADEF` / `#6494D5`, button `#7BBE81` |
| Atlassian | its blue | 258.6 | `#98C6FF` / `#80ACF0` / `#6893D5` |
| Facebook | its blue | 259.8 | `#9AC5FF` / `#81ACF0` / `#6A93D5` |
| Google AI Studio | Google blue `#4285F4` | 260.0 | `#9AC5FF` / `#82ACF0` / `#6A93D5` |
| Wikipedia | its link blue | 262.3 | `#9DC4FF` / `#85ABF1` / `#6D92D6` |
| Google Search | four brand colours, no single hue | 262 @ C 0.05 | `#B3C5E5` / `#9AACCB` / `#8293B2` |
| Linear | Linear indigo `#5E6AD2` | 275.2 | `#AFBEFF` / `#97A5F0` / `#7F8CD5` |
| Gemini | violet mid-stop of its wordmark gradient `#9B72CB` | 304.0 | `#D3B2FE` / `#BA99E3` / `#A181C9` |

Google Search is the one exception to "use the brand hue": its brand is four
colours at once, so there is nothing to honour. It gets a near-neutral cool
cast instead — not a pure grey, because a zero-chroma accent is the same colour
as body text and links have to read as links.

Sage remains the accent for **everything outside the browser** — KDE, GTK,
Konsole, the editors, GRUB, SDDM. Those are the operator's environment and have
no vendor brand to carry. The browser is where other people's products are on
screen, and each one keeps its own identity while wearing this system's
structure.

Labels that sit ON an accent fill go ink black, not white — white on these
accents is 2.6-3.1:1. Each site has a real variable for that, and the rule
below about not repainting one without the other still applies.

### `color-scheme: dark`

Every file that forces a dark surface stack sets it. Without it the UA keeps
rendering its own widgets light — date pickers, `<select>` popups, the file
dialog, form-control internals — on top of a dark page, and no stylesheet can
reach them. They have no DOM to measure either, so the harness cannot see the
problem; it came out of the round-1 cross-model review.

Not set in the accent-only retints (Claude, ChatGPT, Notion, Linear): those
leave the site's own surfaces alone, so the site's own `color-scheme` is
already right.

### Semantic colour hides in SVG

GitHub paints issue/PR state and CI status as SVG `fill`. A computed-style
audit of backgrounds and text never sees it, so `#3fb950` / `#d29922` /
`#f85149` sat untouched in a page the audit called clean. `github.user.css`
now maps Primer's semantic tokens (`--fgColor-success`, `--fgColor-attention`,
`--fgColor-danger`, …) onto the system's positive / amber / negative.

Worth checking on any site with status indicators — `contrast.mjs` reports
saturated SVG paint now.

### The label-on-accent rule

**Never repaint a "text on accent" token unless this file also owns every
background that token is painted on.** Learned the hard way: setting
`--ds-text-inverse` (Atlassian) and `--colorNeutralForegroundOnBrand` /
`--colorNeutralForegroundInverted` / Fabric's `--white` (Microsoft 365) to ink
black, to sit on a repainted brand fill, put black text on dark surfaces
everywhere else those tokens are used — 1.03:1 and 1.07:1, invisible, found by
`contrast.mjs`'s keyboard pass.

Both files now leave the vendor's brand fills alone. Their blues are the hue
those files keep anyway, so the vendor's own label colours stay correct by
construction, and the accent still carries on text, links, icons and borders.
GitHub is the exception that survives: its green primary button is repainted
*and* labelled by the same file, and measures 9:1.

### Known contrast gap: `text_muted`

`--ig-text-muted` (`#6B7280`, oklch L 0.551) measures **4.14:1 on base, 4.01 on
surface, 3.87 on surface_alt** — below the 4.5:1 AA floor for small text. It is
the secondary-text mapping in every site style, so it shows up on GitHub commit
metadata, Facebook listing locations, Atlassian sidebar headings and YouTube's
footer alike. `text_dim` (`#4B5563`) is worse at 2.47-2.65:1.

This is a tokens.toml decision, not a per-site one: raising `text_muted` to
oklch L 0.60 (`#79808F`) clears 4.5:1 on all three ink steps, at the cost of
regenerating every layer. Not changed unilaterally — it moves the whole system.

### Verified, not guessed

These three were rewritten against a live DOM using `scripts/style-check`
(see its README). Every variable name and class hash in them was read off a
real render. The audit each one currently passes: zero non-circular border
radii, and no surface painted outside the token set.

The three AI files each needed something the token layer alone could not do:
Gemini and AI Studio paint their app shells (`bard-sidenav`, `ms-app`, the
composer) with hardcoded greys, and Copilot's canvas comes from a rule in a
cross-origin stylesheet that already carries `!important`. Copilot also masks
39 surfaces with **squircle clip-paths**, which no border-radius rule can
square — `tokens.toml` rules the superellipse out explicitly, so the file
switches the clip-paths off instead.

Note on verification: the Gemini and Copilot audits ran against their
signed-out landing views (the harness profile has no session for either), so
the in-conversation surfaces are covered by the token remap but not yet
confirmed by a render. AI Studio was audited signed in.

Current audit state of the four newer files: GitHub, Atlassian and Wikipedia
pass clean (`radii: []`, every fill a token colour). Microsoft 365 has three
known remainders — one 8px radius outside the app shell, a 5% white wash, and
one panel at `#0A0A0A` against the base's `#07080A`, a difference no eye
resolves.

Things the harness found that no screenshot would have:

- Facebook's white loading skeletons come from `--glimmer-base-opaque`, which
  is `#FFFFFF` even in dark mode; its "Just listed" badges come from
  `--primary-button-background-on-media`, also `#FFFFFF`.
- The harness profile was quietly running Dark Reader: Edge syncs the real
  extension set into any copy signed into the same account, so early audits
  measured Dark Reader's `#181a1b` rather than the site's own colours (and put
  an ad-blocker popup in every screenshot). `--disable-extensions` now.
- Vector's night mode ignores its own tokens: `--color-progressive` computes to
  `#88a3e8` while links actually render `#80B0E7`, so Wikipedia needs direct
  rules behind the variable remap.
- Google's 652px measure is not a `max-width`. `#rcnt` is a 22-track grid and
  `#center_col` is placed at `2 / span 12`. Re-placing the grid item is the
  only safe way to widen it — capping its width starves the layout instead.

## Install

Each `*.user.css` installs separately via Stylus:

1. Open the raw URL in browser:
   `https://raw.githubusercontent.com/JohnRebellion/indigo-glass/main/browser/stylus/sites/<site>.user.css`
2. Stylus prompts "Install" - confirm
3. Future updates: Stylus dashboard -> Check for updates

## Why per-site

The universal Stylus style avoids most font/scrollbar drift cross-site. But sites with their OWN dark mode (Linear, Notion, Claude, ChatGPT) use brand-specific accent colors that read as "wrong" alongside Sage Ink elsewhere. Surgical per-site CSS shifts ONLY their accent CSS vars to sage - native dark surfaces stay intact.

## Add a new site

1. Open the site, devtools -> Computed -> look for `--bg-*` `--text-*` `--accent-*` CSS custom properties on `:root` or `html`
2. Map their tokens to Sage Ink palette:
   - bg/surface family -> base/surface/surface_alt
   - text family -> text/text_muted/text_dim
   - accent/primary -> accent/accent_hi
   - semantic (red/green/yellow) -> negative/positive/amber
3. Copy `claude-ai.user.css` as template, change domain + var names, save in this dir
4. Commit + push -> auto-update via `@updateURL`
