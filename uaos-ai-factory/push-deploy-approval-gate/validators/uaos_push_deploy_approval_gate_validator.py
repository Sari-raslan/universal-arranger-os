from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT=Path(r"E:\keyboard-manager-clean")
APP=ROOT/'uaos-live-clean'
RUN=ROOT/'uaos-ai-factory'/'push-deploy-approval-gate'
RESULTS=RUN/'validators'/'UAOS_PUSH_DEPLOY_APPROVAL_GATE_RESULTS.json'
checks=[]
def add(name, passed, detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':detail})
add('build_pass',(APP/'dist'/'index.html').exists(),str(APP/'dist'/'index.html'))
approval=RUN/'approval-gate'/'UAOS_PUSH_DEPLOY_APPROVAL_GATE.json'
add('approval_gate_exists',approval.exists(),str(approval))
plans=[RUN/'deploy-plan'/'UAOS_GIT_PUSH_PLAN.md',RUN/'deploy-plan'/'UAOS_VERCEL_DEPLOY_PLAN.md',RUN/'deploy-plan'/'UAOS_GITHUB_PAGES_DEPLOY_PLAN.md',RUN/'deploy-plan'/'UAOS_DEPLOY_ROLLBACK_PLAN.md']
add('deploy_plans_exist',all(p.exists() for p in plans),'; '.join(str(p) for p in plans if not p.exists()))
checklist=RUN/'release-checklist'/'UAOS_RELEASE_READINESS_CHECKLIST.json'
add('release_checklist_exists',checklist.exists(),str(checklist))
if approval.exists():
    data=json.loads(approval.read_text(encoding='utf-8'))
    add('no_push_executed',data.get('pushExecuted') is False)
    add('no_deploy_executed',data.get('deployExecuted') is False)
    add('no_option_auto_applied',data.get('autoApply') is False)
else:
    add('no_push_executed',False,'missing approval gate')
    add('no_deploy_executed',False,'missing approval gate')
    add('no_option_auto_applied',False,'missing approval gate')
claim_hits=[]
unsafe_hits=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_push_deploy_approval_gate_validator.py','UAOS_PUSH_DEPLOY_APPROVAL_GATE_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['KORG-compatible','PA3X-ready']:
        if re.search(re.escape(term),t,flags=re.IGNORECASE): claim_hits.append(f'{p}:{term}')
    for term in ['push executed: YES','deploy executed: YES','actual git push completed','actual Vercel deploy completed','actual GitHub Pages deploy completed','USB write executed','PA3X load executed','payment processed','function writeKorg','class KorgWriter','KORG Writer implementation']:
        if term.lower() in t.lower(): unsafe_hits.append(f'{p}:{term}')
add('no_false_claims',not claim_hits,'; '.join(claim_hits))
add('no_push_deploy_writer_usb_pa3x_actions',not unsafe_hits,'; '.join(unsafe_hits))
bad_exts={'.sty','.set','.prs','.prf','.kst'}
bad=[str(p) for p in RUN.rglob('*') if p.is_file() and p.suffix.lower() in bad_exts]
add('no_blocked_keyboard_files_generated',not bad,'; '.join(bad))
passed=all(c['passed'] for c in checks)
result={'validator':'uaos_push_deploy_approval_gate_validator','generatedAt':datetime.now(timezone.utc).isoformat(),'result':'PASS' if passed else 'FAIL','checks':checks,'buildPass':'YES' if (APP/'dist'/'index.html').exists() else 'NO','pushExecuted':'NO','deployExecuted':'NO','korgWriter':'BLOCKED','stySetGenerated':'NO','usb':'NO','pa3x':'NO'}
RESULTS.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(result['result'])
if not passed:
    for c in checks:
        if not c['passed']: print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
