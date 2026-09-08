import type { Event, Guest, Table } from './types';

/**
 * Pure derivations over the event model. Nothing here reads the store, so the guest
 * view (which must never import `useEventStore`) can reuse the seat-name helper.
 * Every selector accepts `null` and degrades to an empty result, so callers rendered
 * before an event exists need no extra guard.
 *
 * `TableView` declares its own structurally identical `OccupancyTone`; the alias below
 * is duplicated on purpose so the store never imports from a feature module.
 */
export type OccupancyTone = 'empty' | 'partial' | 'full';

export type Occupancy = { seated: number; capacity: number; tone: OccupancyTone };

export type Counters = { total: number; seated: number; unseated: number; freeSeats: number };

/** Ids of every guest occupying a seat at any table. */
export function seatedGuestIds(event: Event | null): Set<string> {
  const ids = new Set<string>();
  if (!event) return ids;
  for (const table of event.tables) {
    for (const seat of table.seats) {
      if (seat !== null) ids.add(seat);
    }
  }
  return ids;
}

/** Guests occupying no seat, in `guests` insertion order (RF-15 sidebar, RF-26 auto-seat order). */
export function unseatedGuests(event: Event | null): Guest[] {
  if (!event) return [];
  const seated = seatedGuestIds(event);
  return event.guests.filter((guest) => !seated.has(guest.id));
}

export function guestNamesById(event: Event | null): Map<string, string> {
  const names = new Map<string, string>();
  if (!event) return names;
  for (const guest of event.guests) names.set(guest.id, guest.name);
  return names;
}

/** The `seatNames` prop of `TableView`: guest name per seat, `null` for an empty seat. */
export function seatNamesOf(event: Event | null, table: Table): (string | null)[] {
  const names = guestNamesById(event);
  return table.seats.map((seat) => (seat === null ? null : names.get(seat) ?? null));
}

/** Occupancy of one table plus its RF-10 colour tone. */
export function occupancyOf(table: Table): Occupancy {
  let seated = 0;
  for (const seat of table.seats) {
    if (seat !== null) seated += 1;
  }
  const capacity = table.capacity;
  const tone: OccupancyTone = seated === 0 ? 'empty' : seated >= capacity ? 'full' : 'partial';
  return { seated, capacity, tone };
}

/**
 * The four RF-19 topbar counters. `freeSeats` is the sum of every table capacity minus
 * the seated guests, so lowering a capacity without displacing anyone lowers it too.
 */
export function counters(event: Event | null): Counters {
  if (!event) return { total: 0, seated: 0, unseated: 0, freeSeats: 0 };
  const seatedIds = seatedGuestIds(event);
  const total = event.guests.length;
  const seated = event.guests.reduce(
    (count, guest) => (seatedIds.has(guest.id) ? count + 1 : count),
    0,
  );
  const capacity = event.tables.reduce((sum, table) => sum + table.capacity, 0);
  return { total, seated, unseated: total - seated, freeSeats: capacity - seated };
}
