
import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import type { NewProductData, NewProductVariantData, Product, ProductImportPayload, Category } from '../types';
import { XMarkIcon, ArrowUpTrayIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { getCategoryByKey } from '../categories';

declare const XLSX: any;

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImport: (payload: ProductImportPayload) => void;
  products: Product[];
  categories: Category[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  isSubmitting?: boolean;
}

// Helper for fuzzy matching strings (ignores case, special chars, whitespace)
const levenshtein = (a: string, b: string): number => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const isFuzzyMatch = (str1: string, str2: string): boolean => {
  if (!str1 || !str2) return false;

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F\s]/g, '').trim();
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  // 1. Exact match
  if (s1 === s2) return true;

  // 2. Contains match
  if (s1.includes(s2) || s2.includes(s1)) return true;

  // 3. Word overlap (all words of the shorter string must be in the longer string)
  const words1 = s1.split(/\s+/).filter(w => w.length > 0);
  const words2 = s2.split(/\s+/).filter(w => w.length > 0);

  if (words1.length > 0 && words2.length > 0) {
    const shorter = words1.length < words2.length ? words1 : words2;
    const longer = words1.length < words2.length ? words2 : words1;

    const allWordsPresent = shorter.every(w => longer.includes(w));
    if (allWordsPresent) return true;
  }

  // 4. Levenshtein distance (allow small typos)
  // Allow 1 edit for short strings (< 5 chars), 2 edits for longer strings
  const maxEdits = s1.length < 5 || s2.length < 5 ? 1 : 2;
  const distance = levenshtein(s1, s2);
  return distance <= maxEdits;
};

const findCategoryKeyInList = (categories: Category[], mainName: string, subName: string): { key: string | null, foundMain: Category | null } => {
  // 1. Find Main Category
  const mainCat = categories.find(c => {
    if (c.parentId) return false; // Must be a main category
    return isFuzzyMatch(c.name.en, mainName) || isFuzzyMatch(c.name.th, mainName);
  });

  if (!mainCat) return { key: null, foundMain: null };

  // 2. Find Sub Category (child of mainCat)
  const subCat = categories.find(c => {
    if (c.parentId !== mainCat.id) return false; // Must be child of mainCat
    return isFuzzyMatch(c.name.en, subName) || isFuzzyMatch(c.name.th, subName);
  });

  if (!subCat) return { key: null, foundMain: mainCat };

  return { key: `${mainCat.slug}.${subCat.slug}`, foundMain: mainCat };
};

interface ImportSummary {
  creations: number;
  updates: number;
  skipped: number;
  errors: string[];
}

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose, onApplyImport, products, categories, t, isSubmitting = false }) => {
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
        let targetSheetName = '';
        let headerRowIndex = -1;

        // Scan all sheets to find the one with 'SKU'
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: null });

          // Check first 20 rows for 'SKU'
          const foundRowIndex = sheetData.slice(0, 20).findIndex(row =>
            row && row.some((cell: any) => String(cell).trim().toLowerCase() === 'sku')
          );

          if (foundRowIndex !== -1) {
            targetSheetName = sheetName;
            headerRowIndex = foundRowIndex;
            break;
          }
        }

        if (!targetSheetName) {
          // DEBUG: Header not found in ANY sheet
          const sheetNames = workbook.SheetNames.join(', ');
          setSummary({
            creations: 0,
            updates: 0,
            skipped: 0,
            errors: [
              `Could not find 'SKU' column in any sheet (checked first 20 rows of each).`,
              `Sheets scanned: ${sheetNames}`,
              `Please ensure one of your sheets has a column named 'SKU'.`
            ]
          });
          return;
        }

        // Re-parse the found sheet with the correct header row
        const worksheet = workbook.Sheets[targetSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });

        if (jsonData.length === 0) {
          setSummary({ creations: 0, updates: 0, skipped: 0, errors: ['The file is empty or in an incorrect format.'] });
          return;
        }

        const newProductsMap = new Map<string, NewProductData>();
        const variantsToUpdate: any[] = [];
        let skippedCount = 0;
        const errors: string[] = [];

        const getValue = (row: any, key: string): any => {
          const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
          return foundKey ? row[foundKey] : undefined;
        };

        for (const [index, row] of jsonData.entries()) {
          // Skip empty rows
          if (Object.keys(row).length === 0) continue;

          const sku = getValue(row, 'SKU') ? String(getValue(row, 'SKU')) : null;
          if (!sku) {
            skippedCount++;
            const foundKeys = Object.keys(row).join(', ');
            errors.push(`Row ${index + 2}: Missing required 'SKU'. Found keys: [${foundKeys}]. Row skipped.`);
            continue;
          }

          const variantData: NewProductVariantData = {
            sku: sku,
            size: String(getValue(row, 'Variant Size') || 'Standard'),
            stock: Number(getValue(row, 'Stock') || 0),
            price: {
              walkIn: Number(getValue(row, 'Walk-in Price') || 0),
              contractor: Number(getValue(row, 'Contractor Price') || 0),
              government: Number(getValue(row, 'Government Price') || 0),
              cost: Number(getValue(row, 'Cost Price') || 0),
            },
            barcode: getValue(row, 'Barcode') ? String(getValue(row, 'Barcode')) : undefined,
          };

          if (existingSkuMap.has(sku)) {
            // This is an UPDATE
            const existingVariant = existingSkuMap.get(sku)!;
            variantsToUpdate.push({ ...existingVariant, ...variantData });
          } else {
            // This is a NEW variant/product
            const productName = getValue(row, 'Product Name') ? String(getValue(row, 'Product Name')) : null;
            const mainCategoryName = getValue(row, 'Main Category') ? String(getValue(row, 'Main Category')) : null;
            const subCategoryName = getValue(row, 'Sub Category') ? String(getValue(row, 'Sub Category')) : null;

            if (!productName || !mainCategoryName || !subCategoryName) {
              skippedCount++;
              errors.push(`Row ${index + 2}: New SKU "${sku}" requires a 'Product Name', 'Main Category', and 'Sub Category'. Row skipped.`);
              continue;
            }

            // Use the passed categories prop and fuzzy matching
            const { key: categoryKey, foundMain } = findCategoryKeyInList(categories, mainCategoryName, subCategoryName);

            if (!categoryKey) {
              skippedCount++;
              if (foundMain) {
                // Main category found, but subcategory not found
                const availableSubCats = categories
                  .filter(c => c.parentId === foundMain.id)
                  .map(c => c.name.en)
                  .join(', ');
                errors.push(`Row ${index + 2}: Main Category "${mainCategoryName}" found (matched "${foundMain.name.en}"), but Sub Category "${subCategoryName}" not found. Available Sub Categories: [${availableSubCats}]. Row skipped.`);
              } else {
                // Main category not found
                const availableMainCats = categories.filter(c => !c.parentId).map(c => c.name.en).join(', ');
                errors.push(`Row ${index + 2}: Main Category "${mainCategoryName}" not found. Available Main Categories: [${availableMainCats}]. Row skipped.`);
              }
              continue;
            }

            if (newProductsMap.has(productName)) {
              newProductsMap.get(productName)!.variants.push(variantData);
            } else {
              newProductsMap.set(productName, {
                name: { en: productName, th: productName },
                description: {
                  en: getValue(row, 'Description (EN)') || '',
                  th: getValue(row, 'Description (TH)') || '',
                },
                category: categoryKey,
                imageUrl: getValue(row, 'Image URL') ? String(getValue(row, 'Image URL')) : undefined,
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
        setSummary({ creations: 0, updates: 0, skipped: 0, errors: [`Failed to parse file: ${e.message}`] });
        console.error(e);
      }
    };
    reader.onerror = () => setSummary({ creations: 0, updates: 0, skipped: 0, errors: ['Failed to read the file.'] });
    reader.readAsArrayBuffer(file);
  }, [existingSkuMap]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: isSubmitting, // Disable dropzone when submitting
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
    worksheet['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 50 }, { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'ProductImportExample.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={!isSubmitting ? handleClose : undefined}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('import_and_update_products')}</h3>
          <button onClick={handleClose} disabled={isSubmitting} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div {...getRootProps()} className={`flex justify-center items-center w-full px-6 py-10 border-2 border-gray-300 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-blue-50 border-primary' : 'bg-background hover:bg-gray-100'} ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
            <input {...getInputProps()} disabled={isSubmitting} />
            <div className="text-center">
              <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-text-secondary"><span className="font-semibold text-primary">{t('click_to_upload')}</span> {t('or_drag_and_drop')}</p>
              <p className="text-xs text-gray-500">{t('xlsx_or_csv_file')} <button type="button" onClick={handleDownloadExample} className="font-semibold text-primary hover:underline" disabled={isSubmitting}>{t('download_example_file')}</button></p>
            </div>
          </div>

          {summary && (
            <div className="p-4 bg-background border rounded-md text-sm">
              <p className="font-semibold text-text-primary">{t('import_summary_for')} <span className="font-bold">{fileName}</span>:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li className="text-green-700"><span className="font-bold">{summary.creations}</span> {t('new_products_will_be_created')}</li>
                <li className="text-blue-700"><span className="font-bold">{summary.updates}</span> {t('existing_variants_will_be_updated')}</li>
                {summary.skipped > 0 && <li className="text-yellow-700">{t('rows_will_be_skipped', { count: summary.skipped })}</li>}
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
            disabled={!importPayload || (importPayload.productsToCreate.length === 0 && importPayload.variantsToUpdate.length === 0) || isSubmitting}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('importing')}
              </>
            ) : t('confirm_import')}
          </button>
          <button type="button" onClick={handleClose} disabled={isSubmitting} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportProductsModal;