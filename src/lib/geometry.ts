/**
 * Frozen (Phase 0). Seat and table geometry (RF-05, RF-09, RF-11).
 *
 * Seats are absolutely positioned DOM nodes straddling the disc edge, so every
 * seat is a real drop target and `html-to-image` can capture it.
 */
import {
  CANVAS_H,
  CANVAS_W,
  GRID_COLS,
  GRID_MARGIN,
  GRID_PITCH_X,
  GRID_PITCH_Y,
} from './constants';

/** Seat diameter in pixels. */
export const SEAT = 28;

export type Point = { x: number; y: number };

/** Radius of the circle the seat centres sit on. 46 up to capacity 8, 58 at 10, 115 at 20. */
export function seatRadius(capacity: number): number {
  return Math.max(46, Math.ceil((36 * capacity) / (2 * Math.PI)));
}

/** Radius of the visible disc; seats straddle its edge. */
export function tableRadius(capacity: number): number {
  return seatRadius(capacity) - SEAT / 2;
}

/** Side of the square box that contains disc plus seats. 120 at capacity 8, 258 at capacity 20. */
export function tableBox(capacity: number): number {
  return 2 * (seatRadius(capacity) + SEAT / 2);
}

/** Angle of seat `index`, with seat 0 at 12 o'clock and increasing clockwise. */
export function seatAngle(index: number, capacity: number): number {
  return -Math.PI / 2 + (2 * Math.PI * index) / capacity;
}

/** Offset of a seat centre from the centre of the table box. */
export function seatOffset(index: number, capacity: number): Point {
  const angle = seatAngle(index, capacity);
  const radius = seatRadius(capacity);
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

/** Offsets of every seat centre, in seat order. */
export function seatPositions(capacity: number): Point[] {
  return Array.from({ length: capacity }, (_, index) => seatOffset(index, capacity));
}

/** Default position of the table at `index` on the 5 x 4 grid (20 slots, MAX_TABLES). */
export function gridLayout(index: number): Point {
  return {
    x: GRID_MARGIN + (index % GRID_COLS) * GRID_PITCH_X,
    y: GRID_MARGIN + Math.floor(index / GRID_COLS) * GRID_PITCH_Y,
  };
}

/** Keeps the whole table box inside the fixed canvas. */
export function clampToCanvas(x: number, y: number, capacity: number): Point {
  const box = tableBox(capacity);
  return {
    x: Math.min(Math.max(0, x), CANVAS_W - box),
    y: Math.min(Math.max(0, y), CANVAS_H - box),
  };
}
