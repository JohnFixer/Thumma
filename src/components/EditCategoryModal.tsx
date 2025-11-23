import React, { useState, useEffect } from 'react';
import type { Category, NewCategoryData, Language } from '../types';
import type { TranslationKey } from '../translations';

interface EditCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditCategory: (categoryId: string, categoryData: Partial<NewCategoryData>) => void;
    category: Category | null;
    categories: Category[];
    t: (key: TranslationKey) => string;
    language: Language;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
    isOpen,
    onClose,
    onEditCategory,
    category,
    categories,
    t,
    language
}) => {
    const [nameEn, setNameEn] = useState('');
    const [nameTh, setNameTh] = useState('');
    const [slug, setSlug] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [displayOrder, setDisplayOrder] = useState(0);

    useEffect(() => {
        if (category) {
            setNameEn(category.name.en);
            setNameTh(category.name.th);
            setSlug(category.slug);
            setParentId(category.parentId || '');
            setDisplayOrder(category.displayOrder);
        }
    }, [category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!category || !nameEn.trim() || !nameTh.trim() || !slug.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        // Check for circular reference
        if (parentId === category.id) {
            alert('A category cannot be its own parent');
            return;
        }

        const categoryData: Partial<NewCategoryData> = {
            name: {
                en: nameEn.trim(),
                th: nameTh.trim()
            },
            slug: slug.trim(),
            parentId: parentId || null,
            displayOrder
        };

        onEditCategory(category.id, categoryData);
        onClose();
    };

    // Get only main categories for parent selection, excluding current category and its descendants
    const getAvailableParents = () => {
        if (!category) return [];

        // Find all descendants of current category
        const descendants = new Set<string>();
        const findDescendants = (catId: string) => {
            categories.forEach(c => {
                if (c.parentId === catId) {
                    descendants.add(c.id);
                    findDescendants(c.id);
                }
            });
        };
        findDescendants(category.id);

        // Return main categories that are not the current category or its descendants
        return categories.filter(c =>
            !c.parentId &&
            c.id !== category.id &&
            !descendants.has(c.id)
        );
    };

    const availableParents = getAvailableParents();

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-text-primary">Edit Category</h2>
                    <p className="text-sm text-text-secondary mt-1">Update category information</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            Category Name (English) *
                        </label>
                        <input
                            type="text"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            Category Name (Thai) *
                        </label>
                        <input
                            type="text"
                            value={nameTh}
                            onChange={(e) => setNameTh(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            Slug (URL-friendly identifier) *
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            Parent Category (Optional)
                        </label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">None (Main Category)</option>
                            {availableParents.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name[language]}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-text-secondary mt-1">
                            Cannot select self or descendants as parent
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            Display Order
                        </label>
                        <input
                            type="number"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            min="0"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCategoryModal;
