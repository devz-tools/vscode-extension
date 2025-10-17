# DevZ Tools VSCode Extension

A community VSCode extension for developing DayZ mods, mission files, and server experiences.

## Development Setup

This extension includes a test workspace with the official DayZ mod boilerplate code as a git submodule.

### Running the Extension for Development

1. Open this folder in VS Code
2. Press `F5` or use "Run and Debug" to launch the extension
3. A new VS Code window will open with the `test-workspace` folder loaded
4. The test workspace contains a complete DayZ mod boilerplate to test against

### Resetting Test Workspace

To reset the test workspace to its original state (useful for testing):

```bash
cd test-workspace
git reset --hard HEAD
git clean -fd
```

### Updating Test Workspace

To update the test workspace to the latest boilerplate version:

```bash
git submodule update --remote test-workspace
```
