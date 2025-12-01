import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { NewSupplierData } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

declare const XLSX: any;

interface ImportSuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (newSuppliers: NewSupplierData[]) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

interface ImportSummary {
  creations: number;
  errors: string[];
}

const ImportSuppliersModal: React.FC<ImportSuppliersModalProps> = ({ isOpen, onClose, onApplyImport, t }) => {
  const [newSuppliers, setNewSuppliers] = useState<NewSupplierData[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNewSuppliers([]);
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
        let targetSheetName = '';
        let headerRowIndex = -1;

        // Scan all sheets to find the one with 'Name'
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: null });

          // Check first 20 rows for 'Name'
          const foundRowIndex = sheetData.slice(0, 20).findIndex(row =>
            row && row.some((cell: any) => String(cell).trim().toLowerCase() === 'name')
          );

          if (foundRowIndex !== -1) {
            targetSheetName = sheetName;
            headerRowIndex = foundRowIndex;
            break;
          }
        }

        if (!targetSheetName) {
          setSummary({ creations: 0, errors: [`Could not find 'Name' column in any sheet (checked first 20 rows of each).`] });
          return;
        }

        const worksheet = workbook.Sheets[targetSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });

        if (jsonData.length === 0) {
          setSummary({ creations: 0, errors: ['The file is empty or in an incorrect format.'] });
          return;
        }

        const suppliersToCreate: NewSupplierData[] = [];
        const errors: string[] = [];

        const getValue = (row: any, key: string): any => {
          const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
          return foundKey ? row[foundKey] : undefined;
        };

        for (const [index, row] of jsonData.entries()) {
          const name = getValue(row, 'Name') ? String(getValue(row, 'Name')) : null;
          const contactPerson = getValue(row, 'Contact Person') ? String(getValue(row, 'Contact Person')) : null;
          const email = getValue(row, 'Email') ? String(getValue(row, 'Email')) : null;

          if (!name || !contactPerson || !email) {
            errors.push(`Row ${index + 2}: Missing required 'Name', 'Contact Person', or 'Email'. Row skipped.`);
            continue;
          }

          suppliersToCreate.push({
            name,
            contactPerson,
            email,
            phone: getValue(row, 'Phone') ? String(getValue(row, 'Phone')) : '',
            address: getValue(row, 'Address') ? String(getValue(row, 'Address')) : '',
            logo: getValue(row, 'Logo URL') ? String(getValue(row, 'Logo URL')) : `https://picsum.photos/seed/${name.replace(/\s/g, '')}/100/100`,
          });
        }

        setNewSuppliers(suppliersToCreate);
        setSummary({
          creations: suppliersToCreate.length,
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
    if (newSuppliers.length > 0) {
      onApplyImport(newSuppliers);
    }
  };

  const handleClose = () => {
    setNewSuppliers([]);
    setSummary(null);
    setFileName(null);
    onClose();
  };

  const handleDownloadExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const exampleData = [
      { 'Name': 'Siam Cement Group (SCG)', 'Contact Person': 'Somchai Cement', 'Email': 'sales@scg.com', 'Phone': '02-586-3333', 'Address': '1 Siam Cement Rd, Bang Sue, Bangkok', 'Logo URL': 'https://picsum.photos/seed/scg/100/100' },
      { 'Name': 'Jotun Thailand', 'Contact Person': 'Malee Paint', 'Email': 'contact@jotun.th', 'Phone': '038-911-800', 'Address': 'Amata City, Chonburi', 'Logo URL': 'https://picsum.photos/seed/jotun/100/100' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 40 }, { wch: 40 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    XLSX.writeFile(workbook, 'SupplierImportExample.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={handleClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('import_suppliers')}</h3>
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
                <li className="text-green-700"><span className="font-bold">{summary.creations}</span> {t('new_suppliers_will_be_created')}</li>
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
            disabled={newSuppliers.length === 0}
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

export default ImportSuppliersModal;