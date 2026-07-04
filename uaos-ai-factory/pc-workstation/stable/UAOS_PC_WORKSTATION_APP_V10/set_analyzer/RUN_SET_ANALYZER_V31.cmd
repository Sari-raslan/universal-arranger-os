@echo off
setlocal
echo UAOS Owner SET Analyzer V31
echo READ ONLY - NO USB - NO PA3X - NO DEPLOY - NO PAYMENT
echo.
pushd "%~dp0"
python uaos_owner_set_scanner_v31.py
set "SCAN_RESULT=%ERRORLEVEL%"
popd
pushd "%~dp0..\dsp_planner"
python uaos_dsp_unification_planner_v31.py
set "DSP_RESULT=%ERRORLEVEL%"
popd
pushd "%~dp0..\replacement_engine"
python uaos_replacement_suggestion_engine_v31.py
set "REPL_RESULT=%ERRORLEVEL%"
popd
echo.
echo Analyzer finished. Review analysis_outputs folders.
echo Original input files were not modified.
pause
exit /b 0
