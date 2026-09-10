import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { counters } from '../store/selectors';
import { useEventStore } from '../store/useEventStore';

import ConfirmDialog from './ConfirmDialog';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Same shape the topbar prints. Duplicated on purpose: Topbar.tsx is a finished
 * track A file and src/lib is frozen, so neither can host the helper.
 */
function formatDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${MONTHS[m - 1] ?? ''} ${y}`;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <b className="text-[15px] font-extrabold tabular-nums tracking-[-0.01em] text-ink">{value}</b>
      <span className="text-[12px] font-bold text-ink-3">{label}</span>
    </div>
  );
}

/**
 * RF-41: the landing screen. It shows the brand, the saved event when there is one,
 * and the single entry point to the creation form. The store still holds one event
 * (`event: Event | null`), so "Tus eventos" lists at most one card.
 */
export default function HomePage() {
  const event = useEventStore((s) => s.event);
  const resetEvent = useEventStore((s) => s.resetEvent);
  const navigate = useNavigate();

  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const stats = counters(event);
  const formattedDate = event?.date ? formatDate(event.date) : '';
  const place = event?.place?.trim();
  const metaText = formattedDate && place ? `${formattedDate} · ${place}` : formattedDate || place || '';

  const handleCreate = () => {
    if (event) {
      setIsReplaceDialogOpen(true);
      return;
    }
    navigate('/nuevo');
  };

  const handleConfirmReplace = () => {
    setIsReplaceDialogOpen(false);
    navigate('/nuevo');
  };

  const handleConfirmDelete = () => {
    setIsDeleteDialogOpen(false);
    resetEvent();
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-9 bg-ground px-6 py-14"
      style={{
        backgroundImage: 'radial-gradient(#d5dbe5 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundPosition: '12px 12px',
      }}
    >
      <header className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="MiMesa" width={144} height={144} className="h-36 w-36" />
        <h1 className="max-w-[420px] text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          Armá las mesas de tu evento
        </h1>
        <p className="max-w-[420px] text-[14px] font-medium leading-relaxed text-ink-3">
          Ubicá a cada invitado arrastrándolo a su silla y compartí el plano con un link.
        </p>
      </header>

      <section className="w-full max-w-[420px]">
        <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-[13px] font-extrabold tracking-[-0.01em] text-ink-2">Tus eventos</h2>
          {event && (
            <button
              type="button"
              onClick={handleCreate}
              className="rounded text-[12px] font-bold text-ink-3 underline-offset-4 transition hover:text-ink hover:underline focus:outline-none focus:ring-2 focus:ring-accent-soft"
            >
              Crear uno nuevo
            </button>
          )}
        </div>

        {event ? (
          <article className="rounded-[14px] border border-line bg-panel p-5 shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_32px_-12px_rgba(20,28,45,.28)]">
            <h3 className="truncate text-[18px] font-extrabold tracking-[-0.02em] text-ink" title={event.name}>
              {event.name}
            </h3>
            {metaText && <p className="mt-0.5 truncate text-[12px] font-semibold text-ink-3">{metaText}</p>}

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-[10px] border border-line bg-ground p-3">
              <Stat value={event.tables.length} label={event.tables.length === 1 ? 'mesa' : 'mesas'} />
              <Stat value={stats.total} label="invitados" />
              <Stat value={stats.seated} label="sentados" />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/plano"
                className="flex-1 rounded-lg border border-accent bg-accent px-4 py-2.5 text-center text-[14px] font-bold text-white shadow-sm transition hover:brightness-105 active:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent-soft"
              >
                Abrir plano
              </Link>
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="rounded-lg border border-line-2 bg-panel px-3.5 py-2.5 text-[13px] font-bold text-danger transition hover:border-danger/40 focus:outline-none focus:ring-2 focus:ring-accent-soft"
              >
                Eliminar
              </button>
            </div>
          </article>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-[14px] border border-dashed border-line-2 px-6 py-9 text-center">
            <p className="text-[13px] font-medium text-ink-3">Todavía no creaste ningún evento.</p>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-lg border border-accent bg-accent px-5 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:brightness-105 active:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent-soft"
            >
              <svg
                className="h-4 w-4 stroke-current stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Crear evento
            </button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={isReplaceDialogOpen}
        message="Si creás un evento nuevo, el actual se va a borrar."
        confirmLabel="Crear igual"
        onConfirm={handleConfirmReplace}
        onCancel={() => setIsReplaceDialogOpen(false)}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        message="Vas a borrar el evento con todas sus mesas e invitados."
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
