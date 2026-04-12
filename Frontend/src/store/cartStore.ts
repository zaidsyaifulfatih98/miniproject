import { create } from "zustand";

export interface Voucher {
  id: string;
  name: string;
  promotion_code: string;
  discount_amount: number;
  type: "VOUCHER" | "FLASH_SALE" | "BUNDLE" | "LAINNYA";
  max_usage: number | null;
  used_count: number | null;
  expires_at: string | null;
}

export interface CartItem {
  event_id: string;
  ticket_id: string;
  quantity: number;
  price: number;
}

interface CartStore {
  // Cart State
  cartItems: CartItem[];
  appliedVoucher: Voucher | null;

  // Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (ticket_id: string) => void;
  updateQuantity: (ticket_id: string, quantity: number) => void;
  clearCart: () => void;

  // Voucher Actions
  applyVoucher: (voucher: Voucher) => void;
  removeVoucher: () => void;

  // Getters
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartItems: [],
  appliedVoucher: null,

  addToCart: (item) =>
    set((state) => {
      const existing = state.cartItems.find((i) => i.ticket_id === item.ticket_id);
      if (existing) {
        return {
          cartItems: state.cartItems.map((i) =>
            i.ticket_id === item.ticket_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { cartItems: [...state.cartItems, item] };
    }),

  removeFromCart: (ticket_id) =>
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.ticket_id !== ticket_id),
    })),

  updateQuantity: (ticket_id, quantity) =>
    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.ticket_id === ticket_id ? { ...i, quantity: Math.max(1, quantity) } : i
      ),
    })),

  clearCart: () => set({ cartItems: [], appliedVoucher: null }),

  applyVoucher: (voucher) => set({ appliedVoucher: voucher }),

  removeVoucher: () => set({ appliedVoucher: null }),

  getSubtotal: () => {
    const state = get();
    return state.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getDiscountAmount: () => {
    const state = get();
    if (!state.appliedVoucher) return 0;

    const subtotal = state.getSubtotal();
    const { discount_amount, type } = state.appliedVoucher;

    if (type === "VOUCHER") {
      // Assume VOUCHER type is percentage
      return (subtotal * discount_amount) / 100;
    } else {
      // Fixed amount
      return Math.min(discount_amount, subtotal);
    }
  },

  getFinalTotal: () => {
    const state = get();
    return Math.max(0, state.getSubtotal() - state.getDiscountAmount());
  },
}));
