# Design System Document: Industrial Glassmorphism

## 1. Overview & Creative North Star
The marketplace for heavy industrial assets requires a visual language that balances "rugged reliability" with "futuristic precision." Our Creative North Star is **"The Digital Forge."** 

This design system moves away from the flat, white-label look of traditional marketplaces. By utilizing high-contrast dark mode aesthetics, layered transparency, and editorial-grade typography, we transform "scrap" into "premium inventory." The experience should feel like a high-end diagnostic interface—technical, authoritative, and fast.

**Design Philosophy:**
*   **Intentional Asymmetry:** Break the 12-column monotony. Use staggered card heights or off-center headlines to guide the eye through inventory.
*   **Depth over Lines:** Structural integrity is created through light and shadow, not boxes and borders.
*   **Industrial Premium:** The use of glassmorphism reflects the "polished chrome" of machinery, juxtaposed against the deep carbon backgrounds of a workshop.

---

## 2. Colors & Surface Hierarchy

### The Palette
We utilize a core of vibrant greens (Life/Recovery) against a foundation of deep Obsidian and Slate (Industrial/Stability).

*   **Primary:** `#3fff8b` (Vibrant Electric Green) - Use for critical CTAs and active states.
*   **Secondary/Tertiary:** `#e2e2e5` & `#7ae6ff` - Technical accents for secondary data and filtering.
*   **Background:** `#0a0e14` (Obsidian) - The canvas for all glass elements.

### The "No-Line" Rule
**Strict Prohibition:** Designers are prohibited from using 1px solid borders for sectioning. 
Boundaries must be defined solely through background color shifts or tonal transitions.
*   *Bad:* A white line separating the header from the content.
*   *Good:* The header uses `surface-container-high` while the body uses `surface`.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
1.  **Base Layer:** `surface` (#0a0e14).
2.  **Sectioning:** `surface-container-low` (#0f141a) for large content areas.
3.  **Actionable Elements:** `surface-container-high` (#1b2028) for interactive cards.
4.  **The "Glass & Gradient" Rule:** Floating elements (Modals, Navigation Bars) must use `surface-variant` at 60% opacity with a `20px backdrop-blur`. Apply a subtle linear gradient from `primary` to `primary-container` (at 10% opacity) as a "sheen" to give the glass a signature green tint.

---

## 3. Typography
We use a high-contrast pairing: **Space Grotesk** for technical authority and **Manrope** for functional clarity.

*   **Display (Space Grotesk):** Large, bold weights for pricing and vehicle titles. This font’s geometric nature mimics technical blueprints.
*   **Body (Manrope):** Optimized for readability in technical descriptions.
*   **Label (Manrope Mono-style):** Used for VIN numbers, weights, and technical specs to reinforce the industrial theme.

**Hierarchy Note:** Always lead with price in `display-sm` to anchor the user’s intent. Secondary info (location, date) should be in `label-md` with `on-surface-variant` (#a8abb3) to reduce visual noise.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Place a `surface-container-lowest` card (absolute black) onto a `surface-container-low` section. This creates a "recessed" look, suggesting the card is a slot in a machine.

### Ambient Shadows
Forget "Drop Shadows." Use **Ambient Glows**.
*   **Values:** 0px 20px 40px.
*   **Color:** `#3fff8b` at 4% opacity for primary elements.
*   **Effect:** A soft, radioactive-style glow that suggests the component is powered on.

### The "Ghost Border" Fallback
If a border is required for accessibility on inputs, use a **Ghost Border**:
*   `outline-variant` (#44484f) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Glass Cards
No solid backgrounds. 
*   **Fill:** `surface-container-highest` at 70% opacity.
*   **Blur:** 16px backdrop-blur.
*   **Edge:** 1px top-left highlight using `primary` at 20% opacity to mimic light hitting the edge of a glass pane.
*   **Interaction:** On hover, the internal "glow" increases from 4% to 12%.

### Industrial Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`). 
*   **Inner Glow:** 1px inset shadow in white at 20% on the top edge to create a "tactile plastic" or "glass button" feel.
*   **Typography:** All-caps `label-md` for a rugged, stamped-metal feel.

### Input Fields
*   **Style:** `surface-container-low` fill, translucent.
*   **State:** When focused, the Ghost Border opacity increases to 50% using the `primary` color token.
*   **Iconography:** Use "Duotone" icons where the secondary shape is set to 30% opacity.

### Navigation (Bottom Bar)
A floating glass dock. Use `xl` (1.5rem) roundedness. It should not touch the edges of the screen, creating a "levitating" futuristic feel.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use vertical white space (32px+) instead of dividers to separate listing categories.
*   **Do** overlap image elements slightly over glass containers to create a sense of true 3D space.
*   **Do** use the `primary` green sparingly as a "laser pointer" to highlight the most important action on the screen.

### Don’t:
*   **Don’t** use pure white (#ffffff) for text. Use `on-surface` (#f1f3fc) to prevent eye strain against the dark background.
*   **Don’t** use standard Material Design "elevated" cards with harsh shadows. If it doesn't look like it's made of glass or metal, it doesn't belong in this system.
*   **Don’t** use rounded corners below `md` (0.75rem) for main containers; keep the "industrial" feel with generous but structured radii.