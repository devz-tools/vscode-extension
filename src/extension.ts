import * as vscode from 'vscode';
import { ExtensionState } from './types';
import { createStatusBarItems, configureStatusBarItems, updateStatusBar } from './statusBar';
import { startServer, startClient, stopAllProcesses } from './processManager';
import { createModBase, packPBO, wipeServerData, wipeClientData } from './fileManager';
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

/**
 * Global extension state - maintains process information and logging state
 */
let extensionState: ExtensionState = {
	serverProcess: null,
	clientProcess: null,
	isShuttingDown: false,
	logOutputChannel: null,
	logWatcher: null,
	globalLogChannel: null,
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
 * Extension activation function called when the extension is activated
 * @param context - The extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('DevZ Tools extension is now active!');

	// Perform startup validation
	performStartupValidation();

	// Create and configure status bar items
	const statusBarItems = createStatusBarItems();
	configureStatusBarItems(statusBarItems);

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

	// Clean up any running processes
	if (extensionState.serverProcess && !extensionState.serverProcess.killed) {
		console.log('Killing server process during deactivation');
		extensionState.serverProcess.kill();
	}
	if (extensionState.clientProcess && !extensionState.clientProcess.killed) {
		console.log('Killing client process during deactivation');
		extensionState.clientProcess.kill();
	}
	if (extensionState.logWatcher) {
		console.log('Closing log watcher during deactivation');
		extensionState.logWatcher.close();
	}
}
