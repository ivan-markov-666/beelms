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
        
        if (-not $global:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the authenticated request
        $headers = @{
            "Authorization" = "Bearer $global:accessToken"
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
        
        # Step 1: Request password reset
        $testOutput += "Testing password reset request..."
        $body = @{
            email = $testUser.email
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "${baseUrl}${requestEndpoint}" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        # Note: In a real test, we would extract the reset token from an email
        # For this test, we'll simulate a successful request
        if ($response.message -match 'Ако имейлът съществува') {
            $testOutput += "✓ Password reset request successful"
            
            # Simulate getting a reset token (in real scenario, this would come from email)
            $resetToken = "simulated-reset-token-$(Get-Random -Minimum 1000 -Maximum 9999)"
            $newPassword = "NewTestPass123!"
            
            # Step 2: Reset password with new password
            $testOutput += "Testing password reset..."
            $resetBody = @{
                token = $resetToken
                newPassword = $newPassword
            } | ConvertTo-Json

            $resetResponse = Invoke-RestMethod -Uri "${baseUrl}${resetEndpoint}" `
                -Method Post `
                -Body $resetBody `
                -ContentType "application/json" `
                -ErrorAction Stop
            
            if ($resetResponse.message -match 'успешно променена') {
                $testOutput += "✓ Password reset successful"
                $testResult = $true
                
                # Update test user password for subsequent tests
                $testUser.password = $newPassword
            } else {
                $testOutput += "✗ Password reset failed. Response: $($resetResponse | ConvertTo-Json -Depth 5)"
            }
        } else {
            $testOutput += "✗ Password reset request failed. Response: $($response | ConvertTo-Json -Depth 5)"
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
        
        if (-not $global:accessToken) {
            throw "No access token available. Please run login test first."
        }
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the logout request
        $headers = @{
            "Authorization" = "Bearer $global:accessToken"
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

# Export test functions for the test runner
export-modulemember -function Test-AuthRegistration, Test-AuthLogin, Test-GetProfile, Test-PasswordResetFlow, Test-Logout
