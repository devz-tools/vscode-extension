/**
 * BulkEditPanel Component
 * UI for bulk editing multiple selected type entries at once
 */
import React from 'react';
import { VscodeButton, VscodeTextfield } from '@vscode-elements/react-elements';

interface BulkEditPanelProps {
    /** Number of types selected for bulk editing */
    selectedCount: number;
    /** Currently selected field to bulk edit */
    bulkEditField: string;
    /** Current value for bulk editing */
    bulkEditValue: string;
    /** Callback when field selection changes */
    onFieldChange: (field: string) => void;
    /** Callback when value changes */
    onValueChange: (value: string) => void;
    /** Callback when apply button is clicked */
    onApply: () => void;
    /** Callback when cancel button is clicked */
    onCancel: () => void;
    /** Available categories for dropdown */
    availableCategories: string[];
    /** Available usages for dropdown */
    availableUsages: string[];
    /** Available tiers for dropdown */
    availableTiers: string[];
}

/**
 * Panel for applying bulk edits to multiple selected types
 * Supports numeric fields, category, and adding/removing usages and tiers
 */
const BulkEditPanel: React.FC<BulkEditPanelProps> = ({
    selectedCount,
    bulkEditField,
    bulkEditValue,
    onFieldChange,
    onValueChange,
    onApply,
    onCancel,
    availableCategories,
    availableUsages,
    availableTiers
}) => {
    const isCustomValue = bulkEditValue === '__custom__';
    const canApply = bulkEditField && bulkEditValue && !isCustomValue;

    return (
        <div className="border border-gray-600 p-4 rounded mb-4">
            <h3 className="text-lg font-bold mb-2">Bulk Edit {selectedCount} Types</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Field Selection */}
                <div>
                    <label className="block text-sm mb-1 opacity-70">Field to Edit</label>
                    <select
                        value={bulkEditField}
                        onChange={(e) => {
                            onFieldChange(e.target.value);
                            onValueChange(''); // Reset value when field changes
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

                {/* Value Input/Selection */}
                <div>
                    <label className="block text-sm mb-1 opacity-70">New Value</label>

                    {/* Category Dropdown */}
                    {bulkEditField === 'category' && (
                        <select
                            value={bulkEditValue}
                            onChange={(e) => onValueChange(e.target.value)}
                            className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                        >
                            <option value="">Select Category...</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="__custom__">⊕ Enter Custom...</option>
                        </select>
                    )}

                    {/* Usage Dropdown */}
                    {(bulkEditField === 'addUsage' || bulkEditField === 'removeUsage') && (
                        <select
                            value={bulkEditValue}
                            onChange={(e) => onValueChange(e.target.value)}
                            className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                        >
                            <option value="">Select Usage...</option>
                            {availableUsages.map(usage => (
                                <option key={usage} value={usage}>{usage}</option>
                            ))}
                            <option value="__custom__">⊕ Enter Custom...</option>
                        </select>
                    )}

                    {/* Tier Dropdown */}
                    {(bulkEditField === 'addValue' || bulkEditField === 'removeValue') && (
                        <select
                            value={bulkEditValue}
                            onChange={(e) => onValueChange(e.target.value)}
                            className="w-full p-2 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded"
                        >
                            <option value="">Select Tier...</option>
                            {availableTiers.map(tier => (
                                <option key={tier} value={tier}>{tier}</option>
                            ))}
                            <option value="__custom__">⊕ Enter Custom...</option>
                        </select>
                    )}

                    {/* Text Input for Numeric Fields */}
                    {bulkEditField && !['category', 'addUsage', 'removeUsage', 'addValue', 'removeValue'].includes(bulkEditField) && (
                        <VscodeTextfield
                            value={bulkEditValue}
                            onInput={(e: any) => onValueChange(e.target.value)}
                            placeholder="Enter value..."
                        />
                    )}

                    {/* Disabled Input When No Field Selected */}
                    {!bulkEditField && (
                        <VscodeTextfield
                            value={bulkEditValue}
                            onInput={(e: any) => onValueChange(e.target.value)}
                            placeholder="Select a field first..."
                            disabled
                        />
                    )}

                    {/* Custom Value Input */}
                    {isCustomValue && (
                        <VscodeTextfield
                            value=""
                            onInput={(e: any) => onValueChange(e.target.value)}
                            placeholder="Enter custom value..."
                            className="mt-2"
                        />
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 items-end">
                    <VscodeButton onClick={onApply} disabled={!canApply}>
                        Apply
                    </VscodeButton>
                    <VscodeButton onClick={onCancel}>
                        Cancel
                    </VscodeButton>
                </div>
            </div>
        </div>
    );
};

export default BulkEditPanel;
