import React, { useState, useMemo } from 'react';
import type { Product, Language } from '../types';
import { MagnifyingGlassIcon, CubeIcon, BarcodeIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { CATEGORIES } from '../categories';

interface ProductGridProps {
    products: Product[];
    onProductSelect: (product: Product) => void;
    onScanClick: () => void;
    onProductMouseEnter: (product: Product, event: React.MouseEvent) => void;
    onProductMouseLeave: () => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductSelect, onScanClick, onProductMouseEnter, onProductMouseLeave, t, language }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const categories = useMemo(() => {
        return ['All', ...CATEGORIES.map(c => c.key)];
    }, []);

    const filteredProducts = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return products.filter(product => {
            const mainCatKey = product.category.split('.')[0];
            const matchesCategory = categoryFilter === 'All' || mainCatKey === categoryFilter;
            const matchesSearch = !lowercasedQuery ||
                Object.values(product.name).some(n => String(n).toLowerCase().includes(lowercasedQuery)) ||
                product.variants.some(v => v.sku.toLowerCase().includes(lowercasedQuery) || (v.barcode && v.barcode.toLowerCase().includes(lowercasedQuery)));
            return matchesCategory && matchesSearch;
        });
    }, [products, searchQuery, categoryFilter]);

    const getCategoryNameFromKey = (key: string) => {
        if (key === 'All') return t('all');
        const cat = CATEGORIES.find(c => c.key === key);
        return cat ? cat.name[language] : key;
    }

    return (
        <div className="bg-surface rounded-lg shadow flex flex-col h-full">
            <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">{t('products')}</h3>
                <div className="flex items-center gap-2 flex-wrap flex-grow sm:flex-grow-0">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_products_pos_placeholder')}
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
                    <button
                        onClick={onScanClick}
                        className="flex items-center gap-2 bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        title={t('scan_product_barcode_title')}
                    >
                        <BarcodeIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">{t('scan')}</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => {
                            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                            const hasMultipleVariants = product.variants.length > 1;
                            const displayPrice = product.variants[0]?.price.walkIn || 0;
                            const hasAnyStock = product.variants.some(v => v.stock > 0);

                            return (
                                <button
                                    type="button"
                                    key={product.id}
                                    onClick={() => onProductSelect(product)}
                                    onMouseEnter={(e) => onProductMouseEnter(product, e)}
                                    onMouseLeave={onProductMouseLeave}
                                    className={`text-left p-2 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${hasAnyStock ? 'bg-white hover:shadow-md' : 'bg-gray-100 opacity-70 hover:shadow-md'}`}
                                >
                                    <div className="relative">
                                        <img src={product.imageUrl || 'https://placehold.co/400x400?text=No+Image'} alt={product.name[language]} className="h-28 w-full object-cover rounded-md" />
                                        {!hasAnyStock && (
                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-md">
                                                <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded">{t('out_of_stock')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <p className="font-semibold text-sm text-text-primary leading-tight h-10 overflow-hidden">{product.name[language]}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-text-secondary">{hasMultipleVariants ? t('sizes_available_title', { count: product.variants.length.toString() }) : t('in_stock_count', { count: totalStock.toLocaleString() })}</p>
                                            <p className="text-base font-bold text-primary">{hasMultipleVariants && t('price_from')} ฿{displayPrice.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 text-text-secondary">
                        <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_products_found')}</p>
                        <p className="text-sm mt-1">{t('try_adjusting_search')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
