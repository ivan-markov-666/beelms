@echo off
echo 🧪 Testing fixes...

echo.
echo Frontend timeout fix:
cd fe
call npx jest src/app/admin/settings/__tests__/infra-toggles.test.tsx --verbose --no-cache
echo Frontend exit code: %ERRORLEVEL%

echo.
echo Backend infraMonitoring fix:
cd ..\be
call npx jest test/public-settings-social-metadata-new.e2e-spec.ts --verbose --no-cache --detectOpenHandles
echo Backend exit code: %ERRORLEVEL%

echo.
echo ✅ Test verification complete!
pause
