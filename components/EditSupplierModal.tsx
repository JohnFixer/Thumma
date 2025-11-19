import React, { useState, useEffect } from 'react';
import type { Supplier, NewSupplierData } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSupplier: (supplierData: NewSupplierData) => void;
  supplier: Supplier | null;
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey) => string;
}

const EditSupplierModal: React.FC<EditSupplierModalProps> = ({ isOpen, onClose, onEditSupplier, supplier, showAlert, t }) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setLogo(supplier.logo);
      setContactPerson(supplier.contactPerson);
      setEmail(supplier.email);
      setPhone(supplier.phone);
      setAddress(supplier.address);
    }
  }, [supplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson || !email) {
        showAlert(t('missing_information'), t('add_supplier_validation'));
        return;
    }
    onEditSupplier({ name, logo, contactPerson, email, phone, address });
  };

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('edit')} "{supplier.name}"</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
             <div>
              <label htmlFor="s-edit-name" className="block text-sm font-medium text-text-secondary">Supplier Name</label>
              <input type="text" id="s-edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
            <div>
              <label htmlFor="s-edit-contact" className="block text-sm font-medium text-text-secondary">{t('contact_person')}</label>
              <input type="text" id="s-edit-contact" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
            <div>
              <label htmlFor="s-edit-email" className="block text-sm font-medium text-text-secondary">{t('email')}</label>
              <input type="email" id="s-edit-email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
            <div>
              <label htmlFor="s-edit-phone" className="block text-sm font-medium text-text-secondary">{t('phone')}</label>
              <input type="tel" id="s-edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
            </div>
            <div>
              <label htmlFor="s-edit-address" className="block text-sm font-medium text-text-secondary">{t('address')}</label>
              <textarea id="s-edit-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
            </div>
             <div>
              <label htmlFor="s-edit-logo" className="block text-sm font-medium text-text-secondary">Logo URL</label>
              <input type="url" id="s-edit-logo" value={logo} onChange={(e) => setLogo(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
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

export default EditSupplierModal;