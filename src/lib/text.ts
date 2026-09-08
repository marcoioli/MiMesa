/** Frozen (Phase 0). Accent-insensitive matching (RF-18, RF-31) and file-name slugs (RF-35). */

/** Combining diacritics, stripped after an NFD decomposition. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** `'  Jose '` (with an accent) -> `'jose'`. Used for search matching, never for display. */
export function normalize(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
}

/** `'Casamiento Ana y Juan'` -> `'casamiento-ana-y-juan'`; empty results fall back to `'evento'`. */
export function slugify(s: string): string {
  return (
    normalize(s)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'evento'
  );
}
