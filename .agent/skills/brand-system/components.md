# PECAÊ Component Blueprints

## 1. Glass Card (Vehicle Inventory)
The core element of the marketplace. Must feel like a "slot" in an industrial diagnostic machine.

- **Background:** `--glass-surface` with `backdrop-filter: blur(16px)`.
- **Border:** 1px subtle top-left highlight (20% primary green).
- **Elevation:** Recessed look or soft ambient glow (4% green in Dark Mode).
- **Interaction:** `scale: 1.02` on hover with glow increasing to 12%.
- **Hierarchy:** High-quality 3/4 angle photo overlapping the glass container slightly for 3D depth. Lead with Price in Bold.

## 2. Industrial Action Button
Tactile, authoritative, and fast.

- **Primary:** Gradient fill from `--brand-green` to `--brand-vibrant`.
- **Effect:** 1px white inset shadow (20% opacity) on the top edge for a "pressed metal/glass" feel.
- **Typography:** All-caps `labels-md` (Space Grotesk).
- **Animation:** 150ms transition. No layout-shifting transforms.

## 3. Search Bar & Inputs
Transparent fields reflecting the "transparency" brand pilar.

- **Style:** `--glass-surface` background (low opacity).
- **Focus:** Border opacity increases to 50% using `--brand-green`.
- **Icons:** Duotone SVGs where the secondary shape is 30% opacity.

## 4. Floating Navigation (The Dock)
A levitating glass dock that sits away from the screen edges.

- **Radius:** `xl` (1.5rem / 24px) roundedness.
- **Blur:** High intensity (`20px+`).
- **Layout:** Floating above the content. Never touches the bottom edge.

## 5. Trust Indicators (Safety Badges)
Geometric, high-contrast badges for "Verified Seller" or "Technical Inspection".

- **Colors:** Vibrant green on glass backdrop.
- **Icons:** Minimalist, no emojis.
