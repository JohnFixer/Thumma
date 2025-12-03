import React from 'react';
import type { Transaction, StoreSettings, Language } from '../types';
import { XMarkIcon, PrinterIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface ConsolidatedInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Transaction | null;
  storeSettings: StoreSettings | null;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const ConsolidatedInvoiceModal: React.FC<ConsolidatedInvoiceModalProps> = ({ isOpen, onClose, invoice, storeSettings, t, language }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('consolidated-invoice-to-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the invoice.');
      return;
    }

    const tailwindScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
    const tailwindConfig = Array.from(document.querySelectorAll('script')).find(s => s.textContent?.includes('tailwind.config'));
    const styles = Array.from(document.querySelectorAll('style'));

    printWindow.document.write('<html><head><title>Print Consolidated Invoice</title>');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center no-print" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('consolidated_invoice')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div id="consolidated-invoice-to-print" className="bg-white text-black p-6 border">
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <h1 className="text-xl font-bold">{storeSettings?.store_name[language]}</h1>
                <p className="text-xs">{storeSettings?.address[language]}</p>
                <p className="text-xs">
                  Tel: {storeSettings?.phone[language]} {t('tax_id')}: {storeSettings?.tax_id[language]}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">{t('consolidated_invoice')}</h2>
                <p className="text-xs"><strong>Invoice #:</strong> {invoice.id}</p>
                <p className="text-xs"><strong>{t('date')}:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
                <p className="text-xs"><strong>{t('due_date')}:</strong> {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="my-4 text-sm">
              <h4 className="font-bold mb-1">{t('bill_to').toUpperCase()}:</h4>
              <p>{invoice.customerName}</p>
              {(invoice.customerAddress || invoice.customerPhone) && (
                <p>{invoice.customerAddress} {invoice.customerPhone ? `Tel: ${invoice.customerPhone}` : ''}</p>
              )}
            </div>

            <table className="w-full text-sm border-collapse border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left font-bold">{t('description')}</th>
                  <th className="border p-2 text-right font-bold">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map(item => (
                  <tr key={item.variantId}>
                    <td className="border p-2">
                      {t('consolidates_invoices')}: <span className="font-mono text-xs">{item.sku}</span>
                      <br />
                      <span className="text-xs text-gray-600">Original Date: {item.size}</span>
                    </td>
                    <td className="border p-2 text-right font-mono">฿{item.price.walkIn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="border p-2 text-right">{t('grand_total').toUpperCase()}</td>
                  <td className="border p-2 text-right font-mono text-lg">฿{invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>

            <div className="text-center mt-6 text-xs text-gray-600">
              <p>{t('receipt_footer_line1')}</p>
            </div>
          </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button type="button" onClick={handlePrint} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
            <PrinterIcon className="h-5 w-5 mr-2" /> Print
          </button>
          <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedInvoiceModal;