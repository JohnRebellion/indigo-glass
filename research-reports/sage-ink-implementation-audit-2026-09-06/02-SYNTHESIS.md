# Synthesis — Sage Ink implementation audit, 2026-09-06

Reviewers: two independent models (`groq -m big`, `groq -m qwen`), each given
the same brief with no sight of the other's reply. Raw replies in `returns/`,
verbatim.

**Headline:** the reviewers agreed on the diagnosis of the *class* of defect
and converged, independently, on patching the compiled path. Verification then
showed the patch target they both named was **the wrong library** — the fix
belonged in code this project already owns. That inversion is the main result
of this audit.

---

## 1. Where they agree (and are right)

**The blind spot is runtime-state divergence, not static drift.** Both models
described it in near-identical terms: the guards verify that the *source of
truth* is correct, never that the *consumer* reads it. Qwen's framing is the
sharper one — "the scanner looked at the file; the application looked at the
daemon-cache".

This is correct and is exactly what both live findings were. It also explains
why the existing guard could not have caught either: `check-palette-drift.sh`
is a text scanner over repo files, and neither defect exists as text in the
repo.

**Both proposed the same class of remedy** — assert on *effective* values in a
controlled environment, not on source. Both explicitly rejected
"screenshot-and-eyeball" as the answer, which was the constraint the brief
imposed.

**Both flagged the false-confidence risk** (Q5) without hedging: six green
scans plus 44/44 tests coexisted with two real defects, and the greenness
actively discourages building the runtime checks that would have caught them.
Accepted — this audit is the evidence for the claim.

## 2. Where they disagree

**Q2, the GTK theme sources.** Big proposed making `settings.ini` a generated
read-only mirror of gsettings. Qwen proposed a systemd user service polling
every 30s and resetting divergence.

Big wins. Qwen's watchdog is disproportionate: it converts a once-per-install
concern into a permanently running process that fights the user's own tooling,
and "resets the value every 30 seconds" is hostile behaviour if someone
deliberately switches theme to test something. Big's mirror direction is also
the one that matches how the repo already works — every other layer is
generated from a single source.

**Q3, Dolphin.** Big chose (b) patch `libKF6ItemViews` outright. Qwen opened on
(c), worked the alpha arithmetic in the open, established that no input colour
can produce an opaque output through a hardcoded sub-1.0 alpha, and reversed
itself to (b).

Qwen's reasoning is the more valuable artefact even though it reached the same
place — it supplies the *reason* (c) is a trap, which Big asserted without
demonstrating. Both, however, were operating on my brief's framing, and that
framing was wrong. See §4.

## 3. What I reject

- **Qwen's systemd theme watchdog.** Disproportionate, user-hostile, and
  introduces a daemon to solve a problem that only occurs at write time.
- **Big's "install a daemon that watches gsettings and rewrites settings.ini"**
  (offered as an optional extra alongside the mirror). Same objection.
- **Big's claim that the shadow-geometry scan gives "false sense of coverage"
  because platform defaults may override the drawn shadow.** Unverified
  speculation. The repo's shadow tokens are consumed by generated artefacts
  and the tone suite asserts shadow/fill separation on rendered output. Big
  gave no mechanism by which a platform default would win, and I found none.
- **Qwen's proposal to make `settings.ini` read-only or remove the theme key.**
  GTK3 apps genuinely read `settings.ini`; removing the key breaks them. Qwen
  hedged this with "if possible" — it isn't.
- **Both models' Q1 proposal to introspect `QStyle::pixelMetric` in a headless
  harness.** Sound in principle, but neither defect found here was a
  `pixelMetric` value — one was a pen width passed positionally at a call site,
  the other a config key outside Qt entirely. This would not have caught either.

## 4. The finding that inverts both reviewers — verified

The brief told both models that Dolphin's selection is painted by
`KItemListView` in compiled KDE Frameworks code, and asked whether to patch
`libKF6ItemViews`. Both answered within that frame. **The frame was wrong**,
and my own ledger entry was the source of the error.

Reading `~/src/dolphin/src/kitemviews/kitemlistwidget.cpp:642`:

```cpp
// TODO: Remove this check after Plasma 6.8 release
if (style()->name() == QStringLiteral("breeze")) {
    // ... hardcoded rounded rect, roundness 5, penWidth 1.25,
    //     focusColor.lighter(110), alpha 0.32/0.40 fills ...
} else {
    style()->drawPrimitive(QStyle::PE_PanelItemViewItem, &viewItemOption, painter, widget);
    // ... PE_FrameFocusRect ...
}
```

Dolphin's hardcoded selection painting is **fenced behind a breeze-only
branch**. Verified empirically that Klassy does not report that name:

```
$ QT_QPA_PLATFORM=offscreen QT_STYLE_OVERRIDE=klassy python3 -c '...'
style objectName: klassy
style name():     klassy
metaObject:       Breeze::Style
```

So Dolphin takes the `else` branch and delegates to `PE_PanelItemViewItem` —
**our own patched `Style::drawPanelItemViewItemPrimitive`** in
`config/klassy/tierc-outline.patch`. No `libKF6ItemViews` patch is needed or
warranted. Both reviewers recommended taking on maintenance of a patched core
KDE Frameworks library to fix a defect in code this project already maintains.

This is the intended function of step 6 of the cross-model method ("treat every
reply as input, not instruction"), and it fired. It is also a caution about
brief quality: **both models were wrong in the same direction because I fed
them the same wrong premise.** Independent review does not protect against a
shared bad input.

## 5. Applied

### Finding 1 — gsettings unmanaged (fixed, verified)

`scripts/install.sh` set both `settings.ini` files but never gsettings, which
libadwaita/GTK4 and `xdg-desktop-portal` consumers actually read. Live state
had `settings.ini` = `SageInk` while gsettings = `WhiteSur-Dark-purple`.

Added a guarded block setting `gtk-theme`, `icon-theme`, `color-scheme`,
`cursor-theme`, `font-name`, with an explicit `else` warning when `gsettings`
is absent. Applied live and confirmed:

```
gtk-theme:    'SageInk'
icon-theme:   'Papirus-Dark'
color-scheme: 'prefer-dark'
cursor:       'Bibata-IndigoGlass'
```

`bash -n scripts/install.sh` passes.

### Finding 2a — Tier C ring is 1px, not 2px (fixed, built, installed)

`Helper::renderFocusRect` (`kstyle/breezehelper.cpp:453`) did
`painter->setPen(outline)` with a bare `QColor`, which yields a width-1
cosmetic pen. `drawPanelItemViewItemPrimitive` sets the ring *colour* but had
no way to set its *width*, so the Tier C on-select ring shipped at 1px against
a grammar that specifies 2px — across every QStyle item view, Dolphin
included.

Changed to `painter->setPen(QPen(outline, 2))` — the same idiom already used at
`breezehelper.cpp:660` in `renderMenuFrame`, so this is precedent in the same
file, not a new convention.

- Hunk appended to `config/klassy/tierc-outline.patch` (tracked in-repo).
- `git apply --check --reverse` against the working tree passes, so the tracked
  patch and the built source are identical.
- Rebuilt. Note the build initially failed on a stale CMake cache pinning Qt
  `6.11.1` while the system had moved to `6.11.2` — a reconfigure fixed it.
  Unrelated to this change, but it means **the previously shipped binary could
  not have been rebuilt from a clean checkout either**; worth knowing.
- `klassy6.so` installed to `/usr/lib64/qt6/plugins/styles/`, hash-identical to
  the build output. Prior binary preserved as `klassy6.so.backup-20260906`.
- No KWin or Plasma restart performed, per explicit instruction. Already-running
  Qt apps keep the old style in memory; newly launched ones get the fix.

**Not visually confirmed.** Attempts to relaunch Dolphin and re-measure the ring
failed — the process starts and stays alive but never maps a window, so the
post-fix screenshot contains no Dolphin. The fix is verified at source and
binary level (exact change, compiles, installed hash matches) but the rendered
2px ring has **not** been pixel-measured. That measurement is the outstanding
verification.

### Finding 2b — ring colour is `#B7DDB7`, not the `#F8F8F8` ring token (open)

Pixel-sampled from the pre-fix capture: exactly one pixel row at y=354 and
y=373, `(183,221,183)`. Tier C specifies the near-white `--ring`/
`DecorationFocus` token. `DecorationFocus=248,248,248` is set correctly in all
seven colour groups of both colour-scheme files; this paint path does not read
it.

Provenance **not pinned**, and I want to be explicit that I failed to close
this rather than leave a plausible-sounding guess in the record. Three
hypotheses were computed and two were refuted outright:

| Hypothesis | Predicted | Verdict |
|---|---|---|
| `Highlight` at alpha 0.8 over surface `#0D0D10` | `#87A388` | **Refuted** |
| `Highlight` at alpha 0.8 over its own fill | backdrop `(251,301,251)` | **Refuted** — out of gamut |
| `Highlight.lighter(110)` | `#B7DDB7` | **Exact byte match** |

The third matches perfectly, but the only code performing that scale is
Dolphin's `focusColor.lighter(110)` inside the breeze-only branch — which the
empirical style-name check says is not taken. Either the branch *is* somehow
reached, or a different path produces the same 1.1× value scale coincidentally.
`lighter(110)` is a plain 1.1× multiply on HSV value, so coincidence is not
far-fetched.

**Next step:** instrument the paint path, or test whether the ring colour
changes with row current-ness (`m_current && State_Active`) — the `selected`
vs `current` distinction is the most likely explanation, since Klassy's patch
keys its white override off `selected` while Dolphin gates its focus decoration
on `current`. Do not patch the colour before this is settled.

### Ledger correction

`docs/OUTLINE-SWEEP-2026-08-30.md`'s "Dolphin file listing" wall entry was
wrong on two counts and has been rewritten with the measured evidence: it
described a filled rect (now an outline) and prescribed a `libKF6ItemViews`
patch (not needed — the breeze-branch check means our own Klassy patch owns
this path).

## 6. What the vision model got wrong

Both fabrications were caught by checking source, per the established
discipline. Recording them because the pattern is consistent across audits:

1. Claimed our `input-otp` had "five connected boxes with rounded outer corners
   and no center separator". Source: six slots, no `border-radius` declared at
   all, and a blinking caret element. **Wrong on three counts.**
2. Claimed the GTK TreeView selected row showed no selection outline. The theme
   declares `box-shadow: inset 0 0 0 2px @theme_text_color`. No row had been
   clicked — absence of selection, not absence of styling. **My capture error,
   reported as a theme defect.**

It also produced pixel coordinates exceeding the actual image dimensions
(claimed features at y≈990 in a 716px-tall image), confirming its geometry
estimates are extrapolated rather than measured. Its *qualitative* reads —
"1px not 2px", "outline not fill" — held up under pixel sampling. Treat it as a
detector, never as a measuring instrument.

## 7. Verified clean

- All six drift scans clean; `codegen.py --check` exits 0.
- Simulator suite: 44 passed, 5 skipped, 0 failed.
- 52 specimens captured from our build, 46 from the live neobrutalism.dev
  reference; all five section montages diffed. Every reported difference was
  either an already-ledgered deliberate divergence, a documented page
  convention, or a fabrication (§6). **No new unledgered composition defects.**
- GTK3 widget factory: opaque fills, 0px radius on buttons/entries/checkboxes/
  frames/progress/sliders, pills only on switches, circular radio indicators.
- Konsole: flat opaque fill, 0px radius, no translucency.
- Dolphin: selection is an **outline**, not a fill — the Tier C noun is correct
  in the live compiled widget.

## 8. Open

1. **Pixel-measure the 2px ring** in a freshly launched Dolphin. The one
   verification this audit set up and did not complete.
2. **Pin `#B7DDB7`'s provenance** (§5, Finding 2b) before touching the colour.
3. **Make `settings.ini` a generated mirror** of the gsettings value rather than
   a third hand-maintained source (Big's Q2, accepted, not yet implemented).
4. **Runtime resolution assertions** — the one substantive new mechanism both
   reviewers proposed and the only class of check that would have caught either
   finding. Scope it narrowly: a headless Qt/GTK harness that renders one known
   widget per backend and asserts border width, ring colour and radius against
   token values. Not a screenshot suite.
5. **Uncommitted.** Everything in this audit is working-tree only.

---

# Addendum — remaining layers, 2026-09-06

The first pass covered Plasma, GTK, Konsole and the web simulator. This
addendum covers every other themed layer, on request.

## Correction to §5, Finding 2a

The synthesis above said the 2px ring fix was "not visually confirmed". It is
now confirmed, and two errors in that section need correcting:

1. **A backup file broke the first test.** `klassy6.so.backup-20260906` was
   written *into* `/usr/lib64/qt6/plugins/styles/`, and Qt's plugin loader
   globs that directory — it loaded the backup, not the fix. Verified via
   `/proc/<pid>/maps`. Backup relocated to `/var/backups/sageink/` (preserved,
   not deleted); the correct file now loads.
2. **My measurement threshold was wrong.** After the loader was fixed, the ring
   still read as "1px" because I filtered on `>140` brightness, which counts
   only the fully-covered row. A 2px antialiased stroke on a half-pixel grid
   offset renders as one full row plus one ~50% row. Sampling raw pixels shows
   `(183,221,183)` + `(95,115,97)` — i.e. **2px, as intended**. The fix was
   working before I declared it wasn't.

## Finding 2b — closed

Provenance of `#B7DDB7` is now pinned, and it was **not** in Dolphin. It is
`Style::drawFrameFocusRectPrimitive` (`kstyle/breezestyle.cpp:4411`):

```cpp
auto outlineColor(palette.color(HighlightColor));
outlineColor = outlineColor.lighter(Metrics::Focus_LightenColorValue);
```

with `Focus_LightenColorValue = 110` (`breezemetrics.h:164`) — exactly the
`lighter(110)` the arithmetic matched byte-for-byte. Dolphin's file rows are
`QGraphicsWidget`s and reach this via the branch Klassy itself comments as
`// Dolphin uses these`. The identical constant appearing in Dolphin's
breeze-only branch was a coincidence that cost several wrong turns.

**Fixed:** `outlineColor` now starts as `Qt::white` (the Tier C `--ring`
noun), matching what `drawPanelItemViewItemPrimitive` already does for the
QStyle item-view ring. Rebuilt, installed, and **measured**: ring is now
`(255,255,255)` at 2px. Off-token `#B7DDB7` is gone.

`config/klassy/tierc-outline.patch` regenerated from source — 5 hunks
(`polish`, `drawFrameFocusRectPrimitive`, `drawPanelItemViewItemPrimitive`,
`drawMenuItemControl`, `renderFocusRect`), `git apply --check --reverse`
passes against the built tree.

## The real finding: most layers are shipped but not deployed

Every non-desktop layer was checked for *live* deployment, not just file
correctness. The result reframes what "consistent implementation" means here.

| Layer | Artefact | Deployed? |
| :--- | :--- | :--- |
| Klassy decoration + QStyle | patched, built | **yes** |
| Plasma colour scheme / widget theme | `SageInk` | **yes** |
| GTK3 / GTK4 | `~/.themes/SageInk` | **yes** (gsettings fixed this pass) |
| Konsole | `DefaultProfile=SageInk.profile` | **yes** |
| Cursor | `Bibata-IndigoGlass` in `~/.icons` | **yes** |
| **Edge theme** | `browser/edge-theme/`, manifest v1.3.1 | **no** — `theme id: (none)` |
| **Stylus userstyles** | `browser/stylus/` | **no** — Stylus not installed |
| **Dark Reader config** | `browser/darkreader/` | **no** — not installed |
| **Vencord** | `vencord/indigo-glass.theme.css` | **no** — Discord is a flatpak with no Vencord |
| **Spicetify** | `spicetify/Themes` | **no** — Spotify not installed |
| **Obsidian** | `obsidian/Indigo Glass` | **no** — Obsidian not installed |
| **SDDM** | `sddm/indigo-glass/` | **no** — `Current=sweet-plasma6` |
| **JetBrains** | `Indigo Glass.icls` | **no** — no JetBrains config dir |
| **Windows** | `windows/` | n/a — different machine |

Edge, Discord and Chrome *are* installed; their themes are not applied. The
others have no host application on this machine at all.

Note the earlier claim in this session that Discord/Spotify/Obsidian were
"running" was wrong — `pgrep -f` matched my own shell command line. Corrected
with `pgrep -x` and `flatpak list`.

## Edge theme — verified correct, just unloaded

The manifest's `tints.buttons` is the one value no hex-based drift scan can
see (stored as an `[H,S,L]` triple), and it is the value that stayed indigo
through the sage migration once before. Checked it explicitly:

```
manifest tint:        H=0.33   S=0.38   L=0.82
accent_hi #C0E3C0:    H=0.3333 S=0.3846 L=0.8216
```

**On-token.** The known blind spot is clean.

But live Edge chrome samples `(25,25,28)` where the manifest specifies
`frame`/`toolbar` = `(18,18,22)`, and the tab strip reads `(46,46,50)` — a
value not in the manifest at all. That is Edge's stock dark theme, confirmed
by `theme id: (none)` in the profile Preferences. The theme has never been
loaded.

## What this means

The drift guard's scan-by-exclusion design makes *file* drift very hard to
hide, and it is doing its job — the Edge HSL triple, the historical failure
case, is correct today. What nothing in the repo checks is whether a correct
file was ever **installed**. That is the same shape as Finding 1 (gsettings):
the artefact was right, the consumer never read it.

This is a stronger version of the runtime-assertion gap both reviewers
identified. A deployment-state check is cheaper than their proposed headless
render harness and would have caught Finding 1 *and* every row of the table
above:

- `theme id` in the Edge profile Preferences == the Sage Ink extension id
- `gsettings get org.gnome.desktop.interface gtk-theme` == `SageInk`
- `konsolerc DefaultProfile` == `SageInk.profile`
- SDDM `Current` == the Sage Ink theme
- Vencord/Spicetify theme files present in their live config dirs

Each is a one-line assertion with an obvious failure mode, and unlike a render
harness it needs no display server. Recommend `scripts/check-deployment.sh`
alongside `check-palette-drift.sh`, reporting per layer: *deployed*,
*shipped-but-not-installed*, or *host app absent* — the last being a
legitimate state, not a failure.

## Not done

- No fix applied to any undeployed layer. Installing an Edge theme, Stylus, or
  Vencord changes the user's applications, which is outside what an audit
  should do unprompted.
- Chrome and Waterfox are installed and were not checked for theming.
- `check-deployment.sh` is a recommendation, not written.
