# Download Enforce Script LSP binaries from GitHub releases

param(
    [string]$Version = $null
)

Write-Host "Downloading Enforce Script Language Server..." -ForegroundColor Cyan

# Get the script directory and project root
$scriptDir = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $scriptDir "bin"

# Ensure bin directory exists
if (-not (Test-Path $binDir)) {
    Write-Host "Creating bin directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

# If no version specified, try to read from package.json
if (-not $Version) {
    $packageJsonPath = Join-Path $scriptDir "package.json"
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        if ($packageJson.PSObject.Properties['enforceLspVersion']) {
            $Version = $packageJson.enforceLspVersion
            Write-Host "Using LSP version from package.json: $Version" -ForegroundColor Cyan
        }
    }
}

# If still no version, use latest
if (-not $Version) {
    Write-Host "No version specified, fetching latest release..." -ForegroundColor Yellow
    
    try {
        $latestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/devz-tools/enforce-script-lsp/releases/latest" -Headers @{
            "User-Agent" = "DevZ-Tools-VSCode-Extension"
        }
        $Version = $latestRelease.tag_name
        Write-Host "Latest version: $Version" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to fetch latest release: $_" -ForegroundColor Red
        exit 1
    }
}

# This extension targets Windows x64 only
$platform = "windows-x64"
$extension = ".exe"

# Construct download URL
# Format: https://github.com/devz-tools/enforce-script-lsp/releases/download/0.1.3/enforce-script-lsp-0.1.3-windows-x64.exe
$filename = "enforce-script-lsp-${Version}-${platform}${extension}"
$downloadUrl = "https://github.com/devz-tools/enforce-script-lsp/releases/download/${Version}/${filename}"
$outputPath = Join-Path $binDir "enforce-script-lsp${extension}"

Write-Host "Platform: $platform" -ForegroundColor Cyan
Write-Host "Download URL: $downloadUrl" -ForegroundColor Cyan
Write-Host "Output path: $outputPath" -ForegroundColor Cyan

# Download the binary
try {
    Write-Host "Downloading LSP binary..." -ForegroundColor Yellow
    
    # Use Invoke-WebRequest to download with progress
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath -Headers @{
        "User-Agent" = "DevZ-Tools-VSCode-Extension"
    }
    $ProgressPreference = 'Continue'
    
    Write-Host "✓ Download complete!" -ForegroundColor Green
    
    # Display file info
    $fileSize = (Get-Item $outputPath).Length / 1MB
    Write-Host "  Binary size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "  Location: $outputPath" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "✓ Enforce Script LSP $Version downloaded successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Failed to download LSP binary: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "  - Version '$Version' does not exist" -ForegroundColor Yellow
    Write-Host "  - No binary available for platform '$platform'" -ForegroundColor Yellow
    Write-Host "  - Network connectivity issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check available releases at: https://github.com/devz-tools/enforce-script-lsp/releases" -ForegroundColor Yellow
    exit 1
}
