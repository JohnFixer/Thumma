// data.ts
import { Role, ProductStatus, OrderStatus, FulfillmentStatus, PaymentStatus } from './types';
import type { User, Product, Supplier, Customer, Transaction, Order, StoreCredit, ActivityLog } from './types';

export const PRODUCTS: Product[] = [
    {
        id: 'prod-1',
        name: { en: 'Steel Rebar', th: 'เหล็กเส้น' },
        description: { en: 'High-tensile deformed steel bars for concrete reinforcement.', th: 'เหล็กข้ออ้อยทนแรงดึงสูงสำหรับงานเสริมคอนกรีต' },
        category: 'building_materials.steel_metal',
        imageUrl: 'https://picsum.photos/seed/rebar/400/400',
        variants: [
            { id: 'var-1-1', sku: 'RB-12MM', size: '12mm', stock: 150, price: { walkIn: 250, contractor: 230, government: 240, cost: 180 }, status: ProductStatus.IN_STOCK, barcode: '8851234567890', history: [] },
            { id: 'var-1-2', sku: 'RB-16MM', size: '16mm', stock: 8, price: { walkIn: 380, contractor: 350, government: 365, cost: 290 }, status: ProductStatus.LOW_STOCK, barcode: '8851234567891', history: [] },
        ]
    },
    {
        id: 'prod-2',
        name: { en: 'Portland Cement Type 1', th: 'ปูนซีเมนต์ปอร์ตแลนด์ ประเภท 1' },
        description: { en: 'Standard Portland cement for general concrete work. 50kg bag.', th: 'ปูนซีเมนต์ปอร์ตแลนด์มาตรฐานสำหรับงานคอนกรีตทั่วไป บรรจุ 50 กก.' },
        category: 'building_materials.cement_aggregates',
        imageUrl: 'https://picsum.photos/seed/cement/400/400',
        variants: [
            { id: 'var-2-1', sku: 'CEM-T1-50KG', size: '50kg Bag', stock: 200, price: { walkIn: 135, contractor: 125, government: 130, cost: 95 }, status: ProductStatus.IN_STOCK, barcode: '8852345678901', history: [] },
        ]
    },
    {
        id: 'prod-3',
        name: { en: 'Concrete Block', th: 'อิฐบล็อก' },
        description: { en: 'Standard, non-load-bearing concrete blocks for wall construction.', th: 'อิฐบล็อกมาตรฐาน ไม่รับน้ำหนัก สำหรับงานก่อผนัง' },
        category: 'building_materials.bricks_blocks',
        imageUrl: 'https://picsum.photos/seed/block/400/400',
        variants: [
            { id: 'var-3-1', sku: 'CB-7CM', size: '7cm', stock: 0, price: { walkIn: 7, contractor: 6.5, government: 6.8, cost: 4 }, status: ProductStatus.OUT_OF_STOCK, barcode: '8853456789012', history: [] },
            { id: 'var-3-2', sku: 'CB-9CM', size: '9cm', stock: 1500, price: { walkIn: 9, contractor: 8.5, government: 8.8, cost: 5.5 }, status: ProductStatus.IN_STOCK, barcode: '8853456789013', history: [] },
        ]
    },
];

const transactionItems: Transaction['items'] = [
    { productId: 'prod-1', variantId: 'var-1-1', name: PRODUCTS[0].name, size: '12mm', imageUrl: PRODUCTS[0].imageUrl, sku: 'RB-12MM', quantity: 10, stock: 150, price: PRODUCTS[0].variants[0].price },
    { productId: 'prod-2', variantId: 'var-2-1', name: PRODUCTS[1].name, size: '50kg Bag', imageUrl: PRODUCTS[1].imageUrl, sku: 'CEM-T1-50KG', quantity: 5, stock: 200, price: PRODUCTS[1].variants[0].price },
];
const subtotal = (10 * 230) + (5 * 125); // contractor prices
const tax = subtotal * 0.07;
const total = subtotal + tax;

export const TRANSACTIONS: Transaction[] = [
    {
        id: '1722000000000123',
        date: new Date().toISOString(),
        items: transactionItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        customerId: 'cust-1',
        customerName: 'John Doe Construction',
        customerAddress: '123 Construction Rd, Khon Kaen',
        customerPhone: '081-111-1111',
        customerType: 'contractor',
        operator: 'Malee',
        paymentMethod: 'Bank Transfer',
        vatIncluded: true,
        payment_status: PaymentStatus.PAID,
        paid_amount: total,
    }
];