<#
Analytics Service Integration Tests

This test suite verifies key analytics service endpoints:
- Recording analytics events
- Getting user progress
- Getting test statistics
- Getting course completion rates
- Getting aggregate performance report
- Getting individual performance report
- Exporting analytics data
#>

# Test data
$testUser = @{
    email = "testuser_analytics_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPass123!"
    name = "Test Analytics User"
}

$testEvent = @{
    eventType = "test_started"
    eventData = @{
        userId = 0
        testId = 1
        courseId = 1
        chapterId = 1
    }
}

$testCompletedEvent = @{
    eventType = "test_completed"
    eventData = @{
        userId = 0
        testId = 1
        score = 85
        passed = $true
    }
}

$baseUrl = "http://localhost:3005"
$authUrl = "http://localhost:3001"

# Script-scoped variables for storing data between tests
$script:accessToken = $null
$script:userId = $null
$script:eventId = $null

function Test-LoginForAnalytics {
    [CmdletBinding()]
    param()
    
    $testName = "Login for Analytics Tests"
    $description = "Creates a test user and gets an access token for analytics tests"
    $endpoint = "/auth/register"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        $testOutput += "Registering test user with email: $($testUser.email)"
        
        # Register a new user
        $body = @{
            email = $testUser.email
            password = $testUser.password
            name = $testUser.name
        } | ConvertTo-Json -Depth 5

        $response = try {
            $response = Invoke-WebRequest -Uri "${authUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Registration request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Registration successful, proceeding to login"
        
        # Now login to get a token
        $loginEndpoint = "/auth/login"
        $loginBody = @{
            email = $testUser.email
            password = $testUser.password
        } | ConvertTo-Json -Depth 5
        
        $loginResponse = try {
            $response = Invoke-WebRequest -Uri "${authUrl}${loginEndpoint}" `
                -Method Post `
                -Body $loginBody `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Login request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        if ($loginResponse -and $loginResponse.accessToken) {
            $script:accessToken = $loginResponse.accessToken
            $script:userId = $loginResponse.user.id
            $testOutput += "✓ Login successful, access token stored"
            $testOutput += "✓ User ID: $script:userId"
            
            # Update test event with the user ID
            $testEvent.eventData.userId = $script:userId
            $testCompletedEvent.eventData.userId = $script:userId
            
            $testResult = $true
        } else {
            $testOutput += "✗ Login failed, could not get access token"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-CreateAnalyticsEvent {
    [CmdletBinding()]
    param()
    
    $testName = "Create Analytics Event Test"
    $description = "Verifies recording an analytics event endpoint"
    $endpoint = "/api/analytics/events"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Create the event body using the userId from login
        $body = $testEvent | ConvertTo-Json -Depth 5
        
        $testOutput += "Sending analytics event creation request..."
        $testOutput += "Request body: $body"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Headers $headers `
                -Body $body `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response
        if ($response -and $response.id -and $response.eventType -eq $testEvent.eventType) {
            $testOutput += "✓ Event creation successful. Event ID: $($response.id)"
            $script:eventId = $response.id
            $testResult = $true
        } else {
            $testOutput += "✗ Event creation failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-CreateCompletedEvent {
    [CmdletBinding()]
    param()
    
    $testName = "Create Completed Test Event"
    $description = "Verifies recording a test_completed analytics event"
    $endpoint = "/api/analytics/events"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Create the event body for a completed test
        $body = $testCompletedEvent | ConvertTo-Json -Depth 5
        
        $testOutput += "Sending completed test event creation request..."
        $testOutput += "Request body: $body"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Headers $headers `
                -Body $body `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response
        if ($response -and $response.id -and $response.eventType -eq $testCompletedEvent.eventType) {
            $testOutput += "✓ Completed test event creation successful. Event ID: $($response.id)"
            $testResult = $true
        } else {
            $testOutput += "✗ Completed test event creation failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-GetUserProgress {
    [CmdletBinding()]
    param()
    
    $testName = "Get User Progress Test"
    $description = "Verifies getting user progress endpoint"
    $endpoint = "/api/analytics/user-progress/$script:userId"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response
        if ($response -and $response.userId -eq $script:userId) {
            $testOutput += "✓ User progress retrieval successful"
            
            # Check if the tests property contains our test
            $testIdStr = $testEvent.eventData.testId.ToString()
            if ($response.tests -and $response.tests.$testIdStr) {
                $testOutput += "✓ User progress contains the test we created"
            }
            
            $testResult = $true
        } else {
            $testOutput += "✗ User progress retrieval failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-GetTestStatistics {
    [CmdletBinding()]
    param()
    
    $testName = "Get Test Statistics Test"
    $description = "Verifies getting test statistics endpoint"
    $testId = $testEvent.eventData.testId
    $endpoint = "/api/analytics/test-statistics/$testId"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response
        if ($response -and $response.testId -eq $testId) {
            $testOutput += "✓ Test statistics retrieval successful"
            $testResult = $true
        } else {
            $testOutput += "✗ Test statistics retrieval failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-GetCourseCompletionRates {
    [CmdletBinding()]
    param()
    
    $testName = "Get Course Completion Rates Test"
    $description = "Verifies getting course completion rates endpoint"
    $endpoint = "/api/analytics/course-completion-rates"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response - this endpoint returns an object with course IDs as keys
        if ($null -ne $response) {
            $testOutput += "✓ Course completion rates retrieval successful"
            $testResult = $true
        } else {
            $testOutput += "✗ Course completion rates retrieval failed"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-GetAggregatePerformance {
    [CmdletBinding()]
    param()
    
    $testName = "Get Aggregate Performance Test"
    $description = "Verifies getting aggregate performance report endpoint"
    $endpoint = "/api/analytics/aggregate-performance"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response
        if ($response -and $response.overview) {
            $testOutput += "✓ Aggregate performance report retrieval successful"
            $testResult = $true
        } else {
            $testOutput += "✗ Aggregate performance report retrieval failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-GetIndividualPerformance {
    [CmdletBinding()]
    param()
    
    $testName = "Get Individual Performance Test"
    $description = "Verifies getting individual performance report endpoint"
    $endpoint = "/api/analytics/individual-performance/$script:userId"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response
        if ($response -and $response.userId -eq $script:userId) {
            $testOutput += "✓ Individual performance report retrieval successful"
            $testResult = $true
        } else {
            $testOutput += "✗ Individual performance report retrieval failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-ExportAnalyticsData {
    [CmdletBinding()]
    param()
    
    $testName = "Export Analytics Data Test"
    $description = "Verifies exporting analytics data endpoint"
    $endpoint = "/api/analytics/export"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Create query parameters to test date filtering
        $startDate = (Get-Date).AddMonths(-1).ToString("yyyy-MM-dd")
        $endDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
        $queryParams = "?startDate=$startDate&endDate=$endDate"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        $testOutput += "Request URL: ${baseUrl}${endpoint}${queryParams}"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}${queryParams}" `
                -Method Get `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            if ($errorResponse) {
                $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            
            throw
        }
        
        # Log response metadata but not full content as it could be large
        $testOutput += "Response received with status: $($response.StatusCode)"
        
        # Check if response has data property
        if ($null -ne $response -and $response.PSObject.Properties.Name -contains "data") {
            $testOutput += "✓ Analytics data export successful"
            $testOutput += "Exported data count: $($response.data.Count) records"
            $testResult = $true
        } else {
            $testOutput += "✗ Analytics data export failed"
            $testOutput += "Response structure is not as expected"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
        
        # Ensure we set the test result to false on error
        $testResult = $false
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

# Function to run all tests in sequence
function Run-AnalyticsIntegrationTests {
    [CmdletBinding()]
    param()
    
    # Array to store test results
    $testResults = @()
    
    Write-Host "Starting Analytics Service Integration Tests" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
    
    # Run tests in sequence
    $testResults += Test-LoginForAnalytics
    $testResults += Test-CreateAnalyticsEvent
    $testResults += Test-CreateCompletedEvent
    $testResults += Test-GetUserProgress
    $testResults += Test-GetTestStatistics
    $testResults += Test-GetCourseCompletionRates
    $testResults += Test-GetAggregatePerformance
    $testResults += Test-GetIndividualPerformance
    $testResults += Test-ExportAnalyticsData
    
    # Calculate overall test results
    $totalTests = $testResults.Count
    $passedTests = ($testResults | Where-Object { $_.Result -eq $true }).Count
    $failedTests = $totalTests - $passedTests
    
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "Analytics Integration Tests Summary:" -ForegroundColor Green
    Write-Host "  Total Tests: $totalTests" -ForegroundColor White
    Write-Host "  Passed: $passedTests" -ForegroundColor Green
    Write-Host "  Failed: $failedTests" -ForegroundColor Red
    Write-Host "===================================" -ForegroundColor Green
    
    # Return test results
    return $testResults
}

# Function to return references to test functions for the regression suite
function Get-AnalyticsTestFunctions {
    return @{
        "Run-AnalyticsIntegrationTests" = ${function:Run-AnalyticsIntegrationTests}
    }
}
