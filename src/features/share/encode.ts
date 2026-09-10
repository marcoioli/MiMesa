import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { SharePayload } from '../../store/types';

export function buildShareUrl(payload: SharePayload, origin?: string): string {
  const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
  // NEVER encodeURIComponent(encoded): lz-string's URI-safe alphabet contains '+' and '$',
  // both legal in a fragment. Escaping them, or routing through URLSearchParams, breaks decompression.
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/invitado#${encoded}`;
}

export function readSharePayload(hash: string): SharePayload | null {
  const hashIndex = hash.indexOf('#');
  const raw = hashIndex !== -1 ? hash.slice(hashIndex + 1) : hash; // NEVER decodeURIComponent
  if (!raw || raw.length > 100_000) return null; // untrusted input cap
  try {
    const json = decompressFromEncodedURIComponent(raw);
    if (!json) return null;
    const data = JSON.parse(json) as unknown;
    if (
      data &&
      typeof data === 'object' &&
      'v' in data &&
      (data as { v: unknown }).v === 1 &&
      't' in data &&
      Array.isArray((data as { t: unknown }).t)
    ) {
      return data as SharePayload;
    }
    return null;
  } catch {
    return null;
  }
}

