import * as vscode from 'vscode';
import { ExtensionState } from './types';
import { createStatusBarItems, configureStatusBarItems, updateStatusBar } from './statusBar';
import { startServer, startClient, stopAllProcesses } from './processManager';
import { createModBase, packPBO, wipeServerData, wipeClientData, initializeModBoilerplate } from './fileManager';
import { validateStartupConfiguration, showValidationResults } from './validation';
import { getExtensionSettings } from './config';
import {
	openClientDirectory,
	openServerDirectory,
	openToolsDirectory,
	openProjectDriveDirectory,
	openWorkshopDirectory,
	showModsSummary
} from './directoryManager';
import { ModHoverProvider, ModInlayHintsProvider } from './modTooltipProvider';
import { createCommandHandler, createSilentCommandHandler, delay } from './utils';
import { getEnforceLanguageConfig } from './enforceLangConfig';
import { WebviewManager } from './webviewManager';
import { TypesEditorManager } from './typesEditorManager';
import { setExtensionContext, clearExtensionContext, createAndRegisterOutputChannel } from './disposables';

/**
 * Global extension state - maintains process information and logging state
 */
let extensionState: ExtensionState = {
	serverProcess: null,
	clientProcess: null,
	isShuttingDown: false,
	debugOutputChannel: null,
	logWatchers: [],
	toolsOutputChannel: null,
	logMonitoringActive: false
};

/**
 * Handles the start server and client command with proper process management
 * @param statusBarItems - The status bar items for UI updates
 */
async function handleStartServerAndClient(statusBarItems: any): Promise<void> {
	// Check if any processes are running
	const isServerRunning = extensionState.serverProcess && !extensionState.serverProcess.killed;
	const isClientRunning = extensionState.clientProcess && !extensionState.clientProcess.killed;

	if (isServerRunning || isClientRunning) {
		// Stop existing processes
		stopAllProcesses(extensionState, statusBarItems.startServerAndClient);
		return;
	}

	// Ensure mod is packed before starting
	await createModBase();
	await packPBO();

	// Start server first
	await startServer(extensionState, statusBarItems.startServerAndClient);

	// Wait for server to start, then start client
	await delay(3000);
	await startClient(extensionState, statusBarItems.startServerAndClient);
}

/**
 * Shows the log output channel for DayZ logs with quick pick selection
 * @param state - Extension state containing the log output channels
 */
async function showLogs(state: ExtensionState): Promise<void> {
	// Create available log channel options
	const logChannelOptions = [
		{ label: '$(list-tree) All Logs', description: 'Combined view of all log types', channel: 'all' },
		{ label: '$(server) Server RPT', description: 'DayZ Server runtime logs', channel: 'serverRpt' },
		{ label: '$(desktop-download) Client RPT', description: 'DayZ Client runtime logs', channel: 'clientRpt' },
		{ label: '$(file-code) Server Script Log', description: 'Server enforce script logs', channel: 'serverScriptLog' },
		{ label: '$(notebook) Client Script Log', description: 'Client enforce script logs', channel: 'clientScriptLog' },
		{ label: '$(shield) Admin Log', description: 'Server admin logs', channel: 'adminLog' },
		{ label: '$(warning) Server Crash Log', description: 'Server crash dump logs', channel: 'serverCrashLog' },
		{ label: '$(error) Client Crash Log', description: 'Client crash dump logs', channel: 'clientCrashLog' }
	];

	// Show quick pick for log channel selection
	const selected = await vscode.window.showQuickPick(logChannelOptions, {
		placeHolder: 'Select which log stream to view',
		title: 'DevZ Tools - Log Viewer'
	});

	if (!selected) {
		return;
	}

	let channelToShow: vscode.OutputChannel | null = null;

	// Get the appropriate channel based on selection
	switch (selected.channel) {
		case 'all':
			if (!state.debugOutputChannel) {
				state.debugOutputChannel = createAndRegisterOutputChannel('DevZ Debug - All Logs');
				state.debugOutputChannel.appendLine('=== DevZ Debug - All Logs ===');
				state.debugOutputChannel.appendLine('No log monitoring active. Start the server or client to begin monitoring.');
			}
			channelToShow = state.debugOutputChannel;
			break;
		case 'serverRpt':
			if (!state.serverRptOutputChannel) {
				state.serverRptOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Server RPT');
			}
			channelToShow = state.serverRptOutputChannel;
			break;
		case 'clientRpt':
			if (!state.clientRptOutputChannel) {
				state.clientRptOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Client RPT');
			}
			channelToShow = state.clientRptOutputChannel;
			break;
		case 'serverScriptLog':
			if (!state.serverScriptLogOutputChannel) {
				state.serverScriptLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Server Script Log');
			}
			channelToShow = state.serverScriptLogOutputChannel;
			break;
		case 'clientScriptLog':
			if (!state.clientScriptLogOutputChannel) {
				state.clientScriptLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Client Script Log');
			}
			channelToShow = state.clientScriptLogOutputChannel;
			break;
		case 'adminLog':
			if (!state.adminLogOutputChannel) {
				state.adminLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Admin Log');
			}
			channelToShow = state.adminLogOutputChannel;
			break;
		case 'serverCrashLog':
			if (!state.serverCrashLogOutputChannel) {
				state.serverCrashLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Server Crash Log');
			}
			channelToShow = state.serverCrashLogOutputChannel;
			break;
		case 'clientCrashLog':
			if (!state.clientCrashLogOutputChannel) {
				state.clientCrashLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Client Crash Log');
			}
			channelToShow = state.clientCrashLogOutputChannel;
			break;
	}

	// Show the selected channel
	if (channelToShow) {
		channelToShow.show();
	}
}

/**
 * Forces all .c and .cpp files in the workspace to use Enforce Script language
 * This ensures Enforce syntax highlighting takes priority over C/C++ extensions
 * @param context - The extension context for subscriptions
 * @param state - Extension state to check shutdown status
 */
function enforceLanguageOverride(context: vscode.ExtensionContext, state: ExtensionState): void {
	// Set language for all currently open .c and .cpp files
	vscode.workspace.textDocuments.forEach(document => {
		if (!state.isShuttingDown &&
			(document.fileName.endsWith('.c') || document.fileName.endsWith('.cpp')) &&
			document.languageId !== 'enforcescript') {
			vscode.languages.setTextDocumentLanguage(document, 'enforcescript');
		}
	});

	// Monitor for newly opened files and override their language
	const openTextDocumentListener = vscode.workspace.onDidOpenTextDocument(document => {
		if (!state.isShuttingDown &&
			(document.fileName.endsWith('.c') || document.fileName.endsWith('.cpp')) &&
			document.languageId !== 'enforcescript') {
			vscode.languages.setTextDocumentLanguage(document, 'enforcescript');
		}
	});

	context.subscriptions.push(openTextDocumentListener);
}/**
 * Extension activation function called when the extension is activated
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('DevZ Tools extension is now active!');

	// Store context reference for managing disposables
	setExtensionContext(context);

	// Perform startup validation
	performStartupValidation();

	// Create and configure status bar items
	const statusBarItems = createStatusBarItems();
	configureStatusBarItems(statusBarItems);

	// Register Enforce Script language support
	const enforceConfig = getEnforceLanguageConfig();
	const enforceLanguage = vscode.languages.setLanguageConfiguration(
		enforceConfig.id,
		enforceConfig.configuration
	);
	context.subscriptions.push(enforceLanguage);

	// Force Enforce language for all .c and .cpp files (overrides C/C++ extensions)
	enforceLanguageOverride(context, extensionState);

	// Register mod tooltip providers
	const modHoverProvider = new ModHoverProvider();
	const modInlayHintsProvider = new ModInlayHintsProvider();

	const hoverProviderDisposable = vscode.languages.registerHoverProvider(
		{ pattern: '**/settings.json' },
		modHoverProvider
	);

	const inlayHintsProviderDisposable = vscode.languages.registerInlayHintsProvider(
		{ pattern: '**/settings.json' },
		modInlayHintsProvider
	);

	// Register all commands using standardized error handling
	const packPBOCommand = vscode.commands.registerCommand(
		'devz-tools.packPBO',
		createCommandHandler('Pack PBO', async () => {
			await createModBase();
			await packPBO();
		})
	);

	const startServerAndClientCommand = vscode.commands.registerCommand(
		'devz-tools.startServerAndClient',
		createCommandHandler('Start Server and Client', async () => {
			await handleStartServerAndClient(statusBarItems);
		})
	);

	const wipeServerDataCommand = vscode.commands.registerCommand(
		'devz-tools.wipeServerData',
		createCommandHandler('Wipe Server Data', wipeServerData)
	);

	const wipeClientDataCommand = vscode.commands.registerCommand(
		'devz-tools.wipeClientData',
		createCommandHandler('Wipe Client Data', wipeClientData)
	);

	// Directory commands use silent handlers since they handle their own error display
	const openClientDirectoryCommand = vscode.commands.registerCommand(
		'devz-tools.openClientDirectory',
		createSilentCommandHandler(openClientDirectory)
	);

	const openServerDirectoryCommand = vscode.commands.registerCommand(
		'devz-tools.openServerDirectory',
		createSilentCommandHandler(openServerDirectory)
	);

	const openToolsDirectoryCommand = vscode.commands.registerCommand(
		'devz-tools.openToolsDirectory',
		createSilentCommandHandler(openToolsDirectory)
	);

	const openProjectDriveDirectoryCommand = vscode.commands.registerCommand(
		'devz-tools.openProjectDriveDirectory',
		createSilentCommandHandler(openProjectDriveDirectory)
	);

	const openWorkshopDirectoryCommand = vscode.commands.registerCommand(
		'devz-tools.openWorkshopDirectory',
		createSilentCommandHandler(openWorkshopDirectory)
	);

	const showModsSummaryCommand = vscode.commands.registerCommand(
		'devz-tools.showModsSummary',
		createCommandHandler('Show Mods Summary', showModsSummary)
	);

	const showLogsCommand = vscode.commands.registerCommand(
		'devz-tools.showLogs',
		createCommandHandler('Show Logs', () => showLogs(extensionState))
	);

	const initializeModBoilerplateCommand = vscode.commands.registerCommand(
		'devz-tools.initializeModBoilerplate',
		createCommandHandler('Initialize Mod Boilerplate', initializeModBoilerplate)
	);

	const openFileInCustomViewerCommand = vscode.commands.registerCommand(
		'devz-tools.openFileInCustomViewer',
		createCommandHandler('Open File in Custom Viewer', async (uri?: vscode.Uri) => {
			// If no URI provided, try to get the active editor's URI
			const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

			if (!fileUri) {
				vscode.window.showErrorMessage('No file selected to open in custom viewer');
				return;
			}

			await WebviewManager.openFileViewer(context, fileUri);
		})
	);

	const openTypesEditorCommand = vscode.commands.registerCommand(
		'devz-tools.openTypesEditor',
		createCommandHandler('Open Types Editor', async (uri?: vscode.Uri) => {
			// If no URI provided, try to get the active editor's URI
			const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

			if (!fileUri) {
				vscode.window.showErrorMessage('No types.xml file selected');
				return;
			}

			// Check if this is a types.xml file
			const fileName = fileUri.fsPath.toLowerCase();
			if (!fileName.endsWith('types.xml')) {
				vscode.window.showWarningMessage('This command only works with types.xml files');
				return;
			}

			await TypesEditorManager.openTypesEditor(context, fileUri);
		})
	);

	// Track which files we've already prompted for to avoid repeated prompts
	const promptedFiles = new Set<string>();

	// Listen for when types.xml files are opened and suggest using the custom editor
	const documentOpenListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
		// Check if we have an active editor
		if (!editor) {
			return;
		}

		const document = editor.document;

		// Only check XML files
		if (document.languageId !== 'xml') {
			return;
		}

		// Check if this is a types.xml file
		const fileName = document.fileName.toLowerCase();
		if (!fileName.endsWith('types.xml')) {
			return;
		}

		// Don't prompt if we've already prompted for this file in this session
		if (promptedFiles.has(document.uri.toString())) {
			return;
		}

		// Mark as prompted
		promptedFiles.add(document.uri.toString());

		// Add a small delay to ensure the editor is fully loaded
		await delay(100);

		// Show suggestion to use custom editor
		const action = await vscode.window.showInformationMessage(
			'Would you like to open this types.xml file in the DevZ Types Editor?',
			'Open in Types Editor',
			'Keep in Text Editor'
		);

		if (action === 'Open in Types Editor') {
			// Open the custom editor first
			await TypesEditorManager.openTypesEditor(context, document.uri);

			// Find and close the text editor tab with this document
			const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const textEditorTab = tabs.find(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'uri' in input) {
					return (input as { uri: vscode.Uri }).uri.toString() === document.uri.toString();
				}
				return false;
			});

			if (textEditorTab) {
				await vscode.window.tabGroups.close(textEditorTab);
			}
		}
	});

	// Add all disposables to context subscriptions
	context.subscriptions.push(
		packPBOCommand,
		startServerAndClientCommand,
		wipeServerDataCommand,
		wipeClientDataCommand,
		openClientDirectoryCommand,
		openServerDirectoryCommand,
		openToolsDirectoryCommand,
		openProjectDriveDirectoryCommand,
		openWorkshopDirectoryCommand,
		showModsSummaryCommand,
		showLogsCommand,
		initializeModBoilerplateCommand,
		openFileInCustomViewerCommand,
		openTypesEditorCommand,
		documentOpenListener,
		hoverProviderDisposable,
		inlayHintsProviderDisposable,
		...Object.values(statusBarItems)
	);
}

/**
 * Performs startup validation of the extension configuration
 */
async function performStartupValidation(): Promise<void> {
	try {
		const validationResult = await validateStartupConfiguration();
		showValidationResults(validationResult);
	} catch (error) {
		console.error('Startup validation failed:', error);
	}
}

/**
 * Extension deactivation function called when the extension is deactivated
 * Performs cleanup of running processes and resources
 */
export function deactivate(): void {
	console.log('DevZ Tools extension is deactivating...');

	// Set shutting down flag to prevent new operations
	extensionState.isShuttingDown = true;

	// Clean up any running processes
	if (extensionState.serverProcess && !extensionState.serverProcess.killed) {
		console.log('Killing server process during deactivation');
		try {
			extensionState.serverProcess.kill();
		} catch (error) {
			console.log('Error killing server process:', error);
		}
	}
	if (extensionState.clientProcess && !extensionState.clientProcess.killed) {
		console.log('Killing client process during deactivation');
		try {
			extensionState.clientProcess.kill();
		} catch (error) {
			console.log('Error killing client process:', error);
		}
	}

	// Clean up log watchers
	if (extensionState.logWatchers && extensionState.logWatchers.length > 0) {
		console.log('Closing log watchers during deactivation');
		extensionState.logWatchers.forEach(watcher => {
			try {
				watcher.close();
			} catch (error) {
				console.log('Error closing watcher during deactivation:', error);
			}
		});
		extensionState.logWatchers = [];
	}

	// Clear context reference
	clearExtensionContext();

	// Note: Output channels are automatically disposed by VS Code when the
	// extension context is disposed, so we don't need to manually dispose them here.
	// Manually disposing them can cause "DisposableStore already disposed" errors.
}
