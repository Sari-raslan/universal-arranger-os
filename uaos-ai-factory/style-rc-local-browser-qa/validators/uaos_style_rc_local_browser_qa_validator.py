from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT=Path(r"E:\keyboard-manager-clean")
APP=ROOT/'uaos-live-clean'
RUN=ROOT/'uaos-ai-factory'/'style-rc-local-browser-qa'
RESULTS=RUN/'validators'/'UAOS_STYLE_RC_LOCAL_BROWSER_QA_RESULTS.json'
checks=[]
def add(name, passed, detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':detail})
run_info=RUN/'browser-qa'/'UAOS_STYLE_RC_LOCAL_APP_RUN_INFO.json'
qa_json=RUN/'browser-qa'/'UAOS_STYLE_RC_BROWSER_QA_RESULTS.json'
qa_md=RUN/'browser-qa'/'UAOS_STYLE_RC_BROWSER_QA_RESULTS.md'
flow_json=RUN/'browser-qa'/'UAOS_STYLE_RC_UI_FLOW_CHECK_RESULTS.json'
add('build_pass',(APP/'dist'/'index.html').exists(),str(APP/'dist'/'index.html'))
add('local_run_info_exists',run_info.exists(),str(run_info))
add('browser_qa_results_exist',qa_json.exists() and qa_md.exists(),str(qa_json))
add('style_rc_ui_flow_checked',flow_json.exists(),str(flow_json))
text=''
for p in [qa_md, qa_json, flow_json, RUN/'reports'/'UAOS_STYLE_RC_LOCAL_BROWSER_QA_REPORT.md', RUN/'dashboards'/'UAOS_STYLE_RC_LOCAL_BROWSER_QA_DASHBOARD.html']:
    if p.exists(): text += '\n' + p.read_text(encoding='utf-8',errors='ignore')
required=['KORG Writer: BLOCKED','.STY/.SET: BLOCKED','USB: BLOCKED','PA3X Load: BLOCKED','Deploy: NOT RUN']
add('safety_gates_visible_in_report',all(item in text for item in required),', '.join([item for item in required if item not in text]))
if qa_json.exists():
    data=json.loads(qa_json.read_text(encoding='utf-8'))
    flow=data.get('flowChecked',{})
    add('required_flow_pass',all(flow.get(item) is True for item in ['Style RC section/card','UAOS Style RC status','Section MIDI status','Full Style MIDI status','Style Package ZIP status','Style RC test center / local test action','Owner next action gate','Safety gates']))
else:
    add('required_flow_pass',False,'missing qa json')
claim_hits=[]
unsafe_hits=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_style_rc_local_browser_qa_validator.py','UAOS_STYLE_RC_LOCAL_BROWSER_QA_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['KORG-compatible','PA3X-ready']:
        if re.search(re.escape(term),t,flags=re.IGNORECASE): claim_hits.append(f'{p}:{term}')
    for term in ['vercel deploy','git push','USB write executed','PA3X load executed','payment processed','function writeKorg','class KorgWriter','KORG Writer implementation']:
        if term in t: unsafe_hits.append(f'{p}:{term}')
add('no_false_claims',not claim_hits,'; '.join(claim_hits))
add('no_deploy_push_writer_usb_pa3x_actions',not unsafe_hits,'; '.join(unsafe_hits))
bad_exts={'.sty','.set','.prs','.prf','.kst'}
bad=[str(p) for p in RUN.rglob('*') if p.is_file() and p.suffix.lower() in bad_exts]
add('no_blocked_keyboard_files_generated',not bad,'; '.join(bad))
passed=all(c['passed'] for c in checks)
result={'validator':'uaos_style_rc_local_browser_qa_validator','generatedAt':datetime.now(timezone.utc).isoformat(),'result':'PASS' if passed else 'FAIL','checks':checks,'buildPass':'YES' if (APP/'dist'/'index.html').exists() else 'NO','deploy':'NO','push':'NO','korgWriter':'BLOCKED','stySetGenerated':'NO','usb':'NO','pa3x':'NO'}
RESULTS.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(result['result'])
if not passed:
    for c in checks:
        if not c['passed']: print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
