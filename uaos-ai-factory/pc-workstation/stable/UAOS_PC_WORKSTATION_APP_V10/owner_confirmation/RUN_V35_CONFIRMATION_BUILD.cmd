@echo off
echo UAOS V35 Owner Confirmation Builder
echo READ ONLY - NO USB - NO PA3X - NO DEPLOY - NO PAYMENT
echo.
pushd "%~dp0"
python uaos_v35_confirmation_builder.py
popd
pause
