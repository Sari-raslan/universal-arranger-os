@echo off
echo UAOS V34 Owner Decision Pack
echo READ ONLY - NO USB - NO PA3X - NO DEPLOY - NO PAYMENT
echo.
pushd "%~dp0"
python uaos_v34_owner_decision_builder.py
popd
pause
