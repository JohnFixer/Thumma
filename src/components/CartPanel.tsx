import React, { useState, useEffect, useRef } from 'react';
import type { CartItem, CustomerType, Customer, StoreCredit, Product, Language, StoreSettings } from '../types';
import { TrashIcon, PlusIcon, MinusIcon, UserCircleIcon, CheckCircleIcon, XCircleIcon, PhoneIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from './icons/HeroIcons';
import SalesAssistantModal from './SalesAssistantModal';
import type { TranslationKey } from '../translations';

interface CartPanelProps {
  cartItems: CartItem[];
  customers: Customer[];
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
  onClearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
  onCreateInvoice: () => void;
  customerId?: string;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onCustomerInputBlur: () => void;
  customerAddress?: string;
  onCustomerAddressChange: (address: string) => void;
  customerPhone?: string;
  onCustomerPhoneChange: (phone: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  customerType: CustomerType;
  onCustomerTypeChange: (type: CustomerType) => void;
  isVatIncluded: boolean;
  onVatToggle: (isIncluded: boolean) => void;
  appliedCredit: StoreCredit | null;
  onApplyCredit: (creditId: string) => { success: boolean; message: string };
  orderType: 'In-Store' | 'Pickup' | 'Delivery';
  onOrderTypeChange: (type: 'In-Store' | 'Pickup' | 'Delivery') => void;
  products: Product[];
  onNewUnpaidOrder: () => void;
  customerOutstandingBalance: number;
  carriedForwardBalance: number;
  onCarryForwardBalance: (amount: number) => void;
  onAddMiscItemClick: () => void;
  transportationFee: number;
  setTransportationFee: (fee: number) => void;
  storeSettings: StoreSettings | null;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  language: Language;
  transactionDate: string;
  onTransactionDateChange: (date: string) => void;
}

const CartPanel: React.FC<CartPanelProps> = ({
  cartItems, customers, onUpdateQuantity, onRemoveItem, onClearCart, subtotal, tax, total, onCheckout,
  onCreateInvoice, customerId, customerName, onCustomerNameChange, onCustomerInputBlur, customerAddress, onCustomerAddressChange, customerPhone,
  onCustomerPhoneChange, onSelectCustomer, customerType, onCustomerTypeChange, isVatIncluded, onVatToggle,
  appliedCredit, onApplyCredit, orderType, onOrderTypeChange, products, onNewUnpaidOrder,
  customerOutstandingBalance, carriedForwardBalance, onCarryForwardBalance, onAddMiscItemClick,
  transportationFee, setTransportationFee, storeSettings, t, language, transactionDate, onTransactionDateChange
}) => {
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [creditCode, setCreditCode] = useState('');
  const [creditMessage, setCreditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const [isCustomerSectionCollapsed, setIsCustomerSectionCollapsed] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [feeMode, setFeeMode] = useState<'manual' | 'distance'>('manual');
  const [manualFee, setManualFee] = useState<number | ''>('');
  const [distance, setDistance] = useState<number | ''>('');
  const [ratePerKm, setRatePerKm] = useState<number | ''>('');

  useEffect(() => {
    setRatePerKm(storeSettings?.delivery_rate_per_km ?? 10);
  }, [storeSettings]);

  useEffect(() => {
    let fee = 0;
    if (feeMode === 'manual') {
      fee = typeof manualFee === 'number' ? manualFee : 0;
    } else {
      const dist = typeof distance === 'number' ? distance : 0;
      const rate = typeof ratePerKm === 'number' ? ratePerKm : 0;
      fee = dist * rate;
    }
    setTransportationFee(fee);
  }, [feeMode, manualFee, distance, ratePerKm, setTransportationFee]);

  useEffect(() => {
    // When cart clears, reset local state
    if (cartItems.length === 0 && transportationFee === 0) {
      setManualFee('');
      setDistance('');
    }
  }, [cartItems, transportationFee]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCreditMessage(null);
    setCreditCode(appliedCredit?.id || '');
    if (customerOutstandingBalance === 0) {
      onCarryForwardBalance(0);
    }
  }, [cartItems, appliedCredit, customerOutstandingBalance, onCarryForwardBalance]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onCustomerNameChange(query);
    onCarryForwardBalance(0);

    if (query) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsDropdownVisible(filtered.length > 0);
    } else {
      setSearchResults([]);
      setIsDropdownVisible(false);
    }
  };

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchResults([]);
    setIsDropdownVisible(false);
    onCarryForwardBalance(0);
  };

  const handleApplyCreditClick = () => {
    const result = onApplyCredit(creditCode);
    setCreditMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
  };

  const renderActionButtons = () => {
    return (
      <div className="flex gap-2">
        <button onClick={onNewUnpaidOrder} className="w-1/2 bg-secondary text-white font-bold py-3 rounded-lg hover:bg-orange-700">{t('pay_later')}</button>
        <button onClick={onCheckout} className="w-1/2 bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-800">{t('pay_now')}</button>
      </div>
    );
  };


  return (
    <>
      <div className="bg-surface rounded-lg shadow flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">{t('current_order')}</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={onAddMiscItemClick}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-blue-700 font-medium"
              title={t('add_misc_item')}
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('misc_item')}</span>
            </button>
            <button
              onClick={() => setIsAssistantModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-blue-700 font-medium"
              title="Open AI Sales Assistant"
            >
              <SparklesIcon className="h-5 w-5 text-secondary" />
              <span>{t('ai_assist')}</span>
            </button>
            {cartItems.length > 0 && (
              <button onClick={onClearCart} className="text-sm text-red-600 hover:text-red-800 font-medium">{t('clear_all')}</button>
            )}
          </div>
        </div>

        <div className="px-4 pt-2 pb-0">
          <label className="block text-xs font-medium text-text-secondary mb-1">{t('date')}</label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => onTransactionDateChange(e.target.value)}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="p-4 border-b">
          <button
            onClick={() => setIsCustomerSectionCollapsed(!isCustomerSectionCollapsed)}
            className="w-full flex justify-between items-center font-semibold text-text-primary mb-2"
          >
            {t('customer_and_order_type')}
            {isCustomerSectionCollapsed ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronUpIcon className="h-5 w-5" />}
          </button>
          {!isCustomerSectionCollapsed && (
            <div className="space-y-3">
              <div ref={searchWrapperRef}>
                <label htmlFor="customer-name" className="block text-sm font-medium text-text-secondary mb-1">{t('customer_name')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="customer-name"
                    value={customerName}
                    onChange={handleNameChange}
                    onFocus={handleNameChange}
                    onBlur={onCustomerInputBlur}
                    placeholder={t('search_or_enter_name_placeholder')}
                    autoComplete="off"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  {isDropdownVisible && (
                    <ul className="absolute z-10 w-full mt-1 bg-surface border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map(customer => (
                        <li
                          key={customer.id}
                          onClick={() => handleSelect(customer)}
                          className="px-4 py-2 text-sm text-text-primary hover:bg-primary hover:text-white cursor-pointer"
                        >
                          {customer.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="customer-phone" className="block text-sm font-medium text-text-secondary mb-1">{t('customer_phone')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="customer-phone"
                    value={customerPhone || ''}
                    onChange={(e) => onCustomerPhoneChange(e.target.value)}
                    placeholder={t('enter_phone_placeholder')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="customer-address" className="block text-sm font-medium text-text-secondary mb-1">{t('customer_address')}</label>
                <input
                  type="text"
                  id="customer-address"
                  value={customerAddress || ''}
                  onChange={(e) => onCustomerAddressChange(e.target.value)}
                  placeholder={orderType === 'Delivery' ? t('enter_delivery_address_placeholder') : t('enter_tax_invoice_address_placeholder')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              {customerOutstandingBalance > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                  <p className="font-semibold text-yellow-800">{t('outstanding_balance')}: ฿{customerOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <button
                    onClick={() => onCarryForwardBalance(carriedForwardBalance > 0 ? 0 : customerOutstandingBalance)}
                    className={`w-full mt-2 px-3 py-1.5 text-xs font-bold rounded-md ${carriedForwardBalance > 0 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-yellow-900'}`}
                  >
                    {carriedForwardBalance > 0 ? 'Cancel' : t('add_balance_to_order')}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer-type" className="block text-sm font-medium text-text-secondary mb-1">{t('customer_type')}</label>
                  <select
                    id="customer-type"
                    value={customerType}
                    onChange={(e) => onCustomerTypeChange(e.target.value as CustomerType)}
                    disabled={!!customerId}
                    className="block w-full p-2 border border-gray-300 rounded-md bg-background disabled:bg-gray-200 disabled:cursor-not-allowed"
                  >
                    <option value="walkIn">{t('walk_in')}</option>
                    <option value="contractor">{t('contractor')}</option>
                    <option value="government">{t('government')}</option>
                    <option value="organization">{t('organization')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('order_type')}</label>
                  <div className="flex rounded-md shadow-sm">
                    {(['In-Store', 'Pickup', 'Delivery'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onOrderTypeChange(type)}
                        className={`px-2 py-2 text-xs font-medium border border-gray-300 flex-1 first:rounded-l-md last:rounded-r-md -ml-px ${orderType === type ? 'bg-primary text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {t(type.toLowerCase().replace('-', '_') as TranslationKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-text-secondary">
                <p>{t('cart_is_empty')}</p>
                <p className="text-sm">{t('cart_empty_desc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.variantId} className="flex items-center gap-3">
                    <img src={item.imageUrl || 'https://placehold.co/400x400?text=No+Image'} alt={item.name[language]} className="h-12 w-12 rounded object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{item.name[language]} - {item.size}</p>
                      <p className="text-xs text-text-secondary">
                        {t(item.isOutsourced ? 'outsourced' : 'stock')}: {item.stock}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            onRemoveItem(item.variantId);
                          } else {
                            onUpdateQuantity(item.variantId, item.quantity - 1);
                          }
                        }}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = parseInt(val, 10);
                            onUpdateQuantity(item.variantId, isNaN(parsed) ? 0 : parsed);
                          }}
                          className={`w-16 text-center border rounded-md p-1 text-sm ${item.quantity > item.stock && !item.isOutsourced ? 'border-red-500 text-red-600 bg-red-50' : 'border-gray-300'}`}
                        />
                        {item.quantity > item.stock && !item.isOutsourced && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                            Exceeds Stock
                          </div>
                        )}
                      </div>
                      <button onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => onRemoveItem(item.variantId)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-background space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="text-sm font-semibold text-blue-800">{t('transportation_fee')}</label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex rounded-md shadow-sm w-full">
                  <button type="button" onClick={() => setFeeMode('manual')} className={`px-2 py-1 text-xs font-medium border border-gray-300 rounded-l-md -mr-px ${feeMode === 'manual' ? 'bg-primary text-white' : 'bg-white'}`}>{t('manual')}</button>
                  <button type="button" onClick={() => setFeeMode('distance')} className={`px-2 py-1 text-xs font-medium border border-gray-300 rounded-r-md ${feeMode === 'distance' ? 'bg-primary text-white' : 'bg-white'}`}>{t('by_distance')}</button>
                </div>
              </div>
              {feeMode === 'manual' ? (
                <input type="number" placeholder="Fee Amount" value={manualFee} onChange={e => setManualFee(e.target.value === '' ? '' : Number(e.target.value))} className="mt-2 w-full p-2 border rounded-md" />
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input type="number" placeholder={t('distance_km')} value={distance} onChange={e => setDistance(e.target.value === '' ? '' : Number(e.target.value))} className="p-2 border rounded-md" />
                  <input type="number" placeholder={t('rate_per_km')} value={ratePerKm} onChange={e => setRatePerKm(e.target.value === '' ? '' : Number(e.target.value))} className="p-2 border rounded-md" />
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('subtotal')}</span>
              <span>฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('tax_7')}</span>
              <span>฿{tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="vat-toggle" checked={isVatIncluded} onChange={e => onVatToggle(e.target.checked)} disabled={customerType === 'government'} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="vat-toggle" className="text-sm">{t('include_vat_7')}</label>
            </div>

            <div className="border-t pt-2">
              <label className="text-sm font-medium">{t('store_credit')}</label>
              <div className="flex gap-2 mt-1">
                <input type="text" placeholder={t('enter_code_placeholder')} value={creditCode} onChange={e => setCreditCode(e.target.value)} className="flex-grow w-full p-2 border rounded-md text-sm" />
                <button onClick={handleApplyCreditClick} className="px-4 py-2 bg-secondary text-white text-sm font-bold rounded-md hover:bg-orange-700">{t('apply')}</button>
              </div>
              {creditMessage && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${creditMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {creditMessage.type === 'success' ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                  {creditMessage.text}
                </p>
              )}
            </div>

            <div className="border-t pt-3 mt-3 flex justify-between items-baseline">
              <span className="text-lg font-bold">{t('grand_total')}</span>
              <span className="text-2xl font-bold text-primary">฿{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-2">
              {renderActionButtons()}
            </div>
          </div>
        </div>
      </div >
      <SalesAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        products={products}
        cartItems={cartItems}
        language={language}
      />
    </>
  );
};
export default CartPanel;
