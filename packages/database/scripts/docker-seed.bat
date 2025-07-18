@echo off
:: LMS Database Seeding Docker Script for Windows
:: Usage: scripts\docker-seed.bat [environment] [command] [options]

setlocal enabledelayedexpansion

:: Default values
set ENV=%1
set COMMAND=%2
set OPTIONS=%3

if "%ENV%"=="" set ENV=dev
if "%COMMAND%"=="" set COMMAND=run

:: Colors for output (limited support in Windows)
set INFO=[INFO]
set SUCCESS=[SUCCESS]
set WARNING=[WARNING]
set ERROR=[ERROR]

:: Validate environment
if not "%ENV%"=="dev" if not "%ENV%"=="test" if not "%ENV%"=="prod" (
    echo %ERROR% Invalid environment: %ENV%. Must be one of: dev, test, prod
    exit /b 1
)

:: Validate command
if not "%COMMAND%"=="run" if not "%COMMAND%"=="demo" if not "%COMMAND%"=="status" if not "%COMMAND%"=="build" if not "%COMMAND%"=="up" if not "%COMMAND%"=="down" if not "%COMMAND%"=="logs" if not "%COMMAND%"=="clean" (
    echo %ERROR% Invalid command: %COMMAND%. Must be one of: run, demo, status, build, up, down, logs, clean
    exit /b 1
)

:: Set environment file
set ENV_FILE=.env.%ENV%

:: Check if environment file exists
if not exist "%ENV_FILE%" (
    echo %ERROR% Environment file %ENV_FILE% not found
    exit /b 1
)

echo %INFO% Using environment: %ENV%
echo %INFO% Using environment file: %ENV_FILE%

:: Docker Compose file
set COMPOSE_FILE=docker-compose.seeder.yml

if "%COMMAND%"=="build" (
    echo %INFO% Building Docker images...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" build
    echo %SUCCESS% Docker images built successfully
    goto :eof
)

if "%COMMAND%"=="up" (
    echo %INFO% Starting services...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" up -d postgres
    echo %INFO% Waiting for PostgreSQL to be ready...
    timeout /t 10 /nobreak > nul
    echo %SUCCESS% Services started successfully
    goto :eof
)

if "%COMMAND%"=="down" (
    echo %INFO% Stopping services...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" down
    echo %SUCCESS% Services stopped successfully
    goto :eof
)

if "%COMMAND%"=="run" (
    echo %INFO% Running database seeding...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" up -d postgres
    echo %INFO% Waiting for PostgreSQL to be ready...
    timeout /t 10 /nobreak > nul
    
    if not "%OPTIONS%"=="" (
        docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" run --rm db-seeder tsx src/cli/seed.ts run %OPTIONS%
    ) else (
        docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" run --rm db-seeder
    )
    
    echo %SUCCESS% Database seeding completed
    goto :eof
)

if "%COMMAND%"=="demo" (
    echo %INFO% Running seeding demonstration...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" up -d postgres
    echo %INFO% Waiting for PostgreSQL to be ready...
    timeout /t 10 /nobreak > nul
    
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" --profile demo run --rm db-seeder-demo
    echo %SUCCESS% Seeding demonstration completed
    goto :eof
)

if "%COMMAND%"=="status" (
    echo %INFO% Checking database status...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" up -d postgres
    echo %INFO% Waiting for PostgreSQL to be ready...
    timeout /t 10 /nobreak > nul
    
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" --profile status run --rm db-seeder-status
    goto :eof
)

if "%COMMAND%"=="logs" (
    echo %INFO% Showing logs...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" logs -f
    goto :eof
)

if "%COMMAND%"=="clean" (
    echo %INFO% Cleaning up...
    docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" down -v
    docker system prune -f
    echo %SUCCESS% Cleanup completed
    goto :eof
)

:eof
endlocal
