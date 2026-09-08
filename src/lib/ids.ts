/** Frozen (Phase 0). Collision-free client-side ids for guests and tables (RF-14, RF-16). */

let counter = 0;

/**
 * Returns a unique id. Uses `crypto.randomUUID()` when the browser exposes it
 * (secure contexts only) and otherwise falls back to a timestamp plus an
 * in-page counter, which is enough because ids never leave the browser tab.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  counter += 1;
  return `id-${Date.now().toString(36)}-${counter.toString(36)}`;
}
