@echo off
echo 🧪 Testing specific file with fixes...

cd be
call npx jest test/public-settings-social-metadata-new.e2e-spec.ts --config test/jest-e2e.json --verbose --no-cache
echo Exit code: %ERRORLEVEL%

echo.
echo ✅ Test complete!
pause
