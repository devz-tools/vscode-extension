# Publish Workflow Dry-Run Feature

## Overview

The publish workflow now supports a **dry-run mode** that allows you to test the complete publishing process without actually publishing to the VS Code Marketplace.

## What Gets Tested

When running in dry-run mode, the workflow executes:

✅ **All Build Steps**:
- Checkout repository with submodules
- Setup Rust toolchain
- Setup Node.js and pnpm
- Install dependencies
- Type checking
- Linting
- Build LSP server
- Build extension
- Run tests

✅ **Packaging**:
- Swap README to marketplace version
- Create VSIX package with `vsce package`
- Restore development README
- Verify package contents

❌ **Skipped**:
- Publishing to VS Code Marketplace
- No `vsce publish` command executed
- No marketplace token required

## How to Use

### Via GitHub Actions UI

1. **Navigate to Actions**:
   - Go to your repository on GitHub
   - Click the "Actions" tab
   - Select "Publish to VSCode Marketplace" workflow

2. **Trigger Workflow**:
   - Click "Run workflow" button
   - Select branch (usually `main`)

3. **Configure Options**:
   - **Version**: Leave empty to use package.json version, or specify custom version (e.g., `0.4.1`)
   - **Pre-release**: Check if testing pre-release packaging
   - **Dry run**: ✅ **CHECK THIS BOX** for dry-run mode

4. **Run**:
   - Click "Run workflow"
   - Monitor the workflow run in real-time

### Via GitHub CLI

```bash
# Dry run with default version from package.json
gh workflow run publish.yml --field dry-run=true

# Dry run with custom version
gh workflow run publish.yml \
  --field version=0.4.1 \
  --field dry-run=true

# Dry run for pre-release
gh workflow run publish.yml \
  --field pre-release=true \
  --field dry-run=true
```

## Workflow Output

### Dry-Run Mode Output

When dry-run is enabled, you'll see:

```
📦 Package created: devz-tools-0.4.0.vsix
-rw-r--r-- 1 runner runner 2.5M Oct 19 12:34 devz-tools-0.4.0.vsix

🧪 DRY RUN MODE - Package created but not published
📦 VSIX file: devz-tools-0.4.0.vsix

Package details:
Archive:  devz-tools-0.4.0.vsix
  Length      Date    Time    Name
---------  ---------- -----   ----
      123  2025-10-19 12:34   extension.vsixmanifest
     4567  2025-10-19 12:34   extension/package.json
  2345678  2025-10-19 12:34   extension/dist/extension.js
...

To publish manually, run:
  vsce publish --packagePath devz-tools-0.4.0.vsix
```

### Normal Publish Output

When dry-run is disabled (or not specified):

```
📦 Package created: devz-tools-0.4.0.vsix
-rw-r--r-- 1 runner runner 2.5M Oct 19 12:34 devz-tools-0.4.0.vsix

🚀 Publishing devz-tools-0.4.0.vsix...
Publishing devz-tools@0.4.0...
Successfully published devz-tools@0.4.0!
```

## Downloading the VSIX

The workflow always uploads the VSIX as an artifact, regardless of dry-run mode:

1. **In GitHub Actions**:
   - Open the completed workflow run
   - Scroll to "Artifacts" section at the bottom
   - Click "vsix-package" to download

2. **Via GitHub CLI**:
   ```bash
   # List artifacts
   gh run list --workflow=publish.yml
   
   # Download artifact from specific run
   gh run download <run-id> --name vsix-package
   ```

## Testing Scenarios

### Test Complete Build Pipeline

**Use case**: Verify all build steps work before actual release

```bash
gh workflow run publish.yml --field dry-run=true
```

**What this validates**:
- ✅ LSP builds successfully on Ubuntu
- ✅ Extension compiles without errors
- ✅ All tests pass in CI environment
- ✅ VSIX packages correctly
- ✅ README swap works
- ✅ Package includes all necessary files

### Test Version Bumps

**Use case**: Test packaging with new version number

```bash
gh workflow run publish.yml \
  --field version=0.5.0 \
  --field dry-run=true
```

**What this validates**:
- ✅ Custom version number applies correctly
- ✅ VSIX filename uses correct version
- ✅ Package manifest has correct version

### Test Pre-Release Packaging

**Use case**: Verify pre-release flag works

```bash
gh workflow run publish.yml \
  --field pre-release=true \
  --field dry-run=true
```

**What this validates**:
- ✅ Pre-release flag handled correctly
- ✅ Package created successfully
- ✅ Would publish as pre-release (if not dry-run)

## Verifying the Package

After downloading the VSIX from artifacts:

### 1. Inspect Package Contents

```bash
# List files in VSIX
unzip -l devz-tools-0.4.0.vsix

# Extract and explore
unzip devz-tools-0.4.0.vsix -d vsix-contents
cd vsix-contents/extension
```

### 2. Verify LSP Binary

```bash
# Check LSP exists
ls -lh extension/enforce-script-lsp/target/release/

# Should see:
# enforce-script-lsp (or .exe on Windows builds)
```

### 3. Test Installation Locally

```bash
# Install VSIX in VS Code
code --install-extension devz-tools-0.4.0.vsix

# Or via VS Code UI:
# Extensions > ... menu > Install from VSIX
```

### 4. Validate Package

```bash
# Use vsce to validate
vsce ls --packagePath devz-tools-0.4.0.vsix

# Check package size
ls -lh devz-tools-0.4.0.vsix
```

## Common Workflows

### Pre-Release Testing

```bash
# 1. Dry run to test build
gh workflow run publish.yml --field dry-run=true

# 2. Download and test VSIX locally
gh run download <run-id> --name vsix-package
code --install-extension devz-tools-*.vsix

# 3. If all good, publish for real
gh workflow run publish.yml --field dry-run=false
```

### Version Release Testing

```bash
# 1. Test new version packaging
gh workflow run publish.yml \
  --field version=1.0.0 \
  --field dry-run=true

# 2. Verify artifact contents
gh run download <run-id> --name vsix-package
unzip -l devz-tools-1.0.0.vsix

# 3. Actual release via GitHub Release
# (Workflow automatically triggers on release publish)
```

## Integration with Release Process

### Recommended Flow

1. **Development**:
   - Make changes
   - Test locally with `F5`
   - Commit and push

2. **CI Validation**:
   - CI workflow runs automatically
   - Verifies build, tests, packaging

3. **Pre-Release Dry Run**:
   ```bash
   gh workflow run publish.yml --field dry-run=true
   ```
   - Test complete publish pipeline
   - Download and manually test VSIX

4. **Actual Publish**:
   - Create GitHub Release with tag `v1.0.0`
   - Workflow automatically publishes to marketplace
   - OR manually trigger: `gh workflow run publish.yml`

## Troubleshooting

### Dry-Run Shows Errors

If dry-run fails, check the logs for:

1. **LSP Build Failures**:
   - Rust compilation errors
   - Missing dependencies
   - Submodule not initialized

2. **Extension Build Failures**:
   - TypeScript errors
   - Lint errors
   - Missing dependencies

3. **Test Failures**:
   - Unit test failures
   - Integration test issues

4. **Packaging Failures**:
   - Missing files
   - Invalid package.json
   - README swap issues

### Artifact Not Available

- Check workflow completed successfully
- Artifacts expire after 30 days
- Download within retention period

### VSIX Size Issues

```bash
# Check what's taking up space
unzip -l devz-tools-*.vsix | sort -k1 -rn | head -20

# Common culprits:
# - node_modules (should be excluded)
# - test files (should be excluded)
# - Large binary files
```

## GitHub Actions Workflow Reference

### Workflow Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `version` | string | No | package.json version | Custom version number |
| `pre-release` | boolean | No | `false` | Publish as pre-release |
| `dry-run` | boolean | No | `false` | Build and package only, skip publish |

### Workflow Steps

1. ✅ Checkout with submodules
2. ✅ Setup Rust
3. ✅ Setup Node.js & pnpm
4. ✅ Install dependencies
5. ✅ Type check
6. ✅ Lint
7. ✅ Build LSP
8. ✅ Build extension
9. ✅ Run tests
10. ✅ Package VSIX
11. ⚡ Publish (skipped if dry-run)
12. ✅ Upload artifact

## Benefits of Dry-Run

✅ **Safe Testing**: No risk of accidental marketplace publish
✅ **CI/CD Validation**: Test complete pipeline before release
✅ **Version Testing**: Verify version bumps work correctly
✅ **Artifact Review**: Inspect package contents before publishing
✅ **Debugging**: Identify issues without marketplace impact
✅ **Training**: Learn workflow without consequences

## Related Documentation

- `.github/workflows/publish.yml` - Workflow source
- `LSP-BUILD-AUTOMATION.md` - LSP build automation details
- `AGENTS.md` - Complete project documentation
