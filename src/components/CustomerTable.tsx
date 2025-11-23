import React, { useState, useMemo } from 'react';
// FIX: Corrected import paths by removing file extensions.
import type { Customer, User, NewCustomerData } from '../types';
import { Role, CustomerType } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, UserGroupIcon } from './icons/HeroIcons';
import ConfirmationModal from './ConfirmationModal';
import EditCustomerModal from './EditCustomerModal';
import type { TranslationKey } from '../translations';

declare const XLSX: any;

interface CustomerTableProps {
    customers: Customer[];
    currentUser: User;
    onAddCustomerClick: () => void;
    onImportCustomersClick: () => void;
    onEditCustomer: (customerId: string, data: NewCustomerData) => void;
    onDeleteCustomer: (customerId: string) => void;
    showAlert: (title: string, message: string) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, currentUser, onAddCustomerClick, onImportCustomersClick, onEditCustomer, onDeleteCustomer, showAlert, t }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    const canWrite = currentUser.permissions?.customers.write;
    const canDelete = currentUser.permissions?.customers.delete;

    const getCustomerTypeColor = (type: CustomerType) => {
        switch (type) {
            case 'walkIn': return 'bg-blue-100 text-blue-800';
            case 'contractor': return 'bg-green-100 text-green-800';
            case 'government': return 'bg-indigo-100 text-indigo-800';
            case 'organization': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCustomerTypeName = (type: CustomerType) => {
        const key = type.replace(/([A-Z])/g, '_$1').toLowerCase() as TranslationKey;
        return t(key);
    }

    const filteredCustomers = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        if (!lowercasedQuery) return customers;
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(lowercasedQuery) ||
            (customer.phone && customer.phone.toLowerCase().includes(lowercasedQuery)) ||
            (customer.address && customer.address.toLowerCase().includes(lowercasedQuery))
        );
    }, [customers, searchQuery]);

    const handleDeleteConfirm = () => {
        if (customerToDelete) {
            onDeleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
        }
    };

    const handleEditSave = (customerData: NewCustomerData) => {
        if (customerToEdit) {
            onEditCustomer(customerToEdit.id, customerData);
            setCustomerToEdit(null);
        }
    };

    const handleExport = () => {
        const dataForExport = filteredCustomers.map(c => ({
            'Name': c.name,
            'Type': c.type,
            'Phone': c.phone || '',
            'Address': c.address || '',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataForExport);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 40 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
        XLSX.writeFile(workbook, 'CustomersExport.xlsx');
    };

    return (
        <>
            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">{t('customer_management')}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={t('search_customer_placeholder')}
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
                                    onClick={onImportCustomersClick}
                                    className="flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    <ArrowUpTrayIcon className="h-5 w-5" />
                                    {t('import')}
                                </button>
                                <button
                                    onClick={onAddCustomerClick}
                                    className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    {t('add_new_customer')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('name')}</th>
                                <th scope="col" className="px-6 py-3">{t('type')}</th>
                                <th scope="col" className="px-6 py-3">{t('phone')}</th>
                                <th scope="col" className="px-6 py-3">{t('address')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(customer.type)}`}>
                                            {getCustomerTypeName(customer.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{customer.phone || 'N/A'}</td>
                                    <td className="px-6 py-4 truncate max-w-xs">{customer.address || 'N/A'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => setCustomerToEdit(customer)} disabled={!canWrite} className="text-primary hover:text-blue-700 p-1 disabled:text-gray-300 disabled:cursor-not-allowed" title={t('edit_customer')}><PencilIcon className="h-4 w-4" /></button>
                                            <button onClick={() => setCustomerToDelete(customer)} disabled={!canDelete} className="text-red-600 hover:text-red-800 p-1 disabled:text-gray-300 disabled:cursor-not-allowed" title={t('delete_customer')}><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <div className="text-center p-12 text-text-secondary">
                            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_customers_found')}</p>
                            <p className="text-sm mt-1">{t('try_adjusting_search_or_add_customer')}</p>
                        </div>
                    )}
                </div>
            </div>
            {customerToEdit && (
                <EditCustomerModal
                    isOpen={!!customerToEdit}
                    onClose={() => setCustomerToEdit(null)}
                    onEditCustomer={handleEditSave}
                    customer={customerToEdit}
                    showAlert={showAlert}
                    t={t}
                />
            )}
            {customerToDelete && (
                <ConfirmationModal
                    isOpen={!!customerToDelete}
                    onClose={() => setCustomerToDelete(null)}
                    onConfirm={handleDeleteConfirm}
                    title={t('delete_customer_title')}
                    message={t('delete_customer_confirm_message', { customerName: customerToDelete.name })}
                    t={t}
                />
            )}
        </>
    );
};

export default CustomerTable;