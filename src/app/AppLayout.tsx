import EventTopbar from '../features/event/Topbar';
import GuestSidebar from '../features/guests/GuestSidebar';
import CanvasArea from '../features/tables/CanvasArea';
import DndProvider from '../features/tables/DndProvider';

import { ToastHost } from './Toast';

/**
 * Editor shell: one 56px topbar over a [300px sidebar | flexible canvas] row.
 * The single DndContext (DndProvider, track B) spans both columns so a guest
 * chip can travel from the sidebar to a seat on the canvas.
 */
export default function AppLayout() {
  return (
    <DndProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-ground text-ink">
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
