# Lime Glass - Liquid Glass

Refraction-over-blur layer. Inspired by Apple Liquid Glass but constrained: **never clear glass**. Source is always pre-blurred before refraction, so backgrounds stay ambient context, never reveal sharp detail through the panel.

## Composition (per element)

```
1. backdrop-filter: blur(13px) saturate(110%)     -- ambient blur
2. SVG #ig-liquid-glass displacement filter        -- watery refraction
3. low-opacity lime tint overlay                   -- brand context
4. 1px inset specular highlight                    -- glass edge
```

## Files

| File | Purpose |
|---|---|
| `liquid-glass.css` | The `.ig-liquid`, `.ig-liquid-hero`, `.ig-liquid-chip` classes |
| `filter.svg` | Inline SVG `<filter id="ig-liquid-glass">`. Paste once per app. |
| `README.md` | This file |

## Install in a web/SvelteKit app

1. Import the CSS once:
   ```html
   <link rel="stylesheet" href="/path/to/liquid-glass.css">
   ```
2. Paste the SVG filter once anywhere in `<body>` (or root layout):
   ```html
   <svg width="0" height="0" style="position:absolute" aria-hidden="true">
     <filter id="ig-liquid-glass" ...>...</filter>
   </svg>
   ```
3. Apply the class:
   ```html
   <div class="ig-liquid">Refraction panel content</div>
   <header class="ig-liquid-hero">Hero with stronger ripple</header>
   <span class="ig-liquid-chip">Subtle chip</span>
   ```

## Why never clear glass

Apple's Liquid Glass on iOS/macOS 26 offers a "Clear" variant where background reveals sharply through. We rejected that:

- Reading text on top of sharp background = eye strain
- "Glass should be ambient context, not visual distraction"
- Clear refraction draws attention to what's behind, undermining content primary

So our `.ig-liquid` always stacks **blur first** (already obscures background detail) **then refraction** (adds the visual signature without revealing what's underneath).

## Tuning

Adjust per host via CSS custom properties:

```css
.ig-liquid {
  --ig-liquid-blur: 20px;        /* heavier blur on noisy backgrounds */
  --ig-liquid-saturate: 130%;    /* warmer */
  --ig-liquid-displacement: 4;   /* less ripple on small text */
  --ig-liquid-tint: #A8E63512;   /* stronger brand tint */
  --ig-liquid-surface: rgba(18, 18, 22, 0.85);  /* more opaque */
}
```

`--ig-liquid-displacement` maps directly to SVG `feDisplacementMap scale`. Bump only via re-rendering the filter — CSS var alone won't update SVG filter at runtime.

## Performance

- Backdrop blur is GPU-cheap on modern compositors
- SVG `feDisplacementMap` rasterizes on first paint, cached after
- One filter per element max. Don't nest `.ig-liquid` inside `.ig-liquid` — duplicate refractions stack ugly
- Test on iGPU laptops: if jank, drop `feDisplacementMap` (just keep blur) by removing `.ig-liquid::before` rule

## Browser support

- Chromium 76+ / Edge 79+ / Firefox 103+ (CSS Houdini backdrop-filter)
- `backdrop-filter: url()` for SVG filter on backdrop = Chromium 105+
- Falls back to blur-only on older browsers (the SVG layer simply does nothing)

## Accessibility

`prefers-reduced-transparency: reduce` → drops backdrop-filter + SVG filter, falls back to solid `#121216` surface.

`prefers-reduced-motion: reduce` → drops hover transition.

## Demo

Simulator at `simulator/` has the SVG filter pre-loaded in the layout. Apply `.ig-liquid` to any element in the SvelteKit routes to test.
