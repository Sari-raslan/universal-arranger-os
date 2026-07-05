from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT=Path(r"E:\keyboard-manager-clean")
APP=ROOT/'uaos-live-clean'
RUN=ROOT/'uaos-ai-factory'/'react-local-browser-walkthrough'
RESULTS=RUN/'validators'/'UAOS_LOCAL_BROWSER_WALKTHROUGH_RESULTS.json'
checks=[]
def add(name, passed, detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':detail})
run_info=RUN/'walkthrough'/'UAOS_LOCAL_APP_RUN_INFO.json'
walk_md=RUN/'walkthrough'/'UAOS_OWNER_BROWSER_WALKTHROUGH.md'
flow=RUN/'walkthrough'/'UAOS_UI_FLOW_CHECK_RESULTS.json'
add('build_pass',(APP/'dist'/'index.html').exists(),str(APP/'dist'/'index.html'))
add('local_run_info_exists',run_info.exists(),str(run_info))
add('owner_walkthrough_exists',walk_md.exists() and flow.exists(),str(walk_md))
text=''
for p in [walk_md, flow, RUN/'reports'/'UAOS_LOCAL_BROWSER_WALKTHROUGH_QA_REPORT.md', RUN/'dashboards'/'UAOS_LOCAL_BROWSER_WALKTHROUGH_DASHBOARD.html']:
    if p.exists(): text += '\n' + p.read_text(encoding='utf-8',errors='ignore')
required=['KORG Writer: BLOCKED','.STY/.SET: BLOCKED','USB: BLOCKED','PA3X Load: BLOCKED','Deploy: NOT RUN']
add('safety_gates_visible_in_report', all(s in text for s in required), ', '.join([s for s in required if s not in text]))
claim_hits=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_local_browser_walkthrough_validator.py','UAOS_LOCAL_BROWSER_WALKTHROUGH_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['PA3X-ready','KORG-compatible']:
        if re.search(re.escape(term),t,flags=re.IGNORECASE): claim_hits.append(f'{p}:{term}')
add('no_false_claims',not claim_hits,'; '.join(claim_hits))
unsafe=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_local_browser_walkthrough_validator.py','UAOS_LOCAL_BROWSER_WALKTHROUGH_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['vercel deploy','git push','USB write executed','PA3X load executed','payment processed','function writeKorg','class KorgWriter','KORG Writer implementation']:
        if term in t: unsafe.append(f'{p}:{term}')
add('no_deploy_push_writer_usb_pa3x_actions',not unsafe,'; '.join(unsafe))
bad_exts={'.sty','.set','.prs','.prf','.kst'}
bad=[str(p) for p in RUN.rglob('*') if p.is_file() and p.suffix.lower() in bad_exts]
add('no_blocked_korg_files_generated',not bad,'; '.join(bad))
if run_info.exists():
    data=json.loads(run_info.read_text(encoding='utf-8'))
    add('local_url_recorded',bool(data.get('localUrl')),data.get('localUrl',''))
else:
    add('local_url_recorded',False,'missing run info')
passed=all(c['passed'] for c in checks)
result={'validator':'uaos_local_browser_walkthrough_validator','generatedAt':datetime.now(timezone.utc).isoformat(),'result':'PASS' if passed else 'FAIL','checks':checks,'buildPass':'YES' if (APP/'dist'/'index.html').exists() else 'NO','deploy':'NO','push':'NO','korgWriter':'BLOCKED','stySetGenerated':'NO','usb':'NO','pa3x':'NO'}
RESULTS.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(result['result'])
if not passed:
    for c in checks:
        if not c['passed']: print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
