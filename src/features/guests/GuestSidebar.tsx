import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

import type { DragData, SidebarDropData } from '../../lib/dnd';
import { SIDEBAR_DROP_ID } from '../../lib/dnd';
import { normalize } from '../../lib/text';
import { unseatedGuests } from '../../store/selectors';
import { useEventStore } from '../../store/useEventStore';
import AddGuestInline from './AddGuestInline';
import BulkAddGuests from './BulkAddGuests';
import GuestCard from './GuestCard';

export default function GuestSidebar() {
  const event = useEventStore((s) => s.event);
  const unseated = unseatedGuests(event);
  const totalGuests = event?.guests.length ?? 0;

  const [searchQuery, setSearchQuery] = useState('');

  // RF-38: the whole panel is one drop target, so a seated guest can be released
  // anywhere over "Sin ubicar" and return to the list instead of to its seat.
  const { setNodeRef, isOver, active } = useDroppable({
    id: SIDEBAR_DROP_ID,
    data: { type: 'sidebar' } satisfies SidebarDropData,
  });
  const dragged = active?.data.current as DragData | undefined;
  const willUnseat = isOver && dragged?.type === 'guest' && dragged.from !== null;

  const normalizedQuery = normalize(searchQuery);
  const visibleGuests = normalizedQuery
    ? unseated.filter((guest) => normalize(guest.name).includes(normalizedQuery))
    : unseated;

  return (
    <aside
      ref={setNodeRef}
      className={`flex w-[300px] flex-none flex-col border-r transition-colors ${
        willUnseat ? 'border-accent bg-accent-soft' : 'border-line bg-panel'
      }`}
    >
      <div className="flex items-baseline justify-between px-4 pb-2.5 pt-4">
        <span className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">Sin ubicar</span>
        <span className="text-[12px] font-bold text-ink-3 tabular-nums">
          {unseated.length} de {totalGuests}
        </span>
      </div>

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
        {visibleGuests.map((guest) => (
          <GuestCard key={guest.id} guest={guest} />
        ))}
      </div>

      <BulkAddGuests />
    </aside>
  );
}
