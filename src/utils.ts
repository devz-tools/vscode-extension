import * as vscode from 'vscode';

/**
 * Utility functions for common operations
 */

/**
 * Creates a standardized command handler with error handling
 * @param commandName - Name of the command for error messages
 * @param handler - The actual command handler function
 * @param silent - If true, doesn't show error notifications (logs only)
 * @returns A wrapped command handler with consistent error handling
 */
export function createCommandHandler(
    commandName: string,
    handler: () => Promise<void>,
    silent: boolean = false
): () => Promise<void> {
    return async () => {
        try {
            await handler();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!silent) {
                vscode.window.showErrorMessage(`${commandName} failed: ${errorMessage}`);
            }
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
 * @param silent - If true, doesn't show error notifications (logs only)
 * @returns The result of the operation or undefined if it failed
 */
export async function safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    silent: boolean = false
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        const fullErrorMessage = error instanceof Error ? error.message : String(error);
        if (!silent) {
            vscode.window.showErrorMessage(`${errorMessage}: ${fullErrorMessage}`);
        }
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

/**
 * Shows a notification that auto-dismisses after a specified time
 * @param message - The message to display
 * @param type - The type of notification ('info' | 'warning' | 'error')
 * @param autoHideMs - Time in milliseconds before auto-dismiss (default: 3000)
 * @returns The notification promise
 */
export function showAutoHideNotification(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info',
    autoHideMs: number = 3000
): Thenable<string | undefined> {
    let notificationPromise: Thenable<string | undefined>;

    switch (type) {
        case 'error':
            notificationPromise = vscode.window.showErrorMessage(message);
            break;
        case 'warning':
            notificationPromise = vscode.window.showWarningMessage(message);
            break;
        default:
            notificationPromise = vscode.window.showInformationMessage(message);
            break;
    }

    // Auto-dismiss after specified time for info and warning messages
    if (type !== 'error') {
        setTimeout(() => {
            // Try to dismiss the notification by executing a command
            vscode.commands.executeCommand('workbench.action.closeMessages');
        }, autoHideMs);
    }

    return notificationPromise;
}

/**
 * Shows a status message instead of a notification (less intrusive)
 * @param message - The message to display in status bar
 * @param hideAfterMs - Time in milliseconds before hiding (default: 5000)
 */
export function showStatusMessage(message: string, hideAfterMs: number = 5000): void {
    const disposable = vscode.window.setStatusBarMessage(message, hideAfterMs);
    setTimeout(() => disposable.dispose(), hideAfterMs);
}

/**
 * Shows a notification only when necessary (not for successful routine operations)
 * @param message - The message to display
 * @param type - The type of notification
 * @param showForSuccess - Whether to show notifications for successful operations (default: false)
 */
export function showMeaningfulNotification(
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
    showForSuccess: boolean = false
): void {
    switch (type) {
        case 'success':
            if (showForSuccess) {
                showAutoHideNotification(message, 'info', 2000);
            } else {
                // Use status bar for success messages instead of notifications
                showStatusMessage(`✅ ${message}`, 3000);
            }
            break;
        case 'error':
            vscode.window.showErrorMessage(message);
            break;
        case 'warning':
            showAutoHideNotification(message, 'warning', 4000);
            break;
        case 'info':
            showAutoHideNotification(message, 'info', 3000);
            break;
    }
}