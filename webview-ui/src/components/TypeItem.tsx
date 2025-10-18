/**
 * TypeItem Component
 * Displays a single type entry in the list with selection checkbox and edit button
 */
import React, { memo } from 'react';
import { VscodeCheckbox } from '@vscode-elements/react-elements';
import { TypeEntry } from '../types/types';
import { formatTime } from '../utils/formatters';

interface TypeItemProps {
    /** The type entry to display */
    type: TypeEntry;
    /** Whether this type is currently selected */
    isSelected: boolean;
    /** Callback when selection checkbox is toggled */
    onToggleSelect: (name: string) => void;
    /** Callback when edit button is clicked */
    onEdit: (type: TypeEntry) => void;
}

/**
 * Memoized Type Item Component for performance with large lists
 * Renders a card-style display of a single type entry with all relevant information
 */
const TypeItem: React.FC<TypeItemProps> = memo(({
    type,
    isSelected,
    onToggleSelect,
    onEdit
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
                            <span className="ml-1 font-semibold">{type.restock}s ({formatTime(type.restock)})</span>
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

export default TypeItem;
