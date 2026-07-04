@echo off
echo UAOS V32 Results Dashboard Builder
echo READ ONLY - NO USB - NO PA3X - NO DEPLOY - NO PAYMENT
echo.
pushd "%~dp0"
python uaos_v32_results_builder.py
popd
pause
