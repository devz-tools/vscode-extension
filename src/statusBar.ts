import * as vscode from 'vscode';
import { ExtensionState, StatusBarItems } from './types';

// Function to create all status bar items
export function createStatusBarItems(): StatusBarItems {
    return {
        packPBO: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 104),
        startServerAndClient: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 103),
        wipeServer: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 102),
        wipeClient: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 101),
        modsSummary: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
    };
}

// Function to configure status bar items
export function configureStatusBarItems(items: StatusBarItems): void {
    // Configure Pack PBO button
    items.packPBO.text = "$(package) Pack PBO";
    items.packPBO.tooltip = "Pack Mod Source Files into PBO";
    items.packPBO.command = "devz-tools.packPBO";
    items.packPBO.show();

    // Configure Start Server and Launch Client button
    items.startServerAndClient.text = "$(play) Start Server/Client";
    items.startServerAndClient.tooltip = "Start Server and Launch Client";
    items.startServerAndClient.command = "devz-tools.startServerAndClient";
    items.startServerAndClient.show();

    // Configure Wipe Server Data button
    items.wipeServer.text = "$(trash) Wipe Server";
    items.wipeServer.tooltip = "Delete ServerProfile and ServerStorage directories";
    items.wipeServer.command = "devz-tools.wipeServerData";
    items.wipeServer.show();

    // Configure Wipe Client Data button
    items.wipeClient.text = "$(trash) Wipe Client";
    items.wipeClient.tooltip = "Delete ClientProfile directory";
    items.wipeClient.command = "devz-tools.wipeClientData";
    items.wipeClient.show();

    // Configure Mods Summary button
    items.modsSummary.text = "$(extensions) Mods";
    items.modsSummary.tooltip = "Show Additional Mods Summary";
    items.modsSummary.command = "devz-tools.showModsSummary";
    items.modsSummary.show();
}

// Function to update status bar based on process states
export function updateStatusBar(statusBarItem: vscode.StatusBarItem, state: ExtensionState): void {
    const isServerRunning = state.serverProcess && !state.serverProcess.killed;
    const isClientRunning = state.clientProcess && !state.clientProcess.killed;

    if (state.isShuttingDown) {
        statusBarItem.text = "$(loading~spin) Shutting Down...";
        statusBarItem.tooltip = "Waiting for processes to shut down";
        statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else if (isServerRunning || isClientRunning) {
        statusBarItem.text = "$(stop-circle) Stop Server";
        statusBarItem.tooltip = "Stop DayZ Server";
        if (isServerRunning && isClientRunning) {
            statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else {
            statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    } else {
        statusBarItem.text = "$(play) Start Server/Client";
        statusBarItem.tooltip = "Start Server and Launch Client";
        statusBarItem.color = undefined;
    }
}