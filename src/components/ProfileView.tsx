

import React, { useState, useEffect } from 'react';
import type { User, NewUserData, UserSettings, PaymentMethod, CustomerType } from '../types';
import { Role } from '../types';
import { CameraIcon, KeyIcon, EyeIcon, EyeSlashIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface ProfileViewProps {
    currentUser: User;
    onUpdateUser: (userId: string, data: Partial<Omit<User, 'id' | 'password'>>) => void;
    onUpdatePassword: (userId: string, currentPass: string, newPass: string) => Promise<{success: boolean, message: TranslationKey}>;
    links: Record<string, React.ReactNode>;
    t: (key: TranslationKey) => string;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUpdateUser, onUpdatePassword, links, t }) => {
    const [name, setName] = useState(currentUser.name);
    const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);
    const [settings, setSettings] = useState<UserSettings>(currentUser.settings || {});
    const [infoFeedback, setInfoFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    useEffect(() => {
        setName(currentUser.name);
        setAvatarPreview(currentUser.avatar);
        setSettings(currentUser.settings || {});
        setInfoFeedback(null);
        setPasswordFeedback(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }, [currentUser]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser(currentUser.id, { name, avatar: avatarPreview, role: currentUser.role, settings });
        setInfoFeedback({ type: 'success', message: 'Profile updated successfully!' });
        setTimeout(() => setInfoFeedback(null), 3000);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordFeedback(null);
        if (newPassword !== confirmPassword) {
            setPasswordFeedback({ type: 'error', message: t("password_update_error_mismatch") });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordFeedback({ type: 'error', message: t("password_update_error_too_short") });
            return;
        }
        const result = await onUpdatePassword(currentUser.id, currentPassword, newPassword);
        setPasswordFeedback({ type: result.success ? 'success' : 'error', message: t(result.message) });
        if (result.success) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setTimeout(() => setPasswordFeedback(null), 4000);
    };

    const handleSettingChange = (key: keyof UserSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const userRoles = new Set(currentUser.role);
    const visibleSettingSections = {
        pos: userRoles.has(Role.POS_OPERATOR),
        storeStaff: userRoles.has(Role.STORE_STAFF),
        manager: userRoles.has(Role.STORE_MANAGER) || userRoles.has(Role.ACCOUNT_MANAGER),
        admin: userRoles.has(Role.ADMIN),
    };
    const hasAnySettings = Object.values(visibleSettingSections).some(Boolean);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <form onSubmit={handleInfoSubmit}>
                <div className="bg-surface rounded-lg shadow">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-text-primary">Profile Information</h2>
                        <p className="text-sm text-text-secondary mt-1">Update your personal details here.</p>
                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative w-24 h-24 flex-shrink-0">
                                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-200" />
                                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-800 transition-colors shadow">
                                    <CameraIcon className="h-4 w-4" />
                                    <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <div className="w-full">
                                <label htmlFor="profile-name" className="block text-sm font-medium text-text-secondary">Full Name</label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-background"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface rounded-lg shadow mt-8">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-text-primary">Role-Specific Settings</h2>
                        <p className="text-sm text-text-secondary mt-1">Quick actions and settings based on your role.</p>
                        
                        {hasAnySettings ? (
                             <div className="mt-6 space-y-6">
                                {visibleSettingSections.pos && (
                                    <div>
                                        <h3 className="font-semibold text-text-primary border-b pb-1 mb-3">POS Operator Settings</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="default-payment" className="block text-sm font-medium text-text-secondary">Default Payment Method</label>
                                                <select id="default-payment" value={settings.defaultPaymentMethod || 'Card'} onChange={e => handleSettingChange('defaultPaymentMethod', e.target.value as PaymentMethod)} className="mt-1 block w-full max-w-xs rounded-md p-2 bg-background border-gray-300 shadow-sm">
                                                    <option value="Card">Card</option>
                                                    <option value="Cash">Cash</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center">
                                                <input type="checkbox" id="scan-sound" checked={!!settings.playScanSound} onChange={e => handleSettingChange('playScanSound', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                                <label htmlFor="scan-sound" className="ml-2 block text-sm text-text-primary">Play sound on successful scan</label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                 {visibleSettingSections.storeStaff && (
                                    <div>
                                        <h3 className="font-semibold text-text-primary border-b pb-1 mb-3">Store Staff Settings</h3>
                                    </div>
                                )}
                                 {visibleSettingSections.manager && (
                                    <div>
                                        <h3 className="font-semibold text-text-primary border-b pb-1 mb-3">Manager Settings</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="default-view" className="block text-sm font-medium text-text-secondary">Default View on Login</label>
                                                <select id="default-view" value={settings.defaultLoginView || 'dashboard'} onChange={e => handleSettingChange('defaultLoginView', e.target.value)} className="mt-1 block w-full max-w-xs rounded-md p-2 bg-background border-gray-300 shadow-sm">
                                                    {Object.keys(links).map(link => <option key={link} value={link}>{t(link as TranslationKey)}</option>)}
                                                </select>
                                            </div>
                                             <div>
                                                <label htmlFor="low-stock" className="block text-sm font-medium text-text-secondary">"Low Stock" Alert Threshold</label>
                                                <input type="number" id="low-stock" value={settings.lowStockThreshold || 10} onChange={e => handleSettingChange('lowStockThreshold', parseInt(e.target.value, 10) || 0)} className="mt-1 block w-24 rounded-md p-2 bg-background border-gray-300 shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {visibleSettingSections.admin && (
                                    <div>
                                        <h3 className="font-semibold text-text-primary border-b pb-1 mb-3">Admin Settings</h3>
                                        <div>
                                            <label htmlFor="default-customer-type" className="block text-sm font-medium text-text-secondary">Default Customer Type in POS</label>
                                            <select id="default-customer-type" value={settings.defaultCustomerType || 'walkIn'} onChange={e => handleSettingChange('defaultCustomerType', e.target.value as CustomerType)} className="mt-1 block w-full max-w-xs rounded-md p-2 bg-background border-gray-300 shadow-sm">
                                                <option value="walkIn">Walk-in</option>
                                                <option value="contractor">Contractor</option>
                                                <option value="government">Government</option>
                                                <option value="organization">Organization</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 p-4 bg-background rounded-md text-center text-text-secondary">
                                <p>No specific settings for your role(s) yet.</p>
                                <p className="text-xs">This area will contain shortcuts and options relevant to your daily tasks in the future.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end items-center gap-4 p-6 border-t bg-background rounded-b-lg">
                    {infoFeedback && <p className={`text-sm font-medium ${infoFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{infoFeedback.message}</p>}
                    <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800">Save All Changes</button>
                </div>
            </form>
            
            <div className="bg-surface rounded-lg shadow">
                <form onSubmit={handlePasswordSubmit} className="p-6">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><KeyIcon className="h-5 w-5"/> Security</h2>
                    <p className="text-sm text-text-secondary mt-1">Change your password.</p>
                    <div className="mt-6 space-y-4 max-w-sm">
                        <div>
                            <label htmlFor="current-password"  className="block text-sm font-medium text-text-secondary">Current Password</label>
                            <div className="relative mt-1">
                                <input id="current-password" type={isCurrentPasswordVisible ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-background focus:ring-primary focus:border-primary" required />
                                <button type="button" onClick={() => setIsCurrentPasswordVisible(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-600" aria-label={isCurrentPasswordVisible ? "Hide password" : "Show password"}>
                                    {isCurrentPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="new-password"  className="block text-sm font-medium text-text-secondary">New Password</label>
                             <div className="relative mt-1">
                                <input id="new-password" type={isNewPasswordVisible ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-background focus:ring-primary focus:border-primary" required />
                                <button type="button" onClick={() => setIsNewPasswordVisible(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-600" aria-label={isNewPasswordVisible ? "Hide password" : "Show password"}>
                                    {isNewPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="confirm-password"  className="block text-sm font-medium text-text-secondary">Confirm New Password</label>
                            <div className="relative mt-1">
                                <input id="confirm-password" type={isConfirmPasswordVisible ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-background focus:ring-primary focus:border-primary" required />
                                <button type="button" onClick={() => setIsConfirmPasswordVisible(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-600" aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}>
                                    {isConfirmPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end items-center gap-4">
                        {passwordFeedback && <p className={`text-sm font-medium ${passwordFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordFeedback.message}</p>}
                        <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileView;