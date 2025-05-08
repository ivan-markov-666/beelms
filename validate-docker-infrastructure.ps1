#!/usr/bin/env pwsh
# Този скрипт работи както на Windows, така и на Linux с PowerShell Core (pwsh)

# В PowerShell Core, $IsWindows е вградена променлива
# За по-стари версии на PowerShell, ще проверим сами
if ($null -eq $IsWindows) {
  # Определяне за по-стари версии на PowerShell
  $currentOS = [System.Environment]::OSVersion.Platform
  $onWindows = $currentOS -eq "Win32NT"
} 
else {
  # Използваме вградените променливи в PowerShell Core
  $onWindows = $IsWindows
}

# Задаване на контейнерни имена, които не зависят от OS
# При използване на docker-compose на Linux имената могат да се различават
$containerPrefix = "qa-4-free"
$dbContainerName = "${containerPrefix}-test-db-1"
$redisContainerName = "${containerPrefix}-test-redis-1"

# Настройка на цветове
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"
$colorInfo = "Cyan"

function Show-Message {
  param (
    [string]$Message,
    [string]$ForegroundColor = "White",
    [switch]$NoNewLine
  )
  
  if ($NoNewLine) {
    Write-Host $Message -ForegroundColor $ForegroundColor -NoNewline
  }
  else {
    Write-Host $Message -ForegroundColor $ForegroundColor
  }
}

Show-Message "Тестване на локалната среда за разработка..." $colorInfo

# Проверка за Docker
try {
  $dockerVersion = docker --version
  Show-Message "✅ Docker е инсталиран: $dockerVersion" $colorSuccess
}
catch {
  Show-Message "❌ Docker не е инсталиран или не е достъпен в PATH!" $colorError
  exit 1
}

# Проверка за Docker Compose
try {
  $dockerComposeVersion = docker-compose --version
  Show-Message "✅ Docker Compose е инсталиран: $dockerComposeVersion" $colorSuccess
}
catch {
  Show-Message "❌ Docker Compose не е инсталиран или не е достъпен в PATH!" $colorError
  exit 1
}

# Проверка дали Docker работи
try {
  docker info | Out-Null
  Show-Message "✅ Docker работи" $colorSuccess
}
catch {
  if ($onWindows) {
    Show-Message "❌ Docker не работи. Моля, стартирайте Docker Desktop." $colorError
  }
  else {
    Show-Message "❌ Docker не работи. Моля, стартирайте Docker service със 'sudo systemctl start docker'." $colorError
  }
  exit 1
}

# Тестване на конфигурацията
Show-Message "Тестване на Docker Compose конфигурацията..." $colorInfo
try {
  docker-compose config | Out-Null
  Show-Message "✅ Docker Compose конфигурацията е валидна" $colorSuccess
}
catch {
  Show-Message "❌ Docker Compose конфигурацията има грешки: $_" $colorError
  exit 1
}

# Тестване на базовите контейнери
Show-Message "Тестване на базовите контейнери..." $colorInfo

# Функция за проверка на контейнерите
function Test-Containers {
  param (
    [int]$MaxWaitSeconds = 60,
    [int]$WaitInterval = 2
  )
  
  # Стартиране на контейнерите
  docker-compose -f docker-compose.test.yml up -d
  
  # Получаване на актуалните имена на контейнерите (с оглед на OS специфики)
  if (-not $onWindows) {
    # На Linux, docker-compose може да използва различно именуване
    $containers = docker-compose -f docker-compose.test.yml ps --format json | ConvertFrom-Json
    if ($containers.Count -ge 2) {
      $script:dbContainerName = ($containers | Where-Object { $_.Service -like "*db*" }).Name
      $script:redisContainerName = ($containers | Where-Object { $_.Service -like "*redis*" }).Name
          
      # Ако не успяваме да получим имената, опитваме с docker ps
      if (-not $script:dbContainerName -or -not $script:redisContainerName) {
        $allContainers = docker ps --format "{{.Names}}"
        $script:dbContainerName = $allContainers | Where-Object { $_ -like "*test-db*" } | Select-Object -First 1
        $script:redisContainerName = $allContainers | Where-Object { $_ -like "*test-redis*" } | Select-Object -First 1
      }
    }
  }
  
  # Динамично изчакване с показване на прогрес
  Show-Message "Изчакване контейнерите да стартират и да станат здрави..." $colorWarning
  
  $totalWaitTime = 0
  $healthy = $false
  
  while ($totalWaitTime -lt $MaxWaitSeconds) {
    Show-Message "." $colorWarning -NoNewLine
      
    # Проверка дали контейнерите съществуват
    $containerExists = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $dbContainerName -or $_ -eq $redisContainerName }
      
    if ($containerExists) {
      # Проверка на PostgreSQL
      $pgStatus = docker exec $dbContainerName pg_isready -U test_user -h localhost -d test_db 2>&1
          
      # Проверка на Redis
      $redisStatus = docker exec $redisContainerName redis-cli -a test_redis_password ping 2>&1
          
      if ($pgStatus -match "accepting connections" -and $redisStatus -match "PONG") {
        $healthy = $true
        break
      }
    }
      
    Start-Sleep -Seconds $WaitInterval
    $totalWaitTime += $WaitInterval
  }
  
  Write-Host ""  # Нов ред след точките
  
  if ($healthy) {
    Show-Message "✅ Контейнерите са здрави и готови за работа" $colorSuccess
      
    # Показване на детайли за контейнерите
    Show-Message "`nДетайли за контейнерите:" $colorInfo
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Where-Object { $_ -match "test-db|test-redis" }
      
    # Допълнителни тестове
    Show-Message "`nТестване на PostgreSQL връзка..." $colorInfo
    $pgTestResult = docker exec $dbContainerName psql -U test_user -d test_db -c "SELECT version();" 2>&1
      
    if ($pgTestResult -match "PostgreSQL") {
      Show-Message "✅ PostgreSQL работи правилно" $colorSuccess
    }
    else {
      Show-Message "❌ Проблем с PostgreSQL: $pgTestResult" $colorError
    }
      
    Show-Message "`nТестване на Redis команди..." $colorInfo
    $redisTestResult = docker exec $redisContainerName redis-cli -a test_redis_password set test_key "Hello World" 2>&1
      
    if ($redisTestResult -match "OK") {
      Show-Message "✅ Redis работи правилно" $colorSuccess
    }
    else {
      Show-Message "❌ Проблем с Redis: $redisTestResult" $colorError
    }
      
    return $true
  }
  else {
    Show-Message "❌ Контейнерите не успяха да станат здрави в рамките на $MaxWaitSeconds секунди" $colorError
    Show-Message "`nСтатус на PostgreSQL: $pgStatus" $colorWarning
    Show-Message "Статус на Redis: $redisStatus" $colorWarning
      
    # Показване на логовете, за да видим проблема
    Show-Message "`nЛогове от контейнерите:" $colorInfo
    docker-compose -f docker-compose.test.yml logs
      
    return $false
  }
}

# Главна логика за тестване и почистване
try {
  $success = Test-Containers
  
  # Почистване
  Show-Message "`nПочистване на тестовите контейнери..." $colorInfo
  docker-compose -f docker-compose.test.yml down
  
  if ($success) {
    Show-Message "`n✅ Всички тестове преминаха успешно!" $colorSuccess
    Show-Message "`nМожете да стартирате пълния проект с:" "White"
    Show-Message "docker-compose up -d" $colorInfo
  }
  else {
    Show-Message "`n❌ Някои тестове не преминаха успешно." $colorError
    exit 1
  }
}
catch {
  Show-Message "❌ Грешка при тестване на контейнерите: $_" $colorError
  docker-compose -f docker-compose.test.yml down
  exit 1
}