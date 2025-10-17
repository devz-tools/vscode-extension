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

## Publishing

This extension uses automated GitHub workflows for publishing to the VSCode Marketplace.

### Quick Publishing

1. **Create a release on GitHub:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. Go to GitHub → Releases → Create a new release using the tag
3. The extension will automatically be published to the marketplace

### Manual Publishing

You can also trigger publishing manually from the GitHub Actions tab.

For detailed setup instructions and troubleshooting, see [`.github/PUBLISHING.md`](.github/PUBLISHING.md).
