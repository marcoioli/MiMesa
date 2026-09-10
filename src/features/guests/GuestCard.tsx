import { useState } from 'react';

import ConfirmDialog from '../../app/ConfirmDialog';
import GuestDraggable from '../../app/dnd/GuestDraggable';
import type { Guest } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';

/** First letters of the first two words, uppercased: "Ana Rossi" -> "AR". */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export type GuestCardProps = {
  guest: Guest;
};

export default function GuestCard({ guest }: GuestCardProps) {
  const removeGuest = useEventStore((s) => s.removeGuest);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmDelete = () => {
    setIsConfirmOpen(false);
    removeGuest(guest.id);
  };

  return (
    <>
      <GuestDraggable guestId={guest.id} from={null}>
        <div className="group flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-2.5 text-[13px] font-semibold text-ink shadow-sm transition hover:border-line-2 cursor-grab active:cursor-grabbing select-none">
          <svg
            className="h-3.5 w-3.5 flex-none stroke-line-2"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
          </svg>
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-empty-soft text-[10px] font-extrabold tracking-[0.02em] text-ink-2">
            {initialsOf(guest.name)}
          </span>
          <span className="truncate">{guest.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmOpen(true);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            className="ml-auto flex h-6 w-6 flex-none items-center justify-center rounded text-ink-3 transition hover:bg-ground hover:text-danger"
            aria-label={`Eliminar a ${guest.name}`}
            title="Eliminar invitado"
          >
            <svg
              className="h-3.5 w-3.5 stroke-current stroke-2"
              viewBox="0 0 24 24"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </GuestDraggable>

      <ConfirmDialog
        open={isConfirmOpen}
        message="¿Eliminar a este invitado?"
        confirmLabel="Confirmar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
