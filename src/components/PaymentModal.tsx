import React, { useState } from 'react';
import { XMarkIcon, CreditCardIcon, CheckCircleIcon, CurrencyDollarIcon, BuildingLibraryIcon } from './icons/HeroIcons';
import type { User, PaymentMethod } from '../types';
import type { TranslationKey } from '../translations';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (method: 'Card' | 'Cash' | 'Bank Transfer') => void;
  totalAmount: number;
  currentUser: User;
  t: (key: TranslationKey) => string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPaymentSuccess, totalAmount, currentUser, t }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const defaultMethod = currentUser.settings?.defaultPaymentMethod || 'Card';

    const handleConfirmPayment = (method: 'Card' | 'Cash' | 'Bank Transfer') => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            setTimeout(() => {
                onPaymentSuccess(method);
                setIsSuccess(false);
            }, 1500); // show success message for 1.5s
        }, 1000); // simulate 1s processing time
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={isProcessing ? undefined : onClose}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">{t('complete_payment')}</h3>
                    {!isProcessing && !isSuccess && (
                        <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
                <div className="p-6 text-center">
                    {isSuccess ? (
                        <div className="flex flex-col items-center gap-4 text-green-600">
                            <CheckCircleIcon className="h-16 w-16" />
                            <p className="text-xl font-semibold">{t('payment_successful')}</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-text-secondary">{t('total_amount_to_pay')}</p>
                            <p className="text-4xl font-bold text-primary my-4">฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-sm text-text-secondary mt-2">{t('choose_payment_method')}</p>
                        </>
                    )}
                </div>
                {!isSuccess && (
                    <div className="bg-background p-4 space-y-3 rounded-b-lg">
                        <button 
                            onClick={() => handleConfirmPayment('Card')}
                            disabled={isProcessing}
                            className={`w-full flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-3 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-blue-300 disabled:cursor-wait ${defaultMethod === 'Card' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        >
                             <CreditCardIcon className="h-5 w-5" />
                            {isProcessing ? t('processing') : t('pay_with_card')}
                        </button>
                         <button 
                            onClick={() => handleConfirmPayment('Cash')}
                            disabled={isProcessing}
                            className={`w-full flex justify-center items-center gap-2 rounded-md border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-200 disabled:cursor-wait ${defaultMethod === 'Cash' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        >
                            <CurrencyDollarIcon className="h-5 w-5" />
                            {isProcessing ? t('processing') : t('pay_with_cash')}
                        </button>
                         <button 
                            onClick={() => handleConfirmPayment('Bank Transfer')}
                            disabled={isProcessing}
                            className={`w-full flex justify-center items-center gap-2 rounded-md border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-200 disabled:cursor-wait ${defaultMethod === 'Bank Transfer' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        >
                            <BuildingLibraryIcon className="h-5 w-5" />
                            {isProcessing ? t('processing') : t('pay_with_bank')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;