# PortDrop V2 — Design System

---

## Identity

**Logo:** Current PortDrop logo — kept as-is.
**Credit:** CodeBreeder badge retained on all pages, consistent with V1.
**Aesthetic:** Denim / jeans — tactile, textured, distinctive. Feels crafted, not corporate.

The denim aesthetic creates a strong brand identity that stands apart from the generic dark-mode developer tool aesthetic. The contrast between modern typography and tactile denim texture is intentional — it signals both technical sophistication and human craftsmanship.

---

## Color System — Denim Wash Scale

Wash levels function as the depth system. Not just dark/light mode — every surface has a wash level that communicates its hierarchy.

```css
@theme {
  /* Denim wash scale */
  --denim-raw:    oklch(16% 0.09 265);  /* deepest — hero, modals, overlays */
  --denim-dark:   oklch(24% 0.11 265);  /* dark — sidebars, admin */
  --denim-mid:    oklch(34% 0.12 265);  /* mid — dashboard, primary cards */
  --denim-light:  oklch(55% 0.10 265);  /* light — auth pages, forms */
  --denim-pale:   oklch(82% 0.06 265);  /* pale — backgrounds, skeleton base */

  /* Thread colors — semantic meaning */
  --thread-gold:   oklch(72% 0.16 85);   /* primary actions, CTAs, active states */
  --thread-white:  oklch(95% 0.01 265);  /* secondary, ghost elements */
  --thread-red:    oklch(54% 0.20 25);   /* warnings, errors, destructive */
  --thread-silver: oklch(65% 0.02 265);  /* rivets, metadata, disabled */

  /* Semantic aliases */
  --color-primary:     var(--thread-gold);
  --color-danger:      var(--thread-red);
  --color-surface-1:   var(--denim-pale);
  --color-surface-2:   var(--denim-light);
  --color-surface-3:   var(--denim-mid);
}
```

**Dark mode:** Raw denim (dark indigo), not black. Maintains brand identity in both modes.
**Light mode:** Pale/light wash.
Theme switching via `next-themes` — a single class on `<html>`.

---

## Stitching — Semantic Design Language

Stitching type carries meaning. It is not decorative — it communicates the nature of the content it borders.

| Stitching | Used on | Signals |
|---|---|---|
| Rough / irregular stitch | Landing page cards, guest session page, error states, notifications | Raw, live, human, urgent |
| Smooth / double-needle | Dashboard cards, admin panels, forms, modals, Pro features | Polished, reliable, professional |
| Gold thread | CTAs, primary actions, active navigation | Premium, attention |
| White thread | Secondary elements, ghost states | Subtle, supporting |
| Red thread | Warnings, destructive actions, errors | Danger, alert |

### Stitching Animation
When a section enters the viewport, its stitching border draws itself in via SVG `stroke-dashoffset` animation:
- Rough stitching: variable speed, slightly erratic
- Smooth stitching: constant pace, precise

Triggered by IntersectionObserver. Disabled on `prefers-reduced-motion`.

---

## Patches

Content cards are **patches** — styled as fabric patches sewn onto denim.

Properties:
- Background: slightly different wash from the page background (creates depth)
- Border: stitching (rough or smooth depending on context)
- Shadow: directional, mimics fabric sitting on denim
- Wear: CSS classes applied based on session status/age

**Wear / Patina System:**
- `patch--fresh` — new session: saturated color, crisp stitching
- `patch--active` — running session: gold stitching brightens subtly
- `patch--worn` — expired/stopped: desaturated, faded stitching
This is CSS-only, applied from session status. Creates personality without adding complexity.

---

## Pockets

Pockets are functional interactive elements, not just decoration.

**Behavior:**
- Desktop: hover reveals content inside (depth shadow + slight pull-up animation)
- Mobile: tap to open/close, behaves as a bottom sheet

**Used on:**
- Landing page feature cards — hover reveals detail content
- Dashboard right edge — slide-out pocket with session quick-actions
- Session admin panel — collapsible pocket for approval queue and guest controls
- Mobile navigation — pocket-style drawer

---

## Typography

```css
@theme {
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'Fira Code', monospace;
}
```

Loaded via `next/font` — zero layout shift, automatic subsetting.

**Geist** — primary UI font. Modern, clean, developer-focused. Created by Vercel, optimized for technical interfaces.

**Geist Mono** — used for: code blocks, port numbers, session IDs, terminal output, Monaco Editor, diff views.

The contrast between the modern geometric sans-serif and the tactile denim background creates the visual tension that makes the design feel both technical and crafted.

---

## Motion Design System

Motion tokens named after denim concepts for codebase consistency:

```css
@theme {
  --ease-soft:    cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* gentle, soft fabric */
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);     /* stiff raw denim spring */
  --ease-worn:    cubic-bezier(0.55, 0.06, 0.68, 0.19);  /* worn ease-in */

  --duration-quick:   120ms;   /* micro-interactions */
  --duration-base:    240ms;   /* standard transitions */
  --duration-slow:    480ms;   /* layout shifts, panel opens */
  --duration-stitch:  600ms;   /* stitching draw-in */
  --duration-fold:    400ms;   /* page transition fold */
}
```

---

## Page Transitions

Route changes use a **fabric fold** effect:
- Current page folds away (like folding a pair of jeans)
- New page unfolds in
- GSAP-powered, `--duration-fold` (400ms)
- Disabled for `prefers-reduced-motion`

This is the single most memorable motion detail in the app — distinctive and brand-consistent.

---

## Scroll Effects Per Page

One primary scroll effect per page. Never mixed within a page.

| Page | Effect | Library |
|---|---|---|
| Landing | Pin + parallax layers, fabric fold between sections | GSAP ScrollTrigger |
| Dashboard | Cards fade + slide up on entry | Framer Motion |
| Session detail | Sticky admin sidebar, content scrolls independently | CSS position sticky |
| Guest session | Smooth momentum, content zooms subtly | GSAP or CSS |
| Auth pages | None (content fits viewport) | — |
| Admin panels | Minimal — data density first | Framer Motion (subtle) |

**Mobile:** All scroll effects disabled or simplified. Battery and performance matter more than flair on small screens.

---

## Skeleton Loading

- Color: indigo shimmer (not gray) matched to the wash level of the page
- Direction: diagonal sweep (45°) to evoke fabric sheen
- Shapes: patch-shaped for cards, thread-thin lines for text, circle for avatars
- Applied via `loading.tsx` files per route and `DenimSkeleton` component within client components

---

## Button System

Shared button styles across all pages. Interaction effects vary per section.

| Variant | Appearance | Used for |
|---|---|---|
| Primary | Dark denim + gold thread border | CTAs, session start |
| Secondary | Mid-wash outline | Secondary actions |
| Destructive | Worn denim + red thread | Revoke, delete, stop |
| Ghost | Transparent + stitching on hover | Tertiary, icon buttons |

**Section-specific effects:**
- Landing page: fabric press (scale down + texture shift on click)
- Dashboard: smooth elevation (shadow lifts on hover)
- Admin: minimal — functional, no animation overhead
- Guest page: gentle pulse on the primary action

---

## Layout Components

### Header
- Fixed, full-width
- Raw denim background with backdrop blur on scroll
- Stitching line along bottom edge
- At top: slightly transparent. Scrolled: fully opaque + stronger blur.
- Active nav: gold thread underline draws in on hover, stays when active
- Mobile: belt-loop-style hamburger toggle (three horizontal lines evoking belt loops)

### Footer
- Fixed, minimal — CodeBreeder credit left, essential links right
- Selvedge-edge stitching detail along top border
- **Desktop:** always visible
- **Mobile:** visible on page load → fades to 0 opacity after 30 seconds of inactivity → returns on any scroll or touch event

### Back To Top Button
- Fixed, 50px from bottom-right
- Appears when `scrollY > 320px`
- Style: circular silver rivet, brightens to gold on hover
- Appear: Framer Motion spring pop
- Hide: quick fade
- Click: smooth scroll to top + brief 360° spin before disappearing

### Command Palette (⌘K)
- shadcn/ui Command component (built on cmdk)
- Accessible from any authenticated page
- Actions: start session, stop session, copy URL, switch port, revoke guest, navigate
- Styled with denim tokens — dark wash background, gold thread highlight on selected item

---

## Empty States

Each empty state is a small SVG illustration in the denim visual language:

| Context | Illustration |
|---|---|
| No active sessions | Empty pocket (hand-drawn style, denim colors) |
| No guests | Empty bench with folded jeans |
| No notifications | Clean thread spool |
| Session expired | Faded, worn-out patch |
| No submissions | Neat stack of fabric patches |

All illustrations are SVG, themeable via CSS custom properties, < 5KB each.

---

## Toast / Notification Design

Toasts appear as patches pinned to the bottom-left corner (not bottom-center):

| Type | Appearance | Stitching |
|---|---|---|
| Info | Mid-wash patch, white thread | Smooth |
| Success | Dark-wash patch, gold thread | Smooth |
| Warning | Worn patch, red thread | Mixed |
| Error | Raw denim patch, red thread + shake | Rough |

Each toast "pins" itself onto the corner with a brief stitch animation before settling. Dismissed with a swipe or timeout.

---

## Woven Labels — Tier Badges

Styled as the woven label on a jeans waistband. Appear in: header nav, session creation modal, systems admin dashboard.

| Tier | Appearance |
|---|---|
| Free | White label, black text, simple border |
| Pro | Dark denim label, gold thread text |
| Team | Raw denim label, white stitching |
| Enterprise | Black label, silver thread |

---

## Responsive Design

Three intentional breakpoints (not the default five):

| Name | Width | Experience |
|---|---|---|
| Mobile | < 768px | Single column, bottom sheets, footer fade, effects simplified |
| Tablet | 768–1199px | Two column, side panels, full stitching |
| Desktop | ≥ 1200px | Full experience, all effects, fixed panels, pocket hovers |

### Mobile-specific
- Pockets become bottom sheets (tap to open)
- Stitching detail simplified (performance)
- Scroll animations disabled
- Footer fades after 30s inactivity
- Header collapses to minimal bar with pocket-style menu

### Accessibility
- `prefers-reduced-motion` respected everywhere — all animations have a no-animation fallback
- WCAG 2.1 AA minimum contrast on all text
- All interactive elements keyboard accessible
- shadcn/ui components use Radix UI — accessible by default

---

## Page-by-Page Design Notes

| Page | Denim wash | Stitching | Primary effect | Pockets |
|---|---|---|---|---|
| Landing | Raw → Mid (gradient) | Rough | GSAP ScrollTrigger parallax | Feature cards |
| Login / Signup | Light | Smooth | None | Form card |
| Dashboard | Mid | Mixed | Framer Motion card reveal | Quick-actions edge |
| Session detail | Dark | Rough (live) / Smooth (config) | Sticky sidebar | Admin controls |
| Guest session | Light | Rough | Smooth momentum scroll | None |
| Admin panels | Raw | Smooth | Minimal | None |
| Settings | Mid | Smooth | None | None |

---

## Design System File Structure

```
styles/
├── denim.css          — wash levels, thread colors, all @theme tokens
├── stitching.css      — SVG stitch keyframes, rough/smooth variants
├── animations.css     — Framer Motion variant classes, GSAP utility classes
└── patches.css        — patch card base, wear variants, pocket base

components/denim/
├── Patch.tsx          — card wrapper (variant: rough | smooth)
├── Pocket.tsx         — interactive pocket (variant: edge | card | sheet)
├── Stitching.tsx      — SVG stitching border with draw-in animation
├── WovenLabel.tsx     — tier badge
├── DenimSkeleton.tsx  — indigo shimmer skeleton
├── RivetDot.tsx       — rivet accent element
└── index.ts
```
