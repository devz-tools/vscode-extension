import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { getExtensionSettings, getWorkspaceRoot, buildModString } from './config';
import { confirmDestructiveAction, showMeaningfulNotification } from './utils';

/**
 * Clears old log files from the specified profile directory
 * @param profileDir - The profile directory path to clean
 * @param debugOutputChannel - Optional debug output channel to clear
 * @returns Number of files successfully deleted
 */
export function clearOldLogs(profileDir: string, debugOutputChannel?: vscode.OutputChannel): number {
    try {
        if (!fs.existsSync(profileDir)) {
            console.log(`Profile directory does not exist: ${profileDir}`);
            return 0;
        }

        const files = fs.readdirSync(profileDir);
        const logPatterns = [
            /^script_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/,
            /^DayZServer_x64_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/,
            /^DayZServer_x64_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.ADM$/,
            /^DayZ_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/,  // Client logs
            /^DayZ_x64_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/,  // Client logs
            /^DayZ_BE_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/,  // Client BattleEye logs
            /^crash_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/,
            /^ErrorMessage_DayZServer_x64_.*\.mdmp$/,
            /^ErrorMessage_DayZ_.*\.mdmp$/  // Client crash dumps
        ];

        let deletedCount = 0;
        let failedCount = 0;
        const failedFiles: string[] = [];

        files.forEach(file => {
            if (logPatterns.some(pattern => pattern.test(file))) {
                const filePath = path.join(profileDir, file);
                try {
                    // Check if file is accessible before attempting deletion
                    fs.accessSync(filePath, fs.constants.W_OK);
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`Deleted old log file: ${file}`);
                } catch (error) {
                    failedCount++;
                    failedFiles.push(file);
                    console.log(`Could not delete ${file}: ${error}`);
                }
            }
        });

        if (deletedCount > 0) {
            console.log(`Successfully deleted ${deletedCount} old log file(s) from ${profileDir}`);
        }

        if (failedCount > 0) {
            console.log(`Warning: Failed to delete ${failedCount} log file(s) (may be locked by running processes): ${failedFiles.join(', ')}`);
        }

        // Clear the debug output channel if provided
        if (debugOutputChannel) {
            debugOutputChannel.clear();
        }

        return deletedCount;
    } catch (error) {
        console.log(`Error clearing logs from ${profileDir}: ${error}`);
        return 0;
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
                        showMeaningfulNotification('PBO packed successfully!', 'success');
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

        showMeaningfulNotification('Server data wiped successfully!', 'success');
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
        }

        const repoDir = getWorkspaceRoot();
        const outDir = path.join(repoDir, 'out');
        const clientProfileDir = path.join(outDir, 'ClientProfile');

        if (fs.existsSync(clientProfileDir)) {
            fs.rmSync(clientProfileDir, { recursive: true, force: true });
        }

        showMeaningfulNotification('Client data wiped successfully!', 'success');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to wipe client data: ${error}`);
    }
}

/**
 * Initializes a DayZ mod boilerplate by cloning from the official repository
 * This will clone the main branch of devz-tools/mod-boilerplate into the current workspace
 * @throws Error if initialization fails or workspace is not empty
 */
export async function initializeModBoilerplate(): Promise<void> {
    const workspaceRoot = getWorkspaceRoot();
    const boilerplateRepo = 'https://github.com/devz-tools/mod-boilerplate';

    // Check if workspace is valid
    if (!workspaceRoot) {
        throw new Error('No workspace folder found. Please open a folder first.');
    }

    // Check what files exist in the workspace
    const files = fs.readdirSync(workspaceRoot);
    const nonGitFiles = files.filter(f => !f.startsWith('.git') && f !== 'README.md');

    if (nonGitFiles.length > 0) {
        const confirmed = await confirmDestructiveAction(
            `This will overwrite existing files in the workspace. Found: ${nonGitFiles.join(', ')}. Continue?`,
            'Yes, Initialize'
        );

        if (!confirmed) {
            return;
        }
    } else {
        const confirmed = await confirmDestructiveAction(
            'This will initialize the DayZ mod boilerplate in this workspace. Any existing README.md will be overwritten. Continue?',
            'Yes, Initialize'
        );

        if (!confirmed) {
            return;
        }
    }

    // Clone the repository to a temporary directory
    const tempDir = path.join(workspaceRoot, '.temp-boilerplate');

    try {
        // Remove temp directory if it already exists from a previous failed attempt
        if (fs.existsSync(tempDir)) {
            await removeTempDirectoryWithRetry(tempDir);
        }

        // Clone the repository
        await new Promise<void>((resolve, reject) => {
            const gitClone = spawn('git', [
                'clone',
                '--branch', 'main',
                '--single-branch',
                '--depth', '1',
                boilerplateRepo,
                tempDir
            ], {
                cwd: workspaceRoot,
                shell: true
            });

            let errorOutput = '';

            gitClone.stderr?.on('data', (data) => {
                errorOutput += data.toString();
                console.log(data.toString());
            });

            gitClone.stdout?.on('data', (data) => {
                console.log(data.toString());
            });

            gitClone.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Git clone failed with code ${code}: ${errorOutput}`));
                }
            });

            gitClone.on('error', (error) => {
                reject(new Error(`Failed to execute git: ${error.message}`));
            });
        });

        // Wait a bit to ensure git process has fully released file handles
        await new Promise(resolve => setTimeout(resolve, 500));

        // Copy all files from temp directory to workspace root
        const filesToCopy = fs.readdirSync(tempDir);

        for (const file of filesToCopy) {
            // Skip .git directory from the cloned repo
            if (file === '.git') {
                continue;
            }

            const sourcePath = path.join(tempDir, file);
            const destPath = path.join(workspaceRoot, file);

            // Remove destination if it exists
            if (fs.existsSync(destPath)) {
                const stat = fs.statSync(destPath);
                if (stat.isDirectory()) {
                    fs.rmSync(destPath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(destPath);
                }
            }

            // Copy file or directory
            const stat = fs.statSync(sourcePath);
            if (stat.isDirectory()) {
                copyDirectoryRecursive(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        }

        // Clean up temp directory with retry logic
        await removeTempDirectoryWithRetry(tempDir);

        showMeaningfulNotification('DayZ mod boilerplate initialized successfully!', 'success', true);

    } catch (error) {
        // Clean up temp directory if it exists - use retry logic
        if (fs.existsSync(tempDir)) {
            try {
                await removeTempDirectoryWithRetry(tempDir);
            } catch (cleanupError) {
                console.error('Failed to clean up temp directory:', cleanupError);
                // Don't throw this error, just log it
            }
        }
        throw error;
    }
}

/**
 * Removes a temporary directory with retry logic to handle locked files
 * @param dirPath - Path to the directory to remove
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @param retryDelay - Delay between retries in milliseconds (default: 1000)
 * @throws Error if directory cannot be removed after all retries
 */
async function removeTempDirectoryWithRetry(
    dirPath: string,
    maxRetries: number = 5,
    retryDelay: number = 1000
): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Try to remove the directory
            fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3 });
            return; // Success!
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // If it's the last attempt, throw the error
            if (attempt === maxRetries) {
                break;
            }

            // Wait before retrying
            console.log(`Failed to remove temp directory (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));

            // Increase delay for next attempt
            retryDelay *= 1.5;
        }
    }

    // If we get here, all retries failed
    throw new Error(`Failed to remove temporary directory after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Recursively copies a directory from source to destination
 * @param source - Source directory path
 * @param destination - Destination directory path
 */
function copyDirectoryRecursive(source: string, destination: string): void {
    // Create destination directory
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    // Read all files/folders in source
    const files = fs.readdirSync(source);

    for (const file of files) {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
            copyDirectoryRecursive(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}