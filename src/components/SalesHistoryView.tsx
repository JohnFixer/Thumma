import React, { useState, useMemo } from 'react';
import type { Transaction, User, Language, StoreSettings, PaymentMethod } from '../types';
import { Role, PaymentStatus } from '../types';
import { MagnifyingGlassIcon, PrinterIcon, TrashIcon, ClipboardDocumentListIcon, PencilIcon, BackspaceIcon, ArrowUturnLeftIcon } from './icons/HeroIcons';
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
}

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ transactions, currentUser, onDeleteTransaction, onReceivePaymentClick, onEditPastInvoiceClick, onUndoConsolidationClick, storeSettings, t, language }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [transactionToView, setTransactionToView] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const canWrite = currentUser.permissions?.sales_history.write;
    const canDelete = currentUser.permissions?.sales_history.delete;

    const filteredTransactions = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!lowercasedQuery) {
            return sorted;
        }
        return sorted.filter(t =>
            t.id.toLowerCase().includes(lowercasedQuery) ||
            t.customerName.toLowerCase().includes(lowercasedQuery) ||
            t.operator.toLowerCase().includes(lowercasedQuery)
        );
    }, [transactions, searchQuery]);

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

    return (
        <>
            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">{t('sales_and_invoices')}</h3>
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
                                    <th scope="col" className="px-6 py-3">{t('transaction_id')}</th>
                                    <th scope="col" className="px-6 py-3">{t('date')}</th>
                                    <th scope="col" className="px-6 py-3">{t('customer')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('total')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('amount_paid')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('balance_due')}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{t('status')}</th>
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