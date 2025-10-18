import React, { useEffect, useState } from 'react';
import {
    VscodeButton,
    VscodeDivider,
    VscodeTextfield,
} from '@vscode-elements/react-elements';

interface FileViewerProps {
    fileName: string;
    fileContent: string;
    filePath: string;
}

const App: React.FC = () => {
    // Get the VS Code API (already acquired in index.tsx)
    const vscode = window.vscode;

    const [fileData, setFileData] = useState<FileViewerProps | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Listen for messages from the extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.type) {
                case 'fileData':
                    setFileData(message.data);
                    break;
            }
        });

        // Request initial data
        vscode.postMessage({ type: 'ready' });
    }, []);

    const handleRefresh = () => {
        vscode.postMessage({ type: 'refresh' });
    };

    const handleOpenInEditor = () => {
        vscode.postMessage({ type: 'openInEditor' });
    };

    if (!fileData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-pulse text-xl mb-2">Loading...</div>
                    <div className="text-sm opacity-70">Preparing file viewer</div>
                </div>
            </div>
        );
    }

    const filteredContent = fileData.fileContent
        .split('\n')
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) =>
            searchTerm ? line.toLowerCase().includes(searchTerm.toLowerCase()) : true
        );

    return (
        <div className="min-h-screen p-4">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold mb-2">{fileData.fileName}</h1>
                <p className="text-sm opacity-70 mb-4">{fileData.filePath}</p>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                    <VscodeButton onClick={handleRefresh}>
                        🔄 Refresh
                    </VscodeButton>
                    <VscodeButton onClick={handleOpenInEditor}>
                        📝 Open in Editor
                    </VscodeButton>
                </div>

                <VscodeDivider />

                {/* Search Box */}
                <div className="mt-4">
                    <VscodeTextfield
                        value={searchTerm}
                        onInput={(e: any) => setSearchTerm(e.target.value)}
                        placeholder="Search in file..."
                        className="w-full"
                    >
                        Search
                    </VscodeTextfield>
                </div>
            </div>

            <VscodeDivider />

            {/* File Content Display */}
            <div className="mt-4">
                <div className="bg-[var(--vscode-editor-background)] rounded border border-[var(--vscode-panel-border)] p-4">
                    <div className="font-mono text-sm">
                        {filteredContent.length === 0 ? (
                            <div className="text-center py-8 opacity-50">
                                No matching lines found
                            </div>
                        ) : (
                            filteredContent.map(({ line, number }) => (
                                <div key={number} className="flex hover:bg-[var(--vscode-list-hoverBackground)]">
                                    <span className="inline-block w-12 text-right pr-4 opacity-50 select-none">
                                        {number}
                                    </span>
                                    <span className="flex-1">{line || '\u00A0'}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="mt-4 text-sm opacity-70 text-center">
                <VscodeDivider />
                <div className="mt-4">
                    {filteredContent.length} lines
                    {searchTerm && ` (filtered from ${fileData.fileContent.split('\n').length} total)`}
                </div>
            </div>
        </div>
    );
};

export default App;
