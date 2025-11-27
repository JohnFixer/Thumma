import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { NewBillData, Supplier, Bill } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface EditBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditBill: (billData: NewBillData) => void;
    bill: Bill | null;
    suppliers: Supplier[];
    showAlert: (title: string, message: string) => void;
    t: (key: TranslationKey) => string;
}

const EditBillModal: React.FC<EditBillModalProps> = ({ isOpen, onClose, onEditBill, bill, suppliers, showAlert, t }) => {
    const [supplierId, setSupplierId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [billDate, setBillDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen && bill) {
            setSupplierId(bill.supplierId);
            setInvoiceNumber(bill.invoiceNumber);
            // Format dates to YYYY-MM-DD for input[type="date"]
            setBillDate(bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : '');
            setDueDate(bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '');
            setAmount(bill.amount.toString());
            setNotes(bill.notes || '');
            setFile(null);
        }
    }, [isOpen, bill]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
        maxFiles: 1,
        multiple: false,
    });

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
            setAmount(value);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!supplierId || !invoiceNumber || !billDate || !dueDate || isNaN(numericAmount) || numericAmount <= 0) {
            showAlert(t('missing_information'), t('add_bill_validation'));
            return;
        }
        onEditBill({
            supplierId,
            invoiceNumber,
            billDate,
            dueDate,
            amount: numericAmount,
            notes,
            file: file || undefined,
        });
    };

    if (!isOpen || !bill) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">{t('edit')} {t('bills')}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="edit-supplier" className="block text-sm font-medium text-text-secondary">{t('suppliers')}</label>
                            <select id="edit-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" required>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-invoice-number" className="block text-sm font-medium text-text-secondary">{t('invoice_number')}</label>
                                <input type="text" id="edit-invoice-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" required />
                            </div>
                            <div>
                                <label htmlFor="edit-amount" className="block text-sm font-medium text-text-secondary">{t('amount')}</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    id="edit-amount"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="0.00"
                                    className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"
                                    required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-bill-date" className="block text-sm font-medium text-text-secondary">{t('bill_date')}</label>
                                <input type="date" id="edit-bill-date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" required />
                            </div>
                            <div>
                                <label htmlFor="edit-due-date" className="block text-sm font-medium text-text-secondary">{t('due_date')}</label>
                                <input type="date" id="edit-due-date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Attach Invoice (Optional)</label>
                            <div {...getRootProps()} className={`mt-1 flex justify-center items-center w-full px-6 py-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-blue-50 border-primary' : 'bg-background hover:bg-gray-100'}`}>
                                <input {...getInputProps()} />
                                <div className="text-center">
                                    <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
                                    {file ? (
                                        <p className="mt-2 text-sm text-green-600 font-semibold">{file.name}</p>
                                    ) : (
                                        <>
                                            <p className="mt-2 text-sm text-text-secondary"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-gray-500">PDF, PNG, JPG</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit-notes" className="block text-sm font-medium text-text-secondary">Notes (Optional)</label>
                            <textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" />
                        </div>
                    </div>
                    <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
                            {t('save')}
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                            {t('cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBillModal;
