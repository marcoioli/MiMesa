# MiMesa — instructions for AI coding agents

You are working inside a small, time-boxed student project. Three people build three independent tracks on top of a frozen base. Your job is to implement tasks from the active track exactly as specified, with the smallest correct diff, and to prove it works before calling it done.

## 1. Read before you touch anything

Read in this order, then start:

1. `docs/requirements.md` — product scope. Requirements RF-01..RF-35 are the whole product. Section 2.2 lists what is explicitly OUT of scope. Never add features.
2. `openspec/changes/mimesa-mvp/tasks.md` — the work list. Find the active track (the user tells you which, or infer it from the branch name `feat/track-<a|b|c>-...`). Take the first unchecked task of that track only.
3. `openspec/changes/mimesa-mvp/specs/<domain>/spec.md` — the Given/When/Then scenarios for the task's requirement ids. They are the acceptance criteria.
4. `openspec/changes/mimesa-mvp/design.md` — the technical contract: types, the 16 store actions and their exact semantics, drag-and-drop approach, seat geometry, share-link encoding, PNG export, the file-ownership table and the table of exact Spanish UI strings.
5. `DESIGN.md` — tokens, type scale, radii, control heights, component states.
6. `docs/design/<Artboard>.dc.html` — the mockup for the screen you are building (`tasks.md` section "Design references" maps artboards to tracks). Copy structure and styling from it.
7. `openspec/changes/mimesa-mvp/apply-progress.md` — recorded deviations from `design.md`. Where they disagree, the code in `src/` and `apply-progress.md` win.

`PRODUCT.md` carries product context (users, purpose, principles). Read it if you need to make a judgment call about behaviour.

## 2. Ownership: what you may edit

| Track | Branch | Editable paths |
|---|---|---|
| A | `feat/track-a-event-guests` | `src/features/event/**`, `src/features/guests/**` |
| B | `feat/track-b-canvas-dnd` | `src/features/tables/**` except `TableView.tsx` |
| C | `feat/track-c-share-guestview-export` | `src/features/share/**`, `src/features/guest-view/**`, `src/features/export/**` |

Everything else is FROZEN: `src/app/**`, `src/store/**`, `src/lib/**`, `src/features/tables/TableView.tsx`, `src/index.css`, `src/main.tsx`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `vercel.json`, `package.json`. Do not edit a frozen file, another track's folder, or add a dependency. If a task truly needs a frozen change, stop and tell the user: it must be agreed by the team and committed separately on `main`.

Only mark tasks `[x]` in `tasks.md` for the active track. Do not edit other SDD artifacts (`proposal.md`, `specs/`, `design.md`) unless the user explicitly asks; if you find a contradiction, report it.

## 3. Contracts you build against (do not redefine them)

- Store: `useEventStore` in `src/store/useEventStore.ts` with `event: Event | null` and exactly these actions: `createEvent`, `updateEvent`, `resetEvent`, `addTable`, `removeTable`, `renameTable`, `setTableCapacity`, `moveTable`, `clearTable`, `clearAllTables`, `addGuests`, `addGuest` (returns `string | null`), `removeGuest`, `seatGuest` (returns `boolean`), `unseatGuest`, `autoSeat` (returns `{ seated, leftover }`). Semantics are in `design.md`; do not add actions.
- Selectors: `src/store/selectors.ts` (`counters`, `unseatedGuests`, `seatNamesOf`, `occupancyOf`, `guestNamesById`, `seatedGuestIds`).
- Types: `src/store/types.ts`. Constants: `src/lib/constants.ts` (canvas size, grid, capacity bounds, `QR_MAX_URL`, `CANVAS_NODE_ID`, `EXPORT_IGNORE_ATTR`, `TEMPLATE_PRESETS`).
- Geometry: `src/lib/geometry.ts`. Text helpers: `src/lib/text.ts` (`normalize`, `slugify`). Ids: `src/lib/ids.ts`.
- Drag and drop data and id builders: `src/lib/dnd.ts`. Guest draggable wrapper: `src/app/dnd/GuestDraggable.tsx`. The single `DndContext` lives in `src/features/tables/DndProvider.tsx` (track B owns its handlers).
- Shared UI: `ConfirmDialog` (`src/app/ConfirmDialog.tsx`, never `window.confirm`), `toast()` from `src/app/useToastStore.ts`, `TableView` (`src/features/tables/TableView.tsx`, presentational; track B wraps seats through `renderSeat`, track C renders it read-only with `highlightSeatIndex`).

## 4. Coding rules

- TypeScript strict. No `any`, no `@ts-ignore`, no non-null assertions to silence errors.
- Styling with Tailwind utilities and the `DESIGN.md` tokens (`bg-ground`, `bg-panel`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-line`, `border-line-2`, `bg-accent`, `bg-accent-soft`, `bg-empty-soft`, `border-partial`, `bg-full-soft`, `text-danger`, ...). No raw hex in components unless the mockup uses a one-off value.
- UI copy in Spanish, exactly the strings fixed in `design.md` ("Exact Spanish strings" table). Code, identifiers, comments, commit messages and PR text in English.
- Icons are inline SVG (stroke 1.75–2, round caps). No emoji, no icon fonts.
- Keep components small and focused; one component per file; colocate a feature's files in its own folder.
- Transient UI state (open menus, search text, selection) stays in component state, never in the store.
- Follow existing patterns in the base before inventing new ones. Read the neighbouring files first.

Known traps (each one has bitten a real project):

- `PointerSensor` must keep `activationConstraint: { distance: 5 }` so click and double-click coexist with drag. Tables drag from their centre label only.
- The share payload is written raw into the URL fragment (`/invitado#<payload>`) and read raw with `location.hash.slice(1)`. Never `encodeURIComponent`/`decodeURIComponent` it and never route it through `URLSearchParams`; lz-string's alphabet contains `+` and `$`.
- Guard the QR by URL length (`QR_MAX_URL`): `qrcode.react` throws synchronously during render past the QR byte ceiling. Show the copy button plus the fixed Spanish note instead.
- `/invitado` never imports `useEventStore`; it reads only the fragment.
- PNG export captures `#${CANVAS_NODE_ID}` (the fixed 1600x1200 inner node, not the scrolling container) with `skipFonts: true`, `pixelRatio: 2`, `backgroundColor: '#ffffff'`, a `filter` that drops `[data-export-ignore]` nodes, and `await document.fonts.ready` first.

## 5. Working method (evidence first)

- Understand before editing: read the task, its spec scenarios and the files you will touch. Reproduce the current behaviour in `npm run dev` when it matters.
- Prefer the smallest diff that satisfies the scenarios. No speculative abstractions, no "while I'm here" refactors, no extra features.
- Verify before claiming: run `npx tsc --noEmit -p tsconfig.app.json` after every change and `npm run build` before a PR. Then do the task's "Done when" check in the browser and say exactly what you checked. If you could not run something, say so; never report a check you did not perform.
- There are no automated tests by team decision. Do not add a test runner.
- When a spec and the code disagree, or two documents contradict each other, stop and report it with file references instead of guessing.
- One task at a time. Finish it, verify it, mark it `[x]`, commit, then take the next one.

## 6. Git and delivery

- Work only on the track branch. Rebase or merge `main` into it often.
- Conventional commits, scoped to the track: `feat(track-b): seat drop with occupied-seat rejection (RF-20, RF-22)`, `fix(track-c): guard QR above 1200 chars`. One task per commit when possible. No AI attribution lines (no `Co-Authored-By`, no "Generated with").
- Never commit `node_modules`, `dist`, `.atl`, `.vercel` (already ignored). Never force-push `main`.
- Open the PR against `main` using the template in `.github/pull_request_template.md`: list the requirement ids done, the manual checks performed, and confirm `tsc` and `build` pass. Keep PRs reviewable: if a track grows past roughly 800 changed lines, split it into two PRs by task groups.
- Do not push, open PRs or merge unless the user asks you to.

## 7. Optional: gentle-ai / SDD tooling

The `openspec/` folder is a Spec-Driven Development change named `mimesa-mvp`. If `gentle-ai` is installed, `gentle-ai sdd-status mimesa-mvp --cwd .` prints the structured status. It is not required; the files above are the contract regardless of tooling.
