import type { SharePayload } from '../../store/types';
import TableView from '../tables/TableView';
import type { GuestMatch } from './GuestSearch';

export type GuestResultProps = {
  payload: SharePayload;
  match: GuestMatch | null;
  onBack: () => void;
};

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export default function GuestResult({ payload, match, onBack }: GuestResultProps) {
  if (!match) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] cursor-pointer items-center gap-1.5 text-[14px] font-bold text-ink-2 transition hover:text-ink"
        >
          <svg
            className="h-4 w-4 stroke-current stroke-[2]"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span>Buscar otro nombre</span>
        </button>
        <div className="rounded-[10px] border border-line bg-panel p-4 text-center">
          <p className="text-[14px] font-semibold text-ink-2">
            No encontramos tu nombre. Consultá al organizador.
          </p>
        </div>
      </div>
    );
  }

  const table = payload.t[match.tableIndex];
  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] cursor-pointer items-center gap-1.5 text-[14px] font-bold text-ink-2 transition hover:text-ink"
        >
          <svg
            className="h-4 w-4 stroke-current stroke-[2]"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span>Buscar otro nombre</span>
        </button>
        <div className="rounded-[10px] border border-line bg-panel p-4 text-center">
          <p className="text-[14px] font-semibold text-ink-2">
            No encontramos tu nombre. Consultá al organizador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar with back button and event name */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] cursor-pointer items-center gap-1.5 text-[14px] font-bold text-ink-2 transition hover:text-ink"
        >
          <svg
            className="h-4 w-4 stroke-current stroke-[2]"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span>Buscar otro nombre</span>
        </button>
        <span className="max-w-[140px] sm:max-w-[180px] truncate text-right text-[12px] font-semibold text-ink-3">
          {payload.n}
        </span>
      </div>

      {/* Headline: Caption and Table name on its own line */}
      <div className="flex flex-col gap-1">
        <span className="text-[14px] sm:text-[15px] font-bold text-ink-3">Estás en la mesa</span>
        <h1 className="break-words text-[28px] sm:text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-accent">
          {table.n}
        </h1>
      </div>

      {/* Table drawing: centered, overflow hidden, responsive */}
      <div
        className="relative flex h-[280px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-line bg-panel"
        style={{
          backgroundImage: 'radial-gradient(var(--color-line, #e3e7ee) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '10px 10px',
        }}
      >
        <div className="flex max-w-full items-center justify-center overflow-hidden">
          <TableView
            name={table.n}
            capacity={table.s.length}
            seatNames={table.s}
            highlightSeatIndex={match.seatIndex}
          />
        </div>
      </div>

      {/* Seated guests list */}
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-4">
        <div className="text-[13px] font-extrabold text-ink-3">En tu mesa</div>
        {table.s.map((seatName, idx) => {
          if (!seatName) return null;
          const isMe = idx === match.seatIndex;
          return (
            <div key={idx} className="flex min-h-[44px] items-center gap-2.5 font-semibold text-ink">
              <span
                className={`flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full text-[10px] font-extrabold ${
                  isMe ? 'bg-accent text-white' : 'bg-seat-on text-ink-2'
                }`}
              >
                {initialsOf(seatName)}
              </span>
              <span className="truncate text-[14px]">{seatName}</span>
              {isMe && <span className="ml-auto flex-none text-[12px] font-extrabold text-accent">vos</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
