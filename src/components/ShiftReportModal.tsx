import React from 'react';
import type { ShiftReport, User, Language } from '../types';
import { XMarkIcon, PrinterIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface ShiftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ShiftReport | null;
  user: User | null;
  t: (key: TranslationKey) => string;
  language: Language;
}

const ShiftReportModal: React.FC<ShiftReportModalProps> = ({ isOpen, onClose, report, user, t, language }) => {
    if (!isOpen || !report) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('shift-report-to-print');
        if (!printContent) return;
    
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to print the report.');
            return;
        }

        const tailwindScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
        const tailwindConfig = Array.from(document.querySelectorAll('script')).find(s => s.textContent?.includes('tailwind.config'));
        const styles = Array.from(document.querySelectorAll('style'));

        printWindow.document.write('<html><head><title>Shift Report</title>');
        if (tailwindScript) printWindow.document.write(tailwindScript.outerHTML);
        if (tailwindConfig) printWindow.document.write(`<script>${tailwindConfig.innerHTML}</script>`);
        styles.forEach(style => printWindow.document.write(`<style>${style.innerHTML}</style>`));
        printWindow.document.write('</head><body class="bg-white">');
        printWindow.document.write(printContent.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
    
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const profitMargin = report.totalSales > 0 ? (report.totalProfit / report.totalSales) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center no-print" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-text-primary">{t('shift_report')}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    <div id="shift-report-to-print" className="bg-white text-black p-6 w-full mx-auto text-sm leading-relaxed font-sans">
                        <div className="text-center">
                            <h1 className="text-xl font-bold">บจก ธรรมะคอนกรีต</h1>
                            <p className="text-xs">123 Example Rd, Khon Kaen, 40000</p>
                            <h2 className="font-bold my-2 text-lg uppercase">{t('shift_report')}</h2>
                        </div>
                        <div className="border-t border-b border-dashed border-black my-2 py-1 text-xs">
                            <p><strong>{t('shift_id')}:</strong> {report.id}</p>
                            <p><strong>{t('start_time')}:</strong> {new Date(report.startTime).toLocaleString()}</p>
                            <p><strong>{t('end_time')}:</strong> {new Date(report.endTime).toLocaleString()}</p>
                            <p><strong>{t('closed_by')}:</strong> {user?.name || 'Unknown'}</p>
                        </div>

                        <div className="my-4">
                            <h3 className="font-bold border-b border-black pb-1 mb-1">Summary</h3>
                            <div className="grid grid-cols-2 gap-x-4 text-sm">
                                <p><strong>{t('total_sales')}:</strong> <span className="float-right font-mono">฿{report.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                <p><strong>{t('total_profit')}:</strong> <span className="float-right font-mono">฿{report.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                <p><strong>Transactions:</strong> <span className="float-right font-mono">{report.totalTransactions}</span></p>
                                <p><strong>{t('profit_margin')}:</strong> <span className="float-right font-mono">{profitMargin.toFixed(2)}%</span></p>
                            </div>
                        </div>

                        <div className="my-4">
                             <h3 className="font-bold border-b border-black pb-1 mb-1">{t('sales_by_payment_method')}</h3>
                             <div className="grid grid-cols-2 gap-x-4 text-sm">
                                <p><strong>Cash:</strong> <span className="float-right font-mono">฿{report.paymentMethodBreakdown.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                <p><strong>Card:</strong> <span className="float-right font-mono">฿{report.paymentMethodBreakdown.card.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                <p><strong>Bank Transfer:</strong> <span className="float-right font-mono">฿{report.paymentMethodBreakdown.bankTransfer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                             </div>
                        </div>

                        <div className="my-4">
                            <h3 className="font-bold border-b border-black pb-1 mb-1">{t('top_selling_items')} (by quantity)</h3>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-dashed">
                                        <th className="text-left py-1">Item</th>
                                        <th className="text-center py-1">Qty</th>
                                        <th className="text-right py-1">Total Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.topSellingItems.map(item => (
                                        <tr key={item.variantId}>
                                            <td>{item.productName[language]} ({item.variantSize})</td>
                                            <td className="text-center font-mono">{item.quantitySold}</td>
                                            <td className="text-right font-mono">฿{item.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="bg-background px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button type="button" onClick={handlePrint} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
                        <PrinterIcon className="h-5 w-5 mr-2" /> {t('print_report')}
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftReportModal;
