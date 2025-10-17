# GitHub Workflows for VSCode Extension Publishing

This repository includes automated GitHub workflows for continuous integration and publishing to the VSCode Marketplace.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Push to `main` branch and pull requests to `main`

**What it does:**
- Tests the extension on multiple platforms (Ubuntu, Windows, macOS)
- Tests with multiple Node.js versions (18, 20)
- Runs type checking, linting, and builds
- Runs unit tests
- Creates a packaged VSIX file as an artifact

### 2. Publish Workflow (`.github/workflows/publish.yml`)

**Triggers:**
- When a new release is published on GitHub
- Manual workflow dispatch (can be triggered manually from GitHub Actions tab)

**What it does:**
- Builds and tests the extension
- Publishes to the VSCode Marketplace
- Uploads the VSIX package as an artifact

## Setup Instructions

### 1. Create a VSCode Marketplace Publisher Account

1. Go to the [Visual Studio Marketplace Management Portal](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Create a new publisher or use an existing one
4. Make sure the publisher name matches the `publisher` field in your `package.json`

### 2. Generate a Personal Access Token

1. Go to [Azure DevOps](https://dev.azure.com)
2. Click on your profile picture → Personal Access Tokens
3. Click "New Token"
4. Set the following:
   - **Name:** VSCode Extension Publishing
   - **Organization:** All accessible organizations
   - **Expiration:** Choose appropriate duration
   - **Scopes:** Select "Custom defined" and check "Marketplace → Manage"
5. Click "Create" and copy the token

### 3. Add the Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `VSCODE_MARKETPLACE_TOKEN`
5. Value: Paste the Personal Access Token from step 2
6. Click "Add secret"

## Publishing Methods

### Method 1: GitHub Releases (Recommended)

1. Create a new release on GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. Go to GitHub → Releases → Create a new release
3. Choose the tag you just created
4. Fill in release notes
5. Click "Publish release"
6. The workflow will automatically publish to the marketplace

### Method 2: Manual Workflow Dispatch

1. Go to GitHub Actions tab in your repository
2. Click on "Publish to VSCode Marketplace" workflow
3. Click "Run workflow"
4. Optionally specify:
   - **Version:** Custom version number (leave empty to use package.json version)
   - **Pre-release:** Check if this should be a pre-release

## Version Management

### Automatic Version from Git Tags
When publishing via GitHub releases, the version is automatically extracted from the git tag. Make sure your tags follow the format `v1.0.0`.

### Manual Version Specification
When using manual workflow dispatch, you can specify a custom version number or leave it empty to use the version from `package.json`.

### Pre-release Publishing
You can publish pre-release versions by:
- Creating a GitHub release marked as "pre-release"
- Using manual workflow dispatch with the "pre-release" option checked

## Troubleshooting

### Common Issues

1. **Publisher mismatch error:**
   - Ensure the `publisher` field in `package.json` matches your marketplace publisher name

2. **Authentication failed:**
   - Verify your `VSCODE_MARKETPLACE_TOKEN` secret is correctly set
   - Check if your Personal Access Token has expired

3. **Version already exists:**
   - You cannot republish the same version
   - Increment the version number in `package.json` or use a different tag

4. **Tests failing:**
   - The workflow will not publish if tests fail
   - Check the CI workflow results for specific error details

### Manual Publishing (Fallback)

If the automated workflow fails, you can publish manually:

```bash
# Install vsce globally
npm install -g @vscode/vsce

# Login to marketplace (you'll need your Personal Access Token)
vsce login your-publisher-name

# Package and publish
vsce publish
```

## Workflow Features

- **Cross-platform testing:** Tests run on Ubuntu, Windows, and macOS
- **Multi-version Node.js support:** Tests with Node.js 18 and 20
- **Artifact preservation:** VSIX packages are saved as GitHub artifacts
- **Pre-release support:** Can publish beta/pre-release versions
- **Manual trigger capability:** Can be run manually when needed
- **Comprehensive validation:** Type checking, linting, building, and testing before publishing

## Security Notes

- The Personal Access Token is stored securely in GitHub Secrets
- The token is only accessible during workflow execution
- Consider setting an appropriate expiration date for your token
- Regularly rotate your access tokens for security