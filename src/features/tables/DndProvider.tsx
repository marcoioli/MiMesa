import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

import { useIsCompact } from '../../app/useIsCompact';
import { useToastStore } from '../../app/useToastStore';
import type { DragData, DropData, GuestDragData } from '../../lib/dnd';
import { guestNamesById } from '../../store/selectors';
import type { Event } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';

import DragOverlayChip from './DragOverlayChip';

/** How long the red ring stays on screen after a refused drop (RF-22). */
const REJECT_FLASH_MS = 600;

/** The target a guest drag is currently being refused by, if any. */
type Rejection =
  | { kind: 'seat'; tableId: string; seatIndex: number }
  | { kind: 'table'; tableId: string }
  | null;

/** One end of a pending swap (RF-39): a seat that will change occupant on release. */
type SeatRef = { tableId: string; seatIndex: number };

export type DndFeedback = {
  /** Index of the seat this table must draw as refused, or `undefined` (RF-22). */
  rejectedSeatIndex: (tableId: string) => number | undefined;
  /** Whether this table's disc must draw the full-table red ring (RF-22). */
  isTableRejected: (tableId: string) => boolean;
  /**
   * Whether this seat is one of the two ends of a swap the pointer is currently
   * offering (RF-39). Both the origin and the target answer `true`, so the two
   * seats about to trade occupants light up together.
   */
  isSwapSeat: (tableId: string, seatIndex: number) => boolean;
  /**
   * Current canvas zoom (RF-36). A ref, not state: `DndProvider` sits above
   * `CanvasArea` in the tree, and a zoom change must not re-render every table.
   */
  zoom: RefObject<number>;
  /** `CanvasArea` publishes its zoom here; pointer deltas are divided by it. */
  setCanvasZoom: (zoom: number) => void;
};

const NO_FEEDBACK: DndFeedback = {
  rejectedSeatIndex: () => undefined,
  isTableRejected: () => false,
  isSwapSeat: () => false,
  zoom: { current: 1 },
  setCanvasZoom: () => undefined,
};

const DndFeedbackContext = createContext<DndFeedback>(NO_FEEDBACK);

/**
 * Rejection feedback shared between the provider and every `TableNode`.
 * It is a context, not store state: hover feedback is transient UI state and must
 * never reach `localStorage` (D12).
 */
export function useDndFeedback(): DndFeedback {
  return useContext(DndFeedbackContext);
}

/** The shape `@dnd-kit/core` 6.x puts on `collision.data` for a droppable hit. */
type CollisionPayload = { droppableContainer?: { data: { current?: DropData } } };

function dropDataOf(data: Record<string, unknown> | undefined): DropData | undefined {
  return (data as CollisionPayload | undefined)?.droppableContainer?.data.current;
}

/**
 * Composed collision detection. `rectIntersection` (the default) is documented as
 * poor for targets as small as the 28px seats, so the pointer decides first and
 * `closestCenter` only fills in when the pointer is over no droppable at all.
 * A seat always beats the table body underneath it (RF-20 over RF-21).
 */
const collisionDetection: CollisionDetection = (args) => {
  const active = args.active.data.current as DragData | undefined;
  if (active?.type === 'table') return []; // a table moves by delta: it needs no droppable.

  // `closestCenter` is deliberately NOT used as the fallback: it always returns a
  // hit, so a guest released over empty canvas would be seated at the nearest
  // table. `rectIntersection` only matches droppables the dragged chip overlaps.
  const within = pointerWithin(args);
  // The sidebar is a full-height 300px target, so it only ever wins under the
  // pointer: in the overlap fallback it would swallow drops meant for the empty
  // canvas beside it and unseat the guest by accident (RF-38).
  const hits =
    within.length > 0
      ? within
      : rectIntersection(args).filter((hit) => dropDataOf(hit.data)?.type !== 'sidebar');
  if (hits.length === 0) return [];
  const seats = hits.filter((hit) => dropDataOf(hit.data)?.type === 'seat');
  return seats.length > 0 ? seats : hits;
};

/** What releasing here would do. Decided before the drop so the ring matches the outcome. */
type Outcome = 'ok' | 'swap' | 'reject';

/**
 * `ok` seats or unseats, `swap` trades two seated guests (RF-39), `reject` draws the
 * RF-22 red ring. Pure, so `handleDragOver` and `handleDragEnd` cannot disagree.
 */
function outcomeOf(event: Event | null, drag: GuestDragData, drop: DropData): Outcome {
  // The sidebar always accepts: a seated guest is released, an unseated one is a no-op.
  if (drop.type === 'sidebar') return 'ok';
  const table = event?.tables.find((candidate) => candidate.id === drop.tableId);
  if (!table) return 'ok';
  // RF-21 takes the first free seat, so a table with none refuses the drop.
  if (drop.type === 'table') return table.seats.includes(null) ? 'ok' : 'reject';
  const occupant = table.seats[drop.seatIndex] ?? null;
  if (occupant === null || occupant === drag.guestId) return 'ok';
  // RF-39: two seated guests trade places. A guest arriving from the sidebar has no
  // seat to give in return, so an occupied seat still refuses it (RF-22).
  return drag.from !== null ? 'swap' : 'reject';
}

/**
 * The single `DndContext` of the editor (D1), mounted by the frozen `AppLayout`
 * around both the sidebar and the canvas so a guest chip can travel from one to
 * the other. Every handler discriminates on `active.data.current.type`.
 */
export default function DndProvider({ children }: { children: ReactNode }) {
  const seatGuest = useEventStore((state) => state.seatGuest);
  const unseatGuest = useEventStore((state) => state.unseatGuest);
  const moveTable = useEventStore((state) => state.moveTable);
  const toast = useToastStore((state) => state.toast);

  const [dragName, setDragName] = useState<string | null>(null);
  const [rejection, setRejection] = useState<Rejection>(null);
  /** The two seats a release would swap right now (RF-39), origin first. */
  const [swap, setSwap] = useState<[SeatRef, SeatRef] | null>(null);
  const flashTimer = useRef<number | null>(null);
  const zoom = useRef(1);

  const setCanvasZoom = useCallback((value: number) => {
    zoom.current = value > 0 ? value : 1;
  }, []);

  // 5px of movement before a drag starts, so RF-24 (click a seated guest) and
  // RF-08 (double-click the table name) coexist with RF-23 and RF-11.
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const pointerSensors = useSensors(pointerSensor);
  // RF-42: both lists are called unconditionally, because `useSensor` is a hook.
  // With no sensor the context can never start a drag, so a touch gesture stays a
  // scroll and the tap paths (RF-24, RF-25) do the seating instead.
  const noSensors = useSensors();
  const isCompact = useIsCompact();
  const sensors = isCompact ? noSensors : pointerSensors;

  const cancelFlash = useCallback(() => {
    if (flashTimer.current !== null) {
      window.clearTimeout(flashTimer.current);
      flashTimer.current = null;
    }
  }, []);

  useEffect(() => cancelFlash, [cancelFlash]);

  const handleDragStart = ({ active }: DragStartEvent) => {
    cancelFlash();
    setRejection(null);
    setSwap(null);
    const data = active.data.current as DragData | undefined;
    setDragName(
      data?.type === 'guest'
        ? guestNamesById(useEventStore.getState().event).get(data.guestId) ?? null
        : null,
    );
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const data = active.data.current as DragData | undefined;
    const drop = over?.data.current as DropData | undefined;
    if (!data || data.type !== 'guest' || !drop || drop.type === 'sidebar') {
      setRejection(null);
      setSwap(null);
      return;
    }
    const outcome = outcomeOf(useEventStore.getState().event, data, drop);

    // RF-39: light both ends while the pointer offers the trade.
    setSwap(
      outcome === 'swap' && drop.type === 'seat' && data.from !== null
        ? [data.from, { tableId: drop.tableId, seatIndex: drop.seatIndex }]
        : null,
    );

    if (outcome !== 'reject') {
      setRejection(null);
      return;
    }
    setRejection(
      drop.type === 'seat'
        ? { kind: 'seat', tableId: drop.tableId, seatIndex: drop.seatIndex }
        : { kind: 'table', tableId: drop.tableId },
    );
  };

  const handleDragEnd = ({ active, delta, over }: DragEndEvent) => {
    setDragName(null);
    setSwap(null);
    const data = active.data.current as DragData | undefined;
    if (!data) return;

    if (data.type === 'table') {
      setRejection(null);
      // RF-11 + RF-36: `delta` is on-screen pixels, so it is divided by the zoom
      // to get canvas pixels. `moveTable` owns the clamp into the 1600x1200 canvas.
      moveTable(data.tableId, data.x + delta.x / zoom.current, data.y + delta.y / zoom.current);
      return;
    }

    const drop = over?.data.current as DropData | undefined;
    if (!drop) {
      setRejection(null); // dropped nowhere: dnd-kit returns the chip, nothing changes.
      return;
    }

    // RF-38: released over the sidebar, a seated guest goes back to "Sin ubicar".
    // A guest dragged out of the sidebar and back is already unseated: no-op.
    if (drop.type === 'sidebar') {
      setRejection(null);
      if (data.from !== null) unseatGuest(data.guestId);
      return;
    }

    const event = useEventStore.getState().event;
    const origin = data.from;

    // RF-39: an occupied seat trades occupants instead of refusing, as long as the
    // dragged guest arrives from a seat of their own to give in return.
    if (origin !== null && drop.type === 'seat' && outcomeOf(event, data, drop) === 'swap') {
      const target = event?.tables.find((table) => table.id === drop.tableId);
      const occupant = target?.seats[drop.seatIndex] ?? null;
      if (occupant !== null) {
        setRejection(null);
        // Order matters and no new store action is needed: freeing the target first
        // lets the dragged guest take it, which in turn frees the origin (RF-23) for
        // the occupant. If the middle step ever failed, the occupant is put back.
        unseatGuest(occupant);
        if (seatGuest(data.guestId, drop.tableId, drop.seatIndex)) {
          seatGuest(occupant, origin.tableId, origin.seatIndex);
          const names = guestNamesById(event);
          const moved = names.get(data.guestId);
          const swapped = names.get(occupant);
          if (moved && swapped) toast(`Intercambiaste a ${moved} con ${swapped}.`);
        } else {
          seatGuest(occupant, drop.tableId, drop.seatIndex);
        }
        return;
      }
    }

    const seated =
      drop.type === 'seat'
        ? seatGuest(data.guestId, drop.tableId, drop.seatIndex)
        : seatGuest(data.guestId, drop.tableId); // RF-21: first free seat.
    if (seated) {
      setRejection(null);
      return;
    }

    // RF-22: hold the red ring for a moment after the release and say why.
    setRejection(
      drop.type === 'seat'
        ? { kind: 'seat', tableId: drop.tableId, seatIndex: drop.seatIndex }
        : { kind: 'table', tableId: drop.tableId },
    );
    toast(drop.type === 'seat' ? 'Esa silla ya está ocupada.' : 'La mesa está completa.');
    cancelFlash();
    flashTimer.current = window.setTimeout(() => {
      flashTimer.current = null;
      setRejection(null);
    }, REJECT_FLASH_MS);
  };

  const handleDragCancel = () => {
    setDragName(null);
    setRejection(null);
    setSwap(null);
  };

  const feedback = useMemo<DndFeedback>(
    () => ({
      rejectedSeatIndex: (tableId) =>
        rejection?.kind === 'seat' && rejection.tableId === tableId
          ? rejection.seatIndex
          : undefined,
      isTableRejected: (tableId) => rejection?.kind === 'table' && rejection.tableId === tableId,
      isSwapSeat: (tableId, seatIndex) =>
        swap !== null &&
        swap.some((end) => end.tableId === tableId && end.seatIndex === seatIndex),
      zoom,
      setCanvasZoom,
    }),
    [rejection, swap, setCanvasZoom],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <DndFeedbackContext.Provider value={feedback}>{children}</DndFeedbackContext.Provider>
      <DragOverlay>{dragName !== null ? <DragOverlayChip name={dragName} /> : null}</DragOverlay>
    </DndContext>
  );
}
