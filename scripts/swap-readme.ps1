# Script to swap README files for packaging
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("prepare", "restore")]
    [string]$Action
)

$DevReadme = "README.md"
$MarketplaceReadme = "README-MARKETPLACE.md"
$BackupReadme = "README-DEV-BACKUP.md"

if ($Action -eq "prepare") {
    Write-Host "Preparing for packaging: swapping to marketplace README..."
    
    # Backup the development README
    if (Test-Path $DevReadme) {
        Copy-Item $DevReadme $BackupReadme -Force
        Write-Host "✓ Backed up development README to $BackupReadme"
    }
    
    # Replace with marketplace README
    if (Test-Path $MarketplaceReadme) {
        Copy-Item $MarketplaceReadme $DevReadme -Force
        Write-Host "✓ Replaced README.md with marketplace version"
    } else {
        Write-Error "Marketplace README not found: $MarketplaceReadme"
        exit 1
    }
} 
elseif ($Action -eq "restore") {
    Write-Host "Restoring development README..."
    
    # Restore the development README
    if (Test-Path $BackupReadme) {
        Copy-Item $BackupReadme $DevReadme -Force
        Remove-Item $BackupReadme -Force
        Write-Host "✓ Restored development README from backup"
    } else {
        Write-Warning "No backup found: $BackupReadme"
    }
}

Write-Host "README swap completed successfully!"