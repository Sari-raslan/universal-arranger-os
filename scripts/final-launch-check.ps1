Write-Host 'UAOS Final Launch Check'

git status
git log --oneline -5

Write-Host 'Website: https://aeplatform.app'
Write-Host 'PayPal: https://www.paypal.com/ncp/payment/ZB63CA66C98AN'
Write-Host 'Support: admin@aeplatform.app'

Start-Process 'https://aeplatform.app'
Start-Process 'https://www.paypal.com/ncp/payment/ZB63CA66C98AN'
Start-Process 'https://github.com/Sari-raslan/universal-arranger-os'
