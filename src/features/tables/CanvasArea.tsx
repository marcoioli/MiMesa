import { CANVAS_H, CANVAS_NODE_ID, CANVAS_W } from '../../lib/constants';
import { seatNamesOf } from '../../store/selectors';
import type { Table } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';

import TableView from './TableView';

/** Placeholder owned by track B: read-only tables, no drag targets yet. */
export default function CanvasArea() {
  const event = useEventStore((s) => s.event);
  const tables = event?.tables ?? [];
  const namesOf = (table: Table) => (event ? seatNamesOf(event, table) : []);

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
          <div key={table.id} className="absolute" style={{ left: table.x, top: table.y }}>
            <TableView name={table.name} capacity={table.capacity} seatNames={namesOf(table)} />
          </div>
        ))}
      </div>
    </main>
  );
}
