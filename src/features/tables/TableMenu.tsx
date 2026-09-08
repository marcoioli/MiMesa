import { useState } from 'react';

import ConfirmDialog from '../../app/ConfirmDialog';
import {
  MAX_CAPACITY,
  MAX_TABLE_SCALE,
  MIN_CAPACITY,
  MIN_TABLE_SCALE,
  TABLE_SCALE_STEP,
} from '../../lib/constants';
import { useEventStore } from '../../store/useEventStore';

import Popover from './Popover';
import type { PopoverAnchor } from './Popover';

export type TableMenuProps = {
  tableId: string;
  anchor: PopoverAnchor;
  onClose: () => void;
};

const ITEM_CLASS =
  'flex h-[34px] w-full items-center gap-2 px-3 text-left font-semibold transition-colors duration-150';
const STEP_CLASS =
  'flex h-6 w-6 items-center justify-center rounded-md border border-line-2 text-ink disabled:opacity-50';

/**
 * RF-06 (delete), RF-07 (capacity) and RF-12 (empty) for a single table. Capacity
 * is applied on every step, so the store keeps its own 2..20 clamp as the only
 * source of truth and shrinking immediately returns displaced guests to the sidebar.
 */
export default function TableMenu({ tableId, anchor, onClose }: TableMenuProps) {
  const event = useEventStore((state) => state.event);
  const setTableCapacity = useEventStore((state) => state.setTableCapacity);
  const setTableScale = useEventStore((state) => state.setTableScale);
  const clearTable = useEventStore((state) => state.clearTable);
  const removeTable = useEventStore((state) => state.removeTable);

  const [confirming, setConfirming] = useState(false);

  const table = event?.tables.find((candidate) => candidate.id === tableId);
  // The table may have been deleted while the menu was open.
  if (!table) return null;

  const scale = table.scale ?? 1;

  // Unmounting the popover while the dialog is open keeps its outside-pointerdown
  // listener from closing both before "Confirmar" is clicked.
  if (confirming) {
    return (
      <ConfirmDialog
        open
        message="¿Eliminar la mesa? Sus invitados vuelven al panel."
        onConfirm={() => {
          removeTable(tableId);
          onClose();
        }}
        onCancel={() => setConfirming(false)}
      />
    );
  }

  return (
    <Popover anchor={anchor} onClose={onClose} width={300} label={table.name}>
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-1.5">
        <span
          title={table.name}
          className="min-w-0 truncate border-b-[1.5px] border-dashed border-line-2 font-extrabold text-ink"
        >
          {table.name}
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-ink-3">doble click para renombrar</span>
      </div>

      <div className={`${ITEM_CLASS} justify-between text-ink`}>
        <span className="flex items-center gap-2">
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
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Capacidad
        </span>
        <span className="flex items-center gap-1.5 tabular-nums">
          <button
            type="button"
            aria-label="-"
            disabled={table.capacity <= MIN_CAPACITY}
            onClick={() => setTableCapacity(tableId, table.capacity - 1)}
            className={STEP_CLASS}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          {table.capacity}
          <button
            type="button"
            aria-label="+"
            disabled={table.capacity >= MAX_CAPACITY}
            onClick={() => setTableCapacity(tableId, table.capacity + 1)}
            className={STEP_CLASS}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </span>
      </div>

      {/* RF-37: visual size only, same steps as the floating toolbar on the canvas. */}
      <div className={`${ITEM_CLASS} justify-between text-ink`}>
        <span className="flex items-center gap-2">
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
            <path d="M4 9V4h5" />
            <path d="M20 15v5h-5" />
            <path d="M4 4l6 6" />
            <path d="M20 20l-6-6" />
          </svg>
          Tamaño
        </span>
        <span className="flex items-center gap-1.5 tabular-nums">
          <button
            type="button"
            aria-label="-"
            disabled={scale <= MIN_TABLE_SCALE}
            onClick={() => setTableScale(tableId, scale - TABLE_SCALE_STEP)}
            className={STEP_CLASS}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          {scale}x
          <button
            type="button"
            aria-label="+"
            disabled={scale >= MAX_TABLE_SCALE}
            onClick={() => setTableScale(tableId, scale + TABLE_SCALE_STEP)}
            className={STEP_CLASS}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          clearTable(tableId);
          onClose();
        }}
        className={`${ITEM_CLASS} text-ink hover:bg-accent-soft`}
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
          <path d="M4 7h16" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M9 11v6M15 11v6" />
        </svg>
        Vaciar mesa
      </button>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${ITEM_CLASS} text-danger hover:bg-danger-soft`}
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
        Eliminar mesa
      </button>
    </Popover>
  );
}
