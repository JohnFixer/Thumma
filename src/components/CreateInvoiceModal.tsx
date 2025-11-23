import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarDaysIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dueDate: string) => void;
  t: (key: TranslationKey) => string;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose, onConfirm, t }) => {
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            setDueDate(defaultDate.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(dueDate);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">{t('set_due_date')}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    <label htmlFor="due-date" className="block text-sm font-medium text-text-secondary mb-2">
                        {t('due_date')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="date"
                            id="due-date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-background"
                        />
                    </div>
                </div>
                <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleConfirm}
                    >
                        {t('confirm')}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoiceModal;
