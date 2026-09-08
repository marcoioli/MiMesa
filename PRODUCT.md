# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4, Zustand, @dnd-kit/core, React Router, deployed as a static SPA on Vercel. Decided by the user; full rationale in `docs/requirements.md` section 8 and `openspec/changes/mimesa-mvp/design.md`.

## Users

- **Organizer** (primary): a person planning an event (wedding, birthday, company dinner) who sits at a desktop browser with a guest list and needs to decide who sits where. They use the editor once or a few times before the event, often with someone else looking over their shoulder.
- **Guest** (secondary): a person who receives a link on their phone, types their name, and wants to know their table and who is sitting with them. They spend under a minute on it.
- **Evaluators** (context, confirmed by the user): the app is an academic deliverable built by three students in five days. It will be demoed live to show how much a small team can build in parallel. It is not sold and will not scale.

## Product Purpose

MiMesa lets an organizer create an event, pick a table template, paste a guest list, and drag guests onto seats around round tables. When done, they share a link; each guest opens it, searches their name, and sees their table drawn with everyone sitting at it. Success for the demo: a complete organizer flow and a guest view that work on a live deploy, with no backend.

## Positioning

The whole event lives in the link. There is no account, no database, and nothing to install: the seating chart is compressed into the URL fragment, so a guest can open it anywhere and the organizer never loses work to a server. (Inferred from the confirmed no-backend decision.)

## Operating Context

- Editor used on desktop Chrome, Firefox or Edge; the guest view is used on phones.
- The organizer's input is a plain text list, one name per line, usually copied from a chat or spreadsheet.
- Tables are always round, 2 to 20 seats, up to 20 tables on a fixed scrolling canvas.
- Work is saved automatically in the browser; sharing produces a link and a QR code.
- The plan can be exported as a PNG of the whole canvas.

## Capabilities and Constraints

Confirmed scope: `docs/requirements.md` (RF-01 to RF-35). Out of scope: backend, accounts, rectangular tables, guest groups, multiple saved events, importing from a link, printable list, RSVP, undo, dark mode, automated tests.

Terminology (Spanish UI): evento, mesa, silla, invitado, sin ubicar, plano, autoubicar, compartir, vista del invitado.

Constraints: a QR code cannot hold a link longer than about 1,200 characters, so very large events show the copy-link button instead of a QR. The share link carries seated guest names only.

## Brand Commitments

Name: MiMesa. UI language: Spanish (Rioplatense forms such as "Buscá tu nombre" are confirmed in the specs). Visual direction chosen by the user: a clean, tool-like interface (cool neutrals, one accent, dense and clear) rather than a decorative event aesthetic. No logo or brand assets exist.

## Evidence on Hand

No real events, guest lists, photos, or testimonials. Mockups must use clearly fictional sample data (for example a wedding with invented names). Nothing may be presented as a real customer.

## Product Principles

1. Demo-visible first: every screen must read instantly to an audience watching a projector.
2. The canvas is the product: tables and seats get the space; chrome stays thin.
3. Zero-friction input: paste a list, click once, start dragging.
4. Never lose work: autosave, and the link is the backup.
5. The guest gets one answer: their table, their neighbors, nothing else.

## Accessibility & Inclusion

Guest view must be readable on a 360px-wide phone without horizontal scrolling. Hit targets in the guest view at least 44px. No further requirement was established.
