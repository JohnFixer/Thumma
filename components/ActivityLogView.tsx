

import React, { useState, useMemo } from 'react';
import type { ActivityLog, User } from '../types';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, ShieldCheckIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

// Declare the XLSX variable from the global scope, as it's loaded via a script tag in index.html
declare const XLSX: any;

// Fix: Add t prop for translation function
interface ActivityLogViewProps {
    logs: ActivityLog[];
    users: User[];
    t: (key: TranslationKey) => string;
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, users, t }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLogs = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        if (!lowercasedQuery) {
            return logs;
        }
        
        // Fix: Explicitly type the Map to ensure correct type inference for `userMap.get()`.
        const userMap: Map<string, string> = new Map(users.map(u => [u.id, u.name.toLowerCase()]));
        
        return logs.filter(log => {
            const userName = userMap.get(log.userId) || '';
            return userName.includes(lowercasedQuery);
        });
    }, [logs, users, searchQuery]);

    const getUserById = (userId: string) => {
        return users.find(u => u.id === userId);
    };

    const handleExportToExcel = () => {
        // 1. Prepare data in a user-friendly format
        const dataForExport = filteredLogs.map(log => {
            const user = getUserById(log.userId);
            return {
                Timestamp: new Date(log.timestamp).toLocaleString(),
                User: user ? user.name : 'Unknown User',
                Action: log.action,
            };
        });

        // 2. Create a worksheet from the data
        const worksheet = XLSX.utils.json_to_sheet(dataForExport);
        
        // 3. Set column widths for better readability
        worksheet['!cols'] = [
            { wch: 25 }, // Timestamp column width
            { wch: 25 }, // User column width
            { wch: 80 }, // Action column width
        ];
        
        // 4. Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Log');

        // 5. Trigger the file download
        XLSX.writeFile(workbook, 'ActivityLog.xlsx');
    };

    return (
        <div className="bg-surface rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">{t('user_activity_log')}</h3>
                    <p className="text-sm text-text-secondary">{t('activity_log_desc')}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_by_user_name')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full max-w-xs pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-background text-text-primary placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                    <button
                        onClick={handleExportToExcel}
                        className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        title="Export the currently filtered log to an Excel file"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        {t('export_to_excel')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {filteredLogs.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('user')}</th>
                                <th scope="col" className="px-6 py-3">{t('action')}</th>
                                <th scope="col" className="px-6 py-3">{t('timestamp')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => {
                                const user = getUserById(log.userId);
                                return (
                                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {user ? (
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                                                <span>{user.name}</span>
                                            </div>
                                        ) : (
                                            <span>Unknown User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{log.action}</td>
                                    <td className="px-6 py-4 text-text-secondary">{new Date(log.timestamp).toLocaleString()}</td>
                                </tr>
                                )}
                            )}
                        </tbody>
                    </table>
                ) : (
                     <div className="text-center p-12 text-text-secondary">
                        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="font-semibold mt-4 text-lg text-text-primary">{t('no_activity_found')}</p>
                        <p className="text-sm mt-1">{t('no_activity_matching_search')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogView;