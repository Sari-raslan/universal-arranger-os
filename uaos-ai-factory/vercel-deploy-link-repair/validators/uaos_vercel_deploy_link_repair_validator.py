from pathlib import Path
import json, re
from datetime import datetime, timezone
ROOT=Path(r"E:\keyboard-manager-clean")
APP=ROOT/'uaos-live-clean'
RUN=ROOT/'uaos-ai-factory'/'vercel-deploy-link-repair'
RESULTS=RUN/'validators'/'UAOS_VERCEL_DEPLOY_LINK_REPAIR_RESULTS.json'
checks=[]
def add(name, passed, detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':detail})
inspection=RUN/'vercel-check'/'UAOS_VERCEL_CONFIG_INSPECTION.json'
link=RUN/'repair'/'UAOS_VERCEL_LINK_REPAIR_RESULT.json'
deploy=RUN/'repair'/'UAOS_VERCEL_DEPLOY_RETRY_RESULT.json'
public=RUN/'repair'/'UAOS_VERCEL_PUBLIC_URL_CHECK.json'
add('build_pass',(APP/'dist'/'index.html').exists())
if inspection.exists():
    data=json.loads(inspection.read_text(encoding='utf-8'))
    add('vercel_method_confirmed', bool(data.get('vercelJson')) and bool(data.get('vercelProjectJson')))
else:
    add('vercel_method_confirmed',False,'missing inspection')
if link.exists():
    l=json.loads(link.read_text(encoding='utf-8'))
    add('vercel_link_status_recorded', l.get('vercelLinkRepairStatus') in {'PASS','NEEDS_OWNER_VERCEL_LINK_ACTION'})
    needs_owner=l.get('vercelLinkRepairStatus')=='NEEDS_OWNER_VERCEL_LINK_ACTION'
else:
    add('vercel_link_status_recorded',False,'missing link result')
    needs_owner=False
add('deploy_retry_result_recorded', deploy.exists())
if public.exists():
    p=json.loads(public.read_text(encoding='utf-8'))
    add('public_url_or_owner_action_recorded', p.get('publicUrlAvailable')=='YES' or needs_owner)
else:
    add('public_url_or_owner_action_recorded',False,'missing public url check')
claim_hits=[]
unsafe=[]
for p in RUN.rglob('*'):
    if not p.is_file() or p.name in {'uaos_vercel_deploy_link_repair_validator.py','UAOS_VERCEL_DEPLOY_LINK_REPAIR_RESULTS.json'}: continue
    if p.suffix.lower() not in {'.md','.json','.html','.txt'}: continue
    t=p.read_text(encoding='utf-8',errors='ignore')
    for term in ['KORG-compatible','PA3X-ready']:
        if re.search(re.escape(term),t,flags=re.IGNORECASE): claim_hits.append(f'{p}:{term}')
    for term in ['USB write executed','PA3X load executed','payment activation: YES','function writeKorg','class KorgWriter','KORG Writer implementation']:
        if term.lower() in t.lower(): unsafe.append(f'{p}:{term}')
add('no_false_claims', not claim_hits, '; '.join(claim_hits))
add('no_blocked_actions', not unsafe, '; '.join(unsafe))
bad_exts={'.sty','.set','.prs','.prf','.kst'}
bad=[str(p) for p in RUN.rglob('*') if p.is_file() and p.suffix.lower() in bad_exts]
add('no_blocked_keyboard_files_generated', not bad, '; '.join(bad))
passed=all(c['passed'] for c in checks)
status='PASS' if passed else 'FAIL'
result={'validator':'uaos_vercel_deploy_link_repair_validator','generatedAt':datetime.now(timezone.utc).isoformat(),'result':status,'checks':checks,'overallStatus':'NEEDS_OWNER_ACTION' if needs_owner and passed else status,'buildPass':'YES' if (APP/'dist'/'index.html').exists() else 'NO'}
RESULTS.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(status)
if not passed:
    for c in checks:
        if not c['passed']: print(f"FAIL: {c['name']} {c['detail']}")
    raise SystemExit(1)
