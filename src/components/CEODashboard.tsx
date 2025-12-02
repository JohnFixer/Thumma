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
    onNavigate: (view: string, state?: any) => void;
}

const CEODashboard: React.FC<CEODashboardProps> = ({ currentUser, onLogout, transactions, bills, users, products, suppliers, storeSettings, t, language, setLanguage, onBillUpdated, showAlert, onNavigate }) => {

    // Widget visibility based on role settings
    const getVisibleWidgets = (): string[] => {
        const userRole = currentUser.role[0]; // Get primary role
        const roleSettings = storeSettings?.dashboard_widget_visibility?.[userRole];

        const CEO_WIDGETS = [
            'ceo_sales_performance',
            'ceo_daily_overview',
            'ceo_daily_expenses',
            'ceo_accounts_summary',
            'ceo_inventory',
            'ceo_todo_list'
        ];

        // Default to all widgets if no settings
        if (!roleSettings) return CEO_WIDGETS;

        // Filter to only include CEO widgets that are in the settings
        const relevantSettings = roleSettings.filter(w => CEO_WIDGETS.includes(w));

        // If the user has settings (e.g. for regular dashboard) but NONE are CEO widgets,
        // assume this is a first-time load for CEO dashboard and show defaults.
        if (relevantSettings.length === 0 && roleSettings.length > 0) {
            return CEO_WIDGETS;
        }

        return relevantSettings;
    };

    const visibleWidgets = getVisibleWidgets();
    const isWidgetVisible = (widgetId: string) => visibleWidgets.includes(widgetId);

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
            showAlert(t('alert_error'), t('bill_not_found'));
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
            showAlert(t('database_error'), t('payment_record_failed', { error: error.message }));
            return;
        }
        if (data) {
            onBillUpdated(data as Bill);
            showAlert(t('alert_success'), t('payment_recorded_success'));
            setIsRecordPaymentModalOpen(false);
            setBillToRecordPaymentFor(null);
            // Also close the details modal if it's open
            setBillModalData(prev => ({ ...prev, isOpen: false }));
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

        const dailyWageUsers = users.filter(u => u.wageType === 'daily' && u.salary);
        const wagesToday = dailyWageUsers.reduce((sum, u) => sum + (u.salary || 0), 0);

        const lowStockVariants = products.flatMap(p => p.variants).filter(v => v.status === ProductStatus.LOW_STOCK);

        const overdueAR = unpaidTransactions.filter(tx => tx.due_date && new Date(tx.due_date) < todayStart);
        const overdueARAmount = overdueAR.reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0);

        return {
            salesToday, salesMonth, salesYear,
            salesTodayAR, salesTodayCash, salesTodayCard, salesTodayBank,
            totalOwed, dueTodayBills, dueTodayAmount, dueNext7DaysBills, dueNext7DaysBillsAmount,
            totalReceivables, wagesToday, lowStockVariants,
            overdueAR, overdueARAmount,
        };
    }, [transactions, bills, users, products]);

    const openBillModal = (titleKey: TranslationKey, billList: Bill[]) => {
        setBillModalData({ isOpen: true, title: t(titleKey), bills: billList });
    };

    const openTransactionModal = (titleKey: TranslationKey, txList: Transaction[]) => {
        setTransactionModalData({ isOpen: true, title: t(titleKey), transactions: txList });
    };

    return (
        <>
            <div className="bg-gray-900 text-white font-sans h-full">
                <header className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {storeSettings?.logo_url ? <img src={storeSettings.logo_url} alt="Logo" className="h-12" /> : <CubeIcon className="h-12 w-12 text-secondary" />}
                        <h1 className="text-xl font-bold">{storeSettings?.store_name?.[language] || 'Thumma Concrete'}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="appearance-none bg-gray-800 pl-8 pr-4 py-1.5 text-sm rounded-md focus:outline-none">
                                <option value="en">EN</option>
                                <option value="th">TH</option>
                            </select>
                            <LanguageIcon className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <p className="text-sm">{currentUser.name.toUpperCase()}</p>
                        <button onClick={onLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeftOnRectangleIcon className="h-5 w-5" /> {t('logout')}</button>
                    </div>
                </header>

                <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {visibleWidgets.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-400">
                            <p className="text-lg">{t('no_widgets_visible') || 'No widgets are visible.'}</p>
                            <p className="text-sm mt-2">{t('check_dashboard_settings') || 'Please check your Dashboard Management settings.'}</p>
                        </div>
                    )}
                    {/* Column 1 */}
                    <div className="space-y-6">
                        {/* Daily Breakdown - Moved to Top */}
                        {isWidgetVisible('ceo_daily_overview') && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h2 className="text-lg font-semibold mb-4">{t('daily_sales_overview')}</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => onNavigate('sales_history', { filter: 'total_today' })}>
                                        <span>{t('total_sales_today')}</span><span className="font-bold">฿{metrics.salesToday.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => onNavigate('sales_history', { filter: 'cash_today' })}>
                                        <span>{t('cash_sales')}</span><span className="font-bold">฿{metrics.salesTodayCash.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => onNavigate('sales_history', { filter: 'card_today' })}>
                                        <span>{t('card_sales')}</span><span className="font-bold">฿{metrics.salesTodayCard.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => onNavigate('sales_history', { filter: 'transfer_today' })}>
                                        <span>{t('bank_transfer_sales')}</span><span className="font-bold">฿{metrics.salesTodayBank.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-yellow-900/50 rounded cursor-pointer hover:bg-yellow-800 transition-colors" onClick={() => openTransactionModal('ar_new', transactions.filter(tx => new Date(tx.date).toDateString() === new Date().toDateString() && tx.payment_status === PaymentStatus.UNPAID))}>
                                        <span>{t('ar_new')}</span><span className="font-bold">฿{metrics.salesTodayAR.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Sales Performance */}
                        {isWidgetVisible('ceo_sales_performance') && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h2 className="text-lg font-semibold mb-4">{t('sales_performance')}</h2>
                                <StatsCard title={t('sales_today')} value={`฿${metrics.salesToday.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<CurrencyDollarIcon className="h-6 w-6" />} color="text-green-400" className="bg-gray-700/50" />
                                <StatsCard title={t('sales_month')} value={`฿${metrics.salesMonth.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<CalendarDaysIcon className="h-6 w-6" />} color="text-blue-400" className="bg-gray-700/50 mt-4" />
                                <StatsCard title={t('sales_year')} value={`฿${metrics.salesYear.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<CalendarDaysIcon className="h-6 w-6" />} color="text-purple-400" className="bg-gray-700/50 mt-4" />
                            </div>
                        )}
                    </div>
                    {/* Column 2 */}
                    <div className="space-y-6">
                        {/* Daily Expenses */}
                        {isWidgetVisible('ceo_daily_expenses') && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h2 className="text-lg font-semibold mb-4">{t('daily_expenses')}</h2>
                                <StatsCard title={t('wages_today')} value={`฿${metrics.wagesToday.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<BanknotesIcon className="h-6 w-6" />} color="text-red-400" className="bg-gray-700/50" />
                            </div>
                        )}
                        {/* Accounts Summary */}
                        {isWidgetVisible('ceo_accounts_summary') && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h2 className="text-lg font-semibold mb-4">Accounts Summary</h2>
                                <StatsCard title={t('total_receivables')} value={`฿${metrics.totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<BanknotesIcon className="h-6 w-6" />} color="text-green-400" className="bg-gray-700/50" />
                                <StatsCard title={t('overdue_amount')} value={`฿${metrics.overdueARAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<ExclamationTriangleIcon className="h-6 w-6" />} color="text-red-400" className="bg-gray-700/50 mt-4" isClickable onClick={() => openTransactionModal('overdue_amount', metrics.overdueAR)} />
                                <StatsCard title={t('total_owed')} value={`฿${metrics.totalOwed.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<BanknotesIcon className="h-6 w-6" />} color="text-orange-400" className="bg-gray-700/50 mt-4" />
                                <StatsCard title={t('due_in_days', { days: 7 })} value={`฿${metrics.dueNext7DaysBillsAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={<ClockIcon className="h-6 w-6" />} color="text-blue-400" className="bg-gray-700/50 mt-4" isClickable onClick={() => openBillModal('due_in_days', metrics.dueNext7DaysBills)} />
                            </div>
                        )}
                        {/* Inventory Alert */}
                        {isWidgetVisible('ceo_inventory') && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h2 className="text-lg font-semibold mb-4">{t('inventory_overview')}</h2>
                                <StatsCard title={t('low_stock_items')} value={metrics.lowStockVariants.length} icon={<CubeIcon className="h-6 w-6" />} color="text-yellow-400" className="bg-gray-700/50" isClickable onClick={() => setIsLowStockModalOpen(true)} />
                            </div>
                        )}
                    </div>
                    {/* Column 3 */}
                    {isWidgetVisible('ceo_todo_list') && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold mb-4">{t('ceo_todo_list')}</h2>
                            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                                <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder={t('add_task')} className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
                                <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-orange-600"><PlusIcon className="h-5 w-5" /></button>
                            </form>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                {todos.length > 0 ? todos.sort((a, b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1)).map(todo => (
                                    <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-md transition-colors ${todo.completed ? 'bg-green-900/50 text-gray-500' : 'bg-gray-700/50'}`}>
                                        <button onClick={() => handleToggleTodo(todo.id)} className="flex-shrink-0">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${todo.completed ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}>
                                                {todo.completed && <CheckIcon className="h-3 w-3 text-white" />}
                                            </div>
                                        </button>
                                        <div className="flex-grow">
                                            <p className={`text-sm ${todo.completed ? 'line-through' : ''}`}>{todo.text}</p>
                                            {todo.dueDate && <p className="text-xs text-gray-400">Due: {new Date(todo.dueDate).toLocaleDateString()}</p>}
                                        </div>
                                        {!todo.completed && (
                                            <div className="relative">
                                                <button onClick={() => setPostponingTodoId(todo.id === postponingTodoId ? null : todo.id)} className="text-gray-400 hover:text-white p-1"><ClockIcon className="h-4 w-4" /></button>
                                                {postponingTodoId === todo.id && (
                                                    <input type="date" onChange={(e) => handlePostponeTodo(todo.id, e.target.value)} className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 p-1 text-xs rounded-md z-10" />
                                                )}
                                            </div>
                                        )}
                                        <button onClick={() => handleDeleteTodo(todo.id)} className="text-gray-400 hover:text-red-500 p-1"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 text-sm py-8">{t('no_tasks')}</p>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <LowStockProductsModal isOpen={isLowStockModalOpen} onClose={() => setIsLowStockModalOpen(false)} lowStockVariants={metrics.lowStockVariants} products={products} t={t} language={language} />
            <BillDetailsModal isOpen={billModalData.isOpen} onClose={() => setBillModalData({ isOpen: false, title: '', bills: [] })} title={billModalData.title} bills={billModalData.bills} suppliers={suppliers} t={t} onRecordPaymentClick={handleRecordPaymentClick} />
            <TransactionDetailsModal isOpen={transactionModalData.isOpen} onClose={() => setTransactionModalData({ isOpen: false, title: '', transactions: [] })} title={transactionModalData.title} transactions={transactionModalData.transactions} t={t} />
            <RecordPaymentModal isOpen={isRecordPaymentModalOpen} onClose={() => setIsRecordPaymentModalOpen(false)} onConfirm={handleRecordBillPayment} bill={billToRecordPaymentFor} t={t} />
        </>
    );
};

export default CEODashboard;