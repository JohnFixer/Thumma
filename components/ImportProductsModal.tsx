
import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import type { NewProductData, NewProductVariantData, Product, ProductImportPayload } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { findCategoryKeyByNames } from '../categories';

declare const XLSX: any;

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (payload: ProductImportPayload) => void;
  products: Product[];
  t: (key: TranslationKey) => string;
}

interface ImportSummary {
    creations: number;
    updates: number;
    skipped: number;
    errors: string[];
}

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose, onApplyImport, products, t }) => {
  const [importPayload, setImportPayload] = useState<ProductImportPayload | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const existingSkuMap = useMemo(() => 
      new Map(products.flatMap(p => p.variants).map(v => [v.sku, v])), 
  [products]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImportPayload(null);
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
          setSummary({ creations: 0, updates: 0, skipped: 0, errors: ['The file is empty or in an incorrect format.'] });
          return;
        }

        const newProductsMap = new Map<string, NewProductData>();
        const variantsToUpdate: any[] = [];
        let skippedCount = 0;
        const errors: string[] = [];

        for (const [index, row] of jsonData.entries()) {
            const sku = row['SKU'] ? String(row['SKU']) : null;
            if (!sku) {
                skippedCount++;
                errors.push(`Row ${index + 2}: Missing required 'SKU'. Row skipped.`);
                continue;
            }

            const variantData: NewProductVariantData = {
                sku: sku,
                size: String(row['Variant Size'] || 'Standard'),
                stock: Number(row['Stock'] || 0),
                price: {
                    walkIn: Number(row['Walk-in Price'] || 0),
                    contractor: Number(row['Contractor Price'] || 0),
                    government: Number(row['Government Price'] || 0),
                    cost: Number(row['Cost Price'] || 0),
                },
                barcode: row['Barcode'] ? String(row['Barcode']) : undefined,
            };

            if (existingSkuMap.has(sku)) {
                // This is an UPDATE
                const existingVariant = existingSkuMap.get(sku)!;
                variantsToUpdate.push({ ...existingVariant, ...variantData });
            } else {
                // This is a NEW variant/product
                const productName = row['Product Name'] ? String(row['Product Name']) : null;
                const mainCategoryName = row['Main Category'] ? String(row['Main Category']) : null;
                const subCategoryName = row['Sub Category'] ? String(row['Sub Category']) : null;
                
                if (!productName || !mainCategoryName || !subCategoryName) {
                    skippedCount++;
                    errors.push(`Row ${index + 2}: New SKU "${sku}" requires a 'Product Name', 'Main Category', and 'Sub Category'. Row skipped.`);
                    continue;
                }
                
                const categoryKey = findCategoryKeyByNames(mainCategoryName, subCategoryName);
                if (!categoryKey) {
                    skippedCount++;
                    errors.push(`Row ${index + 2}: Category combination "${mainCategoryName} > ${subCategoryName}" not found. Row skipped.`);
                    continue;
                }

                if (newProductsMap.has(productName)) {
                    newProductsMap.get(productName)!.variants.push(variantData);
                } else {
                    newProductsMap.set(productName, {
                        name: { en: productName, th: productName },
                        description: { 
                            en: row['Description (EN)'] || '',
                            th: row['Description (TH)'] || '',
                        },
                        category: categoryKey,
                        imageUrl: String(row['Image URL'] || `https://picsum.photos/seed/${productName.replace(/\s/g, '')}/400/400`),
                        variants: [variantData],
                    });
                }
            }
        }
        
        const payload: ProductImportPayload = {
            productsToCreate: Array.from(newProductsMap.values()),
            variantsToUpdate,
        };
        
        setImportPayload(payload);
        setSummary({
            creations: payload.productsToCreate.length,
            updates: payload.variantsToUpdate.length,
            skipped: skippedCount,
            errors,
        });

      } catch (e: any) {
        // FIX: Added missing `updates` and `skipped` properties to satisfy the ImportSummary type.
        setSummary({ creations: 0, updates: 0, skipped: 0, errors: [`Failed to parse file: ${e.message}`] });
        console.error(e);
      }
    };
    // FIX: Added missing `updates` and `skipped` properties to satisfy the ImportSummary type.
    reader.onerror = () => setSummary({ creations: 0, updates: 0, skipped: 0, errors: ['Failed to read the file.'] });
    reader.readAsArrayBuffer(file);
  }, [existingSkuMap]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImportClick = () => {
    if (importPayload) {
      onApplyImport(importPayload);
    }
  };
  
  const handleClose = () => {
    setImportPayload(null);
    setSummary(null);
    setFileName(null);
    onClose();
  };

  const handleDownloadExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const exampleData = [
      {
        'Product Name': 'Steel Rebar',
        'Description (EN)': 'High-tensile deformed steel bars for concrete reinforcement.',
        'Description (TH)': 'เหล็กข้ออ้อยทนแรงดึงสูงสำหรับงานเสริมคอนกรีต',
        'Main Category': 'Building & Construction Materials',
        'Sub Category': 'Steel & Metal',
        'Image URL': 'https://picsum.photos/seed/rebar/400/400',
        'Variant Size': '16mm',
        'SKU': 'RB-16MM', 
        'Stock': 30,
        'Cost Price': 295,
        'Walk-in Price': 385,
        'Contractor Price': 355,
        'Government Price': 370,
        'Barcode': '8854567890124',
      },
      {
        'Product Name': 'New Concrete Block',
        'Description (EN)': 'Standard, non-load-bearing concrete blocks for wall construction.',
        'Description (TH)': 'อิฐบล็อกมาตรฐาน ไม่รับน้ำหนัก สำหรับงานก่อผนัง',
        'Main Category': 'Building & Construction Materials',
        'Sub Category': 'Bricks & Blocks',
        'Image URL': 'https://picsum.photos/seed/new-block/400/400',
        'Variant Size': 'Standard',
        'SKU': 'NCB-STD-01',
        'Stock': 200,
        'Cost Price': 35,
        'Walk-in Price': 45,
        'Contractor Price': 40,
        'Government Price': 42,
        'Barcode': '9988776655111',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    worksheet['!cols'] = [ { wch: 30 }, { wch: 50 }, { wch: 50 }, { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 } ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'ProductImportExample.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={handleClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('import_and_update_products')}</h3>
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
                        <li className="text-green-700"><span className="font-bold">{summary.creations}</span> {t('new_products_will_be_created')}</li>
                        <li className="text-blue-700"><span className="font-bold">{summary.updates}</span> {t('existing_variants_will_be_updated')}</li>
                        {summary.skipped > 0 && <li className="text-yellow-700"><span className="font-bold">{summary.skipped}</span> {t('rows_will_be_skipped')}</li>}
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
            disabled={!importPayload || (importPayload.productsToCreate.length === 0 && importPayload.variantsToUpdate.length === 0)}
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

export default ImportProductsModal;
