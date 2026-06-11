cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Write-Host "Connect uaos.app to Vercel" -ForegroundColor Cyan

vercel domains add uaos.app
vercel domains add www.uaos.app

vercel alias https://keyboard-manager-clean-3ezkj43ic-sari-raslans-projects.vercel.app uaos.app
vercel alias https://keyboard-manager-clean-3ezkj43ic-sari-raslans-projects.vercel.app www.uaos.app

Start-Process "https://uaos.app"
Start-Process "https://www.uaos.app"
