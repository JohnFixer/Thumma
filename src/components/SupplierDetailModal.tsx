import React from 'react';
import type { Supplier } from '../types';
import { OrderStatus } from '../types';
import { XMarkIcon, PhoneIcon, EnvelopeIcon, CheckCircleIcon, ClockIcon } from './icons/HeroIcons';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

const getStatusIcon = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.COMPLETED:
            return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case OrderStatus.PENDING:
            return <ClockIcon className="h-5 w-5 text-yellow-500" />;
        default:
            return null;
    }
};


const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({ isOpen, onClose, supplier }) => {
  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">Supplier Details</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start gap-6">
                <img src={supplier.logo} alt={supplier.name} className="h-24 w-24 rounded-full object-cover border-4 border-gray-200" />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-text-primary">{supplier.name}</h2>
                    <p className="text-text-secondary">{supplier.address}</p>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-text-primary">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400"/>
                            <a href={`mailto:${supplier.email}`} className="hover:underline">{supplier.email}</a>
                        </div>
                        <div className="flex items-center gap-2 text-text-primary">
                            <PhoneIcon className="h-4 w-4 text-gray-400"/>
                            <span>{supplier.phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 border-t pt-4">
                 <h4 className="font-semibold text-text-primary mb-2">Order History</h4>
                 {supplier.orderHistory.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-background text-left text-text-secondary">
                                <tr>
                                    <th className="p-3 font-medium">Order ID</th>
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium text-right">Amount</th>
                                    <th className="p-3 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {supplier.orderHistory.map(order => (
                                    <tr key={order.orderId} className="hover:bg-gray-50">
                                        <td className="p-3 font-mono text-xs">{order.orderId}</td>
                                        <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-right font-semibold">฿{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-center">
                                            <span className="flex items-center justify-center gap-2">
                                                {getStatusIcon(order.status)}
                                                <span>{order.status}</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    <p className="text-center text-text-secondary p-4 bg-background rounded-md">No order history available for this supplier.</p>
                 )}
            </div>
        </div>
        <div className="bg-background px-4 py-3 sm:px-6 flex justify-end rounded-b-lg">
          <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailModal;
