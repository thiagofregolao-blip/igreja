import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  eventId: string | null;
  sessionId: string;
  selectedCouponIds: string[];
  setEvent: (id: string) => void;
  toggleCoupon: (id: string) => void;
  clearCart: () => void;
}

function makeSessionId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      eventId: null,
      sessionId: makeSessionId(),
      selectedCouponIds: [],
      setEvent: (id) => set((s) => {
        if (s.eventId !== id) return { eventId: id, selectedCouponIds: [] };
        return {};
      }),
      toggleCoupon: (id) => set((s) => ({
        selectedCouponIds: s.selectedCouponIds.includes(id)
          ? s.selectedCouponIds.filter((x) => x !== id)
          : [...s.selectedCouponIds, id],
      })),
      clearCart: () => set({ selectedCouponIds: [] }),
    }),
    { name: 'catedral-cart' },
  ),
);
