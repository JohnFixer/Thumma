import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ProductGrid from './ProductGrid';
import CartPanel from './CartPanel';
import PaymentModal from './PaymentModal';
// FIX: Corrected import paths by removing file extensions.
import ReceiptModal from './ReceiptModal';
import VariantSelectionModal from './VariantSelectionModal';
import CreateInvoiceModal from './CreateInvoiceModal';
import OutsourcePurchaseModal from './OutsourcePurchaseModal';
import AddMiscItemModal from './AddMiscItemModal';
import type { Product, CartItem, Transaction, User, CustomerType, Customer, StoreCredit, Order, ProductVariant, Language, StoreSettings, PaymentMethod, NewCustomerData } from '../types';
import { FulfillmentStatus, PaymentStatus } from '../types';
import type { TranslationKey } from '../translations';

interface POSViewProps {
  products: Product[];
  currentUser: User;
  customers: Customer[];
  storeCredits: StoreCredit[];
  transactions: Transaction[];
  onNewTransaction: (transaction: Omit<Transaction, 'payment_status' | 'due_date' | 'paid_amount'>, cartItems: CartItem[], appliedCreditId?: string, carriedForwardBalance?: { customerId: string, amount: number }) => Promise<Transaction | undefined>;
  onNewInvoice: (transaction: Omit<Transaction, 'payment_status' | 'paymentMethod' | 'paid_amount'>, cartItems: CartItem[]) => void;
  onNewOrder: (order: Order) => void;
  onAddNewCustomerFromPOS: (customerData: NewCustomerData) => Promise<Customer | null>;
  openScanner: (onSuccess: (code: string) => void) => void;
  posScannedCode: string | null;
  setPosScannedCode: (code: string | null) => void;
  showAlert: (title: string, message: string) => void;
  storeSettings: StoreSettings | null;
  onProductMouseEnter: (product: Product, event: React.MouseEvent) => void;
  onProductMouseLeave: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
}

const TAX_RATE = 0.07; // 7%

const POSView: React.FC<POSViewProps> = ({ products, currentUser, customers, storeCredits, transactions, onNewTransaction, onNewInvoice, onNewOrder, onAddNewCustomerFromPOS, openScanner, posScannedCode, setPosScannedCode, showAlert, storeSettings, onProductMouseEnter, onProductMouseLeave, t, language }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);
    const [customerName, setCustomerName] = useState('Guest');
    const [customerAddress, setCustomerAddress] = useState<string | undefined>('');
    const [customerPhone, setCustomerPhone] = useState<string | undefined>('');
    const [customerType, setCustomerType] = useState<CustomerType>(currentUser.settings?.defaultCustomerType || 'walkIn');
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [orderType, setOrderType] = useState<'In-Store' | 'Pickup' | 'Delivery'>('In-Store');
    const [isVatIncluded, setIsVatIncluded] = useState(true);
    const [appliedCredit, setAppliedCredit] = useState<StoreCredit | null>(null);
    const [carriedForwardBalance, setCarriedForwardBalance] = useState(0);
    const [transportationFee, setTransportationFee] = useState(0);
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<Omit<Transaction, 'payment_status' | 'due_date' | 'paymentMethod' | 'paid_amount'> | null>(null);
    const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
    const [isOutsourceModalOpen, setIsOutsourceModalOpen] = useState(false);
    const [itemToOutsource, setItemToOutsource] = useState<{ product: Product, variant: ProductVariant } | null>(null);
    const [isAddMiscItemModalOpen, setIsAddMiscItemModalOpen] = useState(false);

    const customerOutstandingBalance = useMemo(() => {
        if (!customerId) return 0;
        return transactions
            .filter(tx => tx.customerId === customerId && (tx.payment_status === PaymentStatus.UNPAID || tx.payment_status === PaymentStatus.PARTIALLY_PAID))
            .reduce((sum, tx) => sum + (tx.total - tx.paid_amount), 0);
    }, [customerId, transactions]);

    const handleConfirmOutsource = (item: CartItem) => {
        setCartItems(prev => [...prev, item]);
        setIsOutsourceModalOpen(false);
        setItemToOutsource(null);
    };
    
    const handleAddMiscItem = (item: CartItem) => {
        setCartItems(prev => [...prev, item]);
        setIsAddMiscItemModalOpen(false);
    };

    const handleVariantSelected = useCallback((product: Product, variant: ProductVariant) => {
        if (variant.stock > 0) {
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.variantId === variant.id);
                if (existingItem) {
                    if (existingItem.quantity < variant.stock) {
                        return prevItems.map(item =>
                            item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
                        );
                    }
                    return prevItems;
                }
                const newItem: CartItem = {
                    productId: product.id,
                    variantId: variant.id,
                    name: product.name,
                    size: variant.size,
                    imageUrl: product.imageUrl,
                    sku: variant.sku,
                    quantity: 1,
                    stock: variant.stock,
                    price: variant.price,
                };
                return [...prevItems, newItem];
            });
        } else {
            // Out of stock, trigger outsource
            setItemToOutsource({ product, variant });
            setIsOutsourceModalOpen(true);
        }
        setIsVariantModalOpen(false);
        setSelectedProductForVariant(null);
    }, []);

    const handleProductSelect = useCallback((product: Product) => {
        const hasAnyStock = product.variants.some(v => v.stock > 0);
    
        if (hasAnyStock) {
            if (product.variants.length === 1) {
                 handleVariantSelected(product, product.variants[0]);
            } else {
                setSelectedProductForVariant(product);
                setIsVariantModalOpen(true);
            }
        } else {
            // All variants are out of stock. Streamline the outsource flow.
            if (product.variants.length === 1) {
                // If only one variant, no need to ask, just open outsource modal.
                handleVariantSelected(product, product.variants[0]);
            } else {
                // If multiple variants, let the user choose which one to outsource.
                setSelectedProductForVariant(product);
                setIsVariantModalOpen(true);
            }
        }
    }, [handleVariantSelected]);

    const handleUpdateQuantity = useCallback((variantId: string, quantity: number) => {
        setCartItems(prevItems => {
            if (quantity <= 0) {
                return prevItems.filter(item => item.variantId !== variantId);
            }
            return prevItems.map(item => {
                if (item.variantId === variantId) {
                    // For outsourced items, don't cap by stock, as stock is an artificial value.
                    // For regular items, cap at available stock.
                    const newQuantity = item.isOutsourced ? quantity : Math.min(quantity, item.stock);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
        });
    }, []);

    const handleRemoveItem = useCallback((variantId: string) => {
        setCartItems(prevItems => prevItems.filter(item => item.variantId !== variantId));
    }, []);

    const handleClearCart = useCallback(() => {
        setCartItems([]);
        setCustomerName('Guest');
        setCustomerAddress('');
        setCustomerPhone('');
        setCustomerType(currentUser.settings?.defaultCustomerType || 'walkIn');
        setCustomerId(undefined);
        setIsVatIncluded(true);
        setAppliedCredit(null);
        setOrderType('In-Store');
        setCarriedForwardBalance(0);
        setTransportationFee(0);
        setIsNewCustomer(false);
    }, [currentUser.settings?.defaultCustomerType]);

    const handleSelectCustomer = (customer: Customer) => {
        setCustomerId(customer.id);
        setCustomerName(customer.name);
        setCustomerAddress(customer.address || '');
        setCustomerPhone(customer.phone || '');
        handleCustomerTypeChange(customer.type);
        setIsNewCustomer(false);
    };

    const handleCustomerInputBlur = () => {
        if (!customerName || customerName.trim().toLowerCase() === 'guest' || customerName.trim() === '') {
            setCustomerName('Guest');
            setCustomerId(undefined);
            setIsNewCustomer(false);
            return;
        }

        const trimmedName = customerName.trim();
        
        if (customerId) {
            const currentCustomer = customers.find(c => c.id === customerId);
            if (currentCustomer && currentCustomer.name.toLowerCase() === trimmedName.toLowerCase()) {
                return;
            }
        }

        const existingCustomer = customers.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        
        if (existingCustomer) {
            handleSelectCustomer(existingCustomer);
        } else {
            setIsNewCustomer(true);
            setCustomerId(undefined);
            setCustomerAddress('');
            setCustomerPhone('');
        }
    };
    
    const handleCustomerNameChange = (name: string) => {
        setCustomerName(name);
        setIsNewCustomer(false); // Reset flag while typing
        const selectedCustomer = customers.find(c => c.id === customerId);
        if (selectedCustomer && selectedCustomer.name !== name) {
            setCustomerId(undefined);
            setCustomerAddress('');
            setCustomerPhone('');
            handleCustomerTypeChange(currentUser.settings?.defaultCustomerType || 'walkIn');
        }
    };
    
    const handleCustomerTypeChange = (type: CustomerType) => {
        setCustomerType(type);
        if (type === 'government') {
            setIsVatIncluded(true);
        }
    };

    const { subtotal, tax, total, originalTotal } = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        let total = 0;

        if (customerType === 'government') {
            total = cartItems.reduce((acc, item) => {
                const price = item.price.government; // VAT-inclusive price
                return acc + price * item.quantity;
            }, 0);
            subtotal = total / (1 + TAX_RATE);
            tax = total - subtotal;
        } else {
            subtotal = cartItems.reduce((acc, item) => {
                const price = customerType === 'contractor' ? item.price.contractor : item.price.walkIn;
                return acc + price * item.quantity;
            }, 0);
            
            if (isVatIncluded) {
                 tax = subtotal * TAX_RATE;
            }
            total = subtotal + tax;
        }

        total += carriedForwardBalance;
        total += transportationFee;
        const originalTotal = total;
        const finalTotal = total - (appliedCredit ? appliedCredit.amount : 0);
        
        return { subtotal, tax, total: finalTotal, originalTotal };
    }, [cartItems, customerType, isVatIncluded, appliedCredit, carriedForwardBalance, transportationFee]);
    
    const handleApplyCredit = (creditId: string): { success: boolean; message: string } => {
        if (!creditId) {
            setAppliedCredit(null);
            return { success: true, message: 'Credit removed.' };
        }
        const credit = storeCredits.find(sc => sc.id.toLowerCase() === creditId.toLowerCase().trim() && !sc.isUsed);
        
        if (credit) {
            if (originalTotal >= credit.amount) {
                setAppliedCredit(credit);
                return { success: true, message: `Credit of ฿${credit.amount.toFixed(2)} applied.` };
            } else {
                setAppliedCredit(null);
                return { success: false, message: `Order total must be at least ฿${credit.amount.toFixed(2)}.` };
            }
        }
        return { success: false, message: 'Invalid or used store credit code.' };
    };


    const handleCheckout = () => {
        if (isVatIncluded && (!customerAddress?.trim() || !customerPhone?.trim())) {
            showAlert(t('missing_information'), t('vat_invoice_requires_details_alert'));
            return;
        }
        if (cartItems.length === 0 && carriedForwardBalance === 0) {
            showAlert(t('cart_is_empty'), t('cart_empty_desc'));
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const handleCreateInvoice = async () => {
        if (cartItems.length === 0) {
            showAlert(t('cart_is_empty'), t('cart_empty_desc'));
            return;
        }
        if (customerType === 'walkIn') {
            showAlert('Invalid Customer Type', 'Invoices can only be created for Contractors, Government, or Organization customers.');
            return;
        }

        let finalCustomer: Partial<Customer> & { name: string } = {
            id: customerId,
            name: customerName,
            type: customerType,
            address: customerAddress,
            phone: customerPhone,
        };

        if (isNewCustomer && customerName.trim() && customerName.trim().toLowerCase() !== 'guest') {
            const newCustomer = await onAddNewCustomerFromPOS({
                name: customerName.trim(),
                type: customerType,
                address: customerAddress,
                phone: customerPhone,
            });

            if (!newCustomer) {
                showAlert('Customer Creation Failed', 'Could not save the new customer. The invoice has not been created.');
                return;
            }
            finalCustomer = newCustomer;
        }
        
        const dataForInvoice: Omit<Transaction, 'payment_status' | 'due_date' | 'paymentMethod' | 'paid_amount' | 'transportationFee'> & { transportationFee?: number } = {
            id: `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            date: new Date().toISOString(),
            items: cartItems,
            subtotal,
            tax,
            total,
            customerId: finalCustomer.id,
            customerName: finalCustomer.name || 'Guest',
            customerAddress: finalCustomer.address,
            customerPhone: finalCustomer.phone,
            customerType,
            operator: currentUser.name,
            vatIncluded: isVatIncluded,
            appliedStoreCredit: appliedCredit ? { id: appliedCredit.id, amount: appliedCredit.amount } : undefined,
        };

        if (transportationFee > 0) {
            dataForInvoice.transportationFee = transportationFee;
        }

        setInvoiceData(dataForInvoice as Omit<Transaction, 'payment_status' | 'due_date' | 'paymentMethod' | 'paid_amount'>);
        setIsCreateInvoiceModalOpen(true);
    };
    
    const handleConfirmInvoice = (dueDate: string) => {
        if (!invoiceData) return;
        const finalInvoiceData: Omit<Transaction, 'payment_status' | 'paymentMethod' | 'paid_amount'> = { ...invoiceData, due_date: dueDate };
        onNewInvoice(finalInvoiceData, cartItems);
        setIsCreateInvoiceModalOpen(false);
        setInvoiceData(null);
        handleClearCart();
        showAlert('Invoice Created', `Invoice ${finalInvoiceData.id} has been created successfully.`);
    };

    const handleCreateUnpaidOrder = async () => {
        if (cartItems.length === 0) {
            showAlert(t('cart_is_empty'), t('cart_empty_desc'));
            return;
        }
        if (!customerAddress?.trim() || !customerPhone?.trim()) {
            showAlert(t('missing_information'), t('delivery_requires_details_alert'));
            return;
        }

        let finalCustomer: Customer;

        if (isNewCustomer && customerName.trim() && customerName.trim().toLowerCase() !== 'guest') {
             const newCustomer = await onAddNewCustomerFromPOS({
                name: customerName.trim(),
                type: customerType,
                address: customerAddress,
                phone: customerPhone,
            });

            if (!newCustomer) {
                showAlert('Customer Creation Failed', 'Could not save the new customer. The order was not created.');
                return;
            }
            finalCustomer = newCustomer;
        } else {
            finalCustomer = customers.find(c => c.id === customerId) || {
                id: `guest-${Date.now()}`,
                name: customerName,
                type: customerType,
                phone: customerPhone,
                address: customerAddress,
            };
        }


        const newOrder: Omit<Order, 'transportationFee'> & { transportationFee?: number } = {
            id: `ORD-${Date.now()}`,
            customer: finalCustomer,
            date: new Date().toISOString(),
            items: cartItems,
            total: total,
            status: FulfillmentStatus.PROCESSING,
            type: 'Delivery',
            address: customerAddress,
            paymentStatus: PaymentStatus.UNPAID,
        };

        if (transportationFee > 0) {
            newOrder.transportationFee = transportationFee;
        }

        onNewOrder(newOrder as Order);
        showAlert('Order Created', `Unpaid order ${newOrder.id} created for ${customerName}.`);
        handleClearCart();
    };

    const handlePaymentSuccess = async (method: PaymentMethod) => {
        setIsPaymentModalOpen(false);
        
        let finalCustomer: Partial<Customer> & { name: string } = {
            id: customerId,
            name: customerName,
            type: customerType,
            address: customerAddress,
            phone: customerPhone,
        };

        if (isNewCustomer && customerName.trim() && customerName.trim().toLowerCase() !== 'guest') {
            const newCustomer = await onAddNewCustomerFromPOS({
                name: customerName.trim(),
                type: customerType,
                address: customerAddress,
                phone: customerPhone,
            });

            if (!newCustomer) {
                showAlert('Customer Creation Failed', 'Could not save the new customer. The transaction has been cancelled.');
                return;
            }
            finalCustomer = newCustomer;
        }
    
        if (orderType === 'In-Store') {
            let itemsForTx = cartItems;
            if (carriedForwardBalance > 0) {
                itemsForTx = [
                    ...cartItems,
                    {
                        productId: 'BALANCE_FORWARD', variantId: 'BALANCE_FORWARD',
                        name: { en: 'Previous Balance Forwarded', th: 'ยอดยกมา' }, size: '', imageUrl: '',
                        sku: 'BALANCE', quantity: 1, stock: 1,
                        price: { walkIn: carriedForwardBalance, contractor: carriedForwardBalance, government: carriedForwardBalance, cost: carriedForwardBalance },
                    }
                ];
            }
    
            const newTransactionData: Omit<Transaction, 'payment_status' | 'due_date' | 'paid_amount' | 'transportationFee'> & { transportationFee?: number } = {
                id: `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                date: new Date().toISOString(),
                items: itemsForTx,
                subtotal,
                tax,
                total,
                customerId: finalCustomer.id,
                customerName: finalCustomer.name || 'Guest',
                customerAddress: finalCustomer.address,
                customerPhone: finalCustomer.phone,
                customerType: customerType,
                operator: currentUser.name,
                paymentMethod: method,
                vatIncluded: isVatIncluded,
                appliedStoreCredit: appliedCredit ? { id: appliedCredit.id, amount: appliedCredit.amount } : undefined,
            };
    
            if (transportationFee > 0) {
                newTransactionData.transportationFee = transportationFee;
            }
    
            const newTx = await onNewTransaction(
                newTransactionData as Omit<Transaction, 'payment_status' | 'due_date' | 'paid_amount'>,
                cartItems,
                appliedCredit?.id,
                carriedForwardBalance > 0 && finalCustomer.id ? { customerId: finalCustomer.id, amount: carriedForwardBalance } : undefined
            );
    
            if (newTx) {
                setLastTransaction(newTx);
                setIsReceiptModalOpen(true);
                handleClearCart();
            }
        } else { // Delivery or Pickup with "Pay Now"
            const newOrder: Order = {
                id: `ORD-${Date.now()}`,
                customer: finalCustomer as Customer, // Cast because we've ensured it exists
                date: new Date().toISOString(),
                items: cartItems,
                total: total,
                transportationFee: transportationFee > 0 ? transportationFee : undefined,
                status: orderType === 'Delivery' ? FulfillmentStatus.PROCESSING : FulfillmentStatus.PENDING,
                type: orderType,
                address: customerAddress,
                paymentStatus: PaymentStatus.PAID,
                paymentMethod: method,
            };
    
            onNewOrder(newOrder);
            showAlert('Paid Order Created', `Order ${newOrder.id} has been created and marked as paid.`);
            handleClearCart();
        }
    };
    
    useEffect(() => {
        const handleScan = (code: string) => {
            const foundVariant = products.flatMap(p => p.variants.map(v => ({ product: p, variant: v }))).find(item => item.variant.barcode === code);
            if (foundVariant) {
                handleProductSelect(foundVariant.product);
            } else {
                showAlert(t('product_not_found'), t('product_not_found_alert', { code }));
            }
        };

        if (posScannedCode) {
            handleScan(posScannedCode);
            setPosScannedCode(null);
        }
    }, [posScannedCode, setPosScannedCode, products, handleProductSelect, showAlert, t]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <ProductGrid 
                products={products} 
                onProductSelect={handleProductSelect}
                onScanClick={() => openScanner(code => setPosScannedCode(code))}
                onProductMouseEnter={onProductMouseEnter}
                onProductMouseLeave={onProductMouseLeave}
                t={t}
                language={language}
            />
            <CartPanel 
                cartItems={cartItems} 
                customers={customers}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onCheckout={handleCheckout}
                onCreateInvoice={handleCreateInvoice}
                customerName={customerName}
                onCustomerNameChange={handleCustomerNameChange}
                onCustomerInputBlur={handleCustomerInputBlur}
                customerAddress={customerAddress}
                onCustomerAddressChange={setCustomerAddress}
                customerPhone={customerPhone}
                onCustomerPhoneChange={setCustomerPhone}
                onSelectCustomer={handleSelectCustomer}
                customerType={customerType}
                onCustomerTypeChange={handleCustomerTypeChange}
                isVatIncluded={isVatIncluded}
                onVatToggle={setIsVatIncluded}
                appliedCredit={appliedCredit}
                onApplyCredit={handleApplyCredit}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
                products={products}
// FIX: Corrected typo 'handleNewUnpaidOrder' to 'handleCreateUnpaidOrder'
                onNewUnpaidOrder={handleCreateUnpaidOrder}
                customerOutstandingBalance={customerOutstandingBalance}
                carriedForwardBalance={carriedForwardBalance}
// FIX: Corrected typo 'setCarryForwardBalance' to 'setCarriedForwardBalance'
                onCarryForwardBalance={setCarriedForwardBalance}
                onAddMiscItemClick={() => setIsAddMiscItemModalOpen(true)}
                transportationFee={transportationFee}
                setTransportationFee={setTransportationFee}
                storeSettings={storeSettings}
                t={t}
                language={language}
            />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={handlePaymentSuccess}
                totalAmount={total}
                currentUser={currentUser}
                t={t}
            />
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                transaction={lastTransaction}
                storeSettings={storeSettings}
                t={t}
                language={language}
            />
            <VariantSelectionModal
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                product={selectedProductForVariant}
                onSelectVariant={handleVariantSelected}
                t={t}
                language={language}
            />
            <CreateInvoiceModal
                isOpen={isCreateInvoiceModalOpen}
                onClose={() => setIsCreateInvoiceModalOpen(false)}
                onConfirm={handleConfirmInvoice}
                t={t}
            />
             <OutsourcePurchaseModal
                isOpen={isOutsourceModalOpen}
                onClose={() => setIsOutsourceModalOpen(false)}
                onConfirm={handleConfirmOutsource}
                product={itemToOutsource?.product || null}
                variant={itemToOutsource?.variant || null}
                storeSettings={storeSettings}
                t={t}
                language={language}
            />
            <AddMiscItemModal
                isOpen={isAddMiscItemModalOpen}
                onClose={() => setIsAddMiscItemModalOpen(false)}
                onConfirm={handleAddMiscItem}
                t={t}
                language={language}
            />
        </div>
    );
};

export default POSView;