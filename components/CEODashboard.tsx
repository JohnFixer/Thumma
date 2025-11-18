import React, { useState, useMemo, useEffect } from 'react';
import type { User, Transaction, Bill, Product, ToDoItem, Language, StoreSettings, Supplier, ProductVariant } from '../types';
import { BillStatus, ProductStatus, PaymentStatus } from '../types';
import StatsCard from './StatsCard';
import { ArrowLeftOnRectangleIcon, BanknotesIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon, CurrencyDollarIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon, LanguageIcon, CheckIcon, ClockIcon, CubeIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import LowStockProductsModal from './LowStockProductsModal';
import BillDetailsModal from './BillDetailsModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import RecordPaymentModal from './PayBillModal';
import { supabase } from '../lib/supabaseClient';


interface CEODashboardProps {
    currentUser: User;
    onLogout: () => void;
    transactions: Transaction[];
    bills: Bill[];
    users: User[];
    products: Product[];
    suppliers: Supplier[];
    storeSettings: StoreSettings | null;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
    onBillUpdated: (updatedBill: Bill) => void;
    showAlert: (title: string, message: string) => void;
}

const CEODashboard: React.FC<CEODashboardProps> = ({ currentUser, onLogout, transactions, bills, users, products, suppliers, storeSettings, t, language, setLanguage, onBillUpdated, showAlert }) => {
    
    // State
    const [todos, setTodos] = useState<ToDoItem[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
    const [postponingTodoId, setPostponingTodoId] = useState<string | null>(null);
    const [billModalData, setBillModalData] = useState<{ isOpen: boolean; title: string; bills: Bill[] }>({ isOpen: false, title: '', bills: [] });
    const [transactionModalData, setTransactionModalData] = useState<{ isOpen: boolean; title: string; transactions: Transaction[] }>({ isOpen: false, title: '', transactions: [] });
    const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
    const [billToRecordPaymentFor, setBillToRecordPaymentFor] = useState<Bill | null>(null);

    // To-Do List Logic
    useEffect(() => {
        try {
            const savedTodos = localStorage.getItem('ceo-todos');
            if (savedTodos) setTodos(JSON.parse(savedTodos));
        } catch (error) { console.error("Failed to load todos", error); }
    }, []);

    const saveTodos = (newTodos: ToDoItem[]) => {
        try {
            setTodos(newTodos);
            localStorage.setItem('ceo-todos', JSON.stringify(newTodos));
        } catch (error) { console.error("Failed to save todos", error); }
    };

    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTodo.trim()) {
            const newItem: ToDoItem = { id: `todo-${Date.now()}`, text: newTodo.trim(), completed: false };
            saveTodos([...todos, newItem]);
            setNewTodo('');
        }
    };

    const handleToggleTodo = (id: string) => {
        saveTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    };

    const handleDeleteTodo = (id: string) => {
        saveTodos(todos.filter(todo => todo.id !== id));
    };
    
    const handlePostponeTodo = (id: string, date: string) => {
        saveTodos(todos.map(todo => todo.id === id ? { ...todo, dueDate: date, completed: false } : todo));
        setPostponingTodoId(null);
    };
    
    const handleRecordPaymentClick = (bill: Bill) => {
        setBillToRecordPaymentFor(bill);
        setIsRecordPaymentModalOpen(true);
    };

    const handleRecordBillPayment = async (billId: string, paymentData: { paymentAmount: number; paymentDate: string; paymentMethod: any; referenceNote: string; }) => {
        const targetBill = bills.find(b => b.id === billId);
        if (!targetBill) {
            showAlert('Error', 'Bill not found');
            return;
        }

        const newPayment = {
            id: `pay-${Date.now()}`,
            amount: paymentData.paymentAmount,
            paymentDate: paymentData.paymentDate,
            paymentMethod: paymentData.paymentMethod,
            referenceNote: paymentData.referenceNote,
        };

        const updatedPayments = [...(targetBill.payments || []), newPayment];
        const newPaidAmount = targetBill.paidAmount + newPayment.amount;
        const newStatus = newPaidAmount >= targetBill.amount ? BillStatus.PAID : targetBill.status;

        const { data, error } = await supabase.from('bills')
            .update({ paid_amount: newPaidAmount, payments: updatedPayments, status: newStatus })
            .eq('id', billId)
            .select('*, supplierId:supplier_id, invoiceNumber:invoice_number, billDate:bill_date, dueDate:due_date, paidAmount:paid_amount, fileUrl:file_url')
            .single();

        if (error) {
            showAlert('Database Error', `Could not record payment: ${error.message}`);
            return;
        }
        if (data) {
            onBillUpdated(data as Bill);
            showAlert('Success', 'Payment has been recorded.');
            setIsRecordPaymentModalOpen(false);
            setBillToRecordPaymentFor(null);
            // Also close the details modal if it's open
            setBillModalData(prev => ({...prev, isOpen: false}));
        }
    };

    // Data Calculation
    const metrics = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        
        const txToday = transactions.filter(tx => new Date(tx.date) >= todayStart);
        const txMonth = transactions.filter(tx => new Date(tx.date) >= monthStart);
        const txYear = transactions.filter(tx => new Date(tx.date) >= yearStart);

        const salesToday = txToday.reduce((sum, tx) => sum + tx.total, 0);
        const salesMonth = txMonth.reduce((sum, tx) => sum + tx.total, 0);
        const salesYear = txYear.reduce((sum, tx) => sum + tx.total, 0);

        const unpaidTxToday = txToday.filter(tx => tx.payment_status === PaymentStatus.UNPAID);
        const paidTxToday = txToday.filter(tx => tx.payment_status !== PaymentStatus.UNPAID);

        const salesTodayAR = unpaidTxToday.reduce((sum, tx) => sum + tx.total, 0);
        const salesTodayCash = paidTxToday.filter(tx => tx.paymentMethod === 'Cash').reduce((sum, tx) => sum + tx.total, 0);
        const salesTodayCard = paidTxToday.filter(tx => tx.paymentMethod === 'Card').reduce((sum, tx) => sum + tx.total, 0);
        const salesTodayBank = paidTxToday.filter(tx => tx.paymentMethod === 'Bank Transfer').reduce((sum, tx) => sum + tx.total, 0);
        
        const unpaidBills = bills.filter(b => b.status !== BillStatus.PAID);
        const totalOwed = unpaidBills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
        
        const dueTodayBills = unpaidBills.filter(b => new Date(b.dueDate).toDateString() === todayStart.toDateString());
        const dueTodayAmount = dueTodayBills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
        
        const next7Days = new Date(todayStart);
        next7Days.setDate(todayStart.getDate() + 7);
        const dueNext7DaysBills = unpaidBills.filter(b => {
            const dueDate = new Date(b.dueDate);
            return dueDate >= todayStart && dueDate <= next7Days;
        });
        const dueNext7DaysBillsAmount = dueNext7DaysBills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

        const unpaidTransactions = transactions.filter(tx => tx.payment_status === PaymentStatus.UNPAID || tx.payment_status === PaymentStatus.PARTIALLY_PAID);
        const totalReceivables = unpaidTransactions.reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0);

        const overdueTransactions = unpaidTransactions.filter(tx => tx.due_date && new Date(tx.due_date) < todayStart);
        const overdueAmount = overdueTransactions.reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0);

        const dueNext7DaysTransactions = unpaidTransactions.filter(tx => {
            if (!tx.due_date) return false;
            const dueDate = new Date(tx.due_date);
            return dueDate >= todayStart && dueDate <= next7Days;
        });
        const dueNext7DaysTransactionsAmount = dueNext7DaysTransactions.reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0);

        const lowStockVariants = products.flatMap(p => p.variants).filter(v => v.status === ProductStatus.LOW_STOCK);

        const wagesToday = users
            .filter(u => u.wageType === 'daily' && u.salary)
            .reduce((sum, u) => sum + (u.salary || 0), 0);

        return {
            salesToday, salesMonth, salesYear,
            salesTodayCash, salesTodayCard, salesTodayBank, salesTodayAR,
            totalOwed, totalOwedBills: unpaidBills,
            dueTodayAmount, dueTodayBills,
            dueNext7DaysBillsAmount, dueNext7DaysBills,
            lowStockVariants,
            totalReceivables, unpaidTransactions,
            overdueAmount, overdueTransactions,
            dueNext7DaysTransactionsAmount, dueNext7DaysTransactions,
            wagesToday,
        };
    }, [transactions, bills, products, users]);

    return (
        <>
        <div className="min-h-screen bg-background text-text-primary">
            {/* Header */}
            <header className="bg-surface shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">{storeSettings?.store_name[language] || 'CEO Dashboard'}</h1>
                    <p className="text-sm text-text-secondary">{new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="appearance-none bg-background border border-gray-300 rounded-md pl-8 pr-4 py-1.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            aria-label="Select language"
                        >
                            <option value="en">English</option>
                            <option value="th">ไทย</option>
                        </select>
                        <LanguageIcon className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">{currentUser.name}</p>
                        <p className="text-xs text-text-secondary">{t('role_ceo')}</p>
                    </div>
                    <button onClick={onLogout} className="text-text-secondary hover:text-primary" title={t('logout')}>
                        <ArrowLeftOnRectangleIcon className="h-6 w-6"/>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Sales Section */}
                    <section>
                         <h2 className="text-xl font-semibold text-text-primary mb-4">{t('sales_performance')}</h2>
                        <div className="bg-surface rounded-lg shadow p-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-text-secondary">{t('sales_today')}</p>
                                <p className="text-5xl font-bold text-green-600 my-2">฿{metrics.salesToday.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-text-secondary">{t('payment_cash')}</p>
                                    <p className="font-semibold text-text-primary">฿{metrics.salesTodayCash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">{t('payment_card')}</p>
                                    <p className="font-semibold text-text-primary">฿{metrics.salesTodayCard.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">{t('payment_bank_transfer')}</p>
                                    <p className="font-semibold text-text-primary">฿{metrics.salesTodayBank.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary">{t('ar_new')}</p>
                                    <p className="font-semibold text-text-primary">฿{metrics.salesTodayAR.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                            <StatsCard title={t('sales_month')} value={`฿${metrics.salesMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<CurrencyDollarIcon className="h-6 w-6"/>} color="text-green-500" />
                            <StatsCard title={t('sales_year')} value={`฿${metrics.salesYear.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<CurrencyDollarIcon className="h-6 w-6"/>} color="text-green-500" />
                        </div>
                    </section>
                    
                     {/* Daily Expenses */}
                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">{t('daily_expenses')}</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <StatsCard title={t('wages_today')} value={`฿${metrics.wagesToday.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<BanknotesIcon className="h-6 w-6"/>} color="text-yellow-500" />
                        </div>
                    </section>

                    {/* Accounts Receivable */}
                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">{t('accounts_receivable')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <StatsCard title={t('total_receivables')} value={`฿${metrics.totalReceivables.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<BanknotesIcon className="h-6 w-6"/>} color="text-orange-500" isClickable onClick={() => setTransactionModalData({ isOpen: true, title: t('total_receivables'), transactions: metrics.unpaidTransactions })}/>
                            <StatsCard title={t('overdue_amount')} value={`฿${metrics.overdueAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<ExclamationTriangleIcon className="h-6 w-6"/>} color="text-red-500" isClickable onClick={() => setTransactionModalData({ isOpen: true, title: t('overdue_amount'), transactions: metrics.overdueTransactions })}/>
                            <StatsCard title={t('due_in_days', { days: 7 })} value={`฿${metrics.dueNext7DaysTransactionsAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<CalendarDaysIcon className="h-6 w-6"/>} color="text-blue-500" isClickable onClick={() => setTransactionModalData({ isOpen: true, title: t('due_in_days', { days: 7 }), transactions: metrics.dueNext7DaysTransactions })}/>
                        </div>
                    </section>

                     {/* Accounts Payable */}
                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">{t('accounts_payable')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                             <StatsCard title={t('total_owed')} value={`฿${metrics.totalOwed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<BanknotesIcon className="h-6 w-6"/>} color="text-orange-500" isClickable onClick={() => setBillModalData({ isOpen: true, title: t('total_owed'), bills: metrics.totalOwedBills })}/>
                             <StatsCard title={t('due_in_days', { days: 7 })} value={`฿${metrics.dueNext7DaysBillsAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<CalendarDaysIcon className="h-6 w-6"/>} color="text-blue-500" isClickable onClick={() => setBillModalData({ isOpen: true, title: t('due_in_days', { days: 7 }), bills: metrics.dueNext7DaysBills })}/>
                             <StatsCard title={t('due_today')} value={`฿${metrics.dueTodayAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<ExclamationTriangleIcon className="h-6 w-6"/>} color="text-red-500" isClickable onClick={() => setBillModalData({ isOpen: true, title: t('due_today'), bills: metrics.dueTodayBills })}/>
                        </div>
                    </section>
                    {/* Inventory */}
                    <section>
                         <h2 className="text-xl font-semibold text-text-primary mb-4">{t('inventory')}</h2>
                         <StatsCard title={t('low_stock_items')} value={metrics.lowStockVariants.length.toLocaleString()} icon={<CubeIcon className="h-6 w-6"/>} color="text-yellow-500" isClickable={true} onClick={() => setIsLowStockModalOpen(true)} />
                    </section>
                </div>
                
                {/* Right Column: To-Do List */}
                <div className="lg:col-span-1">
                    <section>
                         <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <ClipboardDocumentCheckIcon className="h-6 w-6"/>
                            {t('ceo_todo_list')}
                        </h2>
                        <div className="bg-surface rounded-lg shadow">
                            <form onSubmit={handleAddTodo} className="p-4 border-b flex gap-2">
                                <input 
                                    type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
                                    placeholder={t('add_task')}
                                    className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md bg-background focus:ring-primary focus:border-primary"
                                />
                                <button type="submit" className="p-2 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-300" disabled={!newTodo.trim()}>
                                    <PlusIcon className="h-5 w-5"/>
                                </button>
                            </form>
                            <div className="max-h-96 overflow-y-auto">
                                {todos.length > 0 ? (
                                    <ul className="divide-y">
                                        {todos.map(todo => (
                                            <li key={todo.id} className={`p-3 transition-colors ${todo.completed ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className={`text-sm flex-grow ${todo.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{todo.text}</span>
                                                    <div className="flex items-center flex-shrink-0 gap-1">
                                                         <button onClick={() => handleToggleTodo(todo.id)} className={`p-1 rounded-full ${todo.completed ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-gray-400 hover:text-green-600 hover:bg-green-100'}`} title={todo.completed ? t('mark_as_incomplete') : t('mark_as_complete')}>
                                                            <CheckIcon className="h-4 w-4"/>
                                                         </button>
                                                          <button onClick={() => setPostponingTodoId(todo.id === postponingTodoId ? null : todo.id)} className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-100" title={t('postpone')}>
                                                            <ClockIcon className="h-4 w-4"/>
                                                         </button>
                                                        <button onClick={() => handleDeleteTodo(todo.id)} className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100" title={t('delete')}>
                                                            <TrashIcon className="h-4 w-4"/>
                                                        </button>
                                                    </div>
                                                </div>
                                                {(todo.dueDate || postponingTodoId === todo.id) && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <label htmlFor={`due-date-${todo.id}`} className="text-xs font-medium text-text-secondary">{t('due_date')}:</label>
                                                        <input 
                                                            id={`due-date-${todo.id}`}
                                                            type="date" 
                                                            value={todo.dueDate || ''}
                                                            onChange={(e) => handlePostponeTodo(todo.id, e.target.value)}
                                                            className="text-xs p-1 border rounded-md"
                                                        />
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="p-8 text-center text-text-secondary">{t('no_tasks')}</p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
        <LowStockProductsModal
            isOpen={isLowStockModalOpen}
            onClose={() => setIsLowStockModalOpen(false)}
            lowStockVariants={metrics.lowStockVariants}
            products={products}
            t={t}
            language={language}
        />
        <BillDetailsModal
            isOpen={billModalData.isOpen}
            onClose={() => setBillModalData({ isOpen: false, title: '', bills: [] })}
            title={billModalData.title}
            bills={billModalData.bills}
            suppliers={suppliers}
            t={t}
            onRecordPaymentClick={handleRecordPaymentClick}
        />
        <TransactionDetailsModal
            isOpen={transactionModalData.isOpen}
            onClose={() => setTransactionModalData({ isOpen: false, title: '', transactions: [] })}
            title={transactionModalData.title}
            transactions={transactionModalData.transactions}
            t={t}
        />
        <RecordPaymentModal
            isOpen={isRecordPaymentModalOpen}
            onClose={() => setIsRecordPaymentModalOpen(false)}
            onConfirm={handleRecordBillPayment}
            bill={billToRecordPaymentFor}
            t={t}
        />
        </>
    );
};

export default CEODashboard;