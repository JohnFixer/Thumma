import React, { useMemo } from 'react';
import type { Bill, Supplier } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { BillStatus } from '../types';

interface BillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  bills: Bill[];
  suppliers: Supplier[];
  t: (key: TranslationKey) => string;
  onRecordPaymentClick?: (bill: Bill) => void;
}

const BillDetailsModal: React.FC<BillDetailsModalProps> = ({ isOpen, onClose, title, bills, suppliers, t, onRecordPaymentClick }) => {
  if (!isOpen) return null;

  const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

  const getStatusInfo = (status: BillStatus) => {
    switch(status) {
        case BillStatus.PAID: return { text: t('bill_status_paid'), color: 'bg-green-100 text-green-800' };
        case BillStatus.OVERDUE: return { text: t('bill_status_overdue'), color: 'bg-red-100 text-red-800' };
        case BillStatus.DUE: return { text: t('bill_status_due'), color: 'bg-yellow-100 text-yellow-800' };
        default: return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-4xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {bills.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">{t('invoice_number')}</th>
                  <th className="px-4 py-3">{t('suppliers')}</th>
                  <th className="px-4 py-3">{t('due_date')}</th>
                  <th className="px-4 py-3 text-right">{t('amount')}</th>
                  <th className="px-4 py-3 text-right">{t('balance_due')}</th>
                  {onRecordPaymentClick && <th className="px-4 py-3 text-center">{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => {
                   const isOverdue = bill.status === BillStatus.DUE && new Date(bill.dueDate) < new Date();
                   const balanceDue = bill.amount - (bill.paidAmount || 0);
                  return (
                    <tr key={bill.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{bill.invoiceNumber}</td>
                      <td className="px-4 py-3">{supplierMap.get(bill.supplierId) || 'Unknown'}</td>
                      <td className={`px-4 py-3 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>{new Date(bill.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right font-semibold">฿{bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">฿{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                       {onRecordPaymentClick && (
                         <td className="px-4 py-3 text-center">
                           {balanceDue > 0 && (
                            <button onClick={() => onRecordPaymentClick(bill)} className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">
                                {t('record_payment')}
                            </button>
                           )}
                         </td>
                       )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-text-secondary p-8">{t('no_bills_found')}</p>
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

export default BillDetailsModal;