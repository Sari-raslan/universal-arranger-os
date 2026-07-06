$ErrorActionPreference = "Stop"
$Root = "E:\keyboard-manager-clean"
$App = "E:\keyboard-manager-clean\uaos-live-clean"
$Dashboard = "E:\keyboard-manager-clean\uaos-ai-factory\final-owner-setup-v3-v381-v400\dashboards\UAOS_FINAL_OWNER_SETUP_V3_OWNER_DASHBOARD.html"
$DecisionCenter = "E:\keyboard-manager-clean\uaos-ai-factory\final-owner-setup-v3-v381-v400\v390_owner_decision_center\UAOS_V390_OWNER_DECISION_CENTER.html"
Write-Host "UAOS Final Owner Setup V3"
Write-Host "Safety: local only; no deploy; no push; no USB; no PA3X; no keyboard package creation."
Push-Location $App
npm run build
$Preview = Start-Process -FilePath "npm" -ArgumentList "run","preview","--","--host","127.0.0.1","--port","5180" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3
Pop-Location
Start-Process $Dashboard
Start-Process "http://127.0.0.1:5180/universal-arranger-os/"
Start-Process $DecisionCenter
Write-Host "Opened dashboard, local app URL, and decision center."
Write-Host "Preview process id: $($Preview.Id)"
