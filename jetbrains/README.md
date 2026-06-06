# Indigo Glass - JetBrains IDE color scheme

Works on: IntelliJ IDEA, PyCharm, WebStorm, RustRover, GoLand, Rider, PhpStorm, RubyMine, CLion, DataGrip, Android Studio (any JetBrains IDE).

## Install

1. Copy `Indigo Glass.icls` to your IDE config:

   Linux:
   ```bash
   # IntelliJ IDEA Community 2025.x example
   cp "Indigo Glass.icls" ~/.config/JetBrains/IdeaIC2025.2/colors/
   ```

   Win:
   ```pwsh
   Copy-Item "Indigo Glass.icls" "$env:APPDATA\JetBrains\IdeaIC2025.2\colors\"
   ```

   For other IDEs, replace `IdeaIC2025.2` with the IDE's config dir name (e.g. `PyCharm2025.2`, `RustRover2025.2`).

2. Or via UI: Settings -> Editor -> Color Scheme -> gear icon -> Import Scheme -> pick `.icls`.

3. Restart IDE.

## Font setup (match the rest of Indigo Glass)

Settings -> Editor -> Font:
- Family: `Iosevka Custom Condensed`
- Size: per host profile (11 default, 14 Aspire5)
- Line height: 1.2
- Fallback: `MesloLGS NF`

Settings -> Appearance & Behavior -> Appearance -> Font:
- Family: `Carlito`
- Size: 11 / 14 per host

## Token mapping

| Indigo Glass token | JetBrains key |
|---|---|
| `base` `#0F0F12` | Default scheme background |
| `surface_alt` `#1F2028` | Notification + tooltip bg |
| `text` `#F8F8F8` | Foreground |
| `text_muted` `#6B7280` | Line numbers, comments |
| `indigo` `#5E6AD2` | Selection bg, focus border |
| `indigo_hi` `#818CF8` | Caret, hover, keywords, modified tab |
| `violet` `#A78BFA` | Class/type, number, predefined symbol |
| `positive` `#71F79F` | String literal, VCS added |
| `amber` `#FBBF24` | Function name, escape char, VCS modified |
| `negative` `#ED254E` | Error, invalid escape, VCS removed |

## Token-type aesthetic (matches VSCode Indigo Glass theme)

- **Keyword**: indigo+1 bold (`818CF8`)
- **Class / Type / Number / Const**: violet (`A78BFA`)
- **String**: positive (`71F79F`)
- **Function (decl/call/static/instance)**: amber (`FBBF24`)
- **Comment**: muted italic (`6B7280`)
- **Operator**: indigo-bright (`A2B0FF`)
- **Punctuation (brace/bracket/dot)**: muted (`6B7280`)
- **Variable / Parameter / Property**: text (`F8F8F8`)

Matches VSCode `vscode/themes/indigo-glass-dark.json` choices.
