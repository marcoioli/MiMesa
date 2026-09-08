import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useCallback, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';

import GuestDraggable from '../../app/dnd/GuestDraggable';
import type { SeatDropData, TableDragData, TableDropData } from '../../lib/dnd';
import { seatDropId, tableDragId, tableDropId } from '../../lib/dnd';
import { tableRadius } from '../../lib/geometry';
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
  children,
}: {
  tableId: string;
  seatIndex: number;
  occupied: boolean;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: seatDropId(tableId, seatIndex),
    data: { type: 'seat', tableId, seatIndex } satisfies SeatDropData,
  });

  // The wrapper MUST stay `w-full h-full`, or the drop rect stops matching the seat.
  return (
    <div
      ref={setNodeRef}
      className={`h-full w-full rounded-full transition-shadow duration-150 ${
        isOver && !occupied ? 'ring-2 ring-accent' : ''
      }`}
    >
      {children}
    </div>
  );
}

/**
 * The table disc as a drop target (RF-21) and as the RF-22 full-table ring, which
 * `TableViewProps` cannot express (it only carries `rejectedSeatIndex`).
 * The wrapper is positioned and sized exactly like the disc it wraps, so the drop
 * rect is the disc and the ring lands on its edge.
 */
function BodyDroppable({
  tableId,
  size,
  rejected,
  children,
}: {
  tableId: string;
  size: number;
  rejected: boolean;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: tableDropId(tableId),
    data: { type: 'table', tableId } satisfies TableDropData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-shadow duration-150 ${
        rejected ? 'ring-2 ring-danger shadow-[0_0_0_4px_rgba(220,38,38,.15)]' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

export type TableNodeProps = { table: Table };

/**
 * One table on the canvas: the frozen `TableView` drawing plus every editor
 * behaviour injected through its render slots — seat and body droppables (RF-20,
 * RF-21), draggable seated guests (RF-23), the rejection ring (RF-22), the centre
 * drag handle (RF-11), inline rename (RF-08) and the click menus (RF-24, RF-25).
 */
export default function TableNode({ table }: TableNodeProps) {
  const event = useEventStore((state) => state.event);
  const feedback = useDndFeedback();

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
      <SeatDroppable tableId={table.id} seatIndex={seat.index} occupied={guestId !== null}>
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
    <BodyDroppable tableId={table.id} size={disc} rejected={feedback.isTableRejected(table.id)}>
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

  return (
    <div
      ref={setNodeRef}
      className="group absolute"
      style={{
        left: table.x,
        top: table.y,
        // `@dnd-kit/utilities` is not installed and no dependency may be added,
        // so the translate string is built by hand.
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 30 : undefined,
      }}
      onPointerDownCapture={trackPointer}
      onContextMenu={(mouse) => {
        mouse.preventDefault();
        setMenu({ kind: 'table', anchor: { ...pointer.current } });
      }}
    >
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
