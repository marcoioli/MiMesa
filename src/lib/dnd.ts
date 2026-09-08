/**
 * Frozen (Phase 0). The drag-and-drop contract tracks A and B compile against
 * (RF-20..RF-23). Shapes and id builders follow design.md "Drag and Drop".
 *
 * Track A only produces `GuestDragData` with `from: null` (sidebar cards);
 * track B produces the seated variant, both table payloads and every drop id.
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

export type DropData = SeatDropData | TableDropData;

export const guestDragId = (guestId: string): string => `guest:${guestId}`;
export const tableDragId = (tableId: string): string => `tablemove:${tableId}`;
export const seatDropId = (tableId: string, seatIndex: number): string =>
  `seat:${tableId}:${seatIndex}`;
export const tableDropId = (tableId: string): string => `table:${tableId}`;
