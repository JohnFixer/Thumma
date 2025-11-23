import React, { useState, useEffect } from 'react';
import type { Product, ProductVariant, CartItem, StoreSettings, Language } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface OutsourcePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: CartItem) => void;
  product: Product | null;
  variant: ProductVariant | null;
  storeSettings: StoreSettings | null;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const OutsourcePurchaseModal: React.FC<OutsourcePurchaseModalProps> = ({ isOpen, onClose, onConfirm, product, variant, storeSettings, t, language }) => {
  const [cost, setCost] = useState<number | ''>('');
  const [markup, setMarkup] = useState<number | ''>(storeSettings?.default_outsource_markup ?? 20);
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
        setCost('');
        setMarkup(storeSettings?.default_outsource_markup ?? 20);
        setSellingPrice('');
    }
  }, [isOpen, storeSettings]);

  useEffect(() => {
    if (typeof cost === 'number' && typeof markup === 'number') {
      const calculatedPrice = cost * (1 + markup / 100);
      setSellingPrice(Math.ceil(calculatedPrice)); // Round up to nearest integer
    } else {
      setSellingPrice('');
    }
  }, [cost, markup]);
  
  const handleConfirm = () => {
    if (!product || !variant) return;
    if (typeof cost !== 'number' || cost <= 0 || typeof sellingPrice !== 'number' || sellingPrice <= 0) {
      alert('Please enter valid cost and selling price.');
      return;
    }

    const newItem: CartItem = {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      size: variant.size,
      imageUrl: product.imageUrl,
      sku: variant.sku,
      quantity: 1,
      stock: 1, // Pretend there is 1 in stock for cart logic
      price: { // Override prices with the new selling price
        cost: cost,
        walkIn: sellingPrice,
        contractor: sellingPrice,
        government: sellingPrice,
      },
      isOutsourced: true,
      outsourcedCost: cost,
    };
    onConfirm(newItem);
  };
  
  if (!isOpen || !product || !variant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('outsource_purchase')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-3 bg-background rounded-lg">
            <img src={product.imageUrl} alt={product.name[language]} className="h-16 w-16 rounded-md object-cover"/>
            <div>
              <p className="font-bold">{product.name[language]}</p>
              <p className="text-sm text-text-secondary">{variant.size} (SKU: {variant.sku})</p>
            </div>
          </div>
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-text-secondary">{t('cost_from_supplier')} (฿)</label>
            <input
              type="number"
              id="cost"
              value={cost}
              onChange={e => setCost(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1 block w-full rounded-md p-2 border-gray-300 text-lg"
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="markup" className="block text-sm font-medium text-text-secondary">{t('markup_percentage')} (%)</label>
              <input
                type="number"
                id="markup"
                value={markup}
                onChange={e => setMarkup(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md p-2 border-gray-300"
              />
            </div>
            <div>
              <label htmlFor="selling-price" className="block text-sm font-medium text-text-secondary">{t('new_selling_price')} (฿)</label>
              <input
                type="number"
                id="selling-price"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md p-2 border-gray-300 font-bold"
                required
              />
            </div>
          </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 disabled:bg-blue-300"
            onClick={handleConfirm}
            disabled={!cost || !sellingPrice}
          >
            {t('add_to_cart')}
          </button>
          <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutsourcePurchaseModal;