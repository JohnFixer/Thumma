
import React, { useState } from 'react';
import type { User } from '../types';
import type { TranslationKey } from '../translations';
import { KeyIcon, ArrowLeftOnRectangleIcon, EyeIcon, EyeSlashIcon } from './icons/HeroIcons';

interface ForcePasswordChangeModalProps {
  isOpen: boolean;
  currentUser: User;
  onUpdatePassword: (userId: string, currentPass: string, newPass: string) => Promise<{success: boolean, message: TranslationKey}>;
  onPasswordChangedSuccessfully: () => void;
  onLogout: () => void;
  t: (key: TranslationKey) => string;
}

const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({ isOpen, currentUser, onUpdatePassword, onPasswordChangedSuccessfully, onLogout, t }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        setIsProcessing(true);

        if (newPassword !== confirmPassword) {
            setFeedback({ type: 'error', message: t("password_update_error_mismatch") });
            setIsProcessing(false);
            return;
        }
        if (newPassword.length < 6) {
            setFeedback({ type: 'error', message: t("password_update_error_too_short") });
            setIsProcessing(false);
            return;
        }

        const result = await onUpdatePassword(currentUser.id, '1234567', newPassword);

        if (result.success) {
            setFeedback({ type: 'success', message: t(result.message) });
            setTimeout(() => {
                onPasswordChangedSuccessfully();
            }, 1000);
        } else {
            setFeedback({ type: 'error', message: t(result.message) });
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <KeyIcon className="mx-auto h-12 w-12 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold text-text-primary">{t('force_password_change_title')}</h3>
                    <p className="mt-2 text-sm text-text-secondary">{t('force_password_change_desc')}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="new-password-force" className="block text-sm font-medium text-text-secondary">{t('new_password')}</label>
                            <div className="relative mt-1">
                                <input
                                    id="new-password-force"
                                    type={isNewPasswordVisible ? "text" : "password"}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-background focus:ring-primary focus:border-primary"
                                    required
                                    autoFocus
                                />
                                <button type="button" onClick={() => setIsNewPasswordVisible(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-600" aria-label={isNewPasswordVisible ? "Hide password" : "Show password"}>
                                    {isNewPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="confirm-password-force" className="block text-sm font-medium text-text-secondary">{t('confirm_new_password')}</label>
                            <div className="relative mt-1">
                                <input
                                    id="confirm-password-force"
                                    type={isConfirmPasswordVisible ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-background focus:ring-primary focus:border-primary"
                                    required
                                />
                                <button type="button" onClick={() => setIsConfirmPasswordVisible(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-600" aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}>
                                    {isConfirmPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        {feedback && (
                            <p className={`text-sm font-medium text-center ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {feedback.message}
                            </p>
                        )}
                    </div>
                    <div className="bg-background px-6 py-4 flex flex-row-reverse items-center justify-between rounded-b-lg">
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm disabled:bg-blue-300"
                        >
                            {isProcessing ? t('processing') : t('update_password')}
                        </button>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                        >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                            {t('logout')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForcePasswordChangeModal;
