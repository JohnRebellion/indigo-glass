# Lime Glass - Per-site Stylus overrides

Surgical retints for sites where the universal Lime Glass Stylus style isn't enough OR where the site has strong native dark mode that just needs accent realignment.

## Sites covered

| File | Domain | Strategy |
|---|---|---|
| `claude-ai.user.css` | claude.ai | Full palette override - Anthropic's surface vars |
| `chatgpt.user.css` | chatgpt.com + chat.openai.com | OpenAI surface vars + interactive accent |
| `notion.user.css` | notion.so + notion.site | Notion `--notion-*` color vars |
| `linear.user.css` | linear.app | Light retint - Linear is already aligned w/ our design philosophy |

All four:
- Override `:root` CSS custom properties the site already defines (no specificity wars)
- Force prose font to `IndigoLoopTail -> Carlito` (loop-tail g/a)
- Force code blocks to Iosevka Custom Condensed
- Carry lime `#A8E635` accent + accent-alt `#8BC406` + amber/positive/negative semantic

## Install

Each `*.user.css` installs separately via Stylus:

1. Open the raw URL in browser:
   `https://raw.githubusercontent.com/JohnRebellion/indigo-glass/main/browser/stylus/sites/<site>.user.css`
2. Stylus prompts "Install" - confirm
3. Future updates: Stylus dashboard -> Check for updates

## Why per-site

The universal Stylus style avoids most font/scrollbar drift cross-site. But sites with their OWN dark mode (Linear, Notion, Claude, ChatGPT) use brand-specific accent colors that read as "wrong" alongside Lime Glass elsewhere. Surgical per-site CSS shifts ONLY their accent CSS vars to lime - native dark surfaces stay intact.

## Add a new site

1. Open the site, devtools -> Computed -> look for `--bg-*` `--text-*` `--accent-*` CSS custom properties on `:root` or `html`
2. Map their tokens to Lime Glass palette:
   - bg/surface family -> base/surface/surface_alt
   - text family -> text/text_muted/text_dim
   - accent/primary -> accent/accent_hi
   - semantic (red/green/yellow) -> negative/positive/amber
3. Copy `claude-ai.user.css` as template, change domain + var names, save in this dir
4. Commit + push -> auto-update via `@updateURL`
