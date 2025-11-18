import React, { useState, useMemo } from 'react';
import type { Product, Language } from '../types';
import { ProductStatus } from '../types';
import { MagnifyingGlassIcon } from './icons/HeroIcons';
import ProductDetailModal from './ProductDetailModal';
import type { TranslationKey } from '../translations';
import { CATEGORIES, getCategoryByKey } from '../categories';


interface CustomerAssistViewProps {
  products: Product[];
  onProductMouseEnter: (product: Product, event: React.MouseEvent) => void;
  onProductMouseLeave: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.IN_STOCK:
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' };
      case ProductStatus.LOW_STOCK:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' };
      case ProductStatus.OUT_OF_STOCK:
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' };
    }
};

const getProductStatus = (product: Product): ProductStatus => {
    if (!product.variants || product.variants.length === 0) {
        return ProductStatus.OUT_OF_STOCK;
    }
    const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
    if (totalStock === 0) {
        return ProductStatus.OUT_OF_STOCK;
    }
    if (product.variants.some(v => v.status === ProductStatus.LOW_STOCK) || totalStock <= 10) {
        return ProductStatus.LOW_STOCK;
    }
    return ProductStatus.IN_STOCK;
};

const CustomerAssistView: React.FC<CustomerAssistViewProps> = ({ products, onProductMouseEnter, onProductMouseLeave, t, language }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [productToView, setProductToView] = useState<Product | null>(null);

    const categories = useMemo(() => {
        return ['All', ...CATEGORIES.map(c => c.key)];
    }, []);

    const filteredProducts = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return products.filter(product => {
            const mainCatKey = product.category.split('.')[0];
            const matchesCategory = categoryFilter === 'All' || mainCatKey === categoryFilter;
            
            const categoryNames = getCategoryByKey(product.category);
            const categorySearchString = `${categoryNames.main?.name.en} ${categoryNames.main?.name.th} ${categoryNames.sub?.name.en} ${categoryNames.sub?.name.th}`.toLowerCase();
            
            const matchesSearch = !lowercasedQuery ||
                                  Object.values(product.name).some(n => String(n).toLowerCase().includes(lowercasedQuery)) ||
                                  product.variants.some(v => 
                                    v.sku.toLowerCase().includes(lowercasedQuery) ||
                                    (v.barcode && v.barcode.toLowerCase().includes(lowercasedQuery))
                                  ) ||
                                  categorySearchString.includes(lowercasedQuery);
            return matchesCategory && matchesSearch;
        });
    }, [products, searchQuery, categoryFilter, language]);

    const getCategoryNameFromKey = (key: string) => {
        if (key === 'All') return t('all');
        const cat = CATEGORIES.find(c => c.key === key);
        return cat ? cat.name[language] : key;
    }

    return (
        <>
            <div className="bg-surface rounded-lg shadow flex flex-col h-full">
                <div className="p-4 border-b">
                    <h2 className="text-2xl font-bold text-text-primary">{t('customer_assist')}</h2>
                    <p className="text-text-secondary mt-1">{t('customer_assist_desc')}</p>
                </div>

                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 flex-wrap flex-grow">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={t('search_by_name_sku_barcode_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            />
                        </div>
                        <select
                             value={categoryFilter}
                             onChange={(e) => setCategoryFilter(e.target.value)}
                             className="block w-full sm:w-auto pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            {categories.map(catKey => <option key={catKey} value={catKey}>{getCategoryNameFromKey(catKey)}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => {
                                const productStatus = getProductStatus(product);
                                const statusColors = getStatusColor(productStatus);
                                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                                const displayPrice = product.variants[0]?.price.walkIn || 0;
                                return (
                                <button 
                                    key={product.id}
                                    onClick={() => setProductToView(product)}
                                    onMouseEnter={(e) => onProductMouseEnter(product, e)}
                                    onMouseLeave={onProductMouseLeave}
                                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left flex flex-col items-center p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border-b-4 ${statusColors.border}`}
                                >
                                    <img src={product.imageUrl} alt={product.name[language]} className="h-40 w-full object-cover rounded-t-md" />
                                    <div className="p-2 flex flex-col flex-grow w-full">
                                        <p className="font-semibold text-sm text-text-primary flex-grow min-h-[40px]">{product.name[language]}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}>
                                                {t('in_stock_count', { count: totalStock.toLocaleString() })}
                                            </span>
                                            <p className="font-bold text-base text-primary">฿{displayPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                        </div>
                                    </div>
                                </button>
                            )})}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-text-secondary">
                            <p className="font-semibold">{t('no_products_found')}</p>
                            <p className="text-sm mt-1">{t('try_adjusting_search')}</p>
                        </div>
                    )}
                </div>
            </div>
            {productToView && (
                <ProductDetailModal
                    isOpen={!!productToView}
                    onClose={() => setProductToView(null)}
                    product={productToView}
                    t={t}
                    language={language}
                />
            )}
        </>
    );
};

export default CustomerAssistView;