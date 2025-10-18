import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
    VscodeButton,
    VscodeDivider,
    VscodeTextfield,
    VscodeCheckbox,
} from '@vscode-elements/react-elements';

interface TypeFlags {
    count_in_cargo: '0' | '1';
    count_in_hoarder: '0' | '1';
    count_in_map: '0' | '1';
    count_in_player: '0' | '1';
    crafted: '0' | '1';
    deloot: '0' | '1';
}

interface TypeEntry {
    name: string;
    nominal: number;
    lifetime: number;
    restock: number;
    min: number;
    quantmin: number;
    quantmax: number;
    cost: number;
    flags: TypeFlags;
    category: string;
    tags: string[];
    usages: string[];
    values: string[];
}

interface TypesDocument {
    types: TypeEntry[];
}

// Memoized Type Item Component for performance with large lists
const TypeItem = memo(({
    type,
    isSelected,
    onToggleSelect,
    onEdit
}: {
    type: TypeEntry;
    isSelected: boolean;
    onToggleSelect: (name: string) => void;
    onEdit: (type: TypeEntry) => void;
}) => {
    return (
        <div
            className={`border border-gray-600 rounded p-3 hover:border-blue-500 transition-colors ${isSelected ? 'bg-blue-900 bg-opacity-20' : ''}`}
        >
            <div className="flex items-start gap-3">
                <div className="flex flex-col items-center justify-center w-12 h-12">
                    <VscodeCheckbox
                        checked={isSelected}
                        onChange={() => onToggleSelect(type.name)}
                        className="transform scale-150"
                    />
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{type.name}</h3>
                        <button
                            onClick={() => onEdit(type)}
                            className="px-3 py-2 text-xl hover:bg-[var(--vscode-button-hoverBackground)] rounded min-w-[40px] min-h-[40px] flex items-center justify-center"
                            title="Edit this type"
                        >
                            ✏️
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                            <span className="opacity-70">Nominal:</span>
                            <span className="ml-1 font-semibold">{type.nominal}</span>
                        </div>
                        <div>
                            <span className="opacity-70">Min:</span>
                            <span className="ml-1 font-semibold">{type.min}</span>
                        </div>
                        <div>
                            <span className="opacity-70">Lifetime:</span>
                            <span className="ml-1 font-semibold">{type.lifetime}s ({formatTime(type.lifetime)})</span>
                        </div>
                        <div>
                            <span className="opacity-70">Restock:</span>
                            <span className="ml-1 font-semibold">{type.lifetime}s ({formatTime(type.restock)})</span>
                        </div>
                    </div>

                    <div className="mt-2 flex gap-4 text-sm">
                        {type.category && (
                            <div>
                                <span className="opacity-70">Category:</span>
                                <span className="ml-1 px-2 py-0.5 bg-blue-600 bg-opacity-30 rounded">
                                    {type.category}
                                </span>
                            </div>
                        )}
                        {type.usages.length > 0 && (
                            <div>
                                <span className="opacity-70">Usage:</span>
                                {type.usages.map(u => (
                                    <span key={u} className="ml-1 px-2 py-0.5 bg-green-600 bg-opacity-30 rounded">
                                        {u}
                                    </span>
                                ))}
                            </div>
                        )}
                        {type.values.length > 0 && (
                            <div>
                                <span className="opacity-70">Tiers:</span>
                                {type.values.map(v => (
                                    <span key={v} className="ml-1 px-2 py-0.5 bg-purple-600 bg-opacity-30 rounded">
                                        {v}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

TypeItem.displayName = 'TypeItem';

/**
 * Formats seconds into a human-readable time string
 * @param seconds - The time in seconds
 * @returns A formatted string like "2h 30m" or "45s"
 */
const formatTime = (seconds: number): string => {
    if (seconds < 60) {
        return `${seconds}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
};

const TypesEditor: React.FC = () => {
    // Get the VS Code API (already acquired in index.tsx)
    const vscode = window.vscode;

    const [document, setDocument] = useState<TypesDocument | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [lastSaved, setLastSaved] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterTier, setFilterTier] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [editingType, setEditingType] = useState<TypeEntry | null>(null);
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkEditField, setBulkEditField] = useState<string>('');
    const [bulkEditValue, setBulkEditValue] = useState<string>('');

    // Sorting state
    const [sortField, setSortField] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Pagination state for rendering performance
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

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
                        if (!prevDoc) return prevDoc;
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

    // Auto-save on document changes
    const notifyDocumentChanged = (updatedDoc: TypesDocument) => {
        vscode.postMessage({
            type: 'documentChanged',
            data: { document: updatedDoc }
        });
    };

    // Get unique categories, tiers, and usages for filtering and bulk edit
    const { categories, tiers, usages } = useMemo(() => {
        if (!document) {
            return { categories: [], tiers: [], usages: [] };
        }

        const cats = new Set<string>();
        const tierSet = new Set<string>();
        const usageSet = new Set<string>();

        document.types.forEach(type => {
            if (type.category) {
                cats.add(type.category);
            }
            type.values.forEach(v => tierSet.add(v));
            type.usages.forEach(u => usageSet.add(u));
        });

        return {
            categories: Array.from(cats).sort(),
            tiers: Array.from(tierSet).sort(),
            usages: Array.from(usageSet).sort()
        };
    }, [document]);

    // Filter types based on search and filters
    const filteredTypes = useMemo(() => {
        if (!document) {
            return [];
        }

        const filtered = document.types.filter(type => {
            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchName = type.name.toLowerCase().includes(term);
                const matchCategory = type.category.toLowerCase().includes(term);
                const matchUsage = type.usages.some(u => u.toLowerCase().includes(term));
                const matchValue = type.values.some(v => v.toLowerCase().includes(term));

                if (!matchName && !matchCategory && !matchUsage && !matchValue) {
                    return false;
                }
            }

            // Category filter
            if (filterCategory && type.category !== filterCategory) {
                return false;
            }

            // Tier filter
            if (filterTier && !type.values.includes(filterTier)) {
                return false;
            }

            return true;
        });

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            let compareValue = 0;

            switch (sortField) {
                case 'name':
                    compareValue = a.name.localeCompare(b.name);
                    break;
                case 'nominal':
                    compareValue = a.nominal - b.nominal;
                    break;
                case 'min':
                    compareValue = a.min - b.min;
                    break;
                case 'lifetime':
                    compareValue = a.lifetime - b.lifetime;
                    break;
                case 'restock':
                    compareValue = a.restock - b.restock;
                    break;
                case 'category':
                    compareValue = a.category.localeCompare(b.category);
                    break;
                case 'cost':
                    compareValue = a.cost - b.cost;
                    break;
                default:
                    compareValue = 0;
            }

            return sortDirection === 'asc' ? compareValue : -compareValue;
        });

        return sorted;
    }, [document, searchTerm, filterCategory, filterTier, sortField, sortDirection]);

    // Paginated types for rendering (only show itemsPerPage at a time)
    const { paginatedTypes, totalPages, startIndex, endIndex } = useMemo(() => {
        const total = filteredTypes.length;
        const pages = Math.ceil(total / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, total);
        const paginated = filteredTypes.slice(start, end);

        return {
            paginatedTypes: paginated,
            totalPages: pages,
            startIndex: start,
            endIndex: end
        };
    }, [filteredTypes, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterTier]);

    // Handle adding new type
    const handleAddType = () => {
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
    };

    // Handle deleting selected types
    const handleDeleteSelected = () => {
        if (selectedTypes.size === 0) {
            return;
        }

        const confirmed = confirm(`Delete ${selectedTypes.size} selected type(s)?`);
        if (confirmed) {
            setDocument(prevDoc => {
                if (!prevDoc) return prevDoc;

                const updated = {
                    ...prevDoc,
                    types: prevDoc.types.filter(t => !selectedTypes.has(t.name))
                };

                notifyDocumentChanged(updated);
                return updated;
            });

            setSelectedTypes(new Set());
        }
    };

    // Handle bulk edit
    const handleBulkEdit = () => {
        if (selectedTypes.size === 0 || !bulkEditField) {
            return;
        }

        setDocument(prevDoc => {
            if (!prevDoc) return prevDoc;

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
    };

    // Handle editing single type
    const handleEditType = (type: TypeEntry) => {
        setEditingType({ ...type });
    };

    // Handle saving edited type
    const handleSaveEdit = () => {
        if (!editingType) {
            return;
        }

        setDocument(prevDoc => {
            if (!prevDoc) return prevDoc;

            const updated = {
                ...prevDoc,
                types: prevDoc.types.map(t => t.name === editingType.name ? editingType : t)
            };

            notifyDocumentChanged(updated);
            return updated;
        });

        setEditingType(null);
    };

    // Handle toggling type selection
    const toggleTypeSelection = (typeName: string) => {
        const newSelection = new Set(selectedTypes);
        if (newSelection.has(typeName)) {
            newSelection.delete(typeName);
        } else {
            newSelection.add(typeName);
        }
        setSelectedTypes(newSelection);
    };

    // Handle selecting all filtered types
    const handleSelectAll = () => {
        const newSelection = new Set<string>();
        filteredTypes.forEach(t => newSelection.add(t.name));
        setSelectedTypes(newSelection);
    };

    // Handle deselecting all
    const handleDeselectAll = () => {
        setSelectedTypes(new Set());
    };

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

                    {/* Search and Filters */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <VscodeTextfield
                            value={searchTerm}
                            onInput={(e: any) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, category, tier..."
                        >
                            🔍 Search
                        </VscodeTextfield>

                        <div>
                            <label className="block text-sm mb-1 opacity-70">Category Filter</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1 opacity-70">Tier Filter</label>
                            <select
                                value={filterTier}
                                onChange={(e) => setFilterTier(e.target.value)}
                                className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                            >
                                <option value="">All Tiers</option>
                                {tiers.map(tier => (
                                    <option key={tier} value={tier}>{tier}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sort Controls */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm mb-1 opacity-70">Sort By</label>
                            <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value)}
                                className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                            >
                                <option value="name">Name</option>
                                <option value="nominal">Nominal</option>
                                <option value="min">Min</option>
                                <option value="lifetime">Lifetime</option>
                                <option value="restock">Restock</option>
                                <option value="category">Category</option>
                                <option value="cost">Cost</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1 opacity-70">Sort Direction</label>
                            <select
                                value={sortDirection}
                                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                                className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                            >
                                <option value="asc">↑ Ascending</option>
                                <option value="desc">↓ Descending</option>
                            </select>
                        </div>
                    </div>

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
                        <div className="border border-gray-600 p-4 rounded mb-4">
                            <h3 className="text-lg font-bold mb-2">Bulk Edit {selectedTypes.size} Types</h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm mb-1 opacity-70">Field to Edit</label>
                                    <select
                                        value={bulkEditField}
                                        onChange={(e) => {
                                            setBulkEditField(e.target.value);
                                            setBulkEditValue(''); // Reset value when field changes
                                        }}
                                        className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                                    >
                                        <option value="">Select Field...</option>
                                        <option value="nominal">Nominal</option>
                                        <option value="lifetime">Lifetime</option>
                                        <option value="restock">Restock</option>
                                        <option value="min">Min</option>
                                        <option value="cost">Cost</option>
                                        <option value="category">Category</option>
                                        <option value="addUsage">Add Usage</option>
                                        <option value="removeUsage">Remove Usage</option>
                                        <option value="addValue">Add Tier</option>
                                        <option value="removeValue">Remove Tier</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1 opacity-70">New Value</label>
                                    {/* Show dropdown for enum-based fields */}
                                    {bulkEditField === 'category' && (
                                        <select
                                            value={bulkEditValue}
                                            onChange={(e) => setBulkEditValue(e.target.value)}
                                            className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                                        >
                                            <option value="">Select Category...</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="__custom__">⊕ Enter Custom...</option>
                                        </select>
                                    )}
                                    {(bulkEditField === 'addUsage' || bulkEditField === 'removeUsage') && (
                                        <select
                                            value={bulkEditValue}
                                            onChange={(e) => setBulkEditValue(e.target.value)}
                                            className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                                        >
                                            <option value="">Select Usage...</option>
                                            {usages.map(usage => (
                                                <option key={usage} value={usage}>{usage}</option>
                                            ))}
                                            <option value="__custom__">⊕ Enter Custom...</option>
                                        </select>
                                    )}
                                    {(bulkEditField === 'addValue' || bulkEditField === 'removeValue') && (
                                        <select
                                            value={bulkEditValue}
                                            onChange={(e) => setBulkEditValue(e.target.value)}
                                            className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                                        >
                                            <option value="">Select Tier...</option>
                                            {tiers.map(tier => (
                                                <option key={tier} value={tier}>{tier}</option>
                                            ))}
                                            <option value="__custom__">⊕ Enter Custom...</option>
                                        </select>
                                    )}
                                    {/* Show text input for numeric fields or when custom is selected */}
                                    {(bulkEditField && !['category', 'addUsage', 'removeUsage', 'addValue', 'removeValue'].includes(bulkEditField)) && (
                                        <VscodeTextfield
                                            value={bulkEditValue}
                                            onInput={(e: any) => setBulkEditValue(e.target.value)}
                                            placeholder="Enter value..."
                                        />
                                    )}
                                    {/* Show text input when nothing selected */}
                                    {!bulkEditField && (
                                        <VscodeTextfield
                                            value={bulkEditValue}
                                            onInput={(e: any) => setBulkEditValue(e.target.value)}
                                            placeholder="Select a field first..."
                                            disabled
                                        />
                                    )}
                                    {/* Show custom text input when __custom__ is selected */}
                                    {bulkEditValue === '__custom__' && (
                                        <VscodeTextfield
                                            value=""
                                            onInput={(e: any) => setBulkEditValue(e.target.value)}
                                            placeholder="Enter custom value..."
                                            className="mt-2"
                                        />
                                    )}
                                </div>

                                <div className="flex gap-2 items-end">
                                    <VscodeButton onClick={handleBulkEdit} disabled={!bulkEditField || !bulkEditValue || bulkEditValue === '__custom__'}>
                                        Apply
                                    </VscodeButton>
                                    <VscodeButton onClick={() => {
                                        setShowBulkEdit(false);
                                        setBulkEditField('');
                                        setBulkEditValue('');
                                    }}>
                                        Cancel
                                    </VscodeButton>
                                </div>
                            </div>
                        </div>
                    )}

                    <VscodeDivider />
                </div>

                {/* Types List with Pagination */}
                <div className="space-y-2">
                    {paginatedTypes.map(type => (
                        <TypeItem
                            key={type.name}
                            type={type}
                            isSelected={selectedTypes.has(type.name)}
                            onToggleSelect={toggleTypeSelection}
                            onEdit={handleEditType}
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
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--vscode-editor-background)] border border-gray-600 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Edit Type: {editingType.name}</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">nominal</label>
                                <VscodeTextfield
                                    value={String(editingType.nominal)}
                                    onInput={(e: any) => setEditingType({ ...editingType, nominal: parseInt(e.target.value, 10) || 0 })}
                                    placeholder="Number of items spawned"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">min</label>
                                <VscodeTextfield
                                    value={String(editingType.min)}
                                    onInput={(e: any) => setEditingType({ ...editingType, min: parseInt(e.target.value, 10) || 0 })}
                                    placeholder="Minimum items to maintain"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">lifetime</label>
                                <VscodeTextfield
                                    value={String(editingType.lifetime)}
                                    onInput={(e: any) => setEditingType({ ...editingType, lifetime: parseInt(e.target.value, 10) || 0 })}
                                    placeholder="Seconds before despawn"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">restock</label>
                                <VscodeTextfield
                                    value={String(editingType.restock)}
                                    onInput={(e: any) => setEditingType({ ...editingType, restock: parseInt(e.target.value, 10) || 0 })}
                                    placeholder="Seconds between respawns"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">quantmin</label>
                                <VscodeTextfield
                                    value={String(editingType.quantmin)}
                                    onInput={(e: any) => setEditingType({ ...editingType, quantmin: parseInt(e.target.value, 10) || -1 })}
                                    placeholder="Min stack quantity (-1 for N/A)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">quantmax</label>
                                <VscodeTextfield
                                    value={String(editingType.quantmax)}
                                    onInput={(e: any) => setEditingType({ ...editingType, quantmax: parseInt(e.target.value, 10) || -1 })}
                                    placeholder="Max stack quantity (-1 for N/A)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">cost</label>
                                <VscodeTextfield
                                    value={String(editingType.cost)}
                                    onInput={(e: any) => setEditingType({ ...editingType, cost: parseInt(e.target.value, 10) || 100 })}
                                    placeholder="Economy cost/priority"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 opacity-70 font-mono">category</label>
                                <VscodeTextfield
                                    value={editingType.category}
                                    onInput={(e: any) => setEditingType({ ...editingType, category: e.target.value })}
                                    placeholder="Item category"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold mb-2 font-mono">flags</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <VscodeCheckbox
                                    checked={editingType.flags.count_in_cargo === '1'}
                                    onChange={(e: any) => setEditingType({
                                        ...editingType,
                                        flags: { ...editingType.flags, count_in_cargo: e.target.checked ? '1' : '0' }
                                    })}
                                >
                                    <span className="font-mono text-sm">count_in_cargo</span>
                                </VscodeCheckbox>

                                <VscodeCheckbox
                                    checked={editingType.flags.count_in_hoarder === '1'}
                                    onChange={(e: any) => setEditingType({
                                        ...editingType,
                                        flags: { ...editingType.flags, count_in_hoarder: e.target.checked ? '1' : '0' }
                                    })}
                                >
                                    <span className="font-mono text-sm">count_in_hoarder</span>
                                </VscodeCheckbox>

                                <VscodeCheckbox
                                    checked={editingType.flags.count_in_map === '1'}
                                    onChange={(e: any) => setEditingType({
                                        ...editingType,
                                        flags: { ...editingType.flags, count_in_map: e.target.checked ? '1' : '0' }
                                    })}
                                >
                                    <span className="font-mono text-sm">count_in_map</span>
                                </VscodeCheckbox>

                                <VscodeCheckbox
                                    checked={editingType.flags.count_in_player === '1'}
                                    onChange={(e: any) => setEditingType({
                                        ...editingType,
                                        flags: { ...editingType.flags, count_in_player: e.target.checked ? '1' : '0' }
                                    })}
                                >
                                    <span className="font-mono text-sm">count_in_player</span>
                                </VscodeCheckbox>

                                <VscodeCheckbox
                                    checked={editingType.flags.crafted === '1'}
                                    onChange={(e: any) => setEditingType({
                                        ...editingType,
                                        flags: { ...editingType.flags, crafted: e.target.checked ? '1' : '0' }
                                    })}
                                >
                                    <span className="font-mono text-sm">crafted</span>
                                </VscodeCheckbox>

                                <VscodeCheckbox
                                    checked={editingType.flags.deloot === '1'}
                                    onChange={(e: any) => setEditingType({
                                        ...editingType,
                                        flags: { ...editingType.flags, deloot: e.target.checked ? '1' : '0' }
                                    })}
                                >
                                    <span className="font-mono text-sm">deloot</span>
                                </VscodeCheckbox>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold mb-2 font-mono">usage</h3>
                            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto border border-[var(--vscode-input-border)] rounded p-3 bg-[var(--vscode-input-background)]">
                                {usages.length === 0 ? (
                                    <div className="col-span-4 text-center text-sm opacity-70">No usages found in document</div>
                                ) : (
                                    usages.map(usage => (
                                        <VscodeCheckbox
                                            key={usage}
                                            checked={editingType.usages.includes(usage)}
                                            onChange={(e: any) => {
                                                const newUsages = e.target.checked
                                                    ? [...editingType.usages, usage]
                                                    : editingType.usages.filter(u => u !== usage);
                                                setEditingType({ ...editingType, usages: newUsages });
                                            }}
                                        >
                                            <span className="text-sm">{usage}</span>
                                        </VscodeCheckbox>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold mb-2 font-mono">value</h3>
                            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto border border-[var(--vscode-input-border)] rounded p-3 bg-[var(--vscode-input-background)]">
                                {tiers.length === 0 ? (
                                    <div className="col-span-4 text-center text-sm opacity-70">No tiers found in document</div>
                                ) : (
                                    tiers.map(tier => (
                                        <VscodeCheckbox
                                            key={tier}
                                            checked={editingType.values.includes(tier)}
                                            onChange={(e: any) => {
                                                const newValues = e.target.checked
                                                    ? [...editingType.values, tier]
                                                    : editingType.values.filter(v => v !== tier);
                                                setEditingType({ ...editingType, values: newValues });
                                            }}
                                        >
                                            <span className="text-sm">{tier}</span>
                                        </VscodeCheckbox>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <VscodeButton onClick={handleSaveEdit}>
                                💾 Save Changes
                            </VscodeButton>
                            <VscodeButton onClick={() => setEditingType(null)}>
                                Cancel
                            </VscodeButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TypesEditor;
