@echo off
echo ========================================================
echo Running MandiMitra AI Test Suite...
echo ========================================================
cd /d %~dp0backend
python -m tests.test_platform
pause
