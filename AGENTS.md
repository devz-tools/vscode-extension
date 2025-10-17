# AGENTS.md - DevZ Tools VSCode Extension

## Project Overview

**DevZ Tools** is a VS Code extension specifically designed for DayZ mod development. It provides developers with essential tools to streamline the DayZ modding workflow, including PBO packing, server/client management, and directory utilities.

### Purpose
- Simplify DayZ mod development workflow
- Provide quick access to DayZ-related directories and tools
- Automate common tasks like PBO packing and server/client startup
- Offer development utilities like mod tooltips and validation

### Target Users
- DayZ mod developers
- DayZ server administrators
- Community members working on DayZ projects

## Project Structure

### Root Directory
- `package.json` - Extension manifest with commands, settings, and metadata
- `esbuild.js` - Build configuration for bundling the extension
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration for code quality
- `README.md` - Development-focused README for contributors
- `README-MARKETPLACE.md` - User-facing README for VS Code Marketplace
- `.vscodeignore` - Files to exclude from VSIX package

### Source Code (`src/`)
- `extension.ts` - Main extension entry point, handles activation and command registration
- `types.ts` - TypeScript type definitions and interfaces
- `config.ts` - Extension configuration and settings management
- `fileManager.ts` - File operations (PBO packing, mod creation, data wiping)
- `processManager.ts` - Process management (server/client startup and monitoring)
- `directoryManager.ts` - Directory utilities and path management
- `statusBar.ts` - VS Code status bar integration
- `validation.ts` - Configuration validation and error checking
- `modTooltipProvider.ts` - Hover providers for mod information display
- `test/` - Unit tests for the extension

### Build & Deployment
- `scripts/swap-readme.ps1` - PowerShell script for README swapping during packaging
- `.github/workflows/` - GitHub Actions for CI/CD and publishing
- `dist/` - Built extension files (generated)

### Test Environment
- `test-workspace/` - Complete DayZ mod boilerplate for testing (git submodule)

## Key Features & Commands

### Core Commands
- `DevZ: Pack PBO` - Compile mod into PBO format
- `DevZ: Start Server and Client` - Launch both DayZ server and client
- `DevZ: Wipe Server Data` - Clean server data for testing
- `DevZ: Wipe Client Data` - Clean client data for testing
- `DevZ: Show Mods Summary` - Display configured mods overview

### Directory Shortcuts
- Open DayZ Client/Server/Tools directories
- Open Steam Workshop directory
- Open Project Drive directory (P:\ drive)

### Development Features
- Mod name tooltips in configuration files
- Configuration validation
- Status bar integration
- Process monitoring and logging

## Configuration System

The extension uses VS Code's configuration system with the prefix `devz-tools.*`:

### Key Settings
- `dayzClientDir` - DayZ client installation path
- `dayzServerDir` - DayZ server installation path
- `dayzToolsDir` - DayZ Tools installation path
- `steamWorkshopDir` - Steam Workshop content directory
- `dayzProjectDir` - Project drive directory (P:\)
- `modName` - Current mod name
- `serverAddress` - Server connection details
- `additionalMods` - Array of additional mod paths/IDs
- `enableModTooltips` - Toggle for mod tooltips

## Activation & Context

### Activation Events
- Extension activates when workspace contains `src/config.cpp` (DayZ mod structure)
- Commands are contextually available based on workspace content

### Dependencies
- Requires DayZ client, server, and tools installed via Steam
- Expects DayZ mod project structure with `src/config.cpp`
- Uses PowerShell for some operations (Windows-focused)

## Build System

### Technologies
- **TypeScript** - Main development language
- **esbuild** - Fast bundling and compilation
- **ESLint** - Code linting and quality
- **GitHub Actions** - CI/CD pipeline
- **pnpm** - Package management

### Build Scripts
- `compile` - Type check, lint, and build
- `watch` - Development mode with file watching
- `package` - Production build
- `vscode:package` - Create VSIX with marketplace README
- `vscode:publish` - Publish to marketplace with README swapping

## README Management

The project uses a dual-README system:
- `README.md` - Development/contributor documentation
- `README-MARKETPLACE.md` - User-facing marketplace documentation
- `scripts/swap-readme.ps1` - Automated swapping during packaging
- Ensures appropriate documentation for different audiences

## Testing Strategy

### Test Workspace
- Complete DayZ mod boilerplate as git submodule
- Realistic testing environment with actual mod structure
- Reset/update capabilities for consistent testing

### Validation
- Configuration validation before operations
- Path existence checking
- Error handling and user feedback

## Development Workflow

1. **Local Development**: Use F5 to launch extension host with test workspace
2. **Testing**: Run tests against realistic DayZ mod structure
3. **Building**: Use watch mode for development, package for release
4. **Publishing**: Automated via GitHub releases or manual workflow dispatch

## Important Notes for AI Tools

### File Editing Guidelines
- Always check if workspace contains `src/config.cpp` before suggesting DayZ-specific features
- Configuration changes should use VS Code's settings API
- Process management requires careful cleanup to avoid orphaned processes
- Path handling should account for Windows-style paths (C:\, P:\)

### Extension Context
- This is a specialized tool for a specific game (DayZ) and community
- Commands are contextual and may not work outside DayZ mod projects
- Extension integrates with external tools (DayZ Tools, Steam)
- Users expect game-specific terminology and workflows

### Technical Considerations
- Extension uses native Node.js modules for file operations
- Process spawning requires platform-specific handling
- Configuration validation is critical for user experience
- Status bar and UI integration should follow VS Code UX patterns