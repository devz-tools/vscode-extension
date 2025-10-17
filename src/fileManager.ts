import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { getExtensionSettings, getWorkspaceRoot, buildModString } from './config';
import { confirmDestructiveAction } from './utils';

/**
 * Clears old log files from the specified profile directory
 * @param profileDir - The profile directory path to clean
 */
export function clearOldLogs(profileDir: string): void {
    try {
        if (!fs.existsSync(profileDir)) {
            return;
        }

        const files = fs.readdirSync(profileDir);
        const logPatterns = [
            /^script_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/,
            /^DayZServer_x64_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/,
            /^DayZServer_x64_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.ADM$/,
            /^DayZ_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/,  // Client logs
            /^crash_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/,
            /^ErrorMessage_DayZServer_x64_.*\.mdmp$/,
            /^ErrorMessage_DayZ_.*\.mdmp$/  // Client crash dumps
        ];

        let deletedCount = 0;
        files.forEach(file => {
            if (logPatterns.some(pattern => pattern.test(file))) {
                const filePath = path.join(profileDir, file);
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (error) {
                    console.log(`Could not delete ${file}: ${error}`);
                }
            }
        });
    } catch (error) {
        console.log(`Error clearing logs: ${error}`);
    }
}

/**
 * Creates the base mod directory structure
 * Creates out/@ModName/addons directory structure if it doesn't exist
 * @throws Error if directory creation fails
 */
export async function createModBase(): Promise<void> {
    try {
        const settings = getExtensionSettings();
        const repoDir = getWorkspaceRoot();
        const outDir = path.join(repoDir, 'out');
        const modDir = path.join(outDir, `@${settings.modName}`);

        // Create out directory if it doesn't exist
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        // Create mod directory
        if (!fs.existsSync(modDir)) {
            fs.mkdirSync(modDir, { recursive: true });
        }

        // Create addons directory inside mod
        const addonsDir = path.join(modDir, 'addons');
        if (!fs.existsSync(addonsDir)) {
            fs.mkdirSync(addonsDir, { recursive: true });
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create mod base: ${error}`);
        throw error;
    }
}

/**
 * Packs the mod source files into a PBO using DayZ Tools AddonBuilder
 * @throws Error if the packing process fails
 */
export async function packPBO(): Promise<void> {
    try {
        const settings = getExtensionSettings();
        const repoDir = getWorkspaceRoot();
        const srcDir = path.join(repoDir, 'src');
        const outDir = path.join(repoDir, 'out');
        const modDir = path.join(outDir, `@${settings.modName}`);
        const addonsDir = path.join(modDir, 'addons');
        const addonBuilderPath = path.join(settings.dayzToolsDir, 'Bin', 'AddonBuilder', 'AddonBuilder.exe');

        // Ensure addons directory exists
        if (!fs.existsSync(addonsDir)) {
            fs.mkdirSync(addonsDir, { recursive: true });
        }

        const outputPBOPath = path.join(addonsDir, `src.pbo`);

        // Remove existing PBO if it exists
        if (fs.existsSync(outputPBOPath)) {
            fs.unlinkSync(outputPBOPath);
        }

        const args = [
            srcDir,
            addonsDir,
            '-clear',
            '-packonly',
        ];

        console.log('Running AddonBuilder with args:', args);
        console.log('Full command:', addonBuilderPath, args.join(' '));
        console.log('Expected output:', outputPBOPath);

        return new Promise((resolve, reject) => {
            const addonBuilder = spawn(addonBuilderPath, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true,
                cwd: repoDir // Set working directory
            });

            let output = '';
            let errorOutput = '';

            addonBuilder.stdout?.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log('AddonBuilder stdout:', text);
            });

            addonBuilder.stderr?.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                console.log('AddonBuilder stderr:', text);
            });

            addonBuilder.on('close', (code) => {
                console.log(`AddonBuilder exited with code: ${code}`);
                console.log('Full stdout:', output);
                console.log('Full stderr:', errorOutput);

                if (code === 0) {
                    if (fs.existsSync(outputPBOPath)) {
                        vscode.window.showInformationMessage('PBO packed successfully!');
                        resolve();
                    } else {
                        const errorMsg = `PBO packing completed but output file not found at: ${outputPBOPath}`;
                        console.log(errorMsg);
                        vscode.window.showErrorMessage(errorMsg);
                        reject(new Error(errorMsg));
                    }
                } else {
                    const errorMsg = `AddonBuilder failed with exit code: ${code}\nStdout: ${output}\nStderr: ${errorOutput}`;
                    console.log(errorMsg);
                    vscode.window.showErrorMessage(`Failed to pack PBO: ${errorMsg}`);
                    reject(new Error(errorMsg));
                }
            });

            addonBuilder.on('error', (error) => {
                const errorMsg = `Failed to start AddonBuilder: ${error.message}`;
                console.log(errorMsg);
                vscode.window.showErrorMessage(errorMsg);
                reject(new Error(errorMsg));
            });

            // Add a timeout to prevent hanging
            setTimeout(() => {
                if (!addonBuilder.killed) {
                    addonBuilder.kill();
                    reject(new Error('AddonBuilder process timed out after 30 seconds'));
                }
            }, 30000);
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to pack PBO: ${error}`);
        throw error;
    }
}

/**
 * Wipes server data by deleting ServerProfile and ServerStorage directories
 * Requires user confirmation before proceeding
 * @throws Error if deletion fails
 */
export async function wipeServerData(): Promise<void> {
    try {
        // Ask for confirmation
        const confirmed = await confirmDestructiveAction(
            'This will permanently delete ServerProfile and ServerStorage directories. Are you sure?',
            'Yes, Delete Server Data'
        );

        if (!confirmed) {
            return;
        } const repoDir = getWorkspaceRoot();
        const outDir = path.join(repoDir, 'out');
        const serverProfileDir = path.join(outDir, 'ServerProfile');
        const serverStorageDir = path.join(outDir, 'ServerStorage');

        let deletedItems = 0;

        // Wipe ServerProfile
        if (fs.existsSync(serverProfileDir)) {
            fs.rmSync(serverProfileDir, { recursive: true, force: true });
            deletedItems++;
        }

        // Wipe ServerStorage
        if (fs.existsSync(serverStorageDir)) {
            fs.rmSync(serverStorageDir, { recursive: true, force: true });
            deletedItems++;
        }

        vscode.window.showInformationMessage('Server data wiped successfully!');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to wipe server data: ${error}`);
    }
}

/**
 * Wipes client data by deleting the ClientProfile directory
 * Requires user confirmation before proceeding
 * @throws Error if deletion fails
 */
export async function wipeClientData(): Promise<void> {
    try {
        // Ask for confirmation
        const confirmed = await confirmDestructiveAction(
            'This will permanently delete the ClientProfile directory. Are you sure?',
            'Yes, Delete Client Data'
        );

        if (!confirmed) {
            return;
        } const repoDir = getWorkspaceRoot();
        const outDir = path.join(repoDir, 'out');
        const clientProfileDir = path.join(outDir, 'ClientProfile');

        if (fs.existsSync(clientProfileDir)) {
            fs.rmSync(clientProfileDir, { recursive: true, force: true });
        }

        vscode.window.showInformationMessage('Client data wiped successfully!');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to wipe client data: ${error}`);
    }
}