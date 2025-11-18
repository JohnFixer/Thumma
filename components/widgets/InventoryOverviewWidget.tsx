import React, { useMemo } from 'react';
import type { Product } from '../../types';
import { ProductStatus } from '../../types';
import type { TranslationKey } from '../../translations';
import StatsCard from '../StatsCard';
import { CubeIcon, ArchiveBoxXMarkIcon } from '../icons/HeroIcons';

interface InventoryOverviewWidgetProps {
  products: Product[];
  t: (key: TranslationKey) => string;
  onNavigate: (view: string) => void;
}

const InventoryOverviewWidget: React.FC<InventoryOverviewWidgetProps> = ({ products, t, onNavigate }) => {
    const stats = useMemo(() => {
        const totalSKUs = products.reduce((sum, p) => sum + p.variants.length, 0);
        const outOfStockSKUs = products.flatMap(p => p.variants).filter(v => v.status === ProductStatus.OUT_OF_STOCK).length;
        return { totalSKUs, outOfStockSKUs };
    }, [products]);

    return (
        <div className="bg-surface rounded-lg shadow p-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('inventory_overview')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatsCard 
                    title={t('total_skus')}
                    value={stats.totalSKUs.toLocaleString()}
                    icon={<CubeIcon className="h-6 w-6"/>}
                    color="text-blue-500"
                    onClick={() => onNavigate('inventory')}
                    isClickable
                />
                <StatsCard 
                    title={t('out_of_stock_skus')}
                    value={stats.outOfStockSKUs.toLocaleString()}
                    icon={<ArchiveBoxXMarkIcon className="h-6 w-6"/>}
                    color="text-red-500"
                    onClick={() => onNavigate('inventory')}
                    isClickable
                />
            </div>
        </div>
    );
};

export default InventoryOverviewWidget;
