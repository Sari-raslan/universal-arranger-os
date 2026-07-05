from pathlib import Path
import json, re, subprocess
from datetime import datetime, timezone
ROOT=Path(r"E:\keyboard-manager-clean")
APP=ROOT/'uaos-live-clean'
RUN=ROOT/'uaos-ai-factory'/'vercel-deploy-retry-linked'
RESULTS=RUN/'validators'/'UAOS_VERCEL_DEPLOY_RETRY_LINKED_RESULTS.json'
checks=[]
def add(name, passed, detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':detail})
link=RUN/'deploy-retry'/'UAOS_VERCEL_LINK_STATUS.json'
retry=RUN/'deploy-retry'/'UAOS_VERCEL_DEPLOY_RETRY_RESULT.json'
public=RUN/'deploy-retry'/'UAOS_VERCEL_PUBLIC_URL_CHECK.json'
add('linked_project_confirmed', link.exists() and json.loads(link.read_text(encoding='utf-8')).get('linkedProjectConfirmed') is True)
add('build_pass',(APP/'dist'/'index.html').exists())
if retry.exists():
    data=json.loads(retry.read_text(encoding='utf-8'))
    add('deploy_retry_executed', data.get('deployRetryExecuted')=='YES')
    add('app_jsx_unchanged_in_this_run', data.get('appJsxChangedInThisRun')=='NO')
    add('no_payment_activation', data.get('paymentActivation')=='NO')
    add('korg_writer_blocked', data.get('korgWriter')=='BLOCKED')
    add('sty_set_generated_no', data.get('stySetGenerated')=='NO')
    add('prs_prf_kst_generated_no', data.get('prsPrfKstGenerated')=='NO')
    add('usb_no', data.get('usb')=='NO')
    add('pa3x_no', data.get('pa3x')=='NO')
else:
    for name in ['deploy_retry_executed','app_jsx_unchanged_in_this_run','no_payment_activation','korg_writer_blocked','sty_set_generated_no','prs_prf_kst_generated_no','usb_no','pa3x_no']:
        add(name,False,'missing retry result')
if public.exists():
    pdata=json.loads(public.read_text(encoding='utf-8'))
    add('public_url_status_recorded', pdata.get('publicUrlRecorded') is True)
else:
    add('public_url_status_recorded',False,'missing public check')
app_diff=subprocess.check_output(['git','-C',str(ROOT),'diff','--name-only','--','uaos-live-clean/src/App.jsx'],text=True).strip()
add('app_jsx_has_no_git_diff', app_diff=='', app_diff)
claim_hits=[]
unsafe=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_vercel_deploy_retry_linked_validator.py','UAOS_VERCEL_DEPLOY_RETRY_LINKED_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['KORG-compatible','PA3X-ready']:
        if re.search(re.escape(term),t,flags=re.IGNORECASE): claim_hits.append(f'{p}:{term}')
    for term in ['product rewrite: YES','USB write executed','PA3X load executed','payment activation: YES','function writeKorg','class KorgWriter','KORG Writer implementation']:
        if term.lower() in t.lower(): unsafe.append(f'{p}:{term}')
add('no_false_claims', not claim_hits, '; '.join(claim_hits))
add('no_blocked_actions_or_product_rewrite', not unsafe, '; '.join(unsafe))
bad_exts={'.sty','.set','.prs','.prf','.kst'}
bad=[str(p) for p in RUN.rglob('*') if p.is_file() and p.suffix.lower() in bad_exts]
add('no_blocked_keyboard_files_generated', not bad, '; '.join(bad))
passed=all(c['passed'] for c in checks)
result={'validator':'uaos_vercel_deploy_retry_linked_validator','generatedAt':datetime.now(timezone.utc).isoformat(),'result':'PASS' if passed else 'FAIL','checks':checks,'buildPass':'YES' if (APP/'dist'/'index.html').exists() else 'NO','deployStatus':json.loads(retry.read_text(encoding='utf-8')).get('deployStatus') if retry.exists() else 'UNKNOWN'}
RESULTS.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(result['result'])
if not passed:
    for c in checks:
        if not c['passed']: print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
