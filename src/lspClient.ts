import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

/**
 * Activates the Enforce Script Language Server Protocol (LSP) client
 * 
 * This function initializes and starts the LSP server for Enforce Script,
 * providing features like:
 * - Syntax diagnostics and error detection
 * - IntelliSense auto-completion
 * - Hover information for symbols
 * - Go to definition
 * - Find references
 * - Document symbols and outline
 * - Signature help
 * - Code folding
 * 
 * @param context - The VS Code extension context
 * @returns Promise that resolves when the LSP client is ready
 */
export async function activateLspClient(context: vscode.ExtensionContext): Promise<void> {
    // Get the path to the LSP server executable
    const serverExecutable = getLspServerExecutable(context);

    if (!serverExecutable) {
        vscode.window.showWarningMessage(
            'Enforce Script LSP server not found. Language features will be limited. ' +
            'Please build the LSP server by running "cargo build --release" in the enforce-script-lsp directory.'
        );
        return;
    }

    // Server options - how to launch the LSP server
    const serverOptions: ServerOptions = {
        run: {
            command: serverExecutable,
            transport: TransportKind.stdio
        },
        debug: {
            command: serverExecutable,
            transport: TransportKind.stdio,
            options: {
                env: {
                    ...process.env,
                    RUST_LOG: 'debug'
                }
            }
        }
    };

    // Client options - LSP configuration
    const clientOptions: LanguageClientOptions = {
        // Register the server for Enforce Script files
        documentSelector: [
            {
                scheme: 'file',
                language: 'enforcescript'
            }
        ],
        synchronize: {
            // Notify the server about file changes to .c and .cpp files
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{c,cpp}')
        },
        outputChannelName: 'Enforce Script LSP',
        revealOutputChannelOn: 2 // RevealOutputChannelOn.Warning
    };

    // Create and start the language client
    client = new LanguageClient(
        'enforceScriptLsp',
        'Enforce Script Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client - this will also launch the server
    try {
        await client.start();
        console.log('Enforce Script LSP client started successfully');
    } catch (error) {
        console.error('Failed to start Enforce Script LSP client:', error);
        vscode.window.showErrorMessage(
            `Failed to start Enforce Script Language Server: ${error instanceof Error ? error.message : String(error)}`
        );
    }

    // Register for disposal when extension is deactivated
    context.subscriptions.push({
        dispose: () => deactivateLspClient()
    });
}

/**
 * Deactivates the LSP client and stops the language server
 * @returns Promise that resolves when the client is stopped
 */
export async function deactivateLspClient(): Promise<void> {
    if (client) {
        console.log('Stopping Enforce Script LSP client...');
        await client.stop();
        client = undefined;
    }
}

/**
 * Gets the path to the LSP server executable
 * 
 * Looks for the compiled binary in the enforce-script-lsp submodule:
 * - Windows: enforce-script-lsp/target/release/enforce-script-lsp.exe
 * - Unix: enforce-script-lsp/target/release/enforce-script-lsp
 * 
 * @param context - The VS Code extension context
 * @returns Path to the executable, or undefined if not found
 */
function getLspServerExecutable(context: vscode.ExtensionContext): string | undefined {
    // Get the extension's root directory
    const extensionPath = context.extensionPath;

    // Determine the executable name based on platform
    const exeName = process.platform === 'win32'
        ? 'enforce-script-lsp.exe'
        : 'enforce-script-lsp';

    // Path to the LSP server executable
    const serverPath = path.join(
        extensionPath,
        'enforce-script-lsp',
        'target',
        'release',
        exeName
    );

    // Check if the executable exists
    try {
        const fs = require('fs');
        if (fs.existsSync(serverPath)) {
            console.log(`Found Enforce Script LSP server at: ${serverPath}`);
            return serverPath;
        }
    } catch (error) {
        console.error('Error checking for LSP server:', error);
    }

    console.warn(`Enforce Script LSP server not found at: ${serverPath}`);
    return undefined;
}

/**
 * Gets the active LSP client instance
 * @returns The active language client, or undefined if not started
 */
export function getLspClient(): LanguageClient | undefined {
    return client;
}
