/**
 * Custom hook for pagination logic
 * Manages pagination state and calculations
 */
import { useMemo } from 'react';
import { TypeEntry } from '../types/types';

interface UseTypesPaginationParams {
    /** Filtered types to paginate */
    filteredTypes: TypeEntry[];
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Number of items per page */
    itemsPerPage: number;
}

interface PaginationResult {
    /** Types to display on current page */
    paginatedTypes: TypeEntry[];
    /** Total number of pages */
    totalPages: number;
    /** Start index of current page (0-indexed) */
    startIndex: number;
    /** End index of current page (exclusive) */
    endIndex: number;
}

/**
 * Calculates pagination for a list of types
 * @param params - Pagination parameters
 * @returns Pagination result with current page items and metadata
 */
export const useTypesPagination = ({
    filteredTypes,
    currentPage,
    itemsPerPage
}: UseTypesPaginationParams): PaginationResult => {
    return useMemo(() => {
        const total = filteredTypes.length;
        const pages = Math.ceil(total / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, total);
        const paginated = filteredTypes.slice(start, end);

        return {
            paginatedTypes: paginated,
            totalPages: pages,
            startIndex: start,
            endIndex: end
        };
    }, [filteredTypes, currentPage, itemsPerPage]);
};
