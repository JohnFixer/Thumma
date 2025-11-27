
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client ---
const supabaseUrl = 'https://mdjbetqfvelzlbntygyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kamJldHFmdmVsemxibnR5Z3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTc5MTksImV4cCI6MjA3ODQ5MzkxOX0.3fn1bLRSbNVWDfLpYzL0QvT7yeHSv74oIDZyjuWufwU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Types ---
interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
    orderHistory: any[];
}

interface NewSupplierData {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
}

// --- DB Functions ---
const fetchSuppliers = async (): Promise<Supplier[]> => {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) {
        console.error('Error fetching suppliers:', error);
        return [];
    }
    return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson || s.contact_person,
        email: s.email,
        phone: s.phone,
        address: s.address,
        logo: s.logo || s.logo_url,
        orderHistory: s.orderHistory || []
    }));
};

const updateSupplier = async (id: string, supplier: NewSupplierData): Promise<boolean> => {
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

    if (error) {
        console.error('Error updating supplier:', error);
        return false;
    }
    return true;
};

// --- Debug Logic ---
async function debugSupplierEdit() {
    console.log("Fetching suppliers...");
    const suppliers = await fetchSuppliers();
    console.log(`Found ${suppliers.length} suppliers.`);

    if (suppliers.length === 0) {
        console.log("No suppliers found.");
        return;
    }

    const firstSupplier = suppliers[0];
    console.log("First supplier:", JSON.stringify(firstSupplier, null, 2));

    // Check if required fields are present
    if (!firstSupplier.contactPerson) console.log("WARNING: contactPerson is missing/empty");
    if (!firstSupplier.email) console.log("WARNING: email is missing/empty");

    // Try to update the name
    console.log(`Attempting to update supplier ${firstSupplier.id}...`);
    const newName = firstSupplier.name + " (Updated)";

    // Ensure we send all required fields, even if they are empty strings in the object
    const updateData: NewSupplierData = {
        name: newName,
        contactPerson: firstSupplier.contactPerson || "Default Contact",
        email: firstSupplier.email || "default@example.com",
        phone: firstSupplier.phone || "",
        address: firstSupplier.address || "",
        logo: firstSupplier.logo || ""
    };

    const success = await updateSupplier(firstSupplier.id, updateData);

    if (success) {
        console.log("Update successful.");
        // Verify update
        const updatedSuppliers = await fetchSuppliers();
        const updatedSupplier = updatedSuppliers.find(s => s.id === firstSupplier.id);
        console.log("Updated supplier:", JSON.stringify(updatedSupplier, null, 2));
        if (updatedSupplier?.name === newName) {
            console.log("Verification PASSED: Name updated correctly.");
        } else {
            console.log("Verification FAILED: Name did not update.");
        }
    } else {
        console.log("Update FAILED.");
    }
}

debugSupplierEdit().catch(console.error);
