import { useEffect, useState } from 'react';

import { useToastStore } from '../../app/useToastStore';
import { MAX_CAPACITY, MAX_TABLES, MIN_CAPACITY } from '../../lib/constants';
import { useEventStore } from '../../store/useEventStore';

export type AddTableDialogProps = {
  open: boolean;
  onClose: () => void;
};

const DEFAULT_CAPACITY = 8;
const STEP_CLASS =
  'flex h-6 w-6 items-center justify-center rounded-md border border-line-2 text-ink disabled:opacity-50';

/**
 * RF-06 (add half). `addTable` is a no-op at 20 tables, so the ceiling is checked
 * here to show the notice the store cannot show by itself.
 */
export default function AddTableDialog({ open, onClose }: AddTableDialogProps) {
  const event = useEventStore((state) => state.event);
  const addTable = useEventStore((state) => state.addTable);
  const toast = useToastStore((state) => state.toast);

  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);

  // Every opening starts from the default capacity, never from the last one used.
  useEffect(() => {
    if (open) setCapacity(DEFAULT_CAPACITY);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    if ((event?.tables.length ?? 0) >= MAX_TABLES) {
      toast('Máximo 20 mesas.');
      onClose();
      return;
    }
    addTable(capacity);
    onClose();
  };

  return (
    <div
      data-export-ignore="true"
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28,34,48,.45)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Agregar mesa"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[260px] rounded-[14px] border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_32px_-12px_rgba(20,28,45,.28)]"
      >
        <p className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">Agregar mesa</p>

        <div className="mt-3 flex h-[34px] items-center justify-between font-semibold text-ink">
          <span>Capacidad</span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <button
              type="button"
              aria-label="-"
              disabled={capacity <= MIN_CAPACITY}
              onClick={() => setCapacity((value) => Math.max(MIN_CAPACITY, value - 1))}
              className={STEP_CLASS}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14" />
              </svg>
            </button>
            {capacity}
            <button
              type="button"
              aria-label="+"
              disabled={capacity >= MAX_CAPACITY}
              onClick={() => setCapacity((value) => Math.min(MAX_CAPACITY, value + 1))}
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
          onClick={submit}
          className="mt-3 h-8 w-full rounded-lg border border-accent bg-accent text-[12px] font-bold text-white"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
