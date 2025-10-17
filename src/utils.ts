import * as vscode from 'vscode';

/**
 * Utility functions for common operations
 */

/**
 * Creates a standardized command handler with error handling
 * @param commandName - Name of the command for error messages
 * @param handler - The actual command handler function
 * @returns A wrapped command handler with consistent error handling
 */
export function createCommandHandler(
    commandName: string,
    handler: () => Promise<void>
): () => Promise<void> {
    return async () => {
        try {
            await handler();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`${commandName} failed: ${errorMessage}`);
            console.error(`${commandName} error:`, error);
        }
    };
}

/**
 * Creates a standardized async command handler with error handling that doesn't show errors
 * (for cases where the underlying function already handles error display)
 * @param handler - The actual command handler function
 * @returns A wrapped command handler with silent error handling
 */
export function createSilentCommandHandler(handler: () => Promise<void>): () => Promise<void> {
    return async () => {
        try {
            await handler();
        } catch (error) {
            // Error already handled in the underlying function
            console.error('Command error:', error);
        }
    };
}

/**
 * Formats bytes into a human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Safely executes an async operation with error handling
 * @param operation - The async operation to execute
 * @param errorMessage - The error message to show if the operation fails
 * @returns The result of the operation or undefined if it failed
 */
export async function safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        const fullErrorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`${errorMessage}: ${fullErrorMessage}`);
        console.error(errorMessage, error);
        return undefined;
    }
}

/**
 * Creates a confirmation dialog for destructive operations
 * @param message - The warning message to display
 * @param confirmText - The text for the confirm button
 * @returns True if the user confirmed, false otherwise
 */
export async function confirmDestructiveAction(
    message: string,
    confirmText: string = 'Yes'
): Promise<boolean> {
    const confirmation = await vscode.window.showWarningMessage(
        message,
        { modal: true },
        confirmText
    );
    return confirmation === confirmText;
}

/**
 * Delays execution for the specified number of milliseconds
 * @param ms - Number of milliseconds to delay
 * @returns A promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}