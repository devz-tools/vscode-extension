/**
 * Type definitions for the Types Editor
 * These interfaces define the structure of DayZ types.xml data
 */

/**
 * Flag settings for a type entry
 * Each flag is represented as '0' or '1'
 */
export interface TypeFlags {
    /** Count items inside containers/vehicles */
    count_in_cargo: '0' | '1';
    /** Count items in stashes */
    count_in_hoarder: '0' | '1';
    /** Count items spawned on the map */
    count_in_map: '0' | '1';
    /** Count items in player inventory */
    count_in_player: '0' | '1';
    /** Item can be crafted */
    crafted: '0' | '1';
    /** Exclude from loot spawning */
    deloot: '0' | '1';
}

/**
 * A single type entry in the types.xml file
 * Represents configuration for one item type in DayZ
 */
export interface TypeEntry {
    /** Unique identifier for the item type */
    name: string;
    /** Target number of this item to spawn in the world */
    nominal: number;
    /** Time in seconds before item despawns */
    lifetime: number;
    /** Time in seconds between respawn checks */
    restock: number;
    /** Minimum number of items to maintain */
    min: number;
    /** Minimum stack quantity (-1 for N/A) */
    quantmin: number;
    /** Maximum stack quantity (-1 for N/A) */
    quantmax: number;
    /** Economy cost/priority value */
    cost: number;
    /** Configuration flags */
    flags: TypeFlags;
    /** Item category (e.g., "weapons", "tools", "food") */
    category: string;
    /** Optional tags for additional classification */
    tags: string[];
    /** Usage locations (e.g., "Military", "Police", "Farm") */
    usages: string[];
    /** Tier values for loot distribution (e.g., "Tier1", "Tier2") */
    values: string[];
}

/**
 * The complete types.xml document structure
 */
export interface TypesDocument {
    /** Array of all type entries in the document */
    types: TypeEntry[];
}

/**
 * Sort direction for type entries
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Fields that can be sorted
 */
export type SortField = 'name' | 'nominal' | 'min' | 'lifetime' | 'restock' | 'category' | 'cost';

/**
 * Fields that can be bulk edited
 */
export type BulkEditField =
    | 'nominal'
    | 'lifetime'
    | 'restock'
    | 'min'
    | 'cost'
    | 'category'
    | 'addUsage'
    | 'removeUsage'
    | 'addValue'
    | 'removeValue';
