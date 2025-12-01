import { supabase } from '../lib/supabaseClient';
import type {
    Product, NewProductData, ProductVariant,
    Customer, NewCustomerData,
    Supplier, NewSupplierData,
    Transaction,
    User, NewUserData,
    ShiftReport,
    Bill, NewBillData, StoreSettings,
    Category, NewCategoryData,
    Language, PaymentMethod,
    StoreCredit, ReturnedItem, PastInvoiceData, BillPayment, CustomerType, NewProductVariantData
} from '../types';
import { PaymentStatus } from '../types';

// --- Products ---

export const fetchProducts = async (): Promise<Product[]> => {
    const { data: products, error } = await supabase
        .from('products')
        .select(`
            *,
            variants:product_variants(*)
        `);

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    // Map DB structure back to frontend Product type
    return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        imageUrl: p.image_url || undefined,
        variants: p.variants.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            stock: v.stock_quantity,
            price: {
                walkIn: v.price_walk_in,
                contractor: v.price_contractor,
                government: v.price_government,
                cost: v.cost_price
            },
            status: v.status,
            barcode: v.barcode,
            history: v.history
        }))
    }));
};

export const createProduct = async (productData: NewProductData): Promise<Product | null> => {
    // 1. Insert Product
    const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
            name: productData.name,
            description: productData.description,
            category: productData.category,
            image_url: productData.imageUrl
        })
        .select()
        .single();

    if (productError || !product) {
        console.error('Error creating product:', productError);
        const errorMessage = productError?.message || 'Unknown error creating product';
        throw new Error(errorMessage);
    }

    // 2. Insert Variants
    const variantsToInsert = productData.variants.map(v => ({
        product_id: product.id,
        sku: v.sku,
        size: v.size,
        stock_quantity: v.stock,
        price_walk_in: v.price.walkIn,
        price_contractor: v.price.contractor,
        price_government: v.price.government,
        cost_price: v.price.cost,

        status: 'status' in v ? v.status : 'In Stock',
        barcode: v.barcode,
        history: 'history' in v ? v.history : []
    }));

    const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

    if (variantsError) {
        console.error('Error creating variants:', variantsError);
        // Ideally we should rollback product creation here, but Supabase JS doesn't support transactions easily without RPC.
        throw new Error(`Failed to create product variants: ${variantsError.message}`);
    }

    return fetchProductById(product.id);
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
    const { data: p, error } = await supabase
        .from('products')
        .select(`
            *,
            variants:product_variants(*)
        `)
        .eq('id', id)
        .single();

    if (error || !p) return null;

    return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        imageUrl: p.image_url || undefined,
        variants: p.variants.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            stock: v.stock_quantity,
            price: {
                walkIn: v.price_walk_in,
                contractor: v.price_contractor,
                government: v.price_government,
                cost: v.cost_price
            },
            status: v.status,
            barcode: v.barcode,
            history: v.history
        }))
    };
}

export const updateProduct = async (id: string, productData: NewProductData): Promise<boolean> => {
    // Update Product Info
    const { error: pError } = await supabase
        .from('products')
        .update({
            name: productData.name,
            description: productData.description,
            category: productData.category,
            image_url: productData.imageUrl
        })
        .eq('id', id);

    if (pError) return false;

    // Handle Variants (Upsert is complex here because we might delete some. For simplicity, we'll just upsert by ID if present, or create new.)
    // A simpler approach for this prototype: Delete all variants and recreate them (CAUTION: destroys history if not careful, but we are passing history back).
    // Better: Upsert.

    for (const v of productData.variants) {
        const variantData = {
            product_id: id,
            sku: v.sku,
            size: v.size,
            stock_quantity: v.stock,
            price_walk_in: v.price.walkIn,
            price_contractor: v.price.contractor,
            price_government: v.price.government,
            cost_price: v.price.cost,
            status: 'status' in v ? v.status : 'In Stock',
            barcode: v.barcode,
            history: 'history' in v ? v.history : []
        };

        if ('id' in v) {
            // Update existing
            await supabase.from('product_variants').update(variantData).eq('id', v.id);
        } else {
            // Create new
            await supabase.from('product_variants').insert(variantData);
        }
    }

    return true;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
};

// --- Customers ---

export const fetchCustomers = async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) return [];
    return data as Customer[];
};

export const createCustomer = async (customer: NewCustomerData): Promise<Customer | null> => {
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) return null;
    return data as Customer;
};

export const updateCustomer = async (id: string, customer: NewCustomerData): Promise<boolean> => {
    const { error } = await supabase.from('customers').update(customer).eq('id', id);
    return !error;
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    return !error;
};

// --- Suppliers ---

export const fetchSuppliers = async (): Promise<Supplier[]> => {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) return [];
    // Map snake_case to camelCase if needed, but our table uses camelCase for some fields or we need to map
    return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson || s.contact_person, // Fallback to snake_case if camelCase is missing (though we know camelCase exists)
        email: s.email,
        phone: s.phone,
        address: s.address,
        logo: s.logo || s.logo_url, // Fallback
        orderHistory: s.orderHistory || []
    }));
};

export const createSupplier = async (supplier: NewSupplierData): Promise<Supplier | null> => {
    const { data, error } = await supabase.from('suppliers').insert({
        name: supplier.name,
        contactPerson: supplier.contactPerson, // Use camelCase to match DB
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        logo: supplier.logo, // Use camelCase to match DB
        // Also populate snake_case columns just in case other parts of the system rely on them, or to keep them in sync?
        // But the error was about contactPerson being null.
        // Let's just populate the camelCase ones which are required.
        contact_person: supplier.contactPerson,
        logo_url: supplier.logo
    }).select().single();

    if (error) return null;

    return {
        id: data.id,
        name: data.name,
        contactPerson: data.contactPerson || data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo: data.logo || data.logo_url,
        orderHistory: data.orderHistory || []
    };
};

export const updateSupplier = async (id: string, supplier: NewSupplierData): Promise<boolean> => {
    const { error } = await supabase.from('suppliers').update({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        logo: supplier.logo,
        // Also populate snake_case columns
        contact_person: supplier.contactPerson,
        logo_url: supplier.logo
    }).eq('id', id);

    return !error;
};

export const deleteSupplier = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    return !error;
};

// --- Transactions ---

export const fetchTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) return [];

    return data.map((t: any) => {
        if (t.returned_items && t.returned_items.length > 0) console.log('Raw Transaction with returns:', t);
        return {
            ...t,
            // Map snake_case to camelCase, with fallbacks for legacy data
            customerName: t.customer_name || t.customerName,
            customerType: t.customer_type || t.customerType,
            customerAddress: t.customer_address || t.customerAddress,
            customerPhone: t.customer_phone || t.customerPhone,
            customerId: t.customer_id || t.customerId,
            paymentMethod: t.payment_method || t.paymentMethod,
            paid_amount: t.paid_amount,
            payment_status: t.payment_status,
            due_date: t.due_date,
            operator: t.operator_name || t.operator,
            transportationFee: t.transportation_fee || t.transportationFee || 0,
            vatIncluded: t.vat_included !== undefined ? t.vat_included : t.vatIncluded,
            file_url: t.file_url,
            returnedItems: (t.returned_items || []).map((ri: any) => ({
                ...ri,
                refundAmount: ri.refundAmount || (ri.unitPrice * ri.quantity)
            })),
            appliedStoreCredit: t.applied_store_credit ? {
                id: t.applied_store_credit.id,
                amount: t.applied_store_credit.amount
            } : undefined,
            created_at: t.created_at
        };
    });

    return data || [];
};

// --- Orders ---

export const fetchOrders = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    // Map DB structure to frontend Order type
    return (data || []).map((o: any) => ({
        id: o.id,
        date: o.date,
        customer: {
            id: o.customer_id,
            name: o.customer_name,
            type: o.customer_type,
            phone: o.customer_phone,
            address: o.customer_address
        },
        items: o.items,
        total: o.total,
        transportationFee: o.transportation_fee,
        status: o.fulfillment_status,
        type: o.order_type,
        address: o.delivery_address,
        notes: o.notes,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method
    }));
};

export const createOrder = async (order: any): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('orders').insert({
        id: order.id,
        date: order.date,
        customer_id: order.customer.id,
        customer_name: order.customer.name,
        customer_type: order.customer.type,
        customer_phone: order.customer.phone,
        customer_address: order.customer.address || order.address,
        customer: order.customer, // Populate legacy/required 'customer' column
        items: order.items,
        total: order.total,
        transportation_fee: order.transportationFee,
        fulfillment_status: order.status,
        status: order.status, // Populate legacy/required 'status' column
        order_type: order.type,
        type: order.type, // Populate legacy/required 'type' column
        delivery_address: order.address,
        notes: order.notes,
        payment_status: order.paymentStatus,
        paymentStatus: order.paymentStatus, // Populate legacy/required 'paymentStatus' column
        payment_method: order.paymentMethod
    });

    if (error) {
        console.error("Error creating order:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
    }
    return { success: true };
};

export const updateOrderPaymentStatus = async (orderId: string, paymentStatus: string, paymentMethod?: string): Promise<boolean> => {
    const updateData: any = { payment_status: paymentStatus };
    if (paymentMethod) {
        updateData.payment_method = paymentMethod;
    }

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

    if (error) {
        console.error("Error updating order payment status:", error);
        return false;
    }
    return true;
};

export const updateOrderFulfillmentStatus = async (orderId: string, fulfillmentStatus: string): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({ fulfillment_status: fulfillmentStatus })
        .eq('id', orderId);

    if (error) {
        console.error("Error updating order fulfillment status:", error);
        return false;
    }
    return true;
};

export const createTransaction = async (transaction: Transaction): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('transactions').insert({
        id: transaction.id,
        date: transaction.date,
        customer_id: transaction.customerId,
        customer_name: transaction.customerName,
        customer_type: transaction.customerType,
        customer_address: transaction.customerAddress,
        customer_phone: transaction.customerPhone,
        operator_id: null, // TODO: Get current user ID
        operator_name: transaction.operator,
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        transportation_fee: transaction.transportationFee,
        total: transaction.total,
        payment_method: transaction.paymentMethod,
        payment_status: transaction.payment_status,
        paid_amount: transaction.paid_amount,
        items: transaction.items,
        vat_included: transaction.vatIncluded,
        file_url: transaction.file_url,
        due_date: transaction.due_date,
        applied_store_credit: transaction.appliedStoreCredit ? {
            id: transaction.appliedStoreCredit.id,
            amount: transaction.appliedStoreCredit.amount
        } : null
    });

    if (error) {
        console.error("Error creating transaction:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
    }
    return { success: true };
};

export const receivePayment = async (transactionId: string, amount: number, method: PaymentMethod, paymentDate: string): Promise<Transaction | null> => {
    // 1. Fetch current transaction
    const { data: transaction, error: fetchError } = await supabase.from('transactions').select('*').eq('id', transactionId).single();

    if (fetchError || !transaction) {
        console.error("Error fetching transaction for payment:", fetchError);
        return null;
    }

    // 2. Calculate new values
    const currentPaid = transaction.paid_amount || 0;
    const newPaidAmount = currentPaid + amount;
    const total = transaction.total;

    // Determine status
    let newStatus: PaymentStatus = transaction.payment_status;
    if (newPaidAmount >= total) {
        newStatus = PaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
        newStatus = PaymentStatus.PARTIALLY_PAID;
    }

    // Update payments history
    const currentPayments = transaction.payments || [];
    const newPayment = {
        id: Date.now().toString(),
        amount,
        date: paymentDate,
        method
    };
    const updatedPayments = [...currentPayments, newPayment];

    // 3. Update transaction
    const { data: updatedTransaction, error: updateError } = await supabase
        .from('transactions')
        .update({
            paid_amount: newPaidAmount,
            payment_status: newStatus,
            payments: updatedPayments
        })
        .eq('id', transactionId)
        .select()
        .single();

    if (updateError) {
        console.error("Error updating transaction payment:", updateError);
        return null;
    }

    // 4. Map to frontend type (reusing logic from fetchTransactions would be better, but for now inline mapping to ensure consistency)
    // We need to return a full Transaction object. 
    // Since we just have the raw DB data, we should map it.
    // However, to avoid code duplication and potential mapping errors, 
    // it might be safer to just return the updated fields or re-fetch using fetchTransactions logic.
    // But fetchTransactions returns an array.
    // Let's do a simple mapping here similar to fetchTransactions but for a single item.

    return {
        ...updatedTransaction,
        items: updatedTransaction.items || [], // Items are JSONB
        date: updatedTransaction.date,
        subtotal: updatedTransaction.subtotal,
        tax: updatedTransaction.tax,
        total: updatedTransaction.total,
        customerName: updatedTransaction.customer_name,
        customerType: updatedTransaction.customer_type,
        paymentMethod: updatedTransaction.payment_method,
        vatIncluded: updatedTransaction.vat_included,
        payment_status: updatedTransaction.payment_status,
        paid_amount: updatedTransaction.paid_amount,
        // Map other fields if necessary, or rely on the fact that we primarily need the updated status/amount
        // For the UI update, we might just merge this into the existing state.
        returnedItems: (updatedTransaction.returned_items || []).map((ri: any) => ({
            ...ri,
            refundAmount: ri.refundAmount || (ri.unitPrice * ri.quantity)
        })),
        appliedStoreCredit: updatedTransaction.applied_store_credit,
        created_at: updatedTransaction.created_at,
        payments: updatedTransaction.payments
    } as Transaction;
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<{ success: boolean; error?: string }> => {
    // Map frontend Transaction fields to DB columns
    const dbUpdates: any = {};
    if (updates.date) dbUpdates.date = updates.date;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.paid_amount !== undefined) dbUpdates.paid_amount = updates.paid_amount;
    if (updates.payment_status) dbUpdates.payment_status = updates.payment_status;
    if (updates.customerId) dbUpdates.customer_id = updates.customerId;
    if (updates.customerName) dbUpdates.customer_name = updates.customerName;
    if (updates.items) dbUpdates.items = updates.items;
    if (updates.file_url) dbUpdates.file_url = updates.file_url;

    const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id);

    if (error) {
        console.error("Error updating transaction:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
        console.error("Error deleting transaction", error);
        return false;
    }
    return true;
};



// --- Users ---
// Note: User management usually involves Supabase Admin API for creating auth users.
// For now, we just interact with the public.users table.

export const fetchUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    return data.map((u: any) => ({
        id: u.id,
        name: u.full_name || u.username || 'Unknown User',
        role: u.role,
        avatar: u.avatar_url || '',
        settings: u.settings,
        permissions: u.permissions,
        salary: u.salary,
        wageType: u.wage_type
    }));
};

// --- Bills ---
export const fetchBills = async (): Promise<Bill[]> => {
    const { data, error } = await supabase.from('bills').select('*');
    if (error) return [];
    return data.map((b: any) => ({
        id: b.id,
        supplierId: b.supplier_id,
        invoiceNumber: b.invoice_number,
        billDate: b.bill_date,
        dueDate: b.due_date,
        amount: b.amount,
        paidAmount: b.paid_amount,
        status: b.status,
        payments: b.payments,
        notes: b.notes,
        fileUrl: b.file_url
    }));
};

export const createBill = async (bill: NewBillData): Promise<Bill | null> => {
    const { data, error } = await supabase.from('bills').insert({
        supplier_id: bill.supplierId,
        invoice_number: bill.invoiceNumber,
        bill_date: bill.billDate,
        due_date: bill.dueDate,
        amount: bill.amount,
        status: 'Due',
        notes: bill.notes
    }).select().single();

    return {
        id: data.id,
        supplierId: data.supplier_id,
        invoiceNumber: data.invoice_number,
        billDate: data.bill_date,
        dueDate: data.due_date,
        amount: data.amount,
        paidAmount: data.paid_amount,
        status: data.status,
        payments: data.payments,
        notes: data.notes,
        fileUrl: data.file_url
    };
};

export const updateBill = async (id: string, bill: NewBillData): Promise<boolean> => {
    const { error } = await supabase.from('bills').update({
        supplier_id: bill.supplierId,
        invoice_number: bill.invoiceNumber,
        bill_date: bill.billDate,
        due_date: bill.dueDate,
        amount: bill.amount,
        notes: bill.notes
    }).eq('id', id);

    if (error) {
        console.error("Error updating bill:", error);
        return false;
    }
    return true;
};

export const recordBillPayment = async (billId: string, payment: { amount: number, date: string, method: string, reference: string }): Promise<boolean> => {
    // 1. Fetch current bill
    const { data: bill, error: fetchError } = await supabase.from('bills').select('*').eq('id', billId).single();
    if (fetchError || !bill) {
        console.error("Error fetching bill for payment:", fetchError);
        return false;
    }

    // 2. Calculate new values
    const newPaidAmount = (bill.paid_amount || 0) + payment.amount;
    const newStatus = newPaidAmount >= bill.amount ? 'Paid' : 'Due'; // Or keep as Overdue if it was overdue? Usually if partially paid it remains Due/Overdue. If fully paid, it becomes Paid.
    // Let's simplify: if fully paid, Paid. Else, if it was Overdue, it stays Overdue (unless we re-evaluate date, but let's just leave it as is or set to Due if not paid).
    // Actually, status logic is usually: if paid >= amount -> Paid. Else -> Due (or Overdue if date passed).
    // For now, let's just check if fully paid.
    const finalStatus = newPaidAmount >= bill.amount ? 'Paid' : (bill.status === 'Overdue' ? 'Overdue' : 'Due');

    const newPaymentRecord = {
        id: Date.now().toString(), // Simple ID
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference
    };

    const currentPayments = bill.payments || [];
    const updatedPayments = [...currentPayments, newPaymentRecord];

    // 3. Update bill
    const { error: updateError } = await supabase.from('bills').update({
        paid_amount: newPaidAmount,
        status: finalStatus,
        payments: updatedPayments
    }).eq('id', billId);

    if (updateError) {
        console.error("Error recording bill payment:", updateError);
        return false;
    }

    return true;
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<boolean> => {
    const { error } = await supabase.from('users').update({
        full_name: userData.name,
        role: userData.role,
        avatar_url: userData.avatar,
        settings: userData.settings,
        permissions: userData.permissions,
        salary: userData.salary,
        wage_type: userData.wageType
    }).eq('id', id);

    return !error;
};

// --- Store Settings ---

export const fetchStoreSettings = async (): Promise<StoreSettings | null> => {
    const { data, error } = await supabase.from('store_settings').select('*').single();
    if (error || !data) return null;

    return {
        id: data.id,
        store_name: data.store_name,
        logo_url: data.logo_url,
        address: data.address,
        phone: data.phone,
        tax_id: data.tax_id,
        default_outsource_markup: data.default_outsource_markup,
        delivery_rate_per_km: data.delivery_rate_per_km,
        dashboard_widget_visibility: data.dashboard_widget_visibility
    };
};

export const updateStoreSettings = async (settings: Partial<StoreSettings>): Promise<boolean> => {
    // Check if settings exist, if not create, else update.
    // Since we usually have one row, we can try to update ID 1 or insert if empty.

    const { data: existing } = await supabase.from('store_settings').select('id').single();

    if (existing) {
        const { error } = await supabase.from('store_settings').update({
            store_name: settings.store_name,
            logo_url: settings.logo_url,
            address: settings.address,
            phone: settings.phone,
            tax_id: settings.tax_id,
            default_outsource_markup: settings.default_outsource_markup,
            delivery_rate_per_km: settings.delivery_rate_per_km,
            dashboard_widget_visibility: settings.dashboard_widget_visibility
        }).eq('id', existing.id);
        return !error;
    } else {
        const { error } = await supabase.from('store_settings').insert({
            store_name: settings.store_name,
            logo_url: settings.logo_url,
            address: settings.address,
            phone: settings.phone,
            tax_id: settings.tax_id,
            default_outsource_markup: settings.default_outsource_markup,
            delivery_rate_per_km: settings.delivery_rate_per_km,
            dashboard_widget_visibility: settings.dashboard_widget_visibility
        });
        return !error;
    }
};

// --- Categories ---

export const fetchCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        name: {
            en: c.name_en,
            th: c.name_th
        },
        slug: c.slug,
        parentId: c.parent_id,
        displayOrder: c.display_order,
        createdAt: c.created_at,
        updatedAt: c.updated_at
    }));
};

export const createCategory = async (categoryData: NewCategoryData): Promise<Category | null> => {
    const { data, error } = await supabase
        .from('categories')
        .insert({
            name_en: categoryData.name.en,
            name_th: categoryData.name.th,
            slug: categoryData.slug,
            parent_id: categoryData.parentId,
            display_order: categoryData.displayOrder
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating category:', error);
        return null;
    }

    return {
        id: data.id,
        name: {
            en: data.name_en,
            th: data.name_th
        },
        slug: data.slug,
        parentId: data.parent_id,
        displayOrder: data.display_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};

export const updateCategory = async (id: string, categoryData: Partial<NewCategoryData>): Promise<boolean> => {
    const updateData: any = {};

    if (categoryData.name) {
        updateData.name_en = categoryData.name.en;
        updateData.name_th = categoryData.name.th;
    }
    if (categoryData.slug !== undefined) updateData.slug = categoryData.slug;
    if (categoryData.parentId !== undefined) updateData.parent_id = categoryData.parentId;
    if (categoryData.displayOrder !== undefined) updateData.display_order = categoryData.displayOrder;

    const { error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Error updating category:', error);
        return false;
    }

    return true;
};

export const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    // Check if category has products
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .like('category', `%${id}%`)
        .limit(1);

    if (productsError) {
        console.error('Error checking products:', productsError);
        return { success: false, error: 'Failed to check for associated products' };
    }

    if (products && products.length > 0) {
        return { success: false, error: 'Cannot delete category with associated products. Please reassign or delete products first.' };
    }

    // Check if category has sub-categories
    const { data: subCategories, error: subError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id)
        .limit(1);

    if (subError) {
        console.error('Error checking sub-categories:', subError);
        return { success: false, error: 'Failed to check for sub-categories' };
    }

    if (subCategories && subCategories.length > 0) {
        return { success: false, error: 'Cannot delete category with sub-categories. Please delete or reassign sub-categories first.' };
    }

    // Delete the category
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed to delete category' };
    }

    return { success: true };
};

export const getCategoryHierarchy = (categories: Category[]): { main: Category[]; subsByParent: Record<string, Category[]> } => {
    const main = categories.filter(c => !c.parentId);
    const subsByParent: Record<string, Category[]> = {};

    categories.forEach(category => {
        if (category.parentId) {
            if (!subsByParent[category.parentId]) {
                subsByParent[category.parentId] = [];
            }
            subsByParent[category.parentId].push(category);
        }
    });

    return { main, subsByParent };
};

// --- Store Credits ---

export const fetchStoreCredits = async (): Promise<StoreCredit[]> => {
    const { data, error } = await supabase.from('store_credits').select('*').eq('is_used', false);
    if (error) {
        console.error('Error fetching store credits:', error);
        return [];
    }
    return data.map((c: any) => ({
        id: c.id,
        amount: c.amount,
        isUsed: c.is_used,
        originalTransactionId: c.original_transaction_id,
        dateIssued: c.date_issued
    }));
};

export const createStoreCredit = async (creditData: { amount: number, originalTransactionId: string }): Promise<StoreCredit | null> => {
    // Use RPC to bypass schema cache issues
    const { data, error } = await supabase.rpc('create_store_credit_rpc', {
        p_amount: creditData.amount,
        p_original_transaction_id: creditData.originalTransactionId
    });

    if (error) {
        console.error('Error creating store credit (RPC):', error);
        throw new Error(`Database Error: ${error.message} (${error.code})`);
    }

    // RPC returns the row as JSON
    return {
        id: data.id,
        amount: data.amount,
        isUsed: data.is_used,
        originalTransactionId: data.original_transaction_id,
        dateIssued: data.date_issued
    };
};

export const updateTransactionReturns = async (transactionId: string, returnedItems: ReturnedItem[]): Promise<boolean> => {
    // First fetch existing returned items to merge if needed
    const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('returned_items')
        .eq('id', transactionId)
        .single();

    if (fetchError) {
        console.error('Error fetching transaction for return update:', fetchError);
        return false;
    }

    const existingReturns: ReturnedItem[] = transaction.returned_items || [];
    // Simple merge: just add new ones.
    const updatedReturns = [...existingReturns, ...returnedItems];

    const { error } = await supabase
        .from('transactions')
        .update({ returned_items: updatedReturns })
        .eq('id', transactionId);

    if (error) {
        console.error('Error updating transaction returns:', error);
        return false;
    }

    return true;
};

export const markStoreCreditAsUsed = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('store_credits')
        .update({ is_used: true })
        .eq('id', id);

    if (error) {
        console.error('Error marking store credit as used:', error);
        return false;
    }
    return true;
};
