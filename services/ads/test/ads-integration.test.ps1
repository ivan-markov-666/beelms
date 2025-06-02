<#
Integration tests for Ads Service

This script contains integration tests for the Ads service endpoints.
It should be called from the main regression test suite.
#>

function Test-AdsEndpoints {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$BaseUrl
    )

    $testName = "Ads Service Integration Tests"
    $testOutput = @()
    $testPassed = $false
    $startTime = Get-Date

    try {
        Write-Host "Starting Ads Service Integration Tests..." -ForegroundColor Cyan

        # 1. Test GET /ads/random (public endpoint)
        $testOutput += "Testing GET /ads/random (public endpoint)..."
        try {
            $response = Invoke-RestMethod -Uri "$BaseUrl/ads/random" -Method Get -ErrorAction Stop
            
            # Validate response structure
            $requiredProps = @('id', 'title', 'description', 'imageUrl', 'targetUrl')
            $missingProps = $requiredProps | Where-Object { $null -eq $response.$_ }
            
            if ($missingProps.Count -gt 0) {
                throw "Missing required properties in response: $($missingProps -join ', ')"
            }
            
            $testOutput += "✓ Successfully retrieved random ad"
        }
        catch {
            $testOutput += "❌ Failed to get random ad: $_"
            throw
        }

        # 2. Test POST /ads/impression (public endpoint)
        $testOutput += "`nTesting POST /ads/impression (public endpoint)..."
        try {
            # First, get an ad to record impression for
            $ad = Invoke-RestMethod -Uri "$BaseUrl/ads/random" -Method Get -ErrorAction Stop
            
            $impressionData = @{
                adId = $ad.id
                sessionId = [guid]::NewGuid().ToString()
                ipAddress = "127.0.0.1"
                userAgent = "PowerShell Test"
                referrer = "https://example.com"
            } | ConvertTo-Json -Depth 10
            
            $headers = @{
                "Content-Type" = "application/json"
            }
            
            $response = Invoke-RestMethod -Uri "$BaseUrl/ads/impression" -Method Post -Body $impressionData -Headers $headers -ErrorAction Stop
            
            # Validate response
            if (-not $response.id -or -not $response.adId) {
                throw "Invalid response format: $($response | ConvertTo-Json -Depth 10)"
            }
            
            $testOutput += "✓ Successfully recorded ad impression"
        }
        catch {
            $testOutput += "❌ Failed to record ad impression: $_"
            throw
        }

        # 3. Test POST /ads/click (public endpoint)
        $testOutput += "`nTesting POST /ads/click (public endpoint)..."
        try {
            # First, record an impression to get a viewId
            $ad = Invoke-RestMethod -Uri "$BaseUrl/ads/random" -Method Get -ErrorAction Stop
            
            $impressionData = @{
                adId = $ad.id
                sessionId = [guid]::NewGuid().ToString()
                ipAddress = "127.0.0.1"
                userAgent = "PowerShell Test"
                referrer = "https://example.com"
            } | ConvertTo-Json -Depth 10
            
            $headers = @{
                "Content-Type" = "application/json"
            }
            
            $impression = Invoke-RestMethod -Uri "$BaseUrl/ads/impression" -Method Post -Body $impressionData -Headers $headers -ErrorAction Stop
            
            # Now record a click
            $clickData = @{
                viewId = $impression.id
                adId = $ad.id
                sessionId = $impression.sessionId
                ipAddress = "127.0.0.1"
                userAgent = "PowerShell Test"
                referrer = "https://example.com"
            } | ConvertTo-Json -Depth 10
            
            $response = Invoke-RestMethod -Uri "$BaseUrl/ads/click" -Method Post -Body $clickData -Headers $headers -ErrorAction Stop
            
            # Validate response
            if (-not $response.id -or -not $response.adId -or -not $response.clicked) {
                throw "Invalid response format or click not recorded: $($response | ConvertTo-Json -Depth 10)"
            }
            
            $testOutput += "✓ Successfully recorded ad click"
        }
        catch {
            $testOutput += "❌ Failed to record ad click: $_"
            throw
        }

        # If we got here, all tests passed
        $testPassed = $true
    }
    catch {
        $testOutput += "❌ Test failed with error: $_"
        $testPassed = $false
    }
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    # Create and return test result
    return @{
        Name = $testName
        Description = "Integration tests for Ads Service endpoints"
        Passed = $testPassed
        Duration = $duration.TotalSeconds
        Output = $testOutput -join "`n"
    }
}
