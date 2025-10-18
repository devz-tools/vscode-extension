/**
 * Custom hook for extracting unique values from types document
 * Provides categories, tiers, and usages for filters and selections
 */
import { useMemo } from 'react';
import { TypesDocument } from '../types/types';

interface DocumentMetadata {
    /** Unique categories from all types */
    categories: string[];
    /** Unique tier values from all types */
    tiers: string[];
    /** Unique usage values from all types */
    usages: string[];
}

/**
 * Extracts and sorts unique categories, tiers, and usages from the document
 * @param document - The types document to analyze
 * @returns Sorted arrays of unique values
 */
export const useDocumentMetadata = (document: TypesDocument | null): DocumentMetadata => {
    return useMemo(() => {
        if (!document) {
            return { categories: [], tiers: [], usages: [] };
        }

        const cats = new Set<string>();
        const tierSet = new Set<string>();
        const usageSet = new Set<string>();

        document.types.forEach(type => {
            if (type.category) {
                cats.add(type.category);
            }
            type.values.forEach(v => tierSet.add(v));
            type.usages.forEach(u => usageSet.add(u));
        });

        return {
            categories: Array.from(cats).sort(),
            tiers: Array.from(tierSet).sort(),
            usages: Array.from(usageSet).sort()
        };
    }, [document]);
};
