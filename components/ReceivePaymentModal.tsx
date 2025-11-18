
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/HeroIcons';
import type { PaymentMethod, Transaction } from '../types';
import type { TranslationKey } from '../translations';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionId: string, paymentAmount: number, paymentMethod: PaymentMethod) => void;
  transaction: Transaction | null;
  t: (key: TranslationKey) => string;
}

const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({ isOpen, onClose, onConfirm, transaction, t }) => {
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  
  const balanceDue = transaction ? transaction.total - transaction.paid_amount : 0;

  useEffect(() => {
    if (isOpen && transaction) {
      setPaymentAmount(balanceDue);
      setPaymentMethod('Cash');
    }
  }, [isOpen, transaction, balanceDue]);

  if (!isOpen || !transaction) return null;

  const handleConfirm = () => {
    if (typeof paymentAmount === 'number' && paymentAmount > 0) {
      onConfirm(transaction.id, paymentAmount, paymentMethod);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('receive_payment')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
            <div className="text-center">
                <p className="text-sm text-text-secondary">Invoice #{transaction.id}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div><span className="text-xs text-text-secondary block">{t('total')}</span><span className="font-semibold">฿{transaction.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div><span className="text-xs text-text-secondary block">{t('amount_paid')}</span><span className="font-semibold text-green-600">- ฿{transaction.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div><span className="text-xs text-text-secondary block">{t('balance_due')}</span><span className="font-bold text-lg text-primary">฿{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
            </div>
            <div className="border-t pt-4">
                <label htmlFor="payment-amount" className="block text-sm font-medium text-text-secondary">{t('payment_amount')}</label>
                <input 
                    type="number" 
                    id="payment-amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Math.max(0, Math.min(balanceDue, Number(e.target.value))))}
                    min="0.01"
                    max={balanceDue}
                    step="0.01"
                    className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300 text-lg font-bold"
                    required
                />
            </div>
             <div>
                <label htmlFor="payment-method" className="block text-sm font-medium text-text-secondary">{t('payment_method')}</label>
                <select id="payment-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300">
                    <option value="Cash">{t('payment_cash')}</option>
                    <option value="Bank Transfer">{t('payment_bank_transfer')}</option>
                    <option value="Card">{t('payment_card')}</option>
                </select>
            </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300"
                onClick={handleConfirm}
                disabled={!paymentAmount || paymentAmount <= 0}
            >
                {t('confirm')}
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

export default ReceivePaymentModal;