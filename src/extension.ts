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
				state.debugOutputChannel = vscode.window.createOutputChannel('DevZ Debug - All Logs');
				state.debugOutputChannel.appendLine('=== DevZ Debug - All Logs ===');
				state.debugOutputChannel.appendLine('No log monitoring active. Start the server or client to begin monitoring.');
			}
			channelToShow = state.debugOutputChannel;
			break;
		case 'serverRpt':
			if (!state.serverRptOutputChannel) {
				state.serverRptOutputChannel = vscode.window.createOutputChannel('DevZ Debug - Server RPT');
			}
			channelToShow = state.serverRptOutputChannel;
			break;
		case 'clientRpt':
			if (!state.clientRptOutputChannel) {
				state.clientRptOutputChannel = vscode.window.createOutputChannel('DevZ Debug - Client RPT');
			}
			channelToShow = state.clientRptOutputChannel;
			break;
		case 'serverScriptLog':
			if (!state.serverScriptLogOutputChannel) {
				state.serverScriptLogOutputChannel = vscode.window.createOutputChannel('DevZ Debug - Server Script Log');
			}
			channelToShow = state.serverScriptLogOutputChannel;
			break;
		case 'clientScriptLog':
			if (!state.clientScriptLogOutputChannel) {
				state.clientScriptLogOutputChannel = vscode.window.createOutputChannel('DevZ Debug - Client Script Log');
			}
			channelToShow = state.clientScriptLogOutputChannel;
			break;
		case 'adminLog':
			if (!state.adminLogOutputChannel) {
				state.adminLogOutputChannel = vscode.window.createOutputChannel('DevZ Debug - Admin Log');
			}
			channelToShow = state.adminLogOutputChannel;
			break;
		case 'serverCrashLog':
			if (!state.serverCrashLogOutputChannel) {
				state.serverCrashLogOutputChannel = vscode.window.createOutputChannel('DevZ Debug - Server Crash Log');
			}
			channelToShow = state.serverCrashLogOutputChannel;
			break;
		case 'clientCrashLog':
			if (!state.clientCrashLogOutputChannel) {
				state.clientCrashLogOutputChannel = vscode.window.createOutputChannel('DevZ Debug - Client Crash Log');
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

	const showLogsCommand = vscode.commands.registerCommand(
		'devz-tools.showLogs',
		createCommandHandler('Show Logs', () => showLogs(extensionState))
	);

	const initializeModBoilerplateCommand = vscode.commands.registerCommand(
		'devz-tools.initializeModBoilerplate',
		createCommandHandler('Initialize Mod Boilerplate', initializeModBoilerplate)
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
		showLogsCommand,
		initializeModBoilerplateCommand,
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

	// Clean up output channels
	if (extensionState.debugOutputChannel) {
		extensionState.debugOutputChannel.dispose();
		extensionState.debugOutputChannel = null;
	}
	if (extensionState.toolsOutputChannel) {
		extensionState.toolsOutputChannel.dispose();
		extensionState.toolsOutputChannel = null;
	}
	if (extensionState.serverRptOutputChannel) {
		extensionState.serverRptOutputChannel.dispose();
		extensionState.serverRptOutputChannel = null;
	}
	if (extensionState.clientRptOutputChannel) {
		extensionState.clientRptOutputChannel.dispose();
		extensionState.clientRptOutputChannel = null;
	}
	if (extensionState.serverScriptLogOutputChannel) {
		extensionState.serverScriptLogOutputChannel.dispose();
		extensionState.serverScriptLogOutputChannel = null;
	}
	if (extensionState.clientScriptLogOutputChannel) {
		extensionState.clientScriptLogOutputChannel.dispose();
		extensionState.clientScriptLogOutputChannel = null;
	}
	if (extensionState.adminLogOutputChannel) {
		extensionState.adminLogOutputChannel.dispose();
		extensionState.adminLogOutputChannel = null;
	}
	if (extensionState.serverCrashLogOutputChannel) {
		extensionState.serverCrashLogOutputChannel.dispose();
		extensionState.serverCrashLogOutputChannel = null;
	}
	if (extensionState.clientCrashLogOutputChannel) {
		extensionState.clientCrashLogOutputChannel.dispose();
		extensionState.clientCrashLogOutputChannel = null;
	}
}
