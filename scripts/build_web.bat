@echo off
SET WORKSPACE=%~dp0..
SET BUILD_DIR=%WORKSPACE%\temp
if not exist %BUILD_DIR% mkdir %BUILD_DIR%
cd %BUILD_DIR%
echo "Building web..."
if not exist %BUILD_DIR%\neapu-record-web (
    git clone https://github.com/neapu/neapu-record-web.git
)
cd neapu-record-web
echo start npm installing
call yarn
echo start build
call yarn build
cd %WORKSPACE%
if not exist %WORKSPACE%\web mkdir %WORKSPACE%\web
xcopy /E /Y %BUILD_DIR%\neapu-record-web\dist %WORKSPACE%\web
echo "Web build completed."