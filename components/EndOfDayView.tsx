
import React, { useMemo, useState } from 'react';
import type { Transaction, Product, ShiftReport, User, Language, CartItem } from '../types.ts';
import StatsCard from './StatsCard.tsx';
import { CurrencyDollarIcon, BanknotesIcon, ArrowTrendingUpIcon, TicketIcon } from './icons/HeroIcons.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import ShiftReportModal from './ShiftReportModal.tsx';
import type { TranslationKey } from '../translations.ts';

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
                