import { useMemo, useState } from 'react';
import type { SharePayload } from '../../store/types';
import { normalize } from '../../lib/text';

export type GuestMatch = {
  name: string;
  tableName: string;
  tableIndex: number;
  seatIndex: number;
};

export type GuestSearchProps = {
  payload: SharePayload;
  onSelectMatch?: (match: GuestMatch) => void;
};

function getGuestTuples(payload: SharePayload): GuestMatch[] {
  const tuples: GuestMatch[] = [];
  payload.t.forEach((table, tableIndex) => {
    table.s.forEach((name, seatIndex) => {
      if (name !== null && name.trim() !== '') {
        tuples.push({
          name: name.trim(),
          tableName: table.n,
          tableIndex,
          seatIndex,
        });
      }
    });
  });
  return tuples;
}

export default function GuestSearch({ payload, onSelectMatch }: GuestSearchProps) {
  const [query, setQuery] = useState('');

  const tuples = useMemo(() => getGuestTuples(payload), [payload]);

  const normalizedQuery = normalize(query);

  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return tuples.filter((tuple) => normalize(tuple.name).includes(normalizedQuery));
  }, [tuples, normalizedQuery]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <label htmlFor="guest-search-input" className="text-[14px] font-extrabold text-ink">
          Buscá tu nombre
        </label>
        <div className="relative flex h-[52px] items-center rounded-xl border-2 border-line-2 bg-panel pl-3.5 pr-1 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
          <svg
            className="mr-2.5 h-5 w-5 flex-none stroke-ink-3 stroke-[2]"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="guest-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí tu nombre..."
            autoComplete="off"
            className="w-full bg-transparent text-[16px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-3"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
              className="flex h-[44px] w-[44px] flex-none items-center justify-center text-ink-3 transition hover:text-ink"
            >
              <svg
                className="h-4 w-4 stroke-current stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[13px] font-medium text-ink-3">
          Podés escribir solo el nombre o el apellido, sin acentos.
        </p>
      </div>

      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          {matches.map((match) => (
            <button
              key={`${match.tableIndex}-${match.seatIndex}`}
              type="button"
              onClick={() => onSelectMatch?.(match)}
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-between rounded-[10px] border border-line bg-panel px-4 text-left font-bold text-ink transition hover:border-line-2 hover:bg-accent-soft/40 active:bg-accent-soft"
            >
              <span className="truncate pr-2 text-[15px]">{match.name}</span>
              <span className="flex-none text-[13px] font-semibold text-ink-3">{match.tableName}</span>
            </button>
          ))}
        </div>
      )}

      {normalizedQuery !== '' && matches.length === 0 && (
        <div className="rounded-[10px] border border-line bg-panel p-4 text-center">
          <p className="text-[14px] font-semibold text-ink-2">
            No encontramos tu nombre. Consultá al organizador.
          </p>
        </div>
      )}
    </div>
  );
}
