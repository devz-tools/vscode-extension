# DevZ Tools

A community VSCode extension for developing DayZ mods, mission files, and server experiences.

## Features

- **Initialize Mod Boilerplate**: Quickly set up a new DayZ mod project with official boilerplate code
- **Pack PBO**: Quickly pack your mod into a PBO file for DayZ
- **Server & Client Management**: Start DayZ server and client together with one command
- **Data Management**: Easily wipe server and client data for clean testing
- **Directory Shortcuts**: Quick access to all DayZ-related directories
- **Mod Tooltips**: Hover tooltips showing mod names in configuration files
- **Mod Summary**: View a summary of all configured mods
- **Consolidated Log Views**: Access various DayZ log files in real-time directly from VS Code
- **Syntax Highlighting**: Enhanced syntax highlighting for DayZ .c and .cpp files
- **Types Editor** - Browse and edit DayZ types in a dedicated webview with search and filtering

## Getting Started

### Starting a New Mod Project

1. Create a new empty folder for your mod
2. Initialize it as a git repository (`git init`)
3. Open the folder in VS Code
4. Run `DevZ: Initialize Mod Boilerplate` from the Command Palette (`Ctrl+Shift+P`)
5. The official DayZ mod boilerplate will be cloned and set up automatically
6. Reload the window when prompted to activate all DevZ Tools features

### Using an Existing Mod

1. Open a DayZ mod workspace (must contain `src/config.cpp`)
2. Configure your DayZ installation paths in VS Code settings
3. Use the Command Palette (`Ctrl+Shift+P`) to access DevZ commands

## Configuration

Configure the extension through VS Code settings (`Ctrl+,`):

- **DayZ Client Directory**: Path to your DayZ client installation
- **DayZ Server Directory**: Path to your DayZ server installation  
- **DayZ Tools Directory**: Path to your DayZ Tools installation
- **Steam Workshop Directory**: Path to Steam Workshop content for DayZ
- **Project Drive Directory**: Path to extracted DayZ project files (P:\ drive)
- **Mod Name**: Name of the mod you're developing
- **Server Address**: IP and port for local server connection
- **Additional Mods**: List of mod paths or Steam Workshop IDs to load
- **Enable Mod Tooltips**: Show/hide mod name tooltips in config files

## Available Commands

Access these commands through the Command Palette (`Ctrl+Shift+P`):

- `DevZ: Initialize Mod Boilerplate` - Set up a new mod project with official boilerplate code
- `DevZ: Pack PBO` - Pack your mod into a PBO file
- `DevZ: Start Server and Client` - Launch both server and client together
- `DevZ: Wipe Server Data` - Clean server data for fresh testing
- `DevZ: Wipe Client Data` - Clean client data for fresh testing
- `DevZ: Open DayZ Client Directory` - Open client installation folder
- `DevZ: Open DayZ Server Directory` - Open server installation folder
- `DevZ: Open DayZ Tools Directory` - Open tools installation folder
- `DevZ: Open DayZ Project Drive Directory` - Open project drive folder
- `DevZ: Open Steam Workshop Directory` - Open workshop content folder
- `DevZ: Show Mods Summary` - Display summary of configured mods

## Requirements

- Git must be installed and available in your system PATH (required for boilerplate initialization)
- DayZ client, server, and tools installed via Steam (for mod development and testing)
- A DayZ mod workspace with `src/config.cpp` file (created automatically by Initialize Mod Boilerplate)

## Support

For issues, feature requests, or contributions, visit our [GitHub repository](https://github.com/devz-tools/vscode-extension).

---

**Enjoy developing DayZ mods with DevZ Tools!** 🎮