import { useState } from 'react';

import { useEventStore } from '../../store/useEventStore';

export type EventEditDialogProps = {
  open: boolean;
  onClose: () => void;
};

function EventEditDialogModal({ onClose }: { onClose: () => void }) {
  const event = useEventStore((s) => s.event);
  const updateEvent = useEventStore((s) => s.updateEvent);

  const [name, setName] = useState(event?.name ?? '');
  const [date, setDate] = useState(event?.date ?? '');
  const [place, setPlace] = useState(event?.place ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDate = date.trim();
    const trimmedPlace = place.trim();

    if (!trimmedName || !trimmedDate) {
      setErrorMessage('Completá el nombre y la fecha.');
      return;
    }

    updateEvent(trimmedName, trimmedDate, trimmedPlace || undefined);
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
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[14px] border border-line bg-panel p-6 shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_32px_-12px_rgba(20,28,45,.28)]"
      >
        <h2 className="text-[16px] font-extrabold tracking-[-0.01em] text-ink">Editar evento</h2>

        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink-2">Nombre del evento</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Casamiento Ana y Juan"
              className="h-[34px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink-2">Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-[34px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-ink-2">Lugar (opcional)</span>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Salón Sur"
              className="h-[34px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </label>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[12px] font-semibold text-danger"
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[34px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-semibold text-ink transition hover:border-ink-3 active:bg-ground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-[34px] rounded-lg border border-accent bg-accent px-3 text-[13px] font-semibold text-white transition hover:brightness-105 active:brightness-95"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventEditDialog({ open, onClose }: EventEditDialogProps) {
  if (!open) return null;
  return <EventEditDialogModal onClose={onClose} />;
}
