@echo off
setlocal
cd /d %~dp0
docker compose up --build -d
docker compose exec api npm run test:regression:local
endlocal
