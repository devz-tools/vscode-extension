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
    /** Output channel for logging server/client output */
    logOutputChannel: vscode.OutputChannel | null;
    /** File system watcher for log files */
    logWatcher: fs.FSWatcher | null;
    /** Global output channel for general extension logging */
    globalLogChannel: vscode.OutputChannel | null;
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