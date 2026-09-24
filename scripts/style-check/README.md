# style-check — verify a Stylus site style against the live site

Renders google/youtube/facebook in the system Edge with one of
`browser/stylus/sites/*.user.css` applied, screenshots it, and reports what the
style did **not** reach: elements still carrying a border-radius, surfaces still
painted off-palette, and the link colours in effect.

## Why

The first three versions of those site styles were written from screenshots and
guessed selectors. Guessing cost four broken renders:

| Guess | What actually happened |
|---|---|
| `#searchform form` for Google's search field | No such element — the field is `div.RNNXgb` in `form#tsf`. The rule never applied. |
| `#center_col { max-width: 740px }` | `#center_col` is a grid item; capping it collapsed the Images masonry into one 290px column, then wrapped result titles one word per line. |
| `#center_col mark` for the AI-Overview highlight | The `<mark>` sits outside `#center_col`. Highlight survived three passes. |
| `--menu-background`, `--notification-badge`, `--progress-ring-color` on Facebook | None of those variables exist. Half of v0.1.0 was inert. |

Every one of those was a two-minute check against a real DOM. This harness is
that check.

## Setup

```sh
npm install                 # playwright-core only; uses the system Edge binary
./mkprofile.sh              # disposable cookie-only copy of the Edge profile
```

`mkprofile.sh` copies the cookie jar so logged-in surfaces (Marketplace, the
subscription feed) render. Cookies stay encrypted; the spawned Edge decrypts
them through the same keyring entry the real browser uses.

## Use

```sh
node check.mjs youtube              # audit one site
node check.mjs all                  # all three
node check.mjs facebook --headed    # watch it
node check.mjs google --no-style    # baseline, style not applied
node check.mjs facebook --extra ':root{--x: red !important}'   # try a rule before writing it
```

Screenshots land in `/tmp/ig-shots/`. A clean result is `"radii": []` and a
`fills` list containing only token colours (and real images).

### contrast.mjs — readability and rounding

```sh
node contrast.mjs github            # rest + keyboard-focus contrast, plus a rounding report
node contrast.mjs m365 --no-style   # same, unstyled: is this failure ours or the site's?
```

Measures the element that actually **paints** each label (one with its own text
node), not the interactive container — a container's `color` is usually
overridden on the child span, and judging containers reported every Marketplace
card at 1.2:1 while the visible text was fine.

The focus pass walks the page with real **Tab presses**. `el.focus()` from
script does not match `:focus-visible` in Chromium, so a scripted loop cannot
see a rule that repaints a control on keyboard focus — which is exactly the bug
this was written for.

Always run `--no-style` before fixing anything: three of the worst failures
found this way (Atlassian's "Connect apps" at 1.18:1, its "Open Rovo Chat" at
1.56:1, Outlook's black icon glyph at 1.44:1) fail in the stock sites too.

Colours are resolved by painting them on a 1x1 canvas rather than parsed with a
regex — these styles declare `oklch()`, which Chromium keeps as `oklch()` in
computed styles, and a regex that only knows `rgb()` silently treats those
layers as absent.

`contrast.mjs` also reports, since the round-1 review:

- **disabled controls** below 3:1 (a restyle can leave one looking enabled).
  `:visited` is deliberately not measured — Chromium lies about it in
  `getComputedStyle` as an anti-history-sniffing measure, so any number here
  would be fiction.
- **SVG brand paint** — saturated `fill`/`stroke` values that survived the
  retint. Computed-style audits of background and text never see these; it is
  how GitHub's green/amber/red status icons sat in a page the audit called
  clean.

`check.mjs` adds:

- **layout warnings** — horizontal overflow the style introduced, and document
  height changing by more than ±50%. Both audits measure paint, not geometry,
  which is how a width rule shipped twice that collapsed a masonry grid. Height
  is read off `documentElement`, not `body`: an app shell (YouTube) reports
  `body.scrollHeight` as 0 and every ratio against it is fiction.
- **a 900px pass** — a responsive breakpoint can swap in a component tree whose
  tokens were never remapped.

### structure-blocks.py — the generator behind every site's structure section

```
python3 structure-blocks.py          # rewrites all 15 site files, idempotent
python3 ../../tokens/codegen.py      # then: the Stylus import bundles embed them
```

One entry per site names the button bases and their exclusions, the
`primary` and `danger` selectors (level 1, `docs/ELEVATION.md`), overlays,
inputs, radius and resting lists, plus `EXTRA` (contrast fixes measured by
`simulator/e2e/quality.spec.ts`) and `OUTSIDE` (exact-anchor edits to rules
that live above the structure section). Base selectors are emitted with their
ancestors and exclusions inside `:where()` so a primary rule always outranks
them. It also rewrites the hex, oklch and RGB-triple copies of lifted tokens.

### live-contract.mjs — the simulator's contract on the real site

```sh
node live-contract.mjs public              # github, wikipedia, youtube, google, shopee
node live-contract.mjs google --headed     # a cold headless jar gets the CAPTCHA; headed does not
node live-contract.mjs claude,notion       # logged-in sites, via the profile copy
node live-contract.mjs youtube --no-style  # is a failure ours or the site's?
```

`simulator/e2e/sites.spec.ts` proves each `.user.css` against its `/sites/<id>/`
mock. This runs the **same contract block** (radius above 2px off circles and
pills, soft or alpha shadows, blur, gradients, dialog and menu edges, light-filled
buttons lifted with an ink label and dark-filled ones flat, inked elements no
closer than the offset, borders thinner than 2px) on the
live DOM with the file injected, so a live class the mock never carried shows
up here. The check body is copied, not shared — keep it in step with the spec
when the contract changes. Exit status is the number of failing sites; output is
one JSON object per site with distinct failure signatures, most frequent first.

First live pass, 2026-09-24 (public five):

| Site | Found | Fix |
|---|---|---|
| github | Primer avatar ring `rgba(255,255,255,.15) 0 0 0 1px` | `.avatar, [class*="prc-Avatar-Avatar"] { box-shadow: none }` |
| wikipedia | `<html>` left black by Vector night | `html` added to the surface rule |
| youtube | `<html>` stayed `#0F0F0F`: YouTube's `html[dark]` canvas rule is `!important` and outranks a bare `html` | `html[dark]` added to the surface rule |
| youtube | `ytd-video-preview #media-container` 12px | added to the radius list |
| google | `g-inner-card` 16px (video carousel), `.ZOyvub` 4px | added to the radius list |
| shopee | served `/verify/traffic/error` (slide puzzle) — not audited | solve once in a headed run, keep that profile |

Two contract exemptions came out of the same pass and live in both the spec
and this script: avatar-shaped `[role=button]` hosts (YouTube's channel
avatars with a LIVE badge) and entries inside `[role="navigation"]` are chrome,
not action buttons.

Third live pass, 2026-09-24 (github/wikipedia/youtube/google/facebook/copilot/gemini),
after the elevation work. Two checks were added to both copies of the contract
because live YouTube failed in ways the block could not see:

- **iconEdge** - a ghost icon-only button (no text, at most 72px, or a single
  svg/i/img child) that carries the 2px `border_strong` edge. Level 0 edges are
  for text controls; on a kebab or a mic they read as boxes. Buttons the site
  itself bordered are marked `data-ig-stock-edge` before injection and skipped
  (the spec walks the same child path into the stock lane instead).
- **phantom** - an inked element under 12px on either axis: chrome on an empty
  host paints an accent dot. Only rendered elements count (`display`,
  `visibility`, size, and now `opacity` 0 are all "not rendered"; Google parks
  closed dialogs at opacity 0 as 380x4 strips).
- Hard-stop gradients (two stops, the second at `0%`) are content, not blends:
  Google's star-rating fill. Both contracts skip them.
- A bot wall or consent gate (`/sorry/`, "Just a moment", "unusual traffic")
  now returns `{ blocked: true }` and counts as failing. Before this, Google's
  CAPTCHA page scanned clean and looked like a pass.

| Site | Found | Fix |
|---|---|---|
| youtube | 25 icon-only kebabs boxed: classes renamed to camelCase `ytSpecButtonShapeNext*` | both spellings in the exemption chain (0.5.1) |
| youtube | `yt-light-shape` blurred wash + rim light in tonal buttons; `OverlayDark` backdrop filter | hidden / zeroed in `EXTRA` |
| youtube | 4x4 accent dots at button corners: the `tp-yt-paper-tooltip` host is the `[role=tooltip]` and is always present | chrome moved to `#tooltip`, host reset (0.5.2) |
| youtube | `#voice-search-button` boxed | removed from the hand-written edge rule |
| copilot | empty account hit-target boxed | `:not(:empty)` (0.4.2) |
| facebook | 27 icon buttons boxed; no class to name | structural exemptions for seven `svg`/`i`/`img` trees (0.6.1, 0.6.2) |
| google | `g-left-button` / `g-right-button` gradient fades | opaque ink in `EXTRA` |
| google | tools-bar `span[role=button][aria-pressed]` 1px pill; `.duf-h` carousel arrow soft shadow | bases + `EXTRA` (0.7.1); **verified in the mock only** - google bot-walled every later run, headless and headed |
| gemini | `cdk-describedby` hidden a11y text as phantoms | false positive; phantom now skips non-rendered elements |

Facebook's r=18 cards, popover soft shadows and one gradient still sit on
atomic hash classes with no stable hook; documented residue, not fixed.

Screenshots (`--shot`) land in `/tmp/ig-shots/live-<id>.png`. A shot of a work
profile is client material: read it here, never relay it.

### stylusapply.mjs — installing across profiles

```sh
node stylusapply.mjs ~/.config/<user-data-dir> [profile-dir] list|verify|reset
IG_STYLUS_BUNDLE=../../browser/stylus/out/stylus-import.personal.json \
  node stylusapply.mjs ~/.config/edge-personal Default reset   # a brand-hue bundle
```

`IG_STYLUS_BUNDLE` points it at one of the per-profile bundles codegen emits
from `[edge_profiles]`; without it the canonical Sage Ink bundle is installed.
The profile's Edge must be closed: Stylus's IndexedDB is locked while it runs.

`reset` is the mode that matters: back up → remove every style this repo owns
(any brand era, usercss or not) → install the current set → dedupe. Anything
not from this repo is never touched.

Why reset rather than install-on-top: older styles were pasted as **plain CSS,
not usercss**, and Stylus only dedupes usercss against usercss — so installing
stacked a second copy. One profile had four "Sage Ink — GitHub" entries, all
applying at once.

`verify` compares the installed **source** against the repo files. Use it
rather than reading counts: `getAll()` answers while Stylus is still loading, so
the same profile legitimately reads 15 and 36 seconds apart. Source comparison
cannot be raced.

The bundle it installs is generated output:

```sh
# regenerate browser/stylus/out/sage-ink-stylus-import.json from the .user.css files
python3 - <<'EOF'
import json, re, glob, time
files = sorted(glob.glob('browser/stylus/*.user.css')) + sorted(glob.glob('browser/stylus/sites/*.user.css'))
out = []
for path in files:
    src = open(path).read()
    meta = {k: (re.search(rf'^@{k}\s+(.+)$', src, re.M).group(1).strip()
                if re.search(rf'^@{k}\s+(.+)$', src, re.M) else None)
            for k in ('name','namespace','version','description','author','homepageURL','updateURL','license','preprocessor')}
    out.append({'enabled': True, 'name': meta['name'], 'updateUrl': meta['updateURL'],
                'url': meta['homepageURL'], 'installDate': int(time.time()*1000),
                'sourceCode': src, '_usercss': True,
                'usercssData': {**meta, 'preprocessor': meta['preprocessor'] or 'default', 'vars': {}}})
json.dump(out, open('browser/stylus/out/sage-ink-stylus-import.json','w'), indent=1, ensure_ascii=False)
EOF
```

Residue pass — the buckets `check.mjs` does not scan (off-token fills anywhere
in the viewport, gradients and blur, translucent fills at rest, filled selected
items, controls under 2px):

```sh
node residue.mjs browser/stylus/sites/youtube.user.css https://www.youtube.com/ /tmp/yt.png
node residue.mjs - https://www.youtube.com/     # unstyled baseline
```

Two smaller tools for writing a rule in the first place:

```sh
node vars.mjs https://www.facebook.com/marketplace/     # dump the site's own CSS custom properties
node probe.mjs <url> '<selector>'                       # which rules actually paint this element
node probe.mjs <url> '<selector>' --style browser/stylus/sites/<id>.user.css
                                  # ...with our sheet injected: walks @layer/@media too and marks
                                  # !important rules, so a host rule that outranks ours is visible
```

## When Google locks you out

Google starts serving `/sorry/index` after a handful of automated searches, and
it stays that way for hours — refreshing the cookie jar does not clear it. The
width rule in `google.user.css` can still be checked against
`fixtures/serp-grid.html`, a minimal reproduction of the real `#rcnt` grid:

```sh
node -e "..."   # see the fixture's own header comment for expected numbers
```

Expected with the current file: `652@143 -> 820@255` without a Knowledge panel,
and `652@143` unchanged when `#rhs` is present.

## Notes

- The browser is launched as a normal Edge process and attached over CDP.
  Playwright's own launcher advertises the automation switches and Google
  answers those with a CAPTCHA on every `/search` URL.
- Google rate-limits repeated automated searches anyway. Space the Google runs
  out; YouTube and Facebook have no such limit.
- Stylus wraps each style in `@-moz-document`, which Chromium drops. The
  harness unwraps it — taking care to find the block brace *outside* the
  prelude's parentheses, since `google.user.css`'s regexp contains `{2,3}`.
