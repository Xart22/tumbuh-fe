---
name: Tumbuh POS & Backoffice
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#545c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c748b'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#fdb965'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#dae2fc'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3e465b'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-low: '#eff4ff'
  error-surface: '#fef2f2'
  error-border: '#fecaca'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.15'
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.3'
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: 0.08em
  mono-metric-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
  mono-metric-md:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1.2'
  mono-metric-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 2rem
  gutter-mobile: 1rem
  margin: 1.5rem
  margin-desktop: 2rem
  space-2xs: 0.25rem
  space-xs: 0.375rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 5rem
---

## Brand & Style

Tumbuh POS embodies a **Modern SaaS with Precision-Driven F&B Reliability** aesthetic. Designed for culinary operators, cafe owners, and hospitality managers across Indonesia, the brand voice conveys financial accuracy, effortless operational flow, and high operational trust.

The visual style blends crisp modern SaaS conventions with soft, accessible touches:
- **Clean SaaS & Operational Dashboarding**: Clear typographic scales and structured card layouts ensure inventory numbers, cost of goods sold (HPP), and sales totals are instantly scannable.
- **Organic Warmth**: Emerald green (`#059669`) serves as the core trust driver (signifying profit and freshness), paired with warm amber accents (`#855300` / `#fea619`) that evoke roasted coffee and artisanal bakery qualities.
- **Modern Micro-Details**: Subtle frosted glass navigation headers (`backdrop-blur-md`), pill-shaped badges, and soft, low-contrast container boundaries maintain a fresh, lightweight footprint without visual clutter.

## Colors

The color system is calibrated specifically for financial confidence, clarity under varied lighting conditions (from dim cafe ambiances to bright outdoor counter light), and error prevention:

- **Primary (`#059669`) & Primary Container (`#00855d`)**: Represents fiscal health, positive margins, and successful actions. Used for primary CTAs, active highlights, key metrics, and positive verification badges.
- **Secondary (`#855300`) & Accent Container (`#fea619`)**: Grounded artisanal amber/caramel tones. Used for food-cost ratios, recipe highlights, special tier badges, and auxiliary interactive controls.
- **Tertiary (`#545c72`)**: Balanced slate-gray used for secondary helper text, metadata labels, and subtle iconography.
- **Surface Canvas Stack**:
  - `surface` (`#f8f9ff`): Cool tint base providing crisp contrast against stark white cards.
  - `surface-container-lowest` (`#ffffff`): The primary card and panel surface.
  - `surface-low` (`#eff4ff`): Recessed stat tile background and input background.
  - `surface-container` (`#e5eeff`): Subtle separating borders and inactive slider tracks.
- **Semantic Feedback**:
  - `error` (`#ba1a1a`): Marks operational pitfalls, old ways of working, critical alerts, and voids.

## Typography

The type system relies on **Plus Jakarta Sans** for expressive, human-friendly headings and clear interface labels, paired with **JetBrains Mono** for numerical precision.

- **Numerics & Monospace Role**: All critical financial metrics, currency strings (e.g. `Rp 14.820.000`), percentages, inventory quantities, and machine addresses use `JetBrains Mono`. This ensures tabulations align vertically without jitter.
- **Headings & Body**: `Plus Jakarta Sans` employs extra-bold weights (`800`) for primary displays and titles to anchor content blocks. Body text preserves legibility with generous 1.5–1.6 line heights.
- **Category Eyebrows**: Section headers feature uppercase tracking badges (`label-caps`) styled with `letterSpacing: 0.08em` for crisp grouping.

## Layout & Spacing

The layout is built around a responsive 12-column grid container capped at `max-w-7xl` (80rem / 1280px) with centered alignment:

- **Section Vertical Rhythm**: Standard sections utilize `space-3xl` (`5rem` / 80px) vertical padding on desktop, scaling down to `space-2xl` (`3rem` / 48px) on mobile viewports.
- **Card Padding**: Inner cards use `p-6` (24px) for compact stat cards and `p-8` (32px) to `p-12` (48px) for prominent feature and pricing containers.
- **Grids**:
  - Feature & Comparison grids: 2-column layout on desktop (`md:grid-cols-2`), reflowing to single-column on mobile with a `gap-8` gutter.
  - Metrics row: 4-column layout (`lg:grid-cols-4`) collapsing to a 2-column grid (`grid-cols-2`) on tablet/mobile with `gap-4` to `gap-6`.
  - Pricing & Testimonials: 3-column layout (`lg:grid-cols-3`) collapsing to 1-column on handheld screens.

## Elevation & Depth

The system uses clean, layered elevation anchored by soft diffuse drop shadows and crisp border definitions rather than muddy heavy shadows:

1. **Level 0 (Flat Surfaces)**: `surface-low` backgrounds bounded by 1px solid `surface-container` (`#e5eeff`).
2. **Level 1 (Card Baseline - `shadow-sm`)**: Used on standard content containers, cards, and input groups.
   - `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);` with border `1px solid var(--surface-container)`.
3. **Level 2 (Interactive & Floating - `shadow-md` / `shadow-lg`)**: Applied to live telemetry badges, action buttons, and highlighted product cards.
   - `box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);`
4. **Level 3 (Modal & Spotlight - `shadow-xl` / `shadow-2xl`)**: Utilized by the main POS preview container, the interactive calculator, and full-width gradient banners.
5. **Glass Surface Tier**: Sticky navigation bar uses `bg-white/90` with `backdrop-blur-md` and a 1px border `border-surface-container`.

## Shapes

The design system adopts a **Level 2 (Rounded)** shape strategy to create friendly yet structured software components:

- **Buttons & Control Elements**: `rounded-xl` (`0.75rem` / 12px) for touch targets, action buttons, and input fields.
- **Standard Cards & Tiles**: `rounded-2xl` (`1rem` / 16px) for feature modules, comparison cards, and testimonial blocks.
- **Hero Windows & Calculator Enclosures**: `rounded-3xl` (`1.5rem` / 24px) for major interface frames.
- **Badges, Pills & Status Tokens**: Fully pill-shaped (`rounded-full`) for status alerts, discount markers, and navigation filter switches.
- **Icon Wells**: `rounded-xl` (`0.75rem` / 12px) containers creating balanced backdrops for 20px - 26px Material Symbols icons.

## Components

### Buttons
- **Primary Button**: Solid fill with `bg-primary` (`#059669`), text `white`, font weight `600`, border-radius `rounded-xl`, padding `px-6 py-3.5`. Hover state deepens to `bg-primary-container` (`#00855d`) with subtle shadow enhancement.
- **Secondary / Outlined Button**: `bg-white`, border `1px solid var(--outline-variant)` (`#bccac0`), text `on-surface` (`#0b1c30`). Hover shifts to `bg-surface-low`.
- **Hero Contrast CTA**: `bg-white`, text `primary` (`#059669`), font weight `700`, `shadow-md`, hover `bg-emerald-50`.

### Chips & Badges
- **Status Pill**: Small inline-flex container (`px-3 py-1` or `px-4 py-1.5`), `rounded-full`, font size `11px - 12px`, weight `600`.
  - Emerald variant: `bg-emerald-50 border border-emerald-200 text-primary`.
  - Amber variant: `bg-amber-50 border border-amber-200 text-secondary`.
  - Dark/Promo variant: `bg-secondary-container text-on-secondary-container`.

### Cards
- **Standard Card**: White background `surface-container-lowest`, `rounded-2xl`, border `1px solid var(--surface-container)`, `p-6` or `p-8`.
- **Highlighted / Featured Card**: Wrapped with `border-2 border-primary`, elevated by `shadow-xl`, equipped with an absolute center-top pill badge.
- **Comparative Card Pair**:
  - "Cara Lama": Muted red border (`border-red-200`), error icon wells (`bg-red-100 text-error`), and light warning alert footer (`bg-red-50`).
  - "Dengan Tumbuh": `bg-emerald-50/40 border-2 border-primary`, green check tokens, and success guarantee footer.

### Interactive Slider Widget
- Input range track styled with `accent-primary` or `accent-secondary`, height `0.5rem`, `bg-surface-container`, `rounded-lg`.
- Accompanying live value display badge styled in `JetBrains Mono` with soft-tinted backgrounds matching the control accent.

### Recipe Breakdown Bar
- Segmented linear progress tracker (`h-2 rounded-full overflow-hidden flex`) dividing ingredients visually according to cost proportion using `primary`, `secondary`, `secondary-container`, and `tertiary`.

### Accordion / FAQ Item
- Built with HTML `<details>` element, styled with `bg-surface-low rounded-xl p-5 border border-surface-container`.
- Summary features standard `font-bold text-sm text-on-surface`, with an animated chevron expanding via CSS transition `group-open:rotate-180`.