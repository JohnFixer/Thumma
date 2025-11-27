
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdjbetqfvelzlbntygyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kamJldHFmdmVsemxibnR5Z3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTc5MTksImV4cCI6MjA3ODQ5MzkxOX0.3fn1bLRSbNVWDfLpYzL0QvT7yeHSv74oIDZyjuWufwU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);



async function testAddSupplier() {
    console.log("Attempting to add supplier with camelCase columns...");
    const supplierData = {
        name: "Test Supplier " + Date.now(),
        contactPerson: "Test Person",
        email: "test@example.com",
        phone: "1234567890",
        address: "123 Test St",
        logo: "https://example.com/logo.png"
    };

    // Simulate what db.ts does now
    const { data, error } = await supabase.from('suppliers').insert({
        name: supplierData.name,
        contactPerson: supplierData.contactPerson,
        email: supplierData.email,
        phone: supplierData.phone,
        address: supplierData.address,
        logo: supplierData.logo,
        contact_person: supplierData.contactPerson,
        logo_url: supplierData.logo
    }).select().single();

    if (error) {
        console.error("Error adding supplier:", error);
    } else {
        console.log("Supplier added successfully:", data);
    }
}

testAddSupplier();


