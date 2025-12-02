import React, { useMemo } from 'react';
import type { Transaction } from '../../types';
import { PaymentStatus } from '../../types';
import type { TranslationKey } from '../../translations';
import { BanknotesIcon, CreditCardIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from '../icons/HeroIcons';

interface DailySalesOverviewWidgetProps {
    transactions: Transaction[];
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    onNavigate: (view: string, state?: any) => void;
}

const DailySalesOverviewWidget: React.FC<DailySalesOverviewWidgetProps> = ({ transactions, t, onNavigate }) => {
    const stats = useMemo(() => {
        const today = new Date().toDateString();
        const todayTransactions = transactions.filter(tx => new Date(tx.date).toDateString() === today);

        const totalSales = todayTransactions.reduce((sum, tx) => sum + tx.total, 0);

        const cashSales = todayTransactions
            .filter(tx => tx.paymentMethod === 'Cash' && tx.payment_status !== PaymentStatus.UNPAID)
            .reduce((sum, tx) => sum + tx.total, 0);

        const cardSales = todayTransactions
            .filter(tx => tx.paymentMethod === 'Card' && tx.payment_status !== PaymentStatus.UNPAID)
            .reduce((sum, tx) => sum + tx.total, 0);

        const bankTransferSales = todayTransactions
            .filter(tx => tx.paymentMethod === 'Bank Transfer' && tx.payment_status !== PaymentStatus.UNPAID)
            .reduce((sum, tx) => sum + tx.total, 0);

        const newAR = todayTransactions
            .filter(tx => tx.payment_status === PaymentStatus.UNPAID)
            .reduce((sum, tx) => sum + tx.total, 0);

        return { totalSales, cashSales, cardSales, bankTransferSales, newAR };
    }, [transactions]);

    const formatCurrency = (value: number) => `฿${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="bg-surface rounded-lg shadow p-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('daily_sales_overview')}</h3>
            <div className="text-center mb-4 pb-4 border-b">
                <p className="text-sm font-medium text-text-secondary">{t('total_sales_today')}</p>
                <p className="text-4xl font-bold text-green-600 my-2">{formatCurrency(stats.totalSales)}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div
                    className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onNavigate('sales_history', { filter: 'cash_today' })}
                >
                    <div className="p-2 bg-green-100 rounded-full text-green-600"><BanknotesIcon className="h-5 w-5" /></div>
                    <div>
                        <p className="text-text-secondary">{t('cash_sales')}</p>
                        <p className="font-bold text-text-primary">{formatCurrency(stats.cashSales)}</p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onNavigate('sales_history', { filter: 'card_today' })}
                >
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600"><CreditCardIcon className="h-5 w-5" /></div>
                    <div>
                        <p className="text-text-secondary">{t('card_sales')}</p>
                        <p className="font-bold text-text-primary">{formatCurrency(stats.cardSales)}</p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onNavigate('sales_history', { filter: 'transfer_today' })}
                >
                    <div className="p-2 bg-purple-100 rounded-full text-purple-600"><CurrencyDollarIcon className="h-5 w-5" /></div>
                    <div>
                        <p className="text-text-secondary">{t('bank_transfer_sales')}</p>
                        <p className="font-bold text-text-primary">{formatCurrency(stats.bankTransferSales)}</p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onNavigate('accounts_receivable', { filter: 'today' })}
                >
                    <div className="p-2 bg-yellow-100 rounded-full text-yellow-600"><ClipboardDocumentListIcon className="h-5 w-5" /></div>
                    <div>
                        <p className="text-text-secondary">{t('ar_new')}</p>
                        <p className="font-bold text-text-primary">{formatCurrency(stats.newAR)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailySalesOverviewWidget;