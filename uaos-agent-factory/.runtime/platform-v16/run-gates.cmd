@echo off
setlocal EnableExtensions
set LOG=C:\keyboard-manager-clean\uaos-agent-factory\.runtime\platform-v16\logs
if not exist "%LOG%" mkdir "%LOG%"
if not exist "D:\UAOS_AGENT_FACTORY_BUILD\tmp" (
  subst D: C:\UAOS_AGENT_FACTORY_BUILD >nul 2>&1
  mkdir "C:\UAOS_AGENT_FACTORY_BUILD\tmp" >nul 2>&1
  mkdir "D:\UAOS_AGENT_FACTORY_BUILD\tmp" >nul 2>&1
)

echo === LIBRARY ADOPTION REVIEW ===
cd /d C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v16-execution\library-adoption-review
call npm run check > "%LOG%\lib-check-stdout.log" 2> "%LOG%\lib-check-stderr.log"
echo LIB_CHECK=%ERRORLEVEL%> "%LOG%\lib-check.exit"
call npm run test:sampler > "%LOG%\lib-sampler-stdout.log" 2> "%LOG%\lib-sampler-stderr.log"
echo LIB_SAMPLER=%ERRORLEVEL%> "%LOG%\lib-sampler.exit"
call npm run test:library-validator > "%LOG%\lib-validator-stdout.log" 2> "%LOG%\lib-validator-stderr.log"
echo LIB_VALIDATOR=%ERRORLEVEL%> "%LOG%\lib-validator.exit"
call npm run test:preview-player > "%LOG%\lib-preview-stdout.log" 2> "%LOG%\lib-preview-stderr.log"
echo LIB_PREVIEW=%ERRORLEVEL%> "%LOG%\lib-preview.exit"
call npm run build:desktop > "%LOG%\lib-build-stdout.log" 2> "%LOG%\lib-build-stderr.log"
echo LIB_BUILD=%ERRORLEVEL%> "%LOG%\lib-build.exit"
echo LIB_DONE> "%LOG%\lib-gates.done"

echo === KEYBOARD ADOPTION REVIEW ===
cd /d C:\UAOS_AGENT_FACTORY_WORKTREES\platform-v16-execution\keyboard-adoption-review
call npm run test:arranger-foundation > "%LOG%\kbd-foundation-stdout.log" 2> "%LOG%\kbd-foundation-stderr.log"
echo KBD_FOUNDATION=%ERRORLEVEL%> "%LOG%\kbd-foundation.exit"
call npm run check > "%LOG%\kbd-check-stdout.log" 2> "%LOG%\kbd-check-stderr.log"
echo KBD_CHECK=%ERRORLEVEL%> "%LOG%\kbd-check.exit"
call npm run test:arranger-magic-set > "%LOG%\kbd-magic-stdout.log" 2> "%LOG%\kbd-magic-stderr.log"
echo KBD_MAGIC=%ERRORLEVEL%> "%LOG%\kbd-magic.exit"
call npm run test:arranger-set-doctor > "%LOG%\kbd-doctor-stdout.log" 2> "%LOG%\kbd-doctor-stderr.log"
echo KBD_DOCTOR=%ERRORLEVEL%> "%LOG%\kbd-doctor.exit"
call npm run test:arranger-safe-export > "%LOG%\kbd-export-stdout.log" 2> "%LOG%\kbd-export-stderr.log"
echo KBD_EXPORT=%ERRORLEVEL%> "%LOG%\kbd-export.exit"
call npm run build:desktop > "%LOG%\kbd-build-stdout.log" 2> "%LOG%\kbd-build-stderr.log"
echo KBD_BUILD=%ERRORLEVEL%> "%LOG%\kbd-build.exit"
echo KBD_DONE> "%LOG%\kbd-gates.done"
echo ALL_DONE
endlocal
