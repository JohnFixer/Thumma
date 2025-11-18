import React, { useState, useEffect, useMemo } from 'react';
import type { NewProductData, NewProductVariantData, Language } from '../types';
import { XMarkIcon, PhotoIcon, PlusIcon, TrashIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { CATEGORIES } from '../categories';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (productData: NewProductData) => void;
  initialBarcode?: string | null;
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

interface VariantFormState {
  sku: string;
  size: string;
  stock: string;
  price: {
    walkIn: string;
    contractor: string;
    government: string;
    cost: string;
  };
  barcode: string;
}

const createEmptyVariantFormState = (): VariantFormState => ({
  sku: '',
  size: '',
  stock: '0',
  price: { walkIn: '0', contractor: '0', government: '0', cost: '0' },
  barcode: '',
});


const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAddProduct, initialBarcode, showAlert, t }) => {
  const [name, setName] = useState({ en: '', th: '' });
  const [description, setDescription] = useState({ en: '', th: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantFormState[]>([createEmptyVariantFormState()]);

  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  const subCategoryOptions = useMemo(() => {
    if (!selectedMainCategory) return [];
    const mainCat = CATEGORIES.find(c => c.key === selectedMainCategory);
    return mainCat?.subCategories || [];
  }, [selectedMainCategory]);

  const selectedSubCategoryDetails = useMemo(() => {
    if (!selectedSubCategory) return null;
    return subCategoryOptions.find(sc => sc.key === selectedSubCategory);
  }, [selectedSubCategory, subCategoryOptions]);

  useEffect(() => {
    if (isOpen) {
      setName({ en: '', th: '' });
      setDescription({ en: '', th: '' });
      setSelectedMainCategory('');
      setSelectedSubCategory('');
      setImagePreview(null);
      const firstVariant = createEmptyVariantFormState();
      if (initialBarcode) {
        firstVariant.barcode = initialBarcode;
      }
      setVariants([firstVariant]);
    }
  }, [isOpen, initialBarcode]);

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMainCategory(e.target.value);
    setSelectedSubCategory(''); // Reset sub-category when main changes
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVariantChange = (index: number, field: keyof VariantFormState | 'walkIn' | 'contractor' | 'government' | 'cost', value: string) => {
    const newVariants = [...variants];
    const variant = { ...newVariants[index] };
    const isPriceField = ['walkIn', 'contractor', 'government', 'cost'].includes(field);
    const isStockField = field === 'stock';

    let sanitizedValue = value;
    if (isPriceField) {
        // Allow decimals, but only one dot
        if (!/^\d*\.?\d*$/.test(sanitizedValue)) return;
    } else if (isStockField) {
        // Only integers
        if (!/^\d*$/.test(sanitizedValue)) return;
    }

    if (isPriceField) {
        variant.price = { ...variant.price, [field]: sanitizedValue };
    } else {
        (variant as any)[field] = sanitizedValue;
    }
    newVariants[index] = variant;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, createEmptyVariantFormState()]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.en || !name.th || !selectedMainCategory || !selectedSubCategory || !imagePreview) {
        showAlert(t('missing_information'), t('add_product_validation1'));
        return;
    }
    
    const variantsWithNumbers: NewProductVariantData[] = variants.map(v => ({
        sku: v.sku,
        size: v.size,
        stock: parseInt(v.stock, 10) || 0,
        price: {
            walkIn: parseFloat(v.price.walkIn) || 0,
            contractor: parseFloat(v.price.contractor) || 0,
            government: parseFloat(v.price.government) || 0,
            cost: parseFloat(v.price.cost) || 0,
        },
        barcode: v.barcode || undefined,
    }));

    if (variantsWithNumbers.some(v => !v.sku || !v.size || v.price.walkIn <= 0 || v.price.cost < 0)) {
        showAlert(t('invalid_variant'), t('add_product_validation2'));
        return;
    }
    onAddProduct({ name, description, category: `${selectedMainCategory}.${selectedSubCategory}`, imageUrl: imagePreview, variants: variantsWithNumbers });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-4xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('add_product')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary">{t('product')} Image</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Product preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
                      ) : (
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} required/>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name_en" className="block text-sm font-medium text-text-secondary">Product Name (EN)</label>
                        <input type="text" id="name_en" value={name.en} onChange={(e) => setName(p => ({...p, en: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
                    </div>
                    <div>
                        <label htmlFor="name_th" className="block text-sm font-medium text-text-secondary">Product Name (TH)</label>
                        <input type="text" id="name_th" value={name.th} onChange={(e) => setName(p => ({...p, th: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="main_category" className="block text-sm font-medium text-text-secondary">{t('main_category')}</label>
                            <select id="main_category" value={selectedMainCategory} onChange={handleMainCategoryChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required>
                                <option value="">{t('select_main_category')}</option>
                                {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.name['en']} / {cat.name['th']}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sub_category" className="block text-sm font-medium text-text-secondary">{t('sub_category')}</label>
                            <select id="sub_category" value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required disabled={!selectedMainCategory}>
                                <option value="">{t('select_sub_category')}</option>
                                {subCategoryOptions.map(sub => <option key={sub.key} value={sub.key}>{sub.name['en']} / {sub.name['th']}</option>)}
                            </select>
                        </div>
                    </div>
                    {selectedSubCategoryDetails && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
                            <p className="font-bold text-blue-800">{t('category_helper_title')}</p>
                            <p className="mt-1"><strong className="text-blue-700">{t('description')}:</strong> {selectedSubCategoryDetails.description['en']} / {selectedSubCategoryDetails.description['th']}</p>
                            <p className="mt-1"><strong className="text-blue-700">{t('example_products')}:</strong> {selectedSubCategoryDetails.examples['en']} / {selectedSubCategoryDetails.examples['th']}</p>
                        </div>
                    )}
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-text-secondary">Product Description (Optional)</label>
                <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea value={description.en} onChange={(e) => setDescription(p => ({...p, en: e.target.value}))} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-background" placeholder="Description in English"></textarea>
                    <textarea value={description.th} onChange={(e) => setDescription(p => ({...p, th: e.target.value}))} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-background" placeholder="คำอธิบายสินค้า (ภาษาไทย)"></textarea>
                </div>
            </div>
            
            <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-text-primary mb-2">Product Variants (Sizes, Types, etc.)</h4>
                <div className="space-y-4">
                    {variants.map((variant, index) => (
                        <div key={index} className="grid grid-cols-12 gap-x-4 gap-y-2 items-end p-3 bg-background rounded-lg border">
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs font-medium text-text-secondary">{t('size')}</label>
                                <input type="text" placeholder="e.g., 12mm" value={variant.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" required />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs font-medium text-text-secondary">{t('sku')}</label>
                                <input type="text" placeholder="SKU" value={variant.sku} onChange={e => handleVariantChange(index, 'sku', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" required />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs font-medium text-text-secondary">{t('stock')}</label>
                                <input type="text" inputMode="numeric" value={variant.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" />
                            </div>
                             <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs font-medium text-text-secondary">{t('cost_price')}</label>
                                <input type="text" inputMode="decimal" value={variant.price.cost} onChange={e => handleVariantChange(index, 'cost', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" required />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="block text-xs font-medium text-text-secondary">{t('walk_in_price')}</label>
                                <input type="text" inputMode="decimal" value={variant.price.walkIn} onChange={e => handleVariantChange(index, 'walkIn', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" required />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="block text-xs font-medium text-text-secondary">{t('contractor_price')}</label>
                                <input type="text" inputMode="decimal" value={variant.price.contractor} onChange={e => handleVariantChange(index, 'contractor', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" />
                            </div>
                             <div className="col-span-12 sm:col-span-4">
                                <label className="block text-xs font-medium text-text-secondary">{t('government')} Price</label>
                                <input type="text" inputMode="decimal" value={variant.price.government} onChange={e => handleVariantChange(index, 'government', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" />
                            </div>
                            <div className="col-span-11">
                                <label className="block text-xs font-medium text-text-secondary">Barcode (Optional)</label>
                                <input type="text" value={variant.barcode} onChange={e => handleVariantChange(index, 'barcode', e.target.value)} className="mt-1 block w-full rounded-md text-sm p-2" />
                            </div>
                            <div className="col-span-1 flex items-center justify-end">
                                <button type="button" onClick={() => removeVariant(index)} disabled={variants.length <= 1} className="text-red-500 hover:text-red-700 disabled:text-gray-300 p-1">
                                    <TrashIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addVariant} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-blue-700 mt-2">
                        <PlusIcon className="h-4 w-4" /> Add Another Variant
                    </button>
                </div>
            </div>
          </div>
          <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
              Add Product
            </button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;