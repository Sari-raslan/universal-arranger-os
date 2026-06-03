Write-Host 'UAOS Mobile Launch Agent'
Write-Host 'Checking mobile package...'

Test-Path mobile\pwa\manifest.json
Test-Path mobile\android\README.md
Test-Path mobile\ios\README.md
Test-Path mobile\store-assets\google-play\full-description.txt
Test-Path mobile\store-assets\app-store\app-description.txt
Test-Path mobile\legal\privacy-policy.md

Write-Host 'Opening mobile launch folders...'
Start-Process explorer.exe mobile
Start-Process notepad.exe reports\MOBILE_LAUNCH_STATUS.txt

Write-Host 'Opening store consoles...'
Start-Process 'https://play.google.com/console'
Start-Process 'https://appstoreconnect.apple.com'
