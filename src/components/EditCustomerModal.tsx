import React, { useState, useEffect } from 'react';
// FIX: Corrected import paths by removing file extensions.
import type { Customer, NewCustomerData, CustomerType } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditCustomer: (customerData: NewCustomerData) => void;
  customer: Customer | null;
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey) => string;
}

const customerTypes: { id: CustomerType, name: string, key: TranslationKey }[] = [
    { id: 'walkIn', name: 'Walk-in', key: 'walk_in' },
    { id: 'contractor', name: 'Contractor', key: 'contractor' },
    { id: 'government', name: 'Government', key: 'government' },
    { id: 'organization', name: 'Organization', key: 'organization' },
];

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, onClose, onEditCustomer, customer, showAlert, t }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomerType>('walkIn');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setType(customer.type);
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) {
        showAlert(t('missing_information'), t('add_customer_validation'));
        return;
    }
    onEditCustomer({ name, type, phone, address });
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('edit')} "{customer.name}"</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
             <div>
              <label htmlFor="c-edit-name" className="block text-sm font-medium text-text-secondary">{t('customer_name')}</label>
              <input type="text" id="c-edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
            <div>
              <label htmlFor="c-edit-type" className="block text-sm font-medium text-text-secondary">{t('customer_type')}</label>
              <select id="c-edit-type" value={type} onChange={(e) => setType(e.target.value as CustomerType)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background">
                {customerTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{t(ct.key)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="c-edit-phone" className="block text-sm font-medium text-text-secondary">{t('phone')} (Optional)</label>
              <input type="tel" id="c-edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
            </div>
            <div>
              <label htmlFor="c-edit-address" className="block text-sm font-medium text-text-secondary">{t('address')} (Optional)</label>
              <textarea id="c-edit-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
            </div>
          </div>
          <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
              {t('save')}
            </button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerModal;