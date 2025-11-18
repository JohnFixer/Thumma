
import React, { useState, useEffect } from 'react';
// FIX: Corrected import paths
import type { NewSupplierData } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (supplierData: NewSupplierData) => void;
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey) => string;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose, onAddSupplier, showAlert, t }) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setName('');
      setLogo('https://picsum.photos/seed/newsupplier/100/100');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson || !email) {
        showAlert(t('missing_information'), t('add_supplier_validation'));
        return;
    }
    onAddSupplier({ name, logo, contactPerson, email, phone, address });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('add_new_supplier')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="s-name" className="block text-sm font-medium text-text-secondary">Supplier Name</label>
              <input type="text" id="s-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
            <div>
              <label htmlFor="s-contact" className="block text-sm font-medium text-text-secondary">{t('contact_person')}</label>
              <input type="text" id="s-contact" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
            <div>
              <label htmlFor="s-email" className="block text-sm font-medium text-text-secondary">{t('email')}</label>
              <input type="email" id="s-email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
            <div>
              <label htmlFor="s-phone" className="block text-sm font-medium text-text-secondary">{t('phone')}</label>
              <input type="tel" id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
            </div>
            <div>
              <label htmlFor="s-address" className="block text-sm font-medium text-text-secondary">{t('address')}</label>
              <textarea id="s-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
            </div>
             <div>
              <label htmlFor="s-logo" className="block text-sm font-medium text-text-secondary">Logo URL</label>
              <input type="url" id="s-logo" value={logo} onChange={(e) => setLogo(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" />
            </div>
          </div>
          <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
              {t('add_new_supplier')}
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

export default AddSupplierModal;
