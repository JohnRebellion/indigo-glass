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
- `user.css` adds compact density (track rows 2/8px), translucent now-playing bar (rgba(28,28,33,0.85) + 13px backdrop blur), indigo selection + buttons + focus ring + progress bars
- Honors `prefers-reduced-transparency: reduce` -> flattens panels to solid `#1F2028`
- Carlito body font (uses local install)

## Color map

| Spicetify | Lime Glass token | Hex |
|---|---|---|
| main | base | #0F0F12 |
| sidebar | sidebar | #18181C |
| player | surface | #1C1C21 |
| card | surface_alt | #1F2028 |
| text | text | #F8F8F8 |
| subtext | text_muted | #6B7280 |
| button | indigo | #5E6AD2 |
| button-active | indigo_hi | #818CF8 |
| misc | violet | #A78BFA |
| equalizer | positive | #71F79F |
| notification-error | negative | #ED254E |
