import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  eventId: string | null;
  sessionId: string;
  selectedCouponIds: string[];
  setEvent: (id: string) => void;
  toggleCoupon: (id: string) => void;
  /** Remove do carrinho tudo que não estiver na lista de reservas válidas (verdade do servidor). */
  pruneCart: (validIds: string[]) => void;
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
      pruneCart: (validIds) => set((s) => {
        const valid = new Set(validIds);
        const pruned = s.selectedCouponIds.filter((id) => valid.has(id));
        return pruned.length === s.selectedCouponIds.length ? {} : { selectedCouponIds: pruned };
      }),
      clearCart: () => set({ selectedCouponIds: [] }),
    }),
    { name: 'catedral-cart' },
  ),
);
