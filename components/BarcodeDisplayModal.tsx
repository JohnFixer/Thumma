
import React from 'react';
// FIX: Corrected import paths
import type { Product, ProductVariant, Language } from '../types.ts';
import { XMarkIcon, PrinterIcon } from './icons/HeroIcons.tsx';
import type { TranslationKey } from '../translations.ts';

interface BarcodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  variant: ProductVariant | null;
  t: (key: TranslationKey) => string;
  language: Language;
}

const BarcodeDisplayModal: React.FC<BarcodeDisplayModalProps> = ({ isOpen, onClose, product, variant, t, language }) => {
  if (!isOpen || !product || !variant) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('barcode-to-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow pop-ups to print the barcode.');
        return;
    }

    const tailwindScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
    const tailwindConfig = Array.from(document.querySelectorAll('script')).find(s => s.textContent?.includes('tailwind.config'));
    const styles = Array.from(document.querySelectorAll('style'));

    printWindow.document.write('<html><head><title>Print Barcode</title>');
    if (tailwindScript) printWindow.document.write(tailwindScript.outerHTML);
    if (tailwindConfig) printWindow.document.write(`<script>${tailwindConfig.innerHTML}</script>`);
    styles.forEach(style => printWindow.document.write(`<style>${style.innerHTML}</style>`));
    printWindow.document.write('</head><body class="bg-white print-center-container">');
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
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center no-print" aria-modal="true" role="dialog" onClick={onClose}>
        <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-primary">Product Barcode</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div id="barcode-to-print" className="p-6 text-center bg-white">
            <h4 className="font-semibold text-text-primary">{product.name[language]}</h4>
            <p className="text-sm text-text-secondary">{variant.size}</p>
            <div className="my-4">
              {/* Simple barcode visualization */}
              <div className="flex h-20 items-end justify-center gap-[1px]">
                  {variant.barcode?.split('').map((char, index) => {
                      const height = Math.random() * 40 + 60; // Random height for visual effect
                      const width = Math.random() > 0.5 ? '2px' : '1px';
                      return <div key={index} style={{ height: `${height}%`, width, backgroundColor: 'black' }} />;
                  })}
              </div>
              <p className="font-mono tracking-widest text-lg mt-2">{variant.barcode}</p>
            </div>
            <p className="text-xs text-text-secondary">SKU: {variant.sku}</p>
            <p className="text-lg font-bold text-primary mt-1">฿{variant.price.walkIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handlePrint}
            >
              <PrinterIcon className="h-5 w-5 mr-2" /> Print
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BarcodeDisplayModal;