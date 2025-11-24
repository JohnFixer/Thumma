import React from 'react';
import type { Order, Language } from '../types';
import { FulfillmentStatus, PaymentStatus } from '../types';
import { XMarkIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
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


const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, order, t, language }) => {
    if (!isOpen || !order) return null;

    const getTranslatedFulfillmentStatus = (status: string) => {
        const key = `fulfillment_status_${status.toLowerCase().replace(/\s/g, '_')}` as TranslationKey;
        return t(key);
    };

    const getTranslatedPaymentStatus = (status: string) => {
        const key = `payment_status_${status.toLowerCase().replace(/\s/g, '_')}` as TranslationKey;
        return t(key);
    };

    const subtotal = order.items.reduce((acc, item) => {
        const price = order.customer.type === 'government' ? item.price.government : order.customer.type === 'contractor' ? item.price.contractor : item.price.walkIn;
        return acc + (price * item.quantity);
    }, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">{t('order_details')}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <p><strong>{t('order_id')}:</strong> <span className="font-mono text-xs">{order.id}</span></p>
                            <p><strong>{t('date')}:</strong> {new Date(order.date).toLocaleString()}</p>
                            <div className="mt-2 flex gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFulfillmentStatusColor(order.status)}`}>
                                    {getTranslatedFulfillmentStatus(order.status)}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                                    {getTranslatedPaymentStatus(order.paymentStatus)}
                                </span>
                            </div>
                        </div>
                        <div className="bg-background p-3 rounded-md">
                            <h4 className="font-semibold text-text-primary">{t('customer')}</h4>
                            <p>{order.customer.name}</p>
                            {order.customer.phone && <p>{order.customer.phone}</p>}
                            {order.address && <p className="text-xs mt-1">{order.address}</p>}
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                        <h4 className="font-semibold text-text-primary mb-2">{t('items_in_order')}</h4>
                        <ul className="divide-y divide-gray-200">
                            {order.items.map(item => (
                                <li key={item.variantId} className="py-3 flex items-center gap-4">
                                    <img src={item.imageUrl || 'https://placehold.co/400x400?text=No+Image'} alt={item.name[language]} className="h-14 w-14 rounded-md object-cover flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-medium text-text-primary">{item.name[language]}</p>
                                        <p className="text-xs text-text-secondary">{t('sku')}: {item.sku} | {item.size}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">x {item.quantity}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-4 border-t pt-4 text-right space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-text-secondary">{t('subtotal')}:</span>
                            <span>฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {order.transportationFee && order.transportationFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-text-secondary">{t('transportation_fee')}:</span>
                                <span>฿{order.transportationFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline pt-2">
                            <p className="text-base font-bold text-text-primary">{t('total')}</p>
                            <p className="text-2xl font-bold text-primary">฿{order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                </div>
                <div className="bg-background px-4 py-3 sm:px-6 flex justify-end rounded-b-lg">
                    <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm">
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;