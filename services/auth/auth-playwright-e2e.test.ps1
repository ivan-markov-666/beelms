<#
Auth Service Playwright E2E Tests

This script runs Playwright e2e tests for the auth microservice.
#>

function Test-AuthPlaywrightE2E {
    [CmdletBinding()]
    param()
    
    $testName = "Auth Service Playwright E2E Tests"
    $description = "Runs end-to-end tests using Playwright for the auth microservice endpoints"
    $testOutput = @()
    $testResult = $false
    $infoColor = "Cyan"
    $successColor = "Green" 
    $errorColor = "Red"

    try {
        Write-Host "Running $testName..." -ForegroundColor $infoColor
        Write-Host "  $description" -ForegroundColor $infoColor
        
        # Store the original location
        $originalLocation = Get-Location
        
        try {
            # Change to the auth e2e tests directory
            $testPath = Join-Path -Path $PSScriptRoot -ChildPath "e2e-tests"
            Write-Host "Changing to directory: $testPath" -ForegroundColor $infoColor
            Set-Location -Path $testPath -ErrorAction Stop
            
            # Check if node_modules exists, if not install dependencies
            if (-not (Test-Path -Path "node_modules")) {
                Write-Host "Installing dependencies..." -ForegroundColor $infoColor
                $testOutput += "Installing npm dependencies..."
                $installOutput = npm install 2>&1 | Out-String
                $testOutput += $installOutput
            }
            
            # Check if Playwright browsers are installed
            Write-Host "Ensuring Playwright browsers are installed..." -ForegroundColor $infoColor
            $testOutput += "Installing Playwright browsers if needed..."
            $installBrowsersOutput = npx playwright install --with-deps chromium 2>&1 | Out-String
            $testOutput += $installBrowsersOutput
            
            # Run Playwright tests
            Write-Host "Running Playwright tests..." -ForegroundColor $infoColor
            $testOutput += "Running Playwright tests..."
            
            # Make sure the auth service is running
            $authServiceUrl = "http://localhost:3001/auth/health"
            try {
                $healthCheck = Invoke-RestMethod -Uri $authServiceUrl -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
                if (-not $healthCheck -or $healthCheck.status -ne "ok") {
                    throw "Auth service is not running. Please start the service before running tests."
                }
            } catch {
                $testOutput += "⚠️ Auth service is not running at $authServiceUrl. Tests will likely fail."
                Write-Host "⚠️ Auth service is not running. Tests may fail." -ForegroundColor "Yellow"
            }
            
            # Run the tests
            $playwrightOutput = npm test 2>&1 | Out-String
            $testOutput += $playwrightOutput
            
            # Check if tests passed
            if ($LASTEXITCODE -eq 0) {
                $testResult = $true
                $testOutput += "✅ All Playwright tests passed."
                Write-Host "All Playwright tests passed." -ForegroundColor $successColor
            } else {
                $testOutput += "❌ Some Playwright tests failed."
                Write-Host "Some Playwright tests failed." -ForegroundColor $errorColor
            }
        }
        finally {
            # Always return to the original directory
            Set-Location -Path $originalLocation -ErrorAction SilentlyContinue
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "❌ Error occurred: $errorMsg"
        Write-Host "Error occurred: $errorMsg" -ForegroundColor $errorColor
    }

    # Output test results
    $testOutput | ForEach-Object { Write-Host $_ }
    
    if ($testResult) {
        Write-Host "$testName PASSED" -ForegroundColor $successColor
    } else {
        Write-Host "$testName FAILED" -ForegroundColor $errorColor
    }
    
    return $testResult
}
