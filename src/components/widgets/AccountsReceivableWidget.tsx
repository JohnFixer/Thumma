import React, { useMemo } from 'react';
import type { Transaction, Language } from '../../types';
import type { TranslationKey } from '../../translations';
import { PaymentStatus } from '../../types';
import { DocumentTextIcon, ExclamationCircleIcon } from '../icons/HeroIcons';

interface AccountsReceivableWidgetProps {
    transactions: Transaction[];
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
    onNavigate: (view: string, state?: any) => void;
}

interface ReceivableItem {
    id: string;
    customerName: string;
    total: number;
    paidAmount: number;
    outstanding: number;
    dueDate?: string;
    isOverdue: boolean;
}

const AccountsReceivableWidget: React.FC<AccountsReceivableWidgetProps> = ({
    transactions,
    t,
    language,
    onNavigate
}) => {
    const { receivables, totalOutstanding, overdueCount } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const unpaidInvoices: ReceivableItem[] = transactions
            .filter(tx =>
                tx.payment_status === PaymentStatus.UNPAID ||
                tx.payment_status === PaymentStatus.PARTIALLY_PAID
            )
            .map(tx => {
                const outstanding = tx.total - tx.paid_amount;
                const dueDate = tx.due_date ? new Date(tx.due_date) : undefined;
                const isOverdue = dueDate ? dueDate < today : false;

                return {
                    id: tx.id,
                    customerName: tx.customerName,
                    total: tx.total,
                    paidAmount: tx.paid_amount,
                    outstanding,
                    dueDate: tx.due_date,
                    isOverdue,
                };
            })
            .sort((a, b) => {
                // Sort overdue first, then by due date
                if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
                if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                return 0;
            })
            .slice(0, 5);

        const totalOutstanding = transactions
            .filter(tx =>
                tx.payment_status === PaymentStatus.UNPAID ||
                tx.payment_status === PaymentStatus.PARTIALLY_PAID
            )
            .reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0);

        const overdueCount = unpaidInvoices.filter(item => item.isOverdue).length;

        return { receivables: unpaidInvoices, totalOutstanding, overdueCount };
    }, [transactions]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return t('no_due_date');
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-surface rounded-lg shadow p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-orange-500" />
                    {t('accounts_receivable')}
                </h3>
                {overdueCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        {overdueCount} {t('overdue')}
                    </span>
                )}
            </div>

            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-text-secondary">{t('total_outstanding')}</p>
                <p className="text-2xl font-bold text-orange-600">
                    ฿{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>

            {receivables.length > 0 ? (
                <div className="space-y-2">
                    {receivables.map((item) => (
                        <div
                            key={item.id}
                            className={`p-3 rounded-md border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${item.isOverdue ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-background'
                                }`}
                            onClick={() => onNavigate('accounts_receivable')}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex-1">
                                    <p className="font-medium text-text-primary">{item.customerName}</p>
                                    <p className="text-xs text-text-secondary">
                                        {t('invoice')} #{item.id}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-orange-600">
                                        ฿{item.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    {item.paidAmount > 0 && (
                                        <p className="text-xs text-green-600">
                                            ฿{item.paidAmount.toLocaleString()} {t('paid')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className={item.isOverdue ? 'text-red-600 font-semibold' : 'text-text-secondary'}>
                                    {item.isOverdue && `${t('overdue')}: `}
                                    {t('due')}: {formatDate(item.dueDate)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {transactions.filter(tx =>
                        tx.payment_status === PaymentStatus.UNPAID ||
                        tx.payment_status === PaymentStatus.PARTIALLY_PAID
                    ).length > 5 && (
                            <button
                                onClick={() => onNavigate('accounts_receivable')}
                                className="w-full mt-2 py-2 text-sm text-primary hover:text-blue-800 font-medium"
                            >
                                {t('view_all_receivables')} →
                            </button>
                        )}
                </div>
            ) : (
                <div className="text-center py-8 text-text-secondary">
                    <p>{t('no_outstanding_invoices')}</p>
                </div>
            )}
        </div>
    );
};

export default AccountsReceivableWidget;
