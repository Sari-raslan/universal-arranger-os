UAOS Light Engine Quick Launchers

Copy these files to:
E:\keyboard-manager-clean\uaos-ai-factory\uaos-light-engine-v1\

Run from PowerShell:

powershell -NoExit -ExecutionPolicy Bypass -File ".\RUN_UAOS_PARTY_MODE.ps1"
powershell -NoExit -ExecutionPolicy Bypass -File ".\RUN_UAOS_ORIENTAL_LIVE.ps1"
powershell -NoExit -ExecutionPolicy Bypass -File ".\RUN_UAOS_CALM_MODE.ps1"
powershell -NoExit -ExecutionPolicy Bypass -File ".\RUN_UAOS_EMERGENCY_STOP.ps1"

Notes:
- Party/Oriental/Calm run continuously until Ctrl+C.
- After Ctrl+C, run Emergency Stop to reset all 18 lights to Warm White 30%.
- These launchers use the backend API that already passed your physical test.
