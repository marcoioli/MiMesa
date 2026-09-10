import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

import { useIsCompact } from '../../app/useIsCompact';
import { useSpotlightStore } from '../../app/useSpotlightStore';
import type { DragData, SidebarDropData } from '../../lib/dnd';
import { SIDEBAR_DROP_ID } from '../../lib/dnd';
import { normalize } from '../../lib/text';
import { counters, unseatedGuests } from '../../store/selectors';
import type { Event, Guest } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';
import AddGuestInline from './AddGuestInline';
import BulkAddGuests from './BulkAddGuests';
import GuestCard from './GuestCard';

/** One table and the guests sitting at it, in seat order (RF-43). */
type SeatedGroup = { tableId: string; tableName: string; guests: Guest[] };

/**
 * RF-40, widened by RF-43: the sidebar list only ever holds unseated guests, so a
 * guest used to vanish from the panel the moment they were seated, and only came
 * back while a search was running. This walks the tables instead and now runs with
 * or without a query, so the seated guests are listed all the time, grouped under
 * the table they are sitting at.
 *
 * It stays local rather than moving into `src/store/selectors.ts`, whose exports
 * are a frozen contract track C also builds against. Tables and seats are walked in
 * order, so the groups and the names inside them come out ordered without sorting.
 */
function seatedGroupsOf(event: Event | null, normalizedQuery: string): SeatedGroup[] {
  if (!event) return [];
  const byId = new Map(event.guests.map((guest) => [guest.id, guest]));
  const groups: SeatedGroup[] = [];
  for (const table of event.tables) {
    const guests: Guest[] = [];
    for (const seat of table.seats) {
      if (seat === null) continue;
      const guest = byId.get(seat);
      if (!guest) continue;
      if (normalizedQuery && !normalize(guest.name).includes(normalizedQuery)) continue;
      guests.push(guest);
    }
    if (guests.length > 0) groups.push({ tableId: table.id, tableName: table.name, guests });
  }
  return groups;
}

export default function GuestSidebar() {
  const event = useEventStore((s) => s.event);
  const unseated = unseatedGuests(event);
  const stats = counters(event);

  const [searchQuery, setSearchQuery] = useState('');

  // RF-43: the table groups the user has folded away. Component state and never the
  // store, like the search text above it: this is transient UI state (D12).
  const [foldedTables, setFoldedTables] = useState<ReadonlySet<string>>(() => new Set());
  const toggleTable = (tableId: string) =>
    setFoldedTables((folded) => {
      const next = new Set(folded);
      if (!next.delete(tableId)) next.add(tableId);
      return next;
    });

  // RF-42: on a phone the panel is a bottom sheet that starts collapsed, so the
  // plan owns the screen until the guest list is actually needed.
  const isCompact = useIsCompact();
  const [sheetOpen, setSheetOpen] = useState(false);
  const bodyHidden = isCompact && !sheetOpen;

  // RF-38: the whole panel is one drop target, so a seated guest can be released
  // anywhere over "Sin ubicar" and return to the list instead of to its seat.
  const { setNodeRef, isOver, active } = useDroppable({
    id: SIDEBAR_DROP_ID,
    data: { type: 'sidebar' } satisfies SidebarDropData,
  });
  const dragged = active?.data.current as DragData | undefined;
  const willUnseat = isOver && dragged?.type === 'guest' && dragged.from !== null;

  const spotlight = useSpotlightStore((s) => s.spotlight);

  const normalizedQuery = normalize(searchQuery);
  const visibleGuests = normalizedQuery
    ? unseated.filter((guest) => normalize(guest.name).includes(normalizedQuery))
    : unseated;
  const seatedGroups = seatedGroupsOf(event, normalizedQuery);
  const seatedShown = seatedGroups.reduce((count, group) => count + group.guests.length, 0);
  // Folding is ignored while searching: a folded table would hide the very match
  // the search was run to find.
  const foldingActive = normalizedQuery === '';

  return (
    <aside
      ref={setNodeRef}
      className={`flex flex-col transition-colors md:w-[300px] md:flex-none md:border-r ${
        willUnseat ? 'border-accent bg-accent-soft' : 'border-line bg-panel'
      } max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:rounded-t-2xl max-md:border-t max-md:shadow-[0_-8px_24px_-12px_rgba(20,28,45,.35)] ${
        sheetOpen ? 'max-md:h-[62dvh]' : 'max-md:h-[52px]'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (isCompact) setSheetOpen((open) => !open);
        }}
        aria-expanded={isCompact ? sheetOpen : undefined}
        className="flex flex-none items-baseline justify-between px-4 pb-2.5 pt-4 text-left max-md:h-[52px] max-md:items-center max-md:pb-0 max-md:pt-0 md:cursor-default"
      >
        <span className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">Invitados</span>
        <span className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-ink-3 tabular-nums">
            {stats.unseated} sin ubicar
          </span>
          <svg
            className={`h-4 w-4 stroke-ink-3 stroke-[2] transition-transform md:hidden ${
              sheetOpen ? 'rotate-180' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 15 6-6 6 6" />
          </svg>
        </span>
      </button>

      <div className={`min-h-0 flex-1 flex-col ${bodyHidden ? 'hidden' : 'flex'}`}>
        <div className="flex flex-col gap-2 px-4 pb-2.5">
          <div className="relative flex items-center">
            <svg
              className="pointer-events-none absolute left-2.5 h-4 w-4 stroke-ink-3 stroke-[1.75]"
              viewBox="0 0 24 24"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar invitado"
              aria-label="Buscar invitado"
              className="h-[34px] w-full rounded-lg border border-line-2 bg-panel pl-8 pr-7 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-ink-3 hover:text-ink"
                aria-label="Limpiar búsqueda"
              >
                <svg className="h-3.5 w-3.5 stroke-current stroke-2" viewBox="0 0 24 24" fill="none" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <AddGuestInline />
        </div>

        <div className="relative flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-1">
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-[12px] font-extrabold text-ink-2">Sin ubicar</span>
            <span className="text-[11px] font-bold text-ink-3 tabular-nums">
              {visibleGuests.length}
            </span>
          </div>

          {visibleGuests.length > 0 ? (
            visibleGuests.map((guest) => <GuestCard key={guest.id} guest={guest} />)
          ) : (
            <p className="py-1 text-[12px] font-medium text-ink-3">
              {normalizedQuery
                ? 'Ningún invitado sin ubicar coincide.'
                : stats.total === 0
                  ? 'Todavía no cargaste invitados.'
                  : 'Todos los invitados están ubicados.'}
            </p>
          )}

          {seatedGroups.length > 0 ? (
            <>
              <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-[12px] font-extrabold text-ink-2">Ya sentados</span>
                <span className="text-[11px] font-bold text-ink-3 tabular-nums">{seatedShown}</span>
              </div>

              {seatedGroups.map((group) => {
                const folded = foldingActive && foldedTables.has(group.tableId);
                return (
                  <div key={group.tableId} className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTable(group.tableId)}
                      aria-expanded={!folded}
                      className="flex items-center gap-1.5 rounded py-1 text-left text-[11px] font-extrabold text-ink-3 transition-colors hover:text-ink-2"
                    >
                      <svg
                        className={`h-3 w-3 flex-none stroke-current stroke-[2.5] transition-transform ${
                          folded ? '' : 'rotate-90'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                      <span className="truncate">{group.tableName}</span>
                      <span className="tabular-nums">{group.guests.length}</span>
                    </button>

                    {!folded &&
                      group.guests.map((guest) => (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => spotlight(guest.id)}
                          className="flex h-9 items-center rounded-lg border border-line bg-panel px-2.5 text-left transition-colors duration-150 hover:border-accent"
                        >
                          <span className="truncate text-[13px] font-semibold text-ink">
                            {guest.name}
                          </span>
                        </button>
                      ))}
                  </div>
                );
              })}
            </>
          ) : null}
        </div>

        <BulkAddGuests />
      </div>
    </aside>
  );
}
