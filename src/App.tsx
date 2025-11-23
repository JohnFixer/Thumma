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
import ProfileView from './components/ProfileView';
import EndOfDayView from './components/EndOfDayView';
import ShiftHistoryView from './components/ShiftHistoryView';
import StoreSettingsView from './components/StoreSettingsView';
import LoginView from './components/LoginView';
import AccountsPayableView from './components/AccountsPayableView';
import AddBillModal from './components/AddBillModal';
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
    StoreCredit, ReturnedItem, PastInvoiceData, BillPayment, CustomerType, NewProductVariantData
} from './types';
import { ProductStatus, Role, FulfillmentStatus, PaymentStatus, BillStatus } from './types';
import type { TranslationKey } from './translations';
import {
    ChartPieIcon, ShoppingCartIcon, CubeIcon, ArrowUturnLeftIcon, UserGroupIcon, TruckIcon,
    BanknotesIcon, ListBulletIcon, EyeIcon, UsersIcon, UserCircleIcon, ShieldCheckIcon, CalendarDaysIcon, Cog6ToothIcon, ClipboardDocumentListIcon, CurrencyBangladeshiIcon
} from './components/icons/HeroIcons';

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

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const savedUserJSON = localStorage.getItem('currentUser');
            if (savedUserJSON) {
                const savedUser = JSON.parse(savedUserJSON);
                // Quick validation to ensure it's a user object
                if (savedUser && savedUser.id && savedUser.name) {
                    return savedUser as User;
                }
            }
            return null;
        } catch (error) {
            console.error("Failed to load user from localStorage", error);
            return null;
        }
    });
    const [activeView, setActiveView] = useState('dashboard');
    const [viewState, setViewState] = useState<any>(null);
    const [language, setLanguage] = useState<Language>('th');
    const [navigationHistory, setNavigationHistory] = useState<string[]>(['dashboard']);
    const [isForcePasswordChangeOpen, setIsForcePasswordChangeOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [originalUser, setOriginalUser] = useState<User | null>(null);


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

    const showAlert = useCallback((title: string, message: string) => {
        setAlertConfig({ title, message: message.replace(/\n/g, '<br />') });
        setIsAlertModalOpen(true);
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [
                    fetchedProducts,
                    fetchedCustomers,
                    fetchedSuppliers,
                    fetchedTransactions,
                    fetchedBills,
                    fetchedUsers,
                    fetchedSettings,
                    fetchedCategories
                ] = await Promise.all([
                    db.fetchProducts(),
                    db.fetchCustomers(),
                    db.fetchSuppliers(),
                    db.fetchTransactions(),
                    db.fetchBills(),
                    db.fetchUsers(),
                    db.fetchStoreSettings(),
                    db.fetchCategories()
                ]);

                setProducts(fetchedProducts);
                setCustomers(fetchedCustomers);
                setSuppliers(fetchedSuppliers);
                setTransactions(fetchedTransactions);
                setBills(fetchedBills);
                setCategories(fetchedCategories);
                // Note: In a real app, users might be managed differently, but we fetch public profiles here
                if (fetchedUsers.length > 0) setUsers(fetchedUsers);
                if (fetchedSettings) setStoreSettings(fetchedSettings);

            } catch (error) {
                console.error("Error fetching initial data:", error);
                showAlert('Error', 'Failed to load data from database.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [showAlert]);

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
                showAlert('Success', 'Product added successfully.');
            }
        } catch (error: any) {
            showAlert('Error', `Failed to add product: ${error.message}`);
        }
    };

    const handleEditProduct = async (productId: string, productData: NewProductData) => {
        const success = await db.updateProduct(productId, productData);
        if (success) {
            // Refresh products to get updated variants
            const updatedProducts = await db.fetchProducts();
            setProducts(updatedProducts);
            setIsEditProductModalOpen(false);
            showAlert('Success', 'Product updated successfully.');
        } else {
            showAlert('Error', 'Failed to update product.');
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        const success = await db.deleteProduct(productToDelete.id);
        if (success) {
            setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            showAlert('Success', 'Product deleted successfully.');
        } else {
            showAlert('Error', 'Failed to delete product.');
        }
    };
    const handleAddUser = (userData: NewUserData) => { console.log("Add User", userData); }; // Requires Auth Admin API
    const handleEditUser = async (userId: string, userData: NewUserData) => {
        const success = await db.updateUser(userId, userData);
        if (success) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...userData } : u));
            showAlert('Success', 'User updated successfully.');
        } else {
            showAlert('Error', 'Failed to update user.');
        }
    };
    const handleDeleteUser = (userId: string) => { console.log("Delete User", userId); }; // Requires Auth Admin API
    const handleResetPassword = (userId: string) => { console.log("Reset Password", userId); };
    const handleAddCustomer = async (customerData: NewCustomerData) => {
        const newCustomer = await db.createCustomer(customerData);
        if (newCustomer) {
            setCustomers(prev => [...prev, newCustomer]);
            showAlert('Success', 'Customer added successfully.');
        } else {
            showAlert('Error', 'Failed to add customer.');
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
            showAlert('Success', 'Customer updated successfully.');
        } else {
            showAlert('Error', 'Failed to update customer.');
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        const success = await db.deleteCustomer(customerId);
        if (success) {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
            showAlert('Success', 'Customer deleted successfully.');
        } else {
            showAlert('Error', 'Failed to delete customer.');
        }
    };
    const handleAddSupplier = async (supplierData: NewSupplierData) => {
        const newSupplier = await db.createSupplier(supplierData);
        if (newSupplier) {
            setSuppliers(prev => [...prev, newSupplier]);
            setIsAddSupplierModalOpen(false);
            showAlert('Success', 'Supplier added successfully.');
        } else {
            showAlert('Error', 'Failed to add supplier.');
        }
    };

    const handleEditSupplier = (supplierId: string, supplierData: NewSupplierData) => { console.log("Edit Supplier", supplierId, supplierData); }; // TODO: Implement updateSupplier in db.ts if needed

    const handleDeleteSupplier = async (supplierId: string) => {
        const success = await db.deleteSupplier(supplierId);
        if (success) {
            setSuppliers(prev => prev.filter(s => s.id !== supplierId));
            showAlert('Success', 'Supplier deleted successfully.');
        } else {
            showAlert('Error', 'Failed to delete supplier.');
        }
    };
    const handleAddBill = async (billData: NewBillData) => {
        const newBill = await db.createBill(billData);
        if (newBill) {
            setBills(prev => [...prev, newBill]);
            setIsAddBillModalOpen(false);
            showAlert('Success', 'Bill added successfully.');
        } else {
            showAlert('Error', 'Failed to add bill.');
        }
    };
    const handleRecordBillPayment = (billId: string, paymentData: any) => { console.log("Record Bill Payment", billId, paymentData); };
    const handleBillUpdate = (updatedBill: Bill) => { console.log("Update Bill", updatedBill); };
    const handleDeleteBill = (billId: string) => { console.log("Delete Bill", billId); };
    const handleImportCustomers = (newCustomers: NewCustomerData[]) => { console.log("Import Customers", newCustomers); };
    const handleImportSuppliers = (newSuppliers: NewSupplierData[]) => { console.log("Import Suppliers", newSuppliers); };
    const handleImportBills = (billsToImport: any[]) => { console.log("Import Bills", billsToImport); };
    const handleNewTransaction = async (transactionData: Omit<Transaction, 'payment_status' | 'due_date' | 'paid_amount'>, cartItems: CartItem[], appliedCreditId?: string, carriedForwardBalance?: { customerId: string, amount: number }): Promise<Transaction | undefined> => {
        const newTransaction: Transaction = {
            ...transactionData,
            payment_status: PaymentStatus.PAID, // Default for POS
            paid_amount: transactionData.total,
            items: cartItems
        };

        const success = await db.createTransaction(newTransaction);
        if (success) {
            setTransactions(prev => [newTransaction, ...prev]);
            // Also update product stock locally to reflect change immediately (optional, but good for UI)
            // In a real app, you might re-fetch products or use real-time subscription
            const updatedProducts = await db.fetchProducts();
            setProducts(updatedProducts);
            return newTransaction;
        } else {
            showAlert('Error', 'Failed to create transaction.');
            return undefined;
        }
    };
    const handleNewInvoice = (transaction: Omit<Transaction, 'payment_status' | 'paymentMethod' | 'paid_amount'>, cartItems: CartItem[]) => { console.log("New Invoice"); };
    const handleNewOrder = (order: Order) => { console.log("New Order"); };
    const handleUpdateOrderStatus = (orderId: string, status: FulfillmentStatus) => { console.log("Update Order Status", orderId, status); };
    const handleUpdateOrderPaymentStatus = (orderId: string, status: PaymentStatus, method: PaymentMethod) => { console.log("Update Order Payment Status", orderId, status, method); };
    const handleConvertOrderToInvoice = (order: Order) => { console.log("Convert Order to Invoice", order); };
    const handleReceivePayment = (transactionId: string, paymentAmount: number, paymentMethod: PaymentMethod) => { console.log("Receive Payment", transactionId, paymentAmount, paymentMethod); };
    const handleCreateConsolidatedInvoice = (customer: Customer, transactionsToConsolidate: Transaction[]) => { console.log("Create Consolidated Invoice", customer, transactionsToConsolidate); };
    const handleRecordPastInvoice = (data: PastInvoiceData) => { console.log("Record Past Invoice", data); };
    const handleImportPastInvoices = (pastInvoices: PastInvoiceData[]) => { console.log("Import Past Invoices", pastInvoices); };
    const handleEditPastInvoice = (invoiceId: string, data: PastInvoiceData) => { console.log("Edit Past Invoice", invoiceId, data); };
    const handleUndoConsolidation = (transaction: Transaction) => { console.log("Undo Consolidation", transaction); };
    const handleProcessReturn = async (transactionId: string, itemsToReturn: ReturnedItem[], totalValue: number): Promise<StoreCredit> => { console.log("Process Return"); return {} as StoreCredit; };
    const handleCloseShift = () => { console.log("Close Shift"); };
    const handleUpdateSettings = async (newSettings: Partial<StoreSettings>) => {
        const success = await db.updateStoreSettings(newSettings);
        if (success) {
            setStoreSettings(prev => prev ? { ...prev, ...newSettings } : newSettings as StoreSettings);
            showAlert('Success', 'Settings updated successfully.');
        } else {
            showAlert('Error', 'Failed to update settings.');
        }
    };
    const handleUpdateUser = async (userId: string, data: Partial<Omit<User, 'id' | 'password'>>) => {
        const success = await db.updateUser(userId, data);
        if (success) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
            showAlert('Success', 'User updated successfully.');
        } else {
            showAlert('Error', 'Failed to update user.');
        }
    };
    const handleUpdatePassword = async (userId: string, currentPass: string, newPass: string): Promise<{ success: boolean, message: TranslationKey }> => { console.log("Update Password"); return { success: true, message: 'password_update_success' }; };

    // Category Management Handlers
    const handleAddCategory = async (categoryData: NewCategoryData) => {
        const newCategory = await db.createCategory(categoryData);
        if (newCategory) {
            setCategories(prev => [...prev, newCategory]);
            setIsAddCategoryModalOpen(false);
            showAlert('Success', 'Category added successfully.');
        } else {
            showAlert('Error', 'Failed to add category.');
        }
    };

    const handleEditCategory = async (categoryId: string, categoryData: Partial<NewCategoryData>) => {
        const success = await db.updateCategory(categoryId, categoryData);
        if (success) {
            const updatedCategories = await db.fetchCategories();
            setCategories(updatedCategories);
            setIsEditCategoryModalOpen(false);
            setCategoryToEdit(null);
            showAlert('Success', 'Category updated successfully.');
        } else {
            showAlert('Error', 'Failed to update category.');
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        const result = await db.deleteCategory(categoryId);
        if (result.success) {
            setCategories(prev => prev.filter(c => c.id !== categoryId));
            showAlert('Success', 'Category deleted successfully.');
        } else {
            showAlert('Error', result.error || 'Failed to delete category.');
        }
    };

    const handleImportProducts = (payload: any) => { console.log("Import Products", payload); };

    // NAVIGATION & UI LOGIC
    const handleNavigate = (view: string, state?: any) => { setActiveView(view); };
    const handleLogin = (username: string, password: string) => {
        const permissions = getPermissionsFromRoles([Role.ADMIN]);
        setCurrentUser({ id: '1', name: 'Admin', role: [Role.ADMIN], avatar: '', permissions });
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
        showAlert('Simulation Started', `You are now simulating the ${role} role. Click "Stop Simulation" to return to your original role.`);
    };

    const handleStopSimulation = () => {
        if (originalUser) {
            setCurrentUser(originalUser);
            setOriginalUser(null);
            showAlert('Simulation Stopped', 'You have returned to your original role.');
        }
    };
    const handleProductMouseEnter = (product: Product, event: React.MouseEvent) => { };
    const handleProductMouseLeave = () => { };
    const handleBack = () => { };
    const openScanner = (onSuccess: (code: string) => void) => { };
    const handleScanSuccess = (scannedCode: string) => { };
    const handleAddProductByScan = () => {
        openScanner((scannedCode) => {
            const existingVariant = products.flatMap(p => p.variants).find(v => v.barcode === scannedCode);
            if (existingVariant) {
                showAlert('Barcode Exists', `A product variant with this barcode already exists (SKU: ${existingVariant.sku}).`);
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
                showAlert('Success', 'Transaction deleted successfully.');
            } else {
                showAlert('Error', 'Failed to delete transaction.');
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
    };

    const renderView = () => {
        if (!currentUser) return <LoginView onLogin={handleLogin} storeSettings={storeSettings} language={language} setLanguage={setLanguage} t={t} />;
        if (activeView === 'ceo_dashboard') return <CEODashboard currentUser={currentUser} onLogout={handleLogout} transactions={transactions} bills={bills} users={users} products={products} suppliers={suppliers} storeSettings={storeSettings} t={t} language={language} setLanguage={setLanguage} onBillUpdated={handleBillUpdate} showAlert={showAlert} />;

        switch (activeView) {
            case 'dashboard': return <Dashboard products={products} users={users} transactions={transactions} bills={bills} t={t} language={language} onNavigate={handleNavigate} currentUser={currentUser} storeSettings={storeSettings} />;
            case 'pos': return <POSView products={products} currentUser={currentUser} customers={customers} storeCredits={storeCredits} transactions={transactions} onNewTransaction={handleNewTransaction} onNewInvoice={handleNewInvoice} onNewOrder={handleNewOrder} onAddNewCustomerFromPOS={handleAddNewCustomerFromPOS} openScanner={openScanner} posScannedCode={posScannedCode} setPosScannedCode={setPosScannedCode} showAlert={showAlert} storeSettings={storeSettings} onProductMouseEnter={handleProductMouseEnter} onProductMouseLeave={handleProductMouseLeave} t={t} language={language} />;
            case 'inventory': return <ProductTable products={products} currentUser={currentUser} onAddProductClick={() => setIsAddProductModalOpen(true)} onAddProductByScan={handleAddProductByScan} onImportProductsClick={() => setIsImportModalOpen(true)} onEditProduct={(p) => { setProductToEdit(p); setIsEditProductModalOpen(true); }} onDeleteProduct={(p) => { setProductToDelete(p); setIsDeleteModalOpen(true); }} onViewProduct={(p) => { setProductToView(p); setIsViewProductModalOpen(true); }} onShowBarcode={(p, v) => { setProductToView(p); setVariantToShowBarcode(v); setIsBarcodeDisplayOpen(true); }} openScanner={openScanner} inventorySearchCode={inventorySearchCode} setInventorySearchCode={setInventorySearchCode} t={t} language={language} />;
            case 'returns': return <ReturnsView transactions={transactions} products={products} onProcessReturn={handleProcessReturn} t={t} language={language} />;
            case 'customers': return <CustomersView customers={customers} onAddCustomer={handleAddCustomer} onEditCustomer={handleEditCustomer} onDeleteCustomer={handleDeleteCustomer} onImportCustomersClick={() => setIsImportCustomersModalOpen(true)} t={t} currentUser={currentUser} showAlert={showAlert} />;
            case 'suppliers': return <SuppliersView suppliers={suppliers} onAddSupplier={() => setIsAddSupplierModalOpen(true)} onEditSupplier={handleEditSupplier} onDeleteSupplier={handleDeleteSupplier} onImportSuppliersClick={() => setIsImportSuppliersModalOpen(true)} t={t} currentUser={currentUser} showAlert={showAlert} />;
            case 'accounts_payable': return <AccountsPayableView bills={bills} suppliers={suppliers} onAddBillClick={() => setIsAddBillModalOpen(true)} onPayBillClick={(b) => { setBillToRecordPaymentFor(b); setIsRecordPaymentModalOpen(true); }} onDeleteBill={handleDeleteBill} onImportBillsClick={() => setIsImportBillsModalOpen(true)} t={t} language={language} currentUser={currentUser} />;
            case 'accounts_receivable': return <AccountsReceivableView transactions={transactions} customers={customers} onReceivePaymentClick={(t) => { setTransactionToReceivePayment(t); setIsReceivePaymentModalOpen(true); }} onCreateConsolidatedInvoice={(c, txs) => { setConsolidationData({ customer: c, transactions: txs }); setIsConsolidatedInvoiceModalOpen(true); }} onRecordPastInvoiceClick={() => setIsRecordPastInvoiceModalOpen(true)} onImportPastInvoicesClick={() => setIsImportPastInvoicesModalOpen(true)} onEditPastInvoiceClick={(t) => { setInvoiceToEdit(t); setIsEditPastInvoiceModalOpen(true); }} onUndoConsolidationClick={(t) => { setTransactionToUndo(t); setIsUndoConfirmationModalOpen(true); }} t={t} language={language} currentUser={currentUser} viewState={viewState} onNavigate={handleNavigate} />;
            case 'sales_history': return <SalesHistoryView transactions={transactions} onDeleteTransaction={handleDeleteTransaction} onReceivePaymentClick={(t) => { setTransactionToReceivePayment(t); setIsReceivePaymentModalOpen(true); }} onEditPastInvoiceClick={(t) => { setInvoiceToEdit(t); setIsEditPastInvoiceModalOpen(true); }} onUndoConsolidationClick={(t) => { setTransactionToUndo(t); setIsUndoConfirmationModalOpen(true); }} storeSettings={storeSettings} t={t} language={language} currentUser={currentUser} />;
            case 'order_fulfillment': return <OrderFulfillmentView orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateOrderPaymentStatus={handleUpdateOrderPaymentStatus} onConvertOrderToInvoice={handleConvertOrderToInvoice} storeSettings={storeSettings} t={t} language={language} />;
            case 'customer_assist': return <CustomerAssistView products={products} t={t} language={language} onProductMouseEnter={handleProductMouseEnter} onProductMouseLeave={handleProductMouseLeave} />;
            case 'end_of_day': return <EndOfDayView transactions={transactions} products={products} shiftReports={shiftReports} onCloseShift={handleCloseShift} t={t} language={language} currentUser={currentUser} />;
            case 'shift_history': return <ShiftHistoryView shiftReports={shiftReports} users={users} t={t} language={language} />;
            case 'activity_log': return <ActivityLogView logs={activityLogs} users={users} t={t} />;
            case 'user_management': return <UserManagementView users={users} onAddUser={handleAddUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} onResetPassword={handleResetPassword} t={t} currentUser={currentUser} showAlert={showAlert} />;
            case 'store_settings': return <StoreSettingsView storeSettings={storeSettings} onUpdateSettings={handleUpdateSettings} t={t} showAlert={showAlert} />;
            case 'my_profile': return <ProfileView currentUser={currentUser} onUpdateUser={handleUpdateUser} onUpdatePassword={handleUpdatePassword} links={navLinks} t={t} />;
            case 'category_management': return <CategoryManagementView categories={categories} currentUser={currentUser} onAddCategory={() => setIsAddCategoryModalOpen(true)} onEditCategory={(cat) => { setCategoryToEdit(cat); setIsEditCategoryModalOpen(true); }} onDeleteCategory={handleDeleteCategory} t={t} language={language} />;
            case 'dashboard_management': return <DashboardManagementView storeSettings={storeSettings} onUpdateSettings={handleUpdateSettings} t={t} />;
            default: return <Dashboard products={products} users={users} transactions={transactions} bills={bills} t={t} language={language} onNavigate={handleNavigate} currentUser={currentUser} storeSettings={storeSettings} />;
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
                        canGoBack={navigationHistory.length > 1}
                        originalUser={originalUser}
                        onStopSimulation={handleStopSimulation}
                    />
                )}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {renderView()}
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
            <ImportProductsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onApplyImport={handleImportProducts} products={products} t={t} />

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
