import { describe, it, expect, beforeEach } from 'vitest';
import { offlineDb, type QueuedSale, type PaymentMethod } from './offline-db';

describe('Offline Database - Payment Methods', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await offlineDb.queuedSales.clear();
  });

  it('should store and retrieve sales with all payment methods', async () => {
    const paymentMethods: PaymentMethod[] = [
      'cash',
      'card',
      'orange_money',
      'africell_money',
      'qmoney',
      'bank_transfer',
    ];

    // Add a sale for each payment method
    for (const method of paymentMethods) {
      const sale: Omit<QueuedSale, 'id'> = {
        branchId: 'branch-1',
        shiftId: 'shift-1',
        terminalId: 'terminal-1',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            unitPrice: 10.5,
          },
        ],
        discount: 0,
        paymentMethod: method,
        timestamp: Date.now(),
        retryCount: 0,
      };

      await offlineDb.queuedSales.add(sale);
    }

    // Retrieve all sales
    const allSales = await offlineDb.queuedSales.toArray();
    expect(allSales).toHaveLength(6);

    // Verify each payment method is stored correctly
    for (const method of paymentMethods) {
      const sale = allSales.find((s) => s.paymentMethod === method);
      expect(sale).toBeDefined();
      expect(sale?.paymentMethod).toBe(method);
    }
  });

  it('should store and retrieve mobile money payment references', async () => {
    const mobileMoneyMethods: PaymentMethod[] = [
      'orange_money',
      'africell_money',
      'qmoney',
    ];

    // Add sales with payment references
    for (const method of mobileMoneyMethods) {
      const sale: Omit<QueuedSale, 'id'> = {
        branchId: 'branch-1',
        shiftId: 'shift-1',
        terminalId: 'terminal-1',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            unitPrice: 50.0,
          },
        ],
        discount: 0,
        paymentMethod: method,
        paymentReference: `REF-${method.toUpperCase()}-12345`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      await offlineDb.queuedSales.add(sale);
    }

    // Retrieve all sales
    const allSales = await offlineDb.queuedSales.toArray();
    expect(allSales).toHaveLength(3);

    // Verify payment references are stored correctly
    for (const method of mobileMoneyMethods) {
      const sale = allSales.find((s) => s.paymentMethod === method);
      expect(sale).toBeDefined();
      expect(sale?.paymentReference).toBe(`REF-${method.toUpperCase()}-12345`);
    }
  });

  it('should allow optional payment reference for mobile money', async () => {
    const sale: Omit<QueuedSale, 'id'> = {
      branchId: 'branch-1',
      shiftId: 'shift-1',
      terminalId: 'terminal-1',
      items: [
        {
          productId: 'product-1',
          quantity: 1,
          unitPrice: 25.0,
        },
      ],
      discount: 0,
      paymentMethod: 'orange_money',
      // No paymentReference provided
      timestamp: Date.now(),
      retryCount: 0,
    };

    const id = await offlineDb.queuedSales.add(sale);
    const retrieved = await offlineDb.queuedSales.get(id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.paymentMethod).toBe('orange_money');
    expect(retrieved?.paymentReference).toBeUndefined();
  });

  it('should not require payment reference for non-mobile money methods', async () => {
    const nonMobileMoneyMethods: PaymentMethod[] = ['cash', 'card', 'bank_transfer'];

    for (const method of nonMobileMoneyMethods) {
      const sale: Omit<QueuedSale, 'id'> = {
        branchId: 'branch-1',
        shiftId: 'shift-1',
        terminalId: 'terminal-1',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            unitPrice: 15.0,
          },
        ],
        discount: 0,
        paymentMethod: method,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const id = await offlineDb.queuedSales.add(sale);
      const retrieved = await offlineDb.queuedSales.get(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.paymentMethod).toBe(method);
      expect(retrieved?.paymentReference).toBeUndefined();
    }
  });

  it('should distinguish between different mobile money providers', async () => {
    const providers: PaymentMethod[] = ['orange_money', 'africell_money', 'qmoney'];

    for (const provider of providers) {
      const sale: Omit<QueuedSale, 'id'> = {
        branchId: 'branch-1',
        shiftId: 'shift-1',
        terminalId: 'terminal-1',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            unitPrice: 30.0,
          },
        ],
        discount: 0,
        paymentMethod: provider,
        paymentReference: `${provider}-ref-123`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      await offlineDb.queuedSales.add(sale);
    }

    const allSales = await offlineDb.queuedSales.toArray();
    expect(allSales).toHaveLength(3);

    // Verify each provider is distinct
    const orangeSale = allSales.find((s) => s.paymentMethod === 'orange_money');
    const africellSale = allSales.find((s) => s.paymentMethod === 'africell_money');
    const qmoneySale = allSales.find((s) => s.paymentMethod === 'qmoney');

    expect(orangeSale?.paymentMethod).not.toBe(africellSale?.paymentMethod);
    expect(africellSale?.paymentMethod).not.toBe(qmoneySale?.paymentMethod);
    expect(orangeSale?.paymentMethod).not.toBe(qmoneySale?.paymentMethod);
  });
});
