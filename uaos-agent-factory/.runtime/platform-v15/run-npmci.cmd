@echo off
setlocal
set LOG=C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v15\logs
if not exist "%LOG%" mkdir "%LOG%"
start "v15-lib-npmci" /MIN cmd /c "cd /d C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\library-factory-8a149267 && npm ci --ignore-scripts --no-audit --no-fund --prefer-offline > %LOG%\lib-npmci-stdout.log 2> %LOG%\lib-npmci-stderr.log && echo DONE> %LOG%\lib-npmci.done || echo FAIL> %LOG%\lib-npmci.fail"
start "v15-kbd-npmci" /MIN cmd /c "cd /d C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v15-execution\keyboard-pro-415db512 && npm ci --ignore-scripts --no-audit --no-fund --prefer-offline > %LOG%\kbd-npmci-stdout.log 2> %LOG%\kbd-npmci-stderr.log && echo DONE> %LOG%\kbd-npmci.done || echo FAIL> %LOG%\kbd-npmci.fail"
echo NPMCI_STARTED
endlocal
