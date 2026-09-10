import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

import { useSpotlightStore } from '../../app/useSpotlightStore';
import {
  CANVAS_H,
  CANVAS_NODE_ID,
  CANVAS_W,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from '../../lib/constants';
import { tableBox } from '../../lib/geometry';
import type { Table } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';

import AddTableDialog from './AddTableDialog';
import { useDndFeedback } from './DndProvider';
import TableNode from './TableNode';

/** Stable empty reference: a fresh array in the selector would re-render forever. */
const NO_TABLES: Table[] = [];

/** Clamps a zoom value and drops float drift (1.1 + 0.1 = 1.2000000000000002). */
function clampZoom(value: number): number {
  return Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)) * 100) / 100;
}

/** How long the spotlighted seat keeps its mark before the canvas forgets it (RF-40). */
const SPOTLIGHT_MS = 2600;

const OVERLAY_GROUP =
  'flex h-[34px] items-center rounded-lg border border-line-2 bg-panel shadow-[0_2px_8px_rgba(28,34,48,.10)]';
const ZOOM_STEP_BTN =
  'flex h-full w-8 items-center justify-center text-ink-2 transition-colors duration-150 hover:text-accent disabled:opacity-50 disabled:hover:text-ink-2';

/**
 * The plan (RF-05, RF-09): a scrolling viewport over a fixed 1600x1200 canvas
 * holding one `TableNode` per table on the 5x4 grid.
 *
 * Three nested boxes carry RF-36: the scroller, a sizing box of `1600*zoom x
 * 1200*zoom` that gives the scrollbars something to measure, and the fixed
 * 1600x1200 export node scaled with `transform`. `CANVAS_NODE_ID` stays on that
 * inner node, so the PNG export keeps its 1600x1200 geometry at any zoom.
 * The bottom-right controls live outside the scroller (RF-06 placement, B.13),
 * so they never scroll away and never reach the export.
 */
export default function CanvasArea() {
  const tables = useEventStore((state) => state.event?.tables ?? NO_TABLES);
  const { setCanvasZoom } = useDndFeedback();
  const spotlightGuestId = useSpotlightStore((state) => state.guestId);
  const spotlightNonce = useSpotlightStore((state) => state.nonce);
  const clearSpotlight = useSpotlightStore((state) => state.clear);

  const [addOpen, setAddOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  // Mirrors `zoom` for the native wheel listener, which is registered once.
  const zoomRef = useRef(1);
  // Point to keep still while zooming: canvas coordinates plus its offset inside
  // the scroller viewport. Consumed after the new size has been laid out.
  const anchorRef = useRef<{ cx: number; cy: number; canvasX: number; canvasY: number } | null>(
    null,
  );

  // Zoom is UI state (D12): it is published to the drag context so a table drag
  // can divide the pointer delta by it, and never written to the store.
  useEffect(() => {
    zoomRef.current = zoom;
    setCanvasZoom(zoom);
  }, [zoom, setCanvasZoom]);

  // Runs after the sizing box has grown/shrunk, or the browser would clamp the
  // new scroll offset against the old `scrollWidth`.
  useLayoutEffect(() => {
    const node = scrollerRef.current;
    const anchor = anchorRef.current;
    if (!node || !anchor) return;
    anchorRef.current = null;
    node.scrollLeft = anchor.canvasX * zoom - anchor.cx;
    node.scrollTop = anchor.canvasY * zoom - anchor.cy;
  }, [zoom]);

  // Ctrl + wheel (RF-36). React's `onWheel` is passive, so `preventDefault` needs
  // a native listener registered with `passive: false` or the browser zooms the page.
  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    const handleWheel = (wheel: WheelEvent) => {
      if (!wheel.ctrlKey) return;
      wheel.preventDefault();
      const current = zoomRef.current;
      const next = clampZoom(current + (wheel.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
      if (next === current) return;

      const rect = node.getBoundingClientRect();
      const cx = wheel.clientX - rect.left;
      const cy = wheel.clientY - rect.top;
      anchorRef.current = {
        cx,
        cy,
        canvasX: (cx + node.scrollLeft) / current,
        canvasY: (cy + node.scrollTop) / current,
      };
      setZoom(next);
    };

    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleWheel);
  }, []);

  // RF-40: the sidebar asks for a seated guest, the canvas brings their table to the
  // middle of the viewport. Keyed on `nonce`, not on `guestId`, so choosing the same
  // guest again flies there again. Runs after layout so `clientWidth` is the real one.
  useEffect(() => {
    if (spotlightGuestId === null) return;
    const node = scrollerRef.current;
    // Read through `getState()` rather than the rendered `tables`: the flight must
    // start on the nonce alone, and closing over `tables` would either re-fly on
    // every seat change or need a suppressed dependency.
    const target = useEventStore
      .getState()
      .event?.tables.find((table) => table.seats.includes(spotlightGuestId));
    if (!node || !target) {
      clearSpotlight();
      return;
    }
    const half = (tableBox(target.capacity) * (target.scale ?? 1)) / 2;
    node.scrollTo({
      left: (target.x + half) * zoomRef.current - node.clientWidth / 2,
      top: (target.y + half) * zoomRef.current - node.clientHeight / 2,
      behavior: 'smooth',
    });
    const timer = window.setTimeout(clearSpotlight, SPOTLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [spotlightNonce, spotlightGuestId, clearSpotlight]);

  // RF-37: Escape deselects. Bound only while something is selected.
  useEffect(() => {
    if (selectedTableId === null) return;
    const handleKeyDown = (key: KeyboardEvent) => {
      if (key.key === 'Escape') setSelectedTableId(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTableId]);

  const handleSelect = useCallback((tableId: string | null) => setSelectedTableId(tableId), []);

  /** RF-37: only a click that landed on the empty canvas itself deselects. */
  const handleBackgroundClick = (mouse: MouseEvent<HTMLDivElement>) => {
    if (mouse.target === mouse.currentTarget) setSelectedTableId(null);
  };

  const stepZoom = (delta: number) => setZoom((current) => clampZoom(current + delta));

  return (
    <main className="relative min-w-0 flex-1 overflow-hidden bg-ground">
      <div ref={scrollerRef} className="canvas-scroll h-full w-full overflow-auto">
        {/* Sizing box: the scaled canvas has no layout size of its own. */}
        <div
          className="relative"
          style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}
          onClick={handleBackgroundClick}
        >
          {/* CANVAS_NODE_ID belongs on this fixed inner node, never on the scroller:
              otherwise the PNG export captures only the visible viewport (RF-35). */}
          <div
            id={CANVAS_NODE_ID}
            className="absolute left-0 top-0"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              backgroundImage: 'radial-gradient(#d5dbe5 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '12px 12px',
            }}
            onClick={handleBackgroundClick}
          >
            {tables.map((table) => (
              <TableNode
                key={table.id}
                table={table}
                selected={table.id === selectedTableId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Outside the scroller and outside the export node: always visible, never captured. */}
      <div
        data-export-ignore="true"
        className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2"
      >
        <div className={`${OVERLAY_GROUP} pointer-events-auto`}>
          <button
            type="button"
            aria-label="Alejar"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => stepZoom(-ZOOM_STEP)}
            className={ZOOM_STEP_BTN}
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
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="h-full w-[62px] text-center font-semibold tabular-nums text-ink-2 transition-colors duration-150 hover:text-accent"
          >
            {Math.round(zoom * 100)} %
          </button>
          <button
            type="button"
            aria-label="Acercar"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => stepZoom(ZOOM_STEP)}
            className={ZOOM_STEP_BTN}
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
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className={`${OVERLAY_GROUP} pointer-events-auto gap-2 px-3 font-semibold text-ink-2 transition-colors duration-150 hover:border-accent hover:text-accent`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Agregar mesa
        </button>
      </div>

      <AddTableDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </main>
  );
}
