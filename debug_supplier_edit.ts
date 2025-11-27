
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fetchSuppliers, updateSupplier } from './src/services/db';

dotenv.config();

// Mock Supabase client if needed, or rely on the one in db.ts which imports from lib/supabaseClient
// But db.ts imports from '../lib/supabaseClient'.
// We need to make sure we can run this script with ts-node.
// The relative imports in db.ts might be an issue if we run this from root.
// Let's rely on the fact that we are in the root and ts-node handles it.

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
    const success = await updateSupplier(firstSupplier.id, {
        ...firstSupplier,
        name: newName
    });

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
