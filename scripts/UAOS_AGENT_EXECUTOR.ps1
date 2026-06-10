cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

Remove-Item "frontend\postcss.config.*" -Force -ErrorAction SilentlyContinue
Remove-Item "postcss.config.*" -Force -ErrorAction SilentlyContinue

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

npm install --prefix backend
npm install --prefix frontend

npm run build --prefix frontend

Start-Process powershell -ArgumentList '-NoExit','-Command','cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"; node backend/server.js'

Start-Sleep 5

node backend/health-check.js

vercel --prod --yes

git add .
git commit -m "UAOS final automated launcher"
git push origin master
