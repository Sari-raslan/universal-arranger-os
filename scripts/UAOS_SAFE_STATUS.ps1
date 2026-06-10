$Repo="C:\Users\ssare\Desktop\UAOS_ALL_AGENTS_FINAL_RUN\universal-arranger-os"
$Out="C:\Users\ssare\Desktop\UAOS_LIGHT_CHAT_LAUNCHER\UAOS_SAFE_STATUS.txt"
cd "$Repo"

@"
UAOS SAFE STATUS
================

TIME:
$(Get-Date)

BRANCH:
$(git branch --show-current)

GIT:
$(git status --short)

LAST COMMIT:
$(git log --oneline -1)

V1:
Build command: npm run build

V2:
Check: scripts\UAOS_V2_AUTO_CHECK.ps1

V3:
Check: scripts\UAOS_V3_CHECK.ps1

DEPLOY:
Disabled today.
