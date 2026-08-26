@echo off
setlocal
title UAOS Program Tree Verify
cd /d C:\keyboard-manager-clean
echo Verifying program tree materialization...
node "C:\keyboard-manager-clean\uaos-program-tree\scripts\generate-program-tree.mjs"
if errorlevel 1 exit /b 1
node -e "const fs=require('fs');const p='C:/keyboard-manager-clean/uaos-program-tree';const req=['PORTFOLIO.json','EPICS.json','TASKS.json','DEPENDENCIES.json','COMMANDER-ADAPTER-CONTRACT.json'];for(const f of req){if(!fs.existsSync(p+'/'+f)){console.error('MISSING',f);process.exit(2)}}const t=JSON.parse(fs.readFileSync(p+'/TASKS.json','utf8'));const d=JSON.parse(fs.readFileSync(p+'/DEPENDENCIES.json','utf8'));console.log(JSON.stringify({ok:true,tasks:t.tasks.length,ready:t.tasks.filter(x=>x.state==='READY').length,cycles:d.cycleCount},null,2));"
echo VERIFY_DONE
pause
endlocal
