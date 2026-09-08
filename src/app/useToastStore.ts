import { create } from 'zustand';

export type ToastState = {
  message: string | null;
  toast: (message: string) => void;
  clear: () => void;
};

/** Transient UI state only: never persisted (D12). */
export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  toast: (message) => set({ message }),
  clear: () => set({ message: null }),
}));
