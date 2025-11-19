import React, { useState, useMemo, useEffect } from 'react';
// FIX: Removed .ts extension for consistent module resolution.
import type { Product, User, ProductVariant, Language } from '../types';
// FIX: Removed .ts extension for consistent module resolution.
import { ProductStatus, Role } from '../types';
// FIX: Removed .tsx extension for consistent module resolution.
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, EyeIcon, QrCodeIcon, ChevronDownIcon, ChevronRightIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, BarcodeIcon, CubeIcon } from './icons/HeroIcons';
// FIX: Removed .ts extension for consistent module resolution.
import type { TranslationKey } from '../translations';
// FIX: Removed .ts extension for consistent module resolution.
import { getCategoryDisplay, getCategoryByKey } from '../categories';

declare const XLSX: any;

interface ProductTableProps {
  products: Product[];
  currentUser: User;
  onAddProductClick: () => void;
  onAddProductByScan: () => void;
  onImportProductsClick: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onShowBarcode: (product: Product, variant: ProductVariant) => void;
  openScanner: (onSuccess: (code: string) => void) => void;
  inventorySearchCode: string | null;
  setInventorySearchCode: (code: string | null) => void;
  t: (key: TranslationKey) => string;
  language: Language;
}

const getStatusColor = (status: ProductStatus) => {
  switch (status) {
    case ProductStatus.IN_STOCK:
      return 'bg-green-100 text-green-800';
    case ProductStatus.LOW_STOCK:
      return 'bg-yellow-100 text-yellow-800';
    case ProductStatus.OUT_OF_STOCK:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  currentUser,
  onAddProductClick,
  onAddProductByScan,
  onImportProductsClick,
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
  onShowBarcode,
  openScanner,
  inventorySearchCode,
  setInventorySearchCode,
  t,
  language
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const canWrite = currentUser.permissions?.inventory.write;
  const canDelete = currentUser.permissions?.inventory.delete;

  useEffect(() => {
    if (inventorySearchCode) {
      setSearchQuery(inventorySearchCode);
      setInventorySearchCode(null);
    }
  }, [inventorySearchCode, setInventorySearchCode]);

  const filteredProducts = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return products.filter(product => {
      const hasMatchingVariant = product.variants.some(variant => {
          const matchesStatus = statusFilter === 'All' || variant.status === statusFilter;
          const categoryNames = getCategoryByKey(product.category);
          const categorySearchString = `${categoryNames.main?.name.en} ${categoryNames.main?.name.th} ${categoryNames.sub?.name.en} ${categoryNames.sub?.name.th}`.toLowerCase();

          const matchesSearch =
            !lowercasedQuery ||
            Object.values(product.name).some(n => String(n).toLowerCase().includes(lowercasedQuery)) ||
            variant.sku.toLowerCase().includes(lowercasedQuery) ||
            (variant.barcode && variant.barcode.toLowerCase().includes(lowercasedQuery)) ||
            categorySearchString.includes(lowercasedQuery);
          return matchesStatus && matchesSearch;
      });
      return hasMatchingVariant;
    });
  }, [products, searchQuery, statusFilter]);

  const toggleExpand = (productId: string) => {
    setExpandedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    const dataForExport = filteredProducts.flatMap(p => {
        const { main, sub } = getCategoryByKey(p.category);
        return p.variants.map(v => ({
            'Product Name': p.name.en,
            'Product Name (TH)': p.name.th,
            'Description (EN)': p.description?.en || '',
            'Description (TH)': p.description?.th || '',
            'Main Category': main?.name.en || '',
            'Sub Category': sub?.name.en || '',
            'Image URL': p.imageUrl,
            'Variant Size': v.size,
            'SKU': v.sku,
            'Stock': v.stock,
            'Cost Price': v.price.cost,
            'Walk-in Price': v.price.walkIn,
            'Contractor Price': v.price.contractor,
            'Government Price': v.price.government,
            'Barcode': v.barcode || '',
            'Status': v.status,
        }))
    });
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    worksheet['!cols'] = [
      { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 40 }, { wch: 15 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'InventoryExport.xlsx');
  };

  const handleScanClick = () => {
    openScanner((scannedCode) => {
      setSearchQuery(scannedCode);
    });
  };
  
  const isInitialLoadAndEmpty = products.length === 0 && searchQuery === '' && statusFilter === 'All';

  return (
    <div className="bg-surface rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">{t('inventory_management')}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('search_or_scan_barcode_placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <button
            onClick={handleScanClick}
            className="flex items-center gap-2 bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <BarcodeIcon className="h-5 w-5" />
            {t('scan')}
          </button>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="block w-full sm:w-auto pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="All">{t('all_statuses')}</option>
            <option value={ProductStatus.IN_STOCK}>{t('in_stock')}</option>
            <option value={ProductStatus.LOW_STOCK}>{t('low_stock')}</option>
            <option value={ProductStatus.OUT_OF_STOCK}>{t('out_of_stock')}</option>
          </select>
          {canWrite && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              {t('export')}
            </button>
          )}
          {canWrite && (
            <button
              onClick={onImportProductsClick}
              className="flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              {t('import')}
            </button>
          )}
          {canWrite && (
             <button
              onClick={onAddProductByScan}
              className="flex items-center gap-2 bg-secondary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              {t('add_by_scan')}
            </button>
          )}
          {canWrite && (
            <button
              onClick={onAddProductClick}
              className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              {t('add_product')}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-3 w-12"></th>
              <th scope="col" className="px-6 py-3">{t('product')}</th>
              <th scope="col" className="px-6 py-3">{t('category')}</th>
              <th scope="col" className="px-6 py-3 text-right">{t('total_stock')}</th>
              <th scope="col" className="px-6 py-3 text-center">{t('variants')}</th>
              <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              const isExpanded = expandedProductIds.has(product.id);
              return (
              <React.Fragment key={product.id}>
                <tr className="bg-white border-b hover:bg-gray-50">
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => toggleExpand(product.id)} className="p-1 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100">
                      {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-2 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl} alt={product.name[language]} className="h-10 w-10 rounded-md object-cover" />
                      <span>{product.name[language]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-xs">{getCategoryDisplay(product.category, language)}</td>
                  <td className="px-6 py-2 text-right font-medium">{totalStock.toLocaleString()}</td>
                  <td className="px-6 py-2 text-center">{product.variants.length.toLocaleString()}</td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => onViewProduct(product)} className="text-gray-500 hover:text-primary p-1" title={t('view_details_tooltip')}><EyeIcon className="h-4 w-4" /></button>
                      {canWrite && (
                        <button onClick={() => onEditProduct(product)} className="text-primary hover:text-blue-700 p-1" title={t('edit_product_tooltip')}><PencilIcon className="h-4 w-4" /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDeleteProduct(product)} className="text-red-600 hover:text-red-800 p-1" title={t('delete_product_tooltip')}><TrashIcon className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-background">
                    <td colSpan={6} className="p-0">
                      <div className="p-4">
                        <table className="w-full text-xs bg-white rounded-md shadow-inner">
                           <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left">{t('size')}</th>
                                <th className="p-2 text-left">{t('sku')}</th>
                                <th className="p-2 text-right">{t('stock')}</th>
                                <th className="p-2 text-right">{t('walk_in_price')}</th>
                                <th className="p-2 text-center">{t('status')}</th>
                                <th className="p-2 text-center">Barcode</th>
                              </tr>
                           </thead>
                           <tbody>
                              {product.variants.map(variant => (
                                <tr key={variant.id} className="border-t">
                                  <td className="p-2 font-semibold">{variant.size}</td>
                                  <td className="p-2 font-mono">{variant.sku}</td>
                                  <td className="p-2 text-right font-medium">{variant.stock.toLocaleString()}</td>
                                  <td className="p-2 text-right">฿{variant.price.walkIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="p-2 text-center">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(variant.status)}`}>{t(variant.status.toLowerCase().replace(' ', '_') as TranslationKey)}</span>
                                  </td>
                                  <td className="p-2 text-center">
                                    {variant.barcode ? <button onClick={() => onShowBarcode(product, variant)} className="text-gray-500 hover:text-primary p-1"><QrCodeIcon className="h-4 w-4"/></button> : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )})}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
            <div className="text-center p-12 text-text-secondary">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_products_found')}</p>
                {isInitialLoadAndEmpty ? (
                     <p className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: t('inventory_empty_message') }} />
                ) : (
                    <p className="text-sm mt-1">{t('try_adjusting_search')}</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductTable;