import React, { useMemo } from 'react';
import type { Product, Language } from '../../types';
import { ProductStatus } from '../../types';
import type { TranslationKey } from '../../translations';

interface LowStockListWidgetProps {
  products: Product[];
  t: (key: TranslationKey) => string;
  onNavigate: (view: string) => void;
  language: Language;
}

const LowStockListWidget: React.FC<LowStockListWidgetProps> = ({ products, t, onNavigate, language }) => {
    const lowStockItems = useMemo(() => {
        return products
            .flatMap(p => p.variants.map(v => ({ ...v, productName: p.name[language] })))
            .filter(v => v.status === ProductStatus.LOW_STOCK)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5);
    }, [products, language]);

    return (
        <div className="bg-surface rounded-lg shadow p-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('low_stock_items')}</h3>
            {lowStockItems.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {lowStockItems.map(item => (
                        <li key={item.id} className="py-2 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-sm">{item.productName} ({item.size})</p>
                                <p className="text-xs text-text-secondary">SKU: {item.sku}</p>
                            </div>
                            <span className="font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-sm">{item.stock.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-text-secondary text-center py-4">{t('no_low_stock_items')}</p>
            )}
            <button onClick={() => onNavigate('inventory')} className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline">
                {t('view_all_inventory')}
            </button>
        </div>
    );
};

export default LowStockListWidget;
