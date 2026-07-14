# Lime Glass - Spicetify (Spotify desktop)

## Install

```bash
# Install Spicetify if not yet
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh

# Copy theme into Spicetify Themes dir
cp -r Themes/indigo-glass "$(spicetify -c | xargs dirname)/Themes/"

# Activate
spicetify config current_theme indigo-glass color_scheme dark
spicetify apply
```

To revert:
```bash
spicetify config current_theme '' color_scheme ''
spicetify apply
```

## What it does

- 16-color palette in `color.ini` matching Lime Glass tokens
- `user.css` adds compact density (track rows 2/8px), translucent now-playing bar (rgba(13,13,16,0.85) + 13px backdrop blur), lime selection + buttons + focus ring + progress bars
- Honors `prefers-reduced-transparency: reduce` -> flattens panels to solid `#121216`
- Carlito body font (uses local install)

## Color map

| Spicetify | Lime Glass token | Hex |
|---|---|---|
| main | base | #07080A |
| sidebar | sidebar | #0A0A0D |
| player | surface | #0D0D10 |
| card | surface_alt | #121216 |
| text | text | #F8F8F8 |
| subtext | text_muted | #6B7280 |
| button | accent | #A8E635 |
| button-active | accent_hi | #C1FF58 |
| misc | accent_alt | #8BC406 |
| equalizer | positive | #71F79F |
| notification-error | negative | #ED254E |
