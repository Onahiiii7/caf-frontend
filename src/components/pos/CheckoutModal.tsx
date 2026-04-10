import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCartStore } from '../../stores/cart-store';
import { useAlertReplacement } from '../../hooks/useAlertReplacement';
import apiClient from '../../lib/api-client';
import { PAYMENT_METHODS, isMobileMoneyMethod } from '../../config/payment-methods';
import { CURRENCY } from '../../lib/currency';
import { getErrorMessage } from '../../lib/error-utils';

interface SaleData {
  _id: string;
  total: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  paymentMethod: string;
  createdAt: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saleData: SaleData) => void;
  branchId: string;
  shiftId: string;
  terminalId: string;
}

type PaymentMethod = 'cash' | 'card' | 'orange_money' | 'africell_money' | 'qmoney' | 'bank_transfer';

export const CheckoutModal = ({
  isOpen,
  onClose,
  onSuccess,
  branchId,
  shiftId,
  terminalId,
}: CheckoutModalProps) => {
  const { items, subtotal, discount, total, setDiscount, prescriptionUrl, setPrescription } =
    useCartStore();
  const { alertError, alertWarning } = useAlertReplacement();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [discountInput, setDiscountInput] = useState(discount.toString());
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(
    prescriptionUrl || null
  );

  const requiresPrescription = items.some((item) => item.requiresPrescription);
  const isMobileMoney = isMobileMoneyMethod(paymentMethod);

  interface CheckoutData {
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    discount: number;
    branchId: string;
    shiftId: string;
    terminalId: string;
    prescriptionUrl?: string;
  }

  // Process checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutData) => {
      const response = await apiClient.post('/sales/checkout', data);
      return response.data;
    },
    onSuccess: (data) => {
      onSuccess(data);
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Checkout failed:', error);
      alertError(getErrorMessage(error, 'Checkout failed. Please try again.'));
    },
  });

  const handleDiscountChange = (value: string) => {
    setDiscountInput(value);
    const discountValue = parseFloat(value) || 0;
    setDiscount(Math.max(0, Math.min(discountValue, subtotal)));
  };

  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = async () => {
    // Validate prescription if required
    if (requiresPrescription && !prescriptionPreview) {
      alertWarning('Please upload a prescription for controlled items');
      return;
    }

    // Upload prescription if provided
    let uploadedPrescriptionUrl = prescriptionUrl;
    if (prescriptionFile) {
      try {
        const formData = new FormData();
        formData.append('prescription', prescriptionFile);

        const uploadResponse = await apiClient.post(
          '/prescriptions/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        uploadedPrescriptionUrl = uploadResponse.data.url;
        if (uploadedPrescriptionUrl) {
          setPrescription(uploadedPrescriptionUrl);
        }
      } catch {
        alertError('Failed to upload prescription. Please try again.');
        return;
      }
    }

    // Prepare checkout data
    const checkoutData = {
      branchId,
      shiftId,
      terminalId,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discount,
      paymentMethod,
      paymentReference: paymentReference.trim() || undefined, // Optional mobile money reference
      prescriptionUrl: uploadedPrescriptionUrl,
    };

    checkoutMutation.mutate(checkoutData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Checkout" size="lg">
      <div className="space-y-6">
        {/* Order Summary */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
          <div className="bg-[--color-primary-darker] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Items ({items.length}):</span>
              <span className="text-white">{CURRENCY.format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Discount:</span>
              <span className="text-red-400">-{CURRENCY.format(discount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
              <span className="text-white">Total:</span>
              <span className="text-[--color-accent-green]">{CURRENCY.format(total)}</span>
            </div>
          </div>
        </div>

        {/* Discount Input */}
        <div>
          <Input
            type="number"
            label="Discount Amount"
            placeholder="Le 0.00"
            value={discountInput}
            onChange={(e) => handleDiscountChange(e.target.value)}
            min="0"
            max={subtotal}
            step="0.01"
          />
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(method.id as PaymentMethod);
                  // Clear payment reference when switching payment methods
                  if (!isMobileMoneyMethod(method.id)) {
                    setPaymentReference('');
                  }
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === method.id
                    ? 'border-[--color-accent-green] bg-[--color-accent-green] bg-opacity-20'
                    : 'border-gray-600 bg-[--color-primary-darker] hover:border-gray-500'
                }`}
                title={method.description}
              >
                <div className="flex flex-col items-center">
                  {method.icon}
                  <span className="text-white font-medium text-sm">{method.label}</span>
                  {method.description && (
                    <span className="text-gray-400 text-xs mt-1 text-center">
                      {method.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Money Payment Reference (Optional) */}
        {isMobileMoney && (
          <div>
            <Input
              type="text"
              label="Payment Reference (Optional)"
              placeholder="Enter transaction ID or reference number"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              helperText="Optional: Enter the mobile money transaction reference for record keeping"
            />
          </div>
        )}

        {/* Prescription Upload */}
        {requiresPrescription && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Prescription <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handlePrescriptionUpload}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-[--color-accent-green] file:text-[--color-primary-dark]
                  hover:file:bg-[--color-accent-light]
                  file:cursor-pointer cursor-pointer"
              />
              {prescriptionPreview && (
                <div className="relative">
                  <img
                    src={prescriptionPreview}
                    alt="Prescription preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPrescriptionFile(null);
                      setPrescriptionPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
            className="flex-1"
            disabled={checkoutMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCheckout}
            className="flex-1"
            isLoading={checkoutMutation.isPending}
            disabled={checkoutMutation.isPending}
          >
            Complete Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
