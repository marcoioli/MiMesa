/**
 * Frozen (Phase 0). The drag-and-drop contract tracks A and B compile against
 * (RF-20..RF-23, RF-38). Shapes and id builders follow design.md "Drag and Drop".
 *
 * Track A produces `GuestDragData` with `from: null` (sidebar cards) and the
 * sidebar drop target; track B produces the seated variant, both table payloads
 * and every table-side drop id.
 */

/** A guest being dragged, either from the sidebar (`from: null`) or from a seat. */
export type GuestDragData = {
  type: 'guest';
  guestId: string;
  from: { tableId: string; seatIndex: number } | null;
};

/** A table being moved. `x`/`y` are the position at drag start; `onDragEnd` adds the delta. */
export type TableDragData = {
  type: 'table';
  tableId: string;
  x: number;
  y: number;
};

export type DragData = GuestDragData | TableDragData;

/** A single seat as a drop target (RF-20). */
export type SeatDropData = { type: 'seat'; tableId: string; seatIndex: number };

/** The table disc as a drop target: seats into the first free seat (RF-21). */
export type TableDropData = { type: 'table'; tableId: string };

/** The unseated sidebar as a drop target: releases a seated guest back to it (RF-38). */
export type SidebarDropData = { type: 'sidebar' };

export type DropData = SeatDropData | TableDropData | SidebarDropData;

/** Fixed id: the sidebar is a single droppable, so it needs no builder. */
export const SIDEBAR_DROP_ID = 'sidebar';

export const guestDragId = (guestId: string): string => `guest:${guestId}`;
export const tableDragId = (tableId: string): string => `tablemove:${tableId}`;
export const seatDropId = (tableId: string, seatIndex: number): string =>
  `seat:${tableId}:${seatIndex}`;
export const tableDropId = (tableId: string): string => `table:${tableId}`;
