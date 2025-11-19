import React, { useMemo } from 'react';
import type { Transaction } from '../../types';
import type { TranslationKey } from '../../translations';
import StatsCard from '../StatsCard';
import { CurrencyDollarIcon, ArrowTrendingUpIcon } from '../icons/HeroIcons';

interface SalesOverviewWidgetProps {
  transactions: Transaction[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  onNavigate: (view: string) => void;
}

const SalesOverviewWidget: React.FC<SalesOverviewWidgetProps> = ({ transactions, t, onNavigate }) => {
    const todaySales = useMemo(() => {
        const today = new Date().toDateString();
        return transactions
            .filter(tx => new Date(tx.date).toDateString() === today)
            .reduce((sum, tx) => sum + tx.total, 0);
    }, [transactions]);

    const monthSales = useMemo(() => {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        return transactions
            .filter(tx => {
                const txDate = new Date(tx.date);
                return txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear;
            })
            .reduce((sum, tx) => sum + tx.total, 0);
    }, [transactions]);

    return (
        <div className="bg-surface rounded-lg shadow p-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('sales_overview')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatsCard 
                    title={t('sales_today')}
                    value={`฿${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<CurrencyDollarIcon className="h-6 w-6"/>}
                    color="text-green-500"
                    onClick={() => onNavigate('sales_history')}
                    isClickable
                />
                <StatsCard 
                    title={t('sales_this_month')}
                    value={`฿${monthSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<ArrowTrendingUpIcon className="h-6 w-6"/>}
                    color="text-blue-500"
                    onClick={() => onNavigate('sales_history')}
                    isClickable
                />
            </div>
        </div>
    );
};

export default SalesOverviewWidget;
