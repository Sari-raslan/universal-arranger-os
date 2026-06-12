UAOS AUTO MULTI-AGENT ORCHESTRATION

Goal:
All AI tools cooperate without asking the user every small step.

Roles:
1. Cursor/Windsurf:
   - main code editing agent
   - implement features
   - modify files

2. Claude Code:
   - architecture review
   - refactor suggestions
   - detect design problems

3. VS Code/Copilot:
   - quick fixes
   - review changes
   - manual fallback

4. PowerShell:
   - build
   - test
   - deploy
   - write reports

Workflow loop:
1. Read current repo state.
2. Pick next safe task from roadmap.
3. Edit source code only.
4. Run:
   npm run build --prefix uaos-live-clean
5. Run checks:
   https://universal-arranger-os.vercel.app
   https://universal-arranger-os.vercel.app/api/status
6. If success:
   git add source files only
   git commit -m "UAOS auto agent progress"
   vercel --prod --yes
7. Write report:
   agent-output/UAOS_AUTO_AGENT_REPORT.md
8. Continue to next task.
9. Stop only if:
   - credentials needed
   - payment account needed
   - Apple/Xcode needed
   - device authorization needed
   - build is blocked

Do not commit:
desktop/dist/
mobile/android/app/build/
node_modules/
large binaries
logs
