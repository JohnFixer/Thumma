import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import type { Supplier } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

declare const XLSX: any;

interface BillImportData {
  supplierName: string;
  invoiceNumber: string;
  billDate: string;
  dueDate: string;
  amount: number;
  notes?: string;
  isNewSupplier: boolean;
  rowNum: number;
}

interface ImportBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (billsToImport: BillImportData[]) => void;
  suppliers: Supplier[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

interface ImportSummary {
    billsToCreate: number;
    newSuppliers: number;
    errors: string[];
}

const ImportBillsModal: React.FC<ImportBillsModalProps> = ({ isOpen, onClose, onApplyImport, suppliers, t }) => {
  const [importPayload, setImportPayload] = useState<BillImportData[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImportPayload([]);
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
          setSummary({ billsToCreate: 0, newSuppliers: 0, errors: ['The file is empty or in an incorrect format.'] });
          return;
        }

        const billsToImport: BillImportData[] = [];
        const errors: string[] = [];
        const newSupplierNames = new Set<string>();
        const existingSupplierNames = new Set(suppliers.map(s => s.name.toLowerCase()));

        for (const [index, row] of jsonData.entries()) {
            const rowNum = index + 2;
            const supplierName = row['Supplier Name'] ? String(row['Supplier Name']).trim() : null;
            const amount = row['Amount'] ? Number(row['Amount']) : null;

            // Validation: Supplier Name and Amount are required.
            if (!supplierName || amount === null || amount <= 0) {
                errors.push(`Row ${rowNum}: 'Supplier Name' and a positive 'Amount' are required. Row skipped.`);
                continue;
            }
            
            const today = new Date().toISOString().split('T')[0];
            const handleExcelDate = (excelDate: any): string => {
                if (!excelDate) return today;
                if (typeof excelDate === 'number') {
                    // Formula to convert Excel's serial date number to a JS Date
                    return new Date(Math.round((excelDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                }
                // Attempt to parse string dates
                const d = new Date(excelDate);
                return isNaN(d.getTime()) ? today : d.toISOString().split('T')[0];
            };

            const isNew = !existingSupplierNames.has(supplierName.toLowerCase());
            if (isNew) {
                newSupplierNames.add(supplierName);
            }

            billsToImport.push({
                supplierName,
                invoiceNumber: String(row['Invoice Number'] || `IMPORT-${Date.now()}-${rowNum}`),
                billDate: handleExcelDate(row['Bill Date']),
                dueDate: handleExcelDate(row['Due Date']),
                amount,
                notes: row['Notes'] ? String(row['Notes']) : undefined,
                isNewSupplier: isNew,
                rowNum,
            });
        }
        
        setImportPayload(billsToImport);
        setSummary({
            billsToCreate: billsToImport.length,
            newSuppliers: newSupplierNames.size,
            errors,
        });

      } catch (e: any) {
        setSummary({ billsToCreate: 0, newSuppliers: 0, errors: [`Failed to parse file: ${e.message}`] });
      }
    };
    reader.onerror = () => setSummary({ billsToCreate: 0, newSuppliers: 0, errors: ['Failed to read the file.'] });
    reader.readAsArrayBuffer(file);
  }, [suppliers]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleImportClick = () => {
    if (importPayload.length > 0) {
      onApplyImport(importPayload);
    }
  };

  const handleClose = () => {
    setImportPayload([]);
    setSummary(null);
    setFileName(null);
    onClose();
  };

  const handleDownloadExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const exampleData = [
      { 'Supplier Name': 'SCG', 'Invoice Number': 'INV-1001', 'Bill Date': '2024-11-10', 'Due Date': '2024-12-10', Amount: 15000, Notes: 'Cement delivery' },
      { 'Supplier Name': 'New Local Hardware', 'Invoice Number': '2024-AB', 'Bill Date': '2024-11-15', 'Due Date': '2024-11-30', Amount: 2500, Notes: 'Misc tools' },
      { 'Supplier Name': 'SCG', 'Amount': 5000.75 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    worksheet['!cols'] = [ { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 } ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');
    XLSX.writeFile(workbook, 'BillImportExample.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={handleClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('import_bills')}</h3>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <p className="text-sm text-text-secondary">{t('import_bills_desc')}</p>
            <div {...getRootProps()} className={`flex justify-center items-center w-full px-6 py-10 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-blue-50 border-primary' : 'bg-background hover:bg-gray-100'}`}>
                <input {...getInputProps()} />
                <div className="text-center">
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-text-secondary"><span className="font-semibold text-primary">{t('click_to_upload')}</span> {t('or_drag_and_drop')}</p>
                    <p className="text-xs text-gray-500">XLSX file. <button type="button" onClick={handleDownloadExample} className="font-semibold text-primary hover:underline">{t('download_example_file')}</button></p>
                </div>
            </div>

            {summary && (
                <div className="p-4 bg-background border rounded-md text-sm">
                    <p className="font-semibold text-text-primary">{t('import_summary_for')} <span className="font-bold">{fileName}</span>:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li className="text-green-700">{t('bills_to_create', { count: summary.billsToCreate })}</li>
                        {summary.newSuppliers > 0 && <li className="text-blue-700">{t('new_suppliers_to_create', { count: summary.newSuppliers })}</li>}
                        {summary.errors.length > 0 && <li className="text-yellow-700">{t('rows_will_be_skipped', { count: summary.errors.length })}</li>}
                    </ul>
                    {summary.errors.length > 0 && (
                        <div className="mt-2 pt-2 border-t max-h-24 overflow-y-auto">
                            <p className="text-xs font-semibold text-red-700">{t('errors_found')}</p>
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
            disabled={importPayload.length === 0}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300 disabled:cursor-not-allowed">
            {t('confirm_import')}
          </button>
          <button type="button" onClick={handleClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportBillsModal;