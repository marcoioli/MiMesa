import { useEffect, useMemo, useState } from 'react';
import type { SharePayload } from '../../store/types';
import { readSharePayload } from '../share/encode';
import GuestSearch, { type GuestMatch } from './GuestSearch';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function formatGuestDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return isoDate;
  const month = MONTHS[m - 1] ?? '';
  return `${d} de ${month} de ${y}`;
}

/**
 * Guest view entry component for /invitado.
 * NEVER import useEventStore here: this route reads only the URL fragment.
 */
export default function GuestView() {
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  const [_selectedMatch, setSelectedMatch] = useState<GuestMatch | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      setSelectedMatch(null);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const payload: SharePayload | null = useMemo(() => readSharePayload(hash), [hash]);

  if (!payload) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-ground px-5 py-12">
        <div className="flex w-full max-w-[390px] flex-col items-center gap-4 rounded-[14px] border border-line bg-panel p-6 text-center shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_32px_-12px_rgba(20,28,45,.15)]">
          <div className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="" width="24" height="24" className="h-6 w-6" />
            <span className="text-[14px] font-extrabold tracking-[-0.01em] text-ink-2">MiMesa</span>
          </div>
          <p className="text-[15px] font-semibold leading-relaxed text-ink">
            El link no es válido. Pedile uno nuevo al organizador.
          </p>
        </div>
      </div>
    );
  }

  const dateStr = formatGuestDate(payload.d);
  const metaText = dateStr && payload.p ? `${dateStr} · ${payload.p}` : dateStr || payload.p || '';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col gap-7 bg-ground px-5 pb-8 pt-12">
      {/* Event Header */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <img src="/logo-mark.png" alt="" width="20" height="20" className="h-5 w-5" />
          <span className="text-[13px] font-extrabold tracking-[-0.01em] text-ink-2">MiMesa</span>
        </div>
        <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink text-balance">
          {payload.n}
        </h1>
        {metaText && <p className="text-[15px] font-semibold text-ink-3">{metaText}</p>}
      </div>

      {/* Search Input and Matches */}
      <GuestSearch payload={payload} onSelectMatch={(match) => setSelectedMatch(match)} />

      {/* Help card */}
      <div className="mt-auto flex flex-col gap-1.5 rounded-xl border border-line bg-panel p-4">
        <span className="text-[13px] font-extrabold text-ink">¿No aparecés en la lista?</span>
        <p className="text-[13px] font-medium leading-[1.5] text-ink-3">
          Probá con tu apellido. Si sigue sin aparecer, consultá al organizador.
        </p>
      </div>
    </div>
  );
}
