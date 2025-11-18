import React from 'react';
import type { Product, ProductVariant, Language } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSelectVariant: (product: Product, variant: ProductVariant) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({ isOpen, onClose, product, onSelectVariant, t, language }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('select_size_for')} "{product.name[language]}"</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
            {product.variants.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.variants.map(variant => (
                        <button 
                            key={variant.id}
                            onClick={() => onSelectVariant(product, variant)}
                            className={`text-left p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                                variant.stock > 0 
                                ? 'hover:border-primary hover:bg-blue-50' 
                                : 'bg-gray-100 opacity-80 hover:border-secondary hover:bg-orange-50'
                            }`}
                        >
                            <p className="font-bold text-lg text-text-primary">{variant.size}</p>
                            <p className={`text-sm ${variant.stock > 0 ? 'text-text-secondary' : 'text-red-600 font-semibold'}`}>
                                {variant.stock > 0 ? `${t('stock')}: ${variant.stock}` : t('out_of_stock')}
                            </p>
                            <p className="text-md font-semibold text-primary mt-2">฿{variant.price.walkIn.toFixed(2)}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-center text-text-secondary">{t('product_out_of_stock_all_sizes')}</p>
            )}
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 flex justify-end rounded-b-lg">
          <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantSelectionModal;