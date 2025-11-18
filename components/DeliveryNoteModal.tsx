import React from 'react';
import type { Order, Language, StoreSettings } from '../types';
import { XMarkIcon, PrinterIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface DeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  storeSettings: StoreSettings | null;
  language: Language;
  t: (key: TranslationKey) => string;
}

const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({ isOpen, onClose, order, storeSettings, language, t }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('delivery-note-to-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the delivery note.');
      return;
    }

    const tailwindScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
    const tailwindConfig = Array.from(document.querySelectorAll('script')).find(s => s.textContent?.includes('tailwind.config'));
    const styles = Array.from(document.querySelectorAll('style'));

    printWindow.document.write('<html><head><title>Print Delivery Note</title>');
    if (tailwindScript) printWindow.document.write(tailwindScript.outerHTML);
    if (tailwindConfig) printWindow.document.write(`<script>${tailwindConfig.innerHTML}</script>`);
    styles.forEach(style => printWindow.document.write(`<style>${style.innerHTML}</style>`));
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 500);
  };

  if (!isOpen || !order) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center no-print" aria-modal="true" role="dialog" onClick={onClose}>
        <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-primary">{t('delivery_note_pickup_slip')}</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            <div id="delivery-note-to-print" className="bg-white text-black p-6 border">
              <div className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-xl font-bold">{storeSettings?.store_name[language]}</h1>
                    <p className="text-xs">{storeSettings?.address[language]}</p>
                    <p className="text-xs">Tel: {storeSettings?.phone[language]}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase">{t(order.type === 'Delivery' ? 'delivery_note' : 'pickup_note')}</h2>
                    <p className="text-xs"><strong>{t('order_id')}:</strong> {order.id}</p>
                    <p className="text-xs"><strong>{t('date')}:</strong> {new Date(order.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4 text-sm">
                <div>
                    <h4 className="font-bold mb-1">{t('customer').toUpperCase()}:</h4>
                    <p>{order.customer.name}</p>
                    <p>{order.customer.phone}</p>
                </div>
                {order.address && (
                    <div className="text-right">
                        <h4 className="font-bold mb-1">{t('shipping_address')}:</h4>
                        <p>{order.address}</p>
                    </div>
                )}
              </div>

              <table className="w-full text-sm border-collapse border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left font-bold">{t('sku')}</th>
                    <th className="border p-2 text-left font-bold">{t('product_description')}</th>
                    <th className="border p-2 text-center font-bold">{t('quantity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map(item => (
                      <tr key={item.variantId}>
                          <td className="border p-2 align-top font-mono">{item.sku}</td>
                          <td className="border p-2 align-top">{item.name[language]} ({item.size})</td>
                          <td className="border p-2 text-center align-top font-bold text-lg">{item.quantity}</td>
                      </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 mt-16 text-sm">
                  <div className="text-center">
                      <div className="border-t pt-2">{t('received_by')}</div>
                      <p className="mt-1 text-xs">({t('customer_signature')})</p>
                  </div>
                   <div className="text-center">
                      <div className="border-t pt-2">{t('delivered_by')}</div>
                      <p className="mt-1 text-xs">({t('staff_signature')})</p>
                  </div>
              </div>
            </div>
          </div>
          <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="button" onClick={handlePrint} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
              <PrinterIcon className="h-5 w-5 mr-2" /> {t('print')}
            </button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryNoteModal;