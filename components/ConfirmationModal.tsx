
import React from 'react';
// FIX: Corrected import paths
import { XMarkIcon, ExclamationTriangleIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonClass?: string;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, t, confirmText, confirmButtonClass }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-6">
            <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-text-primary" id="modal-title">
                        {title}
                    </h3>
                    <div className="mt-2">
                        <div className="text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: message }} />
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${confirmButtonClass || 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
            onClick={onConfirm}
          >
            {confirmText || t('delete')}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
