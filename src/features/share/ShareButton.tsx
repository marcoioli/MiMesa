import { useState } from 'react';
import { useEventStore } from '../../store/useEventStore';
import ShareDialog from './ShareDialog';

/**
 * Topbar share button and dialog trigger.
 * Zero-prop default export imported by Topbar (track A).
 */
export default function ShareButton() {
  const event = useEventStore((s) => s.event);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={!event}
        onClick={() => setIsOpen(true)}
        className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-accent bg-accent px-3 text-[13px] font-semibold text-white transition hover:opacity-95 active:opacity-90 disabled:opacity-50"
      >
        <svg
          className="h-4 w-4 stroke-current stroke-[1.75]"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="m16 6-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
        Compartir
      </button>

      <ShareDialog open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
