import { ChildProcess } from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';

/**
 * Interface defining the extension's configuration settings
 */
export interface DevZSettings {
    /** Path to the DayZ client installation directory */
    dayzClientDir: string;
    /** Path to the DayZ server installation directory */
    dayzServerDir: string;
    /** Path to the DayZ Tools installation directory */
    dayzToolsDir: string;
    /** Path to the project drive directory (typically P:\) */
    dayzProjectDir: string;
    /** Name of the current mod being developed */
    modName: string;
    /** Server address for client connection (host:port) */
    serverAddress: string;
    /** Array of additional mod paths or Steam Workshop IDs */
    additionalMods: string[];
    /** Path to the Steam Workshop content directory */
    steamWorkshopDir: string;
    /** Whether to enable mod tooltips in configuration files */
    enableModTooltips: boolean;
}

/**
 * Interface representing the global extension state
 */
export interface ExtensionState {
    /** The running DayZ server process, if any */
    serverProcess: ChildProcess | null;
    /** The running DayZ client process, if any */
    clientProcess: ChildProcess | null;
    /** Whether the extension is currently shutting down processes */
    isShuttingDown: boolean;
    /** Output channel for combined DayZ server/client runtime logs (all logs) */
    debugOutputChannel: vscode.OutputChannel | null;
    /** Output channel for Server RPT logs only */
    serverRptOutputChannel?: vscode.OutputChannel | null;
    /** Output channel for Client RPT logs only */
    clientRptOutputChannel?: vscode.OutputChannel | null;
    /** Output channel for Server Script logs only */
    serverScriptLogOutputChannel?: vscode.OutputChannel | null;
    /** Output channel for Client Script logs only */
    clientScriptLogOutputChannel?: vscode.OutputChannel | null;
    /** Output channel for Admin logs only */
    adminLogOutputChannel?: vscode.OutputChannel | null;
    /** Output channel for Server Crash logs only */
    serverCrashLogOutputChannel?: vscode.OutputChannel | null;
    /** Output channel for Client Crash logs only */
    clientCrashLogOutputChannel?: vscode.OutputChannel | null;
    /** File system watchers for log files (supports multiple directories) */
    logWatchers: fs.FSWatcher[];
    /** Output channel for DevZ Tools internal logging and command output */
    toolsOutputChannel: vscode.OutputChannel | null;
    /** Whether log monitoring is currently active */
    logMonitoringActive: boolean;
}

/**
 * Interface for log pattern matching configuration
 */
export interface LogPattern {
    /** Regular expression pattern to match */
    pattern: RegExp;
    /** Type identifier for the pattern */
    type: string;
}

/**
 * Interface containing all status bar items used by the extension
 */
export interface StatusBarItems {
    /** Status bar item for the Pack PBO command */
    packPBO: vscode.StatusBarItem;
    /** Status bar item for the Start Server/Client command */
    startServerAndClient: vscode.StatusBarItem;
    /** Status bar item for the Wipe Server Data command */
    wipeServer: vscode.StatusBarItem;
    /** Status bar item for the Wipe Client Data command */
    wipeClient: vscode.StatusBarItem;
    /** Status bar item for the Mods Summary command */
    modsSummary: vscode.StatusBarItem;
}

/**
 * Interface representing the result of configuration validation
 */
export interface ValidationResult {
    /** Whether the configuration is valid */
    isValid: boolean;
    /** Array of error messages */
    errors: string[];
    /** Array of warning messages */
    warnings: string[];
}

/**
 * Interface representing information about a DayZ mod
 */
export interface ModInfo {
    /** The mod's Steam Workshop ID or local identifier */
    id: string;
    /** Display name of the mod */
    name: string;
    /** File system path to the mod */
    path: string;
    /** Whether this is a Steam Workshop mod */
    isWorkshop: boolean;
    /** Size of the mod in bytes (optional) */
    size?: number;
    /** Steam Workshop URL (optional) */
    workshopUrl?: string;
}

/**
 * Interface for path validation results
 */
export interface PathValidationResult {
    /** The path that was validated */
    path: string;
    /** Whether the path exists */
    exists: boolean;
    /** Error message if validation failed */
    error?: string;
}

/**
 * Interface for mod summary information
 */
export interface ModSummary {
    /** Array of mod information */
    mods: ModInfo[];
    /** Total size of all mods in bytes */
    totalSize: number;
    /** Total number of mods */
    totalCount: number;
}

/**
 * Interface representing flags configuration for a types.xml entry
 */
export interface TypeFlags {
    /** Count items stored in cargo towards nominal/min values */
    count_in_cargo: '0' | '1';
    /** Count items in hoarding containers towards nominal/min values */
    count_in_hoarder: '0' | '1';
    /** Count items on the map towards nominal/min values */
    count_in_map: '0' | '1';
    /** Count items in player inventories towards nominal/min values */
    count_in_player: '0' | '1';
    /** Mark item as player-craftable only */
    crafted: '0' | '1';
    /** Mark item as dynamic event loot */
    deloot: '0' | '1';
}

/**
 * Interface representing a single type entry in types.xml
 */
export interface TypeEntry {
    /** Unique name/identifier for the item */
    name: string;
    /** Target number to maintain on server */
    nominal: number;
    /** Time in seconds before item despawns */
    lifetime: number;
    /** Minimum time in seconds before item can respawn */
    restock: number;
    /** Minimum number that should always be present */
    min: number;
    /** Minimum quantity for fillable items (-1 for non-fillable) */
    quantmin: number;
    /** Maximum quantity for fillable items (-1 for non-fillable) */
    quantmax: number;
    /** Weighting value for spawn probability */
    cost: number;
    /** Flag configuration */
    flags: TypeFlags;
    /** Item category (e.g., weapons, food, tools) */
    category: string;
    /** Array of tag names for spawn filtering */
    tags: string[];
    /** Array of usage contexts (e.g., Military, Town) */
    usages: string[];
    /** Array of value tiers (e.g., Tier1, Tier2) */
    values: string[];
}

/**
 * Interface for the complete types.xml document
 */
export interface TypesDocument {
    /** Array of all type entries */
    types: TypeEntry[];
}