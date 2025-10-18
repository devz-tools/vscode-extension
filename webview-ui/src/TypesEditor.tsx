/**
 * TypesEditor - Main Component
 * GUI editor for DayZ types.xml files with search, filter, bulk edit, and pagination
 */
import React, { useEffect, useState, useCallback } from 'react';
import { VscodeButton, VscodeDivider } from '@vscode-elements/react-elements';
import { TypeEntry, TypesDocument, SortField, SortDirection } from './types/types';
import { useDocumentMetadata } from './hooks/useDocumentMetadata';
import { useTypesFiltering } from './hooks/useTypesFiltering';
import { useTypesPagination } from './hooks/useTypesPagination';
import TypeItem from './components/TypeItem';
import EditTypeModal from './components/EditTypeModal';
import BulkEditPanel from './components/BulkEditPanel';
import FilterBar from './components/FilterBar';

const TypesEditor: React.FC = () => {
    // Get the VS Code API (already acquired in index.tsx)
    const vscode = window.vscode;

    // Document state
    const [document, setDocument] = useState<TypesDocument | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [lastSaved, setLastSaved] = useState<string>('');

    // Filter and search state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterTier, setFilterTier] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Selection and editing state
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [editingType, setEditingType] = useState<TypeEntry | null>(null);

    // Bulk edit state
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkEditField, setBulkEditField] = useState<string>('');
    const [bulkEditValue, setBulkEditValue] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

    // Extract unique values from document
    const { categories, tiers, usages } = useDocumentMetadata(document);

    // Apply filtering and sorting
    const filteredTypes = useTypesFiltering({
        types: document?.types || [],
        searchTerm,
        filterCategory,
        filterTier,
        sortField,
        sortDirection
    });

    // Apply pagination
    const { paginatedTypes, totalPages, startIndex, endIndex } = useTypesPagination({
        filteredTypes,
        currentPage,
        itemsPerPage
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterTier]);

    // Listen for messages from extension
    useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'loadDocument':
                    setDocument(message.data.document);
                    setFileName(message.data.fileName);
                    break;
                case 'saved':
                    setLastSaved(new Date(message.data.timestamp).toLocaleTimeString());
                    break;
                case 'saveError':
                    alert(`Save failed: ${message.data.error}`);
                    break;
                case 'typeAdded':
                    setDocument(prevDoc => {
                        if (!prevDoc) {
                            return prevDoc;
                        }
                        const updated = {
                            ...prevDoc,
                            types: [...prevDoc.types, message.data.type]
                        };
                        notifyDocumentChanged(updated);
                        return updated;
                    });
                    break;
            }
        };

        window.addEventListener('message', messageHandler);

        // Request initial data when component mounts
        vscode.postMessage({ type: 'ready' });

        return () => window.removeEventListener('message', messageHandler);
    }, []); // Remove document from dependencies to avoid stale closures

    /**
     * Notifies the extension that the document has changed (triggers auto-save)
     */
    const notifyDocumentChanged = useCallback((updatedDoc: TypesDocument) => {
        vscode.postMessage({
            type: 'documentChanged',
            data: { document: updatedDoc }
        });
    }, [vscode]);

    /**
     * Handles adding a new type entry
     */
    const handleAddType = useCallback(() => {
        const name = prompt('Enter name for new type:');
        if (name && document) {
            // Check if name already exists
            if (document.types.some(t => t.name === name)) {
                alert('A type with this name already exists!');
                return;
            }

            vscode.postMessage({
                type: 'addNewType',
                data: { name }
            });
        }
    }, [document, vscode]);

    /**
     * Handles deleting selected types
     */
    const handleDeleteSelected = useCallback(() => {
        if (selectedTypes.size === 0) {
            return;
        }

        const confirmed = confirm(`Delete ${selectedTypes.size} selected type(s)?`);
        if (confirmed) {
            setDocument(prevDoc => {
                if (!prevDoc) {
                    return prevDoc;
                }

                const updated = {
                    ...prevDoc,
                    types: prevDoc.types.filter(t => !selectedTypes.has(t.name))
                };

                notifyDocumentChanged(updated);
                return updated;
            });

            setSelectedTypes(new Set());
        }
    }, [selectedTypes, notifyDocumentChanged]);

    /**
     * Handles bulk edit operation
     */
    const handleBulkEdit = useCallback(() => {
        if (selectedTypes.size === 0 || !bulkEditField) {
            return;
        }

        setDocument(prevDoc => {
            if (!prevDoc) {
                return prevDoc;
            }

            const updated = {
                ...prevDoc,
                types: prevDoc.types.map(type => {
                    if (!selectedTypes.has(type.name)) {
                        return type;
                    }

                    const updatedType = { ...type };

                    switch (bulkEditField) {
                        case 'nominal':
                        case 'lifetime':
                        case 'restock':
                        case 'min':
                        case 'cost':
                            updatedType[bulkEditField] = parseInt(bulkEditValue, 10) || 0;
                            break;
                        case 'category':
                            updatedType.category = bulkEditValue;
                            break;
                        case 'addUsage':
                            if (!updatedType.usages.includes(bulkEditValue)) {
                                updatedType.usages = [...updatedType.usages, bulkEditValue];
                            }
                            break;
                        case 'removeUsage':
                            updatedType.usages = updatedType.usages.filter(u => u !== bulkEditValue);
                            break;
                        case 'addValue':
                            if (!updatedType.values.includes(bulkEditValue)) {
                                updatedType.values = [...updatedType.values, bulkEditValue];
                            }
                            break;
                        case 'removeValue':
                            updatedType.values = updatedType.values.filter(v => v !== bulkEditValue);
                            break;
                    }

                    return updatedType;
                })
            };

            notifyDocumentChanged(updated);
            return updated;
        });

        setShowBulkEdit(false);
        setBulkEditField('');
        setBulkEditValue('');
    }, [selectedTypes, bulkEditField, bulkEditValue, notifyDocumentChanged]);

    /**
     * Handles saving edited type
     */
    const handleSaveEdit = useCallback(() => {
        if (!editingType) {
            return;
        }

        setDocument(prevDoc => {
            if (!prevDoc) {
                return prevDoc;
            }

            const updated = {
                ...prevDoc,
                types: prevDoc.types.map(t => t.name === editingType.name ? editingType : t)
            };

            notifyDocumentChanged(updated);
            return updated;
        });

        setEditingType(null);
    }, [editingType, notifyDocumentChanged]);

    /**
     * Handles toggling type selection
     */
    const toggleTypeSelection = useCallback((typeName: string) => {
        const newSelection = new Set(selectedTypes);
        if (newSelection.has(typeName)) {
            newSelection.delete(typeName);
        } else {
            newSelection.add(typeName);
        }
        setSelectedTypes(newSelection);
    }, [selectedTypes]);

    /**
     * Handles selecting all filtered types
     */
    const handleSelectAll = useCallback(() => {
        const newSelection = new Set<string>();
        filteredTypes.forEach(t => newSelection.add(t.name));
        setSelectedTypes(newSelection);
    }, [filteredTypes]);

    /**
     * Handles deselecting all
     */
    const handleDeselectAll = useCallback(() => {
        setSelectedTypes(new Set());
    }, []);

    // Loading state
    if (!document) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-pulse text-xl mb-2">Loading...</div>
                    <div className="text-sm opacity-70">Parsing types.xml</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Main Content Area with Padding */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h1 className="text-2xl font-bold">📦 Types Editor: {fileName}</h1>
                        <div className="text-sm opacity-70">
                            {lastSaved && `Last saved: ${lastSaved}`}
                            {!lastSaved && 'Auto-save enabled'}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                        <VscodeButton onClick={handleAddType}>
                            ➕ Add New Type
                        </VscodeButton>
                        <VscodeButton onClick={() => vscode.postMessage({ type: 'saveNow', data: { document } })}>
                            💾 Save Now
                        </VscodeButton>
                        <VscodeButton onClick={() => vscode.postMessage({ type: 'reload' })}>
                            🔄 Reload
                        </VscodeButton>
                        <VscodeButton onClick={() => vscode.postMessage({ type: 'openInTextEditor' })}>
                            📝 Open in Text Editor
                        </VscodeButton>
                    </div>

                    <VscodeDivider />

                    {/* Stats */}
                    <div className="my-4 flex gap-6 text-sm">
                        <div>
                            <span className="opacity-70">Total Types:</span>
                            <span className="ml-2 font-bold">{document.types.length}</span>
                        </div>
                        <div>
                            <span className="opacity-70">Filtered:</span>
                            <span className="ml-2 font-bold">{filteredTypes.length}</span>
                        </div>
                        <div>
                            <span className="opacity-70">Selected:</span>
                            <span className="ml-2 font-bold">{selectedTypes.size}</span>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <FilterBar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filterCategory={filterCategory}
                        onCategoryChange={setFilterCategory}
                        filterTier={filterTier}
                        onTierChange={setFilterTier}
                        sortField={sortField}
                        onSortFieldChange={setSortField}
                        sortDirection={sortDirection}
                        onSortDirectionChange={setSortDirection}
                        availableCategories={categories}
                        availableTiers={tiers}
                    />

                    {/* Selection Actions */}
                    <div className="flex gap-2 mb-4">
                        <VscodeButton onClick={handleSelectAll}>
                            Select All ({filteredTypes.length})
                        </VscodeButton>
                        <VscodeButton onClick={handleDeselectAll}>
                            Deselect All
                        </VscodeButton>
                        {selectedTypes.size > 0 && (
                            <>
                                <VscodeButton onClick={() => setShowBulkEdit(!showBulkEdit)}>
                                    ✏️ Bulk Edit ({selectedTypes.size})
                                </VscodeButton>
                                <VscodeButton onClick={handleDeleteSelected}>
                                    🗑️ Delete Selected
                                </VscodeButton>
                            </>
                        )}
                    </div>

                    {/* Bulk Edit Panel */}
                    {showBulkEdit && (
                        <BulkEditPanel
                            selectedCount={selectedTypes.size}
                            bulkEditField={bulkEditField}
                            bulkEditValue={bulkEditValue}
                            onFieldChange={setBulkEditField}
                            onValueChange={setBulkEditValue}
                            onApply={handleBulkEdit}
                            onCancel={() => {
                                setShowBulkEdit(false);
                                setBulkEditField('');
                                setBulkEditValue('');
                            }}
                            availableCategories={categories}
                            availableUsages={usages}
                            availableTiers={tiers}
                        />
                    )}

                    <VscodeDivider />
                </div>

                {/* Types List */}
                <div className="space-y-2">
                    {paginatedTypes.map(type => (
                        <TypeItem
                            key={type.name}
                            type={type}
                            isSelected={selectedTypes.has(type.name)}
                            onToggleSelect={toggleTypeSelection}
                            onEdit={setEditingType}
                        />
                    ))}

                    {filteredTypes.length === 0 && (
                        <div className="text-center py-8 opacity-70">
                            No types match your search criteria
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls - Fixed at Bottom */}
            {filteredTypes.length > 0 && totalPages > 1 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[var(--vscode-editor-background)] border-t border-[var(--vscode-panel-border)] p-4 flex items-center justify-between">
                    <div className="text-sm opacity-70">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredTypes.length)} of {filteredTypes.length} results
                        {selectedTypes.size > 0 && ` • ${selectedTypes.size} selected`}
                    </div>
                    <div className="flex items-center gap-2">
                        <VscodeButton
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </VscodeButton>
                        <span className="text-sm opacity-70 px-3">
                            Page {currentPage} of {totalPages}
                        </span>
                        <VscodeButton
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </VscodeButton>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingType && (
                <EditTypeModal
                    editingType={editingType}
                    onUpdateType={setEditingType}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingType(null)}
                    availableUsages={usages}
                    availableTiers={tiers}
                />
            )}
        </div>
    );
};

export default TypesEditor;
