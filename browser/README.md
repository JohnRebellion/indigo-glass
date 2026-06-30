# Lime Glass — Browser Layer

Non-destructive web retint for [Dark Reader](https://chromewebstore.google.com/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh) (`ifoakfbpdcdoeenechcleahebpibofpc`) and [Stylus](https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne) (`clngdbkpkpeebahjckkjfobafhncgmne`).

> Full design rationale: [../docs/PHILOSOPHY.md](../docs/PHILOSOPHY.md)

---

## Layer split

| Layer | What it does |
|---|---|
| **Stylus** universal `.user.css` | Light-touch retint — scrollbars, selection, focus ring. Never inverts pages. Always safe. |
| **Dark Reader** preset | Page-wide inversion engine with Lime Glass colors. Toggle per-site if a page breaks. |

Run both together. Stylus paints the cross-cutting chrome (scrollbars/selection/focus). Dark Reader handles full-page inversion for sites without a native dark mode.

---

## Install — Stylus

### Option A — Auto-update from GitHub

1. Click in browser: [Install indigo-glass.user.css](https://raw.githubusercontent.com/JohnRebellion/indigo-glass/main/browser/stylus/indigo-glass.user.css)
2. Stylus prompts → Install
3. Future updates: Stylus dashboard → "Check for updates"

### Option B — Manual paste

1. Open `stylus/indigo-glass.user.css`
2. Stylus dashboard → "Write new style"
3. Paste, Save

### What it paints

| Property | Value | Targets |
|---|---|---|
| Prose font | `Carlito → SF Pro Display → system-ui` | body, p, h1-h6, li, a, label, button, td/th, blockquote, dd/dt, small, strong, em, input (text), select |
| Loop-tail g/a allograph | Carlito via `unicode-range U+0061, U+0067` | every text element (browser auto-selects per glyph) |
| `::selection` | `rgba(94,106,210,0.45)` indigo glass overlay | all selections |
| Scrollbar | `rgba(94,106,210,0.45)` thumb → hover `rgba(129,140,248,0.75)` | webkit + Firefox |
| `*:focus-visible` | `#5E6AD2` outline + `rgba(94,106,210,0.18)` 4px soft glow | all focus rings |

Universal `@-moz-document regexp("https?://.*")` — applies to every HTTPS/HTTP page.

**Safe on icon fonts.** No `*` universal selector, no `[class*="icon"|"editor"|"code"]` wildcards — those broke icon glyphs in Outlook, GitHub, etc. when used too broadly. Only explicit prose tags get the Carlito font. Sites' icon fonts (Segoe Fluent Icons, Material Icons, Font Awesome, codicon, etc.) keep working.

**Mono font NOT enforced** on browser. Native UA stylesheet renders `<code>/<pre>/<kbd>/<samp>/<tt>/textarea` as monospace using the user's system mono setting. Forcing Iosevka cross-site caught too many icon classes by class-substring matching. VSCode Claude Code retint handles mono enforcement in that controlled context.

---

## Install — Dark Reader

1. Open Dark Reader popup → ⚙ → **Manage settings** → **Import settings**
2. Select `darkreader/indigo-glass.json`
3. Dark Reader applies Lime Glass palette:

| Setting | Value |
|---|---|
| Mode | Dark |
| Brightness | 96 |
| Contrast | 100 |
| Background | `#0F0F12` |
| Text | `#F8F8F8` |
| Scrollbar | `#5E6AD2` |
| Selection | `#5E6AD250` |
| Engine | `dynamicTheme` |

Includes a preset block `Lime Glass` targeting `*` so the palette applies globally.

### Native-dark sites — Dark Reader disabled by default

`indigo-glass.json` ships a `siteList` of 20 sites that already have their own dark mode. Stacking Dark Reader on top double-processes the source colors (e.g. Facebook's brand blue gets blended with `#0F0F12` into muddy blue-black). Cleaner to let each site's native dark mode render.

Disabled list:
- facebook.com, messenger.com, instagram.com
- x.com, twitter.com, linkedin.com
- github.com, stackoverflow.com, reddit.com
- youtube.com, spotify.com, monkeytype.com
- claude.ai, chatgpt.com, openai.com
- discord.com, linear.app, notion.so, vercel.com

To add more: Dark Reader popup → click toggle → "**OFF for this site**". Or edit `siteList` in the JSON and re-import.

---

## Install across Edge profiles

Edge stores extensions per-profile under `~/.config/microsoft-edge/<profile>/Extensions/`. The Dark Reader settings JSON imports the same on each profile. Stylus styles sync via the extension's built-in **Backup** → **Export/Import** if cloud-sync is off.

Manual steps per profile (MTUSA / SIDA4 / Personal):

1. Open each Edge profile
2. Install Dark Reader + Stylus from Chrome Web Store
3. Run the imports above for each

Or sync via extension cloud: Stylus has a built-in dropbox/google sync; Dark Reader respects `syncSettings: true` (already set in `indigo-glass.json`).

---

## Chrome / Chromium

Identical to Edge. Same extension IDs, same imports. No extra work.

---

## Combining with the rest of Lime Glass

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

All five layers share the same canonical palette so the visual identity follows you from boot → desktop → editor → browser without color drift.
