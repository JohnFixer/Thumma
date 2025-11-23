import React, { useState, useEffect } from 'react';
import type { CartItem, Language } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface AddMiscItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: CartItem) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const AddMiscItemModal: React.FC<AddMiscItemModalProps> = ({ isOpen, onClose, onConfirm, t, language }) => {
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>(1);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setCost('');
      setSellingPrice('');
      setQuantity(1);
    }
  }, [isOpen]);

  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Allow empty string, or a valid decimal number pattern
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setter(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericCost = parseFloat(cost);
    const numericSellingPrice = parseFloat(sellingPrice);
    const numericQuantity = typeof quantity === 'number' ? quantity : parseInt(String(quantity), 10);

    if (!description || isNaN(numericCost) || numericCost < 0 || isNaN(numericSellingPrice) || numericSellingPrice < 0 || isNaN(numericQuantity) || numericQuantity <= 0) {
      // Simple validation, can be improved with showAlert
      return;
    }

    const newItem: CartItem = {
      productId: 'MISC_ITEM',
      variantId: `misc-${Date.now()}`,
      name: { en: description, th: description },
      size: '',
      imageUrl: 'https://picsum.photos/seed/misc/100/100', // Generic placeholder
      sku: 'MISC',
      quantity: numericQuantity,
      stock: numericQuantity, // Set stock to quantity to avoid cart logic issues
      price: {
        cost: numericCost,
        walkIn: numericSellingPrice,
        contractor: numericSellingPrice,
        government: numericSellingPrice,
      },
      isOutsourced: true,
      outsourcedCost: numericCost,
    };

    onConfirm(newItem);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('add_misc_item')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="px-6 pt-4 text-sm text-text-secondary">{t('add_misc_item_desc')}</p>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="misc-desc" className="block text-sm font-medium text-text-secondary">{t('item_description')}</label>
              <input
                type="text"
                id="misc-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md p-2 border-gray-300"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="misc-cost" className="block text-sm font-medium text-text-secondary">{t('cost_price')} (฿)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="misc-cost"
                  value={cost}
                  onChange={handleNumericInputChange(setCost)}
                  className="mt-1 block w-full rounded-md p-2 border-gray-300"
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="misc-price" className="block text-sm font-medium text-text-secondary">{t('selling_price')} (฿)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="misc-price"
                  value={sellingPrice}
                  onChange={handleNumericInputChange(setSellingPrice)}
                  className="mt-1 block w-full rounded-md p-2 border-gray-300"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label htmlFor="misc-qty" className="block text-sm font-medium text-text-secondary">{t('quantity')}</label>
              <input
                type="number"
                id="misc-qty"
                value={quantity}
                onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md p-2 border-gray-300"
                required
                min="1"
                step="1"
              />
            </div>
          </div>
          <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 disabled:bg-blue-300"
              disabled={!description || cost === '' || sellingPrice === '' || quantity === '' || Number(quantity) <= 0}
            >
              {t('add_to_cart')}
            </button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMiscItemModal;