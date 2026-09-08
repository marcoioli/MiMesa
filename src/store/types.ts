export type Guest = {
  id: string;
  name: string;
};

export type Table = {
  id: string;
  name: string;
  capacity: number;
  /** Top-left corner of the table box on the 1600x1200 canvas. */
  x: number;
  y: number;
  /** seats[i] = guest id or null. Always has length === capacity. */
  seats: (string | null)[];
};

export type Event = {
  name: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  place?: string;
  tables: Table[];
  guests: Guest[];
};

export type TableTemplate = {
  count: number;
  capacity: number;
};

/** Minimal payload compressed into the share link. Seats carry guest names, not ids. */
export type SharePayload = {
  v: 1;
  n: string;
  d: string;
  p?: string;
  t: { n: string; s: (string | null)[] }[];
};
