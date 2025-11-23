// data.ts
import { Role, ProductStatus, OrderStatus, FulfillmentStatus, PaymentStatus } from './types';
import type { User, Product, Supplier, Customer, Transaction, Order, StoreCredit, ActivityLog } from './types';

// This file is for sample/initial data.
// In a real application, this data would come from a database.
// For now, we will leave it empty and fetch everything from Supabase.

export const PRODUCTS: Product[] = [];
export const TRANSACTIONS: Transaction[] = [];
