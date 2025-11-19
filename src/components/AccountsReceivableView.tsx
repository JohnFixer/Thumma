import React, { useState, useMemo } from 'react';
import type { Transaction, Customer, User, Language } from '../types';
import { PaymentStatus, Role } from '../types';
import StatsCard from './StatsCard';
import { BanknotesIcon, ExclamationTriangleIcon, UserGroupIcon, TrashIcon, ArrowDownTrayIcon, PlusIcon, ClipboardDocumentListIcon, PencilIcon, BackspaceIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface AccountsReceivableViewProps {
    transactions: Transaction[];
    customers: Customer[];
    currentUser: User;
    onReceivePaymentClick: (transaction: Transaction) => void;
    onCreateConsolidatedInvoice: (customer: Customer, transactions: Transaction[]) => void;
    onRecordPastInvoiceClick: () => void;
    onImportPastInvoicesClick: () => void;
    onEditPastInvoiceClick: (transaction: Transaction) => void;
    onUndoConsolidationClick: (transaction: Transaction) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
    viewState: any;
    onNavigate: (view: string, state?: any) => void;
}

const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({ 
    transactions, customers, currentUser, onReceivePaymentClick, onCreateConsolidatedInvoice, 
    onRecordPastInvoiceClick, onImportPastInvoicesClick, onEditPastInvoiceClick, onUndoConsolidationClick, t, language,
    viewState, onNavigate
}) => {
    const [groupByCustomer, setGroupByCustomer] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<Record<string, Set<string>>>({});

    const canManage = useMemo(() => 
        currentUser.role.includes(Role.ADMIN) || currentUser.role.includes(Role.ACCOUNT_MANAGER),
    [currentUser]);

    const isTodayFilterActive = viewState?.filter === 'today';

    const unpaidTransactions = useMemo(() => {
        let filtered = transactions.filter(tx => tx.payment_status === PaymentStatus.UNPAID || tx.payment_status === PaymentStatus.PARTIALLY_PAID || tx.id.startsWith('C-INV-'));

        if (isTodayFilterActive) {
            const today = new Date().toDateString();
            filtered = filtered.filter(tx => tx.payment_status === PaymentStatus.UNPAID && new Date(tx.date).toDateString() === today);
        }

        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions, isTodayFilterActive]);

    const totalReceivables = useMemo(() => 
        unpaidTransactions.reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0),
    [unpaidTransactions]);

    const groupedByCustomer = useMemo(() => {
        const groups: Record<string, { customer: Customer, transactions: Transaction[], total_due: number }> = {};
        for (const tx of unpaidTransactions) {
            if (!tx.customerId) continue;
            if (!groups[tx.customerId]) {
                const customer = customers.find(c => c.id === tx.customerId);
                if (customer) {
                    groups[tx.customerId] = { customer, transactions: [], total_due: 0 };
                }
            }
            if (groups[tx.customerId]) {
                groups[tx.customerId].transactions.push(tx);
                groups[tx.customerId].total_due += (tx.total - tx.paid_amount);
            }
        }
        return Object.values(groups).sort((a,b) => b.total_due - a.total_due);
    }, [unpaidTransactions, customers]);

    const handleSelectInvoice = (customerId: string, transactionId: string) => {
        setSelectedInvoices(prev => {
            const newSelection = { ...prev };
            if (!newSelection[customerId]) {
                newSelection[customerId] = new Set();
            }
            if (newSelection[customerId].has(transactionId)) {
                newSelection[customerId].delete(transactionId);
            } else {
                newSelection[customerId].add(transactionId);
            }
            return newSelection;
        });
    };

    const handleCreateConsolidated = (customer: Customer) => {
        const selectedIds = selectedInvoices[customer.id] || new Set();
        if (selectedIds.size < 2) {
            alert('Please select at least two invoices to consolidate.');
            return;
        }
        const txsToConsolidate = unpaidTransactions.filter(tx => selectedIds.has(tx.id));
        onCreateConsolidatedInvoice(customer, txsToConsolidate);
        setSelectedInvoices(prev => ({ ...prev, [customer.id]: new Set() }));
    };

    const getStatusInfo = (tx: Transaction) => {
        if (tx.id.startsWith('C-INV-') && tx.payment_status === PaymentStatus.UNPAID) {
            return { text: 'Consolidated', color: 'bg-purple-100 text-purple-800' };
        }
        if (tx.payment_status === PaymentStatus.UNPAID && tx.due_date && new Date(tx.due_date) < new Date()) {
            return { text: t('overdue'), color: 'bg-red-100 text-red-800' };
        }
        switch (tx.payment_status) {
            case PaymentStatus.UNPAID: return { text: t('unpaid'), color: 'bg-yellow-100 text-yellow-800' };
            case PaymentStatus.PARTIALLY_PAID: return { text: t('partially_paid'), color: 'bg-blue-100 text-blue-800' };
            default: return { text: tx.payment_status, color: 'bg-gray-100 text-gray-800' };
        }
    };

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard title={t('total_receivables')} value={`฿${totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<BanknotesIcon className="h-6 w-6" />} color="text-orange-500" />
                <StatsCard title="Customers with Debt" value={groupedByCustomer.length.toLocaleString()} icon={<UserGroupIcon className="h-6 w-6" />} color="text-blue-500" />
            </div>

            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{t('accounts_receivable')}</h3>
                        {isTodayFilterActive && (
                            <button onClick={() => onNavigate('accounts_receivable')} className="text-xs font-semibold text-primary hover:underline">
                                {t('clear_filter')}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {canManage && (
                            <>
                                <button onClick={onRecordPastInvoiceClick} className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md bg-secondary text-white hover:bg-orange-700">
                                    <PlusIcon className="h-4 w-4" /> {t('record_past_invoice')}
                                </button>
                                <button onClick={onImportPastInvoicesClick} className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600">
                                    <ArrowDownTrayIcon className="h-4 w-4" /> {t('import_past_invoices')}
                                </button>
                            </>
                        )}
                        <button onClick={() => setGroupByCustomer(!groupByCustomer)} className="px-4 py-2 bg-gray-200 text-sm font-medium rounded-md hover:bg-gray-300">
                            {groupByCustomer ? t('show_all_invoices') : t('group_by_customer')}
                        </button>
                    </div>
                </div>
                {groupByCustomer ? (
                    <div className="divide-y">
                        {groupedByCustomer.map(({ customer, transactions, total_due }) => (
                            <div key={customer.id} className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-lg">{customer.name}</p>
                                        <p className="text-sm text-text-secondary">{transactions.length} Invoices - Total Due: <span className="font-semibold text-red-600">฿{total_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                    </div>
                                    <button
                                        onClick={() => handleCreateConsolidated(customer)}
                                        disabled={(selectedInvoices[customer.id]?.size || 0) < 2}
                                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-md hover:bg-blue-800 disabled:bg-gray-300"
                                    >
                                        {t('create_consolidated_invoice')}
                                    </button>
                                </div>
                                <div className="mt-2 space-y-1 pl-4 border-l-2">
                                    {transactions.map(tx => (
                                        <div key={tx.id} className="flex items-center gap-2 p-1 rounded hover:bg-background">
                                            <input type="checkbox" checked={selectedInvoices[customer.id]?.has(tx.id)} onChange={() => handleSelectInvoice(customer.id, tx.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                            <p className="flex-1 text-sm font-mono">{tx.id}</p>
                                            <p className="text-sm">Balance: <span className="font-semibold">฿{(tx.total - tx.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                            <p className="text-xs text-text-secondary">Due: {tx.due_date ? new Date(tx.due_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                           <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Invoice ID</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3 text-right">{t('total')}</th>
                                    <th className="px-6 py-3 text-right">{t('balance_due')}</th>
                                    <th className="px-6 py-3 text-center">{t('status')}</th>
                                    <th className="px-6 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidTransactions.map(tx => {
                                    const statusInfo = getStatusInfo(tx);
                                    const isPastInvoice = tx.id.startsWith('PAST-');
                                    const isConsolidated = tx.id.startsWith('C-INV-');
                                    return (
                                        <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-xs">{tx.id}</td>
                                            <td className="px-6 py-4 font-medium">{tx.customerName}</td>
                                            <td className="px-6 py-4 text-right">฿{tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">฿{(tx.total - tx.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {canManage && <button onClick={() => onReceivePaymentClick(tx)} className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">{t('receive_payment')}</button>}
                                                    {isPastInvoice && canManage && (
                                                        <button onClick={() => onEditPastInvoiceClick(tx)} className="text-primary hover:text-blue-700 p-1" title="Edit Past Invoice"><PencilIcon className="h-4 w-4" /></button>
                                                    )}
                                                    {isConsolidated && canManage && (
                                                        <button onClick={() => onUndoConsolidationClick(tx)} className="text-yellow-600 hover:text-yellow-800 p-1" title={t('undo_consolidation')}><BackspaceIcon className="h-4 w-4" /></button>
                                                    )}
                                                    {tx.file_url && (
                                                        <a href={tx.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary p-1" title="View attached invoice">
                                                            <ClipboardDocumentListIcon className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountsReceivableView;