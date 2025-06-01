<#
Auth Service Health Check Test

This test verifies that the auth service health check endpoint is working correctly.
It sends a GET request to /auth/health and expects a 200 OK response with {"status":"ok"}
#>

function Test-AuthHealthCheck {
    [CmdletBinding()]
    param()
    
    $testName = "Auth Service Health Check"
    $description = "Verifies that the auth service health check endpoint is working"
    $baseUrl = "http://localhost:3001"
    $endpoint = "/auth/health"
    $testOutput = @()
    $testResult = $false
    $infoColor = "Cyan"  # Add missing variable

    try {
        Write-Host "Running $testName..." -ForegroundColor $infoColor
        Write-Host "  $description" -ForegroundColor $infoColor
        
        $testOutput += "Testing endpoint: ${baseUrl}${endpoint}"
        
        # Make the HTTP request
        $response = Invoke-RestMethod -Uri "${baseUrl}${endpoint}" -Method Get -ErrorAction Stop
        
        # Check if the response is as expected
        if ($response.status -eq "ok") {
            $testOutput += "✓ Health check successful. Status: $($response.status)"
            $testResult = $true
        } else {
            $testOutput += "✗ Health check failed. Unexpected response: $($response | ConvertTo-Json -Depth 10)"
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

    # Output test results
    $testOutput | ForEach-Object { Write-Host $_ }
    
    if ($testResult) {
        Write-Host "$testName PASSED" -ForegroundColor $successColor
    } else {
        Write-Host "$testName FAILED" -ForegroundColor $errorColor
    }
    
    return $testResult
}

