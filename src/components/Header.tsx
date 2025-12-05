import React from 'react';
// FIX: Corrected import paths by removing file extensions.
import type { User, Language } from '../types';
import { BellIcon, LanguageIcon, Bars3Icon, ArrowLeftIcon, ExclamationTriangleIcon, ChevronRightIcon, ArrowPathIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface HeaderProps {
  currentUser: User;
  activeView: string;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  onOpenSidebar: () => void;
  onBack: () => void;
  canGoBack: boolean;
  onForward: () => void;
  canGoForward: boolean;
  originalUser: User | null;
  onStopSimulation: () => void;
  onRefresh?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, activeView, language, setLanguage, t, onOpenSidebar, onBack, canGoBack, onForward, canGoForward, originalUser, onStopSimulation, onRefresh }) => {
  const titleKey = activeView as TranslationKey;
  const simulatedRoleName = originalUser ? currentUser.role[0] : '';

  return (
    <>
      {originalUser && (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-1.5 text-sm font-semibold flex items-center justify-center gap-4 no-print z-20">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>You are simulating the role: <strong>{t(`role_${simulatedRoleName.toLowerCase().replace(/\s/g, '_')}` as TranslationKey)}</strong></span>
          <button onClick={onStopSimulation} className="ml-4 px-3 py-0.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-xs font-bold">
            Stop Simulation
          </button>
        </div>
      )}
      <header className="bg-surface shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSidebar}
            className="p-1 text-text-secondary hover:text-primary md:hidden"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <h2 className="text-xl md:text-2xl font-bold text-text-primary">{t(titleKey)}</h2>

          {/* Navigation Arrows */}
          <div className="flex items-center ml-2">
            {canGoBack && (
              <button
                onClick={onBack}
                className="p-1 text-text-secondary hover:text-primary"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
            )}
            {canGoForward && (
              <button
                onClick={onForward}
                className="p-1 text-text-secondary hover:text-primary"
                aria-label="Go forward"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-text-secondary hover:text-primary"
              title={t('refresh_data') || "Refresh Data"}
            >
              <ArrowPathIcon className="h-6 w-6" />
            </button>
          )}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none bg-transparent pl-8 pr-4 py-1.5 text-sm font-medium text-text-primary focus:outline-none"
            >
              <option value="en">English</option>
              <option value="th">ไทย</option>
            </select>
            <LanguageIcon className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button className="relative text-text-secondary hover:text-primary">
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-surface"></span>
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;