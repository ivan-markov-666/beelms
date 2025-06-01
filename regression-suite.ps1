<#
Regression Test Suite for QA-4-Free

This script serves as a central location to run all regression tests for the QA-4-Free project.
Each test should be implemented as a separate function and called from the main execution block.

To run all tests:
    .\regression-suite.ps1

To run a specific test:
    .\regression-suite.ps1 -TestName "TestDevelopmentEnvironment"

To generate an HTML report:
    .\regression-suite.ps1 -GenerateReport
#>

param(
  [string]$TestName = "",
  [switch]$GenerateReport = $false
)

# Create reports directory if it doesn't exist
$reportsDir = "$PSScriptRoot\test-reports"
if (-not (Test-Path $reportsDir)) {
  New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

# Generate timestamp for report
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "$reportsDir\test_report_$timestamp.html"

$ErrorActionPreference = "Stop"

# Colors for console output
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Cyan"

# Test counters and results
$testCount = 0
$passedTests = 0
$failedTests = 0
$testResults = @()
$testStartTime = Get-Date

# HTML Report template
$htmlHeader = @"
<!DOCTYPE html>
<html>
<head>
    <title>QA-4-Free Test Report - $timestamp</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin-bottom: 15px; padding: 10px; border-radius: 5px; }
        .passed { background-color: #e6ffe6; border-left: 5px solid #4CAF50; }
        .failed { background-color: #ffe6e6; border-left: 5px solid #f44336; }
        .summary { padding: 15px; margin: 20px 0; border-radius: 5px; background-color: #f5f5f5; }
        .timestamp { color: #666; font-size: 0.9em; }
        pre { background-color: #f8f8f8; padding: 10px; border-radius: 3px; overflow-x: auto; }
        h1 { color: #333; }
        h2 { color: #444; }
    </style>
</head>
<body>
    <h1>QA-4-Free Test Report</h1>
    <div class="timestamp">Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</div>
"@

$htmlFooter = @"
</body>
</html>
"@

function Write-TestHeader {
  param(
    [string]$testName,
    [string]$description
  )
    
  Write-Host "`n=== $testName ===" -ForegroundColor $infoColor
  Write-Host "$description" -ForegroundColor $infoColor
  $script:testCount++
}

function Write-TestResult {
  param(
    [bool]$success,
    [string]$testName,
    [string]$details = ""
  )
    
  $result = @{
    Name      = $testName
    Success   = $success
    Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Details   = $details
  }
    
  $script:testResults += $result
    
  if ($success) {
    Write-Host "[PASS] $testName" -ForegroundColor $successColor
    $script:passedTests++
  }
  else {
    Write-Host "[FAIL] $testName" -ForegroundColor $errorColor
    if ($details) {
      Write-Host "  Details: $details" -ForegroundColor $errorColor
    }
    $script:failedTests++
  }
}

function Test-DevelopmentEnvironment {
  $testName = "Development Environment Test"
  $description = "Validates that the development environment is properly configured with all required services"
  $testOutput = ""
  $testPassed = $false
    
  Write-TestHeader -testName $testName -description $description
    
  try {
    # Check if the test script exists
    $testScript = ".\validate-docker-infrastructure.ps1"
    if (-not (Test-Path $testScript)) {
      $errorMsg = "Test script not found at $testScript"
      Write-Host "Error: $errorMsg" -ForegroundColor $errorColor
      Write-TestResult -success $false -testName $testName -details $errorMsg
      return $false
    }
        
    # Run the test script and capture output
    $output = & $testScript 2>&1 | Out-String
    $testOutput = $output.Trim()
        
    # Display the output
    Write-Host $output
        
    # Check if the output contains success message or the test completed without errors
    if ($output -match "✅ Всички тестове преминаха успешно" -or 
            ($LASTEXITCODE -eq 0 -and -not ($output -match "error" -or $output -match "failed" -or $output -match "грешка"))) {
      $testPassed = $true
      Write-TestResult -success $true -testName $testName -details $testOutput
    }
    else {
      Write-TestResult -success $false -testName $testName -details $testOutput
    }
        
    return $testPassed
  }
  catch {
    Write-Host "Error during test execution: $_" -ForegroundColor $errorColor
    Write-TestResult -success $false -testName $testName
    return $false
  }
}

function Test-DatabaseMigrations {
  $testName = "Database Migrations Test"
  $description = "Validates database connection and migration loading"
  $testOutput = ""
  $testPassed = $false
  
  Write-TestHeader -testName $testName -description $description
  
  try {
    # Store the original location
    $originalLocation = Get-Location
      
    try {
      # Change to the migrations directory
      $migrationsPath = Join-Path -Path $PSScriptRoot -ChildPath "db\migrations"
      Write-Host "Changing to directory: $migrationsPath"
      Set-Location -Path $migrationsPath -ErrorAction Stop
          
      # Run the tests using npm test which uses Jest
      Write-Host "Running database migration tests..."
      $testOutput = npm test 2>&1 | Out-String
          
      # Display the test output
      Write-Host $testOutput
          
      # Check the exit code
      if ($LASTEXITCODE -ne 0) {
        throw "Database migration tests failed with exit code $LASTEXITCODE"
      }
          
      # Check if the output indicates success
      if ($testOutput -match "PASS" -or $testOutput -match "Tests:.*passed") {
        Write-Host "Database migration tests completed successfully" -ForegroundColor Green
        $testPassed = $true
        Write-TestResult -success $true -testName $testName -details $testOutput
      }
      else {
        throw "Database migration tests did not complete successfully"
      }
    }
    finally {
      # Always return to the original directory
      Set-Location -Path $originalLocation -ErrorAction SilentlyContinue
    }
    
    return $testPassed
  }
  catch {
    Write-Host "Error during database migration test: $_" -ForegroundColor $errorColor
    Write-TestResult -success $false -testName $testName -details $_
    return $false
  }
}

function New-TestReport {
  $htmlContent = $htmlHeader
    
  # Add summary section
  $executionTime = (Get-Date) - $testStartTime
  $executionTimeFormatted = "{0:hh\:mm\:ss\.fff}" -f [timespan]::fromseconds($executionTime.TotalSeconds)
    
  $statusHtml = if ($failedTests -eq 0) { 
    '<span style="color: #4CAF50;">All tests passed</span>' 
  } else { 
    '<span style="color: #f44336;">Some tests failed</span>' 
  }
  
  $htmlContent += @"
    <div class="summary">
        <h2>Test Summary</h2>
        <p>Total tests: $testCount</p>
        <p>Passed: <span style="color: #4CAF50;">$passedTests</span></p>
        <p>Failed: <span style="color: #f44336;">$failedTests</span></p>
        <p>Duration: $executionTimeFormatted</p>
        <p>Status: $statusHtml</p>
    </div>
"@ -replace "`r`n","`n" -replace "`n","`r`n"

  # Add test results
  $htmlContent += "<h2>Test Results</h2>"
    
  foreach ($result in $testResults) {
    $statusClass = if ($result.Success) { "passed" } else { "failed" }
    $statusText = if ($result.Success) { "PASS" } else { "FAIL" }
    $statusColor = if ($result.Success) { "#4CAF50" } else { "#f44336" }
        
    $htmlContent += @"
        <div class="test $statusClass">
            <h3>$($result.Name) <span style="color: $statusColor;">[$statusText]</span></h3>
            <div class="timestamp">$($result.Timestamp)</div>
"@ -replace "`r`n","`n" -replace "`n","`r`n"
        
    if (-not [string]::IsNullOrEmpty($result.Details)) {
      $details = $result.Details -replace "`r?`n", "<br/>"
      $htmlContent += @"
            <div class="details">
                <h4>Details:</h4>
                <pre>$details</pre>
            </div>
"@ -replace "`r`n","`n" -replace "`n","`r`n"
    }
        
    $htmlContent += "</div>"
  }
    
  $htmlContent += $htmlFooter
    
  $htmlContent | Out-File -FilePath $reportFile -Encoding utf8
    
  Write-Host "`nReport generated: $reportFile" -ForegroundColor $infoColor
  return $reportFile
}

# Main execution
Write-Host "`n=== QA-4-Free Regression Test Suite ===`n" -ForegroundColor "Magenta"
Write-Host "Report will be saved to: $reportFile" -ForegroundColor $infoColor

try {
  # Import test modules
  Import-Module "$PSScriptRoot\services\auth\auth-health.test.ps1" -Force -ErrorAction Stop
  
  # Load auth integration tests
  . "$PSScriptRoot\services\auth\auth-integration.test.ps1"
  $authTests = Get-AuthTestFunctions
  
  # Load user integration tests
  . "$PSScriptRoot\services\user\user-integration.test.ps1"
  $userTests = Get-UserTestFunctions
  
  # Load course integration tests
  . "$PSScriptRoot\services\course\course-integration.test.ps1"
  $courseTests = Get-CourseTestFunctions

  # Define available tests with their names, descriptions, and function references
  $availableTests = @(
    @{
      Name = "TestDevelopmentEnvironment"
      Description = "Verifies development environment setup"
      TestFunction = ${function:Test-DevelopmentEnvironment}
    },
    @{
      Name = "TestDatabaseMigrations"
      Description = "Validates database connection and migration loading"
      TestFunction = ${function:Test-DatabaseMigrations}
    },
    @{
      Name = "TestAuthHealthCheck"
      Description = "Verifies auth service health check endpoint"
      TestFunction = ${function:Test-AuthHealthCheck}
    },
    @{
      Name = "TestAuthRegistration"
      Description = "Verifies user registration endpoint"
      TestFunction = $authTests['Test-AuthRegistration']
    },
    @{
      Name = "TestAuthLogin"
      Description = "Verifies user login endpoint"
      TestFunction = $authTests['Test-AuthLogin']
    },
    @{
      Name = "TestGetProfile"
      Description = "Verifies profile endpoint with authentication"
      TestFunction = $authTests['Test-GetProfile']
    },
    @{
      Name = "TestPasswordResetFlow"
      Description = "Verifies password reset request and reset endpoints"
      TestFunction = $authTests['Test-PasswordResetFlow']
    },
    @{
      Name = "TestLogout"
      Description = "Verifies logout endpoint"
      TestFunction = $authTests['Test-Logout']
    },
    # User microservice tests
    @{
      Name = "TestUserCreation"
      Description = "Verifies user creation endpoint"
      TestFunction = $userTests['Test-UserCreation']
    },
    @{
      Name = "TestCreateUserProfile"
      Description = "Verifies user profile creation endpoint"
      TestFunction = $userTests['Test-CreateUserProfile']
    },
    @{
      Name = "TestGetUserProfile"
      Description = "Verifies get user profile endpoint"
      TestFunction = $userTests['Test-GetUserProfile']
    },
    @{
      Name = "TestUpdateUserProfile"
      Description = "Verifies update user profile endpoint"
      TestFunction = $userTests['Test-UpdateUserProfile']
    },
    @{
      Name = "TestGetUserSettings"
      Description = "Verifies get user settings endpoint"
      TestFunction = $userTests['Test-GetUserSettings']
    },
    @{
      Name = "TestUpdateUserSettings"
      Description = "Verifies update user settings endpoint"
      TestFunction = $userTests['Test-UpdateUserSettings']
    },
    @{
      Name = "TestResetUserSettings"
      Description = "Verifies reset user settings endpoint"
      TestFunction = $userTests['Test-ResetUserSettings']
    },
    # Course microservice tests
    @{
      Name = "TestCourseLogin"
      Description = "Verifies login for course tests"
      TestFunction = $courseTests['Test-Login']
    },
    @{
      Name = "TestGetCourses"
      Description = "Verifies getting all courses endpoint"
      TestFunction = $courseTests['Test-GetCourses']
    },
    @{
      Name = "TestCreateCourse"
      Description = "Verifies course creation endpoint"
      TestFunction = $courseTests['Test-CreateCourse']
    },
    @{
      Name = "TestGetCourseById"
      Description = "Verifies getting course by ID endpoint"
      TestFunction = $courseTests['Test-GetCourseById']
    },
    @{
      Name = "TestCreateChapter"
      Description = "Verifies chapter creation endpoint"
      TestFunction = $courseTests['Test-CreateChapter']
    },
    @{
      Name = "TestGetChapters"
      Description = "Verifies getting chapters for a course endpoint"
      TestFunction = $courseTests['Test-GetChapters']
    },
    @{
      Name = "TestCreateContent"
      Description = "Verifies content creation endpoint"
      TestFunction = $courseTests['Test-CreateContent']
    },
    @{
      Name = "TestGetContents"
      Description = "Verifies getting contents for a chapter endpoint"
      TestFunction = $courseTests['Test-GetContents']
    },
    @{
      Name = "TestUpdateProgress"
      Description = "Verifies updating content progress endpoint"
      TestFunction = $courseTests['Test-UpdateProgress']
    },
    @{
      Name = "TestGetProgress"
      Description = "Verifies getting user progress endpoint"
      TestFunction = $courseTests['Test-GetProgress']
    }
  )
  
  # Initialize test results
  $testResults = @()
  $testCount = 0
  $passedTests = 0
  $failedTests = 0

  # Run selected tests or all tests
  if ($TestName) {
    $testToRun = $availableTests | Where-Object { $_.Name -eq $TestName }
    if ($testToRun) {
      Write-Host "Running test: $($testToRun.Name)" -ForegroundColor Cyan
      try {
        & $testToRun.TestFunction
        $testResults += [PSCustomObject]@{
          Name    = $testToRun.Name
          Success = $true
          Message = "Test passed"
        }
        $passedTests++
      } catch {
        $testResults += [PSCustomObject]@{
          Name    = $testToRun.Name
          Success = $false
          Message = $_.Exception.Message
        }
        $failedTests++
      }
      $testCount++
    } else {
      $availableTestNames = $availableTests | ForEach-Object { $_.Name }
      $errorMsg = "Test '$TestName' not found. Available tests: $($availableTestNames -join ', ')"
      Write-Host "Error: $errorMsg" -ForegroundColor Red
      throw $errorMsg
    }
  } else {
    # Run all tests
    Write-Host "Running all regression tests..." -ForegroundColor Cyan
        
    # Execute each test
    foreach ($test in $availableTests) {
      $testCount++
      Write-Host "`nRunning test: $($test.Name) - $($test.Description)" -ForegroundColor Cyan
      try {
        & $test.TestFunction
        $testResults += [PSCustomObject]@{
          Name    = $test.Name
          Success = $true
          Message = "Test passed"
        }
        $passedTests++
      }
      catch {
        $testResults += [PSCustomObject]@{
          Name    = $test.Name
          Success = $false
          Message = $_.Exception.Message
        }
        $failedTests++
      }
    }
  }
    
  # Generate report if requested or if running all tests
  if ($GenerateReport -or $TestName -eq "") {
    $reportPath = New-TestReport
        
    # Open report in default browser if any test failed
    if ($failedTests -gt 0) {
      Start-Process $reportPath
    }
  }
  
  # Print execution time and summary
  $executionTime = (Get-Date) - $testStartTime
  $executionTimeFormatted = "{0:hh\:mm\:ss\.fff}" -f [timespan]::fromseconds($executionTime.TotalSeconds)
  
  Write-Host "`n=== Test Execution Summary ===" -ForegroundColor "Magenta"
  Write-Host "Execution time: $executionTimeFormatted"
  Write-Host "Total tests: $testCount"
  Write-Host "Passed: $passedTests" -ForegroundColor $successColor
  Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { $errorColor } else { $successColor })
    
  # Generate report if requested or if running all tests
  if ($GenerateReport -or $TestName -eq "") {
    $reportPath = New-TestReport
    
    # Open report in default browser if any test failed
    if ($failedTests -gt 0) {
      Start-Process $reportPath
    }
  }
  
  # Exit with appropriate status code
  if ($failedTests -gt 0) {
    Write-Host "`nSome tests failed. Check the report for details: $reportPath" -ForegroundColor $errorColor
    exit 1
  } else {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor $successColor
    exit 0
  }
}
catch {
  Write-Host "`nAn error occurred during test execution: $_" -ForegroundColor $errorColor
  Write-Host $_.ScriptStackTrace -ForegroundColor $errorColor
  exit 1
}
