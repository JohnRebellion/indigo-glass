# Sage Ink — Browser Layer

Non-destructive web retint for [Dark Reader](https://chromewebstore.google.com/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh) (`ifoakfbpdcdoeenechcleahebpibofpc`) and [Stylus](https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne) (`clngdbkpkpeebahjckkjfobafhncgmne`).

> Full design rationale: [../docs/PHILOSOPHY.md](../docs/PHILOSOPHY.md)

---

## Neither layer auto-syncs from this repo — read this before assuming a fix is live

Both Stylus and Dark Reader store their actual applied state **inside the browser's own extension storage**, not as files this repo can write to directly. Editing `indigo-glass.user.css` or `indigo-glass.json` in the repo changes nothing in a running browser until one of these happens:

- **Stylus**: `@updateURL` in the userstyle header points at `raw.githubusercontent.com/.../main/...` — Stylus only re-fetches from that URL (and only when you click "Check for updates," or on its own periodic check). A local, uncommitted, or unpushed-to-`main` edit is invisible to it, no matter how correct the repo file is. Fastest way to actually see a local edit: Stylus dashboard → open the installed style → replace its code with the current file content → Save (this is "Option B" below, and it's the only option that doesn't require a git push).
- **Dark Reader**: has no update URL at all. `indigo-glass.json` is a one-time **import** — Dark Reader only reflects whatever was true in the file the last time you ran Import. A repo edit needs a fresh **Manage settings → Import settings** to actually reach the running extension.

If you've edited either file and don't see the change: this is why — it's not a missed fix, it's a fix that hasn't been re-delivered to the browser yet.

---

## Layer split

| Layer | What it does |
|---|---|
| **Stylus** universal `.user.css` | Light-touch retint — scrollbars, selection, focus ring. Never inverts pages. Always safe. |
| **Dark Reader** preset | Page-wide inversion engine with Sage Ink colors. Toggle per-site if a page breaks. |

Run both together. Stylus paints the cross-cutting chrome (scrollbars/selection/focus). Dark Reader handles full-page inversion for sites without a native dark mode.

---

## Install — Stylus

### Option A — Auto-update from GitHub

1. Click in browser: [Install indigo-glass.user.css](https://raw.githubusercontent.com/JohnRebellion/indigo-glass/main/browser/stylus/indigo-glass.user.css)
2. Stylus prompts → Install
3. Future updates: push local changes to `main` first, THEN Stylus dashboard → "Check for updates" — it will not see anything sitting only in a local working tree or a feature branch.

### Option B — Manual paste (works with local, uncommitted changes)

1. Open `stylus/indigo-glass.user.css`
2. Stylus dashboard → find the installed style → **Edit** (or "Write new style" if not yet installed)
3. Replace the code with the current file content, Save

### What it paints

| Property | Value | Targets |
|---|---|---|
| Prose font | `Carlito → SF Pro Display → system-ui` | body, p, h1-h6, li, a, label, button, td/th, blockquote, dd/dt, small, strong, em, input (text), select |
| Loop-tail g/a allograph | Carlito via `unicode-range U+0061, U+0067` | every text element (browser auto-selects per glyph) |
| `::selection` | `rgba(166,201,166,0.45)` sage overlay | all selections |
| Scrollbar | `rgba(166,201,166,0.45)` thumb → hover `rgba(192,227,192,0.75)` | webkit + Firefox |
| `*:focus-visible` | `#A6C9A6` outline + `rgba(166,201,166,0.18)` 4px soft glow | all focus rings |

Universal `@-moz-document regexp("https?://.*")` — applies to every HTTPS/HTTP page.

**Safe on icon fonts.** No `*` universal selector, no `[class*="icon"|"editor"|"code"]` wildcards — those broke icon glyphs in Outlook, GitHub, etc. when used too broadly. Only explicit prose tags get the Carlito font. Sites' icon fonts (Segoe Fluent Icons, Material Icons, Font Awesome, codicon, etc.) keep working.

**Mono font NOT enforced** on browser. Native UA stylesheet renders `<code>/<pre>/<kbd>/<samp>/<tt>/textarea` as monospace using the user's system mono setting. Forcing Iosevka cross-site caught too many icon classes by class-substring matching. VSCode Claude Code retint handles mono enforcement in that controlled context.

---

## Install — Dark Reader

1. Open Dark Reader popup → ⚙ → **Manage settings** → **Import settings**
2. Select `darkreader/indigo-glass.json`
3. Dark Reader applies the Sage Ink palette:

| Setting | Value |
|---|---|
| Mode | Dark |
| Brightness | 96 |
| Contrast | 100 |
| Background | `#090909` |
| Text | `#F8F8F8` |
| Scrollbar | `#A6C9A6` |
| Selection | `#A6C9A6` |
| Engine | `dynamicTheme` |

**Background is `#090909`, not Sage Ink's canonical `base` token (`#07080A`)
— deliberately.** Dark Reader's `dynamicTheme` engine (`getBgPole()` in its
own source, `src/inject/dynamic-theme/modify-colors.ts`) uses
`darkSchemeBackgroundColor` as a **pole**: any background it classifies as
neutral (saturation < 12%) on *any* non-`disabledFor` site gets its hue and
saturation pulled toward that pole, not toward true grey. `#07080A` measures
H=220° (blue), S=17.6% in HSL — nowhere near neutral despite reading as
near-black by eye - so every "already fairly neutral" dark background across
the whole web was being tinted blue by this one value. `#090909` is the same
near-black lightness with H=0°/S=0% (verified via `colorsys.rgb_to_hls`) -
neutralises the pole without changing how dark it reads. This is
Dark-Reader-specific: nowhere else in Sage Ink does `base`'s value get
broadcast onto unrelated third-party page elements, so this is the one place
it needed to diverge from the canonical token.

The same `#090909` also replaces `#181a1b` in the 4 `builtIn` Office/
SharePoint/Google Docs/OneDrive entries in `customThemes` — Dark Reader's
own shipped defaults for those sites, not authored here, but `#181a1b`
carried the same pole bug at a smaller scale (H=200°, S=5.88%, ~3x weaker
than the bug above) *and* sat at L=10%, notably lighter than Sage Ink's
near-black depth everywhere else. Darkening these does trade away whatever
extra headroom Dark Reader's team gave those specific sites for their
complex embedded canvases (Office Web Apps, the Docs iframe editor) — worth
watching if either looks washed-out or low-contrast after re-import.

Includes a preset block `Sage Ink` targeting `*` so the palette applies globally. **Re-run the import any time this JSON changes** — Dark Reader does not watch the file, it only reads it at import time.

### Native-dark sites — Dark Reader disabled by default

`indigo-glass.json` ships a `siteList`/`disabledFor` list of sites that already have their own dark mode. Stacking Dark Reader on top double-processes the source colors (e.g. Facebook's brand blue gets flattened into a neutral, hueless black — measured directly off a real screenshot pair: native Facebook dark mode is `#0E1114`, genuinely blue-tinted; with Dark Reader's `dynamicTheme` forcing itself over it, it becomes `#0E0E0E`, perfectly neutral). Cleaner to let each site's native dark mode render.

This exact Facebook case was cited here as the rationale for years before `facebook.com` itself was ever actually added to the list below (2026-08-30) — the list had drifted out of sync with its own documented reasoning.

Currently disabled: github.com, fast.com, mail.google.com, settings, www.google.com, www.instagram.com, facebook.com, www.facebook.com, m.facebook.com, www.youtube.com, status.claude.com, docs.google.com, legacy.quran.com, linear.app, chatgpt.com, chat.openai.com, notion.so, notion.site, claude.ai.

To add more: Dark Reader popup → click toggle → "**OFF for this site**". Or edit `disabledFor` in the JSON and re-import.

---

## Install across Edge profiles

Edge stores extensions per-profile under `~/.config/microsoft-edge/<profile>/Extensions/`. The Dark Reader settings JSON imports the same on each profile. Stylus styles sync via the extension's built-in **Backup** → **Export/Import** if cloud-sync is off.

The repo also ships `scripts/sync-browser-theme.sh`, which clones the "Personal" Edge profile's already-correct extension storage into the MTUSA/SIDA4/Tyremax profiles — this propagates a profile that's already right, it does **not** fix the Personal profile itself if that one is stale (see the "neither layer auto-syncs" section above for how to actually get a fix into any single profile first). Refuses to run while any Edge process is alive (LevelDB corruption risk).

Manual steps per profile if not using the sync script (MTUSA / SIDA4 / Personal):

1. Open each Edge profile
2. Install Dark Reader + Stylus from Chrome Web Store
3. Run the imports above for each

Or sync via extension cloud: Stylus has a built-in dropbox/google sync; Dark Reader respects `syncSettings: true` (already set in `indigo-glass.json`).

---

## Chrome / Chromium

Identical to Edge. Same extension IDs, same imports. No extra work.

---

## Combining with the rest of Sage Ink

This browser layer is the **outermost ring** of the design system:

```
KDE Plasma (window deco + blur)
  └ Konsole (terminal)
  └ VSCode (editor + Claude Code retint)
  └ GRUB (boot picker)
  └ Browser  ← you are here
        ├ Stylus  (cross-site chrome)
        └ Dark Reader (page inversion)
```

All five layers share the same canonical palette so the visual identity follows you from boot → desktop → editor → browser without color drift — **once each layer's own delivery mechanism has actually been re-run** (see above; none of them auto-propagate from a repo edit alone).
