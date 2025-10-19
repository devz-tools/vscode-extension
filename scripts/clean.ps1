#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Cleans build artifacts and temporary files

.DESCRIPTION
    Removes dist/ and bin/ directories to ensure clean builds
    without stale files from previous builds (like source maps)

.PARAMETER Target
    What to clean: 'all' (default), 'dist', or 'bin'
#>

param(
    [ValidateSet('all', 'dist', 'bin')]
    [string]$Target = 'all'
)

$ErrorActionPreference = 'Stop'

function Remove-DirectoryIfExists {
    param([string]$Path, [string]$Name)
    
    if (Test-Path $Path) {
        Write-Host "🧹 Cleaning $Name..." -ForegroundColor Cyan
        Remove-Item -Path $Path -Recurse -Force
        Write-Host "   ✓ Removed $Path" -ForegroundColor Green
    } else {
        Write-Host "   ✓ $Name already clean" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Cleaning Build Artifacts" -ForegroundColor Cyan
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

switch ($Target) {
    'dist' {
        Remove-DirectoryIfExists -Path 'dist' -Name 'dist/ (compiled code)'
    }
    'bin' {
        Remove-DirectoryIfExists -Path 'bin' -Name 'bin/ (LSP binaries)'
    }
    'all' {
        Remove-DirectoryIfExists -Path 'dist' -Name 'dist/ (compiled code)'
        Remove-DirectoryIfExists -Path 'bin' -Name 'bin/ (LSP binaries)'
    }
}

Write-Host ""
Write-Host "✅ Clean complete!" -ForegroundColor Green
Write-Host ""
