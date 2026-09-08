import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type PopoverAnchor = { x: number; y: number };

export type PopoverProps = {
  /** Viewport coordinates of the point the panel hangs from. */
  anchor: PopoverAnchor;
  onClose: () => void;
  width?: number;
  children: ReactNode;
  /** Accessible name of the panel; also used as its aria-label. */
  label?: string;
};

const MARGIN = 8;
const DEFAULT_WIDTH = 260;

/**
 * Flips the panel to the other side of the anchor when it would overflow, then
 * clamps it into the viewport so a table near the right or bottom edge still
 * shows a complete menu.
 */
function place(anchor: PopoverAnchor, width: number, height: number): { left: number; top: number } {
  const maxLeft = Math.max(MARGIN, window.innerWidth - width - MARGIN);
  const maxTop = Math.max(MARGIN, window.innerHeight - height - MARGIN);
  const left = anchor.x > maxLeft ? anchor.x - width : anchor.x;
  const top = anchor.y > maxTop ? anchor.y - height : anchor.y;
  return {
    left: Math.min(Math.max(MARGIN, left), maxLeft),
    top: Math.min(Math.max(MARGIN, top), maxTop),
  };
}

/**
 * Floating panel shared by the seat picker and the table/guest menus (DESIGN.md
 * "Popover"). It is portalled to `document.body` on purpose: seats and discs sit
 * inside transformed elements, and a transformed ancestor would become the
 * containing block of `position: fixed`, breaking viewport placement.
 * Carries `data-export-ignore` so an open menu never reaches the PNG (RF-35).
 */
export default function Popover({ anchor, onClose, width = DEFAULT_WIDTH, children, label }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(() => ({ left: anchor.x, top: anchor.y }));

  // No dependency array: the panel is remeasured after every render (the list
  // shrinks while searching). `setPosition` keeps the previous object when the
  // placement is unchanged, so this settles after at most one extra pass.
  useLayoutEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const next = place(anchor, rect.width, rect.height);
    setPosition((prev) => (prev.left === next.left && prev.top === next.top ? prev : next));
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const node = panelRef.current;
      if (node && event.target instanceof Node && !node.contains(event.target)) onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    // Deferred by one tick: the pointerdown that opened this popover may still be
    // propagating towards `document`, and would otherwise close it immediately.
    const timer = window.setTimeout(() => document.addEventListener('pointerdown', onPointerDown), 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      data-export-ignore="true"
      className="fixed z-40 flex flex-col overflow-hidden rounded-[10px] border border-line bg-panel shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_32px_-12px_rgba(20,28,45,.28)]"
      style={{ left: position.left, top: position.top, width }}
    >
      {children}
    </div>,
    document.body,
  );
}
