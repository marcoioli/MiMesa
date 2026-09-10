import { useSyncExternalStore } from 'react';

/**
 * Below this width the editor switches to its touch layout (RF-42): the guest
 * panel becomes a bottom sheet and drag and drop is turned off in favour of the
 * tap paths that already exist (RF-24, RF-25).
 *
 * It matches Tailwind's `md` breakpoint, so the CSS `max-md:` variants used in
 * the layout and this hook always agree on which mode is active.
 */
export const COMPACT_QUERY = '(max-width: 767px)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Whether the viewport is in the touch layout. Read in JavaScript, not only in
 * CSS, because the drag sensors and the initial zoom have to be decided in code:
 * a media query cannot disable a `useDraggable`.
 */
export function useIsCompact(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
}
