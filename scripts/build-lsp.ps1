# Build Enforce Script LSP

Write-Host "Building Enforce Script Language Server..." -ForegroundColor Cyan

# Check if Rust is installed
try {
    $rustVersion = cargo --version
    Write-Host "Found Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Rust/Cargo not found. Please install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Navigate to LSP directory
$scriptDir = Split-Path -Parent $PSScriptRoot
$lspDir = Join-Path $scriptDir "enforce-script-lsp"

if (-not (Test-Path $lspDir)) {
    Write-Host "ERROR: enforce-script-lsp directory not found at: $lspDir" -ForegroundColor Red
    Write-Host "Please initialize the submodule: git submodule update --init --recursive" -ForegroundColor Yellow
    exit 1
}

# Check if there are any Rust source files
$srcDir = Join-Path $lspDir "src"
if (-not (Test-Path $srcDir)) {
    Write-Host "ERROR: Source directory not found at: $srcDir" -ForegroundColor Red
    Write-Host "The submodule may not be properly initialized." -ForegroundColor Yellow
    exit 1
}

Push-Location $lspDir

try {
    Write-Host "Building release binary..." -ForegroundColor Yellow
    cargo build --release
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Enforce Script LSP built successfully!" -ForegroundColor Green
        
        # Determine executable name based on platform
        if ($IsWindows -or ($env:OS -match "Windows")) {
            $exeName = "enforce-script-lsp.exe"
        } else {
            $exeName = "enforce-script-lsp"
        }
        
        $exePath = Join-Path "target" "release" $exeName
        
        if (Test-Path $exePath) {
            Write-Host "  Binary location: $exePath" -ForegroundColor Cyan
            $fileSize = (Get-Item $exePath).Length / 1MB
            Write-Host "  Binary size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        } else {
            Write-Host "  Warning: Binary not found at expected location: $exePath" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
