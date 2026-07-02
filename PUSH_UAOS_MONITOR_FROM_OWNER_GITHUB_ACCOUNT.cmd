@echo off
setlocal
cd /d "E:\keyboard-manager-clean\uaos-ai-factory\vercel-linked-monitor-repo-sync\run-20260702-120824\repo"
echo Current remote:
git remote -v
echo.
echo Current commit:
git rev-parse --short HEAD
echo.
where gh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo GitHub auth status:
  gh auth status
) else (
  echo GitHub CLI not found. Continuing with git push.
)
echo.
echo Pushing prepared UAOS Jobcenter monitor commit to main...
git push origin HEAD:main
echo.
pause
