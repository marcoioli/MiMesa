import { useState } from 'react';

import ConfirmDialog from '../../app/ConfirmDialog';
import { useEventStore } from '../../store/useEventStore';
import ExportButton from '../export/ExportButton';
import ShareButton from '../share/ShareButton';
import EventEditDialog from './EventEditDialog';

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return isoDate;
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthName = months[m - 1] ?? '';
  return `${d} ${monthName} ${y}`;
}

export default function Topbar() {
  const event = useEventStore((s) => s.event);
  const resetEvent = useEventStore((s) => s.resetEvent);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formattedDate = event?.date ? formatDate(event.date) : '';
  const place = event?.place?.trim();
  const metaText = formattedDate && place ? `${formattedDate} · ${place}` : formattedDate || place || '';

  const handleConfirmReset = () => {
    setIsResetDialogOpen(false);
    resetEvent();
  };

  return (
    <header className="flex h-14 flex-none items-center gap-4 border-b border-line bg-panel pl-5 pr-4">
      <div className="flex items-center gap-2 flex-none">
        <img src="/logo-mark.svg" alt="" width="28" height="28" className="h-7 w-7" />
        <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">MiMesa</span>
      </div>

      <div className="h-6 w-px bg-line flex-none" />

      <button
        type="button"
        onClick={() => setIsEditDialogOpen(true)}
        className="group flex min-w-0 items-center gap-2 rounded-lg p-1 text-left transition hover:bg-ground"
        title="Editar evento"
        aria-label="Editar evento"
      >
        <span className="truncate text-[14px] font-bold text-ink">{event?.name ?? ''}</span>
        {metaText && <span className="truncate whitespace-nowrap text-[12px] font-medium text-ink-3">{metaText}</span>}
        <svg
          className="h-3.5 w-3.5 flex-none stroke-ink-3 transition group-hover:stroke-ink stroke-[1.75]"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <ExportButton />
        <ShareButton />
        <button
          type="button"
          onClick={() => setIsResetDialogOpen(true)}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-ink-2 transition hover:bg-ground hover:text-ink active:bg-ground"
        >
          <svg
            className="h-4 w-4 stroke-current stroke-[1.75]"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M14 3v6h6" />
          </svg>
          Nuevo evento
        </button>
      </div>

      <EventEditDialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />

      <ConfirmDialog
        open={isResetDialogOpen}
        message="¿Crear un evento nuevo? Se borrará el evento actual."
        confirmLabel="Confirmar"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </header>
  );
}
