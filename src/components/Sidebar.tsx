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
        <aside className={`bg-primary text-white flex flex-col p-4 no-print w-64 fixed inset-y-0 left-0 z-[100] transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}>
            <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
                {storeSettings?.logo_url ? (
                    <img src={storeSettings.logo_url} alt="Store Logo" className="h-[4.5rem] w-auto object-contain" />
                ) : (
                    <WrenchScrewdriverIcon className="h-14 w-14 text-secondary flex-shrink-0" />
                )}
                <h1 className="text-lg font-bold leading-tight">{storeSettings?.store_name ? storeSettings.store_name[language] : 'บจก ธรรมะคอนกรีต'}</h1>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-transparent">
                <button
                    onClick={() => handleNavigation('my_profile')}
                    className="flex items-center text-left w-full gap-3 mb-4 p-3 bg-blue-900/50 rounded-lg hover:bg-blue-900 transition-colors flex-shrink-0"
                >
                    <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full border-2 border-secondary flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-semibold truncate">{currentUser.name}</p>
                        <p className="text-xs text-blue-200 truncate">{currentUser.role.map(getTranslatedRole).join(', ')}</p>
                    </div>
                </button>

                {isPrivilegedUser && (
                    <div className="mb-4 px-2 py-3 bg-blue-900/50 rounded-lg">
                        {originalUser ? (
                            <div>
                                <p className="text-xs font-medium text-blue-200">Simulation Active</p>
                                <p className="font-semibold text-white truncate">As: {currentUser.role.map(getTranslatedRole).join(', ')}</p>
                                <button
                                    onClick={onStopSimulation}
                                    className="w-full mt-2 text-center text-sm font-medium text-white bg-secondary py-1.5 rounded-md hover:bg-orange-700 transition-colors"
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
                                        <option key={role as string} value={role as string}>{t(`role_${(role as string).toLowerCase().replace(/\s/g, '_')}` as TranslationKey)}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                <nav className="space-y-1">
                    {Object.entries(visibleNavLinks).map(([name, icon]) => (
                        <button
                            key={name}
                            onClick={() => handleNavigation(name)}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${activeView === name
                                ? 'bg-secondary text-white shadow-sm'
                                : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                }`}
                        >
                            <span className="text-lg flex-shrink-0">{icon}</span>
                            <span className="truncate">{t(name as TranslationKey)}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="border-t border-blue-700/50 pt-2 space-y-1 flex-shrink-0 mt-2">
                {canSeeStoreSettings && (
                    <button
                        onClick={() => handleNavigation('store_settings')}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeView === 'store_settings'
                            ? 'bg-secondary text-white shadow-sm'
                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                            }`}
                    >
                        <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{t('store_settings')}</span>
                    </button>
                )}
                {canManageDashboard && (
                    <button
                        onClick={() => handleNavigation('dashboard_management')}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeView === 'dashboard_management'
                            ? 'bg-secondary text-white shadow-sm'
                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                            }`}
                    >
                        <PuzzlePieceIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{t('dashboard_management')}</span>
                    </button>
                )}
                {canSeeStoreSettings && (
                    <button
                        onClick={() => handleNavigation('category_management')}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeView === 'category_management'
                            ? 'bg-secondary text-white shadow-sm'
                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                            }`}
                    >
                        <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{t('category_management')}</span>
                    </button>
                )}
                <button
                    onClick={() => handleNavigation('my_profile')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeView === 'my_profile'
                        ? 'bg-secondary text-white shadow-sm'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                        }`}
                >
                    <UserCircleIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{t('my_profile')}</span>
                </button>
                <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-800 hover:text-white transition-colors duration-200 whitespace-nowrap">
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{t('logout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
