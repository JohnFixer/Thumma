import React, { useState, useMemo } from 'react';
import type { Transaction, User, Language, StoreSettings, PaymentMethod } from '../types';
import { Role, PaymentStatus } from '../types';
import { MagnifyingGlassIcon, PrinterIcon, TrashIcon, ClipboardDocumentListIcon, PencilIcon, BackspaceIcon, ArrowUturnLeftIcon, ChevronUpIcon, ChevronDownIcon } from './icons/HeroIcons';
import ReceiptModal from './ReceiptModal';
import ConfirmationModal from './ConfirmationModal';
import type { TranslationKey } from '../translations';

interface SalesHistoryViewProps {
    transactions: Transaction[];
    currentUser: User;
    onDeleteTransaction: (transactionId: string) => void;
    onReceivePaymentClick: (transaction: Transaction) => void;
    onEditPastInvoiceClick: (transaction: Transaction) => void;
    onUndoConsolidationClick: (transaction: Transaction) => void;
    storeSettings: StoreSettings | null;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
    viewState?: any;
    onNavigate?: (view: string, state?: any) => void;
}

type SortKey = 'id' | 'date' | 'customerName' | 'total' | 'paid_amount' | 'balance' | 'status';

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ transactions, currentUser, onDeleteTransaction, onReceivePaymentClick, onEditPastInvoiceClick, onUndoConsolidationClick, storeSettings, t, language, viewState, onNavigate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [transactionToView, setTransactionToView] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    const canWrite = currentUser.permissions?.sales_history.write;
    const canDelete = currentUser.permissions?.sales_history.delete;

    const activeFilter = viewState?.filter;

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const filteredTransactions = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        let result = [...transactions];

        // Apply ViewState Filter
        if (activeFilter) {
            const today = new Date().toDateString();
            if (activeFilter === 'cash_today') {
                result = result.filter(t => new Date(t.date).toDateString() === today && t.paymentMethod === 'Cash' && t.payment_status !== PaymentStatus.UNPAID);
            } else if (activeFilter === 'card_today') {
                result = result.filter(t => new Date(t.date).toDateString() === today && t.paymentMethod === 'Card' && t.payment_status !== PaymentStatus.UNPAID);
            } else if (activeFilter === 'transfer_today') {
                result = result.filter(t => new Date(t.date).toDateString() === today && t.paymentMethod === 'Bank Transfer' && t.payment_status !== PaymentStatus.UNPAID);
            } else if (activeFilter === 'total_today') {
                result = result.filter(t => new Date(t.date).toDateString() === today && t.payment_status !== PaymentStatus.UNPAID);
            }
        }

        if (lowercasedQuery) {
            result = result.filter(t =>
                t.id.toLowerCase().includes(lowercasedQuery) ||
                t.customerName.toLowerCase().includes(lowercasedQuery) ||
                t.operator.toLowerCase().includes(lowercasedQuery)
            );
        }

        return result.sort((a, b) => {
            const { key, direction } = sortConfig;
            let comparison = 0;

            switch (key) {
                case 'id':
                    comparison = a.id.localeCompare(b.id);
                    break;
                case 'date':
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'customerName':
                    comparison = a.customerName.localeCompare(b.customerName);
                    break;
                case 'total':
                    comparison = a.total - b.total;
                    break;
                case 'paid_amount':
                    comparison = a.paid_amount - b.paid_amount;
                    break;
                case 'balance':
                    const balanceA = a.total - a.paid_amount;
                    const balanceB = b.total - b.paid_amount;
                    comparison = balanceA - balanceB;
                    break;
                case 'status':
                    comparison = a.payment_status.localeCompare(b.payment_status);
                    break;
            }

            return direction === 'asc' ? comparison : -comparison;
        });
    }, [transactions, searchQuery, sortConfig, activeFilter]);

    const handleDeleteConfirm = () => {
        if (transactionToDelete) {
            onDeleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
        }
    };

    const getStatusInfo = (transaction: Transaction) => {
        switch (transaction.payment_status) {
            case PaymentStatus.PAID:
                return { text: t('paid'), color: 'bg-green-100 text-green-800' };
            case PaymentStatus.PARTIALLY_PAID:
                return { text: t('partially_paid'), color: 'bg-blue-100 text-blue-800' };
            case PaymentStatus.CONSOLIDATED:
                return { text: t('consolidated'), color: 'bg-gray-100 text-gray-800' };
            case PaymentStatus.UNPAID:
                if (transaction.due_date && new Date(transaction.due_date) < new Date()) {
                    return { text: t('overdue'), color: 'bg-red-100 text-red-800' };
                }
                return { text: t('unpaid'), color: 'bg-yellow-100 text-yellow-800' };
            default:
                return { text: transaction.payment_status, color: 'bg-gray-100 text-gray-800' };
        }
    };

    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4" />; // Placeholder to keep alignment
        return sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />;
    };

    const SortableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey: SortKey, align?: 'left' | 'right' | 'center' }) => (
        <th
            scope="col"
            className={`px-6 py-3 cursor-pointer hover:bg-gray-100 select-none ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
            onClick={() => handleSort(sortKey)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {label}
                {renderSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <>
            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">{t('sales_and_invoices')}</h3>
                            {activeFilter && onNavigate && (
                                <button
                                    onClick={() => onNavigate('sales_history')}
                                    className="text-xs font-semibold text-primary hover:underline bg-blue-50 px-2 py-1 rounded"
                                >
                                    {t('clear_filter')} ({t(activeFilter)})
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-text-secondary">{t('sales_history_desc')}</p>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_sales_history_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {filteredTransactions.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <SortableHeader label={t('transaction_id')} sortKey="id" />
                                    <SortableHeader label={t('date')} sortKey="date" />
                                    <SortableHeader label={t('customer')} sortKey="customerName" />
                                    <SortableHeader label={t('total')} sortKey="total" align="right" />
                                    <SortableHeader label={t('amount_paid')} sortKey="paid_amount" align="right" />
                                    <SortableHeader label={t('balance_due')} sortKey="balance" align="right" />
                                    <SortableHeader label={t('status')} sortKey="status" align="center" />
                                    <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((transaction) => {
                                    const statusInfo = getStatusInfo(transaction);
                                    const balanceDue = transaction.total - transaction.paid_amount;
                                    const isPastInvoice = transaction.id.startsWith('PAST-');
                                    const isConsolidated = transaction.id.startsWith('C-INV-');
                                    return (
                                        <tr key={transaction.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">
                                                {transaction.id}
                                                {transaction.returnedItems && transaction.returnedItems.length > 0 && (
                                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title={t('has_returns')}>
                                                        <ArrowUturnLeftIcon className="h-3 w-3 mr-1" />
                                                        {t('returned')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">{new Date(transaction.date).toLocaleString()}</td>
                                            <td className="px-6 py-4">{transaction.customerName}</td>
                                            <td className="px-6 py-4 text-right font-semibold">฿{transaction.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-right text-green-600">฿{transaction.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className={`px-6 py-4 text-right font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-text-primary'}`}>฿{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    {balanceDue > 0 && transaction.payment_status !== PaymentStatus.CONSOLIDATED && canWrite && (
                                                        <button
                                                            onClick={() => onReceivePaymentClick(transaction)}
                                                            className="text-xs p-1 px-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                                        >
                                                            {t('receive_payment')}
                                                        </button>
                                                    )}
                                                    {isPastInvoice && canWrite && (
                                                        <button onClick={() => onEditPastInvoiceClick(transaction)} className="text-primary hover:text-blue-700 p-1" title={t('edit')}><PencilIcon className="h-4 w-4" /></button>
                                                    )}
                                                    {isConsolidated && canWrite && (
                                                        <button onClick={() => onUndoConsolidationClick(transaction)} className="text-yellow-600 hover:text-yellow-800 p-1" title={t('undo_consolidation')}><BackspaceIcon className="h-4 w-4" /></button>
                                                    )}
                                                    {transaction.file_url && (
                                                        <a href={transaction.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary p-1" title={t('view_attached_invoice')}>
                                                            <ClipboardDocumentListIcon className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                    <button onClick={() => setTransactionToView(transaction)} className="text-primary hover:text-blue-700 p-1" title={t('view_receipt')}><PrinterIcon className="h-4 w-4" /></button>
                                                    {canDelete && <button onClick={() => setTransactionToDelete(transaction)} className="text-red-600 hover:text-red-800 p-1" title={t('delete_transaction')}><TrashIcon className="h-4 w-4" /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center p-12 text-text-secondary">
                            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_transactions_found')}</p>
                            <p className="text-sm mt-1">{t('no_sales_matching_search')}</p>
                        </div>
                    )}
                </div>
            </div>

            <ReceiptModal
                isOpen={!!transactionToView}
                onClose={() => setTransactionToView(null)}
                transaction={transactionToView}
                storeSettings={storeSettings}
                t={t}
                language={language}
                isInvoice={transactionToView?.payment_status === PaymentStatus.UNPAID || transactionToView?.payment_status === PaymentStatus.PARTIALLY_PAID}
            />
            <ConfirmationModal
                isOpen={!!transactionToDelete}
                onClose={() => setTransactionToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={t('delete_transaction_title')}
                message={t('delete_transaction_confirm_message', { transactionId: transactionToDelete?.id || '' })}
                t={t}
            />
        </>
    );
};

export default SalesHistoryView;