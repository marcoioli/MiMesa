import { unseatedGuests } from '../../store/selectors';
import { useEventStore } from '../../store/useEventStore';
import BulkAddGuests from './BulkAddGuests';
import GuestCard from './GuestCard';

export default function GuestSidebar() {
  const event = useEventStore((s) => s.event);
  const unseated = unseatedGuests(event);
  const totalGuests = event?.guests.length ?? 0;

  return (
    <aside className="flex w-[300px] flex-none flex-col border-r border-line bg-panel">
      <div className="flex items-baseline justify-between px-4 pb-2.5 pt-4">
        <span className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">Sin ubicar</span>
        <span className="text-[12px] font-bold text-ink-3 tabular-nums">
          {unseated.length} de {totalGuests}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-1">
        {unseated.map((guest) => (
          <GuestCard key={guest.id} guest={guest} />
        ))}
      </div>

      <BulkAddGuests />
    </aside>
  );
}
