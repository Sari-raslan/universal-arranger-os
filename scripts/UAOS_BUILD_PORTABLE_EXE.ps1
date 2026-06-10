
cd "C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"

npm install --prefix electron-app
npm run pack --prefix electron-app

Start-Process "electron-app\dist"
