import { create } from 'zustand';

export type SpotlightState = {
  /** Guest the canvas must bring into view and mark, or `null` when nothing is asked for. */
  guestId: string | null;
  /**
   * Bumped on every request. Asking for the same guest twice must fly the canvas
   * again, and a plain `guestId` change would not tell the canvas to repeat itself.
   */
  nonce: number;
  spotlight: (guestId: string) => void;
  clear: () => void;
};

/**
 * Which seated guest the canvas is currently pointing at (RF-40).
 *
 * A store of its own, next to `useToastStore` and for the same reason: the sidebar
 * asks and the canvas answers, they sit in different branches of the tree, and this
 * is transient UI state that must never reach `localStorage` (D12). It is deliberately
 * NOT part of `useEventStore`, whose 17 actions are a frozen contract.
 */
export const useSpotlightStore = create<SpotlightState>()((set) => ({
  guestId: null,
  nonce: 0,
  spotlight: (guestId) => set((state) => ({ guestId, nonce: state.nonce + 1 })),
  clear: () => set({ guestId: null }),
}));
