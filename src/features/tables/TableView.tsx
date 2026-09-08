import type { ReactNode } from 'react';

import { SEAT, seatPositions, tableBox, tableRadius } from '../../lib/geometry';

export type OccupancyTone = 'empty' | 'partial' | 'full';

export type TableViewProps = {
  name: string;
  capacity: number;
  /** length === capacity; seatNames[i] = guest name or null. */
  seatNames: (string | null)[];
  /** RF-32: the guest's own seat in the shared view. */
  highlightSeatIndex?: number;
  /** RF-22: red ring on a refused drop. */
  rejectedSeatIndex?: number;
  /** Derived from seatNames when omitted (RF-10). */
  occupancyTone?: OccupancyTone;
  /** RF-25: open the seat picker on an empty seat. */
  onSeatClick?: (index: number) => void;
  /** Wraps the inner seat node; the returned wrapper MUST be w-full h-full. */
  renderSeat?: (s: { index: number; name: string | null; node: ReactNode }) => ReactNode;
  /** Wraps the disc, e.g. to make the table body a droppable (RF-21). */
  renderBody?: (node: ReactNode) => ReactNode;
  /** Wraps the centre label, e.g. drag handle / rename / table menu. */
  renderCenter?: (node: ReactNode) => ReactNode;
  className?: string;
};

const DISC_TONE: Record<OccupancyTone, string> = {
  empty: 'border-empty bg-empty-soft',
  partial: 'border-partial bg-partial-soft',
  full: 'border-full bg-full-soft',
};

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

function toneOf(seated: number, capacity: number): OccupancyTone {
  if (seated === 0) return 'empty';
  if (seated >= capacity) return 'full';
  return 'partial';
}

/**
 * Frozen presentational drawing of a round table. It reads no store and knows
 * nothing about dnd-kit: the editor (track B) injects behaviour through the
 * render slots, the guest view (track C) passes no slots at all.
 */
export default function TableView({
  name,
  capacity,
  seatNames,
  highlightSeatIndex,
  rejectedSeatIndex,
  occupancyTone,
  onSeatClick,
  renderSeat,
  renderBody,
  renderCenter,
  className,
}: TableViewProps) {
  const box = tableBox(capacity);
  const disc = 2 * tableRadius(capacity);
  const seated = seatNames.filter((seatName) => seatName !== null).length;
  const tone = occupancyTone ?? toneOf(seated, capacity);

  const center = (
    <div className="flex w-full flex-col items-center justify-center gap-px px-2 text-center">
      <span title={name} className="block w-full truncate text-[11px] font-extrabold tracking-[-0.01em] text-ink">
        {name}
      </span>
      <span className="text-[10px] font-bold tabular-nums text-ink-3">
        {seated}/{capacity}
      </span>
    </div>
  );

  const body = (
    <div
      className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 ${DISC_TONE[tone]}`}
      style={{ width: disc, height: disc }}
    >
      {renderCenter ? renderCenter(center) : center}
    </div>
  );

  return (
    <div className={className} style={{ position: 'relative', width: box, height: box }}>
      {renderBody ? renderBody(body) : body}

      {seatPositions(capacity).map((offset, index) => {
        const seatName = seatNames[index] ?? null;
        const highlighted = highlightSeatIndex === index;
        const rejected = rejectedSeatIndex === index;

        const fill = highlighted
          ? 'bg-accent text-white'
          : seatName !== null
            ? 'bg-seat-on text-ink'
            : 'bg-panel text-ink-2';
        const ring = rejected
          ? 'border-2 border-danger shadow-[0_0_0_4px_rgba(220,38,38,.15)]'
          : highlighted
            ? 'border-2 border-accent'
            : seatName !== null
              ? 'border-[1.5px] border-solid border-seat-on-border'
              : 'border-[1.5px] border-dashed border-line-2';

        const node = (
          <div
            title={seatName ?? undefined}
            onClick={onSeatClick ? () => onSeatClick(index) : undefined}
            className={`flex h-full w-full select-none items-center justify-center rounded-full text-[9px] font-extrabold tracking-[0.02em] ${fill} ${ring} ${onSeatClick ? 'cursor-pointer' : ''}`}
          >
            {seatName !== null ? initialsOf(seatName) : null}
          </div>
        );

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              width: SEAT,
              height: SEAT,
              left: `calc(50% + ${offset.x}px)`,
              top: `calc(50% + ${offset.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {renderSeat ? renderSeat({ index, name: seatName, node }) : node}
          </div>
        );
      })}
    </div>
  );
}
