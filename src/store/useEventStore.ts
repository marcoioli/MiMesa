import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  MAX_CAPACITY,
  MAX_TABLES,
  MIN_CAPACITY,
  MIN_TABLES,
  PERSIST_KEY,
  PERSIST_VERSION,
} from '../lib/constants';
import { clampToCanvas, gridLayout } from '../lib/geometry';
import { newId } from '../lib/ids';
import type { Event, Guest, Table, TableTemplate } from './types';

/** The only slice written to local storage (RF-27). Transient UI state never reaches it. */
export type PersistedEventState = { event: Event | null };

/** The 16 actions of the store contract. Every one is a no-op while `event === null`. */
export type EventActions = {
  createEvent: (name: string, date: string, place: string | undefined, template: TableTemplate) => void;
  updateEvent: (name: string, date: string, place?: string) => void;
  resetEvent: () => void;
  addTable: (capacity: number) => void;
  removeTable: (tableId: string) => void;
  renameTable: (tableId: string, name: string) => void;
  setTableCapacity: (tableId: string, capacity: number) => void;
  moveTable: (tableId: string, x: number, y: number) => void;
  clearTable: (tableId: string) => void;
  clearAllTables: () => void;
  addGuests: (text: string) => void;
  /** Returns the new guest id, or `null` when the trimmed name is empty (RF-25 seats it immediately). */
  addGuest: (name: string) => string | null;
  removeGuest: (guestId: string) => void;
  /** `false` on a rejected drop so the caller can flash the red ring and toast (RF-22). */
  seatGuest: (guestId: string, tableId: string, seatIndex?: number) => boolean;
  unseatGuest: (guestId: string) => void;
  /** Counts for the RF-26 notice. */
  autoSeat: () => { seated: number; leftover: number };
};

export type EventState = PersistedEventState & EventActions;

/* ---------------------------------------------------------------------------
 * Pure helpers. They take an `Event` and return a new `Event`; nothing here
 * mutates the object held by the store, so `persist` always sees a fresh tree.
 * Each helper returns the SAME reference when nothing changed, which keeps
 * component selectors from re-rendering after a no-op action.
 * ------------------------------------------------------------------------ */

/** Clamps a possibly invalid numeric input into an integer range; non-finite input falls back to `min`. */
function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

function clampCapacity(capacity: number): number {
  return clampInt(capacity, MIN_CAPACITY, MAX_CAPACITY);
}

function emptySeats(count: number): (string | null)[] {
  return Array<string | null>(count).fill(null);
}

/**
 * Builds a table for grid slot `index`. The clamp is a no-op for the 20 slots of the
 * 5x4 grid (even a capacity-20 table fits the last slot) and only guards an odd index.
 */
function makeTable(name: string, capacity: number, index: number): Table {
  const slot = gridLayout(index);
  const position = clampToCanvas(slot.x, slot.y, capacity);
  return { id: newId(), name, capacity, x: position.x, y: position.y, seats: emptySeats(capacity) };
}

const TABLE_NAME_PATTERN = /^Mesa (\d+)$/;

/** `Mesa ${1 + highest existing numeric suffix}`, so deleting a table never re-issues its name. */
function nextTableName(tables: Table[]): string {
  let highest = 0;
  for (const table of tables) {
    const match = TABLE_NAME_PATTERN.exec(table.name);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `Mesa ${highest + 1}`;
}

/** Replaces one table. Returns the same event when the id is unknown or the transform changed nothing. */
function withTable(event: Event, tableId: string, transform: (table: Table) => Table): Event {
  const index = event.tables.findIndex((table) => table.id === tableId);
  if (index < 0) return event;
  const nextTable = transform(event.tables[index]);
  if (nextTable === event.tables[index]) return event;
  const tables = event.tables.slice();
  tables[index] = nextTable;
  return { ...event, tables };
}

/** Nulls every seat holding `guestId`, at any table. The guest itself stays in `guests`. */
function withGuestUnseated(event: Event, guestId: string): Event {
  let changed = false;
  const tables = event.tables.map((table) => {
    if (!table.seats.includes(guestId)) return table;
    changed = true;
    return { ...table, seats: table.seats.map((seat) => (seat === guestId ? null : seat)) };
  });
  return changed ? { ...event, tables } : event;
}

function isEmptyTable(table: Table): boolean {
  return table.seats.every((seat) => seat === null);
}

/* ------------------------------------------------------------------------ */

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => {
      /** Applies a pure transform to the current event. No-op without an event, or when nothing changed. */
      const mutate = (transform: (event: Event) => Event): void => {
        const current = get().event;
        if (!current) return;
        const next = transform(current);
        if (next !== current) set({ event: next });
      };

      const store: EventState = {
        event: null,

        createEvent(name, date, place, template) {
          const count = clampInt(template.count, MIN_TABLES, MAX_TABLES);
          const capacity = clampCapacity(template.capacity);
          const next: Event = {
            name: name.trim(),
            date,
            tables: Array.from({ length: count }, (_unused, index) =>
              makeTable(`Mesa ${index + 1}`, capacity, index),
            ),
            guests: [],
          };
          const trimmedPlace = place?.trim();
          if (trimmedPlace) next.place = trimmedPlace;
          set({ event: next });
        },

        updateEvent(name, date, place) {
          mutate((event) => {
            // Tables, seats and guests are preserved untouched (RF-02).
            const next: Event = { ...event, name: name.trim(), date };
            delete next.place;
            const trimmedPlace = place?.trim();
            if (trimmedPlace) next.place = trimmedPlace;
            return next;
          });
        },

        resetEvent() {
          set({ event: null });
        },

        addTable(capacity) {
          mutate((event) => {
            // RF-06: the 5x4 grid holds 20 tables; the caller toasts "Maximo 20 mesas.".
            if (event.tables.length >= MAX_TABLES) return event;
            const table = makeTable(
              nextTableName(event.tables),
              clampCapacity(capacity),
              event.tables.length,
            );
            return { ...event, tables: [...event.tables, table] };
          });
        },

        removeTable(tableId) {
          mutate((event) => {
            // No guest is deleted: the occupants simply stop appearing in any `seats`
            // array and therefore become unseated, which is exactly RF-06.
            const tables = event.tables.filter((table) => table.id !== tableId);
            return tables.length === event.tables.length ? event : { ...event, tables };
          });
        },

        renameTable(tableId, name) {
          mutate((event) => {
            const trimmed = name.trim();
            if (!trimmed) return event; // RF-08: an empty name keeps the previous one.
            return withTable(event, tableId, (table) =>
              table.name === trimmed ? table : { ...table, name: trimmed },
            );
          });
        },

        setTableCapacity(tableId, capacity) {
          mutate((event) => {
            const next = clampCapacity(capacity);
            return withTable(event, tableId, (table) => {
              if (table.capacity === next && table.seats.length === next) return table;
              // RF-07: growing appends empty seats; shrinking drops the highest indexes,
              // so their occupants become unseated and return to the sidebar.
              const seats =
                next > table.seats.length
                  ? [...table.seats, ...emptySeats(next - table.seats.length)]
                  : table.seats.slice(0, next);
              return { ...table, capacity: next, seats };
            });
          });
        },

        moveTable(tableId, x, y) {
          mutate((event) =>
            withTable(event, tableId, (table) => {
              // RF-11: the action owns the clamp, so no @dnd-kit/modifiers dependency.
              const position = clampToCanvas(x, y, table.capacity);
              return position.x === table.x && position.y === table.y
                ? table
                : { ...table, x: position.x, y: position.y };
            }),
          );
        },

        clearTable(tableId) {
          mutate((event) =>
            withTable(event, tableId, (table) =>
              isEmptyTable(table) ? table : { ...table, seats: table.seats.map(() => null) },
            ),
          );
        },

        clearAllTables() {
          mutate((event) => {
            if (event.tables.every(isEmptyTable)) return event;
            return {
              ...event,
              tables: event.tables.map((table) =>
                isEmptyTable(table) ? table : { ...table, seats: table.seats.map(() => null) },
              ),
            };
          });
        },

        addGuests(text) {
          mutate((event) => {
            // RF-14: one guest per non-empty line, trimmed, duplicate names allowed.
            const names = text
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter((line) => line.length > 0);
            if (names.length === 0) return event;
            const created: Guest[] = names.map((name) => ({ id: newId(), name }));
            return { ...event, guests: [...event.guests, ...created] };
          });
        },

        addGuest(name) {
          const event = get().event;
          const trimmed = name.trim();
          if (!event || !trimmed) return null; // RF-16: a blank name creates nothing.
          const guest: Guest = { id: newId(), name: trimmed };
          set({ event: { ...event, guests: [...event.guests, guest] } });
          return guest.id;
        },

        removeGuest(guestId) {
          mutate((event) => {
            const guests = event.guests.filter((guest) => guest.id !== guestId);
            if (guests.length === event.guests.length) return event;
            // RF-17: deleting a seated guest also frees the seat.
            return { ...withGuestUnseated(event, guestId), guests };
          });
        },

        seatGuest(guestId, tableId, seatIndex) {
          const event = get().event;
          if (!event) return false;

          const table = event.tables.find((candidate) => candidate.id === tableId);
          const guest = event.guests.find((candidate) => candidate.id === guestId);
          if (!table || !guest) return false;

          // RF-21: without an explicit index, take the first free seat in ascending order.
          // `findIndex` returns -1 on a full table, which the range check rejects below.
          const index =
            seatIndex === undefined ? table.seats.findIndex((seat) => seat === null) : seatIndex;
          if (!Number.isInteger(index) || index < 0 || index >= table.capacity) return false;

          const occupant = index < table.seats.length ? table.seats[index] : null;
          if (occupant === guestId) return true; // already on the requested seat: nothing to change.
          if (occupant !== null) return false; // RF-22: an occupied seat rejects the drop.

          // RF-23: freeing the origin seat and taking the new one is a single update,
          // so a reseat can never duplicate the guest.
          set({
            event: withTable(withGuestUnseated(event, guestId), tableId, (target) => {
              const seats = target.seats.slice();
              seats[index] = guestId;
              return { ...target, seats };
            }),
          });
          return true;
        },

        unseatGuest(guestId) {
          mutate((event) => withGuestUnseated(event, guestId));
        },

        autoSeat() {
          const event = get().event;
          if (!event) return { seated: 0, leftover: 0 };

          const taken = new Set<string>();
          for (const table of event.tables) {
            for (const seat of table.seats) if (seat !== null) taken.add(seat);
          }
          // RF-26: full insertion order, ignoring any active sidebar search filter.
          const queue = event.guests.filter((guest) => !taken.has(guest.id));
          if (queue.length === 0) return { seated: 0, leftover: 0 };

          let cursor = 0;
          const tables = event.tables.map((table) => {
            if (cursor >= queue.length || !table.seats.includes(null)) return table;
            const seats = table.seats.slice();
            for (let index = 0; index < seats.length && cursor < queue.length; index += 1) {
              if (seats[index] !== null) continue;
              seats[index] = queue[cursor].id;
              cursor += 1;
            }
            return { ...table, seats };
          });

          if (cursor > 0) set({ event: { ...event, tables } });
          return { seated: cursor, leftover: queue.length - cursor };
        },
      };

      return store;
    },
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      partialize: (state): PersistedEventState => ({ event: state.event }),
      // RF-27: any other version is discarded in favour of an empty state instead of
      // being loaded partially or allowed to crash the editor.
      migrate: (persisted, version): PersistedEventState =>
        version === PERSIST_VERSION ? (persisted as PersistedEventState) : { event: null },
    },
  ),
);

/** Convenience selector: `useEventStore(selectEvent)`. */
export const selectEvent = (state: EventState): Event | null => state.event;
