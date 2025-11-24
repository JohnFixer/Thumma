import React, { useState, useMemo } from 'react';
// FIX: Corrected import paths by removing file extensions.
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
            const taxPaidForItem = (foundTransaction.tax || 0) * subtotalRatio;
            const totalPricePaidForItem = itemSubtotal + taxPaidForItem;
            const unitPricePaid = originalItem.quantity > 0 ? totalPricePaidForItem / originalItem.quantity : 0;

            return {
                productId: originalItem.productId,
                variantId,
                name: originalItem.name,
                size: originalItem.size,
                quantity,
                reason,
                unitPrice: unitPricePaid,
            };
        });

        const newCredit = await onProcessReturn(foundTransaction.id, returnPayload, totalReturnValue);

        setLastCreatedCredit(newCredit);

        setFoundTransaction(null);
        setSearchId('');
        setItemsToReturn(new Map());
    };

    const renderTransactionDetails = () => {
        if (!foundTransaction) return null;

        if (foundTransaction === 'not_found') {
            return (
                <div className="text-center p-8 bg-surface rounded-lg shadow mt-6">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary">Transaction Not Found</h3>
                    <p className="text-text-secondary mt-2">Please check the ID and try again.</p>
                </div>
            );
        }

        return (
            <div className="mt-6 bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-text-primary">Transaction Details</h3>
                    <div className="text-sm text-text-secondary grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <p><strong>ID:</strong> {foundTransaction.id}</p>
                        <p><strong>Customer:</strong> {foundTransaction.customerName}</p>
                        <p><strong>Date:</strong> {new Date(foundTransaction.date).toLocaleString()}</p>
                        <p><strong>Total Paid:</strong> ฿{foundTransaction.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="p-4">
                    <h4 className="font-semibold mb-2">Select Items to Return</h4>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {foundTransaction.items.map(item => {
                            const previouslyReturned = foundTransaction.returnedItems?.filter(ri => ri.variantId === item.variantId).reduce((sum, ri) => sum + ri.quantity, 0) || 0;
                            const availableToReturn = item.quantity - previouslyReturned;
                            const currentReturnInfo = itemsToReturn.get(item.variantId);

                            if (availableToReturn <= 0) {
                                return (
                                    <div key={item.variantId} className="flex items-center gap-4 p-3 bg-gray-100 rounded-md opacity-70">
                                        <img src={item.imageUrl || 'https://placehold.co/400x400?text=No+Image'} alt={item.name[language]} className="h-12 w-12 rounded object-cover" />
                                        <div className="flex-grow">
                                            <p className="font-medium text-text-primary">{item.name[language]} - {item.size}</p>
                                            <p className="text-sm text-green-600 font-semibold">All items returned</p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.variantId} className="flex flex-wrap items-center gap-4 p-3 bg-background rounded-md border">
                                    <img src={item.imageUrl || 'https://placehold.co/400x400?text=No+Image'} alt={item.name[language]} className="h-12 w-12 rounded object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-medium text-text-primary">{item.name[language]} - {item.size}</p>
                                        <p className="text-xs text-text-secondary">Purchased: {item.quantity} | Returned: {previouslyReturned}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium">Qty:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={availableToReturn}
                                            value={currentReturnInfo?.quantity || 0}
                                            onChange={(e) => handleItemChange(item.variantId, Math.min(availableToReturn, parseInt(e.target.value, 10) || 0))}
                                            className="w-16 p-1 border rounded-md"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium">Reason:</label>
                                        <select
                                            value={currentReturnInfo?.reason || ReturnReason.CUSTOMER_CHOICE}
                                            onChange={(e) => handleItemChange(item.variantId, currentReturnInfo?.quantity || 0, e.target.value as ReturnReason)}
                                            className="p-1 border rounded-md text-sm"
                                        >
                                            {(Object.values(ReturnReason) as ReturnReason[]).map(reason => <option key={reason} value={reason}>{reason}</option>)}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {itemsToReturn.size > 0 && (
                    <div className="p-4 bg-background border-t">
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span className="text-text-primary">Total Return Value:</span>
                            <span className="text-primary">฿{totalReturnValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <button
                            onClick={handleSubmitReturn}
                            className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors"
                        >
                            Issue Store Credit
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-surface rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-text-primary">Process a Return</h2>
                <p className="text-text-secondary mt-1">Enter a transaction ID to issue store credit for returned items.</p>
                <form onSubmit={handleSearch} className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Enter Transaction ID..."
                        className="flex-grow block w-full px-4 py-2 border border-gray-300 rounded-md bg-background focus:ring-primary focus:border-primary"
                        required
                    />
                    <button type="submit" className="flex items-center gap-2 bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-blue-800">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                        Find
                    </button>
                </form>
            </div>

            {renderTransactionDetails()}

            <ReturnSuccessModal
                isOpen={!!lastCreatedCredit}
                onClose={() => setLastCreatedCredit(null)}
                credit={lastCreatedCredit}
            />
        </div>
    );
};

export default ReturnsView;