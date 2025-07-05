@SETLOCAL
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\..\..\..\..\node-gyp@8.4.1\node_modules\node-gyp\bin\node-gyp.js" %*
) ELSE (
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\..\..\..\..\..\node-gyp@8.4.1\node_modules\node-gyp\bin\node-gyp.js" %*
)
