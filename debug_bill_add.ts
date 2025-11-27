
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client ---
const supabaseUrl = 'https://mdjbetqfvelzlbntygyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kamJldHFmdmVsemxibnR5Z3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTc5MTksImV4cCI6MjA3ODQ5MzkxOX0.3fn1bLRSbNVWDfLpYzL0QvT7yeHSv74oIDZyjuWufwU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Types ---
interface NewBillData {
    supplierId: string;
    invoiceNumber: string;
    billDate: string;
    dueDate: string;
    amount: number;
    notes?: string;
    file?: File;
}

// --- DB Function ---
const createBill = async (bill: NewBillData): Promise<any | null> => {
    const { data, error } = await supabase.from('bills').insert({
        supplier_id: bill.supplierId,
        invoice_number: bill.invoiceNumber,
        bill_date: bill.billDate,
        due_date: bill.dueDate,
        amount: bill.amount,
        status: 'Due',
        notes: bill.notes
    }).select().single();

    if (error) {
        console.error("Error creating bill:", error);
        return null;
    }
    return data;
};

// --- Debug Logic ---
async function debugBillAdd() {
    console.log("Fetching suppliers...");
    const { data: suppliers, error } = await supabase.from('suppliers').select('*').limit(1);

    if (error || !suppliers || suppliers.length === 0) {
        console.error("No suppliers found to attach bill to.");
        return;
    }

    const supplierId = suppliers[0].id;
    console.log(`Using supplier ID: ${supplierId}`);

    const newBill: NewBillData = {
        supplierId: supplierId,
        invoiceNumber: `DEBUG-BILL-${Date.now()}`,
        billDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        amount: 1234.56,
        notes: "Debug bill created via script"
    };

    console.log("Creating bill...", newBill);
    const createdBill = await createBill(newBill);

    if (createdBill) {
        console.log("Bill created successfully:", createdBill);
    } else {
        console.log("Failed to create bill.");
    }
}

debugBillAdd().catch(console.error);
