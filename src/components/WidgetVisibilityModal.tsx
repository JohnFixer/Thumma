import React, { useState } from 'react';
import { XMarkIcon, Cog6ToothIcon } from './icons/HeroIcons';
import type { TranslationKey } from '../translations';

interface WidgetConfig {
    id: string;
    title: string;
    defaultVisible: boolean;
}

interface WidgetVisibilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    widgets: WidgetConfig[];
    visibleWidgets: string[];
    onSave: (visibleWidgets: string[]) => void;
    t: (key: TranslationKey) => string;
}

const WidgetVisibilityModal: React.FC<WidgetVisibilityModalProps> = ({
    isOpen,
    onClose,
    widgets,
    visibleWidgets,
    onSave,
    t
}) => {
    const [selectedWidgets, setSelectedWidgets] = useState<string[]>(visibleWidgets);

    const handleToggle = (widgetId: string) => {
        setSelectedWidgets(prev =>
            prev.includes(widgetId)
                ? prev.filter(id => id !== widgetId)
                : [...prev, widgetId]
        );
    };

    const handleSave = () => {
        onSave(selectedWidgets);
        onClose();
    };

    const handleReset = () => {
        const defaultVisible = widgets.filter(w => w.defaultVisible).map(w => w.id);
        setSelectedWidgets(defaultVisible);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Cog6ToothIcon className="h-6 w-6 text-secondary" />
                        <h3 className="text-lg font-semibold text-white">Dashboard Widgets</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-400 mb-4">Select which widgets to display on your dashboard</p>
                    <div className="space-y-3">
                        {widgets.map(widget => (
                            <label
                                key={widget.id}
                                className="flex items-center gap-3 p-3 rounded-md bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedWidgets.includes(widget.id)}
                                    onChange={() => handleToggle(widget.id)}
                                    className="h-4 w-4 rounded border-gray-600 text-secondary focus:ring-secondary focus:ring-offset-gray-800"
                                />
                                <span className="text-white text-sm">{widget.title}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-between gap-3">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    >
                        Reset to Default
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-secondary text-white rounded-md hover:bg-orange-600 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WidgetVisibilityModal;
