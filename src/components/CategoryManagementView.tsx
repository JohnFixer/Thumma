import React, { useState, useMemo } from 'react';
import type { Category, User, Language } from '../types';
import type { TranslationKey } from '../translations';
import { PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon } from './icons/HeroIcons';
import ConfirmationModal from './ConfirmationModal';

interface CategoryManagementViewProps {
    categories: Category[];
    currentUser: User;
    onAddCategory: () => void;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
    t: (key: TranslationKey) => string;
    language: Language;
}

const CategoryManagementView: React.FC<CategoryManagementViewProps> = ({
    categories,
    currentUser,
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    t,
    language
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    // Organize categories into hierarchy
    const { mainCategories, subCategoriesByParent } = useMemo(() => {
        const main = categories.filter(c => !c.parentId).sort((a, b) => a.displayOrder - b.displayOrder);
        const subsByParent: Record<string, Category[]> = {};

        categories.forEach(category => {
            if (category.parentId) {
                if (!subsByParent[category.parentId]) {
                    subsByParent[category.parentId] = [];
                }
                subsByParent[category.parentId].push(category);
            }
        });

        // Sort sub-categories by display order
        Object.keys(subsByParent).forEach(parentId => {
            subsByParent[parentId].sort((a, b) => a.displayOrder - b.displayOrder);
        });

        return { mainCategories: main, subCategoriesByParent: subsByParent };
    }, [categories]);

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category);
    };

    const handleConfirmDelete = () => {
        if (categoryToDelete) {
            onDeleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
        }
    };

    const renderCategory = (category: Category, isSubCategory: boolean = false) => {
        const hasSubCategories = subCategoriesByParent[category.id]?.length > 0;
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div key={category.id} className={isSubCategory ? 'ml-8' : ''}>
                <div className="flex items-center justify-between p-4 bg-white border-b hover:bg-gray-50 group">
                    <div className="flex items-center gap-3 flex-1">
                        {hasSubCategories && !isSubCategory && (
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                                ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                                )}
                            </button>
                        )}
                        {!hasSubCategories && !isSubCategory && <div className="w-6" />}

                        <div className="flex-1">
                            <h4 className={`font-semibold ${isSubCategory ? 'text-sm' : 'text-base'} text-text-primary`}>
                                {category.name[language]}
                            </h4>
                            <p className="text-xs text-text-secondary">
                                {language === 'en' ? category.name.th : category.name.en} • {category.slug}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEditCategory(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            title={t('edit')}
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleDeleteClick(category)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title={t('delete')}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {hasSubCategories && isExpanded && (
                    <div className="bg-gray-50">
                        {subCategoriesByParent[category.id].map(subCat => renderCategory(subCat, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                <div className="bg-surface rounded-lg shadow">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Category Management</h2>
                            <p className="text-sm text-text-secondary mt-1">
                                Manage product categories and sub-categories
                            </p>
                        </div>
                        <button
                            onClick={onAddCategory}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Add Category</span>
                        </button>
                    </div>

                    <div className="divide-y">
                        {mainCategories.length > 0 ? (
                            mainCategories.map(category => renderCategory(category))
                        ) : (
                            <div className="p-12 text-center text-text-secondary">
                                <p className="font-semibold text-lg">No categories yet</p>
                                <p className="text-sm mt-1">Click "Add Category" to create your first category</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${categoryToDelete?.name[language]}"? This action cannot be undone.`}
                t={t}
            />
        </>
    );
};

export default CategoryManagementView;
