from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT=Path(r"E:\keyboard-manager-clean")
APP=ROOT/'uaos-live-clean'
RUN=ROOT/'uaos-ai-factory'/'deploy-only-release'
RESULTS=RUN/'validators'/'UAOS_DEPLOY_ONLY_RESULTS.json'
checks=[]
def add(name, passed, detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':detail})
pre=RUN/'deploy-check'/'UAOS_PRE_DEPLOY_STATUS.json'
execp=RUN/'deploy-check'/'UAOS_DEPLOY_EXECUTION_RESULT.json'
public=RUN/'deploy-check'/'UAOS_PUBLIC_URL_CHECK.json'
add('owner_approval_deploy_only', pre.exists() and json.loads(pre.read_text(encoding='utf-8')).get('deployApprovedOnly') is True)
add('build_pass',(APP/'dist'/'index.html').exists())
if execp.exists():
    data=json.loads(execp.read_text(encoding='utf-8'))
    add('deploy_method_detected', data.get('deployMethod')=='Vercel')
    add('configured_method_only', data.get('deployCommand')=='vercel deploy --prod --yes')
    add('deploy_result_recorded', data.get('deployStatus') in {'FAILED_PROJECT_SETTINGS','SUCCESS'})
    add('korg_writer_blocked', data.get('korgWriter')=='BLOCKED')
    add('sty_set_generated_no', data.get('stySetGenerated')=='NO')
    add('prs_prf_kst_generated_no', data.get('prsPrfKstGenerated')=='NO')
    add('usb_no', data.get('usb')=='NO')
    add('pa3x_no', data.get('pa3x')=='NO')
    add('payment_activation_no', data.get('paymentActivation')=='NO')
else:
    for name in ['deploy_method_detected','configured_method_only','deploy_result_recorded','korg_writer_blocked','sty_set_generated_no','prs_prf_kst_generated_no','usb_no','pa3x_no','payment_activation_no']:
        add(name,False,'missing execution result')
add('public_or_failure_recorded', public.exists())
if pre.exists():
    pdata=json.loads(pre.read_text(encoding='utf-8'))
    add('git_push_already_done_before_deploy', pdata.get('pushedCommitPresent') is True)
else:
    add('git_push_already_done_before_deploy',False,'missing pre status')
claim_hits=[]
unsafe=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_deploy_only_validator.py','UAOS_DEPLOY_ONLY_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['KORG-compatible','PA3X-ready']:
        if re.search(re.escape(term),t,flags=re.IGNORECASE): claim_hits.append(f'{p}:{term}')
    for term in ['USB write executed','PA3X load executed','payment activation: YES','function writeKorg','class KorgWriter','KORG Writer implementation','GitHub Pages deploy command executed: YES']:
        if term.lower() in t.lower(): unsafe.append(f'{p}:{term}')
add('no_false_claims',not claim_hits,'; '.join(claim_hits))
add('no_blocked_actions',not unsafe,'; '.join(unsafe))
bad_exts={'.sty','.set','.prs','.prf','.kst'}
bad=[str(p) for p in RUN.rglob('*') if p.is_file() and p.suffix.lower() in bad_exts]
add('no_blocked_keyboard_files_generated',not bad,'; '.join(bad))
passed=all(c['passed'] for c in checks)
status='PASS' if passed else 'FAIL'
result={'validator':'uaos_deploy_only_validator','generatedAt':datetime.now(timezone.utc).isoformat(),'result':status,'checks':checks,'buildPass':'YES' if (APP/'dist'/'index.html').exists() else 'NO'}
RESULTS.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(status)
if not passed:
    for c in checks:
        if not c['passed']: print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
