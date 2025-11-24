import React, { useState, useEffect } from 'react';
import type { Category, NewCategoryData, Language } from '../types';
import type { TranslationKey } from '../translations';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCategory: (categoryData: NewCategoryData) => void;
    categories: Category[];
    t: (key: TranslationKey) => string;
    language: Language;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
    isOpen,
    onClose,
    onAddCategory,
    categories,
    t,
    language
}) => {
    const [nameEn, setNameEn] = useState('');
    const [nameTh, setNameTh] = useState('');
    const [slug, setSlug] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setNameEn('');
            setNameTh('');
            setSlug('');
            setParentId('');
            setDisplayOrder(0);
            setAutoGenerateSlug(true);
        }
    }, [isOpen]);

    useEffect(() => {
        if (autoGenerateSlug && nameEn) {
            // Auto-generate slug from English name
            const generatedSlug = nameEn
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_|_$/g, '');
            setSlug(generatedSlug);
        }
    }, [nameEn, autoGenerateSlug]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!nameEn.trim() || !nameTh.trim() || !slug.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        const categoryData: NewCategoryData = {
            name: {
                en: nameEn.trim(),
                th: nameTh.trim()
            },
            slug: slug.trim(),
            parentId: parentId || null,
            displayOrder
        };

        onAddCategory(categoryData);
        onClose();
    };

    // Get only main categories for parent selection
    const mainCategories = categories.filter(c => !c.parentId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-text-primary">{t('add_new_category')}</h2>
                    <p className="text-sm text-text-secondary mt-1">{t('create_category_desc')}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            {t('category_name_english')} *
                        </label>
                        <input
                            type="text"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder={t('category_name_en_placeholder')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            {t('category_name_thai')} *
                        </label>
                        <input
                            type="text"
                            value={nameTh}
                            onChange={(e) => setNameTh(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder={t('category_name_th_placeholder')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            {t('slug_label')} *
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setAutoGenerateSlug(false);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                            placeholder={t('slug_placeholder')}
                            required
                        />
                        <p className="text-xs text-text-secondary mt-1">
                            {t('slug_helper')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            {t('parent_category_optional')}
                        </label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">{t('none_main_category')}</option>
                            {mainCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name[language]}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-text-secondary mt-1">
                            {t('select_parent_desc')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            {t('display_order')}
                        </label>
                        <input
                            type="number"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            min="0"
                        />
                        <p className="text-xs text-text-secondary mt-1">
                            {t('display_order_helper')}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800"
                        >
                            {t('add_category')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCategoryModal;
