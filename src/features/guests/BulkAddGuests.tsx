import { useState } from 'react';

import { useEventStore } from '../../store/useEventStore';

export default function BulkAddGuests() {
  const [text, setText] = useState('');
  const addGuests = useEventStore((s) => s.addGuests);

  const handleAccept = () => {
    addGuests(text);
    setText('');
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line p-4">
      <span className="text-[12px] font-bold text-ink-2">Cargar lista</span>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Un nombre por renglón"
        rows={3}
        className="h-16 resize-none rounded-lg border border-line-2 bg-panel p-2.5 text-[13px] font-medium leading-relaxed text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
      />
      <button
        type="button"
        onClick={handleAccept}
        className="self-end rounded-lg border border-line-2 bg-panel px-3 py-1.5 text-[13px] font-semibold text-ink transition hover:border-ink-3 active:bg-ground"
      >
        Aceptar
      </button>
    </div>
  );
}
