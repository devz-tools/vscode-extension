import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TypeEntry, TypesDocument } from './types';
import { parseTypesXml, serializeTypesXml, validateTypeEntry, createDefaultTypeEntry } from './xmlUtils';
import { showMeaningfulNotification } from './utils';

/**
 * Manages the types.xml editor webview panel with auto-save functionality
 */
export class TypesEditorManager {
    private static currentPanel: vscode.WebviewPanel | undefined;
    private static currentFileUri: vscode.Uri | undefined;
    private static fileWatcher: fs.FSWatcher | undefined;
    private static autoSaveTimer: NodeJS.Timeout | undefined;
    private static pendingChanges: TypesDocument | undefined;
    private static currentDocument: TypesDocument | undefined;

    /**
     * Opens the types.xml file in the custom editor
     * @param context - Extension context for resource URIs
     * @param fileUri - URI of the types.xml file to edit
     */
    public static async openTypesEditor(
        context: vscode.ExtensionContext,
        fileUri: vscode.Uri
    ): Promise<void> {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel for this file, show it
        if (TypesEditorManager.currentPanel && TypesEditorManager.currentFileUri?.fsPath === fileUri.fsPath) {
            TypesEditorManager.currentPanel.reveal(column);
            return;
        }

        // Clean up existing panel if editing a different file
        if (TypesEditorManager.currentPanel) {
            TypesEditorManager.currentPanel.dispose();
        }

        // Create new panel
        TypesEditorManager.currentPanel = vscode.window.createWebviewPanel(
            'devzTypesEditor',
            `Types Editor: ${path.basename(fileUri.fsPath)}`,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'dist'))
                ]
            }
        );

        TypesEditorManager.currentFileUri = fileUri;

        // Set up file watcher for external changes
        TypesEditorManager.setupFileWatcher(fileUri);

        // Handle panel disposal
        TypesEditorManager.currentPanel.onDidDispose(
            () => {
                TypesEditorManager.cleanup();
            },
            null,
            context.subscriptions
        );

        // Set up message handling FIRST (before loading HTML)
        TypesEditorManager.setupMessageHandling(context, fileUri);

        // Load and display the file
        await TypesEditorManager.loadAndDisplayFile(context, fileUri);
    }

    /**
     * Loads the types.xml file and sends data to webview
     * @param context - Extension context
     * @param fileUri - URI of the file to load
     */
    private static async loadAndDisplayFile(
        context: vscode.ExtensionContext,
        fileUri: vscode.Uri
    ): Promise<void> {
        if (!TypesEditorManager.currentPanel) {
            return;
        }

        const panel = TypesEditorManager.currentPanel;

        try {
            // Read and parse file
            const fileBuffer = await fs.promises.readFile(fileUri.fsPath);
            const fileContent = fileBuffer.toString('utf-8');
            const typesDocument = parseTypesXml(fileContent);

            // Store the parsed document
            TypesEditorManager.currentDocument = typesDocument;

            // Set webview HTML (this will trigger a reload)
            panel.webview.html = TypesEditorManager.getWebviewContent(
                context,
                panel.webview
            );

            // Don't send data here - wait for the webview to request it via 'ready' message

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load types.xml: ${error}`);
        }
    }

    /**
     * Sets up message handling between extension and webview
     * @param context - Extension context
     * @param fileUri - URI of the current file
     */
    private static setupMessageHandling(
        context: vscode.ExtensionContext,
        fileUri: vscode.Uri
    ): void {
        if (!TypesEditorManager.currentPanel) {
            return;
        }

        TypesEditorManager.currentPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'ready':
                        // Webview is ready, send the document data
                        if (TypesEditorManager.currentDocument && TypesEditorManager.currentFileUri) {
                            TypesEditorManager.currentPanel?.webview.postMessage({
                                type: 'loadDocument',
                                data: {
                                    document: TypesEditorManager.currentDocument,
                                    filePath: TypesEditorManager.currentFileUri.fsPath,
                                    fileName: path.basename(TypesEditorManager.currentFileUri.fsPath)
                                }
                            });
                        }
                        break;

                    case 'documentChanged':
                        // Queue auto-save
                        TypesEditorManager.queueAutoSave(message.data.document, fileUri);
                        break;

                    case 'saveNow':
                        // Immediate save requested
                        await TypesEditorManager.saveDocument(message.data.document, fileUri);
                        break;

                    case 'addNewType':
                        // Create new type entry
                        const newType = createDefaultTypeEntry(message.data.name);
                        TypesEditorManager.currentPanel?.webview.postMessage({
                            type: 'typeAdded',
                            data: { type: newType }
                        });
                        break;

                    case 'validateType':
                        // Validate a type entry
                        const errors = validateTypeEntry(message.data.type);
                        TypesEditorManager.currentPanel?.webview.postMessage({
                            type: 'validationResult',
                            data: { name: message.data.type.name, errors }
                        });
                        break;

                    case 'openInTextEditor':
                        // Open file in regular text editor
                        const document = await vscode.workspace.openTextDocument(fileUri);
                        await vscode.window.showTextDocument(document);
                        break;

                    case 'reload':
                        // Reload file from disk
                        await TypesEditorManager.loadAndDisplayFile(context, fileUri);
                        showMeaningfulNotification('File reloaded from disk', 'info');
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    /**
     * Queues an auto-save operation with debouncing
     * @param document - The document to save
     * @param fileUri - URI of the file to save to
     */
    private static queueAutoSave(document: TypesDocument, fileUri: vscode.Uri): void {
        // Store pending changes
        TypesEditorManager.pendingChanges = document;

        // Clear existing timer
        if (TypesEditorManager.autoSaveTimer) {
            clearTimeout(TypesEditorManager.autoSaveTimer);
        }

        // Set new timer (2 second debounce)
        TypesEditorManager.autoSaveTimer = setTimeout(async () => {
            if (TypesEditorManager.pendingChanges) {
                await TypesEditorManager.saveDocument(TypesEditorManager.pendingChanges, fileUri);
                TypesEditorManager.pendingChanges = undefined;
            }
        }, 2000);
    }

    /**
     * Saves the document to disk
     * @param document - The document to save
     * @param fileUri - URI of the file to save to
     */
    private static async saveDocument(document: TypesDocument, fileUri: vscode.Uri): Promise<void> {
        try {
            // Temporarily disable file watcher to avoid triggering reload
            if (TypesEditorManager.fileWatcher) {
                TypesEditorManager.fileWatcher.close();
            }

            // Serialize and save
            const xmlContent = serializeTypesXml(document);
            await fs.promises.writeFile(fileUri.fsPath, xmlContent, 'utf-8');

            // Notify webview of successful save
            TypesEditorManager.currentPanel?.webview.postMessage({
                type: 'saved',
                data: { timestamp: new Date().toISOString() }
            });

            // Re-enable file watcher
            setTimeout(() => {
                if (TypesEditorManager.currentFileUri) {
                    TypesEditorManager.setupFileWatcher(TypesEditorManager.currentFileUri);
                }
            }, 1000);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save types.xml: ${error}`);
            TypesEditorManager.currentPanel?.webview.postMessage({
                type: 'saveError',
                data: { error: String(error) }
            });
        }
    }

    /**
     * Sets up file system watcher for external changes
     * @param fileUri - URI of the file to watch
     */
    private static setupFileWatcher(fileUri: vscode.Uri): void {
        // Clean up existing watcher
        if (TypesEditorManager.fileWatcher) {
            TypesEditorManager.fileWatcher.close();
        }

        // Create new watcher
        TypesEditorManager.fileWatcher = fs.watch(
            fileUri.fsPath,
            async (eventType) => {
                if (eventType === 'change') {
                    // File changed externally, ask user if they want to reload
                    const choice = await vscode.window.showWarningMessage(
                        'types.xml was modified externally. Reload?',
                        'Reload',
                        'Keep Current'
                    );

                    if (choice === 'Reload' && TypesEditorManager.currentFileUri) {
                        const context = TypesEditorManager.currentPanel ?
                            (TypesEditorManager.currentPanel as any)._context :
                            undefined;
                        if (context) {
                            await TypesEditorManager.loadAndDisplayFile(
                                context,
                                TypesEditorManager.currentFileUri
                            );
                        }
                    }
                }
            }
        );
    }

    /**
     * Generates the HTML content for the webview
     * @param context - Extension context
     * @param webview - Webview instance
     * @returns HTML string for the webview
     */
    private static getWebviewContent(
        context: vscode.ExtensionContext,
        webview: vscode.Webview
    ): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js'))
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'dist', 'styles.css'))
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Types Editor</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}">
        window.__WEBVIEW_TYPE__ = 'typesEditor';
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    /**
     * Cleans up resources when panel is disposed
     */
    private static cleanup(): void {
        TypesEditorManager.currentPanel = undefined;
        TypesEditorManager.currentFileUri = undefined;
        TypesEditorManager.pendingChanges = undefined;
        TypesEditorManager.currentDocument = undefined;

        if (TypesEditorManager.fileWatcher) {
            TypesEditorManager.fileWatcher.close();
            TypesEditorManager.fileWatcher = undefined;
        }

        if (TypesEditorManager.autoSaveTimer) {
            clearTimeout(TypesEditorManager.autoSaveTimer);
            TypesEditorManager.autoSaveTimer = undefined;
        }
    }
}

/**
 * Generates a random nonce for CSP
 * @returns A random nonce string
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
