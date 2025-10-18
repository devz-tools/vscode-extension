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

## **CRITICAL**: Maintaining AGENTS.md Context

### **MANDATORY UPDATE REQUIREMENT**

**⚠️ IMPORTANT**: This AGENTS.md file contains essential context for AI tools and human developers. It MUST be updated whenever the project structure changes to maintain accurate context and prevent misunderstandings.

#### When to Update AGENTS.md

**ALWAYS update this file when making ANY of these changes:**

1. **File Structure Changes**:
   - Adding new files or directories to `src/`
   - Moving, renaming, or deleting existing files
   - Creating new subdirectories or reorganizing folder structure
   - Adding new build artifacts or output directories

2. **New Features or Commands**:
   - Adding new VS Code commands to `package.json`
   - Creating new configuration settings
   - Implementing new features or capabilities
   - Adding new extension activation events

3. **Dependency Changes**:
   - Adding new npm packages or dependencies
   - Changing build tools or configuration (esbuild, ESLint, etc.)
   - Modifying the build process or scripts
   - Adding new external tool requirements

4. **Configuration Changes**:
   - Adding or modifying VS Code settings
   - Changing default values or validation rules
   - Adding new required paths or directories
   - Modifying the activation context or requirements

5. **Testing Structure Changes**:
   - Adding new test files or test directories
   - Changing the test workspace structure
   - Adding new testing approaches or frameworks
   - Modifying CI/CD pipeline or GitHub Actions

#### How to Update AGENTS.md

**Follow this checklist when updating:**

1. **Update Project Structure Section**:
   ```markdown
   # Update the file tree under "Project Structure"
   # Add descriptions for new files/directories
   # Remove references to deleted files
   # Update paths that have changed
   ```

2. **Update Feature Descriptions**:
   ```markdown
   # Add new commands to "Key Features & Commands"
   # Update configuration settings in "Configuration System"
   # Add new activation events if applicable
   ```

3. **Update Technical Context**:
   ```markdown
   # Modify "Important Notes for AI Tools" if new patterns emerge
   # Update "Development Workflow" for new processes
   # Add new "Technical Considerations" as needed
   ```

4. **Update Dependencies & Build Info**:
   ```markdown
   # Update "Build System" section for new tools
   # Modify dependency information
   # Update build scripts list
   ```

5. **Update README Files**:
   ```markdown
   # Update README.md for developer/contributor changes
   # Update README-MARKETPLACE.md for user-facing changes
   # Ensure both files reflect new features or capabilities
   # Keep installation/setup instructions current
   ```

#### Validation Checklist

**Before committing changes, verify AGENTS.md includes:**

- [ ] **Accurate File Tree**: All current files and directories are documented
- [ ] **Complete Command List**: All VS Code commands from package.json are listed
- [ ] **Current Settings**: All configuration options are documented
- [ ] **Updated Dependencies**: New packages and tools are mentioned
- [ ] **Correct Paths**: All referenced paths match actual structure
- [ ] **New Features**: Recently added capabilities are described
- [ ] **Build Process**: Current build scripts and processes are accurate
- [ ] **Testing Info**: Test structure and approach are current
- [ ] **README Files Updated**: Both README.md and README-MARKETPLACE.md reflect changes
- [ ] **No Explanatory Markdown**: No new markdown files created to explain changes

#### Why This Matters

**For AI Tools**: AI assistants rely on this context to understand the project structure and make appropriate suggestions. Outdated information leads to incorrect recommendations.

**For Developers**: New team members and contributors use this file to understand the project quickly. Accurate information prevents confusion and speeds onboarding.

**For Maintenance**: This file serves as documentation of architectural decisions and helps maintain consistency across changes.

#### Example Update Process

```bash
# 1. Make your structural changes
git add src/newFeature.ts
git add package.json  # if adding commands

# 2. Update AGENTS.md BEFORE committing
# - Add newFeature.ts to file structure
# - Update command list if new commands added
# - Add any new configuration settings

# 3. Commit everything together
git add AGENTS.md
git commit -m "feat: add new feature and update AGENTS.md context"
```

#### Documentation Standards & Prohibitions

**REQUIRED README Updates**: When making changes that affect user experience or developer workflow:
- **README.md**: Update for contributor/developer-facing changes (setup, development process, technical details)
- **README-MARKETPLACE.md**: Update for user-facing changes (features, installation, usage instructions)

**PROHIBITED**: Do NOT create explanatory markdown files to document changes or conversations:
- ❌ No REFACTORING.md, CHANGES.md, UPDATES.md, or similar files
- ❌ No markdown files explaining what occurred in chat sessions or development discussions
- ❌ No temporary documentation files that duplicate information in existing docs
- ✅ Instead: Update existing documentation (AGENTS.md, README files) directly

**Remember**: Keeping AGENTS.md current is not optional—it's a critical part of maintaining this project. Outdated context documentation can lead to significant development issues and confusion.

## Key Features & Commands

### Core Commands
- `DevZ: Pack PBO` - Compile mod into PBO format
- `DevZ: Start Server and Client` - Launch both DayZ server and client
- `DevZ: Wipe Server Data` - Clean server data for testing
- `DevZ: Wipe Client Data` - Clean client data for testing
- `DevZ: Show Mods Summary` - Display configured mods overview
- `DevZ: Initialize Mod Boilerplate` - Clone and set up DayZ mod boilerplate from GitHub

### Directory Shortcuts
- Open DayZ Client/Server/Tools directories
- Open Steam Workshop directory
- Open Project Drive directory (P:\ drive)

### Development Features
- Mod name tooltips in configuration files
- Configuration validation
- Status bar integration
- Process monitoring and logging
- Automatic mod boilerplate initialization from GitHub repository

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
- **pnpm** - Package management (REQUIRED - do not use npm or yarn)

### Build Scripts
**All scripts must be run with pnpm:**
- `pnpm run compile` - Type check, lint, and build
- `pnpm run watch` - Development mode with file watching
- `pnpm run package` - Production build
- `pnpm run vscode:package` - Create VSIX with marketplace README
- `pnpm run vscode:publish` - Publish to marketplace with README swapping

## README Management

The project uses a dual-README system:
- `README.md` - End-user focused documentation directing users to marketplace and docs website
- `README-MARKETPLACE.md` - User-facing marketplace documentation with installation/usage details
- `scripts/swap-readme.ps1` - Automated swapping during packaging via pnpm scripts
- Ensures appropriate documentation for different audiences (users vs marketplace)

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
3. **Building**: Use `pnpm run watch` for development, `pnpm run package` for release
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

### Notification System Guidelines

**IMPORTANT**: The extension now uses a less intrusive notification system to improve user experience. Follow these patterns:

**Success Operations**: Use status bar messages instead of notifications:
```typescript
// ✅ CORRECT: Use status bar for success feedback
showMeaningfulNotification('Operation completed successfully', 'success');

// ❌ INCORRECT: Don't show persistent notifications for routine success
vscode.window.showInformationMessage('Operation completed successfully');
```

**Auto-Dismiss Notifications**: Use for warnings and informational messages:
```typescript
// ✅ CORRECT: Auto-dismissing warning
showAutoHideNotification('Configuration issue detected', 'warning', 4000);

// ✅ CORRECT: Auto-dismissing info
showAutoHideNotification('Processing complete', 'info', 3000);
```

**Validation Results**: Only show issues, not success:
```typescript
// ✅ CORRECT: Silent success, only show problems
if (result.errors.length > 0) {
    vscode.window.showErrorMessage('Configuration has errors');
}
if (result.warnings.length > 0) {
    showAutoHideNotification('Configuration has warnings', 'warning');
}
// Don't show anything for valid configurations - silence is good news!
```

**Error Notifications**: Still use standard error notifications for critical issues:
```typescript
// ✅ CORRECT: Show persistent errors for critical issues
vscode.window.showErrorMessage('Critical operation failed');
```

**Status Messages**: Use for transient feedback:
```typescript
// ✅ CORRECT: Brief status messages that don't require user action
showStatusMessage('DayZ Server started successfully', 3000);
```

**Key Principles**:
- Silence is good news - don't notify for routine successful operations
- Use auto-dismiss for non-critical information
- Persistent notifications only for errors requiring user attention
- Prefer status bar messages for brief success feedback

## Code Quality Standards & Refactoring Guidelines

### **MANDATORY**: These standards must be followed for all code changes

#### 1. Documentation Requirements

**JSDoc Comments**: ALL public functions, interfaces, and classes MUST have comprehensive JSDoc documentation.

```typescript
/**
 * Brief description of what the function does
 * @param paramName - Description of the parameter including type constraints
 * @param optionalParam - Description (optional parameter)
 * @returns Description of what is returned
 * @throws Description of when/what errors are thrown
 * @example
 * ```typescript
 * const result = myFunction('example', 42);
 * ```
 */
export function myFunction(paramName: string, optionalParam?: number): Promise<string> {
    // Implementation
}
```

**Interface Documentation**: Every interface property must be documented:

```typescript
/**
 * Interface describing configuration settings
 */
export interface MySettings {
    /** Path to the installation directory */
    installPath: string;
    /** Whether feature is enabled (default: true) */
    enabled?: boolean;
}
```

#### 2. Error Handling Standards

**REQUIRED**: Use standardized error handling patterns from `utils.ts`:

```typescript
// ✅ CORRECT: Use createCommandHandler for VS Code commands
const myCommand = vscode.commands.registerCommand('my.command',
    createCommandHandler('My Command', async () => {
        await someOperation();
    })
);

// ✅ CORRECT: Use safeExecute for operations that might fail
const result = await safeExecute(
    () => riskyOperation(),
    'Failed to perform risky operation'
);

// ❌ INCORRECT: Raw try-catch without standardized handling
try {
    await someOperation();
} catch (error) {
    vscode.window.showErrorMessage(`Failed: ${error}`);
}
```

**Silent Error Handling**: For functions that handle their own error display:

```typescript
// ✅ CORRECT: Use createSilentCommandHandler
const directoryCommand = vscode.commands.registerCommand('open.directory',
    createSilentCommandHandler(openDirectory)
);
```

#### 3. Type Safety Requirements

**Interface Consolidation**: All interfaces MUST be defined in `types.ts` to prevent duplication:

```typescript
// ✅ CORRECT: Import from centralized types
import { ModInfo, DevZSettings, ValidationResult } from './types';

// ❌ INCORRECT: Defining interfaces locally when they exist in types.ts
interface ModInfo { /* ... */ }  // DON'T DO THIS
```

**Optional Properties**: Handle optional properties safely:

```typescript
// ✅ CORRECT: Safe handling of optional properties
const size = modInfo.size || 0;
const sortedMods = mods.sort((a, b) => (b.size || 0) - (a.size || 0));

// ❌ INCORRECT: Direct access to optional properties
const size = modInfo.size;  // Could be undefined
```

#### 4. Utility Function Usage

**MANDATORY**: Use shared utilities instead of duplicating code:

```typescript
// ✅ CORRECT: Use shared utilities
import { 
    formatBytes, 
    confirmDestructiveAction, 
    delay,
    showMeaningfulNotification,
    showAutoHideNotification,
    showStatusMessage
} from './utils';

const sizeText = formatBytes(1024);
const confirmed = await confirmDestructiveAction('Delete data?', 'Yes, Delete');
await delay(1000);
showMeaningfulNotification('Operation completed', 'success');

// ❌ INCORRECT: Implementing these functions locally
function formatBytes(bytes: number) { /* duplicate code */ }
vscode.window.showInformationMessage('Success!'); // Use showMeaningfulNotification instead
```

#### 5. Function Extraction Guidelines

**Complex Logic**: Extract complex logic into separate, documented functions:

```typescript
// ✅ CORRECT: Extracted and documented
/**
 * Handles the start server and client command with proper process management
 * @param statusBarItems - The status bar items for UI updates
 */
async function handleStartServerAndClient(statusBarItems: StatusBarItems): Promise<void> {
    // Complex implementation
}

// ❌ INCORRECT: Inline complex logic in command registration
vscode.commands.registerCommand('command', async () => {
    // 50+ lines of complex logic here
});
```

#### 6. Import Organization

**Standard Order**: Organize imports in this order:
1. Node.js built-ins
2. Third-party packages (vscode, etc.)
3. Local imports (grouped by type)

```typescript
// ✅ CORRECT: Organized imports
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DevZSettings, ExtensionState } from './types';
import { getExtensionSettings } from './config';
import { createCommandHandler, delay } from './utils';
```

#### 7. Testing Requirements

**Test Coverage**: ALL new functions must have corresponding tests:

```typescript
// ✅ REQUIRED: Test for each new utility function
test('myFunction should handle edge cases correctly', () => {
    assert.strictEqual(myFunction('test'), 'expected');
    assert.throws(() => myFunction(''), 'Should throw for empty input');
});
```

### Code Review Checklist

Before submitting any changes, verify:

- [ ] **JSDoc Comments**: All public functions have comprehensive JSDoc
- [ ] **Error Handling**: Uses standardized patterns from utils.ts
- [ ] **Type Safety**: No direct access to optional properties without null checks
- [ ] **No Duplication**: Shared utilities used instead of duplicate code
- [ ] **Interface Usage**: All interfaces imported from types.ts
- [ ] **Function Size**: Complex functions extracted and documented
- [ ] **Import Organization**: Imports properly organized and minimal
- [ ] **Test Coverage**: New functions have corresponding tests
- [ ] **Documentation**: Updated relevant documentation (AGENTS.md, README files)

### Anti-Patterns to Avoid

**❌ NEVER DO THESE:**

1. **Duplicate Utility Functions**: Don't recreate formatBytes, delay, etc.
2. **Raw Try-Catch**: Don't use raw try-catch for command error handling
3. **Inline Complex Logic**: Don't put 20+ lines in command handlers
4. **Local Interface Definitions**: Don't redefine interfaces that exist in types.ts
5. **Missing Documentation**: Don't submit public functions without JSDoc
6. **Unsafe Optional Access**: Don't access optional properties without checks
7. **Inconsistent Error Messages**: Don't vary error message formats

### Refactoring Workflow

When making changes:

1. **Check Existing Patterns**: Look for similar existing code first
2. **Use Shared Utilities**: Import from utils.ts and types.ts
3. **Add Documentation**: Write JSDoc before implementation
4. **Extract Complex Logic**: Keep functions focused and single-purpose
5. **Add Tests**: Write tests for new functionality
6. **Update Documentation**: Update this file and README files as needed

### Performance Considerations

- **Memory Management**: Dispose VS Code resources properly
- **Process Cleanup**: Always clean up spawned processes
- **Cache Management**: Clear caches when appropriate
- **Import Efficiency**: Only import what's needed

### Future-Proofing

- **Modular Design**: Keep functions small and focused
- **Interface Stability**: Design interfaces for future extension
- **Backward Compatibility**: Maintain existing public APIs
- **Configuration Flexibility**: Use VS Code settings for user preferences

**Remember**: These guidelines ensure code quality, maintainability, and consistency across the entire extension codebase. Following them is not optional—it's required for all contributions.