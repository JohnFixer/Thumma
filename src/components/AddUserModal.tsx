import React, { useState, useEffect } from 'react';
// FIX: Corrected import paths by removing file extensions.
import type { NewUserData } from '../types';
import { Role } from '../types';
import { XMarkIcon, PhotoIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';
import { getPermissionsFromRoles } from '../lib/permissions';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (userData: NewUserData) => void;
  showAlert: (title: string, message: string) => void;
  t: (key: TranslationKey) => string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAddUser, showAlert, t }) => {
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<Role[]>([Role.STORE_STAFF]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [salary, setSalary] = useState<number | ''>('');
  const [wageType, setWageType] = useState<'daily' | 'monthly'>('monthly');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setName('');
      setRoles([Role.STORE_STAFF]);
      setImagePreview(null);
      setSalary('');
      setWageType('monthly');
    }
  }, [isOpen]);

  const handleRoleChange = (role: Role) => {
    setRoles(prevRoles =>
      prevRoles.includes(role)
        ? prevRoles.filter(r => r !== role)
        : [...prevRoles, role]
    );
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || roles.length === 0) {
        showAlert(t('missing_information'), t('add_user_validation'));
        return;
    }
    // Provide a default placeholder if no image is uploaded
    const avatar = imagePreview || `https://i.pravatar.cc/150?u=${name.split(' ').join('')}`;
    const permissions = getPermissionsFromRoles(roles);
    onAddUser({ name, role: roles, avatar, salary: Number(salary) || undefined, wageType: salary ? wageType : undefined, permissions });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('add_new_user')}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
             <div>
              <label className="block text-sm font-medium text-text-secondary">User Avatar (Optional)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Avatar preview" className="mx-auto h-24 w-24 object-cover rounded-full" />
                  ) : (
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="avatar-file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload an image</span>
                      <input id="avatar-file-upload" name="avatar-file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 1MB</p>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary">{t('full_name')}</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-text-secondary">{t('roles')}</label>
                <div className="mt-2 space-y-2 grid grid-cols-2">
                    {Object.values(Role).map(roleValue => (
                        <div key={roleValue} className="flex items-center">
                            <input
                                id={`add-role-${roleValue}`}
                                name="role"
                                type="checkbox"
                                checked={roles.includes(roleValue)}
                                onChange={() => handleRoleChange(roleValue)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`add-role-${roleValue}`} className="ml-3 block text-sm text-text-primary">
                                {t(`role_${roleValue.toLowerCase().replace(/\s/g, '_')}` as TranslationKey)}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t pt-4">
                <h4 className="text-md font-medium text-text-primary mb-1">{t('payroll_info')}</h4>
                <p className="text-xs text-text-secondary mb-3">{t('payroll_info_desc')}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-text-secondary">{t('salary')}</label>
                        <input type="number" id="salary" value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300" placeholder="e.g., 30000" />
                    </div>
                    <div>
                        <label htmlFor="wage-type" className="block text-sm font-medium text-text-secondary">{t('wage_type')}</label>
                        <select id="wage-type" value={wageType} onChange={(e) => setWageType(e.target.value as 'daily' | 'monthly')} className="mt-1 block w-full rounded-md p-2 bg-background border-gray-300">
                            <option value="monthly">{t('wage_type_monthly')}</option>
                            <option value="daily">{t('wage_type_daily')}</option>
                        </select>
                    </div>
                </div>
            </div>
          </div>
          <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
              {t('add_new_user')}
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

export default AddUserModal;