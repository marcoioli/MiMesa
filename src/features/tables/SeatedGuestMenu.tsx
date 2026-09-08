import { useState } from 'react';

import ConfirmDialog from '../../app/ConfirmDialog';
import { guestNamesById } from '../../store/selectors';
import { useEventStore } from '../../store/useEventStore';

import Popover from './Popover';
import type { PopoverAnchor } from './Popover';

export type SeatedGuestMenuProps = {
  guestId: string;
  anchor: PopoverAnchor;
  onClose: () => void;
};

/**
 * RF-24 and the seat half of RF-17: opened by clicking a seated guest. The drag
 * sensor only activates past 5px, so a plain click reaches this menu without
 * moving anyone.
 */
export default function SeatedGuestMenu({ guestId, anchor, onClose }: SeatedGuestMenuProps) {
  const event = useEventStore((state) => state.event);
  const unseatGuest = useEventStore((state) => state.unseatGuest);
  const removeGuest = useEventStore((state) => state.removeGuest);

  const [confirming, setConfirming] = useState(false);

  const name = guestNamesById(event).get(guestId);
  // The guest may have been deleted from the sidebar while the menu was open.
  if (name === undefined) return null;

  // While confirming, the popover is unmounted instead of stacked under the
  // dialog: its outside-pointerdown listener would otherwise close the menu (and
  // with it the dialog) before the "Confirmar" click landed.
  if (confirming) {
    return (
      <ConfirmDialog
        open
        message="¿Eliminar a este invitado?"
        onConfirm={() => {
          removeGuest(guestId);
          onClose();
        }}
        onCancel={() => setConfirming(false)}
      />
    );
  }

  return (
    <Popover anchor={anchor} onClose={onClose} width={210} label={name}>
      <div className="truncate px-3 pb-2 pt-1.5 font-extrabold text-ink" title={name}>
        {name}
      </div>

      <button
        type="button"
        onClick={() => {
          unseatGuest(guestId);
          onClose();
        }}
        className="flex h-[34px] w-full items-center gap-2 px-3 text-left font-semibold text-ink transition-colors duration-150 hover:bg-accent-soft"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M15 3H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
          <path d="M10 12h11" />
          <path d="m18 9 3 3-3 3" />
        </svg>
        Quitar de la mesa
      </button>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-[34px] w-full items-center gap-2 px-3 text-left font-semibold text-danger transition-colors duration-150 hover:bg-danger-soft"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
        Eliminar invitado
      </button>
    </Popover>
  );
}
