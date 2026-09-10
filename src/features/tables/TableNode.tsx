import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useCallback, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';

import GuestDraggable from '../../app/dnd/GuestDraggable';
import { useSpotlightStore } from '../../app/useSpotlightStore';
import { MAX_TABLE_SCALE, MIN_TABLE_SCALE, TABLE_SCALE_STEP } from '../../lib/constants';
import type { SeatDropData, TableDragData, TableDropData } from '../../lib/dnd';
import { seatDropId, tableDragId, tableDropId } from '../../lib/dnd';
import { tableBox, tableRadius } from '../../lib/geometry';
import { occupancyOf, seatNamesOf } from '../../store/selectors';
import type { Table } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';

import { useDndFeedback } from './DndProvider';
import SeatPicker from './SeatPicker';
import SeatedGuestMenu from './SeatedGuestMenu';
import TableMenu from './TableMenu';
import TableNameEdit from './TableNameEdit';
import TableView from './TableView';
import type { TableViewProps } from './TableView';

/** Viewport coordinates a popover hangs from. */
type Anchor = { x: number; y: number };

/** Which floating editor this table currently shows. Transient UI state only (D12). */
type MenuState =
  | { kind: 'seat'; seatIndex: number; anchor: Anchor }
  | { kind: 'guest'; guestId: string; anchor: Anchor }
  | { kind: 'table'; anchor: Anchor }
  | { kind: 'rename' }
  | null;

/**
 * One seat as a drop target (RF-20). It exists as a component because `renderSeat`
 * is a render callback, and hooks cannot be called from one.
 */
function SeatDroppable({
  tableId,
  seatIndex,
  occupied,
  swapping,
  spotlit,
  children,
}: {
  tableId: string;
  seatIndex: number;
  occupied: boolean;
  /** RF-39: this seat is one of the two about to trade occupants. */
  swapping: boolean;
  /** RF-40: the search pointed at this seat and it must stand out for a moment. */
  spotlit: boolean;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: seatDropId(tableId, seatIndex),
    data: { type: 'seat', tableId, seatIndex } satisfies SeatDropData,
  });

  // A pending swap wins over the plain hover ring: it is the stronger signal, and it
  // is the only one that also lights the origin seat, which the pointer is not over.
  const ring = swapping
    ? 'ring-2 ring-accent shadow-[0_0_0_5px_var(--color-accent-soft)]'
    : spotlit
      ? 'ring-2 ring-accent shadow-[0_0_0_6px_var(--color-accent-soft)]'
      : isOver && !occupied
        ? 'ring-2 ring-accent'
        : '';

  // The wrapper MUST stay `w-full h-full`, or the drop rect stops matching the seat.
  // `relative` only anchors the RF-40 halo and changes no layout.
  return (
    <div
      ref={setNodeRef}
      className={`relative h-full w-full rounded-full transition-shadow duration-150 ${ring}`}
    >
      {/* The expanding halo is decoration: it must never reach the PNG (RF-35). */}
      {spotlit ? (
        <span
          data-export-ignore="true"
          className="pointer-events-none absolute inset-0 animate-ping rounded-full ring-2 ring-accent"
        />
      ) : null}
      {children}
    </div>
  );
}

/**
 * The table disc as a drop target (RF-21) and as the RF-22 full-table ring, which
 * `TableViewProps` cannot express (it only carries `rejectedSeatIndex`).
 * The wrapper is positioned and sized exactly like the disc it wraps, so the drop
 * rect is the disc and the ring lands on its edge. It also carries the RF-37
 * selection outline and the click that selects: the seats are siblings of this
 * wrapper in `TableView`, so a seat click never reaches it.
 */
function BodyDroppable({
  tableId,
  size,
  rejected,
  selected,
  onSelect,
  children,
}: {
  tableId: string;
  size: number;
  rejected: boolean;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: tableDropId(tableId),
    data: { type: 'table', tableId } satisfies TableDropData,
  });

  // A refused drop wins over the selection outline: it is the transient signal.
  const ring = rejected
    ? 'ring-2 ring-danger shadow-[0_0_0_4px_rgba(220,38,38,.15)]'
    : selected
      ? 'ring-2 ring-accent shadow-[0_0_0_5px_rgba(79,70,229,.15)]'
      : '';

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-shadow duration-150 ${ring}`}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

/** 28px stepper button of the floating size toolbar (RF-37). */
const SIZE_STEP_CLASS =
  'flex h-7 w-7 items-center justify-center rounded-md border border-line-2 text-ink transition-colors duration-150 hover:text-accent disabled:opacity-50 disabled:hover:text-ink';

export type TableNodeProps = {
  table: Table;
  /** RF-37: selection lives in `CanvasArea`, one table at a time. */
  selected: boolean;
  onSelect: (tableId: string | null) => void;
};

/**
 * One table on the canvas: the frozen `TableView` drawing plus every editor
 * behaviour injected through its render slots — seat and body droppables (RF-20,
 * RF-21), draggable seated guests (RF-23), the rejection ring (RF-22), the centre
 * drag handle (RF-11), inline rename (RF-08), the click menus (RF-24, RF-25) and
 * the RF-37 selection outline plus size toolbar.
 */
export default function TableNode({ table, selected, onSelect }: TableNodeProps) {
  const event = useEventStore((state) => state.event);
  const setTableScale = useEventStore((state) => state.setTableScale);
  const feedback = useDndFeedback();
  const spotlightGuestId = useSpotlightStore((state) => state.guestId);

  const [menu, setMenu] = useState<MenuState>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  // Last pointer position inside this table, used to anchor the popovers opened
  // from callbacks that carry no DOM event (`onSeatClick`).
  const pointer = useRef<Anchor>({ x: 0, y: 0 });
  const trackPointer = (mouse: PointerEvent<HTMLDivElement>) => {
    pointer.current = { x: mouse.clientX, y: mouse.clientY };
  };

  const seatNames = seatNamesOf(event, table);
  const disc = 2 * tableRadius(table.capacity);
  // RF-37: a purely visual factor. Capacity, seats and geometry are untouched.
  const scale = table.scale ?? 1;
  const box = tableBox(table.capacity);

  // RF-11: the listeners go on the centre label only. On the whole node a
  // pointerdown over a seated guest would bubble and start a table drag.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tableDragId(table.id),
    data: { type: 'table', tableId: table.id, x: table.x, y: table.y } satisfies TableDragData,
  });

  const openGuestMenu = (mouse: MouseEvent<HTMLDivElement>, guestId: string) => {
    mouse.stopPropagation();
    setMenu({ kind: 'guest', guestId, anchor: { ...pointer.current } });
  };

  const handleSeatClick = (index: number) => {
    // An occupied seat opens the seated-guest menu instead (RF-24), wired below.
    if (table.seats[index] !== null) return;
    setMenu({ kind: 'seat', seatIndex: index, anchor: { ...pointer.current } });
  };

  const renderSeat: NonNullable<TableViewProps['renderSeat']> = (seat) => {
    const guestId = table.seats[seat.index] ?? null;
    return (
      <SeatDroppable
        tableId={table.id}
        seatIndex={seat.index}
        occupied={guestId !== null}
        swapping={feedback.isSwapSeat(table.id, seat.index)}
        spotlit={guestId !== null && guestId === spotlightGuestId}
      >
        {guestId === null ? (
          seat.node
        ) : (
          <GuestDraggable
            guestId={guestId}
            from={{ tableId: table.id, seatIndex: seat.index }}
            className="h-full w-full"
          >
            <div className="h-full w-full" onClick={(mouse) => openGuestMenu(mouse, guestId)}>
              {seat.node}
            </div>
          </GuestDraggable>
        )}
      </SeatDroppable>
    );
  };

  const renderBody: NonNullable<TableViewProps['renderBody']> = (node) => (
    <BodyDroppable
      tableId={table.id}
      size={disc}
      rejected={feedback.isTableRejected(table.id)}
      selected={selected}
      onSelect={() => onSelect(table.id)}
    >
      {node}
    </BodyDroppable>
  );

  const renderCenter: NonNullable<TableViewProps['renderCenter']> = (node) =>
    menu?.kind === 'rename' ? (
      <TableNameEdit tableId={table.id} onClose={closeMenu} />
    ) : (
      <div
        className="flex w-full cursor-grab items-center justify-center active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onDoubleClick={() => setMenu({ kind: 'rename' })}
        {...listeners}
        {...attributes}
      >
        {node}
      </div>
    );

  // RF-36: `transform` is measured in on-screen pixels, but this node lives inside
  // the scaled canvas, so the live translate is divided by the zoom.
  const zoom = feedback.zoom.current || 1;

  return (
    <div
      ref={setNodeRef}
      className="group absolute"
      style={{
        left: table.x,
        top: table.y,
        // The box grows with the visual scale so the menu button, the toolbar and
        // the dnd-kit droppable rects keep matching the drawing (RF-37).
        width: box * scale,
        height: box * scale,
        // `@dnd-kit/utilities` is not installed and no dependency may be added,
        // so the translate string is built by hand.
        transform: transform
          ? `translate3d(${transform.x / zoom}px, ${transform.y / zoom}px, 0)`
          : undefined,
        zIndex: isDragging ? 30 : selected ? 20 : undefined,
      }}
      onPointerDownCapture={trackPointer}
      onContextMenu={(mouse) => {
        mouse.preventDefault();
        setMenu({ kind: 'table', anchor: { ...pointer.current } });
      }}
    >
      {/* Scaling the wrapper (not the geometry) keeps seats, initials and the label
          in proportion and leaves `TableView` frozen. */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <TableView
          name={table.name}
          capacity={table.capacity}
          seatNames={seatNames}
          occupancyTone={occupancyOf(table).tone}
          rejectedSeatIndex={feedback.rejectedSeatIndex(table.id)}
          onSeatClick={handleSeatClick}
          renderSeat={renderSeat}
          renderBody={renderBody}
          renderCenter={renderCenter}
        />
      </div>

      {selected ? (
        <div
          data-export-ignore="true"
          className="absolute bottom-full left-0 mb-2 flex h-8 items-center gap-1.5 rounded-lg border border-line bg-panel px-2 shadow-[0_4px_14px_rgba(28,34,48,.14)]"
        >
          <span className="text-[11px] font-bold text-ink-3">Tamaño</span>
          <button
            type="button"
            aria-label="-"
            disabled={scale <= MIN_TABLE_SCALE}
            onClick={() => setTableScale(table.id, scale - TABLE_SCALE_STEP)}
            className={SIZE_STEP_CLASS}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <span className="min-w-[34px] text-center text-[11px] font-bold tabular-nums text-ink">
            {scale}x
          </span>
          <button
            type="button"
            aria-label="+"
            disabled={scale >= MAX_TABLE_SCALE}
            onClick={() => setTableScale(table.id, scale + TABLE_SCALE_STEP)}
            className={SIZE_STEP_CLASS}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Opciones de la mesa"
        data-export-ignore="true"
        onClick={(mouse) => {
          const rect = mouse.currentTarget.getBoundingClientRect();
          setMenu({ kind: 'table', anchor: { x: rect.left, y: rect.bottom } });
        }}
        className="absolute right-0 top-0 hidden h-6 w-6 items-center justify-center rounded-md border border-line bg-panel text-ink-2 group-hover:flex"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M6 12h.01M12 12h.01M18 12h.01" />
        </svg>
      </button>

      {menu?.kind === 'seat' ? (
        <SeatPicker
          tableId={table.id}
          seatIndex={menu.seatIndex}
          anchor={menu.anchor}
          onClose={closeMenu}
        />
      ) : null}
      {menu?.kind === 'guest' ? (
        <SeatedGuestMenu guestId={menu.guestId} anchor={menu.anchor} onClose={closeMenu} />
      ) : null}
      {menu?.kind === 'table' ? (
        <TableMenu tableId={table.id} anchor={menu.anchor} onClose={closeMenu} />
      ) : null}
    </div>
  );
}
