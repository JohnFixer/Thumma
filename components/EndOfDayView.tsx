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
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
        const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        const mockReport: ShiftReport = {
            id: 'current-shift',
            startTime: lastShiftEndTime.toISOString(),
            endTime: new Date().toISOString(),
            closedByUserId: currentUser.id,
            totalSales,
            totalProfit,
            totalTransactions,
            paymentMethodBreakdown,
            topSellingItems,
            transactionIds: currentShiftTransactions.map(t => t.id),
        };

        return { report: mockReport, profitMargin, avgTransactionValue, hasTransactions: currentShiftTransactions.length > 0 };
    }, [transactions, shiftReports, productCostMap, currentUser.id]);

    const handleConfirmClose = () => {
        setIsConfirmModalOpen(false);
        onCloseShift();
    };
    
    const PaymentBreakdownBar: React.FC<{ method: string; value: number; total: number; color: string }> = ({ method, value, total, color }) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-text-primary">{method}</span>
                    <span className="font-semibold">฿{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2.5">
                    <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-surface rounded-lg shadow p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">{t('end_of_day')}</h2>
                        <p className="text-text-secondary mt-1">Summary of sales since the last shift was closed.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            disabled={!currentShiftData.hasTransactions}
                            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {t('view_report')}
                        </button>
                        <button
                            onClick={() => setIsConfirmModalOpen(true)}
                            disabled={!currentShiftData.hasTransactions}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-md hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                           {t('close_shift')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title={t('total_sales')} value={`฿${currentShiftData.report.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<CurrencyDollarIcon className="h-6 w-6" />} color="text-green-500" />
                    <StatsCard title={t('total_profit')} value={`฿${currentShiftData.report.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<BanknotesIcon className="h-6 w-6" />} color="text-blue-500" />
                    <StatsCard title={t('profit_margin')} value={`${currentShiftData.profitMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`} icon={<ArrowTrendingUpIcon className="h-6 w-6" />} color="text-purple-500" />
                    <StatsCard title={t('avg_transaction')} value={`฿${currentShiftData.avgTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<TicketIcon className="h-6 w-6" />} color="text-yellow-500" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-text-primary p-4 border-b">{t('sales_by_payment_method')}</h3>
                        <div className="p-4 space-y-4">
                            <PaymentBreakdownBar method="Cash" value={currentShiftData.report.paymentMethodBreakdown.cash} total={currentShiftData.report.totalSales} color="bg-green-500" />
                            <PaymentBreakdownBar method="Card" value={currentShiftData.report.paymentMethodBreakdown.card} total={currentShiftData.report.totalSales} color="bg-blue-500" />
                            <PaymentBreakdownBar method="Bank Transfer" value={currentShiftData.report.paymentMethodBreakdown.bankTransfer} total={currentShiftData.report.totalSales} color="bg-purple-500" />
                        </div>
                    </div>
                    <div className="bg-surface rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-text-primary p-4 border-b">{t('top_selling_items')} (by quantity)</h3>
                         {currentShiftData.report.topSellingItems.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {currentShiftData.report.topSellingItems.map(item => (
                                    <li key={item.variantId} className="p-3 flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-medium text-text-primary">{item.productName[language]} ({item.variantSize})</p>
                                            <p className="text-xs text-text-secondary">Sold: {item.quantitySold} units</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">฿{item.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-4 text-text-secondary">No sales recorded in this shift yet.</p>
                        )}
                    </div>
                </div>

            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmClose}
                title={t('close_shift_confirm_title')}
                message={t('close_shift_confirm_message')}
                t={t}
            />
            <ShiftReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                report={currentShiftData.report}
                user={currentUser}
                t={t}
                language={language}
            />
        </>
    );
};

export default EndOfDayView;