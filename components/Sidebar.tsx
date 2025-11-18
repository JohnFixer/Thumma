import React from 'react';
import type { User, StoreSettings, Language, UserPermissions } from '../types';
import { Role } from '../types';
import { WrenchScrewdriverIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, Cog6ToothIcon, PuzzlePieceIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface SidebarProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  activeView: string;
  links: Record<string, React.ReactNode>;
  storeSettings: StoreSettings | null;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  language: Language;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  originalUser: User | null;
  onStartSimulation: (role: Role) => void;
  onStopSimulation: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onNavigate, activeView, links, storeSettings, t, language, onLogout, isOpen, onClose, originalUser, onStartSimulation, onStopSimulation }) => {

    const handleNavigation = (view: string) => {
        onNavigate(view);
        onClose();
    };

    const handleLogoutClick = () => {
        onLogout();
        onClose();
    };

    const userHasPermission = (linkName: string) => {
        if (!currentUser.permissions) return false;
        return !!currentUser.permissions.sidebar[linkName as keyof UserPermissions['sidebar']];
    };

    const visibleNavLinks = Object.fromEntries(
        Object.entries(links)
            .filter(([name]) => !['my_profile', 'store_settings'].includes(name) && userHasPermission(name))
    );
    
    const canSeeStoreSettings = currentUser.permissions?.store_settings.read;
    const canManageDashboard = currentUser.permissions?.dashboard_management.write;

  const getTranslatedRole = (role: string): string => {
    const key = `role_${role.toLowerCase().replace(/\s/g, '_')}` as TranslationKey;
    return t(key);
  }
  
  const realUser = originalUser || currentUser;
  const isPrivilegedUser = realUser.role.includes(Role.ADMIN) || realUser.role.includes(Role.CEO);

  return (
      <aside className={`bg-primary text-white flex flex-col p-4 no-print w-64 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
            {storeSettings?.logo_url ? (
                <img src={storeSettings.logo_url} alt="Store Logo" className="h-[4.5rem] w-auto" />
            ) : (
                <WrenchScrewdriverIcon className="h-14 w-14 text-secondary" />
            )}
            <h1 className="text-lg font-bold">{storeSettings?.store_name ? storeSettings.store_name[language] : 'บจก ธรรมะคอนกรีต'}</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            <button 
            onClick={() => handleNavigation('my_profile')}
            className="flex items-center text-left w-full gap-3 mb-4 p-3 bg-blue-900/50 rounded-lg hover:bg-blue-900 transition-colors"
            >
            <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full border-2 border-secondary" />
            <div>
                <p className="font-semibold">{currentUser.name}</p>
                <p className="text-xs text-blue-200">{currentUser.role.map(getTranslatedRole).join(', ')}</p>
            </div>
            </button>

            {isPrivilegedUser && (
                <div className="mb-4 px-2 py-3 bg-blue-900/50 rounded-lg">
                    {originalUser ? (
                        <div>
                            <p className="text-xs font-medium text-blue-200">Simulation Active</p>
                            <p className="font-semibold text-white">As: {currentUser.role.map(getTranslatedRole).join(', ')}</p>
                            <button
                                onClick={onStopSimulation}
                                className="w-full mt-2 text-center text-sm font-medium text-white bg-secondary py-1.5 rounded-md hover:bg-orange-700"
                            >
                                Stop Simulation
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="simulate-role" className="block text-xs font-medium text-blue-200">{t('simulate_user')}</label>
                            <select
                                id="simulate-role"
                                value=""
                                onChange={(e) => onStartSimulation(e.target.value as Role)}
                                className="mt-1 block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm rounded-md bg-blue-800 text-white"
                            >
                                <option value="" disabled>Select a role...</option>
                                {Object.values(Role).filter(r => r !== Role.CEO).map(role => (
                                    <option key={role} value={role}>{t(`role_${role.toLowerCase().replace(/\s/g, '_')}` as TranslationKey)}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            <nav className="space-y-2">
                {Object.entries(visibleNavLinks).map(([name, icon]) => (
                <button
                    key={name}
                    onClick={() => handleNavigation(name)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeView === name
                        ? 'bg-secondary text-white'
                        : 'text-blue-100 hover:bg-blue-800'
                    }`}
                >
                    <span className="text-lg">{icon}</span>
                    {t(name as TranslationKey)}
                </button>
                ))}
            </nav>
        </div>

        <div className="border-t border-blue-700/50 pt-2 space-y-1 flex-shrink-0">
            {canSeeStoreSettings && (
                 <button
                    onClick={() => handleNavigation('store_settings')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeView === 'store_settings'
                        ? 'bg-secondary text-white'
                        : 'text-blue-100 hover:bg-blue-800'
                    }`}
                >
                    <Cog6ToothIcon className="h-5 w-5" />
                    {t('store_settings')}
                </button>
            )}
            {canManageDashboard && (
                 <button
                    onClick={() => handleNavigation('dashboard_management')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeView === 'dashboard_management'
                        ? 'bg-secondary text-white'
                        : 'text-blue-100 hover:bg-blue-800'
                    }`}
                >
                    <PuzzlePieceIcon className="h-5 w-5" />
                    {t('dashboard_management')}
                </button>
            )}
            <button
                onClick={() => handleNavigation('my_profile')}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeView === 'my_profile'
                    ? 'bg-secondary text-white'
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                <UserCircleIcon className="h-5 w-5" />
                {t('my_profile')}
            </button>
          <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-800 transition-colors duration-200">
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            {t('logout')}
          </button>
        </div>
      </aside>
  );
};

export default Sidebar;