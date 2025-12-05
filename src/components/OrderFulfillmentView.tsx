
import React, { useState, useMemo } from 'react';
import type { Order, PaymentMethod, Language, StoreSettings } from '../types';
import { FulfillmentStatus, PaymentStatus } from '../types';
import { MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon, PrinterIcon, TruckIcon } from './icons/HeroIcons';
import MarkAsPaidModal from './MarkAsPaidModal';
import DeliveryNoteModal from './DeliveryNoteModal';
import type { TranslationKey } from '../translations';
import ConfirmationModal from './ConfirmationModal';
import type { UserPermissions } from '../types';

interface OrderManagementViewProps {
    orders: Order[];
    onUpdateOrderStatus: (orderId: string, status: FulfillmentStatus) => void;
    onUpdateOrderPaymentStatus: (orderId: string, status: PaymentStatus, method: PaymentMethod) => void;
    onConvertOrderToInvoice: (order: Order) => void;
    onDeleteOrder?: (orderId: string) => void;
    currentUserPermissions: UserPermissions;
    storeSettings: StoreSettings | null;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    language: Language;
}

const getFulfillmentStatusColor = (status: FulfillmentStatus) => {
    switch (status) {
        case FulfillmentStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
        case FulfillmentStatus.PROCESSING: return 'bg-blue-100 text-blue-800';
        case FulfillmentStatus.READY_FOR_PICKUP: return 'bg-purple-100 text-purple-800';
        case FulfillmentStatus.COMPLETED: return 'bg-green-100 text-green-800';
        case FulfillmentStatus.CANCELLED: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
        case PaymentStatus.UNPAID: return 'bg-red-100 text-red-800';
        case PaymentStatus.PAID: return 'bg-green-100 text-green-800';
        case PaymentStatus.REFUNDED: return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const OrderManagementView: React.FC<OrderManagementViewProps> = ({ orders, onUpdateOrderStatus, onUpdateOrderPaymentStatus, onConvertOrderToInvoice, onDeleteOrder, currentUserPermissions, storeSettings, t, language }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState('All');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
    const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
    const [orderToPay, setOrderToPay] = useState<Order | null>(null);
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
    const [orderToBill, setOrderToBill] = useState<Order | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

    const handleToggleExpand = (orderId: string) => {
        setExpandedOrderIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleConfirmPayment = (method: PaymentMethod) => {
        if (orderToPay) {
            onUpdateOrderPaymentStatus(orderToPay.id, PaymentStatus.PAID, method);
        }
        setOrderToPay(null);
    };

    const handleConfirmBill = () => {
        if (orderToBill) {
            onConvertOrderToInvoice(orderToBill);
        }
        setOrderToBill(null);
    }

    const handleConfirmDelete = () => {
        if (orderToDelete && onDeleteOrder) {
            onDeleteOrder(orderToDelete.id);
        }
        setOrderToDelete(null);
    }

    const filteredOrders = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return orders.filter(order => {
            const matchesFulfillment = fulfillmentStatusFilter === 'All' || order.status === fulfillmentStatusFilter;
            const matchesPayment = paymentStatusFilter === 'All' || order.paymentStatus === paymentStatusFilter;
            const matchesSearch = !lowercasedQuery ||
                order.id.toLowerCase().includes(lowercasedQuery) ||
                order.customer.name.toLowerCase().includes(lowercasedQuery);
            return matchesFulfillment && matchesPayment && matchesSearch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, searchQuery, fulfillmentStatusFilter, paymentStatusFilter]);

    const fulfillmentStatusOptions = ['All', ...Object.values(FulfillmentStatus)];
    const paymentStatusOptions = ['All', ...Object.values(PaymentStatus)];

    const getTranslatedFulfillmentStatus = (status: string) => {
        if (status === 'All') return t('all');
        const key = `fulfillment_status_${status.toLowerCase().replace(/\s/g, '_')}` as TranslationKey;
        return t(key);
    };

    const getTranslatedPaymentStatus = (status: string) => {
        if (status === 'All') return t('all');
        const key = `payment_status_${status.toLowerCase().replace(/\s/g, '_')}` as TranslationKey;
        return t(key);
    };

    return (
        <>
            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">{t('order_management')}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={t('search_order_id_or_customer')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            />
                        </div>
                        <select
                            value={fulfillmentStatusFilter}
                            onChange={(e) => setFulfillmentStatusFilter(e.target.value)}
                            className="block w-full sm:w-auto pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            {fulfillmentStatusOptions.map(status => <option key={status} value={status}>{t('fulfillment')}: {getTranslatedFulfillmentStatus(status)}</option>)}
                        </select>
                        <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="block w-full sm:w-auto pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            {paymentStatusOptions.map(status => <option key={status} value={status}>{t('payment')}: {getTranslatedPaymentStatus(status)}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-2 py-3 w-12"></th>
                                <th scope="col" className="px-6 py-3">{t('order_id')}</th>
                                <th scope="col" className="px-6 py-3">{t('date')}</th>
                                <th scope="col" className="px-6 py-3">{t('customer')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('total')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('payment')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('fulfillment')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                <React.Fragment key={order.id}>
                                    <tr className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-2 py-4 text-center">
                                            <button onClick={() => handleToggleExpand(order.id)} className="p-1 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100">
                                                {expandedOrderIds.has(order.id) ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{order.id}</td>
                                        <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{order.customer.name}</td>
                                        <td className="px-6 py-4 text-right font-semibold">฿{order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                {getTranslatedPaymentStatus(order.paymentStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFulfillmentStatusColor(order.status)}`}>
                                                {getTranslatedFulfillmentStatus(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                {currentUserPermissions.order_fulfillment.edit && (
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as FulfillmentStatus)}
                                                        className="text-xs p-1 border rounded-md bg-background focus:ring-primary focus:border-primary"
                                                    >
                                                        {(Object.values(FulfillmentStatus) as FulfillmentStatus[]).map(status => (
                                                            <option key={status} value={status}>{getTranslatedFulfillmentStatus(status)}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {currentUserPermissions.order_fulfillment.edit && order.paymentStatus === PaymentStatus.UNPAID && (
                                                    <>
                                                        <button onClick={() => setOrderToPay(order)} className="text-xs p-1 px-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                                            {t('mark_as_paid')}
                                                        </button>
                                                        <button onClick={() => setOrderToBill(order)} className="text-xs p-1 px-2 bg-secondary text-white rounded-md hover:bg-orange-700">
                                                            {t('bill_customer')}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setOrderToPrint(order)}
                                                    className="text-xs flex items-center gap-1 p-1 px-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                                    title="Print or Save Delivery Note as PDF"
                                                >
                                                    <PrinterIcon className="h-3 w-3" />
                                                    <span>{t('print_pdf')}</span>
                                                </button>
                                                {currentUserPermissions.order_fulfillment.delete && onDeleteOrder && (
                                                    <button
                                                        onClick={() => setOrderToDelete(order)}
                                                        className="text-xs p-1 px-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                                    >
                                                        {t('delete')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrderIds.has(order.id) && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={8} className="p-4">
                                                <div className="bg-white p-4 rounded-md shadow-inner grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h5 className="font-semibold mb-2 text-text-primary">{t('items_to_prepare')}:</h5>
                                                        <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                                            {order.items.map(item => (
                                                                <li key={item.variantId} className="py-2 flex items-center gap-4">
                                                                    <img src={item.imageUrl || 'https://placehold.co/400x400?text=No+Image'} alt={item.name[language]} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                                                                    <div className="flex-grow">
                                                                        <p className="font-medium text-text-primary">{item.name[language]}</p>
                                                                        <p className="text-xs text-text-secondary">{t('sku')}: {item.sku}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-bold text-lg text-primary">{item.quantity}</p>
                                                                        <p className="text-xs text-text-secondary">units</p>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="text-sm">
                                                        <h5 className="font-semibold mb-2 text-text-primary">{t('delivery_pickup_info')}:</h5>
                                                        <p><strong>{t('type')}:</strong> {t(order.type.toLowerCase() as TranslationKey)}</p>
                                                        <p><strong>{t('customer')}:</strong> {order.customer.name} ({t(order.customer.type as TranslationKey)})</p>
                                                        {order.customer.phone && <p><strong>{t('phone')}:</strong> {order.customer.phone}</p>}
                                                        {order.address && <p><strong>{t('address')}:</strong> {order.address}</p>}
                                                        {order.notes && <p><strong>{t('notes')}:</strong> {order.notes}</p>}
                                                        {order.paymentMethod && <p className="mt-2 pt-2 border-t"><strong>{t('paid_via')}:</strong> {t(`payment_${order.paymentMethod.toLowerCase().replace(/\s/g, '_')}` as TranslationKey)}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="text-center p-12 text-text-secondary">
                                        <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_orders_found')}</p>
                                        <p className="text-sm mt-1">{t('try_adjusting_filters')}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <MarkAsPaidModal
                isOpen={!!orderToPay}
                onClose={() => setOrderToPay(null)}
                onConfirm={handleConfirmPayment}
                orderId={orderToPay?.id || ''}
                totalAmount={orderToPay?.total || 0}
                t={t}
            />
            <DeliveryNoteModal
                isOpen={!!orderToPrint}
                onClose={() => setOrderToPrint(null)}
                order={orderToPrint}
                storeSettings={storeSettings}
                language={language}
                t={t}
            />
            <ConfirmationModal
                isOpen={!!orderToBill}
                onClose={() => setOrderToBill(null)}
                onConfirm={handleConfirmBill}
                title={t('bill_customer_confirm_title')}
                message={t('bill_customer_confirm_message', { orderId: orderToBill?.id || '' })}
                confirmText={t('confirm_and_bill')}
                confirmButtonClass="bg-secondary hover:bg-orange-700 focus:ring-orange-500"
                t={t}
            />
            <ConfirmationModal
                isOpen={!!orderToDelete}
                onClose={() => setOrderToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('delete_order_confirm_title')}
                message={t('delete_order_confirm_message', { orderId: orderToDelete?.id || '' })}
                confirmText={t('delete')}
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                t={t}
            />
        </>
    );
};

export default OrderManagementView;
