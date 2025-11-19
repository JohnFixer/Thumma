import React, { useState, useEffect } from 'react';
import type { StoreSettings, Role } from '../types';
import { Role as RoleEnum } from '../types';
import type { TranslationKey } from '../translations';

interface DashboardManagementViewProps {
    storeSettings: StoreSettings | null;
    onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const ALL_WIDGETS = [
    { key: 'sales_overview', name: 'Sales Overview' },
    { key: 'accounts_payable', name: 'Accounts Payable' },
    { key: 'inventory_overview', name: 'Inventory Overview' },
    { key: 'low_stock_list', name: 'Low Stock List' },
];

const DEFAULT_WIDGETS_VISIBILITY: Record<Role, string[]> = {
    [RoleEnum.CEO]: ['daily_sales_overview', 'sales_overview', 'accounts_payable', 'inventory_overview', 'low_stock_list'],
    [RoleEnum.ADMIN]: ['daily_sales_overview', 'sales_overview', 'accounts_payable', 'inventory_overview', 'low_stock_list'],
    [RoleEnum.ACCOUNT_MANAGER]: ['daily_sales_overview', 'sales_overview', 'accounts_payable'],
    [RoleEnum.STORE_MANAGER]: ['daily_sales_overview', 'sales_overview', 'inventory_overview', 'low_stock_list'],
    [RoleEnum.STORE_STAFF]: ['inventory_overview', 'low_stock_list'],
    [RoleEnum.POS_OPERATOR]: ['daily_sales_overview'],
};


const DashboardManagementView: React.FC<DashboardManagementViewProps> = ({ storeSettings, onUpdateSettings, t }) => {
    const [widgetVisibility, setWidgetVisibility] = useState<Record<Role, string[]>>(
        storeSettings?.dashboard_widget_visibility || DEFAULT_WIDGETS_VISIBILITY
    );

    useEffect(() => {
        if (storeSettings?.dashboard_widget_visibility) {
            const merged: Record<Role, string[]> = { ...DEFAULT_WIDGETS_VISIBILITY };
            for (const role of Object.values(RoleEnum)) {
                merged[role] = storeSettings.dashboard_widget_visibility[role] || DEFAULT_WIDGETS_VISIBILITY[role];
            }
            setWidgetVisibility(merged);
        } else {
            setWidgetVisibility(DEFAULT_WIDGETS_VISIBILITY);
        }
    }, [storeSettings]);
    
    const handleToggleWidget = (role: Role, widgetKey: string) => {
        setWidgetVisibility(prev => {
            const newState = { ...prev };
            const visibleForRole = [...(newState[role] || [])];
            const isVisible = visibleForRole.includes(widgetKey);
    
            let newVisibleList: string[];
            if (isVisible) {
                // Unchecking: remove it
                newVisibleList = visibleForRole.filter(key => key !== widgetKey);
            } else {
                // Checking: add it, maintaining the original order of ALL_WIDGETS
                newVisibleList = ALL_WIDGETS
                    .map(w => w.key)
                    .filter(key => visibleForRole.includes(key) || key === widgetKey);
            }
            newState[role] = newVisibleList;
            return newState;
        });
    };

    const handleSave = () => {
        onUpdateSettings({ dashboard_widget_visibility: widgetVisibility });
    };

    const getTranslatedRole = (role: string): string => {
        const key = `role_${role.toLowerCase().replace(/\s/g, '_')}` as TranslationKey;
        return t(key);
    }
    
    const getTranslatedWidgetName = (key: string): string => {
        const transKey = `widget_${key}` as TranslationKey;
        const defaultName = ALL_WIDGETS.find(w => w.key === key)?.name || key;
        const translated = t(transKey);
        return translated === transKey ? defaultName : translated;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-surface rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-text-primary">{t('dashboard_management')}</h2>
                    <p className="text-text-secondary mt-1">Enable or disable widgets for each role's dashboard view.</p>
                </div>

                <div className="p-6 space-y-8">
                    {(Object.values(RoleEnum) as Role[]).map(role => (
                        <div key={role} className="p-4 border rounded-lg">
                            <h3 className="font-semibold text-xl text-text-primary mb-4">{getTranslatedRole(role)}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {ALL_WIDGETS.map(widget => {
                                    const isChecked = widgetVisibility[role]?.includes(widget.key) || false;
                                    return (
                                        <label key={widget.key} className="flex items-center gap-3 p-3 bg-background rounded-md border hover:border-primary transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleWidget(role, widget.key)}
                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm font-medium text-text-primary flex-grow">
                                                {getTranslatedWidgetName(widget.key)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                 <div className="bg-background px-6 py-4 flex justify-end rounded-b-lg">
                    <button onClick={handleSave} className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800">
                        {t('save_changes')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardManagementView;