# PECAÊ Brand Tokens (Glassmorphism & Digital Forge)

## 1. Color Palette (Harmonious Primary Green)

| Role | Token Name | Light Mode (Soft Glass) | Dark Mode (Obsidian Forge) |
| :--- | :--- | :--- | :--- |
| **Primary** | `--brand-green` | `#2D8C4E` (Pecae Green) | `#3fff8b` (Vibrant Electric) |
| **Accent** | `--brand-vibrant`| `#4ADE80` | `#7ae6ff` (Tech Accent) |
| **Deep** | `--brand-dark` | `#14532D` | `#0a0e14` (Base Obsidian) |
| **Background**| `--bg-gradient` | `linear(to-br, #E8F5E9, #C8E6C9)` | `linear(to-br, #022C22, #0a0e14)` |
| **Surface** | `--glass-surface`| `rgba(255, 255, 255, 0.4)` | `rgba(27, 32, 40, 0.6)` |
| **Border** | `--glass-border` | `rgba(255, 255, 255, 0.5)` | `rgba(63, 255, 139, 0.15)` |
| **Text Main** | `--text-primary` | `#1E293B` | `#F1F3FC` |
| **Text Muted** | `--text-muted` | `#475569` | `#A8ABB3` |

## 2. Typography (Industrial Precision)

- **Headings (Display):** `Space Grotesk` (Geometric, blueprint-like authority).
- **Body:** `Manrope` or `Inter` (Functional clarity).
- **Technical/Mono:** `Manrope Mono` (For VINs, serial numbers, technical specs).

| Scale | Value | Weight | Usage |
| :--- | :--- | :--- | :--- |
| **H1** | 24px - 32px | 700 (Bold) | Screen Titles, Main Prices |
| **H2** | 20px - 24px | 600 (Semi) | Vehicle Names, Section Headers |
| **Body** | 16px | 400 (Regular) | Item descriptions, text content |
| **Caption** | 12px | 500 (Medium) | Location, timestamps, labels |

## 3. Visual Effects (Glass & Depth)

### The Layering Principle
- **Backdrop Blur:** `16px` minimum for all glass elements.
- **Corner Radius:** `16px` (md) for containers, `full` for search bars and small buttons.
- **Shadows:** 
  - **Light Mode:** Subtle ambient soft shadows (Soft focus).
  - **Dark Mode:** **Ambient Glows** (`#3fff8b` at 4% opacity) instead of traditional drop shadows.

### The "No-Line" Border Rule
- Use tonal transitions and background shifts instead of solid borders.
- **Exception:** 1px top-left highlight on glass cards to mimic light reflections.
