import { supabase } from '../lib/supabaseClient';
import type {
    Product, NewProductData, ProductVariant,
    Customer, NewCustomerData,
    Supplier, NewSupplierData,
    Transaction,
    User, NewUserData,
    ShiftReport,
    Bill, NewBillData, StoreSettings,
    Category, NewCategoryData
} from '../types';

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
        imageUrl: p.image_url,
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
        imageUrl: p.image_url,
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
        contactPerson: s.contact_person,
        email: s.email,
        phone: s.phone,
        address: s.address,
        logo: s.logo_url,
        orderHistory: [] // Not implemented in DB yet
    }));
};

export const createSupplier = async (supplier: NewSupplierData): Promise<Supplier | null> => {
    const { data, error } = await supabase.from('suppliers').insert({
        name: supplier.name,
        contact_person: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        logo_url: supplier.logo
    }).select().single();

    if (error) return null;

    return {
        id: data.id,
        name: data.name,
        contactPerson: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo: data.logo_url,
        orderHistory: []
    };
};

export const deleteSupplier = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    return !error;
};

// --- Transactions ---

export const fetchTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) return [];

    return data.map((t: any) => ({
        ...t,
        customerName: t.customer_name,
        customerType: t.customer_type,
        paymentMethod: t.payment_method,
        paid_amount: t.paid_amount,
        customerId: t.customer_id
    }));
};

export const createTransaction = async (transaction: Transaction): Promise<boolean> => {
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
        due_date: transaction.due_date
    });

    if (error) {
        console.error("Error creating transaction", error);
        return false;
    }
    return true;
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
        name: u.full_name || u.username,
        role: u.role,
        avatar: u.avatar_url,
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
