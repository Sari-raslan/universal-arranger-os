# UAOS OWNER DESKTOP APP V13 REAL FUNCTION AUDIT
Timestamp: 20260624_175505

## Result
UAOS OWNER DESKTOP APP V13 REAL FUNCTION AUDIT PASS

## Scope
Audit only. No new features. No public writes. No commit. No push. No deploy. No payment. No release. No delete. No force push. No real KORG writer claim. No sale-ready claim. backend/*.db untouched. samples/uploads untouched.

## Summary
- Server: http://127.0.0.1:8788
- App: C:\Users\ssare\keyboard-manager-clean\owner-app\UAOS-Owner-Desktop-App\app\index.html
- App URL: http://127.0.0.1:8787/index.html
- Audit temp: C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505
- Fake/Broken Count: 0

## Feature Audit Table
| Feature | Button/API | Expected | Actual | PASS/FAIL | Evidence Path |
|---|---|---|---|---|---|
| App opens | http://127.0.0.1:8787/index.html | Static app responds on 127.0.0.1:8787 | App URL responded | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\UAOS-Owner-Desktop-App\app\index.html |
| Local server online | http://127.0.0.1:8788/api/state | Local action server responds on 127.0.0.1:8788 | Server responded | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\UAOS-Owner-Desktop-App\server\uaos-owner-local-server.js |
| State loads | GET /api/state | State endpoint returns ok and appStateLoaded true | State loaded | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-state.json |
| HTML buttons connected | index.html endpoints | All required endpoints are present in HTML and server | All required endpoints connected | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\html-endpoints.txt |
| Create Project real | POST /api/create-project | API succeeds and project folder/project JSON/manifest count increases | ok=True, projects +1, project_json +1, manifest +1 | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-create-project.json |
| Export MIDI real | POST /api/export-midi | API succeeds and MIDI count increases | ok=True, midi +1 | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-export-midi.json |
| Export ZIP real | POST /api/export-zip | API succeeds and ZIP count increases | ok=True, zip +1 | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-export-zip.json |
| Refresh State real | POST /api/refresh-state | API succeeds and state timestamp changes or state remains valid | ok=True, state_changed=True, timestamp_after=2026-06-24T17:55:13 | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-refresh-state.json |
| Run Workflow real | POST /api/run-workflow | API succeeds and workflow creates/exports real outputs | ok=True, projects +0, midi +0, zip +1 | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-run-workflow.json |
| Open Projects endpoint | POST /api/open-projects | Endpoint succeeds and target folder exists | ok=True, folder_exists=True | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-open-projects.json |
| Open Exports endpoint | POST /api/open-exports | Endpoint succeeds and target folder exists | ok=True, folder_exists=True | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-open-exports.json |
| Open MIDI endpoint | POST /api/open-midi | Endpoint succeeds and target folder exists | ok=True, folder_exists=True | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-open-midi.json |
| Open Logs endpoint | POST /api/open-logs | Endpoint succeeds and target folder exists | ok=True, folder_exists=True | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\api-api-open-logs.json |
| Latest Project valid | filesystem latest project | Latest project folder has valid project JSON, manifest JSON, project_id, sections, and tracks | folder=C:\Users\ssare\keyboard-manager-clean\owner-app\data\projects\UAOS_Owner_Demo_Project_20260624_175506, project_json=C:\Users\ssare\keyboard-manager-clean\owner-app\data\projects\UAOS_Owner_Demo_Project_20260624_175506\UAOS_Owner_Demo_Project_20260624_175506.project.json, manifest=C:\Users\ssare\keyboard-manager-clean\owner-app\data\projects\UAOS_Owner_Demo_Project_20260624_175506\UAOS_Owner_Demo_Project_20260624_175506.manifest.json, project_id=True, sections=True, tracks=True | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\projects\UAOS_Owner_Demo_Project_20260624_175506 |
| Latest MIDI valid | filesystem latest .mid | Latest MIDI exists, size > 0, contains MThd and MTrk | path=C:\Users\ssare\keyboard-manager-clean\owner-app\data\midi\UAOS_Owner_Demo_Project_20260624_175506.demo.mid, bytes=920, MThd=True, MTrk=True | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\midi\UAOS_Owner_Demo_Project_20260624_175506.demo.mid |
| Latest ZIP valid | filesystem latest .zip | Latest ZIP exists, expands inside owner-app audit-temp, contains project JSON, manifest JSON, MIDI, README or safety note | path=C:\Users\ssare\keyboard-manager-clean\owner-app\data\packs\UAOS_Owner_Demo_Project_20260624_175506-pack-20260624_175516.zip, bytes=5666, project_json=1, manifest=1, midi=1, readme=1, safety=1, expanded=C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505\zip-expanded | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\packs\UAOS_Owner_Demo_Project_20260624_175506-pack-20260624_175516.zip |
| Logs updated | owner-app data logs | Logs folder exists, log file exists, and line count increased after audit actions | logs_dir_exists=True, latest_log=C:\Users\ssare\keyboard-manager-clean\owner-app\data\logs\owner-app.log, initial_lines=29, final_lines=34 | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\logs\owner-app.log |
| Build gate | V13 audit build | Required app, server, launcher, state, and API are available | buildPass=True | PASS | C:\Users\ssare\keyboard-manager-clean\owner-app\data\audit-temp\v13-audit-20260624_175505 |

## Endpoint Connection Findings
```text
/api/state | html=True | server=True
/api/create-project | html=True | server=True
/api/export-midi | html=True | server=True
/api/export-zip | html=True | server=True
/api/run-workflow | html=True | server=True
/api/refresh-state | html=True | server=True
/api/open-projects | html=True | server=True
/api/open-exports | html=True | server=True
/api/open-midi | html=True | server=True
/api/open-logs | html=True | server=True
```

## API Action Diffs
```text
/api/create-project => HTTP_OK api_ok_true | projects +1, project_json +1, manifest +1, midi +0, zip +0, state_changed=True, log_lines +1
/api/export-midi => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +1, zip +0, state_changed=False, log_lines +1
/api/export-zip => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +0, zip +1, state_changed=False, log_lines +1
/api/refresh-state => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +0, zip +0, state_changed=True, log_lines +0
/api/run-workflow => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +0, zip +1, state_changed=True, log_lines +2
/api/open-projects => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +0, zip +0, state_changed=False, log_lines +0
/api/open-exports => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +0, zip +0, state_changed=False, log_lines +0
/api/open-midi => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +0, zip +0, state_changed=False, log_lines +0
/api/open-logs => HTTP_OK api_ok_true | projects +0, project_json +0, manifest +0, midi +0, zip +0, state_changed=False, log_lines +0
```

## FAKE_OR_BROKEN Findings
```text
None
```

## Final Test Results
- Project Test Result: PASS
- MIDI Test Result: PASS
- ZIP Test Result: PASS
- Workflow Test Result: PASS

## Build
BUILD: PASS
