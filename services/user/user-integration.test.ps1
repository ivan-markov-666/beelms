<#
User Service Integration Tests

This test suite verifies key user service endpoints:
- User creation
- User profile management
- User settings management
#>

# Test data
$testUser = @{
    email = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPass123!"
    name = "Test User"
}

$testProfile = @{
    firstName = "Test"
    lastName = "User"
    bio = "This is a test bio"
    location = "Test City"
    avatarUrl = "https://example.com/avatar.jpg"
}

$testSettings = @{
    theme = "dark"
    notifications = $true
    language = "en"
}

$baseUrl = "http://localhost:3002"
# Script-scoped variables for storing data between tests
$script:accessToken = $null
$script:userId = $null

function Test-UserCreation {
    [CmdletBinding()]
    param()
    
    $testName = "User Creation Test"
    $description = "Verifies user creation endpoint"
    $endpoint = "/users"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        $testOutput += "Using test email: $($testUser.email)"
        
        # Make the user creation request
        $body = @{
            email = $testUser.email
            name = $testUser.name
            password = $testUser.password
            role = "USER"
        } | ConvertTo-Json -Depth 5

        $testOutput += "Sending user creation request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Body $body `
                -ContentType "application/json" `
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
        if ($response -and $response.id -and $response.email -eq $testUser.email) {
            $testOutput += "✓ User creation successful. User ID: $($response.id)"
            $testResult = $true
            
            # Store user ID for subsequent tests
            $script:userId = $response.id
            $testOutput += "User ID stored for subsequent tests: $script:userId"
            
            # Now get an access token by logging in
            $loginEndpoint = "http://localhost:3001/auth/login"
            $loginBody = @{
                email = $testUser.email
                password = $testUser.password
            } | ConvertTo-Json -Depth 5
            
            $testOutput += "Getting access token by logging in..."
            
            $loginResponse = try {
                $response = Invoke-WebRequest -Uri $loginEndpoint `
                    -Method Post `
                    -Body $loginBody `
                    -ContentType "application/json" `
                    -ErrorAction Stop
                
                $response.Content | ConvertFrom-Json
            } catch {
                $testOutput += "Login failed after user creation"
                throw
            }
            
            if ($loginResponse -and $loginResponse.accessToken) {
                $script:accessToken = $loginResponse.accessToken
                $testOutput += "✓ Login successful, access token stored"
            } else {
                $testOutput += "✗ Login failed, could not get access token"
                $testResult = $false
            }
        } else {
            $testOutput += "✗ User creation failed. Response does not contain expected fields"
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

function Test-CreateUserProfile {
    [CmdletBinding()]
    param()
    
    $testName = "Create User Profile Test"
    $description = "Verifies user profile creation endpoint"
    $endpoint = "/users/$script:userId/profile"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run user creation test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run user creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the profile creation request
        $body = @{
            firstName = $testProfile.firstName
            lastName = $testProfile.lastName
            bio = $testProfile.bio
            location = $testProfile.location
            avatarUrl = $testProfile.avatarUrl
        } | ConvertTo-Json -Depth 5

        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }

        $testOutput += "Sending profile creation request..."
        $testOutput += "Request body: $body"
        
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
        if ($response -and $response.id -and $response.userId -eq $script:userId) {
            $testOutput += "✓ Profile creation successful. Profile ID: $($response.id)"
            $testResult = $true
        } else {
            $testOutput += "✗ Profile creation failed. Response does not contain expected fields"
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

function Test-GetUserProfile {
    [CmdletBinding()]
    param()
    
    $testName = "Get User Profile Test"
    $description = "Verifies get user profile endpoint"
    $endpoint = "/users/$script:userId/profile"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run user creation test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run user creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the get profile request
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
        if ($response -and $response.id -and $response.userId -eq $script:userId) {
            $testOutput += "✓ Profile retrieval successful. Profile ID: $($response.id)"
            $testResult = $true
            
            # Verify profile data matches what we created
            if ($response.firstName -eq $testProfile.firstName -and 
                $response.lastName -eq $testProfile.lastName -and 
                $response.bio -eq $testProfile.bio) {
                $testOutput += "✓ Profile data matches expected values"
            } else {
                $testOutput += "✗ Profile data does not match expected values"
                $testOutput += "Expected: $($testProfile | ConvertTo-Json -Depth 5)"
                $testOutput += "Actual: $($response | ConvertTo-Json -Depth 5)"
            }
        } else {
            $testOutput += "✗ Profile retrieval failed. Response does not contain expected fields"
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

function Test-UpdateUserProfile {
    [CmdletBinding()]
    param()
    
    $testName = "Update User Profile Test"
    $description = "Verifies update user profile endpoint"
    $endpoint = "/users/$script:userId/profile"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run user creation test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run user creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the update profile request
        $updatedProfile = @{
            firstName = "Updated"
            lastName = "Profile"
            bio = "This is an updated test bio"
            location = "Updated City"
        } | ConvertTo-Json -Depth 5

        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }

        $testOutput += "Sending profile update request..."
        $testOutput += "Request body: $updatedProfile"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Patch `
                -Headers $headers `
                -Body $updatedProfile `
                -ContentType "application/json" `
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
        if ($response -and $response.id -and $response.userId -eq $script:userId) {
            $testOutput += "✓ Profile update successful. Profile ID: $($response.id)"
            $testResult = $true
            
            # Verify profile data was updated correctly
            if ($response.firstName -eq "Updated" -and 
                $response.lastName -eq "Profile" -and 
                $response.bio -eq "This is an updated test bio") {
                $testOutput += "✓ Profile data updated correctly"
            } else {
                $testOutput += "✗ Profile data was not updated correctly"
                $testOutput += "Expected updated values not found in response"
            }
        } else {
            $testOutput += "✗ Profile update failed. Response does not contain expected fields"
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

function Test-GetUserSettings {
    [CmdletBinding()]
    param()
    
    $testName = "Get User Settings Test"
    $description = "Verifies get user settings endpoint"
    $endpoint = "/users/$script:userId/settings"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run user creation test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run user creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the get settings request
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
        if ($response -and $response.userId -eq $script:userId) {
            $testOutput += "✓ User settings retrieval successful"
            $testResult = $true
        } else {
            $testOutput += "✗ User settings retrieval failed. Response does not contain expected fields"
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

function Test-UpdateUserSettings {
    [CmdletBinding()]
    param()
    
    $testName = "Update User Settings Test"
    $description = "Verifies update user settings endpoint"
    $endpoint = "/users/$script:userId/settings"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run user creation test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run user creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the update settings request
        $body = @{
            theme = $testSettings.theme
            notifications = $testSettings.notifications
            language = $testSettings.language
        } | ConvertTo-Json -Depth 5

        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }

        $testOutput += "Sending settings update request..."
        $testOutput += "Request body: $body"
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Patch `
                -Headers $headers `
                -Body $body `
                -ContentType "application/json" `
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
        if ($response -and $response.userId -eq $script:userId) {
            $testOutput += "✓ Settings update successful"
            $testResult = $true
            
            # Verify settings data was updated correctly
            if ($response.theme -eq $testSettings.theme -and 
                $response.notifications -eq $testSettings.notifications -and 
                $response.language -eq $testSettings.language) {
                $testOutput += "✓ Settings data updated correctly"
            } else {
                $testOutput += "✗ Settings data was not updated correctly"
                $testOutput += "Expected: $($testSettings | ConvertTo-Json -Depth 5)"
                $testOutput += "Actual: $($response | ConvertTo-Json -Depth 5)"
            }
        } else {
            $testOutput += "✗ Settings update failed. Response does not contain expected fields"
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

function Test-ResetUserSettings {
    [CmdletBinding()]
    param()
    
    $testName = "Reset User Settings Test"
    $description = "Verifies reset user settings endpoint"
    $endpoint = "/users/$script:userId/settings/reset"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run user creation test first."
        }
        
        if (-not $script:userId) {
            throw "No user ID available. Please run user creation test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the reset settings request
        $headers = @{
            "Authorization" = "Bearer $script:accessToken"
        }

        $testOutput += "Sending settings reset request..."
        
        $response = try {
            $response = Invoke-WebRequest -Uri "${baseUrl}${endpoint}" `
                -Method Post `
                -Headers $headers `
                -ContentType "application/json" `
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
        if ($response -and $response.userId -eq $script:userId) {
            $testOutput += "✓ Settings reset successful"
            $testResult = $true
        } else {
            $testOutput += "✗ Settings reset failed. Response does not contain expected fields"
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
function Get-UserTestFunctions {
    return @{
        'Test-UserCreation' = ${function:Test-UserCreation};
        'Test-CreateUserProfile' = ${function:Test-CreateUserProfile};
        'Test-GetUserProfile' = ${function:Test-GetUserProfile};
        'Test-UpdateUserProfile' = ${function:Test-UpdateUserProfile};
        'Test-GetUserSettings' = ${function:Test-GetUserSettings};
        'Test-UpdateUserSettings' = ${function:Test-UpdateUserSettings};
        'Test-ResetUserSettings' = ${function:Test-ResetUserSettings};
    }
}
