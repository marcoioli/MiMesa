import { useDraggable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

import type { GuestDragData } from '../../lib/dnd';
import { guestDragId } from '../../lib/dnd';

import { useIsCompact } from '../useIsCompact';

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
  // RF-42: on a phone the guest is assigned by tapping a seat (RF-24, RF-25), so
  // dragging is off. That also drops `touch-action: none`, which otherwise sits on
  // every card in the list and stops the list from scrolling under a finger.
  const isCompact = useIsCompact();

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: guestDragId(guestId),
    data: { type: 'guest', guestId, from } satisfies GuestDragData,
    disabled: isCompact,
  });

  if (isCompact) return <div className={className}>{children}</div>;

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
