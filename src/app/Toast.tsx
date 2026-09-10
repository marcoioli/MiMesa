import { useEffect } from 'react';

import { useToastStore } from './useToastStore';

const AUTO_DISMISS_MS = 3000;

/** Single toast surface, mounted once by AppLayout (RF-22, RF-26). */
export function ToastHost() {
  const message = useToastStore((s) => s.message);
  const clear = useToastStore((s) => s.clear);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(clear, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [message, clear]);

  if (!message) return null;

  return (
    <div
      data-export-ignore="true"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-50 max-md:bottom-[64px] flex h-9 items-center rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_32px_-12px_rgba(20,28,45,.4)]"
    >
      {message}
    </div>
  );
}
