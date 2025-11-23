
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { PastInvoiceData, Customer } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface RecordPastInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (data: PastInvoiceData) => void;
  customers: Customer[];
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey) => string;
}

const RecordPastInvoiceModal: React.FC<RecordPastInvoiceModalProps> = ({ isOpen, onClose, onRecord, customers, showAlert, t }) => {
  const [customerInput, setCustomerInput] = useState('');
  const [originalInvoiceId, setOriginalInvoiceId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [amountAlreadyPaid, setAmountAlreadyPaid] = useState<string>('0');
  const [file, setFile] = useState<File | null>(null);

  const customerMap = useMemo(() => new Map(customers.map(c => [c.name, c.id])), [customers]);
  const isNewCustomer = useMemo(() => customerInput && !customerMap.has(customerInput), [customerInput, customerMap]);

  useEffect(() => {
    if (isOpen) {
      setCustomerInput('');
      setOriginalInvoiceId('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setTotalAmount('');
      setAmountAlreadyPaid('0');
      setFile(null);
    }
  }, [isOpen]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false,
  });
  
  const handleAmountChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setter(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTotal = parseFloat(totalAmount);
    const numericPaid = parseFloat(amountAlreadyPaid);

    if (!customerInput || !originalInvoiceId || !invoiceDate || isNaN(numericTotal) || numericTotal <= 0 || isNaN(numericPaid)) {
      showAlert(t('missing_information'), 'Please fill in all required fields with valid numbers.');
      return;
    }

    const payload: PastInvoiceData = {
      originalInvoiceId,
      invoiceDate,
      totalAmount: numericTotal,
      amountAlreadyPaid: numericPaid,
      file: file || undefined,
    };

    if (isNewCustomer) {
        payload.newCustomerName = customerInput;
    } else {
        payload.customerId = customerMap.get(customerInput);
    }

    onRecord(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('record_past_invoice')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="px-6 pt-4 text-sm text-text-secondary">{t('record_past_invoice_desc')}</p>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="past-customer-input" className="block text-sm font-medium text-text-secondary">{t('customer')}</label>
              <input 
                id="past-customer-input"
                type="text"
                list="customer-list"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300"
                placeholder="Select or type a new customer name"
                required 
              />
              <datalist id="customer-list">
                {customers.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
               {customerInput && (
                    <p className={`text-xs mt-1 ${isNewCustomer ? 'text-green-600' : 'text-blue-600'}`}>
                        {isNewCustomer ? `A new customer named "${customerInput}" will be created.` : 'Existing customer selected.'}
                    </p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="original-id" className="block text-sm font-medium text-text-secondary">{t('original_invoice_id')}</label>
                    <input type="text" id="original-id" value={originalInvoiceId} onChange={(e) => setOriginalInvoiceId(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" required />
                </div>
                <div>
                    <label htmlFor="invoice-date" className="block text-sm font-medium text-text-secondary">{t('original_invoice_date')}</label>
                    <input type="date" id="invoice-date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="total-amount" className="block text-sm font-medium text-text-secondary">{t('total_invoice_amount')}</label>
                <input 
                  type="text" 
                  id="total-amount" 
                  value={totalAmount} 
                  onChange={handleAmountChange(setTotalAmount)} 
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" 
                  required 
                />
              </div>
               <div>
                <label htmlFor="paid-amount" className="block text-sm font-medium text-text-secondary">{t('amount_already_paid')}</label>
                <input 
                  type="text" 
                  id="paid-amount" 
                  value={amountAlreadyPaid} 
                  onChange={handleAmountChange(setAmountAlreadyPaid)} 
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary">Attach Invoice PDF (Optional)</label>
              <div {...getRootProps()} className={`mt-1 flex justify-center items-center w-full px-6 py-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-blue-50 border-primary' : 'bg-background hover:bg-gray-100'}`}>
                <input {...getInputProps()} />
                <div className="text-center">
                  <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
                  {file ? (
                    <p className="mt-2 text-sm text-green-600 font-semibold">{file.name}</p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-text-secondary"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF file only</p>
                    </>
                  )}
                </div>
              </div>
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

export default RecordPastInvoiceModal;