

import React, { useMemo, useState } from 'react';
import type { Transaction, Product, ShiftReport, User, Language, CartItem } from '../types';
import StatsCard from './StatsCard';
import { CurrencyDollarIcon, BanknotesIcon, ArrowTrendingUpIcon, TicketIcon } from './icons/HeroIcons';
import ConfirmationModal from './ConfirmationModal';
import ShiftReportModal from './ShiftReportModal';
import type { TranslationKey } from '../translations';

interface EndOfDayViewProps {
    transactions: Transaction[];
    products: Product[];
    shiftReports: ShiftReport[];
    currentUser: User;
    onCloseShift: () => void;
    t: (key: TranslationKey) => string;
    language: Language;
}

const EndOfDayView: React.FC<EndOfDayViewProps> = ({ transactions, products, shiftReports, currentUser, onCloseShift, t, language }) => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const productCostMap = useMemo(() => {
        const map = new Map<string, number>();
        products.forEach(p => {
            p.variants.forEach(v => {
                map.set(v.id, v.price.cost);
            });
        });
        return map;
    }, [products]);

    const currentShiftData = useMemo(() => {
        const lastShiftEndTime = shiftReports.length > 0 ? new Date(shiftReports[0].endTime) : new Date(0);
        const currentShiftTransactions = transactions.filter(t => !t.shiftId && new Date(t.date) > lastShiftEndTime);

        let totalSales = 0;
        let totalProfit = 0;
        const paymentMethodBreakdown = { cash: 0, card: 0, bankTransfer: 0 };
        const itemSales: { [variantId: string]: { quantity: number; sales: number; profit: number; name: any; size: string; productId: string } } = {};

        for (const tx of currentShiftTransactions) {
            totalSales += tx.total;
            switch (tx.paymentMethod) {
                case 'Cash': paymentMethodBreakdown.cash += tx.total; break;
                case 'Card': paymentMethodBreakdown.card += tx.total; break;
                case 'Bank Transfer': paymentMethodBreakdown.bankTransfer += tx.total; break;
            }

            const taxRatio = tx.subtotal > 0 ? tx.total / tx.subtotal : 1;
            
            for (const item of tx.items) {
                const cost = item.isOutsourced && item.outsourcedCost ? item.outsourcedCost : productCostMap.get(item.variantId) || 0;
                const price = tx.customerType === 'government' ? item.price.government : tx.customerType === 'contractor' ? item.price.contractor : item.price.walkIn;
                const salePrice = (price * item.quantity) * taxRatio;
                const profit = salePrice - (item.quantity * cost);
                totalProfit += profit;

                if (!itemSales[item.variantId]) {
                    itemSales[item.variantId] = { quantity: 0, sales: 0, profit: 0, name: item.name, size: item.size, productId: item.productId };
                }
                itemSales[item.variantId].quantity += item.quantity;
                itemSales[item.variantId].sales += salePrice;
                itemSales[item.variantId].profit += profit;
            }
        }
        
        const topSellingItems = Object.entries(itemSales)
            .sort(([, a], [, b]) => b.quantity - a.quantity)
            .slice(0, 5)
            .map(([variantId, data]) => ({
                productId: data.productId,
                variantId,
                productName: data.name,
                variantSize: data.size,
                quantitySold: data.quantity,
                totalSales: data.sales,
                totalProfit: data.profit,
            }));

        const totalTransactions = currentShiftTransactions.length;
        const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        return {
            totalSales,
            totalProfit,
            totalTransactions,
            avgTransactionValue,
            profitMargin,
            paymentMethodBreakdown,
            topSellingItems,
            transactions: currentShiftTransactions,
            startTime: lastShiftEndTime,
        };
    }, [transactions, products, shiftReports, productCostMap]);

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-surface rounded-lg shadow p-6">
                    <div className="flex flex-wrap justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">{t('end_of_day')}</h2>
                            <p className="text-text-secondary mt-1">Summary of sales for the current open shift.</p>
                            <p className="text-xs text-text-secondary mt-1">Started since: {currentShiftData.startTime.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => setIsConfirmModalOpen(true)}
                            disabled={currentShiftData.transactions.length === 0}
                            className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {t('close_shift')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title={t('total_sales')} value={`฿${currentShiftData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<CurrencyDollarIcon className="h-6 w-6" />} color="text-green-500" />
                    <StatsCard title={t('total_profit')} value={`฿${currentShiftData.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<ArrowTrendingUpIcon className="h-6 w-6" />} color="text-blue-500" />
                    <StatsCard title="Transactions" value={currentShiftData.totalTransactions.toLocaleString()} icon={<TicketIcon className="h-6 w-6" />} color="text-purple-500" />
                    <StatsCard title={t('profit_margin')} value={`${currentShiftData.profitMargin.toFixed(2)}%`} icon={<BanknotesIcon className="h-6 w-6" />} color="text-indigo-500" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface rounded-lg shadow p-4">
                        <h3 className="font-semibold text-text-primary mb-3">{t('sales_by_payment_method')}</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Cash</span><span className="font-semibold">฿{currentShiftData.paymentMethodBreakdown.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between"><span>Card</span><span className="font-semibold">฿{currentShiftData.paymentMethodBreakdown.card.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between"><span>Bank Transfer</span><span className="font-semibold">฿{currentShiftData.paymentMethodBreakdown.bankTransfer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        </div>
                    </div>
                     <div className="bg-surface rounded-lg shadow p-4">
                        <h3 className="font-semibold text-text-primary mb-3">{t('top_selling_items')}</h3>
                        {currentShiftData.topSellingItems.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {currentShiftData.topSellingItems.map(item => (
                                    <li key={item.variantId} className="flex justify-between">
                                        <span>{item.productName[language]} ({item.variantSize})</span>
                                        <span className="font-bold">{item.quantitySold} units</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-center text-text-secondary py-4">No items sold in this shift yet.</p>
                        )}
                    </div>
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={() => {
                    onCloseShift();
                    setIsConfirmModalOpen(false);
                }}
                title={t('close_shift_confirm_title')}
                message={t('close_shift_confirm_message')}
                confirmText={t('close_shift')}
                t={t}
            />
        </>
    );
};

export default EndOfDayView;
