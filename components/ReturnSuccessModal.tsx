import React from 'react';
import { XMarkIcon, CheckCircleIcon } from './icons/HeroIcons';
import type { StoreCredit } from '../types';

interface ReturnSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: StoreCredit | null;
}

const ReturnSuccessModal: React.FC<ReturnSuccessModalProps> = ({ isOpen, onClose, credit }) => {
  if (!isOpen || !credit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">Store Credit Issued</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-text-secondary">Store credit has been successfully created.</p>
            <p className="text-3xl font-bold text-primary my-2">฿{credit.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="text-left mt-6 border-t pt-4">
                <h4 className="font-semibold text-text-primary mb-2">Credit Details:</h4>
                <div className="bg-background p-3 rounded-md text-center">
                    <p className="text-sm text-text-secondary">Code:</p>
                    <p className="font-mono text-lg font-semibold text-primary tracking-wider">{credit.id}</p>
                </div>
                <p className="text-xs text-text-secondary mt-2 text-center">Please provide this code to the customer.</p>
            </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 flex justify-end rounded-b-lg">
            <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm"
                onClick={onClose}
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnSuccessModal;