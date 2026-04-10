import Dexie, { type Table } from 'dexie';

/**
 * Payment method types supported in Sierra Leone
 */
export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'orange_money' 
  | 'africell_money' 
  | 'qmoney' 
  | 'bank_transfer';

export interface QueuedSale {
  id?: number;
  branchId: string;
  shiftId: string;
  terminalId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  discount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string; // Optional mobile money transaction reference
  prescriptionUrl?: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export class OfflineDatabase extends Dexie {
  queuedSales!: Table<QueuedSale, number>;

  constructor() {
    super('PharmacyPOSOffline');
    
    // Version 1: Initial schema
    this.version(1).stores({
      queuedSales: '++id, timestamp, branchId, shiftId',
    });
    
    // Version 2: Add support for new payment methods and payment reference
    // Note: Dexie handles schema upgrades automatically, no migration needed
    // as we're only adding optional fields and expanding the type definition
    this.version(2).stores({
      queuedSales: '++id, timestamp, branchId, shiftId, paymentMethod',
    });
  }
}

export const offlineDb = new OfflineDatabase();
