import React, { useState, useEffect } from 'react';
import type { Transaction, Language, PaymentMethod, StoreSettings } from '../types';
import { XMarkIcon, PrinterIcon } from './icons/HeroIcons';
import { useTranslations } from '../translations';
import type { TranslationKey } from '../translations';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  storeSettings: StoreSettings | null;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, transaction, storeSettings, t, language }) => {
  const [receiptLanguage, setReceiptLanguage] = useState<Language>(language);
  const t_receipt = useTranslations(receiptLanguage);

  useEffect(() => {
    if (isOpen) {
      setReceiptLanguage(language);
    }
  }, [isOpen, language]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-to-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the receipt.');
      return;
    }

    const tailwindScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
    const tailwindConfig = Array.from(document.querySelectorAll('script')).find(s => s.textContent?.includes('tailwind.config'));
    const styles = Array.from(document.querySelectorAll('style'));

    printWindow.document.write('<html><head><title>Print Receipt</title>');
    if (tailwindScript) printWindow.document.write(tailwindScript.outerHTML);
    if (tailwindConfig) printWindow.document.write(`<script>${tailwindConfig.innerHTML}</script>`);
    styles.forEach(style => printWindow.document.write(`<style>${style.innerHTML}</style>`));
    printWindow.document.write('</head><body class="bg-white">');
    printWindow.document.write(printContent.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  
  const getTranslatedPaymentMethod = (method: PaymentMethod) => {
    const key = `payment_${method.toLowerCase().replace(/\s/g, '_')}` as TranslationKey;
    return t_receipt(key);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center no-print" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">Transaction Receipt</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-text-secondary mb-2">Receipt Language</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setReceiptLanguage('en')}
              className={`px-4 py-1 text-sm rounded-md transition-colors ${receiptLanguage === 'en' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              English
            </button>
            <button 
              onClick={() => setReceiptLanguage('th')}
              className={`px-4 py-1 text-sm rounded-md transition-colors ${receiptLanguage === 'th' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              ไทย
            </button>
          </div>
        </div>
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          <div id="receipt-to-print" className="bg-white text-black p-4 w-full mx-auto text-sm leading-relaxed font-sans">
            <div className="text-center font-sans">
              <h1 className="text-2xl font-bold">{storeSettings?.store_name[receiptLanguage]}</h1>
              <p>{storeSettings?.address[receiptLanguage]}</p>
              <p>Tel: {storeSettings?.phone[receiptLanguage]}</p>
              <p className="mt-2 text-xs">{t_receipt('tax_id')}: {storeSettings?.tax_id[receiptLanguage]}</p>
              <p className="font-bold my-2 text-lg">{t_receipt('receipt')}</p>
            </div>
            <div className="border-t border-b border-dashed border-black my-2 py-1 text-xs font-sans">
              <p>{t_receipt('receipt_id')}: <span className="font-mono">{transaction.id}</span></p>
              <p>{t_receipt('date')}: {new Date(transaction.date).toLocaleString()}</p>
              <p>{t_receipt('operator')}: {transaction.operator}</p>
              <p>{t_receipt('customer')}: {transaction.customerName}</p>
            </div>
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-left py-1">{t_receipt('item')}</th>
                  <th className="text-center py-1">{t_receipt('qty')}</th>
                  <th className="text-right py-1">{t_receipt('price')}</th>
                  <th className="text-right py-1">{t_receipt('total')}</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map(item => {
                  const price = transaction.customerType === 'government' ? item.price.government : transaction.customerType === 'contractor' ? item.price.contractor : item.price.walkIn;
                  return (
                  <tr key={item.variantId}>
                    <td className="align-top">{item.name[receiptLanguage]} ({item.size})</td>
                    <td className="text-center align-top">{item.quantity}</td>
                    <td className="text-right align-top">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-right align-top">{(price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )})}
              </tbody>
            </table>
            <div className="border-t border-dashed border-black mt-2 pt-1 font-sans">
              <div className="flex justify-between"><span>{t_receipt('subtotal')}:</span><span>{transaction.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span>{t_receipt('tax_7')}:</span><span>{transaction.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              {transaction.appliedStoreCredit && (
                <div className="flex justify-between"><span>{t_receipt('store_credit')}:</span><span>-{transaction.appliedStoreCredit.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              )}
              <div className="flex justify-between font-bold text-lg mt-1"><span>{t_receipt('total')}:</span><span>฿{transaction.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </div>
            <div className="border-t border-dashed border-black mt-2 pt-1 text-xs font-sans">
              <p>{t_receipt('payment_method')}: {getTranslatedPaymentMethod(transaction.paymentMethod)}</p>
            </div>
            <div className="text-center text-xs mt-4 font-sans">
                <p>{t_receipt('receipt_footer_line1')}</p>
                <p>{t_receipt('receipt_footer_line2')}</p>
            </div>
          </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm-text-sm"
            onClick={handlePrint}
          >
            <PrinterIcon className="h-5 w-5 mr-2" /> {t('print')}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;