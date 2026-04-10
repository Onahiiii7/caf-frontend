import { create } from 'zustand';

export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  requiresPrescription: boolean;
}

interface CartState {
  items: CartItem[];
  discount: number;
  prescriptionUrl?: string;
  
  // Computed values
  subtotal: number;
  total: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'subtotal'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemPrice: (productId: string, unitPrice: number) => void;
  setDiscount: (discount: number) => void;
  setPrescription: (url: string) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  prescriptionUrl: undefined,
  subtotal: 0,
  total: 0,

  addItem: (item) => {
    const items = get().items;
    const existingItem = items.find((i) => i.productId === item.productId);

    if (existingItem) {
      // Update quantity if item already exists
      set({
        items: items.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                subtotal: (i.quantity + item.quantity) * i.unitPrice,
              }
            : i
        ),
      });
    } else {
      // Add new item
      set({
        items: [
          ...items,
          {
            ...item,
            subtotal: item.quantity * item.unitPrice,
          },
        ],
      });
    }
    get().calculateTotals();
  },

  removeItem: (productId) => {
    set({
      items: get().items.filter((item) => item.productId !== productId),
    });
    get().calculateTotals();
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      ),
    });
    get().calculateTotals();
  },

  updateItemPrice: (productId, unitPrice) => {
    set({
      items: get().items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              unitPrice,
              subtotal: item.quantity * unitPrice,
            }
          : item
      ),
    });
    get().calculateTotals();
  },

  setDiscount: (discount) => {
    set({ discount });
    get().calculateTotals();
  },

  setPrescription: (url) => {
    set({ prescriptionUrl: url });
  },

  clearCart: () => {
    set({
      items: [],
      discount: 0,
      prescriptionUrl: undefined,
      subtotal: 0,
      total: 0,
    });
  },

  calculateTotals: () => {
    const items = get().items;
    const discount = get().discount;
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = Math.max(0, subtotal - discount);
    
    set({ subtotal, total });
  },
}));
