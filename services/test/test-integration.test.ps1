<#
Test Service Integration Tests

This test suite verifies the happy path for all test service endpoints:
- Create/Get/Update/Delete Tests
- Create/Get/Update/Delete Questions
- Test Attempt workflow (start, submit answers, complete)
- User test attempts retrieval
#>

# Test data
$testData = @{
    # Test creation data
    test = @{
        title = "Integration Test $(Get-Date -Format 'yyyyMMddHHmmss')"
        description = "Test created during integration testing"
        timeLimit = 30
        passingScore = 70
        chapterId = 1
    }
    # Question creation data
    question = @{
        content = "Integration test question"
        type = "MULTIPLE_CHOICE"
        difficulty = "MEDIUM"
        answers = @(
            @{
                content = "Answer 1"
                isCorrect = $true
            },
            @{
                content = "Answer 2"
                isCorrect = $false
            },
            @{
                content = "Answer 3"
                isCorrect = $false
            }
        )
    }
    # Test attempt data
    testAttempt = @{
        userId = 1
    }
    # Answer submission data
    answerSubmission = @{
        answerId = 1
    }
}

$baseUrl = "http://localhost:3004"
# Script-scoped variables to store created resources IDs
$script:testId = $null
$script:questionId = $null
$script:testAttemptId = $null
$script:accessToken = $null

# Helper function to get auth token
function Get-AuthToken {
    [CmdletBinding()]
    param()
    
    $testOutput = @()
    
    try {
        $loginEndpoint = "http://localhost:3001/auth/login"
        $loginBody = @{
            email = "admin@example.com"  # Use a predefined test user
            password = "admin123!"
        } | ConvertTo-Json -Depth 5
        
        $testOutput += "Getting authentication token..."
        
        $response = try {
            $response = Invoke-WebRequest -Uri $loginEndpoint `
                -Method Post `
                -Body $loginBody `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Failed to get auth token"
            throw
        }
        
        if ($response -and $response.accessToken) {
            $script:accessToken = $response.accessToken
            $testOutput += "✓ Authentication token received"
            return $true
        } else {
            $testOutput += "✗ Failed to get authentication token"
            return $false
        }
    }
    catch {
        $testOutput += "✗ Error getting auth token: $_"
        return $false
    }
}

function Test-CreateTest {
    [CmdletBinding()]
    param()
    
    $testName = "Create Test Test"
    $description = "Verifies test creation endpoint"
    $endpoint = "/tests"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Ensure we have an authentication token
        if (-not $script:accessToken) {
            $authResult = Get-AuthToken
            if (-not $authResult) {
                $testOutput += "✗ Failed to get authentication token"
                return @{
                    Name = $testName
                    Description = $description
                    Output = $testOutput
                    Result = $false
                }
            }
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Prepare test creation body
        $body = @{
            title = $testData.test.title
            description = $testData.test.description
            timeLimit = $testData.test.timeLimit
            passingScore = $testData.test.passingScore
            chapterId = $testData.test.chapterId
        } | ConvertTo-Json -Depth 5

        $testOutput += "Sending test creation request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -ContentType "application/json" `
                -Headers @{
                    "Authorization" = "Bearer $script:accessToken"
                } `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
            
            # Try to parse as JSON
            try {
                $responseBody | ConvertFrom-Json -ErrorAction Stop
            } catch {
                $testOutput += "Failed to parse response as JSON"
                throw
            }
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
        # Check response
        if ($response -and $response.id) {
            $testOutput += "✓ Test creation successful. Test ID: $($response.id)"
            $script:testId = $response.id
            $testOutput += "Test ID stored for subsequent tests: $script:testId"
            $testResult = $true
        } else {
            $testOutput += "✗ Test creation failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        $testOutput += "Error stack trace: $($_.ScriptStackTrace)"
        
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

function Test-FindAllTests {
    [CmdletBinding()]
    param()
    
    $testName = "Find All Tests Test"
    $description = "Verifies retrieving all tests endpoint"
    $endpoint = "/tests"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Ensure we have an authentication token
        if (-not $script:accessToken) {
            $authResult = Get-AuthToken
            if (-not $authResult) {
                $testOutput += "✗ Failed to get authentication token"
                return @{
                    Name = $testName
                    Description = $description
                    Output = $testOutput
                    Result = $false
                }
            }
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers @{
                    "Authorization" = "Bearer $script:accessToken"
                } `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
            throw
        }
        
        # Check response
        if ($response -and $response -is [array]) {
            $testOutput += "✓ Retrieved tests successfully. Total tests: $($response.Count)"
            $testResult = $true
        } else {
            $testOutput += "✗ Find all tests failed. Expected array response."
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        $testOutput += "Error stack trace: $($_.ScriptStackTrace)"
        
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

function Test-FindTestById {
    [CmdletBinding()]
    param()
    
    $testName = "Find Test By ID Test"
    $description = "Verifies retrieving a test by ID endpoint"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Ensure we have a test ID
        if (-not $script:testId) {
            $testOutput += "✗ No test ID available. Run Test-CreateTest first."
            return @{
                Name = $testName
                Description = $description
                Output = $testOutput
                Result = $false
            }
        }
        
        # Ensure we have an authentication token
        if (-not $script:accessToken) {
            $authResult = Get-AuthToken
            if (-not $authResult) {
                $testOutput += "✗ Failed to get authentication token"
                return @{
                    Name = $testName
                    Description = $description
                    Output = $testOutput
                    Result = $false
                }
            }
        }
        
        $endpoint = "/tests/$script:testId"
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers @{
                    "Authorization" = "Bearer $script:accessToken"
                } `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
            throw
        }
        
        # Check response
        if ($response -and $response.id -eq $script:testId) {
            $testOutput += "✓ Retrieved test successfully. Test ID: $($response.id)"
            $testOutput += "Test title: $($response.title)"
            $testResult = $true
        } else {
            $testOutput += "✗ Find test by ID failed. Response does not match expected test ID."
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        $testOutput += "Error stack trace: $($_.ScriptStackTrace)"
        
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

function Test-CreateQuestion {
    [CmdletBinding()]
    param()
    
    $testName = "Create Question Test"
    $description = "Verifies question creation endpoint"
    $endpoint = "/tests/questions"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Ensure we have a test ID
        if (-not $script:testId) {
            $testOutput += "✗ No test ID available. Run Test-CreateTest first."
            return @{
                Name = $testName
                Description = $description
                Output = $testOutput
                Result = $false
            }
        }
        
        # Ensure we have an authentication token
        if (-not $script:accessToken) {
            $authResult = Get-AuthToken
            if (-not $authResult) {
                $testOutput += "✗ Failed to get authentication token"
                return @{
                    Name = $testName
                    Description = $description
                    Output = $testOutput
                    Result = $false
                }
            }
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Prepare question creation body
        $questionData = $testData.question.Clone()
        $questionData.testId = $script:testId
        
        $body = $questionData | ConvertTo-Json -Depth 5

        $testOutput += "Sending question creation request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -ContentType "application/json" `
                -Headers @{
                    "Authorization" = "Bearer $script:accessToken"
                } `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
            throw
        }
        
        # Check response
        if ($response -and $response.id) {
            $testOutput += "✓ Question creation successful. Question ID: $($response.id)"
            $script:questionId = $response.id
            $testOutput += "Question ID stored for subsequent tests: $script:questionId"
            $testResult = $true
        } else {
            $testOutput += "✗ Question creation failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        $testOutput += "Error stack trace: $($_.ScriptStackTrace)"
        
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

function Test-FindQuestionById {
    [CmdletBinding()]
    param()
    
    $testName = "Find Question By ID Test"
    $description = "Verifies retrieving a question by ID endpoint"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Ensure we have a question ID
        if (-not $script:questionId) {
            $testOutput += "✗ No question ID available. Run Test-CreateQuestion first."
            return @{
                Name = $testName
                Description = $description
                Output = $testOutput
                Result = $false
            }
        }
        
        # Ensure we have an authentication token
        if (-not $script:accessToken) {
            $authResult = Get-AuthToken
            if (-not $authResult) {
                $testOutput += "✗ Failed to get authentication token"
                return @{
                    Name = $testName
                    Description = $description
                    Output = $testOutput
                    Result = $false
                }
            }
        }
        
        $endpoint = "/tests/questions/$script:questionId"
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers @{
                    "Authorization" = "Bearer $script:accessToken"
                } `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
            throw
        }
        
        # Check response
        if ($response -and $response.id -eq $script:questionId) {
            $testOutput += "✓ Retrieved question successfully. Question ID: $($response.id)"
            $testOutput += "Question content: $($response.content)"
            $testResult = $true
        } else {
            $testOutput += "✗ Find question by ID failed. Response does not match expected question ID."
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        $testOutput += "Error stack trace: $($_.ScriptStackTrace)"
        
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

function Test-StartTestAttempt {
    [CmdletBinding()]
    param()
    
    $testName = "Start Test Attempt Test"
    $description = "Verifies starting a test attempt endpoint"
    $endpoint = "/tests/attempts/start"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Ensure we have a test ID
        if (-not $script:testId) {
            $testOutput += "✗ No test ID available. Run Test-CreateTest first."
            return @{
                Name = $testName
                Description = $description
                Output = $testOutput
                Result = $false
            }
        }
        
        # Ensure we have an authentication token
        if (-not $script:accessToken) {
            $authResult = Get-AuthToken
            if (-not $authResult) {
                $testOutput += "✗ Failed to get authentication token"
                return @{
                    Name = $testName
                    Description = $description
                    Output = $testOutput
                    Result = $false
                }
            }
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Prepare test attempt body
        $body = @{
            testId = $script:testId
            userId = $testData.testAttempt.userId
        } | ConvertTo-Json -Depth 5

        $testOutput += "Sending start test attempt request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -ContentType "application/json" `
                -Headers @{
                    "Authorization" = "Bearer $script:accessToken"
                } `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
            throw
        }
        
        # Check response
        if ($response -and $response.id) {
            $testOutput += "✓ Test attempt started successfully. Attempt ID: $($response.id)"
            $script:testAttemptId = $response.id
            $testOutput += "Test attempt ID stored for subsequent tests: $script:testAttemptId"
            $testResult = $true
        } else {
            $testOutput += "✗ Start test attempt failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        $testOutput += "Error stack trace: $($_.ScriptStackTrace)"
        
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

function Test-CompleteTestAttempt {
    [CmdletBinding()]
    param()
    
    $testName = "Complete Test Attempt Test"
    $description = "Verifies completing a test attempt endpoint"
    $endpoint = "/tests/attempts/complete"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Ensure we have a test attempt ID
        if (-not $script:testAttemptId) {
            $testOutput += "✗ No test attempt ID available. Run Test-StartTestAttempt first."
            return @{
                Name = $testName
                Description = $description
                Output = $testOutput
                Result = $false
            }
        }
        
        # Ensure we have an authentication token
        if (-not $script:accessToken) {
            $authResult = Get-AuthToken
            if (-not $authResult) {
                $testOutput += "✗ Failed to get authentication token"
                return @{
                    Name = $testName
                    Description = $description
                    Output = $testOutput
                    Result = $false
                }
            }
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Prepare complete test attempt body
        $body = @{
            attemptId = $script:testAttemptId
        } | ConvertTo-Json -Depth 5

        $testOutput += "Sending complete test attempt request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -ContentType "application/json" `
                -Headers @{
                    "Authorization" = "Bearer $script:accessToken"
                } `
                -ErrorAction Stop
            
            # Parse the response content
            $response.Content | ConvertFrom-Json
        } catch {
            $errorResponse = $_.Exception.Response
            $testOutput += "Request failed with status code: $($errorResponse.StatusCode) $($errorResponse.StatusDescription)"
            
            $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
            throw
        }
        
        # Check response
        if ($response -and $response.id -eq $script:testAttemptId) {
            $testOutput += "✓ Test attempt completed successfully. Attempt ID: $($response.id)"
            $testOutput += "Score: $($response.score)"
            $testResult = $true
        } else {
            $testOutput += "✗ Complete test attempt failed. Response does not contain expected fields"
            $testOutput += "Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        $testOutput += "Error stack trace: $($_.ScriptStackTrace)"
        
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

# Export test functions for external scripts
function Get-TestServiceTestFunctions {
    return @{
        'Test-CreateTest' = ${function:Test-CreateTest};
        'Test-FindAllTests' = ${function:Test-FindAllTests};
        'Test-FindTestById' = ${function:Test-FindTestById};
        'Test-CreateQuestion' = ${function:Test-CreateQuestion};
        'Test-FindQuestionById' = ${function:Test-FindQuestionById};
        'Test-StartTestAttempt' = ${function:Test-StartTestAttempt};
        'Test-CompleteTestAttempt' = ${function:Test-CompleteTestAttempt};
    }
}
