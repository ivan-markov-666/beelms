<#
Auth Service Integration Tests

This test suite verifies all auth service endpoints:
- Registration
- Login
- Profile access
- Logout
- Password reset flow
#>

# Test data
$testUser = @{
    email = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPass123!"
    name = "Test User"
}

$baseUrl = "http://localhost:3001"
# Script-scoped variable for access token
$script:accessToken = $null

function Test-AuthRegistration {
    [CmdletBinding()]
    param()
    
    $testName = "Auth Registration Test"
    $description = "Verifies user registration endpoint"
    $endpoint = "/auth/register"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the registration request
        $body = @{
            email = $testUser.email
            password = $testUser.password
            name = $testUser.name
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "${baseUrl}${endpoint}" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        # Check response
        if ($response.id -and $response.email -eq $testUser.email -and $response.accessToken) {
            $testOutput += "✓ Registration successful. User ID: $($response.id)"
            $testResult = $true
            
            # Store access token for subsequent tests
            $script:accessToken = $response.accessToken
            $testOutput += "User ID: $($response.id)"
            
        } else {
            $testOutput += "✗ Registration failed. Unexpected response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-AuthLogin {
    [CmdletBinding()]
    param()
    
    $testName = "Auth Login Test"
    $description = "Verifies user login endpoint"
    $endpoint = "/auth/login"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the login request
        $body = @{
            email = $testUser.email
            password = $testUser.password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "${baseUrl}${endpoint}" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        # Check response
        if ($response.id -and $response.email -eq $testUser.email -and $response.accessToken) {
            $testOutput += "✓ Login successful. User ID: $($response.id)"
            $testResult = $true
            
            # Store access token for subsequent tests
            $script:accessToken = $response.accessToken
            $testOutput += "User ID: $($response.id)"
            
        } else {
            $testOutput += "✗ Login failed. Unexpected response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-GetProfile {
    [CmdletBinding()]
    param()
    
    $testName = "Get Profile Test"
    $description = "Verifies profile endpoint with authentication"
    $endpoint = "/auth/profile"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the authenticated request
        $headers = @{
            "Authorization" = "Bearer $($script:accessToken)"
        }

        $response = Invoke-RestMethod -Uri "${baseUrl}${endpoint}" `
            -Method Get `
            -Headers $headers `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        # Check response
        if ($response.id -and $response.email -eq $testUser.email) {
            $testOutput += "✓ Profile retrieved successfully. User ID: $($response.id)"
            $testResult = $true
        } else {
            $testOutput += "✗ Failed to get profile. Unexpected response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-PasswordResetFlow {
    [CmdletBinding()]
    param()
    
    $testName = "Password Reset Flow Test"
    $description = "Verifies password reset request and reset endpoints"
    $requestEndpoint = "/auth/reset-password-request"
    $resetEndpoint = "/auth/reset-password"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        # Display base URL being used
        $testOutput += "Using base URL: $baseUrl"
        $testOutput += "Test user email: $($testUser.email)"
        
        # Step 1: Request password reset
        $testOutput += "[1/2] Testing password reset request..."
        $body = @{
            email = $testUser.email
        } | ConvertTo-Json

        $testOutput += "Sending request to: ${baseUrl}${requestEndpoint}"
        $testOutput += "Request body: $body"
        
        try {
            $response = Invoke-RestMethod -Uri "${baseUrl}${requestEndpoint}" `
                -Method Post `
                -Body $body `
                -ContentType "application/json" `
                -ErrorAction Stop
                
            $testOutput += "Response received: $($response | ConvertTo-Json -Depth 5)"
        
            # Check if the reset request was successful
            if ($response.message -match 'Ако имейлът съществува') {
                $testOutput += "✓ Password reset request successful"
                
                # Simulate getting a reset token (in real scenario, this would come from email)
                $resetToken = "simulated-reset-token-$(Get-Random -Minimum 1000 -Maximum 9999)"
                $newPassword = "NewTestPass123!"
                
                # Step 2: Reset password with new password
                $testOutput += "[2/2] Testing password reset..."
                $resetBody = @{
                    token = $resetToken
                    newPassword = $newPassword
                } | ConvertTo-Json

                $testOutput += "Sending reset request to: ${baseUrl}${resetEndpoint}"
                $testOutput += "Reset request body: $resetBody"
                
                try {
                    $resetResponse = Invoke-RestMethod -Uri "${baseUrl}${resetEndpoint}" `
                        -Method Post `
                        -Body $resetBody `
                        -ContentType "application/json" `
                        -ErrorAction Stop
                        
                    $testOutput += "Reset response: $($resetResponse | ConvertTo-Json -Depth 5)"
            
                    if ($resetResponse.message -match 'успешно променена') {
                        $testOutput += "✓ Password reset successful"
                        $testResult = $true
                        
                        # Update test user password for subsequent tests
                        $testUser.password = $newPassword
                    } else {
                        $testOutput += "✗ Password reset failed. Response: $($resetResponse | ConvertTo-Json -Depth 5)"
                    }
                }
                catch {
                    $resetError = $_.Exception
                    $testOutput += "✗ Error during password reset: $($resetError.Message)"
                    if ($resetError.Response) {
                        $reader = New-Object System.IO.StreamReader($resetError.Response.GetResponseStream())
                        $reader.BaseStream.Position = 0
                        $reader.DiscardBufferedData()
                        $responseBody = $reader.ReadToEnd()
                        $testOutput += "Reset error response: $responseBody"
                    }
                    throw
                }
            } else {
                $testOutput += "✗ Password reset request did not return expected success message. Response: $($response | ConvertTo-Json -Depth 5)"
            }
        }
        catch {
            $testOutput += "✗ Error during password reset request: $($_.Exception.Message)"
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.DiscardBufferedData()
                $responseBody = $reader.ReadToEnd()
                $testOutput += "Request error response: $responseBody"
            }
            throw
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}

function Test-Logout {
    [CmdletBinding()]
    param()
    
    $testName = "Logout Test"
    $description = "Verifies logout endpoint"
    $endpoint = "/auth/logout"
    $testOutput = @()
    $testResult = $false

    try {
        Write-Host "Running $testName..." -ForegroundColor Cyan
        Write-Host "  $description" -ForegroundColor Cyan
        
        if (-not $script:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the logout request
        $headers = @{
            "Authorization" = "Bearer $($script:accessToken)"
        }

        $response = Invoke-RestMethod -Uri "${baseUrl}${endpoint}" `
            -Method Post `
            -Headers $headers `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        # Check response
        if ($response.message -match 'успешно излизане') {
            $testOutput += "✓ Logout successful"
            $testResult = $true
            
            # Clear the token after logout
            $script:accessToken = $null
            
        } else {
            $testOutput += "✗ Logout failed. Response: $($response | ConvertTo-Json -Depth 5)"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        $testOutput += "✗ Error occurred: $errorMsg"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $testOutput += "Response body: $responseBody"
        }
    }

    return @{
        Name = $testName
        Description = $description
        Output = $testOutput
        Result = $testResult
    }
}
