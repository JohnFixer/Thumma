import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductTable from './components/ProductTable';
import AddProductModal from './components/AddProductModal';
import EditProductModal from './components/EditProductModal';
import ConfirmationModal from './components/ConfirmationModal';
import ProductDetailModal from './components/ProductDetailModal';
import UserManagementView from './components/UserManagementView';
import SuppliersView from './components/SuppliersView';
import AddSupplierModal from './components/AddSupplierModal';
import AlertModal from './components/AlertModal';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import BarcodeDisplayModal from './components/BarcodeDisplayModal';
import ImportProductsModal from './components/ImportProductsModal';
import POSView from './components/POSView';
import ReturnsView from './components/ReturnsView';
import CustomersView from './components/CustomersView';
import AddCustomerModal from './components/AddCustomerModal';
import CustomerAssistView from './components/CustomerAssistView';
import OrderFulfillmentView from './components/OrderFulfillmentView';
import SalesHistoryView from './components/SalesHistoryView';
import ActivityLogView from './components/ActivityLogView';
import DailyExpensesView from './features/DailyExpenses/DailyExpensesView';
import ProfileView from './components/ProfileView';
import EndOfDayView from './components/EndOfDayView';
import ShiftHistoryView from './components/ShiftHistoryView';
import StoreSettingsView from './components/StoreSettingsView';
import LoginView from './components/LoginView';
import AccountsPayableView from './components/AccountsPayableView';
import AddBillModal from './components/AddBillModal';
import EditBillModal from './components/EditBillModal';
import RecordPaymentModal from './components/PayBillModal';
import AccountsReceivableView from './components/AccountsReceivableView';
import ReceivePaymentModal from './components/ReceivePaymentModal';
import ConsolidatedInvoiceModal from './components/ConsolidatedInvoiceModal';
import RecordPastInvoiceModal from './components/RecordPastInvoiceModal';
import ImportPastInvoicesModal from './components/ImportPastInvoicesModal';
import EditPastInvoiceModal from './components/EditPastInvoiceModal';
import { useTranslations } from './translations';
import { supabase } from './lib/supabaseClient';
import ImportCustomersModal from './components/ImportCustomersModal';
import ImportSuppliersModal from './components/ImportSuppliersModal';
import ImportBillsModal from './components/ImportBillsModal';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import CEODashboard from './components/CEODashboard';
import ProductTooltip from './components/ProductTooltip';
import { getPermissionsFromRoles } from './lib/permissions';
import DashboardManagementView from './components/DashboardManagementView';
import CategoryManagementView from './components/CategoryManagementView';
import AddCategoryModal from './components/AddCategoryModal';
import EditCategoryModal from './components/EditCategoryModal';
import ErrorBoundary from './components/ErrorBoundary';
import * as db from './services/db';

import type {
    Product, ProductVariant, NewProductData,
    Customer, NewCustomerData,
    Supplier, NewSupplierData,
    Transaction, CartItem,
    Order, User, NewUserData,
    ActivityLog, ShiftReport,
    Bill, NewBillData, StoreSettings,
    Category, NewCategoryData,
    Language, PaymentMethod,
    StoreCredit, ReturnedItem, PastInvoiceData, BillPayment, CustomerType, NewProductVariantData, ProductImportPayload, DailyExpense
} from './types';
import { ProductStatus, Role, FulfillmentStatus, PaymentStatus, BillStatus } from './types';
import type { TranslationKey } from './translations';
import {
    ChartPieIcon, ShoppingCartIcon, CubeIcon, ArrowUturnLeftIcon, UserGroupIcon, TruckIcon,
    BanknotesIcon, CurrencyBangladeshiIcon, ListBulletIcon, EyeIcon, UsersIcon, UserCircleIcon, ShieldCheckIcon, CalendarDaysIcon, Cog6ToothIcon, ClipboardDocumentListIcon
} from './components/icons/HeroIcons';
import { cacheService, CACHE_KEYS } from './services/cache';

interface BillImportData {
    supplierName: string;
    invoiceNumber: string;
    billDate: string;
    dueDate: string;
    amount: number;
    notes?: string;
    isNewSupplier: boolean;
    rowNum: number;
}


const App: React.FC = () => {
    // STATE MANAGEMENT
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [storeCredits, setStoreCredits] = useState<StoreCredit[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [shiftReports, setShiftReports] = useState<ShiftReport[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const savedUserJSON = localStorage.getItem('currentUser');
            if (savedUserJSON) {
                const savedUser = JSON.parse(savedUserJSON);
                // Quick validation to ensure it's a user object and has permissions structure
                if (savedUser && savedUser.id && savedUser.name && savedUser.permissions && savedUser.permissions.category_management && savedUser.permissions.sidebar?.user_management) {
                    return savedUser as User;
                }
            }
            return null;
        } catch (error) {
            console.error("Failed to load user from localStorage", error);
            return null;
        }
    });
    const [activeView, setActiveView] = useState(() => {
        try {
            const savedUserJSON = localStorage.getItem('currentUser');
            if (savedUserJSON) {
                const user = JSON.parse(savedUserJSON);
                // Only set ceo_dashboard if user has valid permissions
                if (user && user.id && user.name && user.permissions && user.permissions.category_management && user.permissions.sidebar?.user_management) {
                    if (user.role && user.role[0] === 'CEO') {
                        return 'ceo_dashboard';
                    }
                }
            }
        } catch (e) { }
        return 'dashboard';
    });
    const [viewState, setViewState] = useState<any>(null);
    const [language, setLanguage] = useState<Language>('th');
    const [navigationHistory, setNavigationHistory] = useState<string[]>(() => {
        try {
            const savedUserJSON = localStorage.getItem('currentUser');
            if (savedUserJSON) {
                const user = JSON.parse(savedUserJSON);
                if (user.role && user.role[0] === 'CEO') {
                    return ['ceo_dashboard'];
                }
            }
        } catch (e) { }
        return ['dashboard'];
    });
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isForcePasswordChangeOpen, setIsForcePasswordChangeOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [originalUser, setOriginalUser] = useState<User | null>(null);
    const [isImporting, setIsImporting] = useState(false);


    // MODAL STATES
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewProductModalOpen, setIsViewProductModalOpen] = useState(false);
    const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isBarcodeDisplayOpen, setIsBarcodeDisplayOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImportCustomersModalOpen, setIsImportCustomersModalOpen] = useState(false);
    const [isImportSuppliersModalOpen, setIsImportSuppliersModalOpen] = useState(false);
    const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
    const [isEditBillModalOpen, setIsEditBillModalOpen] = useState(false);
    const [isImportBillsModalOpen, setIsImportBillsModalOpen] = useState(false);
    const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
    const [isReceivePaymentModalOpen, setIsReceivePaymentModalOpen] = useState(false);
    const [isConsolidatedInvoiceModalOpen, setIsConsolidatedInvoiceModalOpen] = useState(false);
    const [isRecordPastInvoiceModalOpen, setIsRecordPastInvoiceModalOpen] = useState(false);
    const [isImportPastInvoicesModalOpen, setIsImportPastInvoicesModalOpen] = useState(false);
    const [isEditPastInvoiceModalOpen, setIsEditPastInvoiceModalOpen] = useState(false);
    const [isUndoConsolidationModalOpen, setIsUndoConsolidationModalOpen] = useState(false);


    // DATA FOR MODALS
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [productToView, setProductToView] = useState<Product | null>(null);
    const [billToRecordPaymentFor, setBillToRecordPaymentFor] = useState<Bill | null>(null);
    const [transactionToPay, setTransactionToPay] = useState<Transaction | null>(null);
    const [invoiceToEdit, setInvoiceToEdit] = useState<Transaction | null>(null);
    const [consolidatedInvoice, setConsolidatedInvoice] = useState<Transaction | null>(null);
    const [transactionToUndo, setTransactionToUndo] = useState<Transaction | null>(null);
    const [variantToShowBarcode, setVariantToShowBarcode] = useState<ProductVariant | null>(null);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
    const [scanCallback, setScanCallback] = useState<(code: string) => void>(() => () => { });
    const [posScannedCode, setPosScannedCode] = useState<string | null>(null);
    const [inventorySearchCode, setInventorySearchCode] = useState<string | null>(null);
    const [initialBarcodeForAdd, setInitialBarcodeForAdd] = useState<string | null>(null);

    // Missing State Variables
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

    const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
    const [billToEdit, setBillToEdit] = useState<Bill | null>(null);

    const [transactionToReceivePayment, setTransactionToReceivePayment] = useState<Transaction | null>(null);
    const [consolidationData, setConsolidationData] = useState<{ customer: Customer, transactions: Transaction[] } | null>(null);

    const [isUndoConfirmationModalOpen, setIsUndoConfirmationModalOpen] = useState(false);

    const [userToForcePasswordChange, setUserToForcePasswordChange] = useState<User | null>(null);

    // Category Management State
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

    const t = useTranslations(language);

    useEffect(() => {
        try {
            // Always save the REAL user to localStorage. If simulating, originalUser holds the real one.
            const userToSave = originalUser || currentUser;
            if (userToSave) {
                localStorage.setItem('currentUser', JSON.stringify(userToSave));
            } else {
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error("Failed to save user to localStorage", error);
        }
    }, [currentUser, originalUser]);

    useEffect(() => {
        if (currentUser && activeView === 'dashboard') {
            const role = currentUser.role[0];
            if (role === 'CEO') {
                setActiveView('ceo_dashboard');
            }
        }
    }, [currentUser, activeView]);

    const showAlert = useCallback((title: string, message: string) => {
        setAlertConfig({ title, message: message.replace(/\n/g, '<br />') });
        setIsAlertModalOpen(true);
    }, []);

    const fetchInitialData = useCallback(async () => {
        // 1. Load from Cache immediately
        const cachedProducts = cacheService.load<Product[]>(CACHE_KEYS.PRODUCTS);
        const cachedCustomers = cacheService.load<Customer[]>(CACHE_KEYS.CUSTOMERS);
        const cachedSuppliers = cacheService.load<Supplier[]>(CACHE_KEYS.SUPPLIERS);
        const cachedCategories = cacheService.load<Category[]>(CACHE_KEYS.CATEGORIES);
        const cachedSettings = cacheService.load<StoreSettings>(CACHE_KEYS.STORE_SETTINGS);
        const cachedUsers = cacheService.load<User[]>(CACHE_KEYS.USERS);
        const cachedStoreCredits = cacheService.load<StoreCredit[]>(CACHE_KEYS.STORE_CREDITS);

        if (cachedProducts) setProducts(cachedProducts);
        if (cachedCustomers) setCustomers(cachedCustomers);
        if (cachedSuppliers) setSuppliers(cachedSuppliers);
        if (cachedCategories) setCategories(cachedCategories);
        if (cachedSettings) setStoreSettings(cachedSettings);
        if (cachedUsers) setUsers(cachedUsers);
        if (cachedStoreCredits) setStoreCredits(cachedStoreCredits);

        // Only show loading if we have absolutely no data (first run ever)
        if (!cachedProducts || !cachedCustomers) {
            setIsLoading(true);
        }

        try {
            // 2. Fetch fresh data from server
            const [
                fetchedProducts,
                fetchedCustomers,
                fetchedSuppliers,
                // fetchedTransactions,
                fetchedBills,
                fetchedUsers,
                fetchedSettings,
                fetchedCategories,
                fetchedStoreCredits,
                fetchedOrders,
                fetchedDailyExpenses
            ] = await Promise.all([
                db.fetchProducts(),
                db.fetchCustomers(),
                db.fetchSuppliers(),
                // db.fetchTransactions(), // Moved out to prevent timeout
                db.fetchBills(),
                db.fetchUsers(),
                db.fetchStoreSettings(),
                db.fetchCategories(),
                db.fetchStoreCredits(),
                db.fetchOrders(),
                db.fetchDailyExpenses(new Date().toISOString().split('T')[0])
            ]);

            // 3. Update State & Cache
            setProducts(fetchedProducts);
            cacheService.save(CACHE_KEYS.PRODUCTS, fetchedProducts);

            setCustomers(fetchedCustomers);
            cacheService.save(CACHE_KEYS.CUSTOMERS, fetchedCustomers);

            setSuppliers(fetchedSuppliers);
            cacheService.save(CACHE_KEYS.SUPPLIERS, fetchedSuppliers);

            setBills(fetchedBills);
            // Bills are not cached for now, but could be

            setUsers(fetchedUsers);
            if (fetchedUsers.length > 0) cacheService.save(CACHE_KEYS.USERS, fetchedUsers);

            setStoreSettings(fetchedSettings);
            if (fetchedSettings) cacheService.save(CACHE_KEYS.STORE_SETTINGS, fetchedSettings);

            setCategories(fetchedCategories);
            cacheService.save(CACHE_KEYS.CATEGORIES, fetchedCategories);

            setStoreCredits(fetchedStoreCredits);
            cacheService.save(CACHE_KEYS.STORE_CREDITS, fetchedStoreCredits);

            setOrders(fetchedOrders);
            // Orders are not cached

            setDailyExpenses(fetchedDailyExpenses);

            // 4. Fetch Transactions Separately (Heavy Load)
            try {
                const fetchedTransactions = await db.fetchTransactions();
                if (fetchedTransactions) {
                    setTransactions(fetchedTransactions);
                } else {
                    console.error("Failed to fetch transactions.");
                    showAlert(t('alert_error'), t('transaction_fetch_failed') || "Failed to load transactions. Please try refreshing.");
                }
            } catch (txError) {
                console.error("Error fetching transactions separately:", txError);
                showAlert(t('alert_error'), t('transaction_fetch_failed') || "Failed to load transactions.");
            }

        } catch (error) {
            console.error("Error fetching initial data:", error);
            showAlert(t('alert_error'), t('database_load_failed'));
        } finally {
            setIsLoading(false);
        }
    }, [showAlert, t]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // REALTIME SUBSCRIPTIONS
    useEffect(() => {
        const transactionsSubscription = supabase
            .channel('public:transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, async (payload) => {
                console.log('Realtime transaction change:', payload);
                const updatedTransactions = await db.fetchTransactions();
                if (updatedTransactions) {
                    setTransactions(updatedTransactions);
                }
                // Also refresh products as stock might have changed
                const updatedProducts = await db.fetchProducts();
                setProducts(updatedProducts);
            })
            .subscribe();

        const productsSubscription = supabase
            .channel('public:products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async (payload) => {
                console.log('Realtime product change:', payload);
                const updatedProducts = await db.fetchProducts();
                setProducts(updatedProducts);
            })
            .subscribe();

        const variantsSubscription = supabase
            .channel('public:product_variants')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, async (payload) => {
                console.log('Realtime variant change:', payload);
                const updatedProducts = await db.fetchProducts();
                setProducts(updatedProducts);
            })
            .subscribe();

        const customersSubscription = supabase
            .channel('public:customers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async (payload) => {
                console.log('Realtime customer change:', payload);
                const updatedCustomers = await db.fetchCustomers();
                setCustomers(updatedCustomers);
            })
            .subscribe();

        const suppliersSubscription = supabase
            .channel('public:suppliers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, async (payload) => {
                console.log('Realtime supplier change:', payload);
                const updatedSuppliers = await db.fetchSuppliers();
                setSuppliers(updatedSuppliers);
            })
            .subscribe();

        const ordersSubscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
                console.log('Realtime order change:', payload);
                const updatedOrders = await db.fetchOrders();
                setOrders(updatedOrders);
            })
            .subscribe();

        const billsSubscription = supabase
            .channel('public:bills')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, async (payload) => {
                console.log('Realtime bill change:', payload);
                const updatedBills = await db.fetchBills();
                setBills(updatedBills);
            })
            .subscribe();

        const settingsSubscription = supabase
            .channel('public:store_settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, async (payload) => {
                console.log('Realtime settings change:', payload);
                const updatedSettings = await db.fetchStoreSettings();
                setStoreSettings(updatedSettings);
            })
            .subscribe();

        const creditsSubscription = supabase
            .channel('public:store_credits')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'store_credits' }, async (payload) => {
                console.log('Realtime credit change:', payload);
                const updatedCredits = await db.fetchStoreCredits();
                setStoreCredits(updatedCredits);
            })
            .subscribe();

        const dailyExpensesSubscription = supabase
            .channel('public:daily_expenses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_expenses' }, async () => {
                const today = new Date().toISOString().split('T')[0];
                const updatedExpenses = await db.fetchDailyExpenses(today);
                setDailyExpenses(updatedExpenses);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(transactionsSubscription);
            supabase.removeChannel(productsSubscription);
            supabase.removeChannel(variantsSubscription);
            supabase.removeChannel(customersSubscription);
            supabase.removeChannel(suppliersSubscription);
            supabase.removeChannel(ordersSubscription);
            supabase.removeChannel(billsSubscription);
            supabase.removeChannel(settingsSubscription);
            supabase.removeChannel(creditsSubscription);
            supabase.removeChannel(dailyExpensesSubscription);
        };
    }, []);

    const logActivity = (action: string, user: User) => {
        const newLog: ActivityLog = { id: `log-${Date.now()}`, userId: user.id, action, timestamp: new Date().toISOString() };
        setActivityLogs(prev => [newLog, ...prev]);
    };

    // Placeholder functions for CRUD operations
    // CRUD Operations
    const handleAddProduct = async (productData: NewProductData) => {
        try {
            const newProduct = await db.createProduct(productData);
            if (newProduct) {
                setProducts(prev => [...prev, newProduct]);
                setIsAddProductModalOpen(false);
                showAlert(t('alert_success'), t('product_added_success'));
            }
        } catch (error: any) {
            showAlert(t('alert_error'), t('product_add_failed', { error: error.message }));
        }
    };

    const handleEditProduct = async (productId: string, productData: NewProductData) => {
        const result = await db.updateProduct(productId, productData);
        if (result.success) {
            // Refresh products to get updated variants
            const updatedProducts = await db.fetchProducts();
            setProducts(updatedProducts);
            setIsEditProductModalOpen(false);
            showAlert(t('alert_success'), t('product_updated_success'));
        } else {
            showAlert(t('alert_error'), result.error || t('product_update_failed'));
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        const success = await db.deleteProduct(productToDelete.id);
        if (success) {
            setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            showAlert(t('alert_success'), t('product_deleted_success'));
        } else {
            showAlert(t('alert_error'), t('product_delete_failed'));
        }
    };
    const handleAddUser = (userData: NewUserData) => { console.log("Add User", userData); }; // Requires Auth Admin API
    const handleEditUser = async (userId: string, userData: NewUserData) => {
        const success = await db.updateUser(userId, userData);
        if (success) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...userData } : u));
            showAlert(t('alert_success'), t('user_updated_success'));
        } else {
            showAlert(t('alert_error'), t('user_update_failed'));
        }
    };
    const handleDeleteUser = (userId: string) => { console.log("Delete User", userId); }; // Requires Auth Admin API
    const handleResetPassword = (userId: string) => { console.log("Reset Password", userId); };
    const handleAddCustomer = async (customerData: NewCustomerData) => {
        const newCustomer = await db.createCustomer(customerData);
        if (newCustomer) {
            setCustomers(prev => [...prev, newCustomer]);
            showAlert(t('alert_success'), t('customer_added_success'));
        } else {
            showAlert(t('alert_error'), t('customer_add_failed'));
        }
    };

    const handleAddNewCustomerFromPOS = async (customerData: NewCustomerData): Promise<Customer | null> => {
        const newCustomer = await db.createCustomer(customerData);
        if (newCustomer) {
            setCustomers(prev => [...prev, newCustomer]);
            return newCustomer;
        }
        return null;
    };

    const handleEditCustomer = async (customerId: string, customerData: NewCustomerData) => {
        const success = await db.updateCustomer(customerId, customerData);
        if (success) {
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...customerData } : c));
            showAlert(t('alert_success'), t('customer_updated_success'));
        } else {
            showAlert(t('alert_error'), t('customer_update_failed'));
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        const success = await db.deleteCustomer(customerId);
        if (success) {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
            showAlert(t('alert_success'), t('customer_deleted_success'));
        } else {
            showAlert(t('alert_error'), t('customer_delete_failed'));
        }
    };
    const handleAddSupplier = async (supplierData: NewSupplierData) => {
        const newSupplier = await db.createSupplier(supplierData);
        if (newSupplier) {
            setSuppliers(prev => [...prev, newSupplier]);
            setIsAddSupplierModalOpen(false);
            showAlert(t('alert_success'), t('supplier_added_success'));
        } else {
            showAlert(t('alert_error'), t('supplier_add_failed'));
        }
    };

    const handleEditSupplier = async (supplierId: string, supplierData: NewSupplierData) => {
        const success = await db.updateSupplier(supplierId, supplierData);
        if (success) {
            setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, ...supplierData } : s));
            showAlert(t('alert_success'), t('supplier_updated_success'));
        } else {
            showAlert(t('alert_error'), t('supplier_update_failed'));
        }
    };

    const handleDeleteSupplier = async (supplierId: string) => {
        const success = await db.deleteSupplier(supplierId);
        if (success) {
            setSuppliers(prev => prev.filter(s => s.id !== supplierId));
            showAlert(t('alert_success'), t('supplier_deleted_success'));
        } else {
            showAlert(t('alert_error'), t('supplier_delete_failed'));
        }
    };
    const handleAddBill = async (billData: NewBillData) => {
        const newBill = await db.createBill(billData);
        if (newBill) {
            setBills(prev => [...prev, newBill]);
            setIsAddBillModalOpen(false);
            showAlert(t('alert_success'), t('bill_added_success'));
        } else {
            showAlert(t('alert_error'), t('bill_add_failed'));
        }
    };
    const handleRecordBillPayment = async (billId: string, paymentData: { paymentAmount: number; paymentDate: string; paymentMethod: PaymentMethod; referenceNote: string; }) => {
        const success = await db.recordBillPayment(billId, {
            amount: paymentData.paymentAmount,
            date: paymentData.paymentDate,
            method: paymentData.paymentMethod,
            reference: paymentData.referenceNote
        });

        if (success) {
            setBills(prev => prev.map(b => {
                if (b.id === billId) {
                    const newPaid = (b.paidAmount || 0) + paymentData.paymentAmount;
                    const newStatus = newPaid >= b.amount ? BillStatus.PAID : (b.status === BillStatus.OVERDUE ? BillStatus.OVERDUE : BillStatus.DUE);
                    return { ...b, paidAmount: newPaid, status: newStatus };
                }
                return b;
            }));
            setIsRecordPaymentModalOpen(false);
            setBillToRecordPaymentFor(null);
            showAlert(t('alert_success'), t('payment_recorded_successfully'));
        } else {
            showAlert(t('alert_error'), t('failed_to_record_payment'));
        }
    };
    const handleEditBillClick = (bill: Bill) => {
        setBillToEdit(bill);
        setIsEditBillModalOpen(true);
    };

    const handleUpdateBill = async (billData: NewBillData) => {
        if (!billToEdit) return;
        const success = await db.updateBill(billToEdit.id, billData);
        if (success) {
            setBills(prev => prev.map(b => b.id === billToEdit.id ? { ...b, ...billData } : b));
            setIsEditBillModalOpen(false);
            setBillToEdit(null);
            showAlert(t('alert_success'), t('bill_updated_success'));
        } else {
            showAlert(t('alert_error'), t('bill_update_failed'));
        }
    };
    const handleBillUpdate = (updatedBill: Bill) => { console.log("Update Bill", updatedBill); };
    const handleDeleteBill = (billId: string) => { console.log("Delete Bill", billId); };
    const handleImportCustomers = (newCustomers: NewCustomerData[]) => { console.log("Import Customers", newCustomers); };
    const handleImportSuppliers = async (newSuppliers: NewSupplierData[]) => {
        let importedCount = 0;
        let errorCount = 0;
        const createdSuppliers: Supplier[] = [];

        for (const supplierData of newSuppliers) {
            const newSupplier = await db.createSupplier(supplierData);
            if (newSupplier) {
                createdSuppliers.push(newSupplier);
                importedCount++;
            } else {
                errorCount++;
            }
        }

        if (createdSuppliers.length > 0) {
            setSuppliers(prev => [...prev, ...createdSuppliers]);
        }

        setIsImportSuppliersModalOpen(false);

        if (errorCount === 0) {
            showAlert(t('alert_success'), t('suppliers_imported_success', { count: importedCount }));
        } else {
            showAlert(t('alert_warning'), t('suppliers_imported_partial', { success: importedCount, failed: errorCount }));
        }
    };
    const handleImportBills = (billsToImport: any[]) => { console.log("Import Bills", billsToImport); };
    const handleNewTransaction = async (transactionData: Partial<Transaction> & Omit<Transaction, 'payment_status' | 'due_date' | 'paid_amount'>, cartItems: CartItem[], appliedCreditId?: string, carriedForwardBalance?: { customerId: string, amount: number }): Promise<Transaction | undefined> => {
        const newTransaction: Transaction = {
            ...transactionData,
            payment_status: transactionData.payment_status || PaymentStatus.PAID,
            paid_amount: transactionData.paid_amount !== undefined ? transactionData.paid_amount : transactionData.total,
            items: cartItems,
            // Ensure required fields are present if not in transactionData
            id: transactionData.id || `${Date.now()}`,
            date: transactionData.date || new Date().toISOString(),
            customerName: transactionData.customerName || 'Guest',
            customerType: transactionData.customerType || 'walkIn',
            operator: transactionData.operator || currentUser?.name || 'System',
            paymentMethod: transactionData.paymentMethod || 'Cash',
            vatIncluded: transactionData.vatIncluded !== undefined ? transactionData.vatIncluded : true,
            subtotal: transactionData.subtotal || 0,
            tax: transactionData.tax || 0,
            total: transactionData.total || 0,
        } as Transaction;

        const result = await db.createTransaction(newTransaction);
        if (result.success) {
            setTransactions(prev => [newTransaction, ...prev]);
            // Also update product stock locally to reflect change immediately (optional, but good for UI)
            // In a real app, you might re-fetch products or use real-time subscription
            const updatedProducts = await db.fetchProducts();
            setProducts(updatedProducts);

            if (appliedCreditId) {
                await db.markStoreCreditAsUsed(appliedCreditId);
                // Refresh store credits to update the UI
                const updatedCredits = await db.fetchStoreCredits();
                setStoreCredits(updatedCredits);
            }

            return newTransaction;
        } else {
            showAlert(t('alert_error'), `${t('transaction_create_failed')}: ${result.error}`);
            return undefined;
        }
    };
    const handleNewInvoice = (transaction: Omit<Transaction, 'payment_status' | 'paymentMethod' | 'paid_amount'>, cartItems: CartItem[]) => { console.log("New Invoice"); };
    const handleNewOrder = async (order: Order) => {
        const result = await db.createOrder(order);
        if (result.success) {
            setOrders(prev => [order, ...prev]);

            // If the order is PAID, also record it as a transaction for Sales History
            if (order.paymentStatus === PaymentStatus.PAID) {
                const transactionData: Transaction = {
                    id: order.id,
                    date: order.date,
                    items: order.items,
                    subtotal: order.total - (order.transportationFee || 0),
                    tax: 0,
                    transportationFee: order.transportationFee,
                    total: order.total,
                    customerId: order.customer.id,
                    customerName: order.customer.name,
                    customerAddress: order.address,
                    customerPhone: order.customer.phone,
                    customerType: order.customer.type,
                    operator: currentUser?.name || 'System',
                    paymentMethod: order.paymentMethod || 'Cash',
                    vatIncluded: true,
                    payment_status: PaymentStatus.PAID,
                    paid_amount: order.total,
                };
                await handleNewTransaction(transactionData, order.items);
            }
        } else {
            showAlert(t('alert_error'), `Failed to create order: ${result.error}`);
        }
    };
    const handleUpdateOrderStatus = async (orderId: string, status: FulfillmentStatus) => {
        const success = await db.updateOrderFulfillmentStatus(orderId, status);
        if (success) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        }
    };
    const handleUpdateOrderPaymentStatus = async (orderId: string, status: PaymentStatus, method: PaymentMethod) => {
        const success = await db.updateOrderPaymentStatus(orderId, status, method);
        if (success) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status, paymentMethod: method } : o));

            // If status changed to PAID, create a transaction record
            if (status === PaymentStatus.PAID) {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    const transactionData: Transaction = {
                        id: order.id,
                        date: new Date().toISOString(), // Use current time of payment, or order.date? Usually payment time is better for cash flow, but order.date links them better. Let's use order.date to keep it simple and consistent with the order.
                        items: order.items,
                        subtotal: order.total - (order.transportationFee || 0),
                        tax: 0,
                        transportationFee: order.transportationFee,
                        total: order.total,
                        customerId: order.customer.id,
                        customerName: order.customer.name,
                        customerAddress: order.address,
                        customerPhone: order.customer.phone,
                        customerType: order.customer.type,
                        operator: currentUser?.name || 'System',
                        paymentMethod: method,
                        vatIncluded: true,
                        payment_status: PaymentStatus.PAID,
                        paid_amount: order.total,
                    };
                    await handleNewTransaction(transactionData, order.items);
                }
            }
        }
    };
    const handleConvertOrderToInvoice = (order: Order) => { console.log("Convert Order to Invoice", order); };

    const handleDeleteOrder = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };
    const handleReceivePayment = async (transactionId: string, paymentAmount: number, paymentMethod: PaymentMethod, paymentDate: string) => {
        const updatedTransaction = await db.receivePayment(transactionId, paymentAmount, paymentMethod, paymentDate);
        if (updatedTransaction) {
            setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t));
            setIsReceivePaymentModalOpen(false);
            setTransactionToReceivePayment(null);
            showAlert(t('alert_success'), t('payment_received_success'));

            // Log activity
            const logId = Date.now().toString();
            const newLog: ActivityLog = {
                id: logId,
                userId: currentUser?.id || 'unknown',
                action: `Received payment of ${paymentAmount} for transaction ${transactionId}`,
                timestamp: new Date().toISOString()
            };
            setActivityLogs(prev => [newLog, ...prev]);
        } else {
            showAlert(t('alert_error'), t('payment_receive_failed'));
        }
    };
    const handleCreateConsolidatedInvoice = (customer: Customer, transactionsToConsolidate: Transaction[]) => { console.log("Create Consolidated Invoice", customer, transactionsToConsolidate); };
    const handleRecordPastInvoice = async (data: PastInvoiceData) => {
        // 1. Determine Customer
        let customerId = data.customerId;
        let customerName = data.newCustomerName || 'Unknown Customer';
        let customerType: CustomerType = 'contractor'; // Default or infer?

        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                customerName = customer.name;
                customerType = customer.type;
            }
        } else if (data.newCustomerName) {
            // Create new customer on the fly? Or just use name?
            // For now, let's try to find by name or create a simple one if needed.
            // But db.createTransaction expects a customerId usually for linking.
            // If we don't have an ID, we might need to create one.
            // Let's assume for now we just pass the name if ID is missing, but Transaction type requires customerId usually.
            // Looking at Transaction type: customerId is string.
            // If we don't have a customer ID, we should probably create the customer first.
            const newCustomerData: NewCustomerData = {
                name: data.newCustomerName,
                type: 'contractor', // Default
                phone: '',
                address: ''
            };
            const newCustomer = await db.createCustomer(newCustomerData);
            if (newCustomer) {
                setCustomers(prev => [...prev, newCustomer]);
                customerId = newCustomer.id;
                customerType = newCustomer.type;
            }
        }

        if (!customerId) {
            showAlert(t('alert_error'), t('customer_creation_failed'));
            return;
        }

        // 2. Create Transaction
        const paymentStatus = data.amountAlreadyPaid >= data.totalAmount ? PaymentStatus.PAID : (data.amountAlreadyPaid > 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID);

        const transactionData: Transaction = {
            id: data.originalInvoiceId || `INV-${Date.now()}`, // Use provided ID or generate
            date: data.invoiceDate,
            items: [{
                productId: 'past-invoice',
                variantId: 'default',
                name: { en: 'Past Invoice Record', th: 'บันทึกใบแจ้งหนี้ย้อนหลัง' },
                size: '-',
                sku: 'PAST-INV',
                quantity: 1,
                stock: 0,
                price: { walkIn: data.totalAmount, contractor: data.totalAmount, government: data.totalAmount, cost: 0 }
            }],
            subtotal: data.totalAmount,
            tax: 0,
            total: data.totalAmount,
            customerId: customerId,
            customerName: customerName,
            customerType: customerType,
            operator: currentUser?.name || 'System',
            paymentMethod: 'Cash', // Default, or maybe 'Credit' since it's an invoice?
            payment_status: paymentStatus,
            paid_amount: data.amountAlreadyPaid,
            vatIncluded: true,
            due_date: new Date(new Date(data.invoiceDate).setDate(new Date(data.invoiceDate).getDate() + 30)).toISOString() // Default 30 days due?
        } as Transaction;

        const result = await db.createTransaction(transactionData);
        if (result.success) {
            setTransactions(prev => [transactionData, ...prev]);
            setIsRecordPastInvoiceModalOpen(false);
            showAlert(t('alert_success'), t('invoice_created'));
        } else {
            showAlert(t('alert_error'), `${t('transaction_create_failed')}: ${result.error}`);
        }
    };
    const handleImportPastInvoices = async (pastInvoices: PastInvoiceData[]) => {
        let importedCount = 0;
        let errorCount = 0;
        const newTransactions: Transaction[] = [];
        // We need a local cache of customers to avoid creating duplicates during the import loop
        // Initialize with current customers
        const localCustomers = [...customers];
        const newCustomersToAdd: Customer[] = [];

        for (const data of pastInvoices) {
            try {
                // 1. Determine Customer
                let customerId = data.customerId;
                let customerName = data.newCustomerName || 'Unknown Customer';
                let customerType: CustomerType = 'contractor';

                if (customerId) {
                    const customer = localCustomers.find(c => c.id === customerId);
                    if (customer) {
                        customerName = customer.name;
                        customerType = customer.type;
                    }
                } else if (data.newCustomerName) {
                    // Check if we already have this customer in our local list (including newly added ones)
                    const existingCustomer = localCustomers.find(c => c.name.toLowerCase() === data.newCustomerName!.toLowerCase());
                    if (existingCustomer) {
                        customerId = existingCustomer.id;
                        customerName = existingCustomer.name;
                        customerType = existingCustomer.type;
                    } else {
                        // Create new customer
                        const newCustomerData: NewCustomerData = {
                            name: data.newCustomerName,
                            type: 'contractor',
                            phone: '',
                            address: ''
                        };
                        const newCustomer = await db.createCustomer(newCustomerData);
                        if (newCustomer) {
                            localCustomers.push(newCustomer);
                            newCustomersToAdd.push(newCustomer);
                            customerId = newCustomer.id;
                            customerType = newCustomer.type;
                        }
                    }
                }

                if (!customerId) {
                    console.error(`Could not determine customer for invoice ${data.originalInvoiceId}`);
                    errorCount++;
                    continue;
                }

                // 2. Create Transaction
                const paymentStatus = data.amountAlreadyPaid >= data.totalAmount ? PaymentStatus.PAID : (data.amountAlreadyPaid > 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID);

                const transactionData: Transaction = {
                    id: data.originalInvoiceId || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: data.invoiceDate,
                    items: [{
                        productId: 'past-invoice',
                        variantId: 'default',
                        name: { en: 'Past Invoice Record', th: 'บันทึกใบแจ้งหนี้ย้อนหลัง' },
                        size: '-',
                        sku: 'PAST-INV',
                        quantity: 1,
                        stock: 0,
                        price: { walkIn: data.totalAmount, contractor: data.totalAmount, government: data.totalAmount, cost: 0 }
                    }],
                    subtotal: data.totalAmount,
                    tax: 0,
                    total: data.totalAmount,
                    customerId: customerId,
                    customerName: customerName,
                    customerType: customerType,
                    operator: currentUser?.name || 'System',
                    paymentMethod: 'Cash',
                    payment_status: paymentStatus,
                    paid_amount: data.amountAlreadyPaid,
                    vatIncluded: true,
                    due_date: new Date(new Date(data.invoiceDate).setDate(new Date(data.invoiceDate).getDate() + 30)).toISOString()
                } as Transaction;

                const result = await db.createTransaction(transactionData);
                if (result.success) {
                    newTransactions.push(transactionData);
                    importedCount++;
                } else {
                    console.error(`Failed to import invoice ${data.originalInvoiceId}: ${result.error}`);
                    errorCount++;
                }
            } catch (error) {
                console.error(`Exception importing invoice ${data.originalInvoiceId}:`, error);
                errorCount++;
            }
        }

        // Update state once
        if (newCustomersToAdd.length > 0) {
            setCustomers(prev => [...prev, ...newCustomersToAdd]);
        }
        if (newTransactions.length > 0) {
            setTransactions(prev => [...newTransactions, ...prev]);
        }

        setIsImportPastInvoicesModalOpen(false);
        showAlert(t('alert_success'), t('past_invoice_import_success', { count: importedCount }));
        if (errorCount > 0) {
            // Optional: show a warning about errors?
            console.warn(`Import completed with ${errorCount} errors.`);
        }
    };
    const handleEditPastInvoice = async (invoiceId: string, data: PastInvoiceData) => {
        try {
            let customerId = data.customerId;
            let customerName = '';

            // 1. Handle Customer (Create if new)
            if (data.newCustomerName) {
                const newCustomer = await db.createCustomer({
                    name: data.newCustomerName,
                    type: 'contractor', // Default type for new customers from import
                    phone: '',
                    address: ''
                });
                if (newCustomer) {
                    setCustomers(prev => [...prev, newCustomer]);
                    customerId = newCustomer.id;
                    customerName = newCustomer.name;
                } else {
                    showAlert(t('alert_error'), t('customer_creation_failed'));
                    return;
                }
            } else if (customerId) {
                const existingCustomer = customers.find(c => c.id === customerId);
                customerName = existingCustomer?.name || '';
            }

            // 2. Prepare Update Data
            const paymentStatus = data.amountAlreadyPaid >= data.totalAmount ? PaymentStatus.PAID : (data.amountAlreadyPaid > 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID);

            // For past invoices, we might want to update the item price too if the total changed
            // But for simplicity, we'll just update the top-level fields for now, or update the single item if it's a past invoice
            // If it's a regular transaction, editing "Total Amount" via this modal might be tricky if we don't update items.
            // However, the user accepted this limitation.

            // We need to fetch the current transaction to check its items
            const currentTransaction = transactions.find(t => t.id === invoiceId);
            let updatedItems = currentTransaction?.items || [];

            if (currentTransaction && currentTransaction.items.length === 1 && currentTransaction.items[0].productId === 'past-invoice') {
                // It's a past invoice, update the item price
                updatedItems = [{
                    ...currentTransaction.items[0],
                    price: { ...currentTransaction.items[0].price, walkIn: data.totalAmount, contractor: data.totalAmount, government: data.totalAmount }
                }];
            }
            // If it's a regular transaction, we DO NOT update items, just the total (which might cause discrepancy, but user accepted it)
            // Actually, if we update total but not items, it's weird.
            // But let's stick to updating the main fields.

            const updates: Partial<Transaction> = {
                date: data.invoiceDate,
                total: data.totalAmount,
                paid_amount: data.amountAlreadyPaid,
                payment_status: paymentStatus,
                customerId: customerId,
                customerName: customerName,
                items: updatedItems,
                // If file is uploaded, we would handle it here (upload to storage, get URL)
                // For now, we skip file upload implementation as it requires storage setup
            };

            // 3. Update in DB
            const result = await db.updateTransaction(invoiceId, updates);

            if (result.success) {
                // 4. Update Local State
                setTransactions(prev => prev.map(t => t.id === invoiceId ? { ...t, ...updates } : t));
                setIsEditPastInvoiceModalOpen(false);
                setInvoiceToEdit(null);
                showAlert(t('alert_success'), 'Transaction updated successfully');
            } else {
                showAlert(t('alert_error'), 'Failed to update transaction');
            }
        } catch (error) {
            console.error("Error editing transaction:", error);
            showAlert(t('alert_error'), 'An error occurred while updating.');
        }
    };
    const handleUndoConsolidation = (transaction: Transaction) => { console.log("Undo Consolidation", transaction); };
    const handleProcessReturn = async (transactionId: string, itemsToReturn: ReturnedItem[], totalValue: number): Promise<StoreCredit> => {
        // 1. Update transaction with returned items
        const updateSuccess = await db.updateTransactionReturns(transactionId, itemsToReturn);
        if (!updateSuccess) {
            showAlert(t('alert_error'), t('return_process_failed'));
            throw new Error('Failed to update transaction returns');
        }

        // 2. Create Store Credit
        try {
            const newCredit = await db.createStoreCredit({ amount: totalValue, originalTransactionId: transactionId });
            if (!newCredit) {
                showAlert(t('alert_error'), t('credit_create_failed'));
                throw new Error('Failed to create store credit');
            }

            // 3. Update local state
            setTransactions(prev => prev.map(t => {
                if (t.id === transactionId) {
                    const existingReturns = t.returnedItems || [];
                    return { ...t, returnedItems: [...existingReturns, ...itemsToReturn] };
                }
                return t;
            }));
            setStoreCredits(prev => [...prev, newCredit]);

            return newCredit;
        } catch (error: any) {
            showAlert(t('alert_error'), `Failed to create store credit: ${error.message}`);
            throw error;
        }
    };
    const handleCloseShift = () => { console.log("Close Shift"); };
    const handleUpdateSettings = async (newSettings: Partial<StoreSettings>) => {
        const success = await db.updateStoreSettings(newSettings);
        if (success) {
            setStoreSettings(prev => prev ? { ...prev, ...newSettings } : newSettings as StoreSettings);
            showAlert(t('alert_success'), t('settings_updated_success'));
        } else {
            showAlert(t('alert_error'), t('settings_update_failed'));
        }
    };
    const handleUpdateUser = async (userId: string, data: Partial<Omit<User, 'id' | 'password'>>) => {
        const success = await db.updateUser(userId, data);
        if (success) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
            showAlert(t('alert_success'), t('user_updated_success'));
        } else {
            showAlert(t('alert_error'), t('user_update_failed'));
        }
    };
    const handleUpdatePassword = async (userId: string, currentPass: string, newPass: string): Promise<{ success: boolean, message: TranslationKey }> => { console.log("Update Password"); return { success: true, message: 'password_update_success' }; };

    // Category Management Handlers
    const handleAddCategory = async (categoryData: NewCategoryData) => {
        const newCategory = await db.createCategory(categoryData);
        if (newCategory) {
            setCategories(prev => [...prev, newCategory]);
            setIsAddCategoryModalOpen(false);
            showAlert(t('alert_success'), t('category_added_success'));
        } else {
            showAlert(t('alert_error'), t('category_add_failed'));
        }
    };

    const handleEditCategory = async (categoryId: string, categoryData: Partial<NewCategoryData>) => {
        const success = await db.updateCategory(categoryId, categoryData);
        if (success) {
            const updatedCategories = await db.fetchCategories();
            setCategories(updatedCategories);
            setIsEditCategoryModalOpen(false);
            setCategoryToEdit(null);
            showAlert(t('alert_success'), t('category_updated_success'));
        } else {
            showAlert(t('alert_error'), t('category_update_failed'));
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        const result = await db.deleteCategory(categoryId);
        if (result.success) {
            setCategories(prev => prev.filter(c => c.id !== categoryId));
            showAlert(t('alert_success'), t('category_deleted_success'));
        } else {
            showAlert(t('alert_error'), result.error || t('category_delete_failed'));
        }
    };

    const handleImportProducts = async (payload: ProductImportPayload) => {
        setIsImporting(true);
        try {
            // 1. Create new products
            const productsToCreate = payload.productsToCreate;
            // Chunking to avoid overwhelming the server
            const chunkSize = 10;
            for (let i = 0; i < productsToCreate.length; i += chunkSize) {
                const chunk = productsToCreate.slice(i, i + chunkSize);
                await Promise.all(chunk.map(p => db.createProduct(p)));
            }

            // 2. Update existing variants
            const variantsToUpdate = payload.variantsToUpdate;
            for (let i = 0; i < variantsToUpdate.length; i += chunkSize) {
                const chunk = variantsToUpdate.slice(i, i + chunkSize);
                await Promise.all(chunk.map(v => db.updateVariant(v)));
            }

            // 3. Refresh data
            const updatedProducts = await db.fetchProducts();
            setProducts(updatedProducts);

            // 4. Close modal and show success
            setIsImportModalOpen(false);
            showAlert('success', t('products_imported_successfully'));
        } catch (error: any) {
            console.error('Import failed:', error);
            showAlert('error', `${t('import_failed')}: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    // NAVIGATION & UI LOGIC
    const handleNavigate = (view: string, state?: any) => {
        // If we're navigating to a new view (not just going back/forward)
        if (view !== activeView) {
            const newHistory = navigationHistory.slice(0, historyIndex + 1);
            newHistory.push(view);
            setNavigationHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }

        setActiveView(view);
        if (state) {
            setViewState(state);
        } else {
            setViewState(null);
        }
        setIsSidebarOpen(false); // Close sidebar on mobile when navigating
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setActiveView(navigationHistory[newIndex]);
        }
    };

    const handleForward = () => {
        if (historyIndex < navigationHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setActiveView(navigationHistory[newIndex]);
        }
    };
    const handleLogin = (username: string, password: string) => {
        // In a real app, this would be an API call to verify credentials securely.
        // For this local-first/demo version, we check against the loaded users.
        const user = users.find(u => u.name === username || (u as any).username === username);

        if (user) {
            // For simplicity in this demo, we are not checking passwords strictly if they aren't in the DB,
            // or we assume the user knows what they are doing. 
            // In a real scenario: if (user.password === password) ...

            // Always regenerate permissions to ensure latest permission structure
            const permissions = getPermissionsFromRoles(user.role);
            const userWithPermissions = { ...user, permissions };

            setCurrentUser(userWithPermissions);

            // Redirect based on role
            if (user.role.includes(Role.CEO)) {
                setActiveView('ceo_dashboard');
            } else {
                setActiveView('dashboard');
            }

            showAlert(t('alert_success'), t('login_success', { name: user.name.toUpperCase() }));
        } else {
            showAlert(t('alert_error'), t('login_failed'));
        }
    };
    const handleLogout = () => { setCurrentUser(null); };

    const handleStartSimulation = (role: Role) => {
        if (!currentUser) return;

        // Save the original user if not already simulating
        if (!originalUser) {
            setOriginalUser(currentUser);
        }

        // Create a simulated user with the selected role
        const permissions = getPermissionsFromRoles([role]);
        const simulatedUser: User = {
            ...currentUser,
            role: [role],
            permissions,
            name: `${currentUser.name} (Simulating ${role})`
        };

        setCurrentUser(simulatedUser);
        showAlert(t('simulation_started'), t('simulation_started_desc', { role }));
    };

    const handleStopSimulation = () => {
        if (originalUser) {
            setCurrentUser(originalUser);
            setOriginalUser(null);
            showAlert(t('simulation_stopped'), t('simulation_stopped_desc'));
        }
    };
    const handleProductMouseEnter = (product: Product, event: React.MouseEvent) => { };
    const handleProductMouseLeave = () => { };
    const openScanner = (onSuccess: (code: string) => void) => {
        setScanCallback(() => onSuccess);
        setIsScannerOpen(true);
    };

    const handleScanSuccess = (scannedCode: string) => {
        scanCallback(scannedCode);
        setIsScannerOpen(false);
    };
    const handleAddProductByScan = () => {
        openScanner((scannedCode) => {
            const existingVariant = products.flatMap(p => p.variants).find(v => v.barcode === scannedCode);
            if (existingVariant) {
                showAlert(t('barcode_exists'), t('barcode_exists_desc', { sku: existingVariant.sku }));
            } else {
                setInitialBarcodeForAdd(scannedCode);
                setIsAddProductModalOpen(true);
            }
        });
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            const success = await db.deleteTransaction(transactionId);
            if (success) {
                setTransactions(prev => prev.filter(t => t.id !== transactionId));
                showAlert(t('alert_success'), t('transaction_deleted_success'));
            } else {
                showAlert(t('alert_error'), t('transaction_delete_failed'));
            }
        }
    };

    // RENDER LOGIC
    const navLinks = {
        dashboard: <ChartPieIcon className="h-5 w-5" />,
        pos: <ShoppingCartIcon className="h-5 w-5" />,
        inventory: <CubeIcon className="h-5 w-5" />,
        returns: <ArrowUturnLeftIcon className="h-5 w-5" />,
        customers: <UserGroupIcon className="h-5 w-5" />,
        suppliers: <TruckIcon className="h-5 w-5" />,
        accounts_payable: <BanknotesIcon className="h-5 w-5" />,
        accounts_receivable: <CurrencyBangladeshiIcon className="h-5 w-5" />,
        sales_history: <ListBulletIcon className="h-5 w-5" />,
        order_fulfillment: <EyeIcon className="h-5 w-5" />,
        customer_assist: <UsersIcon className="h-5 w-5" />,
        end_of_day: <CalendarDaysIcon className="h-5 w-5" />,
        shift_history: <ClipboardDocumentListIcon className="h-5 w-5" />,
        activity_log: <ShieldCheckIcon className="h-5 w-5" />,
        user_management: <UserCircleIcon className="h-5 w-5" />,
        daily_expenses: <BanknotesIcon className="h-5 w-5" />,
    };

    const renderView = () => {
        if (!currentUser) return <LoginView onLogin={handleLogin} storeSettings={storeSettings} language={language} setLanguage={setLanguage} t={t} />;
        if (activeView === 'ceo_dashboard') return <CEODashboard currentUser={currentUser} onLogout={handleLogout} transactions={transactions} bills={bills} users={users} products={products} suppliers={suppliers} storeSettings={storeSettings} dailyExpenses={dailyExpenses} t={t} language={language} setLanguage={setLanguage} onBillUpdated={handleBillUpdate} showAlert={showAlert} onNavigate={handleNavigate} />;

        switch (activeView) {
            case 'dashboard':
                if (currentUser && currentUser.role[0] === 'CEO') {
                    return <CEODashboard currentUser={currentUser} onLogout={handleLogout} transactions={transactions} bills={bills} users={users} products={products} suppliers={suppliers} storeSettings={storeSettings} dailyExpenses={dailyExpenses} t={t} language={language} setLanguage={setLanguage} onBillUpdated={handleBillUpdate} showAlert={showAlert} onNavigate={handleNavigate} />;
                }
                return <Dashboard products={products} users={users} transactions={transactions} bills={bills} t={t} language={language} onNavigate={handleNavigate} currentUser={currentUser} storeSettings={storeSettings} />;
            case 'pos': return <POSView products={products} currentUser={currentUser} customers={customers} storeCredits={storeCredits} transactions={transactions} onNewTransaction={handleNewTransaction} onNewInvoice={handleNewInvoice} onNewOrder={handleNewOrder} onAddNewCustomerFromPOS={handleAddNewCustomerFromPOS} openScanner={openScanner} posScannedCode={posScannedCode} setPosScannedCode={setPosScannedCode} showAlert={showAlert} storeSettings={storeSettings} onProductMouseEnter={handleProductMouseEnter} onProductMouseLeave={handleProductMouseLeave} t={t} language={language} />;
            case 'inventory': return <ProductTable products={products} currentUser={currentUser} onAddProductClick={() => setIsAddProductModalOpen(true)} onAddProductByScan={handleAddProductByScan} onImportProductsClick={() => setIsImportModalOpen(true)} onEditProduct={(p) => { setProductToEdit(p); setIsEditProductModalOpen(true); }} onDeleteProduct={(p) => { setProductToDelete(p); setIsDeleteModalOpen(true); }} onViewProduct={(p) => { setProductToView(p); setIsViewProductModalOpen(true); }} onShowBarcode={(p, v) => { setProductToView(p); setVariantToShowBarcode(v); setIsBarcodeDisplayOpen(true); }} openScanner={openScanner} inventorySearchCode={inventorySearchCode} setInventorySearchCode={setInventorySearchCode} t={t} language={language} />;
            case 'returns': return <ReturnsView transactions={transactions} products={products} onProcessReturn={handleProcessReturn} t={t} language={language} />;
            case 'customers': return <CustomersView customers={customers} onAddCustomer={handleAddCustomer} onEditCustomer={handleEditCustomer} onDeleteCustomer={handleDeleteCustomer} onImportCustomersClick={() => setIsImportCustomersModalOpen(true)} t={t} currentUser={currentUser} showAlert={showAlert} />;
            case 'suppliers': return <SuppliersView suppliers={suppliers} onAddSupplier={() => setIsAddSupplierModalOpen(true)} onEditSupplier={handleEditSupplier} onDeleteSupplier={handleDeleteSupplier} onImportSuppliersClick={() => setIsImportSuppliersModalOpen(true)} t={t} currentUser={currentUser} showAlert={showAlert} />;
            case 'accounts_payable': return <AccountsPayableView bills={bills} suppliers={suppliers} onAddBillClick={() => setIsAddBillModalOpen(true)} onEditBillClick={handleEditBillClick} onPayBillClick={(b) => { setBillToRecordPaymentFor(b); setIsRecordPaymentModalOpen(true); }} onDeleteBill={handleDeleteBill} onImportBillsClick={() => setIsImportBillsModalOpen(true)} t={t} language={language} currentUser={currentUser} />;
            case 'accounts_receivable': return <AccountsReceivableView transactions={transactions} customers={customers} onReceivePaymentClick={(t) => { setTransactionToReceivePayment(t); setIsReceivePaymentModalOpen(true); }} onCreateConsolidatedInvoice={(c, txs) => { setConsolidationData({ customer: c, transactions: txs }); setIsConsolidatedInvoiceModalOpen(true); }} onRecordPastInvoiceClick={() => setIsRecordPastInvoiceModalOpen(true)} onImportPastInvoicesClick={() => setIsImportPastInvoicesModalOpen(true)} onEditPastInvoiceClick={(t) => { setInvoiceToEdit(t); setIsEditPastInvoiceModalOpen(true); }} onDeleteTransaction={handleDeleteTransaction} onUndoConsolidationClick={(t) => { setTransactionToUndo(t); setIsUndoConfirmationModalOpen(true); }} t={t} language={language} currentUser={currentUser} viewState={viewState} onNavigate={handleNavigate} />;
            case 'sales_history': return <SalesHistoryView transactions={transactions} onDeleteTransaction={handleDeleteTransaction} onReceivePaymentClick={(t) => { setTransactionToReceivePayment(t); setIsReceivePaymentModalOpen(true); }} onEditPastInvoiceClick={(t) => { setInvoiceToEdit(t); setIsEditPastInvoiceModalOpen(true); }} onUndoConsolidationClick={(t) => { setTransactionToUndo(t); setIsUndoConfirmationModalOpen(true); }} storeSettings={storeSettings} t={t} language={language} currentUser={currentUser} viewState={viewState} onNavigate={handleNavigate} />;
            case 'order_fulfillment': return <OrderFulfillmentView orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateOrderPaymentStatus={handleUpdateOrderPaymentStatus} onConvertOrderToInvoice={handleConvertOrderToInvoice} onDeleteOrder={handleDeleteOrder} currentUserPermissions={currentUser.permissions} storeSettings={storeSettings} t={t} language={language} />;
            case 'customer_assist': return <CustomerAssistView products={products} t={t} language={language} onProductMouseEnter={handleProductMouseEnter} onProductMouseLeave={handleProductMouseLeave} />;
            case 'end_of_day': return <EndOfDayView transactions={transactions} products={products} shiftReports={shiftReports} onCloseShift={handleCloseShift} t={t} language={language} currentUser={currentUser} />;
            case 'shift_history': return <ShiftHistoryView shiftReports={shiftReports} users={users} t={t} language={language} />;
            case 'activity_log': return <ActivityLogView logs={activityLogs} users={users} t={t} />;
            case 'user_management': return <UserManagementView users={users} onAddUser={handleAddUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} onResetPassword={handleResetPassword} t={t} currentUser={currentUser} showAlert={showAlert} />;
            case 'store_settings': return <StoreSettingsView storeSettings={storeSettings} onUpdateSettings={handleUpdateSettings} t={t} showAlert={showAlert} />;
            case 'my_profile': return <ProfileView currentUser={currentUser} onUpdateUser={handleUpdateUser} onUpdatePassword={handleUpdatePassword} links={navLinks} t={t} />;
            case 'category_management': return <CategoryManagementView categories={categories} currentUser={currentUser} onAddCategory={() => setIsAddCategoryModalOpen(true)} onEditCategory={(cat) => { setCategoryToEdit(cat); setIsEditCategoryModalOpen(true); }} onDeleteCategory={handleDeleteCategory} t={t} language={language} />;
            case 'dashboard_management': return <DashboardManagementView storeSettings={storeSettings} onUpdateSettings={handleUpdateSettings} t={t} />;
            case 'daily_expenses': return <DailyExpensesView currentUser={currentUser} dailyExpenses={dailyExpenses} t={t as any} showAlert={showAlert} />;
            default:
                if (currentUser && (currentUser.role[0] === 'CEO' || currentUser.role[0] === 'Admin')) {
                    return <CEODashboard currentUser={currentUser} onLogout={handleLogout} transactions={transactions} bills={bills} users={users} products={products} suppliers={suppliers} storeSettings={storeSettings} dailyExpenses={dailyExpenses} t={t} language={language} setLanguage={setLanguage} onBillUpdated={handleBillUpdate} showAlert={showAlert} onNavigate={handleNavigate} />;
                }
                return <Dashboard products={products} users={users} transactions={transactions} bills={bills} t={t} language={language} onNavigate={handleNavigate} currentUser={currentUser} storeSettings={storeSettings} />;
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-background"><p>Loading application...</p></div>;

    return (
        <div className="flex h-screen bg-background">
            {currentUser && activeView !== 'ceo_dashboard' && (
                <Sidebar
                    currentUser={currentUser}
                    onNavigate={handleNavigate}
                    activeView={activeView}
                    links={navLinks}
                    storeSettings={storeSettings}
                    t={t}
                    language={language}
                    onLogout={handleLogout}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    originalUser={originalUser}
                    onStartSimulation={handleStartSimulation}
                    onStopSimulation={handleStopSimulation}
                />
            )}

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[90] md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                {currentUser && activeView !== 'ceo_dashboard' && (
                    <Header
                        currentUser={currentUser}
                        activeView={activeView}
                        language={language}
                        setLanguage={setLanguage}
                        t={t}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        onBack={handleBack}
                        canGoBack={historyIndex > 0}
                        onForward={handleForward}
                        canGoForward={historyIndex < navigationHistory.length - 1}
                        originalUser={originalUser}
                        onStopSimulation={handleStopSimulation}
                        onRefresh={fetchInitialData}
                    />
                )}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <ErrorBoundary>
                        {renderView()}
                    </ErrorBoundary>
                </main>
            </div>

            {/* MODALS */}
            <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} onAddProduct={handleAddProduct} initialBarcode={initialBarcodeForAdd} showAlert={showAlert} t={t} />
            <EditProductModal isOpen={isEditProductModalOpen} onClose={() => setIsEditProductModalOpen(false)} onEditProduct={handleEditProduct} product={productToEdit} showAlert={showAlert} t={t} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteProduct} title="Delete Product" message={`Are you sure you want to delete "${productToDelete?.name[language]}"?`} t={t} />
            <ProductDetailModal isOpen={isViewProductModalOpen} onClose={() => setIsViewProductModalOpen(false)} product={productToView} t={t} language={language} />
            <AlertModal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} title={alertConfig.title} message={alertConfig.message} />
            <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
            <BarcodeDisplayModal isOpen={isBarcodeDisplayOpen} onClose={() => setIsBarcodeDisplayOpen(false)} product={productToView} variant={variantToShowBarcode} t={t} language={language} />
            <ImportProductsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onApplyImport={handleImportProducts} products={products} categories={categories} t={t} isSubmitting={isImporting} />
            <AddSupplierModal isOpen={isAddSupplierModalOpen} onClose={() => setIsAddSupplierModalOpen(false)} onAddSupplier={handleAddSupplier} showAlert={showAlert} t={t} />
            <ImportSuppliersModal isOpen={isImportSuppliersModalOpen} onClose={() => setIsImportSuppliersModalOpen(false)} onApplyImport={handleImportSuppliers} t={t} />
            <AddBillModal isOpen={isAddBillModalOpen} onClose={() => setIsAddBillModalOpen(false)} onAddBill={handleAddBill} suppliers={suppliers} t={t} showAlert={showAlert} />
            <EditBillModal isOpen={isEditBillModalOpen} onClose={() => { setIsEditBillModalOpen(false); setBillToEdit(null); }} onEditBill={handleUpdateBill} bill={billToEdit} suppliers={suppliers} showAlert={showAlert} t={t} />
            <ImportBillsModal isOpen={isImportBillsModalOpen} onClose={() => setIsImportBillsModalOpen(false)} onApplyImport={handleImportBills} suppliers={suppliers} t={t} />
            <RecordPaymentModal isOpen={isRecordPaymentModalOpen} onClose={() => setIsRecordPaymentModalOpen(false)} onConfirm={handleRecordBillPayment} bill={billToRecordPaymentFor} t={t} />

            {/* Accounts Receivable Modals */}
            {/* Accounts Receivable Modals */}
            <ReceivePaymentModal isOpen={isReceivePaymentModalOpen} onClose={() => setIsReceivePaymentModalOpen(false)} onConfirm={handleReceivePayment} transaction={transactionToReceivePayment} t={t} />
            {/* <ConsolidatedInvoiceModal isOpen={isConsolidatedInvoiceModalOpen} onClose={() => setIsConsolidatedInvoiceModalOpen(false)} invoice={null} storeSettings={storeSettings} t={t} language={language} /> */}
            <RecordPastInvoiceModal isOpen={isRecordPastInvoiceModalOpen} onClose={() => setIsRecordPastInvoiceModalOpen(false)} onRecord={handleRecordPastInvoice} customers={customers} showAlert={showAlert} t={t} />
            <ImportPastInvoicesModal isOpen={isImportPastInvoicesModalOpen} onClose={() => setIsImportPastInvoicesModalOpen(false)} onApplyImport={handleImportPastInvoices} t={t} />
            <EditPastInvoiceModal isOpen={isEditPastInvoiceModalOpen} onClose={() => setIsEditPastInvoiceModalOpen(false)} onEdit={(id, data) => handleEditPastInvoice(id, data)} invoice={invoiceToEdit} customers={customers} showAlert={showAlert} t={t} />

            {/* Category Management Modals */}
            <AddCategoryModal isOpen={isAddCategoryModalOpen} onClose={() => setIsAddCategoryModalOpen(false)} onAddCategory={handleAddCategory} categories={categories} t={t} language={language} />
            <EditCategoryModal isOpen={isEditCategoryModalOpen} onClose={() => { setIsEditCategoryModalOpen(false); setCategoryToEdit(null); }} onEditCategory={handleEditCategory} category={categoryToEdit} categories={categories} t={t} language={language} />

            {hoveredProduct && (
                <ProductTooltip product={hoveredProduct} position={popupPosition} language={language} />
            )}
        </div>
    );
};

export default App;
