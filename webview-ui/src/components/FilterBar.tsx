/**
 * FilterBar Component
 * Search, filter, and sort controls for the types list
 */
import React from 'react';
import { VscodeTextfield } from '@vscode-elements/react-elements';
import { SortField, SortDirection } from '../types/types';

interface FilterBarProps {
    /** Current search term */
    searchTerm: string;
    /** Callback when search term changes */
    onSearchChange: (term: string) => void;
    /** Current category filter */
    filterCategory: string;
    /** Callback when category filter changes */
    onCategoryChange: (category: string) => void;
    /** Current tier filter */
    filterTier: string;
    /** Callback when tier filter changes */
    onTierChange: (tier: string) => void;
    /** Current sort field */
    sortField: SortField;
    /** Callback when sort field changes */
    onSortFieldChange: (field: SortField) => void;
    /** Current sort direction */
    sortDirection: SortDirection;
    /** Callback when sort direction changes */
    onSortDirectionChange: (direction: SortDirection) => void;
    /** Available categories for filter dropdown */
    availableCategories: string[];
    /** Available tiers for filter dropdown */
    availableTiers: string[];
}

/**
 * Comprehensive filter and sort controls for the types list
 * Includes search, category/tier filters, and sort field/direction
 */
const FilterBar: React.FC<FilterBarProps> = ({
    searchTerm,
    onSearchChange,
    filterCategory,
    onCategoryChange,
    filterTier,
    onTierChange,
    sortField,
    onSortFieldChange,
    sortDirection,
    onSortDirectionChange,
    availableCategories,
    availableTiers
}) => {
    return (
        <>
            {/* Search and Filters */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <VscodeTextfield
                    value={searchTerm}
                    onInput={(e: any) => onSearchChange(e.target.value)}
                    placeholder="Search by name, category, tier..."
                >
                    🔍 Search
                </VscodeTextfield>

                <div>
                    <label className="block text-sm mb-1 opacity-70">Category Filter</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                    >
                        <option value="">All Categories</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm mb-1 opacity-70">Tier Filter</label>
                    <select
                        value={filterTier}
                        onChange={(e) => onTierChange(e.target.value)}
                        className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                    >
                        <option value="">All Tiers</option>
                        {availableTiers.map(tier => (
                            <option key={tier} value={tier}>{tier}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm mb-1 opacity-70">Sort By</label>
                    <select
                        value={sortField}
                        onChange={(e) => onSortFieldChange(e.target.value as SortField)}
                        className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                    >
                        <option value="name">Name</option>
                        <option value="nominal">Nominal</option>
                        <option value="min">Min</option>
                        <option value="lifetime">Lifetime</option>
                        <option value="restock">Restock</option>
                        <option value="category">Category</option>
                        <option value="cost">Cost</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm mb-1 opacity-70">Sort Direction</label>
                    <select
                        value={sortDirection}
                        onChange={(e) => onSortDirectionChange(e.target.value as SortDirection)}
                        className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                    >
                        <option value="asc">↑ Ascending</option>
                        <option value="desc">↓ Descending</option>
                    </select>
                </div>
            </div>
        </>
    );
};

export default FilterBar;
