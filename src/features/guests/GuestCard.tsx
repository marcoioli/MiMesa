import GuestDraggable from '../../app/dnd/GuestDraggable';
import type { Guest } from '../../store/types';

/** First letters of the first two words, uppercased: "Ana Rossi" -> "AR". */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export type GuestCardProps = {
  guest: Guest;
};

export default function GuestCard({ guest }: GuestCardProps) {
  return (
    <GuestDraggable guestId={guest.id} from={null}>
      <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-2.5 text-[13px] font-semibold text-ink shadow-sm transition hover:border-line-2 cursor-grab active:cursor-grabbing select-none">
        <svg
          className="h-3.5 w-3.5 flex-none stroke-line-2"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
        </svg>
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-empty-soft text-[10px] font-extrabold tracking-[0.02em] text-ink-2">
          {initialsOf(guest.name)}
        </span>
        <span className="truncate">{guest.name}</span>
      </div>
    </GuestDraggable>
  );
}
