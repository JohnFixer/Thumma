import React, { useMemo } from 'react';
import type { Bill } from '../../types';
import { BillStatus } from '../../types';
import type { TranslationKey } from '../../translations';
import StatsCard from '../StatsCard';
import { BanknotesIcon, ExclamationTriangleIcon } from '../icons/HeroIcons';

interface AccountsPayableWidgetProps {
  bills: Bill[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  onNavigate: (view: string) => void;
}

const AccountsPayableWidget: React.FC<AccountsPayableWidgetProps> = ({ bills, t, onNavigate }) => {
    const stats = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const unpaidBills = bills.filter(b => b.status !== BillStatus.PAID);
        const totalOwed = unpaidBills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
        const overdueBills = unpaidBills.filter(b => b.status !== BillStatus.PAID && new Date(b.dueDate) < now);
        const overdueAmount = overdueBills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
        return { totalOwed, overdueAmount };
    }, [bills]);

    return (
        <div className="bg-surface rounded-lg shadow p-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('accounts_payable')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatsCard 
                    title={t('total_owed')}
                    value={`฿${stats.totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<BanknotesIcon className="h-6 w-6"/>}
                    color="text-orange-500"
                    onClick={() => onNavigate('accounts_payable')}
                    isClickable
                />
                <StatsCard 
                    title={t('overdue_bills')}
                    value={`฿${stats.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<ExclamationTriangleIcon className="h-6 w-6"/>}
                    color="text-red-500"
                    onClick={() => onNavigate('accounts_payable')}
                    isClickable
                />
            </div>
        </div>
    );
};

export default AccountsPayableWidget;
