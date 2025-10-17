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

// Global extension state
let extensionState: ExtensionState = {
	serverProcess: null,
	clientProcess: null,
	isShuttingDown: false,
	logOutputChannel: null,
	logWatcher: null,
	globalLogChannel: null,
	logMonitoringActive: false
};

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

	// Register all commands
	const packPBOCommand = vscode.commands.registerCommand('devz-tools.packPBO', async () => {
		try {
			await createModBase();
			await packPBO();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to pack PBO: ${error}`);
		}
	});

	const startServerAndClientCommand = vscode.commands.registerCommand('devz-tools.startServerAndClient', async () => {
		try {
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

			// Wait a bit for server to start, then start client
			setTimeout(async () => {
				await startClient(extensionState, statusBarItems.startServerAndClient);
			}, 3000);

		} catch (error) {
			vscode.window.showErrorMessage(`Failed to start server and client: ${error}`);
		}
	});

	const wipeServerDataCommand = vscode.commands.registerCommand('devz-tools.wipeServerData', async () => {
		await wipeServerData();
	});

	const wipeClientDataCommand = vscode.commands.registerCommand('devz-tools.wipeClientData', async () => {
		await wipeClientData();
	});

	const openClientDirectoryCommand = vscode.commands.registerCommand('devz-tools.openClientDirectory', async () => {
		try {
			await openClientDirectory();
		} catch (error) {
			// Error already shown in openClientDirectory
		}
	});

	const openServerDirectoryCommand = vscode.commands.registerCommand('devz-tools.openServerDirectory', async () => {
		try {
			await openServerDirectory();
		} catch (error) {
			// Error already shown in openServerDirectory
		}
	});

	const openToolsDirectoryCommand = vscode.commands.registerCommand('devz-tools.openToolsDirectory', async () => {
		try {
			await openToolsDirectory();
		} catch (error) {
			// Error already shown in openToolsDirectory
		}
	});

	const openProjectDriveDirectoryCommand = vscode.commands.registerCommand('devz-tools.openProjectDriveDirectory', async () => {
		try {
			await openProjectDriveDirectory();
		} catch (error) {
			// Error already shown in openProjectDriveDirectory
		}
	});

	const openWorkshopDirectoryCommand = vscode.commands.registerCommand('devz-tools.openWorkshopDirectory', async () => {
		try {
			await openWorkshopDirectory();
		} catch (error) {
			// Error already shown in openWorkshopDirectory
		}
	});

	const showModsSummaryCommand = vscode.commands.registerCommand('devz-tools.showModsSummary', async () => {
		await showModsSummary();
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
		hoverProviderDisposable,
		inlayHintsProviderDisposable,
		...Object.values(statusBarItems)
	);
}

async function performStartupValidation() {
	try {
		const validationResult = await validateStartupConfiguration();
		showValidationResults(validationResult);
	} catch (error) {
		console.error('Startup validation failed:', error);
	}
}

export function deactivate() {
	// Clean up any running processes
	if (extensionState.serverProcess && !extensionState.serverProcess.killed) {
		extensionState.serverProcess.kill();
	}
	if (extensionState.clientProcess && !extensionState.clientProcess.killed) {
		extensionState.clientProcess.kill();
	}
	if (extensionState.logWatcher) {
		extensionState.logWatcher.close();
	}
}
