@echo off
setlocal
set "UAOS_ROOT=E:\keyboard-manager-clean"
set "UAOS_RUN=%UAOS_ROOT%\uaos-ai-factory\owner-test-setup-automation"
set "UAOS_APP=%UAOS_ROOT%\uaos-live-clean"
set "UAOS_HELPER=%UAOS_RUN%\01_setup\uaos_owner_test_setup.ps1"
echo UAOS Owner Test Setup - local only
echo No deploy. No push. No USB. No PA3X. KORG Writer blocked.
if not exist "%UAOS_HELPER%" (
  echo Missing setup helper: %UAOS_HELPER%
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%UAOS_HELPER%"
if errorlevel 1 (
  echo Setup helper reported a problem. Open the status file in 01_setup for details.
  exit /b 1
)
echo Owner test setup finished.
echo Local URL: http://127.0.0.1:4173/universal-arranger-os/
echo Dashboard: %UAOS_RUN%\02_owner_flow\UAOS_OWNER_TEST_FLOW_DASHBOARD.html
endlocal
