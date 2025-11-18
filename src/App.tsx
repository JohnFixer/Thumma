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
import ProfileModal from './components/ProfileModal';
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
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
            const [usersResult, productsResult, transactionsResult, customersResult, suppliersResult, ordersResult, storeCreditsResult, activityLogsResult, shiftReportsResult, settingsResult, billsResult] = await Promise.all([
                supabase.from('users').select('*'),
                supabase.from('products').select('*'),
                supabase.from('transactions').select('*'),
                supabase.from('customers').select('*'),
                supabase.from('suppliers').select('*'),
                supabase.from('orders').select('*').order('date', { ascending: false }),
                supabase.from('store_credits').select('*'),
                supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }),
                supabase.from('shift_reports').select('*').order('endTime', { ascending: false }),
                supabase.from('store_settings').select('*').single(),
                supabase.from('bills')
                    .select('id, supplierId:supplier_id, invoiceNumber:invoice_number, billDate:bill_date, dueDate:due_date, amount, status, paidAmount:paid_amount, payments, notes, fileUrl:file_url')
                    .order('due_date', { ascending: true }),
            ]);
            
            if (usersResult.error) {
                console.error('Error fetching users:', usersResult.error);
                showAlert('Database Error', 'Could not fetch users from the database. Please check console for details.');
            } else if (usersResult.data) {
                const freshUsers = usersResult.data as User[];
                setUsers(freshUsers);
            
                // Refresh currentUser with fresh data from the database to prevent stale session data.
                if (currentUser) {
                    const refreshedCurrentUser = freshUsers.find(u => u.id === currentUser.id);
                    if (refreshedCurrentUser) {
                        const permissions = getPermissionsFromRoles(refreshedCurrentUser.role);
                        const mergedUser: User = {
                            ...refreshedCurrentUser,
                            settings: { ...(refreshedCurrentUser.settings || {}), ...(currentUser.settings || {}) },
                            permissions,
                        };
                        setCurrentUser(mergedUser);
                    } else {
                        // Current user was not found in the database (e.g., deleted by admin), so log them out.
                        setCurrentUser(null);
                    }
                }
            }

            if (productsResult.error) {
                console.error('Error fetching products:', productsResult.error);
                showAlert(
                    'Database Error', 
                    `Could not fetch products from the database.<br /><br /><strong>Details:</strong> ${productsResult.error.message}<br /><br /><strong class="text-yellow-700">Suggestion:</strong> Please ensure Row Level Security (RLS) is disabled for the <strong>products</strong> table in your Supabase project settings.`
                );
            } else if (productsResult.data) {
                const migratedProducts = (productsResult.data as any[]).map(p => {
                    if (typeof p.category === 'object' && p.category !== null && 'en' in p.category) {
                        // Handle legacy object-based category by converting it to a simple string for display.
                        // The app will now consistently use string categories.
                        return { ...p, category: p.category.en || p.category.th || 'Uncategorized' };
                    }
                    return p;
                });
                setProducts(migratedProducts as Product[]);
            }

            if (transactionsResult.error) {
                console.error('Error fetching transactions:', transactionsResult.error);
                showAlert('Database Error', 'Could not fetch sales history from the database.');
            } else if (transactionsResult.data) {
                 const processedTransactions = (transactionsResult.data as any[]).map(tx => ({
                    ...tx,
                    payment_status: tx.payment_status || PaymentStatus.PAID,
                    paid_amount: tx.paid_amount || 0,
                }));
                setTransactions(processedTransactions as Transaction[]);
            }
            
            if (customersResult.error) {
                console.error('Error fetching customers:', customersResult.error);
                showAlert('Database Error', 'Could not fetch customers from the database.');
            } else if (customersResult.data) {
                setCustomers(customersResult.data as Customer[]);
            }

            if (suppliersResult.error) {
                console.error('Error fetching suppliers:', suppliersResult.error);
                showAlert('Database Error', 'Could not fetch suppliers from the database.');
            } else if (suppliersResult.data) {
                setSuppliers(suppliersResult.data as Supplier[]);
            }

            if (ordersResult.error) {
                console.error('Error fetching orders:', ordersResult.error);
                showAlert('Database Error', 'Could not fetch orders from the database.');
            } else if (ordersResult.data) {
                setOrders(ordersResult.data as Order[]);
            }

            if (billsResult.error) {
                console.error('Error fetching bills:', billsResult.error);
                showAlert('Database Error', `Could not fetch bills from the database.<br /><br /><strong>Details:</strong> ${billsResult.error.message}`);
            } else if (billsResult.data) {
                setBills(billsResult.data as Bill[]);
            }

            if (storeCreditsResult.error) {
                console.error('Error fetching store credits:', storeCreditsResult.error);
                showAlert('Database Error', 'Could not fetch store credits from the database.');
            } else if (storeCreditsResult.data) {
                setStoreCredits(storeCreditsResult.data as StoreCredit[]);
            }

            if (activityLogsResult.error) {
                console.error('Error fetching activity logs:', activityLogsResult.error);
                showAlert('Database Error', 'Could not fetch activity logs from the database.');
            } else if (activityLogsResult.data) {
                setActivityLogs(activityLogsResult.data as ActivityLog[]);
            }

            if (shiftReportsResult.error) {
                console.error('Error fetching shift reports:', shiftReportsResult.error);
                showAlert(
                    'Database Error', 
                    `Could not fetch shift history from the database.
                    <br /><br />
                    <strong>Details:</strong> ${shiftReportsResult.error.message}
                    <br /><br />
                    <strong class="text-yellow-700">Suggestion:</strong> Please ensure Row Level Security (RLS) is disabled for the <strong>shift_reports</strong> table in your Supabase project settings.`
                );
            } else if (shiftReportsResult.data) {
                setShiftReports(shiftReportsResult.data as ShiftReport[]);
            }

            if (settingsResult.error) {
                console.error('Error fetching store settings:', settingsResult.error);
                showAlert(
                    'Database Error', 
                    `Could not fetch store settings. Please ensure you have created the 'store_settings' table and run the setup script.`
                );
            } else if (settingsResult.data) {
                setStoreSettings(settingsResult.data as StoreSettings);
            }

            setIsLoading(false);
        };

        fetchInitialData();
    }, [showAlert]);

    const logActivity = async (action: string, user: User) => {
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            userId: user.id,
            action,
            timestamp: new Date().toISOString(),
        };
        setActivityLogs(prev => [newLog, ...prev]);
        const { error } = await supabase.from('activity_logs').insert([newLog]);
        if (error) {
            console.error('Error logging activity to database:', error);
        }
    };

    // NAVIGATION & UI LOGIC
    const handleNavigate = (view: string, state?: any) => {
        setActiveView(view);
        setViewState(state);
        setNavigationHistory(prevHistory => {
            // Avoid pushing the same view consecutively
            if (prevHistory[prevHistory.length - 1] === view) {
                return prevHistory;
            }
            return [...prevHistory, view];
        });
    };

    const handleLogin = (username: string, password: string) => {
        const user = users.find(u => u.name.toLowerCase() === username.toLowerCase().trim());

        if (user && user.password === password) {
            const permissions = getPermissionsFromRoles(user.role);
            const userWithPermissions: User = { ...user, permissions };

            setCurrentUser(userWithPermissions);
            logActivity(`User ${user.name} logged in.`, userWithPermissions);
            if (user.role.includes(Role.CEO)) {
                setActiveView('ceo_dashboard');
            } else {
                setActiveView('dashboard');
            }
            if (password === '1234567') {
                setIsForcePasswordChangeOpen(true);
            }
        } else {
            showAlert('Login Failed', 'Invalid username or password. Please try again.');
        }
    };

    const handleLogout = () => {
        if(currentUser) {
            logActivity(`User ${currentUser.name} logged out.`, currentUser);
        }
        setCurrentUser(null);
        setOriginalUser(null);
        setIsForcePasswordChangeOpen(false);
        setNavigationHistory(['dashboard']);
    };
    
    const handleStartSimulation = (role: Role) => {
        if (!currentUser) return;
        const isAllowed = currentUser.role.includes(Role.ADMIN) || currentUser.role.includes(Role.CEO);
        if (!isAllowed || originalUser) return;

        setOriginalUser(currentUser);
        const simulatedPermissions = getPermissionsFromRoles([role]);
        const simulatedUser: User = {
            ...currentUser,
            role: [role],
            permissions: simulatedPermissions,
        };
        setCurrentUser(simulatedUser);
        handleNavigate('dashboard');
    };

    const handleStopSimulation = () => {
        if (originalUser) {
            setCurrentUser(originalUser);
            setOriginalUser(null);
            handleNavigate('dashboard');
        }
    };
    
    const handleProductMouseEnter = (product: Product, event: React.MouseEvent) => {
        setHoveredProduct(product);
        setPopupPosition({ x: event.clientX, y: event.clientY });
    };

    const handleProductMouseLeave = () => {
        setHoveredProduct(null);
    };

    const handleBack = () => {
        if (navigationHistory.length <= 1) return;
    
        const newHistory = navigationHistory.slice(0, -1);
        const previousView = newHistory[newHistory.length - 1];
        
        setNavigationHistory(newHistory);
        setActiveView(previousView);
        setViewState(null); // Reset view state when going back for predictability
    };
    
    const openScanner = (onSuccess: (code: string) => void) => {
        setScanCallback(() => onSuccess);
        setIsScannerOpen(true);
    };

    const handleScanSuccess = (scannedCode: string) => {
        scanCallback(scannedCode);
        setIsScannerOpen(false);
    };


    // CRUD OPERATIONS
    const handleAddProduct = async (productData: NewProductData) => {
        if (!currentUser?.permissions.inventory.write) {
            showAlert('Permission Denied', 'You do not have permission to add products.');
            return;
        }
        const variantsWithDetails = productData.variants.map((v, i) => ({
            ...(v as NewProductVariantData),
            id: `var-${Date.now()}-${i}`,
            status: v.stock > 10 ? ProductStatus.IN_STOCK : v.stock > 0 ? ProductStatus.LOW_STOCK : ProductStatus.OUT_OF_STOCK,
            history: [],
        }));
    
        const productToInsert = {
            name: productData.name,
            description: productData.description,
            category: productData.category,
            imageUrl: productData.imageUrl,
            variants: variantsWithDetails,
        };
    
        const { data, error } = await supabase
            .from('products')
            .insert([productToInsert])
            .select();
    
        if (error) {
            console.error('Error adding product:', error);
            showAlert('Database Error', 'Could not add the product to the database. Please try again.');
            return;
        }
    
        if (data) {
            const newProduct = data[0] as Product;
            setProducts(prev => [newProduct, ...prev]);
            logActivity(`Added new product: ${newProduct.name.en}`, currentUser);
            setIsAddProductModalOpen(false);
            setInitialBarcodeForAdd(null);
            showAlert('Success', `Product "${newProduct.name.en}" has been added.`);
        }
    };
    
    const handleAddProductByScan = () => {
        openScanner((code) => {
            const exists = products.some(p => p.variants.some(v => v.barcode === code));
            if (exists) {
                showAlert('Barcode Exists', `This barcode is already assigned. Searching for it now.`);
                setInventorySearchCode(code);
                setActiveView('inventory');
            } else {
                setInitialBarcodeForAdd(code);
                setIsAddProductModalOpen(true);
            }
        });
    };

    const handleEditProduct = async (productId: string, productData: NewProductData) => {
        if (!currentUser?.permissions.inventory.write) {
            showAlert('Permission Denied', 'You do not have permission to edit products.');
            return;
        }
        const updatedVariants = productData.variants.map((v, i) => {
            const id = 'id' in v ? (v as ProductVariant).id : `var-edit-${Date.now()}-${i}`;
            const history = 'history' in v ? (v as ProductVariant).history : [];
            return {
                ...v,
                id: id,
                status: v.stock > 10 ? ProductStatus.IN_STOCK : v.stock > 0 ? ProductStatus.LOW_STOCK : ProductStatus.OUT_OF_STOCK,
                history: history,
            };
        });
    
        const updatePayload = {
            name: productData.name,
            description: productData.description,
            category: productData.category,
            imageUrl: productData.imageUrl,
            variants: updatedVariants,
        };
    
        const { data, error } = await supabase
            .from('products')
            .update(updatePayload)
            .eq('id', productId)
            .select();
    
        if (error) {
            console.error('Error updating product:', error);
            showAlert('Database Error', 'Could not update the product in the database. Please try again.');
            return;
        }
    
        if (data) {
            const updatedProduct = data[0] as Product;
            setProducts(prev => prev.map(p => (p.id === productId ? updatedProduct : p)));
            logActivity(`Edited product: ${updatedProduct.name.en}`, currentUser);
            setIsEditProductModalOpen(false);
            showAlert('Success', `Product "${updatedProduct.name.en}" has been updated.`);
        }
    };
    
    const handleDeleteProduct = async () => {
        if (!productToDelete || !currentUser?.permissions.inventory.delete) {
            showAlert('Permission Denied', 'You do not have permission to delete products.');
            return;
        }
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productToDelete.id);
    
        if (error) {
            console.error('Error deleting product:', error);
            showAlert('Database Error', `Could not delete "${productToDelete.name.en}" from the database. Please try again.`);
            return;
        }
    
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        logActivity(`Deleted product: ${productToDelete.name.en}`, currentUser);
        showAlert('Success', `Product "${productToDelete.name.en}" has been deleted.`);
    
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const handleAddUser = async (userData: NewUserData) => {
        if (!currentUser?.permissions.user_management.write) {
             showAlert('Permission Denied', 'You do not have permission to add users.');
            return;
        }
        const newUserPayload = { ...userData, password: '1234567', settings: {} };

        const { data, error } = await supabase.from('users').insert([newUserPayload]).select().single();

        if (error) {
            console.error('Error adding user:', error);
            showAlert('Database Error', 'Could not add the new user. Please check the console for details.');
            return;
        }

        if (data) {
            const newUser = data as User;
            setUsers(prev => [...prev, newUser]);
            logActivity(`Added new user: ${newUser.name}`, currentUser);
            showAlert('Success', `User "${newUser.name}" created successfully with a temporary password.`);
        }
    };

    const handleEditUser = async (userId: string, userData: NewUserData) => {
        if (!currentUser?.permissions.user_management.write) {
            showAlert('Permission Denied', 'You do not have permission to edit users.');
            return;
        }
    
        // Separate database payload from client-side calculated permissions
        const { permissions, ...dbUpdatePayload } = userData;
    
        const { data, error } = await supabase
            .from('users')
            .update(dbUpdatePayload) // Only update storable fields
            .eq('id', userId)
            .select()
            .single();
    
        if (error) {
            console.error('Error updating user:', error);
            showAlert('Database Error', `Could not update user "${userData.name}".`);
            return;
        }
    
        if (data) {
            // The data back from the DB is the source of truth for stored properties.
            const updatedUserFromDb = data as Omit<User, 'permissions' | 'password' | 'settings'>;
    
            // Combine fresh DB data with the new permissions calculated in the modal.
            // Also merge with any existing settings from the old local state.
            const oldUser = users.find(u => u.id === userId);
            const fullyUpdatedUser: User = {
                ...(oldUser || {}), // carry over old settings or other non-DB fields
                ...updatedUserFromDb, // overwrite with fresh DB data (name, roles, etc)
                permissions: userData.permissions, // apply the new permissions
            };
    
            // Update the main users list
            setUsers(prev => prev.map(u => (u.id === userId ? fullyUpdatedUser : u)));
    
            // If the user being edited is the currently logged-in user, update their session
            if (currentUser?.id === userId) {
                setCurrentUser(fullyUpdatedUser);
            }
    
            logActivity(`Edited user profile: ${fullyUpdatedUser.name}`, currentUser);
            showAlert('Success', `User "${fullyUpdatedUser.name}" has been updated.`);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!currentUser?.permissions.user_management.delete) {
            showAlert('Permission Denied', 'You do not have permission to delete users.');
            return;
        }
        const user = users.find(u => u.id === userId);
        if (!user) return;
    
        const { error } = await supabase.from('users').delete().eq('id', userId);
    
        if (error) {
            console.error('Error deleting user:', error);
            showAlert('Database Error', `Could not delete user "${user.name}".`);
            return;
        }
    
        setUsers(prev => prev.filter(u => u.id !== userId));
        logActivity(`Deleted user: ${user.name}`, currentUser);
        showAlert('Success', `User "${user.name}" has been deleted.`);
    };

    const handleResetPassword = async (userId: string) => {
        if (!currentUser?.permissions.user_management.reset_password) {
            showAlert('Permission Denied', 'You do not have permission to reset passwords.');
            return;
        }
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const { error } = await supabase
            .from('users')
            .update({ password: '1234567' })
            .eq('id', userId);

        if (error) {
            console.error('Error resetting password:', error);
            showAlert('Database Error', `Could not reset password for "${user.name}".`);
            return;
        }
        
        logActivity(`Reset password for user: ${user.name}`, currentUser);
        showAlert('Success', `Password for "${user.name}" has been reset to the default. They will be required to change it on their next login.`);
    };

    const handleAddCustomer = async (customerData: NewCustomerData) => {
        if (!currentUser?.permissions.customers.write) {
            showAlert('Permission Denied', 'You do not have permission to add customers.');
            return;
        }
        const { data, error } = await supabase
            .from('customers')
            .insert([customerData])
            .select();
    
        if (error) {
            console.error('Error adding customer:', error);
            showAlert('Database Error', 'Could not add the customer. Please try again.');
            return;
        }
    
        if (data) {
            const newCustomer = data[0] as Customer;
            setCustomers(prev => [newCustomer, ...prev]);
            logActivity(`Added customer: ${newCustomer.name}`, currentUser);
            showAlert('Success', `Customer "${newCustomer.name}" has been successfully added.`);
        }
    };

    const handleAddNewCustomerFromPOS = async (customerData: NewCustomerData): Promise<Customer | null> => {
        if (!currentUser?.permissions.customers.write) {
            showAlert('Permission Denied', 'You do not have permission to add customers.');
            return null;
        }
        const { data, error } = await supabase
            .from('customers')
            .insert([customerData])
            .select()
            .single();

        if (error) {
            console.error('Error adding customer from POS:', error);
            showAlert('Database Error', 'Could not add the new customer.');
            return null;
        }

        if (data) {
            const newCustomer = data as Customer;
            setCustomers(prev => [newCustomer, ...prev]);
            logActivity(`Added customer from POS: ${newCustomer.name}`, currentUser);
            return newCustomer;
        }
        return null;
    };
    
    const handleEditCustomer = async (customerId: string, customerData: NewCustomerData) => {
        if (!currentUser?.permissions.customers.write) {
            showAlert('Permission Denied', 'You do not have permission to edit customers.');
            return;
        }
        const { data, error } = await supabase
            .from('customers')
            .update(customerData)
            .eq('id', customerId)
            .select();
    
        if (error) {
            console.error('Error updating customer:', error);
            showAlert('Database Error', 'Could not update the customer. Please try again.');
            return;
        }
    
        if (data) {
            const updatedCustomer = data[0] as Customer;
            setCustomers(prev => prev.map(c => (c.id === customerId ? updatedCustomer : c)));
            logActivity(`Edited customer: ${updatedCustomer.name}`, currentUser);
            showAlert('Success', `Customer "${updatedCustomer.name}" has been updated.`);
        }
    };
    
    const handleDeleteCustomer = async (customerId: string) => {
        if (!currentUser?.permissions.customers.delete) {
            showAlert('Permission Denied', 'You do not have permission to delete customers.');
            return;
        }
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', customerId);

        if (error) {
            console.error('Error deleting customer:', error);
            showAlert('Database Error', `Could not delete customer "${customer.name}".`);
            return;
        }

        setCustomers(prev => prev.filter(c => c.id !== customerId));
        logActivity(`Deleted customer: ${customer.name}`, currentUser);
        showAlert('Success', `Customer "${customer.name}" has been deleted.`);
    };

    const handleAddSupplier = async (supplierData: NewSupplierData) => {
        if (!currentUser?.permissions.suppliers.write) {
            showAlert('Permission Denied', 'You do not have permission to add suppliers.');
            return;
        }
        const { data, error } = await supabase
            .from('suppliers')
            .insert([{ ...supplierData, orderHistory: [] }])
            .select();

        if (error) {
            console.error('Error adding supplier:', error);
            showAlert('Database Error', 'Could not add the supplier. Please try again.');
            return;
        }

        if (data) {
            const newSupplier = data[0] as Supplier;
            setSuppliers(prev => [newSupplier, ...prev]);
            logActivity(`Added supplier: ${newSupplier.name}`, currentUser);
            setIsAddSupplierModalOpen(false);
            showAlert('Success', `Supplier "${newSupplier.name}" has been successfully added.`);
        }
    };

    const handleEditSupplier = async (supplierId: string, supplierData: NewSupplierData) => {
        if (!currentUser?.permissions.suppliers.write) {
            showAlert('Permission Denied', 'You do not have permission to edit suppliers.');
            return;
        }
        const { data, error } = await supabase
            .from('suppliers')
            .update(supplierData)
            .eq('id', supplierId)
            .select();

        if (error) {
            console.error('Error updating supplier:', error);
            showAlert('Database Error', 'Could not update the supplier. Please try again.');
            return;
        }

        if (data) {
            const updatedSupplier = data[0] as Supplier;
            setSuppliers(prev => prev.map(s => (s.id === supplierId ? updatedSupplier : s)));
            logActivity(`Edited supplier: ${updatedSupplier.name}`, currentUser);
            showAlert('Success', `Supplier "${updatedSupplier.name}" has been updated.`);
        }
    };

    const handleDeleteSupplier = async (supplierId: string) => {
        if (!currentUser?.permissions.suppliers.delete) {
            showAlert('Permission Denied', 'You do not have permission to delete suppliers.');
            return;
        }
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', supplierId);

        if (error) {
            console.error('Error deleting supplier:', error);
            showAlert('Database Error', `Could not delete supplier "${supplier.name}".`);
            return;
        }

        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        logActivity(`Deleted supplier: ${supplier.name}`, currentUser);
        showAlert('Success', `Supplier "${supplier.name}" has been deleted.`);
    };

    const handleAddBill = async (billData: NewBillData) => {
        if (!currentUser?.permissions.accounts_payable.write) {
             showAlert('Permission Denied', 'You do not have permission to add bills.');
            return;
        }
    
        let fileUrl: string | undefined = undefined;
        if (billData.file) {
            const file = billData.file;
            const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
            // Using 'invoice-pdfs' bucket for consistency with past invoices
            const { error: uploadError } = await supabase.storage
                .from('invoice-pdfs')
                .upload(fileName, file);

            if (uploadError) {
                showAlert('Upload Error', `Failed to upload file: ${uploadError.message}.`);
                console.error('File upload error:', uploadError);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('invoice-pdfs')
                .getPublicUrl(fileName);
            fileUrl = publicUrl;
        }

        const newBillPayload = {
            supplier_id: billData.supplierId,
            invoice_number: billData.invoiceNumber,
            bill_date: billData.billDate,
            due_date: billData.dueDate,
            amount: billData.amount,
            notes: billData.notes,
            file_url: fileUrl,
            status: BillStatus.DUE,
            paid_amount: 0,
            payments: [],
        };

        const { data, error } = await supabase.from('bills').insert([newBillPayload]).select('id, supplierId:supplier_id, invoiceNumber:invoice_number, billDate:bill_date, dueDate:due_date, amount, status, paidAmount:paid_amount, payments, notes, fileUrl:file_url').single();

        if (error) {
            console.error('Error adding bill:', error);
            showAlert('Database Error', 'Could not add the bill. Please check the console.');
            return;
        }

        if (data) {
            const newBill = data as Bill;
            setBills(prev => [...prev, newBill].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
            logActivity(`Added new bill #${newBill.invoiceNumber} from supplier ID ${newBill.supplierId}.`, currentUser);
            showAlert('Success', `Bill #${newBill.invoiceNumber} has been added.`);
            setIsAddBillModalOpen(false);
        }
    };
    
    const handleRecordBillPayment = async (billId: string, paymentData: { paymentAmount: number; paymentDate: string; paymentMethod: PaymentMethod; referenceNote: string; }) => {
        if (!currentUser?.permissions.accounts_payable.write) {
             showAlert('Permission Denied', 'You do not have permission to record payments.');
            return;
        }
        const targetBill = bills.find(b => b.id === billId);
        if (!targetBill) {
            showAlert('Error', 'Bill not found');
            return;
        }
    
        const newPayment: BillPayment = {
            id: `pay-${Date.now()}`,
            amount: paymentData.paymentAmount,
            paymentDate: paymentData.paymentDate,
            paymentMethod: paymentData.paymentMethod,
            referenceNote: paymentData.referenceNote,
        };
    
        const updatedPayments = [...(targetBill.payments || []), newPayment];
        const newPaidAmount = targetBill.paidAmount + newPayment.amount;
        const newStatus = newPaidAmount >= targetBill.amount ? BillStatus.PAID : targetBill.status;
    
        const updatePayload = {
            paid_amount: newPaidAmount,
            payments: updatedPayments,
            status: newStatus,
        };
    
        const { data, error } = await supabase.from('bills')
            .update(updatePayload)
            .eq('id', billId)
            .select('id, supplierId:supplier_id, invoiceNumber:invoice_number, billDate:bill_date, dueDate:due_date, amount, status, paidAmount:paid_amount, payments, notes, fileUrl:file_url')
            .single();
    
        if (error) {
            showAlert('Database Error', `Could not record payment: ${error.message}`);
            return;
        }
    
        if (data) {
            const updatedBill = data as Bill;
            setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));
            logActivity(`Recorded payment of ฿${newPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for bill #${updatedBill.invoiceNumber}.`, currentUser);
            showAlert('Success', 'Payment has been recorded.');
            setIsRecordPaymentModalOpen(false);
            setBillToRecordPaymentFor(null);
        }
    };

    const handleBillUpdate = (updatedBill: Bill) => {
        setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    };

    const handleDeleteBill = async (billId: string) => {
        if (!currentUser?.permissions.accounts_payable.delete) {
             showAlert('Permission Denied', 'You do not have permission to delete bills.');
            return;
        }
        const bill = bills.find(b => b.id === billId);
        if (!bill) return;
    
        const { error } = await supabase.from('bills').delete().eq('id', billId);
    
        if (error) {
            console.error('Error deleting bill:', error);
            showAlert('Database Error', `Could not delete bill #${bill.invoiceNumber}.`);
            return;
        }
    
        setBills(prev => prev.filter(b => b.id !== billId));
        logActivity(`Deleted bill #${bill.invoiceNumber}.`, currentUser);
        showAlert('Success', `Bill #${bill.invoiceNumber} has been deleted.`);
    };
    
    const handleImportCustomers = async (newCustomers: NewCustomerData[]) => {
        if (!currentUser?.permissions.customers.write) {
             showAlert('Permission Denied', 'You do not have permission to import customers.');
            return;
        }
        const { error } = await supabase.from('customers').insert(newCustomers);
        if (error) {
            console.error('Error importing customers:', error);
            showAlert('Import Error', 'Could not save imported customers to the database.');
            return;
        }

        const { data } = await supabase.from('customers').select('*');
        if (data) {
            setCustomers(data as Customer[]);
        }
        setIsImportCustomersModalOpen(false);
        logActivity(`Imported ${newCustomers.length} new customers.`, currentUser);
        showAlert('Import Successful', `Successfully imported ${newCustomers.length} new customers.`);
    };

    const handleImportSuppliers = async (newSuppliers: NewSupplierData[]) => {
        if (!currentUser?.permissions.suppliers.write) {
            showAlert('Permission Denied', 'You do not have permission to import suppliers.');
            return;
        }
        const { error } = await supabase.from('suppliers').insert(newSuppliers.map(s => ({ ...s, orderHistory: [] })));
        if (error) {
            console.error('Error importing suppliers:', error);
            showAlert('Import Error', 'Could not save imported suppliers to the database.');
            return;
        }

        const { data } = await supabase.from('suppliers').select('*');
        if (data) {
            setSuppliers(data as Supplier[]);
        }
        setIsImportSuppliersModalOpen(false);
        logActivity(`Imported ${newSuppliers.length} new suppliers.`, currentUser);
        showAlert('Import Successful', `Successfully imported ${newSuppliers.length} new suppliers.`);
    };
    
    const handleImportBills = async (billsToImport: BillImportData[]) => {
        if (!currentUser?.permissions.accounts_payable.write) {
            showAlert('Permission Denied', 'You do not have permission to import bills.');
            return;
        }
    
        // 1. Identify and create new suppliers
        const newSupplierNames = [...new Set(
            billsToImport
                .filter(b => b.isNewSupplier)
                .map(b => b.supplierName)
        )];
    
        let newSuppliers: Supplier[] = [];
        if (newSupplierNames.length > 0) {
            const newSupplierPayloads: NewSupplierData[] = newSupplierNames.map(name => ({
                name,
                contactPerson: 'N/A',
                email: 'N/A',
                phone: '',
                address: '',
                logo: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/100/100`,
            }));
            
            const { data, error } = await supabase.from('suppliers').insert(newSupplierPayloads.map(s => ({...s, orderHistory: []}))).select();
            if (error) {
                showAlert('Database Error', 'Could not create new suppliers during import.');
                return;
            }
            newSuppliers = data as Supplier[];
        }
    
        // 2. Combine existing and new suppliers for mapping
        const allSuppliers = [...suppliers, ...newSuppliers];
        const supplierNameToIdMap = new Map(allSuppliers.map(s => [s.name.toLowerCase(), s.id]));
    
        // 3. Prepare bill payloads
        const billPayloads = billsToImport.map(bill => ({
            supplier_id: supplierNameToIdMap.get(bill.supplierName.toLowerCase()),
            invoice_number: bill.invoiceNumber,
            bill_date: bill.billDate,
            due_date: bill.dueDate,
            amount: bill.amount,
            notes: bill.notes,
            status: BillStatus.DUE,
            paid_amount: 0,
            payments: [],
        })).filter(p => p.supplier_id); // Filter out any that failed to map
    
        // 4. Insert bills
        if (billPayloads.length > 0) {
            const { error } = await supabase.from('bills').insert(billPayloads);
            if (error) {
                showAlert('Database Error', 'Could not import bills.');
                return;
            }
        }
    
        // 5. Refresh state from DB to get all new data
        if (newSuppliers.length > 0) {
            const { data: updatedSuppliers } = await supabase.from('suppliers').select('*');
            if (updatedSuppliers) setSuppliers(updatedSuppliers as Supplier[]);
        }
        const { data: updatedBills } = await supabase.from('bills').select('id, supplierId:supplier_id, invoiceNumber:invoice_number, billDate:bill_date, dueDate:due_date, amount, status, paidAmount:paid_amount, payments, notes, fileUrl:file_url').order('due_date', { ascending: true });
        if (updatedBills) {
            setBills(updatedBills as Bill[]);
        }
    
        // 6. Show success message
        logActivity(`Imported ${billPayloads.length} bills and created ${newSuppliers.length} suppliers.`, currentUser);
        const successMessage = newSuppliers.length > 0
            ? t('import_success_bills_and_suppliers', { billCount: billPayloads.length, supplierCount: newSuppliers.length })
            : t('import_success_bills_only', { billCount: billPayloads.length });
        showAlert('Import Successful', successMessage);
        setIsImportBillsModalOpen(false);
    };


    const handleUpdateUser = async (userId: string, data: Partial<Omit<User, 'id' | 'password'>>) => {
        if (!currentUser) return;
        
        // In `handleUpdateUser`, safely merge user settings to prevent crashes
        // if `currentUser.settings` or `data.settings` are null or undefined.
        const currentUserSettings = currentUser.settings || {};
        const dataSettings = data.settings || {};

        const updatePayload = {
            ...data,
            settings: { ...currentUserSettings, ...dataSettings }
        };

    
        const { data: updatedUserData, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', userId)
            .select()
            .single();
    
        if (error) {
            showAlert('Database Error', 'Could not update your profile.');
            console.error('Profile update error:', error);
            return;
        }
    
        if (updatedUserData) {
            const permissions = getPermissionsFromRoles(updatedUserData.role);
            const userWithPermissions = { ...updatedUserData, permissions } as User;
            setUsers(prev => prev.map(u => u.id === userId ? userWithPermissions : u));
            if (currentUser.id === userId) {
                setCurrentUser(userWithPermissions);
            }
            logActivity(`Updated profile for ${updatedUserData.name}`, currentUser);
        }
    };
    
    const handleUpdatePassword = async (userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: TranslationKey }> => {
        if (!currentUser) return { success: false, message: 'password_update_error_not_logged_in' };
        const user = users.find(u => u.id === userId);
    
        if (user?.password === currentPass) {
            const { data, error } = await supabase
                .from('users')
                .update({ password: newPass })
                .eq('id', userId)
                .select()
                .single();
    
            if (error) {
                console.error('Password update error:', error);
                return { success: false, message: 'password_update_error_db' };
            }
    
            if (data) {
                 const permissions = getPermissionsFromRoles(data.role);
                const userWithPermissions = { ...data, permissions } as User;
                setUsers(prev => prev.map(u => u.id === userId ? userWithPermissions : u));
                if (currentUser.id === userId) {
                    setCurrentUser(userWithPermissions);
                }
                logActivity('Updated password.', currentUser);
                return { success: true, message: 'password_update_success' };
            }
        }
        return { success: false, message: 'password_update_error_incorrect' };
    };

    const handleNewTransaction = async (transaction: Omit<Transaction, 'payment_status' | 'due_date' | 'paid_amount'>, cartItems: CartItem[], appliedCreditId?: string, carriedForwardBalance?: { customerId: string, amount: number }) => {
        if (!currentUser?.permissions.pos.write) {
            showAlert('Permission Denied', 'You do not have permission to create transactions.');
            return;
        }

        const newTransaction: Transaction = {
            ...transaction,
            payment_status: PaymentStatus.PAID,
            paid_amount: transaction.total,
        };
    
        const { transportationFee, ...restOfTransaction } = newTransaction;
        const payload: any = { ...restOfTransaction };

        if (transportationFee && transportationFee > 0) {
            payload.transportation_fee = transportationFee;
        }

        const { error: transactionError } = await supabase.from('transactions').insert([payload]);
        
        if (transactionError) {
            console.error('Error saving transaction:', transactionError);
            
            let suggestion = `<strong>Suggestion:</strong> This error is coming directly from your database. It often indicates a mismatch between the data the app is trying to save and the structure of your 'transactions' table. The error message below is the key to solving the problem.`;
        
            if (transactionError.message.includes('customer_type')) {
                suggestion += `<br/><br/>The error mentions "customer_type", which is a common issue. You may need to update your database schema by running: <br/><code>ALTER TYPE public.customer_type ADD VALUE IF NOT EXISTS 'organization';</code>`;
            } else if (transactionError.message.includes('violates not-null constraint')) {
                suggestion += `<br/><br/>The error mentions a "not-null constraint". This means a required column in your 'transactions' table was not provided with a value. Check the column name in the error message and ensure it has a default value in your database schema.`;
            } else if (transactionError.message.includes('column') && (transactionError.message.includes('does not exist') || transactionError.message.includes('Could not find'))) {
                 if (transactionError.message.includes('schema cache')) {
                     suggestion += `<br/><br/>This specific error often points to a temporary issue where the app's view of the database is out of sync. This "schema cache" issue usually resolves itself within a few minutes. Please try again shortly. If the problem persists, refreshing the database connection in your Supabase project dashboard may help.`;
                 } else {
                     const match = transactionError.message.match(/column "(\w+)"/i) || transactionError.message.match(/'(\w+)' column/i);
                     const columnName = match ? match[1] : 'the_missing_column';
                     const snakeCaseColumn = columnName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                     suggestion += `<br/><br/>The error mentions a column that "does not exist". This likely means a new feature was added to the app that requires a new column in your 'transactions' table. For example, if the error mentions '${columnName}', you may need to run: <br/><code>ALTER TABLE public.transactions ADD COLUMN ${snakeCaseColumn} numeric;</code>`;
                 }
            }
            
            showAlert(
                'Database Error', 
                `Could not save the sale. The database returned the following error:<br/><br/>
                 <div class="text-sm bg-red-100 text-red-800 p-2 block rounded font-mono">${transactionError.message}</div>
                 <br/>
                 ${suggestion}`
            );
            return;
        }
    
        const stockUpdatePromises = cartItems.map(async (item) => {
            if (item.isOutsourced) return;
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
            const updatedVariants = JSON.parse(JSON.stringify(product.variants));
            const variantToUpdate = updatedVariants.find((v: ProductVariant) => v.id === item.variantId);
            if (variantToUpdate) {
                variantToUpdate.stock -= item.quantity;
                variantToUpdate.status = variantToUpdate.stock > 10 ? ProductStatus.IN_STOCK : variantToUpdate.stock > 0 ? ProductStatus.LOW_STOCK : ProductStatus.OUT_OF_STOCK;
                const { error: stockError } = await supabase.from('products').update({ variants: updatedVariants }).eq('id', product.id);
                if (stockError) console.error(`Error updating stock for SKU ${item.sku}:`, stockError);
            }
        });
        await Promise.all(stockUpdatePromises);
    
        if (carriedForwardBalance && carriedForwardBalance.customerId) {
            const { data: unpaidTxs, error: fetchError } = await supabase.from('transactions')
                .select('id')
                .eq('customerId', carriedForwardBalance.customerId)
                .in('payment_status', [PaymentStatus.UNPAID, PaymentStatus.PARTIALLY_PAID]);
    
            if (fetchError) {
                console.error('Error fetching old invoices to clear:', fetchError);
            } else if (unpaidTxs && unpaidTxs.length > 0) {
                const idsToUpdate = unpaidTxs.map(tx => tx.id);
                const { error: updateError } = await supabase.from('transactions')
                    .update({ payment_status: PaymentStatus.CONSOLIDATED })
                    .in('id', idsToUpdate);
    
                if (updateError) console.error('Error clearing old invoices:', updateError);
            }
        }
    
        if (appliedCreditId) {
            const { error: creditError } = await supabase.from('store_credits').update({ isUsed: true }).eq('id', appliedCreditId);
            if (creditError) {
                console.error('Error updating store credit status:', creditError);
                showAlert('Database Error', 'Could not update the store credit status in the database.');
            } else {
                setStoreCredits(prev => prev.map(sc => sc.id === appliedCreditId ? { ...sc, isUsed: true } : sc));
            }
        }
    
        const { data: updatedProductsData } = await supabase.from('products').select('*');
        if (updatedProductsData) setProducts(updatedProductsData as Product[]);
        
        const { data: updatedTransactionsData } = await supabase.from('transactions').select('*');
        if (updatedTransactionsData) setTransactions(updatedTransactionsData as Transaction[]);
        
        logActivity(`Completed transaction ${newTransaction.id} for ฿${newTransaction.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, currentUser);
        return newTransaction;
    };

    const handleNewInvoice = async (transaction: Omit<Transaction, 'payment_status' | 'paymentMethod' | 'paid_amount'>, cartItems: CartItem[]) => {
        if (!currentUser?.permissions.pos.write) {
            showAlert('Permission Denied', 'You do not have permission to create invoices.');
            return;
        }
    
        const invoiceTransaction: Transaction = {
            ...transaction,
            payment_status: PaymentStatus.UNPAID,
            paymentMethod: 'Cash',
            paid_amount: 0,
        };
        
        const { transportationFee, ...restOfTransaction } = invoiceTransaction;
        const payload: any = { ...restOfTransaction };

        if (transportationFee && transportationFee > 0) {
            payload.transportation_fee = transportationFee;
        }
    
        const { error: transactionError } = await supabase.from('transactions').insert([payload]);
    
        if (transactionError) {
            console.error('Error saving invoice:', transactionError);
            
            let suggestion = `<strong>Suggestion:</strong> This error is coming directly from your database. It often indicates a mismatch between the data the app is trying to save and the structure of your 'transactions' table. The error message below is the key to solving the problem.`;
        
            if (transactionError.message.includes('customer_type')) {
                suggestion += `<br/><br/>The error mentions "customer_type", which is a common issue. You may need to update your database schema by running: <br/><code>ALTER TYPE public.customer_type ADD VALUE IF NOT EXISTS 'organization';</code>`;
            } else if (transactionError.message.includes('violates not-null constraint')) {
                suggestion += `<br/><br/>The error mentions a "not-null constraint". This means a required column in your 'transactions' table was not provided with a value. Check the column name in the error message and ensure it has a default value in your database schema.`;
            } else if (transactionError.message.includes('column') && (transactionError.message.includes('does not exist') || transactionError.message.includes('Could not find'))) {
                 if (transactionError.message.includes('schema cache')) {
                     suggestion += `<br/><br/>This specific error often points to a temporary issue where the app's view of the database is out of sync. This "schema cache" issue usually resolves itself within a few minutes. Please try again shortly. If the problem persists, refreshing the database connection in your Supabase project dashboard may help.`;
                 } else {
                     const match = transactionError.message.match(/column "(\w+)"/i) || transactionError.message.match(/'(\w+)' column/i);
                     const columnName = match ? match[1] : 'the_missing_column';
                     const snakeCaseColumn = columnName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                     suggestion += `<br/><br/>The error mentions a column that "does not exist". This likely means a new feature was added to the app that requires a new column in your 'transactions' table. For example, if the error mentions '${columnName}', you may need to run: <br/><code>ALTER TABLE public.transactions ADD COLUMN ${snakeCaseColumn} numeric;</code>`;
                 }
            }
            
            showAlert(
                'Database Error', 
                `Could not save the invoice. The database returned the following error:<br/><br/>
                 <div class="text-sm bg-red-100 text-red-800 p-2 block rounded font-mono">${transactionError.message}</div>
                 <br/>
                 ${suggestion}`
            );
            return;
        }
    
        const stockUpdatePromises = cartItems.map(async (item) => {
            if (item.isOutsourced) return;
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
    
            const updatedVariants = JSON.parse(JSON.stringify(product.variants));
            const variantToUpdate = updatedVariants.find((v: ProductVariant) => v.id === item.variantId);
    
            if (variantToUpdate) {
                variantToUpdate.stock -= item.quantity;
                variantToUpdate.status = variantToUpdate.stock > 10 ? ProductStatus.IN_STOCK : variantToUpdate.stock > 0 ? ProductStatus.LOW_STOCK : ProductStatus.OUT_OF_STOCK;
    
                const { error: stockError } = await supabase.from('products').update({ variants: updatedVariants }).eq('id', product.id);
                if (stockError) console.error(`Error updating stock for SKU ${item.sku}:`, stockError);
            }
        });
    
        await Promise.all(stockUpdatePromises);
    
        const { data: updatedProductsData } = await supabase.from('products').select('*');
        if (updatedProductsData) setProducts(updatedProductsData as Product[]);
    
        const { data: updatedTransactionsData } = await supabase.from('transactions').select('*');
        if (updatedTransactionsData) {
            const processedTransactions = (updatedTransactionsData as any[]).map(tx => ({
                ...tx,
                payment_status: tx.payment_status || PaymentStatus.PAID,
                paid_amount: tx.paid_amount || 0,
            }));
            setTransactions(processedTransactions as Transaction[]);
        }
    
        logActivity(`Created invoice ${invoiceTransaction.id} for ฿${invoiceTransaction.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, currentUser);
    };

    const handleReceivePayment = async (transactionId: string, paymentAmount: number, paymentMethod: PaymentMethod) => {
        if (!currentUser?.permissions.accounts_receivable.write) {
            showAlert('Permission Denied', 'You do not have permission to receive payments.');
            return;
        }
        
        const targetTx = transactions.find(t => t.id === transactionId);
        if (!targetTx) {
            showAlert('Error', 'Transaction not found.');
            return;
        }

        const newPaidAmount = (targetTx.paid_amount || 0) + paymentAmount;
        const newStatus = newPaidAmount >= targetTx.total ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;

        const { data, error } = await supabase
            .from('transactions')
            .update({ 
                payment_status: newStatus,
                paid_amount: newPaidAmount,
                paymentMethod: paymentMethod
            })
            .eq('id', transactionId)
            .select()
            .single();
    
        if (error) {
            showAlert('Database Error', 'Could not update payment status.');
            console.error('Payment update error:', error);
            return;
        }
    
        if (data) {
            setTransactions(prev => prev.map(t => t.id === transactionId ? (data as Transaction) : t));
            logActivity(`Received payment of ฿${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for invoice ${transactionId}`, currentUser);
            showAlert('Payment Received', `Payment for invoice ${transactionId} has been recorded.`);
            setIsReceivePaymentModalOpen(false);
            setTransactionToPay(null);
        }
    };

    const handleNewOrder = async (order: Order) => {
        if (!currentUser?.permissions.order_fulfillment.write) {
            showAlert('Permission Denied', 'You do not have permission to create orders.');
            return;
        }
    
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select();
    
        if (error) {
            console.error('Error creating order:', error);
    
            let suggestion = `<strong>Suggestion:</strong> This error is coming directly from your database. It often indicates a mismatch between the data the app is trying to save and the structure of your 'orders' table. The error message below is the key to solving the problem.`;
            
            if (error.message.includes('column') && (error.message.includes('does not exist') || error.message.includes('Could not find'))) {
                 const match = error.message.match(/column "(\w+)"/i) || error.message.match(/'(\w+)' column/i);
                 const columnName = match ? match[1] : 'the_missing_column';
                 const snakeCaseColumn = columnName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                 suggestion += `<br/><br/>The error mentions a column that "does not exist". This likely means a new feature was added to the app that requires a new column in your 'orders' table. For example, if the error mentions '${columnName}', you may need to run: <br/><code>ALTER TABLE public.orders ADD COLUMN ${snakeCaseColumn} numeric;</code> or another appropriate type.`;
            }
    
            showAlert(
                'Database Error',
                `Could not create the new order. The database returned the following error:<br/><br/>
                 <div class="text-sm bg-red-100 text-red-800 p-2 block rounded font-mono">${error.message}</div>
                 <br/>
                 ${suggestion}`
            );
            return;
        }
    
        // Deduct stock after successfully creating the order
        const stockUpdatePromises = order.items.map(async (item) => {
            if (item.isOutsourced) return;
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
            const updatedVariants = JSON.parse(JSON.stringify(product.variants));
            const variantToUpdate = updatedVariants.find((v: ProductVariant) => v.id === item.variantId);
            if (variantToUpdate) {
                variantToUpdate.stock -= item.quantity;
                variantToUpdate.status = variantToUpdate.stock > 10 ? ProductStatus.IN_STOCK : variantToUpdate.stock > 0 ? ProductStatus.LOW_STOCK : ProductStatus.OUT_OF_STOCK;
                const { error: stockError } = await supabase.from('products').update({ variants: updatedVariants }).eq('id', product.id);
                if (stockError) console.error(`Error updating stock for order SKU ${item.sku}:`, stockError);
            }
        });
        await Promise.all(stockUpdatePromises);
    
        // Refresh products from DB to reflect stock changes
        const { data: updatedProductsData } = await supabase.from('products').select('*');
        if (updatedProductsData) setProducts(updatedProductsData as Product[]);
    
        if (data) {
            const newOrder = data[0] as Order;
            setOrders(prev => [newOrder, ...prev]);
            logActivity(`Created new order ${newOrder.id}`, currentUser);
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: FulfillmentStatus) => {
        if (!currentUser?.permissions.order_fulfillment.write) {
            showAlert('Permission Denied', 'You do not have permission to update order status.');
            return;
        }
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select();

        if (error) {
            console.error(`Error updating order ${orderId} status:`, error);
            showAlert('Database Error', `Could not update order status. Please try again.`);
            return;
        }

        if (data) {
            const updatedOrder = data[0] as Order;
            setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
            logActivity(`Updated order ${orderId} status to ${status}`, currentUser);
        }
    };
    
    const handleUpdateOrderPaymentStatus = async (orderId: string, status: PaymentStatus, method: PaymentMethod) => {
        if (!currentUser?.permissions.order_fulfillment.write) {
            showAlert('Permission Denied', 'You do not have permission to update order payment status.');
            return;
        }
        const { data, error } = await supabase
            .from('orders')
            .update({ paymentStatus: status, paymentMethod: method })
            .eq('id', orderId)
            .select();

        if (error) {
            console.error(`Error updating order ${orderId} payment status:`, error);
            showAlert('Database Error', `Could not update order payment status. Please try again.`);
            return;
        }

        if (data) {
            const updatedOrder = data[0] as Order;
            setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
            logActivity(`Updated order ${orderId} payment status to ${status}`, currentUser);
        }
    };
    
    const handleConvertOrderToInvoice = async (order: Order) => {
        if (!currentUser?.permissions.accounts_receivable.write || !currentUser) {
            showAlert('Permission Denied', 'You do not have permission to create invoices.');
            return;
        }
    
        let subtotal = 0;
        let tax = 0;
        let vatIncluded = false;
    
        const getPriceForCustomer = (item: CartItem, customerType: CustomerType) => {
            if (customerType === 'government') return item.price.government;
            if (customerType === 'contractor') return item.price.contractor;
            if (customerType === 'organization') return item.price.contractor;
            return item.price.walkIn;
        };
        
        const itemsSubtotal = order.items.reduce((acc, item) => {
            const price = getPriceForCustomer(item, order.customer.type);
            return acc + price * item.quantity;
        }, 0);
    
        const totalWithoutFee = order.total - (order.transportationFee || 0);
    
        if (order.customer.type === 'government') {
            vatIncluded = true;
            subtotal = totalWithoutFee / 1.07;
            tax = totalWithoutFee - subtotal;
        } else {
            if (Math.abs(totalWithoutFee - (itemsSubtotal * 1.07)) < 0.01) {
                vatIncluded = true;
                subtotal = itemsSubtotal;
                tax = itemsSubtotal * 0.07;
            } else {
                vatIncluded = false;
                subtotal = itemsSubtotal;
                tax = 0;
            }
        }
    
        const newTransaction: Transaction = {
            id: `INV-FROM-ORD-${order.id.replace('ORD-','')}`,
            date: new Date().toISOString(),
            items: order.items,
            subtotal,
            tax,
            total: order.total,
            customerId: order.customer.id,
            customerName: order.customer.name,
            customerAddress: order.address,
            customerPhone: order.customer.phone,
            customerType: order.customer.type,
            operator: currentUser.name,
            paymentMethod: 'Cash',
            vatIncluded,
            payment_status: PaymentStatus.UNPAID,
            paid_amount: 0,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            transportationFee: order.transportationFee,
        };

        const { transportationFee, ...restOfTransaction } = newTransaction;
        const payload: any = { ...restOfTransaction };
        if (transportationFee && transportationFee > 0) {
            payload.transportation_fee = transportationFee;
        }
    
        const { error: transactionError } = await supabase.from('transactions').insert([payload]);
        if (transactionError) {
            console.error('Error creating invoice from order:', transactionError);
            
            let suggestion = `<strong>Suggestion:</strong> This error is coming directly from your database. It often indicates a mismatch between the data the app is trying to save and the structure of your 'transactions' table. The error message below is the key to solving the problem.`;
        
            if (transactionError.message.includes('customer_type')) {
                suggestion += `<br/><br/>The error mentions "customer_type", which is a common issue. You may need to update your database schema by running: <br/><code>ALTER TYPE public.customer_type ADD VALUE IF NOT EXISTS 'organization';</code>`;
            } else if (transactionError.message.includes('violates not-null constraint')) {
                suggestion += `<br/><br/>The error mentions a "not-null constraint". This means a required column in your 'transactions' table was not provided with a value. Check the column name in the error message and ensure it has a default value in your database schema.`;
            } else if (transactionError.message.includes('column') && (transactionError.message.includes('does not exist') || transactionError.message.includes('Could not find'))) {
                 if (transactionError.message.includes('schema cache')) {
                     suggestion += `<br/><br/>This specific error often points to a temporary issue where the app's view of the database is out of sync. This "schema cache" issue usually resolves itself within a few minutes. Please try again shortly. If the problem persists, refreshing the database connection in your Supabase project dashboard may help.`;
                 } else {
                     const match = transactionError.message.match(/column "(\w+)"/i) || transactionError.message.match(/'(\w+)' column/i);
                     const columnName = match ? match[1] : 'the_missing_column';
                     const snakeCaseColumn = columnName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                     suggestion += `<br/><br/>The error mentions a column that "does not exist". This likely means a new feature was added to the app that requires a new column in your 'transactions' table. For example, if the error mentions '${columnName}', you may need to run: <br/><code>ALTER TABLE public.transactions ADD COLUMN ${snakeCaseColumn} numeric;</code>`;
                 }
            }
            
            showAlert(
                'Database Error', 
                `Could not create invoice from order. The database returned the following error:<br/><br/>
                 <div class="text-sm bg-red-100 text-red-800 p-2 block rounded font-mono">${transactionError.message}</div>
                 <br/>
                 ${suggestion}`
            );
            return;
        }
    
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ paymentStatus: PaymentStatus.PAID, status: FulfillmentStatus.COMPLETED })
            .eq('id', order.id);
    
        if (orderUpdateError) {
            showAlert('Database Warning', 'Invoice created, but failed to update original order status.');
            console.error('Error updating order status after conversion:', orderUpdateError);
        }
        
        const { data: updatedTransactionsData } = await supabase.from('transactions').select('*');
        if (updatedTransactionsData) {
            const processedTransactions = (updatedTransactionsData as any[]).map(tx => ({
                ...tx,
                payment_status: tx.payment_status || PaymentStatus.PAID,
                paid_amount: tx.paid_amount || 0,
            }));
            setTransactions(processedTransactions as Transaction[]);
        }
    
        const { data: updatedOrdersData } = await supabase.from('orders').select('*');
        if (updatedOrdersData) setOrders(updatedOrdersData as Order[]);
    
        logActivity(`Converted order ${order.id} to invoice ${newTransaction.id}`, currentUser);
        showAlert('Success', `Order ${order.id} has been converted to an invoice and moved to Accounts Receivable.`);
    };

    const handleProcessReturn = async (transactionId: string, itemsToReturn: ReturnedItem[], totalValue: number): Promise<StoreCredit> => {
        if (!currentUser?.permissions.returns.write) {
            showAlert('Permission Denied', 'You do not have permission to process returns.');
            return Promise.reject('Permission Denied');
        }
        const stockUpdatePromises = itemsToReturn.map(async (item) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
    
            const updatedVariants = JSON.parse(JSON.stringify(product.variants));
            const variantToUpdate = updatedVariants.find((v: ProductVariant) => v.id === item.variantId);
    
            if (variantToUpdate) {
                variantToUpdate.stock += item.quantity;
                variantToUpdate.status = variantToUpdate.stock > 10 ? ProductStatus.IN_STOCK : ProductStatus.LOW_STOCK;
                
                const { error } = await supabase
                    .from('products')
                    .update({ variants: updatedVariants })
                    .eq('id', product.id);
                
                if (error) console.error(`Error updating stock on return for SKU ${variantToUpdate.sku}:`, error);
            }
        });
    
        await Promise.all(stockUpdatePromises);
    
        const originalTransaction = transactions.find(t => t.id === transactionId);
        if (originalTransaction) {
            const newReturnedItems = [...(originalTransaction.returnedItems || []), ...itemsToReturn];
            await supabase.from('transactions').update({ returnedItems: newReturnedItems }).eq('id', transactionId);
            setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, returnedItems: newReturnedItems } : t));
        }
    
        const { data: updatedProductsData } = await supabase.from('products').select('*');
        if (updatedProductsData) {
            setProducts(updatedProductsData as Product[]);
        }
    
        const newCredit: StoreCredit = {
            id: `CREDIT-${Date.now()}`,
            amount: totalValue,
            isUsed: false,
            originalTransactionId: transactionId,
            dateIssued: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('store_credits')
            .insert([newCredit]);

        if (error) {
            console.error('Error creating store credit:', error);
            showAlert('Database Error', 'Could not save the store credit. The code shown might be invalid.');
        } else {
            setStoreCredits(prev => [newCredit, ...prev]);
            logActivity(`Processed return for transaction ${transactionId}, issued credit ${newCredit.id} for ฿${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, currentUser);
        }
    
        return newCredit;
    };
    
    const handleDeleteTransaction = async (transactionId: string) => {
        if (!currentUser?.permissions.sales_history.delete) {
            showAlert('Permission Denied', 'You do not have permission to delete transactions.');
            return;
        }
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId);

        if (error) {
            console.error('Error deleting transaction:', error);
            showAlert('Database Error', 'Could not delete the transaction. Please check console for details.');
            return;
        }

        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        logActivity(`Deleted transaction ${transactionId}`, currentUser);
    };

    const handleCreateConsolidatedInvoice = async (customer: Customer, transactionsToConsolidate: Transaction[]) => {
        if (!currentUser?.permissions.accounts_receivable.write) {
            showAlert('Permission Denied', 'You do not have permission to create consolidated invoices.');
            return;
        }
    
        const balanceDue = transactionsToConsolidate.reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0);
    
        const consolidatedItems = transactionsToConsolidate.map(tx => ({
            productId: `consolidated-${tx.id}`,
            variantId: `consolidated-${tx.id}`,
            name: { en: `Invoice #${tx.id}`, th: `ใบแจ้งหนี้ #${tx.id}` },
            size: new Date(tx.date).toLocaleDateString(),
            quantity: 1,
            price: { walkIn: tx.total - tx.paid_amount, contractor: tx.total - tx.paid_amount, government: tx.total - tx.paid_amount, cost: 0 },
            imageUrl: '',
            sku: `INV-${tx.id}`,
            stock: 0,
        }));
    
        const newInvoice: Transaction = {
            id: `C-INV-${Date.now()}`,
            date: new Date().toISOString(),
            items: consolidatedItems,
            subtotal: balanceDue,
            tax: 0,
            total: balanceDue,
            customerId: customer.id,
            customerName: customer.name,
            customerAddress: customer.address,
            customerPhone: customer.phone,
            customerType: customer.type,
            operator: currentUser.name,
            paymentMethod: 'Cash',
            vatIncluded: false,
            payment_status: PaymentStatus.UNPAID,
            paid_amount: 0,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
    
        const { error: insertError } = await supabase.from('transactions').insert([newInvoice]);
        if (insertError) {
            showAlert('Database Error', 'Could not create the consolidated invoice.');
            return;
        }
    
        const idsToUpdate = transactionsToConsolidate.map(tx => tx.id);
        const { error: updateError } = await supabase
            .from('transactions')
            .update({ payment_status: PaymentStatus.CONSOLIDATED })
            .in('id', idsToUpdate);
    
        if (updateError) {
            showAlert('Database Warning', 'Consolidated invoice created, but failed to update old invoices.');
        }
    
        const { data: updatedTransactionsData } = await supabase.from('transactions').select('*');
        if (updatedTransactionsData) setTransactions(updatedTransactionsData as Transaction[]);
    
        setConsolidatedInvoice(newInvoice);
        setIsConsolidatedInvoiceModalOpen(true);
        logActivity(`Created consolidated invoice ${newInvoice.id} for ${customer.name}.`, currentUser);
    };

    const handleUndoConsolidationClick = (transaction: Transaction) => {
        setTransactionToUndo(transaction);
        setIsUndoConsolidationModalOpen(true);
    };
    
    const handleUndoConsolidation = async () => {
        if (!transactionToUndo || !currentUser?.permissions.accounts_receivable.write) {
            showAlert('Permission Denied', 'You do not have permission to undo consolidation.');
            return;
        }
    
        const originalTxIds = transactionToUndo.items.map(item => item.sku.replace('INV-', ''));
    
        const { data: originalTxs, error: fetchError } = await supabase
            .from('transactions')
            .select('id, total, paid_amount')
            .in('id', originalTxIds);
    
        if (fetchError) {
            showAlert('Database Error', 'Could not fetch original invoices to restore them.');
            console.error('Error fetching original txs for undo:', fetchError);
            return;
        }
    
        const allPromises = [
            ...originalTxs.map(tx => {
                const newStatus = tx.paid_amount > 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID;
                return supabase.from('transactions').update({ payment_status: newStatus }).eq('id', tx.id);
            }),
            supabase.from('transactions').delete().eq('id', transactionToUndo.id)
        ];
        
        const results = await Promise.all(allPromises);
        const someError = results.some(res => res.error);
    
        if (someError) {
            showAlert('Database Error', 'An error occurred while undoing the consolidation.');
            console.error('Error during undo consolidation:', results.map(r => r.error).filter(Boolean));
        } else {
            const { data: updatedTransactionsData } = await supabase.from('transactions').select('*');
            if (updatedTransactionsData) setTransactions(updatedTransactionsData as Transaction[]);
    
            logActivity(`Undid consolidation for invoice ${transactionToUndo.id}`, currentUser);
            showAlert('Success', t('undo_consolidation_success'));
        }
    
        setIsUndoConsolidationModalOpen(false);
        setTransactionToUndo(null);
    };

    const handleCloseShift = async () => {
        if (!currentUser?.permissions.end_of_day.write) {
            showAlert('Permission Denied', 'You do not have permission to close shifts.');
            return;
        }
        const lastShift = shiftReports.length > 0 ? shiftReports[0] : null;
        const lastShiftEndTime = lastShift ? new Date(lastShift.endTime) : new Date(0);
    
        const currentShiftTransactions = transactions.filter(t => !t.shiftId && new Date(t.date) > lastShiftEndTime);
    
        if (currentShiftTransactions.length === 0) {
            showAlert('No Sales', 'There are no new transactions to include in this shift report.');
            return;
        }

        const productCostMap = new Map<string, number>();
        products.forEach(p => p.variants.forEach(v => productCostMap.set(v.id, v.price.cost)));

        let totalSales = 0;
        let totalProfit = 0;
        const paymentMethodBreakdown = { cash: 0, card: 0, bankTransfer: 0 };
        const itemSales: { [variantId: string]: any } = {};
        
        for (const tx of currentShiftTransactions) {
            totalSales += tx.total;
            if (tx.payment_status === PaymentStatus.PAID) {
                switch(tx.paymentMethod) {
                    case 'Cash': paymentMethodBreakdown.cash += tx.total; break;
                    case 'Card': paymentMethodBreakdown.card += tx.total; break;
                    case 'Bank Transfer': paymentMethodBreakdown.bankTransfer += tx.total; break;
                }
            }
            
            const taxRatio = tx.subtotal > 0 ? tx.total / tx.subtotal : 1;
            
            for (const item of tx.items) {
                const cost = item.isOutsourced && item.outsourcedCost ? item.outsourcedCost : productCostMap.get(item.variantId) || 0;
                const price = tx.customerType === 'government' ? item.price.government : tx.customerType === 'contractor' ? item.price.contractor : item.price.walkIn;
                const salePrice = (price * item.quantity) * taxRatio;
                const profit = salePrice - (item.quantity * cost);
                totalProfit += profit;

                if (!itemSales[item.variantId]) {
                    itemSales[item.variantId] = { quantity: 0, sales: 0, profit: 0, name: item.name, size: item.size, productId: item.productId };
                }
                itemSales[item.variantId].quantity += item.quantity;
                itemSales[item.variantId].sales += salePrice;
                itemSales[item.variantId].profit += profit;
            }
        }
        
        const topSellingItems = Object.entries(itemSales)
            .sort(([, a], [, b]) => b.quantity - a.quantity)
            .slice(0, 10)
            .map(([variantId, data]) => ({
                productId: data.productId,
                variantId,
                productName: data.name,
                variantSize: data.size,
                quantitySold: data.quantity,
                totalSales: data.sales,
                totalProfit: data.profit,
            }));

        const newShiftReport: ShiftReport = {
            id: `SHIFT-${Date.now()}`,
            startTime: lastShift ? lastShift.endTime : (transactions.length > 0 ? transactions[transactions.length-1].date : new Date().toISOString()),
            endTime: new Date().toISOString(),
            closedByUserId: currentUser.id,
            totalSales,
            totalProfit,
            totalTransactions: currentShiftTransactions.length,
            paymentMethodBreakdown,
            topSellingItems,
            transactionIds: currentShiftTransactions.map(t => t.id),
        };

        const { error: reportError } = await supabase.from('shift_reports').insert([newShiftReport]);
        if (reportError) {
            showAlert('Database Error', 'Could not save the shift report.');
            console.error('Error saving shift report:', reportError);
            return;
        }

        const { error: transactionUpdateError } = await supabase.from('transactions').update({ shiftId: newShiftReport.id }).in('id', newShiftReport.transactionIds);
        if (transactionUpdateError) {
            showAlert('Database Warning', 'Shift report saved, but failed to update transactions. Please check console.');
            console.error('Error updating transactions with shiftId:', transactionUpdateError);
        }
        
        setShiftReports(prev => [newShiftReport, ...prev]);
        setTransactions(prev => prev.map(t => newShiftReport.transactionIds.includes(t.id) ? { ...t, shiftId: newShiftReport.id } : t));

        logActivity(`Closed shift ${newShiftReport.id} with total sales of ฿${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`, currentUser);
        showAlert('Shift Closed', `Shift ${newShiftReport.id} has been successfully closed.`);
    };

    const handleUpdateStoreSettings = async (settings: Partial<StoreSettings>) => {
        if (!currentUser?.permissions.store_settings.write) {
            showAlert('Permission Denied', 'You do not have permission to update store settings.');
            return;
        }
    
        const { data, error } = await supabase
            .from('store_settings')
            .update(settings)
            .eq('id', 1)
            .select()
            .single();
    
        if (error) {
            console.error('Error updating store settings:', error);
            
            const isMissingColumnError = error.message.includes('dashboard_widget_visibility');
    
            if (isMissingColumnError) {
                showAlert(
                    'Database Error',
                    `Could not save store settings.<br/><br/>
                     <strong>Suggestion:</strong> The database is missing a required column for the Dashboard Management feature. Please update your 'store_settings' table by running the following SQL command:
                     <br/><br/>
                     <code class="bg-gray-200 p-1 rounded text-sm">ALTER TABLE public.store_settings ADD COLUMN dashboard_widget_visibility jsonb;</code>`
                );
            } else {
                showAlert('Database Error', `Could not save store settings.<br/><br/><strong>Details:</strong> ${error.message}`);
            }
            return;
        }
    
        if (data) {
            setStoreSettings(data as StoreSettings);
            logActivity(`Updated store settings.`, currentUser);
            showAlert('Success', 'Store settings have been updated.');
        }
    };
    
    const handleRecordPastInvoice = async (invoiceData: PastInvoiceData) => {
        if (!currentUser?.permissions.accounts_receivable.write) {
            showAlert('Permission Denied', 'You do not have permission to record past invoices.');
            return;
        }

        let customer: Customer | null = null;
    
        if (invoiceData.newCustomerName) {
            const { data: newCustomerData, error: newCustomerError } = await supabase
                .from('customers')
                .insert({ name: invoiceData.newCustomerName, type: 'walkIn' })
                .select()
                .single();
            
            if (newCustomerError) {
                showAlert('Database Error', 'Could not create new customer.');
                console.error('Error creating new customer for past invoice:', newCustomerError);
                return;
            }
            customer = newCustomerData as Customer;
            setCustomers(prev => [...prev, customer]);
        } else if (invoiceData.customerId) {
            customer = customers.find(c => c.id === invoiceData.customerId) || null;
        }

        if (!customer) {
            showAlert('Error', 'Customer not found.');
            return;
        }
        
        let fileUrl: string | undefined = undefined;
        if (invoiceData.file) {
            const file = invoiceData.file;
            const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
            const { error: uploadError } = await supabase.storage
                .from('invoice-pdfs')
                .upload(fileName, file);

            if (uploadError) {
                showAlert('Upload Error', `Failed to upload PDF: ${uploadError.message}.`);
                console.error('PDF upload error:', uploadError);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('invoice-pdfs')
                .getPublicUrl(fileName);
            fileUrl = publicUrl;
        }

        const total = invoiceData.totalAmount;
        const paid_amount = invoiceData.amountAlreadyPaid;
        const subtotal = total / 1.07;
        const tax = total - subtotal;
        
        let payment_status = PaymentStatus.UNPAID;
        if (paid_amount >= total) {
            payment_status = PaymentStatus.PAID;
        } else if (paid_amount > 0) {
            payment_status = PaymentStatus.PARTIALLY_PAID;
        }

        const newTransaction: Transaction = {
            id: `PAST-${Date.now()}`,
            date: new Date(invoiceData.invoiceDate).toISOString(),
            items: [{
                productId: 'PAST_INVOICE',
                variantId: invoiceData.originalInvoiceId,
                name: { en: `Past Invoice #${invoiceData.originalInvoiceId}`, th: `ใบแจ้งหนี้ย้อนหลัง #${invoiceData.originalInvoiceId}` },
                size: '',
                imageUrl: '',
                sku: 'PAST-DUE',
                quantity: 1,
                stock: 0,
                price: { walkIn: total, contractor: total, government: total, cost: total },
            }],
            subtotal,
            tax,
            total,
            customerId: customer.id,
            customerName: customer.name,
            customerAddress: customer.address,
            customerPhone: customer.phone,
            customerType: customer.type,
            operator: currentUser.name,
            paymentMethod: 'Cash',
            vatIncluded: true,
            payment_status,
            paid_amount,
            due_date: new Date(invoiceData.invoiceDate).toISOString(),
            file_url: fileUrl,
        };

        const { data, error } = await supabase.from('transactions').insert([newTransaction]).select().single();
        if (error) {
            showAlert('Database Error', 'Could not save the past invoice.');
            console.error('Error saving past invoice:', error);
            return;
        }

        setTransactions(prev => [data as Transaction, ...prev]);
        logActivity(`Recorded past invoice #${invoiceData.originalInvoiceId} for ${customer.name}.`, currentUser);
        showAlert('Success', 'Past invoice has been recorded.');
        setIsRecordPastInvoiceModalOpen(false);
    };

    const handleEditPastInvoice = async (invoiceId: string, invoiceData: PastInvoiceData) => {
        if (!currentUser?.permissions.accounts_receivable.write || !invoiceId) {
            showAlert('Permission Denied', 'You do not have permission to edit past invoices.');
            return;
        }
    
        let customer: Customer | null = null;
        
        if (invoiceData.newCustomerName) {
            const { data: newCustomerData, error: newCustomerError } = await supabase
                .from('customers')
                .insert({ name: invoiceData.newCustomerName, type: 'walkIn' })
                .select().single();
            if (newCustomerError) {
                showAlert('Database Error', 'Could not create new customer.'); return;
            }
            customer = newCustomerData as Customer;
            setCustomers(prev => [...prev, customer]);
        } else if (invoiceData.customerId) {
            customer = customers.find(c => c.id === invoiceData.customerId) || null;
        }
    
        if (!customer) { showAlert('Error', 'Customer not found.'); return; }
    
        let fileUrl: string | undefined = transactions.find(t => t.id === invoiceId)?.file_url;
        if (invoiceData.file) {
            const file = invoiceData.file;
            const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
            const { error: uploadError } = await supabase.storage.from('invoice-pdfs').upload(fileName, file);
            if (uploadError) {
                showAlert('Upload Error', `Failed to upload PDF: ${uploadError.message}.`); return;
            }
            fileUrl = supabase.storage.from('invoice-pdfs').getPublicUrl(fileName).data.publicUrl;
        }
    
        const total = invoiceData.totalAmount;
        const paid_amount = invoiceData.amountAlreadyPaid;
        let payment_status = (paid_amount >= total) ? PaymentStatus.PAID : (paid_amount > 0) ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID;
    
        const updatePayload: Partial<Transaction> = {
            date: new Date(invoiceData.invoiceDate).toISOString(),
            items: [{
                productId: 'PAST_INVOICE', variantId: invoiceData.originalInvoiceId,
                name: { en: `Past Invoice #${invoiceData.originalInvoiceId}`, th: `ใบแจ้งหนี้ย้อนหลัง #${invoiceData.originalInvoiceId}` },
                size: '', imageUrl: '', sku: 'PAST-DUE', quantity: 1, stock: 0,
                price: { walkIn: total, contractor: total, government: total, cost: total },
            }],
            total,
            paid_amount,
            payment_status,
            customerId: customer.id,
            customerName: customer.name,
            customerAddress: customer.address,
            customerPhone: customer.phone,
            customerType: customer.type,
            file_url: fileUrl,
        };
    
        const { data, error } = await supabase.from('transactions').update(updatePayload).eq('id', invoiceId).select().single();
        if (error) {
            showAlert('Database Error', 'Could not update the past invoice.');
            console.error('Error updating past invoice:', error);
            return;
        }
    
        setTransactions(prev => prev.map(tx => tx.id === invoiceId ? (data as Transaction) : tx));
        logActivity(`Edited past invoice #${invoiceData.originalInvoiceId}.`, currentUser);
        showAlert('Success', 'Past invoice has been updated.');
        setIsEditPastInvoiceModalOpen(false);
    };

    const handleImportPastInvoices = async (pastInvoices: PastInvoiceData[]) => {
        if (!currentUser?.permissions.accounts_receivable.write) {
            showAlert('Permission Denied', 'You do not have permission to import past invoices.');
            return;
        }
        
        const customerMap: Map<string, Customer> = new Map(customers.map(c => [c.name, c]));
        const transactionsToInsert: Omit<Transaction, 'id'>[] = [];

        for (const invoiceData of pastInvoices) {
            if (!invoiceData.customerId) {
                continue;
            }
            const customer = customerMap.get(invoiceData.customerId);
            if (!customer) continue;

            const total = invoiceData.totalAmount;
            const paid_amount = invoiceData.amountAlreadyPaid;
            const subtotal = total / 1.07;
            const tax = total - subtotal;

            let payment_status = PaymentStatus.UNPAID;
            if (paid_amount >= total) payment_status = PaymentStatus.PAID;
            else if (paid_amount > 0) payment_status = PaymentStatus.PARTIALLY_PAID;

            transactionsToInsert.push({
                date: new Date(invoiceData.invoiceDate).toISOString(),
                items: [{
                    productId: 'PAST_INVOICE', variantId: invoiceData.originalInvoiceId,
                    name: { en: `Past Invoice #${invoiceData.originalInvoiceId}`, th: `ใบแจ้งหนี้ย้อนหลัง #${invoiceData.originalInvoiceId}` },
                    size: '', imageUrl: '', sku: 'PAST-DUE', quantity: 1, stock: 0,
                    price: { walkIn: total, contractor: total, government: total, cost: total },
                }],
                subtotal, tax, total, customerId: customer.id, customerName: customer.name,
                customerAddress: customer.address, customerPhone: customer.phone,
                customerType: customer.type, operator: currentUser.name,
                paymentMethod: 'Cash', vatIncluded: true, payment_status, paid_amount,
                due_date: new Date(invoiceData.invoiceDate).toISOString(),
            });
        }
        
        if (transactionsToInsert.length === 0) {
            showAlert('Import Failed', 'No valid invoices found to import.');
            return;
        }
        
        const { error } = await supabase.from('transactions').insert(transactionsToInsert);
        if (error) {
            showAlert('Database Error', 'Could not import past invoices.');
            console.error('Error importing past invoices:', error);
            return;
        }

        const { data: updatedTxs } = await supabase.from('transactions').select('*');
        if (updatedTxs) setTransactions(updatedTxs as Transaction[]);
        
        logActivity(`Imported ${transactionsToInsert.length} past invoices.`, currentUser);
        showAlert('Import Successful', t('past_invoice_import_success', { count: transactionsToInsert.length }));
        setIsImportPastInvoicesModalOpen(false);
    };

    if (!currentUser) {
        return (
            <>
                <LoginView 
                    onLogin={handleLogin}
                    storeSettings={storeSettings}
                    language={language}
                    setLanguage={setLanguage}
                    t={t}
                />
                <AlertModal 
                    isOpen={isAlertModalOpen} 
                    onClose={() => setIsAlertModalOpen(false)} 
                    title={alertConfig.title} 
                    message={alertConfig.message} 
                />
            </>
        );
    }
    
    if (currentUser.role.includes(Role.CEO)) {
        return (
            <CEODashboard 
                currentUser={currentUser}
                onLogout={handleLogout}
                transactions={transactions}
                bills={bills}
                users={users}
                products={products}
                suppliers={suppliers}
                storeSettings={storeSettings}
                t={t}
                language={language}
                setLanguage={setLanguage}
                onBillUpdated={handleBillUpdate}
                showAlert={showAlert}
            />
        );
    }

    const views: { [key: string]: React.ReactNode } = {
        dashboard: <Dashboard products={products} users={users} transactions={transactions} bills={bills} t={t} language={language} onNavigate={handleNavigate} currentUser={currentUser} storeSettings={storeSettings} />,
        pos: <POSView 
            products={products} 
            currentUser={currentUser}
            customers={customers}
            storeCredits={storeCredits}
            transactions={transactions}
            onNewTransaction={handleNewTransaction}
            onNewInvoice={handleNewInvoice}
            onNewOrder={handleNewOrder}
            onAddNewCustomerFromPOS={handleAddNewCustomerFromPOS}
            openScanner={openScanner}
            posScannedCode={posScannedCode}
            setPosScannedCode={setPosScannedCode}
            showAlert={showAlert}
            storeSettings={storeSettings}
            onProductMouseEnter={handleProductMouseEnter}
            onProductMouseLeave={handleProductMouseLeave}
            t={t}
            language={language}
        />,
        inventory: <ProductTable
            products={products}
            currentUser={currentUser}
            onAddProductClick={() => setIsAddProductModalOpen(true)}
            onAddProductByScan={handleAddProductByScan}
            onImportProductsClick={() => setIsImportModalOpen(true)}
            onEditProduct={(product) => { setProductToEdit(product); setIsEditProductModalOpen(true); }}
            onDeleteProduct={(product) => { setProductToDelete(product); setIsDeleteModalOpen(true); }}
            onViewProduct={(product) => { setProductToView(product); setIsViewProductModalOpen(true); }}
            onShowBarcode={(product, variant) => { setProductToView(product); setVariantToShowBarcode(variant); setIsBarcodeDisplayOpen(true); }}
            openScanner={(onSuccess) => openScanner(onSuccess)}
            inventorySearchCode={inventorySearchCode}
            setInventorySearchCode={setInventorySearchCode}
            t={t}
            language={language}
        />,
        returns: <ReturnsView transactions={transactions} products={products} onProcessReturn={handleProcessReturn} t={t} language={language}/>,
        customers: <CustomersView 
            customers={customers} 
            currentUser={currentUser} 
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onImportCustomersClick={() => setIsImportCustomersModalOpen(true)}
            showAlert={showAlert}
            t={t}
        />,
        suppliers: <SuppliersView 
            suppliers={suppliers} 
            currentUser={currentUser} 
            onAddSupplier={() => setIsAddSupplierModalOpen(true)}
            onEditSupplier={handleEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onImportSuppliersClick={() => setIsImportSuppliersModalOpen(true)}
            showAlert={showAlert}
            t={t}
        />,
        accounts_payable: <AccountsPayableView 
            bills={bills}
            suppliers={suppliers}
            currentUser={currentUser}
            onAddBillClick={() => setIsAddBillModalOpen(true)}
            onPayBillClick={(bill) => { setBillToRecordPaymentFor(bill); setIsRecordPaymentModalOpen(true); }}
            onDeleteBill={handleDeleteBill}
            onImportBillsClick={() => setIsImportBillsModalOpen(true)}
            t={t}
            language={language}
        />,
        accounts_receivable: <AccountsReceivableView 
            transactions={transactions}
            customers={customers}
            currentUser={currentUser}
            onReceivePaymentClick={(tx) => { setTransactionToPay(tx); setIsReceivePaymentModalOpen(true); }}
            onCreateConsolidatedInvoice={handleCreateConsolidatedInvoice}
            onRecordPastInvoiceClick={() => setIsRecordPastInvoiceModalOpen(true)}
            onImportPastInvoicesClick={() => setIsImportPastInvoicesModalOpen(true)}
            onEditPastInvoiceClick={(tx) => { setInvoiceToEdit(tx); setIsEditPastInvoiceModalOpen(true); }}
            onUndoConsolidationClick={handleUndoConsolidationClick}
            viewState={viewState}
            onNavigate={handleNavigate}
            t={t}
            language={language}
        />,
        sales_history: <SalesHistoryView 
            transactions={transactions} 
            currentUser={currentUser} 
            onDeleteTransaction={handleDeleteTransaction} 
            onReceivePaymentClick={(tx) => { setTransactionToPay(tx); setIsReceivePaymentModalOpen(true); }} 
            onEditPastInvoiceClick={(tx) => { setInvoiceToEdit(tx); setIsEditPastInvoiceModalOpen(true); }}
            onUndoConsolidationClick={handleUndoConsolidationClick}
            storeSettings={storeSettings} 
            t={t} 
            language={language}
        />,
        order_fulfillment: <OrderFulfillmentView orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateOrderPaymentStatus={handleUpdateOrderPaymentStatus} onConvertOrderToInvoice={handleConvertOrderToInvoice} storeSettings={storeSettings} t={t} language={language}/>,
        customer_assist: <CustomerAssistView products={products} onProductMouseEnter={handleProductMouseEnter} onProductMouseLeave={handleProductMouseLeave} t={t} language={language}/>,
        end_of_day: <EndOfDayView transactions={transactions} products={products} shiftReports={shiftReports} currentUser={currentUser} onCloseShift={handleCloseShift} t={t} language={language} />,
        shift_history: <ShiftHistoryView shiftReports={shiftReports} users={users} t={t} language={language} />,
        activity_log: <ActivityLogView logs={activityLogs} users={users} t={t} />,
        user_management: <UserManagementView users={users} currentUser={currentUser} onAddUser={handleAddUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} onResetPassword={handleResetPassword} showAlert={showAlert} t={t} />,
        my_profile: <ProfileView currentUser={currentUser} onUpdateUser={handleUpdateUser} onUpdatePassword={handleUpdatePassword} links={{}} t={t} />,
        store_settings: <StoreSettingsView storeSettings={storeSettings} onUpdateSettings={handleUpdateStoreSettings} showAlert={showAlert} t={t} />,
        dashboard_management: <DashboardManagementView storeSettings={storeSettings} onUpdateSettings={handleUpdateStoreSettings} t={t} />,
    };

    const navLinks: Record<string, React.ReactNode> = {
        dashboard: <ChartPieIcon className="h-5 w-5" />,
        pos: <ShoppingCartIcon className="h-5 w-5" />,
        inventory: <CubeIcon className="h-5 w-5" />,
        returns: <ArrowUturnLeftIcon className="h-5 w-5" />,
        customers: <UserGroupIcon className="h-5 w-5" />,
        suppliers: <TruckIcon className="h-5 w-5" />,
        accounts_payable: <BanknotesIcon className="h-5 w-5" />,
        accounts_receivable: <CurrencyBangladeshiIcon className="h-5 w-5" />,
        sales_history: <ListBulletIcon className="h-5 w-5" />,
        order_fulfillment: <TruckIcon className="h-5 w-5" />,
        customer_assist: <EyeIcon className="h-5 w-5" />,
        end_of_day: <CalendarDaysIcon className="h-5 w-5" />,
        shift_history: <ClipboardDocumentListIcon className="h-5 w-5" />,
        activity_log: <ShieldCheckIcon className="h-5 w-5" />,
        user_management: <UsersIcon className="h-5 w-5" />,
    };

    return (
        <>
            <div className={`flex h-screen bg-background text-text-primary ${isForcePasswordChangeOpen ? 'filter blur-sm pointer-events-none' : ''}`}>
                <Sidebar 
                    currentUser={currentUser} 
                    onNavigate={handleNavigate} 
                    activeView={activeView}
                    links={navLinks}
                    storeSettings={storeSettings}
                    language={language}
                    t={t}
                    onLogout={handleLogout}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    originalUser={originalUser}
                    onStartSimulation={handleStartSimulation}
                    onStopSimulation={handleStopSimulation}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                        currentUser={currentUser} 
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        activeView={activeView}
                        language={language}
                        setLanguage={setLanguage}
                        t={t}
                        onBack={handleBack}
                        canGoBack={navigationHistory.length > 1}
                        originalUser={originalUser}
                        onStopSimulation={handleStopSimulation}
                    />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <p className="text-text-secondary text-lg">Loading data...</p>
                            </div>
                        ) : (
                            views[activeView]
                        )}
                    </main>
                </div>
            </div>
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            {/* Modals */}
            <AddProductModal 
                isOpen={isAddProductModalOpen} 
                onClose={() => { setIsAddProductModalOpen(false); setInitialBarcodeForAdd(null); }} 
                onAddProduct={handleAddProduct}
                initialBarcode={initialBarcodeForAdd}
                showAlert={showAlert}
                t={t}
            />
            <EditProductModal 
                isOpen={isEditProductModalOpen} 
                onClose={() => setIsEditProductModalOpen(false)} 
                onEditProduct={handleEditProduct} 
                product={productToEdit} 
                showAlert={showAlert}
                t={t}
            />
            <ConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={handleDeleteProduct} 
                title={t('delete')}
                message={t('delete_product_confirm_message', { productName: productToDelete?.name[language] || '' })}
                t={t}
            />
            <ConfirmationModal
                isOpen={isUndoConsolidationModalOpen}
                onClose={() => setIsUndoConsolidationModalOpen(false)}
                onConfirm={handleUndoConsolidation}
                title={t('undo_consolidation_title')}
                message={t('undo_consolidation_confirm_message', { invoiceId: transactionToUndo?.id || '' })}
                confirmText={t('undo_consolidation')}
                confirmButtonClass="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                t={t}
            />
            <ProductDetailModal 
                isOpen={isViewProductModalOpen} 
                onClose={() => setIsViewProductModalOpen(false)} 
                product={productToView} 
                t={t}
                language={language}
            />
            <AddSupplierModal
                isOpen={isAddSupplierModalOpen}
                onClose={() => setIsAddSupplierModalOpen(false)}
                onAddSupplier={handleAddSupplier}
                showAlert={showAlert}
                t={t}
            />
             <AddBillModal
                isOpen={isAddBillModalOpen}
                onClose={() => setIsAddBillModalOpen(false)}
                onAddBill={handleAddBill}
                suppliers={suppliers}
                showAlert={showAlert}
                t={t}
            />
             <RecordPaymentModal
                isOpen={isRecordPaymentModalOpen}
                onClose={() => {
                    setIsRecordPaymentModalOpen(false);
                    setBillToRecordPaymentFor(null);
                }}
                onConfirm={handleRecordBillPayment}
                bill={billToRecordPaymentFor}
                t={t}
            />
            <ReceivePaymentModal 
                isOpen={isReceivePaymentModalOpen}
                onClose={() => setIsReceivePaymentModalOpen(false)}
                onConfirm={handleReceivePayment}
                transaction={transactionToPay}
                t={t}
            />
            <ConsolidatedInvoiceModal
                isOpen={isConsolidatedInvoiceModalOpen}
                onClose={() => setIsConsolidatedInvoiceModalOpen(false)}
                invoice={consolidatedInvoice}
                storeSettings={storeSettings}
                t={t}
                language={language}
            />
            <RecordPastInvoiceModal 
                isOpen={isRecordPastInvoiceModalOpen}
                onClose={() => setIsRecordPastInvoiceModalOpen(false)}
                onRecord={handleRecordPastInvoice}
                customers={customers}
                showAlert={showAlert}
                t={t}
            />
            <EditPastInvoiceModal
                isOpen={isEditPastInvoiceModalOpen}
                onClose={() => setIsEditPastInvoiceModalOpen(false)}
                onEdit={handleEditPastInvoice}
                invoice={invoiceToEdit}
                customers={customers}
                showAlert={showAlert}
                t={t}
            />
            <ImportPastInvoicesModal 
                isOpen={isImportPastInvoicesModalOpen}
                onClose={() => setIsImportPastInvoicesModalOpen(false)}
                onApplyImport={handleImportPastInvoices}
                t={t}
            />
            <AlertModal 
                isOpen={isAlertModalOpen} 
                onClose={() => setIsAlertModalOpen(false)} 
                title={alertConfig.title} 
                message={alertConfig.message} 
            />
            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
            <BarcodeDisplayModal
                isOpen={isBarcodeDisplayOpen}
                onClose={() => setIsBarcodeDisplayOpen(false)}
                product={productToView}
                variant={variantToShowBarcode}
                t={t}
                language={language}
            />
            <ImportProductsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                products={products}
                onApplyImport={async (payload) => {
                    if (!currentUser?.permissions.inventory.write) {
                        showAlert('Permission Denied', 'You do not have permission to import products.');
                        return;
                    }
                    if (payload.productsToCreate.length > 0) {
                      const { error } = await supabase.from('products').insert(payload.productsToCreate);
                      if (error) showAlert('DB Error', 'Could not create new products.');
                    }
                    if (payload.variantsToUpdate.length > 0) {
                      showAlert('Import Info', 'Variant updates are not yet implemented in this simplified import.');
                    }
                    
                    const { data } = await supabase.from('products').select('*');
                    if (data) setProducts(data as Product[]);

                    logActivity(`Imported products: ${payload.productsToCreate.length} created.`, currentUser);
                    setIsImportModalOpen(false);
                  }}
                t={t}
            />
            <ImportCustomersModal
                isOpen={isImportCustomersModalOpen}
                onClose={() => setIsImportCustomersModalOpen(false)}
                onApplyImport={handleImportCustomers}
                t={t}
            />
            <ImportSuppliersModal
                isOpen={isImportSuppliersModalOpen}
                onClose={() => setIsImportSuppliersModalOpen(false)}
                onApplyImport={handleImportSuppliers}
                t={t}
            />
             <ImportBillsModal
                isOpen={isImportBillsModalOpen}
                onClose={() => setIsImportBillsModalOpen(false)}
                onApplyImport={handleImportBills}
                suppliers={suppliers}
                t={t}
            />
             <ForcePasswordChangeModal
                isOpen={isForcePasswordChangeOpen}
                currentUser={currentUser}
                onUpdatePassword={handleUpdatePassword}
                onPasswordChangedSuccessfully={() => {
                    setIsForcePasswordChangeOpen(false);
                    showAlert(t('password_update_success'), t('force_password_change_success_desc'));
                }}
                onLogout={handleLogout}
                t={t}
            />
            {hoveredProduct && (
                <ProductTooltip
                    product={hoveredProduct}
                    position={popupPosition}
                    language={language}
                />
            )}
        </>
    );
};

export default App;
