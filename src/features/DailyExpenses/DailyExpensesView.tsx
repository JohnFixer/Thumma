import React, { useState, useEffect } from 'react';
import { DailyExpense } from './ExpenseTypes';
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon } from '../../components/icons/HeroIcons';
import { createDailyExpense, fetchDailyExpenses, updateDailyExpense, deleteDailyExpense } from '../../services/db';

interface DailyExpensesViewProps {
    currentUser: { name: string; id: string };
    t: (key: string) => string;
    showAlert: (title: string, message: string) => void;
}

const DailyExpensesView: React.FC<DailyExpensesViewProps> = ({ currentUser, t, showAlert }) => {
    const [expenses, setExpenses] = useState<DailyExpense[]>([]);
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editRemark, setEditRemark] = useState('');

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        const today = new Date().toISOString().split('T')[0];
        const data = await fetchDailyExpenses(today);
        setExpenses(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !remark) return;

        setIsLoading(true);
        try {
            const newExpense: Omit<DailyExpense, 'id'> = {
                amount: parseFloat(amount),
                remark,
                date: new Date().toISOString(),
                createdBy: currentUser.name
            };

            const created = await createDailyExpense(newExpense);
            if (created) {
                setExpenses(prev => [created, ...prev]);
                setAmount('');
                setRemark('');
                showAlert(t('alert_success'), t('expense_added_success'));
            } else {
                showAlert(t('alert_error'), t('expense_add_failed'));
            }
        } catch (error) {
            console.error(error);
            showAlert(t('alert_error'), t('expense_add_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (expense: DailyExpense) => {
        setEditingId(expense.id);
        setEditAmount(expense.amount.toString());
        setEditRemark(expense.remark);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditAmount('');
        setEditRemark('');
    };

    const handleSaveEdit = async (id: string) => {
        if (!editAmount || !editRemark) return;

        const success = await updateDailyExpense(id, {
            amount: parseFloat(editAmount),
            remark: editRemark
        });

        if (success) {
            setExpenses(prev => prev.map(e => e.id === id ? { ...e, amount: parseFloat(editAmount), remark: editRemark } : e));
            setEditingId(null);
            showAlert(t('alert_success'), t('expense_updated_success'));
        } else {
            showAlert(t('alert_error'), t('expense_update_failed'));
        }
    };

    const handleDeleteClick = async (id: string) => {
        if (!window.confirm(t('confirm_delete_expense'))) return;

        const success = await deleteDailyExpense(id);
        if (success) {
            setExpenses(prev => prev.filter(e => e.id !== id));
            showAlert(t('alert_success'), t('expense_deleted_success'));
        } else {
            showAlert(t('alert_error'), t('expense_delete_failed'));
        }
    };

    return (
        <div className="p-6 h-full flex flex-col bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-6">{t('daily_expenses')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
                    <h2 className="text-xl font-semibold mb-4">{t('add_new_expense')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t('amount')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">฿</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t('remark')}</label>
                            <textarea
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                                rows={3}
                                placeholder={t('expense_remark_placeholder')}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="h-5 w-5" />
                            {isLoading ? t('processing') : t('add_expense')}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-grow flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">{t('todays_expenses')}</h2>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                        {expenses.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">{t('no_expenses_today')}</p>
                        ) : (
                            expenses.map((expense) => (
                                <div key={expense.id} className="bg-gray-700/50 p-4 rounded-md flex justify-between items-start group">
                                    {editingId === expense.id ? (
                                        <div className="flex-grow flex flex-col gap-2">
                                            <input
                                                type="text"
                                                value={editRemark}
                                                onChange={(e) => setEditRemark(e.target.value)}
                                                className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                                                placeholder={t('remark')}
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-sm">฿</span>
                                                <input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-white w-24 focus:outline-none focus:ring-1 focus:ring-secondary"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => handleSaveEdit(expense.id)} className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1">
                                                    <CheckIcon className="h-4 w-4" /> {t('save')}
                                                </button>
                                                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300 text-xs flex items-center gap-1">
                                                    <XMarkIcon className="h-4 w-4" /> {t('cancel')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="font-medium text-lg">{expense.remark}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(expense.date).toLocaleTimeString()} • {t('by')} {expense.createdBy}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <p className="font-bold text-red-400 text-lg">-฿{expense.amount.toLocaleString()}</p>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditClick(expense)} className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600">
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(expense.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                        <span className="text-gray-400">{t('total')}</span>
                        <span className="text-xl font-bold text-white">
                            ฿{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyExpensesView;
