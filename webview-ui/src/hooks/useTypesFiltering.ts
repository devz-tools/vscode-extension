/**
 * Custom hook for filtering and sorting types
 * Encapsulates the logic for search, filter, and sort operations
 */
import { useMemo } from 'react';
import { TypeEntry, SortField, SortDirection } from '../types/types';

interface UseTypesFilteringParams {
    /** All type entries */
    types: TypeEntry[];
    /** Current search term */
    searchTerm: string;
    /** Category filter */
    filterCategory: string;
    /** Tier filter */
    filterTier: string;
    /** Sort field */
    sortField: SortField;
    /** Sort direction */
    sortDirection: SortDirection;
}

/**
 * Filters and sorts type entries based on search, filter, and sort criteria
 * @param params - Filtering and sorting parameters
 * @returns Filtered and sorted array of type entries
 */
export const useTypesFiltering = ({
    types,
    searchTerm,
    filterCategory,
    filterTier,
    sortField,
    sortDirection
}: UseTypesFilteringParams): TypeEntry[] => {
    return useMemo(() => {
        // Apply filters
        const filtered = types.filter(type => {
            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchName = type.name.toLowerCase().includes(term);
                const matchCategory = type.category.toLowerCase().includes(term);
                const matchUsage = type.usages.some(u => u.toLowerCase().includes(term));
                const matchValue = type.values.some(v => v.toLowerCase().includes(term));

                if (!matchName && !matchCategory && !matchUsage && !matchValue) {
                    return false;
                }
            }

            // Category filter
            if (filterCategory && type.category !== filterCategory) {
                return false;
            }

            // Tier filter
            if (filterTier && !type.values.includes(filterTier)) {
                return false;
            }

            return true;
        });

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            let compareValue = 0;

            switch (sortField) {
                case 'name':
                    compareValue = a.name.localeCompare(b.name);
                    break;
                case 'nominal':
                    compareValue = a.nominal - b.nominal;
                    break;
                case 'min':
                    compareValue = a.min - b.min;
                    break;
                case 'lifetime':
                    compareValue = a.lifetime - b.lifetime;
                    break;
                case 'restock':
                    compareValue = a.restock - b.restock;
                    break;
                case 'category':
                    compareValue = a.category.localeCompare(b.category);
                    break;
                case 'cost':
                    compareValue = a.cost - b.cost;
                    break;
                default:
                    compareValue = 0;
            }

            return sortDirection === 'asc' ? compareValue : -compareValue;
        });

        return sorted;
    }, [types, searchTerm, filterCategory, filterTier, sortField, sortDirection]);
};
