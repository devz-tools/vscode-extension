import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { getExtensionSettings } from './config';
import { ModInfo, ModSummary } from './types';
import { showMeaningfulNotification, showAutoHideNotification } from './utils';
import { createAndRegisterOutputChannel } from './disposables';

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * Opens a directory in the default file explorer
 */
export async function openDirectoryInExplorer(dirPath: string): Promise<void> {
    try {
        // Check if directory exists
        await stat(dirPath);

        // Open directory in Windows Explorer
        await vscode.env.openExternal(vscode.Uri.file(dirPath));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Cannot open directory: ${errorMessage}`);
        throw error;
    }
}

/**
 * Opens the DayZ Client directory
 */
export async function openClientDirectory(): Promise<void> {
    const settings = getExtensionSettings();
    await openDirectoryInExplorer(settings.dayzClientDir);
}

/**
 * Opens the DayZ Server directory
 */
export async function openServerDirectory(): Promise<void> {
    const settings = getExtensionSettings();
    await openDirectoryInExplorer(settings.dayzServerDir);
}

/**
 * Opens the DayZ Tools directory
 */
export async function openToolsDirectory(): Promise<void> {
    const settings = getExtensionSettings();
    await openDirectoryInExplorer(settings.dayzToolsDir);
}

/**
 * Opens the DayZ Project drive directory
 */
export async function openProjectDriveDirectory(): Promise<void> {
    const settings = getExtensionSettings();
    await openDirectoryInExplorer(settings.dayzProjectDir);
}

/**
 * Opens the Steam Workshop directory
 */
export async function openWorkshopDirectory(): Promise<void> {
    const settings = getExtensionSettings();
    await openDirectoryInExplorer(settings.steamWorkshopDir);
}

/**
 * Gets the size of a directory recursively
 */
async function getDirectorySize(dirPath: string): Promise<number> {
    try {
        const stats = await stat(dirPath);

        if (stats.isFile()) {
            return stats.size;
        } else if (stats.isDirectory()) {
            let totalSize = 0;
            const files = await readdir(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                totalSize += await getDirectorySize(filePath);
            }

            return totalSize;
        }

        return 0;
    } catch (error) {
        // If we can't read the directory, return 0
        return 0;
    }
}

/**
 * Formats bytes to human readable format
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Reads the mod name from meta.cpp file in a mod directory
 */
async function getModNameFromMetaFile(modPath: string): Promise<string | null> {
    try {
        const metaPath = path.join(modPath, 'meta.cpp');
        const metaExists = await stat(metaPath).then(() => true).catch(() => false);

        if (!metaExists) {
            return null;
        }

        const metaContent = await promisify(fs.readFile)(metaPath, 'utf8');

        // Parse the name from meta.cpp
        // Look for name = "ModName"; pattern
        const nameMatch = metaContent.match(/name\s*=\s*"([^"]+)"/i);
        if (nameMatch && nameMatch[1]) {
            return nameMatch[1];
        }

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Gets information about a single mod
 */
async function getModInfo(modId: string, modPath: string): Promise<ModInfo> {
    let name = modId;
    let workshopUrl: string | undefined;

    // If it's a numeric ID, it's a workshop mod
    if (/^\d+$/.test(modId)) {
        workshopUrl = `https://steamcommunity.com/sharedfiles/filedetails/?id=${modId}`;

        // Try to get the name from meta.cpp files
        const metaName = await getModNameFromMetaFile(modPath);

        if (metaName) {
            name = metaName;
        } else {
            name = `Workshop Mod ${modId}`;
        }
    } else {
        // For local mods, try to get the name from the directory or meta file
        const metaName = await getModNameFromMetaFile(modPath);

        if (metaName) {
            name = metaName;
        } else {
            // Use the directory name without @ prefix
            name = path.basename(modPath).replace(/^@/, '');
        }
    }

    const size = await getDirectorySize(modPath);

    return {
        id: modId,
        name,
        path: modPath,
        size,
        workshopUrl,
        isWorkshop: /^\d+$/.test(modId)
    };
}

/**
 * Gets information about all additional mods
 */
export async function getModsSummary(): Promise<ModSummary> {
    const settings = getExtensionSettings();
    const mods: ModInfo[] = [];
    let totalSize = 0;

    for (const modId of settings.additionalMods) {
        let modPath: string;

        if (path.isAbsolute(modId)) {
            // It's already a full path
            modPath = modId;
        } else {
            // It's a workshop ID
            modPath = path.join(settings.steamWorkshopDir, modId);
        }

        try {
            // Check if the mod directory exists
            await stat(modPath);

            const modInfo = await getModInfo(modId, modPath);
            mods.push(modInfo);
            totalSize += modInfo.size || 0;
        } catch (error) {
            // Mod doesn't exist, add a placeholder entry
            mods.push({
                id: modId,
                name: `Missing Mod: ${modId}`,
                path: modPath,
                size: 0,
                workshopUrl: /^\d+$/.test(modId) ? `https://steamcommunity.com/sharedfiles/filedetails/?id=${modId}` : undefined,
                isWorkshop: /^\d+$/.test(modId)
            });
        }
    }

    return {
        mods,
        totalSize,
        totalCount: mods.length
    };
}

/**
 * Shows a summary of all mods in a VS Code information message
 */
export async function showModsSummary(): Promise<void> {
    try {
        const summary = await getModsSummary();

        if (summary.totalCount === 0) {
            showAutoHideNotification('No additional mods configured.', 'info', 2000);
            return;
        }

        // Sort mods by size (largest to smallest)
        const sortedMods = [...summary.mods].sort((a, b) => (b.size || 0) - (a.size || 0));

        // Show in an output channel for better readability
        const outputChannel = createAndRegisterOutputChannel('DevZ Mods Summary');
        outputChannel.clear();
        outputChannel.appendLine('='.repeat(50));
        outputChannel.appendLine('DAYZ MODS SUMMARY (Sorted by Size)');
        outputChannel.appendLine('='.repeat(50));
        outputChannel.appendLine('');
        outputChannel.appendLine(`Total Mods: ${summary.totalCount}`);
        outputChannel.appendLine(`Total Size: ${formatBytes(summary.totalSize)}`);
        outputChannel.appendLine('');
        outputChannel.appendLine('Mods (Largest to Smallest):');
        outputChannel.appendLine('-'.repeat(30));

        for (const mod of sortedMods) {
            outputChannel.appendLine(`Name: ${mod.name}`);
            outputChannel.appendLine(`ID: ${mod.id}`);
            outputChannel.appendLine(`Path: ${mod.path}`);
            outputChannel.appendLine(`Size: ${formatBytes(mod.size || 0)}`);
            if (mod.workshopUrl) {
                outputChannel.appendLine(`Workshop: ${mod.workshopUrl}`);
            }
            outputChannel.appendLine('');
        }

        outputChannel.show();

        // Show quick action buttons
        const actions: string[] = [];
        const workshopMods = sortedMods.filter(mod => mod.workshopUrl);

        if (workshopMods.length > 0) {
            actions.push('Open Workshop Links');
        }
        actions.push('Open Workshop Directory');

        if (actions.length > 0) {
            showAutoHideNotification(
                `Found ${summary.totalCount} mods (${formatBytes(summary.totalSize)} total). See output for details.`,
                'info',
                3000
            );
            // Provide action buttons separately if needed
            const action = await vscode.window.showInformationMessage(
                'Mod summary available in output panel. Quick actions:',
                ...actions
            );
            if (action === 'Open Workshop Links') {
                openWorkshopLinksForMods(sortedMods);
            } else if (action === 'Open Workshop Directory') {
                openWorkshopDirectory();
            }
        } else {
            showAutoHideNotification(
                `Found ${summary.totalCount} mods (${formatBytes(summary.totalSize)} total). Check output panel for details.`,
                'info',
                3000
            );
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to get mods summary: ${errorMessage}`);
    }
}

/**
 * Opens workshop links for mods that have them
 */
async function openWorkshopLinksForMods(mods: ModInfo[]): Promise<void> {
    const workshopMods = mods.filter(mod => mod.workshopUrl);

    if (workshopMods.length === 0) {
        showAutoHideNotification('No workshop mods found.', 'info', 2000);
        return;
    }

    const action = await vscode.window.showInformationMessage(
        `Open ${workshopMods.length} workshop page(s) in browser?`,
        'Yes', 'No'
    );

    if (action === 'Yes') {
        for (const mod of workshopMods) {
            if (mod.workshopUrl) {
                await vscode.env.openExternal(vscode.Uri.parse(mod.workshopUrl));
            }
        }
    }
}