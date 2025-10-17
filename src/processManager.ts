import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { DevZSettings, ExtensionState } from './types';
import { getExtensionSettings, getWorkspaceRoot, buildModString } from './config';
import { clearOldLogs } from './fileManager';
import { updateStatusBar } from './statusBar';

// Function to aggressively kill DayZ processes using PowerShell
function killDayZProcesses(): void {
    // Kill all DayZ related processes using PowerShell
    const powershellCommand = `
		Get-Process -Name "DayZ*", "DayZServer*" -ErrorAction SilentlyContinue | 
		ForEach-Object { 
			try { 
				Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
				Write-Host "Killed process: $($_.Name) (PID: $($_.Id))"
			} catch { 
				Write-Host "Failed to kill: $($_.Name) (PID: $($_.Id))" 
			} 
		}
	`;

    spawn('powershell.exe', ['-Command', powershellCommand], {
        stdio: 'pipe',
        windowsHide: true
    });
}

// Function to stop all processes
export function stopAllProcesses(state: ExtensionState, statusBarItem: vscode.StatusBarItem): void {
    state.isShuttingDown = true;
    updateStatusBar(statusBarItem, state);

    let processesRemaining = 0;

    // Function to check if all processes are done
    const checkAllProcessesStopped = () => {
        processesRemaining--;
        if (processesRemaining <= 0) {
            state.isShuttingDown = false;
            updateStatusBar(statusBarItem, state);
        }
    };

    if (state.clientProcess && !state.clientProcess.killed) {
        processesRemaining++;

        // Set up exit handler first
        const clientExitHandler = () => {
            state.clientProcess = null;
            checkAllProcessesStopped();
        };

        state.clientProcess.once('exit', clientExitHandler);

        // Try multiple methods to kill the client
        const killClientProcess = async () => {
            if (!state.clientProcess || state.clientProcess.killed) {
                return;
            }

            try {
                // Method 1: Try normal Node.js kill first
                state.clientProcess.kill('SIGTERM');

                // Wait a moment, then try force kill
                setTimeout(() => {
                    if (state.clientProcess && !state.clientProcess.killed) {
                        try {
                            state.clientProcess.kill('SIGKILL');
                        } catch (error) {
                            console.log('SIGKILL failed:', error);
                        }
                    }
                }, 1000);

                // Method 2: Use taskkill with process name (DayZ client processes)
                setTimeout(() => {
                    if (state.clientProcess && !state.clientProcess.killed) {
                        // Kill all DayZ client processes by name
                        const killByName = spawn('taskkill', ['/IM', 'DayZ_BE.exe', '/F', '/T'], {
                            stdio: 'pipe',
                            windowsHide: true
                        });

                        killByName.on('error', (error) => {
                            console.log('Taskkill by name failed:', error);
                        });

                        // Also try by PID if we have it
                        if (state.clientProcess.pid) {
                            const killByPid = spawn('taskkill', ['/PID', state.clientProcess.pid.toString(), '/F', '/T'], {
                                stdio: 'pipe',
                                windowsHide: true
                            });

                            killByPid.on('error', (error) => {
                                console.log('Taskkill by PID failed:', error);
                            });
                        }
                    }
                }, 2000);

            } catch (error) {
                console.log('Client kill error:', error);
            }
        };

        killClientProcess();

        // Force cleanup after 5 seconds regardless
        setTimeout(() => {
            if (state.clientProcess) {
                state.clientProcess.removeListener('exit', clientExitHandler);
                state.clientProcess = null;
                checkAllProcessesStopped();
                vscode.window.showWarningMessage('DayZ Client process cleanup forced after timeout');
            }
        }, 5000);
    }

    if (state.serverProcess && !state.serverProcess.killed) {
        processesRemaining++;

        // Try graceful shutdown first
        state.serverProcess.kill('SIGTERM');

        // Set up exit handler
        const serverExitHandler = () => {
            state.serverProcess = null;
            checkAllProcessesStopped();
        };

        state.serverProcess.once('exit', serverExitHandler);

        // Force kill after 10 seconds if still running
        const forceKillTimeout = setTimeout(() => {
            if (state.serverProcess && !state.serverProcess.killed) {
                // Try multiple kill methods for server
                try {
                    // First try SIGKILL
                    state.serverProcess.kill('SIGKILL');
                } catch (error) {
                    console.log('Server SIGKILL failed:', error);
                }

                // Then try taskkill by PID
                if (state.serverProcess.pid) {
                    const killByPid = spawn('taskkill', ['/PID', state.serverProcess.pid.toString(), '/F', '/T'], {
                        stdio: 'pipe',
                        windowsHide: true
                    });

                    killByPid.on('error', (error) => {
                        console.log('Server taskkill by PID failed:', error);
                    });
                }

                // Also try killing by process name
                const killByName = spawn('taskkill', ['/IM', 'DayZServer_x64.exe', '/F', '/T'], {
                    stdio: 'pipe',
                    windowsHide: true
                });

                killByName.on('error', (error) => {
                    console.log('Server taskkill by name failed:', error);
                });

                // Force cleanup after attempts
                setTimeout(() => {
                    if (state.serverProcess) {
                        state.serverProcess.removeListener('exit', serverExitHandler);
                        state.serverProcess = null;
                        checkAllProcessesStopped();
                        vscode.window.showWarningMessage('DayZ Server process cleanup forced after timeout');
                    }
                }, 3000);
            }
        }, 10000);

        state.serverProcess.on('exit', () => {
            clearTimeout(forceKillTimeout);
        });
    }

    // Stop log monitoring
    if (state.logWatcher) {
        state.logWatcher.close();
        state.logWatcher = null;
    }

    // Reset log monitoring state
    state.logMonitoringActive = false;

    // Final fallback: Use PowerShell to kill any remaining DayZ processes after 15 seconds
    setTimeout(() => {
        if (state.isShuttingDown) {
            vscode.window.showWarningMessage('Using fallback method to kill remaining DayZ processes...');
            killDayZProcesses();

            // Force reset state after PowerShell attempt
            setTimeout(() => {
                if (state.isShuttingDown) {
                    state.isShuttingDown = false;
                    state.serverProcess = null;
                    state.clientProcess = null;
                    updateStatusBar(statusBarItem, state);
                }
            }, 3000);
        }
    }, 15000);

    if (processesRemaining === 0) {
        state.isShuttingDown = false;
        updateStatusBar(statusBarItem, state);
    }
}

// Function equivalent to start_server() from Python
export async function startServer(state: ExtensionState, statusBarItem: vscode.StatusBarItem): Promise<void> {
    try {
        const settings = getExtensionSettings();
        const repoDir = getWorkspaceRoot();
        const outDir = path.join(repoDir, 'out');

        const missionDir = path.join(repoDir, 'dayzOffline.enoch');
        const configDir = path.join(repoDir, 'server.cfg');
        const profileDir = path.join(outDir, 'ServerProfile');
        const storageDir = path.join(outDir, 'ServerStorage');

        // Create profile and storage directories if they don't exist
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // Clear old log files before starting
        clearOldLogs(profileDir);

        const serverExePath = path.join(settings.dayzServerDir, 'DayZServer_x64.exe');
        const modString = buildModString(settings, repoDir);

        console.log('DevZ Settings:', {
            modName: settings.modName,
            additionalMods: settings.additionalMods,
            steamWorkshopDir: settings.steamWorkshopDir
        });
        console.log('Built mod string:', modString);

        const args = [
            `-mod=${modString}`,
            `-mission=${missionDir}`,
            `-config=${configDir}`,
            `-profiles=${profileDir}`,
            `-storage=${storageDir}`,
            '-port=2302',
            '-dologs',
            '-adminlog',
            '-netlog'
        ];

        console.log('Running command:', serverExePath, args.join(' '));

        // Start server process with proper stdio handling for crash detection
        state.serverProcess = spawn(serverExePath, args, {
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true // Prevent window from opening
        });

        // Handle server process events
        state.serverProcess.on('spawn', () => {
            updateStatusBar(statusBarItem, state);
            vscode.window.showInformationMessage('DayZ Server started successfully');
        });

        state.serverProcess.on('error', (error) => {
            vscode.window.showErrorMessage(`Failed to start DayZ Server: ${error.message}`);
            state.serverProcess = null;
            updateStatusBar(statusBarItem, state);
        });

        state.serverProcess.on('exit', (code, signal) => {
            if (code !== 0 && code !== null) {
                vscode.window.showErrorMessage(`DayZ Server crashed or stopped unexpectedly (code: ${code})`);
            }
            state.serverProcess = null;
            updateStatusBar(statusBarItem, state);
        });

        // Monitor server output for startup issues
        let startupTimeout = setTimeout(() => {
            if (state.serverProcess && !state.serverProcess.killed) {
                // vscode.window.showInformationMessage('DayZ Server is starting (this may take a moment)...');
            }
        }, 5000);

        state.serverProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Game Server Init Complete') || output.includes('Host identity created')) {
                clearTimeout(startupTimeout);
            }
        });

        state.serverProcess.stderr?.on('data', (data) => {
            const errorOutput = data.toString();
            if (errorOutput.includes('EXCEPTION') || errorOutput.includes('ERROR')) {
                vscode.window.showErrorMessage(`Server Error: ${errorOutput.substring(0, 100)}...`);
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start server: ${error}`);
        state.serverProcess = null;
        updateStatusBar(statusBarItem, state);
    }
}

// Function equivalent to start_client() from Python
export async function startClient(state: ExtensionState, statusBarItem: vscode.StatusBarItem): Promise<void> {
    try {
        const settings = getExtensionSettings();
        const repoDir = getWorkspaceRoot();
        const outDir = path.join(repoDir, 'out');

        const profileDir = path.join(outDir, 'ClientProfile');

        // Create client profile directory if it doesn't exist
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }

        // Clear old client logs before starting
        clearOldLogs(profileDir);

        const clientExePath = path.join(settings.dayzClientDir, 'DayZ_BE.exe');
        const modString = buildModString(settings, repoDir);

        console.log('DevZ Client Settings:', {
            modName: settings.modName,
            additionalMods: settings.additionalMods,
            steamWorkshopDir: settings.steamWorkshopDir,
            serverAddress: settings.serverAddress
        });
        console.log('Built client mod string:', modString);

        const args = [
            `-mod=${modString}`,
            `-connect=${settings.serverAddress}`,
            `-profiles=${profileDir}`,
            '-doLogs'
        ];

        console.log('Running command:', clientExePath, args.join(' '));

        // Start client process with proper event handling
        state.clientProcess = spawn(clientExePath, args, {
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true // Prevent console window from opening
        });

        // Handle client process events
        state.clientProcess.on('spawn', () => {
            updateStatusBar(statusBarItem, state);
            vscode.window.showInformationMessage('DayZ Client started successfully');
        });

        state.clientProcess.on('error', (error) => {
            vscode.window.showErrorMessage(`Failed to start DayZ Client: ${error.message}`);
            state.clientProcess = null;
            updateStatusBar(statusBarItem, state);
        });

        state.clientProcess.on('exit', (code, signal) => {
            if (code !== 0 && code !== null) {
                vscode.window.showErrorMessage(`DayZ Client crashed or stopped unexpectedly (code: ${code})`);
            }
            state.clientProcess = null;
            updateStatusBar(statusBarItem, state);
        });

        // Monitor client stderr for connection issues
        state.clientProcess.stderr?.on('data', (data) => {
            const errorOutput = data.toString();
            if (errorOutput.includes('Connection failed') || errorOutput.includes('EXCEPTION')) {
                vscode.window.showWarningMessage(`Client Warning: ${errorOutput.substring(0, 100)}...`);
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start client: ${error}`);
        state.clientProcess = null;
        updateStatusBar(statusBarItem, state);
    }
}