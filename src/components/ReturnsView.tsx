

import React, { useState, useMemo } from 'react';
import type { Transaction, CartItem, StoreCredit, ReturnedItem, Product, Language, CustomerType } from '../types';
import { ReturnReason } from '../types';
import { MagnifyingGlassIcon, CurrencyDollarIcon, XCircleIcon } from './icons/HeroIcons';
import ReturnSuccessModal from './ReturnSuccessModal';
import type { TranslationKey } from '../translations';

interface ReturnsViewProps {
  transactions: Transaction[];
  products: Product[];
  onProcessReturn: (
      transactionId: string, 
      itemsToReturn: ReturnedItem[],
      totalValue: number
  ) => Promise<StoreCredit>;
  t: (key: TranslationKey) => string;
  language: Language;
}

const getPriceForCustomer = (item: CartItem, customerType: CustomerType) => {
    if (customerType === 'government') return item.price.government;
    if (customerType === 'contractor') return item.price.contractor;
    if (customerType === 'organization') return item.price.contractor;
    return item.price.walkIn;
};

const ReturnsView: React.FC<ReturnsViewProps> = ({ transactions, products, onProcessReturn, t, language }) => {
    const [searchId, setSearchId] = useState('');
    const [foundTransaction, setFoundTransaction] = useState<Transaction | 'not_found' | null>(null);
    const [itemsToReturn, setItemsToReturn] = useState<Map<string, { quantity: number; reason: ReturnReason }>>(new Map());
    const [lastCreatedCredit, setLastCreatedCredit] = useState<StoreCredit | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const tx = transactions.find(t => t.id.toLowerCase() === searchId.toLowerCase().trim());
        setFoundTransaction(tx || 'not_found');
        setItemsToReturn(new Map()); // Reset on new search
    };

    const handleItemChange = (variantId: string, newQuantity: number, newReason?: ReturnReason) => {
        setItemsToReturn(prev => {
            const newMap = new Map<string, { quantity: number; reason: ReturnReason }>(prev);
            const currentItem = newMap.get(variantId);
            
            let determinedReason: ReturnReason;
            if (newReason) {
                determinedReason = newReason;
            } else if (currentItem) {
                determinedReason = currentItem.reason;
            } else {
                determinedReason = ReturnReason.CUSTOMER_CHOICE;
            }
    
            const updatedItem = {
                quantity: newQuantity,
                reason: determinedReason,
            };

            if (updatedItem.quantity > 0) {
                newMap.set(variantId, updatedItem);
            } else {
                newMap.delete(variantId);
            }
            return newMap;
        });
    };

    const totalReturnValue = useMemo(() => {
        if (!foundTransaction || foundTransaction === 'not_found') return 0;
        
        return Array.from(itemsToReturn.entries()).reduce((acc: number, [variantId, { quantity }]) => {
            const originalItem = foundTransaction.items.find(i => i.variantId === variantId);
            if (!originalItem) return acc;
            
            const originalPricePerUnit = getPriceForCustomer(originalItem, foundTransaction.customerType);
            
            // This logic assumes total = subtotal + tax, and tries to refund a proportional amount of tax.
            // A simpler approach could just refund the original item price if tax rules are complex.
            const itemSubtotal = originalItem.quantity * originalPricePerUnit;
            const subtotalRatio = foundTransaction.subtotal > 0 ? itemSubtotal / foundTransaction.subtotal : 0;
            const taxPaidForItem = (foundTransaction.tax || 0) * subtotalRatio;
            const totalPricePaidForItem = itemSubtotal + taxPaidForItem;
            const unitPricePaid = originalItem.quantity > 0 ? totalPricePaidForItem / originalItem.quantity : 0;

            return acc + (quantity * unitPricePaid);
        }, 0);
    }, [itemsToReturn, foundTransaction]);

    const handleSubmitReturn = async () => {
        if (!foundTransaction || foundTransaction === 'not_found' || itemsToReturn.size === 0) return;

        const returnPayload: ReturnedItem[] = Array.from(itemsToReturn.entries()).map(([variantId, { quantity, reason }]) => {
            const originalItem = foundTransaction.items.find(i => i.variantId === variantId)!;
            const originalPricePerUnit = getPriceForCustomer(originalItem, foundTransaction.customerType);
            const itemSubtotal = originalItem.quantity * originalPricePerUnit;
            const subtotalRatio = foundTransaction.subtotal > 0 ? itemSubtotal / foundTransaction.subtotal : 0;
