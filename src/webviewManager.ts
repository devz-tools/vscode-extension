import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Manages webview panels for custom file viewing
 */
export class WebviewManager {
    private static currentPanel: vscode.WebviewPanel | undefined;

    /**
     * Opens a file in a custom webview panel
     * @param context - Extension context for resource URIs
     * @param fileUri - URI of the file to display
     */
    public static async openFileViewer(
        context: vscode.ExtensionContext,
        fileUri: vscode.Uri
    ): Promise<void> {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (WebviewManager.currentPanel) {
            WebviewManager.currentPanel.reveal(column);
        } else {
            // Otherwise, create a new panel
            WebviewManager.currentPanel = vscode.window.createWebviewPanel(
                'devzFileViewer',
                'File Viewer',
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'dist'))
                    ]
                }
            );

            // Reset when the current panel is closed
            WebviewManager.currentPanel.onDidDispose(
                () => {
                    WebviewManager.currentPanel = undefined;
                },
                null,
                context.subscriptions
            );
        }

        // Load and display the file
        await WebviewManager.loadFile(context, fileUri);
    }

    /**
     * Loads file content and updates the webview
     * @param context - Extension context
     * @param fileUri - URI of the file to load
     */
    private static async loadFile(
        context: vscode.ExtensionContext,
        fileUri: vscode.Uri
    ): Promise<void> {
        if (!WebviewManager.currentPanel) {
            return;
        }

        const panel = WebviewManager.currentPanel;
        const fileName = path.basename(fileUri.fsPath);

        // Update panel title
        panel.title = `📄 ${fileName}`;

        // Read file content
        let fileContent: string;
        try {
            const fileBuffer = await fs.promises.readFile(fileUri.fsPath);
            fileContent = fileBuffer.toString('utf-8');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read file: ${error}`);
            return;
        }

        // Set webview HTML
        panel.webview.html = WebviewManager.getWebviewContent(
            context,
            panel.webview,
            fileName,
            fileContent,
            fileUri.fsPath
        );

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'ready':
                        // Send initial data when webview is ready
                        panel.webview.postMessage({
                            type: 'fileData',
                            data: {
                                fileName,
                                fileContent,
                                filePath: fileUri.fsPath
                            }
                        });
                        break;

                    case 'refresh':
                        // Reload the file
                        await WebviewManager.loadFile(context, fileUri);
                        vscode.window.showInformationMessage('File refreshed');
                        break;

                    case 'openInEditor':
                        // Open file in regular editor
                        const document = await vscode.workspace.openTextDocument(fileUri);
                        await vscode.window.showTextDocument(document);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    /**
     * Generates the HTML content for the webview
     * @param context - Extension context
     * @param webview - Webview instance
     * @param fileName - Name of the file
     * @param fileContent - Content of the file
     * @param filePath - Full path to the file
     * @returns HTML string for the webview
     */
    private static getWebviewContent(
        context: vscode.ExtensionContext,
        webview: vscode.Webview,
        fileName: string,
        fileContent: string,
        filePath: string
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
    <title>File Viewer</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}">
        window.initialData = ${JSON.stringify({ fileName, fileContent, filePath })};
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
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
