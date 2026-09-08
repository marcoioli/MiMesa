# MiMesa — instructions for AI coding agents

You are working inside a small, time-boxed student project. Three people build three independent tracks on top of a frozen base. Your job is to implement tasks from the active track exactly as specified, with the smallest correct diff, and to prove it works before calling it done.

`README.md` is the human and agent entry point: it carries the reading list, the step-by-step protocol, the branch/PR rules and the current state. This file adds the rules you must not break. Read both.

## 0. Current state

- Phase 0 (frozen base) and **track B** (canvas, tables, drag and drop, zoom, table size) are done and merged into `main`. Do not work on track B.
- Open tracks: **A** (event and guests) and **C** (share, guest view, PNG export). Each has a guide in `docs/tracks/`.
- Phase 4 (integration on the deploy) runs after A and C are merged.

## 1. How to answer "leé el README y decime qué hacer"

1. Read, in order: `README.md`, this file, `openspec/changes/mimesa-mvp/tasks.md`, the track guide (`docs/tracks/track-a.md` or `track-c.md`), `docs/requirements.md`, the spec files under `openspec/changes/mimesa-mvp/specs/` for the requirement ids of the next task, `openspec/changes/mimesa-mvp/design.md`, `openspec/changes/mimesa-mvp/apply-progress.md`, `DESIGN.md`, and the mockup(s) the track guide names under `docs/design/`.
2. Determine the track: the user tells you, or the branch name does (`feat/track-a-event-guests` = A, `feat/track-c-share-guestview-export` = C). If neither, ask, then stop.
3. Find the first unchecked `- [ ]` task of that track in `tasks.md`.
4. Tell the user, in their language, in a few sentences: the task id, the requirement ids, the files you will create or edit, the store actions and base contracts you will use, and the exact "Done when" check. Then STOP and wait for their OK. Do not write code before it.
5. After the OK: implement that one task only, run `npx tsc --noEmit -p tsconfig.app.json`, and give the user the concrete steps to verify in `npm run dev`. Never claim a browser check you did not run.
6. When the user confirms the check passed: mark the task `[x]` in `tasks.md`, commit (see section 6), and offer the next task.
7. When every task of the track is checked: walk the user through the track guide's "Checklist final" and README's "Terminar el track y abrir el PR": build, lint, merge `origin/main`, push, open the PR to `main` with the template, and tell Marco. Never merge.

If the user asks for something outside the track's tasks (a new feature, a change in a frozen file, a new dependency), do not do it. Explain that it must be agreed with Marco and recorded in the requirements first.

## 2. Ownership: what you may edit

| Track | Branch | Editable paths |
|---|---|---|
| A | `feat/track-a-event-guests` | `src/features/event/**`, `src/features/guests/**` |
| C | `feat/track-c-share-guestview-export` | `src/features/share/**`, `src/features/guest-view/**`, `src/features/export/**` |

Everything else is FROZEN: `src/app/**`, `src/store/**`, `src/lib/**`, `src/features/tables/**` (track B, finished), `src/index.css`, `src/main.tsx`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `vercel.json`, `package.json`. Do not edit a frozen file, another track's folder, or add a dependency. If a task truly needs a frozen change, stop and tell the user: it must be agreed with Marco and committed separately on `main`.

Only mark tasks `[x]` in `tasks.md` for the active track. Do not edit other SDD artifacts (`proposal.md`, `specs/`, `design.md`) unless the user explicitly asks; if you find a contradiction, report it with file references.

## 3. Contracts you build against (do not redefine them)

- Store: `useEventStore` in `src/store/useEventStore.ts` with `event: Event | null` and exactly these 17 actions: `createEvent`, `updateEvent`, `resetEvent`, `addTable`, `removeTable`, `renameTable`, `setTableCapacity`, `setTableScale`, `moveTable`, `clearTable`, `clearAllTables`, `addGuests`, `addGuest` (returns `string | null`), `removeGuest`, `seatGuest` (returns `boolean`), `unseatGuest`, `autoSeat` (returns `{ seated, leftover }`). Semantics are in `design.md`; do not add actions.
- Selectors: `src/store/selectors.ts` (`counters`, `unseatedGuests`, `seatNamesOf`, `occupancyOf`, `guestNamesById`, `seatedGuestIds`).
- Types: `src/store/types.ts` (`Guest`, `Table` with optional `scale`, `Event`, `TableTemplate`, `SharePayload`). Constants: `src/lib/constants.ts`.
- Geometry: `src/lib/geometry.ts`. Text helpers: `src/lib/text.ts` (`normalize`, `slugify`). Ids: `src/lib/ids.ts`.
- Drag and drop: `src/lib/dnd.ts` (data shapes and id builders) and the frozen wrapper `src/app/dnd/GuestDraggable.tsx` (track A wraps sidebar cards with `from: null`). The single `DndContext` and all drop handling live in track B, already done.
- Shared UI: `ConfirmDialog` (`src/app/ConfirmDialog.tsx`, never `window.confirm`), `toast()` from `src/app/useToastStore.ts`, `TableView` (`src/features/tables/TableView.tsx`; track C renders it read-only with `highlightSeatIndex`, no slots).
- Placeholders that other files import and that must keep their default zero-prop export: `src/features/event/Topbar.tsx`, `EventForm.tsx`, `src/features/guests/GuestSidebar.tsx` (track A); `src/features/share/ShareButton.tsx`, `src/features/export/ExportButton.tsx`, `src/features/guest-view/GuestView.tsx` (track C).

## 4. Coding rules

- TypeScript strict. No `any`, no `@ts-ignore`, no non-null assertions to silence errors.
- Styling with Tailwind utilities and the `DESIGN.md` tokens (`bg-ground`, `bg-panel`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-line`, `border-line-2`, `bg-accent`, `bg-accent-soft`, `bg-empty-soft`, `border-partial`, `bg-full-soft`, `text-danger`, ...). No raw hex in components unless the mockup uses a one-off value.
- UI copy in Spanish, exactly the strings fixed in `design.md` ("Exact Spanish strings" table). Code, identifiers, comments, commit messages and PR text in English.
- Icons are inline SVG (stroke 1.75–2, round caps). No emoji, no icon fonts.
- Keep components small and focused; one component per file; colocate a feature's files in its own folder.
- Transient UI state (open menus, search text, selection) stays in component state, never in the store.
- Follow existing patterns in the base and in `src/features/tables/**` (finished track B code is the reference for popovers, dialogs, toasts and token usage) before inventing new ones.

Known traps (each one has bitten a real project):

- The share payload is written raw into the URL fragment (`/invitado#<payload>`) and read raw with `location.hash.slice(1)`. Never `encodeURIComponent`/`decodeURIComponent` it and never route it through `URLSearchParams`; lz-string's alphabet contains `+` and `$`.
- Guard the QR by URL length (`QR_MAX_URL`): `qrcode.react` throws synchronously during render past the QR byte ceiling. Show the copy button plus the fixed Spanish note instead.
- `/invitado` never imports `useEventStore`; it reads only the fragment. Invalid or missing fragment renders the fixed invalid-link message, never a blank page.
- PNG export captures `#${CANVAS_NODE_ID}` (the fixed 1600x1200 inner node, not the scrolling container). That node carries `transform: scale(zoom)`; neutralise the transform during capture. Use `skipFonts: true`, `pixelRatio: 2`, `backgroundColor: '#ffffff'`, a `filter` that drops `[data-export-ignore]` nodes, and `await document.fonts.ready` first.
- Sidebar cards become draggable only through `GuestDraggable`; do not add a second `DndContext` or your own sensors.

## 5. Working method (evidence first)

- Understand before editing: read the task, its spec scenarios and the files you will touch. Reproduce the current behaviour in `npm run dev` when it matters.
- Prefer the smallest diff that satisfies the scenarios. No speculative abstractions, no "while I'm here" refactors, no extra features.
- Verify before claiming: run `npx tsc --noEmit -p tsconfig.app.json` after every change and `npm run build` plus `npm run lint` before a PR. Then hand the user the task's "Done when" steps and wait for their result. If you could not run something, say so.
- There are no automated tests by team decision. Do not add a test runner.
- When a spec and the code disagree, or two documents contradict each other, stop and report it with file references instead of guessing.
- One task at a time. Finish it, verify it, mark it `[x]`, commit, then take the next one.

## 6. Git and delivery

- Work only on the track branch, created from `main` with the exact name above. Never commit to `main`.
- Sync often: `git fetch origin && git merge origin/main`. Tracks are file-disjoint, so a conflict means someone edited a file they do not own: report it.
- Conventional commits scoped to the track: `feat(track-a): bulk guest input (RF-14)`, `fix(track-c): guard QR above 1200 chars (RF-29)`. One task per commit when possible. No AI attribution lines (no `Co-Authored-By`, no "Generated with").
- Never commit `node_modules`, `dist`, `.atl`, `.codegraph`, `.vercel` (already ignored). Never force-push.
- The PR goes to `main` using `.github/pull_request_template.md`: requirement ids done, tasks marked, manual checks actually performed, deviations. Then the user tells Marco. Marco reviews, tests and merges; the agent never merges.
- Do not push or open PRs unless the user asks you to.

## 7. Optional: CodeGraph

If `codegraph` is installed, run `codegraph init` once in your clone (the `.codegraph/` index is per checkout and git-ignored). Then answer structural questions ("who calls `seatGuest`?", "what breaks if I change `TableView`?") with `codegraph explore <symbol>`, `codegraph callers <symbol>`, `codegraph impact <symbol>` before grepping through files.

## 8. Optional: gentle-ai / SDD tooling

The `openspec/` folder is a Spec-Driven Development change named `mimesa-mvp`. If `gentle-ai` is installed, `gentle-ai sdd-status mimesa-mvp --cwd .` prints the structured status. It is not required; the files above are the contract regardless of tooling.
