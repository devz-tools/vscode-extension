import * as vscode from 'vscode';
import { getModsSummary, ModInfo } from './directoryManager';

export class ModHoverProvider implements vscode.HoverProvider {
    private modInfoCache: Map<string, ModInfo> = new Map();
    private lastCacheUpdate: number = 0;
    private readonly cacheTimeout = 30000; // 30 seconds

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        // Check if tooltips are enabled
        const config = vscode.workspace.getConfiguration('devz-tools');
        if (!config.get<boolean>('enableModTooltips', true)) {
            return undefined;
        }

        // Only process settings.json files
        if (!document.fileName.endsWith('settings.json')) {
            return undefined;
        }

        // Get the line text
        const line = document.lineAt(position);
        const lineText = line.text;

        // Check if this line contains a mod ID (either active or commented out)
        let modIdMatch: RegExpMatchArray | null = null;
        let isCommented = false;

        // First try to match commented out mod IDs - must start with // (after optional whitespace)
        modIdMatch = lineText.match(/^\s*\/\/\s*"(\d{6,})"/);
        if (modIdMatch) {
            isCommented = true;
        } else {
            // Try to match active mod IDs - anywhere in the line but not commented out
            if (!lineText.trimStart().startsWith('//')) {
                modIdMatch = lineText.match(/"(\d{6,})"/);
                isCommented = false;
            }
        }

        if (!modIdMatch) {
            return undefined;
        }

        const modId = modIdMatch[1];

        // Check if the cursor is over the mod ID
        const startIndex = lineText.indexOf(`"${modId}"`);
        const endIndex = startIndex + modId.length + 2; // +2 for quotes

        if (position.character < startIndex || position.character > endIndex) {
            return undefined;
        }

        try {
            // Update cache if needed
            await this.updateCacheIfNeeded();

            // Get mod info from cache
            const modInfo = this.modInfoCache.get(modId);
            if (!modInfo) {
                return undefined;
            }

            // Create hover content
            const hoverContent = new vscode.MarkdownString();

            if (isCommented) {
                hoverContent.appendMarkdown(`**${modInfo.name}** *(commented out)*\n\n`);
            } else {
                hoverContent.appendMarkdown(`**${modInfo.name}**\n\n`);
            }

            hoverContent.appendMarkdown(`📋 **ID:** ${modInfo.id}\n\n`);
            hoverContent.appendMarkdown(`📁 **Size:** ${this.formatBytes(modInfo.size)}\n\n`);
            hoverContent.appendMarkdown(`📂 **Path:** \`${modInfo.path}\`\n\n`);

            if (modInfo.workshopUrl) {
                hoverContent.appendMarkdown(`🔗 **Workshop:** [View on Steam Workshop](${modInfo.workshopUrl})\n\n`);
            }

            if (isCommented) {
                hoverContent.appendMarkdown(`⚠️ *This mod is currently disabled (commented out)*`);
            }

            hoverContent.isTrusted = true;
            hoverContent.supportHtml = true;

            return new vscode.Hover(hoverContent);

        } catch (error) {
            console.error('Error in ModHoverProvider:', error);
            return undefined;
        }
    }

    private async updateCacheIfNeeded(): Promise<void> {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheTimeout && this.modInfoCache.size > 0) {
            return; // Cache is still valid
        }

        try {
            const modsSummary = await getModsSummary();
            this.modInfoCache.clear();

            for (const mod of modsSummary.mods) {
                this.modInfoCache.set(mod.id, mod);
            }

            this.lastCacheUpdate = now;
        } catch (error) {
            console.error('Failed to update mod info cache:', error);
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) { return '0 Bytes'; }

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    public clearCache(): void {
        this.modInfoCache.clear();
        this.lastCacheUpdate = 0;
    }
}

export class ModInlayHintsProvider implements vscode.InlayHintsProvider {
    private modInfoCache: Map<string, ModInfo> = new Map();
    private lastCacheUpdate: number = 0;
    private readonly cacheTimeout = 30000; // 30 seconds

    async provideInlayHints(
        document: vscode.TextDocument,
        range: vscode.Range,
        token: vscode.CancellationToken
    ): Promise<vscode.InlayHint[]> {
        // Check if tooltips are enabled
        const config = vscode.workspace.getConfiguration('devz-tools');
        if (!config.get<boolean>('enableModTooltips', true)) {
            return [];
        }

        // Only process settings.json files
        if (!document.fileName.endsWith('settings.json')) {
            return [];
        }

        // Check if this document contains additionalMods
        const text = document.getText();
        if (!text.includes('"devz-tools.additionalMods"') && !text.includes('"additionalMods"')) {
            return [];
        }

        try {
            // Update cache if needed
            await this.updateCacheIfNeeded();

            const hints: vscode.InlayHint[] = [];

            // Process each line in the range
            for (let lineIndex = range.start.line; lineIndex <= range.end.line && lineIndex < document.lineCount; lineIndex++) {
                const line = document.lineAt(lineIndex);
                const lineText = line.text;

                // Check if this line contains a mod ID (either active or commented out)
                let modIdMatch: RegExpMatchArray | null = null;
                let isCommented = false;

                // First try to match commented out mod IDs - must start with // (after optional whitespace)
                modIdMatch = lineText.match(/^\s*\/\/\s*"(\d{6,})"/);
                if (modIdMatch) {
                    isCommented = true;
                } else {
                    // Try to match active mod IDs - anywhere in the line but not commented out
                    if (!lineText.trimStart().startsWith('//')) {
                        modIdMatch = lineText.match(/"(\d{6,})"/);
                        isCommented = false;
                    }
                }

                if (modIdMatch) {
                    const modId = modIdMatch[1];
                    const modInfo = this.modInfoCache.get(modId);

                    if (modInfo && !modInfo.name.startsWith('Missing Mod:') && modInfo.name !== `Workshop Mod ${modId}`) {
                        // Position hint at the end of the line, but be smart about existing comments
                        let position = lineText.length;

                        // Check if there's already a comment that contains the mod name
                        const existingCommentMatch = lineText.match(/\/\/\s*(.*)$/);
                        if (existingCommentMatch) {
                            const commentText = existingCommentMatch[1];
                            // If the existing comment already contains the mod name, don't add a hint
                            if (commentText.includes(modInfo.name)) {
                                continue; // Skip this mod, it already has a name comment
                            }
                            // Position the hint before the existing comment
                            const commentStart = lineText.indexOf(existingCommentMatch[0]);
                            position = commentStart;
                        }

                        const hintText = isCommented ? ` // ${modInfo.name} (commented)` : ` // ${modInfo.name}`;

                        const hint = new vscode.InlayHint(
                            new vscode.Position(lineIndex, position),
                            hintText,
                            vscode.InlayHintKind.Type
                        );

                        hint.tooltip = `**${modInfo.name}**\n\nSize: ${this.formatBytes(modInfo.size)}\nPath: ${modInfo.path}${isCommented ? '\n\n*This mod is currently commented out*' : ''}`;
                        hints.push(hint);
                    }
                }
            }

            return hints;

        } catch (error) {
            console.error('Error in ModInlayHintsProvider:', error);
            return [];
        }
    }

    private async updateCacheIfNeeded(): Promise<void> {
        const now = Date.now();
        if (now - this.lastCacheUpdate < this.cacheTimeout && this.modInfoCache.size > 0) {
            return; // Cache is still valid
        }

        try {
            const modsSummary = await getModsSummary();
            this.modInfoCache.clear();

            for (const mod of modsSummary.mods) {
                this.modInfoCache.set(mod.id, mod);
            }

            this.lastCacheUpdate = now;
        } catch (error) {
            console.error('Failed to update mod info cache:', error);
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) { return '0 Bytes'; }

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    public clearCache(): void {
        this.modInfoCache.clear();
        this.lastCacheUpdate = 0;
    }
}