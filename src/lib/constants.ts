import type { TableTemplate } from '../store/types';

export const CANVAS_W = 1600;
export const CANVAS_H = 1200;

export const GRID_COLS = 5;
export const GRID_PITCH_X = 290;
export const GRID_PITCH_Y = 270;
export const GRID_MARGIN = 50;

export const MIN_CAPACITY = 2;
export const MAX_CAPACITY = 20;
export const MIN_TABLES = 1;
export const MAX_TABLES = 20;

/** Per-table visual size factor (RF-37). Capacity is untouched. */
export const MIN_TABLE_SCALE = 0.75;
export const MAX_TABLE_SCALE = 2;
export const TABLE_SCALE_STEP = 0.25;

/**
 * Canvas zoom (RF-36). UI state only, never persisted. The floor is low enough
 * for the whole 1600px canvas to fit a 360px phone (RF-42), which needs 0.225.
 */
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

/** Above this URL length the share dialog shows the copy button instead of a QR (qrcode.react throws past the byte-mode ceiling). */
export const QR_MAX_URL = 1200;

/** DOM id of the fixed 1600x1200 inner canvas node captured by the PNG export. */
export const CANVAS_NODE_ID = 'mimesa-canvas';
/** Elements carrying this attribute are excluded from the PNG export. */
export const EXPORT_IGNORE_ATTR = 'data-export-ignore';

export const PERSIST_KEY = 'mimesa-event';
export const PERSIST_VERSION = 1;

export const TEMPLATE_PRESETS: { id: string; label: string; template: TableTemplate }[] = [
  { id: '6x8', label: '6 mesas de 8', template: { count: 6, capacity: 8 } },
  { id: '10x10', label: '10 mesas de 10', template: { count: 10, capacity: 10 } },
  { id: '8x6', label: '8 mesas de 6', template: { count: 8, capacity: 6 } },
];
