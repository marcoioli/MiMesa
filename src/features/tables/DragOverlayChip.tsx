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

export type DragOverlayChipProps = { name: string };

/**
 * The guest chip that follows the pointer inside `DragOverlay` (RF-20, RF-23):
 * white panel, accent border, lifted shadow and a slight rotation, exactly as in
 * the `Main.dc.html` mockup and DESIGN.md "Guest chip".
 *
 * It deliberately does NOT import track A's `GuestCard`: that would cross a track
 * boundary for a styled div. `data-export-ignore` keeps it out of the PNG (RF-35).
 */
export default function DragOverlayChip({ name }: DragOverlayChipProps) {
  return (
    <div
      data-export-ignore="true"
      className="flex h-9 w-fit -rotate-2 items-center gap-2 rounded-lg border border-accent bg-panel pl-2 pr-2.5 font-semibold text-ink shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_28px_-10px_rgba(20,28,45,.35)]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="shrink-0 text-line-2"
      >
        <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
      </svg>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-extrabold tracking-[0.02em] text-accent">
        {initialsOf(name)}
      </span>
      <span className="whitespace-nowrap">{name}</span>
    </div>
  );
}
