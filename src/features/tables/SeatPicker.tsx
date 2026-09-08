import { useMemo, useState } from 'react';

import { normalize } from '../../lib/text';
import { unseatedGuests } from '../../store/selectors';
import { useEventStore } from '../../store/useEventStore';

import Popover from './Popover';
import type { PopoverAnchor } from './Popover';

export type SeatPickerProps = {
  tableId: string;
  seatIndex: number;
  anchor: PopoverAnchor;
  onClose: () => void;
};

/** Rows shown before the "+ N mas" overflow line (mockup `Menus.dc.html`). */
const VISIBLE_ROWS = 6;

/** First letters of the first two words: "Ana Rossi" -> "AR". */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * RF-25: opened by clicking an empty seat. Lists the unseated guests with its own
 * search field (component state only, D12) and creates-and-seats a brand new guest
 * in one action, so that guest never appears in the sidebar.
 */
export default function SeatPicker({ tableId, seatIndex, anchor, onClose }: SeatPickerProps) {
  const event = useEventStore((state) => state.event);
  const addGuest = useEventStore((state) => state.addGuest);
  const seatGuest = useEventStore((state) => state.seatGuest);

  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');

  const table = event?.tables.find((candidate) => candidate.id === tableId);

  const matches = useMemo(() => {
    const guests = unseatedGuests(event);
    const needle = normalize(query);
    return needle ? guests.filter((guest) => normalize(guest.name).includes(needle)) : guests;
  }, [event, query]);

  // The table may have been deleted while the picker was open.
  if (!table) return null;

  const visible = matches.slice(0, VISIBLE_ROWS);
  const overflow = matches.length - visible.length;

  const seatExisting = (guestId: string) => {
    seatGuest(guestId, tableId, seatIndex);
    onClose();
  };

  const seatNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) return; // RF-16 guard: a blank name creates nothing.
    const guestId = addGuest(trimmed);
    if (guestId) seatGuest(guestId, tableId, seatIndex);
    onClose();
  };

  return (
    <Popover anchor={anchor} onClose={onClose} width={260} label="Sentar invitado">
      <div className="px-3 pb-1.5 pt-2.5 text-[11px] font-extrabold uppercase tracking-[0.04em] text-ink-3">
        Sentar invitado
      </div>

      <div className="mx-3 mb-2 flex h-8 items-center gap-2 rounded-lg border border-line-2 px-2.5">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="shrink-0 text-ink-3"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar invitado"
          className="w-full bg-transparent font-medium text-ink outline-none placeholder:text-ink-3"
        />
      </div>

      {visible.map((guest) => (
        <button
          key={guest.id}
          type="button"
          onClick={() => seatExisting(guest.id)}
          className="flex h-[34px] w-full items-center gap-2 px-3 text-left font-semibold text-ink transition-colors duration-150 hover:bg-accent-soft"
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-empty-soft text-[9px] font-extrabold text-ink-2">
            {initialsOf(guest.name)}
          </span>
          <span className="truncate">{guest.name}</span>
        </button>
      ))}

      {overflow > 0 ? (
        <div className="flex h-7 items-center px-3 font-semibold text-ink-3">+ {overflow} más</div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          seatNew();
        }}
        className="flex gap-2 border-t border-line px-3 pb-3 pt-2.5"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nuevo invitado"
          className="h-8 min-w-0 flex-1 rounded-lg border border-dashed border-line-2 px-2.5 font-medium text-ink outline-none placeholder:text-ink-3"
        />
        <button
          type="submit"
          className="h-8 shrink-0 rounded-lg border border-accent bg-accent px-3 text-[12px] font-bold text-white"
        >
          Sentar
        </button>
      </form>
    </Popover>
  );
}
