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

import type { User, Product, Supplier, Customer, Transaction, Order, StoreCredit, ActivityLog, NewProductData, NewUserData, NewSupplierData, NewCustomerData, ProductVariant, Language, ReturnedItem, PaymentMethod, NewProductVariantData, CartItem, ShiftReport, StoreSettings, Bill, NewBillData, PastInvoiceData, BillPayment, CustomerType } from './types';
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
    const [scanCallback, setScanCallback] = useState<(code: string) => void>(() => () => {});
    const [posScannedCode, setPosScannedCode] = useState<string | null>(null);
    const [inventorySearchCode, setInventorySearchCode] = useState<string | null>(null);
    const [initialBarcodeForAdd, setInitialBarcodeForAdd] = useState<string | null>(null);

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
            // In a real app, you'd fetch this data from your backend.
            // For this example, we'll use placeholder data.
            // ... all the supabase fetch calls will go here ...
            setIsLoading(false);
        };

        fetchInitialData();
    }, [showAlert]);

    const logActivity = (action: string, user: User) => {
        const newLog: ActivityLog = { id: `log-${Date.now()}`, userId: user.id, action, timestamp: new Date().toISOString() };
        setActivityLogs(prev => [newLog, ...prev]);
    };

    // Placeholder functions for CRUD operations
    const handleAddProduct = (productData: NewProductData) => { console.log("Add Product", productData); };
    const handleEditProduct = (productId: string, productData: NewProductData) => { console.log("Edit Product", productId, productData); };
    const handleDeleteProduct = () => { console.log("Delete Product"); };
    const handleAddUser = (userData: NewUserData) => { console.log("Add User", userData); };
    const handleEditUser = (userId: string, userData: NewUserData) => { console.log("Edit User", userId, userData); };
    const handleDeleteUser = (userId: string) => { console.log("Delete User", userId); };
    const handleResetPassword = (userId: string) => { console.log("Reset Password", userId); };
    const handleAddCustomer = (customerData: NewCustomerData) => { console.log("Add Customer", customerData); };
    const handleAddNewCustomerFromPOS = async (customerData: NewCustomerData): Promise<Customer | null> => { console.log("Add Customer from POS", customerData); return null; };
    const handleEditCustomer = (customerId: string, customerData: NewCustomerData) => { console.log("Edit Customer", customerId, customerData); };
    const handleDeleteCustomer = (customerId: string) => { console.log("Delete Customer", customerId); };
    const handleAddSupplier = (supplierData: NewSupplierData) => { console.log("Add Supplier", supplierData); };
    const handleEditSupplier = (supplierId: string, supplierData: NewSupplierData) => { console.log("Edit Supplier", supplierId, supplierData); };
    const handleDeleteSupplier = (supplierId: string) => { console.log("Delete Supplier", supplierId); };
    const handleAddBill = (billData: NewBillData) => { console.log("Add Bill", billData); };
    const handleRecordBillPayment = (billId: string, paymentData: any) => { console.log("Record Bill Payment", billId, paymentData); };
    const handleBillUpdate = (updatedBill: Bill) => { console.log("Update Bill", updatedBill); };
    const handleDeleteBill = (billId: string) => { console.log("Delete Bill", billId); };
    const handleImportCustomers = (newCustomers: NewCustomerData[]) => { console.log("Import Customers", newCustomers); };
    const handleImportSuppliers = (newSuppliers: NewSupplierData[]) => { console.log("Import Suppliers", newSuppliers); };
    const handleImportBills = (billsToImport: any[]) => { console.log("Import Bills", billsToImport); };
    const handleNewTransaction = async (transaction: Omit<Transaction, 'payment_status' | 'due_date' | 'paid_amount'>, cartItems: CartItem[], appliedCreditId?: string, carriedForwardBalance?: { customerId: string, amount: number }): Promise<Transaction | undefined> => { console.log("New Transaction"); return undefined; };
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
    const handleUpdateSettings = (newSettings: Partial<StoreSettings>) => { console.log("Update Settings", newSettings); };
    const handleUpdateUser = (userId: string, data: Partial<Omit<User, 'id' | 'password'>>) => { console.log("Update User", userId, data); };
    const handleUpdatePassword = async (userId: string, currentPass: string, newPass: string): Promise<{success: boolean, message: TranslationKey}> => { console.log("Update Password"); return { success: true, message: 'password_update_success' }; };
    const handleImportProducts = (payload: any) => { console.log("Import Products", payload); };

    // NAVIGATION & UI LOGIC
    const handleNavigate = (view: string, state?: any) => { setActiveView(view); };
    const handleLogin = (username: string, password: string) => { 
        const permissions = getPermissionsFromRoles([Role.ADMIN]);
        setCurrentUser({ id: '1', name: 'Admin', role: [Role.ADMIN], avatar: '', permissions });
    };
    const handleLogout = () => { setCurrentUser(null); };
    const handleStartSimulation = (role: Role) => {};
    const handleStopSimulation = () => {};
    const handleProductMouseEnter = (product: Product, event: React.MouseEvent) => {};
    const handleProductMouseLeave = () => {};
    const handleBack = () => {};
    const openScanner = (onSuccess: (code: string) => void) => {};
    const handleScanSuccess = (scannedCode: string) => {};
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
    };

    const renderView = () => {
        if (!currentUser) return <LoginView onLogin={handleLogin} storeSettings={storeSettings} language={language} setLanguage={setLanguage} t={t} />;
        if (activeView === 'ceo_dashboard') return <CEODashboard currentUser={currentUser} onLogout={handleLogout} transactions={transactions} bills={bills} users={users} products={products} suppliers={suppliers} storeSettings={storeSettings} t={t} language={language} setLanguage={setLanguage} onBillUpdated={handleBillUpdate} showAlert={showAlert} />;

        switch (activeView) {
            case 'dashboard': return <Dashboard products={products} users={users} transactions={transactions} bills={bills} t={t} language={language} onNavigate={handleNavigate} currentUser={currentUser} storeSettings={storeSettings} />;
            case 'pos': return <POSView products={products} currentUser={currentUser} customers={customers} storeCredits={storeCredits} transactions={transactions} onNewTransaction={handleNewTransaction} onNewInvoice={handleNewInvoice} onNewOrder={handleNewOrder} onAddNewCustomerFromPOS={handleAddNewCustomerFromPOS} openScanner={openScanner} posScannedCode={posScannedCode} setPosScannedCode={setPosScannedCode} showAlert={showAlert} storeSettings={storeSettings} onProductMouseEnter={handleProductMouseEnter} onProductMouseLeave={handleProductMouseLeave} t={t} language={language} />;
            case 'inventory': return <ProductTable products={products} currentUser={currentUser} onAddProductClick={() => setIsAddProductModalOpen(true)} onAddProductByScan={handleAddProductByScan} onImportProductsClick={() => setIsImportModalOpen(true)} onEditProduct={(p) => { setProductToEdit(p); setIsEditProductModalOpen(true); }} onDeleteProduct={(p) => { setProductToDelete(p); setIsDeleteModalOpen(true); }} onViewProduct={(p) => { setProductToView(p); setIsViewProductModalOpen(true); }} onShowBarcode={(p, v) => { setProductToView(p); setVariantToShowBarcode(v); setIsBarcodeDisplayOpen(true); }} openScanner={openScanner} inventorySearchCode={inventorySearchCode} setInventorySearchCode={setInventorySearchCode} t={t} language={language} />;
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

             {hoveredProduct && (
                <ProductTooltip product={hoveredProduct} position={popupPosition} language={language} />
            )}
        </div>
    );
};

export default App;
