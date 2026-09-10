import { useState } from 'react';

import { useEventStore } from '../../store/useEventStore';

export default function AddGuestInline() {
  const [name, setName] = useState('');
  const addGuest = useEventStore((s) => s.addGuest);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addGuest(trimmed);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Agregar invitado"
        aria-label="Agregar invitado"
        className="h-[34px] flex-1 rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
      />
      <button
        type="submit"
        aria-label="Agregar invitado"
        title="Agregar invitado"
        className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg border border-line-2 bg-panel text-ink transition hover:border-ink-3 active:bg-ground"
      >
        <svg
          className="h-4 w-4 stroke-current"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </form>
  );
}
