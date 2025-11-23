import React, { useState, useMemo } from 'react';
import type { Bill, Supplier, User, Language } from '../types';
import { BillStatus, Role } from '../types';
import StatsCard from './StatsCard';
import ConfirmationModal from './ConfirmationModal';
import { PlusIcon, MagnifyingGlassIcon, BanknotesIcon, ExclamationTriangleIcon, ClockIcon, TrashIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface AccountsPayableViewProps {
    bills: Bill[];
    suppliers: Supplier[];
    currentUser: User;
    onAddBillClick: () => void;
    onImportBillsClick: () => void;
    onPayBillClick: (bill: Bill) => void; // This will now open the record payment modal
    onDeleteBill: (billId: string) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
}

type StatusFilter = 'All' | 'Due' | 'Overdue' | 'Paid';
type CardFilter = 'total' | 'overdue' | 'dueSoon' | null;

const AccountsPayableView: React.FC<AccountsPayableViewProps> = ({ bills, suppliers, currentUser, onAddBillClick, onImportBillsClick, onPayBillClick, onDeleteBill, t, language }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [cardFilter, setCardFilter] = useState<CardFilter>(null);
    const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);
    const canWrite = currentUser.permissions?.accounts_payable.write;
    const canDelete = currentUser.permissions?.accounts_payable.delete;

    const enrichedBills = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Compare dates only
        return bills.map(bill => {
            let status = bill.status;
            if (bill.status === BillStatus.DUE && new Date(bill.dueDate) < now) {
                status = BillStatus.OVERDUE;
            }
            return { ...bill, status };
        });
    }, [bills]);
    
    const stats = useMemo(() => {
        const unpaid = enrichedBills.filter(b => b.status !== BillStatus.PAID);
        const totalOwed = unpaid.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
        const overdue = unpaid.filter(b => b.status === BillStatus.OVERDUE);
        const overdueAmount = overdue.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);

        const dueSoon = unpaid.filter(b => {
            const dueDate = new Date(b.dueDate);
            dueDate.setHours(0,0,0,0);
            return dueDate >= today && dueDate <= next7Days;
        });
        const dueSoonAmount = dueSoon.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

        return { totalOwed, overdueAmount, dueSoonAmount };
    }, [enrichedBills]);

    const filteredBills = useMemo(() => {
        if (cardFilter) {
            const unpaid = enrichedBills.filter(b => b.status !== BillStatus.PAID);
            const today = new Date();
            today.setHours(0,0,0,0);

            switch(cardFilter) {
                case 'total': return unpaid;
                case 'overdue': return unpaid.filter(b => b.status === BillStatus.OVERDUE);
                case 'dueSoon':
                    const next7Days = new Date(today);
                    next7Days.setDate(today.getDate() + 7);
                    return unpaid.filter(b => {
                        const dueDate = new Date(b.dueDate);
                        dueDate.setHours(0,0,0,0);
                        return dueDate >= today && dueDate <= next7Days;
                    });
                default: return [];
            }
        }

        return enrichedBills.filter(bill => {
            const lowercasedQuery = searchQuery.toLowerCase();
            const matchesSearch = !lowercasedQuery ||
                bill.invoiceNumber.toLowerCase().includes(lowercasedQuery) ||
                (supplierMap.get(bill.supplierId) || '').toLowerCase().includes(lowercasedQuery);

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Due' && bill.status === BillStatus.DUE) ||
                (statusFilter === 'Overdue' && bill.status === BillStatus.OVERDUE) ||
                (statusFilter === 'Paid' && bill.status === BillStatus.PAID);
            
            return matchesSearch && matchesStatus;
        });
    }, [enrichedBills, searchQuery, statusFilter, supplierMap, cardFilter]);

    const getStatusInfo = (status: BillStatus) => {
        switch(status) {
            case BillStatus.PAID: return { text: t('bill_status_paid'), color: 'bg-green-100 text-green-800' };
            case BillStatus.OVERDUE: return { text: t('bill_status_overdue'), color: 'bg-red-100 text-red-800' };
            case BillStatus.DUE: return { text: t('bill_status_due'), color: 'bg-yellow-100 text-yellow-800' };
            default: return { text: status, color: 'bg-gray-100 text-gray-800' };
        }
    };
    
    const handleCardFilter = (filter: CardFilter) => {
        setCardFilter(current => current === filter ? null : filter);
    }
    
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title={t('total_owed')} value={`฿${stats.totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<BanknotesIcon className="h-6 w-6" />} color="text-orange-500" isClickable onClick={() => handleCardFilter('total')} className={cardFilter === 'total' ? 'ring-2 ring-primary' : ''} />
                <StatsCard title={t('overdue_bills')} value={`฿${stats.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<ExclamationTriangleIcon className="h-6 w-6" />} color="text-red-500" isClickable onClick={() => handleCardFilter('overdue')} className={cardFilter === 'overdue' ? 'ring-2 ring-primary' : ''} />
                <StatsCard title={t('due_in_days', {days: 7})} value={`฿${stats.dueSoonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<ClockIcon className="h-6 w-6" />} color="text-blue-500" isClickable onClick={() => handleCardFilter('dueSoon')} className={cardFilter === 'dueSoon' ? 'ring-2 ring-primary' : ''} />
            </div>

            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-text-primary">{t('bills')}</h3>
                        {cardFilter && (
                            <button onClick={() => setCardFilter(null)} className="text-xs font-semibold text-primary hover:underline">
                                {t('clear_filter')}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={t('search_invoice_or_supplier')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-background"
                                disabled={!!cardFilter}
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                            className="block w-full sm:w-auto pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-background"
                             disabled={!!cardFilter}
                        >
                            <option value="All">{t('all_statuses')}</option>
                            <option value="Due">{t('bill_status_due')}</option>
                            <option value="Overdue">{t('bill_status_overdue')}</option>
                            <option value="Paid">{t('bill_status_paid')}</option>
                        </select>
                        {canWrite && (
                            <>
                                <button onClick={onImportBillsClick} className="flex items-center gap-2 bg-blue-500 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-600">
                                    <ArrowUpTrayIcon className="h-5 w-5" />
                                    {t('import_bills')}
                                </button>
                                <button onClick={onAddBillClick} className="flex items-center gap-2 bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-blue-800">
                                    <PlusIcon className="h-5 w-5" />
                                    {t('add_bill')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('suppliers')}</th>
                                <th scope="col" className="px-6 py-3">{t('invoice_number')}</th>
                                <th scope="col" className="px-6 py-3">{t('due_date')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('amount')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('balance_due')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('status')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBills.map(bill => {
                                const statusInfo = getStatusInfo(bill.status);
                                const balanceDue = bill.amount - bill.paidAmount;
                                return (
                                <tr key={bill.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{supplierMap.get(bill.supplierId) || 'Unknown'}</td>
                                    <td className="px-6 py-4">{bill.invoiceNumber}</td>
                                    <td className={`px-6 py-4 ${bill.status === BillStatus.OVERDUE ? 'text-red-600 font-bold' : ''}`}>{new Date(bill.dueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right font-semibold">฿{bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-600">฿{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {bill.status !== BillStatus.PAID && canWrite && (
                                                <button onClick={() => onPayBillClick(bill)} className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">
                                                    {t('record_payment')}
                                                </button>
                                            )}
                                            {canDelete && (
                                                 <button onClick={() => setBillToDelete(bill)} className="text-red-600 hover:text-red-800 p-1" title={t('delete_bill_title')}>
                                                    <TrashIcon className="h-4 w-4"/>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {filteredBills.length === 0 && (
                        <div className="text-center p-12 text-text-secondary">
                            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_bills_found')}</p>
                            <p className="text-sm mt-1">{t('try_adjusting_filters')}</p>
                        </div>
                    )}
                </div>
            </div>
             <ConfirmationModal
                isOpen={!!billToDelete}
                onClose={() => setBillToDelete(null)}
                onConfirm={() => {
                    if(billToDelete) onDeleteBill(billToDelete.id);
                    setBillToDelete(null);
                }}
                title={t('delete_bill_title')}
                message={t('delete_bill_message', {invoiceNumber: billToDelete?.invoiceNumber || ''})}
                t={t}
            />
        </div>
    );
};

export default AccountsPayableView;