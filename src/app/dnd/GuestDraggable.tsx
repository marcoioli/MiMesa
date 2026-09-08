import { useDraggable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

import type { GuestDragData } from '../../lib/dnd';
import { guestDragId } from '../../lib/dnd';

export type GuestDraggableProps = {
  guestId: string;
  /** null when the guest comes from the sidebar, the origin seat otherwise (RF-23). */
  from: GuestDragData['from'];
  children: ReactNode;
  className?: string;
};

/**
 * Shared draggable wrapper so track A (sidebar chips) and track B (seated
 * guests) emit the same GuestDragData without editing each other's files.
 */
export default function GuestDraggable({ guestId, from, children, className }: GuestDraggableProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: guestDragId(guestId),
    data: { type: 'guest', guestId, from } satisfies GuestDragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{ touchAction: 'none' }}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
