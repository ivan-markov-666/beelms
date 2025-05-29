#!/usr/bin/env pwsh

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

# Функция за проверка дали Docker демонът работи
function Test-DockerRunning {
  try {
    $pingResult = docker info 2>&1
    if ($pingResult -match "error during connect|cannot find the file specified|connection failed") {
      return $false
    }
    return $true
  }
  catch {
    return $false
  }
}

# Функция за проверка дали Docker е напълно готов за обработка на команди
function Test-DockerReady {
  param (
    [int]$MaxAttempts = 5,
    [int]$DelaySeconds = 2
  )
  
  Show-Message "Проверка дали Docker е напълно готов за работа..." $colorInfo
  for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
      # Опитваме се да изпълним проста команда
      $result = docker ps -q 2>&1
      if ($result -notmatch "error") {
        Show-Message "Docker е готов за употреба!" $colorSuccess
        return $true
      }
      Show-Message "." $colorInfo -NoNewLine
      Start-Sleep -Seconds $DelaySeconds
    }
    catch {
      Show-Message "." $colorInfo -NoNewLine
      Start-Sleep -Seconds $DelaySeconds
    }
  }
  Show-Message "" # Нов ред
  Show-Message "Docker все още не е напълно готов след $MaxAttempts опита" $colorWarning
  return $false
}

function Start-DockerDesktop {
  Show-Message "Опит за стартиране на Docker Desktop..." $colorInfo
  
  # Проверка на операционната система
  if ($IsWindows -or (-not $IsLinux -and -not $IsMacOS)) {
    # Windows пътища за Docker Desktop
    $dockerPaths = @(
      "C:\Program Files\Docker\Docker\Docker Desktop.exe",
      "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
      "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    )
    
    # Опит за стартиране на Docker Desktop
    $started = $false
    foreach ($path in $dockerPaths) {
      if (Test-Path $path) {
        try {
          Start-Process $path
          $started = $true
          Show-Message "Docker Desktop е стартиран. Моля, изчакайте да се инициализира..." $colorInfo
          break
        }
        catch {
          $errorMsg = $_.Exception.Message
          # Избягваме директна интерполация с двоеточие
          Show-Message ("Неуспешен опит за стартиране на Docker Desktop от " + $path + " - " + $errorMsg) $colorWarning
        }
      }
    }
    
    if (-not $started) {
      Show-Message "Не успяхме автоматично да стартираме Docker Desktop. Моля, стартирайте го ръчно и опитайте отново." $colorError
      return $false
    }
    
    # Изчакване Docker Desktop да се стартира (максимум 120 секунди)
    Show-Message "Изчакване Docker Desktop да стане готов..." $colorInfo
    $maxWaitTime = 120
    $waitTime = 0
    $interval = 5
    
    while ($waitTime -lt $maxWaitTime) {
      Show-Message "." $colorInfo -NoNewLine
      Start-Sleep -Seconds $interval
      $waitTime += $interval
      
      if (Test-DockerRunning) {
        Show-Message "`nDocker демонът е стартиран!" $colorSuccess
        # Допълнително изчакване и проверка дали Docker е напълно готов
        Start-Sleep -Seconds 5
        $ready = Test-DockerReady -MaxAttempts 10 -DelaySeconds 3
        if ($ready) {
          return $true
        }
        else {
          Show-Message "Docker демонът е стартиран, но все още не е напълно готов. Ще продължим с повишено внимание." $colorWarning
          Start-Sleep -Seconds 5
          return $true
        }
      }
    }
    
    Show-Message "`nDocker Desktop не стана готов в рамките на $maxWaitTime секунди." $colorError
    return $false
  }
  elseif ($IsLinux) {
    # Linux
    Show-Message "Опит за стартиране на Docker service в Linux..." $colorInfo
    try {
      sudo systemctl start docker
      Start-Sleep -Seconds 5
      if (Test-DockerRunning) {
        Show-Message "Docker service е стартиран успешно!" $colorSuccess
        $ready = Test-DockerReady -MaxAttempts 5 -DelaySeconds 2
        return $ready
      }
      else {
        Show-Message "Docker service е стартиран, но не отговаря." $colorError
        return $false
      }
    }
    catch {
      $errorMsg = $_.Exception.Message
      # Избягваме директна интерполация с двоеточие
      Show-Message ("Неуспешен опит за стартиране на Docker service - " + $errorMsg) $colorError
      return $false
    }
  }
  elseif ($IsMacOS) {
    # macOS
    Show-Message "Опит за стартиране на Docker Desktop в macOS..." $colorInfo
    try {
      open -a "Docker Desktop"
      
      # Изчакване Docker Desktop да се стартира (максимум 120 секунди)
      Show-Message "Изчакване Docker Desktop да стане готов..." $colorInfo
      $maxWaitTime = 120
      $waitTime = 0
      $interval = 5
      
      while ($waitTime -lt $maxWaitTime) {
        Show-Message "." $colorInfo -NoNewLine
        Start-Sleep -Seconds $interval
        $waitTime += $interval
        
        if (Test-DockerRunning) {
          Show-Message "`nDocker Desktop е готов!" $colorSuccess
          $ready = Test-DockerReady -MaxAttempts 5 -DelaySeconds 2
          return $ready
        }
      }
      
      Show-Message "`nDocker Desktop не стана готов в рамките на $maxWaitTime секунди." $colorError
      return $false
    }
    catch {
      $errorMsg = $_.Exception.Message
      # Избягваме директна интерполация с двоеточие
      Show-Message ("Неуспешен опит за стартиране на Docker Desktop - " + $errorMsg) $colorError
      return $false
    }
  }
  
  return $false
}

# Функция за безопасно изпълнение на Docker команди с изчакване
function Invoke-DockerCommandSafely {
  param (
    [string]$Command,
    [string]$Description,
    [int]$MaxRetries = 10,
    [int]$RetryDelaySeconds = 3
  )
  
  Show-Message $Description $colorInfo
  
  $attempt = 1
  $success = $false
  
  while (-not $success -and $attempt -le $MaxRetries) {
    try {
      if ($attempt -gt 1) {
        Show-Message ("Опит #" + $attempt + "...") $colorWarning
        # Проверка дали Docker е готов преди повторен опит
        Test-DockerReady -MaxAttempts 2 -DelaySeconds 1 | Out-Null
      }
      
      $result = Invoke-Expression $Command 2>&1
      
      if ($result -match "error|cannot|failed") {
        # Обработка на грешки от командата
        if ($attempt -lt $MaxRetries) {
          Show-Message ("Получена грешка - " + $result) $colorWarning
          Show-Message ("Изчакване преди повторен опит " + $RetryDelaySeconds + " секунди...") $colorWarning
          Start-Sleep -Seconds $RetryDelaySeconds
        }
        else {
          # Последен опит неуспешен
          Show-Message ("Командата не успя след " + $MaxRetries + " опита - " + $result) $colorError
          return $false
        }
      }
      else {
        # Успешно изпълнена команда
        $success = $true
      }
    }
    catch {
      $errorMsg = $_.Exception.Message
      if ($attempt -lt $MaxRetries) {
        Show-Message ("Получена грешка - " + $errorMsg) $colorWarning
        Show-Message ("Изчакване преди повторен опит " + $RetryDelaySeconds + " секунди...") $colorWarning
        Start-Sleep -Seconds $RetryDelaySeconds
      }
      else {
        # Последен опит неуспешен
        Show-Message ("Командата не успя след " + $MaxRetries + " опита - " + $errorMsg) $colorError
        return $false
      }
    }
    
    $attempt++
  }
  
  if ($success) {
    return $true
  }
  else {
    return $false
  }
}

Show-Message "Стартиране на автоматично тестване и почистване на Docker среда..." $colorInfo

# Проверка за Docker
try {
  $dockerVersion = docker --version
  Show-Message "✅ Docker е инсталиран: $dockerVersion" $colorSuccess
}
catch {
  $errorMsg = $_.Exception.Message
  # Избягваме директна интерполация с двоеточие
  Show-Message ("❌ Docker не е инсталиран или не е достъпен в PATH! " + $errorMsg) $colorError
  exit 1
}

# Проверка за Docker Compose
try {
  $dockerComposeVersion = docker-compose --version
  Show-Message "✅ Docker Compose е инсталиран: $dockerComposeVersion" $colorSuccess
}
catch {
  $errorMsg = $_.Exception.Message
  # Избягваме директна интерполация с двоеточие
  Show-Message ("❌ Docker Compose не е инсталиран или не е достъпен в PATH! " + $errorMsg) $colorError
  exit 1
}

# Проверка дали Docker работи
if (Test-DockerRunning) {
  Show-Message "✅ Docker работи" $colorSuccess
  # Проверка дали Docker е напълно готов
  Test-DockerReady | Out-Null
}
else {
  Show-Message "❌ Docker не работи. Опит за автоматично стартиране..." $colorWarning
  
  $dockerStarted = Start-DockerDesktop
  if (-not $dockerStarted) {
    Show-Message "❌ Не може да се стартира Docker. Моля, стартирайте Docker Desktop ръчно и опитайте отново." $colorError
    exit 1
  }
}

# Повторна проверка дали Docker работи след опит за стартиране
if (-not (Test-DockerRunning)) {
  Show-Message "❌ Docker все още не работи след опит за стартиране. Моля, проверете дали Docker работи правилно." $colorError
  exit 1
}

# Тестване на конфигурацията
Show-Message "Тестване на Docker Compose конфигурацията..." $colorInfo
if (-not (Invoke-DockerCommandSafely -Command "docker-compose config" -Description "Проверка на Docker Compose конфигурацията..." -MaxRetries 5)) {
  Show-Message "❌ Проблем с Docker Compose конфигурацията." $colorError
  exit 1
}
Show-Message "✅ Docker Compose конфигурацията е валидна" $colorSuccess

# Пълно почистване на Docker ресурси - без потвърждение
Show-Message "`nЗапочване на пълно почистване на всички Docker ресурси..." $colorWarning

# Спиране на всички контейнери от docker-compose
if (-not (Invoke-DockerCommandSafely -Command "docker-compose down -v" -Description "Стъпка 1: Спиране на контейнери от docker-compose..." -MaxRetries 8)) {
  Show-Message "❌ Проблем при спиране на контейнерите" $colorError
  exit 1
}
Show-Message "✅ Контейнерите от docker-compose са спрени и томовете са премахнати" $colorSuccess

# Експлицитно почистване на build cache
if (-not (Invoke-DockerCommandSafely -Command "docker builder prune --force" -Description "Стъпка 2: Експлицитно изтриване на Docker Build Cache..." -MaxRetries 5)) {
  Show-Message "❌ Проблем при изтриване на Build Cache" $colorError
  exit 1
}
Show-Message "✅ Build Cache е премахнат" $colorSuccess

# Пълно почистване на всички останали неизползвани ресурси
if (-not (Invoke-DockerCommandSafely -Command "docker system prune -a --volumes --force" -Description "Стъпка 3: Премахване на всички останали неизползвани Docker ресурси..." -MaxRetries 5)) {
  Show-Message "❌ Проблем при премахване на неизползваните ресурси" $colorError
  exit 1
}
Show-Message "✅ Всички неизползвани Docker ресурси са премахнати" $colorSuccess

# Тестване с нови контейнери
Show-Message "`nСтартиране на нови контейнери за тестване..." $colorInfo

# Функция за проверка на контейнерите
function Test-MainContainers {
  param (
    [int]$MaxWaitSeconds = 180,  # Увеличено от 150 на 180
    [int]$WaitInterval = 2
  )
  
  # Стартиране на контейнерите
  if (-not (Invoke-DockerCommandSafely -Command "docker-compose up -d" -Description "Стартиране на контейнерите..." -MaxRetries 5)) {
    Show-Message "❌ Проблем при стартиране на контейнерите" $colorError
    return $false
  }
  
  # Динамично изчакване с показване на прогрес
  Show-Message "Изчакване контейнерите да стартират..." $colorWarning
  
  $totalWaitTime = 0
  $allRunning = $false
  
  while ($totalWaitTime -lt $MaxWaitSeconds) {
    Show-Message "." $colorWarning -NoNewLine
    
    # Получаване статуса на всички контейнери
    try {
      $psOutput = docker-compose ps 2>&1
      if ($psOutput -match "error|cannot|failed") {
        Show-Message ("`n❌ Грешка при проверка на контейнерите - " + $psOutput) $colorError
        return $false
      }
      
      # Проверка за състояние на контейнерите
      $healthCheck = docker ps --format "{{.Names}} {{.Status}}" 2>&1
      if ($healthCheck -match "error|cannot|failed") {
        Show-Message ("`n❌ Грешка при проверка на статуса на контейнерите - " + $healthCheck) $colorError
        return $false
      }
      
      # Търсене на неактивни контейнери
      $unhealthyCount = 0
      $platformContainerCount = 0
      foreach ($line in $healthCheck -split "`n") {
        if ($line -match "learning-platform") {
          $platformContainerCount++
          # Проверява се само дали контейнерът е стартиран
          if (-not ($line -match "running|Up")) {
            $unhealthyCount++
            Show-Message "`nКонтейнер $($line -split ' ')[0] не е в състояние 'running'" $colorWarning
          }
        }
      }
      
      if ($unhealthyCount -eq 0 -and $platformContainerCount -gt 0) {
        $allRunning = $true
        break
      }
    }
    catch {
      $errorMsg = $_.Exception.Message
      Show-Message ("`n❌ Грешка при проверка на контейнерите - " + $errorMsg) $colorError
      return $false
    }
    
    Start-Sleep -Seconds $WaitInterval
    $totalWaitTime += $WaitInterval
  }
  
  Write-Host ""  # Нов ред след точките
  
  if ($allRunning) {
    Show-Message "✅ Всички контейнери са стартирани успешно" $colorSuccess
    
    # Показване на детайли за контейнерите
    Show-Message "`nДетайли за контейнерите:" $colorInfo
    try {
      $containerDetails = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Where-Object { $_ -like "*learning-platform*" }
      if (-not $containerDetails) {
        Show-Message "❌ Не може да се извлече информация за контейнерите." $colorError
        return $false
      }
      
      foreach ($line in $containerDetails) {
        Write-Host $line
      }
    }
    catch {
      $errorMsg = $_.Exception.Message
      Show-Message ("❌ Грешка при извличане на детайли за контейнерите - " + $errorMsg) $colorError
      return $false
    }
    
    # Тестване на базата данни
    Show-Message "`nТестване на PostgreSQL връзка..." $colorInfo
    $dbContainerName = "learning-platform-db"
    
    # Използваме функцията за безопасно изпълнение
    $pgSuccess = Invoke-DockerCommandSafely -Command "docker exec $dbContainerName pg_isready" -Description "Тестване на PostgreSQL..." -MaxRetries 5
    if ($pgSuccess) {
      Show-Message "✅ PostgreSQL работи правилно" $colorSuccess
    }
    else {
      Show-Message "❌ Проблем с PostgreSQL" $colorError
      return $false
    }
    
    # Тестване на Redis
    Show-Message "`nТестване на Redis команди..." $colorInfo
    $redisContainerName = "learning-platform-redis"
    
    # Използваме функцията за безопасно изпълнение
    $redisSuccess = Invoke-DockerCommandSafely -Command "docker exec $redisContainerName redis-cli ping" -Description "Тестване на Redis..." -MaxRetries 5
    if ($redisSuccess) {
      Show-Message "✅ Redis работи правилно" $colorSuccess
    }
    else {
      Show-Message "❌ Проблем с Redis" $colorError
      return $false
    }
    
    return $true
  }
  else {
    Show-Message "❌ Не всички контейнери са стартирани успешно в рамките на $MaxWaitSeconds секунди" $colorError
    
    # Показване на логовете, за да видим проблема
    Show-Message "`nЛогове от контейнерите:" $colorInfo
    try {
      $logOutput = docker-compose logs --tail=20 2>&1
      Write-Host $logOutput
    }
    catch {
      $errorMsg = $_.Exception.Message
      Show-Message ("❌ Грешка при извличане на логове - " + $errorMsg) $colorError
    }
    
    return $false
  }
}

# Главна логика за тестване
try {
  $success = Test-MainContainers
  
  if ($success) {
    Show-Message "`n✅ Всички тестове преминаха успешно!" $colorSuccess
    Show-Message "`nНовите контейнери са стартирани и работят правилно" $colorSuccess
    Show-Message "`nСега можете да продължите с разработка използвайки чиста Docker среда." $colorInfo
    exit 0
  }
  else {
    Show-Message "`n❌ Някои тестове не преминаха успешно." $colorError
    
    # Автоматично спиране на контейнерите при неуспех
    Show-Message "Спиране на неуспешните контейнери..." $colorInfo
    
    # Използваме функцията за безопасно изпълнение
    $downSuccess = Invoke-DockerCommandSafely -Command "docker-compose down" -Description "Спиране на контейнерите..." -MaxRetries 8
    if ($downSuccess) {
      Show-Message "✅ Контейнерите са спрени" $colorSuccess
    }
    else {
      Show-Message "❌ Не можаха да се спрат някои контейнери. Може да се наложи ръчно почистване." $colorWarning
    }
    
    Show-Message "`nМоля, проверете грешките и коригирайте конфигурацията преди да стартирате отново." $colorInfo
    exit 1
  }
}
catch {
  $errorMsg = $_.Exception.Message
  # Избягваме директна интерполация с двоеточие
  Show-Message ("❌ Неочаквана грешка при тестване на контейнерите - " + $errorMsg) $colorError
  Show-Message "Спиране на всички контейнери..." $colorInfo
  
  # Използваме функцията за безопасно изпълнение
  $downSuccess = Invoke-DockerCommandSafely -Command "docker-compose down" -Description "Спиране на контейнерите..." -MaxRetries 8
  if ($downSuccess) {
    Show-Message "✅ Контейнерите са спрени" $colorSuccess
  }
  else {
    Show-Message "❌ Не можаха да се спрат някои контейнери. Може да се наложи ръчно почистване." $colorWarning
  }
  
  exit 1
}