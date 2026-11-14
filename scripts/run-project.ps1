$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

function Invoke-NpmCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Push-Location $WorkingDirectory
    try {
        & npm.cmd @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "The npm command failed: npm $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

function Test-PortAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($null -ne $connection) {
        throw "Port $Port is already in use. Stop the application using it and run this script again."
    }
}

Write-Host '=== RopiWeb full startup ===' -ForegroundColor Cyan

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw 'Node.js was not found on PATH.'
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm was not found on PATH.'
}

if (-not (Test-Path (Join-Path $backendPath 'node_modules'))) {
    Write-Host 'Installing backend dependencies...' -ForegroundColor Yellow
    Invoke-NpmCommand -WorkingDirectory $backendPath -Arguments @('install')
}

if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
    Write-Host 'Installing frontend dependencies...' -ForegroundColor Yellow
    Invoke-NpmCommand -WorkingDirectory $frontendPath -Arguments @('install')
}

Write-Host 'Generating Prisma client...' -ForegroundColor Yellow
Invoke-NpmCommand -WorkingDirectory $backendPath -Arguments @('run', 'prisma:generate')

Write-Host 'Applying database schema...' -ForegroundColor Yellow
Invoke-NpmCommand -WorkingDirectory $backendPath -Arguments @('run', 'prisma:push')

Write-Host 'Generating test data (existing dev.db data will be deleted)...' -ForegroundColor Yellow
Invoke-NpmCommand -WorkingDirectory $backendPath -Arguments @('run', 'prisma:seed')

Write-Host 'Building backend...' -ForegroundColor Yellow
Invoke-NpmCommand -WorkingDirectory $backendPath -Arguments @('run', 'build')

Write-Host 'Building frontend...' -ForegroundColor Yellow
Invoke-NpmCommand -WorkingDirectory $frontendPath -Arguments @('run', 'build')

Test-PortAvailable -Port 3001
Test-PortAvailable -Port 3000

Write-Host 'Starting backend: http://localhost:3001' -ForegroundColor Green
Start-Process -FilePath $env:ComSpec -ArgumentList '/k', 'npm.cmd start' -WorkingDirectory $backendPath

Write-Host 'Starting frontend: http://localhost:3000' -ForegroundColor Green
Start-Process -FilePath $env:ComSpec -ArgumentList '/k', 'npm.cmd start' -WorkingDirectory $frontendPath

Write-Host 'Checking server startup...' -ForegroundColor Yellow
$backendReady = $false
$frontendReady = $false

for ($attempt = 1; $attempt -le 120; $attempt++) {
    if (-not $backendReady) {
        try {
            $health = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 2
            $backendReady = $health.StatusCode -eq 200
        }
        catch {
            # The server may need a few seconds to start.
        }
    }

    if (-not $frontendReady) {
        try {
            $frontendResponse = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2
            $frontendReady = $frontendResponse.StatusCode -eq 200
        }
        catch {
            # The server may need a few seconds to start.
        }
    }

    if ($backendReady -and $frontendReady) {
        break
    }

    Start-Sleep -Seconds 1
}

if (-not $backendReady -or -not $frontendReady) {
    throw "The servers did not start in time. Backend: $backendReady, frontend: $frontendReady"
}

Write-Host ''
Write-Host 'RopiWeb started successfully.' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000'
Write-Host 'Backend health check: http://localhost:3001/api/health'
