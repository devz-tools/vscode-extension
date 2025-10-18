import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import TypesEditor from './TypesEditor';
// Note: styles.css is loaded via <link> tag in HTML, not bundled

// Acquire the VS Code API once and make it globally available
// This MUST be done before importing components that use it
declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
            getState: () => any;
            setState: (state: any) => void;
        };
        __WEBVIEW_TYPE__?: string;
        acquireVsCodeApi: () => {
            postMessage: (message: any) => void;
            getState: () => any;
            setState: (state: any) => void;
        };
    }
}

// Acquire VS Code API once at the entry point
if (!window.vscode) {
    window.vscode = window.acquireVsCodeApi();
}

// Determine which component to render based on the webview type
// The extension will set this via a global variable
const webviewType = window.__WEBVIEW_TYPE__ || 'fileViewer';

console.log('DevZ Webview Loading...', { webviewType });

const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error('Root element not found!');
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
    const root = ReactDOM.createRoot(rootElement);

    // Render the appropriate component
    if (webviewType === 'typesEditor') {
        console.log('Rendering TypesEditor component');
        root.render(
            <React.StrictMode>
                <TypesEditor />
            </React.StrictMode>
        );
    } else {
        console.log('Rendering App component');
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    }
}

