**5. Simulator – five highest‑value, low‑risk CSS changes (ordered by impact)**  

1. **Header tap‑target & overflow** – on ≤ 480 px collapse the tab row into a scrollable strip and enforce a minimum touch area.  
   ```css
   @media (max-width: 480px) {
     .header-nav { 
       overflow-x: auto; 
       -webkit-overflow-scrolling: touch; 
       flex-wrap: nowrap; 
     }
     .header-nav .tab { 
       min-width: 44px; 
       min-height: 44px; 
       padding: 0 8px; 
     }
   }
   ```

2. **Sidebar width fluidity** – replace the hard 320 px rail with a max‑width that can shrink on narrow screens.  
   ```css
   @media (max-width: 600px) {
     .sidebar { 
       width: 100%; 
       max-width: 320px; 
     }
   }
   ```

3. **Viewport‑height handling** – swap the brittle `100vh` usage for the safe `svh` unit (fallback to `100vh` where unsupported).  
   ```css
   .full‑height {
     height: 100svh;               /* primary */
     height: 100vh;                /* fallback */
   }
   ```

4. **Palette stage grid reflow** – the two‑column desktop grid (`grid-template-columns: minmax(0,1fr) 320px`) collapses to a single column on phones.  
   ```css
   @media (max-width: 560px) {
     .palette‑stage {
       grid-template-columns: 1fr;
     }
   }
   ```

5. **Responsive typography baseline** – introduce a fluid root font‑size that respects mobile text‑inflation while leaving the 1400 px snapshot unchanged (the clamp is overridden only under the narrow media query).  
   ```css
   @media (max-width: 560px) {
     :root { 
       font-size: clamp(14px, 2.5vw, 18px);
     }
   }
   ```

All selectors target existing class names; the `@media` blocks fire **only** in the mobile‑range tests, so the current desktop‑only Playwright snapshot (width 1400) remains untouched.

---

**6. What you’re not asking but must ask:**  

*“Do we have a mobile‑viewport visual‑regression suite that runs the same snapshot assertions on real device dimensions (e.g., 390 × 844) and on both Chrome and Edge?”*  

Without automated mobile snapshots you cannot verify that the above changes truly fix overflow, touch‑target, and height issues, nor can you guarantee they don’t introduce regressions on the devices that actually use the styles. Adding that test layer is the single most consequential missing piece.
