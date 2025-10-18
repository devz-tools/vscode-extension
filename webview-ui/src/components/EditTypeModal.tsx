/**
 * EditTypeModal Component
 * Modal dialog for editing a single type entry with all its properties
 */
import React from 'react';
import { VscodeButton, VscodeTextfield, VscodeCheckbox } from '@vscode-elements/react-elements';
import { TypeEntry } from '../types/types';

interface EditTypeModalProps {
    /** The type being edited */
    editingType: TypeEntry;
    /** Callback to update the editing type */
    onUpdateType: (type: TypeEntry) => void;
    /** Callback when save button is clicked */
    onSave: () => void;
    /** Callback when cancel button is clicked */
    onCancel: () => void;
    /** Available usages in the document for checkbox selection */
    availableUsages: string[];
    /** Available tier values in the document for checkbox selection */
    availableTiers: string[];
}

/**
 * Full-featured modal for editing all properties of a type entry
 * Includes numeric fields, flags, category, usages, and tier values
 */
const EditTypeModal: React.FC<EditTypeModalProps> = ({
    editingType,
    onUpdateType,
    onSave,
    onCancel,
    availableUsages,
    availableTiers
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--vscode-editor-background)] border border-gray-600 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Edit Type: {editingType.name}</h2>

                {/* Numeric Fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">nominal</label>
                        <VscodeTextfield
                            value={String(editingType.nominal)}
                            onInput={(e: any) => onUpdateType({ ...editingType, nominal: parseInt(e.target.value, 10) || 0 })}
                            placeholder="Number of items spawned"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">min</label>
                        <VscodeTextfield
                            value={String(editingType.min)}
                            onInput={(e: any) => onUpdateType({ ...editingType, min: parseInt(e.target.value, 10) || 0 })}
                            placeholder="Minimum items to maintain"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">lifetime</label>
                        <VscodeTextfield
                            value={String(editingType.lifetime)}
                            onInput={(e: any) => onUpdateType({ ...editingType, lifetime: parseInt(e.target.value, 10) || 0 })}
                            placeholder="Seconds before despawn"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">restock</label>
                        <VscodeTextfield
                            value={String(editingType.restock)}
                            onInput={(e: any) => onUpdateType({ ...editingType, restock: parseInt(e.target.value, 10) || 0 })}
                            placeholder="Seconds between respawns"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">quantmin</label>
                        <VscodeTextfield
                            value={String(editingType.quantmin)}
                            onInput={(e: any) => onUpdateType({ ...editingType, quantmin: parseInt(e.target.value, 10) || -1 })}
                            placeholder="Min stack quantity (-1 for N/A)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">quantmax</label>
                        <VscodeTextfield
                            value={String(editingType.quantmax)}
                            onInput={(e: any) => onUpdateType({ ...editingType, quantmax: parseInt(e.target.value, 10) || -1 })}
                            placeholder="Max stack quantity (-1 for N/A)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">cost</label>
                        <VscodeTextfield
                            value={String(editingType.cost)}
                            onInput={(e: any) => onUpdateType({ ...editingType, cost: parseInt(e.target.value, 10) || 100 })}
                            placeholder="Economy cost/priority"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 opacity-70 font-mono">category</label>
                        <VscodeTextfield
                            value={editingType.category}
                            onInput={(e: any) => onUpdateType({ ...editingType, category: e.target.value })}
                            placeholder="Item category"
                        />
                    </div>
                </div>

                {/* Flags Section */}
                <div className="mb-4">
                    <h3 className="font-bold mb-2 font-mono">flags</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <VscodeCheckbox
                            checked={editingType.flags.count_in_cargo === '1'}
                            onChange={(e: any) => onUpdateType({
                                ...editingType,
                                flags: { ...editingType.flags, count_in_cargo: e.target.checked ? '1' : '0' }
                            })}
                        >
                            <span className="font-mono text-sm">count_in_cargo</span>
                        </VscodeCheckbox>

                        <VscodeCheckbox
                            checked={editingType.flags.count_in_hoarder === '1'}
                            onChange={(e: any) => onUpdateType({
                                ...editingType,
                                flags: { ...editingType.flags, count_in_hoarder: e.target.checked ? '1' : '0' }
                            })}
                        >
                            <span className="font-mono text-sm">count_in_hoarder</span>
                        </VscodeCheckbox>

                        <VscodeCheckbox
                            checked={editingType.flags.count_in_map === '1'}
                            onChange={(e: any) => onUpdateType({
                                ...editingType,
                                flags: { ...editingType.flags, count_in_map: e.target.checked ? '1' : '0' }
                            })}
                        >
                            <span className="font-mono text-sm">count_in_map</span>
                        </VscodeCheckbox>

                        <VscodeCheckbox
                            checked={editingType.flags.count_in_player === '1'}
                            onChange={(e: any) => onUpdateType({
                                ...editingType,
                                flags: { ...editingType.flags, count_in_player: e.target.checked ? '1' : '0' }
                            })}
                        >
                            <span className="font-mono text-sm">count_in_player</span>
                        </VscodeCheckbox>

                        <VscodeCheckbox
                            checked={editingType.flags.crafted === '1'}
                            onChange={(e: any) => onUpdateType({
                                ...editingType,
                                flags: { ...editingType.flags, crafted: e.target.checked ? '1' : '0' }
                            })}
                        >
                            <span className="font-mono text-sm">crafted</span>
                        </VscodeCheckbox>

                        <VscodeCheckbox
                            checked={editingType.flags.deloot === '1'}
                            onChange={(e: any) => onUpdateType({
                                ...editingType,
                                flags: { ...editingType.flags, deloot: e.target.checked ? '1' : '0' }
                            })}
                        >
                            <span className="font-mono text-sm">deloot</span>
                        </VscodeCheckbox>
                    </div>
                </div>

                {/* Usages Section */}
                <div className="mb-4">
                    <h3 className="font-bold mb-2 font-mono">usage</h3>
                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto border border-[var(--vscode-input-border)] rounded p-3 bg-[var(--vscode-input-background)]">
                        {availableUsages.length === 0 ? (
                            <div className="col-span-4 text-center text-sm opacity-70">No usages found in document</div>
                        ) : (
                            availableUsages.map(usage => (
                                <VscodeCheckbox
                                    key={usage}
                                    checked={editingType.usages.includes(usage)}
                                    onChange={(e: any) => {
                                        const newUsages = e.target.checked
                                            ? [...editingType.usages, usage]
                                            : editingType.usages.filter(u => u !== usage);
                                        onUpdateType({ ...editingType, usages: newUsages });
                                    }}
                                >
                                    <span className="text-sm">{usage}</span>
                                </VscodeCheckbox>
                            ))
                        )}
                    </div>
                </div>

                {/* Tier Values Section */}
                <div className="mb-4">
                    <h3 className="font-bold mb-2 font-mono">value</h3>
                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto border border-[var(--vscode-input-border)] rounded p-3 bg-[var(--vscode-input-background)]">
                        {availableTiers.length === 0 ? (
                            <div className="col-span-4 text-center text-sm opacity-70">No tiers found in document</div>
                        ) : (
                            availableTiers.map(tier => (
                                <VscodeCheckbox
                                    key={tier}
                                    checked={editingType.values.includes(tier)}
                                    onChange={(e: any) => {
                                        const newValues = e.target.checked
                                            ? [...editingType.values, tier]
                                            : editingType.values.filter(v => v !== tier);
                                        onUpdateType({ ...editingType, values: newValues });
                                    }}
                                >
                                    <span className="text-sm">{tier}</span>
                                </VscodeCheckbox>
                            ))
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                    <VscodeButton onClick={onSave}>
                        💾 Save Changes
                    </VscodeButton>
                    <VscodeButton onClick={onCancel}>
                        Cancel
                    </VscodeButton>
                </div>
            </div>
        </div>
    );
};

export default EditTypeModal;
