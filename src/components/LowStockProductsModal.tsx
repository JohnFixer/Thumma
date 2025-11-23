import React, { useMemo } from 'react';
import type { Product, ProductVariant, Language } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface LowStockProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockVariants: ProductVariant[];
  products: Product[];
  t: (key: TranslationKey) => string;
  language: Language;
}

const LowStockProductsModal: React.FC<LowStockProductsModalProps> = ({ isOpen, onClose, lowStockVariants, products, t, language }) => {
  if (!isOpen) return null;

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('low_stock_items')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {lowStockVariants.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">{t('product')}</th>
                  <th className="px-6 py-3">{t('size')}</th>
                  <th className="px-6 py-3">{t('sku')}</th>
                  <th className="px-6 py-3 text-right">{t('stock')}</th>
                </tr>
              </thead>
              <tbody>
                {lowStockVariants.map(variant => {
                  const product = products.find(p => p.variants.some(v => v.id === variant.id));
                  return (
                    <tr key={variant.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{product?.name[language] || 'N/A'}</td>
                      <td className="px-6 py-4">{variant.size}</td>
                      <td className="px-6 py-4 font-mono text-xs">{variant.sku}</td>
                      <td className="px-6 py-4 text-right font-bold text-yellow-600">{variant.stock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-text-secondary p-8">{t('no_low_stock_items')}</p>
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

export default LowStockProductsModal;