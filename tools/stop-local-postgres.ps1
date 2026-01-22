param(
    [string[]]$ServicePatterns = @('postgresql-x64-*', 'postgresql*')
)

function Stop-PostgresService {
    param(
        [System.ServiceProcess.ServiceController]$Service
    )

    if ($null -eq $Service) {
        return
    }

    if ($Service.Status -eq 'Stopped') {
        Write-Host "[skip] $($Service.Name) is already stopped."
        return
    }

    Write-Host "[stop] Stopping $($Service.Name) ..."
    try {
        Stop-Service -InputObject $Service -Force -ErrorAction Stop
        $Service.WaitForStatus('Stopped', '00:00:10') | Out-Null
        Write-Host "[ok]   $($Service.Name) stopped."
    }
    catch {
        Write-Warning "[fail] Could not stop $($Service.Name): $($_.Exception.Message)"
    }
}

$resolvedServices = @()
foreach ($pattern in $ServicePatterns) {
    $matched = Get-Service -Name $pattern -ErrorAction SilentlyContinue
    if ($matched) {
        $resolvedServices += $matched
    }
}

if (-not $resolvedServices) {
    Write-Host "No PostgreSQL services matched patterns: $($ServicePatterns -join ', ')."
    exit 0
}

$uniqueServices = $resolvedServices | Sort-Object Name -Unique
foreach ($svc in $uniqueServices) {
    Stop-PostgresService -Service $svc
}
