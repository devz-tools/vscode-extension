import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { DevZSettings, ExtensionState } from './types';
import { getExtensionSettings, getWorkspaceRoot, buildModString } from './config';
import { clearOldLogs } from './fileManager';
import { updateStatusBar } from './statusBar';
import { showMeaningfulNotification, showAutoHideNotification, showStatusMessage } from './utils';
import { createAndRegisterOutputChannel } from './disposables';

/**
 * Logs a message to the DevZ Tools output channel with timestamp
 * @param state - Extension state containing the tools output channel
 * @param message - Message to log
 */
function logToTools(state: ExtensionState, message: string): void {
    if (!state.toolsOutputChannel) {
        state.toolsOutputChannel = createAndRegisterOutputChannel('DevZ Tools');
    }
    const timestamp = new Date().toLocaleTimeString();
    state.toolsOutputChannel.appendLine(`[${timestamp}] ${message}`);
    console.log(`DevZ Tools: ${message}`); // Also log to console for debugging
}

/**
 * Formats a log file name by removing timestamp and extracting meaningful parts
 * @param filename - Original log file name (e.g., "DayZServer_x64_2025-10-18_11-25-56.RPT")
 * @param source - Source of the log ('SERVER' or 'CLIENT')
 * @returns Formatted name (e.g., "Server RPT", "Server Script Log")
 */
function formatLogFileName(filename: string, source: string): string {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    // Handle different log file patterns
    if (filename.startsWith('DayZServer_x64_')) {
        if (filename.endsWith('.RPT')) {
            return 'Server RPT';
        } else if (filename.endsWith('.ADM')) {
            return 'Server Admin';
        }
    } else if (filename.startsWith('DayZ_x64_') || filename.startsWith('DayZ_BE_')) {
        if (filename.endsWith('.RPT')) {
            return 'Client RPT';
        }
    } else if (filename.startsWith('script_')) {
        // Distinguish between server and client script logs
        return source === 'SERVER' ? 'Server Script Log' : 'Client Script Log';
    } else if (filename.startsWith('crash_')) {
        // Distinguish between server and client crash logs
        return source === 'SERVER' ? 'Server Crash Log' : 'Client Crash Log';
    } else if (filename.endsWith('.log')) {
        return 'General Log';
    } else if (filename.endsWith('.RPT')) {
        return 'Report';
    } else if (filename.endsWith('.ADM')) {
        return 'Admin Log';
    }

    // Fallback - just return filename without timestamp pattern
    return nameWithoutExt.replace(/_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, '');
}

/**
 * Gets emoji prefix for log source and type
 * @param source - SERVER or CLIENT
 * @param logType - Type of log file (e.g., "Server RPT", "Server Script Log")
 * @returns Emoji prefix for better visual identification
 */
function getEmojiPrefix(source: string, logType: string): string {

    if (logType.includes('RPT')) {
        return source === 'SERVER' ? '📝' : '🖥️';
    } else if (logType.includes('Script')) {
        // Different emoji for server vs client script logs
        return logType.includes('Server') ? '📜' : '📋';
    } else if (logType.includes('Admin')) {
        return '👑';
    } else if (logType.includes('Crash')) {
        // Different emoji for server vs client crash logs
        return logType.includes('Server') ? '💥' : '💔';
    } else {
        throw new Error('Unrecognized log type for emoji prefix');
    }
}

/**
 * Gets the specific output channel for a given log type
 * @param state - Extension state containing output channels
 * @param logType - Type of log file (e.g., "Server RPT", "Server Script Log")
 * @returns The specific output channel for this log type, or null if not available
 */
function getSpecificOutputChannel(state: ExtensionState, logType: string): vscode.OutputChannel | null {
    if (logType === 'Server RPT') {
        return state.serverRptOutputChannel || null;
    } else if (logType === 'Client RPT') {
        return state.clientRptOutputChannel || null;
    } else if (logType === 'Server Script Log') {
        return state.serverScriptLogOutputChannel || null;
    } else if (logType === 'Client Script Log') {
        return state.clientScriptLogOutputChannel || null;
    } else if (logType.includes('Admin')) {
        return state.adminLogOutputChannel || null;
    } else if (logType === 'Server Crash Log') {
        return state.serverCrashLogOutputChannel || null;
    } else if (logType === 'Client Crash Log') {
        return state.clientCrashLogOutputChannel || null;
    }
    return null;
}

/**
 * Formats a log line with proper alignment for better readability
 * Removes redundant timestamps and prefixes from log content
 * @param emoji - Emoji prefix for the log type
 * @param timestamp - Time when the log was captured
 * @param logType - Type of log file (will be padded to 12 chars)
 * @param content - The actual log content
 * @returns Formatted and aligned log line with redundant content stripped
 */
function formatAlignedLogLine(emoji: string, timestamp: string, logType: string, content: string): string {
    // Pad logType to 12 characters for consistent alignment
    const paddedLogType = logType.padEnd(12);

    // Strip redundant timestamp from the beginning of content (format: HH:MM:SS.mmm or similar)
    // Matches patterns like "11:25:56.298" or "11:25:56"
    let cleanedContent = content.replace(/^\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?[\s]*/, '');

    // Strip "SCRIPT :" prefix and surrounding whitespace from script logs
    cleanedContent = cleanedContent.replace(/^SCRIPT\s*:\s*/i, '');

    // Strip "SCRIPT       :" (with extra spaces) prefix
    cleanedContent = cleanedContent.replace(/^SCRIPT\s+:\s*/i, '');

    return `${emoji} [${timestamp}] ${paddedLogType} │ ${cleanedContent}`;
}

/**
 * Starts log monitoring for DayZ server and client log files
 * 
 * This function monitors specified directories for DayZ log files and streams their content
 * line-by-line in real-time to VS Code output channels. Each log line gets an emoji prefix
 * and timestamp with proper text alignment for easy scanning and readability.
 * 
 * It creates separate channels for different purposes:
 * - DevZ Debug: Real-time streaming of DayZ server/client logs with emoji prefixes and alignment
 * - DevZ Tools: Internal extension logging and command output
 * 
 * Live log entries are formatted with text alignment for easy reading:
 * 📝 [11:25:56] Server RPT    │ 11:25:56.298 String "STR_server_shutdown" listed twice
 * 📜 [11:25:58] Script Log   │ SCRIPT : Registered 305 temporary action enum(s)
 * 🖥️ [11:26:05] Client RPT    │ 11:26:05.35 String "STR_server_shutdown" listed twice
 * 👑 [11:26:06] Server Admin  │ User connected: SteamID64=12345678901234567
 * 
 * The format uses:
 * - Emoji prefix for visual identification
 * - Timestamp in [HH:MM:SS] format
 * - Log type padded to 12 characters
 * - Vertical bar separator (│) for clear content separation
 * - Actual log content aligned after the separator
 * 
 * Emoji prefixes:
 * - � Server RPT files
 * - �️ Client RPT files  
 * - 📜 Script log files
 * - 👑 Admin log files
 * - 💥 Crash log files
 * 
 * @param state - The extension state to update with monitoring info
 * @param serverProfileDir - Path to server profile directory containing logs (optional)
 * @param clientProfileDir - Path to client profile directory containing logs (optional)
 * @param autoShow - Whether to automatically show the debug channel (default: true)
 * 
 * @example
 * ```typescript
 * // Monitor server logs only and auto-show with live streaming and alignment
 * startLogMonitoring(state, '/path/to/server/profile');
 * 
 * // Monitor both server and client logs with real-time aligned line streaming
 * startLogMonitoring(state, '/path/to/server/profile', '/path/to/client/profile');
 * ```
 */
export function startLogMonitoring(state: ExtensionState, serverProfileDir?: string, clientProfileDir?: string, autoShow: boolean = true): void {
    try {
        // Stop existing monitoring if any
        stopLogMonitoring(state);

        // Create or reuse combined output channel (all logs)
        if (!state.debugOutputChannel) {
            state.debugOutputChannel = createAndRegisterOutputChannel('DevZ Debug - All Logs');
        }
        if (!state.toolsOutputChannel) {
            state.toolsOutputChannel = createAndRegisterOutputChannel('DevZ Tools');
        }

        // Create individual output channels for each log type
        if (!state.serverRptOutputChannel) {
            state.serverRptOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Server RPT');
        }
        if (!state.clientRptOutputChannel) {
            state.clientRptOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Client RPT');
        }
        if (!state.serverScriptLogOutputChannel) {
            state.serverScriptLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Server Script Log');
        }
        if (!state.clientScriptLogOutputChannel) {
            state.clientScriptLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Client Script Log');
        }
        if (!state.adminLogOutputChannel) {
            state.adminLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Admin Log');
        }
        if (!state.serverCrashLogOutputChannel) {
            state.serverCrashLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Server Crash Log');
        }
        if (!state.clientCrashLogOutputChannel) {
            state.clientCrashLogOutputChannel = createAndRegisterOutputChannel('DevZ Debug - Client Crash Log');
        }

        // Initialize header for combined channel
        const initializeChannel = (channel: vscode.OutputChannel, title: string) => {
            channel.clear();
            channel.appendLine(`=== ${title} ===`);
            channel.appendLine(`Started at: ${new Date().toLocaleString()}`);
            channel.appendLine(`Server Profile: ${serverProfileDir || 'Not monitoring'}`);
            channel.appendLine(`Client Profile: ${clientProfileDir || 'Not monitoring'}`);
            channel.appendLine('');
            channel.appendLine('📄 [Time    ] Source Type   │ Log Content');
            channel.appendLine(''.padEnd(70, '─'));
            channel.appendLine('');
        };

        // Initialize all channels
        initializeChannel(state.debugOutputChannel, 'DevZ Debug - All Runtime Logs');
        if (state.serverRptOutputChannel) {
            initializeChannel(state.serverRptOutputChannel, 'Server RPT Logs');
        }
        if (state.clientRptOutputChannel) {
            initializeChannel(state.clientRptOutputChannel, 'Client RPT Logs');
        }
        if (state.serverScriptLogOutputChannel) {
            initializeChannel(state.serverScriptLogOutputChannel, 'Server Script Logs');
        }
        if (state.clientScriptLogOutputChannel) {
            initializeChannel(state.clientScriptLogOutputChannel, 'Client Script Logs');
        }
        if (state.adminLogOutputChannel) {
            initializeChannel(state.adminLogOutputChannel, 'Admin Logs');
        }
        if (state.serverCrashLogOutputChannel) {
            initializeChannel(state.serverCrashLogOutputChannel, 'Server Crash Logs');
        }
        if (state.clientCrashLogOutputChannel) {
            initializeChannel(state.clientCrashLogOutputChannel, 'Client Crash Logs');
        }

        // Log to tools channel
        state.toolsOutputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Log monitoring started`);
        if (serverProfileDir) {
            state.toolsOutputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Monitoring server logs: ${serverProfileDir}`);
        }
        if (clientProfileDir) {
            state.toolsOutputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Monitoring client logs: ${clientProfileDir}`);
        }

        // Auto-show combined channel if requested
        if (autoShow) {
            state.debugOutputChannel.show();
        }

        // Monitor server logs if path provided
        if (serverProfileDir && fs.existsSync(serverProfileDir)) {
            monitorDirectory(state, serverProfileDir, 'SERVER');
        }

        // Monitor client logs if path provided  
        if (clientProfileDir && fs.existsSync(clientProfileDir)) {
            monitorDirectory(state, clientProfileDir, 'CLIENT');
        }

        state.logMonitoringActive = true;

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start log monitoring: ${error}`);
        state.logMonitoringActive = false;
        if (state.toolsOutputChannel) {
            state.toolsOutputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ERROR: Failed to start log monitoring: ${error}`);
        }
    }
}

/**
 * Monitors a directory for new log files and tails existing ones with true real-time async streaming
 * @param state - Extension state containing output channels
 * @param dirPath - Directory path to monitor
 * @param prefix - Prefix for log messages (SERVER/CLIENT)
 */
function monitorDirectory(state: ExtensionState, dirPath: string, prefix: string): void {
    // Map to track PowerShell tail processes for active tailing
    const fileStreams = new Map<string, { stream: ChildProcess; buffer: string }>();
    // Map to track file positions for tailing
    const filePositions = new Map<string, number>();
    // Map to track file watchers for individual log files
    const individualWatchers = new Map<string, fs.FSWatcher>();

    // Function to check if a file is a DayZ log file
    const isLogFile = (filename: string): boolean => {
        return filename.endsWith('.log') ||
            filename.endsWith('.RPT') ||
            filename.endsWith('.ADM') ||
            /^script_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/.test(filename) ||
            /^DayZServer_x64_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/.test(filename) ||
            /^DayZ_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.RPT$/.test(filename) ||
            /^crash_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/.test(filename);
    };

    /**
     * Starts a PowerShell tail process for true real-time log streaming
     * @param filePath - Full path to the log file
     * @param filename - Name of the log file
     */
    const startPowerShellTail = (filePath: string, filename: string): void => {
        try {
            // Get formatting info
            const formattedFileName = formatLogFileName(filename, prefix);
            const emojiPrefix = getEmojiPrefix(prefix, formattedFileName);

            // Get current file size to skip existing content
            const stats = fs.statSync(filePath);
            const currentSize = stats.size;
            filePositions.set(filePath, currentSize);

            // Start PowerShell tail process
            // Get-Content -Wait is the native Windows equivalent of 'tail -f'
            const tailProcess = spawn('powershell.exe', [
                '-NoProfile',
                '-NonInteractive',
                '-Command',
                `Get-Content -Path "${filePath}" -Tail 0 -Wait -Encoding UTF8`
            ], {
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
            });

            let lineBuffer = '';

            // Handle stdout - each line as it's written
            tailProcess.stdout?.on('data', (data: Buffer) => {
                const chunk = data.toString('utf8');
                lineBuffer += chunk;

                // Process complete lines immediately
                let newlineIndex;
                while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
                    const line = lineBuffer.substring(0, newlineIndex);
                    lineBuffer = lineBuffer.substring(newlineIndex + 1);

                    if (line.trim()) {
                        // Capture timestamp for THIS specific line as it arrives
                        const timestamp = new Date().toLocaleTimeString();
                        const alignedLogLine = formatAlignedLogLine(emojiPrefix, timestamp, formattedFileName, line.trim());

                        // Write to combined "All Logs" channel
                        state.debugOutputChannel?.appendLine(alignedLogLine);

                        // Write to specific log type channel
                        const specificChannel = getSpecificOutputChannel(state, formattedFileName);
                        specificChannel?.appendLine(alignedLogLine);
                    }
                }
            });

            // Handle process errors
            tailProcess.on('error', (error) => {
                state.toolsOutputChannel?.appendLine(`[${new Date().toLocaleTimeString()}] Tail process error for ${formattedFileName}: ${error.message}`);
            });

            tailProcess.on('exit', (code) => {
                if (code !== null && code !== 0) {
                    state.toolsOutputChannel?.appendLine(`[${new Date().toLocaleTimeString()}] Tail process exited for ${formattedFileName} with code: ${code}`);
                }
                fileStreams.delete(filePath);
            });

            // Store the tail process
            fileStreams.set(filePath, { stream: tailProcess, buffer: '' });

        } catch (error) {
            // File might not exist or be inaccessible
            state.toolsOutputChannel?.appendLine(`[${new Date().toLocaleTimeString()}] Failed to start tail for ${filename}: ${error}`);
        }
    };

    /**
     * Sets up monitoring for a specific log file using PowerShell tail
     * @param filePath - Full path to the log file
     * @param filename - Name of the log file
     */
    const monitorFile = async (filePath: string, filename: string): Promise<void> => {
        try {
            // Skip if already monitoring
            if (fileStreams.has(filePath)) {
                return;
            }

            // Log that we're starting to monitor this file
            const timestamp = new Date().toLocaleTimeString();
            const formattedFileName = formatLogFileName(filename, prefix);
            const emojiPrefix = getEmojiPrefix(prefix, formattedFileName);
            const alignedLogLine = formatAlignedLogLine(emojiPrefix, timestamp, formattedFileName, 'Started monitoring');
            state.debugOutputChannel?.appendLine(alignedLogLine);
            state.toolsOutputChannel?.appendLine(`[${timestamp}] Started monitoring ${prefix.toLowerCase()} log file: ${formattedFileName}`);

            // Start PowerShell tail for true real-time streaming
            startPowerShellTail(filePath, filename);

            // Watch for file deletion/rename
            const fileWatcher = fs.watch(filePath, (eventType) => {
                if (eventType === 'rename') {
                    // File deleted or renamed - kill the tail process
                    const streamData = fileStreams.get(filePath);
                    if (streamData?.stream) {
                        try {
                            streamData.stream.kill();
                        } catch (error) {
                            // Process might already be dead
                        }
                    }
                    fileStreams.delete(filePath);
                    fileWatcher.close();
                    individualWatchers.delete(filePath);
                    filePositions.delete(filePath);
                }
            });

            individualWatchers.set(filePath, fileWatcher);

        } catch (error) {
            // File might not exist
            state.toolsOutputChannel?.appendLine(`[${new Date().toLocaleTimeString()}] Failed to monitor ${filename}: ${error}`);
        }
    };

    /**
     * Scans directory for log files and starts monitoring them asynchronously
     */
    const scanDirectory = async (): Promise<void> => {
        try {
            const files = await fs.promises.readdir(dirPath);
            const logFiles = files.filter(isLogFile);

            // Monitor all files concurrently
            await Promise.all(logFiles.map(file => {
                const filePath = path.join(dirPath, file);
                return monitorFile(filePath, file);
            }));
        } catch (error) {
            // Directory might not exist or be inaccessible
        }
    };

    // Initial scan of existing files (async, non-blocking)
    scanDirectory().catch(() => {
        // Silently handle errors
    });

    // Watch directory for new log files
    try {
        const dirWatcher = fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
            if (filename && isLogFile(filename)) {
                const filePath = path.join(dirPath, filename);
                if (eventType === 'rename') {
                    // New file created or file deleted
                    fs.promises.access(filePath)
                        .then(() => {
                            // File exists, start monitoring
                            return monitorFile(filePath, filename);
                        })
                        .catch(() => {
                            // File deleted - kill tail process
                            const streamData = fileStreams.get(filePath);
                            if (streamData?.stream) {
                                try {
                                    streamData.stream.kill();
                                } catch (error) {
                                    // Process might already be dead
                                }
                            }
                            fileStreams.delete(filePath);
                            individualWatchers.get(filePath)?.close();
                            individualWatchers.delete(filePath);
                            filePositions.delete(filePath);
                        });
                }
            }
        });

        // Add directory watcher to the array for tracking
        state.logWatchers.push(dirWatcher);

        const timestamp = new Date().toLocaleTimeString();
        state.toolsOutputChannel?.appendLine(`[${timestamp}] File watcher started for ${prefix.toLowerCase()} logs: ${dirPath}`);
    } catch (error) {
        state.toolsOutputChannel?.appendLine(`[${new Date().toLocaleTimeString()}] Failed to watch directory ${dirPath}: ${error}`);
    }
}

/**
 * Stops log monitoring and cleans up resources
 * @param state - The extension state containing monitoring references
 */
export function stopLogMonitoring(state: ExtensionState): void {
    try {
        // Close all watchers
        if (state.logWatchers && state.logWatchers.length > 0) {
            state.logWatchers.forEach(watcher => {
                try {
                    watcher.close();
                } catch (error) {
                    console.log('Error closing watcher:', error);
                }
            });
            state.logWatchers = [];
        }

        // Add stop message to all active channels
        const stopMessage = '=== Log Monitoring Stopped ===';
        if (state.debugOutputChannel) {
            state.debugOutputChannel.appendLine(stopMessage);
        }
        if (state.serverRptOutputChannel) {
            state.serverRptOutputChannel.appendLine(stopMessage);
        }
        if (state.clientRptOutputChannel) {
            state.clientRptOutputChannel.appendLine(stopMessage);
        }
        if (state.serverScriptLogOutputChannel) {
            state.serverScriptLogOutputChannel.appendLine(stopMessage);
        }
        if (state.clientScriptLogOutputChannel) {
            state.clientScriptLogOutputChannel.appendLine(stopMessage);
        }
        if (state.adminLogOutputChannel) {
            state.adminLogOutputChannel.appendLine(stopMessage);
        }
        if (state.serverCrashLogOutputChannel) {
            state.serverCrashLogOutputChannel.appendLine(stopMessage);
        }
        if (state.clientCrashLogOutputChannel) {
            state.clientCrashLogOutputChannel.appendLine(stopMessage);
        }

        state.logMonitoringActive = false;

        if (state.toolsOutputChannel) {
            state.toolsOutputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Log monitoring stopped`);
        }
    } catch (error) {
        if (state.toolsOutputChannel) {
            state.toolsOutputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Error stopping log monitoring: ${error}`);
        } else {
            console.log('Error stopping log monitoring:', error);
        }
    }
}

/**
 * Aggressively kills all DayZ-related processes using PowerShell
 * This is used as a fallback when normal process termination fails
 */
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

/**
 * Stops all running DayZ processes (server and client)
 * @param state - The extension state containing process references
 * @param statusBarItem - The status bar item to update during shutdown
 */
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
                showAutoHideNotification('DayZ Client process cleanup forced after timeout', 'warning', 3000);
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
                        showAutoHideNotification('DayZ Server process cleanup forced after timeout', 'warning', 3000);
                    }
                }, 3000);
            }
        }, 10000);

        state.serverProcess.on('exit', () => {
            clearTimeout(forceKillTimeout);
        });
    }

    // Stop log monitoring
    stopLogMonitoring(state);

    // Final fallback: Use PowerShell to kill any remaining DayZ processes after 15 seconds
    setTimeout(() => {
        if (state.isShuttingDown) {
            showAutoHideNotification('Using fallback method to kill remaining DayZ processes...', 'warning', 3000);
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
        const deletedCount = clearOldLogs(profileDir, state.debugOutputChannel || undefined);
        if (deletedCount > 0) {
            logToTools(state, `Cleared ${deletedCount} old server log file(s)`);
        }

        const serverExePath = path.join(settings.dayzServerDir, 'DayZServer_x64.exe');
        const modString = buildModString(settings, repoDir);

        logToTools(state, 'Starting DayZ Server...');
        logToTools(state, `Server Path: ${serverExePath}`);
        logToTools(state, `Mission Directory: ${missionDir}`);
        logToTools(state, `Profile Directory: ${profileDir}`);
        logToTools(state, `Settings: modName=${settings.modName}, additionalMods=${settings.additionalMods?.join(',') || 'none'}`);
        logToTools(state, `Built mod string: ${modString}`);

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

        logToTools(state, `Running command: ${serverExePath} ${args.join(' ')}`);

        // Start server process with proper stdio handling for crash detection
        state.serverProcess = spawn(serverExePath, args, {
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true // Prevent window from opening
        });

        // Handle server process events
        state.serverProcess.on('spawn', () => {
            updateStatusBar(statusBarItem, state);
            showStatusMessage('DayZ Server started successfully', 3000);

            // Start log monitoring for server
            startLogMonitoring(state, profileDir);
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
        const deletedCount = clearOldLogs(profileDir, state.debugOutputChannel || undefined);
        if (deletedCount > 0) {
            logToTools(state, `Cleared ${deletedCount} old client log file(s)`);
        }

        const clientExePath = path.join(settings.dayzClientDir, 'DayZ_BE.exe');
        const modString = buildModString(settings, repoDir);

        logToTools(state, 'Starting DayZ Client...');
        logToTools(state, `Client Path: ${clientExePath}`);
        logToTools(state, `Profile Directory: ${profileDir}`);
        logToTools(state, `Server Address: ${settings.serverAddress}`);
        logToTools(state, `Settings: modName=${settings.modName}, additionalMods=${settings.additionalMods?.join(',') || 'none'}`);
        logToTools(state, `Built client mod string: ${modString}`);

        const args = [
            `-mod=${modString}`,
            `-connect=${settings.serverAddress}`,
            `-profiles=${profileDir}`,
            '-doLogs'
        ];

        logToTools(state, `Running command: ${clientExePath} ${args.join(' ')}`);

        // Start client process with proper event handling
        state.clientProcess = spawn(clientExePath, args, {
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true // Prevent console window from opening
        });

        // Handle client process events
        state.clientProcess.on('spawn', () => {
            updateStatusBar(statusBarItem, state);
            showStatusMessage('DayZ Client started successfully', 3000);

            // Start log monitoring for client (or add to existing monitoring)
            const repoDir = getWorkspaceRoot();
            const outDir = path.join(repoDir, 'out');
            const serverProfileDir = path.join(outDir, 'ServerProfile');

            // Start monitoring both server and client profiles if server is running
            if (state.serverProcess && fs.existsSync(serverProfileDir)) {
                startLogMonitoring(state, serverProfileDir, profileDir);
            } else {
                startLogMonitoring(state, undefined, profileDir);
            }
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
                showAutoHideNotification(`Client Warning: ${errorOutput.substring(0, 100)}...`, 'warning', 4000);
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start client: ${error}`);
        state.clientProcess = null;
        updateStatusBar(statusBarItem, state);
    }
}