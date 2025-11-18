import React from 'react';
import type { Product, ProductVariant, Language } from '../types';
import { ProductStatus } from '../types';
import { XMarkIcon, ClockIcon, QrCodeIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { getCategoryDisplay } from '../categories';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const getStatusColor = (status: ProductStatus) => {
    switch (status) {
    case ProductStatus.IN_STOCK:
        return 'bg-green-100 text-green-800';
    case ProductStatus.LOW_STOCK:
        return 'bg-yellow-100 text-yellow-800';
    case ProductStatus.OUT_OF_STOCK:
        return 'bg-red-100 text-red-800';
    default:
        return 'bg-gray-100 text-gray-800';
    }
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, product, t, language }) => {
    if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-4xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('product_details')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-full md:w-1/3">
                    <img src={product.imageUrl.replace('/400/400', '/800/600')} alt={product.name[language]} className="w-full h-auto object-cover rounded-lg shadow-md" />
                </div>
                <div className="w-full md:w-2/3 space-y-4">
                    <h2 className="text-2xl font-bold text-text-primary">{product.name[language]}</h2>
                    {product.description && product.description[language] && (
                        <p className="text-sm text-text-secondary">{product.description[language]}</p>
                    )}
                     <div className="border-t pt-4">
                        <dl>
                           <div className="flex justify-between text-sm py-1">
                                <dt className="text-text-secondary">{t('category')}</dt>
                                <dd className="text-text-primary">{getCategoryDisplay(product.category, language)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
            <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-text-primary mb-2">{t('available_variants')}</h4>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-background text-left text-text-secondary">
                            <tr>
                                <th className="p-3 font-medium">{t('size')}</th>
                                <th className="p-3 font-medium">{t('sku')}</th>
                                <th className="p-3 font-medium text-right">{t('stock')}</th>
                                <th className="p-3 font-medium text-right">{t('walk_in_price')}</th>
                                <th className="p-3 font-medium text-right">{t('contractor_price')}</th>
                                <th className="p-3 font-medium text-center">{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {product.variants.map(variant => (
                                <tr key={variant.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-semibold">{variant.size}</td>
                                    <td className="p-3 font-mono text-xs">{variant.sku}</td>
                                    <td className="p-3 text-right">{variant.stock.toLocaleString()}</td>
                                    <td className="p-3 text-right font-semibold text-primary">฿{variant.price.walkIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td className="p-3 text-right font-semibold text-secondary">฿{variant.price.contractor.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td className="p-3 text-center">
                                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(variant.status)}`}>
                                            {t(variant.status.toLowerCase().replace(/\s/g, '_') as TranslationKey)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 flex justify-end rounded-b-lg">
          <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;