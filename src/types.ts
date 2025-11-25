// types.ts

export type Language = 'en' | 'th';

export type LocalizedString = {
  en: string;
  th: string;
};

export enum Role {
  CEO = 'CEO',
  ADMIN = 'Admin',
  ACCOUNT_MANAGER = 'Account Manager',
  STORE_MANAGER = 'Store Manager',
  STORE_STAFF = 'Store Staff',
  POS_OPERATOR = 'POS Operator',
}

export interface PermissionSet {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface UserPermissions {
  dashboard: { read: boolean };
  pos: { read: boolean; write: boolean };
  inventory: PermissionSet;
  returns: { read: boolean; write: boolean };
  customers: PermissionSet;
  suppliers: PermissionSet;
  accounts_payable: PermissionSet;
  accounts_receivable: PermissionSet;
  sales_history: PermissionSet;
  order_fulfillment: { read: boolean; write: boolean };
  customer_assist: { read: boolean };
  end_of_day: { read: boolean; write: boolean };
  shift_history: { read: boolean };
  activity_log: { read: boolean };
  user_management: PermissionSet & { reset_password: boolean };
  store_settings: { read: boolean; write: boolean };
  dashboard_management: { read: boolean; write: boolean };
  category_management: { read: boolean; write: boolean; delete: boolean };
  sidebar: {
    dashboard: boolean;
    pos: boolean;
    inventory: boolean;
    returns: boolean;
    customers: boolean;
    suppliers: boolean;
    accounts_payable: boolean;
    accounts_receivable: boolean;
    sales_history: boolean;
    order_fulfillment: boolean;
    customer_assist: boolean;
    end_of_day: boolean;
    shift_history: boolean;
    activity_log: boolean;
    user_management: boolean;
    store_settings: boolean;
    dashboard_management: boolean;
    category_management: boolean;
  };
}


export interface UserSettings {
  defaultPaymentMethod?: PaymentMethod;
  playScanSound?: boolean;
  defaultInventoryExpanded?: boolean;
  defaultLoginView?: string;
  lowStockThreshold?: number;
  defaultCustomerType?: CustomerType;
  dashboardWidgetOrder?: string[]; // Array of widget IDs in display order
  dashboardVisibleWidgets?: string[]; // Array of visible widget IDs
}

export interface User {
  id: string;
  name: string;
  role: Role[];
  avatar: string;
  password?: string; // Should not be sent to client in a real app
  settings?: UserSettings;
  salary?: number;
  wageType?: 'daily' | 'monthly';
  permissions: UserPermissions;
}

export type NewUserData = Omit<User, 'id' | 'password' | 'settings'>;

export enum ProductStatus {
  IN_STOCK = 'In Stock',
  LOW_STOCK = 'Low Stock',
  OUT_OF_STOCK = 'Out of Stock',
}

export interface StockHistory {
  date: string;
  change: number;
  reason: string;
  operator: string;
}

export interface ProductPrice {
  walkIn: number;
  contractor: number;
  government: number;
  cost: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  stock: number;
  price: ProductPrice;
  status: ProductStatus;
  barcode?: string;
  history: StockHistory[];
}

export type NewProductVariantData = Omit<ProductVariant, 'id' | 'status' | 'history'>;

export interface Product {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  category: string; // e.g., 'building_materials.cement_aggregates'
  imageUrl?: string;
  variants: ProductVariant[];
}

export type NewProductData = Omit<Product, 'id' | 'variants'> & {
  variants: (ProductVariant | NewProductVariantData)[];
};

export interface ProductImportPayload {
  productsToCreate: NewProductData[];
  variantsToUpdate: ProductVariant[];
}

// Category Types
export interface Category {
  id: string;
  name: LocalizedString;
  slug: string;
  parentId: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type NewCategoryData = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;



export enum OrderStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface SupplierOrder {
  orderId: string;
  date: string;
  totalAmount: number;
  status: OrderStatus;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  orderHistory: SupplierOrder[];
}

export type NewSupplierData = Omit<Supplier, 'id' | 'orderHistory'>;

export type CustomerType = 'walkIn' | 'contractor' | 'government' | 'organization';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  address?: string;
}

export type NewCustomerData = Omit<Customer, 'id'>;

export interface CartItem {
  productId: string;
  variantId: string;
  name: LocalizedString;
  size: string;
  imageUrl?: string;
  sku: string;
  quantity: number;
  stock: number;
  price: ProductVariant['price'];
  isOutsourced?: boolean;
  outsourcedCost?: number;
}

export interface ReturnedItem {
  productId: string;
  variantId: string;
  name: LocalizedString;
  size: string;
  quantity: number;
  reason: ReturnReason;
  unitPrice: number;
}

export enum ReturnReason {
  CUSTOMER_CHOICE = 'Customer Choice',
  DAMAGED_PRODUCT = 'Damaged Product',
  WRONG_ITEM = 'Wrong Item',
}

export type PaymentMethod = 'Card' | 'Cash' | 'Bank Transfer' | 'Cheque';

export interface ShiftReportItem {
  productId: string;
  variantId: string;
  productName: LocalizedString;
  variantSize: string;
  quantitySold: number;
  totalSales: number;
  totalProfit: number;
}

export interface ShiftReport {
  id: string;
  startTime: string; // ISO date
  endTime: string; // ISO date
  closedByUserId: string;
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    bankTransfer: number;
  };
  topSellingItems: ShiftReportItem[];
  transactionIds: string[];
}
export enum FulfillmentStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  READY_FOR_PICKUP = 'Ready for Pickup',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum PaymentStatus {
  UNPAID = 'Unpaid',
  PAID = 'Paid',
  PARTIALLY_PAID = 'Partially Paid',
  REFUNDED = 'Refunded',
  CONSOLIDATED = 'Consolidated',
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  transportationFee?: number;
  total: number;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerType: CustomerType;
  operator: string;
  paymentMethod: PaymentMethod;
  vatIncluded: boolean;
  appliedStoreCredit?: { id: string, amount: number };
  returnedItems?: ReturnedItem[];
  shiftId?: string;
  payment_status: PaymentStatus;
  paid_amount: number;
  due_date?: string;
  file_url?: string;
}

export interface Order {
  id: string;
  customer: Customer;
  date: string;
  items: CartItem[];
  total: number;
  transportationFee?: number;
  status: FulfillmentStatus;
  type: 'Pickup' | 'Delivery';
  address?: string;
  notes?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
}


export interface StoreCredit {
  id: string;
  amount: number;
  isUsed: boolean;
  originalTransactionId: string;
  dateIssued: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface StoreSettings {
  id: number;
  store_name: LocalizedString;
  logo_url: string;
  address: LocalizedString;
  phone: LocalizedString;
  tax_id: LocalizedString;
  default_outsource_markup?: number;
  delivery_rate_per_km?: number;
  dashboard_widget_visibility?: Record<Role, string[]>;
}

export enum BillStatus {
  DUE = 'Due',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

export interface BillPayment {
  id: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNote?: string;
}

export interface Bill {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  billDate: string; // ISO date string
  dueDate: string; // ISO date string
  amount: number;
  status: BillStatus;
  paidAmount: number;
  payments: BillPayment[];
  notes?: string;
  fileUrl?: string; // Optional URL to the scanned invoice
}

export type NewBillData = Omit<Bill, 'id' | 'status' | 'paidAmount' | 'payments'> & {
  file?: File;
};

export interface PastInvoiceData {
  id?: string;
  customerId?: string;
  newCustomerName?: string;
  originalInvoiceId: string;
  invoiceDate: string;
  totalAmount: number;
  amountAlreadyPaid: number;
  notes?: string;
  file?: File;
}

export interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}
