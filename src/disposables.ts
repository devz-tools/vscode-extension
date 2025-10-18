import * as vscode from 'vscode';

/**
 * Extension context reference for managing disposables globally
 */
let extensionContext: vscode.ExtensionContext | null = null;

/**
 * Sets the global extension context reference
 * This should be called once during extension activation
 * @param context - The extension context provided by VS Code
 */
export function setExtensionContext(context: vscode.ExtensionContext): void {
    extensionContext = context;
}

/**
 * Clears the global extension context reference
 * This should be called during extension deactivation
 */
export function clearExtensionContext(): void {
    extensionContext = null;
}

/**
 * Helper function to create and register output channels
 * Automatically adds channels to the extension context subscriptions for proper cleanup
 * @param name - The name of the output channel
 * @returns The created output channel
 */
export function createAndRegisterOutputChannel(name: string): vscode.OutputChannel {
    const channel = vscode.window.createOutputChannel(name);
    // Only register with context if it's still available (not during shutdown)
    if (extensionContext) {
        try {
            extensionContext.subscriptions.push(channel);
        } catch (error) {
            // Context may already be disposed - channel will still work but won't be auto-disposed
            console.log(`Warning: Could not register output channel "${name}" with context:`, error);
        }
    }
    return channel;
}
