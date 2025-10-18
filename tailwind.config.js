/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./webview-ui/src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // VSCode Editor Colors
                'editor-background': 'var(--vscode-editor-background)',
                'editor-foreground': 'var(--vscode-editor-foreground)',
                'editor-inactive-foreground': 'var(--vscode-editor-inactiveForeground)',
                'editor-selection-background': 'var(--vscode-editor-selectionBackground)',
                'editor-selection-foreground': 'var(--vscode-editor-selectionForeground)',
                'editor-inactive-selection-background': 'var(--vscode-editor-inactiveSelectionBackground)',
                'editor-selection-highlight-background': 'var(--vscode-editor-selectionHighlightBackground)',
                'editor-line-highlight': 'var(--vscode-editor-lineHighlightBackground)',
                'editor-line-highlight-border': 'var(--vscode-editor-lineHighlightBorder)',
                'editor-cursor': 'var(--vscode-editorCursor-foreground)',
                'editor-cursor-background': 'var(--vscode-editorCursor-background)',
                'editor-whitespace': 'var(--vscode-editorWhitespace-foreground)',
                'editor-indent-guide': 'var(--vscode-editorIndentGuide-background)',
                'editor-indent-guide-active': 'var(--vscode-editorIndentGuide-activeBackground)',
                'editor-ruler': 'var(--vscode-editorRuler-foreground)',
                'editor-link': 'var(--vscode-editorLink-activeForeground)',
                'editor-range-highlight': 'var(--vscode-editor-rangeHighlightBackground)',
                'editor-range-highlight-border': 'var(--vscode-editor-rangeHighlightBorder)',
                'editor-symbol-highlight': 'var(--vscode-editor-symbolHighlightBackground)',
                'editor-symbol-highlight-border': 'var(--vscode-editor-symbolHighlightBorder)',
                'editor-find-match': 'var(--vscode-editor-findMatchBackground)',
                'editor-find-match-highlight': 'var(--vscode-editor-findMatchHighlightBackground)',
                'editor-find-match-border': 'var(--vscode-editor-findMatchBorder)',
                'editor-find-range-highlight': 'var(--vscode-editor-findRangeHighlightBackground)',
                'editor-find-range-highlight-border': 'var(--vscode-editor-findRangeHighlightBorder)',
                'editor-word-highlight': 'var(--vscode-editor-wordHighlightBackground)',
                'editor-word-highlight-strong': 'var(--vscode-editor-wordHighlightStrongBackground)',
                'editor-hover-background': 'var(--vscode-editorHoverWidget-background)',
                'editor-hover-border': 'var(--vscode-editorHoverWidget-border)',
                'editor-hover-foreground': 'var(--vscode-editorHoverWidget-foreground)',
                'editor-widget-background': 'var(--vscode-editorWidget-background)',
                'editor-widget-border': 'var(--vscode-editorWidget-border)',
                'editor-widget-foreground': 'var(--vscode-editorWidget-foreground)',
                'editor-widget-resize-background': 'var(--vscode-editorWidget-resizeBorder)',
                'editor-suggest-widget-background': 'var(--vscode-editorSuggestWidget-background)',
                'editor-suggest-widget-border': 'var(--vscode-editorSuggestWidget-border)',
                'editor-suggest-widget-foreground': 'var(--vscode-editorSuggestWidget-foreground)',
                'editor-suggest-widget-selected-background': 'var(--vscode-editorSuggestWidget-selectedBackground)',
                'editor-suggest-widget-highlight-foreground': 'var(--vscode-editorSuggestWidget-highlightForeground)',

                // VSCode Button Colors
                'button-background': 'var(--vscode-button-background)',
                'button-foreground': 'var(--vscode-button-foreground)',
                'button-hover': 'var(--vscode-button-hoverBackground)',
                'button-secondary-background': 'var(--vscode-button-secondaryBackground)',
                'button-secondary-foreground': 'var(--vscode-button-secondaryForeground)',
                'button-secondary-hover': 'var(--vscode-button-secondaryHoverBackground)',

                // VSCode Input Colors
                'input-background': 'var(--vscode-input-background)',
                'input-foreground': 'var(--vscode-input-foreground)',
                'input-border': 'var(--vscode-input-border)',
                'input-placeholder': 'var(--vscode-input-placeholderForeground)',
                'input-focus-border': 'var(--vscode-focusBorder)',

                // VSCode Dropdown Colors
                'dropdown-background': 'var(--vscode-dropdown-background)',
                'dropdown-foreground': 'var(--vscode-dropdown-foreground)',
                'dropdown-border': 'var(--vscode-dropdown-border)',

                // VSCode Checkbox Colors
                'checkbox-background': 'var(--vscode-checkbox-background)',
                'checkbox-foreground': 'var(--vscode-checkbox-foreground)',
                'checkbox-border': 'var(--vscode-checkbox-border)',

                // VSCode List Colors
                'list-active-background': 'var(--vscode-list-activeSelectionBackground)',
                'list-active-foreground': 'var(--vscode-list-activeSelectionForeground)',
                'list-active-icon-foreground': 'var(--vscode-list-activeSelectionIconForeground)',
                'list-inactive-background': 'var(--vscode-list-inactiveSelectionBackground)',
                'list-inactive-foreground': 'var(--vscode-list-inactiveSelectionForeground)',
                'list-inactive-icon-foreground': 'var(--vscode-list-inactiveSelectionIconForeground)',
                'list-hover-background': 'var(--vscode-list-hoverBackground)',
                'list-hover-foreground': 'var(--vscode-list-hoverForeground)',
                'list-focus-background': 'var(--vscode-list-focusBackground)',
                'list-focus-foreground': 'var(--vscode-list-focusForeground)',
                'list-focus-outline': 'var(--vscode-list-focusOutline)',
                'list-drop-background': 'var(--vscode-list-dropBackground)',
                'list-highlight-foreground': 'var(--vscode-list-highlightForeground)',
                'list-invalid-item-foreground': 'var(--vscode-list-invalidItemForeground)',
                'list-error-foreground': 'var(--vscode-list-errorForeground)',
                'list-warning-foreground': 'var(--vscode-list-warningForeground)',
                'list-filter-widget-background': 'var(--vscode-listFilterWidget-background)',
                'list-filter-widget-outline': 'var(--vscode-listFilterWidget-outline)',
                'list-filter-widget-no-matches-outline': 'var(--vscode-listFilterWidget-noMatchesOutline)',

                // VSCode Sidebar Colors
                'sidebar-background': 'var(--vscode-sideBar-background)',
                'sidebar-foreground': 'var(--vscode-sideBar-foreground)',
                'sidebar-border': 'var(--vscode-sideBar-border)',
                'sidebar-title': 'var(--vscode-sideBarTitle-foreground)',
                'sidebar-section-header-background': 'var(--vscode-sideBarSectionHeader-background)',
                'sidebar-section-header-foreground': 'var(--vscode-sideBarSectionHeader-foreground)',
                'sidebar-section-header-border': 'var(--vscode-sideBarSectionHeader-border)',

                // VSCode Activity Bar Colors
                'activitybar-background': 'var(--vscode-activityBar-background)',
                'activitybar-foreground': 'var(--vscode-activityBar-foreground)',
                'activitybar-inactive-foreground': 'var(--vscode-activityBar-inactiveForeground)',
                'activitybar-border': 'var(--vscode-activityBar-border)',
                'activitybar-active-border': 'var(--vscode-activityBar-activeBorder)',
                'activitybar-active-focus-border': 'var(--vscode-activityBar-activeFocusBorder)',
                'activitybar-active-background': 'var(--vscode-activityBar-activeBackground)',
                'activitybar-drop-background': 'var(--vscode-activityBar-dropBackground)',
                'activitybar-badge-background': 'var(--vscode-activityBarBadge-background)',
                'activitybar-badge-foreground': 'var(--vscode-activityBarBadge-foreground)',

                // VSCode Panel Colors
                'panel-background': 'var(--vscode-panel-background)',
                'panel-foreground': 'var(--vscode-panel-foreground)',
                'panel-border': 'var(--vscode-panel-border)',
                'panel-drop-background': 'var(--vscode-panel-dropBackground)',
                'panel-section-border': 'var(--vscode-panelSection-border)',
                'panel-section-drop-background': 'var(--vscode-panelSectionHeader-background)',
                'panel-title-active-border': 'var(--vscode-panelTitle-activeBorder)',
                'panel-title-active-foreground': 'var(--vscode-panelTitle-activeForeground)',
                'panel-title-inactive-foreground': 'var(--vscode-panelTitle-inactiveForeground)',

                // VSCode Badge Colors
                'badge-background': 'var(--vscode-badge-background)',
                'badge-foreground': 'var(--vscode-badge-foreground)',

                // VSCode Notification Colors
                'notification-background': 'var(--vscode-notifications-background)',
                'notification-foreground': 'var(--vscode-notifications-foreground)',
                'notification-border': 'var(--vscode-notifications-border)',
                'notification-info-background': 'var(--vscode-notificationsInfoIcon-foreground)',
                'notification-warning-background': 'var(--vscode-notificationsWarningIcon-foreground)',
                'notification-error-background': 'var(--vscode-notificationsErrorIcon-foreground)',

                // VSCode Progress Bar
                'progress-background': 'var(--vscode-progressBar-background)',

                // VSCode Scrollbar Colors
                'scrollbar-background': 'var(--vscode-scrollbarSlider-background)',
                'scrollbar-hover': 'var(--vscode-scrollbarSlider-hoverBackground)',
                'scrollbar-active': 'var(--vscode-scrollbarSlider-activeBackground)',

                // VSCode Text Colors
                'text-link': 'var(--vscode-textLink-foreground)',
                'text-link-active': 'var(--vscode-textLink-activeForeground)',
                'text-preformat': 'var(--vscode-textPreformat-foreground)',
                'text-separator': 'var(--vscode-textSeparator-foreground)',
                'text-blockquote': 'var(--vscode-textBlockQuote-background)',

                // VSCode Tab Colors
                'tab-active-background': 'var(--vscode-tab-activeBackground)',
                'tab-active-foreground': 'var(--vscode-tab-activeForeground)',
                'tab-active-border': 'var(--vscode-tab-activeBorder)',
                'tab-active-border-top': 'var(--vscode-tab-activeBorderTop)',
                'tab-active-modified-border': 'var(--vscode-tab-activeModifiedBorder)',
                'tab-unfocused-active-background': 'var(--vscode-tab-unfocusedActiveBackground)',
                'tab-unfocused-active-foreground': 'var(--vscode-tab-unfocusedActiveForeground)',
                'tab-unfocused-active-border': 'var(--vscode-tab-unfocusedActiveBorder)',
                'tab-unfocused-active-border-top': 'var(--vscode-tab-unfocusedActiveBorderTop)',
                'tab-unfocused-active-modified-border': 'var(--vscode-tab-unfocusedActiveModifiedBorder)',
                'tab-inactive-background': 'var(--vscode-tab-inactiveBackground)',
                'tab-inactive-foreground': 'var(--vscode-tab-inactiveForeground)',
                'tab-inactive-modified-border': 'var(--vscode-tab-inactiveModifiedBorder)',
                'tab-unfocused-inactive-background': 'var(--vscode-tab-unfocusedInactiveBackground)',
                'tab-unfocused-inactive-foreground': 'var(--vscode-tab-unfocusedInactiveForeground)',
                'tab-unfocused-inactive-modified-border': 'var(--vscode-tab-unfocusedInactiveModifiedBorder)',
                'tab-border': 'var(--vscode-tab-border)',
                'tab-hover-background': 'var(--vscode-tab-hoverBackground)',
                'tab-hover-foreground': 'var(--vscode-tab-hoverForeground)',
                'tab-hover-border': 'var(--vscode-tab-hoverBorder)',
                'tab-unfocused-hover-background': 'var(--vscode-tab-unfocusedHoverBackground)',
                'tab-unfocused-hover-foreground': 'var(--vscode-tab-unfocusedHoverForeground)',
                'tab-unfocused-hover-border': 'var(--vscode-tab-unfocusedHoverBorder)',
                'editor-group-border': 'var(--vscode-editorGroup-border)',
                'editor-group-drop-background': 'var(--vscode-editorGroup-dropBackground)',
                'editor-group-header-tabs-background': 'var(--vscode-editorGroupHeader-tabsBackground)',
                'editor-group-header-tabs-border': 'var(--vscode-editorGroupHeader-tabsBorder)',
                'editor-group-header-no-tabs-background': 'var(--vscode-editorGroupHeader-noTabsBackground)',
                'editor-group-empty-background': 'var(--vscode-editorGroup-emptyBackground)',

                // VSCode Status Bar Colors
                'statusbar-background': 'var(--vscode-statusBar-background)',
                'statusbar-foreground': 'var(--vscode-statusBar-foreground)',
                'statusbar-border': 'var(--vscode-statusBar-border)',
                'statusbar-debug-background': 'var(--vscode-statusBar-debuggingBackground)',
                'statusbar-debug-foreground': 'var(--vscode-statusBar-debuggingForeground)',
                'statusbar-debug-border': 'var(--vscode-statusBar-debuggingBorder)',
                'statusbar-no-folder-background': 'var(--vscode-statusBar-noFolderBackground)',
                'statusbar-no-folder-foreground': 'var(--vscode-statusBar-noFolderForeground)',
                'statusbar-no-folder-border': 'var(--vscode-statusBar-noFolderBorder)',
                'statusbar-item-hover-background': 'var(--vscode-statusBarItem-hoverBackground)',
                'statusbar-item-active-background': 'var(--vscode-statusBarItem-activeBackground)',
                'statusbar-item-prominent-background': 'var(--vscode-statusBarItem-prominentBackground)',
                'statusbar-item-prominent-foreground': 'var(--vscode-statusBarItem-prominentForeground)',
                'statusbar-item-prominent-hover': 'var(--vscode-statusBarItem-prominentHoverBackground)',
                'statusbar-item-error-background': 'var(--vscode-statusBarItem-errorBackground)',
                'statusbar-item-error-foreground': 'var(--vscode-statusBarItem-errorForeground)',
                'statusbar-item-warning-background': 'var(--vscode-statusBarItem-warningBackground)',
                'statusbar-item-warning-foreground': 'var(--vscode-statusBarItem-warningForeground)',

                // VSCode Terminal Colors
                'terminal-background': 'var(--vscode-terminal-background)',
                'terminal-foreground': 'var(--vscode-terminal-foreground)',
                'terminal-cursor': 'var(--vscode-terminalCursor-foreground)',
                'terminal-cursor-background': 'var(--vscode-terminalCursor-background)',
                'terminal-selection': 'var(--vscode-terminal-selectionBackground)',
                'terminal-border': 'var(--vscode-terminal-border)',
                'terminal-ansi-black': 'var(--vscode-terminal-ansiBlack)',
                'terminal-ansi-red': 'var(--vscode-terminal-ansiRed)',
                'terminal-ansi-green': 'var(--vscode-terminal-ansiGreen)',
                'terminal-ansi-yellow': 'var(--vscode-terminal-ansiYellow)',
                'terminal-ansi-blue': 'var(--vscode-terminal-ansiBlue)',
                'terminal-ansi-magenta': 'var(--vscode-terminal-ansiMagenta)',
                'terminal-ansi-cyan': 'var(--vscode-terminal-ansiCyan)',
                'terminal-ansi-white': 'var(--vscode-terminal-ansiWhite)',
                'terminal-ansi-bright-black': 'var(--vscode-terminal-ansiBrightBlack)',
                'terminal-ansi-bright-red': 'var(--vscode-terminal-ansiBrightRed)',
                'terminal-ansi-bright-green': 'var(--vscode-terminal-ansiBrightGreen)',
                'terminal-ansi-bright-yellow': 'var(--vscode-terminal-ansiBrightYellow)',
                'terminal-ansi-bright-blue': 'var(--vscode-terminal-ansiBrightBlue)',
                'terminal-ansi-bright-magenta': 'var(--vscode-terminal-ansiBrightMagenta)',
                'terminal-ansi-bright-cyan': 'var(--vscode-terminal-ansiBrightCyan)',
                'terminal-ansi-bright-white': 'var(--vscode-terminal-ansiBrightWhite)',

                // VSCode Menu Colors
                'menu-background': 'var(--vscode-menu-background)',
                'menu-foreground': 'var(--vscode-menu-foreground)',
                'menu-selection-background': 'var(--vscode-menu-selectionBackground)',
                'menu-selection-foreground': 'var(--vscode-menu-selectionForeground)',
                'menu-separator-background': 'var(--vscode-menu-separatorBackground)',
                'menu-border': 'var(--vscode-menu-border)',
                'menubar-selection-background': 'var(--vscode-menubar-selectionBackground)',
                'menubar-selection-foreground': 'var(--vscode-menubar-selectionForeground)',
                'menubar-selection-border': 'var(--vscode-menubar-selectionBorder)',

                // VSCode Tree Colors
                'tree-indent-guide': 'var(--vscode-tree-indentGuidesStroke)',

                // VSCode Peek View Colors
                'peek-background': 'var(--vscode-peekViewEditor-background)',
                'peek-result-background': 'var(--vscode-peekViewResult-background)',
                'peek-title-background': 'var(--vscode-peekViewTitle-background)',

                // VSCode Diff Editor Colors
                'diff-inserted': 'var(--vscode-diffEditor-insertedTextBackground)',
                'diff-removed': 'var(--vscode-diffEditor-removedTextBackground)',

                // VSCode Git Colors
                'git-added': 'var(--vscode-gitDecoration-addedResourceForeground)',
                'git-modified': 'var(--vscode-gitDecoration-modifiedResourceForeground)',
                'git-deleted': 'var(--vscode-gitDecoration-deletedResourceForeground)',
                'git-untracked': 'var(--vscode-gitDecoration-untrackedResourceForeground)',
                'git-ignored': 'var(--vscode-gitDecoration-ignoredResourceForeground)',
                'git-conflict': 'var(--vscode-gitDecoration-conflictingResourceForeground)',

                // VSCode Error/Warning/Info Colors
                'error': 'var(--vscode-errorForeground)',
                'error-background': 'var(--vscode-errorBackground)',
                'error-border': 'var(--vscode-errorBorder)',
                'warning': 'var(--vscode-warningForeground)',
                'warning-background': 'var(--vscode-warningBackground)',
                'warning-border': 'var(--vscode-warningBorder)',
                'info': 'var(--vscode-infoForeground)',
                'info-background': 'var(--vscode-infoBackground)',
                'info-border': 'var(--vscode-infoBorder)',

                // VSCode Titlebar Colors
                'titlebar-active-background': 'var(--vscode-titleBar-activeBackground)',
                'titlebar-active-foreground': 'var(--vscode-titleBar-activeForeground)',
                'titlebar-inactive-background': 'var(--vscode-titleBar-inactiveBackground)',
                'titlebar-inactive-foreground': 'var(--vscode-titleBar-inactiveForeground)',
                'titlebar-border': 'var(--vscode-titleBar-border)',

                // VSCode Breadcrumbs Colors
                'breadcrumb-foreground': 'var(--vscode-breadcrumb-foreground)',
                'breadcrumb-background': 'var(--vscode-breadcrumb-background)',
                'breadcrumb-focus-foreground': 'var(--vscode-breadcrumb-focusForeground)',
                'breadcrumb-active-foreground': 'var(--vscode-breadcrumb-activeSelectionForeground)',
                'breadcrumb-picker-background': 'var(--vscode-breadcrumbPicker-background)',

                // VSCode Snippets Colors
                'snippet-tab-stop-highlight': 'var(--vscode-editor-snippetTabstopHighlightBackground)',
                'snippet-tab-stop-highlight-border': 'var(--vscode-editor-snippetTabstopHighlightBorder)',
                'snippet-final-tab-stop-highlight': 'var(--vscode-editor-snippetFinalTabstopHighlightBackground)',
                'snippet-final-tab-stop-highlight-border': 'var(--vscode-editor-snippetFinalTabstopHighlightBorder)',

                // VSCode Merge Conflicts Colors
                'merge-current-header': 'var(--vscode-merge-currentHeaderBackground)',
                'merge-current-content': 'var(--vscode-merge-currentContentBackground)',
                'merge-incoming-header': 'var(--vscode-merge-incomingHeaderBackground)',
                'merge-incoming-content': 'var(--vscode-merge-incomingContentBackground)',
                'merge-common-header': 'var(--vscode-merge-commonHeaderBackground)',
                'merge-common-content': 'var(--vscode-merge-commonContentBackground)',
                'merge-border': 'var(--vscode-merge-border)',

                // VSCode Quick Picker Colors
                'quick-picker-background': 'var(--vscode-quickInput-background)',
                'quick-picker-foreground': 'var(--vscode-quickInput-foreground)',
                'quick-picker-group-foreground': 'var(--vscode-pickerGroup-foreground)',
                'quick-picker-group-border': 'var(--vscode-pickerGroup-border)',

                // VSCode Settings Editor Colors
                'settings-header-foreground': 'var(--vscode-settings-headerForeground)',
                'settings-modified-item-indicator': 'var(--vscode-settings-modifiedItemIndicator)',
                'settings-dropdown-background': 'var(--vscode-settings-dropdownBackground)',
                'settings-dropdown-foreground': 'var(--vscode-settings-dropdownForeground)',
                'settings-dropdown-border': 'var(--vscode-settings-dropdownBorder)',
                'settings-dropdown-list-border': 'var(--vscode-settings-dropdownListBorder)',
                'settings-checkbox-background': 'var(--vscode-settings-checkboxBackground)',
                'settings-checkbox-foreground': 'var(--vscode-settings-checkboxForeground)',
                'settings-checkbox-border': 'var(--vscode-settings-checkboxBorder)',
                'settings-text-input-background': 'var(--vscode-settings-textInputBackground)',
                'settings-text-input-foreground': 'var(--vscode-settings-textInputForeground)',
                'settings-text-input-border': 'var(--vscode-settings-textInputBorder)',
                'settings-number-input-background': 'var(--vscode-settings-numberInputBackground)',
                'settings-number-input-foreground': 'var(--vscode-settings-numberInputForeground)',
                'settings-number-input-border': 'var(--vscode-settings-numberInputBorder)',

                // VSCode Welcome Page Colors
                'welcome-page-button-background': 'var(--vscode-welcomePage-buttonBackground)',
                'welcome-page-button-hover': 'var(--vscode-welcomePage-buttonHoverBackground)',
                'welcome-page-progress': 'var(--vscode-welcomePage-progress-background)',
                'welcome-page-progress-foreground': 'var(--vscode-welcomePage-progress-foreground)',

                // VSCode Walkthrough Colors
                'walkthrough-step-title-foreground': 'var(--vscode-walkThrough-embeddedEditorBackground)',

                // VSCode Debug Colors
                'debug-toolbar-background': 'var(--vscode-debugToolBar-background)',
                'debug-toolbar-border': 'var(--vscode-debugToolBar-border)',
                'debug-exception-widget-background': 'var(--vscode-debugExceptionWidget-background)',
                'debug-exception-widget-border': 'var(--vscode-debugExceptionWidget-border)',

                // VSCode Focus Border
                'focus-border': 'var(--vscode-focusBorder)',

                // VSCode Contrast Colors
                'contrast-active-border': 'var(--vscode-contrastActiveBorder)',
                'contrast-border': 'var(--vscode-contrastBorder)',

                // VSCode Description Foreground
                'description-foreground': 'var(--vscode-descriptionForeground)',

                // VSCode Icon Foreground
                'icon-foreground': 'var(--vscode-icon-foreground)',

                // VSCode Selection Colors
                'selection-background': 'var(--vscode-selection-background)',

                // VSCode Widget Shadow
                'widget-shadow': 'var(--vscode-widget-shadow)',

                // VSCode Toolbar Colors
                'toolbar-hover-background': 'var(--vscode-toolbar-hoverBackground)',
                'toolbar-active-background': 'var(--vscode-toolbar-activeBackground)',
            },
        },
    },
    plugins: [],
}
