
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { PastInvoiceData } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

declare const XLSX: any;

interface ImportPastInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (pastInvoices: PastInvoiceData[]) => void;
  t: (key: TranslationKey) => string;
}

interface ImportSummary {
    creations: number;
    errors: string[];
}

const ImportPastInvoicesModal: React.FC<ImportPastInvoicesModalProps> = ({ isOpen, onClose, onApplyImport, t }) => {
  const [pastInvoices, setPastInvoices] = useState<PastInvoiceData[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPastInvoices([]);
    setSummary(null);
    setFileName(null);
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setSummary({ creations: 0, errors: ['The file is empty or in an incorrect format.'] });
          return;
        }
        
        const invoicesToCreate: PastInvoiceData[] = [];
        const errors: string[] = [];

        for (const [index, row] of jsonData.entries()) {
            const customerName = row['Customer Name'] ? String(row['Customer Name']) : null;
            const originalId = row['Original Invoice ID'] ? String(row['Original Invoice ID']) : null;
            const date = row['Invoice Date']; // Can be string, number (Excel date)
            const total = row['Total Amount'] ? Number(row['Total Amount']) : null;

            if (!customerName || !originalId || !date || total === null) {
                errors.push(`Row ${index + 2}: Missing required data. Row skipped.`);
                continue;
            }

            // Handle Excel dates
            let invoiceDate: string;
            if (typeof date === 'number') {
                invoiceDate = new Date(Math.round((date - 25569) * 86400 * 1000)).toISOString().split('T')[0];
            } else {
                invoiceDate = new Date(date).toISOString().split('T')[0];
            }

            invoicesToCreate.push({
                customerId: customerName, // Using name as ID for matching in App.tsx
                originalInvoiceId: originalId,
                invoiceDate,
                totalAmount: total,
                amountAlreadyPaid: Number(row['Amount Already Paid'] || 0),
            });
        }
        
        setPastInvoices(invoicesToCreate);
        setSummary({ creations: invoicesToCreate.length, errors });

      } catch (e: any) {
        setSummary({ creations: 0, errors: [`Failed to parse file: ${e.message}`] });
      }
    };
    reader.onerror = () => setSummary({ creations: 0, errors: ['Failed to read the file.'] });
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleImportClick = () => {
    if (pastInvoices.length > 0) {
      onApplyImport(pastInvoices);
    }
  };

  const handleClose = () => {
    setPastInvoices([]);
    setSummary(null);
    setFileName(null);
    onClose();
  };

  const handleDownloadExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const exampleData = [
      { 'Customer Name': 'Big Builders Inc.', 'Original Invoice ID': 'INV-2023-001', 'Invoice Date': '2023-12-15', 'Total Amount': 5500.50, 'Amount Already Paid': 2000 },
      { 'Customer Name': 'City Hall Project', 'Original Invoice ID': 'PO-GOV-456', 'Invoice Date': '2024-01-20', 'Total Amount': 12750.00, 'Amount Already Paid': 0 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    worksheet['!cols'] = [ { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 } ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Past Invoices');
    XLSX.writeFile(workbook, 'PastInvoiceImportExample.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={handleClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('import_past_invoices')}</h3>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <p className="text-sm text-text-secondary">{t('import_past_invoices_desc')}</p>
            <div {...getRootProps()} className={`flex justify-center items-center w-full px-6 py-10 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-blue-50 border-primary' : 'bg-background hover:bg-gray-100'}`}>
                <input {...getInputProps()} />
                <div className="text-center">
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-text-secondary"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">XLSX file. <button type="button" onClick={handleDownloadExample} className="font-semibold text-primary hover:underline">Download example file.</button></p>
                </div>
            </div>

            {summary && (
                <div className="p-4 bg-background border rounded-md text-sm">
                    <p className="font-semibold text-text-primary">Import Summary for <span className="font-bold">{fileName}</span>:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li className="text-green-700"><span className="font-bold">{summary.creations}</span> valid invoices found to import.</li>
                        {summary.errors.length > 0 && <li className="text-yellow-700"><span className="font-bold">{summary.errors.length}</span> rows will be skipped due to errors.</li>}
                    </ul>
                    {summary.errors.length > 0 && (
                        <div className="mt-2 pt-2 border-t max-h-24 overflow-y-auto">
                            <p className="text-xs font-semibold text-red-700">Errors found:</p>
                            <ul className="list-disc list-inside text-xs text-red-600">
                                {summary.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                {summary.errors.length > 5 && <li>...and {summary.errors.length - 5} more.</li>}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button 
            type="button" 
            onClick={handleImportClick}
            disabled={pastInvoices.length === 0}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300 disabled:cursor-not-allowed">
            {t('confirm')} Import
          </button>
          <button type="button" onClick={handleClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPastInvoicesModal;
