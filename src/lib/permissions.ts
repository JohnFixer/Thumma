import { Role } from '../types';
import type { UserPermissions } from '../types';

const NO_ACCESS_PERMISSIONS: UserPermissions = {
    dashboard: { read: false },
    pos: { read: false, write: false },
    inventory: { read: false, write: false, delete: false },
    returns: { read: false, write: false },
    customers: { read: false, write: false, delete: false },
    suppliers: { read: false, write: false, delete: false },
    accounts_payable: { read: false, write: false, delete: false },
    accounts_receivable: { read: false, write: false, delete: false },
    sales_history: { read: false, write: false, delete: false },
    order_fulfillment: { read: false, write: false },
    customer_assist: { read: false },
    end_of_day: { read: false, write: false },
    shift_history: { read: false },
    activity_log: { read: false },
    user_management: { read: false, write: false, delete: false, reset_password: false },
    store_settings: { read: false, write: false },
    dashboard_management: { read: false, write: false },
    category_management: { read: false, write: false, delete: false },
    sidebar: {
        dashboard: false, pos: false, inventory: false, returns: false, customers: false, suppliers: false, accounts_payable: false, accounts_receivable: false, sales_history: false, order_fulfillment: false, customer_assist: false, end_of_day: false, shift_history: false, activity_log: false, user_management: false, store_settings: false, dashboard_management: false, category_management: false, daily_expenses: false,
    }
};

const FULL_ACCESS_PERMISSIONS: UserPermissions = {
    dashboard: { read: true },
    pos: { read: true, write: true },
    inventory: { read: true, write: true, delete: true },
    returns: { read: true, write: true },
    customers: { read: true, write: true, delete: true },
    suppliers: { read: true, write: true, delete: true },
    accounts_payable: { read: true, write: true, delete: true },
    accounts_receivable: { read: true, write: true, delete: true },
    sales_history: { read: true, write: true, delete: true },
    order_fulfillment: { read: true, write: true },
    customer_assist: { read: true },
    end_of_day: { read: true, write: true },
    shift_history: { read: true },
    activity_log: { read: true },
    user_management: { read: true, write: true, delete: true, reset_password: true },
    store_settings: { read: true, write: true },
    dashboard_management: { read: true, write: true },
    category_management: { read: true, write: true, delete: true },
    sidebar: {
        dashboard: true, pos: true, inventory: true, returns: true, customers: true, suppliers: true, accounts_payable: true, accounts_receivable: true, sales_history: true, order_fulfillment: true, customer_assist: true, end_of_day: true, shift_history: true, activity_log: true, user_management: true, store_settings: true, dashboard_management: true, category_management: true, daily_expenses: true
    }
};

const ROLE_PERMISSIONS: Record<Role, Partial<UserPermissions>> = {
    [Role.CEO]: FULL_ACCESS_PERMISSIONS,
    [Role.ADMIN]: FULL_ACCESS_PERMISSIONS,
    [Role.ACCOUNT_MANAGER]: {
        dashboard: { read: true },
        customers: { read: true, write: true, delete: false },
        suppliers: { read: true, write: true, delete: false },
        accounts_payable: { read: true, write: true, delete: true },
        accounts_receivable: { read: true, write: true, delete: true },
        sales_history: { read: true, write: false, delete: false },
        end_of_day: { read: true, write: true },
        shift_history: { read: true },
        activity_log: { read: true },
        store_settings: { read: true, write: true },
        sidebar: {
            dashboard: true,
            pos: false,
            inventory: false,
            returns: false,
            customers: true,
            suppliers: true,
            accounts_payable: true,
            accounts_receivable: true,
            sales_history: true,
            order_fulfillment: false,
            customer_assist: false,
            end_of_day: true,
            shift_history: true,
            activity_log: true,
            user_management: false,
            store_settings: true,
            dashboard_management: true,
            category_management: true
        },
    },
    [Role.STORE_MANAGER]: {
        dashboard: { read: true },
        pos: { read: true, write: true },
        inventory: { read: true, write: true, delete: true },
        returns: { read: true, write: true },
        customers: { read: true, write: true, delete: false },
        suppliers: { read: true, write: true, delete: false },
        accounts_payable: { read: true, write: true, delete: false },
        accounts_receivable: { read: true, write: true, delete: false },
        sales_history: { read: true, write: false, delete: false },
        order_fulfillment: { read: true, write: true },
        customer_assist: { read: true },
        end_of_day: { read: true, write: true },
        shift_history: { read: true },
        activity_log: { read: true },
        store_settings: { read: true, write: true },
        sidebar: {
            dashboard: true,
            pos: true,
            inventory: true,
            returns: true,
            customers: true,
            suppliers: true,
            accounts_payable: true,
            accounts_receivable: true,
            sales_history: true,
            order_fulfillment: true,
            customer_assist: true,
            end_of_day: true,
            shift_history: true,
            activity_log: true,
            user_management: false,
            store_settings: true,
            dashboard_management: true,
            category_management: true
        },
    },
    [Role.STORE_STAFF]: {
        dashboard: { read: true },
        pos: { read: true, write: true },
        inventory: { read: true, write: true, delete: false },
        returns: { read: true, write: true },
        customers: { read: true, write: true, delete: false },
        order_fulfillment: { read: true, write: true },
        customer_assist: { read: true },
        sidebar: {
            dashboard: true,
            pos: true,
            inventory: true,
            returns: true,
            customers: true,
            suppliers: false,
            accounts_payable: false,
            accounts_receivable: false,
            sales_history: false,
            order_fulfillment: true,
            customer_assist: true,
            end_of_day: false,
            shift_history: false,
            activity_log: false,
            user_management: false,
            store_settings: false,
            dashboard_management: false,
            category_management: false
        },
    },
    [Role.POS_OPERATOR]: {
        dashboard: { read: true },
        pos: { read: true, write: true },
        returns: { read: true, write: true },
        customers: { read: true, write: false, delete: false },
        customer_assist: { read: true },
        sidebar: {
            dashboard: true,
            pos: true,
            inventory: false,
            returns: true,
            customers: true,
            suppliers: false,
            accounts_payable: false,
            accounts_receivable: false,
            sales_history: false,
            order_fulfillment: false,
            customer_assist: true,
            end_of_day: false,
            shift_history: false,
            activity_log: false,
            user_management: false,
            store_settings: false,
            dashboard_management: false,
            category_management: false
        },
    },
};

// This function merges permissions from multiple roles. It grants the highest level of access.
export const getPermissionsFromRoles = (roles: Role[]): UserPermissions => {
    // Deep clone the base NO_ACCESS_PERMISSIONS object
    const finalPermissions: UserPermissions = JSON.parse(JSON.stringify(NO_ACCESS_PERMISSIONS));

    for (const role of roles) {
        const rolePerms = ROLE_PERMISSIONS[role];
        if (!rolePerms) continue;

        for (const key of Object.keys(finalPermissions)) {
            const section = key as keyof UserPermissions;
            if (rolePerms[section]) {
                for (const perm of Object.keys(finalPermissions[section])) {
                    const permissionKey = perm as keyof typeof finalPermissions[typeof section];
                    if ((rolePerms[section] as any)?.[permissionKey]) {
                        (finalPermissions[section] as any)[permissionKey] = true;
                    }
                }
            }
        }
    }
    return finalPermissions;
};
