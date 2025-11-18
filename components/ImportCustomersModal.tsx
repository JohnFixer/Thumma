import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { NewCustomerData } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

declare const XLSX: any;

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (newCustomers: NewCustomerData[]) => void;
  t: (key: TranslationKey) => string;
}

interface ImportSummary {
    creations: number;
    errors: string[];
}

const ImportCustomersModal: React.FC<ImportCustomersModalProps> = ({ isOpen, onClose, onApplyImport, t }) => {
  const [newCustomers, setNewCustomers] = useState<NewCustomerData[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNewCustomers([]);
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
        
        const customersToCreate: NewCustomerData[] = [];
        const errors: string[] = [];

        for (const [index, row] of jsonData.entries()) {
            const name = row['Name'] ? String(row['Name']) : null;
            const type = row['Type'] ? String(row['Type']).toLowerCase() : null;

            if (!name || !type) {
                errors.push(`Row ${index + 2}: Missing required 'Name' or 'Type'. Row skipped.`);
                continue;
            }
            if (!['walkin', 'contractor', 'government'].includes(type)) {
                errors.push(`Row ${index + 2}: Invalid 'Type' specified. Must be one of: walkIn, contractor, government.`);
                continue;
            }

            customersToCreate.push({
                name,
                type: type === 'walkin' ? 'walkIn' : type as 'contractor' | 'government',
                phone: row['Phone'] ? String(row['Phone']) : undefined,
                address: row['Address'] ? String(row['Address']) : undefined,
            });
        }
        
        setNewCustomers(customersToCreate);
        setSummary({
            creations: customersToCreate.length,
            errors,
        });

      } catch (e: any) {
        setSummary({ creations: 0, errors: [`Failed to parse file: ${e.message}`] });
      }
    };
    reader.onerror = () => setSummary({ creations: 0, errors: ['Failed to read the file.'] });
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImportClick = () => {
    if (newCustomers.length > 0) {
      onApplyImport(newCustomers);
    }
  };

  const handleClose = () => {
    setNewCustomers([]);
    setSummary(null);
    setFileName(null);
    onClose();
  };

  const handleDownloadExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const exampleData = [
      { 'Name': 'Big Builders Inc.', 'Type': 'contractor', 'Phone': '081-234-5678', 'Address': '1 Construction Ave, Bangkok' },
      { 'Name': 'City Hall Project', 'Type': 'government', 'Phone': '02-987-6543', 'Address': '2 Government Rd, Bangkok' },
      { 'Name': 'Somchai Homeowner', 'Type': 'walkIn', 'Phone': '', 'Address': '' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    worksheet['!cols'] = [ { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 40 } ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'CustomerImportExample.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={handleClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('import_customers')}</h3>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div {...getRootProps()} className={`flex justify-center items-center w-full px-6 py-10 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-blue-50 border-primary' : 'bg-background hover:bg-gray-100'}`}>
                <input {...getInputProps()} />
                <div className="text-center">
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-text-secondary"><span className="font-semibold text-primary">{t('click_to_upload')}</span> {t('or_drag_and_drop')}</p>
                    <p className="text-xs text-gray-500">{t('xlsx_or_csv_file')} <button type="button" onClick={handleDownloadExample} className="font-semibold text-primary hover:underline">{t('download_example_file')}</button></p>
                </div>
            </div>

            {summary && (
                <div className="p-4 bg-background border rounded-md text-sm">
                    <p className="font-semibold text-text-primary">{t('import_summary_for')} <span className="font-bold">{fileName}</span>:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li className="text-green-700"><span className="font-bold">{summary.creations}</span> {t('new_customers_will_be_created')}</li>
                        {summary.errors.length > 0 && <li className="text-yellow-700"><span className="font-bold">{summary.errors.length}</span> {t('rows_will_be_skipped')}</li>}
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
            disabled={newCustomers.length === 0}
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

export default ImportCustomersModal;