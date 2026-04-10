import React from 'react';

export interface PaymentMethodConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const CashIcon = () => (
  <svg
    className="w-8 h-8 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const CardIcon = () => (
  <svg
    className="w-8 h-8 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const MobileMoneyIcon = () => (
  <svg
    className="w-8 h-8 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const BankTransferIcon = () => (
  <svg
    className="w-8 h-8 mb-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

/**
 * Payment methods configuration for Sierra Leone
 * Includes all six supported payment methods with appropriate icons and descriptions
 */
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'cash',
    label: 'Cash',
    icon: <CashIcon />,
    description: 'Pay with Sierra Leonean Leones',
  },
  {
    id: 'card',
    label: 'Card',
    icon: <CardIcon />,
    description: 'Debit or credit card payment',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    icon: <MobileMoneyIcon />,
    description: 'Mobile money via Orange Sierra Leone',
  },
  {
    id: 'africell_money',
    label: 'Africell Money',
    icon: <MobileMoneyIcon />,
    description: 'Mobile money via Africell Sierra Leone',
  },
  {
    id: 'qmoney',
    label: 'QMoney',
    icon: <MobileMoneyIcon />,
    description: 'Mobile money via Qcell Sierra Leone',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    icon: <BankTransferIcon />,
    description: 'Electronic bank transfer',
  },
];

/**
 * Get payment method configuration by ID
 */
export const getPaymentMethodById = (id: string): PaymentMethodConfig | undefined => {
  return PAYMENT_METHODS.find((method) => method.id === id);
};

/**
 * Get payment method label by ID
 */
export const getPaymentMethodLabel = (id: string): string => {
  const method = getPaymentMethodById(id);
  return method?.label || id;
};

/**
 * Check if a payment method is a mobile money provider
 */
export const isMobileMoneyMethod = (id: string): boolean => {
  return ['orange_money', 'africell_money', 'qmoney'].includes(id);
};
