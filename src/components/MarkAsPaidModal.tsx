import React, { useState } from 'react';
import { XMarkIcon, CreditCardIcon, CurrencyDollarIcon, BuildingLibraryIcon } from './icons/HeroIcons';
import type { PaymentMethod } from '../types';
import type { TranslationKey } from '../translations';

interface MarkAsPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  orderId: string;
  totalAmount: number;
  t: (key: TranslationKey) => string;
}

const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({ isOpen, onClose, onConfirm, orderId, totalAmount, t }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedMethod);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('confirm_payment')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="text-center mb-4">
              <p className="text-text-secondary">{t('total_amount_for_order')}:</p>
              <p className="text-2xl font-bold text-primary my-1 font-mono">{orderId}</p>
              <p className="text-3xl font-bold text-primary">฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <p className="text-sm text-text-secondary mb-2">{t('select_payment_method')}:</p>
          <div className="space-y-3">
            <button 
                onClick={() => setSelectedMethod('Cash')}
                className={`w-full flex items-center gap-3 text-left p-3 rounded-lg border-2 transition-colors ${selectedMethod === 'Cash' ? 'border-primary bg-blue-50' : 'border-gray-300 bg-background hover:bg-gray-200'}`}
            >
                <CurrencyDollarIcon className="h-6 w-6 text-green-600"/>
                <div>
                    <p className="font-semibold text-text-primary">{t('payment_cash')}</p>
                    <p className="text-xs text-text-secondary">{t('payment_received_in_cash')}</p>
                </div>
            </button>
             <button 
                onClick={() => setSelectedMethod('Bank Transfer')}
                className={`w-full flex items-center gap-3 text-left p-3 rounded-lg border-2 transition-colors ${selectedMethod === 'Bank Transfer' ? 'border-primary bg-blue-50' : 'border-gray-300 bg-background hover:bg-gray-200'}`}
            >
                <BuildingLibraryIcon className="h-6 w-6 text-purple-600"/>
                <div>
                    <p className="font-semibold text-text-primary">{t('payment_bank_transfer')}</p>
                    <p className="text-xs text-text-secondary">{t('payment_confirmed_via_transfer')}</p>
                </div>
            </button>
             <button 
                onClick={() => setSelectedMethod('Card')}
                className={`w-full flex items-center gap-3 text-left p-3 rounded-lg border-2 transition-colors ${selectedMethod === 'Card' ? 'border-primary bg-blue-50' : 'border-gray-300 bg-background hover:bg-gray-200'}`}
            >
                <CreditCardIcon className="h-6 w-6 text-blue-600"/>
                <div>
                    <p className="font-semibold text-text-primary">{t('payment_card')}</p>
                    <p className="text-xs text-text-secondary">{t('payment_processed_with_card')}</p>
                </div>
            </button>
          </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleConfirm}
            >
                {t('mark_as_paid')}
            </button>
            <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
            >
                {t('cancel')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default MarkAsPaidModal;