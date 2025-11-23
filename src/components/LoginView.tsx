
import React, { useState } from 'react';
import type { StoreSettings, Language } from '../types';
import type { TranslationKey } from '../translations';
import { WrenchScrewdriverIcon, LanguageIcon, EyeIcon, EyeSlashIcon } from './icons/HeroIcons';

interface LoginViewProps {
  onLogin: (username: string, password: string) => void;
  storeSettings: StoreSettings | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, storeSettings, language, setLanguage, t }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-xl shadow-lg">
                <div className="text-center">
                    <div className="flex justify-center items-center gap-3 mb-4">
                         {storeSettings?.logo_url ? (
                            <img src={storeSettings.logo_url} alt="Store Logo" className="h-[4.5rem] w-auto" />
                        ) : (
                            <WrenchScrewdriverIcon className="h-14 w-14 text-primary" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">{storeSettings?.store_name ? storeSettings.store_name[language] : 'บจก ธรรมะคอนกรีต'}</h1>
                    <p className="mt-2 text-sm text-text-secondary">{t('please_sign_in')}</p>
                </div>

                <div className="flex justify-center">
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="appearance-none bg-background border border-gray-300 rounded-md pl-8 pr-4 py-1.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            aria-label="Select language"
                        >
                            <option value="en">English</option>
                            <option value="th">ไทย</option>
                        </select>
                        <LanguageIcon className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder={t('username_placeholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Password</label>
                            <div className="relative">
                                <input
                                    id="password-input"
                                    name="password"
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder={t('password_placeholder')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordVisible(prev => !prev)}
                                    className="absolute inset-y-0 right-0 z-20 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            {t('sign_in')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginView;
