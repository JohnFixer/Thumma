import React from 'react';
// FIX: Corrected import paths by removing file extensions.
import type { User, Supplier, NewSupplierData } from '../types';
import SuppliersTable from './SuppliersTable';
import type { TranslationKey } from '../translations';

interface SuppliersViewProps {
    suppliers: Supplier[];
    currentUser: User;
    onAddSupplier: () => void;
    onEditSupplier: (supplierId: string, data: NewSupplierData) => void;
    onDeleteSupplier: (supplierId: string) => void;
    onImportSuppliersClick: () => void;
    showAlert: (title: string, message: string) => void;
    t: (key: TranslationKey) => string;
}

const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, currentUser, onAddSupplier, onEditSupplier, onDeleteSupplier, onImportSuppliersClick, showAlert, t }) => {
    return (
        <div className="space-y-6">
            <SuppliersTable 
                suppliers={suppliers}
                currentUser={currentUser}
                onAddSupplierClick={onAddSupplier}
                onImportSuppliersClick={onImportSuppliersClick}
                onEditSupplier={onEditSupplier}
                onDeleteSupplier={onDeleteSupplier}
                showAlert={showAlert}
                t={t}
            />
        </div>
    );
};

export default SuppliersView;