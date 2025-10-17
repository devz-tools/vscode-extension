import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DevZSettings, ValidationResult } from './types';
import { getExtensionSettings } from './config';

export interface PathValidationResult {
    path: string;
    exists: boolean;
    error?: string;
}

/**
 * Validates all configured paths and settings on startup
 */
export async function validateStartupConfiguration(): Promise<ValidationResult> {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    try {
        const settings = getExtensionSettings();

        // Validate critical paths
        const pathValidations = await validatePaths(settings);

        // Process path validation results
        pathValidations.forEach(validation => {
            if (!validation.exists) {
                result.errors.push(`Path does not exist: ${validation.path}`);
                result.isValid = false;
            }
            if (validation.error) {
                result.errors.push(validation.error);
                result.isValid = false;
            }
        });

        // Validate mod name
        if (!settings.modName || settings.modName.trim() === '') {
            result.errors.push('Mod name is not configured or empty');
            result.isValid = false;
        }

        // Validate additional mods (workshop items)
        const workshopValidation = await validateWorkshopItems(settings);
        result.errors.push(...workshopValidation.errors);
        result.warnings.push(...workshopValidation.warnings);

        if (workshopValidation.errors.length > 0) {
            result.isValid = false;
        }

        // Validate server address format
        if (settings.serverAddress && !isValidServerAddress(settings.serverAddress)) {
            result.warnings.push(`Server address format may be invalid: ${settings.serverAddress}`);
        }

    } catch (error) {
        result.errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
        result.isValid = false;
    }

    return result;
}

/**
 * Validates all configured file paths
 */
async function validatePaths(settings: DevZSettings): Promise<PathValidationResult[]> {
    const validations: PathValidationResult[] = [];

    // DayZ Client Directory
    validations.push(await validatePath(settings.dayzClientDir, 'DayZ Client'));

    // DayZ Server Directory
    validations.push(await validatePath(settings.dayzServerDir, 'DayZ Server'));

    // DayZ Tools Directory
    const toolsValidation = await validatePath(settings.dayzToolsDir, 'DayZ Tools');
    validations.push(toolsValidation);

    // Also check for specific tools if directory exists
    if (toolsValidation.exists) {
        const addonBuilderPath = path.join(settings.dayzToolsDir, 'Bin', 'AddonBuilder', 'AddonBuilder.exe');
        validations.push(await validatePath(addonBuilderPath, 'AddonBuilder.exe'));
    }

    // DayZ Project Directory
    validations.push(await validatePath(settings.dayzProjectDir, 'DayZ Project'));

    // Steam Workshop Directory
    validations.push(await validatePath(settings.steamWorkshopDir, 'Steam Workshop'));

    return validations;
}

/**
 * Validates a single path
 */
async function validatePath(pathToValidate: string, description: string): Promise<PathValidationResult> {
    const result: PathValidationResult = {
        path: pathToValidate,
        exists: false
    };

    try {
        if (!pathToValidate || pathToValidate.trim() === '') {
            result.error = `${description} path is not configured`;
            return result;
        }

        const normalizedPath = path.normalize(pathToValidate);
        result.path = normalizedPath;

        if (fs.existsSync(normalizedPath)) {
            result.exists = true;
        } else {
            result.error = `${description} directory/file not found: ${normalizedPath}`;
        }
    } catch (error) {
        result.error = `Error validating ${description} path: ${error instanceof Error ? error.message : String(error)}`;
    }

    return result;
}

/**
 * Validates workshop items exist on the filesystem
 */
export async function validateWorkshopItems(settings: DevZSettings): Promise<ValidationResult> {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    if (!settings.additionalMods || settings.additionalMods.length === 0) {
        return result;
    }

    for (const mod of settings.additionalMods) {
        const modPath = getModPath(mod, settings.steamWorkshopDir);

        if (!fs.existsSync(modPath)) {
            if (isWorkshopId(mod)) {
                result.errors.push(`Workshop item not found: ${mod} (expected at: ${modPath})`);
                result.isValid = false;
            } else {
                result.errors.push(`Mod directory not found: ${modPath}`);
                result.isValid = false;
            }
        } else {
            // Additional validation for workshop items
            if (isWorkshopId(mod)) {
                const metaFile = path.join(modPath, 'meta.cpp');
                if (!fs.existsSync(metaFile)) {
                    result.warnings.push(`Workshop item ${mod} may be incomplete (no meta.cpp found)`);
                }
            }
        }
    }

    return result;
}

/**
 * Gets the full path for a mod (either workshop ID or direct path)
 */
function getModPath(mod: string, workshopDir: string): string {
    if (path.isAbsolute(mod)) {
        return mod;
    }
    return path.join(workshopDir, mod);
}

/**
 * Checks if a string is a workshop ID (numeric)
 */
function isWorkshopId(mod: string): boolean {
    return /^\d+$/.test(mod.trim());
}

/**
 * Validates server address format
 */
function isValidServerAddress(address: string): boolean {
    // Basic validation for IP:PORT format
    const pattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/;
    const match = address.match(pattern);

    if (!match) {
        return false;
    }

    // Validate IP octets
    const ip = match[1];
    const octets = ip.split('.');
    for (const octet of octets) {
        const num = parseInt(octet, 10);
        if (num < 0 || num > 255) {
            return false;
        }
    }

    // Validate port
    const port = parseInt(match[2], 10);
    return port > 0 && port <= 65535;
}

/**
 * Shows validation results to the user
 */
export function showValidationResults(result: ValidationResult): void {
    if (result.isValid && result.warnings.length === 0) {
        vscode.window.showInformationMessage('✅ All DevZ configuration paths are valid');
        return;
    }

    // Show errors
    if (result.errors.length > 0) {
        const errorMsg = 'DevZ Configuration Errors:\n' + result.errors.map(error => `• ${error}`).join('\n');
        vscode.window.showErrorMessage('❌ DevZ configuration has errors. Check the output panel for details.');

        const outputChannel = vscode.window.createOutputChannel('DevZ Configuration');
        outputChannel.clear();
        outputChannel.appendLine('DevZ Configuration Validation Results');
        outputChannel.appendLine('====================================');
        outputChannel.appendLine('');

        if (result.errors.length > 0) {
            outputChannel.appendLine('ERRORS:');
            result.errors.forEach(error => outputChannel.appendLine(`❌ ${error}`));
            outputChannel.appendLine('');
        }

        if (result.warnings.length > 0) {
            outputChannel.appendLine('WARNINGS:');
            result.warnings.forEach(warning => outputChannel.appendLine(`⚠️ ${warning}`));
        }

        outputChannel.show();
    }

    // Show warnings separately if no errors
    if (result.errors.length === 0 && result.warnings.length > 0) {
        vscode.window.showWarningMessage(`⚠️ DevZ configuration has ${result.warnings.length} warning(s). Check the output panel for details.`);

        const outputChannel = vscode.window.createOutputChannel('DevZ Configuration');
        outputChannel.clear();
        outputChannel.appendLine('DevZ Configuration Warnings');
        outputChannel.appendLine('===========================');
        result.warnings.forEach(warning => outputChannel.appendLine(`⚠️ ${warning}`));
        outputChannel.show();
    }
}