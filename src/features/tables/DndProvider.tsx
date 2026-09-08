import { DndContext } from '@dnd-kit/core';
import type { ReactNode } from 'react';

/** Placeholder owned by track B: the context exists, the handlers do not yet. */
export default function DndProvider({ children }: { children: ReactNode }) {
  return <DndContext>{children}</DndContext>;
}
