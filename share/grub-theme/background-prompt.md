# GRUB background — AI image-gen prompt (reference)

Alternative to `generate-background.sh`'s procedural bake, for when an
AI-generated background is wanted instead (Nano Banana / Gemini image,
GPT-image-1, etc). Grounded in `theme.txt`'s actual layout: the 5 stat-card
labels sit at `top=130-300`, the boot menu spans `top=470` through
`height=880`, filling most of the lower two-thirds of the frame — hence the
"keep the center empty" instruction below, not a stylistic guess.

```
2560x1440, 16:9, ultra-wide desktop wallpaper for a GRUB boot-menu background.

STYLE: neobrutalist, flat, hard-edged graphic design — NOT a soft glowing nebula, NOT gradient bloom, NOT ambient blur, NOT glassmorphism. Think bold flat colour-block geometry, thick solid dividing lines, sharp 90-degree corners, high contrast — the opposite of a dreamy sci-fi wallpaper. Zero depth-of-field, zero soft light streaks, zero radial glow.

PALETTE (strict — do not substitute or add other hues):
- Base/background: deep near-black #07080A (fills ~85% of the frame)
- Accent: muted sage green #A6C9A6, with a darker sage #89A889 for shadow/secondary shapes
- One optional bright highlight: mint-green #3FFABB, used sparingly as a single accent detail, never as a wash

COMPOSITION: a small number of large, flat, geometric sage shapes (thick rectangles, chevrons, or a sparse grid of thin hard-edged lines) positioned only in the outer ~20% border of the frame — top-left and bottom-right corners work well. Keep the entire CENTER 60% of the frame (both horizontally and vertically) empty, flat, solid near-black #07080A with NO shapes, NO texture, NO gradient — this space is reserved for a 5-column text strip near the top and a large boot-menu list occupying the middle-to-lower two-thirds. Any pattern must stay confined to the far edges and corners so text drawn on top stays fully legible.

NO text, no logos, no UI elements, no border frame, no vignette darkening (the base is already near-black), no lens flare, no bokeh, no film grain, no noise texture. Pure flat vector-style geometric shapes only, like a neobrutalist poster background, not a photo or 3D render.
```

## Why this exists alongside the procedural script

`generate-background.sh` is the canonical, reproducible, no-dependency-beyond-ImageMagick
bake — prefer it. This prompt is here for the case where a genuinely
illustrated/organic variant is wanted instead of flat vector geometry (an
AI model can render believable grain, light interaction, and asymmetric
detail that hand-written ImageMagick draw commands can't easily match).
If you generate one, resize/crop to exactly 2560x1440, save as
`background.jpg` (quality ~92, 4:2:0 chroma subsampling to match the
procedural bake's output), and regenerate `thumb.jpg` at 320x180.
