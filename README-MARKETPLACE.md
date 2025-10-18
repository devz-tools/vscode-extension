# DevZ Tools

A community VSCode extension for developing DayZ mods, mission files, and server experiences.

## Features

- **Pack PBO**: Quickly pack your mod into a PBO file for DayZ
- **Server & Client Management**: Start DayZ server and client together with one command
- **Data Management**: Easily wipe server and client data for clean testing
- **Directory Shortcuts**: Quick access to all DayZ-related directories
- **Mod Tooltips**: Hover tooltips showing mod names in configuration files
- **Mod Summary**: View a summary of all configured mods
- **Consolidated Log Views**: Access various DayZ log files in real-time directly from VS Code

## Getting Started

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

- DayZ client, server, and tools installed via Steam
- A DayZ mod workspace with `src/config.cpp` file

## Support

For issues, feature requests, or contributions, visit our [GitHub repository](https://github.com/devz-tools/vscode-extension).

---

**Enjoy developing DayZ mods with DevZ Tools!** 🎮