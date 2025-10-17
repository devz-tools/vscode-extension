import * as vscode from 'vscode';
import * as path from 'path';
import { DevZSettings } from './types';

// Function to get current extension settings
export function getExtensionSettings(): DevZSettings {
    const config = vscode.workspace.getConfiguration('devz-tools');

    return {
        dayzClientDir: config.get('dayzClientDir', 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ'),
        dayzServerDir: config.get('dayzServerDir', 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZServer'),
        dayzToolsDir: config.get('dayzToolsDir', 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ Tools'),
        dayzProjectDir: config.get('dayzProjectDir', 'P:\\'),
        modName: config.get('modName', 'MyMod'),
        serverAddress: config.get('serverAddress', '127.0.0.1:2302'),
        additionalMods: config.get('additionalMods', []),
        steamWorkshopDir: config.get('steamWorkshopDir', 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\221100'),
        enableModTooltips: config.get('enableModTooltips', true),
    };
}

// Helper function to get workspace root directory
export function getWorkspaceRoot(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
    }
    return workspaceFolders[0].uri.fsPath;
}

// Function to build mod string for DayZ
export function buildModString(settings: DevZSettings, repoDir: string): string {
    const outDir = path.join(repoDir, 'out');
    const modDir = path.join(outDir, `@${settings.modName}`);

    let mods = [modDir];

    // Add additional mods from settings
    if (settings.additionalMods && settings.additionalMods.length > 0) {
        const additionalModPaths = settings.additionalMods.map(mod => {
            // If it's already a full path, use it as is
            if (path.isAbsolute(mod)) {
                return mod;
            }
            // Otherwise, treat it as a mod ID and construct the path
            return path.join(settings.steamWorkshopDir, mod);
        });
        mods = mods.concat(additionalModPaths);
    }

    return mods.join(';');
}