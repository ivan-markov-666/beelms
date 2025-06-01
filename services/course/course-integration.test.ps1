<#
Course Service Integration Tests

This test suite verifies key course service endpoints:
- Course management
- Chapter management
- Content management
- Progress tracking
#>

# Test data
$testCourse = @{
    title = "Test Course $(Get-Date -Format 'yyyyMMddHHmmss')"
    description = "This is a test course for integration testing"
    isActive = $true
    imageUrl = "https://example.com/course.jpg"
    level = "BEGINNER"
    tags = @("test", "integration")
}

$testChapter = @{
    title = "Test Chapter"
    description = "This is a test chapter"
    order = 1
}

$testContent = @{
    title = "Test Content"
    content = "This is test content"
    contentType = "TEXT"
    order = 1
}

$testProgress = @{
    completed = $true
    progressPercentage = 100
}

$baseUrl = "http://localhost:3003" # Assuming course service runs on port 3003
$authUrl = "http://localhost:3001" # Auth service for login

# Script-scoped variables for storing data between tests
$script:accessToken = $null
$script:adminAccessToken = $null
$script:courseId = $null
$script:chapterId = $null
$script:contentId = $null

function Test-Login {
    [CmdletBinding()]
    param()
    
    $testName = "User Login Test"
    $description = "Verifies login to get access token for subsequent tests"
    $endpoint = "/auth/login"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        $testOutput += "Testing endpoint: ${authUrl}${endpoint}"
        
        # Regular user login
        $userBody = @{
            email = "user@example.com" # Using a predefined user
            password = "password123"
        } | ConvertTo-Json -Depth 5

        $testOutput += "Sending user login request..."
        
        $userResponse = try {
            $response = Invoke-WebRequest -Uri "${authUrl}${endpoint}" `
                -Method Post `
                -Body $userBody `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "User login request failed: $_"
            throw
        }
        
        if ($userResponse -and $userResponse.accessToken) {
            $script:accessToken = $userResponse.accessToken
            $testOutput += "✓ User login successful, access token stored"
        } else {
            $testOutput += "✗ User login failed, could not get access token"
            throw "Failed to get user access token"
        }
        
        # Admin login
        $adminBody = @{
            email = "admin@example.com" # Using a predefined admin
            password = "password123"
        } | ConvertTo-Json -Depth 5

        $testOutput += "Sending admin login request..."
        
        $adminResponse = try {
            $response = Invoke-WebRequest -Uri "${authUrl}${endpoint}" `
                -Method Post `
                -Body $adminBody `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Admin login request failed: $_"
            throw
        }
        
        if ($adminResponse -and $adminResponse.accessToken) {
            $script:adminAccessToken = $adminResponse.accessToken
            $testOutput += "✓ Admin login successful, access token stored"
            $testResult = $true
        } else {
            $testOutput += "✗ Admin login failed, could not get access token"
            throw "Failed to get admin access token"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-GetCourses {
    [CmdletBinding()]
    param()
    
    $testName = "Get Courses Test"
    $description = "Verifies getting all courses endpoint"
    $endpoint = "/courses"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Get all courses
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 1)"
        
        # Check if response is an array
        if ($response -and $response.GetType().IsArray) {
            $testOutput += "✓ Courses retrieved successfully. Count: $($response.Count)"
            $testResult = $true
        } else {
            $testOutput += "✗ Failed to retrieve courses. Response is not an array."
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-CreateCourse {
    [CmdletBinding()]
    param()
    
    $testName = "Create Course Test"
    $description = "Verifies course creation endpoint"
    $endpoint = "/courses"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:adminAccessToken) {
            throw "No admin access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the course creation request
        $body = @{
            title = $testCourse.title
            description = $testCourse.description
            isActive = $testCourse.isActive
            imageUrl = $testCourse.imageUrl
            level = $testCourse.level
            tags = $testCourse.tags
        } | ConvertTo-Json -Depth 5

        $headers = @{
            "Authorization" = "Bearer $script:adminAccessToken"
        }

        $testOutput += "Sending course creation request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 3)"
        
        # Check response
        if ($response -and $response.id -and $response.title -eq $testCourse.title) {
            $testOutput += "✓ Course creation successful. Course ID: $($response.id)"
            $testResult = $true
            
            # Store course ID for subsequent tests
            $script:courseId = $response.id
            $testOutput += "Course ID stored for subsequent tests: $script:courseId"
        } else {
            $testOutput += "✗ Course creation failed. Response does not contain expected fields"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-GetCourseById {
    [CmdletBinding()]
    param()
    
    $testName = "Get Course By ID Test"
    $description = "Verifies getting a course by ID endpoint"
    $endpoint = "/courses/$script:courseId"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:courseId) {
            throw "No course ID available. Please run course creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Get course by ID
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 3)"
        
        # Check response
        if ($response -and $response.id -eq $script:courseId) {
            $testOutput += "✓ Course retrieved successfully. Title: $($response.title)"
            $testResult = $true
        } else {
            $testOutput += "✗ Failed to retrieve course. Response does not contain expected ID."
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-CreateChapter {
    [CmdletBinding()]
    param()
    
    $testName = "Create Chapter Test"
    $description = "Verifies chapter creation endpoint"
    $endpoint = "/courses/chapters"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:adminAccessToken) {
            throw "No admin access token available. Please run login test first."
        }
        
        if (-not $script:courseId) {
            throw "No course ID available. Please run course creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the chapter creation request
        $body = @{
            courseId = $script:courseId
            title = $testChapter.title
            description = $testChapter.description
            order = $testChapter.order
        } | ConvertTo-Json -Depth 5

        $headers = @{
            "Authorization" = "Bearer $script:adminAccessToken"
        }

        $testOutput += "Sending chapter creation request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 3)"
        
        # Check response
        if ($response -and $response.id -and $response.title -eq $testChapter.title) {
            $testOutput += "✓ Chapter creation successful. Chapter ID: $($response.id)"
            $testResult = $true
            
            # Store chapter ID for subsequent tests
            $script:chapterId = $response.id
            $testOutput += "Chapter ID stored for subsequent tests: $script:chapterId"
        } else {
            $testOutput += "✗ Chapter creation failed. Response does not contain expected fields"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-GetChapters {
    [CmdletBinding()]
    param()
    
    $testName = "Get Chapters Test"
    $description = "Verifies getting chapters for a course endpoint"
    $endpoint = "/courses/$script:courseId/chapters"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:courseId) {
            throw "No course ID available. Please run course creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Get chapters for the course
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 1)"
        
        # Check if response is an array
        if ($response -and $response.GetType().IsArray) {
            $testOutput += "✓ Chapters retrieved successfully. Count: $($response.Count)"
            $testResult = $true
            
            # Verify our created chapter is in the list
            if ($response | Where-Object { $_.id -eq $script:chapterId }) {
                $testOutput += "✓ Found our test chapter in the list"
            } else {
                $testOutput += "⚠ Could not find our test chapter in the list"
            }
        } else {
            $testOutput += "✗ Failed to retrieve chapters. Response is not an array."
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-CreateContent {
    [CmdletBinding()]
    param()
    
    $testName = "Create Content Test"
    $description = "Verifies content creation endpoint"
    $endpoint = "/courses/contents"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:adminAccessToken) {
            throw "No admin access token available. Please run login test first."
        }
        
        if (-not $script:chapterId) {
            throw "No chapter ID available. Please run chapter creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the content creation request
        $body = @{
            chapterId = $script:chapterId
            title = $testContent.title
            content = $testContent.content
            contentType = $testContent.contentType
            order = $testContent.order
        } | ConvertTo-Json -Depth 5

        $headers = @{
            "Authorization" = "Bearer $script:adminAccessToken"
        }

        $testOutput += "Sending content creation request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 3)"
        
        # Check response
        if ($response -and $response.id -and $response.title -eq $testContent.title) {
            $testOutput += "✓ Content creation successful. Content ID: $($response.id)"
            $testResult = $true
            
            # Store content ID for subsequent tests
            $script:contentId = $response.id
            $testOutput += "Content ID stored for subsequent tests: $script:contentId"
        } else {
            $testOutput += "✗ Content creation failed. Response does not contain expected fields"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-GetContents {
    [CmdletBinding()]
    param()
    
    $testName = "Get Contents Test"
    $description = "Verifies getting contents for a chapter endpoint"
    $endpoint = "/courses/chapters/$script:chapterId/contents"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:chapterId) {
            throw "No chapter ID available. Please run chapter creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Get contents for the chapter
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 1)"
        
        # Check if response is an array
        if ($response -and $response.GetType().IsArray) {
            $testOutput += "✓ Contents retrieved successfully. Count: $($response.Count)"
            $testResult = $true
            
            # Verify our created content is in the list
            if ($response | Where-Object { $_.id -eq $script:contentId }) {
                $testOutput += "✓ Found our test content in the list"
            } else {
                $testOutput += "⚠ Could not find our test content in the list"
            }
        } else {
            $testOutput += "✗ Failed to retrieve contents. Response is not an array."
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-UpdateProgress {
    [CmdletBinding()]
    param()
    
    $testName = "Update Content Progress Test"
    $description = "Verifies updating content progress endpoint"
    $endpoint = "/courses/progress/content/$script:contentId"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No user access token available. Please run login test first."
        }
        
        if (-not $script:contentId) {
            throw "No content ID available. Please run content creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the progress update request
        $body = @{
            completed = $testProgress.completed
            progressPercentage = $testProgress.progressPercentage
        } | ConvertTo-Json -Depth 5

        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }

        $testOutput += "Sending progress update request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -Headers $headers `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Response body: $responseBody"
            }
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 3)"
        
        # Check response
        if ($response -and $response.id -and $response.contentId -eq $script:contentId) {
            $testOutput += "✓ Progress update successful. Progress ID: $($response.id)"
            $testResult = $true
        } else {
            $testOutput += "✗ Progress update failed. Response does not contain expected fields"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

function Test-GetProgress {
    [CmdletBinding()]
    param()
    
    $testName = "Get Progress Test"
    $description = "Verifies getting user progress endpoint"
    $endpoint = "/courses/progress?courseId=$script:courseId"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No user access token available. Please run login test first."
        }
        
        if (-not $script:courseId) {
            throw "No course ID available. Please run course creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }
        
        # Get user progress
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Get `
                -Headers $headers `
                -ErrorAction Stop
            
            $response.Content | ConvertFrom-Json
        } catch {
            $testOutput += "Request failed: $_"
            throw
        }
        
        $testOutput += "Response received: $($response | ConvertTo-Json -Depth 1)"
        
        # Check if response is an array
        if ($response -and $response.GetType().IsArray) {
            $testOutput += "✓ Progress retrieved successfully. Count: $($response.Count)"
            $testResult = $true
            
            # Verify we can find progress for our test content
            if ($response | Where-Object { $_.contentId -eq $script:contentId }) {
                $testOutput += "✓ Found progress for our test content"
            } else {
                $testOutput += "⚠ Could not find progress for our test content"
            }
        } else {
            $testOutput += "✗ Failed to retrieve progress. Response is not an array."
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        $testOutput += "Error details: $_"
        
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

# Function to get all test functions for the regression suite
function Get-CourseTestFunctions {
    return @{
        "Test-Login" = ${function:Test-Login}
        "Test-GetCourses" = ${function:Test-GetCourses}
        "Test-CreateCourse" = ${function:Test-CreateCourse}
        "Test-GetCourseById" = ${function:Test-GetCourseById}
        "Test-CreateChapter" = ${function:Test-CreateChapter}
        "Test-GetChapters" = ${function:Test-GetChapters}
        "Test-CreateContent" = ${function:Test-CreateContent}
        "Test-GetContents" = ${function:Test-GetContents}
        "Test-UpdateProgress" = ${function:Test-UpdateProgress}
        "Test-GetProgress" = ${function:Test-GetProgress}
    }
}

# If script is run directly (not sourced), run all tests
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    $testResults = @()
    
    $testResults += Test-Login
    $testResults += Test-GetCourses
    $testResults += Test-CreateCourse
    $testResults += Test-GetCourseById
    $testResults += Test-CreateChapter
    $testResults += Test-GetChapters
    $testResults += Test-CreateContent
    $testResults += Test-GetContents
    $testResults += Test-UpdateProgress
    $testResults += Test-GetProgress
    
    # Display summary
    $passedCount = ($testResults | Where-Object { $_.Result -eq $true }).Count
    $failedCount = ($testResults | Where-Object { $_.Result -eq $false }).Count
    
    Write-Host "`n===== Test Summary =====`n" -ForegroundColor Magenta
    Write-Host "Total tests: $($testResults.Count)" -ForegroundColor Cyan
    Write-Host "Passed: $passedCount" -ForegroundColor Green
    Write-Host "Failed: $failedCount" -ForegroundColor Red
    
    # Return test results
    return $testResults
}
