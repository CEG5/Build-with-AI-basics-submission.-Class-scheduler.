@echo off
rem Opens Class Blocks in two separate Chrome windows (rep + student) for the demo.
start "" chrome --new-window "%~dp0index.html"
timeout /t 2 /nobreak >nul
start "" chrome --new-window "%~dp0index.html"
