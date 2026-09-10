import { useState } from 'react';

import ConfirmDialog from '../../app/ConfirmDialog';
import { useToastStore } from '../../app/useToastStore';
import { counters } from '../../store/selectors';
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
  const clearAllTables = useEventStore((s) => s.clearAllTables);
  const autoSeat = useEventStore((s) => s.autoSeat);
  const toast = useToastStore((s) => s.toast);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const stats = counters(event);
  const formattedDate = event?.date ? formatDate(event.date) : '';
  const place = event?.place?.trim();
  const metaText = formattedDate && place ? `${formattedDate} · ${place}` : formattedDate || place || '';

  const handleConfirmReset = () => {
    setIsResetDialogOpen(false);
    resetEvent();
  };

  const handleConfirmClearAll = () => {
    setIsClearAllDialogOpen(false);
    clearAllTables();
  };

  const handleAutoSeat = () => {
    const { seated, leftover } = autoSeat();
    let message = `Se ubicaron ${seated} invitados.`;
    if (leftover > 0) {
      message = `${message} Quedaron ${leftover} invitados sin ubicar por falta de sillas.`;
    }
    toast(message);
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

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-baseline gap-1 text-[12px] font-bold text-ink-3">
          <b className="text-[15px] font-extrabold text-ink tabular-nums tracking-[-0.01em]">{stats.total}</b>
          <span>Invitados</span>
        </div>
        <div className="flex items-baseline gap-1 text-[12px] font-bold text-ink-3">
          <b className="text-[15px] font-extrabold text-ink tabular-nums tracking-[-0.01em]">{stats.seated}</b>
          <span>Sentados</span>
        </div>
        <div className="flex items-baseline gap-1 text-[12px] font-bold text-ink-3">
          <b className="text-[15px] font-extrabold text-ink tabular-nums tracking-[-0.01em]">{stats.unseated}</b>
          <span>Sin ubicar</span>
        </div>
        <div className="flex items-baseline gap-1 text-[12px] font-bold text-ink-3">
          <b className="text-[15px] font-extrabold text-ink tabular-nums tracking-[-0.01em]">{stats.freeSeats}</b>
          <span>Sillas libres</span>
        </div>
      </div>

      <div className="h-6 w-px bg-line flex-none" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAutoSeat}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-semibold text-ink transition hover:border-ink-3 active:bg-ground"
        >
          <svg
            className="h-4 w-4 stroke-current stroke-[1.75]"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 3h5v5" />
            <path d="M4 20 21 3" />
            <path d="M21 16v5h-5" />
            <path d="m15 15 6 6" />
            <path d="M4 4l5 5" />
          </svg>
          Autoubicar
        </button>
        <button
          type="button"
          onClick={() => setIsClearAllDialogOpen(true)}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-ink-2 transition hover:bg-ground hover:text-ink active:bg-ground"
        >
          Vaciar todas las mesas
        </button>
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
        open={isClearAllDialogOpen}
        message="¿Vaciar todas las mesas? Los invitados vuelven al panel."
        confirmLabel="Confirmar"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllDialogOpen(false)}
      />

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
