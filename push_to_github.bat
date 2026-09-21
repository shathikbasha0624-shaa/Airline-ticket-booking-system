@echo off
title Push SkyWings Project to GitHub
echo ===================================================
echo Pushing SkyWings Airline Project to GitHub...
echo ===================================================

if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
) else (
    set "GIT_EXE=git"
)

"%GIT_EXE%" push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ===================================================
    echo SUCCESS! Your project is now uploaded to GitHub!
    echo View it here: https://github.com/shathikbasha0624-shaa/Airline-ticket-booking-system
    echo ===================================================
) else (
    echo.
    echo If GitHub asks to sign in, complete the login in your browser.
)
pause

