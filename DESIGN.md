# MiMesa design system

Source of truth for the UI. Mockups: `docs/design/*.dc.html` (published canvas "MiMesa Pantallas"). Mode: Operate (a tool, not a brochure). Direction chosen by the user: clean tool-like interface, cool neutrals, one accent.

## Tokens

Declare these in `src/index.css` under `@theme` so Tailwind v4 exposes them as utilities (`bg-ground`, `text-ink-3`, `border-line`, `bg-accent`, ...).

| Token | Value | Use |
|---|---|---|
| `--color-ground` | `#f4f6fa` | App background, canvas base, dialog footers |
| `--color-panel` | `#ffffff` | Topbar, sidebar, cards, popovers |
| `--color-ink` | `#1c2230` | Primary text, toast background |
| `--color-ink-2` | `#4b5566` | Secondary text, labels, ghost buttons |
| `--color-ink-3` | `#7a8497` | Placeholders, captions, counters' labels |
| `--color-line` | `#e3e7ee` | Hairlines between regions, card borders |
| `--color-line-2` | `#cfd5df` | Control borders (inputs, secondary buttons), empty-seat dashes |
| `--color-accent` | `#4f46e5` | Primary button, drop target ring, selected seat, own seat in guest view, links |
| `--color-accent-soft` | `#eef0ff` | Selected template, hover row, focus halo, drop target fill |
| `--color-empty` | `#94a3b8` | Empty table ring |
| `--color-empty-soft` | `#f1f4f8` | Empty table disc, avatar background |
| `--color-partial` | `#f59e0b` | Partially filled table ring |
| `--color-partial-soft` | `#fff4e0` | Partially filled table disc |
| `--color-full` | `#10b981` | Full table ring |
| `--color-full-soft` | `#e6f8f1` | Full table disc |
| `--color-danger` | `#dc2626` | Destructive menu items, rejected drop ring |
| `--color-seat-on` | `#dfe4ee` | Occupied seat fill (border `#c7ceda`) |

Canvas dot grid: `radial-gradient(#d5dbe5 1px, transparent 1px)`, `24px` cell, offset `12px`.

Shadows: popovers and dialogs `0 1px 2px rgba(20,28,45,.06), 0 12px 32px -12px rgba(20,28,45,.28)`; the dragged chip `0 12px 28px -10px rgba(20,28,45,.35)`. Shadows always have offset and blur; never a flat colored halo.

## Type

One family: **Manrope** (Google Fonts, weights 500/600/700/800), fallback `"Segoe UI", system-ui, sans-serif`. Load it in `index.html`.

| Role | Size / weight |
|---|---|
| Editor body, buttons, chips | 13px / 600 |
| Labels, captions, counters' labels | 12px / 700 (`ink-2` or `ink-3`) |
| Counter numbers | 15px / 800, tabular numerals |
| Section titles (sidebar, dialog) | 14–18px / 800, letter-spacing -0.01 to -0.02em |
| Table name / occupancy on the disc | 11px / 800 and 10px / 700 |
| Seat initials (editor / guest view) | 9px / 800 and 12px / 800, letter-spacing 0.02em |
| Create-event heading | 24px / 800 |
| Guest view body | 15px / 500–600; headline 28–32px / 800, letter-spacing -0.025em |

The editor runs a tight scale on purpose (dense tool UI). Do not add a display face.

## Shape and spacing

- Radii: controls 8px, popovers and cards 10px, dialogs and phone panels 12–14px, seats/discs 50%.
- Control heights: buttons and inputs 34px in the editor, 38–40px in the create form, 52px in the guest view (phone hit target ≥ 44px).
- Topbar 56px, sidebar 300px, canvas 1600x1200 fixed with scroll, 5-column grid (margin 50, pitch 290x270).
- Spacing rhythm: 6/8/10 inside groups, 16/20 between groups, 28/36 between sections.

## Components

- **Button**: primary (accent fill, white text), secondary (white fill, `line-2` border), ghost (no border, `ink-2`). 16px stroke icons, 1.75 stroke, round caps.
- **Guest chip**: 36px, `line` border, grip icon, 24px initials avatar, name. Dragged: accent border, shadow, slight rotation via `DragOverlay`.
- **Table**: box `tableBox(c)`, disc `2 * tableRadius(c)` with name + `n/c`; ring/disc color by occupancy (empty/partial/full tokens). Seats 28px on the ring: empty = white with dashed `line-2` border; occupied = `seat-on` fill with initials; drop target = accent border + `accent-soft` fill; rejected table = danger ring plus `0 0 0 4px rgba(220,38,38,.15)` halo.
- **Popover** (seat picker, seated-guest menu, table menu): panel background, `line` border, 10px radius, shadow; rows 34px; destructive rows in `danger`; caption rows 11px uppercase `ink-3`.
- **Toast**: `ink` background, white text, 36px, 8px radius, bottom-left of the canvas, 150–250ms fade.
- **Dialog** (share, confirm): 480px, 14px radius, `rgba(28,34,48,.45)` scrim, footer on `ground` with a top hairline.
- **Guest view**: phone-first column, 20px side padding; search input 52px with accent 2px border and `accent-soft` halo when focused; result table drawn at radius 110px with 44px seats, own seat filled with accent and labeled "Vos"; list "En tu mesa" below.

## Icons

Inline SVG only, 16/20px, stroke 1.75–2, round caps and joins, `currentColor`. No emoji, no icon fonts.

## Motion

Transitions 150–200ms ease-out on hover, focus, drop-target ring and toast. No page-load choreography.

## States to ship

Every control: default, hover, focus-visible (accent 2px ring), disabled (50% opacity). Tables: empty, partial, full, drop target, rejected. Guest view: typing, multiple matches, one match, no match, invalid link.
