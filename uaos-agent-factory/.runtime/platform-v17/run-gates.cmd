@echo off
setlocal
set LOG=C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v17\logs
if not exist "D:\UAOS_AGENT_FACTORY_BUILD\tmp" (
  subst D: C:\UAOS_AGENT_FACTORY_BUILD >nul 2>&1
  mkdir "C:\UAOS_AGENT_FACTORY_BUILD\tmp" >nul 2>&1
  mkdir "D:\UAOS_AGENT_FACTORY_BUILD\tmp" >nul 2>&1
)
:waitlib
if not exist "%LOG%\lib-npmci.done" if not exist "%LOG%\lib-npmci.fail" (timeout /t 2 /nobreak >nul & goto waitlib)
:waitkbd
if not exist "%LOG%\kbd-npmci.done" if not exist "%LOG%\kbd-npmci.fail" (timeout /t 2 /nobreak >nul & goto waitkbd)

cd /d C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v17-execution\library-gap-closure
call npm run check > "%LOG%\lib-check-stdout.log" 2> "%LOG%\lib-check-stderr.log"
call node packages\uaos-v17-library-gap-closure\gap.test.cjs > "%LOG%\lib-gap-stdout.log" 2> "%LOG%\lib-gap-stderr.log"
echo LIB_GAP=%ERRORLEVEL%> "%LOG%\lib-gap.exit"
call npm run test:sampler > "%LOG%\lib-sampler-stdout.log" 2> "%LOG%\lib-sampler-stderr.log"
call npm run build:desktop > "%LOG%\lib-build-stdout.log" 2> "%LOG%\lib-build-stderr.log"
echo LIB_DONE> "%LOG%\lib-gates.done"

cd /d C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v17-execution\keyboard-gap-closure
call npm run test:arranger-foundation > "%LOG%\kbd-foundation-stdout.log" 2> "%LOG%\kbd-foundation-stderr.log"
call node packages\uaos-v17-keyboard-gap-closure\gap.test.cjs > "%LOG%\kbd-gap-stdout.log" 2> "%LOG%\kbd-gap-stderr.log"
echo KBD_GAP=%ERRORLEVEL%> "%LOG%\kbd-gap.exit"
call npm run check > "%LOG%\kbd-check-stdout.log" 2> "%LOG%\kbd-check-stderr.log"
call npm run build:desktop > "%LOG%\kbd-build-stdout.log" 2> "%LOG%\kbd-build-stderr.log"
echo KBD_DONE> "%LOG%\kbd-gates.done"
echo ALL_DONE
endlocal
