# PortDrop V2 — Frontend Stack

---

## Framework

**Next.js (App Router)** — rendering strategy varies intentionally by route:

| Route group | Rendering strategy | Reason |
|---|---|---|
| `(marketing)` | React Server Components | Fast initial paint, GSAP runs client-side |
| `(auth)` | Server + Client mix | Server validates session, client handles form |
| `(app)` | Client Components + Suspense | Real-time data, Socket.IO, user interaction |
| `(admin)` | Client Components | Data-dense, interactive tables |
| `s/[sessionId]` | Hybrid | Server renders initial session state, hydrates for real-time |

**TypeScript** throughout. Non-negotiable — types flow from the `shared` package into every component.

---

## Route Structure

```
/                          → Landing page
/auth/login                → Login
/auth/signup               → Signup
/auth/callback/[provider]  → OAuth callback
/app/dashboard             → User home, active sessions
/app/sessions              → Session list
/app/sessions/new          → Session creation wizard
/app/sessions/[id]         → Session detail + admin controls
/app/templates             → Permission templates
/app/integrations          → Connected integrations
/app/settings/*            → Account, security, billing, org
/app/admin/*               → Systems admin (elevated auth)
/s/[sessionId]             → Public guest entry (no auth required)
```

Route groups (`(marketing)`, `(auth)`, `(app)`, `(admin)`) apply different layouts without affecting the URL.

---

## Styling

**Tailwind CSS v4+** — conventions have changed significantly from v3:
- No `tailwind.config.js` — configuration lives in CSS via `@theme` directive
- `@import "tailwindcss"` replaces old `@tailwind base/components/utilities`
- Design tokens defined as CSS custom properties inside `@theme {}`
- Lightning CSS is the new bundler (no PostCSS required in most setups)
- Some utility class names changed from v3 — audit before building

**Custom CSS** — denim design system lives in dedicated CSS files:
- `styles/denim.css` — wash levels, thread colors, tokens
- `styles/stitching.css` — SVG stitch animations
- `styles/animations.css` — Framer Motion variants, GSAP utility classes
- `styles/patches.css` — patch card variations

---

## Component Architecture

Three layers, intentionally separated:

```
components/ui/       ← shadcn/ui base (owned code, not a dependency)
components/denim/    ← denim design system built on top of ui/
components/[feature] ← feature components built on top of denim/
```

**shadcn/ui** — use the v4-compatible version. Components are owned source code, not a package import. Updating shadcn = copying new component code, not bumping a version.

**components/denim/** — the design system layer:
- `Patch.tsx` — card wrapper (rough or smooth stitching variant)
- `Pocket.tsx` — interactive pocket element
- `Stitching.tsx` — SVG stitching border (draws in on viewport entry)
- `WovenLabel.tsx` — tier badge styled as a woven clothing label
- `DenimSkeleton.tsx` — indigo shimmer skeleton (not gray)
- `RivetDot.tsx` — rivet accent element

**Icon abstraction** — every icon goes through `components/shared/Icon.tsx`. Swapping react-icons for a commercial set is a one-file change.

---

## State Management

Two tools, separate concerns:

**TanStack Query** — all server state:
- Sessions, guests, permissions, audit logs, submissions
- Background refetching, cache invalidation
- Socket.IO only calls `queryClient.setQueryData()` to push updates into the cache

**Zustand** — all client/UI state:
- Active session in the dashboard
- Notification queue
- Panel open/close state
- Command palette open state
- Current user's permission level (guest view)

Never mix them. Query owns the server data. Zustand owns the UI.

---

## Real-time

**Socket.IO client** — pairs with TanStack Query:
- Query fetches initial state on mount
- Socket.IO pushes incremental updates to the Query cache
- Guest presence, permission changes, write submission notifications, session events

Connection established in `lib/socket.ts`, exposed via `hooks/useSocket.ts`.

---

## Forms

**React Hook Form + Zod** — session creation is a multi-step wizard with many fields. React Hook Form is uncontrolled (performant), Zod handles validation. Zod schemas are the same ones defined in `packages/shared` — validated in both the browser and the relay.

---

## Key Libraries

| Library | Purpose |
|---|---|
| **TanStack Query** | Server state management |
| **Zustand** | Client/UI state |
| **Socket.IO client** | Real-time updates |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation (shared with backend) |
| **TanStack Table** | Admin tables (guest list, session history, audit log) |
| **Monaco Editor** (`@monaco-editor/react`) | Write submission diff review |
| **Recharts** | Analytics charts (session counts, bandwidth, activity) |
| **Framer Motion** (`motion`) | In-app UI animations |
| **GSAP + ScrollTrigger** | Landing page animations |
| **next-themes** | Dark/light/system theme |
| **nuqs** | URL state (filters, pagination, panel state — bookmarkable) |
| **cmdk** | Command palette (⌘K) via shadcn Command component |

---

## Fonts

Loaded via `next/font` — zero layout shift, automatic subsetting:

- **Geist** — primary UI font (modern, clean, developer-focused)
- **Geist Mono** — code blocks, port numbers, session IDs, terminal output

Both are variable fonts. Geist Mono is used inside Monaco Editor for the diff review UI.

---

## Animations

Two libraries, clear scope boundary:

**GSAP + ScrollTrigger** — landing page only:
- Hero section sequences
- Scroll-driven section reveals (pin + parallax)
- SVG and logo animations
- Page transition fabric fold (route changes)

**Framer Motion** — authenticated app UI:
- Component mount/unmount
- Layout shifts (guest joins/leaves the list)
- Approval queue item animations
- Permission badge transitions
- Modal and drawer animations
- BTT button appear/disappear

**Motion design tokens** (defined in `@theme`):
```css
--ease-soft:    cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-worn:    cubic-bezier(0.55, 0.06, 0.68, 0.19);
--duration-quick:  120ms;
--duration-base:   240ms;
--duration-slow:   480ms;
--duration-stitch: 600ms;
--duration-fold:   400ms;
```

---

## Scroll Effects Per Page

One primary effect per page — never a mix:

| Page | Effect | Library |
|---|---|---|
| Landing | Pin + parallax layers, fabric fold between sections | GSAP ScrollTrigger |
| Dashboard | Cards fade + slide up on viewport entry | Framer Motion |
| Session detail | Sticky admin sidebar, content scrolls independently | CSS position sticky |
| Guest session | Smooth momentum, subtle zoom | GSAP or CSS |
| Auth pages | None (content fits viewport) | — |
| Admin | Minimal — data density takes priority | Framer Motion (subtle) |

Scroll effects are disabled/simplified on mobile. `prefers-reduced-motion` respected everywhere.

---

## Layout Behavior

**Header:**
- Fixed, full-width
- Raw denim background, backdrop blur on scroll
- Stitching line along bottom edge
- Active nav: gold thread underline draws in on hover, stays drawn when active
- Mobile: belt-loop-style hamburger toggle

**Footer:**
- Fixed, minimal
- Desktop: always visible — CodeBreeder credit left, essential links right
- Mobile: visible on load, fades to 0 opacity after 30s of inactivity, returns on any scroll/touch

**BTT Button:**
- Fixed, 50px from bottom-right
- Appears when `scrollY > 320px`
- Styled as a silver rivet, brightens to gold on hover
- Spring pop on appear, quick fade on hide
- Smooth scroll to top + 360° spin before hiding

---

## Responsive Breakpoints

Three intentional breakpoints:

| Name | Width | Experience |
|---|---|---|
| Mobile | < 768px | Single column, pockets as bottom sheets, footer fade, simplified effects |
| Tablet | 768–1199px | Two column, pockets as side panels, full stitching |
| Desktop | ≥ 1200px | Full experience, all effects, fixed panels |

---

## Skeleton Loading

Indigo shimmer (not gray) that matches the wash level of the page it's on. Shimmer sweeps diagonally (45°) to evoke fabric sheen. Shapes match the content they represent — patch shapes for cards, thread-thin lines for text.

Applied universally via `loading.tsx` files per route and `DenimSkeleton` components within client components.

---

## Summary Table

| Category | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom CSS |
| Components | shadcn/ui (v4-compatible, owned code) |
| Design system | components/denim/* |
| Server state | TanStack Query |
| Client state | Zustand |
| Real-time | Socket.IO client |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Code diff | Monaco Editor |
| Charts | Recharts |
| App animations | Framer Motion (motion) |
| Landing animations | GSAP + ScrollTrigger |
| Theme | next-themes |
| URL state | nuqs |
| Command palette | cmdk (via shadcn Command) |
| Icons (now) | react-icons (abstracted via Icon.tsx) |
| Icons (later) | Phosphor or commercial set |
| Fonts | Geist + Geist Mono (next/font) |
