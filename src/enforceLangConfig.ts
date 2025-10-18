import * as vscode from 'vscode';

/**
 * Configuration for Enforce script language support
 * Provides basic syntax highlighting and language features for DayZ Enforce Script
 */
export interface EnforceLanguageConfig {
    /** Language identifier */
    id: string;
    /** File extensions */
    extensions: string[];
    /** Language configuration */
    configuration: vscode.LanguageConfiguration;
}

/**
 * Gets the Enforce script language configuration
 * Based on the official Enforce Script syntax documentation from Bohemia Interactive
 * @returns Language configuration for Enforce script
 * @see enforce-script-syntax.md for complete language reference
 */
export function getEnforceLanguageConfig(): EnforceLanguageConfig {
    return {
        id: 'enforcescript',
        extensions: ['.c', '.cpp'],
        configuration: {
            comments: {
                lineComment: '//',
                blockComment: ['/*', '*/']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            // Word pattern for Enforce Script (supports identifiers with underscores and numbers)
            wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
            // Indentation rules for auto-indent
            indentationRules: {
                increaseIndentPattern: new RegExp('^((?!\\/\\/).)*((\\{[^}"\'`]*|\\([^)"\'`]*|\\[[^\\]"\'`]*)|\b(class|for|while|if|else|switch|case|default)\\b[^;]*)\\s*$'),
                decreaseIndentPattern: new RegExp('^((?!.*?\\/\\*).*\\*/|(?!.*\\/\\/).*)?\\s*[\\}\\]\\)].*$')
            },
            // On enter rules for special formatting
            onEnterRules: [
                {
                    // Between curly braces
                    beforeText: /^\s*\{[^}]*$/,
                    afterText: /^\s*\}/,
                    action: { indentAction: vscode.IndentAction.IndentOutdent }
                },
                {
                    // After opening brace
                    beforeText: /^\s*\{[^}]*$/,
                    action: { indentAction: vscode.IndentAction.Indent }
                }
            ]
        }
    };
}
