<#
.SYNOPSIS
    Starts the Jitsi Deck dashboard server and opens the web interface.

.DESCRIPTION
    Launches the Node.js zero-dependency Jitsi Deck controller, detects your local
    network IP, checks Docker status, and opens the dashboard in your default browser.

.PARAMETER NoBrowser
    Prevents automatically opening the default web browser on launch.
#>

[CmdletBinding()]
param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "             Jitsi Deck Launcher                    " -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js was not found in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js (>= 22.5.0 recommended) from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = & node --version
Write-Host "[OK] Found Node.js ($nodeVersion)" -ForegroundColor Green

# 2. Check Docker daemon availability (informational pre-flight)
$dockerRunning = $false
try {
    $null = & docker info --format '{{.ServerVersion}}' 2>$null
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "[OK] Docker daemon is running" -ForegroundColor Green
    }
} catch {
    # Non-blocking; Dashboard Vitals panel will reflect status
}

if (-not $dockerRunning) {
    Write-Host "[INFO] Docker daemon is not active. (You can start it now or via Docker Desktop;" -ForegroundColor Yellow
    Write-Host "       the Dashboard Vitals monitor will detect it once online)." -ForegroundColor Yellow
    
    # Attempt to start Docker Desktop if present in standard path
    $dockerDesktopExe = "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
    if (Test-Path $dockerDesktopExe) {
        Write-Host "       Attempting to launch Docker Desktop in the background..." -ForegroundColor DarkGray
        Start-Process -FilePath $dockerDesktopExe -WindowStyle Minimized -ErrorAction SilentlyContinue
    }
}

# 3. Discover local network IP for easy access
$primaryIp = "localhost"
try {
    $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { 
            $_.InterfaceAlias -notmatch 'loopback|wsl|vEthernet|tailscale|docker' -and 
            $_.IPAddress -notlike '169.254*' 
        } |
        Sort-Object -Property @{ Expression = { $_.InterfaceAlias -match 'wi-?fi|ethernet|lan' } } -Descending

    if ($ipAddresses -and $ipAddresses.Count -gt 0) {
        $primaryIp = $ipAddresses[0].IPAddress
    }
} catch {
    $primaryIp = "localhost"
}

# 4. Display access endpoints
$port = if ($env:PORT) { $env:PORT } else { "3001" }
$localUrl = "http://localhost:$port"
$lanUrl   = "http://${primaryIp}:$port"

Write-Host ""
Write-Host "  Dashboard (Local): " -NoNewline -ForegroundColor White
Write-Host $localUrl -ForegroundColor Cyan
if ($primaryIp -ne "localhost") {
    Write-Host "  Dashboard (LAN):   " -NoNewline -ForegroundColor White
    Write-Host $lanUrl -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Press Ctrl+C at any time in this window to stop the server." -ForegroundColor DarkGray
Write-Host ""

# 5. Open browser in background after short delay unless -NoBrowser is specified
if (-not $NoBrowser) {
    [System.Threading.Tasks.Task]::Run([Action]{
        Start-Sleep -Seconds 1
        Start-Process $localUrl
    }) | Out-Null
}

# 6. Start the server
& node "src/server.js"
