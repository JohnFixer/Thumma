import React from 'react';
import type { Transaction } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { PaymentStatus } from '../types';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: Transaction[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ isOpen, onClose, title, transactions, t }) => {
  if (!isOpen) return null;

  const getStatusInfo = (tx: Transaction) => {
    if (tx.id.startsWith('C-INV-') && tx.payment_status === PaymentStatus.UNPAID) {
        return { text: 'Consolidated', color: 'bg-purple-100 text-purple-800' };
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    if (tx.payment_status === PaymentStatus.UNPAID && tx.due_date && new Date(tx.due_date) < today) {
        return { text: t('overdue'), color: 'bg-red-100 text-red-800' };
    }
    switch (tx.payment_status) {
        case PaymentStatus.UNPAID: return { text: t('unpaid'), color: 'bg-yellow-100 text-yellow-800' };
        case PaymentStatus.PARTIALLY_PAID: return { text: t('partially_paid'), color: 'bg-blue-100 text-blue-800' };
        default: return { text: tx.payment_status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {transactions.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">{t('customer')}</th>
                  <th className="px-4 py-3">{t('due_date')}</th>
                  <th className="px-4 py-3 text-center">{t('status')}</th>
                  <th className="px-4 py-3 text-right">{t('balance_due')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const statusInfo = getStatusInfo(tx);
                  const balanceDue = tx.total - tx.paid_amount;
                  return (
                    <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{tx.id}</td>
                      <td className="px-4 py-3">{tx.customerName}</td>
                      <td className={`px-4 py-3 ${statusInfo.text === t('overdue') ? 'text-red-600 font-bold' : ''}`}>
                        {tx.due_date ? new Date(tx.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">฿{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-text-secondary p-8">{t('no_transactions_found')}</p>
          )}
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 flex justify-end rounded-b-lg">
          <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;