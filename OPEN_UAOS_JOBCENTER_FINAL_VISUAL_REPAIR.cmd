@echo off
set PDF=E:\keyboard-manager-clean\uaos-ai-factory\jobcenter-final-visual-repair\UAOS_JOBCENTER_FINAL_VISUAL_REPAIR_2026-07-02_DE.pdf
set PPT=E:\keyboard-manager-clean\uaos-ai-factory\jobcenter-final-visual-repair\UAOS_JOBCENTER_FINAL_VISUAL_REPAIR_2026-07-02_DE.pptx
set PREVIEW=E:\keyboard-manager-clean\uaos-ai-factory\jobcenter-final-visual-repair\monitor-preview\jobcenter.html
set FOLDER=E:\keyboard-manager-clean\uaos-ai-factory\jobcenter-final-visual-repair
start "" "%PDF%"
timeout /t 1 /nobreak >nul
start "" "%PPT%"
timeout /t 1 /nobreak >nul
start "" "%PREVIEW%"
timeout /t 1 /nobreak >nul
start "" "%FOLDER%"
