import React, { useMemo } from 'react';
import type { Transaction, Product, Language } from '../../types';
import type { TranslationKey } from '../../translations';
import { ChartBarSquareIcon } from '../icons';

interface TopSellingProductsWidgetProps {
    transactions: Transaction[];
    products: Product[];
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
    onNavigate: (view: string, state?: any) => void;
}

interface ProductSales {
    productId: string;
    productName: { en: string, th: string };
    totalQuantity: number;
    totalRevenue: number;
}

const TopSellingProductsWidget: React.FC<TopSellingProductsWidgetProps> = ({
    transactions,
    products,
    t,
    language,
    onNavigate
}) => {
    const topProducts = useMemo(() => {
        // Calculate sales for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesMap = new Map<string, ProductSales>();

        transactions
            .filter(tx => new Date(tx.date) >= thirtyDaysAgo)
            .forEach(tx => {
                tx.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return;

                    const existing = salesMap.get(item.productId);
                    const priceKey = tx.customerType === 'organization' ? 'contractor' : tx.customerType;
                    const itemPrice = item.price[priceKey as 'walkIn' | 'contractor' | 'government'];

                    if (existing) {
                        existing.totalQuantity += item.quantity;
                        existing.totalRevenue += itemPrice * item.quantity;
                    } else {
                        salesMap.set(item.productId, {
                            productId: item.productId,
                            productName: product.name,
                            totalQuantity: item.quantity,
                            totalRevenue: itemPrice * item.quantity,
                        });
                    }
                });
            });

        return Array.from(salesMap.values())
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);
    }, [transactions, products]);

    return (
        <div className="bg-surface rounded-lg shadow p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-blue-500" />
                    {t('top_selling_products')}
                </h3>
                <span className="text-xs text-text-secondary">{t('last_30_days')}</span>
            </div>

            {topProducts.length > 0 ? (
                <div className="space-y-3">
                    {topProducts.map((product, index) => (
                        <div
                            key={product.productId}
                            className="flex items-center justify-between p-3 bg-background rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => onNavigate('inventory')}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-text-primary truncate">
                                        {product.productName[language]}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {t('quantity_sold')}: {product.totalQuantity.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right ml-4">
                                <p className="font-semibold text-green-600">
                                    ฿{product.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-text-secondary">
                    <p>{t('no_sales_data')}</p>
                </div>
            )}
        </div>
    );
};

export default TopSellingProductsWidget;
