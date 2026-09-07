@echo off
cd /d "%~dp0app"
call npx expo start --web --port 8090 --clear
