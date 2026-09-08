import { useState } from 'react';

import { CANVAS_H, CANVAS_NODE_ID, CANVAS_W, GRID_MARGIN } from '../../lib/constants';
import type { Table } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';

import AddTableDialog from './AddTableDialog';
import TableNode from './TableNode';

/** Stable empty reference: a fresh array in the selector would re-render forever. */
const NO_TABLES: Table[] = [];

/**
 * The plan (RF-05, RF-09): a scrolling viewport over a fixed 1600x1200 canvas
 * holding one `TableNode` per table on the 5x4 grid.
 */
export default function CanvasArea() {
  const tables = useEventStore((state) => state.event?.tables ?? NO_TABLES);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <main className="canvas-scroll relative min-w-0 flex-1 overflow-auto bg-ground">
      {/* CANVAS_NODE_ID belongs on this fixed inner node, never on the scroller:
          otherwise the PNG export captures only the visible viewport (RF-35). */}
      <div
        id={CANVAS_NODE_ID}
        className="absolute left-0 top-0"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          backgroundImage: 'radial-gradient(#d5dbe5 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '12px 12px',
        }}
      >
        {tables.map((table) => (
          <TableNode key={table.id} table={table} />
        ))}

        <button
          type="button"
          data-export-ignore="true"
          onClick={() => setAddOpen(true)}
          className="absolute flex h-[34px] items-center gap-2 rounded-lg border border-dashed border-line-2 bg-panel/70 px-3 font-semibold text-ink-2 transition-colors duration-150 hover:border-accent hover:text-accent"
          style={{ left: GRID_MARGIN, bottom: GRID_MARGIN }}
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
