import React, { useState, useMemo } from 'react';
// FIX: Corrected import path to ensure module resolution.
import type { Supplier, User, NewSupplierData } from '../types.ts';
// FIX: Corrected import path to ensure module resolution.
import { Role } from '../types.ts';
// FIX: Corrected import path to ensure module resolution.
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, EyeIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, TruckIcon } from './icons/HeroIcons.tsx';
// FIX: Corrected import path to ensure module resolution.
import ConfirmationModal from './ConfirmationModal.tsx';
// FIX: Corrected import path to ensure module resolution.
import EditSupplierModal from './EditSupplierModal.tsx';
// FIX: Corrected import path to ensure module resolution.
import SupplierDetailModal from './SupplierDetailModal.tsx';
// FIX: Corrected import path to ensure module resolution.
import type { TranslationKey } from '../translations.ts';

declare const XLSX: any;

interface SuppliersTableProps {
  suppliers: Supplier[];
  currentUser: User;
  onAddSupplierClick: () => void;
  onImportSuppliersClick: () => void;
  onEditSupplier: (supplierId: string, data: NewSupplierData) => void;
  onDeleteSupplier: (supplierId: string) => void;
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
}

const SuppliersTable: React.FC<SuppliersTableProps> = ({ suppliers, currentUser, onAddSupplierClick, onImportSuppliersClick, onEditSupplier, onDeleteSupplier, showAlert, t }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [supplierToView, setSupplierToView] = useState<Supplier | null>(null);

  const canWrite = currentUser.permissions?.suppliers.write;
  const canDelete = currentUser.permissions?.suppliers.delete;

  const filteredSuppliers = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) {
        return suppliers;
    }
    return suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(lowercasedQuery) ||
        supplier.email.toLowerCase().includes(lowercasedQuery) ||
        supplier.contactPerson.toLowerCase().includes(lowercasedQuery)
    );
  }, [suppliers, searchQuery]);

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
        onDeleteSupplier(supplierToDelete.id);
        setSupplierToDelete(null);
    }
  };

  const handleEditSave = (supplierData: NewSupplierData) => {
    if (supplierToEdit) {
        onEditSupplier(supplierToEdit.id, supplierData);
        setSupplierToEdit(null);
    }
  };
  
  const handleExport = () => {
    const dataForExport = filteredSuppliers.map(s => ({
        'Name': s.name,
        'Contact Person': s.contactPerson,
        'Email': s.email,
        'Phone': s.phone || '',
        'Address': s.address || '',
        'Logo URL': s.logo || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    worksheet['!cols'] = [ { wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 40 }, { wch: 40 } ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    XLSX.writeFile(workbook, 'SuppliersExport.xlsx');
  };

  return (
    <>
        <div className="bg-surface rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">{t('suppliers_overview')}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_suppliers_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                    {canWrite && (
                        <>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                {t('export')}
                            </button>
                             <button
                                onClick={onImportSuppliersClick}
                                className="flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                            >
                                <ArrowUpTrayIcon className="h-5 w-5" />
                                {t('import')}
                            </button>
                            <button 
                                onClick={onAddSupplierClick}
                                className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
                            >
                                <PlusIcon className="h-5 w-5" />
                                {t('add_new_supplier')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3">{t('suppliers')}</th>
                    <th scope="col" className="px-6 py-3">{t('contact_person')}</th>
                    <th scope="col" className="px-6 py-3">{t('email')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                </tr>
            </thead>
            <tbody>
                {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <img src={supplier.logo} alt={supplier.name} className="h-10 w-10 rounded-full object-cover" />
                            <span>{supplier.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">{supplier.contactPerson}</td>
                    <td className="px-6 py-4">{supplier.email}</td>
                    <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => setSupplierToView(supplier)} className="text-gray-500 hover:text-primary p-1"><EyeIcon className="h-4 w-4" /></button>
                        <button onClick={() => setSupplierToEdit(supplier)} disabled={!canWrite} className="text-primary hover:text-blue-700 p-1 disabled:text-gray-300 disabled:cursor-not-allowed"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => setSupplierToDelete(supplier)} disabled={!canDelete} className="text-red-600 hover:text-red-800 p-1 disabled:text-gray-300 disabled:cursor-not-allowed"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            {filteredSuppliers.length === 0 && (
                <div className="text-center p-12 text-text-secondary">
                    <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_suppliers_found')}</p>
                    <p className="text-sm mt-1">{t('try_adjusting_search')}</p>
                </div>
            )}
        </div>
        </div>
        {supplierToView && (
            <SupplierDetailModal
                isOpen={!!supplierToView}
                onClose={() => setSupplierToView(null)}
                supplier={supplierToView}
            />
        )}
        {supplierToEdit && (
             <EditSupplierModal
                isOpen={!!supplierToEdit}
                onClose={() => setSupplierToEdit(null)}
                onEditSupplier={handleEditSave}
                supplier={supplierToEdit}
                showAlert={showAlert}
                t={t}
            />
        )}
        {supplierToDelete && (
             <ConfirmationModal
                isOpen={!!supplierToDelete}
                onClose={() => setSupplierToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={t('delete_supplier_title')}
                message={t('delete_supplier_confirm_message', { supplierName: supplierToDelete.name })}
                t={t}
            />
        )}
    </>
  );
};

export default SuppliersTable;