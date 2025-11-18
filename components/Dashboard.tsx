
import React, { useMemo } from 'react';
import type { Product, Transaction, Language, Bill, StoreSettings, User, Role } from '../types.ts';
import type { TranslationKey } from '../translations.ts';
import SalesOverviewWidget from './widgets/SalesOverviewWidget.tsx';
import AccountsPayableWidget from './widgets/AccountsPayableWidget.tsx';
import InventoryOverviewWidget from './widgets/InventoryOverviewWidget.tsx';
import LowStockListWidget from './widgets/LowStockListWidget.tsx';
import DailySalesOverviewWidget from './widgets/DailySalesOverviewWidget.tsx';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  bills: Bill[];
  // FIX: Added the 'users' prop to align with its usage in App.tsx.
  users: User[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
  onNavigate: (view: string, state?: any) => void;
  currentUser: User;
  storeSettings: StoreSettings | null;
}

const WIDGETS: Record<string, React.FC<any>> = {
  sales_overview: SalesOverviewWidget,
  accounts_payable: AccountsPayableWidget,
  inventory_overview: InventoryOverviewWidget,
  low_stock_list: LowStockListWidget,
};

const DEFAULT_WIDGETS: string[] = [
  'daily_sales_overview',
  'sales_overview',
  'accounts_payable',
  'inventory_overview',
  'low_stock_list',
];

// FIX: Added 'users' to the component's destructured props to match the updated interface.
const Dashboard: React.FC<DashboardProps> = ({ products, users, transactions, bills, t, language, onNavigate, currentUser, storeSettings }) => {
    
    const visibleWidgets = useMemo(() => {
        // Use the primary role for settings
        const userRole = currentUser.role[0] as Role; 
        const visibilitySettings = storeSettings?.dashboard_widget_visibility;

        let widgetsToShow: string[];

        if (visibilitySettings && visibilitySettings[userRole]) {
            widgetsToShow = visibilitySettings[userRole];
        } else {
            // Default visibility if no setting is found for the role
            widgetsToShow = DEFAULT_WIDGETS;
        }
        
        // Always show Daily Sales Overview at the top, so remove it from the configurable list
        return widgetsToShow.filter(key => key !== 'daily_sales_overview');
    }, [currentUser, storeSettings]);

    const widgetProps = {
        products,
        transactions,
        bills,
        t,
        language,
        onNavigate,
    };

    return (
        <div className="space-y-8">
            {/* Always show Daily Sales Overview at the top for every user */}
            <DailySalesOverviewWidget transactions={transactions} t={t} onNavigate={onNavigate} />

            {visibleWidgets.map(widgetKey => {
                const WidgetComponent = WIDGETS[widgetKey];
                return WidgetComponent ? <WidgetComponent key={widgetKey} {...widgetProps} /> : null;
            })}
        </div>
    );
};

export default Dashboard;