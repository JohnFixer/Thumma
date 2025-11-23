import React, { useState, useEffect } from 'react';
import type { Bill, PaymentMethod } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billId: string, paymentData: { paymentAmount: number; paymentDate: string; paymentMethod: PaymentMethod; referenceNote: string; }) => void;
  bill: Bill | null;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onConfirm, bill, t }) => {
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNote, setReferenceNote] = useState('');

  const balanceDue = bill ? bill.amount - bill.paidAmount : 0;

  useEffect(() => {
    if (isOpen && bill) {
      setPaymentAmount(balanceDue);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Bank Transfer');
      setReferenceNote('');
    }
  }, [isOpen, bill, balanceDue]);

  const handleConfirm = () => {
    if (bill && typeof paymentAmount === 'number' && paymentAmount > 0) {
      onConfirm(bill.id, {
        paymentAmount,
        paymentDate,
        paymentMethod,
        referenceNote,
      });
    }
  };

  if (!isOpen || !bill) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('record_payment')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
            <div className="text-center">
                <p className="text-sm text-text-secondary">{t('invoice_number')} #{bill.invoiceNumber}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div><span className="text-xs text-text-secondary block">{t('total')}</span><span className="font-semibold">฿{bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div><span className="text-xs text-text-secondary block">{t('amount_paid')}</span><span className="font-semibold text-green-600">- ฿{bill.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div><span className="text-xs text-text-secondary block">{t('balance_due')}</span><span className="font-bold text-lg text-primary">฿{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                </div>
            </div>
            <div className="border-t pt-4">
                <label htmlFor="payment-amount" className="block text-sm font-medium text-text-secondary">{t('amount_to_pay')}</label>
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
                    autoFocus
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="payment-date" className="block text-sm font-medium text-text-secondary">{t('payment_date')}</label>
                    <input type="date" id="payment-date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" required />
                </div>
                <div>
                    <label htmlFor="payment-method" className="block text-sm font-medium text-text-secondary">{t('payment_method')}</label>
                    <select id="payment-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300">
                        <option value="Bank Transfer">{t('payment_bank_transfer')}</option>
                        <option value="Cash">{t('payment_cash')}</option>
                        <option value="Cheque">{t('payment_cheque')}</option>
                        <option value="Card">{t('payment_card')}</option>
                    </select>
                </div>
            </div>
             <div>
                <label htmlFor="reference" className="block text-sm font-medium text-text-secondary">{t('reference_note')} (Optional)</label>
                <input type="text" id="reference" value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" placeholder="e.g., Transaction ID, Cheque No." />
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
          <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;