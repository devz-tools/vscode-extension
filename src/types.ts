import { ChildProcess } from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';

// Interface to define our extension settings
export interface DevZSettings {
    dayzClientDir: string;
    dayzServerDir: string;
    dayzToolsDir: string;
    dayzProjectDir: string;
    modName: string;
    serverAddress: string;
    additionalMods: string[];
    steamWorkshopDir: string;
    enableModTooltips: boolean;
}

// Global state interface
export interface ExtensionState {
    serverProcess: ChildProcess | null;
    clientProcess: ChildProcess | null;
    isShuttingDown: boolean;
    logOutputChannel: vscode.OutputChannel | null;
    logWatcher: fs.FSWatcher | null;
    globalLogChannel: vscode.OutputChannel | null;
    logMonitoringActive: boolean;
}

// Log pattern interface
export interface LogPattern {
    pattern: RegExp;
    type: string;
}

// Status bar items interface
export interface StatusBarItems {
    packPBO: vscode.StatusBarItem;
    startServerAndClient: vscode.StatusBarItem;
    wipeServer: vscode.StatusBarItem;
    wipeClient: vscode.StatusBarItem;
    modsSummary: vscode.StatusBarItem;
}

// Validation result interface
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Mod information interface
export interface ModInfo {
    id: string;
    name: string;
    path: string;
    isWorkshop: boolean;
}