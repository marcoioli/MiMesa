import EventTopbar from '../features/event/Topbar';
import GuestSidebar from '../features/guests/GuestSidebar';
import CanvasArea from '../features/tables/CanvasArea';
import DndProvider from '../features/tables/DndProvider';

import { ToastHost } from './Toast';

/**
 * Editor shell: one 56px topbar over a [300px sidebar | flexible canvas] row.
 * The single DndContext (DndProvider, track B) spans both columns so a guest
 * chip can travel from the sidebar to a seat on the canvas.
 *
 * RF-42: below Tailwind's `md` the sidebar takes itself out of the flow and
 * becomes a bottom sheet, leaving the canvas the full width, and drag and drop
 * is off in favour of the tap paths. The height is `dvh`, not `vh`, so the
 * editor does not run underneath a phone's address bar.
 */
export default function AppLayout() {
  return (
    <DndProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-ground text-ink">
        <EventTopbar />
        <div className="flex min-h-0 flex-1">
          <GuestSidebar />
          <CanvasArea />
        </div>
        <ToastHost />
      </div>
    </DndProvider>
  );
}
