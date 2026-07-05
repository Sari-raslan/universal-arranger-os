from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT=Path(r"E:\keyboard-manager-clean")
APP=ROOT/'uaos-live-clean'
RUN=ROOT/'uaos-ai-factory'/'git-push-only-release'
RESULTS=RUN/'validators'/'UAOS_GIT_PUSH_ONLY_RESULTS.json'
checks=[]
def add(name, passed, detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':detail})
status=RUN/'push-check'/'UAOS_PRE_PUSH_STATUS.json'
push_result=RUN/'push-check'/'UAOS_GIT_PUSH_RESULT.json'
add('owner_approval_push_only', status.exists() and json.loads(status.read_text(encoding='utf-8')).get('ownerApproval')=='Git Push only')
add('build_pass',(APP/'dist'/'index.html').exists())
if push_result.exists():
    data=json.loads(push_result.read_text(encoding='utf-8'))
    add('git_push_marked_for_execution', data.get('pushExecuted') in {'YES','YES_AFTER_REPORT_COMMIT'})
    add('deploy_executed_no', data.get('deployExecuted')=='NO')
    add('vercel_deploy_no', data.get('vercelDeployExecuted')=='NO')
    add('github_pages_deploy_command_no', data.get('githubPagesDeployCommandExecuted')=='NO')
    add('korg_writer_blocked', data.get('korgWriter')=='BLOCKED')
    add('sty_set_generated_no', data.get('stySetGenerated')=='NO')
    add('usb_no', data.get('usb')=='NO')
    add('pa3x_no', data.get('pa3x')=='NO')
else:
    for name in ['git_push_marked_for_execution','deploy_executed_no','vercel_deploy_no','github_pages_deploy_command_no','korg_writer_blocked','sty_set_generated_no','usb_no','pa3x_no']:
        add(name,False,'missing push result')
claim_hits=[]
unsafe=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_git_push_only_validator.py','UAOS_GIT_PUSH_ONLY_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['KORG-compatible','PA3X-ready']:
        if re.search(re.escape(term),t,flags=re.IGNORECASE): claim_hits.append(f'{p}:{term}')
    for term in ['deploy executed: YES','vercel deploy executed: YES','github pages deploy command executed: YES','USB write executed','PA3X load executed','function writeKorg','class KorgWriter','KORG Writer implementation']:
        if term.lower() in t.lower(): unsafe.append(f'{p}:{term}')
add('no_false_claims',not claim_hits,'; '.join(claim_hits))
add('no_deploy_writer_usb_pa3x_actions',not unsafe,'; '.join(unsafe))
bad_exts={'.sty','.set','.prs','.prf','.kst'}
bad=[str(p) for p in RUN.rglob('*') if p.is_file() and p.suffix.lower() in bad_exts]
add('no_blocked_keyboard_files_generated',not bad,'; '.join(bad))
passed=all(c['passed'] for c in checks)
result={'validator':'uaos_git_push_only_validator','generatedAt':datetime.now(timezone.utc).isoformat(),'result':'PASS' if passed else 'FAIL','checks':checks,'buildPass':'YES' if (APP/'dist'/'index.html').exists() else 'NO'}
RESULTS.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(result['result'])
if not passed:
    for c in checks:
        if not c['passed']: print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
