import { useEventStore } from '../../store/useEventStore';

/** Placeholder owned by track A. The button only exists to exercise the frozen base. */
export default function EventForm() {
  const createEvent = useEventStore((s) => s.createEvent);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground p-6">
      <div className="w-full max-w-[420px] rounded-[14px] border border-line bg-panel p-6 text-center">
        <p className="text-[14px] font-bold text-ink-2">Formulario de evento (track A)</p>
        <button
          type="button"
          onClick={() => createEvent('Demo', '2026-11-20', undefined, { count: 6, capacity: 8 })}
          className="mt-4 h-[38px] rounded-lg border border-accent bg-accent px-4 text-[13px] font-semibold text-white"
        >
          Crear evento de prueba
        </button>
      </div>
    </div>
  );
}
