import React, { useState } from 'react';
// FIX: Corrected import paths by removing file extensions.
import type { User, Customer, NewCustomerData } from '../types';
import CustomerTable from './CustomerTable';
import AddCustomerModal from './AddCustomerModal';
import type { TranslationKey } from '../translations';

interface CustomersViewProps {
    customers: Customer[];
    currentUser: User;
    onAddCustomer: (customerData: NewCustomerData) => void;
    onEditCustomer: (customerId: string, customerData: NewCustomerData) => void;
    onDeleteCustomer: (customerId: string) => void;
    onImportCustomersClick: () => void;
    showAlert: (title: string, message: string) => void;
    t: (key: TranslationKey) => string;
}

const CustomersView: React.FC<CustomersViewProps> = ({ customers, currentUser, onAddCustomer, onEditCustomer, onDeleteCustomer, onImportCustomersClick, showAlert, t }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddCustomerSubmit = (customerData: NewCustomerData) => {
        onAddCustomer(customerData);
        setIsAddModalOpen(false);
    };
    
    return (
        <>
            <div className="space-y-6">
                <CustomerTable
                    customers={customers}
                    currentUser={currentUser}
                    onAddCustomerClick={() => setIsAddModalOpen(true)}
                    onImportCustomersClick={onImportCustomersClick}
                    onEditCustomer={onEditCustomer}
                    onDeleteCustomer={onDeleteCustomer}
                    showAlert={showAlert}
                    t={t}
                />
            </div>
            <AddCustomerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddCustomer={handleAddCustomerSubmit}
                showAlert={showAlert}
                t={t}
            />
        </>
    );
};

export default CustomersView;