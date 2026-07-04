@echo off
echo UAOS PC Workstation - Open All Results
echo PC ONLY - NO USB - NO PA3X
echo.
if exist "%~dp0" explorer "%~dp0"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V30.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V30.html"
if exist "%~dp0UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html" start "" "%~dp0UAOS_PC_WORKSTATION_OWNER_BETA_HOME_V27.html"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V31_SET_ANALYZER.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V31_SET_ANALYZER.html"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V32_RESULTS_DASHBOARD.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V32_RESULTS_DASHBOARD.html"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V33_DEEP_ANALYZER.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V33_DEEP_ANALYZER.html"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V34_OWNER_DECISION_PACK.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V34_OWNER_DECISION_PACK.html"
if exist "%~dp0UAOS_PC_WORKSTATION_APP_V35_OWNER_CONFIRMATION.html" start "" "%~dp0UAOS_PC_WORKSTATION_APP_V35_OWNER_CONFIRMATION.html"
if exist "%~dp0owner_set_input" explorer "%~dp0owner_set_input"
if exist "%~dp0set_analyzer\analysis_outputs" explorer "%~dp0set_analyzer\analysis_outputs"
if exist "%~dp0dsp_planner\analysis_outputs" explorer "%~dp0dsp_planner\analysis_outputs"
if exist "%~dp0replacement_engine\analysis_outputs" explorer "%~dp0replacement_engine\analysis_outputs"
if exist "%~dp0results_dashboard\analysis_outputs" explorer "%~dp0results_dashboard\analysis_outputs"
if exist "%~dp0deep_analyzer\analysis_outputs" explorer "%~dp0deep_analyzer\analysis_outputs"
if exist "%~dp0decision_pack\analysis_outputs" explorer "%~dp0decision_pack\analysis_outputs"
if exist "%~dp0owner_confirmation\analysis_outputs" explorer "%~dp0owner_confirmation\analysis_outputs"
if exist "%~dp0writer\generated_v17_outputs" explorer "%~dp0writer\generated_v17_outputs"
if exist "%~dp0midi" explorer "%~dp0midi"
if exist "%~dp0electron\dist-local\win-unpacked" explorer "%~dp0electron\dist-local\win-unpacked"
pause
