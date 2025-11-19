import React, { useMemo } from 'react';
import type { Product, Transaction, Language, Bill, StoreSettings, User, Role } from '../types';
import type { TranslationKey } from '../translations';
import SalesOverviewWidget from './widgets/SalesOverviewWidget';
import AccountsPayableWidget from './widgets/AccountsPayableWidget';
import InventoryOverviewWidget from './widgets/InventoryOverviewWidget';
import LowStockListWidget from './widgets/LowStockListWidget';
import DailySalesOverviewWidget from './widgets/DailySalesOverviewWidget';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  bills: Bill[];
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

const Dashboard: React.FC<DashboardProps> = ({ products, users, transactions, bills, t, language, onNavigate, currentUser, storeSettings }) => {
    
    const visibleWidgets = useMemo(() => {
        // Use the primary role for settings
        const userRole = currentUser.role[0] as Role; 
        const visibilitySettings = storeSettings?.dashboard_widget_visibility;

        let widgetsToShow: string[];

        if (visibilitySettings && visibilitySettings[userRole as keyof typeof visibilitySettings]) {
            widgetsToShow = visibilitySettings[userRole as keyof typeof visibilitySettings];
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
