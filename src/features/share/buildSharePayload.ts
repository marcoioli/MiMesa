import type { Event, SharePayload } from '../../store/types';
import { seatNamesOf } from '../../store/selectors';

/**
 * Builds the minimal SharePayload for the guest view.
 * Unseated guests are deliberately excluded; only guest names occupying seats are included.
 */
export function buildSharePayload(event: Event): SharePayload {
  return {
    v: 1,
    n: event.name,
    d: event.date,
    ...(event.place ? { p: event.place } : {}),
    t: event.tables.map((table) => ({
      n: table.name,
      s: seatNamesOf(event, table),
    })),
  };
}

