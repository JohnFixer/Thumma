import React, { useState, useEffect, useRef } from 'react';
import type { CustomerType, StoreCredit } from '../types'; // Keep these as types if they are only used as types
import { TrashIcon, PlusIcon, MinusIcon, UserCircleIcon, CheckCircleIcon, XCircleIcon, PhoneIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, ShoppingCartIcon, CubeIcon, XMarkIcon } from './icons/HeroIcons';
import { CartItem, Customer, Product, StoreSettings, Language } from '../types';
import type { TranslationKey } from '../translations';
import SalesAssistantModal from './SalesAssistantModal';

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
  customerId: string;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onCustomerInputBlur: () => void;
  customerAddress: string;
  onCustomerAddressChange: (address: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (phone: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  customerType: 'walkIn' | 'contractor' | 'government' | 'organization';
  onCustomerTypeChange: (type: 'walkIn' | 'contractor' | 'government' | 'organization') => void;
  isVatIncluded: boolean;
  onVatToggle: (included: boolean) => void;
  appliedCredit: { id: string; amount: number } | null;
  onApplyCredit: (code: string) => { success: boolean; message: string };
  orderType: 'In-Store' | 'Pickup' | 'Delivery';
  onOrderTypeChange: (type: 'In-Store' | 'Pickup' | 'Delivery') => void;
  products: Product[];
  onNewUnpaidOrder: () => void;
  customerOutstandingBalance: number;
  carriedForwardBalance: number;
  onCarryForwardBalance: (amount: number) => void;
  onAddMiscItemClick: () => void;
  transportationFee: number;
  setTransportationFee: (amount: number) => void;
  storeSettings?: StoreSettings;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  language: Language;
  transactionDate: string;
  onTransactionDateChange: (date: string) => void;
  discount: number;
  onDiscountChange: (amount: number) => void;
  remark: string;
  onRemarkChange: (text: string) => void;
}

const CartPanel: React.FC<CartPanelProps> = ({
  cartItems, customers, onUpdateQuantity, onRemoveItem, onClearCart, subtotal, tax, total, onCheckout,
  onCreateInvoice, customerId, customerName, onCustomerNameChange, onCustomerInputBlur, customerAddress, onCustomerAddressChange, customerPhone,
  onCustomerPhoneChange, onSelectCustomer, customerType, onCustomerTypeChange, isVatIncluded, onVatToggle,
  appliedCredit, onApplyCredit, orderType, onOrderTypeChange, products, onNewUnpaidOrder,
  customerOutstandingBalance, carriedForwardBalance, onCarryForwardBalance, onAddMiscItemClick,
  transportationFee, setTransportationFee, storeSettings, t, language, transactionDate, onTransactionDateChange,
  discount, onDiscountChange, remark, onRemarkChange
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
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);


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

  const handleRemoveCredit = () => {
    onApplyCredit(''); // Assuming an empty string or null clears the credit
    setCreditMessage({ type: 'success', text: 'Credit removed.' });
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerName.toLowerCase()) ||
    c.phone?.includes(customerName)
  ).slice(0, 5);


  return (
    <>
      <div className="bg-surface rounded-lg shadow overflow-y-auto h-full">
        {/* Header */}
        <div className="p-4 border-b bg-background rounded-t-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <ShoppingCartIcon className="h-6 w-6 text-primary" />
              {t('current_order')}
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAssistantModalOpen(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-blue-700 font-medium"
                title="Open AI Sales Assistant"
              >
                <SparklesIcon className="h-5 w-5 text-secondary" />
                <span>{t('ai_assist')}</span>
              </button>
              <button
                onClick={onClearCart}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
              >
                <TrashIcon className="h-4 w-4" />
                {t('clear_cart')}
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-3">
            <div className="relative">
              <div className="flex items-center border rounded-md bg-white focus-within:ring-2 focus-within:ring-primary">
                <UserCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
                <input
                  type="text"
                  placeholder={t('search_customer_placeholder')}
                  value={customerName}
                  onChange={(e) => {
                    onCustomerNameChange(e.target.value);
                    setShowCustomerSearch(true);
                  }}
                  onBlur={() => setTimeout(() => {
                    onCustomerInputBlur();
                    setShowCustomerSearch(false);
                  }, 200)}
                  onFocus={() => setShowCustomerSearch(true)}
                  className="w-full p-2 outline-none text-sm"
                />
              </div>
              {showCustomerSearch && customerName && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        onSelectCustomer(customer);
                        setShowCustomerSearch(false);
                      }}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-500">{customer.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Details & Type */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={customerType}
                onChange={(e) => onCustomerTypeChange(e.target.value as any)}
                className="p-2 border rounded-md text-sm bg-white"
              >
                <option value="walkIn">{t('walk_in')}</option>
                <option value="contractor">{t('contractor')}</option>
                <option value="government">{t('government')}</option>
                <option value="organization">{t('organization')}</option>
              </select>
              <select
                value={orderType}
                onChange={(e) => onOrderTypeChange(e.target.value as any)}
                className="p-2 border rounded-md text-sm bg-white"
              >
                <option value="In-Store">{t('in_store')}</option>
                <option value="Pickup">{t('pickup')}</option>
                <option value="Delivery">{t('delivery')}</option>
              </select>
            </div>

            {/* Additional Customer Info (Collapsible or always visible if needed) */}
            {/* Additional Customer Info */}
            <div className="space-y-2 text-sm">
              <input
                type="text"
                placeholder={t('customer_phone')}
                value={customerPhone || ''}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <textarea
                placeholder={t('address')}
                value={customerAddress || ''}
                onChange={(e) => onCustomerAddressChange(e.target.value)}
                className="w-full p-2 border rounded-md h-16 resize-none"
              />
            </div>

            {/* Transaction Date */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('date')}:</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => onTransactionDateChange(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content Area: Product List + Footer */}
        <div className="flex-1">
          {/* Product List */}
          <div className="p-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 min-h-[200px]">
                <ShoppingCartIcon className="h-12 w-12 opacity-20" />
                <p>{t('cart_is_empty')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.variantId} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name[language]} className="h-full w-full object-cover" />
                        ) : (
                          <CubeIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-text-primary truncate">{item.name[language]}</h4>
                        <p className="text-xs text-text-secondary">
                          {item.size} | {item.sku}
                          {item.isOutsourced && <span className="ml-1 text-orange-500 font-bold">({t('outsourced')})</span>}
                        </p>
                        <div className="text-sm font-bold text-primary mt-0.5">
                          {formatCurrency(
                            customerType === 'government' ? item.price.government :
                              (customerType === 'contractor' ? item.price.contractor : item.price.walkIn)
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md relative">
                        <button
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            onUpdateQuantity(item.variantId, isNaN(val) ? 0 : val);
                          }}
                          className={`w-12 text-center text-sm border-x py-1 focus:outline-none ${!item.isOutsourced && item.quantity > item.stock ? 'text-red-600 font-bold bg-red-50' : ''}`}
                        />
                        <button
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                        {/* Tooltip for Over Stock */}
                        {!item.isOutsourced && item.quantity > item.stock && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                            Exceeds Stock ({item.stock})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.variantId)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Section (Moved from Footer) */}
          <div className="p-4 space-y-3 border-t">
            {/* Add Misc Item Button */}
            <button
              onClick={onAddMiscItemClick}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              {t('add_misc_item')}
            </button>

            {/* Financial Inputs */}
            <div className="space-y-2 pt-2 border-t">
              {/* Carried Forward Balance */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{t('carried_forward_balance')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">฿</span>
                  <input
                    type="number"
                    value={carriedForwardBalance || ''}
                    onChange={(e) => onCarryForwardBalance(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right border rounded p-1 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Transportation Fee */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="text-sm font-semibold text-blue-800">{t('transportation_fee')}</label>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex rounded-md shadow-sm w-full">
                    <button type="button" onClick={() => setFeeMode('manual')} className={`px-2 py-1 text-xs font-medium border border-gray-300 rounded-l-md -mr-px ${feeMode === 'manual' ? 'bg-primary text-white' : 'bg-white'}`}>{t('manual')}</button>
                    <button type="button" onClick={() => setFeeMode('distance')} className={`px-2 py-1 text-xs font-medium border border-gray-300 rounded-r-md ${feeMode === 'distance' ? 'bg-primary text-white' : 'bg-white'}`}>{t('by_distance')}</button>
                  </div>
                </div>
                {feeMode === 'manual' ? (
                  <input type="number" placeholder="Fee Amount" value={manualFee} onChange={e => setManualFee(e.target.value === '' ? '' : Number(e.target.value))} className="mt-2 w-full p-2 border rounded-md text-sm" />
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input type="number" placeholder={t('distance_km')} value={distance} onChange={e => setDistance(e.target.value === '' ? '' : Number(e.target.value))} className="p-2 border rounded-md text-sm" />
                    <input type="number" placeholder={t('rate_per_km')} value={ratePerKm} onChange={e => setRatePerKm(e.target.value === '' ? '' : Number(e.target.value))} className="p-2 border rounded-md text-sm" />
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{t('discount')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">- ฿</span>
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right border rounded p-1 text-sm text-red-600"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Store Credit */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{t('store_credit')}</span>
                {appliedCredit ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <span>- {formatCurrency(appliedCredit.amount)}</span>
                    <button onClick={handleRemoveCredit} className="text-red-500 hover:text-red-700">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder={t('code')}
                      value={creditCode}
                      onChange={(e) => setCreditCode(e.target.value)}
                      className="w-20 border rounded p-1 text-xs"
                    />
                    <button
                      onClick={handleApplyCreditClick}
                      className="bg-gray-200 hover:bg-gray-300 px-2 rounded text-xs"
                    >
                      {t('apply')}
                    </button>
                  </div>
                )}
              </div>
              {creditMessage && <p className={`text-xs text-right ${creditMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{creditMessage.text}</p>}
            </div>

            {/* Remark */}
            <div className="pt-2">
              <textarea
                placeholder={t('remark_placeholder')}
                value={remark || ''}
                onChange={(e) => onRemarkChange(e.target.value)}
                className="w-full p-2 border rounded-md text-sm h-16 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Section (Totals & Actions) */}
        <div className="p-4 bg-white border-t space-y-3">
          {/* Totals Summary */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {isVatIncluded && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{t('tax_7')}</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-bold text-lg text-text-primary">{t('total')}</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="vat-toggle"
                checked={isVatIncluded}
                onChange={(e) => onVatToggle(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <label htmlFor="vat-toggle" className="text-xs text-gray-600 cursor-pointer select-none">
                {t('include_vat_7')}
              </label>
            </div>
            {customerOutstandingBalance > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm text-red-600 font-medium">
                  <span>{t('outstanding_balance')}</span>
                  <span>{formatCurrency(customerOutstandingBalance)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onNewUnpaidOrder}
              className="py-3 px-4 bg-white border border-primary text-primary rounded-lg font-semibold hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1"
            >
              <span className="text-sm">{t('pay_later')}</span>
              <span className="text-xs font-normal opacity-75">{t('create_invoice')}</span>
            </button>
            <button
              onClick={onCheckout}
              className="py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-blue-500/30 flex flex-col items-center justify-center gap-1"
            >
              <span className="text-sm">{t('pay_now')}</span>
              <span className="text-xs font-normal opacity-75">{formatCurrency(total)}</span>
            </button>
          </div>
        </div>
      </div>
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

