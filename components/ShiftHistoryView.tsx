import React, { useState, useMemo } from 'react';
import type { ShiftReport, User, Language } from '../types';
import { MagnifyingGlassIcon, CalendarDaysIcon } from './icons/HeroIcons';
import ShiftReportModal from './ShiftReportModal';
import type { TranslationKey } from '../translations';

interface ShiftHistoryViewProps {
    shiftReports: ShiftReport[];
    users: User[];
    t: (key: TranslationKey) => string;
    language: Language;
}

const ShiftHistoryView: React.FC<ShiftHistoryViewProps> = ({ shiftReports, users, t, language }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [reportToView, setReportToView] = useState<ShiftReport | null>(null);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const filteredReports = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return shiftReports.filter(report => {
            const userName = userMap.get(report.closedByUserId)?.name.toLowerCase() || '';
            return report.id.toLowerCase().includes(lowercasedQuery) || userName.includes(lowercasedQuery);
        });
    }, [shiftReports, searchQuery, userMap]);

    return (
        <>
            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">{t('shift_history')}</h3>
                        <p className="text-sm text-text-secondary">Review all previously closed sales shifts.</p>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_by_id_or_user')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {filteredReports.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('shift_id')}</th>
                                    <th scope="col" className="px-6 py-3">{t('start_time')}</th>
                                    <th scope="col" className="px-6 py-3">{t('end_time')}</th>
                                    <th scope="col" className="px-6 py-3">{t('closed_by')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('total_sales')}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map((report) => {
                                    const user = userMap.get(report.closedByUserId);
                                    return (
                                    <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{report.id}</td>
                                        <td className="px-6 py-4">{new Date(report.startTime).toLocaleString()}</td>
                                        <td className="px-6 py-4">{new Date(report.endTime).toLocaleString()}</td>
                                        <td className="px-6 py-4">{user?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-right font-semibold">฿{report.totalSales.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setReportToView(report)} className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-md hover:bg-blue-800">
                                                {t('view_report')}
                                            </button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center p-12 text-text-secondary">
                            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_shifts_found')}</p>
                            <p className="text-sm mt-1">{t('no_shifts_desc')}</p>
                        </div>
                    )}
                </div>
            </div>
            
            <ShiftReportModal
                isOpen={!!reportToView}
                onClose={() => setReportToView(null)}
                report={reportToView}
                user={reportToView ? userMap.get(reportToView.closedByUserId) || null : null}
                t={t}
                language={language}
            />
        </>
    );
};

export default ShiftHistoryView;