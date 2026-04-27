import { create } from 'zustand';

export interface PackagingUnit {
  level: number;
  unit: string;
  quantityPerUnit: number;
  barcode?: string;
  sku?: string;
  isSellable: boolean;
  isDefault?: boolean;
  price?: number;
  useAutoPrice?: boolean;
  markupPercentage?: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  subtotal: number;
  requiresPrescription: boolean;
  packaging?: PackagingUnit[];
  selectedUnit?: PackagingUnit;
  defaultSellableLevel?: number;
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
  updateItemUnit: (productId: string, unit: string) => void;
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
    const existingItem = items.find(
      (i) => i.productId === item.productId &&
      (!item.selectedUnit || i.selectedUnit?.unit === item.selectedUnit?.unit)
    );

    // Find the default sellable unit
    const defaultUnit = item.selectedUnit || (
      item.packaging?.find((p) => p.isDefault && p.isSellable) ||
      item.packaging?.filter(p => p.isSellable).sort((a, b) => a.level - b.level)[0] ||
      item.packaging?.find((p) => p.level === 0)
    );

    if (existingItem) {
      set({
        items: items.map((i) =>
          i.productId === existingItem.productId && (!item.selectedUnit || i.selectedUnit?.unit === item.selectedUnit?.unit)
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                subtotal: (i.quantity + item.quantity) * i.unitPrice,
              }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            ...item,
            selectedUnit: defaultUnit,
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

  updateItemUnit: (productId, unit) => {
    const items = get().items;
    const item = items.find((i) => i.productId === productId);
    if (!item || !item.packaging) return;

    const packLevel = item.packaging.find((p) => p.unit === unit);
    if (!packLevel) return;

    const newUnitPrice = packLevel.quantityPerUnit * (item.unitPrice / (item.selectedUnit?.quantityPerUnit || 1));
    
    set({
      items: items.map((i) =>
        i.productId === productId
          ? {
              ...i,
              selectedUnit: packLevel,
              unit: packLevel.unit,
              unitPrice: newUnitPrice,
              subtotal: i.quantity * newUnitPrice,
            }
          : i
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
